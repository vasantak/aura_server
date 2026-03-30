import multer from "multer";


// const storage = new GridFsStorage({
//     db: () => mongoose.connection,   // ✅ reuses existing connection
//     file: (req, file) => {
//         return {
//             bucketName: "uploads",
//             filename: `${Date.now()}-${file.originalname}`,
//         };
//     },
// });

// const fileFilter = (req, file, cb) => {
//     const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
//     if (allowedTypes.includes(file.mimetype)) {
//         cb(null, true);
//     } else {
//         cb(new Error("File type not allowed"), false);
//     }
// };

// const upload = multer({ storage, fileFilter });

// module.exports = upload;

// Store file in memory buffer temporarily
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    allowedTypes.includes(file.mimetype)
        ? cb(null, true)
        : cb(new Error("File type not allowed"), false);
};

const upload = multer({ storage, fileFilter });

export default upload;