import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, BookOpen, MessageSquare, LayoutDashboard, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../store/authstore.js";
import UserAvatar from "../../../../components/UserAvatar.jsx";



const Categories = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = React.useRef(null);
  const isFreePlan = user?.subscription?.planId === "free";

  const hasCredits = user?.subscription?.interviewsRemaining > 0;

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);
  const handleDashboardClick = () => navigate('/dashboard');
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };



  const categories = [
    {
      id: "aptitude",
      name: "Aptitude",
      icon: BookOpen,
      description: "Test your logical reasoning and problem-solving skills",
      color: "from-blue-500 to-purple-500",
      bgColor: "bg-blue-50",
      hoverColor: "hover:bg-blue-100",
    },
    {
      id: "interview",
      name: "Interview",
      icon: MessageSquare,
      description: "Practice with AI-powered mock interviews",
      color: "from-pink-500 to-orange-500",
      bgColor: "bg-pink-50",
      hoverColor: "hover:bg-pink-100",
    },
  ];

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleContinue = () => {
    if (!selectedCategory) return;

    if (selectedCategory === "aptitude") {
      navigate("/services/check-your-ability/aptitude");
      return;
    }

    if (selectedCategory === "interview") {
      if (!hasCredits) {
        setShowUpgradeModal(true);
        return;
      }

      navigate("/services/check-your-ability/interview");
    }
  };



  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] p-6 font-sans selection:bg-[#D4F478] selection:text-black flex items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none -z-50">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-t from-pink-50 to-transparent rounded-full blur-[120px] opacity-60" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-4xl bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3rem] shadow-2xl shadow-gray-200/50 p-10 md:p-16 space-y-10 relative overflow-hidden"
      >
        {/* Floating decoration */}
        <motion.div
          animate={{
            y: [0, -12, 0],
            rotate: [0, 4, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-8 -right-8 w-32 h-32 bg-purple-200/40 rounded-full blur-3xl pointer-events-none"
        />

        {/* COMBINED NAVIGATION BAR - Back Button + User Avatar */}
        <div className="flex items-center justify-between mb-10 relative z-50">
          {/* Back Button */}
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

        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-3 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6 text-[#D4F478]" />
            </motion.div>
            <span className="text-sm font-bold uppercase tracking-widest text-gray-400">
              Choose Your Path
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-tight">
            Select a Category
          </h1>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 100 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="h-1.5 bg-[#D4F478] mx-auto rounded-full"
          />

          <p className="text-gray-500 text-lg leading-relaxed max-w-xl mx-auto font-medium pt-2">
            Pick the type of assessment you'd like to practice
          </p>
        </motion.div>

        {/* Category Cards */}
        <motion.div
          variants={itemVariants}
          className="grid md:grid-cols-2 gap-6 relative z-10"
        >
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;

            return (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCategorySelect(category.id)}
                className={`
                  relative p-8 rounded-3xl cursor-pointer border-3 transition-all
                  ${isSelected
                    ? "border-[#D4F478] bg-white shadow-xl shadow-[#D4F478]/20"
                    : "border-gray-200 bg-white/90 hover:border-gray-300 shadow-sm"
                  }
                `}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="selected-indicator"
                    className="absolute top-4 right-4 w-6 h-6 bg-[#D4F478] rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="w-3 h-3 bg-[#1A1A1A] rounded-full"
                    />
                  </motion.div>
                )}

                {/* Icon with gradient */}
                <div className={`w-16 h-16 rounded-2xl ${category.bgColor} flex items-center justify-center mb-4 relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10`} />
                  <Icon className="w-8 h-8 text-gray-700 relative z-10" strokeWidth={2} />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {category.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          variants={itemVariants}
          className="pt-8 border-t border-gray-200/50 flex justify-center relative z-10"
        >
          <motion.button
            whileHover={selectedCategory ? "hover" : {}}
            whileTap={selectedCategory ? "tap" : {}}
            onClick={handleContinue}
            disabled={!selectedCategory}
            className={`
              flex items-center gap-0 group cursor-pointer
              ${!selectedCategory ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <span
              className={`
                px-10 py-4 rounded-l-full font-bold text-lg shadow-xl z-10 relative
                ${selectedCategory
                  ? "bg-[#1A1A1A] text-white shadow-gray-300/50"
                  : "bg-gray-300 text-gray-500"
                }
              `}
            >
              Continue
            </span>
            <motion.span
              className={`
                w-14 h-[3.75rem] flex items-center justify-center rounded-r-full border-l-2 origin-left
                ${selectedCategory
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
                className={`w-6 h-6 transition-transform duration-300 ${selectedCategory
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
          className="flex items-center justify-center gap-2 pt-4"
        >
          <div
            className={`w-2 h-2 rounded-full transition-all ${selectedCategory ? "bg-[#D4F478]" : "bg-gray-300"
              }`}
          />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        </motion.div>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white/95 backdrop-blur-xl border-2 border-white/60 rounded-[2rem] p-10 max-w-lg w-full shadow-2xl shadow-gray-900/20 relative overflow-hidden"
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-pink-100 to-orange-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />

              <div className="relative z-10 text-center space-y-6">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-pink-200"
                >
                  <MessageSquare className="w-10 h-10 text-white" strokeWidth={2.5} />
                </motion.div>

                {/* Title */}
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                    {isFreePlan ? "Premium Feature" : "No Credits Remaining"}
                  </h3>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: 80 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="h-1 bg-[#D4F478] mx-auto rounded-full"
                  />
                </div>

                {/* Description - Dynamic based on reason */}
                <p className="text-gray-600 text-base leading-relaxed max-w-sm mx-auto font-medium">
                  {isFreePlan ? (
                    <>
                      You've used your free interview credit!
                      <span className="block mt-2 text-gray-900 font-semibold">
                        Upgrade now to get more interviews!
                      </span>
                    </>
                  ) : (
                    <>
                      You've used all your available credits for this billing period.
                      <span className="block mt-2 text-gray-900 font-semibold">
                        Upgrade your plan or purchase more credits to continue!
                      </span>
                    </>
                  )}
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 px-8 py-4 rounded-full border-2 border-gray-300 font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                  >
                    Go Back
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/dashboard/pricing")}
                    className="flex-1 px-8 py-4 rounded-full bg-[#1A1A1A] text-white font-bold hover:bg-[#2A2A2A] transition-all shadow-xl shadow-gray-300/50 relative overflow-hidden group"
                  >
                    <span className="relative z-10">{isFreePlan ? "Upgrade Now" : "Get Credits"}</span>
                    <motion.div
                      className="absolute inset-0 bg-[#D4F478]"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center font-bold text-black opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      {isFreePlan ? "Upgrade Now" : "Get Credits"}
                    </span>
                  </motion.button>
                </div>

                {/* Small feature hints */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-400 font-medium">
                    {isFreePlan
                      ? "✨ Unlock mock interviews & detailed feedback"
                      : "💳 Get more credits to continue practicing"
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Categories;