const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const {
  pool,
  checkDatabaseConnection
} = require("./config/database");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// HOME
app.get("/", (req, res) => {
  res.json({
    success: true,
    app: "SaloneBiz",
    message: "SaloneBiz Backend is running 🇸🇱",
    version: "0.1.0"
  });
});

// API HEALTH
app.get("/api/health", async (req, res) => {
  try {
    const db = await checkDatabaseConnection();

    res.status(200).json({
      success: true,
      status: "healthy",
      database: "connected",
      service: "salonebiz-backend",
      database_time: db.time,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Database health check failed:");
    console.error(error.message);

    res.status(503).json({
      success: false,
      status: "unhealthy",
      database: "disconnected",
      service: "salonebiz-backend",
      timestamp: new Date().toISOString()
    });
  }
});

// TEST DATABASE
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT 1 AS connected");

    res.json({
      success: true,
      message: "PostgreSQL connection is working 🇸🇱",
      result: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(503).json({
      success: false,
      message: "PostgreSQL connection failed"
    });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`🇸🇱 SaloneBiz Backend running on port ${PORT}`);
});
