const express = require("express");

const { pool } = require("../config/database");
const authMiddleware = require("../middleware/auth");

const router = express.Router();


// ======================================================
// LIKE / UNLIKE POST
// POST /api/interactions/posts/:postId/like
// ======================================================

router.post(
    "/posts/:postId/like",
    authMiddleware,
    async (req, res) => {
        try {

            const userId = req.user.id;
            const { postId } = req.params;

            // Check post
            const post = await pool.query(
                `
                SELECT id
                FROM posts
                WHERE id = $1
                LIMIT 1
                `,
                [postId]
            );

            if (post.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found"
                });
            }

            // Check existing like
            const existingLike = await pool.query(
                `
                SELECT id
                FROM post_likes
                WHERE post_id = $1
                AND user_id = $2
                LIMIT 1
                `,
                [postId, userId]
            );

            // Unlike
            if (existingLike.rows.length > 0) {

                await pool.query(
                    `
                    DELETE FROM post_likes
                    WHERE post_id = $1
                    AND user_id = $2
                    `,
                    [postId, userId]
                );

                const count = await pool.query(
                    `
                    SELECT COUNT(*)::int AS count
                    FROM post_likes
                    WHERE post_id = $1
                    `,
                    [postId]
                );

                return res.json({
                    success: true,
                    liked: false,
                    likes_count: count.rows[0].count
                });
            }

            // Like
            await pool.query(
                `
                INSERT INTO post_likes
                    (post_id, user_id)
                VALUES
                    ($1, $2)
                ON CONFLICT
                    (post_id, user_id)
                DO NOTHING
                `,
                [postId, userId]
            );

            const count = await pool.query(
                `
                SELECT COUNT(*)::int AS count
                FROM post_likes
                WHERE post_id = $1
                `,
                [postId]
            );

            return res.json({
                success: true,
                liked: true,
                likes_count: count.rows[0].count
            });

        } catch (error) {

            console.error(
                "❌ Like error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to like post"
            });
        }
    }
);


// ======================================================
// FAVORITE / UNFAVORITE POST
// POST /api/interactions/posts/:postId/favorite
// ======================================================

router.post(
    "/posts/:postId/favorite",
    authMiddleware,
    async (req, res) => {
        try {

            const userId = req.user.id;
            const { postId } = req.params;

            // Check post
            const post = await pool.query(
                `
                SELECT id
                FROM posts
                WHERE id = $1
                LIMIT 1
                `,
                [postId]
            );

            if (post.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found"
                });
            }

            // Check favorite
            const existingFavorite = await pool.query(
                `
                SELECT id
                FROM post_favorites
                WHERE post_id = $1
                AND user_id = $2
                LIMIT 1
                `,
                [postId, userId]
            );

            // Remove favorite
            if (existingFavorite.rows.length > 0) {

                await pool.query(
                    `
                    DELETE FROM post_favorites
                    WHERE post_id = $1
                    AND user_id = $2
                    `,
                    [postId, userId]
                );

                const count = await pool.query(
                    `
                    SELECT COUNT(*)::int AS count
                    FROM post_favorites
                    WHERE post_id = $1
                    `,
                    [postId]
                );

                return res.json({
                    success: true,
                    favorited: false,
                    favorites_count: count.rows[0].count
                });
            }

            // Add favorite
            await pool.query(
                `
                INSERT INTO post_favorites
                    (post_id, user_id)
                VALUES
                    ($1, $2)
                ON CONFLICT
                    (post_id, user_id)
                DO NOTHING
                `,
                [postId, userId]
            );

            const count = await pool.query(
                `
                SELECT COUNT(*)::int AS count
                FROM post_favorites
                WHERE post_id = $1
                `,
                [postId]
            );

            return res.json({
                success: true,
                favorited: true,
                favorites_count: count.rows[0].count
            });

        } catch (error) {

            console.error(
                "❌ Favorite error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to favorite post"
            });
        }
    }
);


// ======================================================
// ADD COMMENT
// POST /api/interactions/posts/:postId/comments
// ======================================================

router.post(
    "/posts/:postId/comments",
    authMiddleware,
    async (req, res) => {
        try {

            const userId = req.user.id;
            const { postId } = req.params;
            const { text } = req.body || {};

            if (
                !text ||
                typeof text !== "string" ||
                !text.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Comment text is required"
                });
            }

            const cleanText = text.trim();

            if (cleanText.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: "Comment cannot exceed 1000 characters"
                });
            }

            const post = await pool.query(
                `
                SELECT id
                FROM posts
                WHERE id = $1
                LIMIT 1
                `,
                [postId]
            );

            if (post.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found"
                });
            }

            const result = await pool.query(
                `
                INSERT INTO comments
                    (
                        post_id,
                        user_id,
                        text
                    )
                VALUES
                    ($1, $2, $3)
                RETURNING
                    id,
                    post_id,
                    user_id,
                    text,
                    created_at
                `,
                [
                    postId,
                    userId,
                    cleanText
                ]
            );

            return res.status(201).json({
                success: true,
                message: "Comment added",
                comment: result.rows[0]
            });

        } catch (error) {

            console.error(
                "❌ Comment error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to add comment"
            });
        }
    }
);


// ======================================================
// GET COMMENTS
// GET /api/interactions/posts/:postId/comments
// ======================================================

router.get(
    "/posts/:postId/comments",
    async (req, res) => {
        try {

            const { postId } = req.params;

            const result = await pool.query(
                `
                SELECT
                    c.id,
                    c.post_id,
                    c.user_id,
                    c.text,
                    c.created_at,
                    u.name AS user_name

                FROM comments c

                JOIN users u
                    ON u.id = c.user_id

                WHERE c.post_id = $1

                ORDER BY
                    c.created_at ASC
                `,
                [postId]
            );

            return res.json({
                success: true,
                comments: result.rows
            });

        } catch (error) {

            console.error(
                "❌ Get comments error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load comments"
            });
        }
    }
);


// ======================================================
// GET POST INTERACTION STATUS
// GET /api/interactions/posts/:postId
// ======================================================

router.get(
    "/posts/:postId",
    authMiddleware,
    async (req, res) => {
        try {

            const userId = req.user.id;
            const { postId } = req.params;

            const post = await pool.query(
                `
                SELECT id
                FROM posts
                WHERE id = $1
                LIMIT 1
                `,
                [postId]
            );

            if (post.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found"
                });
            }

            const result = await pool.query(
                `
                SELECT
                    (
                        SELECT COUNT(*)
                        FROM post_likes
                        WHERE post_id = $1
                    )::int AS likes_count,

                    (
                        SELECT COUNT(*)
                        FROM post_favorites
                        WHERE post_id = $1
                    )::int AS favorites_count,

                    (
                        SELECT COUNT(*)
                        FROM comments
                        WHERE post_id = $1
                    )::int AS comments_count,

                    EXISTS (
                        SELECT 1
                        FROM post_likes
                        WHERE post_id = $1
                        AND user_id = $2
                    ) AS liked,

                    EXISTS (
                        SELECT 1
                        FROM post_favorites
                        WHERE post_id = $1
                        AND user_id = $2
                    ) AS favorited
                `,
                [
                    postId,
                    userId
                ]
            );

            return res.json({
                success: true,
                interaction: result.rows[0]
            });

        } catch (error) {

            console.error(
                "❌ Interaction status error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load interaction status"
            });
        }
    }
);


module.exports = router;
