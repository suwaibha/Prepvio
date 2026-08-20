import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Activity, XCircle, TrendingUp, Sparkles, Download, Linkedin } from "lucide-react";
import { useAuthStore } from "../store/authstore";
import { mainApi } from "../utils/apiClient";

// ─── Score Ring ────────────────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
  const safe = Math.max(0, Math.min(100, score ?? 0));
  const r = 52, circ = 2 * Math.PI * r;
  const dash = (safe / 100) * circ;
  const color = safe >= 75 ? "#facc15" : safe >= 50 ? "#1a1a1a" : "#f43f5e";
  const label = safe >= 75 ? "Excellent" : safe >= 50 ? "Good" : "Needs Work";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} stroke="#e5e7eb" strokeWidth="9" fill="none" />
          <circle cx="60" cy="60" r={r} stroke={color} strokeWidth="9" fill="none"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline gap-0.5">
            <span className="text-4xl font-black" style={{ color }}>{safe}</span>
            <span className="text-xl font-bold opacity-80" style={{ color }}>%</span>
          </div>
          <span className="text-[9px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">Score</span>
        </div>
      </div>
      <span className="text-sm font-black px-4 py-1.5 rounded-full border-2"
        style={{ background: color + "18", color, borderColor: color + "40" }}>
        {label}
      </span>
    </div>
  );
};

