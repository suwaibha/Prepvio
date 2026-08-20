import mongoose from "mongoose";

const faceProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    embeddings: { type: [[Number]], required: true, select: false },
    enrolledAt: { type: Date, default: Date.now },
    verificationVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const FaceProfile = mongoose.model("FaceProfile", faceProfileSchema);
