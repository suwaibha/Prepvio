import React, { useEffect, useState, useRef } from "react";
import { mainApi, contentApi } from "../../utils/apiClient";
import { useNavigate } from "react-router-dom";
import { Star, Users, Clock, Search, ArrowRight, BookOpen, Code, Database, PenTool, Sparkles, ArrowLeft, LayoutDashboard, LogOut, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "../../components/UserAvatar.jsx";
import { useAuthStore } from "../../store/authstore.js";
import { CONTENT_API_URL, MAIN_API_URL } from "../../config/api";



// Animation for floating stickers
const floatVariants = {
  animate: {
    y: [0, -15, 0],
    rotate: [0, 10, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const floatReverseVariants = {
  animate: {
    y: [0, 15, 0],
    rotate: [0, -10, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 0.5,
    },
  },
};

function LearnAndPerform() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState(["All"]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  // Request Course Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestCourseName, setRequestCourseName] = useState("");
  const [requestCategory, setRequestCategory] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Sync user email when user data loads or changes
  useEffect(() => {
    if (user?.email) {
      setRequestEmail(user.email);
    }
  }, [user]);

  const handleOpenRequestModal = () => {
    setRequestCourseName(search);
    const defaultCat = selectedCategory !== "All" ? selectedCategory : (categories.find(c => c !== "All") || "");
    setRequestCategory(defaultCat);
    setRequestNotes("");
    setRequestSubmitted(false);
    setIsRequestModalOpen(false); // Reset open flag
    setTimeout(() => setIsRequestModalOpen(true), 50);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingRequest(true);
    
    const requestData = {
      courseName: requestCourseName,
      category: requestCategory,
      email: requestEmail,
      notes: requestNotes,
    };

    try {
      await mainApi.post("/course-request", requestData);
    } catch (err) {
      console.error("Course request submission failed:", err);
      // Fallback: save to localStorage to ensure no user data is lost
      try {
        const existingRequests = JSON.parse(localStorage.getItem("prepvio_course_requests") || "[]");
        existingRequests.push({ ...requestData, requestedAt: new Date().toISOString() });
        localStorage.setItem("prepvio_course_requests", JSON.stringify(existingRequests));
      } catch (storageErr) {
        console.error("Failed to save course request to localStorage:", storageErr);
      }
    } finally {
      setIsSubmittingRequest(false);
      setRequestSubmitted(true);
    }
  };

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

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const [coursesRes, categoriesRes] = await Promise.all([
          contentApi.get("/courses"),
          contentApi.get("/categories")
        ]);

        // 1. Handle Courses
        const coursesData = Array.isArray(coursesRes.data) 
            ? coursesRes.data 
            : (coursesRes.data.courses || coursesRes.data.data || []);
        
        setCourses(coursesData);

        // 2. Handle Categories (Matches Admin Logic)
        let rawCategories = [];
        const catResponse = categoriesRes.data;

        // Check various ways backend might send data
        if (Array.isArray(catResponse)) {
            rawCategories = catResponse;
        } else if (catResponse.data && Array.isArray(catResponse.data)) {
            rawCategories = catResponse.data;
        } else if (catResponse.categories && Array.isArray(catResponse.categories)) {
            rawCategories = catResponse.categories;
        }

        // Extract names
        const categoryNames = rawCategories.map((cat) => {
            return typeof cat === 'object' ? cat.name : cat;
        });

        const uniqueCategories = ["All", ...new Set(categoryNames.filter(Boolean))];
        setCategories(uniqueCategories);

      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ UPDATED FILTERING LOGIC (Matches Admin Panel)
  const filteredCourses = courses.filter((course) => {
    // 1. Search Logic
    const courseName = course.name || course.title || '';
    const matchesSearch = courseName.toLowerCase().includes(search.toLowerCase());

    // 2. Category Logic
    if (selectedCategory === "All") return matchesSearch;

    // ⬇️ THIS IS THE FIX FROM YOUR ADMIN CODE ⬇️
    // We check 'categoryId' first (Admin style), then fallback to 'category'
    const categoryObj = course.categoryId || course.category;
    
    // Extract the name safely
    const courseCategoryName = categoryObj?.name || "Uncategorized";

    // Compare
    const matchesCategory = courseCategoryName === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] selection:text-black relative overflow-x-hidden">
      
      {/* GLOBAL BACKGROUND BLOBS */}
      <div className="fixed inset-0 pointer-events-none -z-50">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-t from-pink-50 to-transparent rounded-full blur-[120px] opacity-60" />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-8 pb-20">

        {/* COMBINED NAVIGATION BAR - Back Button + User Avatar */}
        <div className="flex items-center justify-between mb-6 relative z-50">
          {/* Back to Home Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-black font-bold transition-colors group cursor-pointer"
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="hidden sm:inline">Back to Home</span>
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

        
        {/* HERO SECTION */}
        <div className="max-w-5xl mx-auto relative mb-16">
            <motion.div variants={floatVariants} animate="animate" className="absolute -top-6 -left-6 md:top-0 md:-left-12 z-20 hidden sm:block">
                <div className="bg-[#D4F478] p-4 rounded-2xl shadow-xl transform -rotate-12 border-2 border-black">
                    <Code className="w-6 h-6 md:w-8 md:h-8 text-black" />
                </div>
            </motion.div>

            <motion.div variants={floatReverseVariants} animate="animate" className="absolute top-1/2 -right-4 md:-right-12 z-20 hidden sm:block">
                <div className="bg-white p-4 rounded-2xl shadow-xl transform rotate-12 border-2 border-black">
                    <Database className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                </div>
            </motion.div>

            <motion.div variants={floatVariants} animate="animate" className="absolute -bottom-8 left-10 md:left-20 z-20 hidden sm:block">
                <div className="bg-pink-200 p-3 rounded-full shadow-xl transform rotate-6 border-2 border-white">
                    <PenTool className="w-5 h-5 md:w-6 md:h-6 text-pink-700" />
                </div>
            </motion.div>

             <div className="absolute top-10 right-10 z-20 opacity-60 pointer-events-none hidden md:block">
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                    <path d="M10,50 Q30,10 50,50 T90,50" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="80" cy="20" r="4" fill="#D4F478" />
                    <circle cx="20" cy="80" r="4" fill="#D4F478" />
                </svg>
            </div>

            <div className="bg-[#1A1A1A] rounded-[2rem] md:rounded-[3.5rem] p-8 md:p-12 text-center relative overflow-hidden shadow-2xl shadow-gray-900/20">
                <div className="absolute top-6 right-6 z-20 bg-red-500 text-white text-xs font-black uppercase tracking-widest py-1 px-3 rounded-full shadow-lg transform rotate-6 border border-red-400">
                    New Courses
                </div>

                <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none">
                    <img 
                        src="https://res.cloudinary.com/dknafbwlt/image/upload/v1756976555/samples/ecommerce/leather-bag-gray.jpg" 
                        alt="Background" 
                        className="w-full h-full object-cover grayscale"
                    />
                </div>
                
                <div className="relative z-10 space-y-6 md:space-y-8">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 mb-2">
                        <Sparkles className="w-4 h-4 text-[#D4F478]" />
                        <span className="text-xs font-bold text-gray-200 tracking-wide uppercase">AI-Powered Learning</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-[1.1] md:leading-[0.9] tracking-tight">
                        Your Prepvio <br />
                        <span className="text-gray-500 block mt-2 text-xl sm:text-2xl md:text-4xl">Dream Big. Learn Fast.</span>
                    </h1>
                    
                    <div className="relative max-w-lg mx-auto mt-6 md:mt-8 group">
                        <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-[#D4F478]/30 transition-colors duration-500" />
                        <div className="relative flex items-center bg-white rounded-full p-1.5 md:p-2 shadow-xl">
                            <div className="pl-4 md:pl-6 text-gray-400">
                                <Search className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <input
                                type="text"
                                placeholder="What to learn?"
                                className="flex-1 px-3 md:px-4 py-3 text-base md:text-lg font-medium text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none w-full min-w-0"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button className="bg-[#1A1A1A] text-white px-5 md:px-8 py-3 md:py-4 rounded-full font-bold hover:bg-black transition-colors flex items-center gap-2 text-sm md:text-base shrink-0 cursor-pointer">
                                Explore
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* CATEGORIES TABS */}
        <div className="mb-12 overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex justify-start md:justify-center gap-2 md:gap-3 min-w-max px-2">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 md:px-6 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-bold transition-all duration-300 border cursor-pointer ${
                            selectedCategory === category
                                ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-lg shadow-black/20 transform scale-105"
                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        )}
        
        {error && (
            <div className="text-center py-20 bg-red-50 rounded-[2.5rem] border border-red-100">
                <p className="text-red-600 font-bold">{error}</p>
            </div>
        )}

        {!loading && !error && filteredCourses.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm max-w-2xl mx-auto px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No courses found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search or category filter.</p>
                <button
                    onClick={handleOpenRequestModal}
                    className="mt-6 px-6 py-3 bg-[#1A1A1A] hover:bg-black text-[#D4F478] hover:text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto cursor-pointer"
                >
                    <Sparkles className="w-4 h-4" />
                    Request Course
                </button>
            </div>
        )}

        {/* COURSES GRID */}
        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
                {filteredCourses.map((course) => (
                    <CourseCard key={course._id} course={course} navigate={navigate} />
                ))}
            </AnimatePresence>
        </div>
      </div>

      {/* Request Course Modal */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
            onClick={() => setIsRequestModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-gray-100 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsRequestModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Background accent glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D4F478]/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-200/20 rounded-full blur-2xl pointer-events-none" />

              {!requestSubmitted ? (
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-[#D4F478]/10 rounded-2xl flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Request a New Course</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Can't find what you're looking for? Let us know what you want to learn, and we'll work on adding it!
                  </p>

                  <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">
                        Course Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={requestCourseName}
                        onChange={(e) => setRequestCourseName(e.target.value)}
                        placeholder="e.g. Next.js Masterclass"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4F478] focus:border-black font-semibold text-gray-900 transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">
                        Category / Subject *
                      </label>
                      <select
                        value={requestCategory}
                        onChange={(e) => setRequestCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4F478] focus:border-black font-semibold text-gray-900 transition-all cursor-pointer text-sm"
                      >
                        {categories.filter(c => c !== "All").map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="Other">Other / New Category</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={requestEmail}
                        onChange={(e) => setRequestEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4F478] focus:border-black font-semibold text-gray-900 transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">
                        What specifically do you want to learn? (Optional)
                      </label>
                      <textarea
                        rows="3"
                        value={requestNotes}
                        onChange={(e) => setRequestNotes(e.target.value)}
                        placeholder="Any specific topics, frameworks, or projects you want included..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4F478] focus:border-black font-semibold text-gray-900 transition-all resize-none text-sm"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsRequestModalOpen(false)}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors cursor-pointer text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingRequest}
                        className="flex-1 py-3 bg-[#1A1A1A] hover:bg-black text-[#D4F478] hover:text-white font-bold rounded-xl transition-all cursor-pointer text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingRequest ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Submit Request
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6 relative z-10"
                >
                  <div className="w-16 h-16 bg-[#D4F478]/20 text-black rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black animate-bounce">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Request Received!</h3>
                  <p className="text-gray-500 mb-6 text-sm">
                    Thank you for your request! We've saved your request for <strong className="text-gray-900">"{requestCourseName}"</strong> and will notify you at <strong className="text-gray-900">{requestEmail}</strong> once it's available.
                  </p>
                  <button
                    onClick={() => {
                      setIsRequestModalOpen(false);
                      setTimeout(() => setRequestSubmitted(false), 300);
                    }}
                    className="px-8 py-3 bg-[#1A1A1A] hover:bg-black text-[#D4F478] hover:text-white font-bold rounded-xl transition-all cursor-pointer w-full text-sm shadow-md"
                  >
                    Got it, thanks!
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Course Card Component
const CourseCard = ({ course, navigate }) => {
  // Safe Access to Category Name for Display
  const categoryName = course.categoryId?.name || course.category?.name || "General";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -8 }}
      onClick={() => navigate(`/services/learn-and-perform/${course._id}`)}
      className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:shadow-gray-200/50 border border-gray-100 cursor-pointer flex flex-col h-full group relative overflow-hidden"
    >
      <div className="relative h-48 md:h-52 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-white mb-5 flex items-center justify-center">
  {course.imageUrl ? (
    <img
      src={course.imageUrl}
      alt={course.name}
      className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = `https://placehold.co/400x300/F3F4F6/9CA3AF?text=${
          course.name ? course.name.substring(0, 2) : "CO"
        }`;
      }}
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <BookOpen className="w-12 h-12 text-gray-300" />
    </div>
  )}
        
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold text-gray-900">{course.rating ? course.rating.toFixed(1) : "4.5"}</span>
        </div>
        
        <div className="absolute bottom-4 left-4">
             <span className="px-3 py-1.5 bg-[#1A1A1A]/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/20">
                {categoryName}
            </span>
        </div>
      </div>

      <div className="px-2 pb-2 flex-1 flex flex-col">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
          {course.name || course.title}
        </h3>
        
        <div className="flex items-center gap-4 text-gray-400 text-xs font-medium mb-6">
            <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{course.students ? course.students.toLocaleString() : "500"} Students</span>
            </div>
             <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Self-paced</span>
            </div>
        </div>

        <button className="mt-auto w-full bg-gray-50 text-gray-900 py-3 md:py-4 rounded-xl font-bold text-sm hover:bg-[#D4F478] hover:text-black transition-all group/btn flex items-center justify-center gap-2 cursor-pointer">
            View Course
            <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

export default LearnAndPerform;






//backup code hai course ka 
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import { Star, Users, Clock, Search, ArrowRight } from "lucide-react";

// function LearnAndPerform() {
//   const [courses, setCourses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [search, setSearch] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const navigate = useNavigate();

//   const categories = [
//     "All",
//     "Programming",
//     "Data Science",
//     "Design",
//     "Networking",
//     "Management",
//     "Marketing",
//     "Cybersecurity",
//   ];

//   useEffect(() => {
//     window.scrollTo(0, 0);
//     const fetchCourses = async () => {
//       try {
//         const res = await axios.get("http://localhost:8000/api/courses");
//         setCourses(res.data);
//       } catch (err) {
//         console.error("Failed to load courses:", err);
//         setError("Failed to load courses. Please try again later.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchCourses();
//   }, []);

//   const filteredCourses = courses.filter((course) => {
//     const courseName = course.name || course.title || '';
//     const matchesSearch = courseName.toLowerCase().includes(search.toLowerCase());
//     const matchesCategory =
//       selectedCategory === "All" ||
//       (course.category || "Other") === selectedCategory;
//     return matchesSearch && matchesCategory;
//   });

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-slate-100 to-blue-300 font-sans p-1 md:p-1">
//       {/* Hero Section */}
//       <section className="relative w-full bg-cover bg-center  overflow-hidden">
//         <div
//           className="relative bg-cover bg-center h-[300px] flex items-center justify-center"
//           style={{
//             backgroundImage: `url('https://res.cloudinary.com/dknafbwlt/image/upload/v1756976555/samples/ecommerce/leather-bag-gray.jpg')`,
//           }}
//         >
//           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
//           <div className="relative z-10 container mx-auto px-6 py-16 text-white text-center">
//             <h1 className="text-4xl md:text-5xl font-bold leading-tight drop-shadow-lg">
//               YOUR PREPVIO
//             </h1>
//             <p className="mt-2 text-lg md:text-xl drop-shadow-md">
//               IT'S NEVER TOO LATE TO DREAM BIG
//             </p>

//             {/* Search Bar */}
//             <div className="mt-6 flex justify-center">
//               <div className="flex bg-white/80 backdrop-blur-md rounded-lg shadow-lg overflow-hidden w-11/12 md:w-3/4">
//                 <input
//                   type="text"
//                   placeholder="What do you want to learn..."
//                   className="flex-1 px-4 py-3 text-gray-700 focus:outline-none bg-transparent"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                 />
//                 <button className="px-6 bg-slate-900 text-white font-semibold hover:bg-indigo-600 flex items-center transition">
//                   <Search className="w-5 h-5 mr-2" /> Explore Courses
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Categories */}
//       <div className="container mx-auto px-6 mt-12 pb-12 min-h-[500px]">
//         <div className="flex flex-wrap justify-center gap-3 mb-10">
//           {categories.map((category) => (
//             <button
//               key={category}
//               onClick={() => setSelectedCategory(category)}
//               className={`px-4 py-2 rounded-full transition text-sm font-medium ${
//                 selectedCategory === category
//                   ? "bg-indigo-500 text-white shadow-md"
//                   : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//               }`}
//             >
//               {category}
//             </button>
//           ))}
//         </div>

//         {loading && <div className="text-center text-xl">Loading...</div>}
//         {error && <div className="text-center text-red-600">{error}</div>}
//         {!loading && !error && filteredCourses.length === 0 && (
//           <div className="text-center text-xl text-gray-500">
//             No courses found.
//           </div>
//         )}

//         {/* Courses Grid */}
//         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//           {filteredCourses.map((course) => (
//             <CourseCard key={course._id} course={course} navigate={navigate} />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// // Glassy Course Card
// const CourseCard = ({ course, navigate }) => {
//   return (
//     <div
//       className="group flex flex-col bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-2xl hover:shadow-indigo-200/50 hover:-translate-y-2 transition-all duration-300 overflow-hidden h-full cursor-pointer"
//       onClick={() => navigate(`/services/learn-and-perform/${course._id}`)}
//     >
//       {/* Image */}
//       <div className="relative h-56 overflow-hidden">
//         {course.imageUrl ? (
//           <img
//             src={course.imageUrl}
//             alt={course.name}
//             className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
//             onError={(e) => {
//               e.target.onerror = null;
//               e.target.src = `https://placehold.co/400x160/25396D/ffffff?text=${course.name.substring(
//                 0,
//                 10
//               )}`;
//             }}
//           />
//         ) : (
//           <div className="w-full h-full bg-slate-100 flex items-center justify-center">
//             <Clock className="w-12 h-12 text-slate-300" />
//           </div>
//         )}

//         {/* Category Badge */}
//         <div className="absolute top-4 left-4">
//           <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-slate-800 text-xs font-black uppercase tracking-wider rounded-lg shadow-sm">
//             {course.category || "General"}
//           </span>
//         </div>
//       </div>

//       {/* Content */}
//       <div className="flex flex-col flex-1 p-6">
//         <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
//           {course.name || course.title}
//         </h3>

//         {/* Stats */}
//         <div className="flex items-center gap-4 mb-6 mt-auto pt-2">
//           <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-2 py-1 rounded-md">
//             <Star className="w-4 h-4 fill-current" />
//             <span className="text-sm font-bold">
//               {course.rating ? course.rating.toFixed(1) : "0.0"}
//             </span>
//           </div>
//           <div className="flex items-center gap-1.5 text-slate-400">
//             <Users className="w-4 h-4" />
//             <span className="text-sm font-medium">
//               {course.students ? course.students.toLocaleString() : "0"} students
//             </span>
//           </div>
//         </div>

//         {/* Enroll Button */}
//         <button
//           onClick={(e) => {
//             e.stopPropagation();
//             navigate(`/services/learn-and-perform/${course._id}`);
//           }}
//           className="w-full py-3.5 px-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-lg shadow-slate-900/10 hover:shadow-indigo-500/30"
//         >
//           Enroll Now
//           <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default LearnAndPerform;




// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import { Search, Star, Users, Clock } from "lucide-react";

// // Helper function to map level to badge color for the UI design
// const getLevelColor = (level) => {
//   if (!level) return "bg-gray-500";
  
//   switch (level.toLowerCase()) {
//     case "advanced":
//       return "bg-red-500";
//     case "intermediate":
//       return "bg-yellow-500";
//     case "beginner":
//       return "bg-green-500";
//     default:
//       return "bg-gray-500";
//   }
// };

// function LearnAndPerform() {
//   const [courses, setCourses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [search, setSearch] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const navigate = useNavigate();

//   // ✅ Hardcoded categories for now (backend later)
//   const categories = [
//     "All",
//     "Programming",
//     "Data Science",
//     "Design",
//     "Networking",
//     "Management",
//     "Marketing",
//     "Cybersecurity",
//   ];

//   useEffect(() => {
//     window.scrollTo(0, 0);

//     const fetchCourses = async () => {
//       try {
//         // --- KEEPING YOUR ORIGINAL BACKEND FETCH LOGIC ---
//         const res = await axios.get("http://localhost:8000/api/courses");
//         setCourses(res.data);
//       } catch (err) {
//         console.error("Failed to load courses:", err);
//         setError("Failed to load courses. Please try again later.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCourses();
//   }, []);

//   const filteredCourses = courses.filter((course) => {
//     // Assuming your backend course object uses 'name' for the title
//     const courseName = course.name || course.title || ''; 
//     const matchesSearch = courseName
//       .toLowerCase()
//       .includes(search.toLowerCase());
      
//     // Assuming your backend course object uses 'category'
//     const matchesCategory =
//       selectedCategory === "All" ||
//       (course.category || "Other") === selectedCategory;
      
//     return matchesSearch && matchesCategory;
//   });

//   return (
//     <div >
//       <section
//         className="relative w-full bg-cover bg-center rounded-3xl"
//         style={{ backgroundImage: "url('/hero section.png')" }}
//       >
//         <div
//           className="relative bg-cover bg-center h-[300px] flex items-center justify-center"
//           style={{
//             backgroundImage: `url('https://res.cloudinary.com/dknafbwlt/image/upload/v1756976555/samples/ecommerce/leather-bag-gray.jpg')`,
//           }}
//         >
//           <div className="absolute inset-0 bg-black opacity-60"></div>
//           <div className="relative z-10 container mx-auto px-6 py-16 text-white text-center">
//             <h1 className="text-4xl md:text-5xl font-bold leading-tight drop-shadow-lg">
//               YOUR PREPVIO
//             </h1>
//             <p className="mt-2 text-lg md:text-xl drop-shadow-md">
//               IT'S NEVER TOO LATE TO DREAM BIG
//             </p>

//             {/* SEARCH BAR - UNCHANGED */}
//             <div className="mt-6 flex justify-center">
//               <div className="flex bg-white rounded-lg shadow-lg overflow-hidden w-11/12 md:w-3/4">
//                 <input
//                   type="text"
//                   placeholder="What do you want to learn..."
//                   className="flex-1 px-4 py-3 text-gray-700 focus:outline-none"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                 />
//                 <button className="px-6 bg-gray-900 text-white font-semibold hover:bg-indigo-600 flex items-center transition">
//                   <Search className="w-5 h-5 mr-2" /> Explore Courses
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* POPULAR COURSES */}
//         <div className="container mx-auto px-6 mt-12 pb-12 min-h-[500px]">
        
//           {/* 📂 Category Buttons - UNCHANGED */}
//           <div className="flex flex-wrap justify-center gap-3 mb-10">
//             {categories.map((category) => (
//               <button
//                 key={category}
//                 onClick={() => setSelectedCategory(category)}
//                 className={`px-4 py-2 rounded-full transition text-sm font-medium ${
//                   selectedCategory === category
//                     ? "bg-indigo-500 text-white shadow-md"
//                     : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                 }`}
//               >
//                 {category}
//               </button>
//             ))}
//           </div>

//           {loading && <div className="text-center text-xl">Loading...</div>}
//           {error && <div className="text-center text-red-600">{error}</div>}
//           {!loading && !error && filteredCourses.length === 0 && (
//             <div className="text-center text-xl text-gray-500">
//               No courses found.
//             </div>
//           )}

//           {/* COURSE GRID - UPDATED UI MATCHING THE IMAGE */}
//           <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//             {filteredCourses.map((course) => (
//               <div
//                 key={course._id}
//                 className="bg-white/10 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer flex flex-col border border-white/20"
//                 onClick={() =>
//                   navigate(`/services/learn-and-perform/${course._id}`)
//                 }
//                 role="article"
//                 aria-label={`${course.name || 'Course'} by ${course.instructor || 'Anonymous Instructor'}`}
//               >
//                 {/* Image & Badges Section (Assumes course.imageUrl, course.level, course.category exist) */}
//                 <div className="relative h-48 flex-shrink-0">
//                   <img
//                     src={course.imageUrl || `https://placehold.co/400x160/25396D/ffffff?text=${course.name.substring(0, 10)}`}
//                     alt={`${course.name || 'Course'} - Learn ${course.category || 'online course'}`}
//                     loading="lazy"
//                     className="w-full h-full object-cover"
//                     onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x160/25396D/ffffff?text=${course.name.substring(0, 10)}`; }}
//                   />
//                   {/* Level Badge */}
//                   {course.level && (
//                     <span
//                       className={`absolute top-3 left-3 px-3 py-1 text-xs font-semibold text-white rounded-full shadow-lg ${getLevelColor(course.level)}`}
//                     >
//                       {course.level}
//                     </span>
//                   )}
//                   {/* Category Badge */}
//                   {course.category && (
//                     <span className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold text-white rounded-full bg-gray-800 shadow-lg">
//                       {course.category}
//                     </span>
//                   )}
//                 </div>

//                 {/* Content Section */}
//                 <div className="p-4 flex flex-col justify-between flex-grow bg-white/5 backdrop-blur-sm">
//                   {/* Title and Instructor (Assumes course.instructor and course.instructorAvatar exist) */}
//                   <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                     {course.name || course.title || "Course Title Missing"}
//                   </h3>
                  
//                   <div className="flex items-center text-sm text-gray-600 mb-3">
//                     <img 
//                       src={course.instructorAvatar || "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=20&h=20&fit=crop&crop=face"}
//                       alt={`${course.instructor || 'Anonymous Instructor'} profile picture`}
//                       loading="lazy"
//                       className="w-5 h-5 rounded-full object-cover mr-2"
//                     />
//                     <span className="text-xs">{course.instructor || "Anonymous Instructor"}</span>
//                   </div>


//                   {/* Stats Section (Assumes course.rating, course.students, course.duration exist) */}
//                   <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-200 pt-3 mb-4">
//                     {/* Rating */}
//                     <div className="flex items-center" aria-label={`Rating: ${course.rating ? course.rating.toFixed(1) : '0.0'} out of 5`}>
//                       <Star className="w-4 h-4 text-yellow-400 mr-1 fill-yellow-400" aria-hidden="true" />
//                       <span>{course.rating ? course.rating.toFixed(1) : '0.0'}</span>
//                     </div>
//                     {/* Students */}
//                     <div className="flex items-center" aria-label={`${course.students ? course.students.toLocaleString() : '0'} students enrolled`}>
//                       <Users className="w-4 h-4 text-indigo-500 mr-1" aria-hidden="true" />
//                       <span>{course.students ? course.students.toLocaleString() : '0'}</span>
//                     </div>
//                     {/* Duration */}
//                     <div className="flex items-center" aria-label={`Course duration: ${course.duration || '0h 0m'}`}>
//                       <Clock className="w-4 h-4 text-gray-500 mr-1" aria-hidden="true" />
//                       <span>{course.duration || '0h 0m'}</span>
//                     </div>
//                   </div>

//                   {/* Price and Enroll Button (Assumes course.price exists) */}
//                   <div className="flex justify-between items-center pt-2 mt-auto">
//                     <p className="text-2xl font-bold text-gray-900">
//                       ${course.price?.toFixed(2) || '0.00'}
//                     </p>
//                     <button
//                       // Prevents card navigation when clicking the button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         navigate(`/services/learn-and-perform/${course._id}`);
//                       }}
//                       className="px-5 py-2 bg-gradient-to-r from-blue-500/60 to-purple-500/60 backdrop-blur-md text-white rounded-lg font-semibold hover:from-blue-600/80 hover:to-purple-600/80 hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-300 text-sm border border-white/50"
//                       aria-label={`Enroll now in ${course.name || course.title || 'this course'}`}
//                     >
//                       Enroll Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }

// export default LearnAndPerform;






// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';


// function LearnAndPerform() {
//   const [service, setService] = useState(null);
//   const [courses, setCourses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const navigate = useNavigate();

//   useEffect(() => {
//     window.scrollTo(0, 0);

//     const fetchServiceAndCourses = async () => {
//       try {
//         // This is a placeholder as the backend doesn't have a /api/services route yet
//         // You would uncomment and modify this once you add that route to your Express app.
//         // const serviceRes = await axios.get('http://localhost:8000/api/services/learn-and-perform');
//         // setService(serviceRes.data);

//         // Fetch courses from the MERN backend you provided
//         const coursesRes = await axios.get('http://localhost:8000/api/courses');
//         setCourses(coursesRes.data);
//       } catch (err) {
//         console.error('Failed to load data:', err);
//         setError('Failed to load courses. Please try again later.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchServiceAndCourses();
//   }, []);

//   return (
//     <div className="bg-white text-black min-h-screen">
      

//       <main className="container mx-auto px-6 py-12 text-center mt-8">
//         <h1 className="text-5xl lg:text-6xl font-bold mb-6">Learn & Perform</h1>
//         <p className="text-lg text-gray-800">
//           Access expertly designed courses and practice interactively.
//         </p>
//       </main>

//       <section className="container mx-auto px-6 py-12">
//         {loading && <div className="text-center text-xl">Loading...</div>}
//         {error && <div className="text-center text-red-600">{error}</div>}
//         {!loading && !error && courses.length === 0 && (
//           <div className="text-center text-xl">No courses found.</div>
//         )}

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
//           {courses.map(course => (
//             <div
//               key={course._id}
//               className="bg-white border rounded-xl shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition-shadow"
//             >
              
//               {course.imageUrl && (
//                 <img
//                   src={course.imageUrl}
//                   alt={course.name}
//                   className="w-15 h-15 object-contain mb-4 rounded-xl"
//                 />
//               )}
//               <h2 className="text-2xl font-bold mb-2">{course.name}</h2>
//               <p className="text-gray-600 text-md mb-6">
//                 {course.description && course.description.length > 100
//                   ? course.description.substring(0, 100) + "..."
//                   : course.description}
//               </p>
              

//               <div className="flex gap-4">
//                 <button
//                   onClick={() => {
//                     const serviceSlug = 'learn-and-perform'; 
//                     navigate(`/services/${serviceSlug}/${course._id}`);
//                   }}
//                   className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
//                 >
//                   Start Learning
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>

      
//     </div>
//   );
// }

// export default LearnAndPerform;
