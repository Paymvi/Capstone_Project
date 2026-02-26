console.log("DATABASE_URL:", process.env.DATABASE_URL);

require("dotenv").config();
const express = require("express");
const cors = require("cors")
const pool = require("./db");

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

        // Unique error handling
        if(err.code === "23505"){
            res.status(409).json({
                error: "Email already exists!"
            })
        }

        res.status(500).json({error: err.message});
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