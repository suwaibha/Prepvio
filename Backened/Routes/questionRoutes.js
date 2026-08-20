import express from "express";
import Question from "../Models/Question.js";
import { verifyToken } from "../middleware/verifytoken.js";

const router = express.Router();

/* ======================================================
   GET RANDOM QUESTIONS BY CATEGORY + SUBCATEGORY
   GET /api/questions/random?category=Engineering&subcategory=Mechanical&limit=30

   Returns data in the same shape the Aptitude frontend expects:
     { _id, question, options: [{ text }], correctAnswerIndex, explanation, topic, category, subcategory }
====================================================== */
router.get("/random", verifyToken, async (req, res) => {
  try {
    const { category, subcategory } = req.query;
    const limit = Math.min(Number(req.query.limit) || 30, 50); // cap at 50

    if (!category || !subcategory) {
      return res.status(400).json({
        success: false,
        message: "Both 'category' and 'subcategory' query params are required",
      });
    }

    // Use MongoDB $sample to get random documents
    const rawQuestions = await Question.aggregate([
      {
        $match: {
          category: category,
          subcategory: subcategory,
        },
      },
      { $sample: { size: limit } },
    ]);

    if (!rawQuestions.length) {
      return res.status(404).json({
        success: false,
        message: `No questions found for category "${category}" / subcategory "${subcategory}"`,
      });
    }

    // ─── Transform into the format the Aptitude frontend expects ───
    //
    // DB shape:   options: { a: "text", b: "text", c: "text", d: "text" }
    //             answer:  "A" | "B" | "C" | "D"
    //
    // Frontend:   options: [ { text: "..." }, ... ]
    //             correctAnswerIndex: 0 | 1 | 2 | 3
    // ───────────────────────────────────────────────────────────────

    const ANSWER_TO_INDEX = { A: 0, B: 1, C: 2, D: 3 };

    const questions = rawQuestions.map((q) => {
      const opts = q.options || {};
      const optionsArray = [
        { text: opts.a || "" },
        { text: opts.b || "" },
        { text: opts.c || "" },
        { text: opts.d || "" },
      ].filter((o) => o.text); // remove empty options

      return {
        _id: q._id,
        question: q.question,
        question_img_url: q.question_img_url || null,
        options: optionsArray,
        correctAnswerIndex: ANSWER_TO_INDEX[q.answer] ?? 0,
        explanation: q.explanation || null,
        topic: q.topic || q.subcategory,
        category: q.category,
        subcategory: q.subcategory,
      };
    });

    res.json({
      success: true,
      data: questions,
      meta: {
        category,
        subcategory,
        total: questions.length,
        requestedLimit: limit,
      },
    });
  } catch (err) {
    console.error("❌ Random questions fetch failed:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
    });
  }
});

export default router;
