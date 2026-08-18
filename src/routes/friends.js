const express = require("express");

const { pool } = require("../config/database");
const authMiddleware = require("../middleware/auth");

const router = express.Router();


// ======================================================
// FOLLOW / UNFOLLOW USER
// POST /api/friends/:userId/follow
// ======================================================

router.post(
    "/:userId/follow",
    authMiddleware,
    async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const targetUserId = req.params.userId;

            if (String(currentUserId) === String(targetUserId)) {
                return res.status(400).json({
                    success: false,
                    message: "You cannot follow yourself"
                });
            }

            // Check target user
            const targetUser = await pool.query(
                `
                SELECT id, name
                FROM users
                WHERE id = $1
                LIMIT 1
                `,
                [targetUserId]
            );

            if (targetUser.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Check existing follow
            const existingFollow = await pool.query(
                `
                SELECT id
                FROM follows
                WHERE follower_id = $1
                AND following_id = $2
                LIMIT 1
                `,
                [
                    currentUserId,
                    targetUserId
                ]
            );

            // UNFOLLOW
            if (existingFollow.rows.length > 0) {

                await pool.query(
                    `
                    DELETE FROM follows
                    WHERE follower_id = $1
                    AND following_id = $2
                    `,
                    [
                        currentUserId,
                        targetUserId
                    ]
                );

                return res.json({
                    success: true,
                    following: false,
                    message: "Unfollowed successfully"
                });
            }

            // FOLLOW
            await pool.query(
                `
                INSERT INTO follows
                    (
                        follower_id,
                        following_id
                    )
                VALUES
                    ($1, $2)
                ON CONFLICT
                    (follower_id, following_id)
                DO NOTHING
                `,
                [
                    currentUserId,
                    targetUserId
                ]
            );

            return res.json({
                success: true,
                following: true,
                message: "Followed successfully"
            });

        } catch (error) {

            console.error(
                "❌ Follow error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to follow user"
            });
        }
    }
);


// ======================================================
// FOLLOW STATUS
// GET /api/friends/:userId/status
// ======================================================

router.get(
    "/:userId/status",
    authMiddleware,
    async (req, res) => {
        try {

            const currentUserId = req.user.id;
            const targetUserId = req.params.userId;

            const result = await pool.query(
                `
                SELECT EXISTS (
                    SELECT 1
                    FROM follows
                    WHERE follower_id = $1
                    AND following_id = $2
                ) AS following
                `,
                [
                    currentUserId,
                    targetUserId
                ]
            );

            return res.json({
                success: true,
                following: result.rows[0].following
            });

        } catch (error) {

            console.error(
                "❌ Follow status error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to check follow status"
            });
        }
    }
);


// ======================================================
// FOLLOWERS
// GET /api/friends/:userId/followers
// ======================================================

router.get(
    "/:userId/followers",
    async (req, res) => {
        try {

            const userId = req.params.userId;

            const result = await pool.query(
                `
                SELECT
                    u.id,
                    u.name,
                    u.email,
                    f.created_at AS followed_at

                FROM follows f

                JOIN users u
                    ON u.id = f.follower_id

                WHERE f.following_id = $1

                ORDER BY
                    f.created_at DESC
                `,
                [userId]
            );

            return res.json({
                success: true,
                count: result.rows.length,
                followers: result.rows
            });

        } catch (error) {

            console.error(
                "❌ Followers error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load followers"
            });
        }
    }
);


// ======================================================
// FOLLOWING
// GET /api/friends/:userId/following
// ======================================================

router.get(
    "/:userId/following",
    async (req, res) => {
        try {

            const userId = req.params.userId;

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

                ORDER BY
                    f.created_at DESC
                `,
                [userId]
            );

            return res.json({
                success: true,
                count: result.rows.length,
                following: result.rows
            });

        } catch (error) {

            console.error(
                "❌ Following error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load following"
            });
        }
    }
);


// ======================================================
// MY FOLLOWERS
// GET /api/friends/followers/me
// ======================================================

router.get(
    "/followers/me",
    authMiddleware,
    async (req, res) => {
        try {

            const userId = req.user.id;

            const result = await pool.query(
                `
                SELECT
                    u.id,
                    u.name,
                    u.email,
                    f.created_at AS followed_at

                FROM follows f

                JOIN users u
                    ON u.id = f.follower_id

                WHERE f.following_id = $1

                ORDER BY
                    f.created_at DESC
                `,
                [userId]
            );

            return res.json({
                success: true,
                count: result.rows.length,
                followers: result.rows
            });

        } catch (error) {

            console.error(
                "❌ My followers error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load your followers"
            });
        }
    }
);


// ======================================================
// MY FOLLOWING
// GET /api/friends/following/me
// ======================================================

router.get(
    "/following/me",
    authMiddleware,
    async (req, res) => {
        try {

            const userId = req.user.id;

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

                ORDER BY
                    f.created_at DESC
                `,
                [userId]
            );

            return res.json({
                success: true,
                count: result.rows.length,
                following: result.rows
            });

        } catch (error) {

            console.error(
                "❌ My following error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load who you follow"
            });
        }
    }
);


module.exports = router;
