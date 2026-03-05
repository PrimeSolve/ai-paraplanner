import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { ArrowLeft } from 'lucide-react';

export default function ClientCashflow() {
  const [clientId, setClientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadClientId = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const idFromUrl = params.get('id');

        if (idFromUrl) {
          setClientId(idFromUrl);
        } else {
          const userData = await base44.auth.me();
          const clients = await base44.entities.Client.filter({ user_email: userData.email });
          if (clients[0]) {
            setClientId(clients[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load client ID:', error);
      } finally {
        setLoading(false);
      }
    };
    loadClientId();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <p className="text-slate-600">Unable to load client information.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0">
      <iframe
        src={`https://paraplanner.primesolve.com.au/?client_id=${clientId}`}
        title="Cashflow Model"
        className="w-full h-full border-0"
        allow="fullscreen"
      />
      <button
        onClick={() => navigate(createPageUrl('ClientDashboard'))}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-slate-700 rounded-lg shadow-lg hover:bg-white hover:shadow-xl transition-all text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Client
      </button>
    </div>
  );
}
