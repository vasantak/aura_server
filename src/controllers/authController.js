import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/token.js";

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // set true in prod (HTTPS)
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
};

// Register
export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, phonenumber, password, role } = req.body;

        if (!firstName || !lastName || !email || !phonenumber || !password) return res.status(400).json({ message: "Missing fields" });

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: "Email already in use" });

        const existingPhoneNumber = await User.findOne({ phonenumber });
        if (existingPhoneNumber) return res.status(400).json({ message: "Phone number already in use" });

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        const name = `${firstName} ${lastName}`;
        const user = await User.create({ name, firstName, lastName, email, phonenumber, password: hashed, role });
        const accessToken = generateAccessToken({ id: user._id, role: user.role });
        const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("jid", refreshToken, COOKIE_OPTIONS);
        res.status(201).json({
            message: "Registered",
            user: { id: user._id, name: user.name, email: user.email, phonenumber: user.phonenumber, role: user.role },
            accessToken
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Login
export const login = async (req, res) => {
    console.log('login')
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Missing fields" });

        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: "Invalid credentials" });
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(400).json({ message: "Invalid Password" });

        const accessToken = generateAccessToken({ id: user._id, role: user.role });
        const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("jid", refreshToken, COOKIE_OPTIONS);
        res.json({
            message: "Logged in",
            accessToken,
            refreshToken,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Login
export const getloginUsers = async (req, res) => {
    try {
        const users = await User.find()
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Refresh token
export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.jid;
        if (!token) return res.status(401).json({ message: "No refresh token" });

        // verify token
        let payload;
        try {
            payload = verifyRefreshToken(token);
        } catch (err) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const user = await User.findById(payload.id);
        if (!user || user.refreshToken !== token) return res.status(403).json({ message: "Invalid refresh token" });

        // issue new tokens
        const accessToken = generateAccessToken({ id: user._id, role: user.role });
        const newRefreshToken = generateRefreshToken({ id: user._id, role: user.role });

        user.refreshToken = newRefreshToken;
        await user.save();

        res.cookie("jid", newRefreshToken, COOKIE_OPTIONS);
        res.json({ accessToken });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Logout
export const logout = async (req, res) => {
    try {
        const token = req.cookies.jid;
        if (token) {
            // invalidate refresh token in DB
            const payload = (() => {
                try { return verifyRefreshToken(token); } catch { return null; }
            })();

            if (payload) {
                await User.findByIdAndUpdate(payload.id, { $unset: { refreshToken: "" } });
            }
        }
        res.clearCookie("jid", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
        res.json({ message: "Logged out" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Request password reset (returns token for testing)
export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "No user with that email" });

        // create reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashed = crypto.createHash("sha256").update(resetToken).digest("hex");
        user.resetPasswordToken = hashed;
        user.resetPasswordExpires = Date.now() + 1000 * 60 * 60; // 1 hour
        await user.save();

        // In real app: email resetToken to user (link containing token)
        // For testing we return the raw resetToken to use in reset endpoint
        res.json({ message: "Password reset token created", resetToken });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Reset password
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ message: "Missing fields" });

        const hashed = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOne({
            resetPasswordToken: hashed,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: "Invalid or expired token" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Password reset success" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
