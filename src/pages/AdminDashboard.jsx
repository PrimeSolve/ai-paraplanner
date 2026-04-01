import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { formatRelativeDate } from '../utils/dateUtils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const safeStr = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (val.name) return safeStr(val.name);
    if (val.value) return safeStr(val.value);
    if (val.first_name || val.last_name) return `${safeStr(val.first_name)} ${safeStr(val.last_name)}`.trim();
    return JSON.stringify(val);
  }
  return String(val);
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeSoaCount: 0,
    completedToday: 0,
    completedThisWeek: 0,
    slaBreaches: 0,
    avgTurnaround: '—',
    adviceGroupCount: 0,
    totalClients: 0,
    totalAdvisers: 0,
  });
  const [soasByStatus, setSoasByStatus] = useState({ approved: 0, inReview: 0, draft: 0, slaBreach: 0 });
  const [topAdviceGroups, setTopAdviceGroups] = useState([]);
  const [slaBreachList, setSlaBreachList] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [volumeData, setVolumeData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [soaRequests, adviceGroups, advisers, clients] = await Promise.all([
        base44.entities.SOARequest.list('-created_date', 200),
        base44.entities.AdviceGroup.list(),
        base44.entities.Adviser.list(),
        base44.entities.Client.list(),
      ]);

      const activeSoas = soaRequests.filter(s => s.status === 'submitted' || s.status === 'in_progress');
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);

      const completedSoas = soaRequests.filter(s => s.status === 'completed');
      const completedToday = completedSoas.filter(s => {
        const d = new Date(s.completed_date || s.updated_date);
        return d >= todayStart;
      });
      const completedThisWeek = completedSoas.filter(s => {
        const d = new Date(s.completed_date || s.updated_date);
        return d >= weekStart;
      });

      // SLA breaches: SOAs active > 48 hours
      const slaBreaches = activeSoas.filter(s => {
        const created = new Date(s.created_date);
        return (now - created) / (1000 * 60 * 60) > 48;
      });

      // Average turnaround
      let avgHours = 0;
      if (completedSoas.length > 0) {
        const totalHours = completedSoas.reduce((sum, s) => {
          const start = new Date(s.created_date);
          const end = new Date(s.completed_date || s.updated_date);
          return sum + (end - start) / (1000 * 60 * 60);
        }, 0);
        avgHours = Math.round(totalHours / completedSoas.length);
      }

      const approved = soaRequests.filter(s => s.status === 'completed').length;
      const inReview = soaRequests.filter(s => s.status === 'submitted').length;
      const draft = soaRequests.filter(s => s.status === 'in_progress').length;

      setSoasByStatus({ approved, inReview, draft, slaBreach: slaBreaches.length });

      setStats({
        activeSoaCount: activeSoas.length,
        completedToday: completedToday.length,
        completedThisWeek: completedThisWeek.length,
        slaBreaches: slaBreaches.length,
        avgTurnaround: avgHours > 0 ? `${avgHours}h` : '—',
        adviceGroupCount: adviceGroups.length,
        totalClients: clients.length,
        totalAdvisers: advisers.length,
      });

      // Top advice groups by SOA count
      const groupSoaCounts = {};
      soaRequests.forEach(s => {
        const groupName = s.advice_group_name || 'Unknown';
        groupSoaCounts[groupName] = (groupSoaCounts[groupName] || 0) + 1;
      });
      const sortedGroups = Object.entries(groupSoaCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      const maxGroupCount = sortedGroups.length > 0 ? sortedGroups[0][1] : 1;
      const groupColors = ['#1D9E75', '#185FA5', '#534AB7', '#D85A30', '#854F0B'];
      const barColors = ['#00C9B1', '#1E88E5', '#8C50FF', '#D85A30', '#F5A623'];
      setTopAdviceGroups(sortedGroups.map(([name, count], idx) => ({
        name,
        count,
        initials: name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        avatarColor: groupColors[idx % groupColors.length],
        barColor: barColors[idx % barColors.length],
        barWidth: Math.round((count / maxGroupCount) * 100),
      })));

      // SLA breach list
      const breachItems = slaBreaches
        .map(s => {
          const created = new Date(s.created_date);
          const hours = Math.round((now - created) / (1000 * 60 * 60));
          const client = clients.find(c => c.email === s.client_email);
          const adviser = advisers.find(a => a.email === s.created_by);
          const group = adviser?.advice_group_id
            ? adviceGroups.find(g => g.id === adviser.advice_group_id)
            : null;
          const clientName = client
            ? `${safeStr(client.first_name)} ${safeStr(client.last_name)}`.trim()
            : safeStr(s.client_name || 'Unknown');
          return {
            name: clientName,
            initials: clientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
            sub: `${safeStr(group?.name || '')}${adviser ? ` · ${safeStr(adviser.first_name)} ${safeStr(adviser.last_name)}`.trim() : ''}`,
            hours,
          };
        })
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5);
      const breachColors = ['#854F0B', '#993556', '#185FA5', '#534AB7', '#D85A30'];
      setSlaBreachList(breachItems.map((item, idx) => ({
        ...item,
        avatarColor: breachColors[idx % breachColors.length],
      })));

      // Recent activity
      const activities = [];
      soaRequests.slice(0, 20).forEach(s => {
        const client = clients.find(c => c.email === s.client_email);
        const adviser = advisers.find(a => a.email === s.created_by);
        const group = adviser?.advice_group_id
          ? adviceGroups.find(g => g.id === adviser.advice_group_id)
          : null;
        const clientName = client
          ? `${safeStr(client.first_name)} ${safeStr(client.last_name)}`.trim()
          : safeStr(s.client_name || 'Client');
        const adviserName = adviser ? `${safeStr(adviser.first_name)} ${safeStr(adviser.last_name)}`.trim() : '';
        const groupName = safeStr(group?.name || '');

        if (s.status === 'completed') {
          activities.push({
            dotColor: '#00C9B1',
            text: `${clientName} SOA`,
            action: 'approved',
            sub: `${groupName}${adviserName ? ` · ${adviserName}` : ''}`,
            time: formatRelativeDate(s.completed_date || s.updated_date),
            date: s.completed_date || s.updated_date,
          });
        } else if (s.status === 'submitted') {
          activities.push({
            dotColor: '#1E88E5',
            text: `${clientName} SOA`,
            action: 'submitted',
            sub: `${groupName}${adviserName ? ` · ${adviserName}` : ''}`,
            time: formatRelativeDate(s.submitted_date || s.created_date),
            date: s.submitted_date || s.created_date,
          });
        } else if (s.status === 'in_progress') {
          activities.push({
            dotColor: '#8C50FF',
            text: `${clientName} SOA`,
            action: 'in progress',
            sub: `${groupName}${adviserName ? ` · ${adviserName}` : ''}`,
            time: formatRelativeDate(s.updated_date || s.created_date),
            date: s.updated_date || s.created_date,
          });
        }
      });
      activities.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setRecentActivity(activities.slice(0, 5));

      // Volume chart data (last 14 days)
      const chartData = [];
      for (let i = 13; i >= 0; i--) {
        const day = new Date(todayStart);
        day.setDate(day.getDate() - i);
        const dayEnd = new Date(day);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const completed = completedSoas.filter(s => {
          const d = new Date(s.completed_date || s.updated_date);
          return d >= day && d < dayEnd;
        }).length;

        const submitted = soaRequests.filter(s => {
          const d = new Date(s.created_date);
          return d >= day && d < dayEnd;
        }).length;

        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        chartData.push({ label: `${day.getDate()} ${months[day.getMonth()]}`, completed, submitted });
      }
      setVolumeData(chartData);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  const donutData = [
    { name: 'Approved', value: soasByStatus.approved, color: '#5DCAA5' },
    { name: 'In review', value: soasByStatus.inReview, color: '#85B7EB' },
    { name: 'Draft', value: soasByStatus.draft, color: '#B4B2A9' },
    { name: 'SLA breach', value: soasByStatus.slaBreach, color: '#F09595' },
  ];

  const kpiCards = [
    {
      topColor: '#00C9B1',
      iconBg: '#E1F5EE', iconFill: '#0F6E56',
      iconPath: <path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h8v2H2v-2z"/>,
      badgeBg: '#E1F5EE', badgeColor: '#0F6E56', badgeText: 'In queue',
      num: stats.activeSoaCount, numColor: '#0A1628',
      label: 'Active SOAs', sub: 'Across all advice groups',
    },
    {
      topColor: '#1E88E5',
      iconBg: '#E6F1FB', iconFill: '#185FA5',
      iconPath: <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3 7.5l-4 2.5V6l4 2.5z"/>,
      badgeBg: '#E6F1FB', badgeColor: '#0C447C',
      badgeText: stats.completedThisWeek > 0 ? `${stats.completedThisWeek} this week` : '—',
      num: stats.completedToday, numColor: '#0A1628',
      label: 'Completed today', sub: `${stats.completedThisWeek} this week`,
    },
    {
      topColor: '#E24B4A',
      iconBg: '#FCEBEB', iconFill: '#A32D2D',
      iconPath: <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3h1v5h-1V4zm0 6h1v1h-1v-1z"/>,
      badgeBg: '#FCEBEB', badgeColor: '#A32D2D', badgeText: 'SLA breach',
      num: stats.slaBreaches, numColor: '#E24B4A',
      label: 'Over 48 hours', sub: 'Needs immediate attention',
    },
    {
      topColor: '#F5A623',
      iconBg: '#FAEEDA', iconFill: '#854F0B',
      iconPath: <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3v4l3 1.5.5-.87-2.5-1.25V4H7.5z"/>,
      badgeBg: '#E8F7F0', badgeColor: '#0F6E56', badgeText: 'On target',
      num: stats.avgTurnaround, numColor: '#0A1628',
      label: 'Avg turnaround', sub: 'Target: under 24hrs',
    },
    {
      topColor: '#8C50FF',
      iconBg: '#EEEDFE', iconFill: '#534AB7',
      iconPath: <><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></>,
      badgeBg: '#E8F7F0', badgeColor: '#0F6E56', badgeText: `${stats.adviceGroupCount} total`,
      num: stats.adviceGroupCount, numColor: '#0A1628',
      label: 'Advice Groups', sub: `${stats.totalClients} clients · ${stats.totalAdvisers} advisers`,
    },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
        {kpiCards.map((card, idx) => (
          <div key={idx} style={{
            background: '#fff', borderRadius: '12px', border: '0.5px solid #E0E6F0',
            padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              borderRadius: '12px 12px 0 0', background: card.topColor,
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: card.iconBg,
              }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill={card.iconFill}>{card.iconPath}</svg>
              </div>
              <div style={{
                fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '20px',
                background: card.badgeBg, color: card.badgeColor,
              }}>
                {card.badgeText}
              </div>
            </div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: '22px', fontWeight: 600,
              letterSpacing: '-0.3px', lineHeight: 1, color: card.numColor,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {card.num}
            </div>
            <div style={{ fontSize: '11px', color: '#8A9BBE' }}>{card.label}</div>
            <div style={{ fontSize: '10px', color: '#B0BCCF', marginTop: '1px' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* CHART ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Volume chart */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E0E6F0', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0A1628', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C9B1' }} />
                SOA volume — last 14 days
              </div>
              <div style={{ fontSize: '10px', color: '#8A9BBE', marginTop: '2px' }}>Completed SOAs per day across all groups</div>
            </div>
          </div>
          <div style={{ height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C9B1" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#00C9B1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.06}/>
                    <stop offset="95%" stopColor="#1E88E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#F0F3F8" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#B0BCCF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#B0BCCF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', borderRadius: '8px', border: '0.5px solid #E0E6F0' }} />
                <Area type="monotone" dataKey="submitted" stroke="#1E88E5" strokeWidth={1.5} strokeDasharray="4 3" fillOpacity={1} fill="url(#colorSubmitted)" dot={{ r: 2, fill: '#1E88E5' }} name="Submitted" />
                <Area type="monotone" dataKey="completed" stroke="#00C9B1" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" dot={{ r: 3, fill: '#00C9B1', stroke: '#fff', strokeWidth: 1.5 }} name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status donut */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E0E6F0', padding: '18px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0A1628', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8C50FF' }} />
              SOA status breakdown
            </div>
            <div style={{ fontSize: '10px', color: '#8A9BBE', marginTop: '2px' }}>Current queue by status</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px' }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={65}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
            {donutData.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color, display: 'inline-block' }} />
                  <span style={{ color: '#5F5E5A' }}>{item.name}</span>
                </span>
                <span style={{ fontWeight: 600, color: item.name === 'SLA breach' ? '#E24B4A' : '#0A1628' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>

        {/* Top Advice Groups */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E0E6F0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '0.5px solid #F0F3F8' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0A1628', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C9B1' }} />
              Top advice groups
            </div>
            <Link to={createPageUrl('AdminAdviceGroups')} style={{ fontSize: '11px', color: '#00C9B1', fontWeight: 500, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          {topAdviceGroups.length > 0 ? topAdviceGroups.map((group, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', padding: '9px 16px',
              borderBottom: idx < topAdviceGroups.length - 1 ? '0.5px solid #F5F7FB' : 'none',
              gap: '10px', cursor: 'pointer', transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFBFD'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                width: '26px', height: '26px', borderRadius: '7px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 700, color: '#fff', flexShrink: 0,
                background: group.avatarColor,
              }}>
                {group.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#0A1628', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {group.name}
                </div>
                <div style={{ height: '4px', borderRadius: '2px', background: '#F0F3F8', overflow: 'hidden', marginTop: '4px' }}>
                  <div style={{ height: '100%', borderRadius: '2px', background: group.barColor, width: `${group.barWidth}%` }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#0A1628' }}>{group.count}</div>
                <div style={{ fontSize: '10px', color: '#8A9BBE' }}>SOAs</div>
              </div>
            </div>
          )) : (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: '#8A9BBE', fontSize: '12px' }}>
              No advice groups yet
            </div>
          )}
        </div>

        {/* SLA Breaches */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E0E6F0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '0.5px solid #F0F3F8' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0A1628', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E24B4A' }} />
              SLA breaches — over 48hrs
            </div>
            <Link to={createPageUrl('AdminQueue')} style={{ fontSize: '11px', color: '#E24B4A', fontWeight: 500, textDecoration: 'none' }}>
              Manage →
            </Link>
          </div>
          {slaBreachList.length > 0 ? slaBreachList.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', padding: '9px 16px',
              borderBottom: idx < slaBreachList.length - 1 ? '0.5px solid #F5F7FB' : 'none',
              gap: '10px', cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFBFD'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                width: '26px', height: '26px', borderRadius: '7px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 700, color: '#fff', flexShrink: 0,
                background: item.avatarColor,
              }}>
                {item.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#0A1628', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '10px', color: '#8A9BBE' }}>{item.sub}</div>
              </div>
              <div style={{
                fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                borderRadius: '20px', flexShrink: 0, whiteSpace: 'nowrap',
                background: '#FCEBEB', color: '#A32D2D',
              }}>
                {item.hours}hrs
              </div>
            </div>
          )) : (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: '#8A9BBE', fontSize: '12px' }}>
              No SLA breaches
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E0E6F0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '0.5px solid #F0F3F8' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0A1628', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8C50FF' }} />
              Recent activity
            </div>
            <span style={{ fontSize: '11px', color: '#00C9B1', fontWeight: 500, cursor: 'pointer' }}>
              View all →
            </span>
          </div>
          {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'flex-start', gap: '9px', padding: '9px 16px',
              borderBottom: idx < recentActivity.length - 1 ? '0.5px solid #F5F7FB' : 'none',
            }}>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, marginTop: '3px',
                background: activity.dotColor,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#0A1628', lineHeight: 1.4 }}>
                  {activity.text} <strong>{activity.action}</strong>
                </div>
                <div style={{ fontSize: '10px', color: '#8A9BBE', marginTop: '2px' }}>{activity.sub}</div>
              </div>
              <div style={{ fontSize: '10px', color: '#B0BCCF', flexShrink: 0 }}>{activity.time}</div>
            </div>
          )) : (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: '#8A9BBE', fontSize: '12px' }}>
              No recent activity
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
