const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { query } = require("../config/database");

const router = express.Router();


// ======================================================
// JWT HELPER
// ======================================================

function createToken(user) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        secret,
        {
            expiresIn: "7d"
        }
    );
}


// ======================================================
// REGISTER
// POST /api/auth/register
// ======================================================

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await query(
            "SELECT id FROM users WHERE email = $1 LIMIT 1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await query(
            `
            INSERT INTO users (name, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, name, email, created_at
            `,
            [name.trim(), normalizedEmail, passwordHash]
        );

        const user = result.rows[0];

        const token = createToken(user);

        return res.status(201).json({
            success: true,
            message: "Account created successfully.",
            user,
            token
        });

    } catch (error) {
        console.error("❌ Register error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create account."
        });
    }
});


// ======================================================
// LOGIN
// POST /api/auth/login
// ======================================================

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await query(
            `
            SELECT id, name, email, password_hash, created_at
            FROM users
            WHERE email = $1
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = result.rows[0];

        const passwordCorrect = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        delete user.password_hash;

        const token = createToken(user);

        return res.json({
            success: true,
            message: "Login successful.",
            user,
            token
        });

    } catch (error) {
        console.error("❌ Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to login."
        });
    }
});


// ======================================================
// GET CURRENT USER
// GET /api/auth/me
// ======================================================

router.get("/me", async (req, res) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authorization token is required."
            });
        }

        const token = authorization.split(" ")[1];

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT_SECRET is not configured");
        }

        const decoded = jwt.verify(token, secret);

        const result = await query(
            `
            SELECT id, name, email, created_at
            FROM users
            WHERE id = $1
            LIMIT 1
            `,
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error("❌ Auth verification error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
});


module.exports = router;
