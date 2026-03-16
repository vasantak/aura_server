import Message from "../models/Chat.js";

// We export a function that takes 'io' and 'socket'
export const chatHandler = (io, socket) => {

    // Join Room logic
    const joinRoom = ({ roomId }) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    };

    // Send Message logic
    const sendMessage = async ({ roomId, message }) => {
        try {
            const savedMessage = await Message.create({
                roomId,
                senderId: message.senderId,
                text: message.text,
            });

            io.to(roomId).emit("receiveMessage", savedMessage);
        } catch (err) {
            console.error("Socket Message Save Error:", err);
        }
    };

    // Typing logic
    const handleTyping = ({ roomId, isTyping, senderId }) => {
        socket.to(roomId).emit("userTyping", { isTyping, senderId });
    };

    // Mapping the events to the functions
    socket.on("joinRoom", joinRoom);
    socket.on("sendMessage", sendMessage);
    socket.on("typing", handleTyping);
};