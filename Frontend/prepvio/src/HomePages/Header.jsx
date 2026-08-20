// src/components/Header.js
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authstore";
import { Link as ScrollLink } from "react-scroll";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardModal } from "../Dashboard/DashBoardPage";
import socket from "../socket";
import { useNotificationStore } from "../store/notificationStore";
import { contentApi } from "../utils/apiClient";

import {
  Menu,
  Search,
  Bell,
  Volume2,
  VolumeX,
  LayoutDashboard,
  LogOut,
  X
} from 'lucide-react';

const Header = () => {
  // --- CORE STATE & LOGIC ---
  const [isMuted, setIsMuted] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // ✅ SEARCH STATE
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [courses, setCourses] = useState([]);

  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const headerRef = useRef(null);
  const searchInputRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // ✅ USE STORE - Only recent notifications for bell icon
  const {
    recentNotifications,
    unreadCount,
    fetchRecentNotifications,
    fetchUnreadCount,
    markAsRead,
  } = useNotificationStore();

  const getInitialsSeed = (fullName) => {
    if (!fullName) return "User";
    const parts = fullName.trim().split(" ");
    return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1]}`;
  };

  // ✅ INTERVIEW SEARCH ITEM (Always shown at top)
  const INTERVIEW_SEARCH_ITEM = {
    label: "Interview Practice",
    description: "AI-powered mock interviews",
    path: "/services/check-your-ability",
  };

  // ✅ FILTER COURSES BASED ON SEARCH
  const filteredCourses = search.length === 0
    ? courses
    : courses.filter((course) => {
      const name = course.name || course.title || "";
      return name.toLowerCase().includes(search.toLowerCase());
    });

  // ✅ FETCH COURSES ON MOUNT
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await contentApi.get("/courses");
        const data = res.data;

        const list = Array.isArray(data)
          ? data
          : (data && (data.courses || data.data)) || [];

        setCourses(list);
      } catch (err) {
        console.error("Header search courses fetch failed", err);
      }
    };

    fetchCourses();
  }, []);

  // ✅ FETCH RECENT NOTIFICATIONS AND SETUP SOCKET
  // ✅ FETCH RECENT NOTIFICATIONS ON MOUNT ONLY
  useEffect(() => {
    if (isAuthenticated) {
      fetchRecentNotifications();
      fetchUnreadCount();
    }
  }, [isAuthenticated]); // Remove fetchRecentNotifications and fetchUnreadCount from dependencies

  // --- EFFECTS ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setIsSearchVisible(false);
        setShowSuggestions(false);
        setSearch("");
        setIsMobileMenuOpen(false);
        setIsProfileDropdownOpen(false);
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) searchInputRef.current.focus();
  }, [isSearchVisible]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- HANDLERS ---
  const handleSearchClick = (e) => {
    e.preventDefault();
    setIsSearchVisible(true);
    setShowSuggestions(true); // 👈 Show suggestions immediately
  };

  const handleMuteClick = () => setIsMuted(!isMuted);

  const handleProfileClick = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);
  const handleDashboardClick = (e) => {
    e.preventDefault();
    setIsDashboardOpen(true);
    setIsProfileDropdownOpen(false);
  };
  const handleLogout = async () => {
    await logout();
    setIsProfileDropdownOpen(false);
    navigate("/");
  };

  // ✅ NEW: Navigate to notifications tab in dashboard
  const handleViewAllNotifications = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/dashboard/notifications');
    setIsNotificationOpen(false);
  };

  // ✅ NEW: Handle individual notification click - mark as read and navigate
  const handleNotificationClick = (notificationId) => {
    markAsRead(notificationId);
    navigate('/dashboard/notifications');
    setIsNotificationOpen(false);
  };

  return (
    <>
      <motion.nav
        ref={headerRef}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 px-4 md:px-10 py-4 ${isScrolled ? "bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] py-3" : "bg-transparent"
          }`}
      >
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">

          {/* 1. BRANDING - RESPONSIVE LOGOS */}
          <Link to="/" className="flex items-center gap-3 cursor-pointer group shrink-0">
            {/* ICON LOGO: Always visible (Square Icon) */}
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center overflow-hidden group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-black/20">
              <img
                className="w-full h-full object-cover"
                src="/newuilogo1.png"
                alt="Icon"
              />
            </div>

            {/* TEXT LOGO: Hidden on mobile, visible on Large screens (md and up) */}
            <div className="hidden md:block">
              <img
                className="h-10 w-auto object-contain"
                src="/prepvio (1).png"
                alt="PrepVio AI"
              />
            </div>
          </Link>

          {/* 2. ADAPTED CENTER NAV (The "Pill") */}
          {/* 2. ADAPTED CENTER NAV (The "Pill") */}
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-gray-500 bg-white/60 backdrop-blur-md px-6 py-2.5 rounded-full border border-white shadow-lg shadow-gray-200/50">
            <div className="relative flex items-center">
              <AnimatePresence mode="wait">
                {isSearchVisible ? (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="flex items-center gap-2 overflow-hidden"
                  >
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 150);
                      }}
                      placeholder="Search topics..."
                      className="w-40 bg-transparent border-none focus:ring-0 outline-none text-gray-900 placeholder-gray-400 text-xs"
                    />
                    <button
                      onClick={() => {
                        setIsSearchVisible(false);
                        setSearch("");
                        setShowSuggestions(false);
                      }}
                    >
                      <X className="w-3.5 h-3.5 text-gray-400 hover:text-black" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    onClick={handleSearchClick}
                    className="hover:text-black transition-colors p-1"
                  >
                    <Search className="w-4 h-4 cursor-pointer" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* ✅ SEARCH SUGGESTIONS DROPDOWN */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute top-full mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                  >
                    {/* 🔹 INTERVIEW (ALWAYS ON TOP) */}
                    <button
                      onClick={() => {
                        setShowSuggestions(false);
                        setSearch("");
                        setIsSearchVisible(false);

                        if (!isAuthenticated) {
                          navigate("/login");
                          return;
                        }

                        navigate(INTERVIEW_SEARCH_ITEM.path);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                      <div className="text-sm font-bold text-gray-900">
                        {INTERVIEW_SEARCH_ITEM.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {INTERVIEW_SEARCH_ITEM.description}
                      </div>
                    </button>

                    {/* 🔹 COURSES */}
                    {filteredCourses.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-gray-400">
                        No courses found
                      </div>
                    ) : (
                      filteredCourses.slice(0, 5).map((course) => (
                        <button
                          key={course._id}
                          onClick={() => {
                            setShowSuggestions(false);
                            setSearch("");
                            setIsSearchVisible(false);

                            if (!isAuthenticated) {
                              navigate("/login");
                              return;
                            }

                            navigate(`/services/learn-and-perform/${course._id}`);
                          }}
                          className="w-full px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {course.name || course.title}
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-4 w-px bg-gray-200"></div>

            <ScrollLink to="about" smooth={true} duration={600} offset={-80} className="cursor-pointer hover:text-black transition-all whitespace-nowrap">
              About
            </ScrollLink>
            <ScrollLink to="explore" smooth={true} duration={600} offset={-80} className="cursor-pointer hover:text-black transition-all whitespace-nowrap">
              Explore
            </ScrollLink>
            <ScrollLink to="faqs" smooth={true} duration={600} offset={-80} className="cursor-pointer hover:text-black transition-all whitespace-nowrap">
              FAQS
            </ScrollLink>

            <div className="flex items-center gap-4 pl-4 ml-2 border-l border-gray-200">
              {/* ✅ NOTIFICATION BELL ICON */}
              <div className="relative">
                <button
                  onClick={async () => {
                    if (isAuthenticated) {
                      setIsNotificationOpen(!isNotificationOpen);
                      if (!isNotificationOpen) {
                        await fetchRecentNotifications();
                      }
                    }
                  }}
                  className="relative hover:text-black transition-colors p-1"
                >
                  <Bell className="w-4 h-4 cursor-pointer" />

                  {isAuthenticated && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* ✅ NOTIFICATION DROPDOWN - ONLY SHOW IF AUTHENTICATED */}
                {isAuthenticated && isNotificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-100"
                  >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                      <span className="text-sm font-bold text-gray-900">Recent Notifications</span>
                      {recentNotifications.length > 0 && (
                        <button
                          onClick={handleViewAllNotifications}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          View All
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    {recentNotifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No recent notifications</p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {recentNotifications.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => handleNotificationClick(n._id)}
                            className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-colors ${n.isRead ? "bg-white" : "bg-blue-50/50"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                {n.title && (
                                  <p className={`text-sm font-bold mb-0.5 ${n.isRead ? "text-gray-700" : "text-gray-900"}`}>
                                    {n.title}
                                  </p>
                                )}
                                <p className={`text-sm ${n.isRead ? "text-gray-600" : "text-gray-700"}`}>
                                  {n.message}
                                </p>
                              </div>
                              {!n.isRead && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    {recentNotifications.length > 0 && (
                      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                        <button
                          onClick={handleViewAllNotifications}
                          className="text-xs font-bold text-gray-700 hover:text-gray-900 w-full text-center transition-colors"
                        >
                          See all notifications in Dashboard →
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* 3. AUTH SECTION */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative" ref={profileDropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 bg-white/80 border border-white shadow-sm pl-1 pr-3 py-1 rounded-full hover:shadow-md transition-all backdrop-blur-sm cursor-pointer"
                >
                  <img
                    src={user?.profilePic || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(getInitialsSeed(user?.name))}`}
                    alt="User"
                    className="h-8 w-8 rounded-full object-cover border border-gray-100"
                  />
                  <span className="font-bold text-sm text-gray-900 hidden sm:block">{user?.name?.split(" ")[0]}</span>
                </motion.button>

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
              <div className="flex items-center gap-3">
                <Link to="/login" className="hidden sm:block text-sm font-bold text-gray-900 px-4">
                  Sign In
                </Link>
                <Link to="/signup">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#1A1A1A] text-white px-7 py-3 rounded-full text-sm font-bold shadow-xl shadow-black/10 hover:bg-black transition-all"
                  >
                    Get Started
                  </motion.button>
                </Link>
              </div>
            )}

            {/* MOBILE TOGGLE */}
            <button
              className="md:hidden p-3 bg-white rounded-full shadow-md border border-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-5 h-5 text-gray-900" />
            </button>
          </div>
        </div>

        {/* MOBILE MENU OVERLAY */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/95 backdrop-blur-xl mt-4 rounded-3xl border border-gray-100 overflow-hidden shadow-2xl"
            >
              <div className="flex flex-col p-6 gap-4 font-bold text-gray-600">
                <Link to="/practice" onClick={() => setIsMobileMenuOpen(false)}>Practice</Link>
                <ScrollLink to="about" onClick={() => setIsMobileMenuOpen(false)}>About</ScrollLink>
                <ScrollLink to="explore" onClick={() => setIsMobileMenuOpen(false)}>Explore</ScrollLink>
                {!isAuthenticated && (
                  <Link to="/login" className="pt-4 border-t border-gray-100 text-black">Sign In</Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* DASHBOARD MODAL */}
      {isDashboardOpen && (
        <DashboardModal onClose={() => setIsDashboardOpen(false)} />
      )}

      {/* FIXED SPACER */}
      <div className="h-16 md:h-20" />
    </>
  );
};

export default Header;
