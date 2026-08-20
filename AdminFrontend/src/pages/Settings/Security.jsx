import React from 'react';
import { Lock, Shield, Key, Smartphone, LogOut } from 'lucide-react';

const AccountSecurity = () => {
    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Account Security</h1>
                    <p className="text-slate-500 font-bold mb-8">Protect your account with advanced security settings.</p>

                    <div className="space-y-10">
                        {/* Password Section */}
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                            <div className="flex items-start gap-6 mb-8">
                                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                                    <Key className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">Change Password</h3>
                                    <p className="text-sm font-bold text-slate-500 mt-1">Update your password to keep your account secure</p>
                                </div>
                            </div>

                            <div className="space-y-4 max-w-xl mx-auto">
                                <input
                                    type="password"
                                    placeholder="Current Password"
                                    className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 placeholder:text-slate-400"
                                />
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 placeholder:text-slate-400"
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm New Password"
                                    className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 placeholder:text-slate-400"
                                />
                                <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 hover:-translate-y-1">
                                    Update Password
                                </button>
                            </div>
                        </div>

                        {/* 2FA Section */}
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-indigo-100 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                                    <Smartphone className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">Two-Factor Authentication</h3>
                                    <p className="text-sm font-bold text-slate-500 mt-1">Add an extra layer of security to your account</p>
                                </div>
                            </div>
                            <div className="relative inline-block w-14 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-8 h-8 rounded-full bg-white border-4 appearance-none cursor-pointer shadow-md transform translate-x-0 transition-transform" />
                                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-8 rounded-full bg-slate-300 cursor-pointer"></label>
                            </div>
                        </div>

                        {/* Active Sessions */}
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                            <div className="flex items-start gap-6 mb-8">
                                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                                    <Shield className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">Active Sessions</h3>
                                    <p className="text-sm font-bold text-slate-500 mt-1">Manage devices where you're currently logged in</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <div>
                                            <p className="font-black text-slate-800">Windows PC - Chrome</p>
                                            <p className="text-xs font-bold text-slate-400">Bengaluru, India • Active Now</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-4 py-2 rounded-lg uppercase tracking-wider">Current</span>
                                </div>
                                <div className="flex justify-between items-center p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                                        <div>
                                            <p className="font-black text-slate-800">iPhone 13 - Safari</p>
                                            <p className="text-xs font-bold text-slate-400">Bengaluru, India • 2 hours ago</p>
                                        </div>
                                    </div>
                                    <button className="text-rose-500 hover:bg-rose-50 p-3 rounded-xl transition-all group">
                                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSecurity;