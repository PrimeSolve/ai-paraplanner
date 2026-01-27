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

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = !searchQuery || 
      req.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex">
      <AdviceGroupSidebar currentPage="soa-requests" />
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AdviceGroupHeader user={user} />

        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded-2xl p-6 text-white">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <UserX className="w-6 h-6" />
              </div>
              <div className="text-4xl font-bold mb-1">{stats.awaiting}</div>
              <div className="text-sm opacity-90">Awaiting Review</div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-4xl font-bold text-slate-800 mb-1">{stats.inProgress}</div>
              <div className="text-sm text-slate-600">In Progress</div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-4xl font-bold text-slate-800 mb-1">{stats.completedToday}</div>
              <div className="text-sm text-slate-600">Completed</div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-cyan-600" />
              </div>
              <div className="text-4xl font-bold text-slate-800 mb-1">{requests.length}</div>
              <div className="text-sm text-slate-600">Total Requests</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 mb-6">
            <div className="p-6 flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by SOA ID or client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-slate-200"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-11">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">SOA Requests</h3>
              <p className="text-sm text-slate-600 mt-0.5">Showing {filteredRequests.length} requests</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 w-12">
                      <Checkbox />
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      SOA Request
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <Checkbox />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-sm text-slate-800">{req.id || 'SOA-' + req.id}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-800">{req.client_name}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-xs">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${req.completion_percentage || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600 w-8">{req.completion_percentage || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{new Date(req.created_date).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm text-slate-600">Showing {filteredRequests.length} of {requests.length} requests</span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  ← Prev
                </button>
                <button className="px-3 py-2 text-sm font-semibold bg-[#3b82f6] text-white rounded-lg">
                  1
                </button>
                <button className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}