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
  Sparkles,
  Loader2,
  ArrowRight,
} from 'lucide-react';

const BLUE = '#1d4ed8';
const BLUE_LIGHT = '#2563eb';

const creditPackages = [
  { label: '1 Credit', priceType: 'CreditX1', price: '$700', perUnit: '$700 / SOA', savings: null, highlight: false },
  { label: '5 Credits', priceType: 'CreditX5', price: '$3,000', perUnit: '$600 / SOA', savings: 'Save $500', highlight: false },
  { label: '10 Credits', priceType: 'CreditX10', price: '$5,500', perUnit: '$550 / SOA', savings: 'Save $1,500', highlight: true },
];

const allPlans = [
  {
    label: 'Transaction',
    priceType: null,
    price: 'From $550',
    priceSub: 'per SOA',
    description: 'Pay per Statement of Advice — no commitment',
    features: ['1x credit — $700', '5x credits — $3,000', '10x credits — $5,500'],
    highlight: false,
    isTransaction: true,
  },
  {
    label: 'Monthly',
    priceType: 'MonthlySubscription',
    price: '$1,800',
    priceSub: '/mo',
    description: 'Unlimited SOAs, billed monthly',
    features: ['Unlimited SOA generation', 'Cancel anytime', 'Priority support'],
    highlight: false,
    isTransaction: false,
  },
  {
    label: 'Annual',
    priceType: 'AnnualSubscription',
    price: '$14,999',
    priceSub: '/yr',
    description: 'Unlimited SOAs, billed annually — save 30%',
    features: ['Unlimited SOA generation', 'Dedicated account manager', 'Priority support'],
    highlight: true,
    isTransaction: false,
  },
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

  const creditCount = billing?.soaCredits ?? 0;
  const planLabel = hasSubscription
    ? (billing?.planName || 'Active Plan')
    : hasCredits
      ? 'Pay-per-SOA'
      : 'No active plan';

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

      {/* Onboarding Banner (new users) or Status Card (existing users) */}
      {planState === 'zero' && !isFreeTrial ? (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: BLUE }} />
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px', color: '#1e40af' }}>
              Welcome to AI Paraplanner
            </div>
            <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: '2px' }}>
              Choose a plan or buy credits to get started.
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: hasSubscription ? '#f0fdf4' : '#eff6ff',
          border: `1px solid ${hasSubscription ? '#bbf7d0' : '#bfdbfe'}`,
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
            ) : (
              <CreditCard className="w-5 h-5" style={{ color: BLUE_LIGHT }} />
            )}
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: hasSubscription ? '#166534' : '#1e40af' }}>
                {hasSubscription
                  ? `Full Platform Access — ${billing.planName || 'Active Plan'}`
                  : isFreeTrial
                    ? 'Free Trial — No credits remaining'
                    : `Pay-per-SOA — ${creditCount} credit${creditCount !== 1 ? 's' : ''} remaining`}
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
      )}

      {/* Credit & Plan Status Card */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px 24px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Credits</span>
          <span style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {creditCount}
          </span>
        </div>
        <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Plan</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
            {planLabel}
          </span>
        </div>
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

        {/* Plans Tab — 3 columns: Transaction, Monthly, Annual */}
        <TabsContent value="plans">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {allPlans.map((plan) => {
              const isCurrentPlan = hasSubscription && (
                (plan.priceType === 'MonthlySubscription' && planState === 'monthly') ||
                (plan.priceType === 'AnnualSubscription' && planState === 'annual')
              );
              return (
                <div key={plan.label} style={{
                  background: 'white',
                  border: plan.highlight ? `2px solid ${BLUE}` : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '24px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {plan.highlight && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '16px',
                      background: BLUE,
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 10px',
                      borderRadius: '6px',
                    }}>
                      RECOMMENDED
                    </div>
                  )}
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0', color: '#0f172a' }}>
                    {plan.label}
                  </h3>
                  <div style={{ margin: '8px 0 4px 0' }}>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {plan.price}
                    </span>
                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                      {plan.priceSub}
                    </span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px 0' }}>
                    {plan.description}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', flex: 1 }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ fontSize: '13px', color: '#475569', padding: '3px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#16a34a' }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrentPlan ? (
                    <div style={{
                      background: '#f0fdf4',
                      color: '#166534',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      textAlign: 'center',
                    }}>
                      Current Plan
                    </div>
                  ) : plan.isTransaction ? (
                    <button
                      onClick={() => {
                        const tabsTrigger = document.querySelector('[data-value="credits"]') ||
                          document.querySelector('[value="credits"]');
                        if (tabsTrigger) tabsTrigger.click();
                      }}
                      style={{
                        width: '100%',
                        background: 'white',
                        color: '#0f172a',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      Buy Credits
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.priceType)}
                      disabled={checkoutLoading === plan.priceType}
                      style={{
                        width: '100%',
                        background: plan.highlight ? BLUE : 'white',
                        color: plan.highlight ? 'white' : '#0f172a',
                        border: plan.highlight ? 'none' : '1px solid #e2e8f0',
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

          {/* Free trial link for new users */}
          {planState === 'zero' && !isFreeTrial && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                onClick={() => handleCheckout('FreeTrial')}
                disabled={checkoutLoading === 'FreeTrial'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '13px',
                  cursor: checkoutLoading === 'FreeTrial' ? 'not-allowed' : 'pointer',
                  padding: '4px 0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {checkoutLoading === 'FreeTrial' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                New to the platform? <span style={{ color: BLUE_LIGHT, fontWeight: '600' }}>Start with a free SOA credit</span>
                <ArrowRight className="w-3.5 h-3.5" style={{ color: BLUE_LIGHT }} />
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
                border: pkg.highlight ? `2px solid ${BLUE}` : '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {pkg.highlight && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: BLUE,
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 10px',
                    borderRadius: '6px',
                  }}>
                    BEST VALUE
                  </div>
                )}
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0', color: '#0f172a' }}>
                  {pkg.label}
                </h3>
                <div style={{ margin: '8px 0 4px 0' }}>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {pkg.price}
                  </span>
                </div>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 4px 0' }}>
                  {pkg.perUnit}
                </p>
                {pkg.savings && (
                  <span style={{
                    display: 'inline-block',
                    background: '#f0fdf4',
                    color: '#166534',
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '2px 10px',
                    borderRadius: '6px',
                    margin: '0 auto 16px auto',
                  }}>
                    {pkg.savings}
                  </span>
                )}
                {!pkg.savings && <div style={{ marginBottom: '16px' }} />}
                <div style={{ flex: 1 }} />
                <button
                  onClick={() => handleCheckout(pkg.priceType)}
                  disabled={checkoutLoading === pkg.priceType}
                  style={{
                    width: '100%',
                    background: pkg.highlight ? BLUE : 'white',
                    color: pkg.highlight ? 'white' : '#0f172a',
                    border: pkg.highlight ? 'none' : '1px solid #e2e8f0',
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
                          <a href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer" style={{ color: BLUE_LIGHT, fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}>
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
