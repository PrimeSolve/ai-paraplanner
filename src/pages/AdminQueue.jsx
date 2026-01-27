import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminLayout from '../components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserX, Clock, CheckCircle2, Zap, Search, ChevronDown } from 'lucide-react';

export default function AdminQueue() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const stats = {
    awaiting: 4,
    inProgress: 7,
    completedToday: 3,
    avgTurnaround: 4.2
  };

  const queueData = [
    {
      id: 'SOA-2026-012',
      type: 'Comprehensive',
      adviser: { name: 'Tim Smith', company: 'PrimeSolve Financial', avatar: 'TS', color: 'bg-blue-600' },
      client: 'David Wilson',
      status: 'submitted',
      assignedTo: null,
      submitted: '23 Jan 2026',
      daysAgo: 5,
      version: null
    },
    {
      id: 'SOA-2026-013',
      type: 'Insurance',
      adviser: { name: 'Jane Brown', company: 'Wealth Partners', avatar: 'JB', color: 'bg-orange-500' },
      client: 'Emma Clarke',
      status: 'submitted',
      assignedTo: null,
      submitted: '24 Jan 2026',
      daysAgo: 4,
      version: null
    },
    {
      id: 'SOA-2026-010',
      type: 'Comprehensive',
      adviser: { name: 'Tim Smith', company: 'PrimeSolve Financial', avatar: 'TS', color: 'bg-blue-600' },
      client: 'John Smith',
      status: 'in_progress',
      assignedTo: { name: 'Sarah Chen', avatar: 'SC', color: 'bg-cyan-500' },
      submitted: '20 Jan 2026',
      daysAgo: 8,
      version: null
    },
    {
      id: 'SOA-2026-009',
      type: 'Superannuation',
      adviser: { name: 'Rachel Lee', company: 'Future Invest', avatar: 'RL', color: 'bg-pink-500' },
      client: 'Mary Chen',
      status: 'in_progress',
      assignedTo: { name: 'Alex Johnson', avatar: 'AJ', color: 'bg-orange-600' },
      submitted: '18 Jan 2026',
      daysAgo: 10,
      version: null
    },
    {
      id: 'SOA-2026-008',
      type: 'Investment',
      adviser: { name: 'Kevin White', company: 'Smart Wealth', avatar: 'KW', color: 'bg-purple-600' },
      client: 'Robert Taylor',
      status: 'revision_requested',
      assignedTo: { name: 'Mike Peters', avatar: 'MP', color: 'bg-pink-600' },
      submitted: '16 Jan 2026',
      daysAgo: 12,
      version: 2,
      urgent: true
    },
    {
      id: 'SOA-2026-007',
      type: 'Insurance',
      adviser: { name: 'Tim Smith', company: 'PrimeSolve Financial', avatar: 'TS', color: 'bg-blue-600' },
      client: 'Sarah Jones',
      status: 'completed',
      assignedTo: { name: 'Sarah Chen', avatar: 'SC', color: 'bg-cyan-500' },
      submitted: '10 Jan 2026',
      daysAgo: 18,
      version: null
    },
    {
      id: 'SOA-2026-006',
      type: 'Comprehensive',
      adviser: { name: 'Nick Parker', company: 'Parker Advisory', avatar: 'NP', color: 'bg-teal-600' },
      client: 'Lisa Martinez',
      status: 'completed',
      assignedTo: { name: 'Alex Johnson', avatar: 'AJ', color: 'bg-orange-600' },
      submitted: '5 Jan 2026',
      daysAgo: 23,
      version: null
    }
  ];

  useEffect(() => {
    setLoading(false);
  }, []);

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
        {status === 'in_review' && (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
        {status === 'on_hold' && (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {status === 'revision_requested' && (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        {status === 'submitted' && (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {labels[status]}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const colors = {
      'Comprehensive': 'bg-blue-50 text-blue-700',
      'Insurance': 'bg-orange-50 text-orange-700',
      'Superannuation': 'bg-purple-50 text-purple-700',
      'Investment': 'bg-emerald-50 text-emerald-700'
    };
    return <span className={`text-xs font-medium ${colors[type] || 'bg-gray-50 text-gray-700'}`}>{type}</span>;
  };

  return (
    <AdminLayout currentPage="AdminQueue">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-[#0f172a] mb-1">
            SOA Queue
          </h1>
          <p className="text-sm text-[#64748b]">Manage and track all Statement of Advice requests</p>
        </div>
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
                placeholder="Search by SOA ID, adviser, or client..."
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
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-40 h-11">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="sarah">Sarah Chen</SelectItem>
                <SelectItem value="alex">Alex Johnson</SelectItem>
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
            <p className="text-sm text-slate-600 mt-0.5">Showing 1-7 of 12 requests</p>
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
                    Adviser
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Assigned To
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
                {queueData.map((item) => (
                  <tr key={item.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${item.urgent ? 'border-l-4 border-l-red-500' : ''}`}>
                    <td className="px-6 py-4">
                      <Checkbox />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-800">{item.id}</span>
                          {item.version && item.version > 1 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-700">
                              v{item.version}
                            </span>
                          )}
                        </div>
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
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4">
                      {item.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${item.assignedTo.color} flex items-center justify-center text-white font-bold text-xs`}>
                            {item.assignedTo.avatar}
                          </div>
                          <span className="text-sm font-medium text-slate-800">{item.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">{item.submitted}</span>
                        <span className="text-xs text-slate-500">{item.daysAgo} days ago</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {!item.assignedTo && (
                          <button className="px-4 py-2 bg-[#f97316] text-white rounded-lg text-sm font-semibold hover:bg-[#ea580c] transition-colors">
                            Assign
                          </button>
                        )}
                        {item.status === 'in_progress' && (
                          <button className="px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-sm font-semibold hover:bg-[#1d4ed8] transition-colors">
                            Upload
                          </button>
                        )}
                        {item.status === 'revision_requested' && (
                          <button className="px-4 py-2 bg-[#ef4444] text-white rounded-lg text-sm font-semibold hover:bg-[#dc2626] transition-colors">
                            Resubmit
                          </button>
                        )}
                        {item.status === 'completed' && (
                          <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                            Download
                          </button>
                        )}
                        {item.version && item.version > 1 && (
                          <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                            View v{item.version - 1}
                          </button>
                        )}
                        <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-600">Showing 1-7 of 12 requests</span>
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
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}