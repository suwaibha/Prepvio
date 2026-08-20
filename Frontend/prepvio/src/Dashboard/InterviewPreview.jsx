import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Code2, X, ArrowLeft, ImageIcon, CheckCircle2, XCircle, Calendar, Clock, MessageSquare, Award, TrendingUp, Sparkles, Brackets } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";

import { useAuthStore } from "../store/authstore";
import UpgradeModal from "../components/UpgradeModal";
import { mainApi } from "../utils/apiClient";

const getCodingProblemCount = (problems = []) => (problems || []).length;

// Static 3D Model
function StaticModel(props) {
    const { nodes, materials } = useGLTF('/final_prepvio_model.glb');

    useEffect(() => {
        Object.values(materials || {}).forEach((mat) => (mat.morphTargets = true));
    }, [materials]);

    if (!nodes?.rp_carla_rigged_001_geo) return null;

    return (
        <group
            {...props}
            position={[-0.48, -1.3, 3.967]}
            rotation={[1.9, 0, 0]}
            scale={0.01}
            dispose={null}
        >
            <skinnedMesh
                geometry={nodes.rp_carla_rigged_001_geo.geometry}
                material={nodes.rp_carla_rigged_001_geo.material}
                skeleton={nodes.rp_carla_rigged_001_geo.skeleton}
                morphTargetInfluences={nodes.rp_carla_rigged_001_geo.morphTargetInfluences || []}
                morphTargetDictionary={nodes.rp_carla_rigged_001_geo.morphTargetDictionary || {}}
            />
            <primitive object={nodes.root} />
        </group>
    );
}

