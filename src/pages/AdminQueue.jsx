import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Loader2, MoreHorizontal, Home, ChevronRight, UserX, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

// ── Design tokens ──────────────────────────────────────────────
const colors = {
  teal: '#00C9B1',
  blue: '#3b82f6',
  blueDeep: '#1d4ed8',
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
};

const avatarGradients = [
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #f97316, #ec4899)',
  'linear-gradient(135deg, #06b6d4, #0891b2)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ef4444, #dc2626)',
];

function letterIndex(letter) {
  return (letter || 'A').toUpperCase().charCodeAt(0) % avatarGradients.length;
}

// ── SLA Pulse keyframes (injected once) ────────────────────────
const SLA_STYLE_ID = 'ps-sla-pulse';
if (typeof document !== 'undefined' && !document.getElementById(SLA_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = SLA_STYLE_ID;
  style.textContent = `
    @keyframes slaPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: .55; transform: scale(1.35); }
    }
    .sla-pulse { animation: slaPulse 1.6s ease-in-out infinite; }
  `;
  document.head.appendChild(style);
}

// ── Helpers ────────────────────────────────────────────────────
function hoursElapsed(dateStr) {
  if (!dateStr) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(dateStr).getTime()) / 3600000));
}

function slaLevel(hours) {
  if (hours >= 48) return 'breach';
  if (hours >= 24) return 'warning';
  return 'ok';
}

