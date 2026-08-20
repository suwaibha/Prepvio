import React, { useState, useEffect } from "react";
import axios from "axios";
import { CONTENT_API_URL } from "../../../config/api";
import { ArrowLeft, Edit, Video, Loader2, Play, ExternalLink } from "lucide-react";
import QuizModal from "./QuizModal";

const VideoList = ({ playlist, channelName, courseName, onBack }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    if (!playlist?.link) return;

    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${CONTENT_API_URL}/videos/youtube/${playlist.link}`
        );
        setVideos(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to fetch videos");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [playlist?.link]);

  return (
    <div className="p-8 w-full space-y-8 text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={onBack}
              className="p-3 bg-white text-slate-500 rounded-xl hover:bg-slate-50 border border-slate-200 shadow-sm transition-all hover:-translate-x-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                {playlist.title || "Playlist Content"}
                <span className="text-sm font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1">
                  {videos.length} Videos
                </span>
              </h1>
              <p className="text-slate-500 font-bold text-sm mt-1 flex items-center gap-2">
                <span className="text-indigo-600">{channelName}</span>
                <span className="text-slate-300">•</span>
                <span>{courseName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
              <p className="text-slate-600 font-bold text-lg animate-pulse tracking-tight">Syncing with YouTube...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-3xl border border-red-100 text-center">
              <p className="text-red-500 font-bold text-lg mb-2">{error}</p>
              <p className="text-red-400 text-sm">Please check the playlist URL.</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-60">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Video className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-slate-800 font-black text-2xl">No videos found</h3>
              <p className="text-slate-500 font-medium mt-2">This playlist appears to be empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {videos.map((video) => (
                <div
                  key={video.videoId}
                  className="group bg-white rounded-[2rem] border border-slate-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-slate-200 overflow-hidden group">
                    <img
                      src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => { e.target.src = "https://via.placeholder.com/480x270?text=Video+Thumbnail"; }}
                    />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors duration-300 flex items-center justify-center">
                      <a
                        href={video.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-all duration-300 hover:bg-white hover:text-indigo-600 shadow-xl"
                      >
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </a>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-4 line-clamp-2 h-14" title={video.title}>
                      {video.title || "Untitled Video"}
                    </h3>

                    <div className="mt-auto space-y-3">
                      <button
                        onClick={() => setSelectedVideo(video)}
                        className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" /> Manage Quiz
                      </button>
                      <a
                        href={video.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-white border-2 border-slate-100 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" /> Open on YouTube
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quiz Modal */}
      {selectedVideo && (
        <QuizModal
          video={selectedVideo}
          playlist={playlist}
          channelName={channelName}
          courseName={courseName}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
};

export default VideoList;
