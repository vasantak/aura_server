import Leave from "../models/Leave.js";


export const leaveApply = (req, res) => {
    // Logic for applying leave
    try {
        if (!req.body)
            return res.status(400).json({ message: "No data provided" });
        if (!req.body.employee || !req.body.leaveType || !req.body.startDate || !req.body.endDate || !req.body.reason)
            return res.status(400).json({ message: "Missing fields" });
        const { employee, leaveType, startDate, endDate, reason } = req.body;
        const leave = Leave({
            employee,
            leaveType,
            startDate,
            endDate,
            reason
        });
        leave.save();
        res.status(201).json({ message: 'Leave applied successfully' });
    }

    catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getMyLeaveList = async (req, res) => {
    try {
        const employeeId = req.query.employeeId;
        const Empl_LeaveInfo = await Leave.find({ employee: employeeId });
        if (!Empl_LeaveInfo) {
            return res.status(404).json({ message: "No leave records found for this employee" });
        }
        return res.status(200).json(Empl_LeaveInfo);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export const getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find();
        res.json(leaves);
        // return res.status(200).json({ message: levae })
    }
    catch (err) {
        return res.status(400).json({ message: "No Leave list " })
    }
}