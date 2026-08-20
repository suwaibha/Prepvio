import { Employee } from "../Models/Employee.js";
import { Department } from "../Models/Department.js";

export const getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.find().populate("departmentId", "name");
        res.status(200).json({ success: true, employees });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addEmployee = async (req, res) => {
    try {
        const { name, email, phone, departmentId, position, salary, joiningDate } = req.body;

        if (!name || !email || !departmentId || !position || !salary || !joiningDate) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const employeeExists = await Employee.findOne({ email });
        if (employeeExists) return res.status(400).json({ success: false, message: "Email already exists" });

        const employee = new Employee({
            name,
            email,
            phone,
            departmentId,
            position,
            salary,
            joiningDate
        });

        await employee.save();
        res.status(201).json({ success: true, message: "Employee added successfully", employee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findByIdAndDelete(id);
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }
        res.status(200).json({ success: true, message: "Employee deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};