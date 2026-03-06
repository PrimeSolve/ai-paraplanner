import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getBillingStatus, createCheckout } from '@/api/billing';
import { Button } from '@/components/ui/button';
import { Users, FileText, CheckCircle, Clock, Eye, Plus, ArrowRight, TrendingUp } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { formatRelativeDate } from '../utils/dateUtils';
import { toast } from 'sonner';
import BillingBanner from '@/components/billing/BillingBanner';

// Safely extract a displayable string from any value (guards against React Error #31)
const safeStr = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (val.name) return safeStr(val.name);
    if (val.value) return safeStr(val.value);
    if (val.first_name || val.last_name) return `${safeStr(val.first_name)} ${safeStr(val.last_name)}`.trim();
    return JSON.stringify(val);
  }
  return String(val);
};

export default function AdviserDashboard() {
  const [loading, setLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    pendingFactFinds: 0,
    activeSOAs: 0,
    readyForDownload: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [billingStatus, setBillingStatus] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadData();
    loadBillingStatus();
  }, []);

  // Show success toast on return from Stripe
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      toast.success('Credits added to your account');
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });
      loadBillingStatus();
    }
  }, []);

  const loadBillingStatus = async () => {
    try {
      const status = await getBillingStatus();
      setBillingStatus(status);
    } catch (error) {
      console.error('Failed to load billing status:', error);
    }
  };

  const handleCheckout = async (priceType) => {
    if (priceType === 'manage') {
      // Redirect to Stripe customer portal
      try {
        setCheckoutLoading(true);
        const result = await createCheckout('manage', window.location.href, window.location.href);
        if (result.url) {
          window.location.href = result.url;
        }
      } catch (error) {
        console.error('Failed to open billing portal:', error);
        toast.error('Failed to open billing portal');
      } finally {
        setCheckoutLoading(false);
      }
      return;
    }

    try {
      setCheckoutLoading(true);
      const successUrl = window.location.origin + window.location.pathname + '?payment=success';
      const cancelUrl = window.location.origin + window.location.pathname;
      const result = await createCheckout(priceType, successUrl, cancelUrl);
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error('Failed to start checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Always fetch the actual logged-in user
      const currentUser = await base44.auth.me();
      console.log('🔍 Raw currentUser from auth.me():', currentUser);
      console.log('🔍 currentUser.full_name:', currentUser?.full_name);
      console.log('🔍 currentUser.email:', currentUser?.email);
      setLoggedInUser(currentUser);

      // Check if viewing a specific adviser
      const urlParams = new URLSearchParams(window.location.search);
      const adviserEmail = urlParams.get('adviser_email');
      console.log('🔍 Adviser email from URL:', adviserEmail);
      const emailToLoad = adviserEmail || currentUser.email;
      console.log('🔍 Email to load data for:', emailToLoad);

      const [clientsList, soas, factFinds] = await Promise.all([
        base44.entities.Client.filter({ adviser_email: emailToLoad }, '-updated_date', 5),
        base44.entities.SOARequest.filter({ created_by: emailToLoad }),
        base44.entities.FactFind.filter({ assigned_adviser: emailToLoad })
      ]);
      
      console.log('🔍 Loaded clients:', clientsList);

      setClients(clientsList);
      setStats({
        totalClients: clientsList.length,
        pendingFactFinds: factFinds.filter(f => f.status !== 'submitted' && f.status !== 'completed').length,
        activeSOAs: soas.filter(s => s.status === 'in_progress').length,
        readyForDownload: soas.filter(s => s.status === 'completed').length
      });

      // Build recent activity from real data
      const activities = [];

      factFinds.forEach(ff => {
        const client = clientsList.find(c => c.email === ff.created_by || c.user_email === ff.created_by);
        const name = client ? `${safeStr(client.first_name)} ${safeStr(client.last_name)}`.trim() : safeStr(ff.created_by || 'Client');
        if (ff.status === 'submitted' || ff.status === 'completed') {
          activities.push({ type: 'factfind', name, action: 'completed their Fact Find', time: formatRelativeDate(ff.updated_date || ff.created_date), icon: '📋', date: ff.updated_date || ff.created_date });
        }
      });

      soas.forEach(s => {
        const client = clientsList.find(c => c.email === s.client_email);
        const name = client ? `${safeStr(client.first_name)} ${safeStr(client.last_name)}`.trim() : safeStr(s.client_name || 'Client');
        if (s.status === 'completed') {
          activities.push({ type: 'soa', name, action: 'SOA is ready for download', time: formatRelativeDate(s.completed_date || s.updated_date), icon: '✅', date: s.completed_date || s.updated_date });
        } else if (s.status === 'in_progress') {
          activities.push({ type: 'soa', name, action: 'SOA is in progress', time: formatRelativeDate(s.updated_date || s.created_date), icon: '📝', date: s.updated_date || s.created_date });
        } else if (s.status === 'submitted') {
          activities.push({ type: 'soa', name, action: 'submitted SOA request', time: formatRelativeDate(s.submitted_date || s.created_date), icon: '📤', date: s.submitted_date || s.created_date });
        }
      });

      activities.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setRecentActivity(activities.slice(0, 5));
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
      <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
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

          {/* Billing Banner */}
          {billingStatus && (
            <BillingBanner
              licenceType={billingStatus.licence_type}
              soaCredits={billingStatus.soa_credits}
              subscriptionActive={billingStatus.subscription_active}
              onCheckout={handleCheckout}
              checkoutLoading={checkoutLoading}
            />
          )}

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
                              {getClientInitials(safeStr(client.first_name) + ' ' + safeStr(client.last_name))}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: '#1e293b' }}>{safeStr(client.first_name)} {safeStr(client.last_name)}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{safeStr(client.email)}</div>
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
                            {safeStr(client.risk_profile) || 'Not Set'}
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
                  <Link to={createPageUrl('AdviserModels')} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}>
                          <TrendingUp style={{ width: '20px', height: '20px', color: '#8b5cf6' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Cashflow Models</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>Build projections & models</div>
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
                  {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
                    <div key={idx} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', borderLeft: '3px solid #3b82f6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ fontSize: '16px' }}>{activity.icon}</div>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>
                          {safeStr(activity.name)} <span style={{ fontWeight: '400', color: '#64748b' }}>{safeStr(activity.action)}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '24px' }}>
                        {safeStr(activity.time)}
                      </div>
                    </div>
                  )) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                      No recent activity yet
                    </div>
                  )}
                </div>
              </div>
              </div>
              </div>
              </div>
              );
              }