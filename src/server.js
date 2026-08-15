const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const { checkDatabaseConnection } = require("./config/database");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    app: "SaloneBiz",
    message: "SaloneBiz Backend is running 🇸🇱",
    version: "0.1.0"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await checkDatabaseConnection();

    res.json({
      success: true,
      status: "healthy",
      database: "connected",
      service: "salonebiz-backend",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      success: false,
      status: "unhealthy",
      database: "disconnected"
    });
  }
});

app.listen(PORT, () => {
  console.log(`🇸🇱 SaloneBiz Backend running on port ${PORT}`);
});
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      success: true,
      status: "healthy",
      database: "connected",
      service: "salonebiz-backend"
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "unhealthy",
      database: "disconnected"
    });
  }
});
