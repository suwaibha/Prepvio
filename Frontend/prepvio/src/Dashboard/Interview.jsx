import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import MobileDashboardHeader from "../components/MobileDashboardHeader";
import MobileRestrictionModal from "../components/MobileRestrictionModal"; // ✅ ADD THIS
import { mainApi } from "../utils/apiClient";

import {
  FileText,
  BarChart,
  Calendar,
  Clock,
  Briefcase,
  List,
  Activity,
  X,
  Trash2,
  ExternalLink,
  Sparkles,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

import { useAuthStore } from '../store/authstore';
import UpgradeModal from '../components/UpgradeModal';

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
    year: 'numeric' 
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

const getCodingProblemCount = (problems = []) => (problems || []).length;

// Helper to get plan display name and color
const getPlanInfo = (planId) => {
  const plans = {
    'free': { name: 'Free', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    'monthly': { name: 'Basic', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    'premium': { name: 'Pro Access', color: 'bg-green-50 text-green-700 border-green-200' },
    'yearly': { name: 'Premium Plan', color: 'bg-orange-50 text-orange-700 border-orange-200' }
  };
  return plans[planId] || plans['free']; // Default to Free for old interviews without planId
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
        <h3 className="text-2xl font-black text-gray-900 mb-3">Delete Interview?</h3>
        <p className="text-sm text-gray-600 mb-8 leading-relaxed">
          This action cannot be undone. The interview and all its data will be permanently deleted.
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

const buildQuestionAnswerPairs = (messages = []) => {
  const pairs = [];
  let pendingQuestion = null;

  (messages || []).forEach((message) => {
    if (message.sender === 'AI' && message.text) {
      pendingQuestion = message.text;
      return;
    }

    if (message.sender === 'User' && pendingQuestion) {
      pairs.push({
        question: pendingQuestion,
        answer: message.text || 'No response recorded.',
      });
      pendingQuestion = null;
    }
  });

  return pairs;
};

const AnalysisModal = ({ interview, onClose, onDelete, onPreview, onViewReport, onViewAIReport }) => {
  const questionAnswerPairs = buildQuestionAnswerPairs(interview.messages || []);

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
          <h2 className="text-3xl font-black text-gray-900 leading-tight mb-2">{interview.role}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600 font-bold">
             <Briefcase className="w-4 h-4" />
             {interview.companyType}
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
               {formatDateTime(interview.startedAt)}
            </div>
            {interview.completedAt && (
              <div className="flex items-center gap-2 bg-white border-2 border-gray-100 px-4 py-2 rounded-xl shadow-sm">
                 <Clock className="w-4 h-4 text-[#D4F478]" /> 
                 {formatTime(interview.completedAt)}
              </div>
            )}
         </div>

         {/* Stats Grid */}
         <div className="bg-gradient-to-br from-[#D4F478]/10 to-[#D4F478]/5 border-2 border-[#D4F478]/20 p-6 rounded-[2rem]">
            <h3 className="font-black text-gray-900 flex items-center gap-2 mb-4 text-lg">
               <TrendingUp className="w-5 h-5 text-[#1A1A1A]" /> 
               Performance Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border-2 border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Messages</p>
                <p className="text-3xl font-black text-gray-900">{interview.messages?.length || 0}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border-2 border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Problems</p>
                <p className="text-3xl font-black text-[#1A1A1A]">{getCodingProblemCount(interview.solvedProblems)}</p>
              </div>
            </div>
         </div>

         {/* Questions & Answers */}
         {questionAnswerPairs.length > 0 && (
           <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-6 shadow-sm">
             <h3 className="font-black text-gray-900 mb-4 text-lg">Questions Asked & Your Answers</h3>
             <div className="space-y-4">
               {questionAnswerPairs.map((entry, index) => (
                 <div key={`${entry.question}-${index}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Question {index + 1}</p>
                   <p className="text-sm font-semibold text-gray-900 leading-relaxed">{entry.question}</p>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mt-3 mb-2">Your answer</p>
                   <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{entry.answer}</p>
                 </div>
               ))}
             </div>
           </div>
         )}

         {/* Action Buttons */}
         <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPreview(interview)}
              disabled={!interview.messages || interview.messages.length === 0}
              className="w-full px-6 py-4 rounded-2xl font-bold bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-gray-200"
            >
              <ExternalLink className="w-5 h-5" />
              Preview Interview
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onViewReport(interview.reportUrl)}
              disabled={!interview.reportUrl}
              className="w-full px-6 py-4 rounded-2xl font-bold bg-[#D4F478] text-[#1A1A1A] hover:bg-[#cbf060] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              <FileText className="w-5 h-5" />
              View PDF Report
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onViewAIReport(interview)}
              className="w-full px-6 py-4 rounded-2xl font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors flex items-center justify-center gap-2 border-2 border-purple-200"
            >
              <Activity className="w-5 h-5" />
              View AI Report
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClose();
                onDelete(interview._id);
              }}
              className="w-full px-6 py-4 rounded-2xl font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border-2 border-red-100"
            >
              <Trash2 className="w-5 h-5" />
              Delete Interview
            </motion.button>
         </div>
      </div>
    </motion.div>
  </motion.div>
  );
};

const InterviewAnalysisPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [view, setView] = useState('list');
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { setMobileOpen } = useOutletContext();
  const [showMobileModal, setShowMobileModal] = useState(false); // ✅ ADD MOBILE MODAL STATE
  const terminationRemark = location.state?.terminated
    ? location.state?.terminationRemark || "Interviewee identity could not be verified"
    : null;

  // ✅ Check for mobile device on mount
  useEffect(() => {
    if (window.innerWidth < 768) {
      setShowMobileModal(true);
    }
  }, []);


  // Fetch interviews from backend
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const res = await mainApi.get("/interview-session/my");
        const data = res.data;
        if (data && Array.isArray(data.interviews)) {
          setInterviews(data.interviews);
        } else {
          setInterviews([]);
        }
      } catch (error) {
        console.error("Failed to fetch interviews:", error);
        alert("Failed to load interviews. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();

    window.addEventListener("focus", fetchInterviews);
    return () => window.removeEventListener("focus", fetchInterviews);
  }, []);

  const handlePreview = (interview) => {
    if (!interview) {
      alert("Interview data missing");
      return;
    }

    // ✅ Use the interview's session plan, not the user's current plan
    const sessionPlanId = interview.planId || 'free';
    
    // ✅ Check current user's plan to allow override
    const currentUserPlan = user?.subscription?.planId || 'free';
    const hasProAccess = currentUserPlan === 'premium' || currentUserPlan === 'yearly';

    // ✅ Free plan gets FULL ACCESS, Basic plan is BLOCKED from replay
    const isBasicSession = sessionPlanId === 'monthly';
    
    // Block Basic plan sessions from accessing interview replay (they only get PDF)
    // UNLESS the current user has Pro Access or higher
    if (isBasicSession && !hasProAccess) {
      setShowUpgradeModal(true);
      return;
    }

    // Free plan and paid plans (premium, yearly) can access replay
    localStorage.setItem(
      "interviewPreviewData",
      JSON.stringify({
        role: interview.role,
        companyType: interview.companyType,
        messages: interview.messages || [],
        solvedProblems: interview.solvedProblems || [],
        highlightClips: interview.highlightClips || [],
        startedAt: interview.startedAt,
        completedAt: interview.completedAt,
        timestamp: Date.now(),
      })
    );

    navigate(`/interview-preview?sessionId=${interview._id}`);
  };

  const openReport = (url) => {
    if (!url) {
      alert("Report not available for this interview yet.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openAIReport = async (interview) => {
    const state = useAuthStore.getState();
    const sessionId = interview._id;
    const meta = {
      candidateName: state.user?.name || "Candidate",
      role: interview.role,
      companyType: interview.companyType,
      date: interview.completedAt
        ? new Date(interview.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null
    };

    const openTab = (report) => {
      // Store in sessionStorage so the new tab can read it instantly
      sessionStorage.setItem(
        `prepvio_report_${sessionId}`,
        JSON.stringify({ report, meta })
      );
      window.open(`/interview-report?sessionId=${sessionId}`, '_blank', 'noopener,noreferrer');
    };

    // Fast path: already fetched
    if (interview.reportData) {
      openTab(interview.reportData);
      return;
    }

    try {
      const res = await mainApi.post(`/interview-session/${sessionId}/report`);
      const data = res.data;

      if (data.success && data.report) {
        // Cache locally
        setInterviews(prev => prev.map(i => i._id === sessionId ? { ...i, reportData: data.report } : i));
        setSelectedInterview(prev => prev?._id === sessionId ? { ...prev, reportData: data.report } : prev);
        openTab(data.report);
      } else {
        alert(data.message || 'AI Report not found for this session.');
      }
    } catch (err) {
      console.error('Failed to fetch AI report:', err);
      alert('Failed to load report. Please try again later.');
    }
  };

  const handleDeleteClick = (interviewId) => {
    setDeleteTarget(interviewId);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      await mainApi.delete(`/interview-session/${deleteTarget}`);

      setInterviews((prev) =>
        prev.filter((i) => i._id !== deleteTarget)
      );

      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete interview");
    } finally {
      setDeleting(false);
    }
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
          <p className="text-gray-600 text-lg font-bold">Loading interviews...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] selection:text-black p-4 md:p-8 relative overflow-hidden">
      
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
              Interview Analysis
            </h1>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 100 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="h-1.5 bg-[#D4F478] rounded-full mb-4"
            />
            <p className="text-gray-500 font-medium text-lg">
              Deep dive into your past performance and track your growth.
            </p>
          </div>

          <div className="flex bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-1.5 shadow-md w-fit">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                view === 'list' 
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
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                view === 'timeline' 
                  ? 'bg-[#1A1A1A] text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Activity className="w-4 h-4" /> Timeline
            </motion.button>
          </div>
        </motion.div>

        {terminationRemark && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 rounded-[2rem] p-6 shadow-sm"
          >
            <p className="text-xs font-black uppercase tracking-widest text-red-500 mb-2">
              Interview Terminated
            </p>
            <h2 className="text-2xl font-black text-red-900">
              {terminationRemark}
            </h2>
          </motion.div>
        )}

        {/* Content Area */}
        {interviews.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/60 shadow-xl"
          >
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <p className="text-gray-900 text-2xl font-black mb-2">No interviews completed yet.</p>
            <p className="text-gray-500 text-base font-medium">
              Complete an interview to see your detailed reports here.
            </p>
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
                {interviews.map((interview) => (
                  <motion.div
                    key={interview._id}
                    variants={itemVariants}
                    whileHover={{ y: -8, scale: 1.02 }}
                    onClick={() => setSelectedInterview(interview)}
                    className="bg-white/90 backdrop-blur-sm p-7 rounded-[2.5rem] border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:border-[#D4F478]/30 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                  >
                    {/* Hover gradient */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#D4F478]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div className="w-14 h-14 bg-[#D4F478]/20 text-[#1A1A1A] rounded-2xl flex items-center justify-center border-2 border-[#D4F478]/30">
                        <FileText className="w-7 h-7" strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${getPlanInfo(interview.planId).color}`}>
                          {getPlanInfo(interview.planId).name} Plan
                        </span>
                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full border border-gray-200">
                          {formatDate(interview.startedAt)}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-[#1A1A1A] transition-colors relative z-10">
                      {interview.role}
                    </h3>
                    <p className="text-sm font-bold text-gray-500 mb-5 relative z-10">
                      {interview.companyType}
                    </p>

                    <div className="flex flex-wrap gap-2 relative z-10">
                      <span className="text-xs font-bold px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl border border-gray-200">
                        {interview.messages?.length || 0} messages
                      </span>
                      <span className="text-xs font-bold px-3 py-1.5 bg-[#D4F478]/20 text-gray-900 rounded-xl border border-[#D4F478]/30">
                        {getCodingProblemCount(interview.solvedProblems)} problems
                      </span>
                      {interview.reportUrl && (
                        <span className="text-xs font-bold px-3 py-1.5 bg-green-50 text-green-700 rounded-xl border border-green-200">
                          PDF ✓
                        </span>
                      )}
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
                {[...interviews]
                  .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
                  .map((interview) => (
                    <motion.div 
                      key={interview._id} 
                      variants={itemVariants}
                      className="relative"
                    >
                      {/* Timeline Dot */}
                      <motion.div 
                        whileHover={{ scale: 1.2 }}
                        className="absolute -left-9 md:-left-14 top-6 w-10 h-10 rounded-full bg-white border-4 border-[#D4F478] flex items-center justify-center z-10 shadow-lg"
                      >
                        <div className="w-3 h-3 bg-[#1A1A1A] rounded-full" />
                      </motion.div>

                      <motion.div 
                        whileHover={{ x: 4 }}
                        onClick={() => setSelectedInterview(interview)}
                        className="bg-white/90 backdrop-blur-sm p-6 rounded-[2rem] border-2 border-gray-100 shadow-md hover:shadow-xl hover:border-[#D4F478]/30 transition-all cursor-pointer"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                          <h3 className="text-lg font-black text-gray-900">{interview.role}</h3>
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getPlanInfo(interview.planId).color}`}>
                              {getPlanInfo(interview.planId).name}
                            </span>
                            <span className="text-xs font-bold text-gray-500">
                              {formatDateTime(interview.startedAt)} 
                              {interview.completedAt && ` • ${formatTime(interview.completedAt)}`}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 font-bold mb-4">
                          {interview.companyType}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-700 rounded-lg border border-gray-200">
                            {interview.messages?.length || 0} messages
                          </span>
                          <span className="text-xs font-bold px-3 py-1 bg-[#D4F478]/20 text-gray-900 rounded-lg border border-[#D4F478]/30">
                            {getCodingProblemCount(interview.solvedProblems)} problems
                          </span>
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
        {selectedInterview && (
          <AnalysisModal 
            interview={selectedInterview} 
            onClose={() => setSelectedInterview(null)}
            onDelete={handleDeleteClick}
            onPreview={handlePreview}
            onViewReport={openReport}
            onViewAIReport={openAIReport}
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

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Interview Replay"
      />

      <MobileRestrictionModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
      />

    </div>
  );
};

export default InterviewAnalysisPage;








// ----- actual correct working code -----
// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   Search,
//   FileText,
//   BarChart,
//   Calendar,
//   Clock,
//   Briefcase,
//   List,
//   Activity,
//   X,
//   Trash2,
//   ExternalLink
// } from 'lucide-react';

// // --- HELPER FUNCTIONS ---
// const formatDate = (dateString) => {
//   const date = new Date(dateString);
//   return date.toLocaleDateString('en-US', { 
//     month: 'short', 
//     day: 'numeric', 
//     year: 'numeric' 
//   });
// };

// const formatDateTime = (dateString) => {
//   const date = new Date(dateString);
//   return date.toLocaleDateString('en-US', { 
//     month: 'long', 
//     day: 'numeric', 
//     year: 'numeric' 
//   });
// };

// const formatTime = (dateString) => {
//   const date = new Date(dateString);
//   return date.toLocaleTimeString('en-US', { 
//     hour: 'numeric', 
//     minute: '2-digit',
//     hour12: true 
//   });
// };

// // --- ANIMATION VARIANTS ---
// const containerVariants = {
//   hidden: { opacity: 0 },
//   visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
// };

// const itemVariants = {
//   hidden: { opacity: 0, y: 20 },
//   visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
// };

// // --- COMPONENTS ---

// const ConfirmDeleteModal = ({ open, onCancel, onConfirm, loading }) => {
//   if (!open) return null;

//   return (
//     <motion.div 
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
//       onClick={onCancel}
//     >
//       <motion.div 
//         initial={{ scale: 0.9, y: 20, opacity: 0 }}
//         animate={{ scale: 1, y: 0, opacity: 1 }}
//         exit={{ scale: 0.9, y: 20, opacity: 0 }}
//         className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
//         onClick={e => e.stopPropagation()}
//       >
//         <h3 className="text-xl font-black text-gray-900 mb-2">Delete Interview?</h3>
//         <p className="text-sm text-gray-600 mb-6">
//           This action cannot be undone. The interview and all its data will be permanently deleted.
//         </p>
//         <div className="flex gap-3 justify-end">
//           <button
//             onClick={onCancel}
//             disabled={loading}
//             className="px-4 py-2 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={onConfirm}
//             disabled={loading}
//             className="px-4 py-2 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
//           >
//             {loading ? 'Deleting...' : 'Delete'}
//           </button>
//         </div>
//       </motion.div>
//     </motion.div>
//   );
// };

// const AnalysisModal = ({ interview, onClose, onDelete, onPreview, onViewReport }) => (
//   <motion.div 
//     initial={{ opacity: 0 }}
//     animate={{ opacity: 1 }}
//     exit={{ opacity: 0 }}
//     className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
//     onClick={onClose}
//   >
//     <motion.div 
//       initial={{ scale: 0.9, y: 20, opacity: 0 }}
//       animate={{ scale: 1, y: 0, opacity: 1 }}
//       exit={{ scale: 0.9, y: 20, opacity: 0 }}
//       className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
//       onClick={e => e.stopPropagation()}
//     >
//       {/* Modal Header */}
//       <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
//         <div>
//           <h2 className="text-2xl font-black text-gray-900 leading-tight">{interview.role} Interview</h2>
//           <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 font-medium">
//              <Briefcase className="w-4 h-4" />
//              {interview.companyType}
//           </div>
//         </div>
//         <button 
//           onClick={onClose}
//           className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
//         >
//           <X className="w-5 h-5 text-gray-600" />
//         </button>
//       </div>

//       {/* Modal Content */}
//       <div className="p-6 overflow-y-auto space-y-6">
//          {/* Metadata Row */}
//          <div className="flex gap-4 text-sm font-semibold text-gray-600 flex-wrap">
//             <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
//                <Calendar className="w-4 h-4" /> {formatDateTime(interview.startedAt)}
//             </div>
//             {interview.completedAt && (
//               <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
//                  <Clock className="w-4 h-4" /> {formatTime(interview.completedAt)}
//               </div>
//             )}
//          </div>

//          {/* Stats Grid */}
//          <div className="grid gap-4">
//             <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl">
//                <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
//                   <Activity className="w-5 h-5" /> Interview Statistics
//                </h3>
//                <div className="grid grid-cols-2 gap-3 mt-3">
//                  <div className="bg-white p-3 rounded-xl">
//                    <p className="text-xs font-semibold text-gray-500 mb-1">Messages</p>
//                    <p className="text-2xl font-black text-indigo-600">{interview.messages?.length || 0}</p>
//                  </div>
//                  <div className="bg-white p-3 rounded-xl">
//                    <p className="text-xs font-semibold text-gray-500 mb-1">Problems Solved</p>
//                    <p className="text-2xl font-black text-green-600">{interview.solvedProblems?.length || 0}</p>
//                  </div>
//                </div>
//             </div>
//          </div>

//          {/* Action Buttons */}
//          <div className="flex flex-col gap-3">
//             <button
//               onClick={() => onPreview(interview)}
//               disabled={!interview.messages || interview.messages.length === 0}
//               className="w-full px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//             >
//               <ExternalLink className="w-4 h-4" />
//               Preview Interview
//             </button>

//             <button
//               onClick={() => onViewReport(interview.reportUrl)}
//               disabled={!interview.reportUrl}
//               className="w-full px-4 py-3 rounded-xl font-bold bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//             >
//               <FileText className="w-4 h-4" />
//               View PDF Report
//             </button>

//             <button
//               onClick={() => {
//                 onClose();
//                 onDelete(interview._id);
//               }}
//               className="w-full px-4 py-3 rounded-xl font-bold bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
//             >
//               <Trash2 className="w-4 h-4" />
//               Delete Interview
//             </button>
//          </div>
//       </div>
//     </motion.div>
//   </motion.div>
// );

// const InterviewAnalysisPage = () => {
//   const [interviews, setInterviews] = useState([]);
//   const [view, setView] = useState('list');
//   const [selectedInterview, setSelectedInterview] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [deleteTarget, setDeleteTarget] = useState(null);
//   const [deleting, setDeleting] = useState(false);

//   // Fetch interviews from backend
//   useEffect(() => {
//     const fetchInterviews = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(
//           "/api/interview-session/my",
//           { credentials: 'include' }
//         );
//         const data = await res.json();
//         setInterviews(data.interviews || []);
//       } catch (error) {
//         console.error("Failed to fetch interviews:", error);
//         alert("Failed to load interviews. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchInterviews();

//     window.addEventListener("focus", fetchInterviews);
//     return () => window.removeEventListener("focus", fetchInterviews);
//   }, []);

//   const handlePreview = (interview) => {
//     if (!interview) {
//       alert("Interview data missing");
//       return;
//     }

//     localStorage.setItem(
//       "interviewPreviewData",
//       JSON.stringify({
//         role: interview.role,
//         companyType: interview.companyType,
//         messages: interview.messages || [],
//         solvedProblems: interview.solvedProblems || [],
//         highlightClips: interview.highlightClips || [],
//         startedAt: interview.startedAt,
//         completedAt: interview.completedAt,
//         timestamp: Date.now(),
//       })
//     );

//     window.open(`/interview-preview?sessionId=${interview._id}`, "_blank", "noopener,noreferrer");
//   };

//   const openReport = (url) => {
//     if (!url) {
//       alert("Report not available for this interview yet.");
//       return;
//     }
//     window.open(url, "_blank", "noopener,noreferrer");
//   };

//   const handleDeleteClick = (interviewId) => {
//     setDeleteTarget(interviewId);
//   };

//   const confirmDelete = async () => {
//     if (!deleteTarget) return;

//     try {
//       setDeleting(true);

//       await fetch(
//         `/api/interview-session/${deleteTarget}`,
//         { 
//           method: 'DELETE',
//           credentials: 'include'
//         }
//       );

//       setInterviews((prev) =>
//         prev.filter((i) => i._id !== deleteTarget)
//       );

//       setDeleteTarget(null);
//     } catch (err) {
//       console.error("Delete failed:", err);
//       alert("Failed to delete interview");
//     } finally {
//       setDeleting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-600 font-medium">Loading interviews...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans selection:bg-indigo-200 selection:text-indigo-900 p-4 md:p-8">
      
//       <div className="max-w-6xl mx-auto space-y-8">
        
//         {/* Header */}
//         <motion.div 
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="flex flex-col md:flex-row md:items-end justify-between gap-6"
//         >
//           <div>
//              <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight flex items-center gap-3">
//                Interview Analysis
//                <BarChart className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
//              </h1>
//              <p className="text-gray-500 font-medium mt-2 text-lg">
//                Deep dive into your past performance.
//              </p>
//           </div>

//           <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm w-fit">
//              <button
//                onClick={() => setView('list')}
//                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
//                  view === 'list' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
//                }`}
//              >
//                <List className="w-4 h-4" /> List
//              </button>
//              <button
//                onClick={() => setView('timeline')}
//                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
//                  view === 'timeline' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
//                }`}
//              >
//                <Activity className="w-4 h-4" /> Timeline
//              </button>
//           </div>
//         </motion.div>

//         {/* Content Area */}
//         {interviews.length === 0 ? (
//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm"
//           >
//             <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <p className="text-gray-600 text-lg font-bold">No interviews completed yet.</p>
//             <p className="text-gray-500 text-sm mt-2">
//               Complete an interview to see your reports here.
//             </p>
//           </motion.div>
//         ) : (
//           <AnimatePresence mode="wait">
//             {view === 'list' ? (
//               <motion.div 
//                 key="list"
//                 variants={containerVariants}
//                 initial="hidden"
//                 animate="visible"
//                 exit={{ opacity: 0 }}
//                 className="grid grid-cols-1 md:grid-cols-2 gap-6"
//               >
//                 {interviews.map((interview) => (
//                   <motion.div
//                     key={interview._id}
//                     variants={itemVariants}
//                     onClick={() => setSelectedInterview(interview)}
//                     className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
//                   >
//                     <div className="flex justify-between items-start mb-4">
//                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
//                           <FileText className="w-6 h-6" />
//                        </div>
//                        <span className="text-xs font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
//                           {formatDate(interview.startedAt)}
//                        </span>
//                     </div>
                    
//                     <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
//                       {interview.role} Interview
//                     </h3>
//                     <p className="text-sm font-medium text-gray-500 mb-4">
//                       {interview.companyType}
//                     </p>

//                     <div className="flex flex-wrap gap-2">
//                       <span className="text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
//                         {interview.messages?.length || 0} messages
//                       </span>
//                       <span className="text-xs font-bold px-2 py-1 bg-green-50 text-green-600 rounded-md border border-green-100">
//                         {interview.solvedProblems?.length || 0} problems
//                       </span>
//                       {interview.reportUrl && (
//                         <span className="text-xs font-bold px-2 py-1 bg-gray-50 text-gray-600 rounded-md border border-gray-100">
//                           PDF Available
//                         </span>
//                       )}
//                     </div>
//                   </motion.div>
//                 ))}
//               </motion.div>
//             ) : (
//               <motion.div 
//                 key="timeline"
//                 variants={containerVariants}
//                 initial="hidden"
//                 animate="visible"
//                 exit={{ opacity: 0 }}
//                 className="relative pl-8 md:pl-12 space-y-8 before:absolute before:left-3.5 md:before:left-7 before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-300"
//               >
//                 {[...interviews]
//                   .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
//                   .map((interview) => (
//                     <motion.div 
//                       key={interview._id} 
//                       variants={itemVariants}
//                       className="relative"
//                     >
//                       {/* Timeline Dot */}
//                       <div className="absolute -left-9 md:-left-14 top-6 w-8 h-8 rounded-full bg-white border-4 border-blue-200 flex items-center justify-center z-10 shadow-sm">
//                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
//                       </div>

//                       <div 
//                         onClick={() => setSelectedInterview(interview)}
//                         className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
//                       >
//                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
//                             <h3 className="text-lg font-bold text-gray-900">{interview.role} Interview</h3>
//                             <span className="text-xs font-bold text-gray-400">
//                                {formatDateTime(interview.startedAt)} 
//                                {interview.completedAt && ` • ${formatTime(interview.completedAt)}`}
//                             </span>
//                          </div>
//                          <p className="text-sm text-gray-500 font-medium mb-3">
//                             <span className="text-black">{interview.companyType}</span>
//                          </p>
//                          <div className="flex gap-2 flex-wrap">
//                            <span className="text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md">
//                              {interview.messages?.length || 0} messages
//                            </span>
//                            <span className="text-xs font-bold px-2 py-1 bg-green-50 text-green-600 rounded-md">
//                              {interview.solvedProblems?.length || 0} problems
//                            </span>
//                          </div>
//                       </div>
//                     </motion.div>
//                 ))}
//               </motion.div>
//             )}
//           </AnimatePresence>
//         )}

//       </div>

//       {/* Detail Modal */}
//       <AnimatePresence>
//         {selectedInterview && (
//           <AnalysisModal 
//             interview={selectedInterview} 
//             onClose={() => setSelectedInterview(null)}
//             onDelete={handleDeleteClick}
//             onPreview={handlePreview}
//             onViewReport={openReport}
//           />
//         )}
//       </AnimatePresence>

//       {/* Delete Confirmation Modal */}
//       <AnimatePresence>
//         {deleteTarget && (
//           <ConfirmDeleteModal
//             open={Boolean(deleteTarget)}
//             onCancel={() => setDeleteTarget(null)}
//             onConfirm={confirmDelete}
//             loading={deleting}
//           />
//         )}
//       </AnimatePresence>

//     </div>
//   );
// };

// export default InterviewAnalysisPage;
