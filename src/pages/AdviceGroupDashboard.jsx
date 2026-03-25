import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useAuth } from '@/lib/AuthContext';
import axiosInstance from '@/api/axiosInstance';
import { useRole } from '../components/RoleContext';
import { toast } from 'sonner';
import {
  FileText,
  Clock,
  Users,
  CheckCircle,
  ChevronRight,
  Download,
} from 'lucide-react';

// ============================================
// DESIGN TOKENS
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

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = ({ icon: Icon, value, label, iconColor }) => (
  <div style={{
    background: colors.core.white,
    borderRadius: '16px',
    padding: '20px',
    border: `1px solid ${colors.core.greyLight}`,
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '16px',
      background: iconColor,
    }}>
      <Icon size={24} color={colors.core.white} />
    </div>
    <div style={{
      fontSize: '32px',
      fontWeight: 700,
      color: colors.core.navy,
      marginBottom: '8px',
    }}>
      {value}
    </div>
    <div style={{
      fontSize: '14px',
      color: colors.core.slateLight,
    }}>
      {label}
    </div>
  </div>
);

// ============================================
// AVATAR COMPONENT
// ============================================
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

// ============================================
// STATUS BADGE COMPONENT
// ============================================
const StatusBadge = ({ status }) => {
  const statusMap = {
    'Draft':      { label: 'Draft',        bg: 'rgba(100, 116, 139, 0.1)', color: colors.core.slateLight },
    'InProgress': { label: 'In Progress',  bg: 'rgba(245, 158, 11, 0.1)',  color: colors.accent.warning },
    'Review':     { label: 'Under Review', bg: 'rgba(139, 92, 246, 0.1)',  color: colors.accent.purple },
    'Approved':   { label: 'Approved',     bg: 'rgba(59, 130, 246, 0.1)',  color: colors.accent.blue },
    'Issued':     { label: 'Issued',       bg: 'rgba(16, 185, 129, 0.1)',  color: colors.accent.success },
  };
  const style = statusMap[status] || { label: status || 'Unknown', bg: 'rgba(100, 116, 139, 0.1)', color: colors.core.slateLight };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '8px',
      background: style.bg,
      color: style.color,
      fontSize: '13px',
      fontWeight: 500,
    }}>
      {style.label}
    </span>
  );
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
};

