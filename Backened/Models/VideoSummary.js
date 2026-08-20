import mongoose from "mongoose";

const videoSummarySchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  summary: {
    type: String,
    required: true,
  },
  // Filled automatically from the course that contains videoId.
  courseName: {
    type: String,
    default: "Unknown Course",
  },
  channelName: {
    type: String,
    default: "Unknown Channel",
  },
  videoTitle: {
    type: String,
    default: "Unknown Video",
  },
}, { timestamps: true });

const VideoSummary = mongoose.model("VideoSummary", videoSummarySchema);
export default VideoSummary;
