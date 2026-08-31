

import React, { useState, useEffect, useCallback, useRef } from "react";
import { PhoneOff, MessageSquare, Code, Maximize, Minimize, X, Mic, ListChecks, Play, Code2, Terminal, CheckCircle2, XCircle, ArrowRight, TrendingUp, Activity, AlertCircle, Users, Briefcase } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { mainApi } from "../../../../utils/apiClient";

import { codingQuestions } from "./codingQuestions";
import { useAuthStore } from "../../../../store/authstore";
import UpgradeModal from "../../../../components/UpgradeModal";
import { FIREWORKS_API_URL, MAIN_API_URL, MAIN_BACKEND_URL } from "../../../../config/api";
import socket from "../../../../socket";
import { useInterviewIdentityVerification } from "../../../../hooks/useInterviewIdentityVerification";

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1, ease: "easeOut" } },
};

const itemUpVariants = {
  hidden: { y: 40, opacity: 0, scale: 0.95 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 120, damping: 20, mass: 0.8 } },
};

const itemSideVariants = (direction = "left") => ({
  hidden: { x: direction === "left" ? -40 : 40, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } },
});

const getSolvedProblemCount = (problems = []) => {
  return (problems || []).filter((entry) => {
    if (entry.skipped) return false;
    const results = entry.testResults || [];
    return results.length > 0 && results.every((result) => result.passed);
  }).length;
};

const hoverCardEffect = {
  y: -8, scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)", transition: { type: "spring", stiffness: 300, damping: 20 },
};

