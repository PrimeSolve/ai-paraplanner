import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdviserLayout from '../components/adviser/AdviserLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AdviserClientDetail() {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClient();
  }, []);

  const loadClient = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      
      if (id) {
        const clients = await base44.entities.Client.filter({ id });
        setClient(clients[0]);
      }
    } catch (error) {
      console.error('Failed to load client:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdviserLayout currentPage="AdviserClients">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </AdviserLayout>
    );
  }

  return (
    <AdviserLayout currentPage="AdviserClients">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <Link to={createPageUrl('AdviserClients')}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center text-2xl font-semibold text-teal-600">
            {client?.first_name?.charAt(0) || 'C'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">
              {client?.first_name} {client?.last_name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {client?.email}
              </span>
              {client?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {client.phone}
                </span>
              )}
            </div>
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700">Edit Details</Button>
        </div>
      </div>

      <div className="p-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="factfinds">Fact Finds</TabsTrigger>
            <TabsTrigger value="soas">SOAs</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Client Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Status</span>
                    <Badge>{client?.status || 'prospect'}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Risk Profile</span>
                    <span className="font-medium">{client?.risk_profile || 'Not assessed'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Client Since</span>
                    <span className="font-medium">{new Date(client?.created_date).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-600">No recent activity</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="factfinds">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-slate-600">Fact finds will appear here</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="soas">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-slate-600">SOAs will appear here</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-slate-600">Documents will appear here</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdviserLayout>
  );
}