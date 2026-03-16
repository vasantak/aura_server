
import express from 'express';
import { upload } from "../middleware/fileUploadMiddleware.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

import * as fileCntrl from '../controllers/file.controller.js';




const router = express.Router();




router.post(
    "/upload",
    authenticate,           // optional
    upload.single("file"),  // key name = file
    fileCntrl.uploadFile
);

export default router;