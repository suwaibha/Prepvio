import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, Search, Plus, Calendar, MoreHorizontal } from 'lucide-react';
import axios from 'axios';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await axios.get('/api/revenue/invoices');
                if (response.data.success) {
                    setInvoices(response.data.invoices);
                }
            } catch (error) {
                console.error("Failed to fetch invoices", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, []);

    const filteredInvoices = invoices.filter(invoice =>
        invoice.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <FileText className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Invoices</h1>
                            <p className="text-slate-500 font-bold mt-1">Manage billing and payment history</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-6 items-center justify-between bg-white">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search invoices by ID or user..."
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600/20 transition-all font-bold text-slate-600 placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50">
                                    <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Invoice ID</th>
                                    <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                    <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                    <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="6" className="px-8 py-6 text-center font-bold text-slate-400">Loading invoices...</td></tr>
                                ) : filteredInvoices.length === 0 ? (
                                    <tr><td colSpan="6" className="px-8 py-6 text-center font-bold text-slate-400">No invoices found</td></tr>
                                ) : (
                                    filteredInvoices.map((invoice, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg font-mono">
                                                    {invoice.invoiceId}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black uppercase">
                                                        {invoice.user?.name ? invoice.user.name[0] : 'U'}
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-black text-slate-700">{invoice.user?.name || "Unknown"}</span>
                                                        <span className="block text-xs font-bold text-slate-400">{invoice.user?.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-black text-slate-800">
                                                ₹{invoice.amount?.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-8 py-6 text-sm font-bold text-slate-500">
                                                {new Date(invoice.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full ${invoice.status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                                    invoice.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                                    }`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                                        <Download className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Invoices;