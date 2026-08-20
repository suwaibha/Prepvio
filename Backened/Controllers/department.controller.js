import { Department } from "../Models/Department.js";
import { Employee } from "../Models/Employee.js";

export const getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.find();

        // Enhance with employee count
        const enhancedDepartments = await Promise.all(departments.map(async (dept) => {
            const count = await Employee.countDocuments({ departmentId: dept._id });
            return {
                ...dept._doc,
                employeeCount: count
            };
        }));

        res.status(200).json({ success: true, departments: enhancedDepartments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addDepartment = async (req, res) => {
    try {
        const { name, head, description } = req.body;
        if (!name) return res.status(400).json({ success: false, message: "Name is required" });

        const dept = new Department({ name, head, description });
        await dept.save();

        res.status(201).json({ success: true, message: "Department added successfully", department: dept });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};