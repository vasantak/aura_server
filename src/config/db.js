import mongoose from "mongoose";
let _db;
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            // mongoose v7 sensible defaults; options optional
        });
        console.log("MongoDB connected");
    } catch (err) {
        console.error("DB error", err);
        process.exit(1);
    }
};


export default connectDB;
