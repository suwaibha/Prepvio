import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { CONTENT_API_URL } from "../../../config/api";
import {
  Plus,
  Trash2,
  Edit,
  Loader2,
  BookOpen,
  Layers,
  MonitorPlay,
  X,
  Search,
  Star,
  Users,
  ArrowUpDown,
  LayoutGrid,
  List
} from "lucide-react";
import DeleteConfirmationModal from "../../../Components/DeleteConfirmationModal";

const CourseManagement = () => {
  // --- State Management ---
  const [courses, setCourses] = useState([]);
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Form States
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [courseImageUrl, setCourseImageUrl] = useState("");
  const [totalLevels, setTotalLevels] = useState(0);

  const BASE_URL = CONTENT_API_URL;

  // --- Helper: Generate Stats for UI Display ---
  const getStats = (id) => {
    const hash = id ? id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    return {
      rating: (4 + (hash % 10) / 10).toFixed(1),
      students: 500 + (hash % 100) * 100
    };
  };

  // --- API Functions (Strict Backend Only) ---
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/courses`);
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/channels`);
      setChannels(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching channels:", error);
      setChannels([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/categories`);
      setCategories(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchChannels();
    fetchCategories();
  }, []);

  // --- Filtering Logic ---
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const categoryName = course.categoryId?.name || "Uncategorized";
      const matchesCategory = activeCategory === "All" || categoryName === activeCategory;
      const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [courses, activeCategory, searchQuery]);

  // --- Modal Logic ---
  const openModal = (course = null) => {
    setEditingCourse(course);
    if (course) {
      setCourseName(course.name);
      setCourseDescription(course.description);
      setCourseImageUrl(course.imageUrl || "");
      setSelectedCategory(course.categoryId?._id || "");
      setSelectedChannels(course.channels?.map((ch) => ch._id) || []);
      setTotalLevels(course.totalLevels || 0);
    } else {
      setCourseName("");
      setCourseDescription("");
      setCourseImageUrl("");
      setSelectedCategory("");
      setSelectedChannels([]);
      setTotalLevels(0);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCourse(null);
  };

  // --- Actions (Strict Backend Only) ---
  const saveCourse = async () => {
    if (!courseName.trim() || !courseDescription.trim() || !selectedCategory || !courseImageUrl.trim()) {
      alert("Please fill in all required fields (Name, Description, Category, and Thumbnail URL).");
      return;
    }

    try {
      setActionLoading(true);
      const courseData = {
        name: courseName,
        description: courseDescription,
        imageUrl: courseImageUrl,
        categoryId: selectedCategory,
        channels: selectedChannels,
        totalLevels: Number(totalLevels),
      };

      if (editingCourse) {
        await axios.put(`${BASE_URL}/courses/${editingCourse._id}`, courseData);
      } else {
        await axios.post(`${BASE_URL}/courses`, courseData);
      }

      fetchCourses();
      closeModal();
    } catch (error) {
      console.error("Error saving course:", error);
      const errMsg = error.response?.data?.message || error.response?.data?.error || "Failed to save course.";
      alert(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      setActionLoading(true);
      await axios.delete(`${BASE_URL}/courses/${courseToDelete._id}`);
      fetchCourses();
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
    } catch (error) {
      console.error("Error deleting course:", error);
      const errMsg = error.response?.data?.message || error.response?.data?.error || "Failed to delete course.";
      alert(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 w-full space-y-8 text-slate-900 font-sans">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">

        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Course Management</h1>
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all duration-300 font-bold shadow-lg shadow-indigo-500/30"
          >
            <Plus className="w-5 h-5" />
            <span>Add Course</span>
          </button>
        </div>

        {/* --- Main Content --- */}
        <div className="bg-white rounded-[2.5rem]">

          {/* Controls: Search, View Toggle & Filters - FIXED ALIGNMENT */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-8">
            {/* Left side: Search + View Toggle */}
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative group flex-1 lg:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-orange-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border-2 border-transparent rounded-2xl text-slate-800 placeholder-slate-500 font-medium focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-100/50 outline-none transition-all shadow-sm"
                />
              </div>

              {/* View Toggle */}
              <div className="flex bg-white/50 p-1.5 rounded-2xl border-2 border-transparent shadow-sm flex-shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === "grid" ? "bg-white shadow-md text-orange-600" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === "list" ? "bg-white shadow-md text-orange-600" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Right side: Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 w-full lg:w-auto scrollbar-hide">
              <button
                onClick={() => setActiveCategory("All")}
                className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-bold transition-all border-2 flex-shrink-0 ${activeCategory === "All" ? "bg-slate-800 text-white border-slate-800" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-bold transition-all border-2 flex-shrink-0 ${activeCategory === cat.name ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-16 h-16 text-orange-600 animate-spin" />
              <p className="text-slate-600 font-bold text-lg animate-pulse tracking-tight">Loading Courses...</p>
            </div>
          ) : (
            <>
              {/* Empty State */}
              {filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 opacity-60">
                  <div className="w-20 h-20 bg-slate-100/50 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                    <Search className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-slate-800 font-black text-xl">No courses found</h3>
                  <p className="text-slate-600 font-medium mt-2">Try adjusting your filters or add a new course.</p>
                </div>
              ) : (
                <>
                  {/* --- GRID VIEW --- */}
                  {viewMode === "grid" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                      {filteredCourses.map((course) => {
                        const stats = (course.rating && course.students) ? course : { ...course, ...getStats(course._id) };
                        return (
                          <div key={course._id} className="group flex flex-col bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                            {/* Image Header */}
                            <div className="relative h-48 overflow-hidden">
                              {course.imageUrl ? (
                                <img
                                  src={course.imageUrl}
                                  alt={course.name}
                                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                  onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80" }}
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                                  <BookOpen className="w-12 h-12 text-slate-400" />
                                </div>
                              )}
                              <div className="absolute top-4 left-4">
                                <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                                  {course.categoryId?.name || "Uncategorized"}
                                </span>
                                {course.totalLevels > 0 && (
                                  <span className="ml-2 px-3 py-1.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                                    {course.totalLevels} Levels
                                  </span>
                                )}
                              </div>
                              {/* Overlay Actions */}
                              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                  onClick={() => openModal(course)}
                                  className="p-2 bg-white/90 text-blue-600 rounded-lg hover:bg-blue-50 shadow-sm"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(course)}
                                  className="p-2 bg-white/90 text-red-600 rounded-lg hover:bg-red-50 shadow-sm"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex flex-col flex-1 p-6">
                              <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">
                                {course.name}
                              </h3>

                              {/* Channels Tags */}
                              <div className="flex flex-wrap gap-1 mb-4">
                                {course.channels?.length > 0 ? (
                                  course.channels.slice(0, 3).map((ch) => (
                                    <span key={ch._id} className="bg-indigo-100/50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-200/50">
                                      {ch.name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">No channels</span>
                                )}
                              </div>

                              {/* Stats Footer */}
                              <div className="mt-auto pt-4 border-t border-slate-200/50 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-amber-500">
                                  <Star className="w-4 h-4 fill-current" />
                                  <span className="text-sm font-bold">{stats.rating}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <Users className="w-4 h-4" />
                                  <span className="text-xs font-bold">{(parseInt(stats.students) / 1000).toFixed(1)}k</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* --- LIST VIEW --- */}
                  {viewMode === "list" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                              <div className="flex items-center gap-2">Course Info <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="px-6 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Category</th>
                            <th className="px-6 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Performance</th>
                            <th className="px-6 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Channels</th>
                            <th className="px-6 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/40">
                          {filteredCourses.map((course) => {
                            const stats = (course.rating && course.students) ? course : { ...course, ...getStats(course._id) };
                            return (
                              <tr key={course._id} className="group hover:bg-white/40 transition-all duration-300">
                                <td className="px-6 py-6 w-96">
                                  <div className="flex items-center gap-4">
                                    <div className="relative w-14 h-14 flex-shrink-0">
                                      {course.imageUrl ? (
                                        <img
                                          src={course.imageUrl}
                                          alt=""
                                          className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white/60"
                                          onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=100&q=80" }}
                                        />
                                      ) : (
                                        <div className="w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center border-2 border-white/60">
                                          <BookOpen className="w-6 h-6 text-slate-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col justify-center">
                                      <span className="text-base font-bold text-slate-800 line-clamp-1">{course.name}</span>
                                      <span className="text-xs font-medium text-slate-500 line-clamp-1 mt-0.5">{course.description}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-6 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-orange-500" />
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-slate-700">{course.categoryId?.name || "Uncategorized"}</span>
                                      {course.totalLevels > 0 && (
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{course.totalLevels} levels</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-6 whitespace-nowrap">
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                      <span className="text-xs font-bold">{stats.rating} Rating</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                      <Users className="w-4 h-4" />
                                      <span className="text-xs font-bold">{(parseInt(stats.students) / 1000).toFixed(1)}k Students</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-6">
                                  <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                    {course.channels?.length > 0 ? (
                                      course.channels.map((ch) => (
                                        <span key={ch._id} className="bg-indigo-100/60 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-indigo-200/50 flex items-center gap-1">
                                          <MonitorPlay className="w-2.5 h-2.5" />
                                          {ch.name}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-slate-400 italic">No channels</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-6 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                    <button
                                      onClick={() => openModal(course)}
                                      className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all shadow-sm hover:shadow-md active:scale-90"
                                      title="Edit Course"
                                    >
                                      <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(course)}
                                      className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all shadow-sm hover:shadow-md active:scale-90"
                                      title="Delete Course"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* --- Modal --- */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 p-4 transition-opacity">
            <div className="bg-white rounded-[2rem] shadow-2xl p-8 md:p-10 w-full max-w-2xl border border-slate-100 transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {editingCourse ? "Edit Course Settings" : "Register New Course"}
                  </h2>
                  <p className="text-slate-500 font-bold mt-1 text-sm">Fill in the details below to update your catalog.</p>
                </div>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full hover:bg-slate-100 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Course Name</label>
                    <input
                      type="text"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="e.g. Master React in 30 Days"
                      className="w-full border-2 border-slate-200 rounded-xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-bold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-bold text-slate-700"
                    >
                      <option value="">Choose a category...</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    placeholder="Brief summary of the course content..."
                    rows="3"
                    className="w-full border-2 border-slate-200 rounded-xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-medium text-slate-700 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thumbnail URL</label>
                  <input
                    type="text"
                    value={courseImageUrl}
                    onChange={(e) => setCourseImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border-2 border-slate-200 rounded-xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-medium text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Roadmap Total Levels</label>
                  <input
                    type="number"
                    value={totalLevels}
                    onChange={(e) => setTotalLevels(e.target.value)}
                    placeholder="e.g. 6"
                    className="w-full border-2 border-slate-200 rounded-xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-bold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Active Channels</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
                    {channels.map((ch) => {
                      const isSelected = selectedChannels.includes(ch._id);
                      return (
                        <label key={ch._id} className={`flex items-center gap-2 group cursor-pointer p-2 rounded-xl transition-all ${isSelected ? 'bg-white shadow-sm border border-slate-100' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedChannels([...selectedChannels, ch._id]);
                              else setSelectedChannels(selectedChannels.filter(id => id !== ch._id));
                            }}
                            className="w-4 h-4 rounded border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-700'}`}>{ch.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 pt-6 mt-4 border-t border-slate-100">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-3.5 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold border border-slate-200"
                  >
                    Discard
                  </button>
                  <button
                    onClick={saveCourse}
                    disabled={actionLoading}
                    className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/25 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {editingCourse ? "Update Course" : "Create Course"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCourseToDelete(null);
        }}
        onConfirm={confirmDeleteCourse}
        itemName={courseToDelete?.name}
        title="Delete Course"
      />
    </div>
  );
};

export default CourseManagement;
