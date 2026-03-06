import React from 'react';
import { useNavigate } from 'react-router-dom';
import CashflowModel from '@/cashflow/cashflow-model.jsx';

export default function ClientFactFindAI() {
  const navigate = useNavigate();
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <CashflowModel mode="factfind" hideAdvice={true} onBack={() => navigate(-1)} />
    </div>
  );
}
