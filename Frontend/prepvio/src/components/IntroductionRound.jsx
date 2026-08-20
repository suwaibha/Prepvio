import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Volume2, Mic } from "lucide-react";
import { mainApi } from "../utils/apiClient";

const IntroductionRound = ({ sessionId, role, companyType, onCompleted }) => {
  const [isListening, setIsListening] = useState(false);
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const questions = [
    "Tell us about yourself",
    "What are your key strengths?",
    "Why are you interested in this role?",
  ];

  const handleSubmit = async () => {
    if (!response.trim()) {
      alert("Please provide a response");
      return;
    }

    try {
      setLoading(true);
      const res = await mainApi.post(`/interview-session/${sessionId}/submit-intro`, { response });

      setSubmitted(true);
      setTimeout(() => {
        onCompleted();
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit introduction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#1A1A1A] via-gray-900 to-black flex items-center justify-center p-4 z-50">
      {/* Background animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
        className="relative z-10 max-w-2xl w-full"
      >
        <motion.div
          className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-2xl rounded-3xl border-2 border-[#D4F478]/30 p-8 md:p-12 shadow-2xl"
          initial={{ borderColor: "rgba(212, 244, 120, 0.1)" }}
          whileHover={{ borderColor: "rgba(212, 244, 120, 0.5)" }}
          transition={{ duration: 0.3 }}
        >
          {!submitted ? (
            <>
              {/* Header */}
              <div className="mb-8 text-center">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-4"
                >
                  <Sparkles className="w-8 h-8 text-[#D4F478]" />
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
                  Welcome to Your Interview! 🎤
                </h1>
                <p className="text-gray-300 text-lg">
                  Let's start with an introduction round - it's compulsory for everyone
                </p>
              </div>

              {/* Job Details */}
              <div className="mb-8 flex gap-4 flex-col sm:flex-row bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex-1">
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">
                    Position
                  </p>
                  <p className="text-white text-xl font-black">{role}</p>
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">
                    Company
                  </p>
                  <p className="text-white text-xl font-black">{companyType}</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-8">
                <h2 className="text-white font-black text-lg mb-4">Questions:</h2>
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-3 items-start bg-white/5 p-4 rounded-xl border border-white/10"
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4F478] text-black font-bold flex items-center justify-center text-sm">
                        {i + 1}
                      </span>
                      <p className="text-gray-200 font-medium">{q}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Response Area */}
              <div className="mb-8">
                <label className="block text-white font-black text-sm mb-3 uppercase tracking-widest">
                  Your Introduction
                </label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Share your introduction here... (You can speak or type)"
                  className="w-full h-40 bg-white/10 text-white rounded-2xl border-2 border-white/20 focus:border-[#D4F478] placeholder-gray-400 p-6 font-medium focus:outline-none transition-colors resize-none"
                />
                <p className="text-gray-400 text-xs mt-2">
                  Tip: Be genuine and concise. Focus on your background, skills, and why you're interested.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={loading || !response.trim()}
                  className="flex-1 bg-[#D4F478] text-black font-black py-4 rounded-2xl hover:bg-[#cbf060] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                      />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      Submit Introduction
                    </>
                  )}
                </motion.button>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="mb-6"
                >
                  <div className="w-20 h-20 bg-[#D4F478]/20 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="w-10 h-10 text-[#D4F478]" />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-black text-white mb-3">
                  Great! Introduction Submitted ✓
                </h2>
                <p className="text-gray-300 mb-6">
                  Now let's move to round selection...
                </p>
                <motion.div
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                  className="h-1 bg-[#D4F478] rounded-full"
                />
              </motion.div>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default IntroductionRound;
