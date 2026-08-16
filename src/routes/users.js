const express = require("express");

const { pool } = require("../config/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();


// ==========================================
// MY PROFILE
// ==========================================

router.get("/me", requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                id,
                name,
                phone,
                email,
                role,
                created_at
            FROM users
            WHERE id = $1
            `,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Profile error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load profile"
        });
    }
});


// ==========================================
// PUBLIC USER PROFILE
// ==========================================

router.get("/:id", requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                id,
                name,
                role,
                created_at
            FROM users
            WHERE id = $1
            `,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error("User profile error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load user"
        });
    }
});


module.exports = router;
