import React, { useCallback, useEffect, useRef, useState } from "react";
import { mainApi } from "../../../utils/apiClient";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  User,
  RotateCcw,
  Check,
  Eye,
  Crosshair,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/authstore";

// 4 Sequential automatic capture steps
const POSES = [
  { id: "front", label: "Front", instruction: "Look straight at the camera", icon: User },
  { id: "right", label: "Right", instruction: "Turn your head slightly to the RIGHT", icon: ArrowRight },
  { id: "left", label: "Left", instruction: "Turn your head slightly to the LEFT", icon: ArrowLeft },
  { id: "up", label: "Up", instruction: "Look slightly UP", icon: ArrowUp },
];

const CALIBRATION_FRAMES_REQUIRED = 12;
const STABILITY_REQUIRED_MS = 800;

const NO_FACE_WARNINGS = [
  "User is not in camera.",
  "Please stay in front of the camera.",
  "User verification failed.",
];

const MISMATCH_WARNINGS = [
  "User match not found. Please return to the camera.",
  "User match not found. Please return to the camera.",
  "User verification failed.",
];

const MULTIPLE_FACES_WARNINGS = [
  "Multiple people detected. Please ensure only the enrolled user is visible.",
  "Multiple people detected. Please ensure only the enrolled user is visible.",
  "User verification failed.",
];

