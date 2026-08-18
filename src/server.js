const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const { checkDatabaseConnection } = require("./config/database");

const authRoutes = require("./routes/auth");
const postsRoutes = require("./routes/posts");
const usersRoutes = require("./routes/users");
const friendsRoutes = require("./routes/friends");
const interactionsRoutes = require("./routes/interactions");
const messagesRoutes = require("./routes/messages");

const app = express();

const PORT = process.env.PORT || 3000;


// ======================================================
// SECURITY
// ======================================================

app.use(helmet());


// ======================================================
// CORS
// ======================================================

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
// BODY PARSERS
// ======================================================

app.use(
    express.json({
        limit: "1mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb"
    })
);


// ======================================================
// REQUEST LOGGER
// ======================================================

app.use((req, res, next) => {
    console.log(
        `➡️ ${req.method} ${req.originalUrl}`
    );

    console.log(
        "Content-Type:",
        req.headers["content-type"] || "none"
    );

    next();
});


// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        app: "SaloneBiz",
        message: "SaloneBiz Backend is running 🇸🇱",
        version: "0.3.0"
    });
});


// ======================================================
// HEALTH
// ======================================================

app.get("/api/health", async (req, res) => {
    try {

        await checkDatabaseConnection();

        return res.status(200).json({
            success: true,
            status: "healthy",
            database: "connected",
            service: "salonebiz-backend",
            version: "0.3.0",
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
            version: "0.3.0",
            timestamp: new Date().toISOString()
        });
    }
});


// ======================================================
// AUTH
// ======================================================

app.use(
    "/api/auth",
    authRoutes
);


// ======================================================
// SOCIAL ROUTES
// ======================================================

// 🏠 Posts / Home feed
app.use(
    "/api/posts",
    postsRoutes
);


// 👤 Users / Profiles / Search
app.use(
    "/api/users",
    usersRoutes
);


// 👥 Friends / Following
app.use(
    "/api/friends",
    friendsRoutes
);


// ❤️ Likes / ⭐ Favorites / Comments
app.use(
    "/api/interactions",
    interactionsRoutes
);


// 💬 Messages / Inbox
app.use(
    "/api/messages",
    messagesRoutes
);


// ======================================================
// JSON BODY PARSER ERROR
// ======================================================

app.use((error, req, res, next) => {

    if (
        error instanceof SyntaxError &&
        error.status === 400 &&
        "body" in error
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request body"
        });
    }

    next(error);
});


// ======================================================
// 404
// ======================================================

app.use((req, res) => {

    return res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl
    });
});


// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((error, req, res, next) => {

    console.error(
        "❌ GLOBAL ERROR:",
        error
    );

    if (res.headersSent) {
        return next(error);
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});


// ======================================================
// START SERVER
// ======================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🇸🇱 SaloneBiz Backend running on port ${PORT}`
        );

        console.log(
            `🌐 Environment: ${
                process.env.NODE_ENV || "development"
            }`
        );
    }
);
