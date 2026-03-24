import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserX, Clock, CheckCircle2, Zap, Search, Loader2 } from 'lucide-react';
import { formatDate, formatRelativeDate } from '../utils/dateUtils';

export default function AdminQueue() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [queueData, setQueueData] = useState([]);
  const [stats, setStats] = useState({
    awaiting: 0,
    inProgress: 0,
    completedToday: 0,
    avgTurnaround: '—'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [soaRequests, clients] = await Promise.all([
          base44.entities.SOARequest.list('-created_date', 50),
          base44.entities.Client.list('-created_date', 200)
        ]);

        // Build client name lookup
        const clientMap = {};
        clients.forEach(c => {
          clientMap[c.id] = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email;
        });

        // Enrich SOA requests with resolved client names
        const enriched = soaRequests.map(soa => ({
          ...soa,
          resolved_client_name: clientMap[soa.client_id] || soa.client_name || soa.client_email || 'Unknown Client'
        }));

        setQueueData(enriched);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const awaiting = soaRequests.filter(s => s.status === 'submitted').length;
        const inProgress = soaRequests.filter(s => s.status === 'in_progress').length;
        const completedToday = soaRequests.filter(s => {
          if (s.status !== 'completed' || !s.completed_date) return false;
          const d = new Date(s.completed_date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        }).length;

        const completedWithDates = soaRequests.filter(s => s.status === 'completed' && s.completed_date && s.submitted_date);
        let avgTurnaround = '—';
        if (completedWithDates.length > 0) {
          const totalDays = completedWithDates.reduce((sum, s) => {
            return sum + (new Date(s.completed_date) - new Date(s.submitted_date)) / 86400000;
          }, 0);
          avgTurnaround = (totalDays / completedWithDates.length).toFixed(1);
        }

        setStats({ awaiting, inProgress, completedToday, avgTurnaround });
      } catch (error) {
        console.error('Failed to load queue data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      'Draft': 'bg-gray-100 text-gray-600 border-gray-200',
      'InProgress': 'bg-amber-100 text-amber-700 border-amber-200',
      'Review': 'bg-purple-100 text-purple-700 border-purple-200',
      'Approved': 'bg-blue-100 text-blue-700 border-blue-200',
      'Issued': 'bg-green-100 text-green-700 border-green-200',
    };
    const labels = {
      'Draft': 'Draft',
      'InProgress': 'In Progress',
      'Review': 'Under Review',
      'Approved': 'Approved',
      'Issued': 'Issued',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredData = queueData.filter(item => {
    const matchesSearch = !searchQuery ||
      (item.resolved_client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.client_email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || (item.type || '').toLowerCase() === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="py-6 px-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="py-6 px-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded-2xl p-6 text-white">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
            <UserX className="w-6 h-6" />
          </div>
          <div className="text-4xl font-bold mb-1">{stats.awaiting}</div>
          <div className="text-sm opacity-90">Awaiting Assignment</div>
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
          <div className="text-sm text-slate-600">Completed Today</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-cyan-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{stats.avgTurnaround}</div>
          <div className="text-sm text-slate-600">Avg. Days Turnaround</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 mb-6">
        <div className="p-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by client name or email..."
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 h-11">
              <SelectValue placeholder="SOA Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="comprehensive">Comprehensive</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="superannuation">Superannuation</SelectItem>
              <SelectItem value="investment">Investment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">SOA Queue</h3>
          <p className="text-sm text-slate-600 mt-0.5">Showing {filteredData.length} of {queueData.length} requests</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Submitted</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-sm text-slate-800">{item.resolved_client_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-700">{item.type || 'SOA'}</span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-800">{formatDate(item.submitted_date || item.created_date)}</span>
                      <span className="text-xs text-slate-500">{formatRelativeDate(item.submitted_date || item.created_date)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {item.status === 'submitted' && (
                        <button className="px-4 py-2 bg-[#f97316] text-white rounded-lg text-sm font-semibold hover:bg-[#ea580c] transition-colors">
                          Assign
                        </button>
                      )}
                      {item.status === 'completed' && (
                        <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                          Download
                        </button>
                      )}
                      <ViewButton soaRequestId={item.id} navigate={navigate} />
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No SOA requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ViewButton({ soaRequestId, navigate }) {
  const [checking, setChecking] = useState(false);

  const handleClick = async () => {
    setChecking(true);
    try {
      const docs = await base44.entities.SoaDocument.filter({ soa_request_id: soaRequestId });
      if (docs.length > 0) {
        navigate(`/SOABuilder?id=${docs[0].id}`);
      } else {
        navigate(`/SOARequestWelcome?id=${soaRequestId}`);
      }
    } catch {
      navigate(`/SOARequestWelcome?id=${soaRequestId}`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={checking}
      className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
    >
      {checking ? <Loader2 className="animate-spin w-4 h-4" /> : 'View'}
    </button>
  );
}
