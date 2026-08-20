import React, { useState, useEffect, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lock, CheckCircle2, Star, Code2, Zap, Trophy, Award,
    X, Clock, Users, TrendingUp, Rocket, Target, Flame,
    ArrowRight, ExternalLink, FileText, Send, Sparkles
} from "lucide-react";
import axios from "axios";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAuthStore } from "../store/authstore";
import { mainApi } from "../utils/apiClient";
import MobileDashboardHeader from "../components/MobileDashboardHeader";
import { CONTENT_API_URL, MAIN_API_URL } from "../config/api";

// ==========================================
// 1. DATA SOURCE
// ==========================================

// Data will be fetched from API
const userProgressFallback = {
    totalXP: 0,
    currentLevel: 1,
    streak: 0,
    completedProjects: [],
    currentProject: 1,
};

const levelMessages = [
    "Ready to start your journey? 🚀",
    "First step taken! You're getting the hang of it 🛠️",
    "Building momentum! Your skills are growing fast 📈",
    "Leveling up! You're becoming a real developer 🧱",
    "Midpoint reached! Let's tackle the big ones 🏔️",
    "Expertise in sight! Your portfolio is looking sharp ✨",
    "Almost at the peak! The final challenge awaits 🏆",
    "Final Boss time! Show the world what you can do 💀",
    "Mastered! You are ready to launch your own legacy 💎"
];

// ==========================================
// 2. SUB-COMPONENTS
// ==========================================

const LockedCourseState = memo(({ courseName, courseSlug, onNavigateToCourse }) => {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] p-12 shadow-2xl text-center max-w-2xl"
            >
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Project Map Locked</h2>
                <p className="text-gray-600 font-medium text-lg mb-8 leading-relaxed">
                    Complete <span className="font-black text-[#D4F478]">{courseName}</span> to unlock this project roadmap and start building real-world applications!
                </p>
                <div className="bg-gray-50 rounded-2xl p-6 mb-8 inline-block">
                    <div className="flex items-center gap-3 text-gray-700">
                        <Rocket className="w-5 h-5 text-[#D4F478]" />
                        <span className="font-bold">Finish the course to unlock high-impact projects</span>
                    </div>
                </div>
                {courseSlug && (
                    <button
                        onClick={onNavigateToCourse}
                        className="px-8 py-4 bg-black text-white rounded-2xl font-black text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 mx-auto"
                    >
                        Go to Course <ArrowRight size={20} />
                    </button>
                )}
            </motion.div>
        </div>
    );
});

