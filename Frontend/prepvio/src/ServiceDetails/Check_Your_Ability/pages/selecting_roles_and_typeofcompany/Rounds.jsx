import React, { useEffect, useState } from "react";
import { mainApi } from "../../../../utils/apiClient";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, PlayCircle, CheckCircle2, Clock, Sparkles, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../../../store/authstore.js";
import PlanBlockModal from "../../../../components/PlanBlockModal.jsx";

const Rounds = ({ companyType, role }) => {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cameraError, setCameraError] = useState(null); // Track camera permission errors
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [modalType, setModalType] = useState(null); // 'payment' | 'upgrade' | null
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState("all"); // 'all' | 'specific'
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(null);

  useEffect(() => {
    console.log("📊 Current user:", user);
    console.log("📊 Subscription:", user?.subscription);
    console.log("📊 Active:", user?.subscription?.active);
    console.log("📊 Credits remaining:", user?.subscription?.interviewsRemaining);
  }, [user]);



 const ROUNDS_DATA = {
  default: [
    { name: "Online Assessment", description: "Coding challenges and MCQs to test fundamental skills." },
    { name: "Technical Round 1", description: "Data structures, algorithms, and problem-solving questions." },
    { name: "Technical Round 2", description: "System design and advanced technical concepts." },
    { name: "Hiring Manager Round", description: "Behavioral questions and role-specific discussions." },
    { name: "HR Round", description: "Culture fit, salary negotiation, and offer discussion." },
  ],
  "Software Engineer": [
    { name: "Online Assessment", description: "LeetCode-style coding problems and aptitude tests." },
    { name: "Technical Phone Screen", description: "Live coding on data structures and algorithms." },
    { name: "System Design", description: "Design scalable systems like URL shortener or Twitter feed." },
    { name: "Behavioral Round", description: "STAR-based questions on teamwork, conflict, and leadership." },
    { name: "HR & Offer", description: "Final HR discussion, compensation, and onboarding." },
  ],
  "Product Manager": [
    { name: "Resume Screen", description: "Initial screening of background and PM experience." },
    { name: "Product Sense Round", description: "Design a product or improve an existing feature." },
    { name: "Analytical Round", description: "Metrics, data interpretation, and decision-making." },
    { name: "Leadership & Strategy", description: "Cross-functional collaboration and roadmap prioritization." },
    { name: "Executive Round", description: "High-level vision, culture fit, and final offer." },
  ],
  "Data Scientist": [
    { name: "Online Assessment", description: "Statistics, probability, and basic ML questions." },
    { name: "Technical Screen", description: "Python/SQL coding and data manipulation tasks." },
    { name: "ML System Design", description: "Design an end-to-end ML pipeline for a real-world problem." },
    { name: "Case Study Round", description: "Analyze a dataset and present actionable insights." },
    { name: "HR Round", description: "Team fit, expectations, and offer negotiation." },
  ],
  "UX Designer": [
    { name: "Portfolio Review", description: "Walk through your best design projects and process." },
    { name: "Design Challenge", description: "Take-home or live design task for a given user problem." },
    { name: "Critique Round", description: "Defend your design decisions and handle feedback." },
    { name: "Cross-functional Round", description: "Collaborate with PMs and Engineers in discussion." },
    { name: "HR Round", description: "Culture fit and final offer discussion." },
  ],
};

