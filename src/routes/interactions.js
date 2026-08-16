const express = require("express");

const { pool } = require("../config/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();


// ==========================================
// LIKE / UNLIKE
// ==========================================

router.post("/posts/:postId/like", requireAuth, async (req, res) => {
    try {
        const existing = await pool.query(
            `
            SELECT id
            FROM post_likes
            WHERE post_id = $1
            AND user_id = $2
            `,
            [req.params.postId, req.user.id]
        );

        if (existing.rows.length > 0) {

            await pool.query(
                `
                DELETE FROM post_likes
                WHERE post_id = $1
                AND user_id = $2
                `,
                [req.params.postId, req.user.id]
            );

            return res.json({
                success: true,
                liked: false
            });
        }

        await pool.query(
            `
            INSERT INTO post_likes
                (post_id, user_id)
            VALUES
                ($1, $2)
            `,
            [req.params.postId, req.user.id]
        );

        res.json({
            success: true,
            liked: true
        });

    } catch (error) {
        console.error("Like error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update like"
        });
    }
});


// ==========================================
// FAVORITE / UNFAVORITE
// ==========================================

router.post("/posts/:postId/favorite", requireAuth, async (req, res) => {
    try {
        const existing = await pool.query(
            `
            SELECT id
            FROM post_favorites
            WHERE post_id = $1
            AND user_id = $2
            `,
            [req.params.postId, req.user.id]
        );

        if (existing.rows.length > 0) {

            await pool.query(
                `
                DELETE FROM post_favorites
                WHERE post_id = $1
                AND user_id = $2
                `,
                [req.params.postId, req.user.id]
            );

            return res.json({
                success: true,
                favorited: false
            });
        }

        await pool.query(
            `
            INSERT INTO post_favorites
                (post_id, user_id)
            VALUES
                ($1, $2)
            `,
            [req.params.postId, req.user.id]
        );

        res.json({
            success: true,
            favorited: true
        });

    } catch (error) {
        console.error("Favorite error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update favorite"
        });
    }
});


// ==========================================
// SHARE
// ==========================================

router.post("/posts/:postId/share", requireAuth, async (req, res) => {
    try {
        await pool.query(
            `
            INSERT INTO post_shares
                (post_id, user_id)
            VALUES
                ($1, $2)
            `,
            [
                req.params.postId,
                req.user.id
            ]
        );

        res.json({
            success: true,
            message: "Post shared successfully"
        });

    } catch (error) {
        console.error("Share error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to share post"
        });
    }
});


// ==========================================
// COMMENT
// ==========================================

router.post("/posts/:postId/comments", requireAuth, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot be empty"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO comments
                (post_id, user_id, content)
            VALUES
                ($1, $2, $3)
            RETURNING *
            `,
            [
                req.params.postId,
                req.user.id,
                content.trim()
            ]
        );

        res.status(201).json({
            success: true,
            comment: result.rows[0]
        });

    } catch (error) {
        console.error("Comment error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to add comment"
        });
    }
});


module.exports = router;
