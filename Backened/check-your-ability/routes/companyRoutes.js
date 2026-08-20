import express from "express";
import {
  addCompany,
  getCompanies,
  getRolesByCompany,
  getRoundsByCompanyAndRole,
  updateCompany,
  deleteCompany,
} from "../controllers/companyController.js";

const router = express.Router();

// Add company
router.post("/", addCompany);

// Get all companies
router.get("/", getCompanies);

// ✅ Get roles for specific company
router.get("/roles/:companyName", getRolesByCompany);

// ✅ Get rounds for company and role
router.get("/:companyName/:roleName/rounds", getRoundsByCompanyAndRole);

// Update company
router.put("/:id", updateCompany);

// Delete company
router.delete("/:id", deleteCompany);

export default router;
