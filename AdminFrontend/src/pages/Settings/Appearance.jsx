import React from 'react';
import { Moon, Sun, Monitor, Type, TrendingUp } from 'lucide-react';

const Appearance = () => {
    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Appearance</h1>
                    <p className="text-slate-500 font-bold mb-8">Customize your visual experience.</p>

                    <div className="space-y-10">
                        {/* Theme Selection */}
                        <div>
                            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                <Monitor className="w-5 h-5 text-indigo-500" />
                                Theme Preference
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <button className="group relative overflow-hidden flex flex-col items-center p-8 bg-white rounded-3xl border-2 border-indigo-600 shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1">
                                    <div className="absolute inset-0 bg-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 text-indigo-600">
                                        <Sun className="w-8 h-8" />
                                    </div>
                                    <span className="font-black text-slate-800 text-lg relative z-10">Light Mode</span>
                                    <span className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider relative z-10">Default Look</span>
                                    <div className="absolute top-4 right-4 w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></div>
                                </button>

                                <button className="group flex flex-col items-center p-8 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-slate-200 transition-all hover:bg-white hover:shadow-lg hover:-translate-y-1">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 text-slate-400 shadow-sm border border-slate-100 group-hover:text-slate-600 group-hover:scale-110 transition-all">
                                        <Moon className="w-8 h-8" />
                                    </div>
                                    <span className="font-bold text-slate-500 group-hover:text-slate-800 text-lg transition-colors">Dark Mode</span>
                                    <span className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">Easier on eyes</span>
                                </button>

                                <button className="group flex flex-col items-center p-8 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-slate-200 transition-all hover:bg-white hover:shadow-lg hover:-translate-y-1">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 text-slate-400 shadow-sm border border-slate-100 group-hover:text-slate-600 group-hover:scale-110 transition-all">
                                        <Monitor className="w-8 h-8" />
                                    </div>
                                    <span className="font-bold text-slate-500 group-hover:text-slate-800 text-lg transition-colors">System</span>
                                    <span className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">Matches device</span>
                                </button>
                            </div>
                        </div>

                        {/* Font Size */}
                        <div>
                            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                <Type className="w-5 h-5 text-indigo-500" />
                                Font Size
                            </h3>
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex items-center justify-between shadow-inner">
                                <span className="text-sm font-bold text-slate-500">Abc</span>
                                <input
                                    type="range"
                                    min="12"
                                    max="24"
                                    className="w-full mx-8 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
                                />
                                <span className="text-3xl font-black text-slate-800">Abc</span>
                            </div>
                        </div>

                        {/* Accent Color */}
                        <div>
                            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                Accent Color
                            </h3>
                            <div className="flex flex-wrap gap-6">
                                <button className="w-16 h-16 rounded-2xl bg-indigo-600 ring-4 ring-indigo-100 shadow-xl scale-110 transition-transform flex items-center justify-center text-white font-bold">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </button>
                                <button className="w-16 h-16 rounded-2xl bg-pink-500 hover:ring-4 hover:ring-pink-100 shadow-md hover:scale-105 transition-all"></button>
                                <button className="w-16 h-16 rounded-2xl bg-teal-500 hover:ring-4 hover:ring-teal-100 shadow-md hover:scale-105 transition-all"></button>
                                <button className="w-16 h-16 rounded-2xl bg-orange-500 hover:ring-4 hover:ring-orange-100 shadow-md hover:scale-105 transition-all"></button>
                                <button className="w-16 h-16 rounded-2xl bg-slate-800 hover:ring-4 hover:ring-slate-200 shadow-md hover:scale-105 transition-all"></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Appearance;