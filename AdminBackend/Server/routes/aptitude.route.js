import express from "express";
import { AptitudeTopic } from "../models/AptitudeTopic.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/* ======================================================
   ADD QUESTION (ADMIN)
====================================================== */
router.post("/questions", async (req, res) => {
  try {
    let {
      topic,
      question,
      options,
      correctAnswerIndex,
      difficulty,
      explanation,
    } = req.body;

    if (!topic || !question || !options || correctAnswerIndex === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    topic = topic.trim().toLowerCase();

    const doc = await AptitudeTopic.findOneAndUpdate(
      { topic },
      {
        $push: {
          questions: {
            question,
            options,
            correctAnswerIndex,
            difficulty,
            explanation,
          },
        },
      },
      { new: true, upsert: true }
    );

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add question" });
  }
});

/* ======================================================
   GET RANDOM QUESTIONS (SCALED)
====================================================== */
router.get("/questions/random", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);

    const result = await AptitudeTopic.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$questions" },
      { $sample: { size: limit } },
      {
        $project: {
  _id: "$questions._id",
  question: "$questions.question",
  options: "$questions.options",
  difficulty: "$questions.difficulty",
  correctAnswerIndex: "$questions.correctAnswerIndex",
  explanation: "$questions.explanation",
  topic: "$topic",
},
      },
    ]);

    if (!result.length) {
      return res.status(404).json({ message: "No questions found" });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch questions" });
  }
});


/* ======================================================
   SUBMIT ANSWERS
====================================================== */
router.post("/submit", async (req, res) => {
  try {
    let { topic, answers } = req.body;

    if (!topic || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "Invalid submission" });
    }

    topic = topic.trim().toLowerCase();

    const topicDoc = await AptitudeTopic.findOne({ topic });
    if (!topicDoc) {
      return res.status(404).json({ message: "Topic not found" });
    }

    let score = 0;

    for (const { questionId, selectedIndex } of answers) {
      const q = topicDoc.questions.id(questionId);
      if (!q) continue;
      if (q.correctAnswerIndex === selectedIndex) score++;
    }

    res.json({
      success: true,
      total: answers.length,
      score,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Evaluation failed" });
  }
});

router.get(
  "/test/mixed",
  async (req, res) => {
    try {
      const QUESTIONS_PER_TOPIC = 1;

      const topics = await AptitudeTopic.find({ isActive: true });

      const finalQuestions = [];

      for (const topicDoc of topics) {
        const qs = topicDoc.questions || [];

        if (qs.length === 0) continue;

        // 🔀 Shuffle questions
        const shuffled = qs.sort(() => 0.5 - Math.random());

        // 🎯 Pick 4 (or less if not enough)
        const picked = shuffled.slice(0, QUESTIONS_PER_TOPIC);

        for (const q of picked) {
          finalQuestions.push({
            _id: q._id,
            topic: topicDoc.topic,          // 🔑 keep topic
            question: q.question,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex,
            difficulty: q.difficulty,
            explanation: q.explanation,
          });
        }
      }

      res.json({
        success: true,
        data: finalQuestions,
        meta: {
          questionsPerTopic: QUESTIONS_PER_TOPIC,
          topicsCount: topics.length,
          totalQuestions: finalQuestions.length,
        },
      });
    } catch (err) {
      console.error("Mixed aptitude error:", err);
      res.status(500).json({
        success: false,
        message: "Failed to load aptitude test",
      });
    }
  }
);

export default router;
