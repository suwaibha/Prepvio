// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { CheckCircle2, Circle, Loader2, BookOpen, Award } from "lucide-react";

// const CourseCompletion = () => {
//     const [courses, setCourses] = useState([]);
//     const [completedCourses, setCompletedCourses] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [actionLoading, setActionLoading] = useState(null);

//     useEffect(() => {
//         fetchData();
//     }, []);

//     const fetchData = async () => {
//         try {
//             setLoading(true);
//             // Fetch all courses
//             const coursesRes = await axios.get("http://localhost:8000/api/courses");
//             setCourses(coursesRes.data);

//             // Fetch user's completed courses
//             const completedRes = await axios.get("http://localhost:5000/api/users/completed-courses", {
//                 withCredentials: true
//             });
//             setCompletedCourses(completedRes.data?.completedCourses || []);
//         } catch (error) {
//             console.error("Error fetching data:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleToggleCourse = async (courseId) => {
//         const isCompleted = completedCourses.some(c => c._id === courseId);

//         if (isCompleted) {
//             alert("Course already completed! (Uncomplete functionality not implemented)");
//             return;
//         }

//         try {
//             setActionLoading(courseId);
//             await axios.post(
//                 `http://localhost:5000/api/users/complete-course/${courseId}`,
//                 {},
//                 { withCredentials: true }
//             );
//             await fetchData();
//         } catch (error) {
//             console.error("Error completing course:", error);
//             alert(error.response?.data?.message || "Failed to complete course");
//         } finally {
//             setActionLoading(null);
//         }
//     };

//     const isCourseCompleted = (courseId) => {
//         return completedCourses.some(c => c._id === courseId);
//     };

//     if (loading) {
//         return (
//             <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
//                 <div className="flex flex-col items-center gap-4">
//                     <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
//                     <p className="text-gray-600 font-semibold">Loading courses...</p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
//             <div className="max-w-4xl mx-auto">
//                 {/* Header */}
//                 <div className="mb-10 text-center">
//                     <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
//                         <Award className="w-8 h-8 text-white" />
//                     </div>
//                     <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
//                         Course Completion
//                     </h1>
//                     <p className="text-gray-600 font-medium">
//                         Mark courses as complete to unlock their project maps
//                     </p>
//                 </div>

//                 {/* Completed Courses Summary */}
//                 <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 mb-8 shadow-lg border border-white/50">
//                     <div className="flex items-center justify-between">
//                         <div>
//                             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
//                                 Progress
//                             </p>
//                             <p className="text-2xl font-black text-gray-900">
//                                 {completedCourses.length} / {courses.length} Courses Completed
//                             </p>
//                         </div>
//                         <div className="text-5xl font-black text-indigo-600">
//                             {courses.length > 0 ? Math.round((completedCourses.length / courses.length) * 100) : 0}%
//                         </div>
//                     </div>
//                     <div className="mt-4 w-full bg-gray-100 rounded-full h-3 overflow-hidden">
//                         <div
//                             className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
//                             style={{ width: `${courses.length > 0 ? (completedCourses.length / courses.length) * 100 : 0}%` }}
//                         />
//                     </div>
//                 </div>

//                 {/* Courses List */}
//                 <div className="space-y-4">
//                     {courses.map((course) => {
//                         const completed = isCourseCompleted(course._id);
//                         const isLoading = actionLoading === course._id;

//                         return (
//                             <div
//                                 key={course._id}
//                                 className={`bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-md border transition-all duration-300 ${completed
//                                     ? "border-green-500 bg-green-50/50"
//                                     : "border-white/50 hover:shadow-lg"
//                                     }`}
//                             >
//                                 <div className="flex items-center gap-4">
//                                     {/* Course Image */}
//                                     <div className="flex-shrink-0">
//                                         <img
//                                             src={course.imageUrl}
//                                             alt={course.name}
//                                             className="w-20 h-20 rounded-xl object-cover shadow-sm"
//                                             onError={(e) => {
//                                                 e.target.src = "https://via.placeholder.com/150";
//                                             }}
//                                         />
//                                     </div>

//                                     {/* Course Info */}
//                                     <div className="flex-1">
//                                         <h3 className="text-xl font-black text-gray-900 mb-1">
//                                             {course.name}
//                                         </h3>
//                                         <p className="text-sm text-gray-600 line-clamp-2">
//                                             {course.description}
//                                         </p>
//                                     </div>

//                                     {/* Action Button */}
//                                     <button
//                                         onClick={() => handleToggleCourse(course._id)}
//                                         disabled={completed || isLoading}
//                                         className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${completed
//                                             ? "bg-green-500 text-white cursor-not-allowed"
//                                             : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95"
//                                             }`}
//                                     >
//                                         {isLoading ? (
//                                             <>
//                                                 <Loader2 className="w-5 h-5 animate-spin" />
//                                                 Processing...
//                                             </>
//                                         ) : completed ? (
//                                             <>
//                                                 <CheckCircle2 className="w-5 h-5" />
//                                                 Completed
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <Circle className="w-5 h-5" />
//                                                 Mark Complete
//                                             </>
//                                         )}
//                                     </button>
//                                 </div>
//                             </div>
//                         );
//                     })}
//                 </div>

//                 {courses.length === 0 && (
//                     <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
//                         <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//                         <h3 className="text-xl font-bold text-gray-500">No Courses Available</h3>
//                         <p className="text-gray-400 text-sm mt-2">
//                             Courses will appear here once they are created by the admin.
//                         </p>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default CourseCompletion;