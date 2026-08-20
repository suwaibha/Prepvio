import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Cpu,
  Monitor,
  Code2,
  Microscope,
  Brain,
  MessageSquare,
  Globe,
  Calculator,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../store/authstore.js";
import UserAvatar from "../../../../components/UserAvatar.jsx";

const categories = [
  {
    id: "engineering",
    name: "Engineering",
    icon: Cpu,
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50",
    subcategories: [
      "ECE",
      "Chemical",
      "Civil",
      "Mechanical",
      "Digital Electronics",
      "Basic Electronics",
      "Electronic Devices",
      "EEE",
      "Biochemical",
    ],
  },
  {
    id: "computer-science",
    name: "Computer Science",
    icon: Monitor,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    subcategories: ["General", "Database", "Networking"],
  },
  {
    id: "programming",
    name: "Programming",
    icon: Code2,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50",
    subcategories: ["Python", "C", "C++", "C#", "Java"],
  },
  {
    id: "biology",
    name: "Biology",
    icon: Microscope,
    color: "from-green-500 to-lime-500",
    bgColor: "bg-green-50",
    subcategories: ["Microbiology", "Biochemistry", "Biotechnology"],
  },
  {
    id: "reasoning",
    name: "Reasoning",
    icon: Brain,
    color: "from-purple-500 to-violet-500",
    bgColor: "bg-purple-50",
    subcategories: ["Logical", "Verbal Reasoning", "Non-Verbal"],
  },
  {
    id: "verbal",
    name: "Verbal",
    icon: MessageSquare,
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-50",
    subcategories: ["Verbal Ability"],
  },
  {
    id: "general-knowledge",
    name: "General Knowledge",
    icon: Globe,
    color: "from-amber-500 to-yellow-500",
    bgColor: "bg-amber-50",
    subcategories: ["General Knowledge"],
  },
  {
    id: "aptitude",
    name: "Aptitude",
    icon: Calculator,
    color: "from-indigo-500 to-blue-500",
    bgColor: "bg-indigo-50",
    subcategories: ["General", "Data Interpretation"],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

export default function AptitudeSubcategories() {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () =>
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  const handleDashboardClick = () => navigate("/dashboard");
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleCategoryClick = (catId) => {
    if (expandedCategory === catId) {
      // Collapse if same category clicked again
      setExpandedCategory(null);
    } else {
      setExpandedCategory(catId);
    }
    // Clear subcategory selection when switching categories
    setSelectedSubcategory(null);
    setSelectedCategory(null);
  };

  const handleSubcategorySelect = (catName, subName) => {
    setSelectedCategory(catName);
    setSelectedSubcategory(subName);
  };

  const handleContinue = () => {
    if (!selectedCategory || !selectedSubcategory) return;
    navigate(
      `/services/check-your-ability/aptitude/test?category=${encodeURIComponent(selectedCategory)}&subcategory=${encodeURIComponent(selectedSubcategory)}`
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] p-4 md:p-6 font-sans selection:bg-[#D4F478] selection:text-black flex items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none -z-50">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-gradient-to-b from-indigo-50 to-transparent rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-t from-emerald-50 to-transparent rounded-full blur-[120px] opacity-60" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-4xl bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3rem] shadow-2xl shadow-gray-200/50 p-8 md:p-14 space-y-8 relative overflow-hidden"
      >
        {/* Floating decoration */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-8 -right-8 w-32 h-32 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none"
        />

        {/* NAVIGATION BAR */}
        <div className="flex items-center justify-between mb-6 relative z-50">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-black font-bold transition-colors group cursor-pointer"
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="hidden sm:inline">Back</span>
          </button>

          {isAuthenticated && user ? (
            <div className="relative" ref={profileDropdownRef}>
              <UserAvatar
                image={
                  user.profilePic ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`
                }
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
                    <button
                      onClick={handleDashboardClick}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-gray-400" />{" "}
                      Dashboard
                    </button>
                    <div className="h-px bg-gray-100 my-1 mx-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-black text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="text-center space-y-3 relative z-10"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6 text-[#D4F478]" />
            </motion.div>
            <span className="text-sm font-bold uppercase tracking-widest text-gray-400">
              Aptitude Test
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-tight">
            Choose a Subject
          </h1>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 100 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="h-1.5 bg-[#D4F478] mx-auto rounded-full"
          />

          <p className="text-gray-500 text-lg leading-relaxed max-w-xl mx-auto font-medium pt-2">
            Select a category, then pick a subcategory to begin
          </p>
        </motion.div>

        {/* Category Accordion List */}
        <motion.div
          variants={itemVariants}
          className="space-y-3 relative z-10 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar"
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isExpanded = expandedCategory === cat.id;
            const hasSelection =
              selectedCategory === cat.name && selectedSubcategory;

            return (
              <motion.div
                key={cat.id}
                variants={itemVariants}
                className={`rounded-2xl border-2 transition-all overflow-hidden ${
                  isExpanded
                    ? "border-gray-300 bg-white shadow-lg"
                    : hasSelection
                      ? "border-[#D4F478] bg-white shadow-md shadow-[#D4F478]/10"
                      : "border-gray-200 bg-white/80 shadow-sm hover:border-gray-300"
                }`}
              >
                {/* Category Header (clickable) */}
                <button
                  onClick={() => handleCategoryClick(cat.id)}
                  className="w-full flex items-center gap-4 p-5 cursor-pointer group transition-colors"
                >
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl ${cat.bgColor} flex items-center justify-center relative overflow-hidden shrink-0`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-10`}
                    />
                    <Icon
                      className="w-6 h-6 text-gray-700 relative z-10"
                      strokeWidth={2}
                    />
                  </div>

                  {/* Name */}
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-gray-900">
                      {cat.name}
                    </h3>
                    {hasSelection && (
                      <p className="text-sm text-[#6B8F00] font-semibold mt-0.5">
                        Selected: {selectedSubcategory}
                      </p>
                    )}
                  </div>

                  {/* Badge + Chevron */}
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full mr-2">
                    {cat.subcategories.length}
                  </span>

                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </button>

                {/* Subcategory Chips (expandable) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1">
                        <div className="h-px bg-gray-100 mb-4" />
                        <div className="flex flex-wrap gap-2.5">
                          {cat.subcategories.map((sub) => {
                            const isActive =
                              selectedCategory === cat.name &&
                              selectedSubcategory === sub;

                            return (
                              <motion.button
                                key={sub}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  handleSubcategorySelect(cat.name, sub)
                                }
                                className={`
                                  px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer
                                  flex items-center gap-2
                                  ${
                                    isActive
                                      ? "bg-[#1A1A1A] text-white shadow-lg shadow-gray-300/40"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }
                                `}
                              >
                                {isActive && (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                {sub}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          variants={itemVariants}
          className="pt-6 border-t border-gray-200/50 flex justify-center relative z-10"
        >
          <motion.button
            whileHover={selectedSubcategory ? "hover" : {}}
            whileTap={selectedSubcategory ? "tap" : {}}
            onClick={handleContinue}
            disabled={!selectedSubcategory}
            className={`
              flex items-center gap-0 group cursor-pointer
              ${!selectedSubcategory ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <span
              className={`
                px-10 py-4 rounded-l-full font-bold text-lg shadow-xl z-10 relative
                ${
                  selectedSubcategory
                    ? "bg-[#1A1A1A] text-white shadow-gray-300/50"
                    : "bg-gray-300 text-gray-500"
                }
              `}
            >
              Start Test
            </span>
            <motion.span
              className={`
                w-14 h-[3.75rem] flex items-center justify-center rounded-r-full border-l-2 origin-left
                ${
                  selectedSubcategory
                    ? "bg-[#D4F478] border-[#1A1A1A] group-hover:bg-[#cbf060]"
                    : "bg-gray-200 border-gray-300"
                }
                transition-colors
              `}
              variants={{
                hover: { x: 5 },
                tap: { x: 0 },
              }}
            >
              <ArrowRight
                className={`w-6 h-6 transition-transform duration-300 ${
                  selectedSubcategory
                    ? "text-black group-hover:rotate-[-45deg]"
                    : "text-gray-500"
                }`}
              />
            </motion.span>
          </motion.button>
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-2 pt-2"
        >
          <div className="w-2 h-2 rounded-full bg-[#D4F478]" />
          <div
            className={`w-2 h-2 rounded-full transition-all ${
              expandedCategory ? "bg-[#D4F478]" : "bg-gray-300"
            }`}
          />
          <div
            className={`w-2 h-2 rounded-full transition-all ${
              selectedSubcategory ? "bg-[#D4F478]" : "bg-gray-300"
            }`}
          />
        </motion.div>
      </motion.div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
