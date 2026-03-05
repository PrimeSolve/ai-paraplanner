import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useRole } from '../components/RoleContext';

export default function ClientCashflow() {
  const { navigationChain, user } = useRole();

  useEffect(() => {
    if (!user) return;

    const redirect = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const idFromUrl = params.get('id');
        let clientId = idFromUrl;

        if (!clientId) {
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
            clientId = user.linkedEntity.data.id;
          }
        }

        if (clientId) {
          window.location.href = `https://paraplanner.primesolve.com.au/?client_id=${clientId}`;
        }
      } catch (err) {
        console.error('Failed to load client:', err);
      }
    };
    redirect();
  }, [navigationChain, user]);

  return null;
}
