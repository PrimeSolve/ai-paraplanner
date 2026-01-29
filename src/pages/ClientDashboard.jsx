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
  Settings
} from 'lucide-react';

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
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

  return (
    <ClientLayout currentPage="ClientDashboard">
      <div style={{ padding: '24px 32px' }}>
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {[
            { 
              label: 'Fact Find Status', 
              value: currentFactFind ? `${currentFactFind.completion_percentage || 0}%` : 'Not Started',
              icon: '📋', 
              color: '#8b5cf6' 
            },
            { 
              label: 'SOA Documents', 
              value: soaRequests.filter(s => s.status === 'completed').length, 
              icon: '✅', 
              color: '#10b981' 
            },
            { 
              label: 'Messages', 
              value: '0', 
              icon: '💬', 
              color: '#06b6d4' 
            }
          ].map((stat, idx) => (
            <div key={idx} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '16px', 
                fontSize: '24px', 
                background: `${stat.color}15` 
              }}>
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
          {/* Main Content */}
          <div>
            {/* Fact Find Progress */}
            {currentFactFind && (
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText className="w-5 h-5" />
                    Your Fact Find
                  </h3>
                </div>
                <div style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Progress</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{currentFactFind.completion_percentage || 0}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)', 
                          width: `${currentFactFind.completion_percentage || 0}%`,
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ 
                    padding: '16px', 
                    background: currentFactFind.status === 'submitted' ? '#f0fdf4' : '#fef3c7', 
                    borderRadius: '12px',
                    border: `1px solid ${currentFactFind.status === 'submitted' ? '#86efac' : '#fde047'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ 
                          fontWeight: '600', 
                          color: currentFactFind.status === 'submitted' ? '#166534' : '#78350f',
                          marginBottom: '4px',
                          fontSize: '14px'
                        }}>
                          {currentFactFind.status === 'submitted' ? 'Fact Find Complete' : 'Continue Your Fact Find'}
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: currentFactFind.status === 'submitted' ? '#15803d' : '#92400e'
                        }}>
                          {currentFactFind.status === 'submitted' 
                            ? 'Your adviser is reviewing your information'
                            : 'Complete your fact find to move forward with your financial plan'}
                        </div>
                      </div>
                      <Link 
                        to={createPageUrl('FactFindWelcome') + `?id=${currentFactFind.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <button style={{
                          padding: '10px 20px',
                          background: currentFactFind.status === 'submitted' ? '#10b981' : '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}>
                          {currentFactFind.status === 'submitted' ? 'Review' : 'Continue'}
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Fact Find */}
            {!currentFactFind && (
              <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #8b5cf6', padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                  Get Started
                </h3>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>
                  Begin your financial planning journey by completing your fact find
                </p>
                <Link to={createPageUrl('FactFindWelcome')} style={{ textDecoration: 'none' }}>
                  <button style={{
                    padding: '12px 24px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    Start Fact Find
                  </button>
                </Link>
              </div>
            )}

            {/* Recent Activity */}
            {soaRequests.length > 0 && (
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                    Recent Activity
                  </h3>
                </div>
                <div style={{ padding: '16px 24px' }}>
                  {soaRequests.slice(0, 3).map((soa) => (
                    <div key={soa.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '16px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '10px', 
                          background: '#e2e8f0', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          <FileText className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Statement of Advice</div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>
                            {new Date(soa.created_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: soa.status === 'completed' ? '#d1fae5' : soa.status === 'in_progress' ? '#dbeafe' : '#f1f5f9',
                        color: soa.status === 'completed' ? '#065f46' : soa.status === 'in_progress' ? '#0c4a6e' : '#475569'
                      }}>
                        {soa.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Quick Actions */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>
                Quick Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to={createPageUrl('ClientDocuments')} style={{ textDecoration: 'none' }}>
                  <div style={{ 
                    padding: '12px', 
                    background: '#f8fafc', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                  >
                    <FileText className="w-5 h-5 text-slate-600" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Documents</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>View all files</div>
                    </div>
                  </div>
                </Link>

                <Link to={createPageUrl('ClientMessages')} style={{ textDecoration: 'none' }}>
                  <div style={{ 
                    padding: '12px', 
                    background: '#f8fafc', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                  >
                    <MessageSquare className="w-5 h-5 text-slate-600" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Messages</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Chat with adviser</div>
                    </div>
                  </div>
                </Link>

                <Link to={createPageUrl('ClientSettings')} style={{ textDecoration: 'none' }}>
                  <div style={{ 
                    padding: '12px', 
                    background: '#f8fafc', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                  >
                    <Settings className="w-5 h-5 text-slate-600" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Settings</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Manage profile</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Help */}
            <div style={{ 
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
              borderRadius: '16px', 
              padding: '24px',
              color: 'white'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>💡</div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>
                Need Help?
              </h4>
              <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '16px' }}>
                Our team is here to assist you with any questions about your financial plan
              </p>
              <Link to={createPageUrl('ClientHelp')} style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '10px 20px',
                  background: 'white',
                  color: '#8b5cf6',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  width: '100%'
                }}>
                  Get Support
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}