import express from "express";
import Channel from "../models/Channel.js";
import Course from "../models/Course.js";

const router = express.Router();

// ✅ Create channel
router.post("/", async (req, res) => {
  try {
    const { name, description, imageUrl, link, courses } = req.body;

    if (!name || !description || !imageUrl || !link) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const channel = new Channel({ name, description, imageUrl, link, courses: courses || [] });
    await channel.save();

    // Sync: add channel to courses
    if (courses && courses.length > 0) {
      await Course.updateMany(
        { _id: { $in: courses } },
        { $addToSet: { channels: channel._id } }
      );
    }

    res.status(201).json(channel);
  } catch (err) {
    console.error("Error creating channel:", err);
    res.status(400).json({ message: err.message });
  }
});

// ✅ Get all channels
router.get("/", async (req, res) => {
  try {
    const channels = await Channel.find().populate("courses", "name slug");
    res.json(channels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get channels for a specific course
router.get("/course/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const channels = await Channel.find({ courses: courseId });
    res.json(channels);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch channels" });
  }
});

// ✅ Update channel
router.put("/:id", async (req, res) => {
  try {
    const { name, description, imageUrl, link, courses } = req.body;

    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    channel.name = name || channel.name;
    channel.description = description || channel.description;
    channel.imageUrl = imageUrl || channel.imageUrl;
    channel.link = link || channel.link;
    if (courses) channel.courses = courses;

    await channel.save();

    // Sync courses
    if (courses) {
      await Course.updateMany(
        { _id: { $nin: courses }, channels: channel._id },
        { $pull: { channels: channel._id } }
      );
      await Course.updateMany(
        { _id: { $in: courses } },
        { $addToSet: { channels: channel._id } }
      );
    }

    res.json(channel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ Delete channel
router.delete("/:id", async (req, res) => {
  try {
    const channel = await Channel.findByIdAndDelete(req.params.id);
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    // Remove from all courses
    await Course.updateMany(
      { channels: channel._id },
      { $pull: { channels: channel._id } }
    );

    res.json({ message: "Channel deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;