const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL error:", err);
});

async function checkDatabaseConnection() {
  const result = await pool.query("SELECT NOW() AS time");
  return result.rows[0];
}

module.exports = {
  pool,
  checkDatabaseConnection
};
