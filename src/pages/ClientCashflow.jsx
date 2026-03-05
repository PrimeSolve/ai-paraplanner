import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useRole } from '../components/RoleContext';
import { CASHFLOW_MODEL_URL } from '@/utils/config';
import { apiToEngine } from '@/utils/apiToEngine';

export default function ClientCashflow() {
  const [iframeUrl, setIframeUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [clientData, setClientData] = useState(null);
  const iframeRef = useRef(null);
  const { navigationChain, user } = useRole();
  const navigate = useNavigate();

  const sendClientData = useCallback(() => {
    if (!clientData || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: 'CLIENT_DATA', payload: clientData },
      CASHFLOW_MODEL_URL
    );
  }, [clientData]);

  useEffect(() => {
    if (!user) return;

    const loadClient = async () => {
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

        if (!clientId) {
          setError(true);
          setLoading(false);
          return;
        }

        // Fetch full client record via standard API and convert for engine
        const clients = await base44.entities.Client.filter({ id: clientId });
        const client = clients[0];

        if (!client) {
          console.error('[ClientCashflow] client not found for id:', clientId);
          setError(true);
          setLoading(false);
          return;
        }

        const engineData = apiToEngine(client);
        setClientData(engineData);
        setIframeUrl(`${CASHFLOW_MODEL_URL}?client_id=${clientId}`);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load client:', err);
        setError(true);
        setLoading(false);
      }
    };
    loadClient();
  }, [navigationChain, user]);

  const handleIframeLoad = useCallback(() => {
    setLoading(false);
    sendClientData();
  }, [sendClientData]);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <p className="text-slate-600">Unable to load client information.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Close button overlay */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 right-4 z-[60] flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur px-3 py-2 text-sm font-medium text-slate-700 shadow-md border border-slate-200 hover:bg-slate-100 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Close
      </button>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
        </div>
      )}

      {iframeUrl && (
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          title="Cashflow Model"
          className="w-full h-full border-0"
          allow="clipboard-write"
          onLoad={handleIframeLoad}
        />
      )}
    </div>
  );
}
