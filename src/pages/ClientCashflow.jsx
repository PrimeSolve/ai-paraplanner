import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useRole } from '../components/RoleContext';
import { getAccessToken } from '@/auth/msalInstance';

export default function ClientCashflow() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { navigationChain, user } = useRole();

  useEffect(() => {
    if (!user) return;

    const redirectToCashflow = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const idFromUrl = params.get('id');
        let clientId = idFromUrl;

        if (!clientId) {
          // Get client from navigation chain (admin viewing as client)
          const currentLevel = navigationChain.length > 0
            ? navigationChain[navigationChain.length - 1]
            : null;

          if (currentLevel && currentLevel.type === 'client') {
            const clientEmail = currentLevel.id;
            const clients = await base44.entities.Client.filter({ email: clientEmail });
            if (clients[0]) {
              clientId = clients[0].id;
            }
          } else if (user?.linkedEntity?.type === 'client') {
            // Direct client login
            clientId = user.linkedEntity.data.id;
          }
        }

        if (clientId) {
          let redirectUrl = `https://paraplanner.primesolve.com.au/?client_id=${clientId}`;
          try {
            const token = await getAccessToken();
            if (token) {
              redirectUrl += `&access_token=${encodeURIComponent(token)}`;
            }
          } catch (tokenErr) {
            console.warn('Failed to acquire MSAL token for redirect, continuing without it:', tokenErr);
          }
          window.location.href = redirectUrl;
        } else {
          setError(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load client ID:', err);
        setError(true);
        setLoading(false);
      }
    };
    redirectToCashflow();
  }, [navigationChain, user]);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <p className="text-slate-600">Unable to load client information.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
    </div>
  );
}
