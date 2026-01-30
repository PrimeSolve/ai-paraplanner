import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useRole } from '../components/RoleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Mail, MoreHorizontal, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function AdviceGroupAdvisers() {
    const { switchedToId, switchRole } = useRole();
    const navigate = useNavigate();
    const [advisers, setAdvisers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: ''
    });
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [sortBy, setSortBy] = useState('Most Active');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
      loadData();

      // Listen for custom event from header button
      const handleOpenDialog = () => setShowInvite(true);
      window.addEventListener('openAddAdviserDialog', handleOpenDialog);
      return () => window.removeEventListener('openAddAdviserDialog', handleOpenDialog);
    }, [switchedToId]);

    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const groupId = switchedToId || currentUser.advice_group_id;
        if (groupId) {
          const [advisersData, groups] = await Promise.all([
            base44.entities.Adviser.filter({
              advice_group_id: groupId
            }),
            base44.entities.AdviceGroup.list()
          ]);
          setAdvisers(advisersData);
          const currentGroup = groups.find(g => g.id === groupId);
          if (currentGroup) {
            setGroupName(currentGroup.name);
          }
        }
      } catch (error) {
        console.error('Failed to load advisers:', error);
      } finally {
        setLoading(false);
      }
    };

  const handleCreateAdviser = async (e) => {
    e.preventDefault();
    try {
      const groupId = switchedToId || user.advice_group_id;
      await base44.entities.Adviser.create({
        advice_group_id: groupId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        status: 'pending'
      });
      toast.success('Adviser created with pending status. They can register when ready.');
      setShowInvite(false);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', company: '' });
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to add adviser');
    }
  };

  const handleSendWelcomeEmail = async (adviser) => {
    try {
      await base44.users.inviteUser(adviser.email, 'user');
      toast.success('Welcome email sent');
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      toast.error('Failed to send welcome email');
    }
  };

  const filteredAdvisers = advisers.filter(a => {
    const fullName = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           a.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
    { label: 'Active', value: advisers.length },
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

  const getColorClass = (index) => {
    const colors = [
      'bg-blue-600',
      'bg-orange-600',
      'bg-pink-600',
      'bg-purple-600',
      'bg-green-600',
      'bg-cyan-600',
      'bg-teal-600',
      'bg-indigo-600'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="py-6 px-8">

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold mb-1">{advisers.length}</div>
            <div className="text-sm opacity-90">Total Advisers</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">{advisers.filter(a => a.status === 'active').length}</div>
            <div className="text-sm text-slate-600">Active Advisers</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">{advisers.filter(a => a.status === 'pending').length}</div>
            <div className="text-sm text-slate-600">Pending</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 mb-6">
          <div className="p-6 flex items-end gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search advisers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <option>All Statuses</option>
                <option>Active</option>
                <option>Pending</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sort by</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <option>Most Active</option>
                <option>Least Active</option>
                <option>Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200">

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Adviser
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Active SOAs
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedAdvisers.length > 0 ? paginatedAdvisers.map((adviser, idx) => (
                  <tr key={adviser.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${getColorClass(idx)} flex items-center justify-center text-white font-bold text-sm`}>
                          {`${adviser.first_name?.[0]}${adviser.last_name?.[0]}`.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-800">{`${adviser.first_name} ${adviser.last_name}` || adviser.email}</div>
                          <div className="text-xs text-slate-600">{adviser.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${adviser.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {adviser.status?.charAt(0).toUpperCase() + adviser.status?.slice(1) || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-800">5</div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                         <button onClick={() => {
                           switchRole('adviser', adviser.id, `${adviser.first_name} ${adviser.last_name}`);
                           navigate(createPageUrl(`AdviserDashboard?adviser_email=${adviser.email}`));
                         }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                           View As
                         </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSendWelcomeEmail(adviser)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Welcome Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Adviser
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Adviser
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                       </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-600">
                      No advisers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-600">Showing {filteredAdvisers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredAdvisers.length)} of {filteredAdvisers.length} advisers</span>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50">
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50">
                Next →
              </button>
            </div>
          </div>
        </div>

            {/* Add Adviser Modal */}
            <Dialog open={showInvite} onOpenChange={setShowInvite}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Adviser</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAdviser} style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <Label>First Name *</Label>
                <Input
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  placeholder="John"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <Label>Last Name *</Label>
                <Input
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  placeholder="Smith"
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Label>Email *</Label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Label>Company</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                placeholder="Company Name"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <Button type="button" variant="outline" onClick={() => { setShowInvite(false); setFormData({ first_name: '', last_name: '', email: '', phone: '', company: '' }); }}>
                Cancel
              </Button>
              <Button type="submit" style={{
                background: colors.accent.blue,
                color: colors.core.white,
                border: 'none',
              }}>
                Add Adviser
              </Button>
            </div>
            </form>
            </DialogContent>
            </Dialog>
            </div>
            );
            }