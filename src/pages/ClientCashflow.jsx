import React from 'react';
import { useNavigate } from 'react-router-dom';
import CashflowModel from '@/cashflow/cashflow-model.jsx';
import { useRole } from '@/components/RoleContext';

export default function ClientCashflow() {
  const navigate = useNavigate();
  const { navigationChain } = useRole();
  const clientNav = navigationChain?.find(n => n.type === 'client');
  const clientId = clientNav?.id || null;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <CashflowModel mode="cashflow" onBack={() => navigate(-1)} clientId={clientId} />
    </div>
  );
}
