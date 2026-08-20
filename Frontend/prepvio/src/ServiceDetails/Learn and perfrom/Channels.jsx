import React, { useEffect, useState } from "react";
import { contentApi } from "../../utils/apiClient";
import { useParams, useNavigate } from "react-router-dom";
import { Columns, List, ExternalLink, PlayCircle, ArrowLeft, Sparkles, Youtube, Award, Zap, LayoutDashboard, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "../../components/UserAvatar.jsx";
import { useAuthStore } from "../../store/authstore.js";
import { CONTENT_API_URL } from "../../config/api";
import { useRef } from "react";


// --- ANIMATION VARIANTS ---
const floatVariants = {
    animate: {
        y: [0, -15, 0],
        rotate: [0, 10, 0],
        transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
    },
};

const floatReverseVariants = {
    animate: {
        y: [0, 15, 0],
        rotate: [0, -10, 0],
        transition: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
    },
};

// --- MAIN COMPONENT ---
function Channels() {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLandscapeMode, setIsLandscapeMode] = useState(false);
    const { courseId } = useParams();
    const navigate = useNavigate();

    const { user, logout, isAuthenticated } = useAuthStore();
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const profileDropdownRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const handleDashboardClick = () => {
        navigate("/dashboard");
        setIsProfileDropdownOpen(false);
    };

    const handleProfileClick = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // ✅ Color Theme Configuration
    const colorMap = [
        {
            ring: "ring-indigo-100",
            btn: "bg-[#1A1A1A] hover:bg-indigo-600 text-white",
            text: "text-indigo-600",
            bgLight: "bg-indigo-50",
            border: "border-indigo-100"
        },
        {
            ring: "ring-pink-100",
            btn: "bg-[#1A1A1A] hover:bg-pink-600 text-white",
            text: "text-pink-600",
            bgLight: "bg-pink-50",
            border: "border-pink-100"
        },
        {
            ring: "ring-emerald-100",
            btn: "bg-[#1A1A1A] hover:bg-emerald-600 text-white",
            text: "text-emerald-600",
            bgLight: "bg-emerald-50",
            border: "border-emerald-100"
        },
        {
            ring: "ring-purple-100",
            btn: "bg-[#1A1A1A] hover:bg-purple-600 text-white",
            text: "text-purple-600",
            bgLight: "bg-purple-50",
            border: "border-purple-100"
        },
    ];

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchChannels = async () => {
            try {
                const res = await contentApi.get(`/channels/course/${courseId}`);
                if (res.data && Array.isArray(res.data)) {
                    setChannels(res.data);
                } else {
                    setChannels([]);
                }
            } catch (err) {
                console.error("Failed to load channels:", err);
                setError("Failed to load channels. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchChannels();
    }, [courseId]);

    return (
        <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] selection:text-black relative overflow-x-hidden">

            {/* GLOBAL BACKGROUND BLOBS */}
            <div className="fixed inset-0 pointer-events-none -z-50">
                <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-[120px] opacity-60" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-t from-pink-50 to-transparent rounded-full blur-[120px] opacity-60" />
            </div>

            <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 pb-20">

                {/* COMBINED NAVIGATION BAR - Back Button + User Avatar */}
                <div className="flex items-center justify-between mb-8 relative z-50">
                    {/* BACK BUTTON */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-500 hover:text-black font-bold transition-colors group cursor-pointer"
                    >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                        <span className="hidden sm:inline">Back</span>
                    </button>

                    {/* User Avatar / Sign In Button */}
                    {isAuthenticated && user ? (
                        <div className="relative" ref={profileDropdownRef}>
                            <UserAvatar
                                image={user.profilePic || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                                name={user.name}
                                onClick={handleProfileClick}
                            />
                            <AnimatePresence>
                                {isProfileDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-56 bg-white/90 backdrop-blur-2xl border border-white rounded-[1.5rem] shadow-2xl overflow-hidden z-50 p-2"
                                    >
                                        <button onClick={handleDashboardClick} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                                            <LayoutDashboard className="w-4 h-4 text-gray-400" /> Dashboard
                                        </button>
                                        <div className="h-px bg-gray-100 my-1 mx-2"></div>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer">
                                            <LogOut className="w-4 h-4" /> Logout
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <button onClick={() => navigate('/login')} className="px-6 py-2 bg-black text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-colors">
                            Sign In
                        </button>
                    )}
                </div>

                {/* ✅ HERO SECTION */}
                <div className="max-w-5xl mx-auto relative mb-12">

                    {/* Floating Stickers (Hidden on Mobile for cleaner look) */}
                    <motion.div variants={floatVariants} animate="animate" className="absolute -top-6 -left-6 md:-top-4 md:-left-12 z-20 hidden lg:block">
                        <div className="bg-[#D4F478] p-4 rounded-2xl shadow-xl transform -rotate-12 border-2 border-black">
                            <PlayCircle className="w-6 h-6 text-black" />
                        </div>
                    </motion.div>

                    <motion.div variants={floatReverseVariants} animate="animate" className="absolute top-1/2 -right-4 md:-right-12 z-20 hidden lg:block">
                        <div className="bg-white p-4 rounded-2xl shadow-xl transform rotate-12 border-2 border-black">
                            <Youtube className="w-6 h-6 text-red-600" />
                        </div>
                    </motion.div>

                    <motion.div variants={floatVariants} animate="animate" className="absolute -bottom-8 left-10 md:left-20 z-20 hidden lg:block">
                        <div className="bg-purple-200 p-3 rounded-full shadow-xl transform rotate-6 border-2 border-white">
                            <Award className="w-5 h-5 text-purple-700" />
                        </div>
                    </motion.div>

                    {/* Scribble SVG */}
                    <div className="absolute top-10 right-10 z-20 opacity-60 pointer-events-none hidden md:block">
                        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                            <path d="M10,50 Q30,10 50,50 T90,50" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
                            <circle cx="80" cy="20" r="4" fill="#D4F478" />
                            <circle cx="20" cy="80" r="4" fill="#D4F478" />
                        </svg>
                    </div>

                    {/* HERO CARD */}
                    <div className="bg-[#1A1A1A] rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-14 text-center relative overflow-hidden shadow-2xl shadow-gray-900/20">
                        {/* Background Image Overlay */}
                        <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none">
                            <img
                                src="https://res.cloudinary.com/dknafbwlt/image/upload/v1756976555/samples/ecommerce/leather-bag-gray.jpg"
                                alt="Background"
                                className="w-full h-full object-cover grayscale"
                            />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 mb-2">
                                <Sparkles className="w-4 h-4 text-[#D4F478]" />
                                <span className="text-xs font-bold text-gray-200 tracking-wide uppercase">Curated Content</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] md:leading-[0.9] tracking-tight">
                                Featured Channels <br />
                                <span className="text-gray-500 block mt-2 text-lg sm:text-2xl md:text-3xl font-medium">Learn from the best creators.</span>
                            </h1>

                            {/* Layout Toggles */}
                            <div className="flex justify-center mt-8">
                                <div className="inline-flex bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                                    <button
                                        onClick={() => setIsLandscapeMode(false)}
                                        className={`p-3 rounded-full transition-all duration-300 ${!isLandscapeMode
                                                ? "bg-white text-black shadow-lg scale-105"
                                                : "text-gray-400 hover:text-white hover:bg-white/10"
                                            }`}
                                    >
                                        <Columns className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setIsLandscapeMode(true)}
                                        className={`p-3 rounded-full transition-all duration-300 ${isLandscapeMode
                                                ? "bg-white text-black shadow-lg scale-105"
                                                : "text-gray-400 hover:text-white hover:bg-white/10"
                                            }`}
                                    >
                                        <List className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LOADING & ERROR */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    </div>
                )}

                {error && (
                    <div className="text-center py-20 bg-red-50 rounded-[2.5rem] border border-red-100 max-w-3xl mx-auto">
                        <p className="text-red-600 font-bold">{error}</p>
                    </div>
                )}

                {!loading && !error && channels.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 max-w-3xl mx-auto px-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">No channels found</h3>
                        <p className="text-gray-500 mt-2">This course doesn't have any channels assigned yet.</p>
                    </div>
                )}

                {/* ✅ CHANNELS GRID - Responsive Wrapper */}
                <div className={`grid gap-6 max-w-5xl mx-auto ${isLandscapeMode ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
                    }`}>
                    <AnimatePresence>
                        {channels.map((channel, index) => (
                            <ChannelCard
                                key={channel._id}
                                channel={channel}
                                theme={colorMap[index % colorMap.length]}
                                isLandscapeMode={isLandscapeMode}
                                courseId={courseId}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// --- SCALABLE SUB-COMPONENT ---
const ChannelCard = ({ channel, theme, isLandscapeMode, courseId }) => {
    const navigate = useNavigate();

    // Helper function moved inside or passed as prop (kept simple here)
    const slugify = (text) => text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");

    const handleStartLearning = () => {
        navigate(`/${slugify(channel.name)}/${channel._id}/${courseId}`);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8, scale: 1.01 }}
            transition={{ duration: 0.3 }}
            className={`group relative bg-white rounded-[2.5rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:shadow-gray-200/50 border border-gray-100 flex flex-col ${isLandscapeMode ? 'md:flex-row md:items-center md:text-left' : 'items-center text-center'}`}
        >
            {/* Channel Logo */}
            {channel.imageUrl && (
                <div className={`flex-shrink-0 relative mb-6 ${isLandscapeMode ? 'md:mb-0 md:mr-8' : ''}`}>
                    {/* Glow Effect */}
                    <div className={`absolute -inset-4 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-2xl bg-gradient-to-tr from-current to-transparent ${theme.text}`} />

                    <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shadow-xl ring-4 ring-white group-hover:scale-105 transition-transform duration-500 relative z-10 bg-gray-50`}>
                        <img
                            src={channel.imageUrl}
                            alt={channel.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Verified Badge */}
                    <div className="absolute bottom-0 right-0 z-20 bg-blue-500 text-white p-1 rounded-full border-2 border-white shadow-sm">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                </div>
            )}

            {/* Content Container */}
            <div className="flex-1 min-w-0 z-10 w-full">
                <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-3 group-hover:text-black transition-colors leading-tight">
                    {channel.name}
                </h3>
                <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6 line-clamp-2 md:line-clamp-3">
                    {channel.description}
                </p>

                {/* Buttons Wrapper */}
                <div className={`flex flex-col sm:flex-row gap-3 w-full ${isLandscapeMode ? 'justify-center md:justify-start' : 'justify-center'}`}>
                    <button
                        onClick={handleStartLearning}
                        className={`inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 group/btn ${theme.btn} w-full sm:w-auto cursor-pointer`}
                    >
                        <PlayCircle className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                        Start Learning
                    </button>

                    <a
                        href={channel.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-sm border transition-all hover:-translate-y-0.5 ${theme.bgLight} ${theme.text} ${theme.border} hover:border-transparent w-full sm:w-auto`}
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Official Channel
                    </a>
                </div>
            </div>
        </motion.div>
    );
};

export default Channels;
