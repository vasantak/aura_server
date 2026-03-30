import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/token.js";
import RegistrationOTP from "../models/RegistrationOTP.js";
import nodemailer from "nodemailer";
import { Resend } from 'resend';


const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // set true in prod (HTTPS)
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
};

// Register
export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, phonenumber, password, role, bio, username, dob, gender } = req.body;

        if (!firstName || !lastName || !email || !phonenumber || !password) return res.status(400).json({ message: "Missing fields" });

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: "Email already in use" });

        const existingPhoneNumber = await User.findOne({ phonenumber });
        if (existingPhoneNumber) return res.status(400).json({ message: "Phone number already in use" });

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        const name = `${firstName} ${lastName}`;
        const user = await User.create({ name, firstName, lastName, email, phonenumber, password: hashed, role, bio, username, dob, gender });
        const accessToken = generateAccessToken({ id: user._id, role: user.role });
        const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("jid", refreshToken, COOKIE_OPTIONS);
        res.status(201).json({
            message: "Registered",
            user: { id: user._id, name: user.name, email: user.email, phonenumber: user.phonenumber, role: user.role, gender: user.gender, dob: user.dob, bio: user.bio, username: user.username },
            accessToken
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Genarate OTP for registration
export const genarateOTPa = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email required" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        //Date.now() + 10 * 1000;// for testing, set to 10 seconds

        // 🔥 Delete old OTP (important)
        await RegistrationOTP.deleteMany({ email });

        await RegistrationOTP.create({ email, otp, expiresAt });

        console.log(`OTP for ${email}: ${otp}`);

        res.json({ message: "OTP sent successfully", otp, expiresAt }); // don't send OTP in real app
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



const htmlTemplate = (OTP_CODE, USER_NAME) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; padding: 40px 10px;">
  <div style="max-width: 500px; margin: auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">

    <!-- Header Area -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px 20px; text-align: center; color: white;">
      <div style="background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 18px; line-height: 60px; margin: 0 auto 20px; font-size: 30px;">
        🔐
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Verification Code</h1>
      <p style="margin-top: 10px; opacity: 0.9; font-size: 14px;">Secure Access Request</p>
    </div>

    <!-- Body Area -->
    <div style="padding: 40px 30px; text-align: center; background-image: radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.03) 0%, transparent 20%);">
      <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
        Hello <strong>${USER_NAME}</strong>,<br>
        Use the code below to verify your identity. This code will expire in <span style="color: #6366f1; font-weight: bold;">10 minutes</span>.
      </p>

      <!-- FANCY OTP DISPLAY -->
      <div style="margin: 30px 0;">
        <div style="display: inline-block; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 16px; padding: 20px 30px;">
            <span style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #1e1b4b; margin-left: 12px;">
                 ${OTP_CODE}
            </span>
        </div>
      </div>

      <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">
        If you didn't request this code, please ignore this email or contact support if you have concerns.
      </p>
    </div>

    <!-- Footer Area -->
    <div style="background: #1e1b4b; padding: 30px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
        Sent with ❤️ from ${process.env.APP_NAME} Team
      </p>
      <div style="margin-top: 15px;">
        <a href="#" style="color: #818cf8; text-decoration: none; font-size: 11px; margin: 0 10px;">Help Center</a>
        <a href="#" style="color: #818cf8; text-decoration: none; font-size: 11px; margin: 0 10px;">Privacy Policy</a>
      </div>
      
      <p style="margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: center;">
        © ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.
        </p>
    </div>
  </div>
</div>
`;

//const resend = new Resend(process.env.RESEND_API_KEY);

export const genarateOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email required" });
        }
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Email already in use" });
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // ✅ 10 minutes
        const resend = new Resend(process.env.RESEND_API_KEY);
        // const resend = new Resend('re_RTbWYCAV_5ZVRmoUvZ7vMf1dP4Cjee2n9');

        await RegistrationOTP.deleteMany({ email });
        await RegistrationOTP.create({ email, otp, expiresAt });

        const { error } = await resend.emails.send({
            from: process.env.DOMAIN_NAME,           // ✅ your verified domain
            to: email,
            subject: `AURA verification code - ${otp}`,
            html: htmlTemplate(otp, email.split("@")[0])
        });

        if (error) {
            console.error('Resend error:', error);
            return res.status(500).json({ message: 'Failed to send OTP email' });
        }

        return res.json({ message: "OTP sent successfully", expiresAt }); // ✅ single response, no otp exposed

    } catch (err) {
        console.error("Email error:", err);
        res.status(500).json({ message: err.message });
    }
};

export const genarateOTPZ = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email required" });
        }

        const existing = await User.findOne({ email });
        // if (existing) {
        //     return res.status(400).json({ message: "Email already in use" });
        // }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = Date.now() + 10 * 1000;//new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        //Date.now() + 10 * 1000;// for testing, set to 10 seconds

        // 🔥 Delete old OTP (important)
        await RegistrationOTP.deleteMany({ email });

        await RegistrationOTP.create({ email, otp, expiresAt });


        const resend = new Resend('re_RTbWYCAV_5ZVRmoUvZ7vMf1dP4Cjee2n9');



        const { error } = await resend.emails.send({
            from: 'noreply@aura-chat.com',   // ✅ your domain
            to: email,                        // ✅ any email
            subject: `AURA verification code - ${otp}`,
            html: htmlTemplate(otp, email.split("@")[0])
        });

        if (error) {
            console.error('Resend error:', error);
            return res.status(500).json({ message: 'Failed to send OTP email' });
        }

        // console.log(`OTP sent to ${email}: ${otp}`);

        // ⚠️ Remove otp from response in production
        res.json({ message: "OTP sent successfully", expiresAt });

        res.json({ message: "OTP sent successfully", otp, expiresAt }); // don't send OTP in real app

    } catch (err) {
        console.error("Email error:", err);
        res.status(500).json({ message: err.message });
    }
};

// verify Genarate OTP for registration
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP required" });
        }
        console.log(`Verifying OTP for ${email}: ${otp}`);
        const otpRecord = await RegistrationOTP.findOne({ email, otp });

        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (otpRecord.expiresAt < new Date()) {
            await RegistrationOTP.deleteMany({ email });
            return res.status(400).json({ message: "OTP expired" });
        }

        // ✅ OTP correct → delete it
        await RegistrationOTP.deleteMany({ email });

        // ✅ Mark as verified (you can also store in temp collection/session)
        // Example:
        // await VerifiedUsers.create({ email });

        res.json({ message: "OTP verified successfully" });

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
            user: { id: user._id, name: user.name, email: user.email, phonenumber: user.phonenumber, role: user.role, gender: user.gender, dob: user.dob, bio: user.bio, username: user.username },
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


