import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { formatRelativeDate } from '../utils/dateUtils';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';

/* ─────────────────────────────────────────────
   DESIGN TOKENS — pixel-matched to reference
   ───────────────────────────────────────────── */
const C = {
  bg:       '#F0F3F8',
  card:     '#ffffff',
  border:   '#E0E6F0',
  borderSub:'#F5F7FB',
  text:     '#0A1628',
  textMid:  '#3A4A6B',
  textMuted:'#8A9BBE',
  textFaint:'#B0BCCF',
  textLabel:'#5F5E5A',
  hover:    '#FAFBFD',
  teal:     '#00C9B1',
  blue:     '#1E88E5',
  red:      '#E24B4A',
  amber:    '#F5A623',
  purple:   '#8C50FF',
  // KPI icon backgrounds
  tealBg:   '#E1F5EE', tealFg:   '#0F6E56',
  blueBg:   '#E6F1FB', blueFg:   '#0C447C',
  redBg:    '#FCEBEB', redFg:    '#A32D2D',
  amberBg:  '#FAEEDA', amberFg:  '#854F0B',
  purpleBg: '#EEEDFE', purpleFg: '#534AB7',
  greenBg:  '#E8F7F0', greenFg:  '#0F6E56',
  // Donut
  approved: '#5DCAA5',
  inReview: '#85B7EB',
  draft:    '#B4B2A9',
  breach:   '#F09595',
};

