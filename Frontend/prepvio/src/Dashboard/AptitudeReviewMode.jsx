import { useEffect, useState } from "react";
import { 
  Brain, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ArrowRight, 
  ShieldCheck,
  Target,
  Sparkles,
  Clock,
  BarChart3,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";

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

function AptitudeReviewMode() {
  const [test, setTest] = useState(null);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState({
    accuracy: 0,
    questionsAttempted: 0,
    totalQuestions: 0
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("aptitude_review_data");
      console.log("📦 Raw localStorage data:", raw);

      if (!raw) {
        setError("No review data found. Please select a test to review.");
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(raw);
      console.log("✅ Parsed data:", parsed);
      console.log("✅ Answers array:", parsed.answers);

      if (!parsed.answers || parsed.answers.length === 0) {
        setError("No answers available for review.");
        setLoading(false);
        return;
      }

      // Calculate analysis data
      const totalQuestions = parsed.answers.length;
      const questionsAttempted = parsed.answers.filter(ans => 
        ans.selectedIndex !== undefined && ans.selectedIndex !== null
      ).length;
      const correctAnswers = parsed.answers.filter(ans => 
        ans.selectedIndex === ans.correctIndex
      ).length;
      const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      setAnalysisData({
        accuracy,
        questionsAttempted,
        totalQuestions
      });

      // Add calculated fields to test object
      parsed.correctAnswers = correctAnswers;
      parsed.totalQuestions = totalQuestions;
      parsed.percentage = accuracy;

      setTest(parsed);
      setLoading(false);
    } catch (e) {
      console.error("Invalid review data", e);
      setError("Invalid review data. Please try again.");
      setLoading(false);
    }
  }, []);

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case "easy": return "bg-green-50 border-green-200 text-green-700";
      case "medium": return "bg-orange-50 border-orange-200 text-orange-700";
      case "hard": return "bg-red-50 border-red-200 text-red-700";
      default: return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-[#D4F478] mx-auto mb-4 animate-pulse" />
          <p className="text-xl font-bold text-gray-900">
            Loading review data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 text-center max-w-md w-full">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-gray-900 mb-4">Oops!</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => window.location.href = "/aptitude-analysis"}
            className="bg-[#D4F478] text-black px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#cbf060] transition-colors"
          >
            Back to Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!test) return null;

  const answer = test.answers[current];
  const isCorrect = answer.selectedIndex === answer.correctIndex;
  
  // Calculate performance metrics
  const correctCount = test.answers.filter(a => a.selectedIndex === a.correctIndex).length;
  const accuracyPercentage = Math.round((correctCount / test.answers.length) * 100);

  return (
    <div className="min-h-screen bg-[#FDFBF9] p-4 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT SIDE: QUESTION CONTENT */}
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
            {/* <button
              onClick={() => window.location.href = "/aptitude-analysis"}
              className="bg-[#D4F478] text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#cbf060] transition-colors"
            >
              Back to Analysiss
            </button> */}
          </header>

          {/* Question Card */}
          <main className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Question {current + 1} of {test.answers.length}
              </span>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getDifficultyColor(answer.difficulty)}`}>
                {answer.difficulty || "Medium"}
              </span>
            </div>

            <div className="text-lg md:text-xl font-semibold text-gray-900 mb-8 leading-tight">
              {renderQuestion(answer.question)}
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
              {answer.options.map((opt, i) => {
                const isUserAnswer = answer.selectedIndex === i;
                const isCorrectAnswer = answer.correctIndex === i;
                
                return (
                  <div 
                    key={i} 
                    className={`p-6 rounded-2xl border-2 text-left font-bold transition-all ${
                      isCorrectAnswer 
                        ? "bg-green-50 border-green-300 text-green-900" 
                        : isUserAnswer 
                        ? "bg-red-50 border-red-300 text-red-900"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{String.fromCharCode(65+i)}. {opt.text}</span>
                      {isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      {isUserAnswer && !isCorrectAnswer && <XCircle className="w-5 h-5 text-red-600" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            {answer.explanation && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-10">
                <p className="text-xs font-black text-blue-600 uppercase tracking-wider mb-2">Explanation</p>
                <p className="text-gray-700 leading-relaxed">{answer.explanation}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-100">
              <button 
                onClick={() => current > 0 && setCurrent(c => c - 1)} 
                disabled={current === 0}
                className="text-gray-400 font-bold flex items-center gap-2 hover:text-gray-900 transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" /> Previous
              </button>
              <button 
                onClick={() => current < test.answers.length - 1 && setCurrent(c => c + 1)} 
                disabled={current === test.answers.length - 1}
                className="bg-black text-white px-8 py-4 rounded-2xl font-black hover:bg-gray-900 transition-colors disabled:opacity-30 flex items-center gap-2"
              >
                Next <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </main>
        </div>

        {/* RIGHT SIDE: SIDEBAR */}
        <aside className="lg:col-span-4 space-y-8">
          

          {/* Accuracy Stats Card */}
          {/* Accuracy Stats Card */}
          <div className="bg-black rounded-[2.5rem] p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#D4F478]/20 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#D4F478]" />
              </div>
              <div>
                <h3 className="text-lg font-black">Performance</h3>
                <p className="text-sm text-gray-400">Complete test analytics</p>
              </div>
            </div>
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full border-8 border-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-4xl font-black">{analysisData.accuracy}%</span>
                    <p className="text-sm text-gray-400 mt-1">Accuracy</p>
                  </div>
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-8 border-transparent border-t-[#D4F478]"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
            
            {/* Test Information */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">Topic:</span>
                <span className="font-bold text-[#D4F478]">{test.topic}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">Score:</span>
                <span className="font-bold">{correctCount}/{test.answers.length}</span>
              </div>
              {test.timeTakenSeconds && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-medium">Time Taken:</span>
                  <span className="font-bold">
                    {Math.floor(test.timeTakenSeconds / 60)}:{String(test.timeTakenSeconds % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">Status:</span>
                <span className={`font-bold ${
                  accuracyPercentage >= 80 ? "text-green-400" :
                  accuracyPercentage >= 60 ? "text-blue-400" :
                  "text-orange-400"
                }`}>
                  {accuracyPercentage >= 80 ? "Excellent" :
                   accuracyPercentage >= 60 ? "Good" :
                   "Needs Improvement"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
              <div className="text-center p-4 bg-gray-900 rounded-2xl">
                <div className="text-2xl font-black">{analysisData.questionsAttempted}</div>
                <div className="text-xs text-gray-400">Attempted</div>
              </div>
              <div className="text-center p-4 bg-gray-900 rounded-2xl">
                <div className="text-2xl font-black">{correctCount}</div>
                <div className="text-xs text-gray-400">Correct</div>
              </div>
            </div>
          </div>

          {/* Answer Status Card */}
          <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-black uppercase text-gray-400 tracking-wider">Answer Status</p>
              {/* <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-black">{correctCount}/{test.answers.length} correct</span>
                <span className="text-xs font-bold text-[#D4F478]">({accuracyPercentage}%)</span>
              </div> */}
            </div>
            
            <div className="grid grid-cols-5 gap-3 mb-6">
              {test.answers.map((ans, idx) => {
                const isAnswered = ans.selectedIndex !== undefined;
                const isCorrect = ans.selectedIndex === ans.correctIndex;
                
                return (
                  <button 
                    key={idx} 
                    onClick={() => setCurrent(idx)}
                    className={`h-12 rounded-2xl font-black text-sm transition-all relative overflow-hidden ${
                      current === idx 
                        ? "bg-black text-white shadow-lg scale-110 z-10" 
                        : isAnswered && isCorrect
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : isAnswered
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  <div className="w-2 h-2 rounded-full bg-green-500" /> Correct
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  <div className="w-2 h-2 rounded-full bg-black" /> Current
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  <div className="w-2 h-2 rounded-full bg-red-500" /> Incorrect
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  <div className="w-2 h-2 rounded-full bg-gray-100" /> Not Attempted
                </div>
              </div>
            </div>
          </div>

          {/* Test Stats Card */}
          {/* <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#D4F478]" />
              Test Information
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Topic:</span>
                <span className="font-bold">{test.topic}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Total Questions:</span>
                <span className="font-bold">{test.answers.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Score:</span>
                <span className="font-bold text-[#D4F478]">{correctCount}/{test.answers.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Percentage:</span>
                <span className="font-bold text-[#D4F478]">{accuracyPercentage}%</span>
              </div>
              {test.timeTakenSeconds && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Time Taken:</span>
                  <span className="font-bold">
                    {Math.floor(test.timeTakenSeconds / 60)}:{String(test.timeTakenSeconds % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Status:</span>
                <span className={`font-bold ${
                  accuracyPercentage >= 80 ? "text-green-600" :
                  accuracyPercentage >= 60 ? "text-blue-600" :
                  "text-orange-600"
                }`}>
                  {accuracyPercentage >= 80 ? "Excellent" :
                   accuracyPercentage >= 60 ? "Good" :
                   "Needs Improvement"}
                </span>
              </div>
            </div>
          </div> */}
        </aside>
      </div>
    </div>
  );
}

export default AptitudeReviewMode;