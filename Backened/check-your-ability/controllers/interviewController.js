import axios from "axios";
import dotenv from "dotenv";
import { InterviewSession } from "../models/InterviewSession.js";
import CodingProblem from "../../Models/CodingProblem.js";
import UserCodingQuestion from "../../Models/UserCodingQuestion.js";

dotenv.config();

const FIREWORKS_API_KEY = 'fw_7BzcUEoGttTnGfZhE6dQ96';
const FIREWORKS_URL = "https://api.fireworks.ai/inference/v1/chat/completions";

// ✅ NEW: Define available interview rounds
const AVAILABLE_ROUNDS = [
  {
    roundId: "INTRODUCTION",
    name: "Introduction Round",
    description: "Let's get to know you! Tell us about yourself.",
    duration: 5,
    questionCount: 1,
  },
  {
    roundId: "TECHNICAL",
    name: "Technical Round",
    description: "Core technical knowledge assessment",
    duration: 15,
    questionCount: 5,
  },
  {
    roundId: "CODING",
    name: "Coding Round",
    description: "Solve coding problems and challenges",
    duration: 20,
    questionCount: 3,
  },
  {
    roundId: "HR",
    name: "HR Round",
    description: "Behavioral and soft skills assessment",
    duration: 10,
    questionCount: 4,
  },
  {
    roundId: "APTITUDE",
    name: "Aptitude Round",
    description: "Logical reasoning and problem-solving",
    duration: 15,
    questionCount: 4,
  },
];

/* ==========================================================
   ✅ NEW: START INTERVIEW
========================================================== */
export const startInterview = async (req, res) => {
  try {
    const { role, companyType, planId = 'free' } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!role || !companyType) {
      return res.status(400).json({ message: "Role and company type are required." });
    }

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    // Create new interview session
    const newSession = new InterviewSession({
      userId,
      role,
      companyType,
      planId,
      stage: "INTRODUCTION",
      availableRounds: AVAILABLE_ROUNDS,
      messages: [],
      solvedProblems: [],
      completedRounds: [],
    });

    await newSession.save();

    res.status(201).json({
      message: "Interview started successfully",
      sessionId: newSession._id,
      stage: newSession.stage,
      availableRounds: AVAILABLE_ROUNDS,
    });
  } catch (err) {
    console.error("Start Interview Error:", err);
    res.status(500).json({ message: "Failed to start interview" });
  }
};

/* ==========================================================
   ✅ NEW: GET INTERVIEW STATUS
========================================================== */
export const getInterviewStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required." });
    }

    const session = await InterviewSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ message: "Interview session not found." });
    }

    res.json({
      sessionId: session._id,
      stage: session.stage,
      role: session.role,
      companyType: session.companyType,
      currentRound: session.currentRound,
      availableRounds: session.availableRounds,
      roundSelection: session.roundSelection,
      selectedRounds: session.selectedRounds,
      completedRounds: session.completedRounds,
      totalRounds: session.availableRounds.length,
    });
  } catch (err) {
    console.error("Get Interview Status Error:", err);
    res.status(500).json({ message: "Failed to get interview status" });
  }
};

