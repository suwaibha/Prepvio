import { useCallback, useEffect, useRef, useState } from "react";
import { mainApi } from "../../../utils/apiClient";
import { Camera, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const REQUIRED_POSES = ["front", "left", "right", "up"];
const instructions = { blink: "Blink once naturally", front: "Look straight at the camera", left: "Turn your head to the left about 45°", right: "Turn your head to the right about 45°", up: "Look up slightly" };
const labels = { blink: "Liveness check", front: "Front face", left: "Turn left", right: "Turn right", up: "Look up" };

const FaceEnrollment = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const busyRef = useRef(false);
  const stepRef = useRef(0);
  const capturesRef = useRef([]);
  const submittingRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [, setCaptures] = useState([]);
  const [message, setMessage] = useState("Preparing secure camera verification…");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // A natural blink lasts only a fraction of a second and can be missed while
  // the server is processing a frame. A front capture followed by randomized
  // head-pose challenges provides reliable, automatic liveness instead.
  const challengesRef = useRef(["front", ...["left", "right", "up"].sort(() => Math.random() - 0.5)]);
  const currentChallenge = challengesRef.current[step];

  const stopCamera = useCallback(() => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video?.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  }, []);

  const advance = useCallback(async (frame) => {
    const activeStep = stepRef.current;
    const activeChallenge = challengesRef.current[activeStep];
    const nextCaptures = activeChallenge === "blink" ? capturesRef.current : [...capturesRef.current, { pose: activeChallenge, frame }];
    capturesRef.current = nextCaptures;
    if (activeChallenge !== "blink") setCaptures(nextCaptures);
    if (activeStep + 1 >= challengesRef.current.length) {
      clearInterval(timerRef.current);
      submittingRef.current = true;
      setSubmitting(true);
      setMessage("Creating your permanent interview identity…");
      try {
        await mainApi.post("/face/enroll", { captures: nextCaptures });
        stopCamera();
        const state = location.state || {};
        const rounds = state.rounds || [];
        const isSpecificRound = state.selectionMode === "specific" && state.selectedRoundIndex !== null;
        const response = await mainApi.post("/interview-session/start", {
          companyType: state.companyType,
          role: state.role,
          roundSelection: isSpecificRound ? "SPECIFIC_ROUNDS" : "ALL_ROUNDS",
          selectedRounds: isSpecificRound ? [rounds[state.selectedRoundIndex]?.name] : rounds.map((round) => round.name),
        });
        if (response.data && response.data.sessionId) {
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
          throw new Error("Invalid start interview session response");
        }
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Enrollment could not be completed. Please try again.");
        submittingRef.current = false;
        setSubmitting(false);
      }
      return;
    }
    stepRef.current += 1;
    setStep(stepRef.current);
    setMessage("Pose detected. Continue with the next instruction.");
  }, [location.state, navigate, stopCamera]);

  useEffect(() => {
    let active = true;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
        if (!active) return stream.getTracks().forEach((track) => track.stop());
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setMessage("Keep your face inside the guide. Captures happen automatically.");
        timerRef.current = setInterval(async () => {
          if (busyRef.current || submittingRef.current) return;
          const frame = captureFrame();
          if (!frame) return;
          busyRef.current = true;
          try {
            const response = await mainApi.post("/face/analyze", { frame });
            const activeChallenge = challengesRef.current[stepRef.current];
            const matched = activeChallenge === "blink" ? response.data.eyesClosed : response.data.pose === activeChallenge;
            if (matched) await advance(frame);
          } catch (analysisError) {
            const message = analysisError.response?.data?.message || "Center your face and improve the lighting.";
            console.warn("Face analysis rejected the current camera frame:", message);
            setMessage(message);
          } finally { busyRef.current = false; }
        }, 1100);
      } catch (cameraError) {
        setError("Camera permission is required to create your interview identity. Allow access and try again.");
      }
    };
    start();
    return () => { active = false; stopCamera(); };
  }, [advance, captureFrame, stopCamera]);

  return <div className="min-h-screen bg-[#FDFBF9] px-4 py-8 flex items-center justify-center">
    <div className="w-full max-w-2xl rounded-[2rem] bg-white shadow-2xl p-6 md:p-10 border border-gray-100">
      <div className="flex items-center gap-3 text-[#1A1A1A]"><div className="p-3 rounded-2xl bg-[#D4F478]"><ShieldCheck /></div><div><p className="text-sm font-bold uppercase tracking-widest text-gray-400">Interview identity</p><h1 className="text-3xl font-black">Secure face enrollment</h1></div></div>
      <div className="mt-7 flex gap-2">{challengesRef.current.map((item, index) => <div key={item} className={`h-2 flex-1 rounded-full ${index < step ? "bg-[#D4F478]" : index === step ? "bg-[#1A1A1A]" : "bg-gray-200"}`} />)}</div>
      <div className="mt-7 relative overflow-hidden rounded-3xl bg-black aspect-video"><video ref={videoRef} muted playsInline className="h-full w-full object-cover -scale-x-100" /><div className="absolute inset-8 rounded-[45%] border-4 border-[#D4F478] shadow-[0_0_0_9999px_rgba(0,0,0,.22)] pointer-events-none" /></div>
      <div className="mt-7 text-center"><p className="font-bold text-[#1A1A1A]">{labels[currentChallenge] || "Finishing"} · Step {Math.min(step + 1, challengesRef.current.length)} of {challengesRef.current.length}</p><h2 className="mt-2 text-2xl font-black">{instructions[currentChallenge] || "Saving your identity"}</h2><p className="mt-3 text-gray-500">{message}</p></div>
      {error && <div className="mt-6 flex gap-3 rounded-2xl bg-red-50 p-4 text-red-700"><AlertCircle className="shrink-0" /><p>{error}</p></div>}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500"><Camera size={16} /> No photos are uploaded or stored—only encrypted face embeddings are saved.</div>
      {submitting && <div className="mt-5 flex justify-center"><CheckCircle2 className="animate-pulse text-green-600" /></div>}
    </div>
  </div>;
};

export default FaceEnrollment;
