import { Attendance } from "../Models/Attendance.js";
import { Employee } from "../Models/Employee.js";

export const getDailyAttendance = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const attendance = await Attendance.find({
            date: { $gte: today, $lt: tomorrow }
        }).populate("employeeId", "name");

        res.status(200).json({ success: true, attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper to clock in/out (optional but useful for testing)
export const markAttendance = async (req, res) => {
    try {
        const { employeeId, checkIn, checkOut, status, workHours } = req.body;
        const date = new Date();
        date.setHours(0, 0, 0, 0);

        const record = new Attendance({
            employeeId,
            date,
            checkIn,
            checkOut,
            status,
            workHours
        });

        await record.save();
        res.status(201).json({ success: true, record });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};