/* ==========================================================
   ✅ NEW: SUBMIT ROUND SELECTION
========================================================== */
export const submitRoundSelection = async (req, res) => {
  try {
    const { sessionId, roundSelection, selectedRounds } = req.body;

    if (!sessionId || !roundSelection) {
      return res.status(400).json({ message: "Session ID and round selection are required." });
    }

    if (roundSelection !== "ALL_ROUNDS" && roundSelection !== "SPECIFIC_ROUNDS") {
      return res.status(400).json({ message: "Invalid round selection type." });
    }

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Interview session not found." });
    }

    // Validate selected rounds if SPECIFIC_ROUNDS
    let finalSelectedRounds = [];
    if (roundSelection === "ALL_ROUNDS") {
      // All rounds except introduction (which is already done)
      finalSelectedRounds = AVAILABLE_ROUNDS.slice(1).map(r => r.roundId);
    } else if (roundSelection === "SPECIFIC_ROUNDS" && selectedRounds?.length > 0) {
      // Validate that selected rounds exist
      const validRoundIds = AVAILABLE_ROUNDS.map(r => r.roundId);
      finalSelectedRounds = selectedRounds.filter(r => validRoundIds.includes(r));
      
      if (finalSelectedRounds.length === 0) {
        return res.status(400).json({ message: "No valid rounds selected." });
      }
    } else {
      return res.status(400).json({ message: "Invalid rounds provided." });
    }

    // Update session
    session.roundSelection = roundSelection;
    session.selectedRounds = finalSelectedRounds;
    session.stage = "INTERVIEW_IN_PROGRESS";
    
    // Set first round
    const firstRound = AVAILABLE_ROUNDS.find(r => r.roundId === finalSelectedRounds[0]);
    if (firstRound) {
      session.currentRound = {
        roundId: firstRound.roundId,
        name: firstRound.name,
        startedAt: new Date(),
      };
    }

    await session.save();

    res.json({
      message: "Round selection saved successfully",
      sessionId: session._id,
      stage: session.stage,
      roundSelection: session.roundSelection,
      selectedRounds: session.selectedRounds,
      currentRound: session.currentRound,
      totalSelectedRounds: finalSelectedRounds.length,
    });
  } catch (err) {
    console.error("Submit Round Selection Error:", err);
    res.status(500).json({ message: "Failed to submit round selection" });
  }
};

/* ==========================================================
   ✅ NEW: GET NEXT ROUND
========================================================== */
export const getNextRound = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required." });
    }

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Interview session not found." });
    }

    if (session.stage !== "INTERVIEW_IN_PROGRESS") {
      return res.status(400).json({ message: "Interview not in progress." });
    }

    const currentRoundId = session.currentRound?.roundId;
    const selectedRounds = session.selectedRounds || [];

    // Find index of current round
    const currentIndex = selectedRounds.indexOf(currentRoundId);
    const nextIndex = currentIndex + 1;

    if (nextIndex >= selectedRounds.length) {
      // No more rounds
      return res.json({ message: "All rounds completed", nextRound: null });
    }

    const nextRoundId = selectedRounds[nextIndex];
    const nextRoundData = AVAILABLE_ROUNDS.find(r => r.roundId === nextRoundId);

    res.json({
      nextRound: {
        roundId: nextRoundData.roundId,
        name: nextRoundData.name,
        description: nextRoundData.description,
        duration: nextRoundData.duration,
        questionCount: nextRoundData.questionCount,
        roundNumber: nextIndex + 1,
        totalRounds: selectedRounds.length,
      },
    });
  } catch (err) {
    console.error("Get Next Round Error:", err);
    res.status(500).json({ message: "Failed to get next round" });
  }
};

/* ==========================================================
   ✅ NEW: COMPLETE ROUND
========================================================== */
export const completeRound = async (req, res) => {
  try {
    const { sessionId, roundId, score, feedback } = req.body;

    if (!sessionId || !roundId) {
      return res.status(400).json({ message: "Session ID and round ID are required." });
    }

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Interview session not found." });
    }

    const roundData = AVAILABLE_ROUNDS.find(r => r.roundId === roundId);
    if (!roundData) {
      return res.status(400).json({ message: "Invalid round ID." });
    }

    // Add to completed rounds
    session.completedRounds.push({
      roundId,
      name: roundData.name,
      completedAt: new Date(),
      score,
      feedback,
    });

    await session.save();

    res.json({
      message: "Round completed successfully",
      completedRounds: session.completedRounds.length,
      totalRounds: session.selectedRounds.length,
    });
  } catch (err) {
    console.error("Complete Round Error:", err);
    res.status(500).json({ message: "Failed to complete round" });
  }
};

