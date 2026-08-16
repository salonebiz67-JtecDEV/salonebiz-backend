const { Pool } = require("pg");
require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is missing.");
}

const pool = new Pool({
    connectionString: databaseUrl,

    // Render/Supabase PostgreSQL uses SSL.
    ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pool.on("error", (error) => {
    console.error("❌ Unexpected PostgreSQL pool error:", error.message);
});

async function checkDatabaseConnection() {
    if (!databaseUrl) {
        throw new Error("DATABASE_URL is not configured");
    }

    const client = await pool.connect();

    try {
        await client.query("SELECT 1");
        return true;
    } finally {
        client.release();
    }
}

async function query(text, params = []) {
    return pool.query(text, params);
}

async function closeDatabase() {
    await pool.end();
}

module.exports = {
    pool,
    query,
    checkDatabaseConnection,
    closeDatabase
};
