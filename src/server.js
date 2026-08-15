const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const { checkDatabaseConnection } = require("./config/database");
const authRoutes = require("./routes/auth");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(helmet());

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());


// ==============================
// HOME
// ==============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        app: "SaloneBiz",
        message: "SaloneBiz Backend is running 🇸🇱",
        version: "0.2.0"
    });
});


// ==============================
// HEALTH
// ==============================

app.get("/api/health", async (req, res) => {
    try {
        await checkDatabaseConnection();

        res.json({
            success: true,
            status: "healthy",
            database: "connected",
            service: "salonebiz-backend",
            version: "0.2.0",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Database health check failed:", error);

        res.status(503).json({
            success: false,
            status: "unhealthy",
            database: "disconnected",
            service: "salonebiz-backend",
            version: "0.2.0",
            timestamp: new Date().toISOString()
        });
    }
});


// ==============================
// AUTH ROUTES
// ==============================

app.use("/api/auth", authRoutes);


// ==============================
// 404
// ==============================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});


// ==============================
// START SERVER
// ==============================

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🇸🇱 SaloneBiz Backend running on port ${PORT}`);
});
