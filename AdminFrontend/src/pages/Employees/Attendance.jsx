import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MAIN_API_URL } from '../../config/api';
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Filter,
    ChevronLeft,
    ChevronRight,
    Users,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Attendance = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate] = useState(new Date());

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${MAIN_API_URL}/employees/attendance/daily`);
            if (res.data.success) {
                setAttendanceData(res.data.attendance);
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
            toast.error("Failed to load attendance log");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    const stats = [
        { label: "Present Today", value: attendanceData.filter(a => a.status === 'Present').length, total: attendanceData.length || '0', color: "text-emerald-500", bg: "bg-emerald-50", icon: CheckCircle },
        { label: "Absent", value: attendanceData.filter(a => a.status === 'Absent').length, total: attendanceData.length || '0', color: "text-rose-500", bg: "bg-rose-50", icon: XCircle },
        { label: "Late Arrival", value: attendanceData.filter(a => a.status === 'Late').length, total: attendanceData.length || '0', color: "text-amber-500", bg: "bg-amber-50", icon: AlertCircle },
        { label: "On Leave", value: attendanceData.filter(a => a.status === 'On Leave').length, total: attendanceData.length || '0', color: "text-indigo-500", bg: "bg-indigo-50", icon: Calendar },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Attendance</h1>
                        <p className="text-slate-500 font-bold">Manage and track daily attendance</p>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                        <button className="p-3 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md">
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="flex items-center gap-2 px-4 font-black text-slate-700">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            <span>{currentDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                        </div>
                        <button className="p-3 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md">
                            <ChevronRight className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-[2rem] shadow-lg shadow-slate-200/40 border border-slate-100 flex items-center justify-between group hover:-translate-y-1 transition-transform">
                            <div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{stat.label}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-slate-800">{stat.value}</span>
                                    <span className="text-sm font-bold text-slate-400">/ {stat.total}</span>
                                </div>
                            </div>
                            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-7 h-7" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Attendance List */}
                <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-800">Daily Log</h3>
                        <div className="flex gap-3">
                            <button
                                onClick={fetchAttendance}
                                className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all"
                            >
                                Refresh
                            </button>
                            <button className="flex items-center gap-2 px-6 py-3 bg-slate-50 rounded-xl font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                <Filter className="w-4 h-4" />
                                <span>Filter</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/50 text-left border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Check In</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Check Out</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Work Hours</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {attendanceData.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-12 text-center text-slate-400 font-bold">
                                            No attendance records found for today.
                                        </td>
                                    </tr>
                                ) : attendanceData.map((row) => (
                                    <tr key={row._id} className="hover:bg-indigo-50/30 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                                                    {row.employeeId?.name ? row.employeeId.name.split(' ').map(n => n[0]).join('') : '?'}
                                                </div>
                                                <span className="font-bold text-slate-700">{row.employeeId?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-bold text-slate-500">{row.checkIn || '-'}</td>
                                        <td className="px-8 py-6 font-bold text-slate-500">{row.checkOut || '-'}</td>
                                        <td className="px-8 py-6 font-bold text-slate-700">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                {row.workHours > 0 ? `${row.workHours}h` : '-'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${row.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                row.status === 'Absent' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                    row.status === 'Late' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                        'bg-slate-100 text-slate-500 border border-slate-200'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline">Details</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
