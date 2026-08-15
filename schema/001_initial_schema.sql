const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkDatabaseConnection() {
  const result = await pool.query("SELECT 1");
  return result.rows;
}

module.exports = {
  pool,
  checkDatabaseConnection
};
