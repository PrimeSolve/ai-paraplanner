import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdviceGroupLayout from '../components/advicegroup/AdviceGroupLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, Users, TrendingUp, CheckCircle, AlertCircle, ChevronRight, Edit } from 'lucide-react';

export default function AdviceGroupDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    activeSoaRequests: 0,
    completedThisMonth: 0,
    avgTurnaroundTime: '2.3d',
    activeAdvisers: 0
  });
  const [soaRequests, setSoaRequests] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.advice_group_id) {
        const [advisers, requests] = await Promise.all([
          base44.entities.User.filter({ advice_group_id: currentUser.advice_group_id, user_type: 'adviser' }),
          base44.entities.SOARequest.filter({ advice_group_id: currentUser.advice_group_id }, '-submitted_date', 6)
        ]);

        setStats({
          activeSoaRequests: 12,
          completedThisMonth: 47,
          avgTurnaroundTime: '2.3d',
          activeAdvisers: advisers.length
        });

        setSoaRequests(requests.slice(0, 6));
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'in_progress': 'text-blue-600 bg-blue-50',
      'pending': 'text-orange-600 bg-orange-50',
      'review': 'text-purple-600 bg-purple-50',
      'submitted': 'text-green-600 bg-green-50',
      'completed': 'text-green-600 bg-green-50'
    };
    return colors[status] || 'text-slate-600 bg-slate-50';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': 'text-red-600 bg-red-50',
      'normal': 'text-slate-600 bg-slate-50',
      'low': 'text-blue-600 bg-blue-50'
    };
    return colors[priority] || 'text-slate-600 bg-slate-50';
  };

  return (
    <AdviceGroupLayout currentPage="AdviceGroupDashboard">
      <div className="bg-[#f8fafc]">
        {/* Header */}
        <div className="bg-white border-b border-[#e2e8f0] px-8 py-6">
          <h1 className="text-2xl font-semibold text-[#0f172a]">Dashboard</h1>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex gap-6">
            {/* Main Content */}
            <div className="flex-1">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
                  <FileText className="w-5 h-5 text-blue-500 mb-3" />
                  <div className="text-3xl font-semibold text-[#0f172a] mb-1">{stats.activeSoaRequests}</div>
                  <div className="text-sm text-[#64748b]">Active SOA Requests</div>
                  <div className="text-xs text-green-600 mt-2">↑ 15%</div>
                </div>

                <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
                  <CheckCircle className="w-5 h-5 text-green-500 mb-3" />
                  <div className="text-3xl font-semibold text-[#0f172a] mb-1">{stats.completedThisMonth}</div>
                  <div className="text-sm text-[#64748b]">Completed This Month</div>
                  <div className="text-xs text-green-600 mt-2">↑ 8%</div>
                </div>

                <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
                  <Clock className="w-5 h-5 text-cyan-500 mb-3" />
                  <div className="text-3xl font-semibold text-[#0f172a] mb-1">{stats.avgTurnaroundTime}</div>
                  <div className="text-sm text-[#64748b]">Avg. Turnaround Time</div>
                </div>

                <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
                  <Users className="w-5 h-5 text-purple-500 mb-3" />
                  <div className="text-3xl font-semibold text-[#0f172a] mb-1">{stats.activeAdvisers}</div>
                  <div className="text-sm text-[#64748b]">Active Advisers</div>
                </div>
              </div>

              {/* Recent SOA Requests Table */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
                  <h3 className="font-semibold text-[#0f172a]">Recent SOA Requests</h3>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">View All → </a>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                        <th className="px-6 py-3 text-left font-semibold text-[#64748b]">CLIENT</th>
                        <th className="px-6 py-3 text-left font-semibold text-[#64748b]">ADVISER</th>
                        <th className="px-6 py-3 text-left font-semibold text-[#64748b]">STATUS</th>
                        <th className="px-6 py-3 text-left font-semibold text-[#64748b]">PRIORITY</th>
                        <th className="px-6 py-3 text-left font-semibold text-[#64748b]">SUBMITTED</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="5" className="px-6 py-4 text-center text-[#64748b]">Loading...</td></tr>
                      ) : soaRequests.length > 0 ? (
                        soaRequests.map((req, idx) => (
                          <tr key={idx} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-[#0f172a]">{req.client_name}</div>
                            </td>
                            <td className="px-6 py-4 text-[#64748b]">-</td>
                            <td className="px-6 py-4">
                              <Badge className={`${getStatusColor(req.status)} text-xs font-medium border-0`}>
                                {req.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-medium px-2 py-1 rounded-md ${getPriorityColor('normal')}`}>
                                NORMAL
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[#64748b]">
                              {req.submitted_date ? new Date(req.submitted_date).toLocaleDateString() : 'Pending'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" className="px-6 py-4 text-center text-[#64748b]">No SOA requests yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-80 flex-shrink-0 space-y-6">
              {/* Template Status */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-[#0f172a] mb-1">Template Status</h4>
                </div>
                <div className="bg-[#f0fdf4] rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-[#0f172a]">Custom Template</span>
                  </div>
                  <div className="text-xs text-[#64748b]">26 of 35 sections configured</div>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-9">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>

              {/* Adviser Activity */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
                <h4 className="font-semibold text-[#0f172a] mb-4">Adviser Activity</h4>
                <div className="space-y-4">
                  {[
                    { name: 'Michael Ross', count: 15, active: '12 completed' },
                    { name: 'Jessica Taylor', count: 12, active: '10 completed' },
                    { name: 'Andrew Walsh', count: 11, active: '7 completed' }
                  ].map((adv, idx) => (
                    <div key={idx} className="flex items-center justify-between pb-4 border-b border-[#e2e8f0] last:border-0 last:pb-0">
                      <div>
                        <div className="text-sm font-medium text-[#0f172a]">{adv.name}</div>
                        <div className="text-xs text-[#64748b]">{adv.active}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[#0f172a]">{adv.count}</div>
                        <div className="text-xs text-[#64748b]">This month</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
                <h4 className="font-semibold text-[#0f172a] mb-4">Quick Actions</h4>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 hover:bg-[#f8fafc] rounded-lg transition-colors text-left">
                    <FileText className="w-4 h-4 text-[#64748b]" />
                    <span className="text-sm text-[#0f172a] font-medium">Edit SOA Template</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-[#64748b]" />
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 hover:bg-[#f8fafc] rounded-lg transition-colors text-left">
                    <Users className="w-4 h-4 text-[#64748b]" />
                    <span className="text-sm text-[#0f172a] font-medium">Invite New Adviser</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-[#64748b]" />
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 hover:bg-[#f8fafc] rounded-lg transition-colors text-left">
                    <TrendingUp className="w-4 h-4 text-[#64748b]" />
                    <span className="text-sm text-[#0f172a] font-medium">Generate Report</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-[#64748b]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdviceGroupLayout>
  );
}