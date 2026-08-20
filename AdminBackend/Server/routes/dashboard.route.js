import express from "express";
import Dashboard from "../models/Dashboard.js";
import Service from "../models/Service.js";

const router = express.Router();

// GET dashboard data
router.get("/", async (req, res) => {
  try {
    // Count services directly from services collection
    const totalServices = await Service.countDocuments();

    // Fetch dashboard doc (employees etc.)
    let dashboard = await Dashboard.findOne();

    if (!dashboard) {
      dashboard = await Dashboard.create({
        employees: [],
        totalEmployees: 0,
        totalServices: totalServices,
      });
    }

    // Always keep services count fresh
    dashboard.totalServices = totalServices;
    await dashboard.save();

    res.json({
      totalEmployees: dashboard.totalEmployees,
      totalServices: dashboard.totalServices,
      employees: dashboard.employees,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

router.post("/employees", async (req, res) => {
  try {
    const { empId, name, role } = req.body;

    if (!empId || !name || !role) {
      return res.status(400).json({ message: "empId, name, role are required" });
    }

    let dashboard = await Dashboard.findOne();

    if (!dashboard) {
      dashboard = await Dashboard.create({
        employees: [],
        totalEmployees: 0,
        totalServices: 0,
      });
    }

    dashboard.employees.push({ empId, name, role });
    dashboard.totalEmployees = dashboard.employees.length;

    await dashboard.save();

    res.status(201).json({
      message: "Employee added",
      totalEmployees: dashboard.totalEmployees,
      employees: dashboard.employees,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to add employee" });
  }
});




export default router;
