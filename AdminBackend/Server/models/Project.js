import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard', 'Expert', 'Final Boss'],
        default: 'Medium'
    },
    estimatedTime: {
        type: String,
        required: true
    },
    xp: {
        type: Number,
        required: true
    },
    tech: [{
        type: String
    }],
    description: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    unlocks: [{
        type: Number
    }],
    rating: {
        type: Number,
        default: 0
    },
    completionRate: {
        type: Number,
        default: 0
    },
    impact: {
        type: String
    },
    milestones: [{
        type: String
    }],
    color: {
        type: String
    },
    order: {
        type: Number,
        unique: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    requiredCourseCompletion: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);
export default Project;