import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalAdvisers: 0,
    totalClients: 0,
    pendingSOAs: 12,
    completedSOAs: 847,
    activeSOAs: 23
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [groups, clients] = await Promise.all([
        base44.entities.AdviceGroup.list(),
        base44.entities.Client.list()
      ]);

      const advisers = await base44.entities.User.filter({ user_type: 'adviser' });
      
      setStats({
        totalGroups: groups.length,
        totalAdvisers: advisers.length,
        totalClients: clients.length,
        pendingSOAs: 12,
        completedSOAs: 847,
        activeSOAs: 23
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Total Advice Groups', 
      value: stats.totalGroups, 
      icon: Users, 
      color: 'bg-indigo-100 text-indigo-600',
      trend: '+12%'
    },
    { 
      label: 'Total Advisers', 
      value: stats.totalAdvisers, 
      icon: Users, 
      color: 'bg-blue-100 text-blue-600',
      trend: '+8%'
    },
    { 
      label: 'Total Clients', 
      value: stats.totalClients, 
      icon: Users, 
      color: 'bg-green-100 text-green-600',
      trend: '+23%'
    },
    { 
      label: 'Pending SOAs', 
      value: stats.pendingSOAs, 
      icon: Clock, 
      color: 'bg-amber-100 text-amber-600',
      urgent: true
    }
  ];

  return (
    <AdminLayout currentPage="AdminDashboard">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">Admin Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">System overview and management</p>
      </div>

      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {stat.trend && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        stat.urgent ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {stat.trend}
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-['Fraunces'] font-semibold text-slate-800 mb-1">
                    {loading ? '...' : stat.value}
                  </div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent SOA Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { client: 'John & Mary Smith', adviser: 'Sarah Johnson', group: 'PrimeSolve Financial', status: 'in_progress', time: '2 hours ago' },
                    { client: 'Robert Chen', adviser: 'Michael Wong', group: 'Wealth Partners', status: 'completed', time: '5 hours ago' },
                    { client: 'Emma Williams', adviser: 'Sarah Johnson', group: 'PrimeSolve Financial', status: 'submitted', time: 'Yesterday' }
                  ].map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                          {activity.client.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{activity.client}</div>
                          <div className="text-xs text-slate-600">
                            {activity.adviser} • {activity.group}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                          {activity.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-slate-500">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link to={createPageUrl('AdminAdviceGroups')}>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Manage Groups
                    </Button>
                  </Link>
                  <Link to={createPageUrl('AdminQueue')}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      View Queue
                    </Button>
                  </Link>
                  <Link to={createPageUrl('AdminTemplate')}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Edit Template
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">API Status</span>
                    <Badge className="bg-green-100 text-green-600">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Queue Processing</span>
                    <Badge className="bg-green-100 text-green-600">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Storage</span>
                    <Badge className="bg-blue-100 text-blue-600">87% Used</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}