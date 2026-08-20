import { Router } from "express";
import { verifyToken } from "../../middleware/authMiddleware.js";
import { FaceProfile } from "../../Models/FaceProfile.js";
import { analyzeFaceFrame, averageEmbeddings, faceDistance } from "../services/faceRecognitionService.js";
import { InterviewSession } from "../models/InterviewSession.js";

const router = Router();
const MAX_WARNINGS = 3;

const verificationMessage = (reason, terminated = false) => {
  if (terminated) {
    return "Interview terminated because identity verification failed after three warnings.";
  }

  if (/mismatch|registered candidate/i.test(reason)) {
    return "We could not verify that you are the registered candidate. This interview will terminate after three warnings.";
  }

  return "Your camera does not provide a clear view of you. Turn on your camera, face it directly, and improve the lighting. This interview will terminate after three warnings.";
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
    session.terminationReason = "Identity verification failed three times";
  }
  await session.save();
  return { warningCount: session.identityWarnings, terminated };
};

router.get("/status", verifyToken, async (req, res) => {
  const profile = await FaceProfile.exists({ userId: req.userId });
  res.json({ enrolled: Boolean(profile) });
});

router.post("/analyze", verifyToken, async (req, res) => {
  try {
    const result = await analyzeFaceFrame(req.body.frame);
    res.json({ pose: result.pose, eyesClosed: result.eyesClosed });
  } catch (error) {
    res.status(422).json({ message: error.message || "Unable to analyze webcam frame." });
  }
});

router.post("/enroll", verifyToken, async (req, res) => {
  try {
    if (await FaceProfile.exists({ userId: req.userId })) return res.status(409).json({ message: "Interview identity is already enrolled." });
    const { captures } = req.body;
    if (!Array.isArray(captures) || captures.length < 4) return res.status(400).json({ message: "Complete every required liveness pose before enrolling." });
    const expectedPoses = ["front", "left", "right", "up"];
    const analyzed = await Promise.all(captures.map(({ frame }) => analyzeFaceFrame(frame)));
    const capturedPoses = analyzed.map((entry) => entry.pose);
    if (!expectedPoses.every((pose) => capturedPoses.includes(pose))) return res.status(400).json({ message: "The required face poses were not detected. Please complete enrollment again." });
    const embeddings = analyzed.map((entry) => entry.embedding);
    await FaceProfile.create({ userId: req.userId, embeddings: [averageEmbeddings(embeddings)], verificationVersion: 1 });
    res.status(201).json({ enrolled: true, verificationVersion: 1 });
  } catch (error) {
    res.status(422).json({ message: error.message || "Unable to enroll the interview identity." });
  }
});

router.post("/verify", verifyToken, async (req, res) => {
  try {
    const profile = await FaceProfile.findOne({ userId: req.userId }).select("+embeddings verificationVersion");
    if (!profile) return res.status(404).json({ message: "Interview identity enrollment is required.", enrollmentRequired: true });
    const { frame, sessionId, trigger = "periodic" } = req.body;
    let live;
    try {
      live = await analyzeFaceFrame(frame);
    } catch (analysisError) {
      // A missing, dark, or blurry frame is a camera-quality problem, not
      // proof that a different person is present. Do not consume identity
      // warnings for transient webcam conditions.
      return res.status(422).json({ verified: false, warningCount: 0, terminated: false, message: analysisError.message });
    }
    const distance = Math.min(...profile.embeddings.map((reference) => faceDistance(reference, live.embedding)));
    const verified = distance <= 0.52;
    let warningCount = 0;
    let terminated = false;
    if (sessionId && !verified) {
      ({ warningCount, terminated } = await registerFailure({ userId: req.userId, sessionId, reason: "Face mismatch", trigger }));
    }
    res.json({
      verified,
      distance: Number(distance.toFixed(3)),
      warningCount,
      terminated,
      message: verified ? "Identity verified." : verificationMessage("Face mismatch", terminated),
    });
  } catch (error) {
    res.status(422).json({ verified: false, message: error.message || "Unable to verify the interview identity." });
  }
});

export default router;
