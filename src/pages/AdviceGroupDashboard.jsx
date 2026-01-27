import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  FileText, 
  Clock, 
  Users, 
  CheckCircle, 
  ChevronRight, 
  Edit,
  LayoutGrid,
  Tag,
  PlusCircle,
  Settings,
  Download,
  User,
  HelpCircle,
  LogOut
} from 'lucide-react';

// ============================================
// DESIGN TOKENS
// ============================================
const colors = {
  sidebar: {
    bg: '#0f172a',
    hover: '#1e293b',
    active: 'rgba(59, 130, 246, 0.15)',
    text: '#94a3b8',
    textActive: '#ffffff',
    accent: '#3b82f6',
  },
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
    coral: '#f97316',
    purple: '#8b5cf6',
    pink: '#ec4899',
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
// MOCK DATA
// ============================================
const mockSoaRequests = [
  { 
    id: 1, 
    client: 'James & Emma Wilson', 
    clientType: 'Comprehensive Advice',
    adviser: 'Michael Ross', 
    status: 'In Progress', 
    priority: 'HIGH', 
    submitted: '2 hours ago', 
    initials: 'JW', 
    advInitials: 'MR',
    avatarGradient: 0,
    advAvatarGradient: 3
  },
  { 
    id: 2, 
    client: 'Sarah Chen', 
    clientType: 'Insurance Review',
    adviser: 'Jessica Taylor', 
    status: 'Review', 
    priority: 'NORMAL', 
    submitted: '5 hours ago', 
    initials: 'SC', 
    advInitials: 'JT',
    avatarGradient: 2,
    advAvatarGradient: 1
  },
  { 
    id: 3, 
    client: 'David & Lisa Park', 
    clientType: 'Retirement Planning',
    adviser: 'Andrew Walsh', 
    status: 'Pending', 
    priority: 'NORMAL', 
    submitted: 'Yesterday', 
    initials: 'DP', 
    advInitials: 'AW',
    avatarGradient: 5,
    advAvatarGradient: 4
  },
  { 
    id: 4, 
    client: 'Robert Brown', 
    clientType: 'Wealth Accumulation',
    adviser: 'Michael Ross', 
    status: 'In Progress', 
    priority: 'HIGH', 
    submitted: 'Yesterday', 
    initials: 'RB', 
    advInitials: 'MR',
    avatarGradient: 6,
    advAvatarGradient: 3
  },
  { 
    id: 5, 
    client: 'Karen Nguyen', 
    clientType: 'Super Consolidation',
    adviser: 'Nicole Harris', 
    status: 'Pending', 
    priority: 'NORMAL', 
    submitted: '2 days ago', 
    initials: 'KN', 
    advInitials: 'NH',
    avatarGradient: 3,
    advAvatarGradient: 2
  },
];

const adviserActivity = [
  { name: 'Michael Ross', initials: 'MR', active: 3, completed: 12, total: 15, gradient: 3 },
  { name: 'Jessica Taylor', initials: 'JT', active: 2, completed: 10, total: 12, gradient: 1 },
  { name: 'Andrew Walsh', initials: 'AW', active: 4, completed: 7, total: 11, gradient: 4 },
];

// ============================================
// SIDEBAR COMPONENT
// ============================================
const Sidebar = ({ currentPage }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, badge: null },
    { id: 'soa-requests', label: 'SOA Requests', icon: FileText, badge: '12' },
    { id: 'completed', label: 'Completed SOAs', icon: CheckCircle, badge: null },
  ];

  const teamItems = [
    { id: 'advisers', label: 'Advisers', icon: Users, badge: '8' },
  ];

  const configItems = [
    { id: 'template', label: 'SOA Template', icon: FileText, badge: null },
    { id: 'risk-profiles', label: 'Risk Profiles', icon: Tag, badge: null },
    { id: 'portfolios', label: 'Model Portfolios', icon: PlusCircle, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  const pageMap = {
    'dashboard': 'AdviceGroupDashboard',
    'soa-requests': 'AdviceGroupSOARequests',
    'completed': 'AdviceGroupCompleted',
    'advisers': 'AdviceGroupAdvisers',
    'template': 'AdviceGroupSOATemplate',
    'risk-profiles': 'AdviceGroupRiskProfiles',
    'portfolios': 'AdviceGroupModelPortfolios',
    'settings': 'AdviceGroupSettings',
  };

  const NavItem = ({ item, isActive }) => {
    const Icon = item.icon;
    return (
      <Link
        to={createPageUrl(pageMap[item.id])}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          borderRadius: '10px',
          color: isActive ? colors.sidebar.accent : colors.sidebar.text,
          backgroundColor: isActive ? colors.sidebar.active : 'transparent',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'all 0.2s ease',
          marginBottom: '4px',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = colors.sidebar.hover;
            e.currentTarget.style.color = colors.sidebar.textActive;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = colors.sidebar.text;
          }
        }}
      >
        <Icon size={20} />
        <span style={{ flex: 1 }}>{item.label}</span>
        {item.badge && (
          <span style={{
            padding: '2px 8px',
            backgroundColor: colors.sidebar.accent,
            color: 'white',
            fontSize: '11px',
            fontWeight: 700,
            borderRadius: '10px',
          }}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const NavSection = ({ title, items }) => (
    <div style={{ marginBottom: '24px' }}>
      {title && (
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: colors.sidebar.text,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          padding: '0 12px',
          marginBottom: '8px',
        }}>
          {title}
        </div>
      )}
      {items.map(item => (
        <NavItem key={item.id} item={item} isActive={currentPage === item.id} />
      ))}
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '260px',
      height: '100vh',
      background: colors.sidebar.bg,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{
        padding: '24px 20px',
        borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: `linear-gradient(135deg, ${colors.accent.blue}, ${colors.accent.blueDeep})`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: 'white',
            fontSize: '16px',
          }}>
            AI
          </div>
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: '16px',
              color: 'white',
            }}>
              AI Paraplanner
            </div>
            <div style={{
              fontSize: '12px',
              color: colors.sidebar.text,
            }}>
              Advice Group Portal
            </div>
          </div>
        </div>
      </div>

      <nav style={{
        flex: 1,
        padding: '20px 12px',
        overflowY: 'auto',
      }}>
        <NavSection title="OVERVIEW" items={navItems} />
        <NavSection title="TEAM" items={teamItems} />
        <NavSection title="CONFIGURATION" items={configItems} />
      </nav>

      <div style={{
        padding: '16px',
        borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: `linear-gradient(135deg, ${colors.accent.coral}, ${colors.accent.pink})`,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: 'white',
            fontSize: '14px',
          }}>
            PS
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'white',
            }}>
              PrimeSolve Group
            </div>
            <div style={{
              fontSize: '12px',
              color: colors.sidebar.text,
            }}>
              Group Admin
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = ({ icon: Icon, value, label, trend, iconColor }) => (
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
    {trend && (
      <div style={{
        fontSize: '12px',
        color: colors.accent.success,
        marginBottom: '8px',
        fontWeight: 600,
      }}>
        {trend}
      </div>
    )}
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
    background: avatarGradients[gradientIndex],
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
  const styles = {
    'In Progress': { bg: 'rgba(59, 130, 246, 0.1)', color: colors.accent.blue },
    'Review': { bg: 'rgba(139, 92, 246, 0.1)', color: colors.accent.purple },
    'Pending': { bg: 'rgba(245, 158, 11, 0.1)', color: colors.accent.warning },
    'Completed': { bg: 'rgba(16, 185, 129, 0.1)', color: colors.accent.success },
  };
  const style = styles[status] || styles['Pending'];

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
      • {status}
    </span>
  );
};

