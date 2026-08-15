const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { pool } = require("../config/database");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.warn("⚠️ JWT_SECRET is not configured");
}

// ==============================
// REGISTER
// POST /api/auth/register
// ==============================
router.post("/register", async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            password,
            role = "CUSTOMER"
        } = req.body;

        // Validate required fields
        if (!name || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, phone and password are required"
            });
        }

        // Validate password
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        // Validate role
        const allowedRoles = [
            "CUSTOMER",
            "BUSINESS_OWNER"
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account role"
            });
        }

        // Check existing phone/email
        const existingUser = await pool.query(
            `
            SELECT id
            FROM users
            WHERE phone = $1
               OR ($2::text IS NOT NULL AND email = $2)
            LIMIT 1
            `,
            [phone, email || null]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Phone or email is already registered"
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const result = await pool.query(
            `
            INSERT INTO users
                (name, phone, email, password_hash, role)
            VALUES
                ($1, $2, $3, $4, $5)
            RETURNING
                id,
                name,
                phone,
                email,
                role,
                is_active,
                created_at
            `,
            [
                name,
                phone,
                email || null,
                passwordHash,
                role
            ]
        );

        const user = result.rows[0];

        res.status(201).json({
            success: true,
            message: "Account created successfully 🇸🇱",
            user
        });

    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create account"
        });
    }
});


// ==============================
// LOGIN
// POST /api/auth/login
// ==============================
router.post("/login", async (req, res) => {
    try {
        const {
            phone,
            password
        } = req.body;

        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: "Phone and password are required"
            });
        }

        // Find user
        const result = await pool.query(
            `
            SELECT
                id,
                name,
                phone,
                email,
                password_hash,
                role,
                is_active
            FROM users
            WHERE phone = $1
            LIMIT 1
            `,
            [phone]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid phone or password"
            });
        }

        const user = result.rows[0];

        // Check account status
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "This account is inactive"
            });
        }

        // Compare password
        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid phone or password"
            });
        }

        if (!JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Server authentication is not configured"
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // Never send password hash
        delete user.password_hash;

        res.json({
            success: true,
            message: "Login successful 🇸🇱",
            token,
            user
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to login"
        });
    }
});

module.exports = router;
