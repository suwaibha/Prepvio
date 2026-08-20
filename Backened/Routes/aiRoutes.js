import express from "express";
import { chatWithAI } from "../Controllers/AIController.js";
import { verifyToken } from "../middleware/authMiddleware.js"; // Optional: Protect it?

const router = express.Router();

// Public or Protected? 
// User said "user side", usually implies logged in.
// But some users might be visitors.
// I'll make it protected to prevent abuse if verifiedToken exists, otherwise public?
// For now, let's keep it open or check user. 
// "verifyToken" is safer.

router.post("/chat", verifyToken, chatWithAI);

export default router;