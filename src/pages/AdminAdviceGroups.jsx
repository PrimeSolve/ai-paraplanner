import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Building2, Users, FileText, Settings, ChevronDown, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useRole } from '../components/RoleContext';

export default function AdminAdviceGroups() {
  const navigate = useNavigate();
  const { switchRole } = useRole();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [adviserCounts, setAdviserCounts] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    afsl: '',
    abn: '',
    status: 'active'
  });

  useEffect(() => {
    loadData();
    
    // Listen for custom event from header button
    const handleOpenDialog = () => setDialogOpen(true);
    window.addEventListener('openAddAdviceGroupDialog', handleOpenDialog);
    return () => window.removeEventListener('openAddAdviceGroupDialog', handleOpenDialog);
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const [data, users] = await Promise.all([
        base44.entities.AdviceGroup.list('-created_date'),
        base44.entities.User.list()
      ]);
      setGroups(data);
      
      // Count advisers per group
      const counts = {};
      users.forEach(u => {
        if (u.user_type === 'adviser' && u.advice_group_id) {
          counts[u.advice_group_id] = (counts[u.advice_group_id] || 0) + 1;
        }
      });
      setAdviserCounts(counts);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAsAdviceGroup = (group) => {
    switchRole('advice_group', group.id, group.name);
    navigate(createPageUrl('AdviceGroupDashboard'));
  };

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await base44.entities.AdviceGroup.create(formData);
      setDialogOpen(false);
      setFormData({
        name: '',
        slug: '',
        contact_email: '',
        contact_phone: '',
        afsl: '',
        abn: '',
        status: 'active'
      });
      loadData();
    } catch (error) {
      console.error('Failed to create advice group:', error);
    }
  };

  const getGroupInitial = (name) => name?.charAt(0).toUpperCase() || 'A';
  
  const getColorClass = (index) => {
    const colors = [
      'bg-purple-600',
      'bg-orange-600',
      'bg-green-600',
      'bg-blue-600',
      'bg-orange-500',
      'bg-pink-600',
      'bg-cyan-600',
      'bg-orange-400'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="p-8">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button style={{ display: 'none' }} />
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Advice Group</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Group Name *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., PrimeSolve Group"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    placeholder="e.g., primesolve"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>AFSL Number</Label>
                  <Input
                    value={formData.afsl}
                    onChange={(e) => setFormData({...formData, afsl: e.target.value})}
                    placeholder="e.g., 123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ABN</Label>
                  <Input
                    value={formData.abn}
                    onChange={(e) => setFormData({...formData, abn: e.target.value})}
                    placeholder="e.g., 12 345 678 901"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    placeholder="contact@advicegroup.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                    placeholder="+61 2 1234 5678"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Advice Group
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>


         {/* Stats Grid */}
         <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold mb-1">{groups.length}</div>
            <div className="text-sm opacity-90">Advice Groups</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">24</div>
            <div className="text-sm text-slate-600">Total Advisers</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-teal-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">5</div>
            <div className="text-sm text-slate-600">Custom Templates</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-cyan-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">3</div>
            <div className="text-sm text-slate-600">Using Default</div>
          </div>
        </div>

        {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 mb-6">
            <div className="p-6 flex items-end gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search groups or AFSL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-slate-200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Template Status</span>
                <select value={templateFilter} onChange={(e) => setTemplateFilter(e.target.value)} className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <option value="all">All Templates</option>
                  <option value="custom">Custom</option>
                  <option value="default">Default</option>
                </select>
              </div>
            </div>
          </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 relative">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Advisers
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="relative">
                {filteredGroups.map((group, idx) => (
                  <tr key={group.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${getColorClass(idx)} flex items-center justify-center text-white font-bold text-sm`}>
                          {getGroupInitial(group.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-800">{group.name}</div>
                          <div className="text-xs text-slate-600">{group.afsl ? `AFSL ${group.afsl}` : 'No AFSL'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {adviserCounts[group.id] > 0 && (
                          <div className="flex -space-x-2">
                            {[...Array(Math.min(adviserCounts[group.id], 3))].map((_, i) => (
                              <div key={i} className={`w-8 h-8 rounded-full ${getColorClass(i)} flex items-center justify-center text-white text-xs font-bold border-2 border-white`}>
                                {String.fromCharCode(65 + i)}
                              </div>
                            ))}
                          </div>
                        )}
                        <span className="text-sm text-slate-700 font-medium">
                          {adviserCounts[group.id] || 0} adviser{adviserCounts[group.id] === 1 ? '' : 's'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-100 text-cyan-700">
                        Custom
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">
                          {new Date(group.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-slate-500">
                          {(() => {
                            const days = Math.floor((new Date() - new Date(group.created_date)) / (1000 * 60 * 60 * 24));
                            if (days === 0) return 'Today';
                            if (days === 1) return 'Yesterday';
                            if (days < 30) return `${days} days ago`;
                            if (days < 60) return '1 month ago';
                            return `${Math.floor(days / 30)} months ago`;
                          })()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewAsAdviceGroup(group)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                          View
                        </button>
                        <div className="relative group/menu">
                          <button className="p-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <div className="invisible group-hover/menu:visible absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-2xl z-[9999]">
                            <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700 border-b border-slate-100 transition-colors">
                              <FileText className="w-4 h-4" />
                              Edit Template
                            </button>
                            <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700 border-b border-slate-100 transition-colors">
                              <Users className="w-4 h-4" />
                              View Advisers
                            </button>
                            <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-sm text-red-700 transition-colors">
                              Delete Group
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-600">Showing 1-8 of 8 advice groups</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                ← Prev
              </button>
              <button className="px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg">
                1
              </button>
              <button className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}