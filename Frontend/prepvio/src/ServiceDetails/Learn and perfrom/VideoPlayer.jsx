import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import YouTube from "react-youtube";
import {
  PlayCircle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Layers,
  ListVideo,
  MonitorPlay,
  AlertCircle,
  Sparkles,
  Rocket,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  X,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "../../components/UserAvatar.jsx";
import { useAuthStore } from "../../store/authstore.js";
import { CONTENT_API_URL, MAIN_API_URL } from "../../config/api";
import { mainApi, contentApi } from "../../utils/apiClient";
import ReactMarkdown from "react-markdown";

const youtubeaxios = axios.create({
  withCredentials: false,
});

/* ======================================================
   CONFIG
====================================================== */
const BASE_URL = CONTENT_API_URL;
const USER_API = MAIN_API_URL;
const YOUTUBE_API_KEY = "AIzaSyBs569PnYQUNFUXon5AMersGFuKS8aS1QQ";

/* ======================================================
   UI COMPONENTS (Modern Design)
====================================================== */

// Updated Channel Card with Local Storage Notes Management
const ChannelCard = ({ name, imageUrl, selectedVideoId, channelId, courseId, onFetchSummary, isGeneratingInBackground, backgroundCountdown }) => {
  const [notesLink, setNotesLink] = useState('');
  const [savedNotesLink, setSavedNotesLink] = useState('');
  const [showInput, setShowInput] = useState(false);

  // Load saved notes link from localStorage
  useEffect(() => {
    if (!selectedVideoId) return;

    const storageKey = `video-notes-${selectedVideoId}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      setSavedNotesLink(saved);
    } else {
      setSavedNotesLink('');
    }
  }, [selectedVideoId]);

  const openNewGoogleDoc = () => {
    window.open('https://docs.google.com/document/create', '_blank');
  };

  const openSavedNotes = () => {
    if (savedNotesLink) {
      window.open(savedNotesLink, '_blank');
    }
  };

  const handleSaveNotesLink = () => {
    if (!notesLink.trim() || !selectedVideoId) return;

    // Basic validation for Google Docs URL
    if (!notesLink.includes('docs.google.com')) {
      alert('Please enter a valid Google Docs link');
      return;
    }

    const storageKey = `video-notes-${selectedVideoId}`;
    localStorage.setItem(storageKey, notesLink.trim());

    setSavedNotesLink(notesLink.trim());
    setNotesLink('');
    setShowInput(false);
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-6 mb-6 shadow-sm border border-white/50 transition-all hover:shadow-md">
      <div className="flex items-center space-x-5 mb-4">
        <div className="w-16 h-16 rounded-full overflow-hidden shadow-md ring-4 ring-white flex-shrink-0 bg-gray-100">
          <img
            src={imageUrl || "/fallback.jpg"}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = "https://placehold.co/100x100?text=CH"; }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xl font-black text-gray-900 line-clamp-1">{name || "Channel Name"}</div>
          <div className="mt-1 text-sm font-bold text-indigo-600 cursor-pointer hover:underline flex items-center gap-3">
            <div
              onClick={openNewGoogleDoc}
              className="flex items-center gap-1"
            >
              <Layers className="w-3 h-3" /> Create New Notes
            </div>
            <div
              onClick={() => window.location.href = '/dashboard/learning-map'}
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
            >
              <Rocket className="w-3 h-3" /> Projects
            </div>
          </div>
        </div>
      </div>

      {/* Saved Notes Link */}
      {savedNotesLink && (
        <div className="mb-3 p-3 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Saved Notes</span>
            <button
              onClick={openSavedNotes}
              className="text-xs font-bold text-green-600 hover:text-green-800 underline flex items-center gap-1 cursor-pointer"
            >
              Open Notes <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Update Notes Link */}
      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="w-full py-2 px-4 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Layers className="w-4 h-4" />
          {savedNotesLink ? 'Update Notes Link' : 'Save Notes Link'}
        </button>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={notesLink}
            onChange={(e) => setNotesLink(e.target.value)}
            placeholder="Paste your Google Docs link here..."
            className="w-full px-4 py-2 border-2 border-indigo-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveNotesLink}
              disabled={!notesLink.trim()}
              className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowInput(false);
                setNotesLink('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Summary Button */}
      <button
        onClick={onFetchSummary}
        disabled={isGeneratingInBackground}
        className={`w-full mt-3 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 border shadow-sm ${
          isGeneratingInBackground
            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border-indigo-100/50 hover:shadow active:scale-98 cursor-pointer"
        }`}
      >
        {isGeneratingInBackground ? (
          <>
            <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>
              {backgroundCountdown > 0
                ? `Generating... (~${backgroundCountdown}s)`
                : "Generating... Almost done!"}
            </span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span>Summary</span>
          </>
        )}
      </button>
    </div>
  );
};

// Updated Playlist Item with Progress
const PlayListItem = ({ video, index, duration, onVideoSelect, isPlaying, videoProgress }) => {
  const title = video?.snippet?.title || "No Title";
  const thumbnail = video?.snippet?.thumbnails?.medium?.url;
  const videoId =
    video?.snippet?.resourceId?.videoId ||
    video?.id ||
    null;

  const progress = videoProgress[videoId] || 0;
  const totalSeconds = duration || 0;

  const isCompleted = totalSeconds > 0 && progress >= totalSeconds * 0.9;
  const showResume = progress > 5 && !isCompleted;

  const formatSeconds = (seconds) => {
    if (!seconds) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onVideoSelect(video)}
      className={`group cursor-pointer rounded-2xl p-3 flex items-start gap-4 transition-all duration-300 border ${isPlaying
        ? "bg-[#1A1A1A] text-white shadow-xl border-[#1A1A1A]"
        : "bg-white text-gray-800 hover:bg-gray-50 hover:shadow-sm border-gray-100"
        }`}
    >
      <div className="relative w-28 h-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-200 shadow-inner">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800"><MonitorPlay className="text-gray-500" /></div>
        )}

        {/* Progress Bar */}
        {progress > 0 && totalSeconds > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600/50">
            <div
              className="h-full bg-indigo-500"
              style={{
                width: `${Math.min((progress / totalSeconds) * 100, 100)}%`,
              }}
            />
          </div>
        )}

        {/* Play Overlay */}
        {isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
              <div className="w-2 h-2 bg-[#D4F478] rounded-full animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between h-20 py-0.5 w-full min-w-0">
        <div className={`text-sm font-bold leading-tight line-clamp-2 ${isPlaying ? 'text-gray-100' : 'text-gray-900'}`}>
          <span className={`mr-2 text-xs font-mono opacity-60 ${isPlaying ? 'text-gray-400' : 'text-gray-500'}`}>
            {(index + 1).toString().padStart(2, '0')}
          </span>
          {title}
        </div>
        <div className={`text-xs mt-auto flex items-center justify-between font-medium ${isPlaying ? 'text-gray-400' : 'text-gray-500'}`}>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatSeconds(totalSeconds) || "N/A"}
          </span>
          {isPlaying && <span className="text-[#1A1A1A] bg-[#D4F478] font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">Playing</span>}
          {!isPlaying && isCompleted && <span className="text-emerald-700 bg-emerald-50 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">Completed</span>}
          {!isPlaying && showResume && <span className="text-amber-600 bg-amber-50 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">Resume at {Math.floor(progress / 60)}:
            {String(Math.floor(progress % 60)).padStart(2, "0")}</span>}
        </div>
      </div>
    </motion.div>
  );
};

// Player Component
const PlayListPlayer = ({ video, onPlayerReady, onStateChange, onWatchLater, isSaved, isSaving }) => {
  const videoId =
    video?.snippet?.resourceId?.videoId ||
    video?.id ||
    null;

  const title = video?.snippet?.title || "";

  useEffect(() => {
    // const disableContextMenu = (e) => e.preventDefault();
    // const disableSelect = (e) => e.preventDefault();
    // document.addEventListener("contextmenu", disableContextMenu);
    // document.addEventListener("selectstart", disableSelect);
    // return () => {
    //   document.removeEventListener("contextmenu", disableContextMenu);
    //   document.removeEventListener("selectstart", disableSelect);
    // };
  }, []);

  if (!videoId) {
    return (
      <div className="w-full lg:w-[68%] bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] shadow-xl p-8 flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px] text-center">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse ring-8 ring-white/30">
          <PlayCircle className="w-12 h-12 text-indigo-400" />
        </div>
        <h3 className="text-3xl font-black text-gray-900 tracking-tight">Ready to start?</h3>
        <p className="text-gray-500 mt-2 font-medium">Select a lesson from the playlist to begin watching.</p>
      </div>
    );
  }

  const opts = {
    height: "100%",
    width: "100%",
    playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0 },
  };

  return (
    <div className="w-full lg:w-[68%] flex flex-col gap-6">
      {/* Video Container */}
      <div className="relative w-full aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-white ring-1 ring-gray-200 group z-10 transition-transform duration-500">
        <div className="absolute inset-0">
          <YouTube
            key={`${videoId}-${video?.id || "playlist"}`}
            videoId={videoId}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onStateChange}
            className="w-full h-full"
            iframeClassName="w-full h-full"
          />
        </div>
      </div>

      {/* Video Meta */}
      <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        {/* Decorative blob inside card */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight flex-1 line-clamp-2 relative z-10">{title}</h2>
        <div className="flex gap-2 relative z-10">
          <button
            onClick={onWatchLater}
            disabled={isSaved || isSaving}
            className={`px-6 py-3.5 rounded-full font-bold text-sm shadow-lg transition-all hover:-translate-y-0.5 whitespace-nowrap flex items-center gap-2 group active:scale-95 cursor-pointer
                ${isSaved
                ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200 cursor-default"
                : "bg-[#1A1A1A] hover:bg-black text-white"
              }`}
          >
            {isSaved ? (
              <>
                <CheckCircle className="w-4 h-4" /> Saved
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 group-hover:text-[#D4F478] transition-colors" /> Watch Later
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Sidebar Component
const PlayListSidebar = ({ videos, durations, onVideoSelect, selectedVideoId, channelData, videoProgress, channelId, courseId, onFetchSummary, isGeneratingInBackground, backgroundCountdown }) => {
  return (
    <div className="w-full lg:w-[32%] flex flex-col h-full mt-8 lg:mt-0">
      <ChannelCard
        name={channelData?.name}
        imageUrl={channelData?.imageUrl}
        selectedVideoId={selectedVideoId}
        channelId={channelId}
        courseId={courseId}
        onFetchSummary={onFetchSummary}
        isGeneratingInBackground={isGeneratingInBackground}
        backgroundCountdown={backgroundCountdown}
      />

      <div className="bg-white/50 backdrop-blur-xl border border-white rounded-[2.5rem] p-5 shadow-lg flex-1 flex flex-col min-h-[400px] max-h-[600px] lg:max-h-[calc(100vh-120px)] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-50/50 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-6 px-2 pt-2 relative z-10">
          <div className="w-12 h-12 bg-[#1A1A1A] rounded-2xl flex items-center justify-center text-[#D4F478] shadow-md transform -rotate-3 transition-transform hover:rotate-0">
            <ListVideo className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Course Content</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{videos.length} Lessons</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar relative z-10">
          {videos.map((video, index) => {
            const videoId =
              video?.snippet?.resourceId?.videoId ||
              video?.id ||
              `item-${index}`;

            const key = videoId || video?.id || index;
            return (
              <PlayListItem
                key={key}
                index={index}
                video={video}
                duration={durations[videoId]}
                onVideoSelect={onVideoSelect}
                isPlaying={selectedVideoId === videoId}
                videoProgress={videoProgress}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Quiz Modal (Redesigned with premium dark-themed glassmorphic aesthetics)
const QuizModal = ({ quiz, onAnswer, onClose }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const handleButtonClick = (option) => {
    setSelectedAnswer(option);
    onAnswer(option);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md z-[200]">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative bg-[#0F0F12] border border-zinc-800/80 rounded-[2rem] p-6 md:p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        {/* Glowing background highlights */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#D4F478]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Close button */}
        {selectedAnswer && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#18181C] hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center transition-all z-[10] group active:scale-90"
          >
            <XCircle className="w-4.5 h-4.5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          </button>
        )}

        <div className="relative z-10">
          {/* Header Row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#D4F478] flex items-center justify-center shadow-lg shadow-[#D4F478]/10">
              <Sparkles className="w-5 h-5 text-[#0F0F12]" />
            </div>
            <div>
              <span className="block text-[8px] font-black uppercase tracking-wider text-[#D4F478]">
                Knowledge Check
              </span>
              <h2 className="text-xl font-black text-white leading-tight tracking-tight">Test Your Knowledge</h2>
            </div>
          </div>

          {/* Question Text Box */}
          <div className="mb-4 bg-[#15151A] p-4 py-3.5 rounded-2xl border border-zinc-800/60 shadow-inner">
            <p className="text-zinc-100 text-sm font-bold leading-relaxed">
              {quiz.question}
            </p>
          </div>

          {/* Answer Options list */}
          <div className="flex flex-col gap-2.5">
            {quiz.options.map((option, i) => {
              let styleClass = "bg-[#15151A] border border-zinc-800/60 text-zinc-300 hover:border-[#D4F478] hover:text-white hover:bg-[#D4F478]/5 transition-all";
              let icon = <ChevronRight className="w-4.5 h-4.5 text-zinc-500 group-hover:text-[#D4F478] transition-colors" />;

              if (selectedAnswer) {
                if (option === quiz.correctAnswer) {
                  styleClass = "bg-[#D4F478]/10 border-[#D4F478] text-[#D4F478] shadow-lg shadow-[#D4F478]/5";
                  icon = <CheckCircle className="w-4.5 h-4.5 text-[#D4F478]" />;
                } else if (option === selectedAnswer && option !== quiz.correctAnswer) {
                  styleClass = "bg-rose-500/10 border-rose-500 text-rose-400 shadow-sm";
                  icon = <XCircle className="w-4.5 h-4.5 text-rose-500" />;
                } else {
                  styleClass = "bg-[#0F0F12]/60 border-zinc-900 text-zinc-600 cursor-not-allowed opacity-35";
                  icon = null;
                }
              }

              return (
                <button
                  key={i}
                  className={`group w-full py-3 px-5 rounded-xl font-bold text-left transition-all duration-200 flex items-center justify-between active:scale-[0.99] ${styleClass}`}
                  onClick={() => handleButtonClick(option)}
                  disabled={!!selectedAnswer}
                >
                  <span className="text-sm leading-snug pr-4">{option}</span>
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Feedback details */}
          {selectedAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm ${selectedAnswer === quiz.correctAnswer
                ? 'bg-[#D4F478]/10 text-[#D4F478] border border-[#D4F478]/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}
            >
              {selectedAnswer === quiz.correctAnswer ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#D4F478] animate-pulse" />
                  Great job! Resuming lesson...
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  Incorrect. Correct: <span className="underline decoration-2 ml-1">{quiz.correctAnswer}</span>
                </>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

/* ======================================================
   MAIN COMPONENT
====================================================== */
export default function VideoPlayer() {
  const { channelId, courseId } = useParams();
  const [searchParams] = useSearchParams();
  const targetVideoId = searchParams.get("video");
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

  // Playlist & Video State
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [videos, setVideos] = useState([]);
  const [durations, setDurations] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [channelInfo, setChannelInfo] = useState(null);

  // Watch Later State
  const [savedVideoIds, setSavedVideoIds] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Video Progress State
  const [videoProgress, setVideoProgress] = useState({});
  const lastSavedRef = useRef(0);

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizQueue, setQuizQueue] = useState([]);
  const [player, setPlayer] = useState(null);
  const [shownQuizzes, setShownQuizzes] = useState(new Set());

  // Summary Modal State
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [summaryProgress, setSummaryProgress] = useState(null);
  const [summaryDraft, setSummaryDraft] = useState([]);
  const [isGeneratingInBackground, setIsGeneratingInBackground] = useState(false);
  const [backgroundCountdown, setBackgroundCountdown] = useState(45);

  // Background summary countdown timer
  useEffect(() => {
    let interval = null;
    if (isGeneratingInBackground && backgroundCountdown > 0) {
      interval = setInterval(() => {
        setBackgroundCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGeneratingInBackground, backgroundCountdown]);

  // Reset background states on video change
  useEffect(() => {
    setIsGeneratingInBackground(false);
    setBackgroundCountdown(45);
  }, [selectedVideoId]);

  /* ======================================================
     HELPER FUNCTIONS
  ====================================================== */
  const formatDuration = (iso) => {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const h = parseInt(match?.[1] || 0);
    const m = parseInt(match?.[2] || 0);
    const s = parseInt(match?.[3] || 0);
    const hh = h > 0 ? `${h}:` : "";
    const mm = m < 10 && h > 0 ? `0${m}` : `${m}`;
    const ss = s < 10 ? `0${s}` : `${s}`;
    return `${hh}${mm}:${ss}`;
  };

  const durationToSeconds = (d) => {
    if (!d) return 0;
    const parts = d.split(":").map(Number);
    if (parts.length === 3)
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  };

  const updateCourseTotal = async (totalSeconds) => {
    if (!courseId || !channelId || totalSeconds <= 0) return;

    try {
      await mainApi.post(
        "/users/update-course-total",
        {
          courseId,
          channelId,
          totalSeconds,
        }
      );
    } catch (err) {
      console.error("❌ Failed to update course total", err.response?.data);
    }
  };

  /* ======================================================
     PROGRESS TRACKING
  ====================================================== */
  const saveProgress = async (seconds) => {
    if (!selectedVideoId) return;

    const duration = durations[selectedVideoId];
    if (!duration || duration <= 0) return;

    try {
      await mainApi.post(
        "/users/video-progress",
        {
          videoId: selectedVideoId,
          courseId,
          channelId,
          watchedSeconds: seconds,
          durationSeconds: duration,
        }
      );

      setVideoProgress((prev) => ({
        ...prev,
        [selectedVideoId]: seconds,
      }));
    } catch (err) {
      console.error("Progress save failed", err);
    }
  };

  const handleTimeUpdate = (currentTime) => {
    if (!selectedVideoId) return;

    setVideoProgress((prev) => ({
      ...prev,
      [selectedVideoId]: currentTime,
    }));

    if (currentTime - lastSavedRef.current >= 10) {
      lastSavedRef.current = currentTime;
      saveProgress(currentTime);
    }

    if (!quizQuestions || quizQuestions.length === 0) return;

    const dueQuizzes = quizQuestions.filter((q) => {
      const isVideoMatch = q.videoId === selectedVideoId || !q.videoId || q.videoId === "unknown_video";
      if (!isVideoMatch) return false;
      const quizTime = Math.floor(q.timestamp);
      const timeDiff = Math.abs(quizTime - currentTime);
      return timeDiff <= 2 && !shownQuizzes.has(q._id);
    });

    if (dueQuizzes.length > 0) {
      setQuizQueue((prev) => [...prev, ...dueQuizzes]);
      setShownQuizzes((prev) => {
        const newSet = new Set(prev);
        dueQuizzes.forEach((q) => newSet.add(q._id));
        return newSet;
      });
    }
  };

  /* ======================================================
     PLAYER HANDLERS
  ====================================================== */
  const handlePlayerReady = (event) => {
    const playerInstance = event.target;
    setPlayer(playerInstance);

    // ✅ Make sure selectedVideoId is set before this runs
    const savedTime = videoProgress[selectedVideoId];

    try {
      if (savedTime && savedTime > 5) {
        playerInstance.seekTo(savedTime, true);
      }
      playerInstance.playVideo(); // 🔥 REQUIRED FOR SINGLE VIDEO
    } catch (err) {
      console.error("Error in handlePlayerReady:", err);
    }
  };


  const handleStateChange = (event) => {
    const playerInstance = event.target;
    const state = event.data;

    // PLAYING
    if (state === 1) {
      if (playerInstance.interval) {
        clearInterval(playerInstance.interval);
      }

      playerInstance.interval = setInterval(() => {
        try {
          const currentTime = Math.floor(playerInstance.getCurrentTime());
          handleTimeUpdate(currentTime);
        } catch { }
      }, 1000);
    }
    // PAUSED / ENDED
    else {
      if (playerInstance.interval) {
        clearInterval(playerInstance.interval);
        playerInstance.interval = null;
      }

      try {
        const time = Math.floor(playerInstance.getCurrentTime());
        saveProgress(time);
      } catch { }
    }
  };

  const handleVideoSelect = (video) => {
    // Save current video progress
    if (player && selectedVideoId) {
      try {
        const time = Math.floor(player.getCurrentTime());
        saveProgress(time);
      } catch { }
    }

    if (player?.interval) {
      clearInterval(player.interval);
      player.interval = null;
    }

    lastSavedRef.current = 0;

    // ✅ USE THE VIDEO YOU CLICKED
    const vid =
      video?.snippet?.resourceId?.videoId ||
      video?.id;

    if (!vid) return;

    setSelectedVideo(video);
    setSelectedVideoId(vid);

    // Trigger video started logging in the backend
    mainApi.post(
      "/users/video-started-log",
      { videoId: vid }
    ).catch(() => {});

    // Reset quiz state
    setShownQuizzes(new Set());
    setQuizQueue([]);
    setIsQuizActive(false);
    setCurrentQuiz(null);
  };



  /* ======================================================
     WATCH LATER
  ====================================================== */
  const handleWatchLater = async () => {
    if (!selectedVideo) return;

    const videoId =
      selectedVideo?.snippet?.resourceId?.videoId ||
      selectedVideo?.id;

    if (savedVideoIds.has(videoId)) return;

    try {
      setIsSaving(true);
      await mainApi.post(
        "/users/watch-later",
        {
          videoId,
          title: selectedVideo.snippet.title,
          thumbnail: selectedVideo.snippet.thumbnails.medium.url,
          channelId,
          channelName: selectedVideo.snippet.channelTitle,
          courseId,
        }
      );

      setSavedVideoIds((prev) => new Set(prev).add(videoId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save video");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFetchSummary = async () => {
    if (!selectedVideoId) return;

    setSummaryError("");
    setSummaryText("");
    setSummaryDraft([]);
    setSummaryProgress(null);

    try {
      // 1. Check if summary exists in DB cache first
      const checkRes = await mainApi.get(
        `/users/video-summary/${selectedVideoId}/check`
      );

      const exists = checkRes.data?.success && checkRes.data?.exists;

      if (exists) {
        // Summary exists - open modal instantly and pause video
        setIsSummaryModalOpen(true);
        setIsSummaryLoading(true);

        const res = await mainApi.get(
          `/users/video-summary/${selectedVideoId}`
        );

        if (res.data?.success) {
          setSummaryText(res.data.summary);
          
          // Pause the video
          if (player) {
            try {
              player.pauseVideo();
            } catch (err) {
              console.error("Failed to pause video", err);
            }
          }
        } else {
          setSummaryError("Failed to load summary.");
        }
        setIsSummaryLoading(false);
      } else {
        // Keep the player running, but open the modal immediately and render server-sent
        // chunk progress/draft segment summaries while final aggregation is still running.
        setIsGeneratingInBackground(true);
        setBackgroundCountdown(45);
        setIsSummaryModalOpen(true);
        setIsSummaryLoading(true);

        try {
          const summary = await new Promise((resolve, reject) => {
            const stream = new EventSource(
              `${USER_API}/users/video-summary/${selectedVideoId}/stream`,
              { withCredentials: true }
            );

            stream.addEventListener("progress", (event) => {
              const progress = JSON.parse(event.data);
              setSummaryProgress(progress);
              if (progress.type === "chunk" && progress.partialSummary) {
                setSummaryDraft((previous) => [...previous, progress.partialSummary]);
              }
            });
            stream.addEventListener("complete", (event) => {
              stream.close();
              resolve(JSON.parse(event.data).summary);
            });
            stream.addEventListener("error", (event) => {
              // Native EventSource also emits an empty error when the server closes.
              if (event.data) {
                try {
                  reject(new Error(JSON.parse(event.data).message));
                } catch {
                  reject(new Error("Failed to generate video summary."));
                }
              } else if (stream.readyState === EventSource.CLOSED) {
                reject(new Error("The summary stream closed before completion."));
              }
            });
          });

          setSummaryText(summary);
          if (player) {
            try {
              player.pauseVideo();
            } catch (err) {
              console.error("Failed to pause video", err);
            }
          }
        } catch (err) {
          console.error("Error generating background summary:", err);
          setSummaryError(
            err.message || "Failed to generate video summary."
          );
        } finally {
          setIsGeneratingInBackground(false);
          setIsSummaryLoading(false);
        }
      }
    } catch (err) {
      console.error("Error checking summary status:", err);
      setIsSummaryModalOpen(true);
      setSummaryError(
        err.response?.data?.message || "Failed to check summary status."
      );
    }
  };

  const handleDownloadSummary = async () => {
    if (!summaryText) return;

    try {
      const title = selectedVideo?.snippet?.title || "Video Summary";
      const channelName = channelInfo?.name || "Unknown Channel";
      const res = await mainApi.get(
        `/users/video-summary/${selectedVideoId}/download`,
        {
          params: { title, channelName },
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${sanitizedTitle}_summary.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF summary", err);
      alert("Failed to download PDF summary");
    }
  };

  /* ======================================================
     QUIZ HANDLERS
  ====================================================== */
  const handleQuizSubmit = (selectedAnswer) => {
    setTimeout(() => {
      if (player) {
        try {
          player.playVideo();
        } catch (err) {
          console.error("Error playing video:", err);
        }
      }
      setQuizQueue((prev) => prev.slice(1));
      setIsQuizActive(false);
      setCurrentQuiz(null);
    }, 2000);
  };

  const handleQuizClose = () => {
    if (player) {
      try {
        player.playVideo();
      } catch (err) {
        console.error("Error playing video:", err);
      }
    }
    setQuizQueue((prev) => prev.slice(1));
    setIsQuizActive(false);
    setCurrentQuiz(null);
  };

  /* ======================================================
     EFFECTS
  ====================================================== */

  // Fetch saved videos
  useEffect(() => {
    const fetchSavedVideos = async () => {
      try {
        const res = await mainApi.get("/users/watch-later");
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          const ids = new Set(res.data.data.map((v) => v.videoId));
          setSavedVideoIds(ids);
        }
      } catch (err) {
        console.error("Failed to fetch saved videos", err);
      }
    };
    fetchSavedVideos();
  }, []);

  // Fetch video progress
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await mainApi.get(
          `/users/video-progress/${courseId}/${channelId}`
        );

        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          const map = {};
          res.data.data.forEach((v) => {
            map[v.videoId] = v.watchedSeconds;
          });
          setVideoProgress(map);
        }
      } catch (err) {
        console.error("Failed to fetch progress", err);
      }
    };
    fetchProgress();
  }, [courseId, channelId]);

  // Fetch quizzes for the selected video from the incremental quiz DB
  useEffect(() => {
    let timer = null;

    const fetchVideoQuizzes = async () => {
      if (!selectedVideoId) return;

      try {
        const res = await mainApi.get(`/quizzes/${selectedVideoId}`);

        if (res.data.success && Array.isArray(res.data.data)) {
          // Map incremental quiz structure to expected frontend format
          const formattedQuestions = [];
          let hasPending = false;
          
          res.data.data.forEach((topicQuiz) => {
            if (topicQuiz.status === "PENDING" || topicQuiz.status === "GENERATING") {
              hasPending = true;
            }

            if (topicQuiz.status === "READY" && Array.isArray(topicQuiz.questions)) {
              topicQuiz.questions.forEach((q, idx) => {
                formattedQuestions.push({
                  _id: `${topicQuiz._id || topicQuiz.topic}-${idx}`,
                  videoId: topicQuiz.videoId,
                  topic: topicQuiz.topic,
                  question: q.question,
                  // Options must be mapped from key-value object to string array
                  options: [q.options.A, q.options.B, q.options.C, q.options.D].filter(Boolean),
                  // correctAnswer must be the actual option text string
                  correctAnswer: q.options[q.correctAnswer] || q.correctAnswer,
                  timestamp: topicQuiz.triggerTime, // Pop at triggerTime
                });
              });
            }
          });

          setQuizQuestions(formattedQuestions);
          console.log(`[Frontend Quiz] Loaded ${formattedQuestions.length} READY questions from incremental DB. Pending status: ${hasPending}`);

          // If there are pending quizzes, schedule a refetch in 10 seconds
          if (hasPending) {
            timer = setTimeout(fetchVideoQuizzes, 10000);
          }
        } else {
          setQuizQuestions([]);
        }
      } catch (err) {
        console.error("❌ Failed to fetch video quizzes", err);
        setQuizQuestions([]);
      }
    };

    fetchVideoQuizzes();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [selectedVideoId]);

  // Fetch channel info
  useEffect(() => {
    const fetchChannelFromBackend = async () => {
      try {
        const res = await contentApi.get(`/channels/course/${courseId}`);
        const channel = (res.data || []).find((c) => c._id === channelId);

        if (!channel) return;

        setChannelInfo({
          name: channel.name,
          imageUrl: channel.imageUrl,
        });
      } catch (err) {
        console.error("Failed to fetch channel", err);
      }
    };

    fetchChannelFromBackend();
  }, [courseId, channelId]);

  // Fetch playlists
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        const response = await contentApi.get("/playlists", {
          params: {
            channelId,
            courseId
          }
        });
        const data = response.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          setSelectedPlaylist(data[0]);
        } else {
          setSelectedPlaylist(null);
        }
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
        setSelectedPlaylist(null);
      } finally {
        setLoading(false);
      }
    };
    if (channelId && courseId) fetchPlaylists();
  }, [channelId, courseId]);

  useEffect(() => {
    const fetchContent = async () => {
      if (!selectedPlaylist || !channelInfo) return;

      const contentLink = selectedPlaylist.link;
      const contentType = selectedPlaylist.type;

      let videoItems = [];

      try {
        // ===============================
        // 1️⃣ FETCH VIDEOS
        // ===============================
        if (contentType === "playlist") {
  videoItems = [];
  let nextPageToken = "";

  while (true) {
    const response = await youtubeaxios.get(
      "https://www.googleapis.com/youtube/v3/playlistItems",
      {
        params: {
          part: "snippet,contentDetails",
          playlistId: contentLink,
          key: YOUTUBE_API_KEY,
          maxResults: 50,
          pageToken: nextPageToken,
        },
      }
    );

    videoItems.push(...response.data.items);

    if (!response.data.nextPageToken) break;

    nextPageToken = response.data.nextPageToken;
  }
} else if (contentType === "video") {
          const videoId = contentLink; // 🔥 already a video ID

          if (!videoId) {
            console.error("❌ Missing videoId for single video");
            return;
          }

          const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
          const videoRes = await youtubeaxios.get(videoUrl);

          const videoItem = videoRes.data.items?.[0];

          if (videoItem) {
            videoItems = [
              {
                id: videoItem.id,
                snippet: {
                  ...videoItem.snippet,
                  resourceId: { videoId: videoItem.id },
                },
                contentDetails: videoItem.contentDetails,
              },
            ];
          }
        }



        if (!videoItems.length) return;

        setVideos(videoItems);

        // ===============================
        // 2️⃣ SELECT VIDEO (FIXED)
        // ===============================
        let initialVideo = null;

        if (targetVideoId) {
          initialVideo = videoItems.find((v) => {
            const vid =
              v?.snippet?.resourceId?.videoId ||
              v?.id;
            return vid === targetVideoId;
          });
        }

        if (!initialVideo) {
          initialVideo = videoItems[0];
        }

        const selectedVid =
          initialVideo?.snippet?.resourceId?.videoId ||
          initialVideo?.id;

        setSelectedVideo(initialVideo);
        setSelectedVideoId(selectedVid);

        // ===============================
        // 3️⃣ START LEARNING
        // ===============================
        try {
          await mainApi.post(
            "/users/start-learning",
            {
              courseId,
              courseTitle: selectedPlaylist.courseId?.name || "Unknown Course",
              courseThumbnail: "",
              channelId,
              channelName: channelInfo.name,
              channelThumbnail: channelInfo.imageUrl || "",
            }
          );

          console.log("✅ start-learning initialized");
        } catch (err) {
          console.error(
            "❌ start-learning failed",
            err.response?.data || err.message
          );
        }

        // ===============================
        // 4️⃣ FETCH DURATIONS (FIXED)
        // ===============================
        const videoIds = videoItems
          .map((v) => v?.snippet?.resourceId?.videoId || v?.id)
          .filter(Boolean)
          .join(",");

        if (videoIds) {
          const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
          const videosRes = await youtubeaxios.get(videosUrl);

          const newDurations = {};
          videosRes.data.items?.forEach((video) => {
            newDurations[video.id] = durationToSeconds(
              formatDuration(video.contentDetails.duration)
            );
          });

          setDurations(newDurations);
        }

        // Incremental quizzes are fetched on selectedVideoId change from Port 5000.
      } catch (error) {
        console.error("❌ fetchContent failed", error);
      }
    };

    fetchContent();
  }, [selectedPlaylist, targetVideoId, channelInfo]);


  // Cleanup intervals
  useEffect(() => {
    return () => {
      if (player?.interval) {
        clearInterval(player.interval);
      }
    };
  }, [player]);

  // Trigger quiz modal
  useEffect(() => {
    if (!isQuizActive && quizQueue.length > 0) {
      const nextQuiz = quizQueue[0];
      setCurrentQuiz(nextQuiz);
      setIsQuizActive(true);
      if (player) {
        try {
          player.pauseVideo();
        } catch (err) {
          console.error("Error pausing video:", err);
        }
      }
    }
  }, [quizQueue, isQuizActive, player]);

  // Update course total
  useEffect(() => {
    if (!videos.length) return;

    const allDurationsReady = videos.every(
      (v) => durations[v.snippet.resourceId.videoId] > 0
    );

    if (!allDurationsReady) return;

    const totalPlaylistSeconds = videos.reduce((sum, v) => {
      const id = v.snippet.resourceId.videoId;
      return sum + (durations[id] || 0);
    }, 0);

    if (totalPlaylistSeconds > 0) {
      updateCourseTotal(totalPlaylistSeconds);
    }
  }, [videos, durations, courseId, channelId]);

  // Save progress on page unload
  useEffect(() => {
    const handleUnload = () => {
      if (player && selectedVideoId) {
        try {
          const time = Math.floor(player.getCurrentTime());
          saveProgress(time);
        } catch { }
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [player, selectedVideoId]);

  /* ======================================================
     GUARD CLAUSES
  ====================================================== */
  if (!channelId || !courseId) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Invalid Video Link</h2>
        <p className="text-gray-500 mt-2">Please open the video again.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!selectedPlaylist) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">No Content Found</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-8 px-8 py-3 bg-[#1A1A1A] text-white rounded-full font-bold hover:bg-black transition-colors shadow-lg hover:-translate-y-1"
        >
          Go Back
        </button>
      </div>
    );
  }

  /* ======================================================
     RENDER
  ====================================================== */
  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] selection:text-black pb-20 relative overflow-x-hidden">
      {/* GLOBAL BACKGROUND BLOBS */}
      <div className="fixed inset-0 pointer-events-none -z-50">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-t from-pink-50 to-transparent rounded-full blur-[120px] opacity-60" />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* COMBINED NAVIGATION BAR - Back Button + User Avatar */}
        <div className="flex items-center justify-between mb-8 relative z-50">
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

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <PlayListPlayer
            video={selectedVideo}
            onPlayerReady={handlePlayerReady}
            onStateChange={handleStateChange}
            onWatchLater={handleWatchLater}
            isSaved={savedVideoIds.has(selectedVideoId)}
            isSaving={isSaving}
          />
          <PlayListSidebar
            videos={videos}
            durations={durations}
            onVideoSelect={handleVideoSelect}
            selectedVideoId={selectedVideoId}
            channelData={
              channelInfo || {
                name: "Loading...",
                imageUrl: "/fallback.jpg",
              }
            }
            videoProgress={videoProgress}
            channelId={channelId}
            courseId={courseId}
            onFetchSummary={handleFetchSummary}
            isGeneratingInBackground={isGeneratingInBackground}
            backgroundCountdown={backgroundCountdown}
          />
        </div>
      </div>

      {isQuizActive && currentQuiz && (
        <QuizModal
          quiz={currentQuiz}
          onAnswer={handleQuizSubmit}
          onClose={handleQuizClose}
        />
      )}

      {isSummaryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl w-full max-w-3xl overflow-hidden relative flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-950 text-lg">AI Video Summary</h3>
                </div>
              </div>
              
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-950 hover:shadow transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-8 overflow-y-auto flex-1 text-gray-700 leading-relaxed font-sans text-[15px] space-y-4">
              {isSummaryLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="relative w-16 h-16">
                    {/* Ring loader */}
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin"></div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-gray-950 text-base">Generating Video Summary...</p>
                    <p className="text-xs text-gray-500 max-w-sm">
                      {summaryProgress?.stage === "fetching_transcript"
                        ? "Fetching the transcript…"
                        : summaryProgress?.stage === "finalizing"
                          ? "Combining the completed segments into your final study guide…"
                          : summaryProgress?.total
                            ? `Summarized ${summaryDraft.length} of ${summaryProgress.total} segments. More results will appear below as they finish.`
                            : "Preparing the transcript…"}
                    </p>
                  </div>
                  {summaryDraft.length > 0 && (
                    <div className="w-full max-w-2xl text-left bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Draft segment summaries</p>
                      {summaryDraft.map((draft, index) => (
                        <p key={index} className="text-sm text-indigo-950 leading-relaxed">{draft}</p>
                      ))}
                    </div>
                  )}
                </div>
              ) : summaryError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-gray-950">Failed to Generate Summary</p>
                    <p className="text-sm text-gray-500 max-w-md">{summaryError}</p>
                  </div>
                  <button
                    onClick={handleFetchSummary}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-extrabold text-gray-950 mt-6 mb-3 pb-2 border-b border-gray-200">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold text-gray-900 mt-5 mb-2">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2">{children}</h3>
                      ),
                      h4: ({ children }) => (
                        <h4 className="text-base font-bold text-gray-900 mt-3 mb-1.5">{children}</h4>
                      ),
                      p: ({ children }) => (
                        <p className="text-gray-700 leading-relaxed mb-3">{children}</p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-gray-600">{children}</em>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 space-y-1.5 text-gray-700 mb-3">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 space-y-1.5 text-gray-700 mb-3">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-relaxed">{children}</li>
                      ),
                      hr: () => (
                        <hr className="my-4 border-gray-200" />
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-indigo-300 bg-indigo-50/50 pl-4 py-2 my-3 rounded-r-lg text-gray-700 italic">{children}</blockquote>
                      ),
                      code: ({ children }) => (
                        <code className="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                      ),
                    }}
                  >
                    {summaryText}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              {!isSummaryLoading && !summaryError && summaryText && (
                <button
                  onClick={handleDownloadSummary}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <Download className="w-4 h-4" /> Download Summary
                </button>
              )}
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="px-6 py-2.5 bg-gray-950 hover:bg-black text-white rounded-xl text-sm font-bold shadow hover:shadow-md transition-all cursor-pointer active:scale-98"
              >
                Close Summary
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