const FaceEnrollment = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const loopTimerRef = useRef(null);
  const isBusyRef = useRef(false);

  // State Machine References
  // stages: "CALIBRATING" | "CAPTURING_POSES" | "ENROLLING" | "LIVE_VERIFYING" | "VERIFIED" | "FAILED"
  const stageRef = useRef("CALIBRATING");
  const stepIndexRef = useRef(0);
  const capturedFramesRef = useRef({});
  const stableSinceRef = useRef(null);
  const isCapturedStepRef = useRef(false);

  // Calibration Reference Data
  const baselineRef = useRef(null);
  const calibrationSamplesRef = useRef([]);

  // Live Verification Debounce References
  const consecutiveFailuresRef = useRef(0);
  const badStateStartTimeRef = useRef(null);
  const activeViolationEpisodeRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  // Component UI State
  const [stage, setStage] = useState("CALIBRATING");
  const [calibrationCount, setCalibrationCount] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedThumbnails, setCapturedThumbnails] = useState({});
  const [stepSuccessMsg, setStepSuccessMsg] = useState("");
  const [liveFeedback, setLiveFeedback] = useState("Calibrating neutral position...");
  const [liveDetection, setLiveDetection] = useState({ pose: null, confidence: null });
  const [verifiedMatchScore, setVerifiedMatchScore] = useState(null);
  const [warningCount, setWarningCount] = useState(0);
  const [warningText, setWarningText] = useState("");
  const [isFailed, setIsFailed] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");
  const [cameraError, setCameraError] = useState("");

  const activePoseObj = POSES[currentStep] || POSES[0];

  const stopCamera = useCallback(() => {
    if (loopTimerRef.current) clearInterval(loopTimerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, []);

  /**
   * Captures frame from live video mirrored to match user perspective
   */
  const captureMirroredFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;

    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");

    // Mirror horizontally so preview alignment matches frame analysis
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", 0.75);
  }, []);

  /**
   * Proceeds to interview session upon successful verification
   */
  const proceedToInterview = useCallback(async () => {
    const state = location.state || {};
    const rounds = state.rounds || [];
    const isSpecificRound = state.selectionMode === "specific" && state.selectedRoundIndex !== null;

    try {
      const response = await mainApi.post("/interview-session/start", {
        companyType: state.companyType,
        role: state.role,
        roundSelection: isSpecificRound ? "SPECIFIC_ROUNDS" : "ALL_ROUNDS",
        selectedRounds: isSpecificRound
          ? [rounds[state.selectedRoundIndex]?.name]
          : rounds.map((r) => r.name),
      });

      if (response.data?.sessionId) {
        navigate("/services/check-your-ability/interview/start", {
          replace: true,
          state: {
            ...state,
            sessionId: response.data.sessionId,
            preventBack: true,
            targetRoundName: isSpecificRound ? rounds[state.selectedRoundIndex]?.name : null,
          },
        });
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Failed to start session:", err);
      navigate("/dashboard");
    }
  }, [location.state, navigate]);

  /**
   * Submits all 4 captured poses to /api/face/enroll
   */
  const enrollAllViews = useCallback(
    async (framesMap) => {
      stageRef.current = "ENROLLING";
      setStage("ENROLLING");
      setLiveFeedback("All views captured ✓ Creating your identity profile...");

      try {
        const frameList = POSES.map((p) => framesMap[p.id]);
        const res = await mainApi.post("/face/enroll", { frames: frameList });

        if (res.data?.verified) {
          console.log("[FACE] All 4 views enrolled. Transitioning to continuous live verification.");
          stageRef.current = "LIVE_VERIFYING";
          setStage("LIVE_VERIFYING");
          setLiveFeedback("Checking...");
        } else {
          throw new Error(res.data?.message || "Enrollment failed.");
        }
      } catch (err) {
        console.error("Enrollment error:", err);
        setIsFailed(true);
        stageRef.current = "FAILED";
        setStage("FAILED");
        setTerminationReason(err.response?.data?.message || "Enrollment failed. Please restart.");
      }
    },
    []
  );

  /**
   * Reset workflow
   */
  const handleRestart = useCallback(() => {
    stageRef.current = "CALIBRATING";
    stepIndexRef.current = 0;
    capturedFramesRef.current = {};
    stableSinceRef.current = null;
    isCapturedStepRef.current = false;
    baselineRef.current = null;
    calibrationSamplesRef.current = [];
    consecutiveFailuresRef.current = 0;
    badStateStartTimeRef.current = null;
    activeViolationEpisodeRef.current = null;

    setStage("CALIBRATING");
    setCalibrationCount(0);
    setCurrentStep(0);
    setCapturedThumbnails({});
    setStepSuccessMsg("");
    setWarningCount(0);
    setWarningText("");
    setIsFailed(false);
    setTerminationReason("");
    setLiveFeedback("Calibrating neutral position...");
  }, []);

  /**
   * Main camera polling loop: runs single continuous cycle
   */
  useEffect(() => {
    let isActive = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Run frame analysis loop every 300ms during capture, 2500ms during live verification
        loopTimerRef.current = setInterval(async () => {
          if (isBusyRef.current || isFailed) return;
          const currentStage = stageRef.current;
          if (currentStage === "ENROLLING" || currentStage === "VERIFIED" || currentStage === "FAILED") return;

          const frame = captureMirroredFrame();
          if (!frame) return;

          isBusyRef.current = true;

          try {
            const currentStepIdx = stepIndexRef.current;
            const targetPose = POSES[currentStepIdx]?.id;

            // -------------------------------------------------------------
            // PHASE 0: FRONT NEUTRAL CALIBRATION
            // -------------------------------------------------------------
            if (currentStage === "CALIBRATING") {
              const res = await mainApi.post("/face/analyze", {
                frame,
                baseline: baselineRef.current,
              });

              const { faceDetected, faceCount, isInsideGuide, rawPitch, rawYaw, message } = res.data;

              if (faceDetected && faceCount === 1 && isInsideGuide && rawPitch !== undefined && rawYaw !== undefined) {
                calibrationSamplesRef.current.push({ pitch: rawPitch, yaw: rawYaw });
                const sampleCount = calibrationSamplesRef.current.length;
                setCalibrationCount(sampleCount);
                setLiveFeedback(`Calibrating neutral position... (${sampleCount}/${CALIBRATION_FRAMES_REQUIRED})`);

                if (sampleCount >= CALIBRATION_FRAMES_REQUIRED) {
                  const avgPitch =
                    calibrationSamplesRef.current.reduce((a, b) => a + b.pitch, 0) / sampleCount;
                  const avgYaw =
                    calibrationSamplesRef.current.reduce((a, b) => a + b.yaw, 0) / sampleCount;

                  baselineRef.current = {
                    pitch: Number(avgPitch.toFixed(3)),
                    yaw: Number(avgYaw.toFixed(3)),
                  };

                  console.log("[FACE] Baseline successfully calibrated:", baselineRef.current);
                  setLiveFeedback("Neutral position detected ✓");

                  setTimeout(() => {
                    stageRef.current = "CAPTURING_POSES";
                    setStage("CAPTURING_POSES");
                    setLiveFeedback(POSES[0].instruction);
                  }, 400);
                }
              } else {
                setLiveFeedback(message || "Center your face in the guide looking straight");
              }
              return;
            }

            // -------------------------------------------------------------
            // PHASE 1: AUTOMATIC 4-POSE CAPTURE
            // -------------------------------------------------------------
            if (currentStage === "CAPTURING_POSES") {
              if (!targetPose || isCapturedStepRef.current) return;

              const res = await mainApi.post("/face/analyze", {
                frame,
                baseline: baselineRef.current,
              });

              const { faceDetected, faceCount, isInsideGuide, pose, confidence, message } = res.data;

              setLiveDetection({ pose, confidence });

              if (!faceDetected || faceCount === 0) {
                stableSinceRef.current = null;
                setLiveFeedback(message || "No face detected");
                return;
              }

              if (faceCount > 1) {
                stableSinceRef.current = null;
                setLiveFeedback("Multiple faces detected. Ensure only you are visible");
                return;
              }

              if (isInsideGuide === false) {
                stableSinceRef.current = null;
                setLiveFeedback(message || "Position face in the guide");
                return;
              }

              // STRICT POSE MATCH CHECK
              const isPoseMatch = pose === targetPose && confidence >= 70;

              console.log(
                `[FACE] Target: ${targetPose} | Detected: ${pose} | Confidence: ${confidence}% | Match: ${isPoseMatch}`
              );

              if (isPoseMatch) {
                const now = Date.now();
                if (!stableSinceRef.current) {
                  stableSinceRef.current = now;
                }

                const stableDuration = now - stableSinceRef.current;

                if (stableDuration >= STABILITY_REQUIRED_MS && !isCapturedStepRef.current) {
                  isCapturedStepRef.current = true;
                  console.log(
                    `[FACE] Target: ${targetPose} | Detected: ${pose} | Confidence: ${confidence} | Stable: ${stableDuration}ms | Capturing ${targetPose} automatically`
                  );

                  // Freeze & store captured frame
                  const nextFrames = { ...capturedFramesRef.current, [targetPose]: frame };
                  capturedFramesRef.current = nextFrames;
                  setCapturedThumbnails({ ...nextFrames });

                  const label = POSES[currentStepIdx].label;
                  setStepSuccessMsg(`${label} view captured ✓`);

                  // Advance to next pose or submit all
                  const nextStepIdx = currentStepIdx + 1;
                  stableSinceRef.current = null;

                  if (nextStepIdx < POSES.length) {
                    setTimeout(() => {
                      stepIndexRef.current = nextStepIdx;
                      setCurrentStep(nextStepIdx);
                      isCapturedStepRef.current = false;
                      setStepSuccessMsg("");
                      setLiveFeedback(POSES[nextStepIdx].instruction);
                    }, 400);
                  } else {
                    setTimeout(() => {
                      enrollAllViews(nextFrames);
                    }, 500);
                  }
                } else {
                  setLiveFeedback(`Hold steady... (${Math.round((stableDuration / STABILITY_REQUIRED_MS) * 100)}%)`);
                }
              } else {
                // Wrong pose: immediately reset stability timer and do NOT capture
                stableSinceRef.current = null;
                setLiveFeedback(POSES[currentStepIdx].instruction);
              }
            }

            // -------------------------------------------------------------
            // PHASE 2: CONTINUOUS LIVE VERIFICATION (POST-ENROLLMENT)
            // -------------------------------------------------------------
            else if (currentStage === "LIVE_VERIFYING") {
              const res = await mainApi.post("/face/verify-live", { frame });
              const { status, identityMatch, matchScore, livenessPassed, reason } = res.data;
              const now = Date.now();

              console.log(
                `[VERIFY] Live verification status: ${status} | MatchScore: ${matchScore}% | Match: ${identityMatch}`
              );

              // CASE A: USER MATCHED
              if (status === "matched" && identityMatch) {
                console.log(`[VERIFY] Face detected | Face Match: ${matchScore}% | User matched`);
                badStateStartTimeRef.current = null;
                activeViolationEpisodeRef.current = null;
                setVerifiedMatchScore(matchScore || 94);
                stageRef.current = "VERIFIED";
                setStage("VERIFIED");
                setLiveFeedback("User verified ✓");

                setTimeout(() => {
                  proceedToInterview();
                }, 1600);
                return;
              }

              // CASE B, C, D: VIOLATION HANDLING WITH EPISODE DEBOUNCING
              const isViolation = status === "no_face" || status === "mismatch" || status === "multiple_faces";
              if (isViolation) {
                const violationMsg =
                  reason ||
                  (status === "no_face"
                    ? "User is not in camera."
                    : status === "multiple_faces"
                    ? "Multiple people detected. Please ensure only the enrolled user is visible."
                    : "User match not found.");

                if (!badStateStartTimeRef.current) {
                  badStateStartTimeRef.current = now;
                }

                const badDuration = now - badStateStartTimeRef.current;

                // Require at least 2200ms of persistent violation before issuing a strike
                if (badDuration >= 2200) {
                  // Only count strike once per violation episode
                  if (!activeViolationEpisodeRef.current) {
                    activeViolationEpisodeRef.current = status;
                    consecutiveFailuresRef.current += 1;
                    const attempt = consecutiveFailuresRef.current;
                    setWarningCount(attempt);

                    const warningList =
                      status === "no_face"
                        ? NO_FACE_WARNINGS
                        : status === "multiple_faces"
                        ? MULTIPLE_FACES_WARNINGS
                        : MISMATCH_WARNINGS;

                    const msg = warningList[Math.min(attempt - 1, warningList.length - 1)];
                    setWarningText(msg);
                    setLiveFeedback(msg);

                    if (attempt >= 3) {
                      console.log("[VERIFY] 3 verification failures reached. Ending interview.");
                      stageRef.current = "FAILED";
                      setStage("FAILED");
                      setIsFailed(true);
                      setTerminationReason(violationMsg);
                    }
                  } else {
                    setLiveFeedback(violationMsg);
                  }
                } else {
                  setLiveFeedback(violationMsg);
                }
              } else {
                badStateStartTimeRef.current = null;
              }
            }
          } catch (err) {
            console.error("Frame processing error:", err);
          } finally {
            isBusyRef.current = false;
          }
        }, 300);
      } catch (camErr) {
        console.error("Webcam access error:", camErr);
        setCameraError("Camera permission is required. Please enable your webcam in browser settings.");
      }
    };

    startCamera();

    return () => {
      isActive = false;
      stopCamera();
    };
  }, [enrollAllViews, isFailed, proceedToInterview, stopCamera, captureMirroredFrame]);

  return (
    <div className="min-h-screen bg-[#FDFBF9] px-4 py-8 flex items-center justify-center font-sans text-gray-900">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl p-6 md:p-10 border border-gray-100 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#D4F478] text-black shadow-sm">
              <ShieldCheck size={28} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Interview Security</p>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900">Identity Verification</h1>
            </div>
          </div>
          {warningCount > 0 && stage !== "VERIFIED" && (
            <div className="px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 animate-pulse">
              Warning {warningCount}/3
            </div>
          )}
        </div>

        {/* Progress Tracker: ● Front ○ Right ○ Left ○ Up */}
        <div className="mt-7 flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
          {POSES.map((pose, index) => {
            const isDone = Boolean(capturedThumbnails[pose.id]);
            const isCurrent = index === currentStep && !isDone && stage === "CAPTURING_POSES";

            return (
              <React.Fragment key={pose.id}>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-center">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isDone
                        ? "bg-green-500 text-white shadow-sm"
                        : isCurrent
                        ? "bg-[#1A1A1A] text-white ring-4 ring-[#D4F478]"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isDone ? <Check size={14} /> : index + 1}
                  </div>
                  <span
                    className={`text-xs font-semibold truncate ${
                      isDone ? "text-green-700 font-bold" : isCurrent ? "text-black font-black" : "text-gray-400"
                    }`}
                  >
                    {isDone ? `✓ ${pose.label}` : isCurrent ? `● ${pose.label}` : `○ ${pose.label}`}
                  </span>
                </div>
                {index < POSES.length - 1 && <span className="text-gray-300 font-bold text-xs">→</span>}
              </React.Fragment>
            );
          })}
        </div>

        {/* Camera Feed */}
        <div className="mt-6 relative">
          <div className="relative overflow-hidden rounded-3xl bg-black aspect-video flex items-center justify-center shadow-lg border border-gray-900">
            <video
              ref={videoRef}
              muted
              playsInline
              className="h-full w-full object-cover -scale-x-100"
            />

            {/* Oval Face Guide Overlay */}
            <div className="absolute inset-6 md:inset-8 rounded-[48%] border-4 border-[#D4F478] shadow-[0_0_0_9999px_rgba(0,0,0,0.38)] pointer-events-none transition-all duration-300 flex items-center justify-center">
              {stage === "CALIBRATING" && (
                <div className="text-white/90 text-xs font-bold tracking-wide flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm animate-pulse">
                  <Crosshair size={14} /> Hold still to calibrate
                </div>
              )}
              {stage === "CAPTURING_POSES" && activePoseObj.id === "right" && (
                <div className="absolute right-6 flex items-center gap-1.5 text-white bg-black/80 px-3.5 py-1.5 rounded-full text-xs font-bold animate-pulse">
                  Turn Right 45° <ArrowRight size={16} />
                </div>
              )}
              {stage === "CAPTURING_POSES" && activePoseObj.id === "left" && (
                <div className="absolute left-6 flex items-center gap-1.5 text-white bg-black/80 px-3.5 py-1.5 rounded-full text-xs font-bold animate-pulse">
                  <ArrowLeft size={16} /> Turn Left 45°
                </div>
              )}
              {stage === "CAPTURING_POSES" && activePoseObj.id === "up" && (
                <div className="absolute top-6 flex items-center gap-1.5 text-white bg-black/80 px-3.5 py-1.5 rounded-full text-xs font-bold animate-pulse">
                  <ArrowUp size={16} /> Look Slightly Up
                </div>
              )}
              {stage === "CAPTURING_POSES" && activePoseObj.id === "front" && (
                <div className="text-white/80 text-xs font-medium tracking-wide">Look Straight Here</div>
              )}
            </div>

            {/* Real-time Pose Detection Badge */}
            {liveDetection.pose && stage === "CAPTURING_POSES" && (
              <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs text-white flex items-center gap-2 border border-white/10">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-ping" />
                <span>
                  Detected: <b className="capitalize text-[#D4F478]">{liveDetection.pose}</b>
                </span>
                {liveDetection.confidence && <span className="text-gray-400">({liveDetection.confidence}%)</span>}
              </div>
            )}
          </div>

          {/* Dynamic Instructions & Status */}
          <div className="mt-5 text-center">
            {stage === "CALIBRATING" && (
              <div className="py-2">
                <p className="text-xs font-bold uppercase tracking-widest text-[#D4F478]">Initial Setup</p>
                <h2 className="mt-1 text-xl md:text-2xl font-black text-gray-900">Look straight at the camera</h2>
                <p className="mt-1 text-sm font-semibold text-gray-600">{liveFeedback}</p>
                <div className="mt-3 w-48 mx-auto h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-[#D4F478] transition-all duration-200"
                    style={{ width: `${Math.min(100, (calibrationCount / CALIBRATION_FRAMES_REQUIRED) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {stage === "CAPTURING_POSES" && (
              <>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Step {currentStep + 1} of 4: {activePoseObj.label}
                </p>
                <h2 className="mt-1 text-xl md:text-2xl font-black text-gray-900">
                  {stepSuccessMsg || activePoseObj.instruction}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{liveFeedback}</p>
              </>
            )}

            {stage === "ENROLLING" && (
              <div className="py-2">
                <h2 className="text-xl font-black text-gray-900">All views captured ✓</h2>
                <p className="text-sm text-gray-500 mt-1">Creating your biometric identity profile...</p>
              </div>
            )}

            {stage === "LIVE_VERIFYING" && (
              <div className="py-2">
                <h2 className="text-xl font-black text-gray-900">🛡 Identity Verification</h2>
                <p className="text-sm font-semibold text-blue-600 mt-1 flex items-center justify-center gap-2">
                  <Eye size={16} className="animate-pulse" /> {liveFeedback}
                </p>
              </div>
            )}

            {stage === "VERIFIED" && (
              <div className="py-2 animate-fade-in">
                <h2 className="text-2xl font-black text-green-700 flex items-center justify-center gap-2">
                  <CheckCircle2 size={24} /> User verified ✓
                </h2>
              </div>
            )}
          </div>

          {/* Captured Thumbnails Gallery */}
          <div className="mt-5 grid grid-cols-4 gap-2.5">
            {POSES.map((pose) => {
              const thumb = capturedThumbnails[pose.id];
              return (
                <div
                  key={pose.id}
                  className={`relative rounded-2xl overflow-hidden aspect-[4/3] border-2 transition-all duration-300 flex items-center justify-center ${
                    thumb ? "border-green-500 bg-black shadow-sm" : "border-dashed border-gray-200 bg-gray-50"
                  }`}
                >
                  {thumb ? (
                    <>
                      <img src={thumb} alt={pose.label} className="w-full h-full object-cover" />
                      <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                      <span className="absolute bottom-1 left-1 bg-black/75 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                        {pose.label}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 font-semibold">{pose.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Failure / Warning Notification with Restart */}
        {isFailed && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-red-100 text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 shadow-inner">
                <AlertCircle size={36} />
              </div>
              <h2 className="text-2xl font-black text-gray-900">🔴 Interview Ended</h2>
              <p className="text-sm font-bold text-red-700 mt-2">Identity verification failed.</p>
              <p className="text-xs text-gray-600 mt-2">
                The enrolled user could not be continuously verified.
              </p>
              <div className="mt-4 p-3.5 bg-red-50 rounded-2xl border border-red-200 text-xs font-semibold text-red-800">
                Reason: {terminationReason || warningText || "Identity verification failed."}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Your interview has been ended for security reasons.
              </p>
              <button
                onClick={() => navigate("/dashboard", { replace: true })}
                className="mt-6 w-full py-3.5 rounded-full bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Camera Permission Error */}
        {cameraError && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-800 text-sm">
            <AlertCircle size={20} className="shrink-0 text-amber-600" />
            <p>{cameraError}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceEnrollment;
