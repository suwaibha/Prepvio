import { Router } from "express";
import { verifyToken } from "../../middleware/authMiddleware.js";
import { FaceProfile } from "../../Models/FaceProfile.js";
import {
  detectAndAnalyzeFrame,
  isLivenessMatch,
  faceDistance,
} from "../services/faceRecognitionService.js";
import { InterviewSession } from "../models/InterviewSession.js";
import { User } from "../../Models/User.js";

const router = Router();
const MAX_WARNINGS = 3;

const verificationMessage = (reason, terminated = false) => {
  if (terminated) {
    return "Interview terminated because identity verification failed after three warnings.";
  }
  if (/mismatch|different/i.test(reason)) {
    return "User match not found.";
  }
  if (/multiple/i.test(reason)) {
    return "Multiple people detected. Please ensure only the enrolled user is visible.";
  }
  return "User is not in camera.";
};

const registerFailure = async ({ userId, sessionId, reason, trigger }) => {
  if (!sessionId) return { warningCount: 0, terminated: false };
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) return { warningCount: 0, terminated: false };
  if (session.status === "terminated") {
    return { warningCount: session.identityWarnings || MAX_WARNINGS, terminated: true };
  }
  session.identityWarnings = (session.identityWarnings || 0) + 1;
  session.identityEvents.push({ eventType: "verification_failed", reason, trigger, occurredAt: new Date() });
  const terminated = session.identityWarnings >= MAX_WARNINGS;
  if (terminated) {
    session.status = "terminated";
    session.terminatedAt = new Date();
    session.terminationReason = `Identity verification failed: ${reason}`;
  }
  await session.save();
  return { warningCount: session.identityWarnings, terminated };
};

// Check if user has completed face enrollment
router.get("/status", verifyToken, async (req, res) => {
  try {
    const profile = await FaceProfile.exists({ userId: req.userId });
    res.json({ enrolled: Boolean(profile) });
  } catch (error) {
    res.status(500).json({ message: "Failed to check enrollment status." });
  }
});

/**
 * CONTINUOUS FRAME ANALYSIS:
 * Always returns HTTP 200 with structured analysis data.
 */
router.post("/analyze", verifyToken, async (req, res) => {
  try {
    const hasFrame = Boolean(req.body?.frame);
    const frameSizeKb = hasFrame ? Math.round(req.body.frame.length / 1024) : 0;

    console.log(`[FACE API] /api/face/analyze HIT - frame received: ${hasFrame}, size: ${frameSizeKb} KB, hasBaseline: ${Boolean(req.body?.baseline)}`);

    if (!hasFrame) {
      return res.json({
        success: true,
        faceDetected: false,
        faceCount: 0,
        pose: null,
        confidence: 0,
        message: "No frame received.",
      });
    }

    const analysis = await detectAndAnalyzeFrame(req.body.frame, req.body.baseline);
    res.json(analysis);
  } catch (error) {
    console.error("Frame analysis error:", error);
    res.json({
      success: true,
      faceDetected: false,
      faceCount: 0,
      pose: null,
      confidence: 0,
      message: "Analysis error. Keep your face visible.",
    });
  }
});

/**
 * 4-POSE LIVENESS ENROLLMENT:
 * Takes the 4 captured frames (Front, Right, Left, Up), validates liveness match,
 * and saves the candidate's reference face profile.
 */
router.post("/enroll", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { captures, frames } = req.body;
    const frameList = frames || (Array.isArray(captures) ? captures.map((c) => c.frame) : []);

    if (!Array.isArray(frameList) || frameList.length < 4) {
      return res.status(400).json({
        verified: false,
        message: "All 4 pose views (Front, Right, Left, Up) are required for enrollment.",
      });
    }

    const userDoc = await User.findById(userId).select("name firstName");
    const userName = userDoc?.name || userDoc?.firstName || "Candidate";

    const livenessResult = await isLivenessMatch(frameList);

    if (!livenessResult.match) {
      return res.status(422).json({
        verified: false,
        message: livenessResult.reason || "User mismatch found across views. Please retry.",
      });
    }

    await FaceProfile.findOneAndUpdate(
      { userId },
      {
        embeddings: [livenessResult.embedding],
        verificationVersion: 1,
        enrolledAt: new Date(),
      },
      { upsert: true, new: true }
    );

    console.log(`✅ [FaceAPI] Identity enrolled for ${userName} (${userId}) - ${livenessResult.confidence}% confidence`);

    res.status(201).json({
      verified: true,
      enrolled: true,
      userName,
      confidence: livenessResult.confidence,
      message: `All views captured & verified ✓`,
    });
  } catch (error) {
    console.error("❌ [FaceAPI] Enrollment error:", error);
    res.status(500).json({
      verified: false,
      message: error.message || "Enrollment could not be completed.",
    });
  }
});

/**
 * LIVE USER VERIFICATION (CONTINUOUS 2-3s IN-INTERVIEW & POST-ENROLLMENT):
 * Compares live frame against stored enrolled face embedding.
 * Returns structured metrics:
 * - faceDetected: boolean
 * - faceCount: number
 * - identityMatch: boolean
 * - matchScore: number (0-100)
 * - livenessPassed: boolean
 */
