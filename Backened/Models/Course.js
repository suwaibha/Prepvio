import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        unique: true,
    },
    totalLevels: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Course = mongoose.model("Course", courseSchema);
export default Course;