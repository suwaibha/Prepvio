import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  User,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Flag,
  Trophy,
  Brain,
  Clock,
  Target,
  Sparkles,
  Zap,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  XCircle,
  Award
} from "lucide-react";
import { useAuthStore } from "../../../../store/authstore";
import { mainApi } from "../../../../utils/apiClient";

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
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

  // Phase 1: Tokenize into raw lines at {, }, ; boundaries
  let raw = '';
  let inStr = false, strCh = '', parenD = 0;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];

    // String handling
    if (!inStr && (c === '"' || c === "'")) {
      inStr = true; strCh = c; raw += c; continue;
    }
    if (inStr) {
      raw += c;
      if (c === strCh && (i === 0 || s[i - 1] !== '\\')) inStr = false;
      continue;
    }

    // Paren tracking (skip ; inside for(;;) etc.)
    if (c === '(') { parenD++; raw += c; continue; }
    if (c === ')') { parenD = Math.max(0, parenD - 1); raw += c; continue; }

    // #include directives
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

  // Phase 2: Expand lines — split access specifiers, braceless if/else
  let rawLines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  let expanded = [];

  for (const line of rawLines) {
    // "public: <rest>" → split into two lines
    const accM = line.match(/^(public|private|protected)\s*:\s*(.+)$/);
    if (accM) {
      expanded.push(accM[1] + ':');
      if (accM[2].trim()) expanded.push(accM[2].trim());
      continue;
    }
    // "<prev> public: <rest>" embedded in a line
    const accM2 = line.match(/^(.+?)\s+(public|private|protected)\s*:\s*(.*)$/);
    if (accM2) {
      if (accM2[1].trim()) expanded.push(accM2[1].trim());
      expanded.push(accM2[2] + ':');
      if (accM2[3].trim()) expanded.push(accM2[3].trim());
      continue;
    }
    // "else if(...) stmt" without brace
    const eiM = line.match(/^(else\s+if\s*\([^)]*\))\s+(?!\{)(.+)$/);
    if (eiM) { expanded.push(eiM[1]); expanded.push(eiM[2]); continue; }
    // "else stmt" (not "else if" or "else {")
    const elM = line.match(/^(else)\s+(.+)$/);
    if (elM && !elM[2].startsWith('if') && !elM[2].startsWith('{')) {
      expanded.push('else'); expanded.push(elM[2]); continue;
    }
    // "if(...) stmt" without brace
    const ifM = line.match(/^(if\s*\([^)]*\))\s+(?!\{)(.+)$/);
    if (ifM) { expanded.push(ifM[1]); expanded.push(ifM[2]); continue; }
    // "for(...) stmt" without brace
    const forM = line.match(/^(for\s*\([^)]*\))\s+(?!\{)(.+)$/);
    if (forM) { expanded.push(forM[1]); expanded.push(forM[2]); continue; }
    // "while(...) stmt" without brace
    const whM = line.match(/^(while\s*\([^)]*\))\s+(?!\{)(.+)$/);
    if (whM) { expanded.push(whM[1]); expanded.push(whM[2]); continue; }

    expanded.push(line);
  }

  // Phase 3: Apply indentation
  let indent = 0;
  let lines = [];
  let pendingIndent = false;

  for (const ln of expanded) {
    const t = ln.trim();
    if (!t) continue;

    // Closing brace → dedent first
    if (/^\}/.test(t)) {
      indent = Math.max(0, indent - 1);
      pendingIndent = false;
    }

    // Access specifiers at one level less than current
    if (/^(public|private|protected):$/.test(t)) {
      lines.push(SP.repeat(Math.max(0, indent - 1)) + t);
    } else {
      let li = indent;
      if (pendingIndent) { li++; pendingIndent = false; }
      lines.push(SP.repeat(li) + t);
    }

    // Opening brace → indent next
    if (t.endsWith('{')) indent++;

    // Braceless control flow → indent next statement once
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

  // Detect C-style code: has balanced braces and semicolons
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

  // Markdown code blocks
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

