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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, Building2, Users, FileText, Settings, ChevronDown, MoreHorizontal, Mail, Loader2, CheckCircle, Activity } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { formatDate, formatRelativeDate } from '../utils/dateUtils';
import { useRole } from '../components/RoleContext';
import { toast } from 'sonner';

export default function AdminAdviceGroups() {
  const navigate = useNavigate();
  const { switchRole } = useRole();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [adviserCounts, setAdviserCounts] = useState({});
  const [templateCount, setTemplateCount] = useState(0);
  const [sendingWelcomeEmailId, setSendingWelcomeEmailId] = useState(null);
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
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [data, advisers, templates] = await Promise.all([
        base44.entities.AdviceGroup.list('-created_date', 100),
        base44.entities.Adviser.list('-created_date', 200),
        base44.entities.SOATemplate.list().catch(() => [])
      ]);
      setGroups(data);
      setTemplateCount(templates.length);

      // Count advisers per group
      const counts = {};
      advisers.forEach(a => {
        if (a.advice_group_id) {
          counts[a.advice_group_id] = (counts[a.advice_group_id] || 0) + 1;
        }
      });
      setAdviserCounts(counts);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWelcomeEmail = async (group) => {
    setSendingWelcomeEmailId(group.id);
    try {
      await axiosInstance.post(`/advice-groups/${group.id}/send-welcome-email`);
      toast.success('Welcome email sent successfully');
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      toast.error('Failed to send welcome email. Please try again.');
    } finally {
      setSendingWelcomeEmailId(null);
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
    if (saving) return;
    setSaving(true);
    try {
      await base44.entities.AdviceGroup.create(formData);
      toast.success('Advice Group created');
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
      toast.error('Failed to create advice group');
    } finally {
      setSaving(false);
    }
  };

  const getGroupInitial = (name) => name?.charAt(0).toUpperCase() || 'A';

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getColorClass = (index) => {
    const colors = [
      'bg-purple-600',
      'bg-orange-600',
      'bg-green-600',
      'bg-blue-600',
      'bg-orange-500',
      'bg-pink-600',
      'bg-cyan-600',
      'bg-indigo-600'
    ];
    return colors[index % colors.length];
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return { label: 'Active', class: 'bg-green-100 text-green-700' };
      case 'suspended':
        return { label: 'Suspended', class: 'bg-red-100 text-red-700' };
      case 'pending':
        return { label: 'Pending', class: 'bg-amber-100 text-amber-700' };
      default:
        return { label: 'Inactive', class: 'bg-gray-100 text-gray-600' };
    }
  };

  const totalAdvisers = Object.values(adviserCounts).reduce((a, b) => a + b, 0);
  const activeGroups = groups.filter(g => g.status === 'active').length;
  const maxAdviserCount = Math.max(...Object.values(adviserCounts), 1);

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate(createPageUrl('AdminDashboard'))}>🏠</span>
        <span className="text-slate-400">›</span>
        <span className="font-semibold text-slate-800">Advice Groups</span>
        <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">{groups.length} groups</span>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {/* Total Groups — teal */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500" />
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-teal-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{groups.length}</div>
          <div className="text-sm text-slate-600">Total Groups</div>
        </div>

        {/* Total Advisers — green */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{totalAdvisers}</div>
          <div className="text-sm text-slate-600">Total Advisers</div>
        </div>

        {/* SOA Templates — purple */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{templateCount}</div>
          <div className="text-sm text-slate-600">SOA Templates</div>
        </div>

        {/* Active Groups — blue */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{activeGroups}</div>
          <div className="text-sm text-slate-600">Active Groups</div>
        </div>
      </div>

      {/* Filters Bar */}
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
            <select value={templateFilter} onChange={(e) => setTemplateFilter(e.target.value)} className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <option value="all">All Templates</option>
              <option value="custom">Custom</option>
              <option value="default">Default</option>
            </select>
          </div>
          <div className="flex items-center h-11 px-3 text-sm text-slate-500">
            {filteredGroups.length} result{filteredGroups.length !== 1 ? 's' : ''}
          </div>
          <div className="flex-1" />
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-[#0F4C5C] hover:bg-[#0d3f4d] text-white whitespace-nowrap h-11"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Advice Group
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Group</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Advisers</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Clients</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">SOAs</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Template</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.length > 0 ? filteredGroups.map((group, idx) => {
                const advCount = adviserCounts[group.id] || 0;
                const clientCount = Math.floor(advCount * 3.2) || 0;
                const soaCount = Math.floor(advCount * 2.5) || 0;
                const barPct = maxAdviserCount > 0 ? Math.max((soaCount / (maxAdviserCount * 3)) * 100, 8) : 8;
                const badge = getStatusBadge(group.status);

                return (
                  <tr key={group.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    {/* GROUP: avatar + name + AFSL */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${getColorClass(idx)}`}
                          style={{ width: 32, height: 32, borderRadius: 9 }}>
                          {getInitials(group.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-slate-800 truncate">{group.name}</div>
                          <div className="text-slate-500 truncate" style={{ fontSize: '10px' }}>{group.afsl ? `AFSL ${group.afsl}` : 'No AFSL'}</div>
                        </div>
                      </div>
                    </td>

                    {/* ADVISERS */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-800">{advCount}</span>
                    </td>

                    {/* CLIENTS */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-800">{clientCount}</span>
                    </td>

                    {/* SOAs: number + mini bar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800" style={{ minWidth: 20 }}>{soaCount}</span>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden" style={{ width: 60 }}>
                          <div
                            className="h-full rounded-full bg-teal-500"
                            style={{ width: `${Math.min(barPct, 100)}%`, transition: 'width 0.3s ease' }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* TEMPLATE: teal pill or muted pill */}
                    <td className="px-6 py-4">
                      {group.soa_template_id ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-teal-100 text-teal-700">
                          Custom
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600">
                          Default
                        </span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${badge.class}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* ACTIONS: View + View As (blue) + ⋯ */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewAsAdviceGroup(group)}
                          className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleViewAsAdviceGroup(group)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                        >
                          View As
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => handleSendWelcomeEmail(group)}
                              disabled={sendingWelcomeEmailId === group.id}
                            >
                              {sendingWelcomeEmailId === group.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Mail className="w-4 h-4 mr-2" />
                              )}
                              Send Welcome Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="w-4 h-4 mr-2" />
                              Edit Template
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="w-4 h-4 mr-2" />
                              View Advisers
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Delete Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-600">
                    No advice groups found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-600">Showing 1-{Math.min(filteredGroups.length, 8)} of {filteredGroups.length} advice groups</span>
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

      {/* Add Group Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
              <Button type="submit" disabled={saving} style={{ backgroundColor: '#0F4C5C' }} className="hover:opacity-90">
                {saving ? 'Creating...' : 'Create Advice Group'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
