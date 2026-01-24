import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminLayout from '../components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, PlayCircle } from 'lucide-react';

export default function AdminQueue() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadRequests();
  }, []);

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
    <AdminLayout currentPage="AdminQueue">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">SOA Processing Queue</h1>
        <p className="text-sm text-slate-600 mt-1">Monitor and manage SOA requests</p>
      </div>

      <div className="p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending (12)
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4" />
              In Progress (8)
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Review (3)
            </TabsTrigger>
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
                        Group
                      </th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                        Status
                      </th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                        Submitted
                      </th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.filter(r => r.status === activeTab.replace('_', ' ')).map((req) => (
                      <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-semibold text-indigo-600">
                              {req.client_name?.charAt(0) || 'C'}
                            </div>
                            <span className="font-medium">{req.client_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {req.created_by?.split('@')[0] || 'Adviser'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          PrimeSolve Financial
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(req.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {req.submitted_date ? new Date(req.submitted_date).toLocaleDateString() : 'N/A'}
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
    </AdminLayout>
  );
}