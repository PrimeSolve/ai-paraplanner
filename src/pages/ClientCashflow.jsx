import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useRole } from '@/components/RoleContext';
import CashflowModel from '@/cashflow/cashflow-model.jsx';
import { mapFactFindToCashflow, mapCashflowToFactFind, stripMetadata } from '../utils/factFindMapping';

export default function ClientCashflow() {
  const navigate = useNavigate();
  const { navigationChain } = useRole();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const factFindIdRef = useRef(null);
  const clientIdRef = useRef(null);
  const saveTimerRef = useRef(null);

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
        const clients = await base44.entities.Client.filter({ email: clientEmail });
        if (!clients || clients.length === 0) {
          setLoading(false);
          return;
        }
        const client = clients[0];
        clientIdRef.current = client.id;

        let ff;
        if (client.fact_find_id) {
          const existing = await base44.entities.FactFind.filter({ id: client.fact_find_id });
          if (existing[0]) ff = existing[0];
        }

        if (!ff) {
          ff = await base44.entities.FactFind.create({
            personal: {
              first_name: client.first_name || '',
              last_name: client.last_name || '',
              email: clientEmail,
              phone: client.phone || '',
            },
            status: 'in_progress',
            sections_completed: [],
          });
          await base44.entities.Client.update(client.id, { fact_find_id: ff.id });
        }

        factFindIdRef.current = ff.id;
        setInitialData(mapFactFindToCashflow(ff));
      } catch (err) {
        console.error('ClientCashflow: Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [clientEmail]);

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

        if (clientIdRef.current && factFindData.client1?.first_name) {
          await base44.entities.Client.update(clientIdRef.current, {
            first_name: factFindData.client1.first_name,
            last_name: factFindData.client1.last_name || '',
            email: factFindData.client1.email || '',
            phone: factFindData.client1.mobile || '',
          });
        }
      } catch (err) {
        console.error('ClientCashflow: Auto-save failed:', err);
      }
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 16, color: '#64748b' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <CashflowModel
        initialData={initialData}
        onDataChange={handleDataChange}
        onBack={() => navigate(-1)}
      />
    </div>
  );
}
