import mongoose from "mongoose";
const { Schema } = mongoose;

const questionSchema = new Schema({
  timestamp: { type: Number, required: true, min: 0 },
  question: { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (v) => v.length >= 2,
      message: "At least 2 options are required",
    },
  },
  correctAnswer: { type: String, required: true },
});

const videoQuizSchema = new Schema({
  videoId: { type: String, required: true },
  videoTitle: { type: String, trim: true },
  questions: [questionSchema],
}, { timestamps: true });

const quizSchema = new Schema(
  {
    playlistId: { 
      type: Schema.Types.ObjectId, 
      ref: "Playlist", 
      required: true,
      unique: true  // One quiz per playlist
    },
    channelName: { type: String, required: true, trim: true },
    courseName: { type: String, required: true, trim: true },
    videos: [videoQuizSchema],  // Array of videos with their questions
  },
  { timestamps: true }
);

// Index for efficient queries
quizSchema.index({ playlistId: 1 });
quizSchema.index({ "videos.videoId": 1 });

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;