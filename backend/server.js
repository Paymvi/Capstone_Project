const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

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
app.post("/markers", (req, res) => {
  const { userId, latitude, longitude } = req.body;
  const db = readDB();
  const user = db.users.find((u) => u.id === Number(userId));

  if (!user) return res.status(404).json({ message: "User not found" });

  const marker = {
    id: Date.now(), // simple unique id for demo
    latitude: Number(latitude),
    longitude: Number(longitude),
  };

  user.markers.push(marker);
  writeDB(db);

  res.json(marker);
});

// UPDATE EQUIPPED
// body: { userId: 1, hat: "hat_crown", body: null, outside: "shield" }
app.put("/equip", (req, res) => {
  const { userId, hat, body, outside } = req.body;
  const db = readDB();
  const user = db.users.find((u) => u.id === Number(userId));

  if (!user) return res.status(404).json({ message: "User not found" });

  user.equipped = {
    hat: hat ?? null,
    body: body ?? null,
    outside: outside ?? null,
  };

  writeDB(db);
  res.json({ message: "Equipped updated", equipped: user.equipped });
});

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

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});