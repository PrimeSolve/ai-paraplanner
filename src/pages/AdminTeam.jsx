import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import axiosInstance from '@/api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDate, formatRelativeDate } from '../utils/dateUtils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  ChevronDown,
  Users,
  Shield,
  FileText,
  Send,
  X,
  MoreVertical,
  Loader2,
  Mail,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminTeam() {
  const navigate = useNavigate();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [selectedRole, setSelectedRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [sendingWelcomeEmailId, setSendingWelcomeEmailId] = useState(null);

  useEffect(() => {
    loadTeam();
  }, []);

  const mapRole = (roleValue) => {
    if (roleValue === 0 || roleValue === '0' || roleValue === 'admin' || roleValue === 'platformadmin') return 'admin';
    if (roleValue === 1 || roleValue === '1' || roleValue === 'tenantadmin' || roleValue === 'advicegroup' || roleValue === 'advice_group') return 'advice_group';
    if (roleValue === 2 || roleValue === '2' || roleValue === 3 || roleValue === '3' || roleValue === 'adviser' || roleValue === 'advisor' || roleValue === 'supportstaff') return 'adviser';
    if (roleValue === 4 || roleValue === '4' || roleValue === 'client') return 'client';
    return 'user';
  };

  const loadTeam = async () => {
    try {
      const [users, admins] = await Promise.all([
        base44.entities.User.list('-created_date', 100),
        base44.entities.Admin.list('-created_date', 100)
      ]);

      console.log('[AdminTeam] Raw API response - admins:', admins);
      console.log('[AdminTeam] Raw API response - users:', users);

      const teamWithStats = admins.map(admin => {
        const user = users.find(u => u.id === admin.user_id);
        console.log('[AdminTeam] admin record:', admin, '| matched user:', user);
        const rawRole = admin.role ?? user?.role;
        return {
          id: admin.id,
          email: admin.email,
          full_name: user?.full_name || `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'No name',
          role: mapRole(rawRole),
          status: admin.status || (user ? 'active' : 'pending'),
          created_at: admin.created_at || user?.created_at,
        };
      });

      setTeam(teamWithStats);
    } catch (error) {
      console.error('Failed to load team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWelcomeEmail = async (member) => {
    setSendingWelcomeEmailId(member.id);
    try {
      await axiosInstance.post(`/users/${member.id}/send-welcome-email`);
      toast.success('Welcome email sent successfully');
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      toast.error('Failed to send welcome email. Please try again.');
    } finally {
      setSendingWelcomeEmailId(null);
    }
  };

  const handleEditMember = (member) => {
    navigate(createPageUrl('AdminTeamMemberProfile') + '?id=' + member.id);
  };

  const handleRemoveMember = async () => {
    if (!memberToDelete) return;

    try {
      await base44.entities.Admin.delete(memberToDelete.id);
      toast.success('Team member removed');
      setMemberToDelete(null);
      await loadTeam();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const validateForm = () => {
    let valid = true;
    setEmailError('');
    setFirstNameError('');
    setLastNameError('');

    if (!inviteEmail.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) {
      setEmailError('Please enter a valid email address');
      valid = false;
    }

    if (!inviteFirstName.trim()) {
      setFirstNameError('First name is required');
      valid = false;
    }

    if (!inviteLastName.trim()) {
      setLastNameError('Last name is required');
      valid = false;
    }

    return valid;
  };

  const handleSaveMember = async () => {
    if (!validateForm()) return;

    const fullName = `${inviteFirstName.trim()} ${inviteLastName.trim()}`;

    if (editingMember) {
      try {
        setInviting(true);
        await base44.entities.Admin.update(editingMember.id, {
          email: inviteEmail,
          first_name: inviteFirstName.trim(),
          last_name: inviteLastName.trim()
        });
        toast.success('Team member updated');
        setShowInviteModal(false);
        resetForm();
        await loadTeam();
      } catch (error) {
        toast.error('Something went wrong. Please try again.');
      } finally {
        setInviting(false);
      }
      return;
    }

    try {
      setInviting(true);
      setEmailError('');

      await axiosInstance.post('/users', {
        email: inviteEmail.trim(),
        fullName: fullName,
        role: selectedRole === 'admin' ? 'Admin' : 'Paraplanner'
      });

      setShowInviteModal(false);
      toast.success('Invite sent successfully');
      resetForm();
      await loadTeam();
    } catch (error) {
      if (error.response?.status === 400) {
        setEmailError('A team member with this email already exists');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setInviting(false);
    }
  };

  const resetForm = () => {
    setInviteEmail('');
    setInviteFirstName('');
    setInviteLastName('');
    setSelectedRole('user');
    setEditingMember(null);
    setEmailError('');
    setFirstNameError('');
    setLastNameError('');
  };

  const getInitials = (name, email) => {
    if (name && name !== 'No name') {
      const parts = name.trim().split(' ').filter(Boolean);
      if (parts.length > 1) {
        const first = parts[0][0];
        const last = parts[parts.length - 1][0];
        if (first && last) return `${first}${last}`.toUpperCase();
      }
      if (parts.length === 1 && parts[0][0]) return parts[0][0].toUpperCase();
    }
    return email?.charAt(0)?.toUpperCase() || '?';
  };

  const avatarColors = [
    '#ec4899', '#22d3ee', '#f97316', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444', '#06b6d4'
  ];

  const getAvatarColor = (email) => {
    const index = (email?.charCodeAt(0) || 0) % avatarColors.length;
    return avatarColors[index];
  };

  const filteredTeam = team.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' ||
                        (roleFilter === 'admin' && member.role === 'admin') ||
                        (roleFilter === 'user' && member.role !== 'admin');
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: team.length,
    admins: team.filter(m => m.role === 'admin').length,
    paraplanners: team.filter(m => m.role !== 'admin').length,
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', fontFamily: "'DM Sans', sans-serif" }}>

      {/* TOPBAR / Breadcrumb */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px' }}>🏠</span>
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>›</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Team</span>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          background: '#e2e8f0',
          color: '#475569',
          padding: '2px 8px',
          borderRadius: '999px',
          marginLeft: '4px',
        }}>
          {stats.total} member{stats.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {/* Team members */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}>
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #0d9488, #14b8a6)' }} />
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(13,148,136,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users size={20} color="#0d9488" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Team Members</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a' }}>{stats.total}</div>
          </div>
        </div>

        {/* Admins */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}>
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }} />
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(37,99,235,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={20} color="#2563eb" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Admins</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a' }}>{stats.admins}</div>
          </div>
        </div>

        {/* Paraplanners */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}>
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #7c3aed, #8b5cf6)' }} />
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(139,92,246,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={20} color="#8b5cf6" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Paraplanners</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a' }}>{stats.paraplanners}</div>
          </div>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '360px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '36px',
              paddingRight: '12px',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#0f172a',
              background: '#f8fafc',
              outline: 'none',
            }}
          />
        </div>

        {/* Role select */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            height: '38px',
            padding: '0 32px 0 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#475569',
            background: '#f8fafc',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">Paraplanner</option>
        </select>

        {/* Status select */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            height: '38px',
            padding: '0 32px 0 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#475569',
            background: '#f8fafc',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending Invite</option>
        </select>

        {/* Results count */}
        <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
          {filteredTeam.length} result{filteredTeam.length !== 1 ? 's' : ''}
        </span>

        <div style={{ flex: 1 }} />

        {/* Add Member button */}
        <button
          onClick={() => {
            resetForm();
            setShowInviteModal(true);
          }}
          style={{
            height: '38px',
            padding: '0 20px',
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <Plus size={15} />
          Add Member
        </button>
      </div>

      {/* TABLE */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
          padding: '0 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}>
          {['MEMBER', 'ROLE', 'STATUS', 'JOINED', 'ACTIONS'].map((col) => (
            <div key={col} style={{
              padding: '12px 0',
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        {filteredTeam.length > 0 ? filteredTeam.map((member) => (
          <div
            key={member.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              padding: '0 24px',
              borderBottom: '1px solid #f1f5f9',
              alignItems: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {/* MEMBER */}
            <div style={{ padding: '14px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: getAvatarColor(member.email),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {getInitials(member.full_name, member.email)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {member.full_name || 'No name'}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {member.email}
                </div>
              </div>
            </div>

            {/* ROLE */}
            <div style={{ padding: '14px 0' }}>
              {member.role === 'admin' ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'rgba(30,136,229,0.1)',
                  color: '#85B7EB',
                }}>
                  <FileText size={12} />
                  Admin
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'rgba(140,80,255,0.1)',
                  color: '#B794FF',
                }}>
                  <FileText size={12} />
                  Paraplanner
                </span>
              )}
            </div>

            {/* STATUS */}
            <div style={{ padding: '14px 0' }}>
              {member.status === 'pending' ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'rgba(245,158,11,0.1)',
                  color: '#f59e0b',
                }}>
                  Pending Invite
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'rgba(16,185,129,0.1)',
                  color: '#10b981',
                }}>
                  Active
                </span>
              )}
            </div>

            {/* JOINED */}
            <div style={{ padding: '14px 0' }}>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                {formatDate(member.created_at)}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                {formatRelativeDate(member.created_at)}
              </div>
            </div>

            {/* ACTIONS */}
            <div style={{ padding: '14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => handleEditMember(member)}
                style={{
                  height: '30px',
                  padding: '0 14px',
                  background: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                View
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button style={{
                    width: '30px',
                    height: '30px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                  }}>
                    <MoreVertical size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => handleSendWelcomeEmail(member)}
                    disabled={sendingWelcomeEmailId === member.id}
                  >
                    {sendingWelcomeEmailId === member.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Send Welcome Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleEditMember(member)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setMemberToDelete(member)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )) : (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No team members found
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid #e2e8f0',
          fontSize: '12px',
          color: '#94a3b8',
        }}>
          Showing {filteredTeam.length > 0 ? 1 : 0}–{filteredTeam.length} of {filteredTeam.length} members
        </div>
      </div>

      {/* ADD MEMBER MODAL — dark glassmorphism */}
      <Dialog open={showInviteModal} onOpenChange={(open) => {
        if (!open) {
          setShowInviteModal(false);
          setInviting(false);
          resetForm();
        }
      }}>
        <DialogContent
          className="sm:max-w-md"
          style={{
            background: 'rgba(15,23,42,0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '18px',
            color: '#f1f5f9',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
              {editingMember ? 'Edit Team Member' : 'Add Team Member'}
            </DialogTitle>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingTop: '8px' }}>
            {/* First name + Last name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="John"
                  value={inviteFirstName}
                  onChange={(e) => {
                    setInviteFirstName(e.target.value);
                    if (firstNameError) setFirstNameError('');
                  }}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px',
                    background: 'rgba(255,255,255,0.06)',
                    border: firstNameError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#f1f5f9',
                    outline: 'none',
                  }}
                />
                {firstNameError && (
                  <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{firstNameError}</p>
                )}
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Smith"
                  value={inviteLastName}
                  onChange={(e) => {
                    setInviteLastName(e.target.value);
                    if (lastNameError) setLastNameError('');
                  }}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px',
                    background: 'rgba(255,255,255,0.06)',
                    border: lastNameError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#f1f5f9',
                    outline: 'none',
                  }}
                />
                {lastNameError && (
                  <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{lastNameError}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  background: 'rgba(255,255,255,0.06)',
                  border: emailError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#f1f5f9',
                  outline: 'none',
                }}
              />
              {emailError && (
                <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{emailError}</p>
              )}
            </div>

            {/* Role select */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#f1f5f9',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="admin" style={{ background: '#1e293b' }}>Admin</option>
                <option value="user" style={{ background: '#1e293b' }}>Paraplanner</option>
              </select>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
              <button
                disabled={inviting}
                onClick={() => {
                  setShowInviteModal(false);
                  resetForm();
                }}
                style={{
                  height: '38px',
                  padding: '0 18px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#cbd5e1',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMember}
                disabled={inviting}
                style={{
                  height: '38px',
                  padding: '0 20px',
                  background: inviting ? '#475569' : 'linear-gradient(135deg, #0d9488, #0f766e)',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: inviting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {inviting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Sending...
                  </>
                ) : editingMember ? (
                  'Save Changes'
                ) : (
                  <>
                    Invite Member
                    <span style={{ fontSize: '14px' }}>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal — also dark glassmorphism */}
      <Dialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <DialogContent
          className="sm:max-w-md"
          style={{
            background: 'rgba(15,23,42,0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '18px',
            color: '#f1f5f9',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
              Remove Team Member
            </DialogTitle>
          </DialogHeader>

          <div style={{ paddingTop: '8px' }}>
            <p style={{ color: '#e2e8f0', marginBottom: '8px', fontSize: '14px' }}>
              Are you sure you want to remove <strong>{memberToDelete?.full_name || memberToDelete?.email}</strong>?
            </p>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              This action cannot be undone. They will lose access to the platform immediately.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px' }}>
            <button
              onClick={() => setMemberToDelete(null)}
              style={{
                height: '38px',
                padding: '0 18px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#cbd5e1',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveMember}
              style={{
                height: '38px',
                padding: '0 20px',
                background: '#dc2626',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Remove Member
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
