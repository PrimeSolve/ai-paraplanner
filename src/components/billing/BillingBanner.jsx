import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import axiosInstance from '@/api/axiosInstance';

export default function BillingBanner({ onBillingStatus }) {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

  const handleCheckout = async (priceType) => {
    setCheckoutLoading(true);
    try {
      const response = await axiosInstance.post('/billing/checkout', { priceType });
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        toast.success('Checkout initiated');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading || !billing) return null;

  const hasSubscription = billing.subscriptionActive;
  const hasCredits = billing.soaCredits > 0;

  // STATE 2: Active subscription
  if (hasSubscription) {
    return (
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '12px',
        padding: '14px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>&#x2714;</span>
          <span style={{ fontWeight: '600', color: '#166534', fontSize: '14px' }}>
            Full Platform Access &mdash; {billing.planName || 'Active Plan'}
          </span>
        </div>
      </div>
    );
  }

  // STATE 1: Pay-per-SOA with credits remaining
  if (hasCredits) {
    return (
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '12px',
        padding: '14px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>&#x1F4B3;</span>
          <span style={{ fontWeight: '600', color: '#1e40af', fontSize: '14px' }}>
            {billing.soaCredits} SOA credit{billing.soaCredits !== 1 ? 's' : ''} remaining
          </span>
        </div>
        <button
          onClick={() => handleCheckout('credits_1')}
          disabled={checkoutLoading}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: checkoutLoading ? 'not-allowed' : 'pointer',
            opacity: checkoutLoading ? 0.7 : 1,
          }}
        >
          {checkoutLoading ? 'Loading...' : 'Buy More Credits'}
        </button>
      </div>
    );
  }

  // STATE 3: No credits, no subscription
  return (
    <div style={{
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '12px',
      padding: '14px 20px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>&#x26A0;</span>
        <span style={{ fontWeight: '600', color: '#991b1b', fontSize: '14px' }}>
          You have no SOA credits remaining
        </span>
      </div>
      <button
        onClick={() => handleCheckout('credits_1')}
        disabled={checkoutLoading}
        style={{
          background: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: checkoutLoading ? 'not-allowed' : 'pointer',
          opacity: checkoutLoading ? 0.7 : 1,
        }}
      >
        {checkoutLoading ? 'Loading...' : 'Buy Credits'}
      </button>
    </div>
  );
}
