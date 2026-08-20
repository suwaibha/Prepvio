import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Send,
    Clock,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    User
} from 'lucide-react';
import axios from 'axios';
import { mainApi } from '../utils/apiClient';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import socket from '../socket';
import MobileDashboardHeader from '../components/MobileDashboardHeader';

const TicketDetail = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const { setMobileOpen } = useOutletContext();

    useEffect(() => {
        fetchTicketDetails();

        // Socket listener for new messages
        socket.on('new_message', (message) => {
            setMessages((prev) => {
                if (prev.find(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
        });

        socket.on('ticket_updated', (updatedTicket) => {
            if (updatedTicket.id === ticketId) {
                setTicket(prev => ({ ...prev, ...updatedTicket }));
            }
        });

        return () => {
            socket.off('new_message');
            socket.off('ticket_updated');
        };
    }, [ticketId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchTicketDetails = async () => {
        try {
            setLoading(true);
            const res = await mainApi.get(`/tickets/${ticketId}`);

            if (res.data.success) {
                setTicket(res.data.ticket);
                setMessages(res.data.messages);
            }
        } catch (error) {
            console.error('Failed to fetch ticket details:', error);
            alert('Failed to load ticket details');
            navigate('/dashboard/tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        try {
            setSending(true);
            const res = await mainApi.post(`/tickets/${ticketId}/reply`, {
                text: newMessage.trim()
            });

            if (res.data.success) {
                setMessages(prev => [...prev, res.data.message]);
                setNewMessage('');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setSending(false);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
                <div className="text-slate-400 font-bold animate-pulse">Loading ticket...</div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
                <div className="text-slate-400 font-bold">Ticket not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF9] font-sans">
            {/* Mobile Header */}
            <MobileDashboardHeader setMobileOpen={setMobileOpen} />

            <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/tickets')}
                        className="p-3 hover:bg-white rounded-xl transition-colors border border-slate-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                {ticket.ticketId}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority)}`} />
                            <span className="text-xs font-bold text-slate-500">{ticket.priority} Priority</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-800">{ticket.subject}</h1>
                    </div>
                    <span className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-wide ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                    </span>
                </div>

                {/* Ticket Info Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-slate-400 font-bold mb-1">Category</p>
                            <p className="text-slate-800 font-black">{ticket.category}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold mb-1">Created</p>
                            <p className="text-slate-800 font-black">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold mb-1">Last Updated</p>
                            <p className="text-slate-800 font-black">{new Date(ticket.lastUpdated).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold mb-1">Status</p>
                            <p className="text-slate-800 font-black">{ticket.status}</p>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-slate-400 font-bold mb-2">Description</p>
                        <p className="text-slate-700 leading-relaxed">{ticket.description}</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col" style={{ height: '500px' }}>
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-600" />
                            Conversation
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => {
                                const isMe = msg.sender === 'CurrentUser';
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex items-end gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                                            {/* Avatar */}
                                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border border-slate-100 ${isMe ? 'bg-slate-200 text-slate-600' : 'bg-[#D4F478] text-black'
                                                }`}>
                                                {isMe ? 'U' : 'P'}
                                            </div>

                                            {/* Message Bubble */}
                                            <div className={`relative px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${isMe
                                                ? 'bg-[#1A1A1A] text-white rounded-br-none'
                                                : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-bl-none'
                                                }`}>
                                                <p>{msg.text}</p>
                                                <span className={`text-[10px] font-bold mt-1.5 block opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                                                    {msg.timestamp}
                                                </span>
                                            </div>

                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100">
                        <div className="flex items-end gap-3 bg-slate-50 rounded-2xl p-2 border border-slate-200 focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100 transition-all">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                                placeholder="Type your message..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 py-3 px-2 min-h-[44px] max-h-32 resize-none font-medium leading-relaxed"
                                rows={1}
                                disabled={ticket.status === 'Closed'}
                            />

                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sending || ticket.status === 'Closed'}
                                className="bg-[#1A1A1A] text-white p-3 rounded-xl hover:bg-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-md"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>

                        {ticket.status === 'Closed' && (
                            <p className="text-center text-xs font-bold text-slate-400 mt-2">
                                This ticket is closed
                            </p>
                        )}
                    </form>
                </div>

            </div>
        </div>
    );
};

export default TicketDetail;