import express from "express";

import { dummyusers } from "../utils/dummyUserData.js";
import { deleteDummyUserByID, getDummyUserByID } from "../controllers/dummyUserCOntroller.js";

const router = express.Router();

/**
 * @swagger
 * /api/dummyuser/getDummyuser:
 *   get:
 *     summary: Get all dummy users
 *     tags: [Dummy Users]
 *     responses:
 *       200:
 *         description: List of all dummy users
 */

/**
 * @swagger
 * /api/dummyuser/getDummyuserById:
 *   post:
 *     summary: Get dummy user by ID
 *     tags: [Dummy Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dummy user data
 */

/**
 * @swagger
 * /api/dummyuser/deleteDummyuserById:
 *   post:
 *     summary: Delete dummy user by ID
 *     tags: [Dummy Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */

router.get("/getDummyuser", (req, res) => {
    console.log("Dummy Users:", dummyusers);
    res.json({ users: dummyusers });
});

router.post("/getDummyuserById", getDummyUserByID);

router.post("/deleteDummyuserById", deleteDummyUserByID);


export default router;