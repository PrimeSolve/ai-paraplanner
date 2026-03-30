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
  Loader2
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
  const [inviteName, setInviteName] = useState('');
  const [selectedRole, setSelectedRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);

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

      // Merge User and Admin data
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
    setNameError('');

    if (!inviteEmail.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) {
      setEmailError('Please enter a valid email address');
      valid = false;
    }

    if (!inviteName.trim()) {
      setNameError('Full name is required');
      valid = false;
    }

    return valid;
  };

  const handleSaveMember = async () => {
    if (!validateForm()) return;

    if (editingMember) {
      try {
        setInviting(true);
        await base44.entities.Admin.update(editingMember.id, {
          email: inviteEmail,
          first_name: inviteName.split(' ')[0] || '',
          last_name: inviteName.split(' ').slice(1).join(' ') || ''
        });
        toast.success('Team member updated');
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteName('');
        setSelectedRole('user');
        setEditingMember(null);
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
        fullName: inviteName.trim(),
        role: selectedRole === 'admin' ? 'Admin' : 'Paraplanner'
      });

      setShowInviteModal(false);
      toast.success('Team member created successfully');
      setInviteEmail('');
      setInviteName('');
      setSelectedRole('user');
      setEditingMember(null);
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

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.split(' ');
      return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
    }
    return email?.charAt(0).toUpperCase() || '?';
  };

  const getAvatarColor = (email) => {
    const colors = [
      'bg-[#ec4899] text-white',
      'bg-[#22d3ee] text-white',
      'bg-[#f97316] text-white',
      'bg-[#8b5cf6] text-white',
      'bg-[#10b981] text-white',
      'bg-[#3b82f6] text-white'
    ];
    const index = email?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  const filteredTeam = team.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || 
                        (roleFilter === 'admin' && member.role === 'admin') ||
                        (roleFilter === 'user' && member.role === 'user');
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: team.length,
    admins: team.filter(m => m.role === 'admin').length,
    users: team.filter(m => m.role !== 'admin').length,
  };

  return (
    <div className="py-6 px-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] text-white p-6 border-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.total}</div>
            <div className="text-sm opacity-90">Team Members</div>
          </Card>

          <Card className="bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#8b5cf6]/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#8b5cf6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#0f172a] mb-1">{stats.admins}</div>
            <div className="text-sm text-[#64748b]">Admins</div>
          </Card>

          <Card className="bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#3b82f6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#0f172a] mb-1">{stats.users}</div>
            <div className="text-sm text-[#64748b]">Paraplanners</div>
          </Card>

        </div>

        {/* Team Table */}
        <Card className="bg-white">
          {/* Filters Header */}
          <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center gap-3">
            <div className="relative w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white h-10"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white whitespace-nowrap">
                  Role
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setRoleFilter('all')}>All Roles</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('admin')}>Admin</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('user')}>Paraplanner</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white whitespace-nowrap">
                  Status
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending Invite</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1" />

            <Button
              onClick={() => {
                setEditingMember(null);
                setShowInviteModal(true);
              }}
              className="bg-[#0F4C5C] hover:bg-[#0d3f4d] text-white whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                    Member
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTeam.map((member) => (
                  <tr key={member.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm ${getAvatarColor(member.email)}`}>
                          {getInitials(member.full_name, member.email)}
                        </div>
                        <div>
                          <div className="font-medium text-[#0f172a]">{member.full_name || 'No name'}</div>
                          <div className="text-sm text-[#64748b]">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        className={
                          member.role === 'admin'
                            ? 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-0'
                            : member.role === 'adviser'
                            ? 'bg-[#10b981]/10 text-[#10b981] border-0'
                            : member.role === 'advice_group'
                            ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-0'
                            : 'bg-[#3b82f6]/10 text-[#3b82f6] border-0'
                        }
                      >
                        {member.role === 'admin' ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </>
                        ) : member.role === 'adviser' ? (
                          <>
                            <FileText className="w-3 h-3 mr-1" />
                            Adviser
                          </>
                        ) : member.role === 'advice_group' ? (
                          <>
                            <Users className="w-3 h-3 mr-1" />
                            Advice Group
                          </>
                        ) : (
                          <>
                            <FileText className="w-3 h-3 mr-1" />
                            Paraplanner
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      {member.status === 'pending' ? (
                        <Badge className="bg-[#f59e0b]/10 text-[#f59e0b] border-0">
                          Pending Invite
                        </Badge>
                      ) : (
                        <Badge className="bg-[#10b981]/10 text-[#10b981] border-0">
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-[#0f172a]">
                        {formatDate(member.created_at)}
                      </div>
                      <div className="text-xs text-[#64748b]">
                        {formatRelativeDate(member.created_at)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleEditMember(member)}
                          className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                        >
                          View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditMember(member)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setMemberToDelete(member)}
                              className="text-red-600"
                            >
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-[#e2e8f0] text-sm text-[#64748b]">
            Showing 1-{filteredTeam.length} of {filteredTeam.length} members
          </div>
        </Card>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={(open) => {
        if (!open) {
          setShowInviteModal(false);
          setInviting(false);
          setEmailError('');
          setNameError('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#0f172a]">
              {editingMember ? 'Edit Team Member' : 'Add Team Member'}
            </DialogTitle>
          </DialogHeader>

              <div className="space-y-5 py-4">
                <div>
                  <label className="text-sm font-medium text-[#0f172a] mb-2 block">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    className={emailError ? 'border-red-500' : ''}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                  />
                  {emailError ? (
                    <p className="text-xs text-red-500 mt-1.5">{emailError}</p>
                  ) : (
                    <p className="text-xs text-[#64748b] mt-1.5">
                      The team member will be created and you can send a welcome email separately
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-[#0f172a] mb-2 block">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter their full name"
                    value={inviteName}
                    className={nameError ? 'border-red-500' : ''}
                    onChange={(e) => {
                      setInviteName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                  />
                  {nameError && (
                    <p className="text-xs text-red-500 mt-1.5">{nameError}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-[#0f172a] mb-3 block">
                    Role
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedRole('user')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedRole === 'user'
                          ? 'border-[#3b82f6] bg-[#3b82f6]/5'
                          : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          selectedRole === 'user' ? 'bg-[#3b82f6]/10' : 'bg-[#f1f5f9]'
                        }`}>
                          <FileText className={`w-6 h-6 ${
                            selectedRole === 'user' ? 'text-[#3b82f6]' : 'text-[#64748b]'
                          }`} />
                        </div>
                        <div>
                          <div className="font-semibold text-[#0f172a] text-sm">Paraplanner</div>
                          <div className="text-xs text-[#64748b] mt-0.5">Can create and manage SOAs</div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedRole('admin')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedRole === 'admin'
                          ? 'border-[#8b5cf6] bg-[#8b5cf6]/5'
                          : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          selectedRole === 'admin' ? 'bg-[#8b5cf6]/10' : 'bg-[#f1f5f9]'
                        }`}>
                          <Shield className={`w-6 h-6 ${
                            selectedRole === 'admin' ? 'text-[#8b5cf6]' : 'text-[#64748b]'
                          }`} />
                        </div>
                        <div>
                          <div className="font-semibold text-[#0f172a] text-sm">Admin</div>
                          <div className="text-xs text-[#64748b] mt-0.5">Full access to all settings</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  disabled={inviting}
                  onClick={() => {
                    setShowInviteModal(false);
                    setEditingMember(null);
                    setEmailError('');
                    setNameError('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveMember}
                  disabled={inviting}
                  className="bg-[#3b82f6] hover:bg-[#2563eb]"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : editingMember ? (
                    'Save Changes'
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Member
                    </>
                  )}
                </Button>
              </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#0f172a]">
              Remove Team Member
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-[#0f172a] mb-2">
              Are you sure you want to remove <strong>{memberToDelete?.full_name || memberToDelete?.email}</strong>?
            </p>
            <p className="text-sm text-[#64748b]">
              This action cannot be undone. They will lose access to the platform immediately.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setMemberToDelete(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRemoveMember}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
      );
      }