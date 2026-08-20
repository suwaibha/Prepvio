import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Define a schema locally to avoid registration conflicts if models are not shared
const submissionSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    projectId: String,
    projectTitle: String,
    link: String,
    notes: String,
    status: { type: String, enum: ["pending", "reviewed", "rejected"], default: "pending" },
    feedback: String,
    submittedAt: Date
}, { timestamps: true });

// Specific connection for User Database
let userDb;
const getUserDb = () => {
    if (!userDb) {
        console.log('SubmissionsRoute connecting to UserDB:', process.env.MONGO_URI_USER);
        userDb = mongoose.createConnection(process.env.MONGO_URI_USER);
    }
    return userDb;
};

const getSubmissionModel = () => {
    const db = getUserDb();
    return db.models.ProjectSubmission || db.model("ProjectSubmission", submissionSchema);
};

const userSchema = new mongoose.Schema({ name: String, email: String });

const getUserModel = () => {
    const db = getUserDb();
    return db.models.User || db.model("User", userSchema);
};

// ✅ Get all submissions
router.get("/", async (req, res) => {
    try {
        const Submission = getSubmissionModel();
        const submissions = await Submission.find().sort({ createdAt: -1 });

        // Optionally populate user details manually if needed, or just return as is
        res.json(submissions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ Update submission (Add feedback / Change status)
router.put("/:id", async (req, res) => {
    try {
        const Submission = getSubmissionModel();
        const submission = await Submission.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status, feedback: req.body.feedback },
            { new: true }
        );
        if (!submission) return res.status(404).json({ message: "Submission not found" });
        res.json(submission);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;