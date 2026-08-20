import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Target,
  BarChart3,
  BookOpen,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
const resultStyles = {
  Strong: {
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    indicator: 'bg-emerald-500',
  },
  Partial: {
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    indicator: 'bg-amber-400',
  },
  Weak: {
    badge: 'bg-rose-50 text-rose-700 border border-rose-200',
    indicator: 'bg-rose-500',
  },
};

const roundLabels = {
  intro: 'Introduction',
  transition: 'Pre-Technical',
  technical: 'Technical Deep-Dive',
  coding: 'Coding Challenge',
  final: 'Final Discussion',
  general: 'General',
};

// ----------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------
const ScoreRing = ({ score }) => {
  const safeScore = isNaN(score) ? 0 : Math.max(0, Math.min(100, Number(score)));
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  const ringColor =
    safeScore >= 75
      ? '#10b981' // emerald-500
      : safeScore >= 50
        ? '#f59e0b' // amber-500
        : '#f43f5e'; // rose-500

  return (
    <div className="relative flex items-center justify-center w-32 h-32 flex-shrink-0">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
        <circle cx="64" cy="64" r={radius} stroke="#f1f5f9" strokeWidth="10" fill="none" />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          stroke={ringColor}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <div className="flex items-start">
          <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{safeScore}</span>
          <span className="text-base font-bold text-slate-400 mt-1">%</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Score</span>
      </div>
    </div>
  );
};

