import express from "express";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import { getAllEmployees, addEmployee, deleteEmployee } from "../Controllers/employee.controller.js";
import { getAllDepartments, addDepartment } from "../Controllers/department.controller.js";
import { getDailyAttendance, markAttendance } from "../Controllers/attendance.controller.js";

const router = express.Router();

// Apply verifyToken and isAdmin to all routes
router.use(verifyToken, isAdmin);

// Employee routes
router.get("/all", getAllEmployees);
router.post("/add", addEmployee);
router.delete("/delete/:id", deleteEmployee);

// Department routes
router.get("/departments", getAllDepartments);
router.post("/departments/add", addDepartment);

// Attendance routes
router.get("/attendance/daily", getDailyAttendance);
router.post("/attendance/mark", markAttendance);

export default router;