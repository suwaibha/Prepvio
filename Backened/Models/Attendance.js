import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    checkIn: {
        type: String, // Format: "HH:mm"
    },
    checkOut: {
        type: String, // Format: "HH:mm"
    },
    status: {
        type: String,
        enum: ["Present", "Late", "Absent", "On Leave"],
        required: true
    },
    workHours: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);