const TopicCard = ({ topic, index, topicQuestions = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const total = topic.totalQuestions || 1;
  const strongPct = Math.round((topic.strong / total) * 100);
  const partialPct = Math.round((topic.partial / total) * 100);
  const weakPct = Math.round((topic.weak / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="flex flex-col mb-4">
        <h5 className="font-bold text-slate-800 text-base">{topic.name}</h5>
        <div className="flex justify-between items-center mt-0.5">
          <p className="text-xs font-semibold text-slate-500">{topic.totalQuestions} Questions</p>
          {topic.weakSubtopics && topic.weakSubtopics.length > 0 && (
            <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md font-bold truncate max-w-[150px]" title={`Needs work: ${topic.weakSubtopics.join(", ")}`}>
              Needs work: {topic.weakSubtopics.join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex mb-4">
        {strongPct > 0 && <div style={{ width: `${strongPct}%` }} className="bg-emerald-500 h-full border-r border-white/20 last:border-r-0" title={`Strong: ${topic.strong}`} />}
        {partialPct > 0 && <div style={{ width: `${partialPct}%` }} className="bg-amber-400 h-full border-r border-white/20 last:border-r-0" title={`Partial: ${topic.partial}`} />}
        {weakPct > 0 && <div style={{ width: `${weakPct}%` }} className="bg-rose-500 h-full border-r border-white/20 last:border-r-0" title={`Weak: ${topic.weak}`} />}
      </div>

      {/* Stats Breakdown */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Strong</span>
          <span className="text-sm font-bold text-emerald-600 block">{topic.strong}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Partial</span>
          <span className="text-sm font-bold text-amber-500 block">{topic.partial}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Weak</span>
          <span className="text-sm font-bold text-rose-600 block">{topic.weak}</span>
        </div>
      </div>

      {/* Questions Toggle */}
      {topicQuestions.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <span>{isExpanded ? 'Hide Questions' : 'View Questions Asked'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3 space-y-3"
              >
                {topicQuestions.map((qItem, qIdx) => {
                  const style = resultStyles[qItem.result] || resultStyles.Partial;
                  return (
                    <div key={qIdx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      {/* Header: subtopic + result badge */}
                      <div className="flex justify-between items-center px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {qItem.subtopic || "General"}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${style.badge}`}>
                          {qItem.result}
                        </span>
                      </div>

                      <div className="p-4 space-y-3">
                        {/* Question */}
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">📋 Question Asked</p>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                            {qItem.question || "—"}
                          </p>
                        </div>

                        {/* User's Answer */}
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">💬 Your Answer</p>
                          <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/50 rounded-lg p-2.5 border border-blue-100/60 italic">
                            {qItem.answer && qItem.answer !== "(no answer)" ? qItem.answer : <span className="text-slate-400 not-italic">No answer recorded.</span>}
                          </p>
                        </div>

                        {/* AI Feedback */}
                        {qItem.feedback && (
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">🤖 AI Feedback</p>
                            <p className={`text-xs leading-relaxed rounded-lg p-2.5 border font-medium ${
                              qItem.result === 'Strong'
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                : qItem.result === 'Partial'
                                ? 'bg-amber-50 border-amber-100 text-amber-800'
                                : 'bg-rose-50 border-rose-100 text-rose-800'
                            }`}>
                              {qItem.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

const RoundSummaryList = ({ rounds }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayRounds = isExpanded ? rounds : rounds.slice(0, 3);
  const hasMore = rounds.length > 3;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
      {displayRounds.map((item, i) => {
        const style = resultStyles[item.result] || resultStyles.Partial;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <div className="flex flex-col gap-1 min-w-0 pr-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {roundLabels[item.round] || item.round}
              </span>
              <span className="text-sm font-bold text-slate-800 truncate">{item.topic}</span>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${style.badge}`}>
              {item.result}
            </span>
          </motion.div>
        );
      })}

      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 mt-1 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          {isExpanded ? (
            <><ChevronUp className="w-4 h-4" /> Collapse</>
          ) : (
            <><ChevronDown className="w-4 h-4" /> Show {rounds.length - 3} More Rounds</>
          )}
        </button>
      )}
    </div>
  );
};

// ----------------------------------------------------------------
// Main ReportModal
// ----------------------------------------------------------------
const ReportModal = ({ isOpen, onClose, reportData }) => {
  const isLoading = isOpen && reportData === null;
  const hasError = reportData?.error;
  const report = !isLoading && !hasError ? reportData : null;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="report-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            key="report-panel"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-slate-50 w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 bg-white border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-inner">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Performance Report</h2>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">AI-Generated Analysis</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                aria-label="Close Modal"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">

              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />
                  <div className="text-center">
                    <p className="text-slate-900 font-extrabold text-xl">Analyzing Performance...</p>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Please wait while we generate your detailed report.</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {hasError && (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-5">
                  <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center border border-rose-100">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-900 font-extrabold text-xl">Analysis Failed</p>
                    <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto font-medium leading-relaxed">{reportData.error}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="mt-4 px-8 py-3.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md"
                  >
                    Close Report
                  </motion.button>
                </div>
              )}

              {/* Report Data */}
              {report && (
                <div className="max-w-3xl mx-auto space-y-8">

                  {/* Summary Dashboard Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Overall Score */}
                    <div className="flex items-center gap-6 bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm">
                      <ScoreRing score={report.overallScore} />
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Overall Score</p>
                        <h3 className="text-2xl font-black text-slate-800 mb-1.5 leading-tight">
                          {report.overallScore >= 75
                            ? 'Excellent Work! 🎉'
                            : report.overallScore >= 50
                              ? 'Solid Effort! 👍'
                              : 'Needs Improvement 📚'}
                        </h3>
                        <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                          Analyzed {report.roundSummary?.length || 0} questions across{' '}
                          {report.topics?.length || 0} topic{report.topics?.length !== 1 ? 's' : ''}.
                        </p>
                      </div>
                    </div>

                    {/* Focus Areas */}
                    {report.weakAreas?.length > 0 ? (
                      <div className="bg-rose-50/50 border border-rose-200/60 rounded-[1.5rem] p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-5 h-5 text-rose-600" />
                          <h4 className="text-base font-black text-rose-900">Focus Areas</h4>
                        </div>
                        <p className="text-xs text-rose-700/80 mb-4 font-semibold">
                          Prioritize these topics for next time:
                        </p>
                        <ul className="space-y-3 overflow-y-auto max-h-32 pr-2 custom-scrollbar">
                          {report.weakAreas.map((area, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0 mt-1.5" />
                              <span className="text-sm font-bold text-rose-800 leading-snug">{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-[1.5rem] p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h4 className="text-base font-black text-emerald-900 mb-1">Spot On!</h4>
                        <p className="text-sm text-emerald-700 font-medium px-4">
                          No major weak areas detected. Outstanding performance across all domains.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Metric Cards Section (Confidence, Communication, Technical) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                      { label: "Confidence", val: report?.metrics?.confidence ?? Math.round((report.overallScore || 0) * 0.9), color: "#3b82f6", bg: "bg-blue-50/50 border-blue-100", textCls: "text-blue-600", labelCls: "text-blue-900", barBg: "bg-blue-100" },
                      { label: "Communication", val: report?.metrics?.communication ?? Math.round((report.overallScore || 0) * 0.95), color: "#22c55e", bg: "bg-green-50/50 border-green-100", textCls: "text-green-600", labelCls: "text-green-900", barBg: "bg-green-100" },
                      { label: "Technical", val: report?.metrics?.technical ?? Math.round((report.overallScore || 0) * 0.85), color: "#f59e0b", bg: "bg-amber-50/50 border-amber-100", textCls: "text-amber-500", labelCls: "text-amber-900", barBg: "bg-amber-100" }
                    ].map((metric) => {
                      const labelState = metric.val >= 75 ? "Strong" : metric.val >= 50 ? "Needs improvement" : "Needs work";
                      return (
                        <div key={metric.label} className={`bg-white border rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between ${metric.bg}`}>
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
                  </div>

                  {/* Topic Breakdown */}
                  {report.topics?.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center gap-2.5 mb-4 px-1">
                        <BookOpen className="w-5 h-5 text-slate-800" />
                        <h4 className="text-lg font-black text-slate-800">Topic Breakdown</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {report.topics.map((t, i) => {
                          const topicQuestions = report.roundSummary?.filter(r => r.topic === t.name) || [];
                          return <TopicCard key={i} topic={t} index={i} topicQuestions={topicQuestions} />;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Round-wise Summary */}
                  {report.roundSummary?.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center gap-2.5 mb-4 px-1">
                        <MessageSquare className="w-5 h-5 text-slate-800" />
                        <h4 className="text-lg font-black text-slate-800">Round-by-Round Breakdown</h4>
                      </div>
                      <RoundSummaryList rounds={report.roundSummary} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Footer ──
            {!isLoading && !hasError && (
              <div className="flex-shrink-0 border-t border-slate-200 px-6 py-5 bg-white flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="px-8 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
                >
                  Continue to Dashboard
                </motion.button>
              </div>
            )} */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;
