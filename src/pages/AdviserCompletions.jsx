import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Download, Eye, ArrowRight } from 'lucide-react';

export default function AdviserCompletions() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [completedSOAs, setCompletedSOAs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const soas = await base44.entities.SOARequest.filter({ 
        created_by: currentUser.email,
        status: 'completed'
      }, '-updated_date', 50);

      setCompletedSOAs(soas);
    } catch (error) {
      console.error('Failed to load completed SOAs:', error);
    } finally {
      setLoading(false);
    }
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
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
              ✅ Completed SOAs
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              View and download your completed Statement of Advice documents
            </p>
          </div>

          {completedSOAs.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                No Completed SOAs Yet
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
                Once you complete SOA requests, they'll appear here
              </p>
              <Link to={createPageUrl('AdviserSOARequests')} style={{ textDecoration: 'none' }}>
                <button style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                  View SOA Requests
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {completedSOAs.map((soa) => (
                <div key={soa.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                      {soa.client_name}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      {soa.client_email}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                      <span>Completed: {new Date(soa.completed_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Link to={createPageUrl(`SOARequestDetails?id=${soa.id}`)} style={{ textDecoration: 'none' }}>
                      <button style={{ padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontWeight: '500', fontSize: '13px' }}>
                        <Eye style={{ width: '16px', height: '16px' }} />
                        View
                      </button>
                    </Link>
                    <button style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', fontSize: '13px' }}>
                      <Download style={{ width: '16px', height: '16px' }} />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
          );
}