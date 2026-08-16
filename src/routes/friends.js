const express = require("express");

const { pool } = require("../config/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();


// ==========================================
// FOLLOW / UNFOLLOW
// ==========================================

router.post("/:userId", requireAuth, async (req, res) => {
    try {
        if (req.params.userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: "You cannot follow yourself"
            });
        }

        const existing = await pool.query(
            `
            SELECT id
            FROM follows
            WHERE follower_id = $1
            AND following_id = $2
            `,
            [
                req.user.id,
                req.params.userId
            ]
        );

        if (existing.rows.length > 0) {

            await pool.query(
                `
                DELETE FROM follows
                WHERE follower_id = $1
                AND following_id = $2
                `,
                [
                    req.user.id,
                    req.params.userId
                ]
            );

            return res.json({
                success: true,
                following: false
            });
        }

        await pool.query(
            `
            INSERT INTO follows
                (follower_id, following_id)
            VALUES
                ($1, $2)
            `,
            [
                req.user.id,
                req.params.userId
            ]
        );

        res.json({
            success: true,
            following: true
        });

    } catch (error) {
        console.error("Follow error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update follow"
        });
    }
});


// ==========================================
// MY FRIENDS / FOLLOWING
// ==========================================

router.get("/", requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                u.id,
                u.name,
                u.email,
                f.created_at AS followed_at

            FROM follows f

            JOIN users u
                ON u.id = f.following_id

            WHERE f.follower_id = $1

            ORDER BY f.created_at DESC
            `,
            [req.user.id]
        );

        res.json({
            success: true,
            friends: result.rows
        });

    } catch (error) {
        console.error("Friends error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load friends"
        });
    }
});


module.exports = router;
