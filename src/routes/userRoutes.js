import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { getallUsers, getMyChatContacts, getMyPendigChatContacts, getMyProfile } from "../controllers/userController.js";
import nodemailer from "nodemailer";
import ChatRequest from "../models/ChatRequestSchema.js";
import RoomID from "../models/RoomID.js";
//import ChatRequest from "../../models/ChatRequest.js";

const router = express.Router();

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/user/admin-only:
 *   get:
 *     summary: Admin only endpoint
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted
 *       403:
 *         description: Forbidden
 */

router.get("/me", authenticate, (req, res) => {
    res.json({ user: req.user });
});


router.get("/myProfile", authenticate, getMyProfile, (req, res) => {
    res.json({ message: "My Profile" });
});

// admin-only example
router.get("/admin-only", authenticate, authorize("admin"), (req, res) => {
    res.json({ message: "Hello admin" });
});
router.get("/allUser", authenticate, getallUsers, (req, res) => {
    res.json({ message: "Hello allUser" });
})



const htmlTemplate = `
<div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px;">
  <div style="max-width: 520px; margin: auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #5f66d0, #5f66d0); padding: 20px; text-align: center; color: white;">
      <h2 style="margin: 0;">New Chat Request 💬</h2>
    </div>

    <!-- Body -->
    <div style="padding: 30px; text-align: center;">
      <h3 style="margin-bottom: 10px; color: #111827;">
        You’ve got a new chat request!
      </h3>

      <p style="color: #6b7280; font-size: 15px; line-height: 1.6;">
        <strong>{SENDER_NAME}</strong> wants to start a conversation with you.
        Click the button below to accept the request and begin chatting.
      </p>

      <!-- Button -->
      <a href="{CHAT_LINK}"
         style="
           display: inline-block;
           margin-top: 20px;
           padding: 12px 24px;
           background: #5f66d0;
           color: white;
           text-decoration: none;
           border-radius: 8px;
           font-weight: bold;
           font-size: 15px;
         ">
        Accept Chat Request 🎉
      </a>

      <p style="margin-top: 25px; font-size: 13px; color: #9ca3af;">
        If you don’t recognize this request, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
      © ${new Date().getFullYear()} YourApp. All rights reserved.
    </div>
  </div>
</div>
`;


router.post("/send-email", authenticate, async (req, res) => {
    try {
        console.log("EMAIL:", process.env.EMAIL);
        console.log("PASS:", process.env.EMAIL_PASSWORD ? "Loaded" : "Missing");

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        const senderName = "Vasanta";
        const chatLink = `http://localhost:5000/api/user/acceptchat-reqest?token=abc123`;

        const html = htmlTemplate
            .replace("{SENDER_NAME}", senderName)
            .replace("{CHAT_LINK}", chatLink);

        const info = await transporter.sendMail({
            from: process.env.EMAIL,
            to: process.env.EMAIL,
            subject: "New Chat Request",
            html
        });

        console.log("Message sent:", info.messageId);
        res.send("Email sent");
    } catch (err) {
        console.error("Email error:", err);
        res.status(500).send(err.message);
    }
});


router.post("/chat-request", authenticate, async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId } = req.body;

        const request = await ChatRequest.create({
            senderId,
            receiverId,
        });
        console.log(request.id);

        // create room
        const room = await RoomID.create({
            users: [request.senderId, request.receiverId],
        });
        // update request
        request.roomId = room._id;
        await request.save();
        res.json({
            message: "Request sent",
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }



    // try {
    //     console.log("EMAIL:", process.env.EMAIL);
    //     console.log("PASS:", process.env.EMAIL_PASSWORD ? "Loaded" : "Missing");

    //     const transporter = nodemailer.createTransport({
    //         host: "smtp.gmail.com",
    //         port: 465,
    //         secure: true,
    //         auth: {
    //             user: process.env.EMAIL,
    //             pass: process.env.EMAIL_PASSWORD
    //         }
    //     });
    //     const senderName = "Vasanta";
    //     const chatLink = `http://localhost:5000/api/user/chat-accept?requestId=${request.id}`;

    //     const html = htmlTemplate
    //         .replace("{SENDER_NAME}", senderName)
    //         .replace("{CHAT_LINK}", chatLink);

    //     const info = await transporter.sendMail({
    //         from: process.env.EMAIL,
    //         to: process.env.EMAIL_TO,
    //         subject: "V-Chat Request",
    //         html
    //     });

    //     console.log("Message sent:", info.messageId);
    //     res.send("Email sent");
    // } catch (err) {
    //     console.error("Email error:", err);
    //     res.status(500).send(err.message);
    // }

    res.json(request);
});


router.get("/chat-accept", async (req, res) => {
    const { requestId, action } = req.query;
    const request = await ChatRequest.findOneAndUpdate(
        { roomId: requestId },
        { status: action },
        { new: true }
    );

    if (!request) {
        return res.send("Invalid or expired request");
    }
    res.send("Chat accepted. You can now start chatting.");
});



router.get("/my-chats-contacts", authenticate, getMyChatContacts);
router.get("/myPending-chatscontacts", authenticate, getMyPendigChatContacts);

export default router;
