const express = require("express");

const { pool } = require("../config/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();


// ==========================================
// SEND MESSAGE
// ==========================================

router.post("/", requireAuth, async (req, res) => {
    try {
        const {
            receiver_id,
            content
        } = req.body;

        if (!receiver_id || !content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Receiver and message are required"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO messages
                (sender_id, receiver_id, content)
            VALUES
                ($1, $2, $3)
            RETURNING *
            `,
            [
                req.user.id,
                receiver_id,
                content.trim()
            ]
        );

        res.status(201).json({
            success: true,
            message: result.rows[0]
        });

    } catch (error) {
        console.error("Send message error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to send message"
        });
    }
});


// ==========================================
// INBOX
// ==========================================

router.get("/", requireAuth, async (req, res) => {
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

            ORDER BY m.created_at DESC
            `,
            [req.user.id]
        );

        res.json({
            success: true,
            messages: result.rows
        });

    } catch (error) {
        console.error("Inbox error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load inbox"
        });
    }
});


module.exports = router;
