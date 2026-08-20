import React, { useState, useMemo } from 'react';
import {
  Home,
  ChevronRight,
  MessageSquare,
  ChevronDown,
  Search,
  Edit,
  Trash2,
  Plus,
  ArrowUpDown, // For sorting icons
  X // For closing the modal
} from 'lucide-react';
import DeleteConfirmationModal from '../../Components/DeleteConfirmationModal';

// --- Mock Data ---
const initialMockCustomers = [
  { id: 1, name: "Mark Jason", email: "mark@mark.com", account: "N/A", lastLogin: "January 01, 2019 at 03:35 PM" },
  { id: 2, name: "Alice Nicol", email: "mark@mark.com", account: "N/A", lastLogin: "January 01, 2019 at 03:35 PM" },
  { id: 3, name: "Harry Cook", email: "mark@mark.com", account: "N/A", lastLogin: "January 01, 2019 at 03:35 PM" },
  { id: 4, name: "Tom Hanry", email: "mark@mark.com", account: "N/A", lastLogin: "January 01, 2019 at 03:35 PM" },
  { id: 5, name: "Martin Frank", email: "mark@mark.com", account: "N/A", lastLogin: "January 01, 2019 at 03:35 PM" },
  { id: 6, name: "Endrew Khan", email: "mark@mark.com", account: "N/A", lastLogin: "January 01, 2019 at 03:35 PM" },
  { id: 7, name: "Christina Methewv", email: "mark@mark.com", account: "N/A", lastLogin: "January 01, 2019 at 03:35 PM" },
  { id: 8, name: "Jakson Pit", email: "mark@mark.com", account: "N/A", lastLogin: "January 01, 2019 at 03:35 PM" },
  { id: 9, name: "Nikolas Jons", email: "mark@mark.com", account: "N/A", lastLogin: "January 01, 2019 at 03:35 PM" },
  { id: 10, name: "Nik Cage", email: "mark@mark.com", account: "N/A", lastLogin: "January 01, 2019 at 03:35 PM" },
];

// --- Glass Card Component ---
const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 ${className}`}>
    {children}
  </div>
);

// --- Action Buttons ---
const ActionButtons = ({ onEdit, onDelete }) => (
  <div className="flex items-center gap-2 text-slate-500">
    <button
      onClick={onEdit}
      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
    >
      <Edit className="w-4 h-4" />
    </button>
    <button
      onClick={onDelete}
      className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

// --- Table Header Cell ---
const TableHeader = ({ children }) => (
  <th className="p-5 text-left text-xs font-black text-slate-400 uppercase tracking-wider">
    <div className="flex items-center gap-1 cursor-pointer hover:text-indigo-600 transition-colors group">
      {children}
      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 transition-colors" />
    </div>
  </th>
);

// --- Add Customer Modal ---
const AddCustomerModal = ({ isOpen, onClose, onAddCustomer }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [account, setAccount] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) {
      console.warn("Please fill in Name and Email.");
      return;
    }
    onAddCustomer({ name, email, account: account || 'N/A' });
    setName('');
    setEmail('');
    setAccount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <GlassCard className="w-full max-w-lg p-8 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-800">Add New Customer</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-black text-slate-700 uppercase tracking-wide mb-2">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700"
                placeholder="Ex. John Doe"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-black text-slate-700 uppercase tracking-wide mb-2">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700"
                placeholder="Ex. john@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="account" className="block text-sm font-black text-slate-700 uppercase tracking-wide mb-2">Account (Optional)</label>
              <input
                type="text"
                id="account"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700"
                placeholder="Ex. Enterprise"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all font-bold"
            >
              Add Customer
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};


// --- Main App Component ---
export default function CustomerList() {
  const [entries, setEntries] = useState(10);
  const [customers, setCustomers] = useState(initialMockCustomers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Delete Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const handleDelete = (customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCustomer = () => {
    if (!customerToDelete) return;
    setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
    setIsDeleteModalOpen(false);
    setCustomerToDelete(null);
  };

  const handleAddCustomer = (newCustomerData) => {
    const newCustomer = {
      ...newCustomerData,
      id: customers.length + 1,
      lastLogin: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).replace('at', 'at')
    };
    setCustomers(prevCustomers => [newCustomer, ...prevCustomers]);
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) {
      return customers;
    }
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const totalEntries = filteredCustomers.length;
  const paginatedCustomers = filteredCustomers.slice(0, entries);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Customers</h1>
            <p className="text-slate-500 font-bold mt-1">Manage your customer base</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-300 font-bold"
          >
            <Plus className="w-5 h-5" />
            <span>New Customer</span>
          </button>
        </div>

        <GlassCard className="p-8">
          {/* Card Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-6">
            {/* Entries per page */}
            <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
              <span>Show</span>
              <div className="relative">
                <select
                  value={entries}
                  onChange={(e) => setEntries(Number(e.target.value))}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <span>entries</span>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 placeholder:text-slate-400"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[900px]">
              {/* Table Header */}
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Account</TableHeader>
                  <TableHeader>Last Login</TableHeader>
                  <th className="p-5 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              {/* Table Body */}
              <tbody className="divide-y divide-slate-50 bg-white">
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 text-sm group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                          {customer.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700 text-sm">{customer.name}</span>
                      </div>
                    </td>
                    <td className="p-5 text-sm font-medium text-slate-600">{customer.email}</td>
                    <td className="p-5 text-sm font-medium text-slate-600">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold">{customer.account}</span>
                    </td>
                    <td className="p-5 text-sm font-medium text-slate-500">{customer.lastLogin}</td>
                    <td className="p-5">
                      <ActionButtons
                        onEdit={() => console.log('Edit', customer.id)}
                        onDelete={() => handleDelete(customer)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex justify-between items-center pt-6 mt-2">
            <p className="text-sm font-bold text-slate-500">
              Showing <span className="text-indigo-600">{Math.min(entries, paginatedCustomers.length)}</span> of <span className="text-indigo-600">{totalEntries}</span> entries
            </p>
          </div>

        </GlassCard>
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddCustomer={handleAddCustomer}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteCustomer}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${customerToDelete?.name || 'this customer'}"? This action cannot be undone.`}
        isLoading={false} // No loading state needed for local mock data deletion
      />
    </div>
  );
}