function getStatusBadge(status) {
  const map = {
    Draft:      { label: 'Draft',        bg: '#f1f5f9', border: '#e2e8f0', color: '#64748b' },
    submitted:  { label: 'Draft',        bg: '#f1f5f9', border: '#e2e8f0', color: '#64748b' },
    in_progress:{ label: 'In Review',    bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
    InProgress: { label: 'In Review',    bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
    Review:     { label: 'Under Review', bg: '#f5f3ff', border: '#ddd6fe', color: '#7c3aed' },
    Approved:   { label: 'Approved',     bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a' },
    completed:  { label: 'Issued',       bg: '#ecfdf5', border: '#a7f3d0', color: '#059669' },
    Issued:     { label: 'Issued',       bg: '#ecfdf5', border: '#a7f3d0', color: '#059669' },
  };
  const s = map[status] || { label: status || 'Unknown', bg: '#f1f5f9', border: '#e2e8f0', color: '#64748b' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 8,
      fontSize: 11, fontWeight: 600, lineHeight: '16px',
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
      {s.label}
    </span>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

// ── Main Component ─────────────────────────────────────────────
export default function AdminQueue() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [slaBreachOnly, setSlaBreachOnly] = useState(false);
  const [queueData, setQueueData] = useState([]);
  const [adviceGroups, setAdviceGroups] = useState([]);
  const [advisers, setAdvisers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [stats, setStats] = useState({
    awaiting: 0,
    inProgress: 0,
    completedToday: 0,
    avgTurnaround: '—',
    slaBreach: 0,
    todayNew: 0,
    wowPct: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [soaRequests, clients, groups, adviserList] = await Promise.all([
          base44.entities.SOARequest.list('-created_date', 50),
          base44.entities.Client.list('-created_date', 200),
          base44.entities.AdviceGroup.list(),
          base44.entities.Adviser.list(),
        ]);

        setAdviceGroups(groups);
        setAdvisers(adviserList);

        // Build lookups
        const clientMap = {};
        clients.forEach(c => {
          clientMap[c.id] = c;
        });
        const groupMap = {};
        groups.forEach(g => { groupMap[g.id] = g; });
        const adviserMap = {};
        adviserList.forEach(a => { adviserMap[a.id] = a; });

        // Enrich SOA requests
        const enriched = soaRequests.map(soa => {
          const client = clientMap[soa.client_id] || {};
          const clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || soa.client_name || soa.client_email || 'Unknown Client';
          const adviser = adviserMap[soa.adviser_id] || adviserList.find(a => a.email === (soa.adviser_email || client.adviser_email)) || null;
          const group = adviser ? groupMap[adviser.advice_group_id] : (groupMap[soa.advice_group_id] || null);
          return {
            ...soa,
            resolved_client_name: clientName,
            client_email: client.email || soa.client_email || '',
            resolved_adviser: adviser ? `${adviser.first_name || ''} ${adviser.last_name || ''}`.trim() : '',
            resolved_group: group ? group.name : '',
            advice_group_id: adviser ? adviser.advice_group_id : soa.advice_group_id,
            hours: hoursElapsed(soa.submitted_date || soa.created_date),
          };
        });

        setQueueData(enriched);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const awaiting = soaRequests.filter(s => s.status === 'submitted').length;
        const inProgress = soaRequests.filter(s => s.status === 'in_progress').length;
        const completedToday = soaRequests.filter(s => {
          if (s.status !== 'completed' || !s.completed_date) return false;
          const d = new Date(s.completed_date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        }).length;

        const todayNew = soaRequests.filter(s => {
          const d = new Date(s.created_date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        }).length;

        const slaBreach = enriched.filter(s => s.hours >= 48 && s.status !== 'completed').length;

        setStats({ awaiting, inProgress, completedToday, slaBreach, todayNew, wowPct: 0, avgTurnaround: '—' });
      } catch (error) {
        console.error('Failed to load queue data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ── Filtering ────────────────────────────────────────────────
  const filteredData = queueData.filter(item => {
    const matchesSearch = !searchQuery ||
      (item.resolved_client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.client_email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || (item.type || '').toLowerCase() === typeFilter;
    const matchesGroup = groupFilter === 'all' || String(item.advice_group_id) === groupFilter;
    const matchesSla = !slaBreachOnly || item.hours >= 48;
    return matchesSearch && matchesStatus && matchesType && matchesGroup && matchesSla;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, typeFilter, groupFilter, slaBreachOnly]);

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="py-6 px-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="py-6 px-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Breadcrumb ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6">
        <Home className="w-4 h-4 text-slate-400" />
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-sm font-semibold text-slate-800">SOA Queue</span>
        <span style={{
          marginLeft: 8, padding: '2px 10px', borderRadius: 12,
          fontSize: 11, fontWeight: 700,
          background: colors.blue, color: '#fff',
        }}>
          {queueData.length} requests
        </span>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        {/* Awaiting Assignment */}
        <KPICard
          barColor={colors.teal}
          value={stats.awaiting}
          label="Awaiting Assignment"
          badge={`+${stats.todayNew} today`}
          badgeBg="#ecfdf5" badgeColor="#059669"
          icon={<UserX className="w-5 h-5" style={{ color: colors.teal }} />}
        />
        {/* In Progress */}
        <KPICard
          barColor={colors.blue}
          value={stats.inProgress}
          label="In Progress"
          badge="In progress"
          badgeBg="#eff6ff" badgeColor="#1d4ed8"
          icon={<Clock className="w-5 h-5" style={{ color: colors.blue }} />}
        />
        {/* Completed Today */}
        <KPICard
          barColor={colors.green}
          value={stats.completedToday}
          label="Completed Today"
          badge={`+${stats.wowPct}% WoW`}
          badgeBg="#ecfdf5" badgeColor="#059669"
          icon={<CheckCircle2 className="w-5 h-5" style={{ color: colors.green }} />}
        />
        {/* SLA Breaches */}
        <KPICard
          barColor={colors.red}
          value={stats.slaBreach}
          label="SLA Breaches"
          badge="Urgent"
          badgeBg="#fef2f2" badgeColor="#dc2626"
          icon={<AlertTriangle className="w-5 h-5" style={{ color: colors.red }} />}
          valueColor={colors.red}
        />
      </div>

      {/* ── Filters Bar ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 mb-6">
        <div className="p-5 flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by client name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 border-slate-200"
            />
          </div>

          {/* Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-11">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Draft</SelectItem>
              <SelectItem value="in_progress">In Review</SelectItem>
              <SelectItem value="completed">Approved</SelectItem>
              <SelectItem value="Issued">Issued</SelectItem>
            </SelectContent>
          </Select>

          {/* Type */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48 h-11">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="comprehensive">Comprehensive SOA</SelectItem>
              <SelectItem value="limited">Limited Advice</SelectItem>
              <SelectItem value="portfolio">Portfolio Review</SelectItem>
              <SelectItem value="insurance">Insurance Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Group */}
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-44 h-11">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {adviceGroups.map(g => (
                <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Divider */}
          <div style={{ width: 1, height: 32, background: '#e2e8f0' }} />

          {/* SLA Toggle */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-xs font-medium text-slate-600">SLA breaches only</span>
            <button
              onClick={() => setSlaBreachOnly(!slaBreachOnly)}
              style={{
                width: 28, height: 16, borderRadius: 8, padding: 2,
                background: slaBreachOnly ? colors.red : '#E0E6F0',
                display: 'flex', alignItems: 'center',
                justifyContent: slaBreachOnly ? 'flex-end' : 'flex-start',
                transition: 'background 0.2s',
                cursor: 'pointer', border: 'none',
              }}
            >
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s',
              }} />
            </button>
          </div>

          {/* Results count */}
          <span className="text-xs text-slate-400 whitespace-nowrap ml-auto">
            Showing {filteredData.length} of {queueData.length} requests
          </span>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['CLIENT','ADVICE GROUP','ADVISER','TYPE','STATUS','SLA','SUBMITTED','ACTIONS'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? paginatedData.map((item) => {
                const level = slaLevel(item.hours);
                const borderLeft = level === 'breach' ? `3px solid ${colors.red}` :
                                   level === 'warning' ? `3px solid ${colors.amber}` : '3px solid transparent';
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors" style={{ borderLeft }}>
                    {/* CLIENT */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: avatarGradients[letterIndex(item.resolved_client_name?.[0])],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
                        }}>
                          {(item.resolved_client_name || '?')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13, color: '#1e293b' }}>{item.resolved_client_name}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>{item.client_email}</div>
                        </div>
                      </div>
                    </td>
                    {/* ADVICE GROUP */}
                    <td className="px-5 py-3.5">
                      <span style={{ fontSize: 12, color: '#475569' }}>{item.resolved_group || '—'}</span>
                    </td>
                    {/* ADVISER */}
                    <td className="px-5 py-3.5">
                      <span style={{ fontSize: 12, color: '#475569' }}>{item.resolved_adviser || '—'}</span>
                    </td>
                    {/* TYPE */}
                    <td className="px-5 py-3.5">
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                        fontSize: 11, fontWeight: 500,
                        background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b',
                      }}>
                        {item.type || 'SOA'}
                      </span>
                    </td>
                    {/* STATUS */}
                    <td className="px-5 py-3.5">
                      {getStatusBadge(item.status)}
                    </td>
                    {/* SLA */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={level === 'breach' ? 'sla-pulse' : ''}
                          style={{
                            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                            background: level === 'ok' ? colors.green : level === 'warning' ? colors.amber : colors.red,
                          }}
                        />
                        <span style={{
                          fontSize: 12,
                          fontWeight: level === 'breach' ? 700 : 400,
                          color: level === 'breach' ? colors.red : '#475569',
                        }}>
                          {item.hours}h
                        </span>
                      </div>
                    </td>
                    {/* SUBMITTED */}
                    <td className="px-5 py-3.5">
                      <div>
                        <div style={{ fontSize: 11, color: '#475569' }}>{formatDate(item.submitted_date || item.created_date)}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{formatTime(item.submitted_date || item.created_date)}</div>
                      </div>
                    </td>
                    {/* ACTIONS */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <ActionButton item={item} navigate={navigate} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Reassign</DropdownMenuItem>
                            <DropdownMenuItem>Download</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    No SOA requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ───────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} requests
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="text-slate-400 px-1">…</span>
            )}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────
function KPICard({ barColor, value, label, badge, badgeBg, badgeColor, icon, valueColor }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Top colour bar */}
      <div style={{ height: 3, background: barColor }} />
      <div style={{ padding: '20px 22px 18px' }}>
        <div className="flex items-center justify-between mb-3">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${barColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {icon}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
            background: badgeBg, color: badgeColor,
          }}>
            {badge}
          </span>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: valueColor || '#1e293b', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Action Button ──────────────────────────────────────────────
function ActionButton({ item, navigate }) {
  const [checking, setChecking] = useState(false);

  const handleView = async () => {
    setChecking(true);
    try {
      const docs = await base44.entities.SoaDocument.filter({ soa_request_id: item.id });
      if (docs.length > 0) {
        navigate(`/SOABuilder?id=${docs[0].id}`);
      } else {
        navigate(`/SOARequestWelcome?id=${item.id}`);
      }
    } catch {
      navigate(`/SOARequestWelcome?id=${item.id}`);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return <Loader2 className="animate-spin w-4 h-4 text-slate-400" />;
  }

  // Draft / submitted → Assign (blue)
  if (item.status === 'submitted' || item.status === 'Draft') {
    return (
      <button
        onClick={handleView}
        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
      >
        Assign
      </button>
    );
  }

  // In review / in_progress → Approve (green)
  if (item.status === 'in_progress' || item.status === 'Review' || item.status === 'InProgress') {
    return (
      <button
        onClick={handleView}
        className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
      >
        Approve
      </button>
    );
  }

  // Approved / Issued / completed → View
  return (
    <button
      onClick={handleView}
      className="px-4 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
    >
      View
    </button>
  );
}
