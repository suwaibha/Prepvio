import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Filter,
    Clock,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    X,
    Send
} from 'lucide-react';
import axios from 'axios';
import { mainApi } from '../utils/apiClient';
import { useNavigate, useOutletContext } from 'react-router-dom';
import MobileDashboardHeader from '../components/MobileDashboardHeader';

const Tickets = () => {
    const navigate = useNavigate();
    const { setMobileOpen } = useOutletContext();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // New ticket form state
    const [newTicket, setNewTicket] = useState({
        subject: '',
        description: '',
        priority: 'Medium',
        category: 'General'
    });

    // Fetch tickets
    useEffect(() => {
        fetchTickets();
    }, [filterStatus]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterStatus) params.status = filterStatus;

            const res = await mainApi.get('/tickets/my-tickets', {
                params
            });

            if (res.data.success) {
                setTickets(res.data.tickets);
            }
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();

        if (!newTicket.subject.trim() || !newTicket.description.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const res = await mainApi.post('/tickets/create', newTicket);

            if (res.data.success) {
                setShowCreateModal(false);
                setNewTicket({
                    subject: '',
                    description: '',
                    priority: 'Medium',
                    category: 'General'
                });
                fetchTickets();
            }
        } catch (error) {
            console.error('Failed to create ticket:', error);
            alert('Failed to create ticket. Please try again.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'bg-rose-100 text-rose-700 border border-rose-200';
            case 'In Progress': return 'bg-amber-100 text-amber-700 border border-amber-200';
            case 'Replied': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
            case 'Closed': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-rose-500';
            case 'Medium': return 'bg-amber-500';
            case 'Low': return 'bg-emerald-500';
            default: return 'bg-slate-500';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Open': return <AlertCircle className="w-4 h-4" />;
            case 'In Progress': return <Clock className="w-4 h-4" />;
            case 'Replied': return <MessageSquare className="w-4 h-4" />;
            case 'Closed': return <CheckCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const filteredTickets = tickets.filter(ticket =>
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] selection:text-black">
            {/* Mobile Header */}
            <MobileDashboardHeader setMobileOpen={setMobileOpen} />

            <div className="p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                <MessageSquare className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Support Tickets</h1>
                                <p className="text-slate-500 font-bold mt-1">Track and manage your support requests</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-xl hover:bg-black transition-all font-bold shadow-md"
                        >
                            <Plus className="w-5 h-5" /> Create Ticket
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 placeholder:text-slate-400"
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-6 py-3 bg-white border-2 border-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 transition-all font-bold text-slate-700"
                        >
                            <option value="">All Status</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Replied">Replied</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>

                    {/* Tickets List */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Loading tickets...</div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="p-12 text-center">
                                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold">No tickets found</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="mt-4 text-indigo-600 font-bold hover:text-indigo-700"
                                >
                                    Create your first ticket
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredTickets.map((ticket) => (
                                    <motion.div
                                        key={ticket.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => navigate(`/dashboard/tickets/${ticket.id}`)}
                                        className="p-6 border-2 border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                                        {ticket.ticketId}
                                                    </span>
                                                    <span className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority)}`} />
                                                    <span className="text-xs font-bold text-slate-500">{ticket.priority} Priority</span>
                                                </div>

                                                <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                                                    {ticket.subject}
                                                </h3>

                                                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                                    {ticket.description}
                                                </p>

                                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(ticket.lastUpdated).toLocaleDateString()}
                                                    </span>
                                                    <span className="px-2 py-1 bg-slate-100 rounded-lg">{ticket.category}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-4 py-1.5 inline-flex items-center gap-2 text-xs leading-5 font-black rounded-lg uppercase tracking-wide ${getStatusColor(ticket.status)}`}>
                                                    {getStatusIcon(ticket.status)}
                                                    {ticket.status}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Ticket Modal */}
                <AnimatePresence>
                    {showCreateModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowCreateModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-black text-slate-800">Create Support Ticket</h2>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateTicket} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Subject *</label>
                                        <input
                                            type="text"
                                            value={newTicket.subject}
                                            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                            placeholder="Brief description of your issue"
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Description *</label>
                                        <textarea
                                            value={newTicket.description}
                                            onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                            placeholder="Provide detailed information about your issue"
                                            rows={5}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium resize-none"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
                                            <select
                                                value={newTicket.priority}
                                                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all font-bold"
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                                            <select
                                                value={newTicket.category}
                                                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all font-bold"
                                            >
                                                <option value="General">General</option>
                                                <option value="Technical">Technical</option>
                                                <option value="Billing">Billing</option>
                                                <option value="Account">Account</option>
                                                <option value="Feature Request">Feature Request</option>
                                                <option value="Bug Report">Bug Report</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            className="flex-1 px-6 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-6 py-3 bg-[#1A1A1A] text-white rounded-xl hover:bg-black transition-all font-bold shadow-md flex items-center justify-center gap-2"
                                        >
                                            <Send className="w-4 h-4" /> Create Ticket
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Tickets;