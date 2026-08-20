import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MAIN_API_URL } from '../../config/api';
import {
    Users,
    MoreVertical,
    Plus,
    Briefcase,
    Layers,
    Code,
    PenTool,
    Megaphone,
    HeartHandshake,
    LineChart,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newDept, setNewDept] = useState({ name: '', head: '', description: '' });

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${MAIN_API_URL}/employees/departments`);
            if (res.data.success) {
                setDepartments(res.data.departments);
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
            toast.error("Failed to load departments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleAddDepartment = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${MAIN_API_URL}/employees/departments/add`, newDept);
            if (res.data.success) {
                toast.success("Department added successfully");
                setIsAddModalOpen(false);
                setNewDept({ name: '', head: '', description: '' });
                fetchDepartments();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add department");
        }
    };

    const getIcon = (name) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('engineering') || lowerName.includes('tech')) return Code;
        if (lowerName.includes('design')) return PenTool;
        if (lowerName.includes('marketing')) return Megaphone;
        if (lowerName.includes('hr') || lowerName.includes('human')) return HeartHandshake;
        if (lowerName.includes('sales')) return LineChart;
        return Briefcase;
    };

    const colors = [
        { color: "bg-blue-100 text-blue-600", border: "border-blue-100" },
        { color: "bg-pink-100 text-pink-600", border: "border-pink-100" },
        { color: "bg-purple-100 text-purple-600", border: "border-purple-100" },
        { color: "bg-emerald-100 text-emerald-600", border: "border-emerald-100" },
        { color: "bg-orange-100 text-orange-600", border: "border-orange-100" },
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
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Departments</h1>
                        <div className="flex items-center gap-2 text-slate-500 font-bold">
                            <Layers className="w-5 h-5" />
                            <span>{departments.length} Active Departments</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Department</span>
                    </button>
                </div>

                {/* Departments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {departments.map((dept, index) => {
                        const Icon = getIcon(dept.name);
                        const style = colors[index % colors.length];
                        return (
                            <div key={dept._id} className="group bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-indigo-100 hover:shadow-indigo-200/50 transition-all relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                    <Icon className="w-32 h-32" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`p-4 rounded-2xl ${style.color} shadow-lg`}>
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                            <MoreVertical className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-800 mb-2">{dept.name}</h3>
                                    <p className="text-slate-500 font-bold text-sm uppercase tracking-wide mb-8">Head: {dept.head || 'Not Assigned'}</p>

                                    <div className="flex items-end justify-between">
                                        <div className="flex -space-x-3">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                                    U{i}
                                                </div>
                                            ))}
                                            {dept.employeeCount > 3 && (
                                                <div className="w-10 h-10 rounded-full border-2 border-white bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                    +{dept.employeeCount - 3}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-3xl font-black text-slate-800">{dept.employeeCount || 0}</span>
                                            <span className="text-sm font-bold text-slate-400 ml-1">Members</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add Department Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in duration-300">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">Create New Department</h2>
                        <form onSubmit={handleAddDepartment} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 uppercase tracking-wider ml-1">Department Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all border-none"
                                    placeholder="e.g. Engineering"
                                    value={newDept.name}
                                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 uppercase tracking-wider ml-1">Department Head</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all border-none"
                                    placeholder="e.g. John Doe"
                                    value={newDept.head}
                                    onChange={(e) => setNewDept({ ...newDept, head: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Departments;
