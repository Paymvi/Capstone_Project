require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "roamie",
  password: "capstone123", 
  port: 5432,
});

module.exports = pool;