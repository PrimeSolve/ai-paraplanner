import React from 'react';
import CashflowModel from '@/cashflow/cashflow-model.jsx';

export default function ClientFactFindAI() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <CashflowModel mode="factfind" hideAdvice={true} />
    </div>
  );
}
