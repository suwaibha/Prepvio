import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext } from "react-router-dom";
import MobileDashboardHeader from "../components/MobileDashboardHeader";
import MobileRestrictionModal from "../components/MobileRestrictionModal"; // ✅ ADD THIS
import { mainApi } from "../utils/apiClient";

import {
  Brain,
  Calendar,
  Clock,
  Target,
  List,
  Activity,
  X,
  Trash2,
  ExternalLink,
  Sparkles,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Trophy,
  Zap,
  Users,
  AlertCircle,
  ChevronLeft,
  ArrowRight,
  Flag,
  ShieldCheck
} from 'lucide-react';

// --- HELPER FUNCTIONS ---
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDuration = (seconds) => {
  if (!seconds) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

// --- COMPONENTS ---

const ConfirmDeleteModal = ({ open, onCancel, onConfirm, loading }) => {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-md p-8 border-2 border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-2xl font-black text-gray-900 mb-3">Delete Test?</h3>
        <p className="text-sm text-gray-600 mb-8 leading-relaxed">
          This action cannot be undone. The test and all its data will be permanently deleted.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- CODE BLOCK DETECTION & FORMATTING ---
const CODE_SIGNATURES = [
  /\bdef\s+\w+\s*\(/, /\bclass\s+\w+.*:/, /\bfunction\s+\w+\s*\(/,
  /\bconsole\.log\s*\(/, /\bSystem\.out\.print/, /\bprintf\s*\(/,
  /\bcout\s*<</, /#include/, /\bpublic\s+static/,
  /\bint\s+main\s*\(/, /\bvoid\s+\w+\s*\(/,
];

const hasCodeContent = (text) =>
  text ? CODE_SIGNATURES.some((p) => p.test(text)) : false;

const extractCodeFromQuestion = (text) => {
  // Extract up to punctuation following a code keyword
  const bm = text.match(
    /^(.*?(?:code|snippet|program|output|block|following|below)[\s]*[\?\:\.]+[\s]*)/i
  );
  if (bm) {
    const c = text.slice(bm[0].length).trim();
    if (c && hasCodeContent(c)) return { prompt: bm[1].trim(), code: c };
  }
  const qm = text.match(/^(.*?\?)\s*/);
  if (qm) {
    const c = text.slice(qm[0].length).trim();
    if (c && hasCodeContent(c)) return { prompt: qm[1].trim(), code: c };
  }
  const i = text.search(/(?:\b(?:def|class|function|public\s+static|int\s+main|void\s+\w+|cout\s*<<)\b|#include)/);
  if (i > 0) return { prompt: text.slice(0, i).trim(), code: text.slice(i).trim() };
  if (hasCodeContent(text)) return { prompt: "", code: text };
  return null;
};

const formatCStyleCode = (code) => {
  if (!code) return '';
  const SP = '    ';
  let s = code.replace(/\s+/g, ' ').trim();

  let raw = '';
  let inStr = false, strCh = '', parenD = 0;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];

    if (!inStr && (c === '"' || c === "'")) {
      inStr = true; strCh = c; raw += c; continue;
    }
    if (inStr) {
      raw += c;
      if (c === strCh && (i === 0 || s[i - 1] !== '\\')) inStr = false;
      continue;
    }

    if (c === '(') { parenD++; raw += c; continue; }
    if (c === ')') { parenD = Math.max(0, parenD - 1); raw += c; continue; }

    if (c === '#') {
      const rest = s.slice(i);
      const m = rest.match(/^(#\s*include\s*[<"][^>"]+[>"])/);
      if (m) {
        if (raw.trim()) raw += '\n';
        raw += m[1] + '\n';
        i += m[1].length - 1;
        continue;
      }
    }

    if (c === '{') {
      raw = raw.trimEnd() + ' {\n';
      while (i + 1 < s.length && /\s/.test(s[i + 1])) i++;
      continue;
    }

    if (c === '}') {
      raw = raw.trimEnd();
      if (raw && !raw.endsWith('\n')) raw += '\n';
      let suffix = '}';
      let j = i + 1;
      while (j < s.length && s[j] === ' ') j++;
      if (j < s.length && s[j] === ';') { suffix = '};'; i = j; }
      raw += suffix + '\n';
      while (i + 1 < s.length && /\s/.test(s[i + 1])) i++;
      continue;
    }

    if (c === ';' && parenD === 0) {
      raw += ';\n';
      while (i + 1 < s.length && /\s/.test(s[i + 1])) i++;
      continue;
    }

    raw += c;
  }

  let rawLines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  let expanded = [];

  for (const line of rawLines) {
    const accM = line.match(/^(public|private|protected)\s*:\s*(.+)$/);
    if (accM) {
      expanded.push(accM[1] + ':');
      if (accM[2].trim()) expanded.push(accM[2].trim());
      continue;
    }
    const accM2 = line.match(/^(.+?)\s+(public|private|protected)\s*:\s*(.*)$/);
    if (accM2) {
      if (accM2[1].trim()) expanded.push(accM2[1].trim());
      expanded.push(accM2[2] + ':');
      if (accM2[3].trim()) expanded.push(accM2[3].trim());
      continue;
    }
    const eiM = line.match(/^(else\s+if\s*\([^)]*\))\s+(?!\{)(.+)$/);
    if (eiM) { expanded.push(eiM[1]); expanded.push(eiM[2]); continue; }
    const elM = line.match(/^(else)\s+(.+)$/);
    if (elM && !elM[2].startsWith('if') && !elM[2].startsWith('{')) {
      expanded.push('else'); expanded.push(elM[2]); continue;
    }
    const ifM = line.match(/^(if\s*\([^)]*\))\s+(?!\{)(.+)$/);
    if (ifM) { expanded.push(ifM[1]); expanded.push(ifM[2]); continue; }
    const forM = line.match(/^(for\s*\([^)]*\))\s+(?!\{)(.+)$/);
    if (forM) { expanded.push(forM[1]); expanded.push(forM[2]); continue; }
    const whM = line.match(/^(while\s*\([^)]*\))\s+(?!\{)(.+)$/);
    if (whM) { expanded.push(whM[1]); expanded.push(whM[2]); continue; }

    expanded.push(line);
  }

  let indent = 0;
  let lines = [];
  let pendingIndent = false;

  for (const ln of expanded) {
    const t = ln.trim();
    if (!t) continue;

    if (/^\}/.test(t)) {
      indent = Math.max(0, indent - 1);
      pendingIndent = false;
    }

    if (/^(public|private|protected):$/.test(t)) {
      lines.push(SP.repeat(Math.max(0, indent - 1)) + t);
    } else {
      let li = indent;
      if (pendingIndent) { li++; pendingIndent = false; }
      lines.push(SP.repeat(li) + t);
    }

    if (t.endsWith('{')) indent++;

    if (/^(if\s*\(|else\s+if\s*\(|for\s*\(|while\s*\()/.test(t) && !t.endsWith('{')) {
      pendingIndent = true;
    } else if (t === 'else') {
      pendingIndent = true;
    }
  }

  return lines.join('\n');
};

const autoFormatCode = (code) => {
  if (!code) return "";
  if ((code.match(/\n/g) || []).length > 1) return code;
  if (code.includes("\n")) return code;

  const hasBraces = /\{/.test(code) && /\}/.test(code);
  const hasSemicolons = (code.match(/;/g) || []).length >= 2;
  if (hasBraces && hasSemicolons) return formatCStyleCode(code);

  const lines = [];
  let rest = code.trim();
  let ind = 0;
  let guard = 0;
  const SP = "    ";

  const STMT = [
    [/^(def\s+\w+\s*\([^)]*\)\s*:)/, 0, 1],
    [/^(class\s+\w+[^:]*:)/, 0, 1],
    [/^(elif\s+.+?:)(?=\s|$)/, "d", null],
    [/^(else\s*:)/, "d", null],
    [/^(return\b.+?)(?=\s+(?:def\s|class\s|import\s|from\s|print\s*\(|\w+\s*=\s)|$)/, null, 0],
    [/^(for\s+.+?:)(?=\s|$)/, null, "+"],
    [/^(while\s+.+?:)(?=\s|$)/, null, "+"],
    [/^(if\s+.+?:)(?=\s|$)/, null, "+"],
    [/^(print\s*\((?:[^()]*|\([^()]*\))*\))/, null, null],
    [/^(import\s+\S+)/, 0, 0],
    [/^(from\s+\S+\s+import\s+.+?)(?=\s+(?:def\s|class\s|import\s|from\s|print\s*\(|\w+\s*=)|$)/, 0, 0],
    [/^(function\s+\w+\s*\([^)]*\)\s*\{?)/, 0, 1],
    [/^((?:const|let|var)\s+.+?)(?=\s+(?:function|const|let|var|console\.|return|if|for|while)\s|$)/, null, null],
    [/^(console\.log\s*\((?:[^()]*|\([^()]*\))*\)\s*;?)/, null, null],
    [/^(System\.out\.print(?:ln)?\s*\([^)]*\)\s*;?)/, null, null],
    [/^(printf\s*\([^)]*\)\s*;?)/, null, null],
    [/^(\w+\s*=\s*.+?)(?=\s+(?:def\s|class\s|import\s|from\s|print\s*\(|return\s|if\s|for\s|while\s|elif\s|else:|function\s|const\s|let\s|var\s|console\.|System\.|printf\s*\(|\w+\s*=\s)|$)/, 0, 0],
  ];

  while (rest.length > 0 && guard++ < 100) {
    rest = rest.replace(/^\s+/, "");
    if (!rest) break;
    let hit = false;
    for (const [re, indOv, nxt] of STMT) {
      const m = rest.match(re);
      if (m) {
        const ci = indOv === "d" ? Math.max(0, ind - 1) : indOv !== null ? indOv : ind;
        lines.push(SP.repeat(ci) + m[1].trim());
        rest = rest.slice(m[0].length);
        if (nxt !== null) ind = nxt === "+" ? ci + 1 : nxt;
        hit = true;
        break;
      }
    }
    if (!hit) {
      const nx = rest.search(
        /\s+(?:def |class |function |import |from |return |print\s*\(|for |while |if |elif |else:|const |let |var |console\.|System\.|printf\()/
      );
      if (nx > 0) {
        lines.push(SP.repeat(ind) + rest.slice(0, nx).trim());
        rest = rest.slice(nx);
      } else {
        lines.push(SP.repeat(ind) + rest.trim());
        rest = "";
      }
    }
  }
  return lines.join("\n");
};

const renderQuestion = (text) => {
  if (!text) return null;

  const mdm = text.match(/```(\w*)\n?([\s\S]*?)```/);
  if (mdm) {
    const before = text.slice(0, mdm.index).trim();
    const code = mdm[2].trim();
    const after = text.slice(mdm.index + mdm[0].length).trim();
    return (
      <>
        {before && <span>{before}</span>}
        <pre className="bg-[#1e1e2e] text-[#cdd6f4] rounded-2xl p-5 mt-4 overflow-x-auto text-sm font-mono font-normal leading-relaxed border border-[#313244]">
          <code>{code}</code>
        </pre>
        {after && <span className="block mt-3">{after}</span>}
      </>
    );
  }

  if (!hasCodeContent(text)) return text;

  const parts = extractCodeFromQuestion(text);
  if (!parts) return text;

  const formatted = autoFormatCode(parts.code);

  return (
    <>
      {parts.prompt && <span>{parts.prompt}</span>}
      <pre className="bg-[#1e1e2e] text-[#cdd6f4] rounded-2xl p-5 mt-4 overflow-x-auto text-sm font-mono font-normal leading-relaxed border border-[#313244]">
        <code>{formatted}</code>
      </pre>
    </>
  );
};

const ReviewMode = ({ test, onClose, questions }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);

  if (!questions || questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-[#FDFBF9] overflow-auto z-50">
        <div className="min-h-screen p-4 md:p-10 flex flex-col items-center">
          <div className="w-full max-w-7xl">
            <header className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex justify-between items-center shadow-sm mb-6">
              <div className="flex items-center gap-4">
                <Brain className="w-8 h-8 p-1.5 bg-black text-[#D4F478] rounded-xl" />
                <div>
                  <h2 className="font-black text-xl">Review Mode</h2>
                  <p className="text-xs text-gray-500 font-medium">{test.topic}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="bg-[#D4F478] text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#cbf060] transition-colors"
              >
                Back to Analysis
              </motion.button>
            </header>

            <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm text-center">
              <AlertCircle className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
              <h3 className="text-3xl font-black text-gray-900 mb-3">Questions Not Available</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                The detailed questions for this test are not available for review.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const userAnswer = test.answers[currentQuestion]?.selectedIndex;
  const correctAnswerIndex = test.answers[currentQuestion]?.correctIndex;
  const isCorrect = userAnswer === correctAnswerIndex;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy": return "bg-green-50 border-green-200 text-green-700";
      case "medium": return "bg-orange-50 border-orange-200 text-orange-700";
      case "hard": return "bg-red-50 border-red-200 text-red-700";
      default: return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  return (
    <div className="fixed inset-0 bg-[#FDFBF9] overflow-auto z-50">
      <div className="min-h-screen p-4 md:p-10 flex flex-col items-center">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-6">
            {/* Header */}
            <header className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-4">
                <Brain className="w-8 h-8 p-1.5 bg-black text-[#D4F478] rounded-xl" />
                <div>
                  <h2 className="font-black text-xl">Review Mode</h2>
                  <p className="text-xs text-gray-500 font-medium">{test.topic}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="bg-[#D4F478] text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#cbf060] transition-colors"
              >
                Back to Analysis
              </motion.button>
            </header>

            {/* Question Card */}
            <main className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty || "Medium"}
                </span>
              </div>

              <div className="text-lg md:text-xl font-semibold text-gray-900 mb-8 leading-tight">
                {renderQuestion(question.question)}
              </div>

              {/* Answer Status */}
              <div className={`p-4 rounded-2xl mb-8 ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                <div className="flex items-center gap-3">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <span className="font-bold text-green-700">Correct Answer!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-600" />
                      <span className="font-bold text-red-700">Incorrect Answer</span>
                    </>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="grid gap-4 mb-10">
                {question.options.map((opt, i) => {
                  const isUserAnswer = userAnswer === i;
                  const isCorrectAnswer = correctAnswerIndex === i;

                  return (
                    <div
                      key={i}
                      className={`p-6 rounded-2xl border-2 text-left font-bold transition-all ${isCorrectAnswer
                        ? "bg-green-50 border-green-300 text-green-900"
                        : isUserAnswer
                          ? "bg-red-50 border-red-300 text-red-900"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{String.fromCharCode(65 + i)}. {opt.text}</span>
                        {isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        {isUserAnswer && !isCorrectAnswer && <XCircle className="w-5 h-5 text-red-600" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {question.explanation && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-10">
                  <p className="text-xs font-black text-blue-600 uppercase tracking-wider mb-2">Explanation</p>
                  <p className="text-gray-700 leading-relaxed">{question.explanation}</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center pt-8 border-t border-gray-100">
                <button
                  onClick={() => currentQuestion > 0 && setCurrentQuestion(c => c - 1)}
                  disabled={currentQuestion === 0}
                  className="text-gray-400 font-bold flex items-center gap-2 hover:text-gray-900 transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5" /> Previous
                </button>
                <button
                  onClick={() => currentQuestion < questions.length - 1 && setCurrentQuestion(c => c + 1)}
                  disabled={currentQuestion === questions.length - 1}
                  className="bg-black text-white px-8 py-4 rounded-2xl font-black hover:bg-gray-900 transition-colors disabled:opacity-30 flex items-center gap-2"
                >
                  Next <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </main>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* User Card */}
            <div className="bg-[#1A1A1A] rounded-[3rem] p-8 relative overflow-hidden text-center shadow-2xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4F478] rounded-full blur-[80px] opacity-20" />
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400"
                    className="w-full h-full object-cover rounded-full border-4 border-white/10 shadow-2xl"
                    alt="Candidate"
                  />
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-[#1A1A1A] rounded-full" />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">Swaroop Bhati</h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <ShieldCheck className="w-3 h-3 text-[#D4F478]" />
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Verified Candidate</p>
                </div>
              </div>
            </div>

            {/* Answer Status */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100">
              <p className="text-xs font-black uppercase text-gray-400 mb-4 tracking-wider">Answer Status</p>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, i) => {
                  const isAnswered = test.answers[i]?.selectedIndex !== undefined;
                  const isCorrect = test.answers[i]?.selectedIndex === test.answers[i]?.correctIndex;

                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentQuestion(i)}
                      className={`h-12 rounded-xl font-bold transition-all flex items-center justify-center ${currentQuestion === i
                        ? "bg-black text-white scale-110 shadow-lg"
                        : isAnswered && isCorrect
                          ? "bg-green-500 text-white"
                          : isAnswered
                            ? "bg-red-500 text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded" />
                  <span className="text-gray-600">Correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded" />
                  <span className="text-gray-600">Incorrect</span>
                </div>
              </div>
            </div>

            {/* Test Info */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-3">Test Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Topic:</span>
                  <span className="font-bold">{test.topic}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Score:</span>
                  <span className="font-bold">{test.correctAnswers}/{test.totalQuestions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Percentage:</span>
                  <span className="font-bold text-[#D4F478]">{test.percentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Time Taken:</span>
                  <span className="font-bold">{formatDuration(test.timeTakenSeconds)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const AnalysisModal = ({ test, onClose, onDelete }) => {
  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return "text-[#D4F478]";
    if (percentage >= 70) return "text-blue-500";
    if (percentage >= 60) return "text-orange-500";
    return "text-red-500";
  };

  const getPerformanceLabel = (percentage) => {
    if (percentage >= 80) return "Excellent Performance!";
    if (percentage >= 70) return "Good Performance!";
    if (percentage >= 60) return "Average Performance";
    return "Needs Improvement";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border-2 border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-8 border-b-2 border-gray-100 flex justify-between items-start sticky top-0 bg-white/95 backdrop-blur-xl z-10">
          <div className="flex-1">
            <h2 className="text-3xl font-black text-gray-900 leading-tight mb-2">Aptitude Test</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 font-bold">
              <Target className="w-4 h-4" />
              {test.topic}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>

        {/* Modal Content */}
        <div className="p-8 overflow-y-auto space-y-6">
          {/* Metadata Row */}
          <div className="flex gap-3 text-sm font-bold text-gray-700 flex-wrap">
            <div className="flex items-center gap-2 bg-white border-2 border-gray-100 px-4 py-2 rounded-xl shadow-sm">
              <Calendar className="w-4 h-4 text-[#D4F478]" />
              {formatDateTime(test.createdAt)}
            </div>
            <div className="flex items-center gap-2 bg-white border-2 border-gray-100 px-4 py-2 rounded-xl shadow-sm">
              <Clock className="w-4 h-4 text-[#D4F478]" />
              {formatDuration(test.timeTakenSeconds)}
            </div>
          </div>

          {/* Score Display */}
          <div className="text-center">
            <div className={`text-6xl font-black mb-2 ${getPerformanceColor(test.percentage)}`}>
              {test.percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 mb-6">
              {getPerformanceLabel(test.percentage)}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="bg-gradient-to-br from-[#D4F478]/10 to-[#D4F478]/5 border-2 border-[#D4F478]/20 p-6 rounded-[2rem]">
            <h3 className="font-black text-gray-900 flex items-center gap-2 mb-4 text-lg">
              <TrendingUp className="w-5 h-5 text-[#1A1A1A]" />
              Performance Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border-2 border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Correct Answers</p>
                <p className="text-3xl font-black text-emerald-600">{test.correctAnswers}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border-2 border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Total Questions</p>
                <p className="text-3xl font-black text-[#1A1A1A]">{test.totalQuestions}</p>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-500 mb-1">Accuracy</p>
              <p className="text-xl font-black text-[#D4F478]">
                {((test.correctAnswers / test.totalQuestions) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-500 mb-1">Avg Time/Q</p>
              <p className="text-xl font-black text-gray-900">
                {Math.round(test.timeTakenSeconds / test.totalQuestions)}s
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (!test.answers || test.answers.length === 0) {
                  alert("No answers available for this test.");
                  return;
                }

                // ✅ Use localStorage instead of sessionStorage
                const reviewData = {
                  ...test,
                  answers: test.answers.map(a => ({
                    questionId: a.questionId,
                    question: a.question,
                    options: a.options,
                    explanation: a.explanation || "",
                    difficulty: a.difficulty || "medium",
                    selectedIndex: a.selectedIndex,
                    correctIndex: a.correctIndex,
                    isCorrect: a.selectedIndex === a.correctIndex
                  }))
                };

                localStorage.setItem("aptitude_review_data", JSON.stringify(reviewData));

                // Open in new tab
                window.open("/aptitude-review", "_blank", "noopener,noreferrer");

                // Close modal
                onClose();
              }}
              className="w-full px-6 py-4 rounded-2xl font-bold bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 border-2 border-gray-200"
            >
              <ExternalLink className="w-5 h-5" />
              Review Detailed Answers
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = `/aptitude?topic=${encodeURIComponent(test.topic)}`}
              className="w-full px-6 py-4 rounded-2xl font-bold bg-[#D4F478] text-[#1A1A1A] hover:bg-[#cbf060] transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <Zap className="w-5 h-5" />
              Retake Test
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClose();
                onDelete(test._id);
              }}
              className="w-full px-6 py-4 rounded-2xl font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border-2 border-red-100"
            >
              <Trash2 className="w-5 h-5" />
              Delete Test
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AptitudeTestAnalysis = () => {
  const [tests, setTests] = useState([]);
  const [view, setView] = useState('list');
  const [selectedTest, setSelectedTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const navigate = useNavigate();
  const { setMobileOpen } = useOutletContext();
  const [showMobileModal, setShowMobileModal] = useState(false); // ✅ ADD MOBILE MODAL STATE

  // ✅ Check for mobile device on mount
  useEffect(() => {
    if (window.innerWidth < 768) {
      setShowMobileModal(true);
    }
  }, []);


  // Fetch aptitude attempts from backend
  useEffect(() => {
    const fetchAptitudeAttempts = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await mainApi.get("/users/aptitude/attempts");
        const data = res.data;

        if (data && data.success && Array.isArray(data.data)) {
          const formattedTests = (data.data || []).map((test, index) => ({
            _id: test._id || `test-${index}`,
            id: test._id || `test-${index}`,
            title: `Aptitude Test ${index + 1}`,
            topic: test.topic || "General Aptitude",
            category: test.topic || "General Aptitude",
            percentage: test.percentage || 0,
            correctAnswers: test.correctAnswers || 0,
            totalQuestions: test.totalQuestions || 0,
            timeTakenSeconds: test.timeTakenSeconds || 0,
            createdAt: test.createdAt || new Date().toISOString(),
            answers: test.answers || [],
            questionIds: test.answers?.map(a => a.questionId) || []
          }));

          setTests(formattedTests);
        } else {
          throw new Error(data.message || "Failed to load tests");
        }
      } catch (err) {
        console.error("Failed to fetch aptitude attempts:", err);
        setError(err.message || "Failed to load aptitude tests");
        setTests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAptitudeAttempts();
  }, []);

  //   const fetchQuestionsForReview = async (questionIds) => {
  //   try {
  //     const res = await fetch(
  //       "/api/users/aptitude/questions/batch",
  //       {
  //         method: "POST",
  //         credentials: "include",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ questionIds }),
  //       }
  //     );

  //     const data = await res.json();
  //     return data.success ? data.data : [];
  //   } catch (err) {
  //     console.error("Failed to fetch questions:", err);
  //     return [];
  //   }
  // };


  const handleReviewAnswers = (test) => {
    if (!test.answers || test.answers.length === 0) {
      alert("No review data available for this test.");
      return;
    }

    // 🔑 Use SNAPSHOT directly
    setReviewQuestions(
      test.answers.map((a) => ({
        question: a.question,
        options: a.options,
        explanation: a.explanation,
        difficulty: a.difficulty,
      }))
    );

    setSelectedTest(test);
    setReviewMode(true);
  };


  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return "text-[#D4F478]";
    if (percentage >= 70) return "text-blue-500";
    if (percentage >= 60) return "text-orange-500";
    return "text-red-500";
  };

  const getPerformanceIcon = (percentage) => {
    if (percentage >= 80) return <Trophy className="w-5 h-5 text-[#D4F478]" />;
    if (percentage >= 70) return <TrendingUp className="w-5 h-5 text-blue-500" />;
    if (percentage >= 60) return <Target className="w-5 h-5 text-orange-500" />;
    return <Brain className="w-5 h-5 text-red-500" />;
  };

  const handleDeleteClick = (testId) => {
    setDeleteTarget(testId);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      const res = await mainApi.delete(`/users/aptitude/attempts/${deleteTarget}`);

      if (res.status === 200 || res.data?.success) {
        setTests((prev) => prev.filter((t) => t._id !== deleteTarget));
        setDeleteTarget(null);
        setSelectedTest(null);
      } else {
        alert("Failed to delete test");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete test");
    } finally {
      setDeleting(false);
    }
  };

  // Calculate stats
  const calculateStats = () => {
    if (tests.length === 0) return { averageScore: 0, bestScore: 0, totalTests: 0 };

    const bestScore = Math.max(...tests.map(t => t.percentage));
    const averageScore = tests.reduce((sum, test) => sum + test.percentage, 0) / tests.length;

    return {
      averageScore,
      bestScore,
      totalTests: tests.length
    };
  };

  const stats = calculateStats();

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
          <p className="text-gray-600 text-lg font-bold">Loading aptitude tests...</p>
        </motion.div>
      </div>
    );
  }

  if (reviewMode && selectedTest) {
    return (
      <ReviewMode
        test={selectedTest}
        questions={reviewQuestions}
        onClose={() => {
          setReviewMode(false);
          setReviewQuestions([]);
          setSelectedTest(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] selection:text-black p-4 md:p-8 relative overflow-hidden">

      <MobileRestrictionModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
      />

      {/* Mobile Header */}
      <MobileDashboardHeader setMobileOpen={setMobileOpen} />

      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none -z-50">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-t from-pink-50 to-transparent rounded-full blur-[120px] opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/40 backdrop-blur-xl rounded-[3rem] p-8 md:p-10 border border-white/60 shadow-xl shadow-gray-200/50"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-6 h-6 text-[#D4F478]" />
              </motion.div>
              <span className="text-sm font-bold uppercase tracking-widest text-gray-400">
                Performance Dashboard
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight flex items-center gap-4 mb-2">
              Aptitude Analysis
            </h1>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 100 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="h-1.5 bg-[#D4F478] rounded-full mb-4"
            />
            <p className="text-gray-500 font-medium text-lg">
              Review your aptitude test performance and track your improvement.
            </p>
          </div>

          <div className="flex bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-1.5 shadow-md w-fit">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${view === 'list'
                ? 'bg-[#1A1A1A] text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <List className="w-4 h-4" /> List
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('timeline')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${view === 'timeline'
                ? 'bg-[#1A1A1A] text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Activity className="w-4 h-4" /> Timeline
            </motion.button>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-bold text-red-800">Failed to load tests</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        {/* <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-[#D4F478]/20 rounded-2xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#D4F478]" />
              </div>
              <span className="text-xs font-bold text-gray-500">Best Score</span>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-gray-900 mb-1">
                {stats.bestScore.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Highest Achievement</div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs font-bold text-gray-500">Average Score</span>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-gray-900 mb-1">
                {stats.averageScore.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Across {stats.totalTests} tests</div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-xs font-bold text-gray-500">Total Tests</span>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-gray-900 mb-1">
                {stats.totalTests}
              </div>
              <div className="text-sm text-gray-600">Attempts Completed</div>
            </div>
          </div>
        </motion.div> */}

        {/* Content Area */}
        {tests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/60 shadow-xl"
          >
            <Brain className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <p className="text-gray-900 text-2xl font-black mb-2">No aptitude tests completed yet.</p>
            <p className="text-gray-500 text-base font-medium">
              Complete an aptitude test to see your detailed analysis here.
            </p>
            <button
              onClick={() => navigate('/aptitude')}
              className="mt-6 px-6 py-3 bg-[#D4F478] text-[#1A1A1A] rounded-xl font-bold hover:bg-[#cbf060] transition-colors"
            >
              Take Your First Test
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {view === 'list' ? (
              <motion.div
                key="list"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {tests.map((test, index) => (
                  <motion.div
                    key={test._id}
                    variants={itemVariants}
                    whileHover={{ y: -8, scale: 1.02 }}
                    onClick={() => setSelectedTest(test)}
                    className="bg-white/90 backdrop-blur-sm p-7 rounded-[2.5rem] border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:border-[#D4F478]/30 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                  >
                    {/* Hover gradient */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#D4F478]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div className="w-14 h-14 bg-[#D4F478]/20 text-[#1A1A1A] rounded-2xl flex items-center justify-center border-2 border-[#D4F478]/30">
                        <Brain className="w-7 h-7" strokeWidth={2.5} />
                      </div>
                      <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full border border-gray-200">
                        {formatDate(test.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-[#1A1A1A] transition-colors relative z-10">
                      Aptitude Test {index + 1}
                    </h3>
                    <p className="text-sm font-bold text-gray-500 mb-5 relative z-10">
                      {test.topic}
                    </p>

                    <div className="flex justify-between items-center relative z-10">
                      <div className={`text-3xl font-black ${getPerformanceColor(test.percentage)}`}>
                        {test.percentage.toFixed(1)}%
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {formatDuration(test.timeTakenSeconds)}
                        </div>
                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full mt-1">
                          {test.correctAnswers}/{test.totalQuestions}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="absolute bottom-6 right-6 w-6 h-6 text-gray-300 group-hover:text-[#D4F478] group-hover:translate-x-1 transition-all" />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="timeline"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="relative pl-8 md:pl-12 space-y-6 before:absolute before:left-3.5 md:before:left-7 before:top-6 before:bottom-6 before:w-1 before:bg-gradient-to-b before:from-[#D4F478] before:to-gray-200 before:rounded-full"
              >
                {[...tests]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((test, index) => (
                    <motion.div
                      key={test._id}
                      variants={itemVariants}
                      className="relative"
                    >
                      {/* Timeline Dot */}
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        className={`absolute -left-9 md:-left-14 top-6 w-10 h-10 rounded-full bg-white border-4 ${test.percentage >= 80 ? "border-[#D4F478]" :
                          test.percentage >= 70 ? "border-blue-200" :
                            test.percentage >= 60 ? "border-orange-200" :
                              "border-red-200"
                          } flex items-center justify-center z-10 shadow-lg`}
                      >
                        <div className="w-3 h-3 bg-[#1A1A1A] rounded-full" />
                      </motion.div>

                      <motion.div
                        whileHover={{ x: 4 }}
                        onClick={() => setSelectedTest(test)}
                        className="bg-white/90 backdrop-blur-sm p-6 rounded-[2rem] border-2 border-gray-100 shadow-md hover:shadow-xl hover:border-[#D4F478]/30 transition-all cursor-pointer"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            {getPerformanceIcon(test.percentage)}
                            <h3 className="text-lg font-black text-gray-900">Aptitude Test {index + 1}</h3>
                          </div>
                          <span className="text-xs font-bold text-gray-500">
                            {formatDateTime(test.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 font-bold mb-4">
                          {test.topic}
                        </p>
                        <div className="flex justify-between items-center">
                          <div className={`text-2xl font-black ${getPerformanceColor(test.percentage)}`}>
                            {test.percentage.toFixed(1)}%
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              {formatDuration(test.timeTakenSeconds)}
                            </div>
                            <span className="text-sm font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                              {test.correctAnswers}/{test.totalQuestions}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTest && !reviewMode && (
          <AnalysisModal
            test={selectedTest}
            onClose={() => setSelectedTest(null)}
            onReviewAnswers={handleReviewAnswers}
            onDelete={handleDeleteClick}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <ConfirmDeleteModal
            open={Boolean(deleteTarget)}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={confirmDelete}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AptitudeTestAnalysis;