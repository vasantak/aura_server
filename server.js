import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import nodemailer from "nodemailer";

import { initSocket } from "./src/sockets/index.js";

import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import assetRoutes from "./src/routes/assetsRouts.js";
//import dummyuserRoutes from "./src/routes/dummuUser.js";
import messageRoutes from "./src/routes/messageRoutes.js";
import leaveRoutes from "./src/routes/leaveRoutes.js";
import fileRoutes from "./src/routes/fileRoutes.js";

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import Message from "./src/models/Chat.js"

dotenv.config();

const app = express();
const server = http.createServer(app);

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));

//app.use(cors({ origin: "*" }));


app.use(express.static("public"));

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/assets", assetRoutes);
//app.use("/api/dummyuser", dummyuserRoutes);
app.use("/api/Leaves", leaveRoutes);
app.use("/api/Files", fileRoutes);
app.use("/api/messages", messageRoutes);


/* ================= SWAGGER ================= */
const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "My Express API",
            version: "1.0.0",
        },
    },
    apis: ["./routes/*.js"],
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* ================= SOCKET.IO ================= */

/* ================= INITIALIZE SOCKET ================= */
// This replaces all your io.on logic
initSocket(server);


// const io = new Server(server, {
//     cors: {
//         origin: process.env.CLIENT_URL || "*",
//         methods: ["GET", "POST"],
//         credentials: true,
//     },
// });

// io.on("connection", (socket) => {
//     console.log("🔌 User connected:", socket.id);

//     socket.on("joinRoom", ({ roomId }) => {
//         socket.join(roomId);
//     });
//     socket.on("sendMessage", async ({ roomId, message }) => {
//         // io.to(roomId).emit("receiveMessage", message);
//         try {
//             // 1️⃣ Save to DB
//             const savedMessage = await Message.create({
//                 roomId,
//                 senderId: message.senderId,
//                 text: message.text,
//             });

//             // 2️⃣ Emit saved message (with createdAt)
//             io.to(roomId).emit("receiveMessage", savedMessage);
//         } catch (err) {
//             console.error("Message save error:", err);
//         }
//     });

//     // Handle typing events
//     socket.on("typing", ({ roomId, isTyping, senderId }) => {
//         //console.log(`Typing in room ${roomId}: ${isTyping} by ${senderId}`);
//         // Broadcast to everyone in the room EXCEPT the sender
//         socket.to(roomId).emit("userTyping", { isTyping, senderId });
//     });

//     socket.on("disconnect", () => {
//         console.log("❌ User disconnected:", socket.id);
//     });
// });



/* ================= START SERVER ================= */
const startServer = async () => {
    await connectDB();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
    });
};

startServer();
