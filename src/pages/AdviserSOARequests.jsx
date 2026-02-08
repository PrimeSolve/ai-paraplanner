import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

import { Input } from '@/components/ui/input';
import { Search, MoreHorizontal, CheckCircle2, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import NewSOARequestModal from '../components/adviser/NewSOARequestModal.jsx';

export default function AdviserSOARequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewModal, setShowNewModal] = useState(false);
  const itemsPerPage = 8;

  useEffect(() => {
    loadRequests();

    // Listen for custom event from header button
    const handleOpenDialog = () => setShowNewModal(true);
    window.addEventListener('openAddSOAQueueDialog', handleOpenDialog);
    return () => window.removeEventListener('openAddSOAQueueDialog', handleOpenDialog);
  }, []);

  const loadRequests = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.SOARequest.filter({
        created_by: currentUser.email
      }, '-created_date');
      
      // Load client names for each SOA Request
      const requestsWithClientNames = await Promise.all(
        data.map(async (req) => {
          try {
            const client = await base44.entities.Client.filter({ id: req.client_id });
            const clientData = client[0];
            const clientName = clientData 
              ? `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() 
              : 'Unknown Client';
            return { ...req, client_name: clientName };
          } catch (err) {
            console.error(`Failed to load client for SOA ${req.id}:`, err);
            return { ...req, client_name: 'Unknown Client' };
          }
        })
      );
      
      setRequests(requestsWithClientNames);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': { bg: '#f1f5f9', color: '#64748b', label: 'Draft' },
      'in_progress': { bg: '#e0e7ff', color: '#4f46e5', label: 'In Progress' },
      'submitted': { bg: '#dcfce7', color: '#16a34a', label: 'Complete' },
      'completed': { bg: '#dcfce7', color: '#16a34a', label: 'Complete' }
    };
    return colors[status] || colors.draft;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': { bg: '#fee2e2', color: '#dc2626', icon: '⬤', label: 'High' },
      'normal': { bg: '#fef3c7', color: '#d97706', icon: '⬤', label: 'Normal' },
      'low': { bg: '#dbeafe', color: '#0284c7', icon: '⬤', label: 'Low' }
    };
    return colors[priority] || colors.normal;
  };

  const getClientColor = (index) => {
    const colors = ['#2563eb', '#16a34a', '#ea580c', '#a855f7', '#ec4899', '#06b6d4', '#dc2626', '#b45309'];
    return colors[index % colors.length];
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: requests.length,
    ready: requests.filter(r => r.status === 'draft').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    submitted: requests.filter(r => r.status === 'submitted').length,
    complete: requests.filter(r => r.status === 'completed').length
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="py-6 px-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <div className="text-4xl font-bold mb-1">{stats.total}</div>
          <div className="text-sm opacity-90">Total Requests</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{stats.ready}</div>
          <div className="text-sm text-slate-600">Ready to Review</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{stats.inProgress}</div>
          <div className="text-sm text-slate-600">In Progress</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{stats.complete}</div>
          <div className="text-sm text-slate-600">Complete</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 mb-6">
        <div className="p-6 flex items-end gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-slate-200"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Priority</span>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Priority</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Submitted</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Due</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.length > 0 ? paginatedRequests.map((req, idx) => {
                const statusColor = getStatusColor(req.status);
                const priorityColor = getPriorityColor(req.priority || 'normal');
                return (
                  <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm`}>
                          {req.client_name?.charAt(0) || 'C'}
                        </div>
                        <span className="font-semibold text-sm text-slate-800">{req.client_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-800 font-medium">{req.type || 'Comprehensive'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold`} style={{ background: statusColor.bg, color: statusColor.color }}>
                        {statusColor.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold`} style={{ background: priorityColor.bg, color: priorityColor.color }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: priorityColor.color }}></span>
                        {priorityColor.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-800">
                        {req.submitted_date ? new Date(req.submitted_date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-medium ${req.status === 'completed' ? 'text-green-600' : 'text-red-600'}`}>
                        {req.completed_date ? new Date(req.completed_date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={createPageUrl(`SOARequestWelcome?id=${req.id}`)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                          View
                        </Link>
                        {req.status === 'completed' && (
                          <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                            Download
                          </button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-600">
                    No requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-600">Showing {filteredRequests.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} requests</span>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50">
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50">
              Next →
            </button>
          </div>
        </div>
       </div>
       <NewSOARequestModal
       isOpen={showNewModal}
       onClose={() => setShowNewModal(false)}
       onSuccess={loadRequests}
       adviserEmail={user?.email}
       />
       </div>
       );
       }