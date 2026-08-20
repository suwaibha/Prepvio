import React from 'react';
import {
  Home,
  ChevronRight,
  MessageSquare,
  Calendar,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Users,
  Bell,
  MoreVertical,
  ChevronDown,
  IndianRupee,
  CheckCircle,
  XCircle,
  PieChart
} from 'lucide-react';

import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// --- Glass Card Component ---
const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/30 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4 ${className}`}>
    {children}
  </div>
);

// --- Breadcrumbs Component ---
const Breadcrumbs = () => (
  <nav className="flex items-center text-sm text-gray-100 mb-6" aria-label="Breadcrumb">
    <ol className="inline-flex items-center space-x-1 md:space-x-2">
      <li className="inline-flex items-center">
        <a href="#" className="inline-flex items-center text-gray-100 hover:text-white">
          <Home className="w-4 h-4 mr-2" />
          Home
        </a>
      </li>
      <li>
        <div className="flex items-center">
          <ChevronRight className="w-4 h-4" />
          <a href="#" className="ml-1 text-gray-100 hover:text-white md:ml-2">Dashboard</a>
        </div>
      </li>
      <li aria-current="page">
        <div className="flex items-center">
          <ChevronRight className="w-4 h-4" />
          <span className="ml-1 text-gray-300 md:ml-2">Analytics</span>
        </div>
      </li>
    </ol>
  </nav>
);

// --- Top Stat Card ---
const StatCard = ({ title, value, date, icon, iconBgColor }) => (
  <GlassCard className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-700 font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600">{date}</p>
    </div>
    <div className={`p-3 rounded-full ${iconBgColor}`}>
      {icon}
    </div>
  </GlassCard>
);

// --- Revenue Chart ---
const RevenueChart = () => {
  const data = {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    datasets: [
      {
        label: 'Revenue',
        data: [120, 150, 110, 180, 210, 240, 200, 190, 230, 250, 220, 260],
        borderColor: '#3b82f6', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointRadius: 0,
        pointHoverRadius: 6,
      },
      {
        label: 'Sales',
        data: [80, 100, 130, 110, 140, 170, 190, 160, 140, 170, 200, 180],
        borderColor: '#f59e0b', // Amber
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#f59e0b',
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: 'rgb(31, 41, 55)',
          usePointStyle: true,
          boxWidth: 8,
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: { color: 'rgb(107, 114, 128)' }
      },
      y: {
        ticks: {
          color: 'rgb(107, 114, 128)',
          stepSize: 50
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.3)',
          borderColor: 'transparent'
        }
      },
    },
  };
  return (
    <GlassCard className="col-span-1 lg:col-span-2 p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Revenue analytics</h3>
        <button className="text-sm text-gray-700 bg-white/50 px-3 py-1 rounded-lg border border-white/30">
          Monthly <ChevronDown className="w-4 h-4 inline-block ml-1" />
        </button>
      </div>
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
    </GlassCard>
  );
};

// --- Calendar Schedule ---
const CalendarSchedule = () => {
  const schedule = [
    { time: '10:00', title: 'Revision offered', color: 'border-l-blue-500' },
    { time: '10:00', title: 'Add new meta tags', color: 'border-l-green-500' },
    { time: '10:00', title: 'Add new test case', color: 'border-l-yellow-500' },
    { time: '10:00', title: 'Send new offers', color: 'border-l-red-500' },
  ];
  return (
    <GlassCard className="col-span-1">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Calendar</h3>
        <span className="text-sm text-indigo-600 font-medium">Aug 11, 2025</span>
      </div>
      <div className="space-y-3">
        {schedule.map((item, i) => (
          <div key={i} className={`p-3 bg-white/50 rounded-lg border-l-4 ${item.color}`}>
            <p className="text-sm font-semibold text-gray-800">{item.title}</p>
            <p className="text-xs text-gray-600">{item.time}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// --- Membership Stats ---
const MembershipChart = () => {
  const data = {
    datasets: [
      {
        data: [78, 22],
        backgroundColor: ['#3b82f6', 'rgba(255, 255, 255, 0.3)'],
        borderColor: ['#3b82f6', 'transparent'],
        borderWidth: 1,
        circumference: 270,
        rotation: 225,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };
  return (
    <GlassCard className="col-span-1">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Membership Stats</h3>
        <button className="text-sm text-gray-700 bg-white/50 px-3 py-1 rounded-lg border border-white/30">
          Monthly <ChevronDown className="w-4 h-4 inline-block ml-1" />
        </button>
      </div>
      <div className="h-40 relative flex justify-center items-center mb-4">
        <Doughnut data={data} options={options} />
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">78%</span>
        </div>
      </div>
      <div className="flex justify-around text-center">
        <div>
          <p className="text-sm text-gray-700">New</p>
          <p className="font-semibold text-gray-900">2,350</p>
        </div>
        <div>
          <p className="text-sm text-gray-700">Paypal</p>
          <p className="font-semibold text-gray-900">1,200</p>
        </div>
      </div>
    </GlassCard>
  );
};

// --- Activity Chart ---
const ActivityChart = () => {
  const data = {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    datasets: [
      {
        label: 'Sales',
        data: [100, 130, 110, 140, 170, 190, 160, 140, 170],
        borderColor: '#10b981', // Green
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Revenue',
        data: [80, 100, 130, 110, 140, 170, 190, 160, 140].map(v => v * 0.7),
        borderColor: '#f59e0b', // Amber
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: 'rgb(31, 41, 55)',
          usePointStyle: true,
          boxWidth: 8,
        }
      },
      tooltip: { mode: 'index', intersect: false, },
    },
    scales: {
      x: { grid: { display: false } },
      y: { display: false },
    },
  };
  return (
    <GlassCard className="col-span-1 lg:col-span-2 p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Activity</h3>
        <button className="text-sm text-gray-700 bg-white/50 px-3 py-1 rounded-lg border border-white/30">
          Monthly <ChevronDown className="w-4 h-4 inline-block ml-1" />
        </button>
      </div>
      <div className="h-52">
        <Line data={data} options={options} />
      </div>
    </GlassCard>
  );
};

// --- Latest Signups Table ---
const LatestSignups = () => {
  const signups = [
    { name: "Jeb Selas", email: "selas12@gmail.com", date: "2022/10/11", avatar: "JS" },
    { name: "Adam Cox", email: "admcx@gmail.com", date: "2022/10/10", avatar: "AC" },
    { name: "Bradley Greer", email: "greer@gmail.com", date: "2022/10/09", avatar: "BG" },
    { name: "Brandie Williamson", email: "brandie@gmail.com", date: "2022/10/08", avatar: "BW" },
    { name: "Colleen Hurst", email: "hurst22@gmail.com", date: "2022/10/07", avatar: "CH" },
  ];
  return (
    <GlassCard className="col-span-1 lg:col-span-2 p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Latest Sign up List</h3>
        <a href="#" className="text-sm text-indigo-600 font-medium">View All</a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-600 border-b border-white/30">
            <tr>
              <th className="py-2 font-normal">NAME</th>
              <th className="py-2 font-normal">EMAIL</th>
              <th className="py-2 font-normal">JOINING DATE</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {signups.map((user, i) => (
              <tr key={i} className="border-b border-white/20 last:border-b-0">
                <td className="py-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-xs font-bold">
                    {user.avatar}
                  </span>
                  <span className="font-medium">{user.name}</span>
                </td>
                <td className="py-3">{user.email}</td>
                <td className="py-3">{user.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};

// --- Notifications ---
const Notifications = () => {
  const notifications = [
    { text: "Broly just set up annual membership...", time: "Today, 10:00 AM", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
    { text: "Admire just set up membership planning", time: "Yesterday, 12:00 PM", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
    { text: "Nia just canceled 2-month membership", time: "20 Jul, 12:00 PM", icon: <XCircle className="w-5 h-5 text-red-500" /> },
    { text: "Colleen just paid 1-month membership", time: "20 Jul, 10:00 PM", icon: <IndianRupee className="w-5 h-5 text-blue-500" /> },
    { text: "Ida just canceled 2-month membership", time: "19 Jul, 12:00 PM", icon: <XCircle className="w-5 h-5 text-red-500" /> },
    { text: "Colleen just paid 1-month membership", time: "19 Jul, 10:00 AM", icon: <IndianRupee className="w-5 h-5 text-blue-500" /> },
  ];
  return (
    <GlassCard className="col-span-1 p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Notifications</h3>
        <Bell className="w-5 h-5 text-gray-700" />
      </div>
      <div className="space-y-4">
        {notifications.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-1">{item.icon}</div>
            <div>
              <p className="text-sm text-gray-800">{item.text}</p>
              <p className="text-xs text-gray-600">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// --- Main App Component ---
export default function AnalyticsDashboard() {
  const appStyle = {
    backgroundImage: "linear-gradient(to right top, #ff6b6b, #ffb347, #ffe780, #ffccb3, #ff8c8c)",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '100vh',
  };

  return (
    <div style={appStyle} className="font-inter min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs />
        <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Top Stats */}
          <StatCard title="Presentations" value="560+" date="May 21 - June 21" icon={<BarChart2 className="w-6 h-6 text-blue-700" />} iconBgColor="bg-blue-100" />
          <StatCard title="Renewals" value="1,563" date="May 21 - June 21" icon={<TrendingUp className="w-6 h-6 text-green-700" />} iconBgColor="bg-green-100" />
          <StatCard title="Retention" value="40.6%" date="May 21 - June 21" icon={<Calendar className="w-6 h-6 text-yellow-700" />} iconBgColor="bg-yellow-100" />
          <StatCard title="Cancellations" value="40.6%" date="May 21 - June 21" icon={<TrendingDown className="w-6 h-6 text-red-700" />} iconBgColor="bg-red-100" />

          {/* Main Charts Row */}
          <RevenueChart />
          <CalendarSchedule />

          {/* Secondary Charts Row */}
          <MembershipChart />
          <ActivityChart />

          {/* Data Lists Row */}
          <LatestSignups />
          <Notifications />
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all">
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
}