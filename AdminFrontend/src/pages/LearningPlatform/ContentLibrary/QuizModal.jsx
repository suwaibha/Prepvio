import React, { useState, useEffect } from "react";
import axios from "axios";
import { CONTENT_API_URL } from "../../../config/api";
import { X, Plus, Trash2, Clock, HelpCircle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const QuizModal = ({ video, playlist, channelName, courseName, onClose }) => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    timestamp: 0,
    question: "",
    options: ["", ""],
    correctAnswer: ""
  });

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${CONTENT_API_URL}/quizzes/by-video/${playlist._id}/${video.videoId}`
      );
      setQuiz(res.data.quiz); // Get the nested videoQuiz object
    } catch (err) {
      if (err.response?.status === 404) {
        setQuiz(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (video && playlist) {
      fetchQuiz();
    }
  }, [video, playlist]);

  const addQuestion = async () => {
    if (!newQuestion.question || newQuestion.options.some(opt => !opt) || !newQuestion.correctAnswer) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await axios.post(`${CONTENT_API_URL}/quizzes/by-course`, {
        playlistId: playlist._id,
        videoId: video.videoId,
        videoTitle: video.title, // Pass video title to the backend
        channelName: channelName,
        courseName: courseName,
        questions: [newQuestion],
      });

      // Update the local state with the new data
      setQuiz(res.data.quiz.videos.find(v => v.videoId === video.videoId));

      // Reset form
      setNewQuestion({ timestamp: 0, question: "", options: ["", ""], correctAnswer: "" });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const deleteQuestion = async (questionId) => {
    try {
      // Corrected DELETE endpoint
      const res = await axios.delete(`${CONTENT_API_URL}/quizzes/${playlist._id}/${video.videoId}/questions/${questionId}`);
      setQuiz(res.data.quiz.videos.find(v => v.videoId === video.videoId));
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-start pt-20 z-50 overflow-auto p-4 transition-all duration-300">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] p-8 relative shadow-2xl border border-white/50 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-100/50 text-slate-500 rounded-full hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-8 pr-12">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{video.title}</h2>
          <p className="text-lg text-indigo-500 font-bold flex items-center gap-2 mt-1">
            <HelpCircle className="w-5 h-5" /> Quiz Management
          </p>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-slate-500 font-bold animate-pulse">Loading quiz data...</p>
          </div>
        ) : error && error !== "Request failed with status code 404" ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-6 font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : null}

        <div className="space-y-8">
          {/* Questions List */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Existing Questions</h3>
            {quiz?.questions?.length ? (
              <ul className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {quiz.questions.map((q, index) => (
                  <li key={q._id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-indigo-100 transition-colors group">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-white px-3 py-1 rounded-lg text-xs font-black text-slate-700 shadow-sm border border-slate-100">Q{index + 1}</span>
                          <span className="flex items-center gap-1 text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg"><Clock className="w-3 h-3" /> {q.timestamp}s</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg mb-3">{q.question}</h4>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                          {q.options.map((opt, i) => (
                            <li key={i} className={`flex items-center gap-2 p-2 rounded-lg ${opt === q.correctAnswer ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100' : 'bg-white border border-slate-100'}`}>
                              {opt === q.correctAnswer ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <span className="w-4 h-4 block border-2 border-slate-200 rounded-full"></span>}
                              {opt}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        onClick={() => deleteQuestion(q._id)}
                        className="p-2 bg-white text-red-500 rounded-xl hover:bg-red-50 hover:text-red-600 border border-slate-100 shadow-sm transition-all"
                        title="Delete Question"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">No questions added yet.</p>
              </div>
            )}
          </div>

          {/* Add New Question Form */}
          <div className="bg-indigo-50/50 rounded-[2rem] p-8 border border-indigo-100">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Plus className="w-6 h-6 text-indigo-500" /> Add New Question
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Time (sec)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newQuestion.timestamp}
                    onChange={e => setNewQuestion({ ...newQuestion, timestamp: Number(e.target.value) })}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-bold text-center"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Question Text</label>
                  <input
                    type="text"
                    placeholder="What is the main concept...?"
                    value={newQuestion.question}
                    onChange={e => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newQuestion.options.map((opt, idx) => (
                  <div key={idx}>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Option {idx + 1}</label>
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={e => {
                        const newOptions = [...newQuestion.options];
                        newOptions[idx] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: newOptions });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-medium"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setNewQuestion({ ...newQuestion, options: [...newQuestion.options, ""] })}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Another Option
              </button>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correct Answer (Must match one option exactly)</label>
                <input
                  type="text"
                  placeholder="Paste the correct answer here..."
                  value={newQuestion.correctAnswer}
                  onChange={e => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                  className="w-full bg-white border-2 border-emerald-100 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-emerald-900 placeholder-emerald-200/70"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={addQuestion}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Save Question
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizModal;
