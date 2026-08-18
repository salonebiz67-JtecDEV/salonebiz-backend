const express = require("express");

const { pool } = require("../config/database");
const authMiddleware = require("../middleware/auth");

const router = express.Router();


// ======================================================
// MY PROFILE
// GET /api/users/me
// ======================================================

router.get(
    "/me",
    authMiddleware,
    async (req, res) => {

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
                LIMIT 1
                `,
                [req.user.id]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });

            }


            return res.json({
                success: true,
                user: result.rows[0]
            });


        } catch (error) {

            console.error(
                "❌ Profile error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load profile"
            });

        }

    }
);


// ======================================================
// PUBLIC USER PROFILE
// GET /api/users/:id
// ======================================================

router.get(
    "/:id",
    authMiddleware,
    async (req, res) => {

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
                LIMIT 1
                `,
                [req.params.id]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });

            }


            return res.json({
                success: true,
                user: result.rows[0]
            });


        } catch (error) {

            console.error(
                "❌ User profile error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load user"
            });

        }

    }
);


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;
