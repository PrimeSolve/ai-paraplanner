import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useRole } from '@/components/RoleContext';
import CashflowModel from '@/cashflow/cashflow-model.jsx';
import { mapFactFindToCashflow, mapCashflowToFactFind, stripMetadata } from '../utils/factFindMapping';

export default function ClientFactFindAI() {
  const navigate = useNavigate();
  const { navigationChain } = useRole();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const factFindIdRef = useRef(null);
  const clientIdRef = useRef(null);
  const saveTimerRef = useRef(null);

  // Get client email from navigation chain
  const clientNav = navigationChain?.find(n => n.type === 'client');
  const clientEmail = clientNav?.id;

  useEffect(() => {
    if (!clientEmail) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);

        // 1. Get Client record by email
        const clients = await base44.entities.Client.filter({ email: clientEmail });
        if (!clients || clients.length === 0) {
          throw new Error(`No client found with email: ${clientEmail}`);
        }
        const client = clients[0];
        clientIdRef.current = client.id;

        // 2. Load or create FactFind
        let ff;
        if (client.fact_find_id) {
          const existing = await base44.entities.FactFind.filter({ id: client.fact_find_id });
          if (existing[0]) {
            ff = existing[0];
          }
        }

        if (!ff) {
          ff = await base44.entities.FactFind.create({
            personal: {
              first_name: client.first_name || '',
              last_name: client.last_name || '',
              email: clientEmail,
              phone: client.phone || '',
              notes: client.notes || '',
            },
            status: 'in_progress',
            sections_completed: [],
          });
          await base44.entities.Client.update(client.id, {
            fact_find_id: ff.id,
          });
        }

        factFindIdRef.current = ff.id;

        // 3. Map to cashflow model format
        setInitialData(mapFactFindToCashflow(ff));
      } catch (err) {
        console.error('ClientFactFindAI: Failed to load data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [clientEmail]);

  // Debounced auto-save when cashflow model data changes
  const handleDataChange = useCallback((factFindData) => {
    if (!factFindIdRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        const sections = mapCashflowToFactFind(factFindData);

        const current = await base44.entities.FactFind.filter({ id: factFindIdRef.current });
        const currentData = current[0];
        if (!currentData) return;

        const updatePayload = stripMetadata({ ...currentData, ...sections });
        await base44.entities.FactFind.update(factFindIdRef.current, updatePayload);

        // Sync basic client info back to Client entity
        if (clientIdRef.current && factFindData.client1?.first_name) {
          await base44.entities.Client.update(clientIdRef.current, {
            first_name: factFindData.client1.first_name,
            last_name: factFindData.client1.last_name || '',
            email: factFindData.client1.email || '',
            phone: factFindData.client1.mobile || '',
          });
        }

        console.log('ClientFactFindAI: Auto-saved to database');
      } catch (err) {
        console.error('ClientFactFindAI: Auto-save failed:', err);
      }
    }, 2000);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>Loading Fact Find...</div>
          <div style={{ fontSize: 14, color: '#64748b' }}>Fetching client data</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444', marginBottom: 12 }}>Failed to load Fact Find</div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>{error}</div>
          <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <CashflowModel
        initialData={initialData}
        onDataChange={handleDataChange}
        mode="factfind"
        hideAdvice={true}
        onBack={() => navigate(-1)}
      />
    </div>
  );
}
