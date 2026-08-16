const express = require("express");
const crypto = require("crypto");

const { pool } = require("../config/database");

const router = express.Router();


// ==========================================
// PASSWORD HELPERS
// ==========================================

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");

    const hash = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

    return `${salt}:${hash}`;
}


function verifyPassword(password, storedPassword) {
    try {
        const parts = storedPassword.split(":");

        if (parts.length !== 2) {
            return false;
        }

        const salt = parts[0];
        const storedHash = parts[1];

        const hash = crypto
            .scryptSync(password, salt, 64)
            .toString("hex");

        return crypto.timingSafeEqual(
            Buffer.from(hash, "hex"),
            Buffer.from(storedHash, "hex")
        );
    } catch (error) {
        return false;
    }
}


// ==========================================
// HEALTH CHECK
// ==========================================

router.get("/health", async (req, res) => {
    res.json({
        success: true,
        service: "auth",
        status: "online"
    });
});


// ==========================================
// REGISTER
// ==========================================

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1 LIMIT 1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        const passwordHash = hashPassword(password);

        const result = await pool.query(
            `
            INSERT INTO users
                (name, email, password_hash)
            VALUES
                ($1, $2, $3)
            RETURNING id, name, email, created_at
            `,
            [
                name.trim(),
                normalizedEmail,
                passwordHash
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("❌ Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create account"
        });
    }
});


// ==========================================
// LOGIN
// ==========================================

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                password_hash,
                created_at
            FROM users
            WHERE email = $1
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        const passwordCorrect = verifyPassword(
            password,
            user.password_hash
        );

        if (!passwordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        delete user.password_hash;

        return res.json({
            success: true,
            message: "Login successful",
            user
        });

    } catch (error) {
        console.error("❌ Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to login"
        });
    }
});


// ==========================================
// TEST DATABASE THROUGH AUTH
// ==========================================

router.get("/database-test", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT NOW() AS time"
        );

        res.json({
            success: true,
            database: "connected",
            time: result.rows[0].time
        });

    } catch (error) {
        console.error("❌ Auth database test failed:", error);

        res.status(503).json({
            success: false,
            database: "disconnected"
        });
    }
});


module.exports = router;
