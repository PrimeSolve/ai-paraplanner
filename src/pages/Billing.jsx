import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axiosInstance from '@/api/axiosInstance';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CreditCard,
  Receipt,
  Crown,
  ShoppingCart,
  ExternalLink,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const creditPackages = [
  { label: '1 Credit', priceType: 'CreditX1', description: 'Single SOA credit', highlight: false },
  { label: '5 Credits', priceType: 'CreditX5', description: '5 SOA credits', highlight: false },
  { label: '10 Credits', priceType: 'CreditX10', description: '10 SOA credits — best value', highlight: true },
];

const subscriptionPlans = [
  { label: 'Monthly', priceType: 'MonthlySubscription', description: 'Unlimited SOAs, billed monthly', highlight: false },
  { label: 'Annual', priceType: 'AnnualSubscription', description: 'Unlimited SOAs, billed annually — save 20%', highlight: true },
];

export default function Billing() {
  const [billing, setBilling] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [portalLoading, setPortalLoading] = useState(null);

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  const fetchBillingStatus = async () => {
    try {
      const response = await axiosInstance.get('/billing/status');
      setBilling(response.data);
    } catch (error) {
      console.error('Failed to fetch billing status:', error);
      toast.error('Failed to load billing information.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    if (invoices.length > 0) return;
    setInvoicesLoading(true);
    try {
      const response = await axiosInstance.get('/billing/invoices');
      setInvoices(response.data?.invoices || response.data || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Failed to load invoices.');
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleCheckout = async (priceType) => {
    setCheckoutLoading(priceType);
    try {
      const response = await axiosInstance.post('/billing/checkout', {
        priceType,
        successUrl: window.location.origin + '/Billing?billing=success',
        cancelUrl: window.location.origin + '/Billing?billing=cancelled',
      });
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        toast.success('Checkout initiated');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async (action) => {
    setPortalLoading(action);
    try {
      const response = await axiosInstance.post('/billing/portal', {
        returnUrl: window.location.origin + '/Billing',
      });
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Could not open billing portal.');
      }
    } catch (error) {
      console.error('Portal redirect failed:', error);
      toast.error('Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const hasSubscription = billing?.subscriptionActive;
  const hasCredits = billing?.soaCredits > 0;
  const isFreeTrial = !hasSubscription && !hasCredits && billing?.planName?.toLowerCase().includes('trial');
  const planState = hasSubscription
    ? (billing?.planName?.toLowerCase().includes('annual') ? 'annual' : 'monthly')
    : hasCredits
      ? 'transaction'
      : 'zero';

  return (
    <div style={{ padding: '24px 32px', maxWidth: '960px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
          Billing
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Manage your plan, credits, and payment details.
        </p>
      </div>

      {/* Current Plan Status Card */}
      <div style={{
        background: hasSubscription ? '#f0fdf4' : hasCredits ? '#eff6ff' : '#fef2f2',
        border: `1px solid ${hasSubscription ? '#bbf7d0' : hasCredits ? '#bfdbfe' : '#fecaca'}`,
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasSubscription ? (
            <Check className="w-5 h-5" style={{ color: '#16a34a' }} />
          ) : hasCredits ? (
            <CreditCard className="w-5 h-5" style={{ color: '#2563eb' }} />
          ) : (
            <AlertCircle className="w-5 h-5" style={{ color: '#dc2626' }} />
          )}
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px', color: hasSubscription ? '#166534' : hasCredits ? '#1e40af' : '#991b1b' }}>
              {hasSubscription
                ? `Full Platform Access — ${billing.planName || 'Active Plan'}`
                : hasCredits
                  ? `Pay-per-SOA — ${billing.soaCredits} credit${billing.soaCredits !== 1 ? 's' : ''} remaining`
                  : isFreeTrial
                    ? 'Free Trial — No credits remaining'
                    : 'No active plan or credits'}
            </div>
          </div>
        </div>
        {hasSubscription && (
          <button
            onClick={() => handlePortal('manage')}
            disabled={portalLoading === 'manage'}
            style={{
              background: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: portalLoading === 'manage' ? 'not-allowed' : 'pointer',
              opacity: portalLoading === 'manage' ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {portalLoading === 'manage' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Manage Plan
          </button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="plans" onValueChange={(val) => { if (val === 'invoices') fetchInvoices(); }}>
        <TabsList style={{ marginBottom: '24px' }}>
          <TabsTrigger value="plans" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Crown className="w-4 h-4" /> Plans
          </TabsTrigger>
          <TabsTrigger value="credits" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShoppingCart className="w-4 h-4" /> Buy Credits
          </TabsTrigger>
          <TabsTrigger value="invoices" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Receipt className="w-4 h-4" /> Invoice History
          </TabsTrigger>
          <TabsTrigger value="payment" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CreditCard className="w-4 h-4" /> Payment Method
          </TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {subscriptionPlans.map((plan) => {
              const isCurrentPlan = hasSubscription && (
                (plan.priceType === 'MonthlySubscription' && planState === 'monthly') ||
                (plan.priceType === 'AnnualSubscription' && planState === 'annual')
              );
              return (
                <div key={plan.priceType} style={{
                  background: 'white',
                  border: plan.highlight ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '24px',
                  position: 'relative',
                }}>
                  {plan.highlight && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '16px',
                      background: '#2563eb',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 10px',
                      borderRadius: '6px',
                    }}>
                      RECOMMENDED
                    </div>
                  )}
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0', color: '#0f172a' }}>
                    {plan.label}
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0' }}>
                    {plan.description}
                  </p>
                  {isCurrentPlan ? (
                    <div style={{
                      background: '#f0fdf4',
                      color: '#166534',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      textAlign: 'center',
                    }}>
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.priceType)}
                      disabled={checkoutLoading === plan.priceType}
                      style={{
                        width: '100%',
                        background: plan.highlight ? '#2563eb' : '#0f172a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: checkoutLoading === plan.priceType ? 'not-allowed' : 'pointer',
                        opacity: checkoutLoading === plan.priceType ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      {checkoutLoading === plan.priceType ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {hasSubscription ? 'Switch Plan' : 'Subscribe'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Free trial option for users with no plan */}
          {planState === 'zero' && !isFreeTrial && (
            <div style={{
              marginTop: '16px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>Free Trial</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Try the platform with a free SOA credit</p>
              </div>
              <button
                onClick={() => handleCheckout('FreeTrial')}
                disabled={checkoutLoading === 'FreeTrial'}
                style={{
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: checkoutLoading === 'FreeTrial' ? 'not-allowed' : 'pointer',
                  opacity: checkoutLoading === 'FreeTrial' ? 0.7 : 1,
                }}
              >
                {checkoutLoading === 'FreeTrial' ? 'Loading...' : 'Start Free Trial'}
              </button>
            </div>
          )}
        </TabsContent>

        {/* Buy Credits Tab */}
        <TabsContent value="credits">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {creditPackages.map((pkg) => (
              <div key={pkg.priceType} style={{
                background: 'white',
                border: pkg.highlight ? '2px solid #2563eb' : '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                position: 'relative',
              }}>
                {pkg.highlight && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#2563eb',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 10px',
                    borderRadius: '6px',
                  }}>
                    BEST VALUE
                  </div>
                )}
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0', color: '#0f172a' }}>
                  {pkg.label}
                </h3>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0' }}>
                  {pkg.description}
                </p>
                <button
                  onClick={() => handleCheckout(pkg.priceType)}
                  disabled={checkoutLoading === pkg.priceType}
                  style={{
                    width: '100%',
                    background: pkg.highlight ? '#2563eb' : '#0f172a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: checkoutLoading === pkg.priceType ? 'not-allowed' : 'pointer',
                    opacity: checkoutLoading === pkg.priceType ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {checkoutLoading === pkg.priceType ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Invoice History Tab */}
        <TabsContent value="invoices">
          {invoicesLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : invoices.length === 0 ? (
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '14px',
            }}>
              No invoices found.
            </div>
          ) : (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Description</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Amount</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#475569' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, idx) => (
                    <tr key={inv.id || idx} style={{ borderBottom: idx < invoices.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '12px 16px', color: '#334155' }}>
                        {inv.date ? new Date(inv.date).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155' }}>
                        {inv.description || inv.lines?.data?.[0]?.description || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#334155', fontWeight: '500' }}>
                        {inv.amount != null ? `$${(inv.amount / 100).toFixed(2)}` : inv.total != null ? `$${(inv.total / 100).toFixed(2)}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: inv.status === 'paid' ? '#f0fdf4' : '#fef9c3',
                          color: inv.status === 'paid' ? '#166534' : '#854d0e',
                        }}>
                          {inv.status || 'unknown'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {inv.invoiceUrl && (
                          <a href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}>
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Payment Method Tab */}
        <TabsContent value="payment">
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
          }}>
            <CreditCard className="w-10 h-10 mx-auto mb-3" style={{ color: '#94a3b8' }} />
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: '600', margin: '0 0 6px 0', color: '#0f172a' }}>
              Payment Method
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0' }}>
              View and update your payment details via the secure billing portal.
            </p>
            <button
              onClick={() => handlePortal('payment')}
              disabled={portalLoading === 'payment'}
              style={{
                background: '#0f172a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: portalLoading === 'payment' ? 'not-allowed' : 'pointer',
                opacity: portalLoading === 'payment' ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {portalLoading === 'payment' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Update Payment Method
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
