// import mongoose from "mongoose";

// const optionSchema = new mongoose.Schema(
//   {
//     text: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//   },
//   { _id: false }
// );

// const aptitudeQuestionSchema = new mongoose.Schema(
//   {
//     /* ================= BASIC INFO ================= */
//     topic: {
//       type: String,
//       required: true,
//       trim: true,
//       index: true, // fast filtering by topic
//     },

//     question: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     /* ================= OPTIONS ================= */
//     options: {
//       type: [optionSchema],
//       validate: {
//         validator: function (arr) {
//           return arr.length === 4;
//         },
//         message: "Exactly 4 options are required",
//       },
//     },

//     /* ================= CORRECT ANSWER ================= */
//     correctAnswerIndex: {
//       type: Number,
//       required: true,
//       min: 0,
//       max: 3,
//     },

//     /* ================= OPTIONAL (BUT SMART) ================= */
//     difficulty: {
//       type: String,
//       enum: ["easy", "medium", "hard"],
//       default: "easy",
//     },

//     explanation: {
//       type: String,
//       trim: true,
//     },

//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true }
// );

// export const AptitudeQuestion =
//   mongoose.models.AptitudeQuestion ||
//   mongoose.model("AptitudeQuestion", aptitudeQuestionSchema);

import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [optionSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length === 4,
        message: "Exactly 4 options are required",
      },
    },

    correctAnswerIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },

    explanation: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const aptitudeTopicSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    questions: {
      type: [questionSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const AptitudeTopic =
  mongoose.models.AptitudeTopic ||
  mongoose.model("AptitudeTopic", aptitudeTopicSchema);
