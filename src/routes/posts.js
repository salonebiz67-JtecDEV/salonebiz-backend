const express = require("express");
const { pool } = require("../config/database");
const auth = require("../middleware/auth");

const router = express.Router();


// ==========================================
// GET HOME FEED
// ==========================================

router.get("/", auth, async (req, res) => {
    try {

        const result = await pool.query(`
            SELECT
                p.id,
                p.user_id,
                p.business_name,
                p.description,
                p.image_url,
                p.location,
                p.created_at,

                u.name AS user_name,
                u.email AS user_email,

                COUNT(DISTINCT l.id)::int AS likes_count,
                COUNT(DISTINCT f.id)::int AS favorites_count,
                COUNT(DISTINCT c.id)::int AS comments_count,

                EXISTS (
                    SELECT 1
                    FROM post_likes pl
                    WHERE pl.post_id = p.id
                    AND pl.user_id = $1
                ) AS liked,

                EXISTS (
                    SELECT 1
                    FROM post_favorites pf
                    WHERE pf.post_id = p.id
                    AND pf.user_id = $1
                ) AS favorited

            FROM posts p

            JOIN users u
                ON u.id = p.user_id

            LEFT JOIN post_likes l
                ON l.post_id = p.id

            LEFT JOIN post_favorites f
                ON f.post_id = p.id

            LEFT JOIN comments c
                ON c.post_id = p.id

            GROUP BY
                p.id,
                u.id

            ORDER BY p.created_at DESC
        `, [req.user.id]);

        res.json({
            success: true,
            posts: result.rows
        });

    } catch (error) {

        console.error("Get posts error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load posts"
        });
    }
});


// ==========================================
// CREATE POST
// ==========================================

router.post("/", auth, async (req, res) => {
    try {

        const {
            business_name,
            description,
            image_url,
            location
        } = req.body || {};

        if (!business_name || !image_url) {
            return res.status(400).json({
                success: false,
                message: "Business name and image are required"
            });
        }

        const result = await pool.query(`
            INSERT INTO posts
            (
                user_id,
                business_name,
                description,
                image_url,
                location
            )
            VALUES ($1, $2, $3, $4, $5)

            RETURNING
                id,
                user_id,
                business_name,
                description,
                image_url,
                location,
                created_at
        `, [
            req.user.id,
            String(business_name).trim(),
            description || null,
            String(image_url).trim(),
            location || null
        ]);

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
// DELETE MY POST
// ==========================================

router.delete("/:postId", auth, async (req, res) => {
    try {

        const result = await pool.query(`
            DELETE FROM posts
            WHERE id = $1
            AND user_id = $2
            RETURNING id
        `, [
            req.params.postId,
            req.user.id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        res.json({
            success: true,
            message: "Post deleted"
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
