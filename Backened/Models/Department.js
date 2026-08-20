import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    head: {
        type: String, // Can be refined to ref: "Employee" later if needed
        trim: true
    },
    description: String
}, { timestamps: true });

export const Department = mongoose.models.Department || mongoose.model("Department", departmentSchema);