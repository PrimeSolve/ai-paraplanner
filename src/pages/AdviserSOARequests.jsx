import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

import { Input } from '@/components/ui/input';
import { Search, MoreHorizontal, CheckCircle2, Clock, Loader2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

const STATUS_BADGE_STYLES = {
  'Submitted': 'bg-blue-100 text-blue-700',
  'Pending': 'bg-amber-100 text-amber-700',
  'UnderReview': 'bg-purple-100 text-purple-700',
  'Complete': 'bg-green-100 text-green-700',
};

const STATUS_DOT_COLORS = {
  'Submitted': 'bg-blue-500',
  'Pending': 'bg-amber-500',
  'UnderReview': 'bg-purple-500',
  'Complete': 'bg-green-500',
};

const PRIORITY_OPTIONS = ['High', 'Normal', 'Urgent'];

// FIX 4: Client avatars always use blue; grey for unknown
function getAvatarClasses(clientName) {
  if (!clientName || clientName === 'Unknown Client') {
    return 'bg-gray-100 text-gray-500';
  }
  return 'bg-blue-100 text-blue-700';
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

      // TODO: confirm field names match API response
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
            // TODO: ensure clientName is returned in API response
            const clientName = clientData
              ? `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() || null
              : null;
            return { ...req, client_name: clientName };
          } catch (err) {
            console.error(`Failed to load client for SOA ${req.id}:`, err);
            return { ...req, client_name: null };
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

  const getPriorityStyle = (priority) => {
    const styles = {
      'High': { dotClass: 'bg-orange-500', badgeClass: 'bg-orange-100 text-orange-700', label: 'High' },
      'Normal': { dotClass: 'bg-amber-500', badgeClass: 'bg-amber-100 text-amber-700', label: 'Normal' },
      'Urgent': { dotClass: 'bg-red-500', badgeClass: 'bg-red-100 text-red-700', label: 'Urgent' },
    };
    return styles[priority] || styles['Normal'];
  };

  // FIX 6: Filters work together on both views
  const filteredRequests = requests.filter(req => {
    const searchTarget = req.client_name || req.client_email || '';
    const matchesSearch = !debouncedSearch || searchTarget.toLowerCase().includes(debouncedSearch.toLowerCase());
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
      <div className="py-6 px-8">
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        {/* Skeleton filter bar */}
        <Skeleton className="h-20 rounded-2xl mb-6" />
        {/* Skeleton table rows */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <div className="text-4xl font-bold mb-1">{stats.total}</div>
          <div className="text-sm opacity-90">Total Requests</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{stats.ready}</div>
          <div className="text-sm text-slate-600">Ready to Review</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{stats.inProgress}</div>
          <div className="text-sm text-slate-600">In Progress</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
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
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Client</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Priority</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Submitted</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Due</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.length > 0 ? paginatedRequests.map((req) => {
                  const priorityStyle = getPriorityStyle(req.priority || 'Normal');
                  const overdue = isOverdue(req);
                  // TODO: ensure clientName is returned in API response
                  const displayName = req.client_name || 'Unknown Client';
                  return (
                    <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors duration-100">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${getAvatarClasses(displayName)}`}>
                            {displayName.charAt(0)}
                          </div>
                          <span className="font-semibold text-sm text-slate-800">{displayName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-800 font-medium">{req.type || 'Comprehensive'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`border-0 ${STATUS_BADGE_STYLES[req.status] || STATUS_BADGE_STYLES['Submitted']}`}>
                          {SOA_STATUSES.find(st => st.value === req.status)?.label || req.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`border-0 inline-flex items-center gap-1.5 ${priorityStyle.badgeClass}`}>
                          <span className={`w-2 h-2 rounded-full ${priorityStyle.dotClass}`}></span>
                          {priorityStyle.label}
                        </Badge>
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
                    <td colSpan="7" className="px-6 py-0">
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No SOA requests</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {debouncedSearch || statusFilter !== 'all' || priorityFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'New requests will appear here once submitted'}
                        </p>
                      </div>
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
      {/* TODO: implement drag-to-update-status when confirmed */}
      {viewMode === 'board' && (
        <div className="flex gap-4 items-start">
          {SOA_STATUSES.map((statusObj) => {
            const colRequests = filteredRequests.filter((r) => r.status === statusObj.value);
            const dotClass = STATUS_DOT_COLORS[statusObj.value] || 'bg-slate-400';

            return (
              <div key={statusObj.value} className="flex-1 min-w-[260px] bg-slate-100 rounded-xl p-3">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} />
                  <span className="text-sm font-bold text-slate-900">{statusObj.label}</span>
                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-xs font-semibold bg-slate-200 text-slate-600 px-1.5">
                    {colRequests.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col min-h-[60px]">
                  {colRequests.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
                      No requests
                    </div>
                  ) : (
                    colRequests.map((req) => {
                      const priorityStyle = getPriorityStyle(req.priority || 'Normal');
                      const overdue = isOverdue(req);
                      const displayName = req.client_name || 'Unknown Client';

                      return (
                        <div
                          key={req.id}
                          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-3 hover:shadow-md transition-shadow duration-150 cursor-pointer"
                        >
                          {/* Client name */}
                          <div className="text-sm font-bold text-slate-900 mb-1">
                            {displayName}
                          </div>
                          {/* Type */}
                          <div className="text-xs text-slate-500 mb-2">
                            {req.type || 'Comprehensive'}
                          </div>
                          {/* Priority badge */}
                          <div className="mb-2">
                            <Badge className={`border-0 text-xs inline-flex items-center gap-1 ${priorityStyle.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dotClass}`} />
                              {priorityStyle.label}
                            </Badge>
                          </div>
                          {/* Footer: avatar + due date */}
                          <div className="flex items-center justify-between">
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${getAvatarClasses(displayName)}`}>
                              {displayName.charAt(0)}
                            </div>
                            <span className={`text-xs font-medium ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
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

      {/* Empty state for board view when all filtered out */}
      {viewMode === 'board' && filteredRequests.length === 0 && requests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700">No SOA requests</p>
          <p className="text-xs text-gray-400 mt-1">New requests will appear here once submitted</p>
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
