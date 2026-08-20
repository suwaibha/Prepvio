import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  ChevronRight,
  MessageSquare,
  ChevronDown,
  Check,
  Tag,
  Users,
  Calendar,
  Flag,
  User,
  Mail,
  List,
  UserCheck as AssigneeIcon,
  Clock,
  Printer,
  Trash2,
  Paperclip,
  Smile,
  Mic,
  Send,
  Link as LinkIcon,
  Image as ImageIcon,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { MAIN_API_URL } from '../../config/api';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import socket from '../../socket';

const API_BASE = MAIN_API_URL;

// --- Glass Card Component (Styled for Premium Light) ---
const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 ${className}`}>
    {children}
  </div>
);

// --- Breadcrumbs Component ---
const Breadcrumbs = () => (
  <nav className="flex items-center text-sm mb-6" aria-label="Breadcrumb">
    <ol className="inline-flex items-center space-x-1 md:space-x-2">
      <li className="inline-flex items-center">
        <a href="#" className="inline-flex items-center text-slate-500 hover:text-indigo-600 font-bold transition-colors">
          <Home className="w-4 h-4 mr-2" />
          Home
        </a>
      </li>
      <li>
        <div className="flex items-center">
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <a href="#" className="ml-1 text-slate-500 hover:text-indigo-600 font-bold transition-colors md:ml-2">Ticket</a>
        </div>
      </li>
      <li aria-current="page">
        <div className="flex items-center">
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="ml-1 text-slate-400 font-bold md:ml-2">Ticket Details</span>
        </div>
      </li>
    </ol>
  </nav>
);

// --- Comment Card Component ---
const CommentCard = ({ comment }) => {
  const isMe = comment.sender === 'Prepvio';
  return (
    <div className={`flex gap-6 ${isMe ? 'flex-row-reverse' : ''} mb-4`}>
      {comment.avatar ? (
        <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-lg shadow-sm border-2 ${isMe ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
          {comment.avatar}
        </div>
      ) : (
        <img src={isMe ? "https://placehold.co/40x40/6366f1/ffffff?text=P" : "https://placehold.co/40x40/3b82f6/ffffff?text=U"} alt={comment.sender} className="w-12 h-12 rounded-2xl flex-shrink-0 border-2 border-white shadow-sm" />
      )}
      <div className={`flex-1 max-w-[80%] ${isMe ? 'text-right' : ''}`}>
        <div className={`rounded-[2rem] shadow-sm p-6 border ${isMe ? 'bg-indigo-50 border-indigo-100 rounded-tr-none' : 'bg-white border-slate-100 rounded-tl-none'}`}>
          {/* Comment Header */}
          <div className={`flex items-center gap-3 mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <span className="font-black text-slate-800 text-sm">{comment.sender}</span>
            <span className="text-xs font-bold text-slate-400">{comment.timestamp}</span>
          </div>
          {/* Comment Body */}
          <div className="text-slate-600 text-sm font-medium leading-relaxed whitespace-pre-wrap">
            {comment.text}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Reply Box Component ---
const ReplyBox = ({ onSend, loading }) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText("");
    }
  };

  return (
    <div className="flex gap-6 mt-8">
      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black flex-shrink-0 shadow-lg shadow-indigo-200">
        P
      </div>
      <div className="flex-1">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <textarea
            rows="4"
            placeholder="Type your reply..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="w-full p-6 bg-transparent focus:outline-none resize-none text-slate-700 placeholder:text-slate-400 font-medium"
          ></textarea>
          {/* Reply Toolbar */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"><Paperclip className="w-5 h-5" /></button>
            </div>
            <button
              onClick={handleSend}
              disabled={loading || !text.trim()}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Sending...' : 'Reply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---
export default function TicketDetails() {
  const [searchParams] = useSearchParams();
  const ticketId = searchParams.get('ticketId');
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendLoading, setSendLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!ticketId) return;
    const fetchTicketData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/tickets/${ticketId}`, { withCredentials: true });
        if (res.data.success) {
          setTicket(res.data.ticket);
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.error("Failed to fetch ticket", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicketData();

    // Listen for updates - using ticketId/conversationId room would be ideal but current socket impl sends to global or user room
    // For now, simple polling or global listener if socket emits 'ticket_updated'
    socket.on("new_message", (message) => {
      setMessages((prev) => {
        if (prev.find(m => m.id === message.id)) return prev;
        // Check if message belongs to this ticket's conversation
        if (ticket && message.conversationId === ticket.conversationId) {
          return [...prev, message];
        }
        return [...prev, message]; // Optimistic add, ideally check conversationId
      });
    });

    socket.on("ticket_updated", (updatedTicket) => {
      if (updatedTicket.id === ticketId) {
        setTicket(prev => ({ ...prev, ...updatedTicket }));
      }
    });

    return () => {
      socket.off("new_message");
      socket.off("ticket_updated");
    };
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendReply = async (text) => {
    setSendLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/tickets/admin/${ticketId}/reply`, { text }, { withCredentials: true });
      if (res.data.success) {
        setMessages([...messages, res.data.message]);

        // Update ticket status locally if needed, though socket/refetch will handle it
        setTicket(prev => ({ ...prev, status: 'Replied', lastUpdated: new Date().toISOString() }));
      }
    } catch (err) {
      console.error("Failed to send reply", err);
      alert("Failed to send reply");
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="flex-1 flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <Breadcrumbs />

          {/* Ticket Header */}
          <GlassCard className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <Link
                to="/support/tickets"
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold transition-colors group"
              >
                <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <span>Back to Tickets</span>
              </Link>
            </div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">{ticket?.subject || 'Loading...'}</h1>
                <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">ID: {ticket?.ticketId || '...'}</span>
              </div>
              <div className="text-right">
                <span className="block px-4 py-1.5 text-sm font-black rounded-lg bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide mb-2">{ticket?.category || 'General'}</span>
                {ticket?.user && <div className="text-sm font-bold text-slate-500">{ticket.user.name}</div>}
              </div>
            </div>
          </GlassCard>

          {/* Conversation Thread */}
          <div className="space-y-6 mb-12">
            {loading ? (
              <div className="text-slate-400 font-bold text-center py-10 animate-pulse">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-slate-400 font-bold text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200">No messages yet.</div>
            ) : (
              messages.map((msg, index) => (
                <CommentCard key={msg.id || index} comment={msg} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Box */}
          <ReplyBox onSend={handleSendReply} loading={sendLoading} />

        </main>

        {/* Sidebar (Simplified) */}
        <aside className="w-full lg:w-96 flex-shrink-0">
          <div className="sticky top-8 space-y-6">
            <GlassCard>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-indigo-50 p-3 rounded-2xl">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Quick Info</h3>
              </div>

              <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Status</label>
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${ticket?.status === 'Open' ? 'bg-rose-500' : ticket?.status === 'Closed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                  <span className="text-sm font-bold text-slate-700">{ticket?.status || 'Active'}</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs font-bold text-blue-700 leading-relaxed">
                  Admin responses are sent as 'Prepvio Support' to the student.
                </p>
              </div>
            </GlassCard>
          </div>
        </aside>
      </div>
    </div>
  );
}
