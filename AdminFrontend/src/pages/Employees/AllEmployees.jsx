import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MAIN_API_URL } from '../../config/api';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Plus,
    Mail,
    Phone,
    Building,
    MapPin,
    Briefcase,
    CheckCircle,
    Loader2,
    Trash2
} from 'lucide-react';
import DeleteConfirmationModal from '../../Components/DeleteConfirmationModal';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AllEmployees = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Delete Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('ADMIN_AUTH_TOKEN');
            const res = await axios.get(`${MAIN_API_URL}/employees/all`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            if (res.data.success) {
                setEmployees(res.data.employees);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
            toast.error("Failed to load employees");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleDeleteClick = (employee) => {
        setEmployeeToDelete(employee);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteEmployee = async () => {
        if (!employeeToDelete) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('ADMIN_AUTH_TOKEN');
            const res = await axios.delete(`${MAIN_API_URL}/employees/delete/${employeeToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            if (res.data.success) {
                toast.success("Employee deleted successfully");
                fetchEmployees();
            }
        } catch (error) {
            console.error("Error deleting employee:", error);
            toast.error("Failed to delete employee");
        } finally {
            setIsDeleteModalOpen(false);
            setEmployeeToDelete(null);
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getAvatarColor = (name) => {
        const colors = [
            "bg-pink-100 text-pink-600",
            "bg-blue-100 text-blue-600",
            "bg-purple-100 text-purple-600",
            "bg-emerald-100 text-emerald-600",
            "bg-orange-100 text-orange-600",
        ];
        const index = name.length % colors.length;
        return colors[index];
    };

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
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">All Employees</h1>
                        <div className="flex items-center gap-2 text-slate-500 font-bold">
                            <Users className="w-5 h-5" />
                            <span>{employees.length} Total Members</span>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/employees/add')}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Employee</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-[2rem] shadow-lg shadow-slate-200/40 border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
                            <Filter className="w-4 h-4" />
                            <span>Filters</span>
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
                            <Building className="w-4 h-4" />
                            <span>Department</span>
                        </button>
                    </div>
                </div>

                {/* Employee Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredEmployees.map((employee) => (
                        <div key={employee._id} className="group bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-indigo-100 hover:border-indigo-100 transition-all relative overflow-hidden">
                            <div className="absolute top-6 right-6 flex gap-2">
                                <button
                                    onClick={() => handleDeleteClick(employee)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete Employee"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-col items-center text-center mb-6">
                                <div className={`w-24 h-24 rounded-[2rem] ${getAvatarColor(employee.name)} flex items-center justify-center text-2xl font-black mb-4 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                    {employee.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-1">{employee.name}</h3>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <Briefcase className="w-3 h-3" />
                                    {employee.position}
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-slate-500 font-semibold">
                                        <Building className="w-4 h-4" />
                                        <span>Department</span>
                                    </div>
                                    <span className="font-bold text-slate-700">{employee.departmentId?.name || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-slate-500 font-semibold">
                                        <Mail className="w-4 h-4" />
                                        <span>Email</span>
                                    </div>
                                    <span className="font-bold text-slate-700 truncate max-w-[120px]">{employee.email}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-slate-500 font-semibold">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Status</span>
                                    </div>
                                    <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${employee.status === 'Active'
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                                        }`}>
                                        {employee.status}
                                    </span>
                                </div>
                            </div>

                            <button className="w-full mt-6 py-4 rounded-xl bg-slate-50 text-slate-600 font-bold hover:bg-indigo-600 hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-indigo-200">
                                View Profile
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setEmployeeToDelete(null);
                }}
                onConfirm={confirmDeleteEmployee}
                itemName={employeeToDelete?.name}
                title="Delete Employee"
            />
        </div>
    );
};

export default AllEmployees;