const daysBetween = (dateA, dateB) => {
  return Math.abs(new Date(dateB) - new Date(dateA)) / 86400000;
};

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================
export default function AdviceGroupDashboard() {
  const { user } = useAuth();
  const { switchedToId, switchRole, navigationChain } = useRole();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [soaRequests, setSoaRequests] = useState([]);
  const [advisers, setAdvisers] = useState([]);
  const [stats, setStats] = useState({ activeSOAs: 0, completedMonth: 0, avgTurnaround: '—', activeAdvisers: 0 });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        // Set up role context from auth user
        const groupId = switchedToId || user?.advice_group_id;
        if (groupId) {
          // Fetch advice group details for role context
          try {
            const groupRes = await axiosInstance.get('/advice-groups');
            const groups = Array.isArray(groupRes.data) ? groupRes.data : (groupRes.data?.items || []);
            const current = groups.find(g => g.id === groupId);
            if (current && (navigationChain.length === 0 || navigationChain[navigationChain.length - 1].id !== groupId)) {
              switchRole('advice_group', groupId, current.name);
            }
          } catch (err) {
            console.error('Failed to load advice group:', err);
          }
        }

        // Fetch advisers and SOA requests in parallel (RLS scopes to tenant)
        const [advisersRes, soaRes] = await Promise.all([
          axiosInstance.get('/advisers'),
          axiosInstance.get('/advice-requests'),
        ]);

        const adviserList = Array.isArray(advisersRes.data) ? advisersRes.data : (advisersRes.data?.items || []);
        const soaList = Array.isArray(soaRes.data) ? soaRes.data : (soaRes.data?.items || []);

        // Sort SOA requests by createdAt descending
        soaList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        // Resolve client names for SOA requests
        const clientIds = [...new Set(soaList.map(r => r.client1Id).filter(Boolean))];
        const clientMap = {};
        if (clientIds.length > 0) {
          const clientResponses = await Promise.all(
            clientIds.map(id => axiosInstance.get(`/clients/${id}`).catch(() => null))
          );
          clientResponses.forEach(resp => {
            if (resp?.data) {
              clientMap[resp.data.id] = resp.data;
            }
          });
        }

        // Enrich SOA requests with client names
        const enrichedSOAs = soaList.map(req => {
          const client = clientMap[req.client1Id];
          const clientName = client
            ? `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client'
            : 'Client';
          return { ...req, _clientName: clientName };
        });

        setAdvisers(adviserList);
        setSoaRequests(enrichedSOAs);

        // Compute stats from real data
        const now = new Date();
        const activeSOAs = enrichedSOAs.filter(s => s.status !== 'Issued' && s.status !== 'Complete').length;
        const completedMonth = enrichedSOAs.filter(s => {
          if (s.status !== 'Issued' || !s.createdAt) return false;
          const d = new Date(s.createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;

        const completedSOAs = enrichedSOAs.filter(s => s.status === 'Issued' && s.createdAt && s.modifiedAt);
        let avgTurnaround = '—';
        if (completedSOAs.length > 0) {
          const totalDays = completedSOAs.reduce((sum, r) => sum + daysBetween(r.createdAt, r.modifiedAt), 0);
          avgTurnaround = Math.round(totalDays / completedSOAs.length) + ' days';
        }

        setStats({
          activeSOAs,
          completedMonth,
          avgTurnaround,
          activeAdvisers: adviserList.length,
        });
      } catch (error) {
        console.error('Dashboard load failed:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px 32px',
      display: 'flex',
      gap: '24px',
    }}>
      {/* Main Column */}
      <div style={{ flex: 1 }}>
        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '24px',
        }}>
          <StatCard
            icon={FileText}
            value={stats.activeSOAs}
            label="Active SOA Requests"
            iconColor={`linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(29, 78, 216, 0.2))`}
          />
          <StatCard
            icon={CheckCircle}
            value={stats.completedMonth}
            label="Completed This Month"
            iconColor={`linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))`}
          />
          <StatCard
            icon={Clock}
            value={stats.avgTurnaround}
            label="Avg. Turnaround Time"
            iconColor={`linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(8, 145, 178, 0.2))`}
          />
          <StatCard
            icon={Users}
            value={stats.activeAdvisers}
            label="Active Advisers"
            iconColor={`linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.2))`}
          />
        </div>

        {/* Recent SOA Requests Table */}
        <div style={{
          background: colors.core.white,
          borderRadius: '16px',
          border: `1px solid ${colors.core.greyLight}`,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 32px',
            borderBottom: `1px solid ${colors.core.greyLight}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: colors.core.navy,
              margin: 0,
            }}>
              Recent SOA Requests
            </h3>
            <Link to={createPageUrl('AdviceGroupSOARequests')} style={{
              fontSize: '14px',
              color: colors.accent.blue,
              textDecoration: 'none',
              fontWeight: 600,
            }}>
              View All →
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}>
              <thead>
                <tr style={{
                  borderBottom: `1px solid ${colors.core.greyLight}`,
                  background: colors.core.offWhite,
                }}>
                  {['CLIENT', 'STATUS', 'SUBMITTED'].map(header => (
                    <th key={header} style={{
                      padding: '16px 32px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: colors.core.slateLight,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {soaRequests.length > 0 ? soaRequests.slice(0, 5).map((req, idx) => (
                  <tr key={req.id || idx} style={{
                    borderBottom: `1px solid ${colors.core.greyLight}`,
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = colors.core.offWhite}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 32px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar initials={getInitials(req._clientName)} gradientIndex={idx} size={40} />
                        <div>
                          <div style={{ fontWeight: 600, color: colors.core.navy }}>{req._clientName}</div>
                          <div style={{ fontSize: '12px', color: colors.core.slateLight }}>{req.type || 'SOA Request'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 32px', fontSize: '14px' }}>
                      <StatusBadge status={req.status} />
                    </td>
                    <td style={{ padding: '16px 32px', fontSize: '14px', color: colors.core.slateLight }}>
                      {formatDate(req.createdAt)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: colors.core.grey, fontSize: '14px' }}>
                      No SOA requests yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
              <span style={{ fontWeight: 600, color: colors.core.navy }}>Custom Template</span>
              <span
                onClick={() => navigate(createPageUrl('AdviceGroupSOATemplate'))}
                style={{
                  marginLeft: 'auto',
                  display: 'inline-block',
                  background: colors.accent.blue,
                  color: colors.core.white,
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Edit
              </span>
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
            <Link to={createPageUrl('AdviceGroupAdvisers')} style={{
              fontSize: '13px',
              color: colors.accent.blue,
              textDecoration: 'none',
            }}>
              View All →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {advisers.length > 0 ? advisers.slice(0, 5).map((adv, idx) => {
              // TODO: confirm adviser API response includes user details (firstName, lastName, email)
              const name = `${adv.firstName || adv.first_name || ''} ${adv.lastName || adv.last_name || ''}`.trim() || adv.email || 'Adviser';
              const initials = getInitials(name);
              return (
                <div key={adv.id || idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingBottom: idx !== Math.min(advisers.length, 5) - 1 ? '16px' : 0,
                  borderBottom: idx !== Math.min(advisers.length, 5) - 1 ? `1px solid ${colors.core.greyLight}` : 'none',
                }}>
                  <Avatar initials={initials} gradientIndex={idx} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: colors.core.navy, fontSize: '14px' }}>
                      {name}
                    </div>
                    <div style={{ fontSize: '12px', color: colors.core.slateLight }}>
                      {adv.email || ''}
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
              { label: 'Edit SOA Template', icon: FileText, onClick: () => navigate(createPageUrl('AdviceGroupSOATemplate')) },
              { label: 'Invite New Adviser', icon: Users, onClick: () => navigate(createPageUrl('AdviceGroupAdvisers')) },
              // TODO: wire to report generation when built
              { label: 'Generate Report', icon: Download, onClick: () => toast.info('Report generation coming soon') },
            ].map((action, idx) => {
              const Icon = action.icon;
              return (
                <button key={idx} onClick={action.onClick} style={{
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
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.core.offWhite}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Icon size={16} color={colors.core.slateLight} />
                  <span style={{ flex: 1 }}>{action.label}</span>
                  <ChevronRight size={16} color={colors.core.slateLight} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
