import mongoose from "mongoose";
const assetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true
    },
}, { timestamps: true });

export default mongoose.model("Asset", assetSchema);