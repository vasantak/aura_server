
import mongoose from "mongoose";

const chatRequestSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },
    roomId: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model("ChatRequest", chatRequestSchema);
