import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { mainApi } from "../utils/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import MobileDashboardHeader from "../components/MobileDashboardHeader";
import {
  BookOpen,
  Play,
  Clock,
  CheckCircle,
  Trash2,
  RotateCcw,
  Code,
  Database,
  PenTool,
  Cpu,
  Layers,
  User,
  Zap
} from "lucide-react";

const BASE_URL = "/api";
const USER_API = "/api";

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemUpVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } },
};

// --- HELPER: GET ICON & COLOR BASED ON TOPIC ---
const getCourseStyle = (thumbnail) => {
  switch (thumbnail) {
    case "web-dev":
      return { icon: Code, bg: "bg-orange-100", text: "text-orange-600" };
    case "python":
      return { icon: Database, bg: "bg-blue-100", text: "text-blue-600" };
    case "design":
      return { icon: PenTool, bg: "bg-purple-100", text: "text-purple-600" };
    case "javascript":
      return { icon: Layers, bg: "bg-yellow-100", text: "text-yellow-700" };
    case "ml":
      return { icon: Cpu, bg: "bg-green-100", text: "text-green-600" };
    default:
      return { icon: BookOpen, bg: "bg-gray-100", text: "text-gray-600" };
  }
};

function Learning() {
  const navigate = useNavigate();
  const { setMobileOpen } = useOutletContext();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================================================
     FETCH COURSE + CHANNEL PROGRESS
  ========================================================= */
  useEffect(() => {
    const fetchLearning = async () => {
      try {
        const res = await mainApi.get("/users/my-learning");

        const data = (res.data.data || []).map((course) => {
          const percentage =
            course.totalSeconds > 0
              ? Math.min(
                Math.round(
                  (course.watchedSeconds / course.totalSeconds) * 100
                ),
                100
              )
              : 0;

          return {
            id: `${course.courseId}-${course.channelId}`,
            title: course.courseTitle,
            description: course.channelName,
            progress: percentage,
            lastAccessed: new Date(course.lastAccessed).toLocaleDateString(),
            completed: percentage >= 90,
            hasFeedback: course.hasFeedback,
            thumbnail: course.channelThumbnail || "default",
            duration: formatTime(course.totalSeconds),
            instructor: course.channelName,
            watchedSeconds: course.watchedSeconds,
            totalSeconds: course.totalSeconds,
            courseId: course.courseId,
            channelId: course.channelId,
            lastVideoId: course.lastVideoId
          };
        });

        setCourses(data);
      } catch (err) {
        console.error("Failed to load learning data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLearning();
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */
  const formatTime = (seconds = 0) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const inProgressCount = courses.filter(c => !c.completed).length;
  const completedCount = courses.filter(c => c.completed).length;

  /* =========================================================
     ACTIONS
  ========================================================= */
  const handleResumeCourse = (course) => {
    const url = course.lastVideoId
      ? `/course/${course.channelId}/${course.courseId}?video=${course.lastVideoId}`
      : `/course/${course.channelId}/${course.courseId}`;
    navigate(url);
  };

  const handleRemoveCourse = async (course) => {
    try {
      await axios.delete(`/api/users/course-progress/${course.courseId}/${course.channelId}`, { withCredentials: true });
      setCourses(courses.filter(c => c.id !== course.id));
    } catch (err) {
      console.error("Failed to remove course", err);
      alert("Failed to remove course. Please try again.");
    }
  };

  const handleRestartCourse = (course) => {
    const url = `/course/${course.channelId}/${course.courseId}`;
    navigate(url);
  };

  /* =========================================================
     LOADING STATE
  ========================================================= */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading your learning...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] selection:text-black">
      {/* Mobile Header */}
      <MobileDashboardHeader setMobileOpen={setMobileOpen} />

      <div className="max-w-[1600px] mx-auto space-y-8 p-4 md:p-8">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
              My Learning
            </h1>
            <p className="text-gray-500 font-medium mt-2 text-lg">
              Pick up where you left off, bhidu!
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-white border border-gray-100 px-5 py-3 rounded-2xl shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">In Progress</p>
                <p className="text-xl font-black text-gray-900 leading-none">{inProgressCount}</p>
              </div>
            </div>
            <div className="bg-white border border-gray-100 px-5 py-3 rounded-2xl shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D4F478] text-black rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Completed</p>
                <p className="text-xl font-black text-gray-900 leading-none">{completedCount}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500 bg-white rounded-[2.5rem] border border-gray-100">
            <BookOpen className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-bold text-gray-900">No courses yet</p>
            <p className="text-sm">Time to start learning something new!</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {courses.map((course) => {
                const style = getCourseStyle(course.thumbnail);
                const Icon = style.icon;

                return (
                  <motion.div
                    key={course.id}
                    layout
                    variants={itemUpVariants}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
                  >
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-6">
                      {/* Course Thumbnail or Icon */}
                      {typeof course.thumbnail === 'string' && course.thumbnail.startsWith('http') ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-14 h-14 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${style.bg} ${style.text}`}>
                          <Icon className="w-7 h-7" />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRemoveCourse(course)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${course.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {course.completed ? "COMPLETED" : "IN PROGRESS"}
                        </span>
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {course.duration}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900  leading-tight group-hover:text-indigo-600 transition-colors">
                        {course.title}
                      </h3>
                      {/* <p className="text-sm text-gray-500 line-clamp-2">
                        {course.description}
                      </p> */}
                    </div>

                    {/* Progress & Footer */}
                    <div className="mt-auto space-y-4">
                      {/* Instructor Info */}
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
                          <User className="w-3 h-3" />
                        </div>
                        {course.instructor}
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-gray-400">{course.progress}% Complete</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${course.completed ? 'bg-[#D4F478]' : 'bg-[#1A1A1A]'}`}
                          />
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          if (course.completed && !course.hasFeedback) {
                            navigate(
                              `/dashboard/feedback?courseId=${course.courseId}&channelId=${course.channelId}`
                            );
                          } else {
                            handleRestartCourse(course); // Revise
                          }
                        }}
                        className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-[#1A1A1A] text-white hover:bg-black shadow-lg cursor-pointer"
                      >
                        {course.completed ? (
                          course.hasFeedback ? (
                            <> <RotateCcw className="w-4 h-4" /> Revise </>
                          ) : (
                            <> <Zap className="w-4 h-4" /> Give Feedback </>
                          )
                        ) : (
                          <> <Play className="w-4 h-4 fill-current" /> Continue Learning </>
                        )}
                      </button>


                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Learning;