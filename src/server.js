const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const {
    checkDatabaseConnection
} = require("./config/database");

const authRoutes = require("./routes/auth");


const app = express();


// ======================================================
// CONFIG
// ======================================================

const PORT = process.env.PORT || 3000;


// ======================================================
// SECURITY
// ======================================================

app.use(helmet());

app.use(
    cors({
        origin: "*",
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);


// ======================================================
// BODY PARSER
// ======================================================

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// ======================================================
// REQUEST LOGGER
// ======================================================

app.use((req, res, next) => {
    console.log(
        `${new Date().toISOString()} ${req.method} ${req.originalUrl}`
    );

    next();
});


// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        app: "SaloneBiz",
        message: "SaloneBiz Backend is running 🇸🇱",
        version: "0.2.0"
    });
});


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", async (req, res) => {
    try {
        await checkDatabaseConnection();

        return res.json({
            success: true,
            status: "healthy",
            database: "connected",
            service: "salonebiz-backend",
            version: "0.2.0",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error(
            "❌ Database health check failed:",
            error.message
        );

        return res.status(503).json({
            success: false,
            status: "unhealthy",
            database: "disconnected",
            service: "salonebiz-backend",
            version: "0.2.0",
            timestamp: new Date().toISOString()
        });
    }
});


// ======================================================
// AUTH ROUTES
// ======================================================

app.use("/api/auth", authRoutes);


// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl
    });
});


// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((error, req, res, next) => {
    console.error("❌ Server error:", error);

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});


// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, "0.0.0.0", () => {
    console.log("==========================================");
    console.log("🇸🇱 SaloneBiz Backend");
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log("==========================================");
});
