import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true
    },
    position: {
        type: String,
        required: true,
        trim: true
    },
    salary: {
        type: Number,
        required: true
    },
    joiningDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["Active", "Inactive", "Terminated"],
        default: "Active"
    }
}, { timestamps: true });

export const Employee = mongoose.models.Employee || mongoose.model("Employee", employeeSchema);