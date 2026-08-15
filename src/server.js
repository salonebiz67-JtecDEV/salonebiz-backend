const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const { checkDatabaseConnection } = require("./config/database");

const app = express();

// Render provides PORT automatically
const PORT = process.env.PORT || 3000;

// ================================
// MIDDLEWARE
// ================================

app.use(helmet());
app.use(cors());
app.use(express.json());

// ================================
// HOME API
// ================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    app: "SaloneBiz",
    message: "SaloneBiz Backend is running 🇸🇱",
    version: "0.1.0"
  });
});

// ================================
// HEALTH CHECK API
// ================================

app.get("/api/health", async (req, res) => {
  try {
    await checkDatabaseConnection();

    res.status(200).json({
      success: true,
      status: "healthy",
      database: "connected",
      service: "salonebiz-backend",
      version: "0.1.0",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      success: false,
      status: "unhealthy",
      database: "disconnected",
      service: "salonebiz-backend",
      version: "0.1.0",
      timestamp: new Date().toISOString()
    });
  }
});

// ================================
// 404 HANDLER
// ================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl
  });
});

// ================================
// START SERVER
// ================================

app.listen(PORT, () => {
  console.log("=================================");
  console.log("🇸🇱 SaloneBiz Backend");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("=================================");
});
