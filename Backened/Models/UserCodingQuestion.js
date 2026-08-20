import mongoose from "mongoose";

const userCodingQuestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    problemId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      default: "Easy",
      index: true,
    },
    example: {
      type: String,
    },
    functionName: {
      type: String,
    },
    companies: [
      {
        type: String,
      },
    ],
    boilerplate: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    testCases: [
      {
        input: { type: String, required: true },
        expected: { type: String, required: true },
      },
    ],
    answer: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    source: {
      type: String,
      default: "fireworks",
    },
  },
  { timestamps: true }
);

const UserCodingQuestion = mongoose.model("UserCodingQuestion", userCodingQuestionSchema);
export default UserCodingQuestion;
