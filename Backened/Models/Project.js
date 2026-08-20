import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [String], 
  imageUrl: { 
    type: String, 
    default: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800" 
  },
  liveLink: { type: String },
  githubLink: { type: String },
}, { timestamps: true });

export const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);