// Solved Problems Modal
const SolvedProblemsModal = ({ isOpen, onClose, problems }) => {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (isOpen && problems.length > 0 && !selected) {
      setSelected(problems[0]);
    }
  }, [isOpen, problems, selected]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const hasPassedAllTests = (problem) => {
    const results = problem?.testResults || [];
    return results.length > 0 && results.every((result) => result.passed);
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[1500px] h-[min(90vh,900px)] max-h-[calc(100dvh-2rem)] overflow-hidden flex bg-[#111827] text-white border border-slate-700 rounded-2xl shadow-2xl"
      >
        {/* Question panel */}
        <aside className="w-[31%] min-w-[340px] border-r border-slate-700 bg-[#070d1b] flex flex-col">
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-2 text-[#d4f478]">
              <Code2 className="w-5 h-5" />
              <h2 className="font-black tracking-wide">CODING ROUND REPLAY</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">Read-only questions and submitted answers</p>
          </div>

          {problems.length === 0 ? (
            <div className="text-center py-12 px-4 m-5 rounded-2xl bg-slate-900 border border-slate-700">
              <Code2 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No coding questions were recorded.</p>
            </div>
          ) : (
            <div className="flex gap-2 p-4 border-b border-slate-800">
              {problems.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(p)}
                  className={`flex-1 rounded-xl py-3 text-xs font-black uppercase transition-all
                    ${selected === p
                      ? "bg-[#d4f478] text-black"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                >
                  Question {i + 1}
                </button>
              ))}
            </div>
          )}
          {selected && (
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-2xl font-black text-white mb-4">{selected.problem?.title || "Coding Question"}</h3>
              <div className="text-slate-300 text-sm whitespace-pre-line leading-7">{selected.problem?.description || "No problem description available."}</div>
              {selected.problem?.example && <pre className="mt-5 rounded-xl bg-slate-900 border border-slate-700 p-4 text-xs text-slate-200 whitespace-pre-wrap">{selected.problem.example}</pre>}
              <h4 className="mt-7 mb-3 text-sm font-black uppercase tracking-wide text-slate-300">Test cases ({selected.testResults?.length || selected.problem?.testCases?.length || 0})</h4>
              <div className="space-y-3">
                {(selected.testResults?.length ? selected.testResults : selected.problem?.testCases || []).map((testCase, index) => (
                  <div key={index} className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-xs">
                    <p className="font-bold text-slate-300 mb-3">Test Case {index + 1}</p>
                    <p className="text-slate-400">Input: <span className="font-mono text-white">{testCase.input}</span></p>
                    <p className="mt-2 text-slate-400">Expected: <span className="font-mono text-[#d4f478]">{testCase.expected}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#111827]">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-900 to-black 
                            rounded-3xl flex items-center justify-center mb-6 border-4 border-gray-800">
                <Code2 className="w-20 h-20 text-gray-700" />
              </div>
              <h3 className="text-2xl font-black text-gray-300 mb-3">
                Select a Problem
              </h3>
              <p className="text-gray-500 text-center max-w-md">
                Choose a problem from the sidebar to view<br />
                detailed solution and test results
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col p-6">
              <div className="flex items-center justify-between mb-5 pr-16">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#d4f478]">Your submitted answer</p>
                    <p className="mt-1 text-sm text-slate-400">Read-only coding-round replay</p>
                  </div>
                  {selected.skipped ? (
                    <div className="px-4 py-2 bg-gradient-to-r from-rose-900/20 to-red-900/10 
                                  rounded-xl border-2 border-rose-800/30 text-rose-400 font-bold text-sm">
                      <XCircle className="w-4 h-4 inline mr-2" />
                      Skipped
                    </div>
                  ) : hasPassedAllTests(selected) ? (
                    <div className="px-4 py-2 bg-gradient-to-r from-emerald-900/20 to-green-900/10 
                                  rounded-xl border-2 border-emerald-800/30 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 inline mr-2" />
                      Solved
                    </div>
                  ) : (
                    <div className="px-4 py-2 bg-gradient-to-r from-rose-900/20 to-red-900/10 
                                  rounded-xl border-2 border-rose-800/30 text-rose-400 font-bold text-sm">
                      <XCircle className="w-4 h-4 inline mr-2" />
                      Failed
                    </div>
                  )}
              </div>

              {/* Solution Editor */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 min-h-0 flex flex-col"
              >
                {selected.skipped ? (
                  <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-12 
                                text-center border-2 border-gray-800">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-black 
                                  rounded-2xl flex items-center justify-center mx-auto mb-4 border-4 border-gray-700">
                      <Code2 className="w-10 h-10 text-gray-600" />
                    </div>
                    <p className="text-gray-400 text-lg font-medium">
                      No solution submitted
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      This problem was skipped
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-[280px] bg-[#1f1f1f] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl shadow-black/30">
                    {/* Editor Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-900 to-black 
                                  border-b-2 border-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/80" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                          <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <span className="text-sm font-bold text-gray-300">
                          solution.js
                        </span>
                      </div>
                      
                    </div>

                    {/* Monaco Editor */}
                    <div className="h-full">
                      <Editor
                        height="100%"
                        language="plaintext"
                        value={selected.userCode || "// No code submitted"}
                        theme="vs-dark"
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 14,
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          lineNumbers: "on",
                          wordWrap: "on",
                          renderLineHighlight: "all",
                          scrollbar: {
                            vertical: "visible",
                            horizontal: "visible",
                          },
                          overviewRulerBorder: false,
                          padding: { top: 20, bottom: 20 },
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              <div className="mt-5 rounded-2xl bg-black border border-slate-700 px-5 py-4">
                <h3 className="text-base font-black text-[#d4f478]">Execution Results</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {selected.skipped ? "This question was skipped." : `${(selected.testResults || []).filter((result) => result.passed).length} of ${selected.testResults?.length || 0} recorded test cases passed.`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-3 rounded-xl bg-slate-800 border border-slate-600 text-gray-300 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </motion.div>,
    document.body
  );
};


const InterviewPreview = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [chatMessages, setChatMessages] = useState([]);
    const [solvedProblems, setSolvedProblems] = useState([]);
    const [showSolvedProblems, setShowSolvedProblems] = useState(false);
    const [interviewData, setInterviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [conversationTab, setConversationTab] = useState("questions");
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showCodingQuestions, setShowCodingQuestions] = useState(false);
    const [codingQuestions, setCodingQuestions] = useState([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [expandedQuestion, setExpandedQuestion] = useState(null);
    const { user } = useAuthStore();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sessionId = params.get("sessionId");

        if (!sessionId) {
            setLoading(false);
            return;
        }

        const fetchInterview = async () => {
            try {
                const res = await mainApi.get(`/interview-session/${sessionId}`);
                const data = res.data;

                if (!data || !data.success || !data.session) throw new Error("Fetch failed");

                setInterviewData(data.session);
                setChatMessages(data.session.messages || []);
                setSolvedProblems(data.session.solvedProblems || []);
            } catch (err) {
                console.error("Preview fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInterview();
    }, [location.search]);

    const handleShowCodingQuestions = () => {
        setShowSolvedProblems(true);
    };

    const handleBack = () => {
        navigate("/dashboard/interview-analysis");
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
                    <p className="text-gray-600 text-lg font-bold">Loading preview...</p>
                </motion.div>
            </div>
        );
    }

    if (!interviewData) {
        return (
            <div className="min-h-screen bg-[#FDFBF9] flex flex-col items-center justify-center p-6">
                <div className="text-center max-w-md bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-12 border border-white/60 shadow-xl">
                    <p className="text-2xl font-black text-gray-900 mb-6">No interview data available</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBack}
                        className="px-8 py-4 bg-[#1A1A1A] text-white rounded-2xl hover:bg-gray-800 font-bold shadow-lg"
                    >
                        Back to Interviews
                    </motion.button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF9] p-6 font-sans selection:bg-[#D4F478] selection:text-black relative overflow-hidden">
            {/* Background decorations */}
            <div className="fixed inset-0 pointer-events-none -z-50">
                <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-[120px] opacity-60" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-t from-pink-50 to-transparent rounded-full blur-[120px] opacity-60" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-white/60 p-8 md:p-12">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleBack}
                                className="p-3 bg-white/90 hover:bg-white rounded-2xl transition-all border-2 border-gray-100 shadow-sm"
                            >
                                <ArrowLeft className="w-6 h-6 text-gray-700" />
                            </motion.button>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-[#D4F478]" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                        Interview Replay
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                                    {interviewData.companyType} - {interviewData.role}
                                </h1>
                                <p className="text-sm text-gray-500 font-medium mt-1">
                                    Read-Only Preview Mode
                                </p>
                            </div>
                        </div>

                        <div className="px-5 py-2.5 bg-[#D4F478]/20 text-gray-900 rounded-full text-sm font-black border-2 border-[#D4F478]/30">
                            Preview Mode
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left: Video Area */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="rounded-[2.5rem] overflow-hidden shadow-lg bg-gradient-to-br from-gray-900 to-gray-800 h-[420px] relative flex items-center justify-center border-2 border-gray-700">
                                <div className="text-center text-gray-400">
                                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-bold">Video Recording Not Available</p>
                                    <p className="text-sm mt-2">This is a replay of the interview conversation</p>
                                </div>
                            </div>

                            {/* Interview Stats */}
                            <div className="rounded-[1.75rem] p-6 bg-[#f9fafb] border border-gray-200 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
  {/* Header */}
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-sm">
      <TrendingUp className="w-5 h-5 text-gray-700" />
    </div>
    <h3 className="font-extrabold text-lg text-gray-900">
      Interview Statistics
    </h3>
  </div>

  {/* Stats Grid */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {/* Messages */}
    <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
        Messages
      </p>
      <p className="text-3xl font-extrabold text-gray-900">
        {chatMessages.length}
      </p>
    </div>

    {/* Problems */}
    <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
        Problems
      </p>
      <p className="text-3xl font-extrabold text-gray-900">
        {getCodingProblemCount(solvedProblems)}
      </p>
    </div>

    {/* User Responses */}
    <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
        Your Responses
      </p>
      <p className="text-3xl font-extrabold text-gray-900">
        {chatMessages.filter(m => m.sender === "User").length}
      </p>
    </div>

    {/* Highlights */}
    <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
        Highlights
      </p>
      <p className="text-3xl font-extrabold text-gray-900">
        {interviewData.highlightClips?.length || 0}
      </p>
    </div>
  </div>
</div>


                        </div>

                        {/* Right Sidebar */}
                        <div className="space-y-6">
                            {/* Conversation History */}
                            <div className="bg-white/90 backdrop-blur-sm rounded-[2rem] p-6 h-[585px] flex flex-col border-2 border-gray-100 shadow-md">

                                {/* Tabs Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex gap-1 bg-gray-100 p-1.5 rounded-xl">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setConversationTab("questions")}
                                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${conversationTab === "questions"
                                                    ? "bg-[#1A1A1A] text-white shadow-md"
                                                    : "text-gray-600 hover:text-gray-900"
                                                }`}
                                        >
                                            Questions
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                // ✅ Use the plan from the interview session
                                                const sessionPlanId = interviewData.planId || 'free';
                                                
                                                // ✅ Check current user's plan for override
                                                const currentUserPlan = user?.subscription?.planId || 'free';
                                                const isUpgradedUser = currentUserPlan === 'yearly';

                                                // ✅ Block Basic (monthly) and Pro Access (premium) plans
                                                // UNLESS the user has upgraded to the Premium Plan (yearly)
                                                const isRestrictedSession = sessionPlanId === 'monthly' || sessionPlanId === 'premium';
                                                
                                                if (isRestrictedSession && !isUpgradedUser) {
                                                    setShowUpgradeModal(true);
                                                } else {
                                                    // Either session is not restricted (it's yearly/free) 
                                                    // OR current user is yearly (can see anything)
                                                    setConversationTab("highlights");
                                                }
                                            }}
                                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${conversationTab === "highlights"
                                                    ? "bg-[#1A1A1A] text-white shadow-md"
                                                    : "text-gray-600 hover:text-gray-900"
                                                }`}
                                        >
                                            Highlights
                                        </motion.button>

                                    </div>

                                    {getCodingProblemCount(solvedProblems) > 0 && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleShowCodingQuestions}
                                            className="p-2 rounded-xl hover:bg-gray-100 transition-all"
                                            title="View coding-round questions and submitted answers"
                                        >
                                            <Code2 className="w-5 h-5 text-gray-600" />
                                        </motion.button>
                                    )}
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 overflow-y-auto pr-2">
                                    {conversationTab === "questions" ? (
                                        chatMessages.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center mt-10 font-medium">
                                                No conversation history available
                                            </p>
                                        ) : (
                                            chatMessages.map((msg, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className={`mb-4 ${msg.sender === "User" ? "text-right" : "text-left"}`}
                                                >
                                                    <div
                                                        className={`inline-block max-w-[85%] px-4 py-3 rounded-2xl shadow-sm border-2 ${msg.sender === "User"
                                                            ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                                                            : "bg-white text-gray-800 border-gray-100"
                                                            }`}
                                                    >
                                                        <p className="text-xs font-black mb-1 opacity-75">
                                                            {msg.sender === "User" ? "You" : "Jenny"}
                                                        </p>
                                                        <p className="text-sm font-medium">{msg.text}</p>

                                                        {msg.time && (
                                                            <p className="text-xs mt-1 opacity-60 font-medium">
                                                                {msg.time}
                                                            </p>
                                                        )}

                                                        {msg.feedback && (
                                                            <div className="mt-3 pt-3 border-t border-white/20">
                                                                <p className="text-xs font-bold mb-1">Feedback:</p>
                                                                <p className="text-xs">{msg.feedback.suggestion}</p>
                                                                {msg.feedback.example && (
                                                                    <p className="text-xs mt-1 italic">
                                                                        Example: {msg.feedback.example}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {msg.stage && (
                                                        <p className="text-xs text-gray-500 mt-1 font-medium">
                                                            Stage: {msg.stage}
                                                        </p>
                                                    )}
                                                </motion.div>
                                            ))
                                        )
                                    ) : (
                                        interviewData.highlightClips?.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center mt-10 font-medium">
                                                No highlight clips available
                                            </p>
                                        ) : (
                                            (Array.isArray(interviewData.highlightClips) ? interviewData.highlightClips : []).map((clip, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="mb-4 bg-white rounded-2xl p-3 shadow-sm border-2 border-gray-100"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <p className="text-xs text-gray-500 mb-1 font-medium">
                                                                {clip.timestamp}
                                                            </p>
                                                            <p className="text-sm font-bold mb-2">
                                                                {clip.questionText && clip.questionText.trim().length > 0
                                                                    ? clip.questionText
                                                                    : `Question ${clip.questionIndex + 1}`}
                                                            </p>
                                                        </div>
                                                        <div className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-black border border-red-200">
                                                            Nervous
                                                        </div>
                                                    </div>

                                                    {clip.imageUrl ? (
                                                        <img
                                                            src={clip.imageUrl}
                                                            alt="Nervousness highlight"
                                                            className="rounded-xl w-full object-cover cursor-pointer hover:opacity-90 transition border-2 border-gray-100"
                                                            onClick={() => window.open(clip.imageUrl, '_blank')}
                                                        />
                                                    ) : (
                                                        <div className="bg-gray-50 rounded-xl p-4 text-center border-2 border-gray-100">
                                                            <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                            <p className="text-xs text-gray-500 italic font-medium">
                                                                Image not available
                                                            </p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))
                                        )
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="mt-3 pt-3 border-t-2 border-gray-100">
                                    <p className="text-xs text-gray-500 text-center italic font-medium">
                                        This is a read-only preview. No interactions available.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Solved Problems Modal */}
                    <AnimatePresence>
                        {showSolvedProblems && (
                            <SolvedProblemsModal
                                isOpen={showSolvedProblems}
                                onClose={() => setShowSolvedProblems(false)}
                                problems={solvedProblems}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Coding Questions Modal */}
            <AnimatePresence>
                {showCodingQuestions && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowCodingQuestions(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-[#D4F478] to-emerald-400 p-6 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Brackets className="w-6 h-6" />
                                    Your Coding Questions & Answers
                                </h2>
                                <button
                                    onClick={() => setShowCodingQuestions(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-all"
                                >
                                    <X className="w-5 h-5 text-gray-900" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {loadingQuestions ? (
                                    <div className="flex items-center justify-center h-full">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-10 h-10 border-3 border-[#D4F478] border-t-transparent rounded-full"
                                        />
                                    </div>
                                ) : codingQuestions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Brackets className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 font-medium">No coding questions in this interview</p>
                                        <p className="text-gray-400 text-sm">Coding questions and submitted answers from this round will appear here</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {codingQuestions.map((question, index) => {
                                            const isExpanded = expandedQuestion === question._id;
                                            return (
                                                <motion.div
                                                    key={question._id || index}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-[#D4F478] transition-all bg-white"
                                                >
                                                    {/* Question Header - Always visible */}
                                                    <button
                                                        onClick={() => setExpandedQuestion(isExpanded ? null : question._id)}
                                                        className="w-full p-4 flex items-start justify-between hover:bg-gray-50 transition-all"
                                                    >
                                                        <div className="flex-1 text-left">
                                                            <h3 className="font-bold text-lg text-gray-900 mb-2">
                                                                {question.title || "Untitled Problem"}
                                                            </h3>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                                    question.difficulty === "Easy" ? "bg-emerald-100 text-emerald-700" :
                                                                    question.difficulty === "Medium" ? "bg-amber-100 text-amber-700" :
                                                                    "bg-rose-100 text-rose-700"
                                                                }`}>
                                                                    {question.difficulty || "N/A"}
                                                                </span>
                                                                {question.companies && question.companies.length > 0 && (
                                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                                                        {question.companies.join(", ")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <motion.div
                                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                                            className="text-gray-400 mt-1 flex-shrink-0 ml-4"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                            </svg>
                                                        </motion.div>
                                                    </button>

                                                    {/* Expanded Details */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="border-t border-gray-200 overflow-hidden"
                                                            >
                                                                <div className="p-4 space-y-4">
                                                                    {/* Description */}
                                                                    {question.description && (
                                                                        <div>
                                                                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                                                                                {question.description}
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {/* Examples */}
                                                                    {question.example && (
                                                                        <div>
                                                                            <h4 className="text-sm font-bold text-gray-900 mb-2">Examples:</h4>
                                                                            <div className="bg-gray-100 rounded-lg p-3 overflow-x-auto">
                                                                                <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-words">
                                                                                    {question.example}
                                                                                </pre>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Test Cases */}
                                                                    {question.testCases && question.testCases.length > 0 && (
                                                                        <div>
                                                                            <h4 className="text-sm font-bold text-gray-900 mb-2">Test Cases:</h4>
                                                                            <div className="space-y-2">
                                                                                {question.testCases.map((testCase, i) => (
                                                                                    <div key={i} className="bg-gray-100 rounded-lg p-3 text-xs font-mono">
                                                                                        <p className="text-gray-700">Input: {JSON.stringify(testCase.input)}</p>
                                                                                        <p className="text-gray-700">Expected: {JSON.stringify(testCase.expected)}</p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* The answer is the code submitted by the user in this replayed round. */}
                                                                    {question.answer ? (
                                                                        <div>
                                                                            <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                                                                <span>YOUR SUBMITTED ANSWER</span>
                                                                            </h4>
                                                                            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                                                                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words">
                                                                                    {question.answer}
                                                                                </pre>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                                                                            {question.skipped ? "No answer was submitted for this problem." : "No submitted answer was recorded for this problem."}
                                                                        </div>
                                                                    )}

                                                                    {/* Function Name & Boilerplate */}
                                                                    {question.functionName && (
                                                                        <div className="text-xs text-gray-500">
                                                                            <span className="font-semibold">Function:</span> {question.functionName}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName="Highlighted Clips"
            />
        </div>
    );
};

export default InterviewPreview;









// ---- actual correct working code --- 

// import React, { useState, useEffect } from "react";
// import { PhoneOff, MessageSquare, Code, X, Code2, ArrowLeft, ImageIcon, CheckCircle2, XCircle, Trophy, Calendar } from "lucide-react";
// import { Canvas } from "@react-three/fiber";
// import { Environment, useGLTF } from "@react-three/drei";
// import { useNavigate, useLocation } from "react-router-dom";
// import Editor from "@monaco-editor/react";

// // Static 3D Model
// function StaticModel(props) {
//     const { nodes, materials } = useGLTF('/final_prepvio_model.glb');

//     useEffect(() => {
//         Object.values(materials || {}).forEach((mat) => (mat.morphTargets = true));
//     }, [materials]);

//     if (!nodes?.rp_carla_rigged_001_geo) return null;

//     return (
//         <group
//             {...props}
//             position={[-0.48, -1.3, 3.967]}
//             rotation={[1.9, 0, 0]}
//             scale={0.01}
//             dispose={null}
//         >
//             <skinnedMesh
//                 geometry={nodes.rp_carla_rigged_001_geo.geometry}
//                 material={nodes.rp_carla_rigged_001_geo.material}
//                 skeleton={nodes.rp_carla_rigged_001_geo.skeleton}
//                 morphTargetInfluences={nodes.rp_carla_rigged_001_geo.morphTargetInfluences || []}
//                 morphTargetDictionary={nodes.rp_carla_rigged_001_geo.morphTargetDictionary || {}}
//             />
//             <primitive object={nodes.root} />
//         </group>
//     );
// }

// // Solved Problems Modal
// const SolvedProblemsModal = ({ isOpen, onClose, problems, isDarkMode = true }) => {
//     const [selected, setSelected] = useState(null);

//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 rounded-lg">
//             <div className={`
//                 w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex
//                 ${isDarkMode 
//                     ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white' 
//                     : 'bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-900'
//                 }
//             `}>
//                 {/* Sidebar */}
//                 <div className={`
//                     w-80 border-r p-6 overflow-y-auto
//                     ${isDarkMode 
//                         ? 'bg-gray-800/50 border-gray-700/50' 
//                         : 'bg-white/80 border-gray-200'
//                     }
//                 `}>
//                     <div className="flex items-center gap-3 mb-6">
//                         {/* <Trophy className={`w-7 h-7 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} /> */}
//                         <h2 className={`text-2xl font-bold bg-gradient-to-r ${
//                             isDarkMode 
//                                 ? 'from-green-400 to-emerald-400' 
//                                 : 'from-green-600 to-emerald-600'
//                         } bg-clip-text text-transparent`}>
//                             Solved Problems
//                         </h2>
//                     </div>

//                     <div className={`
//                         text-sm font-medium mb-4 px-3 py-2 rounded-lg
//                         ${isDarkMode 
//                             ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
//                             : 'bg-green-50 text-green-700 border border-green-200'
//                         }
//                     `}>
//                         {problems.length} {problems.length === 1 ? 'Problem' : 'Problems'} Completed
//                     </div>

//                     {problems.length === 0 && (
//                         <div className={`
//                             text-center py-8 px-4 rounded-xl
//                             ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100'}
//                         `}>
//                             <Code2 className={`w-12 h-12 mx-auto mb-3 ${
//                                 isDarkMode ? 'text-gray-600' : 'text-gray-400'
//                             }`} />
//                             <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//                                 No problems solved yet.
//                                 <br />Start coding to see your progress!
//                             </p>
//                         </div>
//                     )}

//                     <div className="space-y-2">
//                         {problems.map((p, i) => (
//                             <button
//                                 key={i}
//                                 onClick={() => setSelected(p)}
//                                 className={`
//                                     w-full text-left p-4 rounded-xl transition-all duration-200
//                                     ${selected === p 
//                                         ? isDarkMode
//                                             ? 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg shadow-green-500/20 scale-[1.02]'
//                                             : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 scale-[1.02]'
//                                         : isDarkMode
//                                             ? 'bg-gray-700/50 hover:bg-gray-700 border border-gray-600/30'
//                                             : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
//                                     }
//                                 `}
//                             >
//                                 <div className="flex items-start gap-2 mb-2">
//                                     {p.skipped ? (
//                                         <XCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
//                                             selected === p 
//                                                 ? 'text-white' 
//                                                 : isDarkMode ? 'text-red-400' : 'text-red-500'
//                                         }`} />
//                                     ) : (
//                                         <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
//                                             selected === p 
//                                                 ? 'text-white' 
//                                                 : isDarkMode ? 'text-green-400' : 'text-green-500'
//                                         }`} />
//                                     )}
//                                     <span className="font-medium leading-tight">
//                                         {p.problem.title}
//                                     </span>
//                                 </div>
//                                 <div className={`flex items-center gap-1.5 text-xs ml-7 ${
//                                     selected === p 
//                                         ? 'text-white/80' 
//                                         : isDarkMode ? 'text-gray-400' : 'text-gray-500'
//                                 }`}>
//                                     <Calendar className="w-3.5 h-3.5" />
//                                     {new Date(p.solvedAt).toLocaleString()}
//                                 </div>
//                             </button>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Main Content */}
//                 <div className="flex-1 p-8 overflow-y-auto">
//                     {!selected && (
//                         <div className="h-full flex items-center justify-center">
//                             <div className="text-center">
//                                 <Code2 className={`w-20 h-20 mx-auto mb-4 ${
//                                     isDarkMode ? 'text-gray-700' : 'text-gray-300'
//                                 }`} />
//                                 <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//                                     Select a solved problem to view details
//                                 </p>
//                             </div>
//                         </div>
//                     )}

//                     {selected && (
//                         <div className="max-w-4xl">
//                             {/* Header */}
//                             <div className="mb-8">
//                                 <h2 className={`text-3xl font-bold mb-3 bg-gradient-to-r ${
//                                     isDarkMode 
//                                         ? 'from-green-400 via-emerald-400 to-teal-400' 
//                                         : 'from-green-600 via-emerald-600 to-teal-600'
//                                 } bg-clip-text text-transparent`}>
//                                     {selected.problem.title}
//                                 </h2>
                                
//                                 {selected.skipped && (
//                                     <div className={`
//                                         inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
//                                         ${isDarkMode 
//                                             ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
//                                             : 'bg-red-50 text-red-700 border border-red-200'
//                                         }
//                                     `}>
//                                         <XCircle className="w-5 h-5" />
//                                         This problem was skipped
//                                     </div>
//                                 )}
//                             </div>

//                             {/* Description */}
//                             <div className={`
//                                 p-6 rounded-xl mb-8
//                                 ${isDarkMode 
//                                     ? 'bg-gray-800/50 border border-gray-700/50' 
//                                     : 'bg-white border border-gray-200 shadow-sm'
//                                 }
//                             `}>
//                                 <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
//                                     isDarkMode ? 'text-gray-400' : 'text-gray-500'
//                                 }`}>
//                                     Problem Description
//                                 </h3>
//                                 <p className={`whitespace-pre-line leading-relaxed ${
//                                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
//                                 }`}>
//                                     {selected.problem.description}
//                                 </p>
//                             </div>

//                             {/* Solution */}
//                             <div className="mb-8">
//                                 <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
//                                     isDarkMode ? 'text-blue-400' : 'text-blue-600'
//                                 }`}>
//                                     <Code2 className="w-6 h-6" />
//                                     Your Solution
//                                 </h3>

//                                 {selected.skipped ? (
//                                     <div className={`
//                                         p-8 rounded-xl text-center
//                                         ${isDarkMode 
//                                             ? 'bg-gray-800/50 border border-gray-700/50' 
//                                             : 'bg-gray-50 border border-gray-200'
//                                         }
//                                     `}>
//                                         <Code2 className={`w-12 h-12 mx-auto mb-3 ${
//                                             isDarkMode ? 'text-gray-600' : 'text-gray-400'
//                                         }`} />
//                                         <p className={`italic ${
//                                             isDarkMode ? 'text-gray-400' : 'text-gray-500'
//                                         }`}>
//                                             No code submitted for this problem
//                                         </p>
//                                     </div>
//                                 ) : (
//                                     <div className={`
//                                         rounded-xl overflow-hidden
//                                         ${isDarkMode 
//                                             ? 'shadow-2xl border border-gray-700/50' 
//                                             : 'shadow-lg border-2 border-gray-200'
//                                         }
//                                     `}>
//                                         <div className={`
//                                             px-4 py-2 flex items-center gap-2 text-xs font-medium
//                                             ${isDarkMode 
//                                                 ? 'bg-gray-800 text-gray-400 border-b border-gray-700' 
//                                                 : 'bg-gray-100 text-gray-600 border-b border-gray-200'
//                                             }
//                                         `}>
//                                             <div className="flex gap-1.5">
//                                                 <div className={`w-3 h-3 rounded-full ${
//                                                     isDarkMode ? 'bg-red-500/60' : 'bg-red-400'
//                                                 }`} />
//                                                 <div className={`w-3 h-3 rounded-full ${
//                                                     isDarkMode ? 'bg-yellow-500/60' : 'bg-yellow-400'
//                                                 }`} />
//                                                 <div className={`w-3 h-3 rounded-full ${
//                                                     isDarkMode ? 'bg-green-500/60' : 'bg-green-400'
//                                                 }`} />
//                                             </div>
//                                             <span className="ml-2">solution.js</span>
//                                         </div>
//                                         <pre className={`
//                                             p-6 overflow-x-auto font-mono text-sm leading-relaxed
//                                             ${isDarkMode 
//                                                 ? 'bg-gray-900 text-gray-100' 
//                                                 : 'bg-white text-gray-800'
//                                             }
//                                         `}>
//                                             <code>{selected.userCode}</code>
//                                         </pre>
//                                     </div>
//                                 )}
//                             </div>

//                             {/* Test Results */}
//                             <div>
//                                 <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
//                                     isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
//                                 }`}>
//                                     <CheckCircle2 className="w-6 h-6" />
//                                     Test Case Results
//                                 </h3>

//                                 {selected.skipped ? (
//                                     <div className={`
//                                         p-8 rounded-xl text-center
//                                         ${isDarkMode 
//                                             ? 'bg-gray-800/50 border border-gray-700/50' 
//                                             : 'bg-gray-50 border border-gray-200'
//                                         }
//                                     `}>
//                                         <p className={`italic ${
//                                             isDarkMode ? 'text-gray-400' : 'text-gray-500'
//                                         }`}>
//                                             No test results available
//                                         </p>
//                                     </div>
//                                 ) : (
//                                     <div className="space-y-3">
//                                         {selected.testResults.map((r, idx) => (
//                                             <div
//                                                 key={idx}
//                                                 className={`
//                                                     p-5 rounded-xl border-2 transition-all
//                                                     ${r.passed
//                                                         ? isDarkMode 
//                                                             ? "bg-green-500/5 border-green-500/30 hover:border-green-500/50"
//                                                             : "bg-green-50 border-green-300 hover:border-green-400"
//                                                         : isDarkMode
//                                                             ? "bg-red-500/5 border-red-500/30 hover:border-red-500/50"
//                                                             : "bg-red-50 border-red-300 hover:border-red-400"
//                                                     }
//                                                 `}
//                                             >
//                                                 <div className="flex items-center justify-between mb-3">
//                                                     <span className={`text-sm font-semibold ${
//                                                         isDarkMode ? 'text-gray-400' : 'text-gray-600'
//                                                     }`}>
//                                                         Test Case {idx + 1}
//                                                     </span>
//                                                     <span className={`
//                                                         flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold
//                                                         ${r.passed 
//                                                             ? isDarkMode
//                                                                 ? 'bg-green-500/20 text-green-400'
//                                                                 : 'bg-green-200 text-green-700'
//                                                             : isDarkMode
//                                                                 ? 'bg-red-500/20 text-red-400'
//                                                                 : 'bg-red-200 text-red-700'
//                                                         }
//                                                     `}>
//                                                         {r.passed ? (
//                                                             <>
//                                                                 <CheckCircle2 className="w-4 h-4" />
//                                                                 Passed
//                                                             </>
//                                                         ) : (
//                                                             <>
//                                                                 <XCircle className="w-4 h-4" />
//                                                                 Failed
//                                                             </>
//                                                         )}
//                                                     </span>
//                                                 </div>
//                                                 <div className={`space-y-2 text-sm ${
//                                                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
//                                                 }`}>
//                                                     <div>
//                                                         <strong className={
//                                                             isDarkMode ? 'text-gray-200' : 'text-gray-900'
//                                                         }>Input:</strong> 
//                                                         <code className={`ml-2 px-2 py-1 rounded ${
//                                                             isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
//                                                         }`}>{r.input}</code>
//                                                     </div>
//                                                     <div>
//                                                         <strong className={
//                                                             isDarkMode ? 'text-gray-200' : 'text-gray-900'
//                                                         }>Expected:</strong> 
//                                                         <code className={`ml-2 px-2 py-1 rounded ${
//                                                             isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
//                                                         }`}>{r.expected}</code>
//                                                     </div>
//                                                     <div>
//                                                         <strong className={
//                                                             isDarkMode ? 'text-gray-200' : 'text-gray-900'
//                                                         }>Output:</strong> 
//                                                         <code className={`ml-2 px-2 py-1 rounded ${
//                                                             isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
//                                                         }`}>{r.output}</code>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     )}
//                 </div>

//                 {/* Close Button */}
//                 <button
//                     onClick={onClose}
//                     className={`
//                         absolute top-6 right-6 p-2.5 rounded-xl transition-all duration-200
//                         ${isDarkMode 
//                             ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700' 
//                             : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-300 shadow-sm'
//                         }
//                     `}
//                 >
//                     <X className="w-5 h-5" />
//                 </button>
//             </div>
//         </div>
//     );
// };

// const InterviewPreview = () => {
//     const navigate = useNavigate();
//     const location = useLocation();

//     const [chatMessages, setChatMessages] = useState([]);
//     const [solvedProblems, setSolvedProblems] = useState([]);
//     const [showSolvedProblems, setShowSolvedProblems] = useState(false);
//     const [interviewData, setInterviewData] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [conversationTab, setConversationTab] = useState("questions");
//     // const [activeTab, setActiveTab] = useState("questions");


//     useEffect(() => {
//         const params = new URLSearchParams(location.search);
//         const sessionId = params.get("sessionId");

//         if (!sessionId) {
//             setLoading(false);
//             return;
//         }

//         const fetchInterview = async () => {
//             try {
//                 const res = await fetch(
//                     `/api/interview-session/${sessionId}`,
//                     { credentials: "include" }
//                 );

//                 const data = await res.json();

//                 if (!data.success) throw new Error("Fetch failed");

//                 setInterviewData(data.session);
//                 setChatMessages(data.session.messages || []);
//                 setSolvedProblems(data.session.solvedProblems || []);
//             } catch (err) {
//                 console.error("Preview fetch failed:", err);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchInterview();
//     }, [location.search]);


//     const handleBack = () => {
//         navigate("/dashboard/interview-analysis");
//     };

//     if (loading) {
//         return (
//             <div className="min-h-screen flex items-center justify-center text-gray-600">
//                 Loading preview...
//             </div>
//         );
//     }

//     if (!interviewData) {
//         return (
//             <div className="min-h-screen flex flex-col items-center justify-center text-gray-600">
//                 <p className="text-xl mb-4">No interview data available</p>
//                 <button
//                     onClick={handleBack}
//                     className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
//                 >
//                     Back to Interviews
//                 </button>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 p-6">
//             <div className="max-w-7xl mx-auto">
//                 <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">

//                     {/* Header */}
//                     <div className="flex items-center justify-between mb-8">
//                         <div className="flex items-center gap-4">
//                             <button
//                                 onClick={handleBack}
//                                 className="p-2 hover:bg-white/50 rounded-full transition"
//                             >
//                                 <ArrowLeft className="w-6 h-6 text-gray-700" />
//                             </button>
//                             <div>
//                                 <h1 className="text-3xl font-bold text-gray-900">
//                                     {interviewData.companyType} - {interviewData.role}
//                                 </h1>
//                                 <p className="text-sm text-gray-600">
//                                     Interview Preview (Read-Only)
//                                 </p>
//                             </div>
//                         </div>

//                         <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
//                             Preview Mode
//                         </div>
//                     </div>

//                     {/* Main Grid */}
//                     <div className="grid grid-cols-3 gap-6">

//                         {/* Left: Video Area */}
//                         <div className="col-span-2 relative">
//                             <div className="rounded-2xl overflow-hidden shadow-lg bg-gray-900 h-[420px] relative flex items-center justify-center">
//                                 <div className="text-center text-gray-400">
//                                     <p className="text-lg">Video Recording Not Available</p>
//                                     <p className="text-sm mt-2">This is a replay of the interview conversation</p>
//                                 </div>
//                             </div>

//                             {/* Interview Stats */}
//                             <div className="mt-6 bg-white/50 backdrop-blur rounded-xl p-5">
//                                 <h3 className="font-semibold text-gray-900 mb-3">
//                                     Interview Statistics
//                                 </h3>
//                                 <div className="grid grid-cols-2 gap-4 text-sm">
//                                     <div>
//                                         <p className="text-gray-600">Total Messages</p>
//                                         <p className="font-semibold text-gray-900">{chatMessages.length}</p>
//                                     </div>
//                                     <div>
//                                         <p className="text-gray-600">Problems Solved</p>
//                                         <p className="font-semibold text-gray-900">{solvedProblems.length}</p>
//                                     </div>
//                                     <div>
//                                         <p className="text-gray-600">Your Responses</p>
//                                         <p className="font-semibold text-gray-900">
//                                             {chatMessages.filter(m => m.sender === "User").length}
//                                         </p>
//                                     </div>
//                                     <div>
//                                         <p className="text-gray-600">Highlight Clips</p>
//                                         <p className="font-semibold text-gray-900">
//                                             {interviewData.highlightClips?.length || 0}
//                                         </p>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Right Sidebar */}
//                         <div className="space-y-4">

//                             {/* Static AI Model */}
//                             {/* <div className="relative rounded-xl overflow-hidden shadow-lg h-48 bg-black">
//                                 <Canvas camera={{ position: [0, 0, 5] }}>
//                                     <ambientLight intensity={0.6} />
//                                     <Environment preset="studio" />
//                                     <StaticModel />
//                                 </Canvas>

//                                 <div className="absolute bottom-4 left-4 bg-indigo-200/80 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 shadow-md">
//                                     <span className="text-sm font-medium text-gray-800">
//                                         Ms. Jenny (Replay)
//                                     </span>
//                                 </div>
//                             </div> */}

//                             {/* Conversation History */}
//                             <div className="bg-white/50 backdrop-blur rounded-xl p-4 h-[585px] flex flex-col">

//                                 {/* Tabs Header */}
//                                 <div className="flex items-center justify-between mb-4">
//                                     <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
//                                         <button
//                                             onClick={() => setConversationTab("questions")}
//                                             className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${conversationTab === "questions"
//                                                     ? "bg-white text-gray-900 shadow-sm"
//                                                     : "text-gray-500 hover:text-gray-700"
//                                                 }`}
//                                         >
//                                             Question List
//                                         </button>

//                                         <button
//                                             onClick={() => setConversationTab("highlights")}
//                                             className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${conversationTab === "highlights"
//                                                     ? "bg-white text-gray-900 shadow-sm"
//                                                     : "text-gray-500 hover:text-gray-700"
//                                                 }`}
//                                         >
//                                             Highlights
//                                         </button>
//                                     </div>

//                                     {solvedProblems.length > 0 && (
//                                         <button
//                                             onClick={() => setShowSolvedProblems(true)}
//                                             className="p-2 rounded-lg hover:bg-gray-100 transition"
//                                             title="View Solved Problems"
//                                         >
//                                             <Code2 className="w-5 h-5 text-gray-600" />
//                                         </button>
//                                     )}
//                                 </div>


//                                 {/* Content Area */}
//                                 <div className="flex-1 overflow-y-auto pr-2">
//                                     {conversationTab === "questions" ? (
//                                         chatMessages.length === 0 ? (
//                                             <p className="text-sm text-gray-500 text-center mt-10">
//                                                 No conversation history available
//                                             </p>
//                                         ) : (
//                                             chatMessages.map((msg, idx) => (
//                                                 <div
//                                                     key={idx}
//                                                     className={`mb-4 ${msg.sender === "User" ? "text-right" : "text-left"
//                                                         }`}
//                                                 >
//                                                     <div
//                                                         className={`inline-block max-w-[85%] px-4 py-3 rounded-lg shadow ${msg.sender === "User"
//                                                             ? "bg-indigo-600 text-white"
//                                                             : "bg-white text-gray-800"
//                                                             }`}
//                                                     >
//                                                         <p className="text-xs font-semibold mb-1 opacity-75">
//                                                             {msg.sender === "User" ? "You" : "Jenny"}
//                                                         </p>
//                                                         <p className="text-sm">{msg.text}</p>

//                                                         {msg.time && (
//                                                             <p className="text-xs mt-1 opacity-60">
//                                                                 {msg.time}
//                                                             </p>
//                                                         )}

//                                                         {msg.feedback && (
//                                                             <div className="mt-3 pt-3 border-t border-white/20">
//                                                                 <p className="text-xs font-semibold mb-1">Feedback:</p>
//                                                                 <p className="text-xs">{msg.feedback.suggestion}</p>
//                                                                 {msg.feedback.example && (
//                                                                     <p className="text-xs mt-1 italic">
//                                                                         Example: {msg.feedback.example}
//                                                                     </p>
//                                                                 )}
//                                                             </div>
//                                                         )}
//                                                     </div>

//                                                     {msg.stage && (
//                                                         <p className="text-xs text-gray-500 mt-1">
//                                                             Stage: {msg.stage}
//                                                         </p>
//                                                     )}
//                                                 </div>
//                                             ))
//                                         )
//                                     ) : (
//                                         interviewData.highlightClips?.length === 0 ? (
//                                             <p className="text-sm text-gray-500 text-center mt-10">
//                                                 No highlight clips available
//                                             </p>
//                                         ) : (
//                                             (Array.isArray(interviewData.highlightClips)
//                                                 ? interviewData.highlightClips
//                                                 : []
//                                             ).map((clip, idx) => (
//                                                 <div
//                                                     key={idx}
//                                                     className="mb-4 bg-white rounded-lg p-3 shadow"
//                                                 >
//                                                     <div className="flex items-start justify-between mb-2">
//                                                         <div className="flex-1">
//                                                             <p className="text-xs text-gray-500 mb-1">
//                                                                 {clip.timestamp}
//                                                             </p>

//                                                             <p className="text-sm font-medium mb-2">
//                                                                 {clip.questionText && clip.questionText.trim().length > 0
//                                                                     ? clip.questionText
//                                                                     : `Question ${clip.questionIndex + 1}`}
//                                                             </p>


//                                                         </div>
//                                                         <div className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
//                                                             Nervous
//                                                         </div>
//                                                     </div>

//                                                     {clip.imageUrl ? (
//                                                         <img
//                                                             src={clip.imageUrl}
//                                                             alt="Nervousness highlight"
//                                                             className="rounded-md w-full object-cover cursor-pointer hover:opacity-90 transition"
//                                                             onClick={() => window.open(clip.imageUrl, '_blank')}
//                                                         />
//                                                     ) : (
//                                                         <div className="bg-gray-100 rounded-md p-4 text-center">
//                                                             <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
//                                                             <p className="text-xs text-gray-500 italic">
//                                                                 Image not available
//                                                             </p>
//                                                         </div>
//                                                     )}

//                                                     {/* <div className="mt-2 flex items-center justify-between text-xs">
//                                                         <span className="text-gray-600">
//                                                             Score: <strong>{Number(clip.nervousScore || 0).toFixed(2)}</strong>
//                                                         </span>
//                                                         <span className="text-gray-600">
//                                                             Confidence: <strong>{Number(clip.confidence || 0).toFixed(2)}</strong>
//                                                         </span>
//                                                     </div> */}
//                                                 </div>
//                                             ))
//                                         )
//                                     )}
//                                 </div>

//                                 {/* Footer */}
//                                 <div className="mt-3 pt-3 border-t border-gray-200">
//                                     <p className="text-xs text-gray-500 text-center italic">
//                                         This is a read-only preview. No interactions available.
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Solved Problems Modal */}
//                     {showSolvedProblems && (
//                         <SolvedProblemsModal
//                             isOpen={showSolvedProblems}
//                             onClose={() => setShowSolvedProblems(false)}
//                             problems={solvedProblems}
//                         />
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default InterviewPreview;
