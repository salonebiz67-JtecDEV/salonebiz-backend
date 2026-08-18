const jwt = require("jsonwebtoken");


// ======================================================
// AUTHENTICATION MIDDLEWARE
// ======================================================

function authMiddleware(req, res, next) {
    try {

        const authHeader = req.headers.authorization;

        // ------------------------------------------
        // CHECK AUTHORIZATION HEADER
        // ------------------------------------------

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }


        // Expected:
        // Authorization: Bearer TOKEN

        const parts = authHeader.split(" ");

        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer" ||
            !parts[1]
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format"
            });
        }


        const token = parts[1];


        // ------------------------------------------
        // JWT SECRET
        // ------------------------------------------

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            console.error(
                "❌ JWT_SECRET is not configured"
            );

            return res.status(500).json({
                success: false,
                message: "Authentication system is not configured"
            });
        }


        // ------------------------------------------
        // VERIFY TOKEN
        // ------------------------------------------

        const decoded = jwt.verify(
            token,
            secret
        );


        // ------------------------------------------
        // CHECK USER ID
        // ------------------------------------------

        if (!decoded || !decoded.id) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }


        // ------------------------------------------
        // ATTACH USER
        // ------------------------------------------

        req.user = {
            id: decoded.id
        };


        next();

    } catch (error) {

        console.error(
            "❌ Authentication error:",
            error.message
        );

        if (
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Authentication token expired"
            });
        }


        if (
            error.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }


        return res.status(401).json({
            success: false,
            message: "Authentication failed"
        });
    }
}


module.exports = authMiddleware;
