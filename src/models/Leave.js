import { Schema, model } from "mongoose";
const leaveSchema = new Schema({
    employee: { type: Schema.Types.ObjectId, ref: "User" },
    leaveType: String,
    startDate: Date,
    endDate: Date,
    reason: String,
    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default model("Leave", leaveSchema);
