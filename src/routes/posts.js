const express = require("express");

const { pool } = require("../config/database");
const authMiddleware = require("../middleware/auth");

const router = express.Router();


// ======================================================
// CREATE POST
// POST /api/posts
// ======================================================

router.post("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            caption,
            image_url,
            imageUrl
        } = req.body || {};

        // Accept both image_url and imageUrl
        const image = image_url || imageUrl || null;

        // --------------------------------------------------
        // VALIDATION
        // --------------------------------------------------

        if (!image) {
            return res.status(400).json({
                success: false,
                message: "An image is required"
            });
        }

        if (typeof image !== "string" || image.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid image URL"
            });
        }

        const cleanCaption =
            typeof caption === "string"
                ? caption.trim()
                : "";

        if (cleanCaption.length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Caption cannot exceed 2000 characters"
            });
        }

        // --------------------------------------------------
        // CREATE POST
        // --------------------------------------------------

        const result = await pool.query(
            `
            INSERT INTO posts
                (
                    user_id,
                    caption,
                    image_url
                )
            VALUES
                ($1, $2, $3)
            RETURNING
                id,
                user_id,
                caption,
                image_url,
                created_at
            `,
            [
                userId,
                cleanCaption || null,
                image.trim()
            ]
        );

        // --------------------------------------------------
        // RETURN POST WITH USER
        // --------------------------------------------------

        const postResult = await pool.query(
            `
            SELECT
                p.id,
                p.user_id,
                p.caption,
                p.image_url,
                p.created_at,

                u.name AS user_name,
                u.email AS user_email

            FROM posts p

            JOIN users u
                ON u.id = p.user_id

            WHERE p.id = $1

            LIMIT 1
            `,
            [result.rows[0].id]
        );

        return res.status(201).json({
            success: true,
            message: "Post created successfully",
            post: postResult.rows[0]
        });

    } catch (error) {

        console.error(
            "❌ Create post error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to create post"
        });
    }
});


// ======================================================
// HOME FEED
// GET /api/posts/feed
// ======================================================

router.get("/feed", async (req, res) => {
    try {

        const page = Math.max(
            parseInt(req.query.page, 10) || 1,
            1
        );

        const limit = Math.min(
            Math.max(
                parseInt(req.query.limit, 10) || 10,
                1
            ),
            50
        );

        const offset = (page - 1) * limit;

        // --------------------------------------------------
        // GET POSTS
        // --------------------------------------------------

        const result = await pool.query(
            `
            SELECT
                p.id,
                p.user_id,
                p.caption,
                p.image_url,
                p.created_at,

                u.name AS user_name,
                u.email AS user_email

            FROM posts p

            JOIN users u
                ON u.id = p.user_id

            ORDER BY
                p.created_at DESC

            LIMIT $1
            OFFSET $2
            `,
            [
                limit,
                offset
            ]
        );

        return res.json({
            success: true,
            page,
            limit,
            posts: result.rows
        });

    } catch (error) {

        console.error(
            "❌ Feed error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load feed"
        });
    }
});


// ======================================================
// GET SINGLE POST
// GET /api/posts/:id
// ======================================================

router.get("/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                p.id,
                p.user_id,
                p.caption,
                p.image_url,
                p.created_at,

                u.name AS user_name,
                u.email AS user_email

            FROM posts p

            JOIN users u
                ON u.id = p.user_id

            WHERE p.id = $1

            LIMIT 1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        return res.json({
            success: true,
            post: result.rows[0]
        });

    } catch (error) {

        console.error(
            "❌ Get post error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load post"
        });
    }
});


// ======================================================
// DELETE POST
// DELETE /api/posts/:id
// ======================================================

router.delete("/:id", authMiddleware, async (req, res) => {
    try {

        const userId = req.user.id;
        const { id } = req.params;

        // --------------------------------------------------
        // DELETE ONLY IF USER OWNS POST
        // --------------------------------------------------

        const result = await pool.query(
            `
            DELETE FROM posts

            WHERE id = $1
              AND user_id = $2

            RETURNING id
            `,
            [
                id,
                userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post not found or you do not own this post"
            });
        }

        return res.json({
            success: true,
            message: "Post deleted successfully",
            post_id: result.rows[0].id
        });

    } catch (error) {

        console.error(
            "❌ Delete post error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to delete post"
        });
    }
});


module.exports = router;
