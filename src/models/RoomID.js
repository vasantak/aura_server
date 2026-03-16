import mongoose from "mongoose";



const roomSchema = new mongoose.Schema({
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

export default mongoose.model("Room", roomSchema);
