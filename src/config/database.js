const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set");
}

const pool = new Pool({
    connectionString: databaseUrl,

    // Supabase/PostgreSQL commonly requires SSL in hosted environments.
    ssl: {
        rejectUnauthorized: false
    },

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pool.on("error", (error) => {
    console.error("❌ Unexpected PostgreSQL pool error:", error);
});

async function checkDatabaseConnection() {
    if (!databaseUrl) {
        throw new Error("DATABASE_URL environment variable is missing");
    }

    const client = await pool.connect();

    try {
        await client.query("SELECT 1");
        return true;
    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    checkDatabaseConnection
};
