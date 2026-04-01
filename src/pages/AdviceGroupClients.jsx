import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { formatDate, formatRelativeDate } from '../utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, CheckCircle, Clock, MoreHorizontal, Eye, Edit2, Trash2, Home, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRole } from '../components/RoleContext';

export default function AdviceGroupClients() {
  const navigate = useNavigate();
  const { switchedToId } = useRole();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [adviceGroup, setAdviceGroup] = useState(null);
  const [advisersList, setAdvisersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [adviserFilter, setAdviserFilter] = useState('all');
  const [factFindFilter, setFactFindFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadData();
  }, [switchedToId]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const groupId = switchedToId || currentUser.advice_group_id;
      if (groupId) {
        const groups = await base44.entities.AdviceGroup.list();
        const group = groups.find(g => g.id === groupId);
        if (group) setAdviceGroup(group);

        const [data, adviserList] = await Promise.all([
          base44.entities.Client.filter({
            advice_group_id: groupId
          }, '-created_date'),
          base44.entities.Adviser.filter({
            advice_group_id: groupId
          })
        ]);
        setClients(data);
        setAdvisersList(adviserList);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (index) => {
    const colors = ['bg-blue-600', 'bg-green-600', 'bg-orange-600', 'bg-purple-600', 'bg-pink-600', 'bg-cyan-600', 'bg-red-600', 'bg-amber-600'];
    return colors[index % colors.length];
  };

  const getFactFindBadge = (status) => {
    const badges = {
      complete: { label: 'Complete', className: 'bg-green-100 text-green-700' },
      in_progress: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
      sent: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
      not_started: { label: 'Not Started', className: 'bg-slate-100 text-slate-500' }
    };
    return badges[status] || badges.not_started;
  };

  // Build adviser lookup map
  const adviserMap = useMemo(() => {
    const map = {};
    advisersList.forEach(a => {
      if (a.id) map[a.id] = a;
      if (a.email) map[a.email] = a;
    });
    return map;
  }, [advisersList]);

  const filteredClients = useMemo(() => {
    let result = clients.filter(client => {
      const matchesSearch = client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAdviser = adviserFilter === 'all' || client.adviser_email === adviserFilter;
      const matchesFactFind = factFindFilter === 'all' ||
        (factFindFilter === 'complete' && client.fact_find === 'complete') ||
        (factFindFilter === 'pending' && (client.fact_find === 'in_progress' || client.fact_find === 'sent')) ||
        (factFindFilter === 'not_started' && client.fact_find === 'not_started');
      return matchesSearch && matchesAdviser && matchesFactFind;
    });

    if (sortBy === 'name') {
      result = [...result].sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
    } else if (sortBy === 'soa_count') {
      result = [...result].sort((a, b) => (b.soas || 0) - (a.soas || 0));
    }

    return result;
  }, [clients, searchTerm, adviserFilter, factFindFilter, sortBy]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // KPI stats
  const ffComplete = clients.filter(c => c.fact_find === 'complete').length;
  const ffPending = clients.filter(c => c.fact_find === 'in_progress' || c.fact_find === 'sent').length;
  const activeSOAs = clients.reduce((sum, c) => sum + (c.soas || 0), 0);

  if (loading) {
    return (
      <div className="py-6 px-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="py-6 px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Home className="w-4 h-4 text-slate-400" />
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-800">Clients</span>
        <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">{clients.length}</span>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500"></div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-teal-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{clients.length}</div>
          <div className="text-sm text-slate-500">Total clients</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{ffComplete}</div>
          <div className="text-sm text-slate-500">Fact finds complete</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{ffPending}</div>
          <div className="text-sm text-slate-500">Fact finds pending</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{activeSOAs}</div>
          <div className="text-sm text-slate-500">Active SOAs</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 mb-6">
        <div className="p-6 flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search clients by name or email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 h-11 border-slate-200"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Adviser</span>
            <Select value={adviserFilter} onValueChange={(v) => { setAdviserFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px] h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Advisers</SelectItem>
                {advisersList.map(a => (
                  <SelectItem key={a.id} value={a.email}>{a.first_name} {a.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Fact Find</span>
            <Select value={factFindFilter} onValueChange={(v) => { setFactFindFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px] h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sort by</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="soa_count">SOA Count</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto text-sm text-slate-500 whitespace-nowrap pb-2">
            {filteredClients.length} result{filteredClients.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '2fr' }} />
              <col style={{ width: '1.5fr' }} />
              <col style={{ width: '1fr' }} />
              <col style={{ width: '1fr' }} />
              <col style={{ width: '1fr' }} />
              <col style={{ width: '1fr' }} />
            </colgroup>
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Adviser</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Fact Find</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">SOAs</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Added</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.length > 0 ? paginatedClients.map((client, idx) => {
                const factFindBadge = getFactFindBadge(client.fact_find);
                const adviser = adviserMap[client.adviser_id] || adviserMap[client.adviser_email] || null;
                const adviserName = adviser ? `${adviser.first_name || ''} ${adviser.last_name || ''}`.trim() : null;
                const adviserInitials = adviserName ? adviserName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
                const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                return (
                  <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    {/* CLIENT */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex-shrink-0 ${getColorClass(globalIdx)} flex items-center justify-center text-white font-bold`}
                          style={{ width: 28, height: 28, borderRadius: 8, fontSize: 11 }}
                        >
                          {client.first_name?.charAt(0)}{client.last_name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-slate-800 truncate" style={{ fontWeight: 500 }}>{client.first_name} {client.last_name}</div>
                          <div className="text-slate-400 truncate" style={{ fontSize: 10 }}>{client.email}</div>
                        </div>
                      </div>
                    </td>
                    {/* ADVISER */}
                    <td className="px-6 py-4">
                      {adviser ? (
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex-shrink-0 ${getColorClass(globalIdx + 3)} flex items-center justify-center text-white font-bold`}
                            style={{ width: 22, height: 22, borderRadius: '50%', fontSize: 9 }}
                          >
                            {adviserInitials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">{adviserName}</div>
                            <div className="text-slate-400" style={{ fontSize: 10 }}>Adviser</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Unassigned</span>
                      )}
                    </td>
                    {/* FACT FIND */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${factFindBadge.className}`}>
                        {factFindBadge.label}
                      </span>
                    </td>
                    {/* SOAs */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-800">{client.soas || 0} total</span>
                    </td>
                    {/* ADDED */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-500" style={{ fontSize: 11 }}>{formatDate(client.created_date)}</span>
                        <span className="text-slate-400" style={{ fontSize: 10 }}>{formatRelativeDate(client.created_date)}</span>
                      </div>
                    </td>
                    {/* ACTIONS */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(createPageUrl('ClientDashboard') + `?id=${client.id}`)}
                          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                        >
                          View
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Fact Find
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    No clients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Showing {filteredClients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} clients
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
            {totalPages > 5 && <span className="text-slate-400">…</span>}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
