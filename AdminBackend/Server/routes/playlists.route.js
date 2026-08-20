import express from "express";
import mongoose from "mongoose";
import Playlist from "../models/Playlist.js";

const router = express.Router();

// CREATE playlist
router.post("/", async (req, res) => {
  try {
    const { channelId, courseId, link, type } = req.body;
    if (!channelId || !courseId || !link || !type)
      return res.status(400).json({ success: false, error: "channelId, courseId, link, and type are required" });

    const playlist = await Playlist.create({ channelId, courseId, link, type });
    res.status(201).json({ success: true, data: playlist });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all playlists (optional filters)
router.get("/", async (req, res) => {
  try {
    const { channelId, courseId } = req.query;
    const filter = {};
    if (channelId) filter.channelId = channelId;
    if (courseId) filter.courseId = courseId;

    const playlists = await Playlist.find(filter)
      .populate("channelId", "name imageUrl")
      .populate("courseId", "name description");

    res.json({ success: true, data: playlists });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single playlist by ID
router.get("/id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, error: "Invalid playlist ID" });

    const playlist = await Playlist.findById(id)
      .populate("channelId", "name imageUrl")
      .populate("courseId", "name description");

    if (!playlist) return res.status(404).json({ success: false, error: "Playlist not found" });

    res.json({ success: true, data: playlist });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/single/:channelId/:courseId", async (req, res) => {
  try {
    const { channelId, courseId } = req.params;

    const playlist = await Playlist.findOne({
      channelId,
      courseId,
      type: "video",
    }).populate("channelId", "name imageUrl")
      .populate("courseId", "name description");

    if (!playlist) {
      return res.status(404).json({ success: false, error: "Single video not found" });
    }

    // Extract videoId from YouTube link
    const url = new URL(playlist.link);
    const videoId = url.searchParams.get("v");

    if (!videoId) {
      return res.status(400).json({ success: false, error: "Invalid YouTube video link" });
    }

    res.json({
      success: true,
      data: {
        type: "video",
        videoId,
        title: playlist.courseId.name,
        channelName: playlist.channelId.name,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET a playlist by channel and course ID
router.get("/:channelId/:courseId", async (req, res) => {
  try {
    const { channelId, courseId } = req.params;
    const playlist = await Playlist.find({ channelId, courseId })
      .populate("channelId", "name imageUrl")
      .populate("courseId", "name description");

    if (!playlist || playlist.length === 0) {
      return res.status(404).json({ success: false, error: "Playlist not found" });
    }

    res.json({ success: true, data: playlist });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE playlist
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, error: "Invalid playlist ID" });

    const { channelId, courseId, link, type } = req.body;
    
    const updated = await Playlist.findByIdAndUpdate(id, { channelId, courseId, link, type }, { new: true })
      .populate("channelId", "name imageUrl")
      .populate("courseId", "name description");

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE playlist
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, error: "Invalid playlist ID" });

    await Playlist.findByIdAndDelete(id);
    res.json({ success: true, message: "Playlist deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;