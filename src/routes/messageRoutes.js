import express, { Router } from 'express';
import Message from "../models/Chat.js"
const router = Router();

router.get("/:roomId", async (req, res) => {
    const RoomId = req.params.roomId;

    if (!RoomId) {
        return res.json({ message: "No Message" });
    }

    const messages = await Message.find({ roomId: RoomId })
        .sort({ createdAt: 1 });

    const now = new Date();

    // Normalize today and yesterday to midnight
    const toMidnight = d =>
        new Date(Date.UTC(d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate()));

    const today = toMidnight(new Date());
    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);

    const grouped = messages.reduce((acc, message) => {
        const msgDay = toMidnight(new Date(message.createdAt));

        let label;

        if (msgDay.getTime() === today.getTime()) {
            label = "Today";
        } else if (msgDay.getTime() === yesterday.getTime()) {
            label = "Yesterday";
        } else {
            // use locale to avoid ambiguous UTC conversions when serializing
            label = msgDay.toLocaleDateString();
        }

        if (!acc[label]) acc[label] = [];
        acc[label].push(message);

        return acc;
    }, {});

    res.json(grouped);
});

export default router;