import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { formatDate } from '../utils/dateUtils';
import {
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Settings,
  Sparkles,
  ArrowRight,
  FileCheck,
  TrendingUp
} from 'lucide-react';


export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [adviser, setAdviser] = useState(null);
  const [factFinds, setFactFinds] = useState([]);
  const [soaRequests, setSoaRequests] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        // Check if viewing from admin (id parameter)
        const params = new URLSearchParams(window.location.search);
        const clientId = params.get('id');
        
        let clientData;
        if (clientId) {
          // Load specific client from admin view
          const clients = await base44.entities.Client.filter({ id: clientId });
          clientData = clients[0];
        } else {
          // Load logged-in user's client record
          const clients = await base44.entities.Client.filter({ user_email: userData.email });
          clientData = clients[0];
        }
        
        if (clientData) {
          setClient(clientData);
          
          // Load adviser
          if (clientData.adviser_email) {
            const advisers = await base44.entities.Adviser.filter({ email: clientData.adviser_email });
            if (advisers.length > 0) {
              setAdviser(advisers[0]);
            }
          }
        }

        const factFindData = await base44.entities.FactFind.filter({ 
          created_by: userData.email 
        }, '-created_date');
        setFactFinds(factFindData);

        const soaData = await base44.entities.SOARequest.filter({
          client_email: userData.email
        }, '-created_date');
        setSoaRequests(soaData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  const currentFactFind = factFinds.find(ff => ff.status !== 'submitted') || factFinds[0];
  const completedSOAs = soaRequests.filter(s => s.status === 'completed').length;
  const getInitials = (name) => {
    if (!name) return '👤';
    return name.split(' ').map(n => n[0]).toUpperCase().join('');
  };

  // Determine dashboard state
  const getDashboardState = () => {
    if (!currentFactFind) return 'first_time';
    if (currentFactFind.status === 'in_progress' && currentFactFind.completion_percentage > 0) return 'in_progress';
    if (currentFactFind.status === 'submitted' && completedSOAs === 0) return 'waiting_for_soa';
    if (currentFactFind.status === 'submitted' && completedSOAs > 0) return 'soa_ready';
    return 'first_time';
  };

  const dashboardState = getDashboardState();
  const sectionsCompleted = currentFactFind?.sections_completed?.length || 0;
  const totalSections = 11;

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Welcome Card - Different for first time vs returning */}
        {dashboardState === 'first_time' ? (
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '24px', 
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: '4px',
              background: 'linear-gradient(90deg, #0f4c5c 0%, #1a6b7c 100%)'
            }} />
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #e76f51 0%, #f4a261 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '700',
                color: 'white',
                flexShrink: 0
              }}>
                {adviser ? getInitials(`${adviser.first_name} ${adviser.last_name}`) : '👤'}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  Welcome, {client?.first_name || 'there'}! 👋
                </h2>
                <p style={{ color: '#64748b', marginBottom: '16px', lineHeight: '1.6' }}>
                  I'm excited to help you with your financial planning journey. To get started, please complete your Fact Find below — it takes about 15-20 minutes and helps me understand your current situation, goals, and what you'd like to achieve.
                </p>
                <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                  — {adviser ? `${adviser.first_name} ${adviser.last_name}` : 'Your Adviser'}{adviser?.company ? `, ${adviser.company}` : ''}
                </p>
              </div>
            </div>

          </div>
        ) : (
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '20px 24px', 
            marginBottom: '24px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0f4c5c 0%, #1a6b7c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '700',
                color: 'white',
                flexShrink: 0
              }}>
                {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'TH'}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' }}>
                  Welcome back, {client?.first_name || 'there'}! 👋
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b' }}>
                  Continue where you left off with your financial planning journey.
                </p>
              </div>
            </div>
            <Link to={createPageUrl('ClientTasks')} style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#475569',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = 'white';
              }}
              >
                <MessageSquare className="w-4 h-4" />
                Message {adviser?.first_name || 'Adviser'}
              </button>
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {/* Fact Find Status */}
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            border: '1px solid #e5e7eb', 
            padding: '20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '12px', 
              fontSize: '20px', 
              background: dashboardState === 'soa_ready' || dashboardState === 'waiting_for_soa' ? '#d1fae5' : '#fef3c7'
            }}>
              {dashboardState === 'soa_ready' || dashboardState === 'waiting_for_soa' ? '✅' : '📋'}
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
              {dashboardState === 'soa_ready' || dashboardState === 'waiting_for_soa' ? 'Complete' : 
               dashboardState === 'in_progress' ? `${currentFactFind?.completion_percentage || 0}%` : 'Not Started'}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
              {dashboardState === 'in_progress' && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {sectionsCompleted} of {totalSections} sections complete
                </div>
              )}
              {dashboardState === 'soa_ready' || dashboardState === 'waiting_for_soa' ? 'Fact Find Status' : 'Fact Find Progress'}
            </div>
            {dashboardState === 'soa_ready' || dashboardState === 'waiting_for_soa' ? (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#10b981', fontWeight: '500' }}>
                All sections complete ✓
              </div>
            ) : null}
          </div>

          {/* SOA Documents */}
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            border: '1px solid #e5e7eb', 
            padding: '20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '12px', 
              fontSize: '20px', 
              background: '#d1fae5'
            }}>
              ✅
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
              {completedSOAs}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
              SOA Documents
            </div>
          </div>

          {/* Messages */}
          {[
            { 
              label: 'Notifications', 
              value: '0', 
              icon: '🔔', 
              color: '#3b82f6',
              bgColor: '#dbeafe'
            }
          ].map((stat, idx) => (
            <div key={idx} style={{ 
              background: 'white', 
              borderRadius: '16px', 
              border: '1px solid #e5e7eb', 
              padding: '20px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '10px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '12px', 
                fontSize: '20px', 
                background: stat.bgColor
              }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Main Content */}
          <div>
            {/* Dynamic CTA based on state */}
            {dashboardState === 'first_time' && (
              <div style={{ 
                background: 'linear-gradient(135deg, #0f4c5c 0%, #1a6b7c 100%)', 
                borderRadius: '16px', 
                padding: '32px', 
                marginBottom: '24px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    flexShrink: 0
                  }}>
                    📋
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
                      Get Started
                    </h3>
                    <p style={{ opacity: 0.95, marginBottom: '20px', fontSize: '15px', lineHeight: '1.6' }}>
                      Begin your financial planning journey by completing your Fact Find. This helps your adviser understand your current situation and create a tailored plan for you.
                    </p>
                    <Link to={createPageUrl('FactFindWelcome')} style={{ textDecoration: 'none' }}>
                      <button style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '14px 28px',
                        background: 'white',
                        color: '#0f4c5c',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        Start Fact Find
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {dashboardState === 'in_progress' && (
              <div style={{ 
                background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', 
                borderRadius: '16px', 
                padding: '32px', 
                marginBottom: '24px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    flexShrink: 0
                  }}>
                    📋
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
                      Continue Your Fact Find
                    </h3>
                    <p style={{ opacity: 0.95, marginBottom: '20px', fontSize: '15px', lineHeight: '1.6' }}>
                      You're {currentFactFind.completion_percentage}% complete! Just a few more sections to go. Pick up where you left off — next up is <strong>{currentFactFind.current_section || 'Employment & Income'}</strong>.
                    </p>
                    <Link to={createPageUrl('FactFindWelcome') + `?id=${currentFactFind.id}`} style={{ textDecoration: 'none' }}>
                      <button style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '14px 28px',
                        background: 'white',
                        color: '#ea580c',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        Continue
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {dashboardState === 'waiting_for_soa' && (
              <div style={{ 
                background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', 
                borderRadius: '16px', 
                padding: '32px', 
                marginBottom: '24px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    flexShrink: 0
                  }}>
                    ⏳
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
                      Your Plan is Being Prepared
                    </h3>
                    <p style={{ opacity: 0.95, marginBottom: '20px', fontSize: '15px', lineHeight: '1.6' }}>
                      Great work completing your Fact Find! {adviser?.first_name || 'Your adviser'} is now preparing your personalised Statement of Advice. We'll notify you as soon as it's ready.
                    </p>
                    <Link to={createPageUrl('FactFindWelcome') + `?id=${currentFactFind.id}`} style={{ textDecoration: 'none' }}>
                      <button style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '14px 28px',
                        background: 'white',
                        color: '#0d9488',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        View Fact Find
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {dashboardState === 'soa_ready' && (
              <div style={{ 
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 
                borderRadius: '16px', 
                padding: '32px', 
                marginBottom: '24px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    flexShrink: 0
                  }}>
                    🎉
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
                      Your Plan is Ready! 🎉
                    </h3>
                    <p style={{ opacity: 0.95, marginBottom: '20px', fontSize: '15px', lineHeight: '1.6' }}>
                      {adviser?.first_name || 'Your adviser'} has completed your personalised Statement of Advice. Click below to review your comprehensive financial plan and next steps.
                    </p>
                    <Link to={createPageUrl('ClientDocuments')} style={{ textDecoration: 'none' }}>
                      <button style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '14px 28px',
                        background: 'white',
                        color: '#059669',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        View Your Plan
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                  Recent Activity
                </h3>
                <Link to={createPageUrl('ClientDocuments')} style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
                  View All →
                </Link>
              </div>
              <div style={{ padding: '16px 24px' }}>
                {dashboardState === 'in_progress' ? (
                  <>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '10px',
                      marginBottom: '8px',
                      background: '#fef3c7',
                      border: '1px solid #fde047'
                    }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '8px', 
                        background: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FileText className="w-4 h-4 text-orange-600" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: '#78350f', fontSize: '13px' }}>Fact Find – Assets section saved</div>
                        <div style={{ fontSize: '12px', color: '#92400e' }}>
                          Today 2:34 PM
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: '#fef3c7',
                        color: '#78350f',
                        flexShrink: 0
                      }}>
                        in progress
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '10px',
                      marginBottom: '8px',
                      background: '#d1fae5',
                      border: '1px solid #86efac'
                    }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '8px', 
                        background: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: '#166534', fontSize: '13px' }}>Fact Find – Personal Details completed</div>
                        <div style={{ fontSize: '12px', color: '#15803d' }}>
                          Yesterday 9:15 AM
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: '#d1fae5',
                        color: '#166534',
                        flexShrink: 0
                      }}>
                        complete
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid #f1f5f9'
                    }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '8px', 
                        background: '#f8fafc', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <MessageSquare className="w-4 h-4 text-slate-500" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>Message from {adviser?.first_name || 'your'} {adviser?.last_name || 'adviser'}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          25/01/2026
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: '#dbeafe',
                        color: '#0c4a6e',
                        flexShrink: 0
                      }}>
                        new
                      </span>
                    </div>
                  </>
                ) : soaRequests.length > 0 ? (
                  soaRequests.slice(0, 3).map((soa) => (
                    <div key={soa.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '10px',
                      marginBottom: '8px',
                      border: '1px solid #f1f5f9'
                    }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '8px', 
                        background: '#f8fafc', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FileText className="w-4 h-4 text-slate-500" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>Statement of Advice</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {formatDate(soa.created_date)}
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: soa.status === 'completed' ? '#d1fae5' : soa.status === 'in_progress' ? '#dbeafe' : '#f1f5f9',
                        color: soa.status === 'completed' ? '#065f46' : soa.status === 'in_progress' ? '#0c4a6e' : '#475569',
                        flexShrink: 0
                      }}>
                        {soa.status === 'completed' ? 'draft' : soa.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '10px',
                      marginBottom: '8px',
                      border: '1px solid #f1f5f9'
                    }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '8px', 
                        background: '#f8fafc', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center'
                      }}>
                        <FileText className="w-4 h-4 text-slate-500" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>Statement of Advice</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>28/01/2026</div>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: '#f1f5f9',
                        color: '#475569'
                      }}>
                        draft
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid #f1f5f9'
                    }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '8px', 
                        background: '#f8fafc', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center'
                      }}>
                        <FileText className="w-4 h-4 text-slate-500" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>Statement of Advice</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>18/01/2026</div>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: '#f1f5f9',
                        color: '#475569'
                      }}>
                        draft
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Actions */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '14px' }}>
                Quick Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to={createPageUrl('ClientDocuments')} style={{ textDecoration: 'none' }}>
                  <div style={{ 
                    padding: '12px 14px', 
                    background: '#f8fafc', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                  >
                    <FileCheck className="w-4 h-4 text-slate-500" />
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>Documents</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>View past documents</div>
                    </div>
                  </div>
                </Link>

                <Link to={createPageUrl('ClientTasks')} style={{ textDecoration: 'none' }}>
                  <div style={{ 
                    padding: '12px 14px', 
                    background: '#f8fafc', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                  >
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>Messages</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Chat with adviser</div>
                    </div>
                  </div>
                </Link>

                <Link to={createPageUrl('ClientCashflow')} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      padding: '12px 14px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                  >
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>Cashflow Model</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>View projections</div>
                    </div>
                  </div>
                </Link>

                <Link to={createPageUrl('ClientSettings')} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>Settings</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Manage profile</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Need Help AI Card */}
            <div style={{ 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', 
              borderRadius: '16px', 
              padding: '24px',
              color: 'white',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)'
            }}>
              <div style={{ 
                width: '48px',
                height: '48px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                Need Help?
              </h4>
              <p style={{ fontSize: '14px', opacity: 0.95, marginBottom: '18px', lineHeight: '1.5' }}>
                Our AI assistant is here to answer any questions about your financial plan.
              </p>
              <Link to={createPageUrl('ClientHelp')} style={{ textDecoration: 'none' }}>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'white',
                  color: '#8b5cf6',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Sparkles className="w-4 h-4" />
                  Start AI Chat
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
}