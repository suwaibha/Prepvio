import React, { useState, useEffect } from 'react';
import { Tag, Check, CreditCard, Star, ArrowLeft, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Pricing = () => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscribers = async () => {
            try {
                const response = await axios.get('/api/revenue/active-subscriptions');
                if (response.data.success) {
                    setSubscribers(response.data.subscribers);
                }
            } catch (error) {
                console.error("Failed to fetch subscribers", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscribers();
    }, []);

    const plans = [
        {
            name: "Basic",
            price: "₹0",
            period: "/month",
            features: ["Access to basic courses", "Community support", "100 hours of video access", "Basic quizzes"],
            color: "blue",
            recommended: false
        },
        {
            name: "Pro",
            price: "₹1,499",
            period: "/month",
            features: ["All Basic features", "Priority support", "Unlimited video access", "Advanced certification", "Project reviews"],
            color: "indigo",
            recommended: true
        },
        {
            name: "Enterprise",
            price: "₹4,999",
            period: "/month",
            features: ["All Pro features", "Dedicated account manager", "Custom learning paths", "API access", "SSO Integration"],
            color: "purple",
            recommended: false
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header Section */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 mb-2">
                        <Tag className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Pricing Strategy</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-800 tracking-tight">Membership Plans</h1>
                    <p className="text-slate-500 font-bold text-lg max-w-2xl mx-auto">
                        Configure and manage subscription tiers for your learning community
                    </p>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative bg-white rounded-[3rem] p-10 shadow-2xl transition-all duration-300 border shadow-slate-200/50 ${plan.recommended
                                ? 'border-indigo-500 ring-4 ring-indigo-50 translate-y-[-10px] scale-[1.02]'
                                : 'border-slate-100 hover:-translate-y-2'
                                }`}
                        >
                            {plan.recommended && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-200">
                                    <Star className="w-3.5 h-3.5 fill-current" /> Recommended
                                </div>
                            )}

                            <div className="mb-10">
                                <h3 className="text-2xl font-black text-slate-800 mb-4">{plan.name}</h3>
                                <div className="flex items-baseline">
                                    <span className="text-5xl font-black text-slate-800 tracking-tighter">{plan.price}</span>
                                    <span className="text-slate-400 font-bold ml-2 text-lg">{plan.period}</span>
                                </div>
                            </div>

                            <div className="space-y-6 mb-12">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">What's included:</p>
                                <ul className="space-y-5">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-4 text-slate-600 group">
                                            <div className={`mt-1 p-1 rounded-full bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors`}>
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="font-bold text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm transition-all duration-300 ${plan.recommended
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 hover:shadow-indigo-300'
                                : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                                }`}>
                                Edit Configuration
                            </button>
                        </div>
                    ))}
                </div>

                {/* Active Subscribers List */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-indigo-50 p-3 rounded-2xl">
                            <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">Active Subscribers</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Plan</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Start Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">End Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-bold">Loading subscribers...</td></tr>
                                ) : subscribers.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-bold">No active subscribers found</td></tr>
                                ) : (
                                    subscribers.map((sub, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 uppercase">
                                                        {sub.name ? sub.name[0] : 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-700">{sub.name || 'Unknown'}</div>
                                                        <div className="text-xs font-bold text-slate-400">{sub.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-wide">
                                                    {sub.subscription?.planName || sub.subscription?.planId}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-500">
                                                {new Date(sub.subscription?.startDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-500">
                                                {new Date(sub.subscription?.endDate).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Additional Info Section */}
                <div className="bg-white p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-indigo-50 rounded-[1.5rem] text-indigo-600">
                            <CreditCard className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-slate-800">Custom Enterprise Needs?</h4>
                            <p className="text-slate-500 font-bold">Contact our sales team for tailored volume configurations.</p>
                        </div>
                    </div>
                    <button className="bg-white hover:bg-slate-50 text-slate-800 font-black py-4 px-8 rounded-2xl border-2 border-slate-100 transition-all flex items-center gap-3">
                        Talk to Sales
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pricing;