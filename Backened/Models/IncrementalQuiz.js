import mongoose from "mongoose";
const { Schema } = mongoose;

const questionSchema = new Schema({
  question: { type: String, required: true },
  options: {
    A: { type: String, required: true },
    B: { type: String, required: true },
    C: { type: String, required: true },
    D: { type: String, required: true }
  },
  correctAnswer: { type: String, required: true }
});

const incrementalQuizSchema = new Schema({
  videoId: { type: String, required: true },
  topic: { type: String, required: true },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  triggerTime: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["PENDING", "QUEUED", "GENERATING", "VALIDATING", "SAVING", "READY", "FAILED", "SKIPPED"], 
    default: "PENDING" 
  },
  questions: [questionSchema],
  skipReason: { type: String },
  failureReason: { type: String },
  generatedAt: { type: Date }
}, { timestamps: true });

// Compound index to ensure uniqueness per video + topic (Idempotent schema)
incrementalQuizSchema.index({ videoId: 1, topic: 1 }, { unique: true });

const IncrementalQuiz = mongoose.model("IncrementalQuiz", incrementalQuizSchema);
export default IncrementalQuiz;
