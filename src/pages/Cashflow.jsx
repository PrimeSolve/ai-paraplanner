import React, { useEffect, useState } from 'react';
import { getAccessToken } from '@/auth/msalInstance';
import { setTokenProvider } from '@/cashflow/api/apiClient';
import CashflowModel from '@/cashflow/cashflow-model.jsx';

/**
 * Cashflow page — renders the primesolve-model CashflowModel component
 * inside the main app shell, using the parent app's MSAL authentication.
 * No separate login required.
 */
export default function Cashflow() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wire the parent app's MSAL token provider into the cashflow apiClient
    setTokenProvider(getAccessToken);
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <CashflowModel />
    </div>
  );
}
