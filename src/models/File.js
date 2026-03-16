import mongoose, { model, Schema } from "mongoose";

const fileShema = new Schema(
    {
        originalName: String,
        fileName: String,
        path: String,
        mimeType: String,
        size: Number,
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
)

export default model("File", fileShema)