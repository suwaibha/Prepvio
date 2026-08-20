import mongoose from "mongoose";

const projectSubmissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    projectId: {
        type: String, // Storing project ID (can be the MongoDB ID from Admin DB or the order/id from static data)
        required: true
    },
    projectTitle: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    notes: {
        type: String
    },
    status: {
        type: String,
        enum: ["pending", "reviewed", "rejected"],
        default: "pending"
    },
    feedback: {
        type: String
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const ProjectSubmission = mongoose.model("ProjectSubmission", projectSubmissionSchema);
export default ProjectSubmission;