/* ==========================================================
   ✅ NEW: SUBMIT INTRODUCTION
========================================================== */
export const submitIntroduction = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { response } = req.body;

    if (!sessionId || !response) {
      return res.status(400).json({ message: "Session ID and response are required." });
    }

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Interview session not found." });
    }

    // Store introduction message
    session.messages.push({
      sender: "User",
      text: response,
      time: new Date().toLocaleTimeString(),
      stage: "INTRODUCTION",
    });

    await session.save();

    res.json({
      message: "Introduction submitted successfully",
      sessionId: session._id,
    });
  } catch (err) {
    console.error("Submit Introduction Error:", err);
    res.status(500).json({ message: "Failed to submit introduction" });
  }
};

/* ==========================================================
   🔹 NORMAL INTERVIEW QUESTION (OPTIONAL)
========================================================== */
export const getInterviewQuestion = async (req, res) => {
  const { chatHistory, companyType, role } = req.body;

  if (!chatHistory || !companyType || !role) {
    return res.status(400).json({ message: "Missing required interview parameters." });
  }

  try {
    const systemPrompt = `
You are a professional interviewer at a ${companyType}.
Ask one question at a time. No explanations. Start with intro → technical.
`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.map(msg => ({
        role: msg.role === "ai" ? "assistant" : "user",
        content: msg.text,
      }))
    ];

    const response = await axios.post(
      FIREWORKS_URL,
      {
        model: "accounts/fireworks/models/deepseek-v4-pro",
        messages
      },
      {
        headers: {
          Authorization: `Bearer ${FIREWORKS_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = response.data?.choices?.[0]?.message?.content || "";
    res.json({ text });

  } catch (err) {
    console.error("Interview Question Error:", err);
    res.status(500).json({ message: "Failed to generate question" });
  }
};



/* ==========================================================
   🔥 PERFECT FIREWORKS CODING PROBLEM GENERATOR
   - Returns ONLY valid JSON
   - No raw data
   - Always parses JSON safely
========================================================== */
export const generateCodingProblem = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    const randomSeed = Math.floor(Math.random() * 100000);
    const topics = [
      "math operations", "logic gates", "comparisons",
      "conditions", "loops", "basic algorithms"
    ];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    const prompt = `
Generate a beginner-friendly coding problem using two integer inputs a and b.

Topic: ${topic}
Seed: ${randomSeed}

Respond ONLY with valid JSON.
NO markdown. NO text outside the JSON.

Expected JSON format:
{
  "problemId": "unique_id",
  "title": "Problem Title",
  "description": "One-sentence clear problem statement.",
  "difficulty": "Easy",
  "example": "Input: a = 3, b = 5\\nOutput: 8",
  "functionName": "functionName",
  "companies": ["Google","Amazon","Microsoft"],
  "boilerplate": {
    "javascript": "function functionName(a,b){\\n  // code\\n}",
    "cpp": "#include <iostream>... ",
    "python": "def functionName(a,b):\\n  pass"
  },
  "testCases": [
    { "input": "1, 2", "expected": "3" },
    { "input": "5, 3", "expected": "8" }
  ],
  "answer": {
    "javascript": "function functionName(a,b){ return a+b; }",
    "python": "def functionName(a,b):\\n    return a+b",
    "cpp": "int functionName(int a, int b){ return a + b; }"
  }
}
RETURN ONLY JSON.
`;

    // Call Fireworks
    const response = await axios.post(
      FIREWORKS_URL,
      {
        model: "accounts/fireworks/models/deepseek-v4-pro",
        messages: [
          {
            role: "system",
            content: "You output ONLY valid JSON. No explanations ever."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          Authorization: `Bearer ${FIREWORKS_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Extract JSON text
    const raw = response.data?.choices?.[0]?.message?.content;
    if (!raw) {
      return res.status(500).json({ error: "Empty Fireworks response" });
    }

    let clean = raw.replace(/```json|```/g, "").trim();

    const match = clean.match(/\{[\s\S]*\}$/);
    if (!match) {
      return res.status(500).json({ error: "JSON not found in response", raw });
    }

    const parsed = JSON.parse(match[0]);

    const persistedProblem = await UserCodingQuestion.findOneAndUpdate(
      { userId, problemId: parsed.problemId || parsed.title },
      {
        $set: {
          userId,
          problemId: parsed.problemId || parsed.title,
          title: parsed.title || "Untitled coding problem",
          description: parsed.description || "",
          difficulty: parsed.difficulty || "Easy",
          example: parsed.example || null,
          functionName: parsed.functionName || null,
          companies: Array.isArray(parsed.companies) ? parsed.companies : [],
          boilerplate: parsed.boilerplate || {},
          testCases: Array.isArray(parsed.testCases)
            ? parsed.testCases.map((tc) => ({
                input: tc.input || "",
                expected: tc.expected || "",
              }))
            : [],
          answer: parsed.answer ?? parsed.solution ?? null,
          source: "fireworks",
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // Return ONLY parsed JSON
    res.json({
      ...parsed,
      saved: true,
      savedProblemId: persistedProblem._id,
    });

  } catch (err) {
    console.error("🔥 Coding Problem Error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Fireworks coding problem generation failed",
      details: err.response?.data || err.message
    });
  }
};

/* ==========================================================
   ✅ NEW: GET RANDOM EASY, MEDIUM, HARD PROBLEMS
========================================================== */
export const getRandomCodingProblems = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    const userProblems = await UserCodingQuestion.find({ userId }).lean();

    const problems = [];
    const pickProblem = (difficulty) => {
      const match = userProblems.filter((problem) => (problem.difficulty || "Easy").toLowerCase() === difficulty.toLowerCase());
      if (match.length === 0) return null;
      const index = Math.floor(Math.random() * match.length);
      return match[index];
    };

    const easyProblem = pickProblem("Easy");
    const mediumProblem = pickProblem("Medium");
    const hardProblem = pickProblem("Hard");

    if (easyProblem) problems.push(easyProblem);
    if (mediumProblem) problems.push(mediumProblem);
    if (hardProblem) problems.push(hardProblem);

    if (problems.length === 0) {
      const easyProblems = await CodingProblem.aggregate([
        { $match: { difficulty: "Easy" } },
        { $sample: { size: 1 } }
      ]);
      const mediumProblems = await CodingProblem.aggregate([
        { $match: { difficulty: "Medium" } },
        { $sample: { size: 1 } }
      ]);
      const hardProblems = await CodingProblem.aggregate([
        { $match: { difficulty: "Hard" } },
        { $sample: { size: 1 } }
      ]);

      if (easyProblems.length > 0) problems.push(easyProblems[0]);
      if (mediumProblems.length > 0) problems.push(mediumProblems[0]);
      if (hardProblems.length > 0) problems.push(hardProblems[0]);
    }

    if (problems.length === 0) {
      return res.status(404).json({ message: "No coding problems found in database." });
    }

    res.json({ success: true, problems });
  } catch (error) {
    console.error("Error fetching random coding problems:", error);
    res.status(500).json({ message: "Failed to fetch random coding problems", error: error.message });
  }
};

// ✅ NEW: Get all user's coding questions and answers
export const getUserCodingQuestions = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    const userQuestions = await UserCodingQuestion.find({ userId }).lean();

    res.json({ success: true, questions: userQuestions });
  } catch (error) {
    console.error("Error fetching user coding questions:", error);
    res.status(500).json({ message: "Failed to fetch user coding questions", error: error.message });
  }
};

export default {
  startInterview,
  getInterviewStatus,
  submitIntroduction,
  submitRoundSelection,
  getNextRound,
  completeRound,
  getInterviewQuestion,
  generateCodingProblem,
  getRandomCodingProblems,
  getUserCodingQuestions,
};
