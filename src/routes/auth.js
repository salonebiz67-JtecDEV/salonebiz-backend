const express = require("express");
const crypto = require("crypto");

const { pool } = require("../config/database");

const router = express.Router();


// ======================================================
// PASSWORD HELPERS
// ======================================================

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");

    const hash = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

    return `${salt}:${hash}`;
}


function verifyPassword(password, storedPassword) {
    try {
        if (!storedPassword || typeof storedPassword !== "string") {
            return false;
        }

        const parts = storedPassword.split(":");

        if (parts.length !== 2) {
            return false;
        }

        const salt = parts[0];
        const storedHash = parts[1];

        const hash = crypto
            .scryptSync(password, salt, 64)
            .toString("hex");

        const hashBuffer = Buffer.from(hash, "hex");
        const storedHashBuffer = Buffer.from(storedHash, "hex");

        if (hashBuffer.length !== storedHashBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(
            hashBuffer,
            storedHashBuffer
        );

    } catch (error) {
        console.error("❌ Password verification error:", error);
        return false;
    }
}


// ======================================================
// AUTH HEALTH
// ======================================================

router.get("/health", (req, res) => {
    return res.json({
        success: true,
        service: "auth",
        status: "online"
    });
});


// ======================================================
// REGISTER
// ======================================================

router.post("/register", async (req, res) => {
    try {

        // IMPORTANT:
        // Prevent req.body from being undefined
        const body = req.body || {};

        const name = body.name;
        const email = body.email;
        const password = body.password;


        // ----------------------------------------------
        // VALIDATE INPUT
        // ----------------------------------------------

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
                receivedBody: body
            });
        }


        const cleanName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();


        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message: "Name cannot be empty"
            });
        }


        if (!normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Email cannot be empty"
            });
        }


        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }


        // ----------------------------------------------
        // CHECK DATABASE
        // ----------------------------------------------

        if (!pool) {
            console.error("❌ Database pool is not available");

            return res.status(503).json({
                success: false,
                message: "Database service unavailable"
            });
        }


        // ----------------------------------------------
        // CHECK EXISTING USER
        // ----------------------------------------------

        const existingUser = await pool.query(
            `
            SELECT id
            FROM users
            WHERE email = $1
            LIMIT 1
            `,
            [normalizedEmail]
        );


        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }


        // ----------------------------------------------
        // HASH PASSWORD
        // ----------------------------------------------

        const passwordHash = hashPassword(password);


        // ----------------------------------------------
        // CREATE USER
        // ----------------------------------------------

        const result = await pool.query(
            `
            INSERT INTO users
                (name, email, password_hash)
            VALUES
                ($1, $2, $3)
            RETURNING
                id,
                name,
                email,
                created_at
            `,
            [
                cleanName,
                normalizedEmail,
                passwordHash
            ]
        );


        // ----------------------------------------------
        // SUCCESS
        // ----------------------------------------------

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: result.rows[0]
        });


    } catch (error) {

        console.error("❌ Registration error:", error);

        // PostgreSQL duplicate email protection
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }


        return res.status(500).json({
            success: false,
            message: "Unable to create account"
        });
    }
});


// ======================================================
// LOGIN
// ======================================================

router.post("/login", async (req, res) => {
    try {

        // IMPORTANT:
        // Prevent req.body from being undefined
        const body = req.body || {};

        const email = body.email;
        const password = body.password;


        // ----------------------------------------------
        // VALIDATE INPUT
        // ----------------------------------------------

        if (
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
                receivedBody: body
            });
        }


        const normalizedEmail = email.trim().toLowerCase();


        if (!normalizedEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }


        // ----------------------------------------------
        // FIND USER
        // ----------------------------------------------

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


        // ----------------------------------------------
        // USER NOT FOUND
        // ----------------------------------------------

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }


        const user = result.rows[0];


        // ----------------------------------------------
        // VERIFY PASSWORD
        // ----------------------------------------------

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


        // Never send password hash to frontend
        delete user.password_hash;


        // ----------------------------------------------
        // LOGIN SUCCESS
        // ----------------------------------------------

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


// ======================================================
// DATABASE TEST
// ======================================================

router.get("/database-test", async (req, res) => {
    try {

        const result = await pool.query(
            "SELECT NOW() AS time"
        );


        return res.json({
            success: true,
            database: "connected",
            time: result.rows[0].time
        });


    } catch (error) {

        console.error(
            "❌ Auth database test failed:",
            error
        );


        return res.status(503).json({
            success: false,
            database: "disconnected"
        });
    }
});


// ======================================================
// EXPORT
// ======================================================

module.exports = router;