router.post("/verify-live", verifyToken, async (req, res) => {
  try {
    const profile = await FaceProfile.findOne({ userId: req.userId }).select("+embeddings");
    if (!profile || !profile.embeddings || profile.embeddings.length === 0) {
      return res.status(404).json({
        success: false,
        status: "not_enrolled",
        faceDetected: false,
        identityMatch: false,
        message: "Enrollment is required before live verification.",
      });
    }

    const { frame, sessionId } = req.body;
    if (!frame) {
      return res.json({
        success: true,
        status: "no_face",
        faceDetected: false,
        faceCount: 0,
        identityMatch: false,
        reason: "User is not in camera",
        message: "User is not in camera",
      });
    }

    const analysis = await detectAndAnalyzeFrame(frame);

    // Case A: No face detected
    if (!analysis.faceDetected || analysis.faceCount === 0 || !analysis.embedding) {
      return res.json({
        success: true,
        status: "no_face",
        faceDetected: false,
        faceCount: 0,
        identityMatch: false,
        reason: "User is not in camera",
        message: "User is not in camera",
      });
    }

    // Case D: Multiple faces detected
    if (analysis.faceCount > 1) {
      return res.json({
        success: true,
        status: "multiple_faces",
        faceDetected: true,
        faceCount: analysis.faceCount,
        identityMatch: false,
        reason: "Multiple people detected. Please ensure only the enrolled user is visible.",
        message: "Multiple people detected. Please ensure only the enrolled user is visible.",
      });
    }

    // Compare live embedding to enrolled reference embedding
    const referenceEmbedding = profile.embeddings[0];
    const distance = faceDistance(referenceEmbedding, analysis.embedding);

    // Distance threshold: <= 0.52 indicates genuine matching candidate
    const isMatched = distance <= 0.52;
    // Calculate accurate Match Score (0 - 100%)
    const matchScore = Math.max(0, Math.min(100, Math.round((1 - distance / 0.70) * 100)));

    if (isMatched) {
      // Case B: Exactly one face matching enrolled identity
      return res.json({
        success: true,
        status: "matched",
        faceDetected: true,
        faceCount: 1,
        identityMatch: true,
        matchScore,
        distance: Number(distance.toFixed(3)),
        livenessPassed: true,
        message: "Identity Verified",
      });
    } else {
      // Case C: One face detected, but does NOT match enrolled user
      return res.json({
        success: true,
        status: "mismatch",
        faceDetected: true,
        faceCount: 1,
        identityMatch: false,
        matchScore,
        distance: Number(distance.toFixed(3)),
        reason: "User match not found",
        message: "User match not found",
      });
    }
  } catch (error) {
    console.error("❌ [FaceAPI] Live verification error:", error);
    res.status(500).json({
      success: false,
      status: "error",
      faceDetected: false,
      identityMatch: false,
      message: "Live verification encountered an error.",
    });
  }
});

// Periodic in-interview verification with failure registration
router.post("/verify", verifyToken, async (req, res) => {
  try {
    const profile = await FaceProfile.findOne({ userId: req.userId }).select("+embeddings verificationVersion");
    if (!profile) {
      return res.status(404).json({ message: "Interview identity enrollment is required.", enrollmentRequired: true });
    }

    const { frame, sessionId, trigger = "periodic", reason: clientReason } = req.body;
    
    // If client is reporting camera disconnected or client-side confirmed violation
    if (trigger === "camera_unavailable" || clientReason === "camera_unavailable") {
      let warningCount = 0;
      let terminated = false;
      if (sessionId) {
        ({ warningCount, terminated } = await registerFailure({
          userId: req.userId,
          sessionId,
          reason: "Camera disconnected",
          trigger: "camera_unavailable",
        }));
      }
      return res.json({
        verified: false,
        warningCount,
        terminated,
        reason: "Camera disconnected",
        message: "Camera access is required to continue the interview.",
      });
    }

    const analysis = await detectAndAnalyzeFrame(frame);

    if (!analysis.faceDetected || !analysis.embedding) {
      let warningCount = 0;
      let terminated = false;
      if (sessionId && clientReason) {
        ({ warningCount, terminated } = await registerFailure({
          userId: req.userId,
          sessionId,
          reason: analysis.faceCount > 1 ? "Multiple people detected" : "User is not in camera",
          trigger,
        }));
      }
      return res.json({
        verified: false,
        warningCount,
        terminated,
        faceCount: analysis.faceCount,
        reason: analysis.faceCount > 1 ? "Multiple people detected" : "User is not in camera",
        message: analysis.faceCount > 1 ? "Multiple people detected." : "User is not in camera.",
      });
    }

    const distance = Math.min(...profile.embeddings.map((reference) => faceDistance(reference, analysis.embedding)));
    const verified = distance <= 0.52;
    const matchScore = Math.max(0, Math.min(100, Math.round((1 - distance / 0.70) * 100)));
    let warningCount = 0;
    let terminated = false;

    if (sessionId && !verified && clientReason) {
      ({ warningCount, terminated } = await registerFailure({
        userId: req.userId,
        sessionId,
        reason: "User match not found",
        trigger,
      }));
    }

    res.json({
      verified,
      identityMatch: verified,
      matchScore,
      distance: Number(distance.toFixed(3)),
      warningCount,
      terminated,
      message: verified ? "Identity verified." : verificationMessage("User match not found", terminated),
    });
  } catch (error) {
    res.status(500).json({ verified: false, message: error.message || "Verification service error." });
  }
});

export default router;
