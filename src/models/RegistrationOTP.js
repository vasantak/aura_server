import { Schema, model } from "mongoose";

const registrationOTPSchema = new Schema({
    email: { type: String, required: true, lowercase: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });


export default model("RegistrationOTP", registrationOTPSchema);