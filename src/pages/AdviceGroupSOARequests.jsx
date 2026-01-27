import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdviceGroupSidebar from '../components/advicegroup/AdviceGroupSidebar';
import AdviceGroupHeader from '../components/advicegroup/AdviceGroupHeader';

export default function AdviceGroupSOARequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadRequests();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadRequests = async () => {
    try {
      const data = await base44.entities.SOARequest.list('-created_date');
      setRequests(data);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'secondary',
      in_progress: 'default',
      submitted: 'default',
      completed: 'default'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="flex">
      <AdviceGroupSidebar currentPage="soa-requests" />
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AdviceGroupHeader user={user} />

        <div style={{
          flex: 1,
          padding: '32px',
        }}>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-3xl font-['Fraunces'] font-semibold text-cyan-600 mb-1">
              {requests.length}
            </div>
            <div className="text-sm text-slate-600">Total Requests</div>
          </Card>
          <Card className="p-4">
            <div className="text-3xl font-['Fraunces'] font-semibold text-amber-600 mb-1">
              {requests.filter(r => r.status === 'in_progress').length}
            </div>
            <div className="text-sm text-slate-600">In Progress</div>
          </Card>
          <Card className="p-4">
            <div className="text-3xl font-['Fraunces'] font-semibold text-blue-600 mb-1">
              {requests.filter(r => r.status === 'submitted').length}
            </div>
            <div className="text-sm text-slate-600">Submitted</div>
          </Card>
          <Card className="p-4">
            <div className="text-3xl font-['Fraunces'] font-semibold text-green-600 mb-1">
              {requests.filter(r => r.status === 'completed').length}
            </div>
            <div className="text-sm text-slate-600">Completed</div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="submitted">Submitted</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                        Client
                      </th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                        Adviser
                      </th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                        Status
                      </th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                        Progress
                      </th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests
                      .filter(r => activeTab === 'all' || r.status === activeTab)
                      .map((req) => (
                        <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center font-semibold text-cyan-600">
                                {req.client_name?.charAt(0) || 'C'}
                              </div>
                              <span className="font-medium">{req.client_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {req.created_by?.split('@')[0] || 'Adviser'}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(req.status)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-2">
                                <div 
                                  className="bg-cyan-500 h-2 rounded-full"
                                  style={{ width: `${req.completion_percentage || 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-600">{req.completion_percentage || 0}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Button size="sm" variant="outline">View</Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}