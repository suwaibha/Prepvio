import React from 'react';
import { FileText, Search, Star, UploadCloud, Sparkles, BrainCircuit } from 'lucide-react';

const ResumeAnalyzer = () => {
    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <FileText className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Resume Analyzer</h1>
                            <p className="text-slate-500 font-bold mt-1">AI-powered document intelligence</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] p-12 shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden group">
                    {/* Decorative Element */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>

                    <div className="relative z-10 max-w-3xl mx-auto space-y-10">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-400 blur-2xl opacity-10 rounded-full"></div>
                                <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-50">
                                    <BrainCircuit className="w-20 h-20 text-indigo-600" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full mb-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Advanced NLP Engine</span>
                            </div>
                            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Smart Resume Analysis</h2>
                            <p className="text-slate-500 font-bold text-lg leading-relaxed">
                                We are building a sophisticated tool to automatically score resumes, suggest semantic improvements, and match candidates to complex job descriptions using state-of-the-art NLP models.
                            </p>
                        </div>

                        <div className="flex justify-center flex-wrap gap-4">
                            <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-full text-sm font-black text-slate-600 border border-slate-100 shadow-sm">
                                <UploadCloud className="w-5 h-5 text-indigo-600" /> ATS Optimization
                            </div>
                            <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-full text-sm font-black text-slate-600 border border-slate-100 shadow-sm">
                                <Star className="w-5 h-5 text-indigo-600" /> Skill Extraction
                            </div>
                            <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-full text-sm font-black text-slate-600 border border-slate-100 shadow-sm">
                                <Search className="w-5 h-5 text-indigo-600" /> Keyword Matching
                            </div>
                        </div>

                        <button className="px-12 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-indigo-200 hover:shadow-indigo-300 hover:bg-indigo-700 transition-all transform hover:-translate-y-1 inline-flex items-center gap-3">
                            Request Beta Access
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeAnalyzer;