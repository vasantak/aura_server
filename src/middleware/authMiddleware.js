import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = header.split(" ")[1];
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        const user = await User.findById(payload.id).select("-password");
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = {
            id: user._id,
            role: user.role,
        };

        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized or token expired" });
    }
};


export const authorize = (roles = []) => (req, res, next) => {
    // roles can be string or array
    if (typeof roles === "string") roles = [roles];
    if (!roles.length) return next();
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "You don’t have access for this " });
    next();
};
