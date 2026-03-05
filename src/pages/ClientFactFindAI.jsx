import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function ClientFactFindAI() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const redirectToFactFind = async () => {
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
          window.location.href = `https://paraplanner.primesolve.com.au/?client_id=${clientId}&mode=factfind`;
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
    redirectToFactFind();
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
      <p className="text-slate-600">Loading AI Fact Find...</p>
    </div>
  );
}
