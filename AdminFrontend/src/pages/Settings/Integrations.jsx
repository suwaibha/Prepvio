import React from 'react';
import { Cable, Link2, ExternalLink, CheckCircle } from 'lucide-react';

const Integrations = () => {
    const apps = [
        { name: "Slack", description: "Receive notifications and alerts in your Slack channels", connected: true, icon: "S", color: "bg-[#4A154B] text-white" },
        { name: "Google Drive", description: "Sync document submissions to Google Drive", connected: true, icon: "G", color: "bg-[#1FA463] text-white" },
        { name: "GitHub", description: "Link repositories for code reviews", connected: false, icon: "GH", color: "bg-[#24292e] text-white" },
        { name: "Zoom", description: "Schedule automatic meetings for interviews", connected: false, icon: "Z", color: "bg-[#2D8CFF] text-white" },
        { name: "JIRA", description: "Create tickets from Helpdesk directly in JIRA", connected: false, icon: "J", color: "bg-[#0052CC] text-white" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Integrations</h1>
                    <p className="text-slate-500 font-bold mb-8">Connect and manage third-party applications.</p>

                    <div className="grid grid-cols-1 gap-6">
                        {apps.map((app, idx) => (
                            <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-indigo-100 group">
                                <div className="flex items-center gap-6 w-full">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-slate-200/50 ${app.color}`}>
                                        {app.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{app.name}</h3>
                                            {app.connected && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 uppercase tracking-widest border border-emerald-200">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Connected
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-slate-500">{app.description}</p>
                                    </div>
                                </div>
                                <button
                                    className={`px-8 py-3 rounded-xl font-bold transition-all w-full md:w-auto shadow-sm whitespace-nowrap flex items-center justify-center gap-2 ${app.connected
                                        ? 'bg-white text-slate-600 border-2 border-slate-200 hover:bg-slate-50'
                                        : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:-translate-y-0.5'
                                        }`}
                                >
                                    {app.connected ? (
                                        <>
                                            <Link2 className="w-4 h-4" />
                                            Configure
                                        </>
                                    ) : (
                                        <>
                                            <Cable className="w-4 h-4" />
                                            Connect
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Integrations;