import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    question_img_url: {
        type: String,
        default: null,
    },
    options: {
        a: { type: String, required: true },
        b: { type: String, required: true },
        c: { type: String, default: "" },
        d: { type: String, default: "" },
    },
    option_img_urls: {
        a: { type: String, default: null },
        b: { type: String, default: null },
        c: { type: String, default: null },
        d: { type: String, default: null },
    },
    answer: {
        type: String,
        enum: ["A", "B", "C", "D"],
        required: true,
    },
    explanation: {
        type: String,
        default: null,
    },
    explanation_img_urls: {
        type: [String],
        default: null,
    },
    topic: {
        type: String,
        default: null,
    },
    category: {
        type: String,
        required: true,
        index: true,
    },
    subcategory: {
        type: String,
        required: true,
        index: true,
    },
    source_file: {
        type: String,
        default: null,
    },
    classification_confidence: {
        type: String,
        enum: ["high", "medium", "low"],
        default: "high",
    },
    needs_review: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// Compound index for efficient querying by category + subcategory
questionSchema.index({ category: 1, subcategory: 1 });
// Index for topic-based queries within a category
questionSchema.index({ category: 1, topic: 1 });

const Question = mongoose.model("Question", questionSchema);
export default Question;
