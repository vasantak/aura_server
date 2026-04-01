// models/Post.js
import mongoose from "mongoose";
// const PostSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     caption: { type: String },
//     images: [{ type: String }], // ✅ array of filenames from GridFS
//     createdAt: { type: Date, default: Date.now },
// });

// export default mongoose.model("Post", PostSchema);


const PostSchema = new mongoose.Schema({
    // Who created the post
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // The type determines which fields will be used
    type: {
        type: String,
        enum: ['PHOTO', 'STATUS', 'MUSIC', 'MEMORY'],
        required: true,
        default: 'PHOTO'
    },
    // The main text caption or status message
    caption: {
        type: String,
        trim: true
    },
    // Array of image URLs (used for PHOTO and MEMORY)
    images: {
        type: [String],
        default: []
    },
    // Specific metadata for MUSIC type
    musicDetails: {
        track: { type: String },
        artist: { type: String },
        albumArt: { type: String }
    },
    // Specific metadata for MEMORY type
    memoryDetails: {
        location: { type: String },
        dateOccurred: { type: Date }
    },
    // Interaction Data
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    // Tracking
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexing for faster feed loading
PostSchema.index({ createdAt: -1 });

export default mongoose.model('Post', PostSchema);