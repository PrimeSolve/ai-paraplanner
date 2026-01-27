import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Users, FileText, CheckCircle, Clock, Eye, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AdviserSidebar from '../components/adviser/AdviserSidebar';
import AdviserHeader from '../components/adviser/AdviserHeader';

export default function AdviserDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    pendingFactFinds: 0,
    activeSOAs: 0,
    readyForDownload: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [clientsList, soas, factFinds] = await Promise.all([
        base44.entities.Client.filter({ adviser_email: currentUser.email }, '-updated_date', 5),
        base44.entities.SOARequest.filter({ created_by: currentUser.email }),
        base44.entities.FactFind.filter({ assigned_adviser: currentUser.email })
      ]);

      setClients(clientsList);
      setStats({
        totalClients: clientsList.length,
        pendingFactFinds: factFinds.filter(f => f.status !== 'submitted' && f.status !== 'completed').length,
        activeSOAs: soas.filter(s => s.status === 'in_progress').length,
        readyForDownload: soas.filter(s => s.status === 'completed').length
      });

      // Mock recent activity
      const activities = [
        { type: 'factfind', name: 'John Smith', action: 'completed their Fact Find', time: '2 hrs ago', icon: '📋' },
        { type: 'soa', name: 'Sarah Jones', action: 'is ready for download', time: '5 hrs ago', icon: '✅' },
        { type: 'factfind', name: 'David Wilson', action: 'sent to', time: 'Yesterday', icon: '📤' }
      ];
      setRecentActivity(activities);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'My Clients', value: stats.totalClients, icon: Users, color: 'bg-teal-100 text-teal-600' },
    { label: 'Active SOAs', value: stats.activeSOAs, icon: FileText, color: 'bg-blue-100 text-blue-600' },
    { label: 'Completed SOAs', value: stats.completedSOAs, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    { label: 'Pending Fact Finds', value: stats.pendingFactFinds, icon: Clock, color: 'bg-amber-100 text-amber-600' }
  ];

  return (
    <AdviserLayout currentPage="AdviserDashboard">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">Adviser Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">Welcome back, {user?.full_name || 'Adviser'}</p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx}>
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
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

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-semibold text-sm">
                      C
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Client submitted fact find</div>
                      <div className="text-xs text-slate-500">2 hours ago</div>
                    </div>
                    <Badge variant="secondary">New</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to={createPageUrl('AdviserClients')}>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    View Clients
                  </Button>
                </Link>
                <Link to={createPageUrl('AdviserSOARequests')}>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    SOA Requests
                  </Button>
                </Link>
                <Link to={createPageUrl('AdviserFactFinds')}>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Fact Finds
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdviserLayout>
  );
}