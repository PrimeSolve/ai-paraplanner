import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building2, Users, FileText, Settings, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AdminAdviceGroupDetail() {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    status: 'active',
    subscription_tier: 'professional'
  });

  useEffect(() => {
    loadGroup();
  }, []);

  const loadGroup = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      
      if (id) {
        const groups = await base44.entities.AdviceGroup.filter({ id });
        const groupData = groups[0];
        setGroup(groupData);
        setFormData({
          name: groupData.name || '',
          slug: groupData.slug || '',
          contact_email: groupData.contact_email || '',
          contact_phone: groupData.contact_phone || '',
          status: groupData.status || 'active',
          subscription_tier: groupData.subscription_tier || 'professional'
        });
      }
    } catch (error) {
      console.error('Failed to load group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await base44.entities.AdviceGroup.update(group.id, formData);
      setEditDialogOpen(false);
      loadGroup();
    } catch (error) {
      console.error('Failed to update advice group:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPage="AdminAdviceGroups">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="AdminAdviceGroups">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <Link to={createPageUrl('AdminAdviceGroups')}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl">
            🏢
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">
              {group?.name || 'Advice Group'}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                15 advisers
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                243 clients
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                127 SOAs
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => document.querySelector('[data-value="settings"]')?.click()}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setEditDialogOpen(true)}>
              Edit Details
            </Button>
          </div>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Advice Group Details</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
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
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    Save Changes
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="advisers">Advisers</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{group?.contact_email || 'info@primesolve.com.au'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{group?.contact_phone || '+61 2 9876 5432'}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <Badge variant={group?.status === 'active' ? 'default' : 'secondary'}>
                      {group?.status || 'Active'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-600">Activity tracking coming soon...</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="advisers">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-slate-600">Advisers list coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-slate-600">Clients list coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-slate-600">Settings coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}