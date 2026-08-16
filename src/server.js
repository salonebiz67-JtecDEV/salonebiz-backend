const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const { checkDatabaseConnection } = require("./config/database");
const authRoutes = require("./routes/auth");

const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// SECURITY
// ==========================================

app.use(helmet());

// ==========================================
// CORS
// ==========================================

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// ==========================================
// BODY PARSERS
// ==========================================

// IMPORTANT: These must come BEFORE the routes
app.use(express.json({ limit: "1mb" }));

app.use(express.urlencoded({
    extended: true,
    limit: "1mb"
}));

// ==========================================
// REQUEST DEBUG
// ==========================================

app.use((req, res, next) => {
    console.log("➡️", req.method, req.originalUrl);
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Body:", req.body);
    next();
});

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        app: "SaloneBiz",
        message: "SaloneBiz Backend is running 🇸🇱",
        version: "0.2.0"
    });
});

// ==========================================
// HEALTH
// ==========================================

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
        console.error("❌ Database health check failed:", error);

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

// ==========================================
// AUTH ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

// ==========================================
// 404
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl
    });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((error, req, res, next) => {
    console.error("❌ GLOBAL ERROR:", error);

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🇸🇱 SaloneBiz Backend running on port ${PORT}`);
});
