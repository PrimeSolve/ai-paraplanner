import React from 'react';
import CashflowModel from '@/cashflow/cashflow-model.jsx';

/**
 * Cashflow page — renders the CashflowModel component inside the main app shell.
 * Authentication is handled by the parent app's MSAL provider; the cashflow
 * module's apiClient re-exports the parent's axiosInstance directly.
 */
export default function Cashflow() {
  return (
    <div className="w-full h-full">
      <CashflowModel />
    </div>
  );
}
