
import express from 'express';
//import { upload } from "../middleware/fileUploadMiddleware.js";
//import { authenticate, authorize } from "../middleware/authMiddleware.js";

//import * as fileCntrl from '../controllers/file.controller.js';

import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
import { Readable } from "stream";
import upload from "../middleware/upload.js";
import Post from "../models/MyPost.js";
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// ────────────────────────────────────────────────────────────
// 🔴 POST ROUTES (MUST BE BEFORE GET :filename to avoid conflicts)
// ────────────────────────────────────────────────────────────

// POST /api/posts/upload
router.post("/upload", upload.array("images", 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0)
            return res.status(400).json({ message: "No files uploaded" });

        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: "uploads" });
        const filenames = [];

        for (const file of req.files) {
            const filename = `${Date.now()}-${file.originalname}`;
            const readable = Readable.from(file.buffer);

            const uploadStream = bucket.openUploadStream(filename, {
                metadata: { mimetype: file.mimetype },
            });

            await new Promise((resolve, reject) => {
                readable.pipe(uploadStream);
                uploadStream.on("finish", resolve);
                uploadStream.on("error", reject);
            });

            filenames.push(filename);
        }

        res.status(201).json({
            message: "Uploaded successfully ✅",
            filenames,                              // ["123-a.png", "456-b.png"]
            single: filenames[0],                   // "123-a.png" if single
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ────────────────────────────────────────────────────────────
// 🟢 GET SPECIFIC ROUTES (BEFORE generic /:filename)
// ────────────────────────────────────────────────────────────

// GET /api/posts/my-posts — only logged in user's posts
router.get("/my-posts", authenticate, async (req, res) => {
    try {
        const posts = await Post.find({ userId: req.user.id }) // ✅ filter by logged in user
            .sort({ createdAt: -1 });

        const postsWithUrls = posts.map((post) => ({
            ...post.toObject(),
            images: post.images.map(
                (filename) => `${process.env.CLIENT_URL}/api/Files/${filename}`
            ),
        }));

        res.json(postsWithUrls);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/posts/home — everyone's posts
router.get("/home", async (req, res) => {
    try {
        const posts = await Post.find() // ✅ no filter
            .populate("userId", "name avatar")
            .sort({ createdAt: -1 });

        const postsWithUrls = posts.map((post) => ({
            ...post.toObject(),
            images: post.images.map(
                (filename) => `${process.env.CLIENT_URL}/api/Files/${filename}`
            ),
        }));

        res.json(postsWithUrls);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/:filename", async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: "uploads" });

        const files = await bucket.find({ filename: req.params.filename }).toArray();
        if (!files.length) return res.status(404).json({ message: "File not found" });

        const file = files[0];

        // ✅ Log to see what metadata looks like
        console.log("File metadata:", file.metadata);
        console.log("File:", file);

        // ✅ Detect mimetype from filename if metadata is missing
        const ext = file.filename.split(".").pop().toLowerCase();
        const mimeMap = {
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            gif: "image/gif",
            pdf: "application/pdf",
            webp: "image/webp",
        };

        const contentType = file.metadata?.mimetype
            || mimeMap[ext]
            || "application/octet-stream";

        res.set("Content-Type", contentType);
        res.set("Content-Disposition", `inline; filename="${file.filename}"`);
        res.set("Cross-Origin-Resource-Policy", "cross-origin"); // ✅ Fix CORS for blobs

        bucket.openDownloadStreamByName(req.params.filename).pipe(res);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET ALL FILES ────────────────────────────────────────
router.get("/", async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: "uploads" });

        const files = await bucket.find().toArray();
        if (!files.length) return res.status(404).json({ message: "No files found" });

        res.json(files.map((f) => ({
            id: f._id,
            filename: f.filename,
            size: f.length,
            mimetype: f.metadata?.mimetype,
            uploadDate: f.uploadDate,
        })));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET FILE BY FILENAME ─────────────────────────────────


// ─── DELETE FILE ──────────────────────────────────────────
router.delete("/:id", async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: "uploads" });

        await bucket.delete(new mongoose.Types.ObjectId(req.params.id));
        res.json({ message: "File deleted successfully 🗑️" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ────────────────────────────────────────────────────────────
// GET GENERIC ROUTE (MUST BE LAST - matches everything)
// ────────────────────────────────────────────────────────────

// GET /api/posts
router.get("/", async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("userId", "name avatar") // get user info
            .sort({ createdAt: -1 });          // latest first

        // ✅ Convert filenames to full URLs
        const postsWithUrls = posts.map((post) => ({
            ...post.toObject(),
            images: post.images.map(
                (filename) => `${process.env.APP_URL}/api/Files/${filename}`
            ),
        }));

        res.json(postsWithUrls);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// router.post(
//     "/upload",
//     authenticate,           // optional
//     upload.single("file"),  // key name = file
//     fileCntrl.uploadFile
// );



export default router;