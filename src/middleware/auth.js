const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            success: false,
            message: "Invalid authorization format"
        });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error("❌ JWT_SECRET is not configured");

        return res.status(500).json({
            success: false,
            message: "Authentication system is not configured"
        });
    }

    try {
        const decoded = jwt.verify(token, secret);

        if (!decoded || !decoded.id) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }

        req.user = {
            id: decoded.id
        };

        return next();

    } catch (error) {
        console.error("❌ Authentication error:", error.message);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Authentication token expired"
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid authentication token"
        });
    }
}

module.exports = authMiddleware;
