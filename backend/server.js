require("dotenv").config();
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const express = require("express");
const cors = require("cors")
const pool = require("./db");

// Google Auth created routes
const {OAuth2Client} = require("google-auth-library");
const jwt = require("jsonwebtoken");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
                error: "Email already exists!"
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

        if (result.rows.length === 0){
            // Create user
            const newUser = await pool.query(
                "INSERT INTO users (google_sub, email, name) VALUES ($1, $2, $3) RETURNING *",
                [sub, email, name]
            );

            user = newUser.rows[0];
        }
        else{
            user = result.rows[0];
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
        res.status(401).json({error: "Invalid Googl token"});
    }
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