import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getAccessToken } from '@/auth/msalInstance';

export default function ClientCashflow() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const redirectToCashflow = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const idFromUrl = params.get('id');
        let clientId = idFromUrl;

        if (!clientId) {
          const userData = await base44.auth.me();
          const clients = await base44.entities.Client.filter({ user_email: userData.email });
          if (clients[0]) {
            clientId = clients[0].id;
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
          console.log('[Cashflow Debug] Redirect URL:', redirectUrl);
          console.log('[Cashflow Debug] URL length:', redirectUrl.length);
          console.log('[Cashflow Debug] Has access_token:', redirectUrl.includes('access_token='));
          const tokenMatch = redirectUrl.match(/access_token=([^&]*)/);
          if (tokenMatch) {
            const decoded = decodeURIComponent(tokenMatch[1]);
            const parts = decoded.split('.');
            console.log('[Cashflow Debug] Token parts:', parts.length, '| Token length:', decoded.length);
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
  }, []);

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
