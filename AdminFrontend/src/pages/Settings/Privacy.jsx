import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, Shield, Key } from 'lucide-react';

const ProfileSettings = () => {
    const [formData, setFormData] = useState({
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        phone: "+1 (555) 123-4567",
        bio: "Senior Administrator with 5+ years of experience in managing educational platforms.",
        location: "Bengaluru, India"
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto font-sans text-slate-900">
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 h-48 relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent"></div>
                </div>

                <div className="px-8 md:px-12 pb-12">
                    <div className="relative flex flex-col md:flex-row items-start gap-8 -mt-20">
                        {/* Profile Image Section */}
                        <div className="flex flex-col items-center">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 text-5xl font-black border-[6px] border-white shadow-2xl">
                                    {formData.firstName[0]}{formData.lastName[0]}
                                </div>
                                <button className="absolute bottom-2 right-2 p-3 bg-white rounded-full shadow-lg text-slate-400 hover:text-indigo-600 transition-all hover:scale-110 border border-slate-100">
                                    <Camera className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="text-center mt-4">
                                <h2 className="text-2xl font-black text-slate-800">{formData.firstName} {formData.lastName}</h2>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Administrator</p>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 w-full pt-8 md:pt-20">
                            <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profile Settings</h1>
                                    <p className="text-slate-500 font-bold mt-2">Manage your personal information and account preferences.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">
                                        Cancel
                                    </button>
                                    <button className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-indigo-500/30 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5">
                                        <Save className="w-5 h-5" />
                                        Save Changes
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                                {/* Left Column: Form */}
                                <div className="xl:col-span-2 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">First Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Last Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Phone Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Location</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Bio</label>
                                        <textarea
                                            name="bio"
                                            rows="4"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none leading-relaxed"
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Right Column: Stats or Security */}
                                <div className="space-y-6">
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-indigo-500" />
                                            Security Status
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                        <Key className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-700">2FA Enabled</div>
                                                        <div className="text-xs text-slate-400 font-bold">Recommended</div>
                                                    </div>
                                                </div>
                                                <span className="text-emerald-500 font-black text-sm">ACTIVE</span>
                                            </div>
                                            <button className="w-full py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all text-sm">
                                                Change Password
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20">
                                        <h3 className="text-lg font-black mb-2">Pro Tip</h3>
                                        <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                                            Updating your bio helps students and other admins connect with you better. Keep it professional yet friendly!
                                        </p>
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

export default ProfileSettings;