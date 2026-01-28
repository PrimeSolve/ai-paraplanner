import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminLayout from '../components/admin/AdminLayout';
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
  CheckCircle, 
  Send,
  X,
  MoreVertical
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
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [selectedRole, setSelectedRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const data = await base44.entities.User.list('-created_date', 100);
      // Mock SOA data for each user
      const teamWithStats = data.map(member => ({
        ...member,
        soasThisMonth: Math.floor(Math.random() * 20),
        soasTotal: Math.floor(Math.random() * 100) + 20,
        status: member.email?.includes('pending') ? 'pending' : 'active'
      }));
      setTeam(teamWithStats);
    } catch (error) {
      console.error('Failed to load team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMember = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setInviting(true);
    try {
      await base44.entities.User.create({
        full_name: inviteName || inviteEmail.split('@')[0],
        email: inviteEmail,
        role: selectedRole
      });
      toast.success('Team member added successfully');
      setInviteEmail('');
      setInviteName('');
      setSelectedRole('user');
      setShowInviteModal(false);
      loadTeam();
    } catch (error) {
      toast.error('Failed to add team member');
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
    users: team.filter(m => m.role === 'user').length,
    soasThisMonth: team.reduce((sum, m) => sum + (m.soasThisMonth || 0), 0)
  };

  return (
    <AdminLayout currentPage="AdminTeam">
      <div className="p-8">
        {/* Header */}
         <div className="mb-8 flex justify-end">
           <Button 
             onClick={() => setShowInviteModal(true)}
             className="bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-sm"
           >
             <Plus className="w-4 h-4 mr-2" />
             Add Member
           </Button>
         </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
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

          <Card className="bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#10b981]/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#10b981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#0f172a] mb-1">{stats.soasThisMonth}</div>
            <div className="text-sm text-[#64748b]">SOAs This Month</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white">
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
              <Button variant="outline" className="bg-white">
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
        </div>

        {/* Team Table */}
        <Card className="bg-white">
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
                    SOAs Completed
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
                            : 'bg-[#3b82f6]/10 text-[#3b82f6] border-0'
                        }
                      >
                        {member.role === 'admin' ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
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
                      <div>
                        <div className="font-semibold text-[#0f172a]">{member.soasThisMonth || 0}</div>
                        <div className="text-xs text-[#64748b]">THIS MONTH</div>
                      </div>
                      <div className="mt-1">
                        <div className="font-semibold text-[#0f172a]">{member.soasTotal || 0}</div>
                        <div className="text-xs text-[#64748b]">TOTAL</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-[#0f172a]">
                        {new Date(member.created_date).toLocaleDateString('en-US', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-[#64748b]">
                        {(() => {
                          const days = Math.floor((new Date() - new Date(member.created_date)) / (1000 * 60 * 60 * 24));
                          if (days === 0) return 'today';
                          if (days === 1) return '1 day ago';
                          if (days < 30) return `${days} days ago`;
                          const months = Math.floor(days / 30);
                          return months === 1 ? '1 month ago' : `${months} months ago`;
                        })()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white">
                          View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
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
      </div>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#0f172a]">Add Team Member</DialogTitle>
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
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <p className="text-xs text-[#64748b] mt-1.5">
                The team member will be created and you can send a welcome email separately
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-[#0f172a] mb-2 block">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Enter their full name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
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
              onClick={() => setShowInviteModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveMember} 
              disabled={inviting || !inviteEmail}
              className="bg-[#3b82f6] hover:bg-[#2563eb]"
            >
              {inviting ? 'Saving...' : 'Save Member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}