import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdviceGroupSidebar from '../components/advicegroup/AdviceGroupSidebar';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Award, Clock, Star, Search, Calendar, Download, MoreHorizontal, ChevronDown, FileText, Clipboard } from 'lucide-react';

export default function AdviceGroupCompleted() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('2025-01-12');
  const [dateTo, setDateTo] = useState('2026-01-24');
  const [currentPage, setCurrentPage] = useState(1);

  const stats = {
    totalCompleted: 156,
    thisMonth: 23,
    avgDays: 4.2,
    onTimeRate: 94
  };

  const completedData = [
    {
      id: 'SOA-2026-004',
      type: 'Comprehensive',
      adviser: { name: 'Tim Smith', company: 'PrimeSolve', avatar: 'TS', color: 'bg-blue-600' },
      client: 'James Wilson',
      completedBy: { name: 'Sarah Chen', avatar: 'SC', color: 'bg-rose-500' },
      completedDate: '24 Jan 2026',
      completedAgo: 'Today',
      turnaround: 3,
      turnaroundColor: 'bg-green-100 text-green-700'
    },
    {
      id: 'SOA-2026-003',
      type: 'Insurance',
      adviser: { name: 'Jane Brown', company: 'Wealth Partners', avatar: 'JB', color: 'bg-cyan-600' },
      client: 'Laura Thompson',
      completedBy: { name: 'Alex Johnson', avatar: 'AJ', color: 'bg-indigo-500' },
      completedDate: '23 Jan 2026',
      completedAgo: '1 day ago',
      turnaround: 4,
      turnaroundColor: 'bg-green-100 text-green-700'
    },
    {
      id: 'SOA-2026-002',
      type: 'Superannuation',
      adviser: { name: 'Rachel Lee', company: 'Future Finance', avatar: 'RL', color: 'bg-pink-600' },
      client: 'Mark Stevens',
      completedBy: { name: 'Mike Peters', avatar: 'MP', color: 'bg-orange-600' },
      completedDate: '22 Jan 2026',
      completedAgo: '2 days ago',
      turnaround: 5,
      turnaroundColor: 'bg-green-100 text-green-700'
    },
    {
      id: 'SOA-2026-001',
      type: 'Investment',
      adviser: { name: 'Kevin White', company: 'Smart Wealth', avatar: 'KW', color: 'bg-purple-600' },
      client: 'Nancy Parker',
      completedBy: { name: 'Emily Watson', avatar: 'EW', color: 'bg-violet-600' },
      completedDate: '20 Jan 2026',
      completedAgo: '4 days ago',
      turnaround: 7,
      turnaroundColor: 'bg-amber-100 text-amber-700'
    },
    {
      id: 'SOA-2025-156',
      type: 'Comprehensive',
      adviser: { name: 'Tim Smith', company: 'PrimeSolve', avatar: 'TS', color: 'bg-blue-600' },
      client: 'Richard Adams',
      completedBy: { name: 'Sarah Chen', avatar: 'SC', color: 'bg-rose-500' },
      completedDate: '18 Jan 2026',
      completedAgo: '6 days ago',
      turnaround: 3,
      turnaroundColor: 'bg-green-100 text-green-700'
    },
    {
      id: 'SOA-2025-155',
      type: 'Insurance',
      adviser: { name: 'Jane Brown', company: 'Wealth Partners', avatar: 'JB', color: 'bg-cyan-600' },
      client: 'Sandra Miller',
      completedBy: { name: 'Alex Johnson', avatar: 'AJ', color: 'bg-indigo-500' },
      completedDate: '15 Jan 2026',
      completedAgo: '9 days ago',
      turnaround: 4,
      turnaroundColor: 'bg-green-100 text-green-700'
    },
    {
      id: 'SOA-2025-154',
      type: 'Superannuation',
      adviser: { name: 'Tim Smith', company: 'PrimeSolve', avatar: 'TS', color: 'bg-blue-600' },
      client: 'Thomas Green',
      completedBy: { name: 'Mike Peters', avatar: 'MP', color: 'bg-orange-600' },
      completedDate: '12 Jan 2026',
      completedAgo: '12 days ago',
      turnaround: 5,
      turnaroundColor: 'bg-green-100 text-green-700'
    },
    {
      id: 'SOA-2025-153',
      type: 'Comprehensive',
      adviser: { name: 'Rachel Lee', company: 'Future Finance', avatar: 'RL', color: 'bg-pink-600' },
      client: 'Patricia Hall',
      completedBy: { name: 'Sarah Chen', avatar: 'SC', color: 'bg-rose-500' },
      completedDate: '10 Jan 2026',
      completedAgo: '14 days ago',
      turnaround: 4,
      turnaroundColor: 'bg-green-100 text-green-700'
    }
  ];

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const getTypeBadge = (type) => {
    const colors = {
      'Comprehensive': 'text-purple-700',
      'Insurance': 'text-blue-600',
      'Superannuation': 'text-teal-600',
      'Investment': 'text-slate-600'
    };
    const icons = {
      'Comprehensive': '●',
      'Insurance': '🔷',
      'Superannuation': '💰',
      'Investment': '📊'
    };
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <span className={colors[type] || 'text-gray-700'}>{icons[type]}</span>
        <span className={colors[type] || 'text-gray-700'}>{type}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex">
        <AdviceGroupSidebar currentPage="completed" />
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdviceGroupSidebar currentPage="completed" />
      <div className="flex-1">
      <div className="p-8">

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
            <div className="text-4xl font-bold text-slate-800 mb-1">{stats.onTimeRate}%</div>
            <div className="text-sm text-slate-600">On-Time Rate</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 mb-6">
          <div className="p-6 space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search SOA ID, adviser, client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-slate-200"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">From</span>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-11 w-40 border-slate-200"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">To</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-11 w-40 border-slate-200"
                  />
                </div>
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
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    SOA Request
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Adviser
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Completed By
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Turnaround
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {completedData.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm text-slate-800">{item.id}</span>
                        {getTypeBadge(item.type)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${item.adviser.color} flex items-center justify-center text-white font-bold text-sm`}>
                          {item.adviser.avatar}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-800">{item.adviser.name}</div>
                          <div className="text-xs text-slate-600">{item.adviser.company}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800">{item.client}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${item.completedBy.color} flex items-center justify-center text-white font-bold text-xs`}>
                          {item.completedBy.avatar}
                        </div>
                        <span className="text-sm font-medium text-slate-800">{item.completedBy.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">{item.completedDate}</span>
                        <span className="text-xs text-slate-500">{item.completedAgo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${item.turnaroundColor}`}>
                        {item.turnaround} days
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">
                          Download
                        </button>
                        <div className="relative group">
                          <button className="p-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                            <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700 border-b border-slate-100">
                              <FileText className="w-4 h-4" />
                              View SOA Request
                            </button>
                            <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700">
                              <Clipboard className="w-4 h-4" />
                              View Fact Find
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-600">Showing 1-8 of 156 completed SOAs</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                ← Prev
              </button>
              <button className="px-3 py-2 text-sm font-semibold bg-[#3b82f6] text-white rounded-lg">
                1
              </button>
              <button className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                2
              </button>
              <button className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                3
              </button>
              <span className="px-2 text-slate-400">...</span>
              <button className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                20
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