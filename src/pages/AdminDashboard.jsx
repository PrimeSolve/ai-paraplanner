import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, Users, UserCheck, Clock, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGroups: 1,
    totalAdvisers: 0,
    totalClients: 0,
    pendingSOAs: 12
  });
  const [recentActivity, setRecentActivity] = useState([
    { 
      id: 1,
      client: 'John & Mary Smith', 
      adviser: 'Sarah Johnson', 
      group: 'PrimeSolve Financial', 
      status: 'in_progress',
      statusLabel: 'in progress',
      time: '2 hours ago',
      initial: 'J',
      bgColor: 'bg-blue-500'
    },
    { 
      id: 2,
      client: 'Robert Chen', 
      adviser: 'Michael Wong', 
      group: 'Wealth Partners', 
      status: 'pending',
      statusLabel: 'pending',
      time: '5 hours ago',
      initial: 'R',
      bgColor: 'bg-orange-500'
    },
    { 
      id: 3,
      client: 'Emma Williams', 
      adviser: 'Sarah Johnson', 
      group: 'PrimeSolve Financial', 
      status: 'submitted',
      statusLabel: 'submitted',
      time: 'Yesterday',
      initial: 'E',
      bgColor: 'bg-purple-500'
    },
    { 
      id: 4,
      client: 'David & Lisa Thompson', 
      adviser: 'James Lee', 
      group: 'Uptons Advisory', 
      status: 'completed',
      statusLabel: 'completed',
      time: '2 days ago',
      initial: 'D',
      bgColor: 'bg-cyan-500'
    }
  ]);

  const queueItems = [
    { name: 'Margaret Hughes', waiting: '6 days waiting', status: 'Overdue', statusColor: 'text-red-600', bgColor: 'bg-red-50' },
    { name: 'Peter & Jane Walsh', waiting: '4 days waiting', status: 'Attention', statusColor: 'text-amber-600', bgColor: 'bg-amber-50' },
    { name: 'Simon Clarke', waiting: '2 days waiting', status: 'On Track', statusColor: 'text-green-600', bgColor: 'bg-green-50' }
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [groups, clients] = await Promise.all([
        base44.entities.AdviceGroup.list(),
        base44.entities.Client.list()
      ]);

      const users = await base44.entities.User.list();
      const advisers = users.filter(u => u.user_type === 'adviser');
      
      setStats({
        totalGroups: groups.length,
        totalAdvisers: advisers.length,
        totalClients: clients.length,
        pendingSOAs: 12
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-orange-100 text-orange-700';
      case 'submitted': return 'bg-cyan-100 text-cyan-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTrendColor = (value) => {
    const num = parseFloat(value);
    return num > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="py-8 px-6">
         {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Total Advice Groups */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +12%
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {loading ? '...' : stats.totalGroups}
            </div>
            <div className="text-sm text-slate-600">Total Advice Groups</div>
          </div>

          {/* Total Advisers */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-cyan-600" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +8%
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {loading ? '...' : stats.totalAdvisers}
            </div>
            <div className="text-sm text-slate-600">Total Advisers</div>
          </div>

          {/* Total Clients */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +23%
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {loading ? '...' : stats.totalClients}
            </div>
            <div className="text-sm text-slate-600">Total Clients</div>
          </div>

          {/* Pending SOAs */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {stats.pendingSOAs}
            </div>
            <div className="text-sm text-slate-600">Pending SOAs</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Recent SOA Activity */}
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock3 className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-800">Recent SOA Activity</h3>
              </div>
              <Link to={createPageUrl('AdminQueue')} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View all
              </Link>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${activity.bgColor} flex items-center justify-center text-white font-bold text-lg`}>
                        {activity.initial}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm mb-0.5">{activity.client}</div>
                        <div className="text-xs text-slate-600">
                          {activity.adviser} • {activity.group}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${getStatusColor(activity.status)}`}>
                        {activity.statusLabel}
                      </span>
                      <span className="text-xs text-slate-500">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200">
              <div className="px-6 py-5 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-2">
                <Link to={createPageUrl('AdminAdviceGroups')} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 hover:text-slate-900">
                  <Building2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Manage Groups</span>
                </Link>
                <Link to={createPageUrl('AdminQueue')} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 hover:text-slate-900">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">View Queue</span>
                </Link>
                <Link to={createPageUrl('AdminTemplate')} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 hover:text-slate-900">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-sm font-medium">Edit Template</span>
                </Link>
              </div>
            </div>

            {/* Longest in Queue */}
            <div className="bg-white rounded-2xl border border-slate-200">
              <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-800">Longest in Queue</h3>
              </div>
              <div className="p-6 space-y-3">
                {queueItems.map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${item.bgColor} border-${item.statusColor.replace('text-', '')}/20`}>
                    <div className="font-semibold text-slate-800 text-sm mb-1">{item.name}</div>
                    <div className="text-xs text-slate-600 mb-2">{item.waiting}</div>
                    <span className={`text-xs font-semibold ${item.statusColor}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
            </div>
            </div>
            </div>
            );
            }