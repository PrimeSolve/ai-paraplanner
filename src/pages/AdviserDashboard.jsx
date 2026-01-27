import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Users, FileText, CheckCircle, Clock, Eye, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AdviserLayout from '../components/adviser/AdviserLayout.jsx';

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

  const getClientInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C';
  };

  const getAvatarColor = (index) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-purple-100 text-purple-600',
      'bg-teal-100 text-teal-600',
      'bg-orange-100 text-orange-600',
      'bg-pink-100 text-pink-600'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex">
        <AdviserSidebar currentPage="dashboard" />
        <div style={{ marginLeft: '260px', flex: 1 }}>
          <AdviserHeader user={user} />
          <div className="p-8 flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdviserLayout currentPage="AdviserDashboard">
      <div style={{ padding: '24px 32px' }}>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
            {[
              { label: 'Total Clients', value: stats.totalClients, icon: '👤', color: '#8b5cf6' },
              { label: 'Pending Fact Finds', value: stats.pendingFactFinds, icon: '📋', color: '#f59e0b' },
              { label: 'SOAs in Progress', value: stats.activeSOAs, icon: '📝', color: '#06b6d4' },
              { label: 'Ready for Download', value: stats.readyForDownload, icon: '✅', color: '#10b981' }
            ].map((stat, idx) => (
              <div key={idx} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', position: 'relative' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '24px', background: `${stat.color}15` }}>
                  {stat.icon}
                </div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            {/* Recent Clients */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>👤 Recent Clients</h3>
                </div>
                <Link to={createPageUrl('AdviserClients')} style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
                  View all →
                </Link>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#1e293b', textTransform: 'uppercase', fontSize: '12px' }}>CLIENT</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#1e293b', textTransform: 'uppercase', fontSize: '12px' }}>FACT FIND</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#1e293b', textTransform: 'uppercase', fontSize: '12px' }}>SOA STATUS</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#1e293b', textTransform: 'uppercase', fontSize: '12px' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client, idx) => (
                      <tr key={client.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '14px' }} className={getAvatarColor(idx)}>
                              {getClientInitials(client.first_name + ' ' + client.last_name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: '#1e293b' }}>{client.first_name} {client.last_name}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{client.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 24px' }}>
                          {client.fact_find_id ? (
                            <span style={{ display: 'inline-block', padding: '4px 10px', background: '#d1fae5', color: '#065f46', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>
                              ✓ Complete
                            </span>
                          ) : (
                            <span style={{ display: 'inline-block', padding: '4px 10px', background: '#e0e7ff', color: '#3730a3', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>
                              In Progress
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 24px' }}>
                          <span style={{ display: 'inline-block', padding: '4px 10px', background: '#dbeafe', color: '#0c4a6e', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>
                            {client.risk_profile || 'Not Set'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 24px' }}>
                          <Link to={createPageUrl(`AdviserClientDetail?id=${client.id}`)} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500', fontSize: '13px' }}>
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Quick Actions */}
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚡ Quick Actions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Link to={createPageUrl('AdviserClients')} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '20px' }}>👤</div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Add New Client</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>Create client & send Fact Find</div>
                        </div>
                      </div>
                      <ArrowRight style={{ width: '16px', height: '16px', color: '#64748b' }} />
                    </div>
                  </Link>
                  <Link to={createPageUrl('AdviserSOARequests')} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '20px' }}>📝</div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>New SOA Request</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>Start a new advice document</div>
                        </div>
                      </div>
                      <ArrowRight style={{ width: '16px', height: '16px', color: '#64748b' }} />
                    </div>
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📊 Recent Activity
                  </h3>
                  <Link to={createPageUrl('AdviserDashboard')} style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
                    View all
                  </Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', borderLeft: '3px solid #3b82f6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ fontSize: '16px' }}>{activity.icon}</div>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>
                          {activity.name} <span style={{ fontWeight: '400', color: '#64748b' }}>{activity.action}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '24px' }}>
                        {activity.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdviserLayout>
  );
}