const avatarColors = ['#1D9E75','#185FA5','#534AB7','#D85A30','#854F0B','#993556','#0F6E56'];

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGroups: 0, totalAdvisers: 0, totalClients: 0, pendingSOAs: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [queueItems, setQueueItems] = useState([]);
  const [advisers, setAdvisers] = useState([]);
  const [allSOAs, setAllSOAs] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [chartTab, setChartTab] = useState('14d');

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const [groups, clients, adviserList, soaRequests] = await Promise.all([
        base44.entities.AdviceGroup.list(),
        base44.entities.Client.list(),
        base44.entities.Adviser.list(),
        base44.entities.SOARequest.list('-created_date', 50)
      ]);

      const pendingSOAs = soaRequests.filter(s => s.status !== 'completed').length;
      setStats({ totalGroups: groups.length, totalAdvisers: adviserList.length, totalClients: clients.length, pendingSOAs });
      setAdvisers(adviserList);
      setAllSOAs(soaRequests);
      setAllGroups(groups);

      const clientMap = {};
      clients.forEach(c => {
        clientMap[c.id] = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email;
      });

      const bgColors = ['bg-blue-500', 'bg-orange-500', 'bg-purple-500', 'bg-cyan-500', 'bg-green-500'];
      const recent = soaRequests.slice(0, 4).map((soa, idx) => {
        const clientName = clientMap[soa.client_id] || soa.client_name || soa.client_email || 'Client';
        return {
          id: soa.id, client: clientName, adviser: soa.adviser_name || '',
          group: soa.advice_group_name || '', status: soa.status || 'draft',
          statusLabel: (soa.status || 'draft').replace(/_/g, ' '),
          time: soa.created_date ? formatRelativeDate(soa.created_date) : '',
          initial: clientName.charAt(0).toUpperCase(), bgColor: bgColors[idx % bgColors.length]
        };
      });
      setRecentActivity(recent);

      const submitted = soaRequests
        .filter(s => s.status === 'submitted' || s.status === 'in_progress')
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
        .slice(0, 3);
      const queue = submitted.map(soa => {
        const clientName = clientMap[soa.client_id] || soa.client_name || 'Unknown';
        const daysWaiting = soa.created_date ? Math.floor((Date.now() - new Date(soa.created_date)) / 86400000) : 0;
        let status, statusColor, bgColor;
        if (daysWaiting > 5) { status = 'Overdue'; statusColor = 'text-red-600'; bgColor = 'bg-red-50'; }
        else if (daysWaiting > 3) { status = 'Attention'; statusColor = 'text-amber-600'; bgColor = 'bg-amber-50'; }
        else { status = 'On Track'; statusColor = 'text-green-600'; bgColor = 'bg-green-50'; }
        return { id: soa.id, name: clientName, adviser: soa.adviser_name || '',
          group: soa.advice_group_name || '', waiting: `${daysWaiting} days waiting`,
          hoursWaiting: daysWaiting * 24, status, statusColor, bgColor };
      });
      setQueueItems(queue);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ── Derived data ── */

  const completedToday = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return allSOAs.filter(s => s.status === 'completed' && s.updated_date && s.updated_date.slice(0, 10) === todayStr).length;
  }, [allSOAs]);

  const completedThisWeek = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    return allSOAs.filter(s => s.status === 'completed' && s.updated_date && new Date(s.updated_date) >= weekAgo).length;
  }, [allSOAs]);

  const slaBreaches = useMemo(() => {
    return allSOAs.filter(s => {
      if (s.status === 'completed') return false;
      if (!s.created_date) return false;
      return (Date.now() - new Date(s.created_date)) / 3600000 > 48;
    });
  }, [allSOAs]);

  const avgTurnaround = useMemo(() => {
    const completed = allSOAs.filter(s => s.status === 'completed' && s.created_date && s.updated_date);
    if (completed.length === 0) return null;
    const total = completed.reduce((sum, s) => sum + (new Date(s.updated_date) - new Date(s.created_date)), 0);
    return Math.round(total / completed.length / 3600000);
  }, [allSOAs]);

  const volumeData = useMemo(() => {
    const days = chartTab === '14d' ? 14 : chartTab === '30d' ? 30 : 90;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = i === days - 1
        ? d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
        : i === 0
          ? d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
          : String(d.getDate());
      const completed = allSOAs.filter(s => s.status === 'completed' && s.updated_date && s.updated_date.slice(0, 10) === key).length;
      const submitted = allSOAs.filter(s => s.created_date && s.created_date.slice(0, 10) === key).length;
      data.push({ date: label, Completed: completed, Submitted: submitted });
    }
    return data;
  }, [allSOAs, chartTab]);

  const statusBreakdown = useMemo(() => {
    const counts = { approved: 0, inReview: 0, draft: 0 };
    allSOAs.forEach(s => {
      if (s.status === 'completed') counts.approved++;
      else if (s.status === 'in_progress' || s.status === 'submitted') counts.inReview++;
      else counts.draft++;
    });
    return [
      { name: 'Approved',   value: counts.approved,    color: C.approved },
      { name: 'In review',  value: counts.inReview,    color: C.inReview },
      { name: 'Draft',      value: counts.draft,       color: C.draft },
      { name: 'SLA breach', value: slaBreaches.length, color: C.breach },
    ];
  }, [allSOAs, slaBreaches]);

  const topGroups = useMemo(() => {
    const groupCounts = {};
    allSOAs.forEach(s => {
      const g = s.advice_group_name || 'Unknown';
      groupCounts[g] = (groupCounts[g] || 0) + 1;
    });
    const sorted = Object.entries(groupCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted.length > 0 ? sorted[0][1] : 1;
    const barColors = [C.teal, C.blue, C.purple, '#D85A30', C.amber];
    return sorted.map(([name, count], i) => ({ name, count, pct: (count / max) * 100, barColor: barColors[i % barColors.length] }));
  }, [allSOAs]);

  const worstBreaches = useMemo(() => {
    return slaBreaches
      .map(s => ({
        id: s.id,
        client: s.client_name || s.client_email || 'Unknown',
        adviser: s.adviser_name || '',
        group: s.advice_group_name || '',
        hours: Math.round((Date.now() - new Date(s.created_date)) / 3600000),
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
  }, [slaBreaches]);

  const activityFeed = useMemo(() => {
    return allSOAs.slice(0, 5).map(s => {
      let action, boldWord, dotColor;
      if (s.status === 'completed')    { action = ' SOA '; boldWord = 'approved';     dotColor = C.teal; }
      else if (s.status === 'submitted') { action = ' SOA '; boldWord = 'issued';     dotColor = C.blue; }
      else if (s.status === 'in_progress') { action = ' SOA '; boldWord = 'updated';  dotColor = C.purple; }
      else                               { action = ' SOA '; boldWord = 'created';    dotColor = C.amber; }

      if (s.created_date && s.status !== 'completed') {
        const hrs = (Date.now() - new Date(s.created_date)) / 3600000;
        if (hrs > 48) { action = ' SOA '; boldWord = 'breached SLA'; dotColor = C.red; }
      }

      return {
        id: s.id, dotColor, boldWord, action,
        client: s.client_name || s.client_email || 'Client',
        adviser: s.adviser_name || '',
        group: s.advice_group_name || '',
        time: s.created_date ? formatRelativeDate(s.created_date) : '',
      };
    });
  }, [allSOAs]);

  const dateString = new Date().toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
  });

  /* ── Inline style objects ── */
  const S = {
    card: { background: C.card, borderRadius: 12, border: `0.5px solid ${C.border}`, overflow: 'hidden' },
    cardPad: { background: C.card, borderRadius: 12, border: `0.5px solid ${C.border}`, padding: '18px' },
    tableHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: `0.5px solid ${C.bg}` },
    tableTitle: { fontSize: 12, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 6, margin: 0 },
    tableLink: { fontSize: 11, color: C.teal, fontWeight: 500, textDecoration: 'none', cursor: 'pointer' },
    tRow: { display: 'flex', alignItems: 'center', padding: '9px 16px', borderBottom: `0.5px solid ${C.borderSub}`, gap: 10, cursor: 'pointer', transition: 'background 0.1s' },
    tAvatar: (bg) => ({ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0, background: bg }),
    tName: { fontSize: 12, fontWeight: 500, color: C.text, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    tSub: { fontSize: 10, color: C.textMuted },
    dot: (color) => ({ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }),
    slaBadge: { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: C.redBg, color: C.redFg, flexShrink: 0, whiteSpace: 'nowrap' },
    alertDot: (color) => ({ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 4 }),
  };

  /* ── RENDER ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text }}>

      {/* ── TOPBAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 52, background: C.card, borderBottom: `0.5px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMuted }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill={C.textMuted}><path d="M8 1L1 7h2v7h4v-4h2v4h4V7h2L8 1z"/></svg>
          <span style={{ color: '#C5CFDF' }}>›</span>
          <span style={{ color: C.text, fontWeight: 500 }}>Dashboard</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: 'rgba(0,201,177,0.1)', color: C.teal, marginLeft: 4 }}>
            Platform Admin
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: C.textMuted }}>{dateString}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: C.textMid }}>Tim Hall</span>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>TH</div>
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── KPI ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <KpiCard bar={C.teal} iconBg={C.tealBg} iconFg={C.tealFg}
            icon={<path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h8v2H2v-2z"/>}
            badgeText="In queue" badgeBg={C.tealBg} badgeFg={C.tealFg}
            value={loading ? '…' : stats.pendingSOAs} label="Active SOAs"
            sub="Across all advice groups" />
          <KpiCard bar={C.blue} iconBg={C.blueBg} iconFg={C.blueFg}
            icon={<path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3 7.5l-4 2.5V6l4 2.5z"/>}
            badgeText="+18% WoW" badgeBg={C.blueBg} badgeFg={C.blueFg}
            value={loading ? '…' : completedToday} label="Completed today"
            sub={`${completedThisWeek} this week`} />
          <KpiCard bar={C.red} iconBg={C.redBg} iconFg={C.redFg}
            icon={<path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3h1v5h-1V4zm0 6h1v1h-1v-1z"/>}
            badgeText="SLA breach" badgeBg={C.redBg} badgeFg={C.redFg}
            value={loading ? '…' : slaBreaches.length} valueColor={C.red}
            label="Over 48 hours" sub="Needs immediate attention" />
          <KpiCard bar={C.amber} iconBg={C.amberBg} iconFg={C.amberFg}
            icon={<path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3v4l3 1.5.5-.87-2.5-1.25V4H7.5z"/>}
            badgeText={avgTurnaround !== null && avgTurnaround <= 24 ? 'On target' : 'Behind'}
            badgeBg={avgTurnaround !== null && avgTurnaround <= 24 ? C.greenBg : C.redBg}
            badgeFg={avgTurnaround !== null && avgTurnaround <= 24 ? C.greenFg : C.redFg}
            value={loading ? '…' : avgTurnaround !== null ? `${avgTurnaround}h` : '—'}
            label="Avg turnaround" sub="Target: under 24hrs" />
          <KpiCard bar={C.purple} iconBg={C.purpleBg} iconFg={C.purpleFg}
            icon={<><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></>}
            badgeText="+2 this week" badgeBg={C.greenBg} badgeFg={C.greenFg}
            value={loading ? '…' : stats.totalGroups} label="Advice Groups"
            sub={`${stats.totalClients} clients · ${stats.totalAdvisers} advisers`} />
        </div>

        {/* ── CHART ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

          {/* Line chart */}
          <div style={S.cardPad}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={S.dot(C.teal)} />
                  SOA volume — last {chartTab === '14d' ? '14 days' : chartTab === '30d' ? '30 days' : '90 days'}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Completed SOAs per day across all groups</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['14d','30d','90d'].map(t => (
                  <button key={t} onClick={() => setChartTab(t)} style={{
                    fontSize: 10, fontWeight: 500, padding: '3px 9px', borderRadius: 6, cursor: 'pointer',
                    border: chartTab === t ? 'none' : `0.5px solid ${C.border}`,
                    color: chartTab === t ? '#fff' : C.textMuted,
                    background: chartTab === t ? C.teal : 'transparent',
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tealFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.teal} stopOpacity={0.08}/>
                      <stop offset="100%" stopColor={C.teal} stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.blue} stopOpacity={0.05}/>
                      <stop offset="100%" stopColor={C.blue} stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={C.bg} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textFaint }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: C.textFaint }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} />
                  <Area type="monotone" dataKey="Submitted" stroke={C.blue} strokeWidth={1.5} strokeDasharray="4 3" fill="url(#blueFill)" dot={{ r: 2, fill: C.blue, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="Completed" stroke={C.teal} strokeWidth={2} fill="url(#tealFill)" dot={{ r: 3, fill: C.teal, stroke: '#fff', strokeWidth: 1.5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut chart */}
          <div style={S.cardPad}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={S.dot(C.purple)} />
                SOA status breakdown
              </div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Current queue by status</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140 }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={38} outerRadius={65} paddingAngle={1} dataKey="value" stroke="none">
                    {statusBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, fontFamily: "'DM Sans', sans-serif" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
              {statusBreakdown.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: e.color, display: 'inline-block' }} />
                    <span style={{ color: C.textLabel }}>{e.name}</span>
                  </span>
                  <span style={{ fontWeight: 600, color: e.name === 'SLA breach' ? C.red : C.text }}>{e.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

          {/* Top Advice Groups */}
          <div style={S.card}>
            <div style={S.tableHeader}>
              <h3 style={S.tableTitle}><span style={S.dot(C.teal)} /> Top advice groups</h3>
              <Link to={createPageUrl('AdminAdviceGroups')} style={S.tableLink}>View all →</Link>
            </div>
            {topGroups.length > 0 ? topGroups.map((g, i) => (
              <div key={i} style={S.tRow}>
                <div style={S.tAvatar(avatarColors[i % avatarColors.length])}>{getInitials(g.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.tName}>{g.name}</div>
                  <div style={{ height: 4, borderRadius: 2, background: C.bg, overflow: 'hidden', marginTop: 4 }}>
                    <div style={{ height: '100%', borderRadius: 2, background: g.barColor, width: `${g.pct}%` }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{g.count}</div>
                  <div style={S.tSub}>SOAs</div>
                </div>
              </div>
            )) : (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: C.textMuted }}>No groups yet</div>
            )}
          </div>

          {/* SLA Breaches */}
          <div style={S.card}>
            <div style={S.tableHeader}>
              <h3 style={S.tableTitle}><span style={S.dot(C.red)} /> SLA breaches — over 48hrs</h3>
              <Link to={createPageUrl('AdminQueue')} style={{ ...S.tableLink, color: C.red }}>Manage →</Link>
            </div>
            {worstBreaches.length > 0 ? worstBreaches.map((b, i) => (
              <div key={b.id || i} style={S.tRow}>
                <div style={S.tAvatar(avatarColors[(i + 3) % avatarColors.length])}>{getInitials(b.client)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.tName}>{b.client}</div>
                  <div style={S.tSub}>{b.group}{b.adviser ? ` · ${b.adviser}` : ''}</div>
                </div>
                <span style={S.slaBadge}>{b.hours}hrs</span>
              </div>
            )) : (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: C.textMuted }}>No breaches</div>
            )}
          </div>

          {/* Recent Activity */}
          <div style={S.card}>
            <div style={S.tableHeader}>
              <h3 style={S.tableTitle}><span style={S.dot(C.purple)} /> Recent activity</h3>
              <Link to={createPageUrl('AdminQueue')} style={S.tableLink}>View all →</Link>
            </div>
            {activityFeed.length > 0 ? activityFeed.map((evt, i) => (
              <div key={evt.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 16px', borderBottom: i < activityFeed.length - 1 ? `0.5px solid ${C.borderSub}` : 'none' }}>
                <div style={S.alertDot(evt.dotColor)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4 }}>
                    {evt.client}{evt.action}<strong>{evt.boldWord}</strong>
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                    {evt.group}{evt.adviser ? ` · ${evt.adviser}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: C.textFaint, flexShrink: 0 }}>{evt.time}</div>
              </div>
            )) : (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: C.textMuted }}>No activity yet</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   KPI CARD
   ───────────────────────────────────────────── */
function KpiCard({ bar, iconBg, iconFg, icon, badgeText, badgeBg, badgeFg, value, valueColor, label, sub }) {
  return (
    <div style={{
      background: C.card, borderRadius: 12, border: `0.5px solid ${C.border}`,
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: '12px 12px 0 0', background: bar }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill={iconFg}>{icon}</svg>
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: badgeBg, color: badgeFg }}>{badgeText}</div>
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 600, letterSpacing: -0.3, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: valueColor || C.text }}>{value}</div>
      <div style={{ fontSize: 11, color: C.textMuted }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: C.textFaint, marginTop: -4 }}>{sub}</div>}
    </div>
  );
}
