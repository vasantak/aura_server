import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phonenumber: { type: Number, required: true, unique: true, },
    password: { type: String, required: true },
    role: { type: String, enum: ["EMPLOYEE", "MANAGER", "ADMIN"], default: "EMPLOYEE" },
    bio: { type: String },
    username: { type: String, unique: true },
    dob: { type: Date },
    gender: { type: String },

    // store a single refresh token (or array if you want multiple devices)
    refreshToken: { type: String },

    // password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // ✅ Chat & Push Notification fields (NOT required during registration)
    fcmToken: { type: String },           // FCM token for push notifications
    socketId: { type: String },           // Current socket connection ID
    isOnline: { type: Boolean, default: false }  // Online status


}, { timestamps: true });

export default mongoose.model("User", userSchema);
