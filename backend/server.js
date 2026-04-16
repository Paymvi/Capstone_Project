require("dotenv").config();
const SECRET = process.env.JWT_SECRET;

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const authMiddleware = require("./middleware/authMiddleware");
const requireAdmin = require("./middleware/adminMiddleware");
const bcrypt = require("bcrypt");

console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("JWT_SECRET:", process.env.JWT_SECRET);

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// This file is your "database"
const DB_PATH = path.join(__dirname, "db.json");

// ---------- routes ----------

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const pool = require("./db");

// Google Auth created routes
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Roamie is running on port 5000 🔥");
});

// Creates a new user account
app.post("/users", async (req, res) => {
  const { email, name } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *",
      [email, name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);

    if (err.code === "23505") {
      return res.status(409).json({
        error: "Username already exists!",
      });
    }

    res.status(500).json({ error: err.message });
  }
});

// Fetch all users in the database
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Google Auth Route
app.post("/auth/google", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name } = payload;

    //Admin logic
    const ADMIN_EMAILS = ["quark.labs25@gmail.com"];
    const isAdmin = ADMIN_EMAILS.includes(email);

    // Check if a user exists
    let result = await pool.query(
      "SELECT * FROM users WHERE google_sub = $1",
      [sub]
    );

    let user;

    if (result.rows.length > 0) {
      user = result.rows[0];
    } else {
      // Check if user exists by email
      result = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length > 0) {
        // Update existing user
        const updated = await pool.query(
          `
          UPDATE users
          SET google_sub = $1,
              name = COALESCE(name, $2),
              is_admin = $3
          WHERE email = $4
          RETURNING *
          `,
          [sub, name, isAdmin, email]
        );

        user = updated.rows[0];
      } else {
        // Create new user
        const newUser = await pool.query(
          `
          INSERT INTO users (google_sub, email, name, is_admin)
          VALUES ($1, $2, $3, $4)
          RETURNING *
          `,
          [sub, email, name, isAdmin]
        );

        user = newUser.rows[0];

        // Create equipment row
        await pool.query(
          `
          INSERT INTO user_equipment (user_id)
          VALUES ($1)
          ON CONFLICT (user_id) DO NOTHING
          `,
          [user.id]
        );
      }
    }

    // Issue JWT
    const appToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        is_admin: user.is_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token: appToken, user });

  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid Google token" });
  }
});

// Ensure users with a valid JWT token can access the main app
app.get("/me", authMiddleware, async (req, res) => {
  try {
    console.log("req.user:", req.user);

    const userId = req.user.userId;

    const result = await pool.query(
      `
      SELECT id, username, email
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      ...result.rows[0],
      is_admin: req.user.is_admin ?? false,
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Load player state
app.get("/me/state", authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  try {
    console.log("STATE userId:", userId);

    const userResult = await pool.query(
      `SELECT is_admin FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const items = await pool.query(
      `SELECT item_id FROM user_inventory WHERE user_id = $1`,
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
      `SELECT latitude, longitude FROM markers`
    );

    res.json({
      userId,
      is_admin: userResult.rows[0].is_admin,
      collectedItems: items.rows.map(r => r.item_id),
      equipped: equipment.rows[0] || {},
      markers: markers.rows
    });

  } catch (err) {
    console.error("STATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Retrieve Item
app.get("/items", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM items");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Collect Item
app.post("/items/collect", authMiddleware, async (req, res) => {
  try {
    // Restrict Admin from collecting items
    if (req.user.is_admin) {
      return res.status(403).json({ error: "Admins cannot collect items" });
    }

    const userId = req.user.userId;
    const { itemId } = req.body;

    await pool.query(
      `
      INSERT INTO user_inventory (user_id, item_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, item_id) DO NOTHING
      `,
      [userId, itemId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
// app.post("/admin/markers", authMiddleware, requireAdmin, async (req, res) => {

//     const {latitude, longitude, item_id} = req.body;

//     try{
//         await pool.query(
//             `
//             INSERT INTO markers (latitude, longitude, item_id)
//             VALUES ($1, $2, $3)
//             `
//         ,
//         [latitude, longitude, item_id]
//         );

//         res.json({ success: true });
//     }
//     catch (err){
//         res.status(500).json({error: err.message})
//     }
// });

// Player fetch markers route
app.get("/markers", authMiddleware, async (req, res) => {
  try {
    let query;
    let params = [];

    // ADMIN: see all markers
    if (req.user.is_admin) {
      query = `
        SELECT 
          markers.id,
          markers.latitude,
          markers.longitude,
          markers.item_id,
          items.name,
          items.image,
          items.description
        FROM markers
        LEFT JOIN items 
        ON markers.item_id = items.item_id;
      `;
    }
    // NORMAL USER: hide collected
    else {
      query = `
        SELECT 
          markers.id,
          markers.latitude,
          markers.longitude,
          markers.item_id,
          items.name,
          items.image,
          items.description
        FROM markers
        LEFT JOIN items 
        ON markers.item_id = items.item_id
        WHERE markers.item_id NOT IN (
          SELECT item_id 
          FROM user_inventory 
          WHERE user_id = $1
        );
      `;
      params = [req.user.userId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("MARKERS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

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

    await pool.query(
      `
      INSERT INTO user_equipment (user_id)
      VALUES ($1)
      `,
      [user.id]
    );

    const token = jwt.sign({ user: username }, "secret");

    res.json({ token, user });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        error: "Username already exists",
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
      `  
      SELECT * FROM users 
      WHERE username = '${username}' 
      `
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        is_admin: false,
      },
      SECRET
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Admin Route
app.post("/markers", authMiddleware, requireAdmin, async (req, res) => {
  const { lat, lng, item_id } = req.body;

  console.log("ADMIN ADD MARKER: ", { lat, lng, item_id });

  const result = await pool.query(
    `INSERT INTO markers (latitude, longitude, item_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [lat, lng, item_id]
  );

  res.json(result.rows[0]);
  console.log("USER:", req.user);
});

// Test route
app.get("/health/db", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, now: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

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

// Test the data base route
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    console.error("DB TEST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});