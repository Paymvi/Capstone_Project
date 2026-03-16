require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const authMiddleware = require("./middleware/authMiddleware");
const requireAdmin = require("./middleware/adminMiddleware");
const bcrypt = require("bcrypt");


const app = express();
app.use(cors());
app.use(express.json());


app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// This file is your "database"
const DB_PATH = path.join(__dirname, "db.json");

// ---------- helper functions ----------
function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { nextUserId: 1, users: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

// ---------- routes ----------

// LOGIN (create or get user)
// body: { username: "quark" }
// returns: { id, username }
app.post("/login", (req, res) => {
  const { username } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ message: "Username required" });
  }

  const clean = username.trim().toLowerCase();
  const db = readDB();

  let user = db.users.find((u) => u.username === clean);

  if (!user) {
    user = {
        id: db.nextUserId++,
        username: clean,
        markers: [],
        collectedItems: [],
        equipped: {
            hat: null,
            body: null,
            outside: null,
        },
    };
    db.users.push(user);
    writeDB(db);
  }

  res.json({
    id: user.id,
    username: user.username,
    markers: user.markers,
    collectedItems: user.collectedItems || [],
    equipped: user.equipped,
  });
  

});

// GET USER STATE
// GET /state/1
// returns: { markers: [...], equipped: {...} }
app.get("/state/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const db = readDB();
  const user = db.users.find((u) => u.id === userId);

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({
    id: user.id,
    username: user.username,
    markers: user.markers,
    collectedItems: user.collectedItems || [],
    equipped: user.equipped,
  });

});

// ADD MARKER
// body: { userId: 1, latitude: 40.1, longitude: -73.9 }
// app.post("/markers", (req, res) => {
//   const { userId, latitude, longitude } = req.body;
//   const db = readDB();
//   const user = db.users.find((u) => u.id === Number(userId));

//   if (!user) return res.status(404).json({ message: "User not found" });

//   const marker = {
//     id: Date.now(), // simple unique id for demo
//     latitude: Number(latitude),
//     longitude: Number(longitude),
//   };

//   user.markers.push(marker);
//   writeDB(db);

//   res.json(marker);
// });

// UPDATE EQUIPPED
// body: { userId: 1, hat: "hat_crown", body: null, outside: "shield" }
// app.put("/equip", (req, res) => {
//   const { userId, hat, body, outside } = req.body;
//   const db = readDB();
//   const user = db.users.find((u) => u.id === Number(userId));

//   if (!user) return res.status(404).json({ message: "User not found" });

//   user.equipped = {
//     hat: hat ?? null,
//     body: body ?? null,
//     outside: outside ?? null,
//   };

//   writeDB(db);
//   res.json({ message: "Equipped updated", equipped: user.equipped });
// });

// (Optional) CLEAR MARKERS for demo reset
// body: { userId: 1 }
app.post("/markers/clear", (req, res) => {
  const { userId } = req.body;
  const db = readDB();
  const user = db.users.find((u) => u.id === Number(userId));
  if (!user) return res.status(404).json({ message: "User not found" });

  user.markers = [];
  writeDB(db);
  res.json({ message: "Markers cleared" });
});

// UPDATE COLLECTED ITEMS
// body: { userId: 1, collectedItems: ["hat_crown"] }
app.put("/collected", (req, res) => {
  const { userId, collectedItems } = req.body;

  const db = readDB();
  const user = db.users.find((u) => u.id === Number(userId));

  if (!user) return res.status(404).json({ message: "User not found" });

  user.collectedItems = collectedItems || [];

  writeDB(db);

  res.json({ message: "Collected items updated" });
});

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const pool = require("./db");

// Google Auth created routes
const {OAuth2Client} = require("google-auth-library");
const jwt = require("jsonwebtoken");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Roamie is running on port 3000 🔥");
});

// Creates a new user account 
app.post("/users", async(req, res) => {
    const {email, name} = req.body;

    try{
        const result = await pool.query(
            "INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *",
            [email, name]
        );

        res.status(201).json(result.rows[0]);
    }
    catch(err){
        console.error(err);

        if (err.code === "23505") {
            return res.status(409).json({
                error: "Username already exists!"
            });
        }

        res.status(500).json({ error: err.message });
    }
})

// Fetch all users in the database
app.get("/users", async(req, res) => {
    try{
        const result = await pool.query("SELECT * FROM users ORDER BY id");
        res.json(result.rows);
    }
    catch(err){
        console.error(err);
        res.status(500).json({error: err.message});
    }
})

