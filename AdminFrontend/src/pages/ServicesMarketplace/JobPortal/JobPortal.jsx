import React from 'react';
import { Briefcase, Search, MapPin, Building, Sparkles, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const JobPortal = () => {
    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <Briefcase className="w-8 h-8 text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Job Portal</h1>
                            <p className="text-slate-500 font-bold mt-1">Manage recruitment and career opportunities</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] p-12 shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden group">
                    {/* Decorative Element */}
                    <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>

                    <div className="relative z-10 max-w-2xl mx-auto space-y-10">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-10 rounded-full"></div>
                                <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-50">
                                    <Building className="w-20 h-20 text-amber-500" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full mb-2">
                                <Sparkles className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-black text-amber-600 uppercase tracking-widest">In Development</span>
                            </div>
                            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Job Management Coming Soon</h2>
                            <p className="text-slate-500 font-bold text-lg leading-relaxed">
                                We are currently building a comprehensive job portal for posting vacancies, managing applications, and tracking recruitment pipelines. Soon you'll be able to manage the entire hiring lifecycle.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button className="w-full sm:w-auto px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-slate-200 hover:shadow-slate-300 hover:bg-black transition-all transform hover:-translate-y-1">
                                Notify Me When Ready
                            </button>
                            <button className="w-full sm:w-auto px-12 py-5 bg-white text-slate-800 rounded-[1.5rem] font-black uppercase tracking-widest text-sm border-2 border-slate-100 hover:bg-slate-50 transition-all transform hover:-translate-y-1">
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobPortal;