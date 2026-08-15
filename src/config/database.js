const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
});

async function checkDatabaseConnection() {
  const result = await pool.query("SELECT NOW()");
  return result.rows[0];
}

pool.on("error", (error) => {
  console.error("❌ PostgreSQL pool error:", error.message);
});

module.exports = {
  pool,
  checkDatabaseConnection
};
