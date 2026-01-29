import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import ClientLayout from '../components/client/ClientLayout';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Calendar,
  MessageSquare,
  Settings,
  Play,
  Sparkles,
  ArrowRight,
  History as HistoryIcon
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

        // Load client record
        const clients = await base44.entities.Client.filter({ user_email: userData.email });
        if (clients.length > 0) {
          setClient(clients[0]);
          
          // Load adviser
          if (clients[0].adviser_email) {
            const advisers = await base44.entities.Adviser.filter({ email: clients[0].adviser_email });
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
      <ClientLayout currentPage="ClientDashboard">
        <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
        </div>
      </ClientLayout>
    );
  }

  const currentFactFind = factFinds.find(ff => ff.status !== 'submitted') || factFinds[0];
  const getInitials = (name) => {
    if (!name) return 'SH';
    return name.split(' ').map(n => n[0]).toUpperCase().join('');
  };

  return (
    <ClientLayout currentPage="ClientDashboard">
      <div style={{ padding: '32px' }}>
        {/* Welcome Card */}
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
              {adviser ? getInitials(`${adviser.first_name} ${adviser.last_name}`) : 'SH'}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                Welcome, {user?.full_name?.split(' ')[0] || 'Tim'}! 👋
              </h2>
              <p style={{ color: '#64748b', marginBottom: '16px', lineHeight: '1.6' }}>
                I'm excited to help you with your financial planning journey. To get started, please complete your Fact Find below — it takes about 15-20 minutes and helps me understand your current situation, goals, and what you'd like to achieve.
              </p>
              <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                — {adviser ? `${adviser.first_name} ${adviser.last_name}` : 'Stephen Hawke'}, {adviser?.company || 'ABS Wealth'}
              </p>
            </div>
          </div>
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
            <button style={{
              display: 'inline-flex',
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
              <Play className="w-4 h-4" />
              Watch Welcome Video
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {[
            { 
              label: 'Fact Find Status', 
              value: currentFactFind?.status === 'submitted' ? 'Complete' : currentFactFind ? `${currentFactFind.completion_percentage || 0}%` : 'Not Started',
              icon: '📋', 
              color: '#f59e0b',
              bgColor: '#fef3c7'
            },
            { 
              label: 'SOA Documents', 
              value: soaRequests.filter(s => s.status === 'completed').length, 
              icon: '✅', 
              color: '#10b981',
              bgColor: '#d1fae5'
            },
            { 
              label: 'Messages', 
              value: '2', 
              icon: '💬', 
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
            {/* Get Started CTA */}
            {!currentFactFind || currentFactFind.status !== 'submitted' ? (
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
            ) : null}

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
                {soaRequests.length > 0 ? (
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
                          {new Date(soa.created_date).toLocaleDateString()}
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
                    <HistoryIcon className="w-4 h-4 text-slate-500" />
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>History</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>View past documents</div>
                    </div>
                  </div>
                </Link>

                <Link to={createPageUrl('ClientMessages')} style={{ textDecoration: 'none' }}>
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
    </ClientLayout>
  );
}