import React, { useState, useMemo, useEffect } from 'react';
import {
  Home,
  ChevronRight,
  Search,
  ArrowUpDown,
  Eye,
  FilePenLine,
  Trash2,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';

// --- Mock Data ---
const mockMembers = [
  { id: 1, name: 'Ari Satou', mobile: '123 4567 980', startDate: '2023/02/07', startTime: '09:15 PM', status: 'Active', plan: 'Gold' },
  { id: 2, name: 'Ashton Cox', mobile: '123 4567 980', startDate: '2023/02/07', startTime: '02:14 PM', status: 'Inactive', plan: 'Addon' },
  { id: 3, name: 'Bradley Greer', mobile: '123 4567 980', startDate: '2023/01/22', startTime: '10:32 AM', status: 'Active', plan: 'Deluxe' },
  { id: 4, name: 'Bredie Williamson', mobile: '123 4567 980', startDate: '2023/02/07', startTime: '09:15 PM', status: 'Active', plan: 'Gold' },
  { id: 5, name: 'Ari Satou', mobile: '123 4567 980', startDate: '2023/02/07', startTime: '09:15 PM', status: 'Active', plan: 'Gold' },
  { id: 6, name: 'Ashton Cox', mobile: '123 4567 980', startDate: '2023/02/07', startTime: '02:14 PM', status: 'Inactive', plan: 'Addon' },
  { id: 7, name: 'Bradley Greer', mobile: '123 4567 980', startDate: '2023/01/22', startTime: '10:32 AM', status: 'Active', plan: 'Deluxe' },
  { id: 8, name: 'Bredie Williamson', mobile: '123 4567 980', startDate: '2023/02/07', startTime: '09:15 PM', status: 'Active', plan: 'Gold' },
  { id: 9, name: 'Ari Satou', mobile: '123 4567 980', startDate: '2023/02/07', startTime: '09:15 PM', status: 'Active', plan: 'Gold' },
  { id: 10, name: 'Ashton Cox', mobile: '123 4567 980', startDate: '2023/02/07', startTime: '02:14 PM', status: 'Inactive', plan: 'Addon' },
  { id: 11, name: 'Caesar Vance', mobile: '456 7890 123', startDate: '2023/03/10', startTime: '08:00 AM', status: 'Active', plan: 'Gold' },
  { id: 12, name: 'Doris Wilder', mobile: '789 0123 456', startDate: '2023/03/11', startTime: '04:30 PM', status: 'Inactive', plan: 'Deluxe' },
];

// --- Reusable Components ---

/**
 * Renders the breadcrumbs navigation
 */
const Breadcrumbs = () => (
  <nav className="flex items-center text-sm text-slate-600 mb-4">
    <a href="#" className="flex items-center hover:text-blue-600 transition-colors">
      <Home className="w-4 h-4 mr-2" />
      Home
    </a>
    <ChevronRight className="w-4 h-4 mx-2" />
    <a href="#" className="hover:text-blue-600 transition-colors">
      Membership
    </a>
    <ChevronRight className="w-4 h-4 mx-2" />
    <span className="text-slate-800 font-medium">Membership list</span>
  </nav>
);

/**
 * Renders a status pill (e.g., Active, Inactive)
 */
const StatusPill = ({ status }) => {
  const isActive = status === 'Active';
  const colorClasses = isActive
    ? 'bg-green-100 text-green-700 border border-green-200'
    : 'bg-slate-200 text-slate-700 border border-slate-300';

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClasses}`}>
      {status}
    </span>
  );
};

/**
 * Renders a plan pill (e.g., Gold, Addon, Deluxe)
 */
const PlanPill = ({ plan }) => {
  const colors = {
    Gold: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border border-orange-200',
    Addon: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200',
    Deluxe: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200',
  };
  const colorClasses = colors[plan] || 'bg-slate-100 text-slate-700 border border-slate-200';

  return (
    <span className={`px-3 py-1 rounded-md text-xs font-medium ${colorClasses}`}>
      {plan}
    </span>
  );
};

/**
 * Renders the table header cell
 */
const TableHeader = ({ children }) => (
  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
    <span className="flex items-center justify-between">
      {children}
      <ArrowUpDown className="w-4 h-4 ml-2 text-slate-400" />
    </span>
  </th>
);

/**
 * Renders the pagination component
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex items-center space-x-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Previous
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            currentPage === page
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Next
      </button>
    </nav>
  );
};

// --- Main Membership Page Component ---

const ListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Memoize filtered members
  const filteredMembers = useMemo(() => {
    return mockMembers.filter((member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.mobile.includes(searchTerm) ||
      member.plan.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Reset to page 1 when search or entries per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, entriesPerPage]);

  // Memoize paginated members
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return filteredMembers.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredMembers, currentPage, entriesPerPage]);

  const totalEntries = filteredMembers.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startEntry = (currentPage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(currentPage * entriesPerPage, totalEntries);

  return (
    <div className="bg-gradient-to-br from-orange-50 via-rose-50 to-slate-100 min-h-screen p-8 font-inter">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
          Membership List
        </h1>

        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-lg border border-white/50">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Membership list</h2>
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-700">Show</span>
                <div className="relative">
                  <select
                    value={entriesPerPage}
                    onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                    className="appearance-none rounded-md border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <span className="text-sm text-slate-700">entries per page</span>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-64 pl-10 pr-4 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* --- Table --- */}
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <tr>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Mobile</TableHeader>
                    <TableHeader>Start Date</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Plan</TableHeader>
                    <TableHeader>Action</TableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-100"
                              src={`https://placehold.co/40x40/E0E7FF/6366F1?text=${member.name.charAt(0)}`}
                              alt={member.name}
                              onError={(e) => e.target.src = `https://placehold.co/40x40/E0E7FF/6366F1?text=${member.name.charAt(0)}`}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{member.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-700">{member.mobile}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{member.startDate}</div>
                        <div className="text-sm text-slate-500">{member.startTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusPill status={member.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PlanPill plan={member.plan} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button className="text-slate-500 hover:text-blue-600 transition-colors" title="View">
                            <Eye className="w-5 h-5" />
                          </button>
                          <button className="text-slate-500 hover:text-green-600 transition-colors" title="Edit">
                            <FilePenLine className="w-5 h-5" />
                          </button>
                          <button className="text-slate-500 hover:text-red-600 transition-colors" title="Delete">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- Table Footer (Pagination) --- */}
          <div className="px-6 py-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="text-sm text-slate-700 mb-4 md:mb-0">
              Showing {totalEntries > 0 ? startEntry : 0} to {endEntry} of {totalEntries} entries
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListPage;