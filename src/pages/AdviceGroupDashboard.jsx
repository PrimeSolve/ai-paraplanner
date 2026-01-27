import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdviceGroupLayout from '../components/advicegroup/AdviceGroupLayout';
import { FileText, Clock, Users, TrendingUp, CheckCircle, ChevronRight, Edit } from 'lucide-react';

const mockSoaRequests = [
  { id: 1, client: 'James & Emma Wilson', adviser: 'Michael Ross', status: 'In Progress', priority: 'HIGH', submitted: '2 hours ago', initials: 'JW', color: 'bg-blue-100 text-blue-600', advInitials: 'MR', advColor: 'bg-red-100 text-red-600' },
  { id: 2, client: 'Sarah Chen', adviser: 'Jessica Taylor', status: 'Review', priority: 'NORMAL', submitted: '5 hours ago', initials: 'SC', color: 'bg-green-100 text-green-600', advInitials: 'JT', advColor: 'bg-purple-100 text-purple-600' },
  { id: 3, client: 'David & Lisa Park', adviser: 'Andrew Walsh', status: 'Pending', priority: 'NORMAL', submitted: 'Yesterday', initials: 'DP', color: 'bg-orange-100 text-orange-600', advInitials: 'AW', advColor: 'bg-cyan-100 text-cyan-600' },
  { id: 4, client: 'Robert Brown', adviser: 'Michael Ross', status: 'In Progress', priority: 'HIGH', submitted: 'Yesterday', initials: 'RB', color: 'bg-red-100 text-red-600', advInitials: 'MR', advColor: 'bg-red-100 text-red-600' },
  { id: 5, client: 'Karen Nguyen', adviser: 'Nicole Harris', status: 'Pending', priority: 'NORMAL', submitted: '2 days ago', initials: 'KN', color: 'bg-pink-100 text-pink-600', advInitials: 'NH', advColor: 'bg-green-100 text-green-600' },
  { id: 6, client: 'Michael Johnson', adviser: 'Sarah Mitchell', status: 'Review', priority: 'HIGH', submitted: '3 days ago', initials: 'MJ', color: 'bg-indigo-100 text-indigo-600', advInitials: 'SM', advColor: 'bg-yellow-100 text-yellow-600' }
];

export default function AdviceGroupDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

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

  const getStatusBadgeClass = (status) => {
    const styles = {
      'In Progress': 'text-blue-700 bg-blue-50',
      'Review': 'text-purple-700 bg-purple-50',
      'Pending': 'text-orange-700 bg-orange-50',
      'Completed': 'text-green-700 bg-green-50'
    };
    return styles[status] || 'text-slate-700 bg-slate-50';
  };

  const getPriorityClass = (priority) => {
    const styles = {
      'HIGH': 'text-red-600 bg-red-50',
      'NORMAL': 'text-slate-600 bg-slate-50',
      'LOW': 'text-blue-600 bg-blue-50'
    };
    return styles[priority] || 'text-slate-600 bg-slate-50';
  };

  return (
    <AdviceGroupLayout currentPage="AdviceGroupDashboard">
      <div className="bg-[#f8fafc] min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-[#e2e8f0] px-8 py-6">
          <h1 className="text-3xl font-semibold text-[#0f172a]">PrimeSolve Dashboard</h1>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex gap-6">
            {/* Main Content */}
            <div className="flex-1">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-5 mb-8">
                {[
                  { label: 'Active SOA Requests', value: '12', change: '↑ 15%', icon: FileText, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Completed This Month', value: '47', change: '↑ 8%', icon: CheckCircle, color: 'bg-green-50 text-green-600' },
                  { label: 'Avg. Turnaround Time', value: '2.3d', change: '', icon: Clock, color: 'bg-cyan-50 text-cyan-600' },
                  { label: 'Active Advisers', value: '8', change: '', icon: Users, color: 'bg-purple-50 text-purple-600' }
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
                      <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-4xl font-bold text-[#0f172a] mb-2">{stat.value}</div>
                      <div className="text-sm text-[#64748b] mb-2">{stat.label}</div>
                      {stat.change && <div className="text-xs text-green-600 font-medium">{stat.change}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Recent SOA Requests */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
                <div className="px-8 py-5 border-b border-[#e2e8f0] flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#0f172a]">Recent SOA Requests</h3>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</a>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                        <th className="px-8 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wide">CLIENT</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wide">ADVISER</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wide">STATUS</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wide">PRIORITY</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-[#64748b] uppercase tracking-wide">SUBMITTED</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockSoaRequests.map((req, idx) => (
                        <tr key={idx} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${req.color} flex items-center justify-center font-semibold text-sm`}>
                                {req.initials}
                              </div>
                              <div className="font-medium text-[#0f172a]">{req.client}</div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${req.advColor} flex items-center justify-center font-semibold text-sm`}>
                                {req.advInitials}
                              </div>
                              <div className="font-medium text-[#0f172a]">{req.adviser}</div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${getStatusBadgeClass(req.status)}`}>
                              • {req.status}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex px-3 py-1 rounded-md text-xs font-bold ${getPriorityClass(req.priority)}`}>
                              {req.priority}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-[#64748b] text-sm">{req.submitted}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-96 flex-shrink-0 space-y-6">
              {/* Template Status */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
                <h4 className="font-semibold text-[#0f172a] mb-4">Template Status</h4>
                <div className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-semibold text-[#0f172a]">Custom Template</div>
                      <div className="text-xs text-green-700">Active</div>
                    </div>
                  </div>
                  <div className="text-sm text-[#64748b]">26 of 35 sections configured</div>
                  <div className="text-xs text-[#64748b] mt-2">Last updated 3 days ago by Sarah Mitchell</div>
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>

              {/* Adviser Activity */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-[#0f172a]">Adviser Activity</h4>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700">View All →</a>
                </div>
                <div className="space-y-4">
                  {[
                    { name: 'Michael Ross', count: 15, detail: '12 completed', color: 'bg-red-100 text-red-600' },
                    { name: 'Jessica Taylor', count: 12, detail: '10 completed', color: 'bg-purple-100 text-purple-600' },
                    { name: 'Andrew Walsh', count: 11, detail: '7 completed', color: 'bg-cyan-100 text-cyan-600' }
                  ].map((adv, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${adv.color} flex items-center justify-center font-semibold text-sm`}>
                          {adv.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-[#0f172a]">{adv.name}</div>
                          <div className="text-xs text-[#64748b]">{adv.detail}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#0f172a]">{adv.count}</div>
                        <div className="text-xs text-[#64748b]">This month</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
                <h4 className="font-semibold text-[#0f172a] mb-4">Quick Actions</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Edit SOA Template', icon: FileText },
                    { label: 'Invite New Adviser', icon: Users },
                    { label: 'Generate Report', icon: TrendingUp }
                  ].map((action, idx) => {
                    const Icon = action.icon;
                    return (
                      <button key={idx} className="w-full flex items-center gap-3 p-3 hover:bg-[#f8fafc] rounded-lg transition-colors text-left group">
                        <Icon className="w-4 h-4 text-[#64748b] group-hover:text-[#0f172a]" />
                        <span className="text-sm font-medium text-[#0f172a]">{action.label}</span>
                        <ChevronRight className="w-4 h-4 ml-auto text-[#64748b] group-hover:text-[#0f172a]" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdviceGroupLayout>
  );
}