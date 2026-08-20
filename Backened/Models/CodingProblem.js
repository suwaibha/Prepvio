import mongoose from "mongoose";

const codingProblemSchema = new mongoose.Schema({
    problemId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
    },
    difficulty: {
        type: String,
        index: true,
    },
    problemSlug: {
        type: String,
    },
    description: {
        type: String,
        required: true,
    },
    examples: [
        {
            example_num: Number,
            example_text: String,
            images: [String],
        }
    ],
    constraints: [
        {
            type: String,
        }
    ],
    hints: [
        {
            type: String,
        }
    ],
    functionName: {
        type: String,
    },
    params: {
        type: String,
    },
    boilerplate: {
        type: mongoose.Schema.Types.Mixed,
    },
    testCases: [
        {
            input: { type: String, required: true },
            expected: { type: String, required: true }
        }
    ],
    topics: [
        {
            type: String,
            index: true,
        }
    ],
    companies: [
        {
            type: String,
            index: true,
        }
    ]
}, { timestamps: true });

const CodingProblem = mongoose.model("CodingProblem", codingProblemSchema);
export default CodingProblem;
