import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building2, Users, FileText, Settings, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AdminAdviceGroupDetail() {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroup();
  }, []);

  const loadGroup = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      
      if (id) {
        const groups = await base44.entities.AdviceGroup.filter({ id });
        setGroup(groups[0]);
      }
    } catch (error) {
      console.error('Failed to load group:', error);
    } finally {
      setLoading(false);
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
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Edit Details
            </Button>
          </div>
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