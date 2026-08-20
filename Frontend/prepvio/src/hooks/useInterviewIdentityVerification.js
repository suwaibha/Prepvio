import { useCallback, useEffect, useRef, useState } from "react";
import { mainApi } from "../utils/apiClient";

const frameFromVideo = (video) => {
  if (!video?.videoWidth) return null;
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
};

export const useInterviewIdentityVerification = ({ videoRef, sessionId, enabled, onWarning, onTerminated }) => {
  const [warning, setWarning] = useState("");
  const verifyingRef = useRef(false);
  const hasReceivedCameraStreamRef = useRef(false);
  const warningRef = useRef(onWarning);
  const terminateRef = useRef(onTerminated);
  warningRef.current = onWarning;
  terminateRef.current = onTerminated;

  const verify = useCallback(async (trigger) => {
    if (!enabled || !sessionId || verifyingRef.current) return;
    const video = videoRef.current;
    const track = video?.srcObject?.getVideoTracks?.()[0];
    const frame = frameFromVideo(video);
    if (track?.readyState === "live") hasReceivedCameraStreamRef.current = true;
    // The camera has permission but has not produced its first frame yet.
    // Do not count that normal startup state as an identity failure.
    if (!frame && track?.readyState === "live" && track.enabled) return;
    if (!track && !hasReceivedCameraStreamRef.current) return;
    verifyingRef.current = true;
    try {
      const response = await mainApi.post("/face/verify", { frame, sessionId, trigger });
      if (!response.data.verified) {
        setWarning(response.data.terminated ? "Interview ended: identity verification failed three times." : response.data.warningCount ? `${response.data.message} Warning ${response.data.warningCount} of 3.` : response.data.message);
        if (response.data.terminated) terminateRef.current?.();
      } else {
        setWarning("");
      }
    } catch (error) {
      const verification = error.response?.data;
      // Face absence, darkness, multiple faces, and camera loss are expected
      // verification failures returned as 422—not transport failures.
      if (verification?.verified === false) {
        setWarning(verification.terminated
          ? "Interview ended: identity verification failed three times."
          : verification.warningCount ? `${verification.message} Warning ${verification.warningCount} of 3.` : verification.message);
        if (verification.terminated) terminateRef.current?.();
        return;
      }
      setWarning(verification?.message || "Camera verification could not be completed. Keep your face visible.");
    } finally { verifyingRef.current = false; }
  }, [enabled, sessionId, videoRef]);

  useEffect(() => {
    if (!enabled || !sessionId) return undefined;
    // Check every five seconds so an absent/covered/dark face follows the same
    // warning policy as an unavailable camera.
    const interval = window.setInterval(() => verify("periodic"), 5000);
    // Camera loss is time-sensitive: warn after 5 seconds, warn again after
    // another 5 seconds, and let the backend terminate on the third failure.
    const cameraHealthInterval = window.setInterval(() => {
      const track = videoRef.current?.srcObject?.getVideoTracks?.()[0];
      const cameraUnavailable = !track || !track.enabled || track.readyState !== "live";
      if (cameraUnavailable) verify("camera_unavailable");
    }, 5000);
    const onVisibility = () => { if (document.visibilityState === "visible") verify("tab_return"); };
    window.addEventListener("focus", onVisibility);
    document.addEventListener("visibilitychange", onVisibility);
    verify("interview_start");
    return () => {
      window.clearInterval(interval);
      window.clearInterval(cameraHealthInterval);
      window.removeEventListener("focus", onVisibility);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, sessionId, verify]);

  return { warning, verify };
};
