import React, { useState, useEffect } from "react";
import axios from "axios";
import { CONTENT_API_URL } from "../../../config/api";
import { Loader2, ExternalLink, CheckCircle2, XCircle, Clock, MessageSquare, Send, Target, Filter, User, AlertCircle, X, RefreshCw, Server } from "lucide-react";

const ProjectSubmissions = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviewModal, setReviewModal] = useState({ open: false, submission: null });
    const [feedback, setFeedback] = useState("");
    const [status, setStatus] = useState("reviewed");
    const [actionLoading, setActionLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [connectionError, setConnectionError] = useState(false);

    const API_URL = `${CONTENT_API_URL}/project-submissions`;

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        setConnectionError(false);

        try {
            const res = await axios.get(API_URL, { timeout: 5000 });
            console.log('Submissions response:', res.data); // Debug log

            // Validate response data
            if (!res.data) {
                throw new Error('No data received from server');
            }

            const submissionsData = Array.isArray(res.data) ? res.data : [];
            console.log('Processed submissions:', submissionsData); // Debug log

            setSubmissions(submissionsData);
            setConnectionError(false);
        } catch (err) {
            console.error("Failed to fetch submissions:", err);
            console.error("Error details:", {
                code: err.code,
                message: err.message,
                response: err.response?.data
            });

            if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK' || !err.response) {
                setConnectionError(true);
                setError("Cannot connect to the content backend. Please check the environment configuration.");
            } else if (err.response?.status === 404) {
                setConnectionError(true);
                setError("Submissions endpoint not found. Please check your backend API routes.");
            } else if (err.response?.status === 500) {
                setError("Server error occurred. Please check your backend logs.");
            } else {
                setError(err.response?.data?.message || err.message || "Failed to load submissions");
            }
            setSubmissions([]);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleRetry = () => {
        fetchSubmissions();
    };

    const handleOpenReview = (submission) => {
        if (!submission || !submission._id) {
            console.error('Invalid submission data:', submission);
            setError('Invalid submission data');
            return;
        }

        setReviewModal({ open: true, submission });
        setFeedback(submission.feedback || "");
        setStatus(submission.status === 'pending' ? 'reviewed' : submission.status);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!reviewModal.submission?._id) {
            alert('Invalid submission ID');
            return;
        }

        if (!feedback.trim()) {
            alert('Please provide feedback before submitting');
            return;
        }

        setActionLoading(true);
        setError(null);

        try {
            await axios.put(`${API_URL}/${reviewModal.submission._id}`, {
                status,
                feedback: feedback.trim()
            }, { timeout: 5000 });

            setReviewModal({ open: false, submission: null });
            fetchSubmissions(true);
        } catch (err) {
            console.error('Review submission error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to submit review';
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredSubmissions = submissions.filter(sub => filterStatus === "all" || sub.status === filterStatus);

    const getStatusColor = (status) => {
        switch (status) {
            case 'reviewed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'reviewed': return <CheckCircle2 className="w-3.5 h-3.5" />;
            case 'rejected': return <XCircle className="w-3.5 h-3.5" />;
            default: return <Clock className="w-3.5 h-3.5" />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Card */}
                <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-blue-200 text-white">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">Project Submissions</h1>
                                <p className="text-slate-500 font-medium text-sm mt-1">Review and provide feedback on student projects</p>
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="relative group w-full md:w-48">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Filter className="w-4 h-4 text-slate-400" />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={connectionError}
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="reviewed">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Error Notification */}
                {error && !connectionError && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-sm flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{error}</span>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700"><X className="w-4 h-4" /></button>
                    </div>
                )}

                {/* Connection Error State */}
                {connectionError ? (
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="flex flex-col items-center justify-center py-32 gap-6 px-8">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border-2 border-red-100">
                                <Server className="w-10 h-10 text-red-500" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-slate-800">Connection Failed</h3>
                                <p className="text-slate-600 font-medium max-w-md">
                                    Unable to connect to the submissions API. Please ensure:
                                </p>
                                <ul className="text-sm text-slate-500 space-y-1 mt-4 text-left max-w-md mx-auto">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 font-bold">•</span>
                                        <span>The content backend URL is configured through the application environment.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 font-bold">•</span>
                                        <span>The route <code className="px-2 py-0.5 bg-slate-100 rounded font-mono text-xs">/api/project-submissions</code> exists in your backend</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 font-bold">•</span>
                                        <span>Check browser console (F12) for detailed error messages</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 font-bold">•</span>
                                        <span>CORS is configured to allow requests from this origin</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 font-bold">•</span>
                                        <span>Database connection is active and the ProjectSubmission model exists</span>
                                    </li>
                                </ul>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-bold active:scale-95 mt-4"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Retry Connection
                            </button>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-slate-500 font-semibold animate-pulse">Fetching submissions...</p>
                    </div>
                ) : (
                    /* Grid View */
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredSubmissions.length > 0 ? (
                            filteredSubmissions.map((sub) => (
                                <div key={sub._id} className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-full h-1.5 ${sub.status === 'reviewed' ? 'bg-emerald-500' : sub.status === 'rejected' ? 'bg-red-500' : 'bg-amber-400'}`}></div>

                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 line-clamp-1" title={sub.projectTitle || 'Untitled Project'}>{sub.projectTitle || 'Untitled Project'}</h3>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                                    ID: <span className="font-mono">{typeof sub.userId === 'string' ? sub.userId.substring(0, 8) : (sub.userId?._id ? sub.userId._id.substring(0, 8) : 'Unknown')}...</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`pl-2.5 pr-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 border ${getStatusColor(sub.status)}`}>
                                            {getStatusIcon(sub.status)}
                                            {sub.status === 'reviewed' ? 'Approved' : sub.status}
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-grow">
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <ExternalLink size={14} className="text-blue-500" />
                                                <span className="text-xs font-bold text-blue-600 uppercase">Live Demo</span>
                                            </div>
                                            {sub.link ? (
                                                <a href={sub.link} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-700 hover:text-blue-600 hover:underline break-all transition-colors block">
                                                    {sub.link}
                                                </a>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">No link provided</span>
                                            )}
                                        </div>

                                        {sub.notes && (
                                            <div className="px-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Student Notes</span>
                                                <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">"{sub.notes}"</p>
                                            </div>
                                        )}

                                        {sub.feedback && (
                                            <div className="px-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Your Feedback</span>
                                                <p className="text-sm text-slate-700 font-medium bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                                    {sub.feedback}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 mt-6 flex justify-between items-center border-t border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submitted</span>
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mt-0.5">
                                                <Clock size={12} className="text-slate-400" />
                                                {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Unknown date'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleOpenReview(sub)}
                                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                                        >
                                            <MessageSquare size={14} />
                                            {sub.status === 'pending' ? 'Review' : 'Edit'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] shadow-sm border border-slate-100/50">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <Target className="text-slate-300" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">No submissions found</h3>
                                <p className="text-slate-500 text-sm mt-1">There are no project submissions matching your filter.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {reviewModal.open && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 relative shadow-2xl border border-white/50 animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setReviewModal({ open: false, submission: null })}
                            className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 hover:text-slate-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Review Submission</h2>
                            <p className="text-slate-500 text-sm mt-1">
                                Evaluating <span className="font-bold text-slate-800">{reviewModal.submission?.projectTitle}</span>
                            </p>
                        </div>

                        <form onSubmit={handleSubmitReview} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Status</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStatus('reviewed')}
                                        className={`py-3 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center gap-1 ${status === 'reviewed'
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                            : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-200'
                                            }`}
                                    >
                                        <CheckCircle2 className={`w-5 h-5 ${status === 'reviewed' ? 'text-emerald-500' : 'text-slate-300'}`} />
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatus('pending')}
                                        className={`py-3 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center gap-1 ${status === 'pending'
                                            ? 'bg-amber-50 border-amber-500 text-amber-700'
                                            : 'bg-white border-slate-100 text-slate-500 hover:border-amber-200'
                                            }`}
                                    >
                                        <Clock className={`w-5 h-5 ${status === 'pending' ? 'text-amber-500' : 'text-slate-300'}`} />
                                        Pending
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatus('rejected')}
                                        className={`py-3 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center gap-1 ${status === 'rejected'
                                            ? 'bg-red-50 border-red-500 text-red-700'
                                            : 'bg-white border-slate-100 text-slate-500 hover:border-red-200'
                                            }`}
                                    >
                                        <XCircle className={`w-5 h-5 ${status === 'rejected' ? 'text-red-500' : 'text-slate-300'}`} />
                                        Reject
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Feedback Details</label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows="5"
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-medium text-slate-700 focus:border-blue-500 focus:bg-white transition-all outline-none resize-none"
                                    placeholder="Provide constructive feedback for the student..."
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setReviewModal({ open: false, submission: null })}
                                    className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Submit Review
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectSubmissions;
