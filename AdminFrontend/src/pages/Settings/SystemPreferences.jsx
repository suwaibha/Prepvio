import React from 'react';
import { Globe, Clock, Settings } from 'lucide-react';

const SystemPreferences = () => {
    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">System Preferences</h1>
                    <p className="text-slate-500 font-bold mb-8">Customize language, region, and time settings.</p>

                    <div className="space-y-8">
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                    <Globe className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">Language & Region</h3>
                                    <p className="text-sm font-bold text-slate-500 mt-1">Set your preferred language and date formats</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wide">Language</label>
                                    <div className="relative">
                                        <select className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl appearance-none focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 cursor-pointer">
                                            <option>English (United States)</option>
                                            <option>English (UK)</option>
                                            <option>Spanish</option>
                                            <option>French</option>
                                            <option>Hindi</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                                            <Settings className="w-5 h-5 animate-spin-slow" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wide">Date Format</label>
                                    <div className="relative">
                                        <select className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl appearance-none focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 cursor-pointer">
                                            <option>MM/DD/YYYY</option>
                                            <option>DD/MM/YYYY</option>
                                            <option>YYYY-MM-DD</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                                            <Settings className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                                    <Clock className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">Timezone</h3>
                                    <p className="text-sm font-bold text-slate-500 mt-1">Set your local timezone for accurate scheduling</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wide">Timezone</label>
                                <div className="relative">
                                    <select className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl appearance-none focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 cursor-pointer">
                                        <option>(GMT-08:00) Pacific Time (US & Canada)</option>
                                        <option>(GMT-05:00) Eastern Time (US & Canada)</option>
                                        <option>(GMT+00:00) London</option>
                                        <option>(GMT+05:30) India Standard Time</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                                        <Clock className="w-5 h-5 text-indigo-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemPreferences;