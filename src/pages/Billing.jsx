import React, { useState, useEffect, useRef } from 'react';
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
  AlertTriangle,
} from 'lucide-react';

const BLUE = '#1d4ed8';
const BLUE_LIGHT = '#2563eb';

const creditPackages = [
  {
    label: '1 Credit',
    qty: 1,
    priceType: 'CreditX1',
    price: '$700',
    priceNum: 700,
    perUnit: '$700 / credit',
    savings: null,
    highlight: false,
    equivalency: '1 Comprehensive SOA or 2 Limited Advice SOAs',
  },
  {
    label: '5 Credits',
    qty: 5,
    priceType: 'CreditX5',
    price: '$3,000',
    priceNum: 3000,
    perUnit: '$600 / credit',
    savings: 'Save $500',
    highlight: true,
    badge: 'Best value',
    equivalency: '5 Comprehensive SOAs or 10 Limited Advice SOAs',
  },
  {
    label: '10 Credits',
    qty: 10,
    priceType: 'CreditX10',
    price: '$5,500',
    priceNum: 5500,
    perUnit: '$550 / credit',
    savings: 'Save $1,500',
    highlight: false,
    equivalency: '10 Comprehensive SOAs or 20 Limited Advice SOAs',
  },
];

const allPlans = [
  {
    label: 'Monthly',
    stripePriceId: 'price_1T7qfNBpUiq2TMIq2O0ihl3b',
    price: '$1,800',
    priceSub: '/mo',
    description: 'Unlimited SOAs, billed monthly',
    features: [
      'Unlimited SOA generation',
      '3 credits included per month',
      'Unused credits roll over',
      'Cancel anytime',
      'Priority support',
    ],
    highlight: true,
    planKey: 'monthly',
  },
  {
    label: 'Annual',
    stripePriceId: 'price_1T7qgGBpUiq2TMIqy330qO3w',
    price: '$14,999',
    priceSub: '/yr',
    description: 'Unlimited SOAs, billed annually — save 30%',
    features: [
      'Unlimited SOA generation',
      '48 credits included per year',
      'Dedicated account manager',
      'Human + AI compliance review',
      'Priority support',
    ],
    highlight: false,
    planKey: 'annual',
  },
];

function getEquivalencyLine(credits) {
  if (credits <= 0) return null;
  const comp = credits;
  const limited = credits * 2;
  return `${comp} Comprehensive SOA${comp !== 1 ? 's' : ''} or up to ${limited} Limited Advice SOA${limited !== 1 ? 's' : ''}`;
}

function getPlanPill(planState, billing) {
  const styles = {
    transaction: { bg: '#eff6ff', color: '#1d4ed8', label: 'Transaction' },
    monthly: { bg: '#f0fdf4', color: '#166534', label: 'Monthly' },
    annual: { bg: '#f0fdf4', color: '#166534', label: 'Annual' },
    zero: { bg: '#fef2f2', color: '#991b1b', label: 'No plan' },
  };
  const s = styles[planState] || styles.zero;
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '700',
      background: s.bg,
      color: s.color,
      letterSpacing: '0.02em',
    }}>
      {s.label}
    </span>
  );
}

export default function Billing() {
  const [billing, setBilling] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [portalLoading, setPortalLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('credits');
  const tabsRef = useRef(null);

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
        successUrl: 'https://app.aiparaplanner.com.au/Billing?success=true',
        cancelUrl: 'https://app.aiparaplanner.com.au/AdviserDashboard',
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

  const switchToCreditsTab = () => {
    setActiveTab('credits');
  };

  const handleTabChange = (val) => {
    setActiveTab(val);
    if (val === 'invoices') fetchInvoices();
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
  const isNewUser = !hasSubscription && !hasCredits && !billing?.planName;
  const planState = hasSubscription
    ? (billing?.planName?.toLowerCase().includes('annual') ? 'annual' : 'monthly')
    : hasCredits
      ? 'transaction'
      : 'zero';

  const creditCount = billing?.soaCredits ?? 0;
  const equivalency = getEquivalencyLine(creditCount);
  const maxCredits = 10;
  const progressPct = hasSubscription ? 100 : Math.min((creditCount / maxCredits) * 100, 100);

  // ── 1. State Banner (conditional) ──
  const renderBanner = () => {
    if (hasSubscription || hasCredits) return null;

    if (isNewUser) {
      return (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
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
      );
    }

    // Zero state — had plan/credits before, now at zero
    return (
      <div style={{
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
        <div>
          <div style={{ fontWeight: '600', fontSize: '15px', color: '#991b1b' }}>
            No credits remaining
          </div>
          <div style={{ fontSize: '13px', color: '#b91c1c', marginTop: '2px' }}>
            Purchase credits or subscribe to a plan to continue generating SOAs.
          </div>
        </div>
      </div>
    );
  };

  // ── 2. Hero Status Card ──
  const renderHeroCard = () => {
    const creditColor = hasSubscription ? '#16a34a' : hasCredits ? BLUE : '#dc2626';
    const creditDisplay = hasSubscription ? '\u221e' : creditCount;

    return (
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '32px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '48px',
      }}>
        {/* Left column */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '60px',
            fontWeight: '700',
            color: creditColor,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            lineHeight: 1,
          }}>
            {creditDisplay}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
            {hasSubscription ? 'Unlimited SOA credits' : `SOA credit${creditCount !== 1 ? 's' : ''} remaining`}
          </div>
          {equivalency && (
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              {equivalency}
            </div>
          )}
          {/* Progress bar */}
          <div style={{
            marginTop: '16px',
            height: '6px',
            background: '#f1f5f9',
            borderRadius: '3px',
            overflow: 'hidden',
            maxWidth: '280px',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: creditColor,
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px', flexShrink: 0 }}>
          {getPlanPill(planState, billing)}
          {hasSubscription && billing?.renewalDate && (
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Renews {new Date(billing.renewalDate).toLocaleDateString()}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            {hasSubscription ? (
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
                Manage plan
              </button>
            ) : (
              <>
                <button
                  onClick={switchToCreditsTab}
                  style={{
                    background: BLUE,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Buy credits
                </button>
                <button
                  onClick={() => setActiveTab('plans')}
                  style={{
                    background: 'white',
                    color: '#0f172a',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  View plans
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px 32px', width: '100%' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
          Billing
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Manage your plan, credits, and payment details.
        </p>
      </div>

      {/* 1. State Banner */}
      {renderBanner()}

      {/* 2. Hero Status Card */}
      {renderHeroCard()}

      {/* 3. Tabs: Buy Credits (default) · Plans · Invoice History · Payment Method */}
      <Tabs value={activeTab} onValueChange={handleTabChange} ref={tabsRef}>
        <TabsList style={{ marginBottom: '24px' }}>
          <TabsTrigger value="credits" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShoppingCart className="w-4 h-4" /> Buy Credits
          </TabsTrigger>
          <TabsTrigger value="plans" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Crown className="w-4 h-4" /> Plans
          </TabsTrigger>
          <TabsTrigger value="invoices" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Receipt className="w-4 h-4" /> Invoice History
          </TabsTrigger>
          <TabsTrigger value="payment" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CreditCard className="w-4 h-4" /> Payment Method
          </TabsTrigger>
        </TabsList>

        {/* ── 4. Buy Credits Tab ── */}
        <TabsContent value="credits">
          {/* Blue explainer bar */}
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            padding: '14px 20px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#1e40af',
            lineHeight: '1.5',
          }}>
            <strong>1 credit = 1 Comprehensive SOA</strong> &middot; 0.5 credits = 1 Limited Advice SOA (portfolio review, product switching, or insurance only). Credits never expire.
          </div>

          {/* Credit cards */}
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
                {pkg.highlight && pkg.badge && (
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
                    whiteSpace: 'nowrap',
                  }}>
                    {pkg.badge.toUpperCase()}
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
                    margin: '0 auto 8px auto',
                  }}>
                    {pkg.savings}
                  </span>
                )}
                {!pkg.savings && <div style={{ marginBottom: '8px' }} />}
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                  {pkg.equivalency}
                </p>
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

          {/* Free trial link for new users */}
          {planState === 'zero' && (
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

        {/* ── 5. Plans Tab ── */}
        <TabsContent value="plans">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {allPlans.map((plan) => {
              const isCurrentPlan = hasSubscription && planState === plan.planKey;
              return (
                <div key={plan.label} style={{
                  background: 'white',
                  border: plan.highlight ? '2px solid #3b82f6' : '1px solid #e2e8f0',
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
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.stripePriceId)}
                      disabled={checkoutLoading === plan.stripePriceId}
                      style={{
                        width: '100%',
                        background: plan.highlight ? BLUE : 'white',
                        color: plan.highlight ? 'white' : '#0f172a',
                        border: plan.highlight ? 'none' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: checkoutLoading === plan.stripePriceId ? 'not-allowed' : 'pointer',
                        opacity: checkoutLoading === plan.stripePriceId ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      {checkoutLoading === plan.stripePriceId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Subscribe
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── 6. Invoice History Tab ── */}
        {/* TODO: Verify invoices endpoint is returning data — stub UI may show empty state */}
        <TabsContent value="invoices">
          {invoicesLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {invoices.length === 0 ? (
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
                            {inv.date ? new Date(inv.date).toLocaleDateString() : '\u2014'}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#334155' }}>
                            {inv.description || inv.lines?.data?.[0]?.description || '\u2014'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: '#334155', fontWeight: '500' }}>
                            {inv.amount != null ? `$${(inv.amount / 100).toFixed(2)}` : inv.total != null ? `$${(inv.total / 100).toFixed(2)}` : '\u2014'}
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

              {/* Open Stripe portal button */}
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handlePortal('invoices')}
                  disabled={portalLoading === 'invoices'}
                  style={{
                    background: '#0f172a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: portalLoading === 'invoices' ? 'not-allowed' : 'pointer',
                    opacity: portalLoading === 'invoices' ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {portalLoading === 'invoices' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  Open Stripe portal
                </button>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── 7. Payment Method Tab ── */}
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
