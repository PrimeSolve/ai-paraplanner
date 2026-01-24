import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdviceGroupLayout from '../components/advicegroup/AdviceGroupLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Target, TrendingUp } from 'lucide-react';

export default function AdviceGroupDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalAdvisers: 0,
    totalClients: 0,
    activeSoas: 0,
    riskProfiles: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.advice_group_id) {
        const [advisers, clients, profiles] = await Promise.all([
          base44.entities.User.filter({ advice_group_id: currentUser.advice_group_id, user_type: 'adviser' }),
          base44.entities.Client.filter({ advice_group_id: currentUser.advice_group_id }),
          base44.entities.RiskProfile.filter({ advice_group_id: currentUser.advice_group_id })
        ]);

        setStats({
          totalAdvisers: advisers.length,
          totalClients: clients.length,
          activeSoas: 23,
          riskProfiles: profiles.length
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Advisers', value: stats.totalAdvisers, icon: Users, color: 'bg-cyan-100 text-cyan-600' },
    { label: 'Clients', value: stats.totalClients, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Active SOAs', value: stats.activeSoas, icon: FileText, color: 'bg-green-100 text-green-600' },
    { label: 'Risk Profiles', value: stats.riskProfiles, icon: Target, color: 'bg-amber-100 text-amber-600' }
  ];

  return (
    <AdviceGroupLayout currentPage="AdviceGroupDashboard">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">Advice Group Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">Overview of your licensee operations</p>
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
                    <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600 font-semibold text-sm">
                      A
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">SOA submitted</div>
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
              <h3 className="font-semibold mb-4">Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">SOA Completion Rate</span>
                    <span className="font-semibold">94%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '94%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Client Satisfaction</span>
                    <span className="font-semibold">98%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdviceGroupLayout>
  );
}