const CourseSelector = memo(({ courses, selectedCourse, onSelectCourse, completedCourses = [] }) => {
    const [showMotivationModal, setShowMotivationModal] = useState(false);
    const [attemptedCourse, setAttemptedCourse] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    if (courses.length === 0) return null;

    const handleCourseClick = (course) => {
        // Check if course is completed
        const isCompleted = completedCourses.some(c => c._id === course._id);

        if (!isCompleted) {
            // Show motivation modal
            setAttemptedCourse(course);
            setShowMotivationModal(true);
            setIsDropdownOpen(false);
        } else {
            // Allow selection
            onSelectCourse(course);
            setIsDropdownOpen(false);
        }
    };

    return (
        <>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/60 h-full flex items-center">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 whitespace-nowrap">SELECT COURSE:</span>

                    {/* Dropdown Selector - Compact Button */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="px-5 py-2.5 bg-[#D4F478] text-black rounded-xl font-bold text-sm transition-all flex items-center gap-3 shadow-sm hover:shadow-md whitespace-nowrap"
                        >
                            <span className="flex items-center gap-2">
                                {selectedCourse ? (
                                    <>
                                        {!completedCourses.some(c => c._id === selectedCourse._id) && (
                                            <Lock className="w-4 h-4 text-orange-500" />
                                        )}
                                        {selectedCourse.name}
                                    </>
                                ) : (
                                    'Choose a course...'
                                )}
                            </span>
                            <motion.div
                                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ArrowRight className="w-4 h-4 rotate-90" />
                            </motion.div>
                        </button>

                        {/* Dropdown Menu - Aligned to right since it's on the right side */}

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full right-0 min-w-[280px] mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                                >
                                    <div className="max-h-80 overflow-y-auto">
                                        {courses.map((course) => {
                                            const isCompleted = completedCourses.some(c => c._id === course._id);
                                            const isSelected = selectedCourse?._id === course._id;

                                            return (
                                                <button
                                                    key={course._id}
                                                    onClick={() => handleCourseClick(course)}
                                                    className={`w-full px-4 py-3 text-left transition-all flex items-center justify-between gap-3 ${isSelected
                                                        ? 'bg-[#D4F478] text-black font-black'
                                                        : isCompleted
                                                            ? 'hover:bg-gray-50 text-gray-700 font-semibold'
                                                            : 'hover:bg-orange-50 text-gray-400 font-medium'
                                                        }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        {!isCompleted && (
                                                            <Lock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                                        )}
                                                        {course.name}
                                                    </span>
                                                    {isSelected && (
                                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Enhanced Motivation Modal - Matching UI Dashboard Style */}
            <AnimatePresence>
                {showMotivationModal && attemptedCourse && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative overflow-hidden border border-gray-100"
                        >
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4F478]/10 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -ml-12 -mb-12" />

                            <div className="relative z-10">
                                {/* Close Button */}
                                <button
                                    onClick={() => setShowMotivationModal(false)}
                                    className="absolute top-0 right-0 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 group"
                                >
                                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                                </button>

                                {/* Icon Box */}
                                <div className="w-20 h-20 bg-[#1A1A1A] rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-200">
                                    <Lock className="w-9 h-9 text-[#D4F478]" />
                                </div>

                                {/* Title & Status */}
                                <div className="text-center mb-6">
                                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                                        Project Locked
                                    </h2>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        Access Denied • {attemptedCourse.name}
                                    </div>
                                </div>

                                {/* Motivational Box */}
                                <div className="bg-[#FDFBF9] rounded-2xl p-6 mb-8 border border-gray-100 relative group overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-8 h-8 bg-[#D4F478] rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                                <Sparkles className="w-4 h-4 text-black" />
                                            </div>
                                            <p className="text-gray-600 font-bold leading-relaxed text-sm">
                                                "Every project is a milestone. Complete your current course to unlock this build and showcase your skills to the world!"
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-wider bg-indigo-50/50 w-fit px-3 py-1.5 rounded-lg">
                                            <Flame className="w-3 h-3" />
                                            Keep Forging Your Skills 🚀
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                                        <Target size={80} />
                                    </div>
                                </div>

                                {/* Action Buttons - Brand Consistent */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => window.location.href = '/dashboard/learning'}
                                        className="w-full py-4 bg-[#D4F478] text-black rounded-2xl font-black text-base shadow-lg shadow-[#D4F478]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Rocket size={18} />
                                        Go to My Course
                                    </button>

                                    <button
                                        onClick={() => setShowMotivationModal(false)}
                                        className="w-full py-3.5 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all"
                                    >
                                        I'll Finish First
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
});

const StatsHeader = memo(({ xp = 0, level = 1, streak = 0, totalLevels = 0 }) => {
    const progress = totalLevels > 0 ? ((level - 1) / totalLevels) * 100 : 0;

    // Dynamic Rank and Achievement Logic - More robust for initial states
    const getRankInfo = (lvl, total) => {
        if (!total || total === 0) return { name: "Rookie", trend: "NEW", icon: Zap };

        const completedCount = lvl - 1;
        const ratio = completedCount / total;

        if (ratio < 0.25) return { name: "Novice", trend: "START", icon: Zap };
        if (ratio < 0.5) return { name: "Builder", trend: "RISING", icon: Target };
        if (ratio < 0.75) return { name: "Engineer", trend: "EXPERT", icon: Star };
        return { name: "Architect", trend: "TOP 5%", icon: Sparkles };
    };

    const rankInfo = getRankInfo(level, totalLevels);

    const statsData = [
        {
            label: "Total XP",
            value: xp.toLocaleString(),
            icon: Zap,
            iconStyle: "bg-[#D4F478] text-black",
            trend: xp > 1000 ? "Elite" : "Growing",
            trendStyle: "bg-green-50 text-green-600",
            trendIcon: Award,
            bgCircle: "bg-green-500"
        },
        {
            label: "Levels Completed",
            value: totalLevels > 0 ? `${level - 1}/${totalLevels}` : "0/0",
            icon: Target,
            iconStyle: "bg-blue-50 text-blue-600",
            trend: progress > 50 ? "Final Stretch" : "Pro-Active",
            trendStyle: "bg-blue-50 text-blue-600",
            trendIcon: TrendingUp,
            bgCircle: "bg-blue-500"
        },
        {
            label: "Learning Streak",
            value: `${streak} Days`,
            icon: Flame,
            iconStyle: "bg-orange-50 text-orange-600",
            trend: streak > 0 ? "🔥 Hot" : "Start Now",
            trendStyle: streak > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600",
            trendIcon: streak > 0 ? Zap : Clock,
            bgCircle: "bg-orange-500"
        },
        {
            label: "Your Rank",
            value: rankInfo.name,
            icon: Trophy,
            iconStyle: "bg-purple-50 text-purple-600",
            trend: rankInfo.trend,
            trendStyle: "bg-purple-50 text-purple-600",
            trendIcon: rankInfo.icon,
            bgCircle: "bg-purple-500"
        }
    ];

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-5xl mx-auto mb-8 will-change-transform"
        >
            {/* Stats Grid - Matching Main Dashboard Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -5, scale: 1.01 }}
                        className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between h-44 relative overflow-hidden group"
                    >
                        {/* Decorative Background Circle */}
                        <div className={`absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-5 pointer-events-none ${stat.bgCircle}`} />

                        <div className="flex justify-between items-start z-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${stat.iconStyle}`}>
                                <stat.icon className="w-7 h-7" />
                            </div>
                            <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${stat.trendStyle}`}>
                                <stat.trendIcon className="w-3 h-3" />
                                {stat.trend}
                            </div>
                        </div>

                        <div className="z-10 mt-auto pt-4">
                            <div className="text-3xl font-black text-gray-900 mb-1 tracking-tight leading-none">{stat.value}</div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
});

const PathLine = memo(({ status = "locked", height = 80, isBranch = false }) => {
    const getPathColor = () => {
        if (status === "completed") return "#D4F478";
        if (status === "current") return "#FCD34D";
        return "#D1D5DB";
    };

    if (!isBranch) {
        return (
            <div className="flex justify-center my-2" style={{ height: `${height}px` }}>
                <div className="relative" style={{ width: "4px" }}>
                    <svg width="4" height={height} className="absolute top-0 left-0">
                        <motion.line
                            x1="2" y1="0" x2="2" y2={height}
                            stroke={getPathColor()}
                            strokeWidth="4"
                            strokeDasharray="8 8"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.8 }}
                        />
                    </svg>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center my-4 relative" style={{ height: `${height}px` }}>
            <svg width="300" height={height} className="absolute">
                <motion.path
                    d={`M 150 0 Q 100 ${height / 2} 50 ${height}`}
                    stroke={getPathColor()} strokeWidth="4" strokeDasharray="8 8" fill="none"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8 }}
                />
                <motion.path
                    d={`M 150 0 Q 200 ${height / 2} 250 ${height}`}
                    stroke={getPathColor()} strokeWidth="4" strokeDasharray="8 8" fill="none"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8 }}
                />
            </svg>
        </div>
    );
});

const MergePath = memo(({ status = "locked", height = 80 }) => {
    const color = status === "completed" ? "#D4F478" : status === "current" ? "#FCD34D" : "#D1D5DB";
    return (
        <div className="flex justify-center my-4 relative" style={{ height: `${height}px` }}>
            <svg width="300" height={height} className="absolute">
                <motion.path
                    d={`M 50 0 Q 100 ${height / 2} 150 ${height}`}
                    stroke={color} strokeWidth="4" strokeDasharray="8 8" fill="none"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8 }}
                />
                <motion.path
                    d={`M 250 0 Q 200 ${height / 2} 150 ${height}`}
                    stroke={color} strokeWidth="4" strokeDasharray="8 8" fill="none"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8 }}
                />
            </svg>
        </div>
    );
});

const SubmissionModal = memo(({ project, onClose, onSubmit }) => {
    const [link, setLink] = useState("");
    const [notes, setNotes] = useState("");

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Rocket size={120} />
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Submit Build</h2>
                            <p className="text-gray-500 font-medium">Project: {project.title}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Deployed Project Link</label>
                            <div className="relative">
                                <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="url"
                                    placeholder="https://your-project.vercel.app"
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#D4F478] focus:border-transparent transition-all outline-none font-medium"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Development Notes (Optional)</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-4 text-gray-400" size={18} />
                                <textarea
                                    rows="4"
                                    placeholder="Briefly explain your tech choices or any challenges you solved..."
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#D4F478] focus:border-transparent transition-all outline-none font-medium resize-none"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => onSubmit({ link, notes })}
                            className="w-full py-4 bg-[#D4F478] text-black rounded-2xl font-black text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            Submit for Review <Send size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
});

const SaaSMotivationModal = memo(({ onClose }) => {
    const essentials = [
        { title: "Authentication", desc: "Secure login & user profiles", icon: <Users size={16} /> },
        { title: "Payment Integration", desc: "Stripe or PayPal for revenue", icon: <Rocket size={16} /> },
        { title: "Scalable Database", desc: "MongoDB or PostgreSQL", icon: <FileText size={16} /> },
        { title: "Landing Page", desc: "Convert visitors into users", icon: <Sparkles size={16} /> },
        { title: "Responsive Dashboard", desc: "Great UX on all devices", icon: <CheckCircle2 size={16} /> }
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                    <Rocket size={300} />
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Build Your Legacy 🚀</h2>
                            <p className="text-gray-500 font-medium text-lg">You've mastered the skills. Now, it's time to build for the world.</p>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-all"><X size={24} /></button>
                    </div>

                    <div className="bg-gradient-to-br from-[#D4F478]/10 to-transparent p-6 rounded-3xl border border-[#D4F478]/20 mb-10">
                        <p className="text-gray-700 font-semibold leading-relaxed">
                            "The best way to predict the future is to create it. You've completed the roadmap, and you're now a full-stack architect. Your SaaS journey starts today!"
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Required Implementation Essentials</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {essentials.map((item, i) => (
                                <div key={i} className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 group hover:border-[#D4F478] transition-all">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 group-hover:text-[#D4F478] transition-colors">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <div className="font-black text-sm text-gray-900">{item.title}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full mt-10 py-5 bg-black text-white rounded-[1.8rem] font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        I'm Ready to Build!
                    </button>
                </div>
            </motion.div>
        </div>
    );
});

const ReviewStatusModal = memo(({ onClose, onResubmit, submission }) => {
    const isRejected = submission?.status === "rejected";
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl text-center relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4F478]/5 to-blue-500/5 pointer-events-none" />

                <div className="relative z-10">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${isRejected ? 'bg-orange-100 text-orange-600' : 'bg-[#D4F478] text-black'}`}>
                        {isRejected ? <Flame size={32} /> : <Sparkles size={32} />}
                    </div>

                    <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
                        {submission?.status === "reviewed" ? "Review Complete" : isRejected ? "Project Needs Revision" : "Under Review"}
                    </h2>
                    <p className="text-gray-600 font-medium mb-8">
                        {submission?.status === "reviewed"
                            ? "Your project has been reviewed by our experts! Check out the feedback below."
                            : isRejected
                                ? "Project Rejected? No, it's just getting refined! Every great developer fails before they fly. You're almost there!"
                                : "Our experts are currently reviewing your project. We'll verify your code quality, UI/UX, and functionality."}
                    </p>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8 inline-block w-full">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-gray-500">Expert Feedback</span>
                            <span className={`text-xs font-black uppercase px-2 py-1 rounded-md ${submission?.status === "reviewed" ? "text-green-600 bg-green-50" : isRejected ? "text-red-500 bg-red-50" : "text-amber-500 bg-amber-50"
                                }`}>
                                {submission?.status === "reviewed" ? "Reviewed" : isRejected ? "Rejected" : "Pending"}
                            </span>
                        </div>
                        {submission?.status !== "pending" ? (
                            <div className="text-left text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-100">
                                {submission?.feedback || "Check your code and design patterns again. You can do this!"}
                            </div>
                        ) : (
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ x: [-100, 400] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    className="h-full w-1/3 bg-[#D4F478]"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        {isRejected && (
                            <button
                                onClick={onResubmit}
                                className="w-full py-4 bg-[#D4F478] text-black rounded-2xl font-black text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                Re-submit Project <Rocket size={20} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-black text-white rounded-2xl font-black text-lg shadow-lg hover:opacity-90 active:scale-95 transition-all"
                        >
                            {isRejected ? "Close" : "Great, Got It!"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
});

const ProjectNode = memo(({ project, onClick, submissions = [], position = "center", isFinal = false }) => {
    if (!project) return null;
    const [isHovered, setIsHovered] = useState(false);
    const { id, title, status, xp, difficulty, thumbnail } = project;
    const isFinalBoss = isFinal;

    const getNodeStyle = () => {
        switch (status) {
            case "completed": return "bg-white border-4 border-green-500 shadow-lg cursor-pointer";
            case "current": return "bg-gradient-to-br from-[#D4F478] to-yellow-300 border-4 border-yellow-400 shadow-xl cursor-pointer scale-110";
            default: return "bg-gray-200 border-4 border-gray-300 shadow-sm opacity-60 cursor-not-allowed grayscale";
        }
    };

    const nodeSize = isFinalBoss ? "w-48 h-48 md:w-56 md:h-56" : "w-32 h-32 md:w-40 md:h-40";
    const posClass = position === "left" ? "-translate-x-24 md:-translate-x-32" : position === "right" ? "translate-x-24 md:translate-x-32" : "";

    return (
        <div className={`flex justify-center ${posClass}`}>
            <motion.div
                whileHover={status !== "locked" ? { scale: isFinalBoss ? 1.05 : 1.15 } : {}}
                onClick={() => status !== "locked" && onClick(project)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`${nodeSize} ${getNodeStyle()} rounded-full flex items-center justify-center relative transition-all duration-300 overflow-hidden will-change-transform`}
            >
                {status === "current" && (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full border-4 border-[#D4F478]"
                    />
                )}

                {(status === "completed" || status === "current") && thumbnail && (
                    <div className="absolute inset-0 rounded-full overflow-hidden opacity-20 pointer-events-none">
                        <img src={thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                )}

                <div className={`relative z-10 ${status === "completed" || submissions.some(s => s.projectId === project._id) ? "text-green-500" : status === "current" ? "text-black" : "text-gray-400"}`}>
                    {isFinalBoss ? <Trophy size={48} /> : (status === "completed" || submissions.some(s => s.projectId === project._id)) ? <CheckCircle2 size={32} /> : status === "current" ? <Zap size={32} /> : <Lock size={32} />}
                </div>

                {!isFinalBoss && (
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-sm">
                        {id}
                    </div>
                )}

                <div className={`absolute top-0 right-0 px-2 py-1 rounded-full text-[10px] font-bold text-white shadow-sm ${difficulty === 'Hard' ? 'bg-orange-500' : difficulty === 'Expert' ? 'bg-red-500' : difficulty === 'Final Boss' ? 'bg-purple-600' : 'bg-green-500'}`}>
                    {difficulty}
                </div>

                <AnimatePresence>
                    {isHovered && status !== "locked" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap z-50 shadow-xl"
                        >
                            {title}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
});

const ProjectDetails = memo(({ project, onClose, onAction, submissions = [] }) => {
    if (!project) return null;
    const { title, description, difficulty, estimatedTime, xp, tech, thumbnail, rating, completionRate, impact, milestones, status, color, id } = project;

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 z-40 will-change-opacity"
            />
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 overflow-y-auto will-change-transform"
            >
                <div className="relative h-64">
                    <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent`} />
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"><X size={20} /></button>
                    <div className="absolute bottom-6 left-6 text-white">
                        <h2 className="text-3xl font-black mb-2 tracking-tight">{title}</h2>
                        <div className="flex gap-2">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{difficulty}</span>
                            <span className="bg-[#D4F478] text-black px-3 py-1 rounded-full text-xs font-bold">{xp} XP</span>
                        </div>
                    </div>
                </div>
                <div className="p-8 space-y-8">
                    <div><h3 className="text-lg font-bold mb-2">About Project</h3><p className="text-gray-600 leading-relaxed text-sm">{description}</p></div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center shadow-sm"><Star size={16} className="mx-auto mb-1 text-orange-400" /><div className="text-lg font-black">{rating}</div><div className="text-[10px] text-gray-400 uppercase font-bold">Rating</div></div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center shadow-sm"><Users size={16} className="mx-auto mb-1 text-blue-400" /><div className="text-lg font-black">{completionRate}%</div><div className="text-[10px] text-gray-400 uppercase font-bold">Success</div></div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center shadow-sm"><TrendingUp size={16} className="mx-auto mb-1 text-green-400" /><div className="text-lg font-black">Lvl {id}</div><div className="text-[10px] text-gray-400 uppercase font-bold">Rank</div></div>
                    </div>
                    <div><h3 className="text-lg font-bold mb-3">Milestones</h3><div className="space-y-3">{milestones.map((m, i) => (<div key={i} className="flex gap-3 items-center bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"><CheckCircle2 className="text-green-500 flex-shrink-0" size={18} /><span className="text-sm font-medium">{m}</span></div>))}</div></div>
                    <button
                        onClick={() => onAction(project)}
                        className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg ${status === 'completed' || submissions.some(s => s.projectId === project._id) ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-[#D4F478] to-yellow-400 text-black'}`}
                    >
                        {submissions.some(s => s.projectId === project._id) ? 'See Status/Feedback' : 'Complete & Submit'}
                    </button>
                </div>
            </motion.div>
        </>
    );
});

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================

export default function ProjectLearningMap() {
    const [projects, setProjects] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [isCourseCompleted, setIsCourseCompleted] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [userStats, setUserStats] = useState(userProgressFallback);
    const [selectedProject, setSelectedProject] = useState(null);
    const [activeModal, setActiveModal] = useState(null); // 'submission', 'review', or 'saas'
    const [loading, setLoading] = useState(true);
    const [completedCourses, setCompletedCourses] = useState([]);
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { setMobileOpen } = useOutletContext();

    // Check if user has premium access (Pro Access or Premium Plan)
    const hasPremiumAccess = () => {
        const planName = user?.subscription?.planName;
        return planName === "Pro Access" || planName === "Premium Plan";
    };

    // Determine if project map should be unlocked
    const isProjectMapUnlocked = () => {
        // Premium users (Pro Access or Premium Plan) get direct access
        if (hasPremiumAccess()) {
            return true;
        }
        // Basic/Free users need to complete the course
        return isCourseCompleted;
    };

    const fetchAllData = useCallback(async () => {
        try {
            // Fetch courses list from Admin Backend
            const coursesRes = await axios.get(`${CONTENT_API_URL}/courses`);
            const coursesData = coursesRes.data;
            setCourses(coursesData);

            // Select first course by default if none is selected, or update selectedCourse with fresh data
            let currentSelected = selectedCourse;
            if (coursesData.length > 0) {
                if (!selectedCourse) {
                    currentSelected = coursesData[0];
                    setSelectedCourse(currentSelected);
                } else {
                    const freshData = coursesData.find(c => c._id === selectedCourse._id);
                    if (freshData) {
                        currentSelected = freshData;
                        setSelectedCourse(freshData);
                    }
                }
            }

            // Fetch user's completed courses list from User Backend
            const completedCoursesRes = await mainApi.get(`/users/completed-courses`);
            const userCompletedCourses = completedCoursesRes.data?.completedCourses || [];
            setCompletedCourses(userCompletedCourses);

            if (currentSelected) {
                // Check if the selected course is marked as completed by user
                // Checks against both _id (course object) and courseId (progress object)
                const isCompleted = userCompletedCourses.some(
                    course => course._id === currentSelected._id || course.courseId === currentSelected._id
                );
                setIsCourseCompleted(isCompleted);

                // Fetch projects regardless of completion to get the roadmap count
                const projectsRes = await axios.get(`${CONTENT_API_URL}/projects/by-course/${currentSelected._id}`);
                const projectsFromServer = projectsRes.data || [];

                // Fetch Submissions to check progress
                const subRes = await mainApi.get(`/project-submissions/my-submissions`);
                const subData = subRes.data?.data || [];
                setSubmissions(subData);

                // Map project status based on reviewed submissions
                const mappedProjects = projectsFromServer.map((p, index) => {
                    const submission = subData.find(s => s.projectId === p._id);
                    let status = "locked";

                    if (submission) {
                        status = submission.status === "reviewed" ? "completed" : "current";
                    } else if (index === 0 || (projectsFromServer[index - 1] && subData.find(s => s.projectId === projectsFromServer[index - 1]._id && s.status === "reviewed"))) {
                        status = "current";
                    }

                    return { ...p, id: p.order || index + 1, status };
                });

                setProjects(mappedProjects);

                // Calculate User Stats
                const reviewedSubmissions = subData.filter(s =>
                    s.status === "reviewed" && mappedProjects.some(mp => mp._id === s.projectId)
                );

                // Proper current level: Finding the first project that isn't completed
                let currentLvl = 1;
                for (let i = 0; i < mappedProjects.length; i++) {
                    const sub = subData.find(s => s.projectId === mappedProjects[i]._id);
                    if (sub?.status === "reviewed") {
                        currentLvl = i + 2;
                    } else {
                        currentLvl = i + 1;
                        break;
                    }
                }
                if (currentLvl > mappedProjects.length + 1) currentLvl = mappedProjects.length + 1;

                const totalXP = reviewedSubmissions.reduce((acc, s) => {
                    const p = mappedProjects.find(pm => pm._id === s.projectId);
                    return acc + (p?.xp || 0);
                }, 0);

                setUserStats({
                    totalXP,
                    currentLevel: currentLvl,
                    streak: 0,
                    completedProjects: reviewedSubmissions.map(s => s.projectId),
                    currentProject: mappedProjects.find(p => p.status === "current")?._id
                });
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error("Failed to fetch roadmap data:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedCourse]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleCourseSelect = (course) => {
        setSelectedCourse(course);
        setProjects([]);
        setUserStats({
            totalXP: 0,
            currentLevel: 1,
            streak: 0,
            completedProjects: [],
            currentProject: null,
        });
        setLoading(true);
    };

    const handleAction = useCallback((project) => {
        const submission = submissions.find(s => s.projectId === project._id);
        if (submission) {
            setActiveModal('review');
        } else {
            setActiveModal('submission');
        }
    }, [submissions]);

    const handleProjectClick = useCallback((project) => {
        setSelectedProject(project);
    }, []);

    const handleCloseDetails = useCallback(() => {
        setSelectedProject(null);
    }, []);

    const handleSubmission = useCallback(async (data) => {
        if (!selectedProject) return;
        try {
            await mainApi.post(`/project-submissions/submit`, {
                projectId: selectedProject._id || selectedProject.id,
                projectTitle: selectedProject.title,
                link: data.link,
                notes: data.notes
            });

            setActiveModal(null);
            setSelectedProject(null);
            fetchAllData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to submit project");
        }
    }, [selectedProject, fetchAllData]);

    const getPathStatus = (fromOrder, toOrder) => {
        const from = projects.find(p => p.id === fromOrder);
        const to = projects.find(p => p.id === toOrder);
        if (!from || !to) return "locked";
        if (from.status === "completed" && to.status === "completed") return "completed";
        if (from.status === "completed") return "current";
        return "locked";
    };

    // Helper to get project by order
    const getProject = (index) => projects[index];

    return (
        <div className="min-h-screen bg-[#FDFBF9] font-sans text-gray-900 selection:bg-[#D4F478] selection:text-black">
            {/* Mobile Header */}
            <MobileDashboardHeader setMobileOpen={setMobileOpen} />

            <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
                <StatsHeader
                    xp={userStats.totalXP}
                    level={userStats.currentLevel}
                    streak={userStats.streak}
                    totalLevels={selectedCourse?.totalLevels || projects.length}
                />

                <div className="w-full max-w-5xl mx-auto mb-8 flex flex-col md:flex-row gap-4 items-stretch">
                    {/* Overall Progress Container */}
                    <div className="flex-[2] bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/60 flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-2 px-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Project Journey Progress</span>
                            <span className="text-sm font-black text-gray-900">
                                {Math.round(((selectedCourse?.totalLevels || projects.length) > 0 ? ((userStats.currentLevel - 1) / (selectedCourse?.totalLevels || projects.length)) * 100 : 0))}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(selectedCourse?.totalLevels || projects.length) > 0 ? ((userStats.currentLevel - 1) / (selectedCourse?.totalLevels || projects.length)) * 100 : 0}%` }}
                                className="h-full bg-black relative"
                            />
                        </div>
                    </div >

                    {/* Course Selector Container */}

                    < div className="flex-1 relative z-10" >
                        <CourseSelector
                            courses={courses}
                            selectedCourse={selectedCourse}
                            onSelectCourse={handleCourseSelect}
                            completedCourses={completedCourses}
                        />
                    </div >
                </div >

                {!isProjectMapUnlocked() ? (
                    <LockedCourseState
                        courseName={selectedCourse?.name || "this course"}
                        courseSlug={selectedCourse?.slug}
                        onNavigateToCourse={() => navigate(`/services/learn--perform/${selectedCourse._id}`)}
                    />
                ) : (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-xl relative will-change-transform"
                        >
                            <div className="text-center mb-12">
                                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">
                                    {userStats.currentLevel <= projects.length
                                        ? `Level ${userStats.currentLevel}: ${projects[userStats.currentLevel - 1]?.title}`
                                        : "Journey Completed! 🏆"
                                    }
                                </h1>
                                <p className="text-gray-500 text-lg font-medium">
                                    {userStats.currentLevel > projects.length
                                        ? levelMessages[levelMessages.length - 1]
                                        : userStats.currentLevel === projects.length && projects.length > 1
                                            ? levelMessages[32 - 25] // "Final Boss time!"
                                            : levelMessages[userStats.currentLevel - 1] || levelMessages[0]}
                                </p>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Rocket className="w-12 h-12 text-[#D4F478] animate-bounce" />
                                    <p className="text-gray-500 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Loading Journey...</p>
                                </div>
                            ) : projects.length === 0 ? (
                                <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                    <Rocket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-500">No Projects Available</h3>
                                    <p className="text-gray-400 max-w-xs mx-auto text-sm mt-2">Our team is preparing high-impact builds for you. Check back soon!</p>
                                </div>
                            ) : (
                                <div className="relative pb-10">
                                    {projects.map((project, index) => (
                                        <React.Fragment key={project._id || index}>
                                            {index > 0 && (
                                                <PathLine
                                                    status={getPathStatus(projects[index - 1].id, project.id)}
                                                    height={70}
                                                />
                                            )}
                                            <ProjectNode
                                                project={project}
                                                submissions={submissions}
                                                onClick={handleProjectClick}
                                                isFinal={index === projects.length - 1 && projects.length > 1}
                                            />
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}

                            {/* Completion Milestone - Only show when ALL projects are reviewed */}
                            {projects.length > 0 && submissions.filter(s => s.status === "reviewed").length === projects.length && (
                                <div className="mt-16 text-center bg-black text-white p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative z-10">
                                        <Trophy size={56} className="mx-auto mb-4 text-[#D4F478]" />
                                        <h2 className="text-3xl font-black mb-3">You've reached the peak!</h2>
                                        <p className="text-gray-400 mb-6 max-w-md mx-auto text-sm">Now it's time to build your own legacy. Your skills are ready for the real world.</p>
                                        <button
                                            onClick={() => setActiveModal('saas')}
                                            className="bg-[#D4F478] text-black px-8 py-3.5 rounded-full font-black hover:scale-105 transition-transform flex items-center gap-2 mx-auto shadow-lg shadow-[#D4F478]/10"
                                        >
                                            Start Your Own SaaS <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Legend */}
                            <div className="mt-16 flex flex-wrap justify-center gap-6 border-t border-gray-50 pt-10">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completed</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400" /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">In Progress</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-200" /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Locked</span></div>
                            </div>
                        </motion.div>

                        <AnimatePresence>
                            {selectedProject && <ProjectDetails project={selectedProject} submissions={submissions} onClose={handleCloseDetails} onAction={handleAction} />}
                        </AnimatePresence>

                        <AnimatePresence>
                            {activeModal === 'submission' && selectedProject && (
                                <SubmissionModal
                                    project={selectedProject}
                                    onClose={() => setActiveModal(null)}
                                    onSubmit={handleSubmission}
                                />
                            )}
                            {activeModal === 'review' && selectedProject && (
                                <ReviewStatusModal
                                    submission={submissions.find(s => s.projectId === selectedProject._id)}
                                    onClose={() => setActiveModal(null)}
                                    onResubmit={() => {
                                        setActiveModal('submission');
                                    }}
                                />
                            )}
                            {activeModal === 'saas' && (
                                <SaaSMotivationModal onClose={() => setActiveModal(null)} />
                            )}
                        </AnimatePresence>

                        <footer className="mt-12 text-center text-gray-400 pb-8">
                            <p className="font-bold text-[10px] tracking-[0.2em] uppercase mb-1">Build Better • Launch Faster</p>
                            <p className="text-[10px]">© 2024 Learning Journey Platform</p>
                        </footer>
                    </>
                )
                }
            </div>
        </div>
    );
}
