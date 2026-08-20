import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import IntroductionRound from "./IntroductionRound";
import RoundSelectionPage from "./RoundSelectionPage";
import { mainApi } from "../utils/apiClient";

const InterviewFlow = ({ role, companyType, planId }) => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(null);
  const [stage, setStage] = useState("INITIALIZING"); // INITIALIZING, ROUND_SELECTION, INTRODUCTION, INTERVIEW_IN_PROGRESS
  const [availableRounds, setAvailableRounds] = useState([]);
  const [selectedRounds, setSelectedRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize interview
  useEffect(() => {
    const initializeInterview = async () => {
      try {
        setLoading(true);
        
        const res = await mainApi.post("/interview/start", {
          role,
          companyType,
          planId: planId || "free",
        });

        const data = res.data;
        if (data && data.sessionId) {
          setSessionId(data.sessionId);
          setAvailableRounds(Array.isArray(data.availableRounds) ? data.availableRounds : []);
          setStage("ROUND_SELECTION"); // Show round selection first
        } else {
          throw new Error("Invalid response format from start interview");
        }
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeInterview();
  }, [role, companyType, planId]);

  const handleRoundSelectionComplete = (selectionData) => {
    setSelectedRounds(selectionData.selectedRounds);
    setStage("INTRODUCTION"); // Move to introduction after round selection
  };

  const handleIntroductionComplete = () => {
    // After intro, navigate to interview
    setTimeout(() => {
      navigate(`/interview/${sessionId}`, {
        state: {
          sessionId,
          role,
          companyType,
          selectedRounds,
        },
      });
    }, 500);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#1A1A1A] to-black flex items-center justify-center z-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-[#D4F478] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#1A1A1A] to-black flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/20 border-2 border-red-500 rounded-2xl p-8 max-w-md text-center"
        >
          <h2 className="text-2xl font-black text-red-400 mb-3">Error</h2>
          <p className="text-red-200 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {stage === "ROUND_SELECTION" && sessionId && (
        <RoundSelectionPage
          key="selection"
          sessionId={sessionId}
          availableRounds={availableRounds}
          onSelection={handleRoundSelectionComplete}
        />
      )}

      {stage === "INTRODUCTION" && sessionId && (
        <IntroductionRound
          key="intro"
          sessionId={sessionId}
          role={role}
          companyType={companyType}
          onCompleted={handleIntroductionComplete}
        />
      )}
    </AnimatePresence>
  );
};

export default InterviewFlow;
