import React from 'react';
import { Bot, Mic, Video, BrainCircuit, ArrowLeft, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const AIInterviewPractice = () => {
    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <Bot className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">AI Interview Practice</h1>
                            <p className="text-slate-500 font-bold mt-1">Smart simulation for career preparation</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] p-12 shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden group">
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>

                    <div className="relative z-10 max-w-3xl mx-auto space-y-10">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-400 blur-2xl opacity-10 rounded-full animate-pulse"></div>
                                <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-50">
                                    <BrainCircuit className="w-20 h-20 text-indigo-600" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full mb-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Under Development</span>
                            </div>
                            <h2 className="text-4xl font-black text-slate-800 tracking-tight">AI Interview Mode Coming Soon</h2>
                            <p className="text-slate-500 font-bold text-lg leading-relaxed">
                                An advanced AI-powered interview simulation is under development. It will feature real-time semantic feedback, sentiment analysis, and behavioral assessments.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <Mic className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="font-black text-slate-800 uppercase tracking-wide text-xs">Voice Analysis</h3>
                            </div>
                            <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <ShieldCheck className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="font-black text-slate-800 uppercase tracking-wide text-xs">Proctoring</h3>
                            </div>
                            <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <Zap className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="font-black text-slate-800 uppercase tracking-wide text-xs">Real-time Feedback</h3>
                            </div>
                        </div>

                        <button className="px-12 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-indigo-200 hover:shadow-indigo-300 hover:bg-indigo-700 transition-all transform hover:-translate-y-1 inline-flex items-center gap-3">
                            Join Early Access Waitlist
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AIInterviewPractice;