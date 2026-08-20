import React from 'react';
import { CreditCard, Download, Clock, IndianRupee } from 'lucide-react';

const Billing = () => {
    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Billing & Subscription</h1>
                    <p className="text-slate-500 font-bold mb-8">Manage your plan and payment details.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        {/* Plan Card */}
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <CreditCard className="w-48 h-48" />
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent"></div>

                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider mb-4 text-indigo-200">
                                    <Clock className="w-3 h-3" />
                                    Current Plan
                                </div>
                                <h2 className="text-4xl font-black mb-6 tracking-tight">Pro Plan</h2>
                                <div className="flex items-baseline mb-8">
                                    <span className="text-6xl font-black text-white">₹1,499</span>
                                    <span className="text-indigo-200 font-medium ml-2 text-xl">/month</span>
                                </div>
                                <button className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black hover:bg-indigo-50 transition-all transform hover:-translate-y-1 shadow-lg">
                                    Upgrade Plan
                                </button>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 flex flex-col justify-center shadow-inner group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
                            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                <IndianRupee className="w-6 h-6 text-indigo-600" />
                                Payment Method
                            </h3>
                            <div className="flex items-center gap-6 mb-8 p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-sm transition-all group-hover:border-indigo-100">
                                <div className="w-16 h-10 bg-[#1A1F71] rounded-lg flex items-center justify-center text-white font-bold italic shadow-md">
                                    VISA
                                </div>
                                <div>
                                    <p className="font-black text-lg text-slate-800 tracking-tight">Visa ending in 4242</p>
                                    <p className="text-sm font-bold text-slate-400">Expires 12/26</p>
                                </div>
                            </div>
                            <button className="text-indigo-600 font-bold hover:text-indigo-700 text-sm bg-indigo-50 px-6 py-4 rounded-xl border border-indigo-100 border-dashed hover:border-solid transition-all flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white">
                                <span className="text-lg">+</span> Add New Payment Method
                            </button>
                        </div>
                    </div>

                    {/* Invoice History */}
                    <div>
                        <h3 className="text-xl font-black text-slate-800 mb-6 px-2">Invoice History</h3>
                        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-lg shadow-slate-200/40">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {[1, 2, 3].map((_, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-50/30 transition-all group">
                                            <td className="px-8 py-6 text-sm font-bold text-slate-600">Feb 01, 2024</td>
                                            <td className="px-8 py-6 text-sm font-black text-slate-800">₹1,499.00</td>
                                            <td className="px-8 py-6">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                    Paid
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Billing;