import { Server } from "socket.io";
import { chatHandler } from "../sktcontrollers/socketController.js";
const onlineUsers = new Map();

export const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "*",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    // io.on("connection", (socket) => {
    //     console.log("🔌 Socket connected:", socket.id);

    //     // Initialize specific handlers
    //     chatHandler(io, socket);

    //     socket.on("disconnect", () => {
    //         console.log("❌ Socket disconnected:", socket.id);
    //     });
    // });

    io.on("connection", (socket) => {
        // 1. Identify the user
        // You should pass userId in the connection query from frontend
        const userId = socket.handshake.query.userId;

        if (userId && userId !== "undefined") {
            onlineUsers.set(userId, socket.id);
            console.log(`✅ User ${userId} is online`);

            // 2. Broadcast to everyone that a new user is online
            io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
        }

        // Initialize existing handlers
        chatHandler(io, socket, onlineUsers);

        socket.on("disconnect", () => {
            if (userId) {
                onlineUsers.delete(userId);
                console.log(`❌ User ${userId} went offline`);

                // 3. Broadcast updated online list
                io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
            }
        });
    });

    return io;
};