// Google Auth Route 
app.post("/auth/google", async(req, res) => {
    const {token} = req.body;

    console.log("=== AUTH REQUEST RECEIVED ===");
    console.log("Token:", token);
    console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);

    try{
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const {sub, email, name} = payload;

        console.log("Incoming token:", token);
        console.log("Payload:", payload);

        // Check if a user exists
        let result = await pool.query(
            "SELECT * FROM users WHERE google_sub = $1",
            [sub]
        );

        let user;


        if (result.rows.length > 0){
            user = result.rows[0];
        }
        else{
            result = await pool.query(
                "SELECT * FROM users WHERE email = $1",
                [email]
            );
            
            if (result.rows.length > 0){
                const updated = await pool.query(
                    `
                    UPDATE users
                    SET google_sub = $1, name = COALESCE(name, $2)
                    WHERE email = $3
                    RETURNING *
                    `,
                    [sub, name, email]
                );
                
                user = updated.rows[0];
            }
            else{
                const newUser = await pool.query(
                    `
                    INSERT INTO users (google_sub, email, name) 
                    VALUES ($1, $2, $3) 
                    RETURNING *
                    `,
                    [sub, email, name]
                );

                user = newUser.rows[0];

                // Create equipment row upon user creation
                await pool.query(
                    `
                    INSERT INTO user_equipment (user_id)
                    VALUES ($1)
                    `,
                    [user.id]
                );
            }
        }

        // Issue your own JWT
        const appToken = jwt.sign(
            {
                userId: user.id,
                email: user.email
            },
            process.env.JWT_SECRET, 
            {expiresIn: "7d"}
        );

        res.json({ token: appToken, user });
    }
    catch(err){
        console.error(err);
        res.status(401).json({error: "Invalid Google token"});
    }
});

// Ensure users with a valid JWT token can access the main app
app.get("/me", authMiddleware, async (req, res) => {
  try {

    console.log("req.user:", req.user);
    
    const userId = req.user.userId;

    const result = await pool.query(
      `
      SELECT id, username, email, is_admin
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Load player state
app.get("/me/state", authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    
    try{
        const items = await pool.query(
            `SELECT item_id 
            FROM user_inventory
            WHERE user_id = $1`,
            [userId]
        );

        const equipment = await pool.query(
            `
            SELECT hat_item_id, body_item_id, outside_item_id 
            FROM user_equipment
            WHERE user_id = $1`,
            [userId]
        );

        const markers = await pool.query(
            `SELECT latitude, longitude 
            FROM markers
            WHERE user_id = $1
            `,
            [userId]
        );

        res.json({
            collectedItems: items.rows.map(r => r.item_id),
            equipped: equipment.rows[0] || {},
            markers: markers.rows
        });
    }
    catch (err){
        console.error("STATE ERROR:", err);
        res.status(500).json({error: err.message});
    }
});

// Collect Item
app.post("/items/collect", authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const {itemId} = req.body;

    try{
        await pool.query(
            `
            INSERT INTO user_inventory (user_id, item_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, item_id) DO NOTHING
            `,
            [userId, itemId]
        );

        res.json({ success: true });
    }
    catch (err){
        res.status(500).json({error: err.message})
    }
});

// Equip Item 
app.put("/equip", authMiddleware, async (req, res) => {

  const userId = req.user.userId;
  const { hat, body, outside } = req.body;

  try {
    await pool.query(
      `
      INSERT INTO user_equipment (user_id, hat_item_id, body_item_id, outside_item_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id)
      DO UPDATE SET
        hat_item_id = EXCLUDED.hat_item_id,
        body_item_id = EXCLUDED.body_item_id,
        outside_item_id = EXCLUDED.outside_item_id
      `,
      [userId, hat, body, outside]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }

});

// Save Marker
app.post("/admin/markers", authMiddleware, requireAdmin, async (req, res) => {
    
    const {latitude, longitude, item_id} = req.body;

    try{
        await pool.query(
            `
            INSERT INTO markers (latitude, longitude, item_id)
            VALUES ($1, $2, $3)
            `
        ,
        [latitude, longitude, item_id]
        );

        res.json({ success: true });
    }
    catch (err){
        res.status(500).json({error: err.message})
    }
});

// Player fetch markers route
app.get("/markers", authMiddleware, async (req, res) => {
  try{
    const result = await pool.query(
      `SELECT markers.*, items.image, items.name
      FROM markers
      LEFT JOIN items
      ON markers.item_id = items.items_id`
    );

    res.json(result.rows);
  }
  catch(err){
    res.status(500).json({ error: err.message });
  }
})

// Register Route
app.post("/auth/register", async (req, res) => {
  const { username, password } = req.body;

  try {

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username`,
      [username, hashedPassword]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });

  } catch (err) {

    if (err.code === "23505") {
      return res.status(409).json({
        error: "Username already exists"
      });
    }

    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Login Route
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Admin Route
app.post("/admin/marker", authMiddleware, requireAdmin, async (req, res) => {
  const { lat, lng, item_type } = req.body;

  const result = await db.query(
    `INSERT INTO markers (lat, lng, item_type)
    VALUES ($1, $2, $3)
    RETURNING *`,
    [lat, lng, item_type]
  )

  res.json(result.rows[0]);
});

// Test route
app.get("/health/db", async (_req, res) => {
    try{
        const result = await pool.query("SELECT NOW() as now");
        res.json({ ok: true, now: result.rows[0].now });
    }
    catch (err){
        console.error(err);
        res.status(500).json({ ok: false, error: err.message });
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on: http://localhost:${PORT}`);
});

app.get("/tables", async (req, res) => {
  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `);

  res.json(result.rows);
});