const express = require("express");

const { pool } = require("../config/database");
const authMiddleware = require("../middleware/auth");

const router = express.Router();


// ======================================================
// SEND MESSAGE
// POST /api/messages
// ======================================================

router.post(
    "/",
    authMiddleware,
    async (req, res) => {

        try {

            const {
                receiver_id,
                content
            } = req.body || {};


            // --------------------------------------------------
            // VALIDATION
            // --------------------------------------------------

            if (
                !receiver_id ||
                !content ||
                typeof content !== "string" ||
                !content.trim()
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Receiver and message are required"
                });

            }


            const cleanContent = content.trim();


            if (cleanContent.length > 5000) {

                return res.status(400).json({
                    success: false,
                    message: "Message cannot exceed 5000 characters"
                });

            }


            // --------------------------------------------------
            // CHECK RECEIVER
            // --------------------------------------------------

            const receiver = await pool.query(
                `
                SELECT id
                FROM users
                WHERE id = $1
                LIMIT 1
                `,
                [receiver_id]
            );


            if (receiver.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Receiver not found"
                });

            }


            // --------------------------------------------------
            // SEND MESSAGE
            // --------------------------------------------------

            const result = await pool.query(
                `
                INSERT INTO messages
                    (
                        sender_id,
                        receiver_id,
                        content
                    )
                VALUES
                    ($1, $2, $3)
                RETURNING
                    id,
                    sender_id,
                    receiver_id,
                    content,
                    is_read,
                    created_at
                `,
                [
                    req.user.id,
                    receiver_id,
                    cleanContent
                ]
            );


            return res.status(201).json({
                success: true,
                message: result.rows[0]
            });


        } catch (error) {

            console.error(
                "❌ Send message error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to send message"
            });

        }

    }
);


// ======================================================
// INBOX
// GET /api/messages
// ======================================================

router.get(
    "/",
    authMiddleware,
    async (req, res) => {

        try {

            const result = await pool.query(
                `
                SELECT
                    m.id,
                    m.content,
                    m.is_read,
                    m.created_at,

                    u.id AS sender_id,
                    u.name AS sender_name

                FROM messages m

                JOIN users u
                    ON u.id = m.sender_id

                WHERE m.receiver_id = $1

                ORDER BY
                    m.created_at DESC
                `,
                [req.user.id]
            );


            return res.json({
                success: true,
                messages: result.rows
            });


        } catch (error) {

            console.error(
                "❌ Inbox error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load inbox"
            });

        }

    }
);


// ======================================================
// MARK MESSAGE AS READ
// PATCH /api/messages/:id/read
// ======================================================

router.patch(
    "/:id/read",
    authMiddleware,
    async (req, res) => {

        try {

            const result = await pool.query(
                `
                UPDATE messages

                SET is_read = TRUE

                WHERE id = $1
                  AND receiver_id = $2

                RETURNING
                    id,
                    is_read
                `,
                [
                    req.params.id,
                    req.user.id
                ]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Message not found"
                });

            }


            return res.json({
                success: true,
                message: result.rows[0]
            });


        } catch (error) {

            console.error(
                "❌ Mark message read error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to update message"
            });

        }

    }
);


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;
