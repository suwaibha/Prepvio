import React, { useState, useEffect } from "react";
import axios from "axios";
import { CONTENT_API_URL } from "../../../config/api";
import { Plus, Trash2, Edit, ArrowLeft, Clock, CheckCircle2, AlertCircle, HelpCircle, Save, X } from "lucide-react";
import Modal from "../../../Components/Modal";
import DeleteConfirmationModal from "../../../Components/DeleteConfirmationModal";

const QuizManagement = ({ playlistId, videoId, channelName, courseName, onBack }) => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [currentEditQuestion, setCurrentEditQuestion] = useState(null);
  const [formData, setFormData] = useState({
    timestamp: "",
    question: "",
    options: "",
    correctAnswer: "",
  });

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  const API_URL = `${CONTENT_API_URL}/quizzes`;

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/by-video/${playlistId}/${videoId}`);
      setQuiz(res.data.quiz); // Set the state with the nested videoQuiz object
    } catch (err) {
      if (err.response?.status === 404) {
        setQuiz(null);
      } else {
        setError("Error fetching quiz: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (playlistId && videoId) {
      fetchQuiz();
    }
  }, [playlistId, videoId]);

  const handleOpenModal = (type, question = null) => {
    setModalType(type);
    setCurrentEditQuestion(question);
    setFormData(
      question
        ? {
          timestamp: question.timestamp,
          question: question.question,
          options: question.options.join(", "),
          correctAnswer: question.correctAnswer,
        }
        : { timestamp: "", question: "", options: "", correctAnswer: "" }
    );
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentEditQuestion(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const optionsArray = formData.options.split(",").map((opt) => opt.trim());
    if (optionsArray.length < 2) {
      setError("Please provide at least 2 options");
      setLoading(false);
      return;
    }

    if (!optionsArray.includes(formData.correctAnswer.trim())) {
      setError("Correct answer must be one of the provided options");
      setLoading(false);
      return;
    }

    const questionData = {
      timestamp: Number(formData.timestamp),
      question: formData.question.trim(),
      options: optionsArray,
      correctAnswer: formData.correctAnswer.trim(),
    };

    try {
      if (modalType === "add") {
        const requestData = {
          playlistId,
          videoId,
          channelName,
          courseName,
          questions: [questionData],
        };

        await axios.post(`${API_URL}/by-course`, requestData);
      } else if (modalType === "edit" && currentEditQuestion) {
        await axios.put(
          `${API_URL}/${quiz._id}/videos/${videoId}/questions/${currentEditQuestion._id}`,
          questionData
        );
      }
      handleCloseModal();
      fetchQuiz();
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Failed to ${modalType} question`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (question) => {
    setQuestionToDelete(question);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/${quiz._id}/${videoId}/questions/${questionToDelete._id}`);
      fetchQuiz();
      setIsDeleteModalOpen(false);
      setQuestionToDelete(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to delete question";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (loading && !quiz) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button
                onClick={onBack}
                className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">Quiz Management</h1>
                <p className="text-slate-500 font-medium text-sm mt-1 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                  Manage questions for <span className="text-indigo-600 font-bold">{courseName}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => handleOpenModal("add")}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold active:scale-95 w-full md:w-auto justify-center"
              disabled={loading}
            >
              <Plus className="w-5 h-5" />
              <span>Add Question</span>
            </button>
          </div>

          {/* Context Info */}
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap gap-4 items-center text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-xs">Channel:</span>
              <span className="font-semibold text-slate-800">{channelName}</span>
            </div>
            <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-xs">Video ID:</span>
              <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono text-indigo-500 font-bold">{videoId}</code>
            </div>
            <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-xs">Total Questions:</span>
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold text-xs">{quiz?.questions?.length || 0}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Questions List */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Time</th>
                  <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Question</th>
                  <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Options</th>
                  <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Correct Answer</th>
                  <th className="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {quiz?.questions?.length ? (
                  quiz.questions
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map((q) => (
                      <tr key={q._id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(q.timestamp)}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm font-semibold text-slate-700 max-w-xs">
                          <div className="line-clamp-2" title={q.question}>{q.question}</div>
                        </td>
                        <td className="px-8 py-6 text-sm text-slate-500 max-w-xs">
                          <div className="line-clamp-2 text-xs" title={q.options.join(", ")}>
                            {q.options.join(", ")}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-emerald-600 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {q.correctAnswer}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenModal("edit", q)}
                              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(q)}
                              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center opacity-50">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <HelpCircle className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No questions added yet.</p>
                        <p className="text-slate-400 text-sm">Click "Add Question" to get started.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 relative shadow-2xl border border-white/50 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <button
                onClick={handleCloseModal}
                className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {modalType === "add" ? "Add New Question" : "Edit Question"}
                </h2>
                <p className="text-slate-500 text-sm mt-1">Configure the question details and correct answer.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Timestamp (seconds)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      name="timestamp"
                      value={formData.timestamp}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                      placeholder="e.g. 30"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 ml-1">Time when the question appears in the video.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Question Text</label>
                  <textarea
                    name="question"
                    value={formData.question}
                    onChange={handleChange}
                    rows="3"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white transition-all outline-none resize-none"
                    placeholder="Type your question here..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Options</label>
                  <input
                    type="text"
                    name="options"
                    value={formData.options}
                    onChange={handleChange}
                    placeholder="Option A, Option B, Option C, Option D"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1.5 ml-1">Separate options with commas. At least 2 options required.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Correct Answer</label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-4 top-3.5 w-4 h-4 text-emerald-500" />
                    <input
                      type="text"
                      name="correctAnswer"
                      value={formData.correctAnswer}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-emerald-50/50 border-2 border-emerald-100 rounded-xl font-bold text-emerald-700 focus:border-emerald-500 focus:bg-white transition-all outline-none placeholder-emerald-300"
                      placeholder="Exact match of one option"
                      required
                    />
                  </div>
                </div>

                {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg">{error}</div>}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-8">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                    disabled={loading}
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    {modalType === "add" ? "Add Question" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setQuestionToDelete(null);
        }}
        onConfirm={confirmDeleteQuestion}
        itemName={questionToDelete?.question}
        title="Delete Question"
      />
    </div>
  );
};

export default QuizManagement;
