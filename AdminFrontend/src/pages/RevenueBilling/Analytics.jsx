import React, { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Package, Users, IndianRupee, ShoppingCart, ArrowUp, ArrowDown,
  Eye,
  Gift,
  User,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import axios from "axios";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Stat Card Component (Premium Light Style)
const StatCard = ({ title, value, change, trend, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-all duration-300 group">
    <div className="flex items-center justify-between mb-6">
      <div className={`w-14 h-14 rounded-2xl ${colorClass} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
        {React.createElement(Icon, { className: "w-7 h-7" })}
      </div>
      <span className={`flex items-center text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg ${trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
        {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
        {change}
      </span>
    </div>
    <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{value}</h3>
    <p className="text-sm font-bold text-slate-400">{title}</p>
  </div>
);

// Chart Card Component (Premium Light Style)
const ChartCard = ({ title, children, info }) => (
  <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
        {info && <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{info}</p>}
      </div>
    </div>
    {children}
  </div>
);

export default function StatisticsDashboard() {
  const [data, setData] = useState({
    totalRevenue: 0,
    activeSubs: 0,
    arpu: 0,
    conversionRate: 0,
    totalUsers: 0,
    payingUsersCount: 0,
    dailyVisitors: 0
  });
  const [analytics, setAnalytics] = useState({
    revenueGrowth: [],
    subscriptionMix: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        const [overviewRes, analyticsRes] = await Promise.all([
          axios.get('/api/revenue/overview', config),
          axios.get('/api/revenue/analytics', config)
        ]);
        if (overviewRes.data.success) setData(prev => ({ ...prev, ...overviewRes.data }));
        if (analyticsRes.data.success) setAnalytics(analyticsRes.data);
      } catch (error) {
        console.error("Failed to fetch statistics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sample Data (Kept for visitors/sales until backend supports it)
  const monthlyData = [
    { month: 'Jan', earnings: 4000, expenses: 2400, visitors: 2400 },
    { month: 'Feb', earnings: 3000, expenses: 1398, visitors: 2210 },
    { month: 'Mar', earnings: 2000, expenses: 9800, visitors: 2290 },
    { month: 'Apr', earnings: 2780, expenses: 3908, visitors: 2000 },
    { month: 'May', earnings: 1890, expenses: 4800, visitors: 2181 },
    { month: 'Jun', earnings: 2390, expenses: 3800, visitors: 2500 },
    { month: 'Jul', earnings: 3490, expenses: 4300, visitors: 2100 },
  ];

  const productData = [
    { name: 'React Native', percentage: 85, color: 'from-blue-500 to-indigo-600' },
    { name: 'Figma', percentage: 70, color: 'from-purple-500 to-pink-600' },
    { name: 'Bootstrap 5', percentage: 60, color: 'from-emerald-500 to-teal-600' },
    { name: 'Shopify', percentage: 45, color: 'from-orange-500 to-rose-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Statistics Dashboard</h1>
              <p className="text-slate-500 font-bold mt-1">Deep dive into platform analytics</p>
            </div>
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard
            title="Total Users"
            value={loading ? "..." : (data.totalUsers || 0).toLocaleString('en-IN')}
            change="REAL TIME"
            trend="up"
            icon={Users}
            colorClass="bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
          />
          <StatCard
            title="Paying Users"
            value={loading ? "..." : (data.payingUsersCount || 0).toLocaleString('en-IN')}
            change="SUCCESSFUL"
            trend="up"
            icon={User}
            colorClass="bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
          />
          <StatCard
            title="Total Revenue"
            value={loading ? "..." : `₹${(data.totalRevenue || 0).toLocaleString('en-IN')}`}
            change="GROSS"
            trend="up"
            icon={IndianRupee}
            colorClass="bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
          />
          <StatCard
            title="Active Subscriptions"
            value={loading ? "..." : (data.activeSubs || 0).toLocaleString('en-IN')}
            change="ONGOING"
            trend="up"
            icon={Package}
            colorClass="bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Daily Visitors</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{loading ? "..." : (data.dailyVisitors || 0).toLocaleString('en-IN')}</h3>
                <p className="text-xs font-bold text-emerald-600 mt-2">ACTIVE IN 24H</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <Users className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Conversion Rate</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{loading ? "..." : `${(data.conversionRate || 0).toFixed(1)}%`}</h3>
                <p className="text-xs font-bold text-blue-600 mt-2">USER TO PAID</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Avg. Revenue/User</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">₹{loading ? "..." : (data.arpu || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}</h3>
                <p className="text-xs font-bold text-rose-600 mt-2">PER REGISTERED USER</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                <IndianRupee className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="Revenue Growth" info="Monthly successful payments">
            <ResponsiveContainer width="100%" height={320} aspect={2}>
              <BarChart data={analytics.revenueGrowth.length > 0 ? analytics.revenueGrowth : [{ name: 'No Data', value: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} fontSize={12} fontWeight="700" />
                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} dx={-10} fontSize={12} fontWeight="700" />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Subscription Mix" info="Active Plan Distribution">
            <ResponsiveContainer width="100%" height={320} aspect={2}>
              <PieChart>
                <Pie
                  data={analytics.subscriptionMix.length > 0 ? analytics.subscriptionMix : [{ name: 'No Data', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(analytics.subscriptionMix.length > 0 ? analytics.subscriptionMix : [{ name: 'No Data', value: 1 }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444'][index % 4]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Product Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="Visitors Trend" info="Growth trajectory">
            <ResponsiveContainer width="100%" height={280} aspect={2.5}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} fontSize={12} fontWeight="700" />
                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} dx={-10} fontSize={12} fontWeight="700" />
                <Tooltip />
                <Line type="monotone" dataKey="visitors" stroke="#8b5cf6" strokeWidth={4} dot={{ fill: '#8b5cf6', strokeWidth: 3, r: 6, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Product Performance" info="Market Share breakdown">
            <div className="space-y-6 pt-4">
              {productData.map((product, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-black text-slate-700">{product.name}</span>
                    <span className="text-sm font-black text-indigo-600">{product.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${product.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${product.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}