

import File from "../models/File.js";

export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const fileDoc = await File.create({
            originalName: req.file.originalname,
            fileName: req.file.filename,
            path: req.file.path,
            mimeType: req.file.mimetype,
            size: req.file.size,
            uploadedBy: req.user?._id, // optional auth
        });

        res.status(201).json({
            message: "File uploaded successfully",
            file: fileDoc,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
