import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mainApi } from '../utils/apiClient';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  BookOpen,
  Heart,
  XCircle,
  Bookmark,
  Search,
  LayoutGrid,
  List,
  Filter,
  Play,
  Clock
} from 'lucide-react';
import MobileDashboardHeader from '../components/MobileDashboardHeader';



// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

const SavedCoursesPage = () => {
  const navigate = useNavigate();
  const { setMobileOpen } = useOutletContext();
  const [savedCourses, setSavedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchSavedCourses = async () => {
      try {
        const res = await mainApi.get('/users/watch-later');
        setSavedCourses(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch saved courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSavedCourses();
  }, []);

  const handleRemoveCourse = async (videoId) => {
    try {
      await mainApi.delete(`/users/watch-later/${videoId}`);
      setSavedCourses((prev) => prev.filter((v) => v.videoId !== videoId));
    } catch {
      alert("Failed to remove video");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    const diffDays = Math.floor(
      (Date.now() - new Date(dateString)) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(dateString).toLocaleDateString();
  };

  const filteredCourses = savedCourses.filter(course => {
    const title = course.title || "";
    const channelName = course.channelName || "";

    const search = searchQuery.toLowerCase();

    const searchMatch =
      title.toLowerCase().includes(search) ||
      channelName.toLowerCase().includes(search);

    const categoryMatch =
      !selectedCategory || course.category === selectedCategory;

    return searchMatch && categoryMatch;
  });


  const categories = ['All', ...new Set(savedCourses.map(course => course.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading saved videos...</p>
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
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              Saved Courses
              <Bookmark className="w-8 h-8 md:w-10 md:h-10 text-[#D4F478] fill-current" />
            </h1>
            <p className="text-gray-500 font-medium mt-2 text-lg">
              Your personal library of knowledge. {savedCourses.length} saved videos
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 shadow-sm"
              />
            </div>

            {categories.length > 1 && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={selectedCategory || 'All'}
                  onChange={e => setSelectedCategory(e.target.value === 'All' ? null : e.target.value)}
                  className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 shadow-sm appearance-none cursor-pointer"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content Grid */}
        <AnimatePresence mode="wait">
          {filteredCourses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-96 text-gray-500 bg-white rounded-[2.5rem] border border-gray-100"
            >
              <Search className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-bold text-gray-900">No results for "{searchQuery}"</p>
              <p className="text-sm">Try adjusting your search or filters.</p>
            </motion.div>
          ) : (
            <motion.div
              key={view}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={
                view === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {filteredCourses.map(course => (
                <motion.div
                  key={course.videoId}
                  variants={itemVariants}
                  layout
                  className={`
                    bg-white border border-gray-100 rounded-[2rem] p-4 relative group shadow-sm hover:shadow-xl transition-all duration-300
                    ${view === 'list' ? 'flex items-center gap-6' : 'flex flex-col'}
                  `}
                >
                  {/* Image */}
                  <div className={`
                    bg-gray-100 rounded-2xl overflow-hidden relative shrink-0
                    ${view === 'grid' ? 'w-full aspect-video mb-4' : 'w-32 h-32 md:w-48 md:h-32'}
                  `}>
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://source.unsplash.com/random/800x600/?coding,programming`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}

                    {/* Saved Date Badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-600 flex items-center gap-1.5 shadow-sm">
                      <Clock className="w-3 h-3" />
                      {formatDate(course.savedAt)}
                    </div>

                    {/* Floating Actions */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRemoveCourse(course.videoId)}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform text-gray-600 hover:text-red-500"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="mb-3 flex-1">
                      {course.category && (
                        <span className="inline-block px-3 py-1 rounded-full bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 border border-gray-100">
                          {course.category}
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">by {course.channelName}</p>
                    </div>

                    {/* Watch Button */}
                    <button
                      disabled={!course.channelId}
                      onClick={() =>
                        navigate(
                          `/${encodeURIComponent(course.channelName)}/${course.channelId}/${course.courseId}?video=${course.videoId}`
                        )
                      }
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all
                        ${course.channelId
                          ? "bg-[#1A1A1A] text-white hover:bg-black hover:scale-[1.02]"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }
                      `}
                    >
                      <Play className="w-4 h-4" />
                      Watch Now
                    </button>
                  </div>

                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default SavedCoursesPage;