useEffect(() => {
  if (!companyType || !role) {
    navigate("/services/check-your-ability/interview", { replace: true });
    return;
  }
  const roleRounds = ROUNDS_DATA[role] || ROUNDS_DATA["default"];
  setRounds(roleRounds);
  setLoading(false);
}, [companyType, role, navigate]);

  const handleStartInterview = async () => {
    try {
      setCameraError(null); // Clear any previous errors

      const identityStatus = await mainApi.get("/face/status");
      if (!identityStatus.data || !identityStatus.data.enrolled) {
        navigate("/services/check-your-ability/interview/enroll", {
          state: { companyType, role, rounds, selectionMode, selectedRoundIndex },
        });
        return;
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((track) => track.stop());

      console.log("✅ Camera access granted");

      // Get selected rounds list
      let roundSelectionVal = "ALL_ROUNDS";
      let selectedRoundsVal = [];
      if (selectionMode === "specific" && selectedRoundIndex !== null) {
        roundSelectionVal = "SPECIFIC_ROUNDS";
        selectedRoundsVal = [rounds[selectedRoundIndex].name];
      } else {
        selectedRoundsVal = rounds.map(r => r.name);
      }

      // Start interview session (this will consume 1 credit)
      const res = await mainApi.post(
        "/interview-session/start",
        { 
          companyType, 
          role,
          roundSelection: roundSelectionVal,
          selectedRounds: selectedRoundsVal
        }
      );

      console.log("✅ Session started:", res.data);

      const sessionId = res.data.sessionId;

      navigate("/services/check-your-ability/interview/start", {
        state: {
          companyType,
          role,
          rounds,
          sessionId,
          preventBack: true,
          selectionMode,
          targetRoundName: selectionMode === "specific" && selectedRoundIndex !== null ? rounds[selectedRoundIndex].name : null,
        },
        replace: true,
      });

    } catch (error) {
      console.error("❌ Full error:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);

      // ✅ Handle camera/microphone permission denial & hardware errors
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError({
          title: "Camera/Microphone Access Required",
          message: "Please allow camera and microphone access to start the interview.",
          instructions: [
            "Click the camera icon in your browser's address bar",
            "Select 'Allow' for camera and microphone",
            "Click the button below to grant permission",
            "Reload the page if needed"
          ]
        });
        return;
      }

      if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setCameraError({
          title: "Camera Hardware / Device In Use",
          message: "Your camera or microphone is currently in use by another application or system process.",
          instructions: [
            "Close other apps using the camera (Zoom, Teams, Skype, Lenovo Vantage, etc.)",
            "Close other browser windows/tabs that may be using the camera",
            "Refresh the page and try again"
          ]
        });
        return;
      }

      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError({
          title: "Camera/Microphone Not Found",
          message: "No camera or microphone hardware was detected on your device.",
          instructions: [
            "Ensure your camera and microphone are plugged in and enabled",
            "Check your device manager or system privacy settings",
            "Refresh the page once connected"
          ]
        });
        return;
      }

      if (error.name === 'OverconstrainedError') {
        setCameraError({
          title: "Camera Constraints Error",
          message: "Your camera hardware could not satisfy the requested video resolution.",
          instructions: [
            "Check your camera device settings",
            "Refresh the page and try again"
          ]
        });
        return;
      }

      // Handle other errors
      if (error.response?.status === 403) {
        const data = error.response.data;
        console.log("🔒 403 Error data:", data);

        if (data.identityEnrollmentRequired) {
          setCameraError({
            title: "Interview Identity Required",
            message: data.message || "Please enroll your locked interview identity photo before starting.",
            instructions: [
              "Open Dashboard Settings",
              "Enroll a clear interview identity photo",
              "Return here and start the interview again"
            ],
            actionLabel: "Open Settings",
            actionPath: "/dashboard/setting"
          });
        } else if (data.requiresPayment) {
          setModalType('payment');
          setIsModalOpen(true);
        } else if (data.needsUpgrade) {
          setModalType('upgrade');
          setIsModalOpen(true);
        } else {
          setCameraError({
            title: "Access Denied",
            message: data.message || 'You do not have access to start an interview.',
            instructions: ["Please check your subscription status or contact support."]
          });
        }
      } else if (error.response) {
        console.error("Server error:", error.response.data);
        setCameraError({
          title: "Server Error",
          message: error.response.data.message || 'An error occurred on the server.',
          instructions: ["Please try again or contact support if the issue persists."]
        });
      } else if (error.request) {
        setCameraError({
          title: "Connection Error",
          message: "Unable to connect to the server.",
          instructions: ["Please check your internet connection and try again."]
        });
      } else {
        setCameraError({
          title: "Unexpected Error",
          message: error.message || "An unexpected error occurred.",
          instructions: ["Please refresh the page and try again."]
        });
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const roundVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 20,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto border-4 border-[#D4F478] border-t-transparent rounded-full"
          />
          <p className="text-gray-600 text-lg font-medium">
            Loading interview rounds…
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] p-6 font-sans selection:bg-[#D4F478] selection:text-black flex items-center justify-center relative overflow-hidden">
      {/* Background decorations matching Home.js */}
      <div className="fixed inset-0 pointer-events-none -z-50">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-t from-pink-50 to-transparent rounded-full blur-[120px] opacity-60" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-4xl bg-white/40 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-white/60 p-10 md:p-16 space-y-10 relative overflow-hidden"
      >
        {/* Floating decorations */}
        <motion.div
          animate={{
            y: [0, -12, 0],
            rotate: [0, 4, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-8 -right-8 w-32 h-32 bg-purple-200/40 rounded-full blur-3xl pointer-events-none"
        />

        <motion.div
          animate={{
            y: [0, 12, 0],
            rotate: [0, -4, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"
        />

        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-3 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6 text-[#D4F478]" />
            </motion.div>
            <span className="text-sm font-bold uppercase tracking-widest text-gray-400">
              Interview Preparation
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-tight">
            Interview Rounds
          </h1>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 100 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="h-1.5 bg-[#D4F478] mx-auto rounded-full"
          />

          <div className="text-gray-500 text-lg leading-relaxed max-w-2xl mx-auto font-medium pt-2">
            Practice interview for{" "}
            <span className="font-bold text-gray-900 bg-[#D4F478]/20 px-3 py-1 rounded-full">
              {companyType}
            </span>{" "}
            -{" "}
            <span className="font-bold text-gray-900 bg-[#D4F478]/20 px-3 py-1 rounded-full">
              {role}
            </span>
          </div>
        </motion.div>

        {/* Selection Mode Toggle */}
        <motion.div variants={itemVariants} className="flex justify-center gap-4 mb-2 z-10 relative">
          <button
            onClick={() => {
              setSelectionMode("all");
              setSelectedRoundIndex(null);
            }}
            className={`px-6 py-3 rounded-full font-bold text-sm transition-all border-2 shadow-sm cursor-pointer ${
              selectionMode === "all"
                ? "bg-[#1A1A1A] border-[#1A1A1A] text-white"
                : "bg-white/80 border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300"
            }`}
          >
            Practice All Rounds
          </button>
          <button
            onClick={() => {
              setSelectionMode("specific");
              if (rounds.length > 0 && selectedRoundIndex === null) {
                setSelectedRoundIndex(0);
              }
            }}
            className={`px-6 py-3 rounded-full font-bold text-sm transition-all border-2 shadow-sm cursor-pointer ${
              selectionMode === "specific"
                ? "bg-[#1A1A1A] border-[#1A1A1A] text-white"
                : "bg-white/80 border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300"
            }`}
          >
            Practice Specific Round
          </button>
        </motion.div>

        {/* Rounds List */}
        <motion.div variants={itemVariants} className="space-y-4 relative z-10">
          {rounds.length > 0 ? (
            <AnimatePresence>
              {rounds.map((round, index) => (
                <motion.div
                  key={index}
                  variants={roundVariants}
                  custom={index}
                  whileHover={{
                    y: -4,
                    scale: 1.01,
                    boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.08)",
                  }}
                  onClick={() => {
                    if (selectionMode === "specific") {
                      setSelectedRoundIndex(index);
                    }
                  }}
                  className={`bg-white/90 backdrop-blur-lg border-2 rounded-[2rem] p-6 md:p-7 shadow-lg transition-all cursor-pointer relative overflow-hidden group ${
                    selectionMode === "specific" && selectedRoundIndex === index
                      ? "border-[#D4F478] bg-[#D4F478]/5 ring-2 ring-[#D4F478]/20"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  {/* Decorative gradient */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#D4F478]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="flex items-start gap-4 relative z-10">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className="shrink-0 w-12 h-12 bg-[#D4F478]/20 rounded-2xl flex items-center justify-center text-[#1A1A1A] font-black text-lg border-2 border-[#D4F478]/30"
                    >
                      {index + 1}
                    </motion.div>

                    <div className="flex-grow">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {round.name}
                          {selectionMode === "all" && (
                            <CheckCircle2 className="w-5 h-5 text-[#D4F478] opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </span>
                        {selectionMode === "specific" && (
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            selectedRoundIndex === index
                              ? "border-[#D4F478] bg-[#D4F478]"
                              : "border-gray-300 group-hover:border-gray-400"
                          }`}>
                            {selectedRoundIndex === index && (
                              <CheckCircle2 className="w-4 h-4 text-[#1A1A1A]" />
                            )}
                          </div>
                        )}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {round.description}
                      </p>

                      {/* Optional duration indicator */}
                      {round.duration && (
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 font-medium">
                          <Clock className="w-4 h-4" />
                          <span>{round.duration} minutes</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 bg-white/60 rounded-[2rem] border-2 border-dashed border-gray-200"
            >
              <p className="text-gray-500 text-lg italic font-medium">
                No rounds configured for this role.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-between pt-8 border-t border-gray-200/50 relative z-10"
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 border-gray-200 text-gray-700 bg-white/90 hover:bg-white hover:border-gray-300 transition-all font-bold shadow-sm hover:shadow-md"
          >
            <ArrowLeft size={20} />
            Change Selection
          </motion.button>

          <motion.button
            type="button"
            whileHover="hover"
            whileTap="tap"
            onClick={handleStartInterview}
            className="flex items-center gap-0 group cursor-pointer"
          >
            <span className="bg-[#1A1A1A] text-white px-8 py-4 rounded-l-full font-bold text-lg shadow-xl shadow-gray-300/50 z-10 relative flex items-center gap-2">
              Start Practice Interview
            </span>
            <motion.span
              className="w-14 h-[3.75rem] flex items-center justify-center rounded-r-full bg-[#D4F478] border-l-2 border-[#1A1A1A] group-hover:bg-[#cbf060] transition-colors origin-left"
              variants={{
                hover: { x: 5 },
                tap: { x: 0 },
              }}
            >
              <motion.div
                variants={{
                  hover: { x: 3 },
                  tap: { x: 0 },
                }}
              >
                <PlayCircle className="w-6 h-6 text-black" />
              </motion.div>
            </motion.span>
          </motion.button>
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-3 pt-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4F478]" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Step 3 of 3
            </span>
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          </div>
        </motion.div>
      </motion.div>

      {/* Camera Permission Modal - Popup Style */}
      <AnimatePresence>
        {cameraError && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCameraError(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border-2 border-[#D4F478]/30 p-8 md:p-10 max-w-md w-full relative overflow-hidden"
              >
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D4F478]/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-200/30 rounded-full blur-3xl" />

                {/* Close button */}
                <button
                  onClick={() => setCameraError(null)}
                  className="absolute top-6 right-6 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10 cursor-pointer font-bold text-sm text-gray-600 hover:text-gray-900"
                >
                  Close
                </button>

                {/* Content */}
                <div className="relative z-10 space-y-6">
                  {/* Icon */}
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-[#D4F478]/20 rounded-2xl flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-[#1A1A1A]" />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-gray-900">
                      {cameraError.title}
                    </h3>
                    <p className="text-gray-600 text-base leading-relaxed">
                      {cameraError.message}
                    </p>
                  </div>

                  {/* Instructions */}
                  {cameraError.instructions && cameraError.instructions.length > 0 && (
                    <div className="bg-[#D4F478]/10 rounded-2xl p-5 space-y-3">
                      <p className="text-sm font-bold text-gray-900">How to fix:</p>
                      <ul className="space-y-2">
                        {cameraError.instructions.map((instruction, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-3">
                            <span className="flex-shrink-0 w-5 h-5 bg-[#D4F478] rounded-full flex items-center justify-center text-[#1A1A1A] font-bold text-xs mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="flex-1">{instruction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {cameraError.actionPath && (
                    <button
                      type="button"
                      onClick={() => navigate(cameraError.actionPath)}
                      className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-black hover:bg-black transition-colors"
                    >
                      {cameraError.actionLabel || "Continue"}
                    </button>
                  )}

                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Plan Block Modal */}
      <PlanBlockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        remainingCredits={user?.subscription?.interviewsRemaining || 0}
        type={modalType}
      />
    </div>
  );
};

export default Rounds;
