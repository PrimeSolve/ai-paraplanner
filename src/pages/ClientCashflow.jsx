import React from 'react';
import { useNavigate } from 'react-router-dom';
import CashflowModel from '@/cashflow/cashflow-model.jsx';

export default function ClientCashflow() {
  const navigate = useNavigate();
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <CashflowModel onBack={() => navigate(-1)} />
    </div>
  );
}
