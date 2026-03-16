import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            index: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        read: {                     // ✅ Read status
            type: Boolean,
            default: false
        }
    },
    { timestamps: true } // 👈 createdAt, updatedAt
);

export default mongoose.model("Message", messageSchema);
