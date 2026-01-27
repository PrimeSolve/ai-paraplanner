import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, User, HelpCircle, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import AdviceGroupSidebar from '../components/advicegroup/AdviceGroupSidebar';

export default function AdviceGroupAdvisers() {
  const [advisers, setAdvisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);

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
          padding: '32px',
        }}>

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
            Advisers
          </h3>
          <Button onClick={() => setShowInvite(!showInvite)} style={{
            background: colors.accent.blue,
            color: colors.core.white,
            padding: '8px 16px',
            borderRadius: '8px',
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

        {showInvite && (
          <div style={{
            padding: '20px 32px',
            borderBottom: `1px solid ${colors.core.greyLight}`,
            background: colors.core.offWhite,
          }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Input
                type="email"
                placeholder="adviser@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button onClick={handleInvite} style={{
                background: colors.accent.blue,
                color: colors.core.white,
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}>
                Send Invite
              </Button>
            </div>
          </div>
        )}

        <div style={{ padding: '20px 32px', borderBottom: `1px solid ${colors.core.greyLight}` }}>
          <div style={{ position: 'relative', maxWidth: '300px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: colors.core.slateLight }} />
            <Input
              placeholder="Search advisers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
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
                {['ADVISER', 'CLIENTS', 'ACTIVE SOAs', 'STATUS', 'ACTIONS'].map(header => (
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
              {filteredAdvisers.map((adviser) => (
                <tr key={adviser.id} style={{
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
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: `linear-gradient(135deg, ${colors.accent.blue}, ${colors.accent.blueDeep})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.core.white,
                        fontWeight: 600,
                        fontSize: '14px',
                      }}>
                        {adviser.full_name?.charAt(0) || adviser.email?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: colors.core.navy }}>{adviser.full_name || adviser.email}</div>
                        <div style={{ fontSize: '12px', color: colors.core.slateLight }}>{adviser.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{
                    padding: '16px 32px',
                    fontSize: '14px',
                    color: colors.core.navy,
                  }}>
                    12
                  </td>
                  <td style={{
                    padding: '16px 32px',
                    fontSize: '14px',
                    color: colors.core.navy,
                  }}>
                    3
                  </td>
                  <td style={{
                    padding: '16px 32px',
                    fontSize: '14px',
                  }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: colors.accent.success,
                      fontSize: '12px',
                      fontWeight: 600,
                    }}>
                      Active
                    </span>
                  </td>
                  <td style={{
                    padding: '16px 32px',
                    fontSize: '14px',
                  }}>
                    <Button size="sm" variant="outline">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      </div>
      </div>
      );
}