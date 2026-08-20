import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MAIN_API_URL } from '../../config/api';
import {
  TrendingUp, TrendingDown, Users, MessageSquare,
  ChevronRight, Home, Clock, CheckCircle, AlertCircle,
  Eye, Gift, User, ArrowUp, ArrowDown, Activity,
  BarChart3, LifeBuoy
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { Link } from 'react-router-dom';

const API_BASE = MAIN_API_URL;

// --- Premium Card Component ---
const PremiumCard = ({ title, children, info, className = "" }) => (
  <div className={`bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 ${className}`}>
    {(title || info) && (
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
        {info && <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">{info}</span>}
      </div>
    )}
    {children}
  </div>
);

const StatCard = ({ title, value, change, trend, icon: Icon, color }) => (
  <div className="bg-white rounded-[2rem] p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300 text-white`}>
        {React.createElement(Icon, { className: "w-7 h-7" })}
      </div>
      <div className={`flex items-center px-2.5 py-1 rounded-lg text-sm font-bold ${trend === 'up' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
        {trend === 'up' ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
        {change}
      </div>
    </div>
    <div className="space-y-1">
      <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
    </div>
  </div>
);

const Breadcrumbs = () => (
  <nav className="flex items-center text-sm mb-8" aria-label="Breadcrumb">
    <ol className="inline-flex items-center space-x-1 md:space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
      <li className="inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer font-bold">
        <Home className="w-4 h-4 mr-2" />
        Home
      </li>
      <li className="flex items-center text-slate-400">
        <ChevronRight className="w-4 h-4 mx-1" />
        <span className="hover:text-indigo-600 transition-colors cursor-pointer font-bold">Helpdesk</span>
      </li>
      <li className="flex items-center text-indigo-600 font-black">
        <ChevronRight className="w-4 h-4 mx-1" />
        <span>Dashboard</span>
      </li>
    </ol>
  </nav>
);

export default function HDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    closed: 0,
    messagesToday: 0
  });
  const [latestActivity, setLatestActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE}/chat/admin/stats`, { withCredentials: true });
        if (res.data.success) {
          setStats(res.data.stats);
          setLatestActivity(res.data.latestConversations.map(conv => ({
            id: conv.id,
            userId: conv.userId,
            userName: conv.userName,
            text: `Replied with: "${conv.lastMessage || '...'}"`,
            time: new Date(conv.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            icon: <MessageSquare className="w-4 h-4 text-white" />,
            color: "bg-indigo-500"
          })));
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Synthetic trend data for charts
  const chatVolumeData = [
    { name: 'Mon', volume: 45, resolved: 32 },
    { name: 'Tue', volume: 52, resolved: 41 },
    { name: 'Wed', volume: 38, resolved: 35 },
    { name: 'Thu', volume: 65, resolved: 58 },
    { name: 'Fri', volume: 48, resolved: 42 },
    { name: 'Sat', volume: 24, resolved: 20 },
    { name: 'Sun', volume: 30, resolved: 28 },
  ];

  const resolutionData = [
    { name: 'Active', value: stats.active || 0, color: '#6366f1' },
    { name: 'Pending', value: stats.pending || 0, color: '#f59e0b' },
    { name: 'Closed', value: stats.closed || 0, color: '#10b981' },
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans text-slate-900">
      <Breadcrumbs />

      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Helpdesk Analytics</h1>
          <p className="text-slate-500 font-bold mt-2">Real-time insights and support performance metrics.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white text-slate-600 rounded-xl font-bold shadow-sm border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-300 transition-all">
            Refresh Data
          </button>
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 transition-all">
            Download Report
          </button>
        </div>
      </div>

      {/* --- Top Metrics Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Total Conversations"
          value={stats.total}
          change="+12.5%"
          trend="up"
          icon={Activity}
          color="from-indigo-500 to-purple-600"
        />
        <StatCard
          title="Messages Today"
          value={stats.messagesToday}
          change="+18.2%"
          trend="up"
          icon={MessageSquare}
          color="from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Active Chats"
          value={stats.active}
          change="-4.1%"
          trend="down"
          icon={Users}
          color="from-amber-400 to-orange-500"
        />
        <StatCard
          title="Resolved Tickets"
          value={stats.closed}
          change="+23.5%"
          trend="up"
          icon={CheckCircle}
          color="from-pink-500 to-rose-500"
        />
      </div>

      {/* --- Main Analytics Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Chat Volume Chart */}
        <PremiumCard title="Chat Volume vs Resolution" info="Last 7 Days" className="lg:col-span-2">
          <div className="h-[350px] w-full mt-4 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%" aspect={2}>
              <AreaChart data={chatVolumeData}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="volume" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PremiumCard>

        {/* Resolution Status Distribution */}
        <PremiumCard title="Status Distribution" info="Real-time">
          <div className="h-[300px] w-full relative flex items-center justify-center min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" aspect={1}>
              <PieChart>
                <Pie
                  data={resolutionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  cornerRadius={8}
                >
                  {resolutionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-5xl font-black text-slate-800">{stats.total}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
            </div>
          </div>
          <div className="space-y-4 mt-6">
            {resolutionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-bold text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-black text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </PremiumCard>
      </div>

      {/* --- Bottom Section: Activity & Quick Actions --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Feed */}
        <PremiumCard title="Latest Conversations" info="Live Feed">
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Activity className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-bold">Fetching live updates...</p>
              </div>
            ) : latestActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 opacity-60">
                <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-slate-500 font-bold italic">No recent messages.</p>
              </div>
            ) : (
              latestActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex gap-5 group cursor-pointer hover:bg-slate-50 p-4 rounded-2xl transition-all border border-transparent hover:border-slate-100"
                  onClick={() => activity.userId && navigate(`/support/ticket-details?userId=${activity.userId}`)}
                >
                  <div className={`w-12 h-12 rounded-2xl ${activity.color} flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{activity.userName}</h4>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{activity.time}</span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium line-clamp-1">{activity.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link
            to="/support/tickets"
            className="mt-8 w-full py-4 bg-indigo-50 rounded-2xl text-indigo-600 font-black uppercase text-sm tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex justify-center items-center shadow-sm hover:shadow-lg"
          >
            Manage All Tickets
          </Link>
        </PremiumCard>

        {/* Quick Stats Grid */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6 flex-1">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-700 blur-2xl"></div>
              <LifeBuoy className="w-12 h-12 mb-6 text-indigo-200" />
              <h3 className="text-5xl font-black mb-2">{stats.closed}</h3>
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Total Resolved</p>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4 text-emerald-600">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-4xl font-black text-slate-800 mb-1">98%</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Satisfaction Rate</p>
            </div>

            <div className="col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black mb-2">Need Help?</h3>
                  <p className="text-slate-400 font-medium text-sm max-w-xs">Contact the technical team if you are facing system issues.</p>
                </div>
                <button className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/50">
                  Contact Tech
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
