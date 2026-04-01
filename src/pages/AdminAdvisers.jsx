import React, { useState, useEffect } from 'react';
import axiosInstance from '@/api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { formatDate, formatRelativeDate } from '../utils/dateUtils';
import { Input } from '@/components/ui/input';
import { Search, Users, CheckCircle, Clock, Building2, MoreHorizontal, Edit, Trash2, Mail, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRole } from '../components/RoleContext';
import { toast } from 'sonner';

// Safely extract a displayable string from any value (guards against React Error #31)
const safeStr = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (val.name) return safeStr(val.name);
    if (val.value) return safeStr(val.value);
    if (val.firstName || val.lastName) return `${safeStr(val.firstName)} ${safeStr(val.lastName)}`.trim();
    return JSON.stringify(val);
  }
  return String(val);
};

export default function AdminAdvisers() {
  const navigate = useNavigate();
  const { switchRole } = useRole();
  const [advisers, setAdvisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [sortBy, setSortBy] = useState('activity');
  const [currentPage, setCurrentPage] = useState(1);
  const [adviceGroups, setAdviceGroups] = useState([]);
  const itemsPerPage = 7;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [adviserRes, groupsRes] = await Promise.all([
        axiosInstance.get('/advisers'),
        axiosInstance.get('/tenants')
      ]);

      const adviserData = adviserRes.data.items || adviserRes.data;
      const groupsData = groupsRes.data.items || groupsRes.data;

      // Map adviser data to include full_name (safely handle object values)
      const mappedAdvisers = adviserData.map(a => ({
        ...a,
        full_name: `${safeStr(a.firstName)} ${safeStr(a.lastName)}`.trim()
      }));

      setAdvisers(mappedAdvisers);
      setAdviceGroups(groupsData);
    } catch (error) {
      console.error('Failed to load advisers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWelcomeEmail = async (adviser) => {
    try {
      await axiosInstance.post(`/advisers/${adviser.id}/send-welcome-email`);
      toast.success('Welcome email sent successfully');
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      toast.error('Failed to send welcome email');
    }
  };

  const handleViewAsAdviser = (adviser) => {
    // Push advice group level first if adviser belongs to one
    const group = adviceGroups.find(g => g.id === adviser.tenantId);
    if (group) {
      switchRole('advice_group', group.id, safeStr(group.name));
    }
    switchRole('adviser', adviser.email, safeStr(adviser.full_name) || safeStr(adviser.email));
    navigate(createPageUrl('AdviserDashboard'));
  };

  const getAdviserStatus = (adviser) => {
    if (adviser.status === 'pending' || (!adviser.firstName && !adviser.lastName)) {
      return 'pending';
    }
    if (adviser.status === 'active') return 'active';
    return 'inactive';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return { label: 'Active', class: 'bg-green-100 text-green-700' };
      case 'pending':
        return { label: 'Pending', class: 'bg-amber-100 text-amber-700' };
      default:
        return { label: 'Inactive', class: 'bg-gray-100 text-gray-600' };
    }
  };

  const filteredAdvisers = advisers.filter(adviser => {
    const matchesSearch =
      adviser.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adviser.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      safeStr(adviser.company)?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter !== 'all') {
      const status = getAdviserStatus(adviser);
      if (status !== statusFilter) return false;
    }

    if (groupFilter !== 'all') {
      if (adviser.tenantId !== groupFilter) return false;
    }

    return true;
  });

  const sortedAdvisers = [...filteredAdvisers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.full_name || '').localeCompare(b.full_name || '');
      case 'joined':
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      default: // activity
        return new Date(b.lastActiveAt || b.createdAt || 0) - new Date(a.lastActiveAt || a.createdAt || 0);
    }
  });

  const paginatedAdvisers = sortedAdvisers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedAdvisers.length / itemsPerPage);

  const getColorClass = (index) => {
    const colors = [
      'bg-blue-600',
      'bg-orange-600',
      'bg-pink-600',
      'bg-purple-600',
      'bg-green-600',
      'bg-cyan-600',
      'bg-teal-600',
      'bg-indigo-600'
    ];
    return colors[index % colors.length];
  };

  // KPI counts
  const activeCount = advisers.filter(a => getAdviserStatus(a) === 'active').length;
  const pendingCount = advisers.filter(a => getAdviserStatus(a) === 'pending').length;
  const groupsWithAdvisers = new Set(advisers.map(a => a.tenantId).filter(Boolean)).size;

  return (
    <div className="p-8">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500" />
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-teal-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{advisers.length}</div>
          <div className="text-sm text-slate-600">Total Advisers</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{activeCount}</div>
          <div className="text-sm text-slate-600">Active Advisers</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{pendingCount}</div>
          <div className="text-sm text-slate-600">Pending</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{groupsWithAdvisers}</div>
          <div className="text-sm text-slate-600">Advice Groups</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 mb-6">
        <div className="p-6 flex items-end gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search advisers or companies..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 h-11 border-slate-200"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</span>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Group</span>
            <select value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setCurrentPage(1); }} className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <option value="all">All Groups</option>
              {adviceGroups.map(g => (
                <option key={g.id} value={g.id}>{safeStr(g.name)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sort by</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <option value="activity">Activity</option>
              <option value="name">Name</option>
              <option value="joined">Date Joined</option>
            </select>
          </div>
          <div className="flex items-center h-11 px-3 text-sm text-slate-500">
            {sortedAdvisers.length} result{sortedAdvisers.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '2fr' }} />
              <col style={{ width: '1.2fr' }} />
              <col style={{ width: '1fr' }} />
              <col style={{ width: '1fr' }} />
              <col style={{ width: '1fr' }} />
              <col style={{ width: '1fr' }} />
            </colgroup>
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Adviser
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Company
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Group
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Joined
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedAdvisers.length > 0 ? paginatedAdvisers.map((adviser, idx) => {
                const status = getAdviserStatus(adviser);
                const badge = getStatusBadge(status);
                const group = adviceGroups.find(g => g.id === adviser.tenantId);
                return (
                  <tr key={adviser.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg ${getColorClass(idx)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                          {adviser.full_name?.charAt(0) || adviser.email?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-slate-800 truncate" style={{ fontWeight: 500 }}>{safeStr(adviser.full_name) || safeStr(adviser.email)}</div>
                          <div className="text-slate-500 truncate" style={{ fontSize: '10px' }}>{safeStr(adviser.email)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500">{safeStr(adviser.company) || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500">{safeStr(group?.name) || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${badge.class}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">
                          {formatDate(adviser.createdAt)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatRelativeDate(adviser.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(createPageUrl(`AdviserProfile?id=${adviser.id}`))}
                          className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleViewAsAdviser(adviser)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                        >
                          View As
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleSendWelcomeEmail(adviser)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Welcome Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Adviser
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Adviser
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-600">
                    No advisers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-600">Showing {sortedAdvisers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, sortedAdvisers.length)} of {sortedAdvisers.length} advisers</span>
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
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50">
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
