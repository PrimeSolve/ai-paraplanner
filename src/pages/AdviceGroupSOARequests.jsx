import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserX, Clock, CheckCircle2, Zap, Search } from 'lucide-react';
import AdviceGroupSidebar from '../components/advicegroup/AdviceGroupSidebar';
import AdviceGroupHeader from '../components/advicegroup/AdviceGroupHeader';

export default function AdviceGroupSOARequests() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const stats = {
    awaiting: 0,
    inProgress: 0,
    completedToday: 0,
    avgTurnaround: 0
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load requests filtered by advice group
      if (currentUser.advice_group_id) {
        const data = await base44.entities.SOARequest.filter(
          { 
            advice_group_id: currentUser.advice_group_id 
          },
          '-created_date'
        );
        setRequests(data);
        
        // Calculate stats
        stats.awaiting = data.filter(r => r.status === 'submitted').length;
        stats.inProgress = data.filter(r => r.status === 'in_progress').length;
        stats.completedToday = data.filter(r => r.status === 'completed').length;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      submitted: 'bg-orange-100 text-orange-700 border-orange-200',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
      in_review: 'bg-purple-100 text-purple-700 border-purple-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      on_hold: 'bg-amber-100 text-amber-700 border-amber-200',
      revision_requested: 'bg-red-100 text-red-700 border-red-200'
    };
    const labels = {
      submitted: 'Submitted',
      in_progress: 'In Progress',
      in_review: 'In Review',
      completed: 'Completed',
      on_hold: 'On Hold',
      revision_requested: 'Revision Requested'
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${styles[status]}`}>
        {status === 'in_progress' && (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
        {status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
        {status === 'submitted' && (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {labels[status]}
      </span>
    );
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