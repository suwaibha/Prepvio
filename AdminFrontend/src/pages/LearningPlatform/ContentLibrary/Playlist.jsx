import React, { useState, useEffect } from "react";
import axios from "axios";
import { CONTENT_API_URL } from "../../../config/api";
import { Plus, Trash2, Edit, Loader2, Link as LinkIcon, Youtube, PlaySquare, Video, ExternalLink, Search, ListVideo } from "lucide-react";
import VideoList from "./VideoList";
import QuizModal from "./QuizModal";
import DeleteConfirmationModal from "../../../Components/DeleteConfirmationModal";

const PlaylistManagement = () => {
  const [playlists, setPlaylists] = useState([]);
  const [channels, setChannels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); // Added for form actions
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [contentType, setContentType] = useState("playlist"); // Default to playlist

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState("");

  const [viewingVideos, setViewingVideos] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  
  // Single Video Quiz State
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [selectedVideoForQuiz, setSelectedVideoForQuiz] = useState({ video: null, playlist: null, channelName: "", courseName: "" });

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState(null);

  const API_URL = `${CONTENT_API_URL}/playlists`;
  const CHANNEL_API_URL = `${CONTENT_API_URL}/channels`;
  const COURSE_API_URL = `${CONTENT_API_URL}/courses`;

  // Helper function to extract YouTube video ID from URL
  const extractVideoId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return url; // Return as-is if no pattern matches (fallback)
  };

  const fetchPlaylistsAndCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const [playlistsRes, channelsRes, coursesRes] = await Promise.all([
        axios.get(API_URL),
        axios.get(CHANNEL_API_URL),
        axios.get(COURSE_API_URL),
      ]);

      setPlaylists(playlistsRes.data.data || []);
      setChannels(channelsRes.data.data || []);
      setCourses(coursesRes.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylistsAndCourses();
  }, []);

  const handleOpenModal = (type, item = null) => {
    setModalType(type);
    setCurrentEditItem(item);
    setContentType(item?.type || "playlist");

    if (item) {
      setSelectedCourseId(item.courseId?._id || item.courseId || "");
      setSelectedChannelId(item.channelId?._id || item.channelId || "");
    } else {
      setSelectedCourseId("");
      setSelectedChannelId("");
    }

    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentEditItem(null);
    setSelectedCourseId("");
    setSelectedChannelId("");
    setError(null);
  };

  const handleChangeCourse = (e) => {
    setSelectedCourseId(e.target.value);
    setSelectedChannelId("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    const form = e.target;
    const itemData = {
      type: contentType, // Use state instead of form value for reliability
      link: form.link.value,
      channelId: selectedChannelId,
      courseId: selectedCourseId,
      questions: currentEditItem?.questions || [], // Keep existing questions
    };

    try {
      if (modalType === "add") {
        await axios.post(API_URL, itemData);
      } else {
        await axios.put(`${API_URL}/${currentEditItem._id}`, itemData);
      }
      handleCloseModal();
      fetchPlaylistsAndCourses();
    } catch (err) {
      setError(err.response?.data?.error || err.message || `Failed to ${modalType} content`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (content) => {
    setContentToDelete(content);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteContent = async () => {
    if (!contentToDelete) return;
    setActionLoading(true);
    try {
      await axios.delete(`${API_URL}/${contentToDelete._id}`);
      fetchPlaylistsAndCourses();
      setIsDeleteModalOpen(false);
      setContentToDelete(null);
    } catch (err) {
      alert("Failed to delete content: " + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const channelsForSelectedCourse = selectedCourseId
    ? courses.find((c) => c._id === selectedCourseId)?.channels || []
    : channels;

  // Render VideoList if a playlist is selected
  if (viewingVideos && selectedPlaylist) {
    return (
      <VideoList
        playlist={selectedPlaylist}
        channelName={selectedPlaylist.channelId?.name || ""}
        courseName={selectedPlaylist.courseId?.name || ""}
        onBack={() => {
          setViewingVideos(false);
          setSelectedPlaylist(null);
        }}
      />
    );
  }

  return (
    <div className="p-8 w-full space-y-8 text-slate-900 font-sans">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-4">
             <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
              <PlaySquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Content Library</h1>
              <p className="text-slate-500 font-bold mt-1 text-sm">Manage Video Playlists & Quizzes</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal("add")}
            className="flex items-center space-x-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all duration-300 font-bold shadow-lg shadow-indigo-500/30"
          >
            <Plus className="w-5 h-5" />
            <span>Add Content</span>
          </button>
        </div>

        {/* Content Table */}
        {loading && !modalOpen ? (
           <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
            <p className="text-slate-600 font-bold text-lg animate-pulse tracking-tight">Loading Library...</p>
          </div>
        ) : playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-60">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <ListVideo className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-slate-800 font-black text-2xl">Library Empty</h3>
            <p className="text-slate-500 font-medium mt-2">Add your first playlist or video to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[1.5rem] border border-slate-100 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Channel / Course</th>
                  <th className="px-6 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Link</th>
                  <th className="px-6 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {playlists.map((playlist) => (
                  <tr key={playlist._id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                       {playlist.type === "video" ? (
                         <div className="flex items-center gap-2">
                           <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                             <Video className="w-4 h-4" />
                           </div>
                           <span className="font-bold text-slate-700 text-sm">Single Video</span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-2">
                           <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                             <ListVideo className="w-4 h-4" />
                           </div>
                           <span className="font-bold text-slate-700 text-sm">Playlist</span>
                         </div>
                       )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{playlist.channelId?.name || "No Channel"}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-0.5">{playlist.courseId?.name || "No Course"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <a href={playlist.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium group/link max-w-[200px] truncate">
                         <Youtube className="w-4 h-4" />
                         <span className="truncate">{playlist.link}</span>
                         <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                       </a>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Primary Action Button */}
                        <button
                          onClick={() => {
                             if (playlist.type === "video") {
                               const videoId = extractVideoId(playlist.link);
                               if (!videoId) { alert("Invalid YouTube Link"); return; }
                               
                               setSelectedVideoForQuiz({
                                 video: { videoId: videoId, title: "Single Video Lesson" }, // We don't have title, using placeholder
                                 playlist: playlist,
                                 channelName: playlist.channelId?.name,
                                 courseName: playlist.courseId?.name
                               });
                               setQuizModalOpen(true);
                             } else {
                               setSelectedPlaylist(playlist);
                               setViewingVideos(true);
                             }
                          }}
                          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${playlist.type === "video" ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                        >
                          {playlist.type === "video" ? (
                            <>
                              <Loader2 className="w-3 h-3" /> Quiz
                            </>
                          ) : (
                            <>
                              <ListVideo className="w-3 h-3" /> Videos
                            </>
                          )}
                        </button>

                        <div className="w-px h-8 bg-slate-200 mx-1"></div>

                        <button 
                          onClick={() => handleOpenModal("edit", playlist)} 
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(playlist)} 
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 p-4 transition-opacity">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg border border-slate-100 transform transition-all scale-100">
            <h2 className="text-2xl font-black mb-6 text-slate-900 tracking-tight">
              {modalType === "add" ? "Add Content" : "Edit Content"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Content Type</label>
                  <select
                    name="contentType"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl p-3.5 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-bold text-slate-700"
                    required
                  >
                    <option value="playlist">YouTube Playlist</option>
                    <option value="video">Single Video</option>
                  </select>
                </div>
                
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Course</label>
                   <select
                    name="courseId"
                    value={selectedCourseId}
                    onChange={handleChangeCourse}
                    className="w-full border-2 border-slate-200 rounded-xl p-3.5 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-bold text-slate-700"
                    required
                  >
                    <option value="">Select Course...</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Channel</label>
                <select
                  name="channelId"
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  disabled={!selectedCourseId && channelsForSelectedCourse.length === 0}
                  className="w-full border-2 border-slate-200 rounded-xl p-3.5 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-bold text-slate-700 disabled:opacity-50"
                  required
                >
                  <option value="">
                    {selectedCourseId ? "Select Channel..." : "Select Course First"}
                  </option>
                  {channelsForSelectedCourse.map((channel) => (
                    <option key={channel._id} value={channel._id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                   {contentType === "video" ? "YouTube Video Link or ID" : "YouTube Playlist Link or ID"}
                </label>
                <div className="relative">
                   <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input
                    type="text"
                    name="link"
                    defaultValue={currentEditItem?.link || ""}
                    className="w-full border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3.5 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-medium text-slate-700"
                    placeholder="https://youtube.com/..."
                    required
                  />
                </div>
              </div>

               {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {error}
                  </div>
                )}

              <div className="flex gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="flex-1 py-3.5 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold border border-slate-200"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/25 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {modalType === "add" ? "Create Content" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Video Quiz Modal */}
      {quizModalOpen && selectedVideoForQuiz.video && (
         <QuizModal 
            video={selectedVideoForQuiz.video}
            playlist={selectedVideoForQuiz.playlist}
            channelName={selectedVideoForQuiz.channelName}
            courseName={selectedVideoForQuiz.courseName}
            onClose={() => {
              setQuizModalOpen(false);
              setSelectedVideoForQuiz({ video: null, playlist: null, channelName: "", courseName: "" });
            }}
         />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setContentToDelete(null);
        }}
        onConfirm={confirmDeleteContent}
        itemName={contentToDelete?.link}
        title="Delete Content"
      />
    </div>
  );
};

export default PlaylistManagement;





// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { 
//   Plus, 
//   Trash2, 
//   Edit, 
//   Loader2, 
//   PlayCircle, 
//   BrainCircuit, 
//   ExternalLink,
//   Youtube,
//   Layout,
//   ChevronLeft,
//   Video,
//   CheckCircle2,
//   X,
//   Play,
//   ArrowLeft,
//   AlertCircle
// } from "lucide-react";

// /**
//  * INTERNAL COMPONENT: Modal
//  * Consistently styled glassy modal for the dashboard
//  */
// const Modal = ({ title, onClose, children }) => (
//   <div className="fixed inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-md z-50 p-4 animate-in fade-in duration-300">
//     <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-8 md:p-12 w-full max-w-xl border border-white/50 transform animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto text-slate-900">
//       <div className="flex justify-between items-center mb-10">
//         <h2 className="text-3xl font-black text-slate-800 tracking-tight">{title}</h2>
//         <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100">
//           <X className="w-8 h-8" />
//         </button>
//       </div>
//       {children}
//     </div>
//   </div>
// );

// /**
//  * INTERNAL COMPONENT: VideoList
//  * Implements the specific YouTube API fetching logic you provided with the modern UI
//  */
// const VideoList = ({ playlist, channelName, courseName, onBack, onManageQuiz }) => {
//   const [videos, setVideos] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!playlist?.link) return;

//     const fetchVideos = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         // Updated to use the specific API endpoint provided in your query
//         const res = await axios.get(
//           `http://localhost:8000/api/videos/youtube/${playlist.link}`
//         );
//         setVideos(res.data.data || []);
//       } catch (err) {
//         setError(err.response?.data?.error || err.message || "Failed to fetch videos from YouTube");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchVideos();
//   }, [playlist?.link]);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-orange-200 via-rose-200 to-slate-300 p-4 md:p-8 font-sans text-slate-900">
//       <div className="max-w-7xl mx-auto">
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
//           <button 
//             onClick={onBack}
//             className="flex items-center gap-2 px-5 py-2.5 bg-white/40 backdrop-blur-md rounded-xl font-bold text-slate-700 hover:bg-white/60 transition-all active:scale-95 border border-white/50 shadow-sm"
//           >
//             <ChevronLeft className="w-5 h-5" />
//             Back to Playlists
//           </button>
//           <div className="text-right">
//             <h2 className="text-2xl font-black text-slate-800 tracking-tight">{channelName}</h2>
//             <p className="text-slate-600 font-bold text-xs uppercase tracking-widest">{courseName}</p>
//           </div>
//         </div>

//         <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 p-6 md:p-10">
//           <div className="mb-10 flex items-center justify-between">
//             <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
//               <Video className="w-10 h-10 text-orange-500" />
//               Playlist Content
//             </h2>
//             {!loading && videos.length > 0 && (
//               <div className="bg-orange-500 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20">
//                 {videos.length} Videos Found
//               </div>
//             )}
//           </div>

//           {loading ? (
//             <div className="py-32 flex flex-col items-center justify-center gap-4">
//               <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
//               <p className="text-slate-600 font-bold text-lg animate-pulse">Communicating with YouTube API...</p>
//             </div>
//           ) : error ? (
//             <div className="py-20 text-center">
//               <div className="bg-red-50 border border-red-200 text-red-600 px-8 py-6 rounded-[2rem] inline-block shadow-sm">
//                 <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
//                 <p className="font-bold text-lg mb-1">{error}</p>
//                 <p className="text-sm opacity-70">Check if the playlist ID is correct</p>
//               </div>
//             </div>
//           ) : videos.length === 0 ? (
//             <div className="py-24 text-center bg-white/20 rounded-[3rem] border-4 border-dashed border-white/40">
//               <Youtube className="w-16 h-16 text-slate-300 mx-auto mb-4" />
//               <p className="text-slate-500 font-black text-xl tracking-tight">Empty Playlist</p>
//               <p className="text-slate-400 font-medium mt-1">No videos were found for this resource ID.</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//               {videos.map((video, index) => (
//                 <div key={video.videoId || index} className="group bg-white/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-white/60 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
//                   <div className="relative aspect-video bg-slate-200 overflow-hidden">
//                     <img 
//                       src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} 
//                       alt={video.title} 
//                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
//                       onError={(e) => { e.target.src = "https://via.placeholder.com/480x270?text=Video+Lesson"; }}
//                     />
//                     <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors duration-500 flex items-center justify-center">
//                       <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 scale-0 group-hover:scale-100 transition-all duration-500 shadow-xl">
//                         <Play className="w-7 h-7 text-white fill-white" />
//                       </div>
//                     </div>
//                     <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-black uppercase tracking-widest border border-white/20">
//                       Lesson {index + 1}
//                     </div>
//                   </div>
//                   <div className="p-7">
//                     <h3 className="font-bold text-slate-800 line-clamp-2 mb-6 h-12 leading-tight text-lg group-hover:text-orange-600 transition-colors">
//                       {video.title || "Untitled Lesson"}
//                     </h3>
//                     <div className="space-y-3">
//                       <button 
//                         onClick={() => onManageQuiz(video)}
//                         className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-emerald-600 shadow-lg transition-all active:scale-95 shadow-emerald-500/20"
//                       >
//                         <BrainCircuit className="w-5 h-5" />
//                         Manage Quiz
//                       </button>
//                       <a 
//                         href={video.link} 
//                         target="_blank" 
//                         rel="noopener noreferrer"
//                         className="w-full py-3 border-2 border-slate-200 text-slate-500 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-white transition-all"
//                       >
//                         <ExternalLink className="w-4 h-4" />
//                         Watch on YouTube
//                       </a>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// /**
//  * INTERNAL COMPONENT: QuizManagement
//  */
// const QuizManagement = ({ playlistId, videoId, channelName, courseName, onBack }) => {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-orange-200 via-rose-200 to-slate-300 p-4 md:p-8 font-sans text-slate-900">
//       <div className="max-w-7xl mx-auto">
//         <button 
//           onClick={onBack}
//           className="flex items-center gap-2 mb-8 px-5 py-2.5 bg-white/40 backdrop-blur-md rounded-xl font-bold text-slate-700 hover:bg-white/60 transition-all active:scale-95 border border-white/50 shadow-sm"
//         >
//           <ArrowLeft className="w-5 h-5" />
//           Back to List
//         </button>

//         <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/50 p-8 md:p-12">
//           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
//             <div>
//               <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
//                 <BrainCircuit className="w-10 h-10 text-emerald-600" />
//                 Quiz Editor
//               </h2>
//               <p className="text-slate-600 font-medium mt-2">
//                 {channelName} | <span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 italic">ID: {videoId}</span>
//               </p>
//             </div>
//             <button className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black shadow-xl hover:scale-[1.03] transition-all active:scale-95 shadow-emerald-500/30">
//               <Plus className="w-6 h-6" />
//               Add Question
//             </button>
//           </div>

//           <div className="bg-white/50 p-12 rounded-[3.5rem] border border-white/60 text-center py-24 shadow-inner">
//             <div className="w-28 h-28 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-200 shadow-sm">
//               <CheckCircle2 className="w-14 h-14 text-emerald-500" />
//             </div>
//             <h3 className="text-3xl font-black text-slate-800 tracking-tight">Assessment Empty</h3>
//             <p className="text-slate-500 mt-4 font-medium max-w-md mx-auto leading-relaxed text-lg text-center">
//               No questions found for this specific lesson. <br/> 
//               Click "Add Question" to begin building the assessment.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// /**
//  * MAIN COMPONENT: PlaylistManagement
//  */
// const PlaylistManagement = () => {
//   const [playlists, setPlaylists] = useState([]);
//   const [channels, setChannels] = useState([]);
//   const [courses, setCourses] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [actionLoading, setActionLoading] = useState(false);
//   const [error, setError] = useState(null);
  
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalType, setModalType] = useState("add");
//   const [currentEditItem, setCurrentEditItem] = useState(null);
//   const [contentType, setContentType] = useState("playlist");

//   const [selectedCourseId, setSelectedCourseId] = useState("");
//   const [selectedChannelId, setSelectedChannelId] = useState("");
//   const [link, setLink] = useState("");

//   const [managingQuizzes, setManagingQuizzes] = useState(false);
//   const [viewingVideos, setViewingVideos] = useState(false);
//   const [selectedPlaylist, setSelectedPlaylist] = useState(null);
//   const [selectedChannelName, setSelectedChannelName] = useState("");
//   const [selectedCourseName, setSelectedCourseName] = useState("");

//   const API_URL = "http://localhost:8000/api/playlists";
//   const CHANNEL_API_URL = "http://localhost:8000/api/channels";
//   const COURSE_API_URL = "http://localhost:8000/api/courses";

//   const extractVideoId = (url) => {
//     if (!url) return null;
//     const patterns = [
//       /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
//       /^([a-zA-Z0-9_-]{11})$/
//     ];
//     for (const pattern of patterns) {
//       const match = url.match(pattern);
//       if (match) return match[1];
//     }
//     return url;
//   };

//   const fetchData = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const [playlistsRes, channelsRes, coursesRes] = await Promise.all([
//         axios.get(API_URL),
//         axios.get(CHANNEL_API_URL),
//         axios.get(COURSE_API_URL),
//       ]);
//       setPlaylists(playlistsRes.data.data || []);
//       setChannels(channelsRes.data.data || []);
//       setCourses(coursesRes.data || []);
//     } catch (err) {
//       setError("Failed to sync with server. Check backend status.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const handleOpenModal = (type, item = null) => {
//     setModalType(type);
//     setCurrentEditItem(item);
//     setContentType(item?.type || "playlist");
//     setSelectedCourseId(item?.courseId?._id || item?.courseId || "");
//     setSelectedChannelId(item?.channelId?._id || item?.channelId || "");
//     setLink(item?.link || "");
//     setModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setModalOpen(false);
//     setCurrentEditItem(null);
//     setSelectedCourseId("");
//     setSelectedChannelId("");
//     setLink("");
//     setError(null);
//   };

//   const handleSubmit = async (e) => {
//     if (e) e.preventDefault();
//     setActionLoading(true);
//     setError(null);

//     const itemData = {
//       type: contentType,
//       link: link.trim(),
//       channelId: selectedChannelId,
//       courseId: selectedCourseId,
//       questions: currentEditItem?.questions || [],
//     };

//     try {
//       if (modalType === "add") {
//         await axios.post(API_URL, itemData);
//       } else {
//         await axios.put(`${API_URL}/${currentEditItem._id}`, itemData);
//       }
//       handleCloseModal();
//       fetchData();
//     } catch (err) {
//       setError(err.response?.data?.error || `Action failed during ${modalType}`);
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Remove this content from the hub?")) return;
//     setActionLoading(true);
//     try {
//       await axios.delete(`${API_URL}/${id}`);
//       fetchData();
//     } catch (err) {
//       setError("Failed to delete content");
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const channelsForSelectedCourse = selectedCourseId
//     ? courses.find((c) => c._id === selectedCourseId)?.channels || []
//     : channels;

//   if (viewingVideos && selectedPlaylist) {
//     return (
//       <VideoList
//         playlist={selectedPlaylist}
//         channelName={selectedPlaylist.channelId?.name || ""}
//         courseName={selectedPlaylist.courseId?.name || ""}
//         onBack={() => {
//           setViewingVideos(false);
//           setSelectedPlaylist(null);
//         }}
//         onManageQuiz={(video) => {
//           setManagingQuizzes(true);
//           setSelectedChannelName(selectedPlaylist.channelId?.name || "");
//           setSelectedCourseName(selectedPlaylist.courseId?.name || "");
//           setSelectedPlaylist({ _id: selectedPlaylist._id, videoId: video.videoId });
//           setViewingVideos(false);
//         }}
//       />
//     );
//   }

//   if (managingQuizzes && selectedPlaylist) {
//     return (
//       <QuizManagement
//         playlistId={selectedPlaylist._id}
//         videoId={selectedPlaylist.videoId}
//         channelName={selectedChannelName}
//         courseName={selectedCourseName}
//         onBack={() => {
//           setManagingQuizzes(false);
//           // Return to video list if we have a valid playlist reference
//           if (selectedPlaylist._id) {
//             setViewingVideos(true);
//           } else {
//             setSelectedPlaylist(null);
//           }
//         }}
//       />
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-orange-200 via-rose-200 to-slate-300 p-4 md:p-8 font-sans text-slate-900">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
//           <div className="flex items-center gap-4">
//             <div className="bg-red-600 p-3.5 rounded-2xl shadow-lg">
//               <Youtube className="w-8 h-8 text-white" />
//             </div>
//             <div>
//               <h1 className="text-4xl font-black text-slate-800 tracking-tight">Playlist Hub</h1>
//               <p className="text-slate-600 font-medium">Curate YouTube resources and interactive assessments</p>
//             </div>
//           </div>
//           <button
//             onClick={() => handleOpenModal("add")}
//             className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold active:scale-95 shadow-lg shadow-emerald-500/20"
//           >
//             <Plus className="w-6 h-6" />
//             <span>Add Content</span>
//           </button>
//         </div>

//         {error && (
//           <div className="mb-6 p-4 bg-red-100/80 backdrop-blur-sm border border-red-200 text-red-700 rounded-2xl flex items-center justify-between animate-in fade-in shadow-sm">
//             <span className="font-bold">{error}</span>
//             <button onClick={() => setError(null)} className="text-red-500 font-black">✕</button>
//           </div>
//         )}

//         <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 p-6 md:p-10">
//           {loading && playlists.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-32 gap-4">
//               <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
//               <p className="text-slate-600 font-bold text-lg animate-pulse tracking-tight">Fetching Playlists...</p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full">
//                 <thead>
//                   <tr className="border-b border-slate-300/50">
//                     <th className="px-6 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Format</th>
//                     <th className="px-6 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Source Link / ID</th>
//                     <th className="px-6 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Context</th>
//                     <th className="px-6 py-5 text-right text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-200/50">
//                   {playlists.length > 0 ? (
//                     playlists.map((playlist) => (
//                       <tr key={playlist._id} className="group hover:bg-white/30 transition-all duration-300">
//                         <td className="px-6 py-6 whitespace-nowrap">
//                           <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
//                             playlist.type === 'video' 
//                             ? 'bg-blue-100/80 text-blue-600 border-blue-200' 
//                             : 'bg-orange-100/80 text-orange-600 border-orange-200'
//                           }`}>
//                             {playlist.type}
//                           </span>
//                         </td>
//                         <td className="px-6 py-6 max-w-xs">
//                           <a 
//                             href={playlist.link.includes('http') ? playlist.link : `https://youtube.com/playlist?list=${playlist.link}`} 
//                             target="_blank" 
//                             rel="noopener noreferrer" 
//                             className="text-sm text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 group/link"
//                           >
//                             <span className="truncate">{playlist.link}</span>
//                             <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
//                           </a>
//                         </td>
//                         <td className="px-6 py-6">
//                           <div className="flex flex-col gap-1">
//                             <span className="text-sm font-bold text-slate-800">{playlist.channelId?.name || "N/A"}</span>
//                             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100/50 w-fit px-2 py-0.5 rounded shadow-sm border border-slate-200">
//                               {playlist.courseId?.name || "Global Catalog"}
//                             </span>
//                           </div>
//                         </td>
//                         <td className="px-6 py-6 whitespace-nowrap text-right">
//                           <div className="flex justify-end items-center space-x-3">
//                             <button
//                               onClick={() => {
//                                 const channelName = playlist.channelId?.name || "";
//                                 const courseName = playlist.courseId?.name || "";
//                                 if (playlist.type === "video") {
//                                   const videoId = extractVideoId(playlist.link);
//                                   if (!videoId) return alert("Invalid Video URL/ID");
//                                   setManagingQuizzes(true);
//                                   setSelectedChannelName(channelName);
//                                   setSelectedCourseName(courseName);
//                                   setSelectedPlaylist({ _id: playlist._id, videoId: videoId });
//                                 } else {
//                                   setSelectedPlaylist(playlist);
//                                   setViewingVideos(true);
//                                 }
//                               }}
//                               className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black shadow-sm transition-all active:scale-90 ${
//                                 playlist.type === "video" 
//                                 ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20" 
//                                 : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20"
//                               }`}
//                             >
//                               {playlist.type === "video" ? <BrainCircuit className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
//                               {playlist.type === "video" ? "Quizzes" : "Videos"}
//                             </button>
//                             <button onClick={() => handleOpenModal("edit", playlist)} className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl transition-all active:scale-90 shadow-sm border border-transparent hover:border-blue-200">
//                               <Edit className="w-5 h-5" />
//                             </button>
//                             <button onClick={() => handleDelete(playlist._id)} className="p-2.5 text-red-600 hover:bg-red-100 rounded-xl transition-all active:scale-90 shadow-sm border border-transparent hover:border-red-200">
//                               <Trash2 className="w-5 h-5" />
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan="4" className="text-center py-24 text-slate-500 font-medium">
//                         <Layout className="w-12 h-12 text-slate-300 mx-auto mb-4 opacity-50" />
//                         <h3 className="text-xl font-bold text-slate-800 opacity-50 tracking-tight">Hub Empty</h3>
//                         <p className="text-slate-400 mt-1">Register your first playlist or lesson to populate the list.</p>
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>

//       {modalOpen && (
//         <Modal 
//           title={modalType === "add" ? "Register Content" : "Update Resource"} 
//           onClose={handleCloseModal}
//         >
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Type</label>
//                 <select
//                   value={contentType}
//                   onChange={(e) => setContentType(e.target.value)}
//                   className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50 font-black text-sm uppercase"
//                 >
//                   <option value="playlist">Playlist</option>
//                   <option value="video">Single Video</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Course</label>
//                 <select
//                   value={selectedCourseId}
//                   onChange={(e) => {
//                     setSelectedCourseId(e.target.value);
//                     setSelectedChannelId("");
//                   }}
//                   className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50 font-bold"
//                   required
//                 >
//                   <option value="">Select Course...</option>
//                   {courses.map((c) => (
//                     <option key={c._id} value={c._id}>{c.name}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             <div>
//               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Source Channel</label>
//               <select
//                 value={selectedChannelId}
//                 onChange={(e) => setSelectedChannelId(e.target.value)}
//                 disabled={!selectedCourseId}
//                 className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50 font-bold disabled:opacity-50"
//                 required
//               >
//                 <option value="">{selectedCourseId ? "Select Channel..." : "Select Course First"}</option>
//                 {channelsForSelectedCourse.map((ch) => (
//                   <option key={ch._id} value={ch._id}>{ch.name}</option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">YouTube Link / ID</label>
//               <input
//                 type="text"
//                 value={link}
//                 onChange={(e) => setLink(e.target.value)}
//                 className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50 font-medium placeholder:text-slate-300"
//                 placeholder={contentType === "video" ? "watch?v=VIDEO_ID" : "list=PLAYLIST_ID"}
//                 required
//               />
//             </div>

//             <div className="flex gap-4 pt-6">
//               <button type="button" onClick={handleCloseModal} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-[1.5rem] hover:bg-slate-200 transition-all font-bold active:scale-95">Discard</button>
//               <button type="submit" className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[1.5rem] hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 font-bold disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95" disabled={actionLoading}>
//                 {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
//                 {modalType === "add" ? "Register Resource" : "Update Resource"}
//               </button>
//             </div>
//           </form>
//         </Modal>
//       )}
//     </div>
//   );
// };

// export default PlaylistManagement;
