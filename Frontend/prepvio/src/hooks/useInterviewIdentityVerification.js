import { useCallback, useEffect, useRef, useState } from "react";
import { mainApi } from "../utils/apiClient";

const frameFromVideo = (video) => {
  if (!video || !video.videoWidth || !video.videoHeight) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext("2d");

  // Mirror horizontally to match the mirrored camera perspective
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.75);
};

const STARTUP_GRACE_MS = 3000;      // Delay before first verification to let camera stream fully start
const FAILURE_THRESHOLD_MS = 2200; // Continuous failure duration required before warning strike
const GRACE_PERIOD_MS = 10000;     // 10-second post-warning cooldown/grace period

export const useInterviewIdentityVerification = ({
  videoRef,
  sessionId,
  enabled,
  onWarning,
  onTerminated,
}) => {
  // Verification status: "VERIFYING" | "VERIFIED" | "WARNING" | "FAILED" | "CAMERA_ERROR"
  const [verificationState, setVerificationState] = useState({
    status: "VERIFYING",
    isVerified: false,
    matchScore: null,
    livenessPassed: false,
    warningCount: 0,
    warningMessage: "",
    violationReason: "",
    terminated: false,
    terminationReason: "",
  });

  const verifyingRef = useRef(false);
  const warningCountRef = useRef(0);
  const violationStartTimeRef = useRef(null);
  const lastWarningTimeRef = useRef(0); // Timestamp when last warning was generated
  const onWarningRef = useRef(onWarning);
  const onTerminatedRef = useRef(onTerminated);

  onWarningRef.current = onWarning;
  onTerminatedRef.current = onTerminated;

  const performVerification = useCallback(async () => {
    if (!enabled || verifyingRef.current || verificationState.terminated) return;

    const now = Date.now();
    const video = videoRef.current;

    // ── GUARD: srcObject not yet attached → camera is still initializing, skip silently ──
    // This prevents false "Camera Disconnected" warnings during the startup window
    // before getUserMedia attaches the stream to the video element.
    if (!video?.srcObject) {
      console.debug("[IDV] srcObject not ready yet — skipping check");
      return;
    }

    const track = video.srcObject.getVideoTracks?.()[0];
    // track.readyState === "live" is the reliable check for an active camera stream
    const isCameraLive = track && track.enabled && track.readyState === "live";
    console.debug("[IDV] track:", track?.readyState, "| isCameraLive:", isCameraLive, "| video.paused:", video?.paused);

    // 1. Check Camera Hardware Disconnection
    if (!isCameraLive) {
      const timeSinceLastWarning = now - lastWarningTimeRef.current;
      const inGracePeriod = lastWarningTimeRef.current > 0 && timeSinceLastWarning < GRACE_PERIOD_MS;
      const violationMsg = "Camera disconnected. Camera access is required to continue the interview.";

      if (inGracePeriod) {
        violationStartTimeRef.current = null;
        setVerificationState((prev) => ({
          ...prev,
          status: "CAMERA_ERROR",
          isVerified: false,
          warningMessage: `${violationMsg} (Warning ${warningCountRef.current} of 3)`,
          violationReason: "Camera disconnected",
        }));
        return;
      }

      if (!violationStartTimeRef.current) {
        violationStartTimeRef.current = now;
      }

      const violationDurationMs = now - violationStartTimeRef.current;

      if (violationDurationMs >= FAILURE_THRESHOLD_MS) {
        warningCountRef.current += 1;
        const currentStrike = warningCountRef.current;
        const isTerminated = currentStrike >= 3;

        lastWarningTimeRef.current = now;
        violationStartTimeRef.current = null;

        setVerificationState({
          status: isTerminated ? "FAILED" : "CAMERA_ERROR",
          isVerified: false,
          matchScore: null,
          livenessPassed: false,
          warningCount: currentStrike,
          warningMessage: `${violationMsg} (Warning ${currentStrike} of 3)`,
          violationReason: "Camera disconnected",
          terminated: isTerminated,
          terminationReason: isTerminated ? "Camera disconnected" : "",
        });

        onWarningRef.current?.({
          warningCount: currentStrike,
          reason: "Camera disconnected",
          message: `Camera disconnected. Warning ${currentStrike} of 3.`,
          terminated: isTerminated,
        });

        if (isTerminated) {
          onTerminatedRef.current?.({
            reason: "Camera disconnected",
            message: "Identity verification failed after 3 warnings.",
          });
        }
      }
      return;
    }

    const frame = frameFromVideo(video);
    if (!frame) return;

    verifyingRef.current = true;

    try {
      const response = await mainApi.post("/face/verify-live", {
        frame,
        sessionId,
      });

      const {
        status,
        faceDetected,
        faceCount,
        identityMatch,
        matchScore,
        livenessPassed,
        reason,
      } = response.data;

      const checkTime = Date.now();

      // -----------------------------------------------------------------
      // SUCCESS CASE: Exact matching enrolled user present
      // -----------------------------------------------------------------
      if (status === "matched" && identityMatch) {
        // User is verified: recover from any ongoing violation and clear grace period
        violationStartTimeRef.current = null;
        lastWarningTimeRef.current = 0;

        setVerificationState((prev) => ({
          ...prev,
          status: "VERIFIED",
          isVerified: true,
          matchScore: matchScore || 94,
          livenessPassed: Boolean(livenessPassed),
          warningMessage: "",
          violationReason: "",
        }));

        return;
      }

      // -----------------------------------------------------------------
      // VIOLATION HANDLING: No Face, Mismatch, or Multiple Faces
      // -----------------------------------------------------------------
      const violationType = status; // "no_face" | "mismatch" | "multiple_faces"
      const violationMsg =
        reason ||
        (violationType === "no_face"
          ? "User is not in camera."
          : violationType === "multiple_faces"
          ? "Multiple people detected. Please ensure only the enrolled user is visible."
          : "User match not found.");

      const timeSinceLastWarning = checkTime - lastWarningTimeRef.current;
      const inGracePeriod = lastWarningTimeRef.current > 0 && timeSinceLastWarning < GRACE_PERIOD_MS;

      // During the 10-second post-warning grace period:
      // Continue polling every 2.5s to detect if user returns, but DO NOT increment warnings or start failure timer.
      if (inGracePeriod) {
        violationStartTimeRef.current = null;

        setVerificationState((prev) => ({
          ...prev,
          status: "WARNING",
          isVerified: false,
          matchScore: matchScore || null,
          livenessPassed: false,
          warningMessage: `${violationMsg} (Warning ${warningCountRef.current} of 3)`,
          violationReason: violationMsg,
        }));
        return;
      }

      // Outside grace period (or grace period expired):
      // Require the full continuous failure threshold (2.2s) before generating next strike.
      if (!violationStartTimeRef.current) {
        violationStartTimeRef.current = checkTime;
      }

      const violationDurationMs = checkTime - violationStartTimeRef.current;

      if (violationDurationMs >= FAILURE_THRESHOLD_MS) {
        warningCountRef.current += 1;
        const currentStrike = warningCountRef.current;
        const isTerminated = currentStrike >= 3;

        // Start new 10-second grace period after this warning
        lastWarningTimeRef.current = checkTime;
        // Reset violation start timer so NEXT warning requires full continuous threshold after grace period
        violationStartTimeRef.current = null;

        setVerificationState({
          status: isTerminated ? "FAILED" : "WARNING",
          isVerified: false,
          matchScore: matchScore || null,
          livenessPassed: false,
          warningCount: currentStrike,
          warningMessage: `${violationMsg} (Warning ${currentStrike} of 3)`,
          violationReason: violationMsg,
          terminated: isTerminated,
          terminationReason: isTerminated ? violationMsg : "",
        });

        onWarningRef.current?.({
          warningCount: currentStrike,
          reason: violationMsg,
          message: `${violationMsg} Warning ${currentStrike} of 3.`,
          terminated: isTerminated,
        });

        if (isTerminated) {
          onTerminatedRef.current?.({
            reason: violationMsg,
            message: "Identity verification failed after 3 warnings.",
          });
        }
      } else {
        // Still accumulating continuous failure time towards next strike
        setVerificationState((prev) => ({
          ...prev,
          status: prev.warningCount > 0 ? "WARNING" : prev.status,
          isVerified: false,
          warningMessage: `${violationMsg}${prev.warningCount > 0 ? ` (Warning ${prev.warningCount} of 3)` : ""}`,
          violationReason: violationMsg,
        }));
      }
    } catch (err) {
      console.error("Live identity verification request error:", err);
    } finally {
      verifyingRef.current = false;
    }
  }, [enabled, sessionId, videoRef, verificationState.terminated]);

  // Run continuous verification every 2.5 seconds throughout the interview
  useEffect(() => {
    if (!enabled || verificationState.terminated) return undefined;

    // Delay the first check to allow the camera stream to fully attach
    // to the <video> element (avoids false "Camera Disconnected" on startup)
    const startupTimer = window.setTimeout(() => {
      performVerification();
    }, STARTUP_GRACE_MS);

    const intervalId = window.setInterval(() => {
      performVerification();
    }, 2500);

    return () => {
      window.clearTimeout(startupTimer);
      window.clearInterval(intervalId);
    };
  }, [enabled, performVerification, verificationState.terminated]);

  return {
    ...verificationState,
    verifyIdentity: performVerification,
  };
};
