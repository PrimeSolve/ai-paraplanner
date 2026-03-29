import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, Users, UserCheck, Clock, Clock3, CheckCircle, ChevronRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { formatRelativeDate } from '../utils/dateUtils';
import { toast } from 'sonner';

// ============================================
// DESIGN TOKENS (matching AdviceGroupDashboard)
// ============================================
const colors = {
  core: {
    navy: '#1e293b',
    slate: '#475569',
    slateLight: '#64748b',
    grey: '#94a3b8',
    greyLight: '#e2e8f0',
    offWhite: '#f8fafc',
    white: '#ffffff',
  },
  accent: {
    blue: '#3b82f6',
    blueDeep: '#1d4ed8',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    purple: '#8b5cf6',
    cyan: '#06b6d4',
  }
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

const Avatar = ({ initials, gradientIndex, size = 40 }) => (
  <div style={{
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: size > 40 ? '16px' : '12px',
    background: avatarGradients[gradientIndex % avatarGradients.length],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.core.white,
    fontWeight: 700,
    fontSize: size > 40 ? '18px' : '14px',
  }}>
    {initials}
  </div>
);

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

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
        return { name: clientName, waiting: `${daysWaiting} days waiting`, status, statusColor, bgColor };
      });
      setQueueItems(queue);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-orange-100 text-orange-700';
      case 'submitted': return 'bg-cyan-100 text-cyan-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTrendColor = (value) => {
    const num = parseFloat(value);
    return num > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div style={{
      padding: '24px 32px',
      display: 'flex',
      gap: '24px',
    }}>
      {/* Main Column */}
      <div style={{ flex: 1 }}>
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Total Advice Groups */}
          <div className="bg-white rounded-2xl px-6 py-3 border border-slate-200 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +12%
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {loading ? '...' : stats.totalGroups}
            </div>
            <div className="text-sm text-slate-600">Total Advice Groups</div>
          </div>

          {/* Total Advisers */}
          <div className="bg-white rounded-2xl px-6 py-3 border border-slate-200 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-cyan-600" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +8%
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {loading ? '...' : stats.totalAdvisers}
            </div>
            <div className="text-sm text-slate-600">Total Advisers</div>
          </div>

          {/* Total Clients */}
          <div className="bg-white rounded-2xl px-6 py-3 border border-slate-200 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +23%
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {loading ? '...' : stats.totalClients}
            </div>
            <div className="text-sm text-slate-600">Total Clients</div>
          </div>

          {/* Pending SOAs */}
          <div className="bg-white rounded-2xl px-6 py-3 border border-slate-200 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {stats.pendingSOAs}
            </div>
            <div className="text-sm text-slate-600">Pending SOAs</div>
          </div>
        </div>

        {/* Recent SOA Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 mb-6">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Recent SOA Activity</h3>
            </div>
            <Link to={createPageUrl('AdminQueue')} className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${activity.bgColor} flex items-center justify-center text-white font-bold text-lg`}>
                      {activity.initial}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm mb-0.5">{activity.client}</div>
                      <div className="text-xs text-slate-600">
                        {activity.adviser} • {activity.group}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${getStatusColor(activity.status)}`}>
                      {activity.statusLabel}
                    </span>
                    <span className="text-xs text-slate-500">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Longest in Queue */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-800">Longest in Queue</h3>
          </div>
          <div className="p-6 space-y-3">
            {queueItems.map((item, idx) => (
              <div key={idx} className={`p-4 rounded-xl border ${item.bgColor} border-${item.statusColor.replace('text-', '')}/20`}>
                <div className="font-semibold text-slate-800 text-sm mb-1">{item.name}</div>
                <div className="text-xs text-slate-600 mb-2">{item.waiting}</div>
                <span className={`text-xs font-semibold ${item.statusColor}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={{
        width: '320px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {/* Template Status */}
        <div style={{
          background: colors.core.white,
          borderRadius: '16px',
          border: `1px solid ${colors.core.greyLight}`,
          padding: '24px',
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: colors.core.navy,
            marginBottom: '16px',
          }}>
            Template Status
          </h4>
          <div style={{
            background: `linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))`,
            border: `1px solid rgba(16, 185, 129, 0.2)`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <CheckCircle size={18} color={colors.accent.success} />
              <span style={{ fontWeight: 600, color: colors.core.navy }}>Active SOA Template</span>
              <Link to={createPageUrl('AdminTemplate')} style={{
                marginLeft: 'auto',
                display: 'inline-block',
                background: colors.accent.blue,
                color: colors.core.white,
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                textDecoration: 'none',
              }}>
                Edit
              </Link>
            </div>
          </div>
        </div>

        {/* Adviser Activity */}
        <div style={{
          background: colors.core.white,
          borderRadius: '16px',
          border: `1px solid ${colors.core.greyLight}`,
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: colors.core.navy,
              margin: 0,
            }}>
              Adviser Activity
            </h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {advisers.length > 0 ? advisers.slice(0, 3).map((adv, idx) => {
              const name = `${adv.first_name || ''} ${adv.last_name || ''}`.trim() || adv.email;
              const initials = getInitials(name);
              return (
                <div key={adv.id || idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingBottom: idx !== Math.min(advisers.length, 3) - 1 ? '16px' : 0,
                  borderBottom: idx !== Math.min(advisers.length, 3) - 1 ? `1px solid ${colors.core.greyLight}` : 'none',
                }}>
                  <Avatar initials={initials} gradientIndex={idx} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: colors.core.navy, fontSize: '14px' }}>
                      {name}
                    </div>
                    <div style={{ fontSize: '12px', color: colors.core.slateLight }}>
                      {adv.email}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', color: colors.core.grey, fontSize: '14px', padding: '16px 0' }}>
                No advisers yet
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: colors.core.white,
          borderRadius: '16px',
          border: `1px solid ${colors.core.greyLight}`,
          padding: '24px',
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: colors.core.navy,
            marginBottom: '16px',
          }}>
            Quick Actions
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Manage Groups', icon: Building2, to: createPageUrl('AdminAdviceGroups') },
              { label: 'View Queue', icon: Clock, to: createPageUrl('AdminQueue') },
              { label: 'Edit Template', icon: FileText, to: createPageUrl('AdminTemplate') },
            ].map((action, idx) => {
              const Icon = action.icon;
              return (
                <Link key={idx} to={action.to} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: colors.core.navy,
                  transition: 'background-color 0.2s ease',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.core.offWhite}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Icon size={16} color={colors.core.slateLight} />
                  <span style={{ flex: 1 }}>{action.label}</span>
                  <ChevronRight size={16} color={colors.core.slateLight} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
