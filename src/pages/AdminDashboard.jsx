import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { formatRelativeDate } from '../utils/dateUtils';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// ============================================
// DESIGN TOKENS (from DESIGN_SYSTEM.md)
// ============================================
const ds = {
  teal:   '#00C9B1',
  tealDark: '#00A693',
  blue:   '#1E88E5',
  red:    '#E24B4A',
  amber:  '#F5A623',
  purple: '#8C50FF',
  green:  '#1D9E75',
  navy:   '#0F172A',
  // Donut
  approved: '#5DCAA5',
  inReview: '#85B7EB',
  draft:    '#94A3B8',
  breach:   '#F09595',
  // Activity dots
  dotTeal:   '#00C9B1',
  dotBlue:   '#1E88E5',
  dotRed:    '#E24B4A',
  dotPurple: '#8C50FF',
  dotAmber:  '#F5A623',
  // Light mode semantic
  textPrimary: '#0A1628',
  textSecondary: '#3A4A6B',
  textMuted: '#8A9BBE',
  textHint: '#B0BCCF',
  bgPage: '#F0F3F8',
  bgCard: '#ffffff',
  borderCard: '#E0E6F0',
  bgTopbar: '#ffffff',
  borderTopbar: '#E0E6F0',
  bgRowHover: '#FAFBFD',
  // KPI icon backgrounds (light)
  kpiTealBg: '#E1F5EE', kpiTealIcon: '#0F6E56',
  kpiBlueBg: '#E6F1FB', kpiBlueIcon: '#185FA5',
  kpiPurpleBg: '#EEEDFE', kpiPurpleIcon: '#534AB7',
  kpiAmberBg: '#FAEEDA', kpiAmberIcon: '#854F0B',
  kpiRedBg: '#FCEBEB', kpiRedIcon: '#A32D2D',
  kpiGreenBg: '#E8F7F0', kpiGreenIcon: '#1D9E75',
  // Badge backgrounds (light)
  badgeTealBg: '#E8F7F0', badgeTealColor: '#0F6E56',
  badgeBlueBg: '#E6F1FB', badgeBlueColor: '#0C447C',
  badgePurpleBg: '#EEEDFE', badgePurpleColor: '#3C3489',
  badgeAmberBg: '#FAEEDA', badgeAmberColor: '#633806',
  badgeRedBg: '#FCEBEB', badgeRedColor: '#A32D2D',
  badgeGreenBg: '#E8F7F0', badgeGreenColor: '#0F6E56',
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

const Avatar = ({ initials, gradientIndex, size = 32 }) => (
  <div style={{
    width: size, height: size,
    borderRadius: 8,
    background: avatarGradients[gradientIndex % avatarGradients.length],
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: size > 32 ? 13 : 11,
    flexShrink: 0,
  }}>
    {initials}
  </div>
);

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// ============================================
// COMPONENT
// ============================================
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalAdvisers: 0,
    totalClients: 0,
    pendingSOAs: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [queueItems, setQueueItems] = useState([]);
  const [advisers, setAdvisers] = useState([]);

  // Extra state for new dashboard sections
  const [allSOAs, setAllSOAs] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [chartTab, setChartTab] = useState('14d');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [groups, clients, adviserList, soaRequests] = await Promise.all([
        base44.entities.AdviceGroup.list(),
        base44.entities.Client.list(),
        base44.entities.Adviser.list(),
        base44.entities.SOARequest.list('-created_date', 50)
      ]);

      const pendingSOAs = soaRequests.filter(s => s.status !== 'completed').length;

      setStats({
        totalGroups: groups.length,
        totalAdvisers: adviserList.length,
        totalClients: clients.length,
        pendingSOAs
      });

      setAdvisers(adviserList);
      setAllSOAs(soaRequests);
      setAllGroups(groups);

      // Build client lookup
      const clientMap = {};
      clients.forEach(c => {
        clientMap[c.id] = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email;
      });

      // Build recent activity from real SOA data
      const bgColors = ['bg-blue-500', 'bg-orange-500', 'bg-purple-500', 'bg-cyan-500', 'bg-green-500'];
      const recent = soaRequests.slice(0, 4).map((soa, idx) => {
        const clientName = clientMap[soa.client_id] || soa.client_name || soa.client_email || 'Client';
        return {
          id: soa.id,
          client: clientName,
          adviser: soa.adviser_name || '',
          group: soa.advice_group_name || '',
          status: soa.status || 'draft',
          statusLabel: (soa.status || 'draft').replace(/_/g, ' '),
          time: soa.created_date ? formatRelativeDate(soa.created_date) : '',
          initial: clientName.charAt(0).toUpperCase(),
          bgColor: bgColors[idx % bgColors.length]
        };
      });
      setRecentActivity(recent);

      // Build queue items from submitted SOAs sorted by oldest first
      const submitted = soaRequests
        .filter(s => s.status === 'submitted' || s.status === 'in_progress')
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
        .slice(0, 3);

      const queue = submitted.map(soa => {
        const clientName = clientMap[soa.client_id] || soa.client_name || 'Unknown';
        const daysWaiting = soa.created_date ? Math.floor((Date.now() - new Date(soa.created_date)) / 86400000) : 0;
        let status, statusColor, bgColor;
        if (daysWaiting > 5) {
          status = 'Overdue'; statusColor = 'text-red-600'; bgColor = 'bg-red-50';
        } else if (daysWaiting > 3) {
          status = 'Attention'; statusColor = 'text-amber-600'; bgColor = 'bg-amber-50';
        } else {
          status = 'On Track'; statusColor = 'text-green-600'; bgColor = 'bg-green-50';
        }
        return {
          id: soa.id,
          name: clientName,
          adviser: soa.adviser_name || '',
          group: soa.advice_group_name || '',
          waiting: `${daysWaiting} days waiting`,
          hoursWaiting: daysWaiting * 24,
          status, statusColor, bgColor
        };
      });
      setQueueItems(queue);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived data ──────────────────────────────────

  // KPI: completed today
  const completedToday = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return allSOAs.filter(s => s.status === 'completed' && s.updated_date && s.updated_date.slice(0, 10) === todayStr).length;
  }, [allSOAs]);

  // KPI: SLA breaches (over 48hrs)
  const slaBreaches = useMemo(() => {
    return allSOAs.filter(s => {
      if (s.status === 'completed') return false;
      if (!s.created_date) return false;
      const hrs = (Date.now() - new Date(s.created_date)) / 3600000;
      return hrs > 48;
    });
  }, [allSOAs]);

  // KPI: avg turnaround
  const avgTurnaround = useMemo(() => {
    const completed = allSOAs.filter(s => s.status === 'completed' && s.created_date && s.updated_date);
    if (completed.length === 0) return null;
    const total = completed.reduce((sum, s) => sum + (new Date(s.updated_date) - new Date(s.created_date)), 0);
    return Math.round(total / completed.length / 3600000);
  }, [allSOAs]);

  // Chart: SOA volume over time
  const volumeData = useMemo(() => {
    const days = chartTab === '14d' ? 14 : chartTab === '30d' ? 30 : 90;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
      const completed = allSOAs.filter(s => s.status === 'completed' && s.updated_date && s.updated_date.slice(0, 10) === key).length;
      const submitted = allSOAs.filter(s => s.created_date && s.created_date.slice(0, 10) === key).length;
      data.push({ date: label, completed, submitted });
    }
    return data;
  }, [allSOAs, chartTab]);

  // Chart: Status breakdown
  const statusBreakdown = useMemo(() => {
    const counts = { approved: 0, inReview: 0, draft: 0, breach: 0 };
    allSOAs.forEach(s => {
      if (s.status === 'completed') counts.approved++;
      else if (s.status === 'in_progress' || s.status === 'submitted') counts.inReview++;
      else counts.draft++;
    });
    counts.breach = slaBreaches.length;
    return [
      { name: 'Approved', value: counts.approved, color: ds.approved },
      { name: 'In Review', value: counts.inReview, color: ds.inReview },
      { name: 'Draft', value: counts.draft, color: ds.draft },
      { name: 'SLA Breach', value: counts.breach, color: ds.breach },
    ];
  }, [allSOAs, slaBreaches]);

  // Top advice groups by SOA count
  const topGroups = useMemo(() => {
    const groupCounts = {};
    allSOAs.forEach(s => {
      const g = s.advice_group_name || 'Unknown';
      groupCounts[g] = (groupCounts[g] || 0) + 1;
    });
    const sorted = Object.entries(groupCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted.length > 0 ? sorted[0][1] : 1;
    return sorted.map(([name, count]) => ({ name, count, pct: (count / max) * 100 }));
  }, [allSOAs]);

  // SLA breach list (worst 5)
  const worstBreaches = useMemo(() => {
    return slaBreaches
      .map(s => {
        const hrs = Math.round((Date.now() - new Date(s.created_date)) / 3600000);
        return {
          id: s.id,
          client: s.client_name || s.client_email || 'Unknown',
          adviser: s.adviser_name || '',
          group: s.advice_group_name || '',
          hours: hrs,
        };
      })
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
  }, [slaBreaches]);

  // Activity feed
  const activityFeed = useMemo(() => {
    return allSOAs.slice(0, 6).map(s => {
      let action, dotColor;
      if (s.status === 'completed') { action = 'Approved'; dotColor = ds.dotTeal; }
      else if (s.status === 'submitted') { action = 'Issued'; dotColor = ds.dotBlue; }
      else if (s.status === 'in_progress') { action = 'Updated'; dotColor = ds.dotPurple; }
      else { action = 'Created'; dotColor = ds.dotAmber; }

      // check if breach
      if (s.created_date && s.status !== 'completed') {
        const hrs = (Date.now() - new Date(s.created_date)) / 3600000;
        if (hrs > 48) { action = 'SLA breach'; dotColor = ds.dotRed; }
      }

      return {
        id: s.id,
        action,
        dotColor,
        client: s.client_name || s.client_email || 'Client',
        adviser: s.adviser_name || '',
        group: s.advice_group_name || '',
        time: s.created_date ? formatRelativeDate(s.created_date) : '',
      };
    });
  }, [allSOAs]);

  // Date string for topbar
  const dateString = new Date().toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // ── Styles (Design System compliant) ──────────────
  const card = {
    background: ds.bgCard,
    borderRadius: 12,
    border: `0.5px solid ${ds.borderCard}`,
    padding: '16px 20px',
  };

  const sectionTitle = {
    fontSize: 13,
    fontWeight: 600,
    color: ds.textPrimary,
    margin: 0,
    fontFamily: "'DM Sans', sans-serif",
  };

  const subText = {
    fontSize: 10,
    color: ds.textHint,
  };

  const badgeStyle = (bg, color) => ({
    display: 'inline-flex',
    fontSize: 10,
    fontWeight: 600,
    padding: '3px 9px',
    borderRadius: 20,
    background: bg,
    color,
    whiteSpace: 'nowrap',
  });

  // ── RENDER ────────────────────────────────────────
  return (
    <div style={{
      padding: '0 24px 32px',
      fontFamily: "'DM Sans', sans-serif",
      background: ds.bgPage,
      minHeight: '100vh',
    }}>

      {/* ── TOPBAR ──────────────────────────────── */}
      <div style={{
        height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `0.5px solid ${ds.borderTopbar}`,
        marginBottom: 20,
        background: ds.bgTopbar,
      }}>
        {/* Breadcrumb left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ds.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span style={{ color: ds.textMuted, fontSize: 12 }}>›</span>
          <span style={{ fontWeight: 500, fontSize: 12, color: ds.textPrimary }}>
            Dashboard
          </span>
          <span style={badgeStyle('rgba(0,201,177,0.1)', ds.teal)}>
            Platform Admin
          </span>
        </div>
        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 400, color: ds.textMuted }}>{dateString}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: ds.textMuted }}>Tim Hall</span>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 11,
          }}>TH</div>
        </div>
      </div>

      {/* ── KPI ROW ─────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 16,
        marginBottom: 20,
      }}>
        {/* Active SOAs */}
        <KpiCard
          barColor={ds.teal}
          label="Active SOAs"
          value={loading ? '...' : stats.pendingSOAs}
          badge={{ text: 'In queue', bg: ds.badgeTealBg, color: ds.badgeTealColor }}
        />
        {/* Completed today */}
        <KpiCard
          barColor={ds.blue}
          label="Completed today"
          value={loading ? '...' : completedToday}
          badge={{ text: '+0% WoW', bg: ds.badgeBlueBg, color: ds.badgeBlueColor }}
        />
        {/* SLA breaches */}
        <KpiCard
          barColor={ds.red}
          label="SLA breaches"
          value={loading ? '...' : slaBreaches.length}
          valueColor={slaBreaches.length > 0 ? ds.red : undefined}
          badge={{ text: 'SLA breach', bg: ds.badgeRedBg, color: ds.badgeRedColor }}
        />
        {/* Avg turnaround */}
        <KpiCard
          barColor={ds.amber}
          label="Avg turnaround"
          value={loading ? '...' : avgTurnaround !== null ? `${avgTurnaround}h` : '—'}
          badge={avgTurnaround !== null && avgTurnaround <= 24
            ? { text: 'On target', bg: ds.badgeGreenBg, color: ds.badgeGreenColor }
            : { text: 'Behind', bg: ds.badgeRedBg, color: ds.badgeRedColor }
          }
        />
        {/* Advice Groups */}
        <KpiCard
          barColor={ds.purple}
          label="Advice Groups"
          value={loading ? '...' : stats.totalGroups}
          badge={{ text: '+0 this week', bg: ds.badgePurpleBg, color: ds.badgePurpleColor }}
        />
      </div>

      {/* ── CHART ROW ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* SOA Volume Line Chart */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <h3 style={{ ...sectionTitle, marginBottom: 2 }}>SOA volume — last {chartTab === '14d' ? '14 days' : chartTab === '30d' ? '30 days' : '90 days'}</h3>
              <p style={{ ...subText, margin: 0 }}>Completed SOAs per day across all groups</p>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['14d', '30d', '90d'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setChartTab(tab)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 600,
                    background: chartTab === tab ? ds.teal : 'transparent',
                    color: chartTab === tab ? ds.navy : ds.textMuted,
                    transition: 'all .15s',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 180, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData} margin={{ top: 5, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={ds.bgPage} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: ds.textMuted }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: ds.textMuted }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: ds.bgCard, border: `0.5px solid ${ds.borderCard}`,
                    borderRadius: 8, fontSize: 11,
                  }}
                />
                <Line type="monotone" dataKey="completed" stroke={ds.teal} strokeWidth={2} dot={false} name="Completed" />
                <Line type="monotone" dataKey="submitted" stroke={ds.blue} strokeWidth={2} strokeDasharray="5 5" dot={false} name="Submitted" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Donut */}
        <div style={card}>
          <h3 style={{ ...sectionTitle, marginBottom: 16 }}>SOA status breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 140, height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%" cy="50%"
                    innerRadius={42} outerRadius={64}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom legend */}
            <div style={{ width: '100%', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {statusBreakdown.map((entry, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
                    <span style={{ color: ds.textSecondary }}>{entry.name}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: ds.textPrimary }}>{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

        {/* Col 1: Top Advice Groups */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: ds.teal }} />
              <h3 style={sectionTitle}>Top Advice Groups</h3>
            </div>
            <Link to={createPageUrl('AdminAdviceGroups')} style={{ fontSize: 11, fontWeight: 600, color: ds.teal, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topGroups.length > 0 ? topGroups.map((g, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={getInitials(g.name)} gradientIndex={idx} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: ds.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {g.name}
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: ds.borderCard, marginTop: 4 }}>
                    <div style={{ height: '100%', borderRadius: 2, background: ds.teal, width: `${g.pct}%`, transition: 'width .3s' }} />
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: ds.textPrimary, minWidth: 20, textAlign: 'right' }}>
                  {g.count}
                </span>
              </div>
            )) : (
              <div style={{ ...subText, textAlign: 'center', padding: '16px 0' }}>No groups yet</div>
            )}
          </div>
        </div>

        {/* Col 2: SLA Breaches */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: ds.red }} />
              <h3 style={sectionTitle}>SLA Breaches</h3>
            </div>
            <Link to={createPageUrl('AdminQueue')} style={{ fontSize: 11, fontWeight: 600, color: ds.red, textDecoration: 'none' }}>
              Manage →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {worstBreaches.length > 0 ? worstBreaches.map((b, idx) => (
              <div key={b.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={getInitials(b.client)} gradientIndex={idx + 3} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: ds.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.client}
                  </div>
                  <div style={{ fontSize: 10, color: ds.textMuted }}>
                    {b.group}{b.adviser ? ` · ${b.adviser}` : ''}
                  </div>
                </div>
                <span style={badgeStyle(ds.badgeRedBg, ds.badgeRedColor)}>
                  {b.hours}hrs
                </span>
              </div>
            )) : (
              <div style={{ ...subText, textAlign: 'center', padding: '16px 0' }}>No breaches — nice work!</div>
            )}
          </div>
        </div>

        {/* Col 3: Recent Activity Feed */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: ds.purple }} />
              <h3 style={sectionTitle}>Recent Activity</h3>
            </div>
            <Link to={createPageUrl('AdminQueue')} style={{ fontSize: 11, fontWeight: 600, color: ds.purple, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activityFeed.length > 0 ? activityFeed.map((evt, idx) => (
              <div key={evt.id || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: evt.dotColor,
                  flexShrink: 0, marginTop: 4,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: ds.textSecondary }}>
                    <span style={{ fontWeight: 600, color: ds.textPrimary }}>{evt.action}</span>
                    {' '}{evt.client}
                  </div>
                  <div style={{ fontSize: 10, color: ds.textMuted, marginTop: 1 }}>
                    {evt.group}{evt.adviser ? ` · ${evt.adviser}` : ''}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: ds.textHint, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {evt.time}
                </span>
              </div>
            )) : (
              <div style={{ ...subText, textAlign: 'center', padding: '16px 0' }}>No activity yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── KPI Card sub-component (Design System compliant) ───
function KpiCard({ barColor, label, value, valueColor, badge: badgeProps }) {
  return (
    <div style={{
      background: ds.bgCard,
      borderRadius: 12,
      border: `0.5px solid ${ds.borderCard}`,
      padding: '14px 16px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {/* Top color bar — 2px per design system */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 2, borderRadius: '12px 12px 0 0',
        background: barColor,
      }} />
      <div style={{ fontSize: 11, color: ds.textMuted, fontWeight: 500 }}>
        {label}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 600, letterSpacing: '-0.3px',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.1,
        color: valueColor || ds.textPrimary,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {value}
      </div>
      {badgeProps && (
        <span style={{
          display: 'inline-flex',
          fontSize: 10, fontWeight: 600,
          padding: '3px 9px', borderRadius: 20,
          background: badgeProps.bg,
          color: badgeProps.color,
          whiteSpace: 'nowrap',
          alignSelf: 'flex-start',
        }}>
          {badgeProps.text}
        </span>
      )}
    </div>
  );
}
