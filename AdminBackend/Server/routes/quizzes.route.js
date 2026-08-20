import express from "express";
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";

const router = express.Router();

// 1. POST: CREATE/UPDATE a quiz by adding a question for a video in a course/playlist
router.post("/by-course", async (req, res) => {
  try {
    const { playlistId, videoId, channelName, courseName, questions, videoTitle } = req.body;

    let quiz = await Quiz.findOne({ playlistId });

    if (quiz) {
      const videoQuiz = quiz.videos.find(v => v.videoId === videoId);

      if (videoQuiz) {
        videoQuiz.questions.push(...questions);
      } else {
        quiz.videos.push({ videoId, videoTitle, questions });
      }
      await quiz.save();
      res.status(200).json({ success: true, message: "Question added successfully to existing quiz", quiz });
    } else {
      const newQuiz = new Quiz({
        playlistId,
        channelName,
        courseName,
        videos: [{ videoId, videoTitle, questions }]
      });
      await newQuiz.save();
      res.status(201).json({ success: true, message: "New quiz created with question", quiz: newQuiz });
    }
  } catch (error) {
    console.error("Error adding quiz question:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 2. GET: Retrieve all questions for a specific video within a playlist
router.get("/by-video/:playlistId/:videoId", async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      return res.status(400).json({ success: false, message: "Invalid playlist ID" });
    }

    const quiz = await Quiz.findOne({ playlistId });

    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found for this playlist" });
    }

    const videoQuiz = quiz.videos.find(v => v.videoId === videoId);

    if (!videoQuiz) {
      return res.status(404).json({ success: false, message: "No questions found for this video" });
    }

    res.status(200).json({ success: true, quiz: videoQuiz });
  } catch (error) {
    console.error("Error fetching quiz by video:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 3. GET: Fetch all quizzes for a playlist (list of videos)
router.get("/by-playlist/:playlistId", async (req, res) => {
  try {
    const { playlistId } = req.params;
    const quiz = await Quiz.findOne({ playlistId });
    if (!quiz) {
      return res.status(404).json({ success: false, message: "No quizzes found for this playlist" });
    }
    res.json({ success: true, data: quiz.videos });
  } catch (err) {
    console.error("Error in GET /by-playlist:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. GET: Fetch a single quiz document by playlistId (for management)
router.get("/by-playlist-document/:playlistId", async (req, res) => {
  try {
    const { playlistId } = req.params;
    const quiz = await Quiz.findOne({ playlistId });
    if (!quiz) {
      return res.status(404).json({ success: false, message: "No quiz document found for this playlist" });
    }
    res.json({ success: true, data: quiz });
  } catch (err) {
    console.error("Error fetching playlist document:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. DELETE: Delete a question from a video's quiz
router.delete("/:playlistId/:videoId/questions/:questionId", async (req, res) => {
  try {
    const { playlistId, videoId, questionId } = req.params;

    const quiz = await Quiz.findOneAndUpdate(
      { 
        playlistId,
        "videos.videoId": videoId 
      },
      {
        $pull: { "videos.$[video].questions": { _id: questionId } }
      },
      {
        new: true,
        arrayFilters: [{ "video.videoId": videoId }]
      }
    );

    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz or video not found" });
    }

    res.status(200).json({ success: true, message: "Question deleted", quiz });
  } catch (err) {
    console.error("Error deleting question:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;