import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import Video from "../models/Video.js";

const router = express.Router();

// ⚠️ Add your YouTube API key in .env as YOUTUBE_API_KEY
const YOUTUBE_API_KEY = 'AIzaSyBs569PnYQUNFUXon5AMersGFuKS8aS1QQ';

// CREATE video (existing)
router.post("/", async (req, res) => {
  try {
    const { title, link, playlistId, channelId, courseId } = req.body;
    if (!title || !link || !playlistId || !channelId || !courseId)
      return res.status(400).json({ success: false, error: "All fields are required" });

    const video = await Video.create({ title, link, playlistId, channelId, courseId });
    res.status(201).json({ success: true, data: video });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all videos from MongoDB for a playlist (existing)
router.get("/playlist/:playlistId", async (req, res) => {
  try {
    const { playlistId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(playlistId))
      return res.status(400).json({ success: false, error: "Invalid playlist ID" });

    const videos = await Video.find({ playlistId })
      .populate("channelId", "name")
      .populate("courseId", "name");

    res.json({ success: true, data: videos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ NEW ROUTE: Fetch videos directly from YouTube using playlist ID
router.get("/youtube/:playlistId", async (req, res) => {
  try {
    const { playlistId } = req.params;
    if (!playlistId) return res.status(400).json({ success: false, error: "Playlist ID is required" });

    const youtubeRes = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems", {
      params: {
        part: "snippet",
        playlistId,
        maxResults: 50,
        key: YOUTUBE_API_KEY,
      },
    });

    const videos = youtubeRes.data.items.map(item => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      link: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
    }));

    res.json({ success: true, data: videos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;