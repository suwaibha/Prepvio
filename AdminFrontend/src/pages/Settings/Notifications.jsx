import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, AlertCircle } from 'lucide-react';

const Notifications = () => {
    const [settings, setSettings] = useState({
        emailAlerts: true,
        pushNotifications: true,
        marketingEmails: false,
        securityAlerts: true,
        projectUpdates: true,
        courseRecommendations: false
    });

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const Toggle = ({ active, onClick }) => (
        <div
            onClick={onClick}
            className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 shadow-inner ${active ? 'bg-indigo-600' : 'bg-slate-200'}`}
        >
            <div className={`bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ease-in-out ${active ? 'translate-x-6' : ''}`}></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Notification Preferences</h1>
                    <p className="text-slate-500 font-bold mb-8">Control how and when you want to be notified.</p>

                    <div className="space-y-8">
                        {/* Email Notifications */}
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200/60">
                                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-black text-slate-800">Email Notifications</h2>
                            </div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center group">
                                    <div className="pr-4">
                                        <p className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">Weekly Summary</p>
                                        <p className="text-sm font-medium text-slate-500 mt-1">Receive a weekly digest of your activity and performance.</p>
                                    </div>
                                    <Toggle active={settings.emailAlerts} onClick={() => toggleSetting('emailAlerts')} />
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="pr-4">
                                        <p className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">Marketing & Offers</p>
                                        <p className="text-sm font-medium text-slate-500 mt-1">Receive updates about new features, promotions, and events.</p>
                                    </div>
                                    <Toggle active={settings.marketingEmails} onClick={() => toggleSetting('marketingEmails')} />
                                </div>
                            </div>
                        </div>

                        {/* Push Notifications */}
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200/60">
                                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                                    <Bell className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-black text-slate-800">Push Notifications</h2>
                            </div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center group">
                                    <div className="pr-4">
                                        <p className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">New Messages</p>
                                        <p className="text-sm font-medium text-slate-500 mt-1">Get instantly notified when you receive a message from team.</p>
                                    </div>
                                    <Toggle active={settings.pushNotifications} onClick={() => toggleSetting('pushNotifications')} />
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="pr-4">
                                        <p className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">Project Updates</p>
                                        <p className="text-sm font-medium text-slate-500 mt-1">Real-time notifications about project submissions and reviews.</p>
                                    </div>
                                    <Toggle active={settings.projectUpdates} onClick={() => toggleSetting('projectUpdates')} />
                                </div>
                            </div>
                        </div>

                        {/* System Alerts */}
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200/60">
                                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-black text-slate-800">System Alerts</h2>
                            </div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center group">
                                    <div className="pr-4">
                                        <p className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">Security Alerts</p>
                                        <p className="text-sm font-medium text-slate-500 mt-1">Get critical alerts about suspicious logins and password changes.</p>
                                    </div>
                                    <Toggle active={settings.securityAlerts} onClick={() => toggleSetting('securityAlerts')} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;