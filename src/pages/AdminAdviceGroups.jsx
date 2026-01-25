import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Building2, Users, FileText, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AdminAdviceGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    status: 'active',
    subscription_tier: 'professional'
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await base44.entities.AdviceGroup.list('-created_date');
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
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
        status: 'active',
        subscription_tier: 'professional'
      });
      loadGroups();
    } catch (error) {
      console.error('Failed to create advice group:', error);
    }
  };

  return (
    <AdminLayout currentPage="AdminAdviceGroups">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">Advice Groups</h1>
            <p className="text-sm text-slate-600 mt-1">Manage licensees and dealer groups</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Advice Group
              </Button>
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
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label>Subscription Tier</Label>
                    <Select value={formData.subscription_tier} onValueChange={(value) => setFormData({...formData, subscription_tier: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    Create Advice Group
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border border-slate-200">
            <div className="text-3xl font-['Fraunces'] font-semibold text-indigo-600 mb-1">
              {groups.length}
            </div>
            <div className="text-sm text-slate-600">Total Groups</div>
          </Card>
          <Card className="p-4 border border-slate-200">
            <div className="text-3xl font-['Fraunces'] font-semibold text-green-600 mb-1">
              {groups.filter(g => g.status === 'active').length}
            </div>
            <div className="text-sm text-slate-600">Active</div>
          </Card>
          <Card className="p-4 border border-slate-200">
            <div className="text-3xl font-['Fraunces'] font-semibold text-amber-600 mb-1">156</div>
            <div className="text-sm text-slate-600">Total Advisers</div>
          </Card>
          <Card className="p-4 border border-slate-200">
            <div className="text-3xl font-['Fraunces'] font-semibold text-blue-600 mb-1">2,847</div>
            <div className="text-sm text-slate-600">Total Clients</div>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search advice groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <Link key={group.id} to={createPageUrl('AdminAdviceGroupDetail') + `?id=${group.id}`}>
                <Card className="hover:border-indigo-400 transition-all cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        🏢
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{group.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Users className="w-3 h-3" />
                          <span>15 advisers</span>
                          <span>•</span>
                          <span>243 clients</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Pending SOAs</span>
                        <span className="font-semibold">4</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Completed SOAs</span>
                        <span className="font-semibold">127</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                        {group.status || 'active'}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {group.subscription_tier || 'Professional'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}