// ============================================
// PRIORITY BADGE COMPONENT
// ============================================
const PriorityBadge = ({ priority }) => {
  const styles = {
    'HIGH': { bg: 'rgba(239, 68, 68, 0.1)', color: colors.accent.error },
    'NORMAL': { bg: 'rgba(100, 116, 139, 0.1)', color: colors.core.slateLight },
    'LOW': { bg: 'rgba(59, 130, 246, 0.1)', color: colors.accent.blue },
  };
  const style = styles[priority] || styles['NORMAL'];

  return (
    <span style={{
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: '8px',
      background: style.bg,
      color: style.color,
      fontSize: '12px',
      fontWeight: 700,
    }}>
      {priority}
    </span>
  );
};

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================
export default function AdviceGroupDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      background: colors.core.offWhite,
    }}>
      <Sidebar currentPage="dashboard" />

      <div style={{
        marginLeft: '260px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header with User Profile */}
        <div style={{
          background: colors.core.white,
          padding: '4px 32px',
          borderBottom: `1px solid ${colors.core.greyLight}`,
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  background: colors.core.white,
                  border: `1px solid ${colors.core.greyLight}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}>
                  {user.profile_image_url ? (
                    <img src={user.profile_image_url} alt="Profile" style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                    }} />
                  ) : (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: `linear-gradient(135deg, ${colors.accent.purple}, ${colors.accent.blueDeep})`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.core.white,
                      fontSize: '12px',
                      fontWeight: 700,
                    }}>
                      {(user.display_name || user.full_name)?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span style={{ color: colors.core.navy }}>{user.display_name || user.full_name || user.email}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={{ width: '224px' }}>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('AdviceGroupMyProfile')} style={{ cursor: 'pointer' }}>
                    <User size={16} style={{ marginRight: '12px' }} />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle size={16} style={{ marginRight: '12px' }} />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => base44.auth.logout()}>
                  <LogOut size={16} style={{ marginRight: '12px' }} />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          padding: '24px 32px',
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
                value="12" 
                label="Active SOA Requests" 
                trend="↑ 15%"
                iconColor={`linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(29, 78, 216, 0.2))`}
              />
              <StatCard 
                icon={CheckCircle} 
                value="47" 
                label="Completed This Month" 
                trend="↑ 8%"
                iconColor={`linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))`}
              />
              <StatCard 
                icon={Clock} 
                value="2.3d" 
                label="Avg. Turnaround Time"
                iconColor={`linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(8, 145, 178, 0.2))`}
              />
              <StatCard 
                icon={Users} 
                value="8" 
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
                <a href="#" style={{
                  fontSize: '14px',
                  color: colors.accent.blue,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}>
                  View All →
                </a>
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
                      {['CLIENT', 'ADVISER', 'STATUS', 'PRIORITY', 'SUBMITTED'].map(header => (
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
                    {mockSoaRequests.map((req) => (
                      <tr key={req.id} style={{
                        borderBottom: `1px solid ${colors.core.greyLight}`,
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = colors.core.offWhite}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{
                          padding: '16px 32px',
                          fontSize: '14px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Avatar initials={req.initials} gradientIndex={req.avatarGradient} size={40} />
                            <div>
                              <div style={{ fontWeight: 600, color: colors.core.navy }}>{req.client}</div>
                              <div style={{ fontSize: '12px', color: colors.core.slateLight }}>{req.clientType}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{
                          padding: '16px 32px',
                          fontSize: '14px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Avatar initials={req.advInitials} gradientIndex={req.advAvatarGradient} size={40} />
                            <div style={{ fontWeight: 600, color: colors.core.navy }}>{req.adviser}</div>
                          </div>
                        </td>
                        <td style={{
                          padding: '16px 32px',
                          fontSize: '14px',
                        }}>
                          <StatusBadge status={req.status} />
                        </td>
                        <td style={{
                          padding: '16px 32px',
                          fontSize: '14px',
                        }}>
                          <PriorityBadge priority={req.priority} />
                        </td>
                        <td style={{
                          padding: '16px 32px',
                          fontSize: '14px',
                          color: colors.core.slateLight,
                        }}>
                          {req.submitted}
                        </td>
                      </tr>
                    ))}
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
                  <span style={{
                    marginLeft: 'auto',
                    display: 'inline-block',
                    background: colors.accent.blue,
                    color: colors.core.white,
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}>
                    Edit
                  </span>
                </div>
                <div style={{
                  fontSize: '13px',
                  color: colors.core.slateLight,
                  marginBottom: '8px',
                }}>
                  26 of 35 sections configured
                </div>
                <div style={{
                  fontSize: '12px',
                  color: colors.core.slateLight,
                }}>
                  Last updated 3 days ago by Sarah Mitchell
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
                <a href="#" style={{
                  fontSize: '13px',
                  color: colors.accent.blue,
                  textDecoration: 'none',
                }}>
                  View All →
                </a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {adviserActivity.map((adviser, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingBottom: idx !== adviserActivity.length - 1 ? '16px' : 0,
                    borderBottom: idx !== adviserActivity.length - 1 ? `1px solid ${colors.core.greyLight}` : 'none',
                  }}>
                    <Avatar initials={adviser.initials} gradientIndex={adviser.gradient} size={40} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: colors.core.navy, fontSize: '14px' }}>
                        {adviser.name}
                      </div>
                      <div style={{ fontSize: '12px', color: colors.core.slateLight }}>
                        {adviser.active} active, {adviser.completed} completed
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: colors.core.navy, fontSize: '16px' }}>
                        {adviser.total}
                      </div>
                      <div style={{ fontSize: '11px', color: colors.core.slateLight }}>
                        This month
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Clients */}
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
                Top Clients
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { name: 'James & Emma Wilson', adviser: 'Michael Ross', status: 'Active' },
                  { name: 'Sarah Chen', adviser: 'Jessica Taylor', status: 'Active' },
                  { name: 'David & Lisa Park', adviser: 'Andrew Walsh', status: 'Prospect' },
                ].map((client, idx) => (
                  <div key={idx} style={{
                    paddingBottom: '16px',
                    borderBottom: idx !== 2 ? `1px solid ${colors.core.greyLight}` : 'none',
                  }}>
                    <div style={{ fontWeight: 600, color: colors.core.navy, fontSize: '13px', marginBottom: '4px' }}>
                      {client.name}
                    </div>
                    <div style={{ fontSize: '12px', color: colors.core.slateLight, marginBottom: '6px' }}>
                      Adviser: {client.adviser}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: client.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: client.status === 'Active' ? colors.accent.success : colors.accent.blue,
                      fontSize: '11px',
                      fontWeight: 600,
                    }}>
                      {client.status}
                    </span>
                  </div>
                ))}
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
                  { label: 'Edit SOA Template', icon: FileText },
                  { label: 'Invite New Adviser', icon: Users },
                  { label: 'Generate Report', icon: Download },
                ].map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <a key={idx} href="#" style={{
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
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}