import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Award, Clock, Star, Search, MoreHorizontal, FileText, Clipboard } from 'lucide-react';
import { formatDate, formatRelativeDate } from '../utils/dateUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function AdminCompleted() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completedSOAs, setCompletedSOAs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalCompleted: 0,
    thisMonth: 0,
    avgDays: '—',
    onTimeRate: '—'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const allSOAs = await base44.entities.SOARequest.list('-created_date', 100);
        const completed = allSOAs.filter(s => s.status === 'completed');

        // Resolve client names
        const clients = await base44.entities.Client.list('-created_date', 200);
        const clientMap = {};
        clients.forEach(c => {
          clientMap[c.id] = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email;
        });

        const enriched = completed.map(soa => ({
          ...soa,
          clientName: clientMap[soa.client_id] || soa.client_name || soa.client_email || 'Unknown',
          turnaround: soa.completed_date && soa.submitted_date
            ? Math.max(1, Math.round((new Date(soa.completed_date) - new Date(soa.submitted_date)) / 86400000))
            : null
        }));

        setCompletedSOAs(enriched);

        // Compute stats
        const now = new Date();
        const thisMonth = completed.filter(s => {
          if (!s.completed_date) return false;
          const d = new Date(s.completed_date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;

        const completedWithDates = completed.filter(s => s.completed_date && s.submitted_date);
        let avgDays = '—';
        if (completedWithDates.length > 0) {
          const totalDays = completedWithDates.reduce((sum, s) => {
            return sum + (new Date(s.completed_date) - new Date(s.submitted_date)) / 86400000;
          }, 0);
          avgDays = (totalDays / completedWithDates.length).toFixed(1);
        }

        setStats({
          totalCompleted: completed.length,
          thisMonth,
          avgDays,
          onTimeRate: completedWithDates.length > 0
            ? Math.round((completedWithDates.filter(s => {
                const days = (new Date(s.completed_date) - new Date(s.submitted_date)) / 86400000;
                return days <= 7;
              }).length / completedWithDates.length) * 100)
            : '—'
        });
      } catch (error) {
        console.error('Failed to load completed SOAs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getTypeBadge = (type) => {
    const colors = {
      'Comprehensive': 'text-purple-700',
      'Insurance': 'text-blue-600',
      'Superannuation': 'text-teal-600',
      'Investment': 'text-slate-600'
    };
    return (
      <span className={`text-xs font-medium ${colors[type] || 'text-gray-700'}`}>
        {type || 'SOA'}
      </span>
    );
  };

  const getTurnaroundColor = (days) => {
    if (!days) return 'bg-slate-100 text-slate-600';
    if (days <= 5) return 'bg-green-100 text-green-700';
    if (days <= 7) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const filteredData = completedSOAs.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (item.clientName || '').toLowerCase().includes(q) ||
      (item.adviser_name || '').toLowerCase().includes(q) ||
      (item.id || '').toLowerCase().includes(q);
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
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 text-white">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold mb-1">{stats.totalCompleted}</div>
            <div className="text-sm opacity-90">Total Completed</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">{stats.thisMonth}</div>
            <div className="text-sm text-slate-600">This Month</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-cyan-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">{stats.avgDays}</div>
            <div className="text-sm text-slate-600">Avg. Days to Complete</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">{typeof stats.onTimeRate === 'number' ? `${stats.onTimeRate}%` : stats.onTimeRate}</div>
            <div className="text-sm text-slate-600">On-Time Rate</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 mb-6">
          <div className="p-6">
            <div className="flex items-end gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by client, adviser, or SOA ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-slate-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Client</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Completed</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Turnaround</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? filteredData.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm text-slate-800">{item.clientName}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getTypeBadge(item.type)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">{formatDate(item.completed_date || item.created_date)}</span>
                        <span className="text-xs text-slate-500">{formatRelativeDate(item.completed_date || item.created_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.turnaround ? (
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${getTurnaroundColor(item.turnaround)}`}>
                          {item.turnaround} days
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/SOARequestReview?id=${item.id}`)}>
                            <FileText className="w-4 h-4 mr-2" />
                            View SOA
                          </DropdownMenuItem>
                          {item.fact_find_id && (
                            <DropdownMenuItem onClick={() => navigate(`/FactFindReview?id=${item.fact_find_id}`)}>
                              <Clipboard className="w-4 h-4 mr-2" />
                              View Fact Find
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      {completedSOAs.length === 0 ? 'No completed SOAs yet' : 'No results match your search'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination info */}
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-600">Showing {filteredData.length} of {completedSOAs.length} completed SOAs</span>
          </div>
        </div>
    </div>
  );
}
