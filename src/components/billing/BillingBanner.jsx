import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { createPageUrl } from '../../utils';

export default function BillingBanner({ onBillingStatus }) {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  const fetchBillingStatus = async () => {
    try {
      const response = await axiosInstance.get('/billing/status');
      setBilling(response.data);
      if (onBillingStatus) onBillingStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch billing status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !billing) return null;

  const hasSubscription = billing.subscriptionActive;
  const hasCredits = billing.soaCredits > 0;

  const bgColor = hasSubscription ? '#f0fdf4' : hasCredits ? '#eff6ff' : '#fef2f2';
  const borderColor = hasSubscription ? '#bbf7d0' : hasCredits ? '#bfdbfe' : '#fecaca';
  const textColor = hasSubscription ? '#166534' : hasCredits ? '#1e40af' : '#991b1b';
  const icon = hasSubscription ? '\u2714' : hasCredits ? '\uD83D\uDCB3' : '\u26A0';
  const label = hasSubscription
    ? billing.planName || 'Active Plan'
    : hasCredits
      ? `${billing.soaCredits} SOA credit${billing.soaCredits !== 1 ? 's' : ''}`
      : 'No credits remaining';

  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '12px',
      padding: '10px 20px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <span style={{ fontWeight: '600', color: textColor, fontSize: '13px' }}>
          {label}
        </span>
      </div>
      <Link
        to={createPageUrl('Billing')}
        style={{
          color: '#2563eb',
          fontSize: '13px',
          fontWeight: '600',
          textDecoration: 'none',
        }}
      >
        Manage Billing &rarr;
      </Link>
    </div>
  );
}
