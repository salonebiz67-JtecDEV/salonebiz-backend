const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error);
});

async function checkDatabaseConnection() {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("✅ SaloneBiz database connected");
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  checkDatabaseConnection
};
