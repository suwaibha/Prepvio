import express from "express";
import { getOverview, getAnalytics, getInvoices, getActiveSubscriptions } from "../Controllers/revenueController.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Middleware to ensure admin access
router.get("/overview", verifyToken, isAdmin, getOverview);
router.get("/analytics", verifyToken, isAdmin, getAnalytics);
router.get("/invoices", verifyToken, isAdmin, getInvoices);
router.get("/active-subscriptions", verifyToken, isAdmin, getActiveSubscriptions);

export default router;