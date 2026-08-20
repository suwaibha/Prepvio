// import mongoose from "mongoose";

// const interviewSessionSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     companyType: {
//       type: String,
//       required: true,
//     },
//     role: {
//       type: String,
//       required: true,
//     },
//     startedAt: {
//       type: Date,
//       default: Date.now,
//     },
//     endedAt: {
//       type: Date,
//     },
//     status: {
//       type: String,
//       enum: ["started", "completed", "abandoned"],
//       default: "started",
//     },
//     reportUrl: {
//       type: String,
//     },
//   },
//   { timestamps: true }
// );

// export const InterviewSession = mongoose.model(
//   "InterviewSession",
//   interviewSessionSchema
// );


// ========================================
// 1. UPDATE INTERVIEW SESSION MODEL
// File: models/InterviewSession.js
// ========================================

import mongoose from "mongoose";

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    companyType: {
      type: String,
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    reportUrl: {
      type: String,
    },
    // ✅ NEW: Store conversation messages
    messages: [
      {
        sender: {
          type: String,
          enum: ["User", "AI"],
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        time: String,
        stage: String,
        feedback: {
          suggestion: String,
          example: String,
        },
      },
    ],
    // ✅ NEW: Store solved coding problems
    solvedProblems: [
      {
        problem: {
          title: String,
          description: String,
          example: String,
          testCases: [
            {
              input: String,
              expected: String,
            },
          ],
          companies: [String],
        },
        userCode: String,
        testResults: [
          {
            id: Number,
            input: String,
            expected: String,
            output: String,
            passed: Boolean,
          },
        ],
        skipped: Boolean,
        solvedAt: Date,
      },
    ],
    highlightClips: [
      {
        questionIndex: Number,
        questionText: String,
        timestamp: String,
        nervousScore: Number,
        confidence: Number,
        imageUrl: String,   // later you can change to imageUrl
        capturedAt: Date,
      },
    ],

    planId: {
      type: String,
      required: true,
      default: 'free',
    },
    status: {
      type: String,
      enum: ["in-progress", "completed", "terminated"],
      default: "in-progress",
    },
    terminatedAt: Date,
    terminationReason: String,
    terminationRemark: String,
    identityWarnings: { type: Number, default: 0 },
    identityEvents: {
      type: [{
        eventType: { type: String, required: true },
        reason: String,
        trigger: String,
        occurredAt: { type: Date, default: Date.now },
      }],
      default: [],
    },
    // ✅ NEW: Interview flow stage tracking
    stage: {
      type: String,
      enum: ["INTRODUCTION", "ROUND_SELECTION", "INTERVIEW_IN_PROGRESS", "COMPLETED"],
      default: "INTRODUCTION",
    },
    // ✅ NEW: Available interview rounds
    availableRounds: [
      {
        roundId: String,
        name: String, // e.g., "Technical", "Coding", "HR", "Aptitude"
        description: String,
        duration: Number, // in minutes
        questionCount: Number,
      }
    ],
    // ✅ NEW: Track which rounds user selected
    roundSelection: {
      type: String,
      enum: ["ALL_ROUNDS", "SPECIFIC_ROUNDS"],
      default: null,
    },
    // ✅ NEW: Selected specific rounds (if SPECIFIC_ROUNDS chosen)
    selectedRounds: [String], // array of roundIds
    // ✅ NEW: Current round being taken
    currentRound: {
      roundId: String,
      name: String,
      startedAt: Date,
    },
    // ✅ NEW: Track completed rounds
    completedRounds: [
      {
        roundId: String,
        name: String,
        completedAt: Date,
        score: Number,
        feedback: String,
      }
    ],
    // ✅ NEW: persisted AI performance report (generated once, cached forever)
    reportData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

export const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);