export default function AptitudeTest() {
  // Get topic from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category') || 'General';
  const subcategory = urlParams.get('subcategory') || urlParams.get('topic') || 'General';
  const topic = subcategory;

  const [questions, setQuestions] = useState([]);
  const [activeTopic, setActiveTopic] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [isFinished, setIsFinished] = useState(false);
  const [flagged, setFlagged] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const { user } = useAuthStore();


  // Fetch random questions from API by category + subcategory
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await mainApi.get(
          `/questions/random?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}&limit=30`
        );

        const data = res.data;
        const qs = (data && data.data) || [];

        setQuestions(qs);
        setActiveTopic(`${category} — ${subcategory}`);

      } catch (err) {
        console.error("Failed to load questions", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [category, subcategory]);


  useEffect(() => {
    const fetchLatestAttempt = async () => {
      try {
        const res = await mainApi.get("/users/aptitude/latest");

        const data = res.data;
        if (data && data.success) {
          setAttempt(data.data);
        }
      } catch (err) {
        console.error("Failed to load aptitude analysis", err);
      }
    };

    fetchLatestAttempt();
  }, []);


  // Timer
  useEffect(() => {
    if (timeLeft > 0 && !isFinished && questions.length > 0) {
      const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setIsFinished(true);
      setShowResults(true);
    }
  }, [timeLeft, isFinished, questions.length]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelect = (index) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: index });
  };

  const toggleFlag = () => {
    setFlagged({ ...flagged, [currentQuestion]: !flagged[currentQuestion] });
  };

  const attemptedCount = Object.keys(selectedAnswers).length;
  const progress = questions.length > 0 ? (attemptedCount / questions.length) * 100 : 0;

  const calculateScore = () => {
    let correct = 0;
    Object.keys(selectedAnswers).forEach(qIndex => {
      const question = questions[qIndex];
      if (selectedAnswers[qIndex] === question.correctAnswerIndex) {
        correct++;
      }
    });
    return correct;
  };

  const handleSubmit = async () => {
    const score = calculateScore();
    const percentage = (score / questions.length) * 100;
    const timeTakenSeconds = 1800 - timeLeft;

    const answersPayload = questions.map((q, idx) => ({
      questionId: q._id,

      // 🔑 SNAPSHOT REQUIRED BY BACKEND
      question: q.question,
      options: q.options.map(opt => ({
        text: opt.text,
      })),
      explanation: q.explanation || "",
      difficulty: q.difficulty || "medium",

      selectedIndex: selectedAnswers[idx],
      correctIndex: q.correctAnswerIndex,
      isCorrect: selectedAnswers[idx] === q.correctAnswerIndex,
    }));


    try {
      await mainApi.post("/users/aptitude/submit", {
        topic: activeTopic,
        totalQuestions: questions.length,
        correctAnswers: score,
        percentage,
        timeTakenSeconds,
        answers: answersPayload,
      });
    } catch (err) {
      console.error("Failed to submit aptitude test", err);
    }

    setIsFinished(true);
    setShowResults(true);
  };


  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy": return "bg-green-50 border-green-200 text-green-700";
      case "medium": return "bg-orange-50 border-orange-200 text-orange-700";
      case "hard": return "bg-red-50 border-red-200 text-red-700";
      default: return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-[#D4F478] mx-auto mb-4 animate-pulse" />
          <p className="text-xl font-bold text-gray-900">
            Loading questions for {activeTopic || "Aptitude"}...
          </p>

        </div>
      </div>
    );
  }

  // No questions available
  if (!questions.length) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-900">No questions found for {activeTopic}</p>
          <p className="text-gray-500 mt-2">Please try another topic</p>
        </div>
      </div>
    );
  }

  // Results Screen
  if (showResults) {
    const score = calculateScore();
    const percentage = (score / questions.length) * 100;

    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-6 overflow-hidden relative">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#D4F478]/20 rounded-full blur-[100px]" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 text-center max-w-md w-full relative z-10"
        >
          <div className="w-24 h-24 bg-[#D4F478] rounded-[2rem] rotate-12 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#D4F478]/40">
            <Trophy className="w-12 h-12 text-black -rotate-12" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Test Over!</h2>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">
            {activeTopic}
          </p>

          <p className="text-gray-500 font-medium mb-10 leading-relaxed">Your performance metrics are being analyzed. Great job staying focused!</p>

          <div className="bg-gray-50 rounded-3xl p-8 mb-8 text-left space-y-4 border border-gray-100">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-400 uppercase tracking-widest text-[10px]">Score</span>
              <span className="bg-black text-white px-3 py-1 rounded-full">{score}/{questions.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-400 uppercase tracking-widest text-[10px]">Percentage</span>
              <span className="text-[#D4F478]">{percentage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-400 uppercase tracking-widest text-[10px]">Time Taken</span>
              <span className="text-emerald-500">{formatTime(1800 - timeLeft)}</span>
            </div>
          </div>

          {/* Performance Badge */}
          <div className="mb-8">
            {percentage >= 80 ? (
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-6 py-3 rounded-2xl font-bold">
                <Award className="w-5 h-5" />
                Excellent Performance!
              </div>
            ) : percentage >= 60 ? (
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl font-bold">
                <Target className="w-5 h-5" />
                Good Work!
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-6 py-3 rounded-2xl font-bold">
                <Brain className="w-5 h-5" />
                Keep Practicing!
              </div>
            )}
          </div>

          <button
            onClick={() => {
              // 1️⃣ Calculate time here (scope-safe)
              const timeTakenSeconds = 1800 - timeLeft;

              // 2️⃣ Store review data (MUST be before opening tab)
              localStorage.setItem(
                "aptitude_review_data",
                JSON.stringify({
                  topic: activeTopic,
                  timeTakenSeconds,
                  answers: questions.map((q, idx) => ({
                    question: q.question,
                    options: q.options,
                    correctIndex: q.correctAnswerIndex,
                    selectedIndex: selectedAnswers[idx],
                    explanation: q.explanation,
                    difficulty: q.difficulty,
                    isCorrect:
                      q.correctAnswerIndex === selectedAnswers[idx],
                  })),
                })
              );

              // 3️⃣ OPEN REVIEW PAGE IN NEW TAB
              window.open("/aptitude-review", "_blank", "noopener,noreferrer");
            }}
          >
            View Detailed Analysis
          </button>




        </motion.div>
      </div>
    );
  }

  // Review Mode (after results)
  if (isFinished && !showResults) {
    const question = questions[currentQuestion];
    const userAnswer = selectedAnswers[currentQuestion];
    const correctAnswerIndex = question.correctAnswerIndex;
    const isCorrect = userAnswer === correctAnswerIndex;

    return (
      <div className="min-h-screen bg-[#FDFBF9] p-4 md:p-10 flex flex-col items-center">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-6">
            {/* Header */}
            <header className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-4">
                <Brain className="w-8 h-8 p-1.5 bg-black text-[#D4F478] rounded-xl" />
                <div>
                  <h2 className="font-black text-xl">Review Mode</h2>
                  <p className="text-xs text-gray-500 font-medium">{activeTopic}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowResults(true)}
                className="bg-[#D4F478] text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#cbf060] transition-colors"
              >
                Back to Results
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
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100">
              <p className="text-xs font-black uppercase text-gray-400 mb-4 tracking-wider">Answer Status</p>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, i) => {
                  const isAnswered = selectedAnswers[i] !== undefined;
                  const isCorrect = selectedAnswers[i] === questions[i].correctAnswerIndex;

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
          </aside>
        </div>
      </div>
    );
  }

  // Test Mode (Active test taking)
  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] p-4 md:p-10 flex flex-col items-center relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-[#D4F478]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none" />

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">

        {/* LEFT SIDE: QUIZ CONTENT */}
        <div className="lg:col-span-8 space-y-8">
          <header className="flex flex-col sm:flex-row justify-between items-center bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20 shadow-xl shadow-black/[0.02]">
            <div className="flex items-center gap-5 mb-4 sm:mb-0">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-[#D4F478] shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h1 className="font-black text-2xl tracking-tighter text-gray-900">Aptitude Arena</h1>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{activeTopic}</span>
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${getDifficultyColor(question?.difficulty)}`}>
                    {question?.difficulty || "Medium"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none text-right">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Session Progress</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black">{Math.round(progress)}%</span>
                  <div className="w-24 md:w-40 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-black rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="bg-white rounded-[3rem] p-8 md:p-14 border border-gray-100 shadow-sm relative overflow-hidden">
            {/* Visual indicator for current category */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <Target className="w-48 h-48 text-black" />
            </div>

            <div className="mb-12 relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-gray-900 text-[#D4F478] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Question {currentQuestion + 1}</span>
                <span className="text-gray-300 font-bold">/</span>
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{questions.length} total</span>
              </div>
              <div className="text-xl md:text-2xl font-semibold text-gray-900 leading-[1.2] tracking-tight">
                {renderQuestion(question?.question)}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-14 relative z-10">
              {question?.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`flex items-center justify-between p-7 rounded-[2rem] border-2 transition-all duration-300 group ${selectedAnswers[currentQuestion] === idx
                    ? "border-black bg-black text-white shadow-2xl shadow-black/20 translate-x-3"
                    : "border-gray-50 bg-gray-50/50 text-gray-600 hover:border-gray-200 hover:bg-white"
                    }`}
                >
                  <div className="flex items-center gap-5">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-colors ${selectedAnswers[currentQuestion] === idx
                      ? "bg-[#D4F478] text-black"
                      : "bg-white text-gray-400 group-hover:text-black shadow-sm"
                      }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-bold text-lg">{opt.text}</span>
                  </div>
                  <AnimatePresence>
                    {selectedAnswers[currentQuestion] === idx && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <CheckCircle2 className="w-6 h-6 text-[#D4F478]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              ))}
            </div>

            <div className="mt-auto pt-10 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
              <button
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(prev => prev - 1)}
                className="flex items-center gap-3 font-black text-gray-400 hover:text-black disabled:opacity-30 transition-all uppercase tracking-widest text-xs group"
              >
                <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </div>
                Previous
              </button>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={toggleFlag}
                  className={`flex items-center gap-2 font-black px-6 py-4 rounded-2xl transition-all uppercase tracking-widest text-xs border ${flagged[currentQuestion]
                    ? "bg-orange-50 border-orange-200 text-orange-600"
                    : "bg-white border-gray-100 text-gray-400 hover:text-orange-500"
                    }`}
                >
                  <Flag className={`w-4 h-4 ${flagged[currentQuestion] ? "fill-orange-500" : ""}`} />
                  {flagged[currentQuestion] ? "Flagged" : "Flag"}
                </button>

                {currentQuestion === questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    className="flex-1 sm:flex-none bg-black text-white px-12 py-5 rounded-[1.5rem] font-black text-lg hover:bg-gray-800 transition-all shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95"
                  >
                    Submit Test
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                    className="flex-1 sm:flex-none bg-black text-white px-12 py-5 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.05] active:scale-95 transition-all shadow-xl shadow-black/20 group"
                  >
                    Next Question
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* RIGHT SIDE: USER PROFILE & ANALYTICS */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Enhanced User Card */}
          <div className="bg-[#1A1A1A] rounded-[3rem] p-10 relative overflow-hidden text-center shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4F478] rounded-full blur-[80px] opacity-20" />
            <div className="relative z-10">
              <div className="w-28 h-28 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4F478] to-blue-500 rounded-full animate-spin-slow opacity-30" />
                <img
                  src={user?.profilePic || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || "Guest")}`}
                  className="w-full h-full object-cover rounded-full border-4 border-white/10 shadow-2xl relative z-10"
                  alt="Candidate"
                />
                <div className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-500 border-4 border-[#1A1A1A] rounded-full z-20" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">{user?.name || "Candidate"}</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <ShieldCheck className="w-3 h-3 text-[#D4F478]" />
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Verified Candidate</p>
              </div>
            </div>
          </div>

          {/* Time & Navigator Card */}
          <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm space-y-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-50" />

            <div className="text-center">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 block">Time Remaining</label>
              <div className={`flex items-center justify-center gap-4 text-5xl font-black tracking-tighter ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                <Clock className="w-10 h-10" />
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Jump to Question</label>
                <span className="text-[10px] font-black text-black">{attemptedCount} / {questions.length} done</span>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestion(i)}
                    className={`h-12 rounded-2xl font-black text-sm transition-all relative overflow-hidden ${currentQuestion === i
                      ? "bg-black text-white shadow-lg scale-110 z-10"
                      : selectedAnswers[i] !== undefined
                        ? "bg-[#D4F478] text-black hover:bg-[#c4e468]"
                        : "bg-gray-50 text-gray-300 hover:bg-gray-100 hover:text-gray-600"
                      }`}
                  >
                    {i + 1}
                    {flagged[i] && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                    <div className="w-2 h-2 rounded-full bg-[#D4F478]" /> Answered
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                    <div className="w-2 h-2 rounded-full bg-black" /> Current
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                    <div className="w-2 h-2 rounded-full bg-orange-500" /> Flagged
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                    <div className="w-2 h-2 rounded-full bg-gray-100" /> Pending
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Status */}
          {/* <div className="bg-black rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <div className="relative z-10 flex items-center justify-between">
                <div>
                   <div className="flex items-center gap-2 text-[#D4F478] mb-1">
                      <Zap className="w-4 h-4 fill-[#D4F478]" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Live Status</span>
                   </div>
                   <h4 className="font-bold text-sm">Evaluation AI is Active</h4>
                </div>
                <BarChart3 className="w-8 h-8 text-gray-600 group-hover:text-[#D4F478] transition-colors" />
             </div>
          </div> */}
        </aside>
      </motion.div>

      {/* Footer Branding */}
      {/* <footer className="mt-20 text-center space-y-4 pb-10">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] flex items-center justify-center gap-3">
          <ShieldCheck className="w-3 h-3" /> Encrypted Session <Sparkles className="w-3 h-3" /> AI Proctored
        </p>
      </footer> */}
    </div>
  );
}