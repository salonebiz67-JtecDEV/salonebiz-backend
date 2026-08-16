const express = require("express");

const { pool } = require("../config/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();


// ==========================================
// CREATE POST
// IMAGE ONLY
// ==========================================

router.post("/", requireAuth, async (req, res) => {
    try {
        const {
            image_url,
            caption,
            location
        } = req.body;

        if (!image_url) {
            return res.status(400).json({
                success: false,
                message: "Image URL is required"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO posts
                (user_id, image_url, caption, location)
            VALUES
                ($1, $2, $3, $4)
            RETURNING *
            `,
            [
                req.user.id,
                image_url,
                caption || null,
                location || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Post created successfully",
            post: result.rows[0]
        });

    } catch (error) {
        console.error("Create post error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create post"
        });
    }
});


// ==========================================
// HOME FEED
// ==========================================

router.get("/feed", requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                p.id,
                p.image_url,
                p.caption,
                p.location,
                p.created_at,

                u.id AS user_id,
                u.name AS user_name,
                u.email AS user_email,

                COUNT(DISTINCT l.id)::INTEGER AS likes,
                COUNT(DISTINCT f.id)::INTEGER AS favorites,
                COUNT(DISTINCT s.id)::INTEGER AS shares,
                COUNT(DISTINCT c.id)::INTEGER AS comments

            FROM posts p

            JOIN users u
                ON u.id = p.user_id

            LEFT JOIN post_likes l
                ON l.post_id = p.id

            LEFT JOIN post_favorites f
                ON f.post_id = p.id

            LEFT JOIN post_shares s
                ON s.post_id = p.id

            LEFT JOIN comments c
                ON c.post_id = p.id

            GROUP BY
                p.id,
                u.id

            ORDER BY
                p.created_at DESC

            LIMIT 50
            `
        );

        res.json({
            success: true,
            posts: result.rows
        });

    } catch (error) {
        console.error("Feed error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load feed"
        });
    }
});


// ==========================================
// MY POSTS
// ==========================================

router.get("/mine", requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                p.*,

                COUNT(DISTINCT l.id)::INTEGER AS likes,
                COUNT(DISTINCT f.id)::INTEGER AS favorites,
                COUNT(DISTINCT s.id)::INTEGER AS shares,
                COUNT(DISTINCT c.id)::INTEGER AS comments

            FROM posts p

            LEFT JOIN post_likes l
                ON l.post_id = p.id

            LEFT JOIN post_favorites f
                ON f.post_id = p.id

            LEFT JOIN post_shares s
                ON s.post_id = p.id

            LEFT JOIN comments c
                ON c.post_id = p.id

            WHERE p.user_id = $1

            GROUP BY p.id

            ORDER BY p.created_at DESC
            `,
            [req.user.id]
        );

        res.json({
            success: true,
            posts: result.rows
        });

    } catch (error) {
        console.error("My posts error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load your posts"
        });
    }
});


// ==========================================
// DELETE MY POST
// ==========================================

router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `
            DELETE FROM posts
            WHERE id = $1
            AND user_id = $2
            RETURNING id
            `,
            [
                req.params.id,
                req.user.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        res.json({
            success: true,
            message: "Post deleted successfully"
        });

    } catch (error) {
        console.error("Delete post error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to delete post"
        });
    }
});


module.exports = router;
