
import express from 'express';
//import { upload } from "../middleware/fileUploadMiddleware.js";
//import { authenticate, authorize } from "../middleware/authMiddleware.js";

//import * as fileCntrl from '../controllers/file.controller.js';

import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
import { Readable } from "stream";
import upload from "../middleware/upload.js";


const router = express.Router();


// ─── UPLOAD FILE ─────────────────────────────────────────
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: "uploads" });

        const filename = `${Date.now()}-${req.file.originalname}`;

        // Convert buffer to readable stream
        const readableStream = Readable.from(req.file.buffer);

        const uploadStream = bucket.openUploadStream(filename, {
            metadata: { mimetype: req.file.mimetype },
        });

        readableStream.pipe(uploadStream);

        uploadStream.on("finish", () => {
            res.status(201).json({
                message: "File uploaded successfully ✅",
                file: {
                    id: uploadStream.id,
                    filename: filename,
                    size: req.file.size,
                    mimetype: req.file.mimetype,
                },
            });
        });

        uploadStream.on("error", (err) => {
            res.status(500).json({ message: "Upload failed", error: err.message });
        });

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
// router.get("/:filename", async (req, res) => {
//     try {
//         const db = mongoose.connection.db;
//         const bucket = new GridFSBucket(db, { bucketName: "uploads" });

//         const files = await bucket.find({ filename: req.params.filename }).toArray();
//         if (!files.length) return res.status(404).json({ message: "File not found" });

//         res.set("Content-Type", files[0].metadata?.mimetype || "application/octet-stream");
//         res.set("Content-Disposition", `inline; filename="${files[0].filename}"`);

//         bucket.openDownloadStreamByName(req.params.filename).pipe(res);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });


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



// router.post(
//     "/upload",
//     authenticate,           // optional
//     upload.single("file"),  // key name = file
//     fileCntrl.uploadFile
// );



export default router;