// --- Code Editor Modal Component (Redesigned UI with Navigation) ---
const CodeEditorModal = ({ isOpen, onClose, problems = [], onFinishRound, isPreviewMode = false }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [language, setLanguage] = useState("javascript");
  const [codesMap, setCodesMap] = useState({});
  const [outputsMap, setOutputsMap] = useState({});
  const [passedMap, setPassedMap] = useState({});
  const [skippedMap, setSkippedMap] = useState({});
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);

  const activeProblem = problems[activeIndex];

  const generateBoilerplate = (problemObj, lang) => {
    if (!problemObj) return "";

    const title = `// ${problemObj.title}\n`;
    const desc =
      problemObj.description
        ?.split("\n")
        .map((l) => `// ${l}`)
        .join("\n") + "\n\n";

    const fn = problemObj.functionName || "solve";

    if (lang === "javascript") {
      return `${title}${desc}function ${fn}(${problemObj.params || ""}) {\n  // TODO\n}\n`;
    }

    if (lang === "python") {
      return `${title}${desc}def ${fn}(${problemObj.params || ""}):\n    pass\n`;
    }

    if (lang === "cpp") {
      return `${title}${desc}#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  return 0;\n}`;
    }

    return "";
  };

  useEffect(() => {
    if (!problems || problems.length === 0) return;
    setCodesMap((prev) => {
      const next = { ...prev };
      problems.forEach((p, idx) => {
        if (!next[idx]) {
          next[idx] = p.userCode !== undefined ? p.userCode : generateBoilerplate(p, language);
        }
      });
      return next;
    });

    const initialOutputs = {};
    const initialPassed = {};
    const initialSkipped = {};

    problems.forEach((p, idx) => {
      if (p.testResults) {
        initialOutputs[idx] = p.testResults;
        const allPassed = p.testResults.length > 0 && p.testResults.every((r) => r.passed);
        initialPassed[idx] = allPassed;
      } else {
        initialPassed[idx] = p.passed || false;
      }
      initialSkipped[idx] = p.skipped || false;
    });

    setOutputsMap(initialOutputs);
    setPassedMap(initialPassed);
    setSkippedMap(initialSkipped);
  }, [problems]);

  // When language changes, update active problem boilerplate if unchanged from previous boilerplate
  const prevLangRef = useRef(language);
  useEffect(() => {
    if (!activeProblem) return;
    const oldBoilerplate = generateBoilerplate(activeProblem, prevLangRef.current);
    const currentCode = codesMap[activeIndex] || "";
    // If the user hasn't written anything custom (or it's just the old boilerplate), replace it
    if (!currentCode || currentCode === oldBoilerplate) {
      const newVal = generateBoilerplate(activeProblem, language);
      setCodesMap((prev) => ({ ...prev, [activeIndex]: newVal }));
    }
    prevLangRef.current = language;
  }, [language, activeIndex, activeProblem]);

  useEffect(() => {
    setOutput(outputsMap[activeIndex] || []);
  }, [activeIndex, outputsMap]);

  if (!isOpen) return null;

  const handleRun = async () => {
    if (!activeProblem) return;
    const code = codesMap[activeIndex] || "";
    if (!code || !activeProblem.testCases) {
      setOutput([{ id: 0, output: "No test cases available." }]);
      return;
    }

    setLoading(true);
    setOutput([{ id: 0, output: "Running test cases..." }]);

    try {
      const results = [];
      let allPassed = true;

      for (let i = 0; i < activeProblem.testCases.length; i++) {
        const t = activeProblem.testCases[i];

        const runner =
          language === "python"
            ? (code.includes("class Solution")
              ? `\nprint(Solution().${activeProblem.functionName}(${t.input}))`
              : `\nprint(${activeProblem.functionName}(${t.input}))`)
            : language === "cpp"
              ? (code.includes("class Solution")
                ? `\n#include <iostream>\nint main(){ Solution s; std::cout << s.${activeProblem.functionName}(${t.input}); }`
                : `\n#include <iostream>\nint main(){ std::cout << ${activeProblem.functionName}(${t.input}); }`)
              : `\nconsole.log(${activeProblem.functionName}(${t.input}));`;

        const res = await mainApi.post(`${MAIN_BACKEND_URL}/run`, {
          language,
          code: code + runner,
        });

        const data = res.data;
        const out =
          data.run?.output?.trim() ||
          data.run?.stderr?.trim() ||
          "No output";

        const passed = out === String(t.expected).trim();
        if (!passed) allPassed = false;

        results.push({
          id: i + 1,
          input: t.input,
          expected: t.expected,
          output: out,
          passed,
        });
      }

      setOutput(results);
      setOutputsMap((prev) => ({ ...prev, [activeIndex]: results }));

      if (allPassed) {
        setPassedMap((prev) => ({ ...prev, [activeIndex]: true }));
        setSkippedMap((prev) => ({ ...prev, [activeIndex]: false }));
      } else {
        setPassedMap((prev) => ({ ...prev, [activeIndex]: false }));
      }
    } catch {
      setOutput([{ id: 0, output: "Execution failed. Backend error." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipActive = () => {
    setSkippedMap((prev) => ({ ...prev, [activeIndex]: true }));
    setPassedMap((prev) => ({ ...prev, [activeIndex]: false }));
    if (activeIndex < problems.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  const handleFinish = () => {
    const results = problems.map((p, idx) => {
      const userCode = codesMap[idx] || "";
      const testResults = outputsMap[idx] || [];
      const passed = passedMap[idx] || false;
      const skipped = skippedMap[idx] || false;
      return {
        problem: p,
        userCode,
        testResults,
        skipped: !passed && (skipped || userCode.trim() === ""),
        solvedAt: new Date().toISOString(),
      };
    });
    onFinishRound(results);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-7xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#1A1A1A] to-gray-900 text-white relative flex border border-gray-800"
      >
        {/* LEFT PANEL */}
        <aside className="w-[380px] bg-gradient-to-b from-gray-900 to-black border-r border-gray-800 p-6 overflow-y-auto flex flex-col gap-4">
          {/* Question Tabs Selector */}
          <div className="flex border border-gray-800 bg-gray-950 p-1.5 rounded-2xl gap-1">
            {problems.map((p, idx) => {
              const diff = p.difficulty || (idx === 0 ? "Easy" : idx === 1 ? "Medium" : "Hard");
              const isPassed = passedMap[idx];
              const isSkipped = skippedMap[idx];
              const isActive = activeIndex === idx;

              return (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`flex-grow py-3 px-2 rounded-xl text-[11px] font-black tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase ${isActive
                      ? "bg-[#D4F478] text-black shadow-lg"
                      : "text-gray-400 hover:text-white bg-gray-900/40 hover:bg-gray-800/50"
                    }`}
                >
                  <span>{diff}</span>
                  {isPassed && <span className={isActive ? "text-emerald-700" : "text-emerald-400"}>✓</span>}
                  {isSkipped && <span className={isActive ? "text-red-700" : "text-red-400"}>✗</span>}
                </button>
              );
            })}
          </div>

          {/* Active Question Info */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
              {activeProblem?.title || "Waiting..."}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 whitespace-pre-line">
              {activeProblem?.description}
            </p>

            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-bold">
              Test Cases ({activeProblem?.testCases?.length || 0})
            </h3>

            <div className="space-y-3">
              {activeProblem?.testCases?.map((t, i) => (
                <div
                  key={i}
                  className="bg-gray-800/50 border border-gray-700/60 rounded-xl px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-400">Test Case {i + 1}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-gray-500 text-xs font-semibold">Input:</span>
                      <div className="mt-1 bg-gray-900/50 border border-gray-800 rounded-lg px-3 py-1.5">
                        <code className="text-gray-300 font-mono text-xs">{t.input}</code>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs font-semibold">Expected:</span>
                      <div className="mt-1 bg-gray-900/50 border border-emerald-990/20 rounded-lg px-3 py-1.5">
                        <code className="text-[#D4F478] font-mono text-xs font-medium">{t.expected}</code>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <section className="flex-1 flex flex-col min-h-0">
          {/* TOP BAR */}
          <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-900 to-black border-b border-gray-800">
            <div className="flex items-center gap-3">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#D4F478]"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
              </select>

              <button
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeIndex === 0}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 text-sm font-bold text-white transition-all cursor-pointer"
              >
                ← Prev
              </button>

              <button
                onClick={() => setActiveIndex((prev) => Math.min(problems.length - 1, prev + 1))}
                disabled={activeIndex === problems.length - 1}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 text-sm font-bold text-white transition-all cursor-pointer"
              >
                Next →
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRun}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700 text-sm font-bold text-white transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Play className="w-4 h-4" />
                Run
              </button>

              <button
                onClick={handleSkipActive}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700 text-sm font-bold text-gray-300 transition-all hover:scale-[1.02] cursor-pointer"
              >
                Skip Question
              </button>

              {isPreviewMode ? (
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700 text-sm font-bold text-white hover:scale-[1.02] cursor-pointer"
                >
                  Close Review
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-sm font-bold text-white transition-all hover:scale-[1.02] shadow-md shadow-emerald-900/30 cursor-pointer"
                >
                  Finish Coding Round
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700 text-gray-300 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* EDITOR */}
          <div className="px-6 py-5 flex-grow min-h-0 flex flex-col">
            <div className="flex-1 bg-[#0f0f0f] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              <Editor
                height="100%"
                theme="vs-dark"
                language={language === "cpp" ? "cpp" : language}
                value={codesMap[activeIndex] || ""}
                onChange={(val) => setCodesMap((prev) => ({ ...prev, [activeIndex]: val || "" }))}
                options={{
                  fontSize: 15,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  readOnly: isPreviewMode,
                }}
              />
            </div>
          </div>

          {/* OUTPUT */}
          <div className="px-6 pb-6">
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-5">
              <h3 className="text-[#D4F478] font-bold mb-4 tracking-wide flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Execution Results
              </h3>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {output.map((r, i) => (
                  <div
                    key={i}
                    className={`rounded-xl px-4 py-3 text-sm ${r.id === 0
                      ? "bg-gray-800/50 border border-gray-700"
                      : r.passed
                        ? "bg-gradient-to-r from-green-900/20 to-emerald-900/10 border border-emerald-800/30"
                        : "bg-gradient-to-r from-red-900/20 to-rose-900/10 border border-rose-800/30"
                      }`}
                  >
                    {r.id !== 0 ? (
                      <>
                        <div className="font-bold mb-2 flex items-center justify-between">
                          <span className="text-white">Test {r.id}</span>
                          <span
                            className={`flex items-center gap-1 ${r.passed ? "text-emerald-400" : "text-rose-400"
                              }`}
                          >
                            {r.passed ? "✓ Passed" : "✗ Failed"}
                          </span>
                        </div>
                        <div className="text-gray-300">
                          <div>
                            <span className="text-gray-500">Output:</span> {r.output}
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-300">{r.output}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
};

const SolvedProblemsModal = ({ isOpen, onClose, problems }) => {
  const [selected, setSelected] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-6xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex bg-gradient-to-br from-[#1A1A1A] to-gray-900 text-white relative border border-gray-800"
      >
        {/* SIDEBAR */}
        <aside className="w-[340px] bg-gradient-to-b from-gray-900 to-black border-r border-gray-800 p-5 overflow-y-auto">
          <h2 className="text-xl font-bold text-[#D4F478] mb-6 tracking-tight">
            Solved Problems
          </h2>

          {problems.length === 0 && (
            <p className="text-sm text-gray-500">
              No problems solved yet.
            </p>
          )}

          <div className="space-y-3">
            {problems.map((p, i) => {
              const active = selected === p;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(p)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${active
                    ? "bg-gradient-to-r from-gray-800 to-gray-900 border-[#D4F478]/40 shadow-lg"
                    : "bg-gray-800/30 hover:bg-gray-800/50 border-gray-700 hover:border-gray-600"
                    }`}
                >
                  <div className="font-bold text-sm text-white">
                    {p.problem.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(p.solvedAt).toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="flex-1 p-6 overflow-y-auto">
          {!selected && (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a solved problem to view details
            </div>
          )}

          {selected && (
            <div className="max-w-4xl">
              {/* HEADER */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#D4F478] mb-3">
                  {selected.problem.title}
                </h2>

                {selected.skipped && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-900/20 to-red-900/10 border border-rose-800/30 text-rose-400 text-sm font-bold">
                    <XCircle className="w-4 h-4" />
                    Skipped
                  </div>
                )}
              </div>

              {/* DESCRIPTION */}
              <div className="mb-8 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-5">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-bold">
                  Problem Description
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                  {selected.problem.description}
                </p>
              </div>

              {/* SOLUTION */}
              <div className="mb-8">
                <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                  <Code2 className="w-5 h-5 text-[#D4F478]" />
                  Your Solution
                </h3>

                {selected.skipped ? (
                  <p className="text-sm text-gray-500 italic">
                    No code submitted for this problem.
                  </p>
                ) : (
                  <div className="h-[280px] bg-[#0f0f0f] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                    <Editor
                      height="100%"
                      language="javascript"
                      value={selected.userCode || "// No code submitted"}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 15,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* TEST RESULTS */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">
                  Test Case Results
                </h3>

                {selected.skipped ? (
                  <p className="text-sm text-gray-500 italic">
                    No test results available.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {selected.testResults.map((r, idx) => (
                      <div
                        key={idx}
                        className={`rounded-2xl p-4 border ${r.passed
                          ? "bg-gradient-to-r from-emerald-900/10 to-green-900/5 border-emerald-800/30"
                          : "bg-gradient-to-r from-rose-900/10 to-red-900/5 border-rose-800/30"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-white">
                            Test Case {idx + 1}
                          </span>
                          <span
                            className={`flex items-center gap-1 font-bold ${r.passed ? "text-emerald-400" : "text-rose-400"
                              }`}
                          >
                            {r.passed ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" /> Passed
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" /> Failed
                              </>
                            )}
                          </span>
                        </div>

                        <div className="text-gray-300 space-y-2">
                          <div>
                            <span className="text-gray-500">Input:</span>{" "}
                            <span className="font-mono">{r.input}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Expected:</span>{" "}
                            <span className="text-[#D4F478] font-mono">{r.expected}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Output:</span>{" "}
                            <span className="font-mono">{r.output}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700 text-gray-300 transition-all hover:scale-[1.02]"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
};

// --- End Interview Report Modal ---
const EndInterviewReportModal = ({ isOpen, onClose, isUploading, uploadStatus }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-[#1A1A1A] to-gray-900 text-white relative border border-gray-800"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4F478] to-emerald-500 flex items-center justify-center">
              <Activity className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#D4F478] tracking-tight">
                Interview Analysis
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Processing your interview session...
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {isUploading ? (
            <div className="space-y-6">
              {/* Loading Animation */}
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-gray-700 border-t-[#D4F478] rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#D4F478]/20 to-emerald-500/20 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-lg font-medium text-gray-300 mt-6">
                  {uploadStatus || "Processing interview data..."}
                </p>
              </div>

              {/* Progress Steps */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-gradient-to-r from-gray-800/50 to-gray-900/30 border border-gray-700 rounded-xl px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-[#D4F478] flex items-center justify-center animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-black" />
                  </div>
                  <span className="text-sm text-gray-300">Analyzing conversation history</span>
                </div>

                <div className="flex items-center gap-3 bg-gradient-to-r from-gray-800/50 to-gray-900/30 border border-gray-700 rounded-xl px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-[#D4F478] flex items-center justify-center animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-black" />
                  </div>
                  <span className="text-sm text-gray-300">Evaluating coding solutions</span>
                </div>

                <div className="flex items-center gap-3 bg-gradient-to-r from-gray-800/50 to-gray-900/30 border border-gray-700 rounded-xl px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#D4F478] rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-sm text-gray-400">Generating performance report</span>
                </div>

                <div className="flex items-center gap-3 bg-gradient-to-r from-gray-800/50 to-gray-900/30 border border-gray-700 rounded-xl px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-500">Preparing summary page</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                This may take a few moments. Please don't close this window.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success State */}
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4F478] to-emerald-500 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-[#D4F478] mb-2">
                  Analysis Complete!
                </h3>
                <p className="text-gray-400 text-center">
                  Your interview report has been generated successfully.
                </p>
              </div>

              <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/30 border border-gray-700 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-2">What's Next?</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      You'll be redirected to your detailed interview summary in a moment.
                      The report includes your responses, AI feedback, coding solutions, and personalized recommendations.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Redirecting you to the summary page...
              </p>
            </div>
          )}
        </div>

        {/* Footer - Only show close button when not uploading */}
        {!isUploading && (
          <div className="bg-gradient-to-r from-gray-900 to-black border-t border-gray-800 px-8 py-4">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4F478] to-emerald-500 hover:from-[#c5e668] hover:to-emerald-400 text-black font-bold transition-all hover:scale-[1.02]"
            >
              View Report Now
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// --- Enhanced Model Component with Dynamic Speech ---
// speechData: { text: string, duration: number } | null
function DynamicModel({ speechData, onSpeechEnd, ...props }) {
  const { nodes, materials } = useGLTF('/final_prepvio_model.glb');
  const meshRef = useRef();
  const headBoneRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    Object.values(materials || {}).forEach((mat) => (mat.morphTargets = true));
  }, [materials]);

  const letterToViseme = {
    a: 'aa', b: 'PP', c: 'CH', d: 'DD', e: 'E', f: 'FF',
    g: 'DD', h: 'sil', i: 'E', k: 'DD', l: 'nn', m: 'PP',
    n: 'nn', o: 'oh', p: 'PP', r: 'aa', s: 'SS', t: 'DD',
    u: 'oh', v: 'FF', w: 'oh', x: 'SS', y: 'E', z: 'SS',
    ' ': 'sil'
  };

  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [chars, setChars] = useState([]);
  const morphKeys = nodes?.rp_carla_rigged_001_geo?.morphTargetDictionary || {};

  useEffect(() => {
    if (!speechData || !speechData.text) {
      setChars([]);
      setCurrentCharIndex(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const textChars = speechData.text.toLowerCase().split('');
    setChars(textChars);

    // Calculate per-character interval from the actual audio duration
    const durationMs = (speechData.duration || 2) * 1000; // seconds -> ms
    const perCharMs = Math.max(100, Math.min(200, durationMs / textChars.length));

    // Clear any previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    let i = 0;
    intervalRef.current = setInterval(() => {
      if (i < textChars.length) {
        setCurrentCharIndex(i);
        i++;
      } else {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        // Reset mouth to closed after animation completes
        setChars([]);
        setCurrentCharIndex(0);
        if (onSpeechEnd) onSpeechEnd();
      }
    }, perCharMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [speechData, onSpeechEnd]);

  useEffect(() => {
    if (nodes?.rp_carla_rigged_001_geo?.skeleton) {
      const head = nodes.rp_carla_rigged_001_geo.skeleton.bones.find((b) =>
        b.name.toLowerCase().includes('head')
      );
      if (head) headBoneRef.current = head;
    }
  }, [nodes]);

  const offsetY = useRef(Math.random() * 0.08);
  const offsetX = useRef(Math.random() * 0.05);

  useFrame((state) => {
    // Only animate mouth (lip sync), NO head movement
    if (!speechData || chars.length === 0) {
      // Reset to neutral position when not speaking
      if (headBoneRef.current) {
        headBoneRef.current.rotation.y = 0;
        headBoneRef.current.rotation.x = 0;
      }
      if (meshRef.current?.morphTargetInfluences) {
        meshRef.current.morphTargetInfluences.fill(0);
      }
      return;
    }

    // Keep head completely still - remove all head rotation
    if (headBoneRef.current) {
      headBoneRef.current.rotation.y = 0;
      headBoneRef.current.rotation.x = 0;
    }

    // Only do lip sync animation
    if (meshRef.current?.morphTargetInfluences) {
      const influences = meshRef.current.morphTargetInfluences;
      influences.fill(0);
      const char = chars[currentCharIndex];
      if (char) {
        const viseme = letterToViseme[char] || 'oh';
        const index = morphKeys[viseme];
        if (index !== undefined) influences[index] = 0.8;
      }
    }
  });

  if (!nodes?.rp_carla_rigged_001_geo) return null;

  return (
    <group
      {...props}
      position={[-0.579, -1.68, 3.967]}
      rotation={[1.86, 0, 0]}
      scale={0.012}
      dispose={null}
    >
      <skinnedMesh
        ref={meshRef}
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

useGLTF.preload('/final_prepvio_model.glb');

// --- API Constants ---
const BACKEND_UPLOAD_URL = `${MAIN_API_URL}/upload`;

// --- Utilities: format problem for chat (keeps chat+editor in sync) ---
const generateReportContent = (messages, company, role) => {
  let content = `--- Mock Interview Report ---\n\n`;
  content += `Role: ${role}\n`;
  content += `Company Type: ${company}\n`;
  content += `Date: ${new Date().toLocaleDateString()}\n\n`;
  content += `--- Conversation Log ---\n\n`;

  messages.forEach((msg) => {
    content += `${msg.sender}: ${msg.text}\n`;

    if (msg.sender === "User" && msg.feedback) {
      const suggestion = msg.feedback.suggestion || "";
      const example = msg.feedback.example || "";
      content += `[Feedback]: ${suggestion}|||${example}\n`;
    }
  });

  content += `\n=== FINAL ANALYSIS ===\n\n`;
  content += `**Overall Performance Summary**\n`;
  content += `This interview covered both HR and technical aspects for the ${role} position.\n\n`;

  content += `**Key Strengths Observed**\n`;
  content += `- Engaged actively throughout the conversation\n`;
  content += `- Demonstrated willingness to learn and improve\n\n`;

  content += `**General Recommendations**\n`;
  content += `1. Continue practicing technical concepts relevant to ${role}\n`;
  content += `2. Use the STAR method for behavioral questions\n`;
  content += `3. Build small projects to demonstrate practical skills\n`;
  content += `4. Review feedback provided after each response above\n`;

  return content;
};

// --- Helper function to get random coding questions ---
const getRandomCodingQuestions = (count = 3) => {
  // Shuffle the array
  const shuffled = [...codingQuestions].sort(() => Math.random() - 0.5);
  // Return first N questions
  return shuffled.slice(0, count);
};

// Format problem for chat display
const formatProblemForChat = (problem) => {
  const title = problem.title || "Coding Challenge";
  const desc = problem.description || "";
  const example = problem.example ? `Example:\n${problem.example}` : "";
  const tests = problem.testCases?.length
    ? "\nTest Cases:\n" +
    problem.testCases.map(
      (tc, i) => `${i + 1}. Input: ${tc.input} → Expected: ${tc.expected}`
    ).join("\n")
    : "";

  return `${title}\n\n${desc}\n\n${example}${tests}\n\nYou can use the Code Editor to solve this problem.`;
};

// Map company role rounds to AI interviewer stages
const mapRoundToStage = (roundName) => {
  if (!roundName) return "intro";
  const name = roundName.toLowerCase();

  // "pre-technical" and "technical round 1" should map to transition (pre-technical)
  if (name.includes("pre-technical") || name.includes("technical round 1")) {
    return "transition";
  }

  // Coding challenges and live coding (e.g. Technical Phone Screen / Technical Phone Round) map to coding
  if (
    name.includes("coding") ||
    name.includes("online assessment") ||
    name.includes("assessment") ||
    name.includes("phone screen") ||
    (name.includes("technical") && name.includes("phone")) ||
    name === "technical" ||
    name === "technical round" ||
    name.includes("technical coding")
  ) {
    if (name.includes("technical round 2")) {
      return "technical"; // Concept-based deep-dive Q&A
    }
    return "coding";
  }

  if (name.includes("system design") || name.includes("design") || name.includes("architecture")) {
    return "technical";
  }

  if (name.includes("hr") || name.includes("hiring manager") || name.includes("behavioral") || name.includes("offer") || name.includes("final") || name.includes("discussion")) {
    return "final";
  }

  if (name.includes("intro")) {
    return "intro";
  }

  return "intro"; // default fallback
};

// --- Phase 9: Unified Adaptive Reasoning & Stage System Instructions ---
const getStageSystemInstruction = (stage, role, companyType) => {
  if (stage === "intro") {
    return `You are Sira, a senior, professional AI interviewer conducting the INTRODUCTION round for a ${role} position at ${companyType}.

OBJECTIVE: Establish rapport, understand the candidate's professional background, core technical experiences, and alignment with ${companyType}.

BEHAVIOR & ADAPTIVE REASONING CONTRACT:
- Maintain a calm, engaging, and professional tone.
- Ask ONE clear, open-ended question at a time.
- LISTEN & EVALUATE: Read the candidate's actual answer against previous conversation turns.
- STRONG ANSWER: Acknowledge briefly and smoothly move to the next introduction topic.
- VAGUE / HIGH-LEVEL ANSWER: Ask a focused follow-up (e.g. "What specific role did you play in that project?").
- CHALLENGE (SELECTIVE, ~40%): If they claim specific outcomes or tools, ask a thoughtful counter-question on why they chose that path.
- ANTI-REPETITION: Never re-ask details the candidate has already explained in earlier turns.
- TOPIC DEPTH CONTROL: Limit follow-ups to maximum 1-2 per subtopic before progressing.

KEY TOPIC PROGRESSION:
1. Professional background and what led them to pursue ${role}.
2. Key projects and technical experiences relating to this ${role} position.
3. Why they are excited about working at ${companyType} and their immediate career goals.`;
  }

  if (stage === "transition") {
    return `You are Sira, conducting the PRE-TECHNICAL / FOUNDATIONAL round for a ${role} position at ${companyType}.

OBJECTIVE: Bridge personal background and deep technical concepts by assessing foundational understanding, engineering workflow, and technical confidence.

BEHAVIOR & ADAPTIVE REASONING CONTRACT:
- Reference previous answers when relevant to ensure conversational continuity.
- Ask ONE focused technical question at a time (total 3 questions in this round).
- STRONG ANSWER: Acknowledge and advance to the next foundational domain or ask a subtle edge-case question.
- PARTIAL ANSWER: Ask a targeted probe on the specific missing foundational concept.
- WEAK / INCORRECT ANSWER: Probe the underlying fundamentals politely to test their problem-solving instincts.
- IRRELEVANT ANSWER: Clarify the core question and redirect the candidate back to the topic.
- ANTI-REPETITION: Inspect the full conversation history. Do not repeat concepts already assessed.
- TOPIC DEPTH CONTROL: Max 1 follow-up on the same concept before advancing.

KEY FOUNDATIONAL TOPICS:
1. Practical approach, design philosophy, and workflow for core ${role} technologies.
2. Key frameworks and technologies in ${role} they are most confident with.
3. Fundamental concept application in real-world scenarios.`;
  }

  if (stage === "technical") {
    return `You are Sira, conducting the TECHNICAL DEEP-DIVE round for a ${role} position at ${companyType}.

OBJECTIVE: Rigorously evaluate depth of knowledge, architectural decision-making, trade-offs, problem-solving, and system design.

BEHAVIOR & ADAPTIVE REASONING CONTRACT:
- Ask ONE deep technical question at a time (total 6 technical questions in this round).
- REASON BEFORE GENERATING: Analyze the candidate's latest response in the context of the full conversation history.
- STRONG / ADVANCED ANSWER: Validate technical depth, then either explore high-scale trade-offs, edge cases, or advance to the next technical pillar.
- PARTIAL ANSWER: Formulate a targeted probe focusing specifically on the omitted component or mechanism.
- INCORRECT ANSWER: Constructively challenge the misconception (e.g. "How would that behave if the dataset grew by 100x or memory is constrained?").
- VAGUE / BUZZWORD ANSWER: Immediately ask "Why?" or "Can you walk me through the step-by-step mechanism?".
- ANTI-REPETITION: Review the entire conversation history. Never re-test topics that have already been addressed.
- TOPIC DEPTH CONTROL: Limit consecutive probing to 1-2 turns on a single concept before moving to the next progression pillar.

TECHNICAL PROGRESSION PILLARS:
1. CORE ARCHITECTURAL CONCEPTS for ${role}.
2. REAL-WORLD APPLIED SCENARIOS & troubleshooting complex obstacles.
3. SYSTEM DESIGN, SCALABILITY, & component architecture.
4. TRADE-OFFS, ALTERNATIVES, & design decision justifications.
5. PRODUCTION DEBUGGING, performance profiling, & resilience.
6. SECURITY, MAINTAINABILITY, & engineering best practices.`;
  }

  if (stage === "coding") {
    return `You are Sira, overseeing the CODING round for ${role} at ${companyType}.

OBJECTIVE: Provide guidance and hints only when requested while the candidate writes and tests code in the editor.

BEHAVIOR:
- If the candidate asks for hints, offer subtle algorithmic or edge-case guidance without giving away the complete solution.
- Keep responses brief and focused (1-2 sentences).`;
  }

  if (stage === "final") {
    return `You are Sira, conducting the FINAL DISCUSSION round for a ${role} position at ${companyType}.

OBJECTIVE: Discuss role expectations, work mode, salary, notice period, team fit, and answer any candidate questions.

BEHAVIOR & ADAPTIVE REASONING CONTRACT:
- Acknowledge overall performance positively, referencing specific strengths demonstrated during the interview.
- Ask ONE question at a time.
- Cover practical logistics: Notice period, start date, compensation expectations, work mode (remote/hybrid).
- Answer candidate questions professionally as a hiring leader at ${companyType}.
- ANTI-REPETITION: Do not re-ask logistical details already provided in previous turns.`;
  }

  return `You are Sira, a professional AI interviewer conducting the ${stage} round for a ${role} position at ${companyType}.`;
};

// --- Main InterviewScreen (Updated UI) ---
const InterviewScreen = ({
  companyType: propCompanyType = "Tech Startup",
  role: propRole = "Full Stack Developer",
  setStage = () => { },
  userId = "user1"
}) => {
  const location = useLocation();
  const companyType = location.state?.companyType || propCompanyType || "Tech Startup";
  const role = location.state?.role || propRole || "Full Stack Developer";
  const userVideoRef = useRef(null);
  const screenRef = useRef(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const captureCanvasRef = useRef(null);

  // Streaming audio refs
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const nextAudioTimeRef = useRef(0);
  const isStreamingAudioRef = useRef(false);
  const speechBufferRef = useRef("");
  const lastTtsEndTimerRef = useRef(null);
  const autoSendTimerRef = useRef(null);
  const highlightBufferRef = useRef([]);
  const lastUserSpeechRef = useRef({ text: "", at: 0 });

  const [showEndInterviewModal, setShowEndInterviewModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const isPreview = location.state?.isPreview === true;
  const previewSession = location.state?.previewSession;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [isIdentityTerminated, setIsIdentityTerminated] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const getInitialStage = () => {
    if (location.state?.selectionMode === "specific" && location.state?.targetRoundName) {
      const stage = mapRoundToStage(location.state.targetRoundName);
      console.log(`🎯 Jump directly to round: ${location.state.targetRoundName} -> stage: ${stage}`);
      return stage;
    }
    return "intro";
  };

  const [interviewStage, setInterviewStage] = useState(getInitialStage);
  const [currentAiSpeech, setCurrentAiSpeech] = useState("");
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [codingProblem, setCodingProblem] = useState(null);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const solvedProblemsRef = useRef([]);
  const [showSolvedProblems, setShowSolvedProblems] = useState(false);
  const [deviationWarnings, setDeviationWarnings] = useState(0);
  const [codingCount, setCodingCount] = useState(0);
  const [selectedCodingQuestions, setSelectedCodingQuestions] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [hasCodingRound, setHasCodingRound] = useState(false);
  const [technicalQuestionCount, setTechnicalQuestionCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { user } = useAuthStore();


  const navigate = useNavigate();

  useEffect(() => {
    if (interviewStage === "coding" && codingProblem) {
      // ✅ Gating Logic: Block if on Basic Plan AND no promo code used AND not on Free Plan
      const isBasicPlan = user?.subscription?.planId === 'monthly';
      const isFreePlan = user?.subscription?.planId === 'free';
      const hasUsedPromo = user?.payments?.some(p => p.promoCode && p.status === 'success');

      if (isBasicPlan && !hasUsedPromo && !isFreePlan) {
        setShowUpgradeModal(true);
      } else {
        setIsCodeEditorOpen(true);
      }
    }
  }, [interviewStage, codingProblem, user]);


  // Fetch rounds for the selected company and role
  useEffect(() => {
    const fetchRounds = async () => {
      try {
        console.log("🔍 Fetching rounds for:", { companyType, role });

        let roundsList = [];
        try {
          const response = await mainApi.get(
            `/companies/${encodeURIComponent(companyType)}/${encodeURIComponent(role)}/rounds`
          );

          if (response.data && Array.isArray(response.data.rounds)) {
            roundsList = response.data.rounds;
          } else if (Array.isArray(response.data)) {
            roundsList = response.data;
          } else {
            console.warn("⚠️ Unexpected rounds response format:", response.data);
            roundsList = [];
          }
        } catch (roundsErr) {
          console.warn("⚠️ Failed to load rounds from server, using location state fallback:", roundsErr.message);
          roundsList = location.state?.rounds || [];
        }

        console.log("📋 Rounds received:", roundsList.map(r => r.name));
        setRounds(roundsList);

        // Enhanced coding round detection - handles typos and variations
        const hasCoding = roundsList.some((round) => {
          if (!round || !round.name) {
            console.warn("⚠️ Found round without name:", round);
            return false;
          }

          const isCodingRound = mapRoundToStage(round.name) === "coding";

          if (isCodingRound) {
            console.log("✅ Coding round detected:", round.name);
          }

          return isCodingRound;
        });

        console.log("🎯 Final hasCodingRound:", hasCoding);
        setHasCodingRound(hasCoding);

        // Initialize coding questions only if coding round exists or we start in coding round
        const isCodingInitial = getInitialStage() === "coding";
        if (hasCoding || isCodingInitial) {
          try {
            const resp = await mainApi.get("/interview/coding-problems/random");
            if (resp.data?.success && Array.isArray(resp.data?.problems)) {
              const questions = resp.data.problems;
              console.log("📝 Loaded", questions.length, "coding questions from DB");
              setSelectedCodingQuestions(questions);
              if (isCodingInitial) {
                setCodingProblem(questions[0]);
              }
            } else {
              throw new Error("Invalid problems response format");
            }
          } catch (dbErr) {
            console.error("❌ Failed to load coding questions from DB, falling back:", dbErr.message);
            const questions = getRandomCodingQuestions(3);
            console.log("📝 Loaded fallback local", questions.length, "coding questions");
            setSelectedCodingQuestions(questions);
            if (isCodingInitial) {
              setCodingProblem(questions[0]);
            }
          }
        } else {
          console.log("⏭️ No coding round - will skip directly to final");
          setSelectedCodingQuestions([]);
        }
      } catch (error) {
        console.error("❌ Error fetching rounds:", error);
        setHasCodingRound(false);
        setSelectedCodingQuestions([]);
      }
    };

    if (companyType && role) {
      fetchRounds();
    }
  }, [companyType, role]);



  // Replace lines 561-597 with this optimized version:


  const endInterview = useCallback(() => {
    console.log("Interview ended and resources cleaned.");
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (window.currentMediaStream) {
      window.currentMediaStream.getTracks().forEach(track => track.stop());
      window.currentMediaStream = null;
    }
    if (userVideoRef.current?.srcObject) {
      userVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      userVideoRef.current.srcObject = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsSpeaking(false);
    setIsRecording(false);
    setGreeted(false);
    setChatMessages([]);
    setError(null);
    console.log("✅ All media and states cleared.");
  }, []);



  useEffect(() => {
    if (isPreview && previewSession?.messages) {
      setChatMessages(previewSession.messages);
      setSolvedProblems(previewSession.solvedProblems || []);
      setCameraAllowed(true);
    }
  }, [isPreview, previewSession]);



  useEffect(() => {
    return () => {
      endInterview();
    };
  }, [endInterview]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const formatHistoryForFireworks = useCallback((history) => {
    return history.map((msg) => ({
      role: msg.sender === "AI" ? "assistant" : "user",
      content: msg.text,
    }));
  }, []);

  const fetchFireworksContent = useCallback(async (messages, systemInstruction, onToken) => {
    const messagesWithSystem = [
      { role: "system", content: systemInstruction },
      ...messages
    ];

    try {
      const isStreaming = typeof onToken === "function";
      const res = await fetch(FIREWORKS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": isStreaming ? "text/event-stream" : "application/json"
        },
        body: JSON.stringify({
          messages: messagesWithSystem,
          stream: isStreaming
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error:", errorText);
        throw new Error(`API error: ${res.status}`);
      }

      if (isStreaming) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop(); // Keep partial line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed === "data: [DONE]") continue;
            if (trimmed.startsWith("data: ")) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                const token = data?.choices?.[0]?.delta?.content || "";
                if (token) {
                  fullText += token;
                  onToken(token);
                }
              } catch (e) {
                // Ignore JSON parse errors on partial chunks
              }
            }
          }
        }
        if (!fullText.trim()) {
          throw new Error("Empty response from AI stream");
        }
        return fullText.trim();
      } else {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content || content.trim() === "") {
          throw new Error("Empty response from AI");
        }
        return content.trim();
      }
    } catch (err) {
      console.error("Fireworks API Error:", err.message);
      throw err;
    }
  }, []);

  const generateFeedbackForAnswer = useCallback(async (userAnswer, aiQuestion) => {
    try {
      const feedbackPrompt = `You are an interview coach analyzing a candidate's answer.

Previous Question: "${aiQuestion}"
Candidate's Answer: "${userAnswer}"

Provide constructive feedback in this EXACT format (no additional text):
SUGGESTION: [One specific improvement suggestion in 1-2 sentences]
EXAMPLE: [A better way to phrase the answer in 1 sentence]

You are a ruthless senior interviewer.
Do NOT sugarcoat feedback.
If the answer is vague, say so clearly.

Rules:
- Do NOT praise unless the answer is genuinely strong
- Explicitly call out missing depth, weak reasoning, or lack of justification


Keep it concise and actionable.`;

      const feedbackMessages = [
        { role: "user", content: feedbackPrompt }
      ];

      const feedbackText = await fetchFireworksContent(feedbackMessages, "You are a helpful interview coach providing brief, actionable feedback.");

      const suggestionMatch = feedbackText.match(/SUGGESTION:\s*(.+?)(?=EXAMPLE:|$)/s);
      const exampleMatch = feedbackText.match(/EXAMPLE:\s*(.+?)$/s);

      return {
        suggestion: suggestionMatch ? suggestionMatch[1].trim() : "Keep practicing to improve your interview responses.",
        example: exampleMatch ? exampleMatch[1].trim() : ""
      };
    } catch (err) {
      console.error("Feedback generation error:", err);
      return {
        suggestion: "Consider providing more specific examples from your experience.",
        example: "Try structuring your answer with concrete details about what you did and what you achieved."
      };
    }
  }, [fetchFireworksContent]);

  // Get next coding problem from pre-selected questions
  const getNextCodingProblem = useCallback(() => {
    if (!selectedCodingQuestions.length) return null;
    if (codingCount >= selectedCodingQuestions.length) return null;

    return selectedCodingQuestions[codingCount];
  }, [selectedCodingQuestions, codingCount]);





  const startFinalRound = async () => {
    try {
      const systemInstruction = getStageSystemInstruction("final", role, companyType);

      const aiReply = await fetchFireworksContent(
        formatHistoryForFireworks(chatMessages),
        systemInstruction
      );

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          text: aiReply.trim(),
          time: new Date().toLocaleTimeString(),
          stage: "final",
        },
      ]);

      textToSpeech(aiReply);
    } catch (err) {
      console.error("Final round failed:", err);
    }
  };


  const textToSpeech = useCallback((text) => {
    if (!text) return;

    // Strip markdown formatting before speaking
    const cleanText = text
      .replace(/\*\*/g, '')           // Remove bold **text**
      .replace(/\*/g, '')             // Remove italic *text*
      .replace(/#{1,6}\s/g, '')       // Remove headers # ## ###
      .replace(/`{1,3}[^`]*`{1,3}/g, (match) => match.replace(/`/g, '')) // Remove code backticks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert [link](url) to just link text
      .replace(/^\s*[-*+]\s/gm, '')   // Remove bullet points
      .replace(/^\s*\d+\.\s/gm, '')   // Remove numbered lists
      .trim();

    setIsSpeaking(true);
    // Do NOT set currentAiSpeech here — lip sync will be triggered when audio actually arrives and plays

    if (socket.connected) {
      socket.emit("trigger_tts", cleanText);
      // Safety timer in case backend TTS does not return audio chunk
      if (lastTtsEndTimerRef.current) clearTimeout(lastTtsEndTimerRef.current);
      lastTtsEndTimerRef.current = setTimeout(() => {
        setIsSpeaking(false);
      }, 8000);
    } else if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        setIsSpeaking(false);
      }
    } else {
      setIsSpeaking(false);
    }
  }, []);

  const handleSendMessage = useCallback(
    async (text) => {
      const messageToSend = text.trim();
      if (interviewStage === "coding") {
        return;
      }

      lastUserSpeechRef.current = { text: messageToSend, at: Date.now() };

      if (!messageToSend || isLoadingAI || isSpeaking) return;

      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setIsRecording(false);
      }

      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
        autoSendTimerRef.current = null;
      }

      setError(null);
      setInputValue("");

      const lastAiMessage =
        chatMessages.filter((m) => m.sender === "AI").slice(-1)[0];
      const lastAiQuestion = lastAiMessage ? lastAiMessage.text : "";

      const userMsg = {
        sender: "User",
        text: messageToSend,
        time: new Date().toLocaleTimeString(),
        stage: interviewStage,
        feedback: null,
      };

      setChatMessages((prev) => [...prev, userMsg]);

      const aiCount = (stage) =>
        chatMessages.filter(
          (m) => m.sender === "AI" && m.stage === stage
        ).length;

      const introQ = aiCount("intro");
      const transQ = aiCount("transition");

      // More realistic interview timing - increase questions per round (15-20 min total)
      const selectionMode = location.state?.selectionMode || "all";
      const isSingleRoundMode = selectionMode === "specific";

      if (interviewStage === "intro" && introQ >= 3) {
        if (isSingleRoundMode) {
          const msg = "Thank you. That concludes this introduction round. I'll now complete the session and prepare your feedback report.";
          setChatMessages((prev) => [
            ...prev,
            {
              sender: "AI",
              text: msg,
              time: new Date().toLocaleTimeString(),
              stage: "intro",
            },
          ]);
          textToSpeech(msg);
          setTimeout(() => {
            handleEndInterview();
          }, 2000);
          return;
        }

        const msg = "Great. Let's move forward. I'll now ask you a few pre-technical questions to understand your experience better.";
        setInterviewStage("transition");
        setIsLoadingAI(false);

        setChatMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: msg,
            time: new Date().toLocaleTimeString(),
            stage: "transition",
          },
        ]);

        textToSpeech(msg);
        return;
      }

      if (interviewStage === "transition" && transQ >= 3) {
        if (isSingleRoundMode) {
          const msg = "Thank you. That concludes this pre-technical round. I'll now complete the session and prepare your feedback report.";
          setChatMessages((prev) => [
            ...prev,
            {
              sender: "AI",
              text: msg,
              time: new Date().toLocaleTimeString(),
              stage: "transition",
            },
          ]);
          textToSpeech(msg);
          setTimeout(() => {
            handleEndInterview();
          }, 2000);
          return;
        }

        const msg = "Excellent. Now let's dive into the technical round. I'll ask you deeper concept-based questions related to your field.";
        setInterviewStage("technical");
        setIsLoadingAI(false);

        setChatMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: msg,
            time: new Date().toLocaleTimeString(),
            stage: "technical",
          },
        ]);

        textToSpeech(msg);
        return;
      }

      if (interviewStage === "technical" && technicalQuestionCount >= 6) {
        if (isSingleRoundMode) {
          const msg = "Thank you. That concludes this technical round. I'll now complete the session and prepare your feedback report.";
          setChatMessages((prev) => [
            ...prev,
            {
              sender: "AI",
              text: msg,
              time: new Date().toLocaleTimeString(),
              stage: "technical",
            },
          ]);
          textToSpeech(msg);
          setTimeout(() => {
            handleEndInterview();
          }, 2000);
          return;
        }

        console.log("📊 Technical round complete. hasCodingRound:", hasCodingRound);

        // Check if this role has a coding round
        if (hasCodingRound && selectedCodingQuestions.length > 0) {
          const msg = "That concludes the technical round. We will now move to the coding round.";
          setChatMessages((prev) => [
            ...prev,
            {
              sender: "AI",
              text: msg,
              time: new Date().toLocaleTimeString(),
              stage: "technical",
            },
          ]);
          textToSpeech(msg);

          setTimeout(() => {
            setInterviewStage("coding");
            const firstProblem = getNextCodingProblem();
            console.log("🎯 First coding problem:", firstProblem);

            if (firstProblem) {
              setCodingProblem(firstProblem);
              setChatMessages((prev) => [
                ...prev,
                {
                  sender: "AI",
                  text: `Your first coding problem is ready: "${firstProblem.title}". The Code Editor will open automatically.`,
                  time: new Date().toLocaleTimeString(),
                  stage: "coding",
                },
              ]);
              // The useEffect will auto-open the editor
            } else {
              console.error("❌ Failed to load coding problem");
              setError("Failed to load coding problem.");
            }
          }, 1500);
          return;
        }

        // No coding round - skip to final
        console.log("⏭️ Skipping coding round, moving to final");
        const msg = "That concludes our technical assessment. We will now move to the final round.";
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: msg,
            time: new Date().toLocaleTimeString(),
            stage: "technical",
          },
        ]);
        textToSpeech(msg);

        setTimeout(() => {
          setInterviewStage("final");
          startFinalRound();
        }, 2000);
        return;
      }

      // IMPORTANT: Only set loading state if we're actually going to make an AI call
      setIsLoadingAI(true);

      try {
        const systemInstruction = getStageSystemInstruction(interviewStage, role, companyType);

        const formattedHistory = formatHistoryForFireworks([
          ...chatMessages,
          userMsg,
        ]);

        // Append an initial empty AI placeholder message representing the active stream
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: "",
            time: new Date().toLocaleTimeString(),
            stage: interviewStage,
          },
        ]);

        let accumulatedReply = "";
        const aiReplyRaw = await fetchFireworksContent(
          formattedHistory,
          systemInstruction,
          (token) => {
            setIsLoadingAI(false); // Hide the loading indicator as soon as the first token is received
            accumulatedReply += token;
            // Update the last message in chatMessages with the accumulated text
            setChatMessages((prev) => {
              const updated = [...prev];
              if (updated.length > 0) {
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  text: accumulatedReply,
                };
              }
              return updated;
            });
          }
        );

        const aiReply = (aiReplyRaw || accumulatedReply || "").trim();
        if (!aiReply) {
          throw new Error("Empty AI response received");
        }

        // Finalize message with trimmed content
        setChatMessages((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              text: aiReply,
            };
          }
          return updated.filter((m) => m && m.text && m.text.trim().length > 0);
        });

        if (interviewStage === "technical") {
          setTechnicalQuestionCount(prev => prev + 1);
        }

        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentQuestionText(aiReply);

        textToSpeech(aiReply);

        // Run feedback generation completely in the background without blocking the AI reply and TTS!
        generateFeedbackForAnswer(messageToSend, lastAiQuestion)
          .then((feedback) => {
            setChatMessages((prev) => {
              const updated = [...prev];
              const idx = updated.map((m) => m.sender).lastIndexOf("User");
              if (idx !== -1) {
                updated[idx] = { ...updated[idx], feedback };
              }
              return updated;
            });
          })
          .catch((err) => console.error("Async feedback generation failed:", err));
      } catch (err) {
        console.error("AI Error:", err.message);
        setError("AI temporarily unavailable. Please try again.");
        // Safely strip any empty/failed AI messages from history
        setChatMessages((prev) => prev.filter((m) => m && m.text && m.text.trim().length > 0));
      } finally {
        setIsLoadingAI(false);
      }
    },
    [
      isLoadingAI,
      isSpeaking,
      chatMessages,
      interviewStage,
      formatHistoryForFireworks,
      fetchFireworksContent,
      generateFeedbackForAnswer,
      getNextCodingProblem,
      textToSpeech,
      hasCodingRound,
      selectedCodingQuestions,
      technicalQuestionCount,
      role,
      companyType,
    ]
  );

  // --- REAL-TIME STREAMING VOICE FUNCTIONS ---

  const playTTSChunk = useCallback(({ audio, text }) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioContextRef.current;

    // Decode the binary audio chunk received from the WebSocket
    ctx.decodeAudioData(audio, (buffer) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      // Schedule playback to be contiguous
      const currentTime = ctx.currentTime;
      if (nextAudioTimeRef.current < currentTime) {
        nextAudioTimeRef.current = currentTime;
      }

      const scheduledStart = nextAudioTimeRef.current;
      source.start(scheduledStart);
      nextAudioTimeRef.current += buffer.duration;

      // Schedule lip sync to begin exactly when audio plays
      const delayMs = Math.max(0, (scheduledStart - ctx.currentTime) * 1000);
      setTimeout(() => {
        setCurrentAiSpeech({ text, duration: buffer.duration });
      }, delayMs);

      // Debounced speech end: only the last audio chunk to finish triggers handleSpeechEnd
      source.onended = () => {
        if (lastTtsEndTimerRef.current) clearTimeout(lastTtsEndTimerRef.current);
        lastTtsEndTimerRef.current = setTimeout(() => {
          setCurrentAiSpeech(null);
          setIsSpeaking(false);
          setTimeout(() => startAudioStreaming(), 500);
        }, 300);
      };
    }, (err) => console.error("Error decoding audio chunk", err));
  }, []);

  const startAudioStreaming = useCallback(async () => {
    if (isStreamingAudioRef.current || isSpeaking) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && socket.connected) {
          socket.emit("audio_chunk", e.data);
        }
      };

      mediaRecorder.start(250); // Send chunk every 250ms
      isStreamingAudioRef.current = true;
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      setError("Microphone access required for the interview.");
    }
  }, [isSpeaking]);

  const handleSpeechEnd = useCallback(() => {
    setIsSpeaking(false);
    setCurrentAiSpeech(null);
    setTimeout(() => startAudioStreaming(), 500);
  }, [startAudioStreaming]);

  const stopAudioStreaming = useCallback(() => {
    if (mediaRecorderRef.current && isStreamingAudioRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      isStreamingAudioRef.current = false;
      setIsRecording(false);
    }
  }, []);

  // Set up socket listeners for the streaming pipeline
  useEffect(() => {
    const handleSttInterim = (text) => setInputValue(text);

    const handleSttFinal = (text) => {
      if (text.trim()) {
        lastUserSpeechRef.current = { text: text, at: Date.now() };
        setInputValue("");
        setChatMessages(prev => [...prev, {
          sender: "User",
          text: text,
          time: new Date().toLocaleTimeString(),
          stage: interviewStage,
        }]);
        stopAudioStreaming(); // Stop listening while AI thinks/speaks
      }
    };

    const handleLlmToken = (token) => {
      setCurrentQuestionText(prev => prev + token);
    };

    const handleLlmComplete = (fullText) => {
      if (fullText && typeof fullText === "string" && fullText.trim()) {
        setChatMessages(prev => {
          const cleaned = prev.filter(m => m && m.text && m.text.trim().length > 0);
          return [...cleaned, {
            sender: "AI",
            text: fullText.trim(),
            time: new Date().toLocaleTimeString(),
            stage: interviewStage,
          }];
        });
      }
    };

    const handleLlmError = (err) => {
      console.warn("Socket LLM error received:", err);
      setIsLoadingAI(false);
      setIsSpeaking(false);
      setError("AI generation failed. Please try speaking again.");
      setChatMessages(prev => prev.filter(m => m && m.text && m.text.trim().length > 0));
    };

    const handleTtsAudioChunk = (data) => {
      // data is { audio: Buffer, text: string } from backend
      playTTSChunk({ audio: data.audio, text: data.text });
    };

    socket.on("stt_interim", handleSttInterim);
    socket.on("stt_final", handleSttFinal);
    socket.on("llm_token", handleLlmToken);
    socket.on("llm_complete", handleLlmComplete);
    socket.on("llm_error", handleLlmError);
    socket.on("tts_audio_chunk", handleTtsAudioChunk);

    return () => {
      socket.off("stt_interim", handleSttInterim);
      socket.off("stt_final", handleSttFinal);
      socket.off("llm_token", handleLlmToken);
      socket.off("llm_complete", handleLlmComplete);
      socket.off("llm_error", handleLlmError);
      socket.off("tts_audio_chunk", handleTtsAudioChunk);
    };
  }, [interviewStage, playTTSChunk, stopAudioStreaming]);

  // Synchronize full interview context with backend VoicePipeline for voice/typed reasoning parity
  useEffect(() => {
    if (socket.connected && chatMessages.length > 0) {
      const currentInstruction = getStageSystemInstruction(interviewStage, role, companyType);
      socket.emit("set_interview_context", {
        role,
        companyType,
        stage: interviewStage,
        chatMessages,
        systemInstruction: currentInstruction,
      });
    }
  }, [chatMessages, interviewStage, role, companyType]);

  // --- END REAL-TIME STREAMING VOICE FUNCTIONS ---

  const startSpeechRecognition = useCallback(() => {
    if (isLoadingAI || isSpeaking) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech Recognition not supported in this browser.");
      return;
    }

    // Stop real-time audio socket stream to release microphone device lock
    stopAudioStreaming();

    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }

    const speechBufferRefLocal = speechBufferRef;
    speechBufferRefLocal.current = "";

    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
    };

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(result => result[0].transcript)
        .join("");

      speechBufferRefLocal.current = transcript;
      setInputValue(transcript);

      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
        autoSendTimerRef.current = null;
      }
    };

    recognition.onerror = (e) => {
      console.error("Speech Recognition Error:", e);
      if (e.error !== "no-speech") {
        setError("Error in speech recognition: " + e.error);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;

      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
      }

      autoSendTimerRef.current = setTimeout(() => {
        const finalText = speechBufferRefLocal.current.trim();

        if (finalText) {
          handleSendMessage(finalText);
          speechBufferRefLocal.current = "";
        }
      }, 3000);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Recognition start failed:", e);
      setIsRecording(false);
    }
  }, [isLoadingAI, isSpeaking, isRecording, handleSendMessage, stopAudioStreaming]);

  useEffect(() => {
    if (isPreview) return;

    const sessionId = location.state?.sessionId;
    if (!sessionId) return;

    const timeoutId = setTimeout(async () => {
      try {
        const validMessages = chatMessages.filter(
          (m) => m && typeof m.text === "string" && m.text.trim().length > 0
        );
        await mainApi.patch(`/interview-session/complete/${sessionId}`, {
          messages: validMessages,
          solvedProblems: solvedProblemsRef.current,
          highlightClips: Object.values(highlightBufferRef.current),
        });
      } catch (error) {
        console.warn("⚠️ Failed to sync interview progress:", error);
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [chatMessages, solvedProblems, isPreview, location.state?.sessionId]);

  const handleEndInterview = useCallback(async () => {
    if (isLoadingAI || isSpeaking) return;

    // Show the modal immediately
    setShowEndInterviewModal(true);
    setUploadStatus("Analyzing the Interview...");

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const validMessages = chatMessages.filter(
      (m) => m && typeof m.text === "string" && m.text.trim().length > 0
    );

    const reportText = generateReportContent(validMessages, companyType, role);
    const sanitizedRole = role.replace(/[^a-zA-Z0-9]/g, "_");
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
    const filename = `${sanitizedRole}_Report_${timestamp}.pdf`;

    setIsLoadingAI(true);

    const sessionId = location.state?.sessionId;

    try {
      setUploadStatus("Generating your performance report...");

      const response = await mainApi.post(BACKEND_UPLOAD_URL, {
        filename,
        content: reportText,
        role,
        companyType,
        solvedProblems,
        sessionId,
      });

      const data = response.data;

      console.log("✅ Uploaded Report URL:", data.publicUrl);

      setUploadStatus("Saving your interview session...");

      if (sessionId) {
        await mainApi.patch(
          `/interview-session/complete/${sessionId}`,
          {
            reportUrl: data.publicUrl,
            messages: validMessages,
            solvedProblems: solvedProblemsRef.current,
            highlightClips: Object.values(highlightBufferRef.current),
            status: "completed",
          }
        );

        console.log("✅ Interview session updated with messages and solved problems");
      } else {
        console.warn("⚠️ No sessionId found. Interview not linked in DB.");
      }

      localStorage.setItem(
        "interviewReport",
        JSON.stringify({
          role,
          companyType,
          reportUrl: data.publicUrl,
          timestamp: new Date().toISOString(),
        })
      );

      setUploadStatus("✅ Report saved! Preparing summary...");

      // ✅ NEW: Generate AI Report asynchronously (non-blocking)
      if (sessionId) {
        try {
          const reportRes = await mainApi.post(`/interview-session/${sessionId}/report`);
          if (reportRes.status === 200 || reportRes.data?.success) {
            console.log("✅ AI Report generated successfully");
          } else {
            console.warn("⚠️ AI Report generation failed:", reportRes.data);
          }
        } catch (err) {
          console.error("⚠️ AI Report generation error:", err);
          // Don't block interview completion if report generation fails
        }
      }

      // Wait a bit to show success state
      setTimeout(() => {
        setIsLoadingAI(false);
        setShowEndInterviewModal(false);
        navigate("/dashboard/interview-analysis", { replace: true });
      }, 2500);
    } catch (err) {
      console.error("❌ Interview completion failed:", err);
      setUploadStatus(`❌ Report upload failed: ${err.message}`);
      setIsLoadingAI(false);

      // Keep modal open on error so user can see what went wrong
      setTimeout(() => {
        setShowEndInterviewModal(false);
      }, 3000);
    }
  }, [
    chatMessages,
    solvedProblems,
    companyType,
    role,
    isLoadingAI,
    isSpeaking,
    navigate,
    location,
  ]);

  const identityVerification = useInterviewIdentityVerification({
    videoRef: userVideoRef,
    sessionId: location.state?.sessionId,
    enabled: cameraAllowed && !isPreview && !isIdentityTerminated,
    onWarning: ({ message, terminated }) => {
      textToSpeech(message);
      if (terminated) setIsIdentityTerminated(true);
    },
    onTerminated: ({ reason }) => {
      setIsIdentityTerminated(true);
    },
  });
  const { verifyIdentity } = identityVerification;

  useEffect(() => {
    if (cameraAllowed && !isPreview && typeof verifyIdentity === "function") {
      verifyIdentity("round_start");
    }
  }, [cameraAllowed, interviewStage, isPreview, verifyIdentity]);

  useEffect(() => {
    if (isPreview) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            // ✅ Balanced resolution - good quality without overloading GPU
            width: { ideal: 480 },
            height: { ideal: 360 },
            frameRate: { ideal: 30, max: 30 },
            facingMode: "user"
          },
          audio: true,
        });

        window.currentMediaStream = stream;

        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
          const settings = stream.getVideoTracks()[0].getSettings();
          console.log("📹 Video initialized:", `${settings.width}x${settings.height} @ ${settings.frameRate}fps`);
        }
        setCameraAllowed(true);
      } catch (err) {
        setError("Camera/Mic access denied.");
      }
    };

    startCamera();
  }, [isPreview]);

  useEffect(() => {
    if (cameraAllowed && companyType && role && !greeted) {
      const startAiConversation = async () => {
        try {
          const selectionMode = location.state?.selectionMode || "all";
          const targetRoundName = location.state?.targetRoundName || null;

          let greetingPrompt = "";
          let initialText = "Start the interview.";

          if (selectionMode === "specific" && targetRoundName) {
            const mappedStage = mapRoundToStage(targetRoundName);
            if (mappedStage === "coding") {
              greetingPrompt = `
You are Sira, a professional AI interviewer conducting the CODING round for a ${role} position at a ${companyType}.
Welcome the candidate specifically to the Coding Round. Explain that they will be solving coding challenges in the editor, and introduce their first problem.
Keep it encouraging and brief.
`;
              initialText = "Start the coding round.";
            } else if (mappedStage === "technical") {
              greetingPrompt = `
You are Sira, a professional AI interviewer conducting the TECHNICAL DEEP-DIVE round for a ${role} position at a ${companyType}.
Welcome the candidate specifically to the Technical Deep-Dive round. Ask the first deep technical question.
Keep it professional, calm, and senior-interviewer tone.
`;
              initialText = "Start the technical round.";
            } else if (mappedStage === "transition") {
              greetingPrompt = `
You are Sira, a professional AI interviewer conducting the PRE-TECHNICAL round for a ${role} position at a ${companyType}.
Welcome the candidate specifically to the Pre-Technical/Foundational round. Ask the first pre-technical question.
`;
              initialText = "Start the pre-technical round.";
            } else if (mappedStage === "final") {
              greetingPrompt = `
You are Sira, a professional AI interviewer conducting the FINAL DISCUSSION round for a ${role} position at a ${companyType}.
Welcome the candidate specifically to the Final Discussion round to discuss logistics, salary, work mode, etc. Ask the first question about notice period or salary expectations.
`;
              initialText = "Start the final discussion.";
            } else {
              greetingPrompt = `
You are Sira, a professional AI interviewer for ${companyType}.
Welcome the candidate to the Introduction round. Ask them to introduce themselves and tell you about their professional background.
`;
              initialText = "Start the interview introduction.";
            }
          } else {
            greetingPrompt = `
You are Sira, a professional AI interviewer for ${companyType}.

Your EXACT opening greeting (be warm and welcoming, NOT robotic):
"Hi! I'm Sira, your AI interviewer for the ${role} position at ${companyType}. Let's get started. Can you tell me about yourself and your professional background?"

Key points:
- Be conversational and genuinely interested, not scripted
- Welcome their questions at any time
- Set a relaxed, professional tone
- Make the opening question open-ended to let them talk freely
`;
            initialText = "Start the interview introduction.";
          }

          setIsLoadingAI(true);
          setChatMessages([]);

          const mappedStage = (selectionMode === "specific" && targetRoundName)
            ? mapRoundToStage(targetRoundName)
            : getInitialStage();

          let aiQ = "";
          if (mappedStage === "coding") {
            aiQ = "Welcome to the Coding Round! The code editor with your first problem is open. Please write your code, think out loud, and run the test cases when you are ready. Good luck!";
          } else {
            const initialMessages = [
              { role: "user", content: initialText },
            ];
            aiQ = await fetchFireworksContent(initialMessages, greetingPrompt);
          }

          const firstMsg = {
            sender: "AI",
            text: aiQ,
            time: new Date().toLocaleTimeString(),
            stage: mappedStage,
          };
          setChatMessages([firstMsg]);
          setCurrentQuestionIndex(1);
          setCurrentQuestionText(aiQ);
          setGreeted(true);
          await textToSpeech(aiQ);
        } catch (error) {
          console.error("Error sending initial greeting:", error);
          setError(error.message || "Failed to start AI conversation");
          const fallbackGreeting = `Hi! I'm Sira, your AI interviewer for the ${role} position at ${companyType}. Let's get started. Can you tell me about yourself and your professional background?`;
          setChatMessages([{
            sender: "AI",
            text: fallbackGreeting,
            time: new Date().toLocaleTimeString(),
            stage: "intro",
          }]);
          setCurrentQuestionIndex(1);
          setCurrentQuestionText(fallbackGreeting);
          setGreeted(true);
          textToSpeech(fallbackGreeting);
        } finally {
          setIsLoadingAI(false);
        }
      };
      startAiConversation();
    }
  }, [cameraAllowed, companyType, role, greeted, fetchFireworksContent, textToSpeech, location]);

  if (!cameraAllowed && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-[#1A1A1A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Requesting camera and microphone permission...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] p-4 md:p-6 font-sans overflow-x-hidden relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-50">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-t from-pink-50 to-transparent rounded-full blur-[120px] opacity-60" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-[1800px] mx-auto bg-white/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 lg:p-10 border border-white/60 shadow-2xl shadow-gray-200/50 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900">
              {companyType} - {role}
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Live AI-powered mock interview</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEndInterview}
            className="flex items-center gap-2 bg-[#1A1A1A] text-white px-6 py-3 rounded-full font-bold hover:bg-gray-900 transition-colors shadow-lg"
          >
            <PhoneOff size={20} />
            End Interview
          </motion.button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Video & Controls */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Container */}
            <motion.div variants={itemUpVariants} className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-xl border border-gray-800">
              {/* Stage Badge */}
              <div className="absolute top-6 right-6 z-20 bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Current Round</span>
                  <span className="text-sm font-bold text-white tracking-wide">
                    {{
                      intro: "Introduction",
                      transition: "Pre-Technical",
                      technical: "Technical Deep-Dive",
                      coding: "Coding Challenge",
                      final: "Final Discussion"
                    }[interviewStage] || "Interview"}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#D4F478]/20 flex items-center justify-center border border-[#D4F478]/30">
                  <Briefcase size={18} className="text-[#D4F478]" />
                </div>
              </div>

              {isPreview ? (
                <div className="w-full h-[500px] bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                  <p className="text-gray-400">Video disabled in preview</p>
                </div>
              ) : (
                <video
                  ref={userVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-[480px] object-cover"
                  style={{
                    transform: 'scaleX(-1) translateZ(0)',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    imageRendering: 'auto',
                  }}
                />
              )}

              {/* Identity Verification Status Badge */}
              {identityVerification.status === "VERIFIED" && (
                <div className="absolute top-6 left-6 z-20 bg-black/60 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-2xl flex items-center gap-2.5 shadow-lg">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    User verified ✓
                  </div>
                </div>
              )}

              {/* Identity Warning Banner */}
              {(identityVerification.status === "WARNING" || identityVerification.status === "CAMERA_ERROR") && (
                <div className="absolute top-6 left-6 z-20 bg-black/80 backdrop-blur-md border border-amber-500/40 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-xl animate-pulse">
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-amber-300">
                      {identityVerification.status === "CAMERA_ERROR"
                        ? "🔴 Camera Disconnected"
                        : `🟠 Identity Check Warning ${identityVerification.warningCount}/3`}
                    </div>
                    <div className="text-[11px] text-gray-200 font-medium mt-0.5">
                      {identityVerification.warningMessage || "Keep your face visible in camera"}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Speaking Indicator */}
              {isSpeaking && (
                <div className="absolute top-20 left-6 bg-gradient-to-r from-[#D4F478]/20 to-emerald-500/20 backdrop-blur-lg text-white px-4 py-2 rounded-full text-sm font-medium border border-[#D4F478]/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#D4F478] rounded-full animate-pulse"></div>
                    Sira is speaking…
                  </div>
                </div>
              )}

              {/* Control Bar */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                {/* Mic Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startSpeechRecognition}
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl ${isRecording
                    ? "bg-gradient-to-br from-red-500 to-rose-600 text-white"
                    : "bg-gradient-to-br from-white to-gray-100 text-gray-900"
                    }`}
                >
                  <Mic size={22} />
                </motion.button>

                {/* Chat Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsChatOpen(true)}
                  className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-white to-gray-100 text-gray-900 shadow-2xl"
                >
                  <MessageSquare size={22} />
                </motion.button>

                {/* Code Editor Button */}
                {(!isPreview || (solvedProblems && solvedProblems.length > 0)) && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCodeEditorOpen(true)}
                    className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-white to-gray-100 text-gray-900 shadow-2xl"
                  >
                    <Code size={22} />
                  </motion.button>
                )}

                {/* Solved Problems Button */}
                {solvedProblems.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSolvedProblems(true)}
                    className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-white to-gray-100 text-gray-900 shadow-2xl relative group"
                    title="View Solved Problems"
                  >
                    <ListChecks size={22} className="text-[#D4F478]" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4F478] text-black text-xs font-bold rounded-full flex items-center justify-center">
                      {getSolvedProblemCount(solvedProblems)}
                    </span>
                  </motion.button>
                )}
              </div>
            </motion.div>

          </div>

          {/* Right Column: AI Model & Chat */}
          <div className="space-y-8">
            {/* AI Model Container */}
            <motion.div variants={itemUpVariants} className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-2xl border border-gray-800 h-56">
              <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.3} />
                <Environment preset="sunset" />
                <DynamicModel
                  speechData={currentAiSpeech}
                />
              </Canvas>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 
                bg-gradient-to-r from-[#D4F478]/20 to-emerald-500/20 
                backdrop-blur-lg text-white px-7 py-2 rounded-full 
                text-sm font-medium border border-[#D4F478]/30">
                <span className="font-bold">Ms. Sira</span>
                <span className="text-[#D4F478] ml-2">• AI Interviewer</span>
              </div>

            </motion.div>

            {/* Chat Container */}
            <motion.div variants={itemUpVariants} whileHover={hoverCardEffect} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-lg h-[340px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Conversation</h3>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                {chatMessages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === "User" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.sender === "User"
                        ? "bg-gradient-to-r from-[#1A1A1A] to-gray-900 text-white rounded-br-none"
                        : "bg-gradient-to-r from-gray-100 to-white border border-gray-200 text-gray-900 rounded-bl-none"
                        }`}
                    >
                      <div className="text-sm font-medium mb-1">
                        {msg.sender === "User" ? "You" : "Sira"}
                      </div>
                      <p className="text-sm">{msg.text}</p>
                      <div className="text-xs text-gray-500 mt-2">{msg.time}</div>

                      {msg.sender === "User" && msg.feedback && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="text-xs font-bold text-[#D4F478] mb-1">Feedback</div>
                          <div className="text-xs text-gray-300">{msg.feedback.suggestion}</div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isLoadingAI && (
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-r from-gray-100 to-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#D4F478] rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-[#D4F478] rounded-full animate-pulse delay-150"></div>
                        <div className="w-2 h-2 bg-[#D4F478] rounded-full animate-pulse delay-300"></div>
                        <span className="text-sm text-gray-600 ml-2">Sira is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (autoSendTimerRef.current) {
                        clearTimeout(autoSendTimerRef.current);
                        autoSendTimerRef.current = null;
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && inputValue.trim()) {
                        handleSendMessage(inputValue);
                      }
                    }}
                    placeholder="Type your answer here..."
                    className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4F478] focus:border-transparent"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={!inputValue.trim() || isLoadingAI || isSpeaking}
                    className="px-5 py-3 bg-gradient-to-r from-[#1A1A1A] to-gray-900 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </motion.button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Press Enter to send • Click mic icon for voice input
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-rose-600">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Modals */}
      {isCodeEditorOpen && (
        <CodeEditorModal
          isOpen={isCodeEditorOpen}
          onClose={() => setIsCodeEditorOpen(false)}
          problems={
            isPreview
              ? solvedProblems.map((sp) => ({
                ...sp.problem,
                userCode: sp.userCode,
                testResults: sp.testResults,
                skipped: sp.skipped,
              }))
              : selectedCodingQuestions
          }
          isPreviewMode={isPreview}
          onFinishRound={(results) => {
            setSolvedProblems(results);
            solvedProblemsRef.current = results;
            setIsCodeEditorOpen(false);

            const selectionMode = location.state?.selectionMode || "all";
            const isSingleRoundMode = selectionMode === "specific";

            if (isSingleRoundMode) {
              const msg = "Thank you. That concludes the coding round. I'll now complete the session and prepare your feedback report.";
              setChatMessages((msgs) => [
                ...msgs,
                {
                  sender: "AI",
                  text: msg,
                  time: new Date().toLocaleTimeString(),
                  stage: "coding",
                },
              ]);
              textToSpeech(msg);
              setTimeout(() => {
                handleEndInterview();
              }, 2000);
            } else {
              const msg = "Great work! That concludes the coding round. We will now move to the next round.";
              setChatMessages((msgs) => [
                ...msgs,
                {
                  sender: "AI",
                  text: msg,
                  time: new Date().toLocaleTimeString(),
                  stage: "post-coding",
                },
              ]);

              textToSpeech(msg);
              setInterviewStage("final");
              setTimeout(() => {
                startFinalRound();
              }, 800);
            }
          }}
        />
      )}

      {showSolvedProblems && (
        <SolvedProblemsModal
          isOpen={showSolvedProblems}
          onClose={() => setShowSolvedProblems(false)}
          problems={solvedProblems}
        />
      )}
      <UpgradeModal
        isOpen={showUpgradeModal}
        featureName="Code Editor"
        onClose={() => {
          setShowUpgradeModal(false);
          // If we are in coding stage and blocked, skip it
          if (interviewStage === "coding") {
            setInterviewStage("final");
          }
        }}
      />
      <EndInterviewReportModal
        isOpen={showEndInterviewModal}
        onClose={() => {
          setShowEndInterviewModal(false);
          navigate("/dashboard/interview-analysis", { replace: true });
        }}
        isUploading={isLoadingAI}
        uploadStatus={uploadStatus}
      />

      {/* Identity Verification Failed Termination Modal */}
      {(identityVerification.terminated || isIdentityTerminated) && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-red-100 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 shadow-inner">
              <AlertCircle size={36} />
            </div>
            <h2 className="text-2xl font-black text-gray-900">🔴 Interview Ended</h2>
            <p className="text-sm font-bold text-red-700 mt-2">Identity verification failed.</p>
            <p className="text-xs text-gray-600 mt-2">
              The enrolled user could not be continuously verified during the session.
            </p>
            <div className="mt-4 p-3.5 bg-red-50 rounded-2xl border border-red-200 text-xs font-semibold text-red-800">
              Reason: {identityVerification.terminationReason || identityVerification.warningMessage || "User could not be verified."}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Your interview has been ended for security and proctoring integrity reasons.
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
    </div>
  );
};

export default InterviewScreen;
