import { Router } from "express";
import { verifyToken } from "../../middleware/authMiddleware.js";
import {
  startInterview,
  getInterviewStatus,
  submitIntroduction,
  submitRoundSelection,
  getNextRound,
  completeRound,
  getInterviewQuestion,
  generateCodingProblem,
  getRandomCodingProblems,
  getUserCodingQuestions
} from "../controllers/interviewController.js";

const router = Router();

// ✅ NEW: Interview flow endpoints
router.post("/start", startInterview);
router.get("/:sessionId/status", getInterviewStatus);
router.post("/:sessionId/submit-intro", submitIntroduction);
router.post("/:sessionId/select-rounds", submitRoundSelection);
router.get("/:sessionId/next-round", getNextRound);
router.post("/:sessionId/complete-round", completeRound);

// Existing endpoints
router.post("/ask", getInterviewQuestion);
router.post("/fireworks", verifyToken, generateCodingProblem);
router.get("/coding-problems/random", verifyToken, getRandomCodingProblems);
router.get("/coding-questions/all", verifyToken, getUserCodingQuestions);

export default router;
