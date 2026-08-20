import express from "express";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import Channel from "../models/Channel.js";

const router = express.Router();

// ✅ Create course
router.post("/", async (req, res) => {
  try {
    const { name, description, imageUrl, channels, categoryId, totalLevels } = req.body;

    if (!name || !description || !imageUrl || !categoryId) {
      return res.status(400).json({ message: "Name, description, imageUrl, and categoryId are required fields." });
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: "Invalid Category selection." });
    }

    const course = new Course({ name, description, imageUrl, channels: channels || [], categoryId, totalLevels });
    await course.save();

    if (channels && channels.length > 0) {
      await Channel.updateMany(
        { _id: { $in: channels } },
        { $addToSet: { courses: course._id } }
      );
    }

    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// ✅ Get all courses and populate both channels and category
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("channels")
      .populate("categoryId");
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Get single course and populate both channels and category
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("channels")
      .populate("categoryId");
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Update course
router.put("/:id", async (req, res) => {
  try {
    const { name, description, imageUrl, channels, categoryId, totalLevels } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: "Invalid Category selection." });
    }

    course.name = name || course.name;
    course.description = description || course.description;
    course.imageUrl = imageUrl || course.imageUrl;
    course.categoryId = categoryId || course.categoryId;
    course.totalLevels = totalLevels !== undefined ? totalLevels : course.totalLevels;
    if (channels) course.channels = channels;

    await course.save();

    if (channels) {
      await Channel.updateMany(
        { _id: { $nin: channels }, courses: course._id },
        { $pull: { courses: course._id } }
      );
      await Channel.updateMany(
        { _id: { $in: channels } },
        { $addToSet: { courses: course._id } }
      );
    }

    res.json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});



// ✅ Delete course
router.delete("/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    await Channel.updateMany(
      { courses: course._id },
      { $pull: { courses: course._id } }
    );

    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;