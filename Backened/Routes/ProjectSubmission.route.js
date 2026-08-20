import express from "express";
import ProjectSubmission from "../Models/ProjectSubmission.js";
import { verifyToken } from "../middleware/verifytoken.js";

const router = express.Router();

// ✅ Submit project build
router.post("/submit", verifyToken, async (req, res) => {
    try {
        const { projectId, projectTitle, link, notes } = req.body;

        // Check if already submitted
        const existingSubmission = await ProjectSubmission.findOne({ userId: req.userId, projectId });
        if (existingSubmission) {
            return res.status(400).json({ success: false, message: "Project already submitted" });
        }

        const submission = new ProjectSubmission({
            userId: req.userId,
            projectId,
            projectTitle,
            link,
            notes
        });

        await submission.save();
        res.status(201).json({ success: true, data: submission });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// ✅ Get user's submissions
router.get("/my-submissions", verifyToken, async (req, res) => {
    try {
        const submissions = await ProjectSubmission.find({ userId: req.userId });
        res.json({ success: true, data: submissions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;