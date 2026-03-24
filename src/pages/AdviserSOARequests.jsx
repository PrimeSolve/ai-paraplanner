import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

import { Input } from '@/components/ui/input';
import { Search, MoreHorizontal, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { formatDate } from '../utils/dateUtils';
import NewSOARequestModal from '../components/adviser/NewSOARequestModal.jsx';

// TODO: ensure backend StatusEnum matches these values
const SOA_STATUSES = [
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Pending', label: 'Pending' },
  { value: 'UnderReview', label: 'Under Review' },
  { value: 'Complete', label: 'Complete' },
];

const STATUS_COLOURS = {
  'Submitted': { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  'Pending': { bg: '#fef3c7', color: '#b45309', dot: '#f59e0b' },
  'UnderReview': { bg: '#f3e8ff', color: '#7e22ce', dot: '#a855f7' },
  'Complete': { bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
};

const PRIORITY_OPTIONS = ['High', 'Normal', 'Urgent'];

const AVATAR_PALETTE = [
  '#2563eb', '#16a34a', '#ea580c', '#a855f7', '#ec4899',
  '#06b6d4', '#dc2626', '#b45309', '#0891b2', '#7c3aed',
  '#059669', '#d97706', '#e11d48', '#4f46e5', '#0d9488',
  '#be123c', '#c026d3', '#65a30d', '#0284c7', '#9333ea',
  '#db2777', '#ca8a04', '#14b8a6', '#6366f1', '#f97316', '#84cc16',
];

function getAvatarColor(name) {
  if (!name) return AVATAR_PALETTE[0];
  const code = name.charCodeAt(0);
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
}

function isOverdue(req) {
  if (req.status === 'Complete') return false;
  if (!req.due_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(req.due_date);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

/* ─── Inline styles (matching TasksPage pattern) ─── */
const s = {
  viewToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  viewBtn: (active) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    background: active ? '#fff' : 'transparent',
    color: active ? '#0F172A' : '#64748B',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
    transition: 'all 0.15s',
    fontFamily: "'DM Sans', sans-serif",
  }),
};

export default function AdviserSOARequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const itemsPerPage = 8;
  const debounceRef = useRef(null);

  // FIX 5: Debounce search 200ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm]);

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
            let clientData = null;
            if (req.client_id) {
              const clients = await base44.entities.Client.filter({ id: req.client_id });
              clientData = clients[0];
            }
            if (!clientData && req.client_email) {
              const clients = await base44.entities.Client.filter({ email: req.client_email });
              clientData = clients[0];
            }
            const clientName = clientData
              ? `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() || req.client_email || 'Client'
              : req.client_email || 'Client';
            return { ...req, client_name: clientName };
          } catch (err) {
            console.error(`Failed to load client for SOA ${req.id}:`, err);
            return { ...req, client_name: req.client_email || 'Client' };
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

  // FIX 1: New status colours
  const getStatusColor = (status) => {
    return STATUS_COLOURS[status] || STATUS_COLOURS['Submitted'];
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'High': { bg: '#fee2e2', color: '#dc2626', label: 'High' },
      'Normal': { bg: '#fef3c7', color: '#d97706', label: 'Normal' },
      'Urgent': { bg: '#fce7f3', color: '#be185d', label: 'Urgent' },
    };
    return colors[priority] || colors['Normal'];
  };

  // FIX 6: Filters work together on both views
  const filteredRequests = requests.filter(req => {
    const matchesSearch = !debouncedSearch || req.client_name?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // FIX 2: Stats wired to real data with new status values
  const stats = {
    total: requests.length,
    ready: requests.filter(r => r.status === 'Pending').length,
    inProgress: requests.filter(r => r.status === 'UnderReview').length,
    complete: requests.filter(r => r.status === 'Complete').length,
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
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{stats.ready}</div>
          <div className="text-sm text-slate-600">Ready to Review</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-purple-600" />
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

      {/* View Toggle + Filters */}
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
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <option value="all">All Statuses</option>
              {SOA_STATUSES.map(st => (
                <option key={st.value} value={st.value}>{st.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Priority</span>
            <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }} className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <option value="all">All Priorities</option>
              {PRIORITY_OPTIONS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          {/* FIX 4: List / Board toggle */}
          <div style={s.viewToggle}>
            <button style={s.viewBtn(viewMode === 'list')} onClick={() => setViewMode('list')}>
              ☰ List
            </button>
            <button style={s.viewBtn(viewMode === 'board')} onClick={() => setViewMode('board')}>
              ⊞ Board
            </button>
          </div>
        </div>
      </div>

      {/* ─── List View ─── */}
      {viewMode === 'list' && (
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
                {paginatedRequests.length > 0 ? paginatedRequests.map((req) => {
                  const statusColor = getStatusColor(req.status);
                  const priorityColor = getPriorityColor(req.priority || 'Normal');
                  const avatarBg = getAvatarColor(req.client_name);
                  const overdue = isOverdue(req);
                  return (
                    <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: avatarBg }}>
                            {req.client_name?.charAt(0) || 'C'}
                          </div>
                          <span className="font-semibold text-sm text-slate-800">{req.client_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-800 font-medium">{req.type || 'Comprehensive'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold" style={{ background: statusColor.bg, color: statusColor.color }}>
                          {SOA_STATUSES.find(st => st.value === req.status)?.label || req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold" style={{ background: priorityColor.bg, color: priorityColor.color }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: priorityColor.color }}></span>
                          {priorityColor.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-800">
                          {formatDate(req.submitted_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-slate-800'}`}>
                          {formatDate(req.due_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <AdviserViewButton soaRequestId={req.id} />
                          {req.status === 'Complete' && (
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
                      {debouncedSearch || statusFilter !== 'all' || priorityFilter !== 'all'
                        ? 'No requests match your search'
                        : 'No requests found'}
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
      )}

      {/* ─── Board View ─── */}
      {/* TODO: implement drag-to-update-status when confirmed with product */}
      {viewMode === 'board' && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {SOA_STATUSES.map((statusObj) => {
            const colRequests = filteredRequests.filter((r) => r.status === statusObj.value);
            const colColour = STATUS_COLOURS[statusObj.value]?.dot || '#94A3B8';

            return (
              <div
                key={statusObj.value}
                style={{
                  flex: 1,
                  minWidth: 260,
                  background: '#F1F5F9',
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 4px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: colColour, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{statusObj.label}</span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 22,
                    height: 22,
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    background: '#E2E8F0',
                    color: '#475569',
                    padding: '0 6px',
                  }}>
                    {colRequests.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 60 }}>
                  {colRequests.length === 0 ? (
                    <div style={{
                      border: '2px dashed #CBD5E1',
                      borderRadius: 10,
                      padding: '24px 12px',
                      textAlign: 'center',
                      color: '#94A3B8',
                      fontSize: 13,
                    }}>
                      No requests
                    </div>
                  ) : (
                    colRequests.map((req) => {
                      const priorityColor = getPriorityColor(req.priority || 'Normal');
                      const avatarBg = getAvatarColor(req.client_name);
                      const overdue = isOverdue(req);

                      return (
                        <div
                          key={req.id}
                          style={{
                            background: '#fff',
                            border: '1px solid #E2E8F0',
                            borderLeft: `3px solid ${colColour}`,
                            borderRadius: 10,
                            padding: '12px 14px',
                            cursor: 'default',
                          }}
                        >
                          {/* Client name */}
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>
                            {req.client_name}
                          </div>
                          {/* Type */}
                          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>
                            {req.type || 'Comprehensive'}
                          </div>
                          {/* Priority badge */}
                          <div style={{ marginBottom: 8 }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: priorityColor.bg,
                              color: priorityColor.color,
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColor.color }} />
                              {priorityColor.label}
                            </span>
                          </div>
                          {/* Footer: avatar + due date */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              background: avatarBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 700,
                            }}>
                              {req.client_name?.charAt(0) || 'C'}
                            </div>
                            <span style={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: overdue ? '#DC2626' : '#64748B',
                            }}>
                              {formatDate(req.due_date)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No results message for board view */}
      {viewMode === 'board' && filteredRequests.length === 0 && (debouncedSearch || statusFilter !== 'all' || priorityFilter !== 'all') && (
        <div className="text-center py-8 text-slate-600">
          No requests match your search
        </div>
      )}

      <NewSOARequestModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={loadRequests}
        adviserEmail={user?.email}
      />
    </div>
  );
}

function AdviserViewButton({ soaRequestId }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    setChecking(true);
    try {
      const docs = await base44.entities.SoaDocument.filter({ soa_request_id: soaRequestId });
      if (docs.length > 0) {
        navigate(`/SOABuilder?id=${docs[0].id}`);
      } else {
        navigate(`/SOARequestWelcome?id=${soaRequestId}`);
      }
    } catch {
      navigate(`/SOARequestWelcome?id=${soaRequestId}`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={checking}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
    >
      {checking ? <Loader2 className="animate-spin w-4 h-4 inline" /> : 'View'}
    </button>
  );
}
