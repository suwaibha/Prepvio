import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Zap, Clock, BookOpen, Users, Sparkles, CheckCircle } from "lucide-react";
import { mainApi } from "../utils/apiClient";

const RoundSelectionPage = ({ sessionId, availableRounds, onSelection }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedSpecificRounds, setSelectedSpecificRounds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out introduction round from available rounds
  const roundsExceptIntro = availableRounds.filter(r => r.roundId !== "INTRODUCTION");

  const getRoundIcon = (roundId) => {
    const iconMap = {
      TECHNICAL: <BookOpen className="w-6 h-6" />,
      CODING: <Zap className="w-6 h-6" />,
      HR: <Users className="w-6 h-6" />,
      APTITUDE: <BookOpen className="w-6 h-6" />,
    };
    return iconMap[roundId] || <ChevronRight className="w-6 h-6" />;
  };

  const handleSelectAll = async () => {
    setSelectedOption("ALL_ROUNDS");
    await submitSelection("ALL_ROUNDS", []);
  };

  const handleToggleSpecificRound = (roundId) => {
    setSelectedSpecificRounds((prev) => {
      if (prev.includes(roundId)) {
        return prev.filter(id => id !== roundId);
      } else {
        return [...prev, roundId];
      }
    });
  };

  const handleSelectSpecific = async () => {
    if (selectedSpecificRounds.length === 0) {
      alert("Please select at least one round");
      return;
    }
    setSelectedOption("SPECIFIC_ROUNDS");
    await submitSelection("SPECIFIC_ROUNDS", selectedSpecificRounds);
  };

  const submitSelection = async (selectionType, roundIds) => {
    try {
      setIsSubmitting(true);

      const payload = {
        sessionId,
        roundSelection: selectionType,
        selectedRounds: roundIds,
      };

      const res = await mainApi.post(
        `/interview-session/${sessionId}/select-rounds`,
        payload
      );

      const data = res.data;

      // Delay slightly for animation, then callback
      setTimeout(() => {
        onSelection(data);
      }, 800);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit round selection. Please try again.");
      setSelectedOption(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDuration = roundsExceptIntro.reduce((sum, r) => sum + r.duration, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A1A] via-gray-900 to-black flex items-center justify-center p-4">
      {/* Background animations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-10 left-10 w-72 h-72 bg-[#D4F478]/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="max-w-4xl w-full"
      >
        <motion.div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-2xl rounded-3xl border-2 border-[#D4F478]/30 p-8 md:p-12 shadow-2xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <Sparkles className="w-8 h-8 text-[#D4F478]" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
              Which Rounds Do You Want?
            </h1>
            <p className="text-gray-300 text-lg">
              Introduction is done! Now choose how you want to proceed.
            </p>
          </div>

          {/* Two options layout */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Option 1: All Rounds */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={handleSelectAll}
              disabled={isSubmitting}
              className={`cursor-pointer relative rounded-2xl p-8 border-2 transition-all ${
                selectedOption === "ALL_ROUNDS"
                  ? "bg-[#D4F478]/20 border-[#D4F478]"
                  : "bg-white/5 border-white/20 hover:border-[#D4F478]/50"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <AnimatePresence>
                {selectedOption === "ALL_ROUNDS" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-4 right-4"
                  >
                    <CheckCircle className="w-6 h-6 text-[#D4F478]" />
                  </motion.div>
                )}
              </AnimatePresence>

              <h3 className="text-xl font-black text-white mb-3">
                All Remaining Rounds 🚀
              </h3>
              <p className="text-gray-300 text-sm mb-6">
                Take the complete interview and get full feedback
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Clock className="w-4 h-4 text-[#D4F478]" />
                  <span>Total Duration: <span className="font-bold text-white">{totalDuration} mins</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Zap className="w-4 h-4 text-[#D4F478]" />
                  <span><span className="font-bold text-white">{roundsExceptIntro.length}</span> rounds included</span>
                </div>
              </div>

              <button
                onClick={handleSelectAll}
                disabled={isSubmitting}
                className="w-full bg-[#D4F478] text-black font-black py-3 rounded-xl hover:bg-[#cbf060] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && selectedOption === "ALL_ROUNDS" ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                    />
                    Starting...
                  </>
                ) : (
                  <>
                    Start All Rounds
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>

            {/* Option 2: Specific Rounds */}
            <motion.div
              className={`relative rounded-2xl p-8 border-2 transition-all ${
                selectedOption === "SPECIFIC_ROUNDS"
                  ? "bg-blue-500/20 border-blue-400"
                  : "bg-white/5 border-white/20"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <AnimatePresence>
                {selectedOption === "SPECIFIC_ROUNDS" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-4 right-4"
                  >
                    <CheckCircle className="w-6 h-6 text-blue-400" />
                  </motion.div>
                )}
              </AnimatePresence>

              <h3 className="text-xl font-black text-white mb-3">
                Choose Specific Rounds 🎯
              </h3>
              <p className="text-gray-300 text-sm mb-6">
                Select only the rounds you want to take
              </p>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {roundsExceptIntro.map((round) => (
                  <motion.label
                    key={round.roundId}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-all border border-transparent hover:border-white/20"
                    whileHover={{ x: 4 }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSpecificRounds.includes(round.roundId)}
                      onChange={() => handleToggleSpecificRound(round.roundId)}
                      disabled={isSubmitting}
                      className="w-5 h-5 rounded accent-[#D4F478] cursor-pointer disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm">{round.name}</p>
                      <p className="text-gray-400 text-xs">{round.duration} mins • {round.questionCount}Q</p>
                    </div>
                    {getRoundIcon(round.roundId)}
                  </motion.label>
                ))}
              </div>

              <button
                onClick={handleSelectSpecific}
                disabled={isSubmitting || selectedSpecificRounds.length === 0}
                className="w-full bg-blue-500 text-white font-black py-3 rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && selectedOption === "SPECIFIC_ROUNDS" ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Starting...
                  </>
                ) : (
                  <>
                    Start ({selectedSpecificRounds.length}) Round{selectedSpecificRounds.length !== 1 ? 's' : ''}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>
          </div>

          {/* Available Rounds Preview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 pt-8 border-t border-white/10"
          >
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-4">
              Available Rounds
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {roundsExceptIntro.map((round) => (
                <motion.div
                  key={round.roundId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-lg p-4 border border-white/10 text-center"
                >
                  <div className="mb-3 flex justify-center text-[#D4F478]">
                    {getRoundIcon(round.roundId)}
                  </div>
                  <p className="text-white font-bold text-sm mb-1">{round.name}</p>
                  <p className="text-gray-400 text-xs">{round.duration} min • {round.questionCount}Q</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RoundSelectionPage;
