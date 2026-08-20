import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, CreditCard, IndianRupee, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const RevenueOverview = () => {
    const [overview, setOverview] = useState({
        totalRevenue: 0,
        activeSubs: 0,
        arpu: 0,
        conversionRate: 0
    });
    const [analytics, setAnalytics] = useState({
        revenueGrowth: [],
        subscriptionMix: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const overviewRes = await axios.get('/api/revenue/overview');
                const analyticsRes = await axios.get('/api/revenue/analytics');

                if (overviewRes.data.success) {
                    setOverview(overviewRes.data);
                }
                if (analyticsRes.data.success) {
                    setAnalytics(analyticsRes.data);
                }
            } catch (error) {
                console.error("Failed to fetch revenue data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <IndianRupee className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Revenue Overview</h1>
                            <p className="text-slate-500 font-bold mt-1">Real-time financial performance tracking</p>
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Total Revenue */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <IndianRupee className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-1 text-emerald-600 font-black text-xs uppercase bg-emerald-50 px-3 py-1.5 rounded-lg">
                                <ArrowUpRight className="w-3 h-3" /> Live
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight mb-1">
                            {loading ? "..." : `₹${overview.totalRevenue.toLocaleString('en-IN')}`}
                        </div>
                        <p className="text-slate-400 font-bold text-sm">Total Revenue</p>
                    </div>

                    {/* Active Subscriptions */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Users className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-1 text-emerald-600 font-black text-xs uppercase bg-emerald-50 px-3 py-1.5 rounded-lg">
                                <ArrowUpRight className="w-3 h-3" /> Live
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight mb-1">
                            {loading ? "..." : overview.activeSubs.toLocaleString('en-IN')}
                        </div>
                        <p className="text-slate-400 font-bold text-sm">Active Subscriptions</p>
                    </div>

                    {/* Avg Revenue/User */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                <CreditCard className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight mb-1">
                            {loading ? "..." : `₹${overview.arpu.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                        </div>
                        <p className="text-slate-400 font-bold text-sm">Avg. Revenue/User</p>
                    </div>

                    {/* Conversion Rate */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div className="p-4 bg-rose-50 rounded-2xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight mb-1">
                            {loading ? "..." : `${overview.conversionRate.toFixed(1)}%`}
                        </div>
                        <p className="text-slate-400 font-bold text-sm">Conversion Rate</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Revenue Growth Chart */}
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 h-[450px] flex flex-col justify-center group">
                        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-600" /> Revenue Growth
                        </h3>
                        <div className="w-full h-full min-h-[300px]">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-slate-400 font-bold">Loading chart...</div>
                            ) : analytics.revenueGrowth.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" aspect={1.5}>
                                    <BarChart data={analytics.revenueGrowth}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9' }}
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                            itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                        />
                                        <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 font-bold">No revenue data available</div>
                            )}
                        </div>
                    </div>

                    {/* Subscription Mix Chart */}
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 h-[450px] flex flex-col justify-center group">
                        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" /> Subscription Mix
                        </h3>
                        <div className="w-full h-full min-h-[300px]">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-slate-400 font-bold">Loading chart...</div>
                            ) : analytics.subscriptionMix.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" aspect={1.2}>
                                    <PieChart>
                                        <Pie
                                            data={analytics.subscriptionMix}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {analytics.subscriptionMix.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                            itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 font-bold">No subscription data available</div>
                            )}
                        </div>
                        {/* Legend */}
                        <div className="flex justify-center gap-6 mt-4">
                            {analytics.subscriptionMix.map((entry, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-sm font-bold text-slate-600">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RevenueOverview;