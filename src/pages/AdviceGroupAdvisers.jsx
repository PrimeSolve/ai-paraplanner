import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, User, HelpCircle, LogOut, ChevronRight, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import AdviceGroupSidebar from '../components/advicegroup/AdviceGroupSidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdviceGroupAdvisers() {
  const [advisers, setAdvisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [sortBy, setSortBy] = useState('Most Active');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.advice_group_id) {
        const data = await base44.entities.User.filter({
          advice_group_id: currentUser.advice_group_id,
          user_type: 'adviser'
        });
        setAdvisers(data);
      }
    } catch (error) {
      console.error('Failed to load advisers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    try {
      await base44.users.inviteUser(inviteEmail, 'user');
      toast.success('Adviser invited successfully');
      setInviteEmail('');
      setShowInvite(false);
      loadData();
    } catch (error) {
      toast.error('Failed to invite adviser');
    }
  };

  const filteredAdvisers = advisers.filter(a =>
    a.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avatarGradients = [
    'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f97316, #ec4899)',
    'linear-gradient(135deg, #06b6d4, #0891b2)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ef4444, #dc2626)',
  ];

  const getAvatarGradient = (index) => avatarGradients[index % avatarGradients.length];

  const stats = [
    { label: 'Total Advisers', value: advisers.length },
    { label: 'Active', value: advisers.filter(a => a.status === 'active' || !a.status).length },
    { label: 'Pending Invite', value: advisers.filter(a => a.status === 'pending').length },
    { label: 'SOAs This Month', value: 47 }
  ];

  const totalPages = Math.ceil(filteredAdvisers.length / itemsPerPage);
  const paginatedAdvisers = filteredAdvisers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      coral: '#f97316',
      purple: '#8b5cf6',
      pink: '#ec4899',
      cyan: '#06b6d4',
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      background: colors.core.offWhite,
    }}>
      <AdviceGroupSidebar currentPage="advisers" />

      <div style={{
        marginLeft: '260px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          background: colors.core.white,
          padding: '20px 32px',
          borderBottom: `1px solid ${colors.core.greyLight}`,
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '4px' }}>
              <Link to={createPageUrl('AdviceGroupDashboard')} style={{ color: colors.accent.blue, textDecoration: 'none' }}>Dashboard</Link>
              <ChevronRight size={16} color={colors.core.grey} />
              <span style={{ color: colors.core.slateLight }}>Advisers</span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: colors.core.navy, margin: 0 }}>Advisers</h1>
            <p style={{ fontSize: '14px', color: colors.core.slateLight, marginTop: '4px', margin: 0 }}>Manage advisers in the {user?.advice_group_name || 'advice group'} network</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Button variant="outline" style={{ padding: '8px 16px', borderRadius: '6px', border: `1px solid ${colors.core.greyLight}`, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} />
              Export
            </Button>
            <Button onClick={() => setShowInvite(true)} style={{
              background: colors.accent.blue,
              color: colors.core.white,
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Plus size={16} />
              Invite Adviser
            </Button>
          </div>
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
          padding: '32px',
        }}>
        
        {/* Stats Pills */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}>
          {stats.map((stat, idx) => (
            <div key={idx} style={{
              background: colors.core.white,
              border: `1px solid ${colors.core.greyLight}`,
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '13px',
              color: colors.core.navy,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>{stat.value}</span>
              {stat.label}
            </div>
          ))}
        </div>

        {/* Search and Filters - Above Table */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
        }}>
          <div style={{ position: 'relative', width: '200px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: colors.core.slateLight }} />
            <Input
              placeholder="Search advisers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', height: '36px' }}
            />
          </div>
          
          <select style={{
            height: '36px',
            padding: '8px 12px',
            border: `1px solid ${colors.core.greyLight}`,
            borderRadius: '6px',
            fontSize: '14px',
            color: colors.core.navy,
            background: colors.core.white,
            cursor: 'pointer',
          }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All Statuses</option>
            <option>Active</option>
            <option>Pending</option>
          </select>

          <select style={{
            height: '36px',
            padding: '8px 12px',
            border: `1px solid ${colors.core.greyLight}`,
            borderRadius: '6px',
            fontSize: '14px',
            color: colors.core.navy,
            background: colors.core.white,
            cursor: 'pointer',
          }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option>Most Active</option>
            <option>Least Active</option>
            <option>Name A-Z</option>
          </select>
        </div>

        {/* Advisers Table Card */}
        <div style={{
          background: colors.core.white,
          borderRadius: '16px',
          border: `1px solid ${colors.core.greyLight}`,
          overflow: 'hidden',
        }}>

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
                {['ADVISER', 'AR NUMBER', 'STATUS', 'ACTIVE SOAs', 'THIS MONTH', 'TOTAL SOAs', 'ACTIONS'].map(header => (
                  <th key={header} style={{
                    padding: '12px 16px',
                    textAlign: header !== 'ADVISER' && header !== 'STATUS' && header !== 'ACTIONS' ? 'center' : 'left',
                    fontSize: '11px',
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
              {paginatedAdvisers.map((adviser, idx) => {
                const isPending = adviser.status === 'pending';
                return (
                  <tr key={adviser.id} style={{
                    borderBottom: `1px solid ${colors.core.greyLight}`,
                    background: isPending ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => !isPending && (e.currentTarget.style.background = colors.core.offWhite)}
                  onMouseLeave={(e) => !isPending && (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.05)')}
                  >
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: getAvatarGradient(idx),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colors.core.white,
                          fontWeight: 600,
                          fontSize: '14px',
                        }}>
                          {adviser.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || adviser.email?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: colors.core.navy }}>{adviser.full_name || adviser.email}</div>
                          <div style={{ fontSize: '12px', color: colors.core.slateLight }}>{adviser.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      color: colors.core.navy,
                      textAlign: 'center',
                    }}>
                      {isPending ? '—' : '08128756'}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                    }}>
                      {isPending ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          background: 'rgba(245, 158, 11, 0.1)',
                          color: '#d97706',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></span>
                          Pending Invite
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: colors.accent.success,
                          fontSize: '12px',
                          fontWeight: 600,
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.accent.success }}></span>
                          Active
                        </span>
                      )}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      color: colors.core.navy,
                      fontWeight: 500,
                      textAlign: 'center',
                    }}>
                      {isPending ? '—' : '5'}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      color: colors.core.navy,
                      fontWeight: 500,
                      textAlign: 'center',
                    }}>
                      {isPending ? '—' : '12'}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      color: colors.core.navy,
                      fontWeight: 500,
                      textAlign: 'center',
                    }}>
                      {isPending ? '—' : '89'}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                    }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isPending ? (
                          <>
                            <Button size="sm" variant="outline" style={{
                              height: '32px',
                              padding: '4px 12px',
                              fontSize: '13px',
                            }}>Resend</Button>
                            <Button size="sm" style={{
                              background: colors.accent.error,
                              color: colors.core.white,
                              height: '32px',
                              padding: '4px 12px',
                              fontSize: '13px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}>Cancel</Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" style={{
                              height: '32px',
                              padding: '4px 12px',
                              fontSize: '13px',
                            }}>View</Button>
                            <Button size="sm" style={{
                              background: colors.accent.blue,
                              color: colors.core.white,
                              height: '32px',
                              padding: '4px 12px',
                              fontSize: '13px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}>SOAs</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${colors.core.greyLight}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: colors.core.slateLight,
        }}>
          <div>
            Showing {filteredAdvisers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAdvisers.length)} of {filteredAdvisers.length} advisers
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '6px 10px',
                border: `1px solid ${colors.core.greyLight}`,
                borderRadius: '4px',
                background: colors.core.white,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
                fontSize: '12px',
              }}
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              if (totalPages <= 5) return i + 1;
              if (currentPage <= 3) return i + 1;
              if (currentPage >= totalPages - 2) return totalPages - 4 + i;
              return currentPage - 2 + i;
            }).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  padding: '6px 10px',
                  minWidth: '32px',
                  border: page === currentPage ? 'none' : `1px solid ${colors.core.greyLight}`,
                  borderRadius: '4px',
                  background: page === currentPage ? colors.accent.blue : colors.core.white,
                  color: page === currentPage ? colors.core.white : colors.core.navy,
                  fontWeight: page === currentPage ? 600 : 500,
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 10px',
                border: `1px solid ${colors.core.greyLight}`,
                borderRadius: '4px',
                background: colors.core.white,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
                fontSize: '12px',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Adviser</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: colors.core.navy }}>Email Address</label>
              <Input
                type="email"
                placeholder="adviser@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{ height: '40px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => { setShowInvite(false); setInviteEmail(''); }}>
                Cancel
              </Button>
              <Button onClick={handleInvite} style={{
                background: colors.accent.blue,
                color: colors.core.white,
                border: 'none',
              }}>
                Send Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
      </div>
    </div>
    );
  }
}