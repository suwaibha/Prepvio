import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  TrendingUp,
  User,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Activity,
  Ticket,
  Search,
  Filter,
  Eye,
  PenSquare,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Skeleton } from '../../Components/ui/Skeleton';
import DeleteConfirmationModal from '../../Components/DeleteConfirmationModal';
import toast from 'react-hot-toast';
import axios from 'axios';
import { MAIN_API_URL } from '../../config/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);

  // Real Data States
  const [revenueStats, setRevenueStats] = useState({ totalRevenue: 0, activeServices: 0 });
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [serviceUsageData, setServiceUsageData] = useState([]);
  const [supportTicketsCount, setSupportTicketsCount] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [employeesList, setEmployeesList] = useState([]);

  // Delete Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Table States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('adminToken'); // Ensure this key is used for retrieval

      // If no token exists, redirect to login immediately
      if (!token) {
        toast.error("Please login first");
        setTimeout(() => {
          window.location.href = "http://localhost:5174/admin-login";
        }, 1000);
        return;
      }

      try {
        setLoading(true);

        // Headers configuration with Authorization token
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        };

        // Fetch all data with proper error handling
        const [revenueRes, analyticsRes, ticketsRes, usersRes] = await Promise.allSettled([
          axios.get(`${MAIN_API_URL}/revenue/overview`, config),
          axios.get(`${MAIN_API_URL}/revenue/analytics`, config),
          axios.get(`${MAIN_API_URL}/tickets/admin/all`, config),
          axios.get(`${MAIN_API_URL}/users/admin/all-users`, config)
        ]);

        // Count how many requests failed with 401 (Unauthorized)
        const unauthorizedCount = [revenueRes, analyticsRes, ticketsRes, usersRes].filter(
          res => res.status === 'rejected' && res.reason?.response?.status === 401
        ).length;

        // Only redirect if ALL or MOST requests fail with 401 (means token is invalid)
        if (unauthorizedCount >= 3) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRole');
          toast.error("Session expired. Please login again.");
          setTimeout(() => {
            window.location.href = "http://localhost:5174/admin-login";
          }, 1500);
          return;
        }

        // Process Revenue Overview
        if (revenueRes.status === 'fulfilled') {
          const data = revenueRes.value?.data;
          if (data?.success) {
            setRevenueStats({
              totalRevenue: data.totalRevenue || 0,
              activeServices: data.activeSubs || 0
            });
          }
        } else {
          console.warn('Revenue API failed:', revenueRes.reason?.message);
        }

        // Process Analytics (Revenue Chart & Service Usage)
        if (analyticsRes.status === 'fulfilled') {
          const data = analyticsRes.value?.data;
          if (data?.success) {
            setRevenueChartData(data.revenueGrowth || []);
            setServiceUsageData(data.serviceUsage || []);
          }
        } else {
          console.warn('Analytics API failed:', analyticsRes.reason?.message);
        }

        // Process Tickets
        if (ticketsRes.status === 'fulfilled') {
          const data = ticketsRes.value?.data;
          if (data?.success) {
            setSupportTicketsCount(data.count || 0);
          }
        } else {
          console.warn('Tickets API failed:', ticketsRes.reason?.message);
        }

        // Process Users (Total Employees & Table)
        if (usersRes.status === 'fulfilled') {
          const data = usersRes.value?.data;
          if (data?.success) {
            const users = data.data || [];
            setTotalEmployees(users.length);
            setEmployeesList(users);
          }
        } else {
          console.warn('Users API failed:', usersRes.reason?.message);
        }

        // Show warning if some APIs failed but not all
        if (unauthorizedCount > 0 && unauthorizedCount < 3) {
          toast('Some data could not be loaded', { icon: '⚠️' });
        }

      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('adminToken');
      const res = await axios.delete(`${MAIN_API_URL}/users/admin/delete/${userToDelete.id || userToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      if (res.data.success) {
        toast.success("User deleted successfully");
        // Update local state instead of refetching everything if possible, 
        // but here we can just filter the list
        setEmployeesList(prev => prev.filter(u => (u.id || u._id) !== (userToDelete.id || userToDelete._id)));
        setTotalEmployees(prev => prev - 1);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  // Sorting Logic
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedEmployees = React.useMemo(() => {
    if (!employeesList || employeesList.length === 0) return [];
    let sortableItems = [...employeesList];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (aVal < bVal) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [employeesList, sortConfig]);

  // Filtering Logic
  const filteredEmployees = sortedEmployees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const currentItems = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Actions
  const handleDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleEdit = (id) => {
    toast.success("Edit modal opened for ID: " + id);
  };

  // Format Currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Loading State
  if (loading) {
    return (
      <div className="space-y-8 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-[2rem]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-[2rem]" />
          <Skeleton className="h-96 rounded-[2rem]" />
        </div>
        <Skeleton className="h-96 rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* 1. Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={totalEmployees}
          trend="+12%"
          trendUp={true}
          icon={Users}
          color="indigo"
        />
        <MetricCard
          title="Active Services"
          value={revenueStats.activeServices}
          trend="+5.2%"
          trendUp={true}
          icon={Briefcase}
          color="pink"
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(revenueStats.totalRevenue)}
          trend="+8.1%"
          trendUp={true}
          icon={TrendingUp}
          color="emerald"
        />
        <MetricCard
          title="Support Tickets"
          value={supportTicketsCount}
          trend="-2.4%"
          trendUp={false}
          icon={Ticket}
          color="amber"
        />
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-800">Revenue Analytics</h3>
              <p className="text-sm font-bold text-slate-400">Monthly revenue performance</p>
            </div>
            <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
              <MoreVertical className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="h-[400px] w-full min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%" aspect={2}>
              <AreaChart data={revenueChartData.length > 0 ? revenueChartData : [{ name: 'No Data', value: 0 }]}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dx={-10} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column - Service Usage & Activity */}
        <div className="space-y-6">
          {/* Service Usage Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 mb-6">Service Usage</h3>
            <div className="h-[250px] w-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%" aspect={1.5}>
                <BarChart data={serviceUsageData.length > 0 ? serviceUsageData : [{ name: 'No Data', active: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="active" fill="#f472b6" radius={[4, 4, 4, 4]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex-1">
            <h3 className="text-lg font-black text-slate-800 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { title: "New Job Posted", time: "2h ago", icon: Briefcase, color: "bg-blue-100 text-blue-600" },
                { title: "Server Maintenance", time: "5h ago", icon: Activity, color: "bg-orange-100 text-orange-600" },
                { title: "New Employee", time: "1d ago", icon: User, color: "bg-emerald-100 text-emerald-600" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                  <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{item.title}</p>
                    <p className="text-xs font-semibold text-slate-400">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Enhanced Employees Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800">All Users & Employees</h2>
            <p className="text-slate-500 font-bold text-sm">Manage your team and users</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, role, email..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <SortableHeader label="Name" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Role" sortKey="role" currentSort={sortConfig} onSort={handleSort} />
                <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 text-left">Status</th>
                <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentItems.length > 0 ? (
                currentItems.map((emp, index) => (
                  <tr key={emp.id || emp._id || index} className="group hover:bg-indigo-50/20 transition-all">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm shadow-sm">
                          {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{emp.name || 'N/A'}</p>
                          <p className="text-xs font-semibold text-slate-400">{emp.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <Briefcase className="w-3 h-3 mr-1.5" />
                        {emp.role || 'User'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        {emp.status || 'Active'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionBtn icon={Eye} onClick={() => toast.success(`View ${emp.name || 'User'}`)} color="text-blue-600 bg-blue-50" />
                        <ActionBtn icon={PenSquare} onClick={() => handleEdit(emp.id || emp._id)} color="text-amber-600 bg-amber-50" />
                        <ActionBtn icon={Trash2} onClick={() => handleDelete(emp)} color="text-rose-600 bg-rose-50" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-8 py-12 text-center text-slate-500 font-bold">
                    {searchTerm ? 'No results found.' : 'No users available.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredEmployees.length > 0 && (
          <div className="p-6 border-t border-slate-50 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500">
              Showing {Math.min(filteredEmployees.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredEmployees.length, currentPage * itemsPerPage)} of {filteredEmployees.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete user "${userToDelete?.name || 'this user'}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

// --- Sub Components ---

const MetricCard = ({ title, value, trend, trendUp, icon: Icon, color }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    pink: 'bg-pink-50 text-pink-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-14 h-14 rounded-2xl ${colors[color]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          {React.createElement(Icon, { className: "w-7 h-7" })}
        </div>
        <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">{title}</div>
      <div className="text-4xl font-black text-slate-800 tracking-tight">{value}</div>
    </div>
  );
};

const SortableHeader = ({ label, sortKey, currentSort, onSort }) => (
  <th
    className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 text-left cursor-pointer hover:bg-slate-50 transition-colors select-none"
    onClick={() => onSort(sortKey)}
  >
    <div className="flex items-center gap-2">
      {label}
      <div className="flex flex-col">
        <ChevronLeft className={`w-2 h-2 rotate-90 ${currentSort.key === sortKey && currentSort.direction === 'ascending' ? 'text-indigo-600' : 'text-slate-300'}`} />
        <ChevronLeft className={`w-2 h-2 -rotate-90 ${currentSort.key === sortKey && currentSort.direction === 'descending' ? 'text-indigo-600' : 'text-slate-300'}`} />
      </div>
    </div>
  </th>
);

const ActionBtn = ({ icon: Icon, onClick, color }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg ${color} hover:shadow-md transition-all`}
  >
    {React.createElement(Icon, { className: "w-4 h-4" })}
  </button>
);

export default Dashboard;