// ─── Topic Skill Card ──────────────────────────────────────────────────────
const SkillCard = ({ topic }) => {
  const total = topic.totalQuestions || 1;
  const score = Math.round((topic.strong * 100 + topic.partial * 60) / total);
  const color = score >= 70 ? "#facc15" : score >= 40 ? "#1a1a1a" : "#f43f5e";
  const label = score >= 70 ? "Strong" : score >= 40 ? "Needs Improvement" : "Needs Work";
  const strongPct = Math.round((topic.strong / total) * 100);

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-[1.5rem] p-5 shadow-sm flex flex-col gap-3">
      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{topic.name}</p>
      <p className="text-4xl font-black" style={{ color }}>
        {score}<span className="text-2xl opacity-80">%</span>
      </p>
      <p className="text-xs font-bold" style={{ color }}>{label}</p>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${strongPct}%`, background: color }} />
      </div>
      <div className="flex justify-between text-[9px] text-gray-400 font-bold">
        <span>{topic.strong} Strong</span>
        <span>{topic.weak} Weak</span>
      </div>
      {topic.weakSubtopics?.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-100">
          {topic.weakSubtopics.map((s, i) => (
            <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">{s}</span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Q&A Accordion ────────────────────────────────────────────────────────
const QACard = ({ item, idx }) => {
  const [open, setOpen] = useState(false);
  const isStrong = item.result === "Strong";
  const isPartial = item.result === "Partial";
  const badgeCls = isStrong
    ? "bg-yellow-50 border-yellow-200 text-yellow-700"
    : isPartial
      ? "bg-gray-100 border-gray-300 text-gray-700"
      : "bg-rose-50 border-rose-200 text-rose-600";

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-[1.5rem] overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/60 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-gray-300 font-black text-sm w-6 flex-shrink-0">Q{idx + 1}</span>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{item.subtopic || "General"}</p>
            <p className="text-sm text-gray-700 font-semibold truncate pr-4">{item.question || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${badgeCls}`}>{item.result}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">📋 Question Asked</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100">{item.question || "—"}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">💬 Your Answer</p>
                <p className="text-sm text-gray-500 leading-relaxed bg-blue-50/40 rounded-xl p-3 border border-blue-100/60 italic">
                  {item.answer && item.answer !== "(no answer)"
                    ? item.answer
                    : <span className="not-italic text-gray-400">No answer recorded.</span>}
                </p>
              </div>
              {item.feedback && (
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">🤖 AI Feedback</p>
                  <p className={`text-sm leading-relaxed rounded-xl p-3 border font-medium ${isStrong ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                      : isPartial ? "bg-gray-100 border-gray-300 text-gray-800"
                        : "bg-rose-50 border-rose-200 text-rose-700"}`}>
                    {item.feedback}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function InterviewReportPage() {
  const [report, setReport] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRound, setActiveRound] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("sessionId");
    if (!sessionId) { setError("No session ID provided."); setLoading(false); return; }

    const cached = sessionStorage.getItem(`prepvio_report_${sessionId}`);
    if (cached) {
      try { const p = JSON.parse(cached); setReport(p.report); setMeta(p.meta); setLoading(false); return; }
      catch { /* fall through */ }
    }

    mainApi.post(`/interview-session/${sessionId}/report`)
      .then(res => {
        const d = res.data;
        if (d && d.success && d.report) {
          setReport(d.report);
          if (d.meta) setMeta(d.meta);
        } else {
          setError((d && d.message) || "Report not found.");
        }
      })
      .catch(() => setError("Failed to load report."))
      .finally(() => setLoading(false));
  }, []);

  const rounds = report ? [...new Set((report.roundSummary || []).map(r => r.round))].filter(Boolean) : [];
  useEffect(() => { if (rounds.length > 0 && !activeRound) setActiveRound(rounds[0]); }, [rounds]);
  const filteredQA = report ? (report.roundSummary || []).filter(r => !activeRound || r.round === activeRound) : [];

  const strongSubtopics = report
    ? [...new Set((report.roundSummary || []).filter(r => r.result === "Strong" && r.subtopic).map(r => r.subtopic))]
    : [];
  const weakSubtopics = report?.weakAreas || [];

  if (loading) return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col items-center justify-center gap-5">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-14 h-14 border-4 border-[#facc15] border-t-transparent rounded-full" />
      <p className="text-gray-500 font-bold text-sm">Generating your performance report…</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col items-center justify-center gap-4 px-4">
      <XCircle className="w-12 h-12 text-rose-400" />
      <p className="text-gray-700 text-lg font-bold">{error}</p>
      <button onClick={() => window.close()} className="px-6 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-colors">Close Tab</button>
    </div>
  );

  const score = report?.overallScore ?? 0;

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#facc15] selection:text-black relative overflow-hidden">

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-t from-pink-50 to-transparent rounded-full blur-[120px] opacity-60" />
      </div>

      {/* ── Sticky Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-white/50 bg-white/60 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-black/10">
              <img src="/newuilogo1.png" alt="Prepvio Icon" className="w-full h-full object-cover" />
            </div>
            <img src="/prepvio (1).png" alt="PrepVio" className="h-7 w-auto object-contain mt-1" />
          </div>
          {meta && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-white/70 backdrop-blur rounded-full px-4 py-2 border border-white/60 shadow-sm">
              <span className="font-black text-gray-800">{user?.name || meta?.candidateName || "Candidate"}</span>
              <span>·</span><span>{meta.role}</span>
              <span>·</span><span>{meta.companyType}</span>
              {meta.date && <><span>·</span><span>{meta.date}</span></>}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="px-4 py-1.5 bg-[#facc15]/20 text-gray-800 rounded-full text-xs font-black border-2 border-[#facc15]/30">
              AI Report
            </div>
            <button onClick={() => window.close()} className="text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors">Close</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* ── Main Card ── */}
        <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-white/60 p-8 md:p-12">

          {/* Hero section */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center mb-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[#facc15]" />
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">Performance Report</span>
              </div>
              {meta
                ? <><h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{user?.name || meta?.candidateName || "Candidate"}</h1>
                  <p className="text-sm text-gray-500 font-medium">{meta.role} · {meta.companyType}{meta.date ? ` · ${meta.date}` : ""}</p></>
                : <h1 className="text-3xl font-black text-gray-900">Performance Report</h1>}

              <div className="bg-white/70 backdrop-blur border border-white/60 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {score >= 75
                    ? "🎉 Excellent performance! You demonstrated strong technical knowledge and communication. Keep this momentum going!"
                    : score >= 50
                      ? "👍 Solid foundation. Target your weak subtopics with 2–4 weeks of focused prep and you'll be interview-ready."
                      : "📚 Clear areas to improve. Use the breakdown below to focus on weak subtopics — consistent practice will make a big difference."}
                </p>
              </div>

              {/* Stat pills */}
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Questions", val: report?.roundSummary?.length || 0, color: "text-gray-900" },
                  { label: "Topics", val: report?.topics?.length || 0, color: "text-gray-900" },
                  { label: "Weak Subtopics", val: weakSubtopics.length, color: "text-rose-500" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-white/80 border border-white/60 rounded-2xl px-5 py-3 text-center shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                    <p className={`font-black text-xl ${color}`}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center md:justify-end"><ScoreRing score={score} /></div>
          </div>

          {/* Metric Cards Section (Confidence, Communication, Technical) */}
          <section className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: "Confidence", val: report?.metrics?.confidence ?? Math.round(score * 0.9), color: "#3b82f6", bg: "bg-blue-50/50 border-blue-100", textCls: "text-blue-600", labelCls: "text-blue-900", barBg: "bg-blue-100" },
              { label: "Communication", val: report?.metrics?.communication ?? Math.round(score * 0.95), color: "#22c55e", bg: "bg-green-50/50 border-green-100", textCls: "text-green-600", labelCls: "text-green-900", barBg: "bg-green-100" },
              { label: "Technical Depth", val: report?.metrics?.technical ?? Math.round(score * 0.85), color: "#f59e0b", bg: "bg-amber-50/50 border-amber-100", textCls: "text-amber-500", labelCls: "text-amber-900", barBg: "bg-amber-100" }
            ].map((metric) => {
              const labelState = metric.val >= 75 ? "Strong" : metric.val >= 50 ? "Needs improvement" : "Needs work";
              return (
                <div key={metric.label} className={`bg-white/80 backdrop-blur-sm border rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between ${metric.bg}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-4 opacity-70 ${metric.labelCls}`}>{metric.label}</p>
                  <div>
                    <h2 className={`text-5xl font-black mb-1 ${metric.textCls}`}>
                      {metric.val}<span className="text-3xl opacity-80">%</span>
                    </h2>
                    <p className={`text-sm font-bold mb-4 opacity-80 ${metric.labelCls}`}>{labelState}</p>
                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${metric.barBg}`}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${metric.val}%`, backgroundColor: metric.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Topic Skill Cards */}
          {report?.topics?.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <TrendingUp className="w-4 h-4 text-gray-700" />
                </div>
                <h2 className="text-base font-black text-gray-900">Topic Breakdown</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {report.topics.map((t, i) => <SkillCard key={i} topic={t} />)}
              </div>
            </section>
          )}

          {/* Strong vs Weak subtopics */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            <div className="bg-white/80 backdrop-blur border border-white/60 rounded-[1.75rem] p-6 shadow-sm">
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">✅ Strong Subtopics</h3>
              <div className="flex flex-wrap gap-2">
                {strongSubtopics.length > 0
                  ? strongSubtopics.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-50 border border-yellow-200 text-yellow-700">{s}</span>
                  ))
                  : <p className="text-gray-400 text-xs">Keep practising to build strong areas!</p>}
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur border border-white/60 rounded-[1.75rem] p-6 shadow-sm">
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">🎯 Weak Subtopics</h3>
              <div className="flex flex-wrap gap-2">
                {weakSubtopics.length > 0
                  ? weakSubtopics.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-600">{s}</span>
                  ))
                  : <p className="text-yellow-600 text-xs font-semibold">No weak subtopics 🎉</p>}
              </div>
            </div>
          </section>

          {/* Gap Analysis */}
          {weakSubtopics.length > 0 && (
            <section className="mb-10">
              <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-5">Gap Analysis — Skills to Build</h2>
              <div className="space-y-3">
                {weakSubtopics.map((area, i) => {
                  const priority = i === 0 ? "HIGH" : i <= 2 ? "MEDIUM" : "LOW";
                  const ps = priority === "HIGH" ? "bg-rose-50 border-rose-200 text-rose-600"
                    : priority === "MEDIUM" ? "bg-amber-50 border-amber-200 text-amber-600"
                      : "bg-blue-50 border-blue-200 text-blue-600";
                  return (
                    <div key={i} className="flex items-center justify-between bg-white/80 border border-white/60 rounded-2xl px-6 py-4 shadow-sm">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{area}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {priority === "HIGH" ? "~4 weeks focused practice" : priority === "MEDIUM" ? "~2 weeks focused practice" : "~1 week light review"}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${ps}`}>{priority}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Round-by-Round Q&A */}
          {report?.roundSummary?.length > 0 && (
            <section>
              <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">
                Round by Round Breakdown · <span className="text-gray-300">click to explore</span>
              </h2>
              {/* Round tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {rounds.map(round => (
                  <motion.button key={round} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveRound(round)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${activeRound === round
                        ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md"
                        : "bg-white/80 text-gray-600 border-gray-100 hover:border-gray-300 hover:text-gray-800"
                      }`}>
                    {round.charAt(0).toUpperCase() + round.slice(1)} Round
                  </motion.button>
                ))}
              </div>
              <div className="space-y-3">
                {filteredQA.map((item, idx) => <QACard key={idx} item={item} idx={idx} />)}
              </div>
            </section>
          )}

          {/* ── Action Buttons (Download & Share) ── */}
          <section className="mt-12 pt-8 border-t border-gray-200 flex flex-col items-center justify-center gap-4 print:hidden">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Share Your Results</h2>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button 
                onClick={() => {
                  const url = window.location.href;
                  const text = `Check out my awesome Prepvio AI Interview Report! ${url}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 rounded-xl text-sm font-bold transition-colors"
                title="Share on WhatsApp"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                <span>WhatsApp</span>
              </button>

              <button 
                onClick={() => {
                  const url = window.location.href;
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20 rounded-xl text-sm font-bold transition-colors"
                title="Share on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </button>

              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-sm font-bold transition-colors shadow-sm"
                title="Download Report as PDF"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </section>
        </div>

        <footer className="text-center text-xs text-gray-300 pb-8">
          Generated by Prepvio AI · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </footer>
      </main>
    </div>
  );
}
