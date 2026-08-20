import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Globe,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MAIN_API_URL } from '../../config/api';

const TicketList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);


  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await axios.get(`${MAIN_API_URL}/tickets/admin/all`, { withCredentials: true });
        if (response.data.success) {
          // Map backend data to frontend structure if necessary, or use as is
          setTickets(response.data.tickets.map(t => ({
            ...t,
            lastUpdated: new Date(t.lastUpdated).toLocaleString(), // Format date
            source: 'Website', // Default source as it's not in backend yet
            comments: 0 // Backend doesn't send comment count yet, defaulting to 0
          })));
        }
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'Replied': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'Closed': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getSourceIcon = (source) => {
    if (source === 'Gmail') return <Mail className="w-4 h-4 text-rose-500" />;
    return <Globe className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <MessageSquare className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Helpdesk Tickets</h1>
              <p className="text-slate-500 font-bold mt-1">Manage and track support requests</p>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-all text-slate-700 font-bold shadow-sm">
              <Filter className="w-5 h-5" /> Filter
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="overflow-hidden bg-white">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Loading tickets...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Updated</th>
                      <th className="px-6 py-6 text-right text-xs font-black text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-50/80 transition-all cursor-pointer group" onClick={() => navigate(`/support/tickets/details?ticketId=${ticket.id}`)}>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              {ticket.user.avatar}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{ticket.user.name}</div>
                              <div className="text-slate-400 text-xs font-semibold">{ticket.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                            {getSourceIcon(ticket.source)}
                            {ticket.source}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm text-slate-800 font-bold truncate max-w-xs">{ticket.subject}</div>
                          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${ticket.priority === 'High' ? 'bg-rose-500' : ticket.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                            {ticket.priority} Priority
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`px-4 py-1.5 inline-flex text-xs leading-5 font-black rounded-lg uppercase tracking-wide ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-slate-500">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" /> {ticket.lastUpdated}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-slate-400 hover:text-indigo-600 p-2 rounded-xl hover:bg-indigo-50 transition-all">
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketList;
