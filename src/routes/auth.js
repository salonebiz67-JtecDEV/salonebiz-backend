const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { pool } = require("../config/database");

const router = express.Router();


// ==========================================
// JWT TOKEN
// ==========================================

function createToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d"
        }
    );
}


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
        if (!storedPassword) {
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

        const storedBuffer = Buffer.from(storedHash, "hex");
        const hashBuffer = Buffer.from(hash, "hex");

        if (storedBuffer.length !== hashBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(
            hashBuffer,
            storedBuffer
        );

    } catch (error) {
        return false;
    }
}


// ==========================================
// AUTH HEALTH
// ==========================================

router.get("/health", (req, res) => {
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

        const {
            name,
            phone,
            email,
            password
        } = req.body || {};


        // --------------------------------------
        // VALIDATION
        // --------------------------------------

        if (!name || !phone || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, phone, email and password are required"
            });
        }


        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }


        const cleanName = String(name).trim();
        const cleanPhone = String(phone).trim();
        const normalizedEmail = String(email)
            .trim()
            .toLowerCase();


        if (!cleanName || !cleanPhone || !normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Name, phone and email cannot be empty"
            });
        }


        // --------------------------------------
        // CHECK EMAIL
        // --------------------------------------

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


        // --------------------------------------
        // CHECK PHONE
        // --------------------------------------

        const existingPhone = await pool.query(
            `
            SELECT id
            FROM users
            WHERE phone = $1
            LIMIT 1
            `,
            [cleanPhone]
        );


        if (existingPhone.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this phone number already exists"
            });
        }


        // --------------------------------------
        // HASH PASSWORD
        // --------------------------------------

        const passwordHash = hashPassword(password);


        // --------------------------------------
        // CREATE USER
        // --------------------------------------

        const result = await pool.query(
            `
            INSERT INTO users
                (
                    name,
                    phone,
                    email,
                    password_hash
                )
            VALUES
                ($1, $2, $3, $4)
            RETURNING
                id,
                name,
                phone,
                email,
                role,
                created_at
            `,
            [
                cleanName,
                cleanPhone,
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

        const {
            email,
            password
        } = req.body || {};


        // --------------------------------------
        // VALIDATION
        // --------------------------------------

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }


        const normalizedEmail = String(email)
            .trim()
            .toLowerCase();


        // --------------------------------------
        // FIND USER
        // --------------------------------------

        const result = await pool.query(
            `
            SELECT
                id,
                name,
                phone,
                email,
                password_hash,
                role,
                is_active,
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


        // --------------------------------------
        // CHECK ACTIVE ACCOUNT
        // --------------------------------------

        if (user.is_active === false) {
            return res.status(403).json({
                success: false,
                message: "This account is inactive"
            });
        }


        // --------------------------------------
        // VERIFY PASSWORD
        // --------------------------------------

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


        // --------------------------------------
        // REMOVE PASSWORD HASH
        // --------------------------------------

        delete user.password_hash;


        // --------------------------------------
        // CREATE JWT
        // --------------------------------------

        const token = createToken(user);


        // --------------------------------------
        // LOGIN SUCCESS
        // --------------------------------------

        return res.json({
            success: true,
            message: "Login successful",
            token,
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
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
// DATABASE TEST
// ==========================================

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


module.exports = router;
