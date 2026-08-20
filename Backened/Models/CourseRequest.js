import mongoose from "mongoose";

const courseRequestSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  courseName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    required: false,
  }
}, { timestamps: true });

const courseRequest = mongoose.model("courseRequest", courseRequestSchema);
export default courseRequest;
