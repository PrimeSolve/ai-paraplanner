import React, { useState, useRef, useEffect } from 'react';
import { CreditCard, Star, ChevronDown } from 'lucide-react';

const CREDIT_OPTIONS = [
  { label: '1 Credit', price: '$700', priceType: 'credit_1' },
  { label: '5 Credits', price: '$3,000', savings: 'Save $500', priceType: 'credit_5' },
  { label: '10 Credits', price: '$5,500', savings: 'Save $1,500', priceType: 'credit_10' },
];

export default function BillingBanner({ licenceType, soaCredits, subscriptionActive, onCheckout, checkoutLoading }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isFullPlatform = licenceType === 'full_platform';
  const isTransaction = licenceType === 'transaction';
  const hasCredits = soaCredits > 0;
  const isRedState = isTransaction && !hasCredits;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBuyClick = (priceType) => {
    setDropdownOpen(false);
    onCheckout(priceType);
  };

  // Determine subtitle text for credits section
  const getCreditsSubtitle = () => {
    if (isFullPlatform) return 'Unlimited on Full Platform';
    if (soaCredits === 0) return 'No credits remaining';
    if (soaCredits === 1) return '1 SOA generation remaining';
    return `${soaCredits} SOA generations remaining`;
  };

  // Determine plan badge and description
  const getPlanBadge = () => {
    if (isFullPlatform) {
      return {
        text: '\u2705 Full Platform',
        bgColor: '#d1fae5',
        textColor: '#065f46',
      };
    }
    return {
      text: '\u26A1 Transaction',
      bgColor: '#fef3c7',
      textColor: '#92400e',
    };
  };

  const getPlanDescription = () => {
    if (isFullPlatform) return 'Unlimited SOA generations & all features';
    return 'Pay per SOA generation';
  };

  const planBadge = getPlanBadge();

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        border: isRedState ? '2px solid #ef4444' : '1px solid #e2e8f0',
        overflow: 'hidden',
        marginBottom: '32px',
      }}
    >
      {/* Top gradient line */}
      <div
        style={{
          height: '3px',
          background: 'linear-gradient(90deg, #2563eb, #7c3aed, #059669)',
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0',
          padding: '24px',
        }}
      >
        {/* Left — Credits */}
        <div style={{ paddingRight: '24px', borderRight: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CreditCard style={{ width: '16px', height: '16px', color: '#2563eb' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SOA Credits
            </span>
          </div>

          <div
            style={{
              fontSize: '36px',
              fontWeight: '700',
              color: hasCredits ? '#16a34a' : '#ef4444',
              marginBottom: '4px',
              lineHeight: '1',
            }}
          >
            {isFullPlatform ? '\u221E' : soaCredits}
          </div>

          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            {getCreditsSubtitle()}
          </div>

          {!isFullPlatform && (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={checkoutLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                  opacity: checkoutLoading ? 0.7 : 1,
                }}
              >
                {checkoutLoading ? 'Processing...' : 'Buy Credits'}
                <ChevronDown style={{ width: '14px', height: '14px' }} />
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    marginTop: '4px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    zIndex: 50,
                    minWidth: '240px',
                    overflow: 'hidden',
                  }}
                >
                  {CREDIT_OPTIONS.map((option) => (
                    <button
                      key={option.priceType}
                      onClick={() => handleBuyClick(option.priceType)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '12px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '13px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{option.label}</div>
                        {option.savings && (
                          <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '500' }}>
                            {option.savings}
                          </div>
                        )}
                      </div>
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>{option.price}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Middle — Plan */}
        <div style={{ padding: '0 24px', borderRight: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Star style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Plan
            </span>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '6px 14px',
                background: planBadge.bgColor,
                color: planBadge.textColor,
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              {planBadge.text}
            </span>
          </div>

          <div style={{ fontSize: '13px', color: '#64748b' }}>
            {getPlanDescription()}
          </div>
        </div>

        {/* Right — CTA */}
        <div style={{ paddingLeft: '24px' }}>
          {isRedState && (
            <>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#ef4444', marginBottom: '4px' }}>
                Action required
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                You have no credits remaining. Purchase credits to continue generating SOAs.
              </div>
              <button
                onClick={() => handleBuyClick('credit_1')}
                disabled={checkoutLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                  opacity: checkoutLoading ? 0.7 : 1,
                }}
              >
                {checkoutLoading ? 'Processing...' : 'Buy Credits Now \u2192'}
              </button>
            </>
          )}

          {isTransaction && hasCredits && (
            <>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                Human + AI Paraplanning
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                $14,999/year — less than half a paraplanner
              </div>
              <button
                onClick={() => onCheckout('full_platform')}
                disabled={checkoutLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                  opacity: checkoutLoading ? 0.7 : 1,
                }}
              >
                {checkoutLoading ? 'Processing...' : 'Upgrade Now \u2192'}
              </button>
            </>
          )}

          {isFullPlatform && (
            <>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#16a34a', marginBottom: '4px' }}>
                You're all set
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Full platform access with unlimited SOA generations
              </div>
              <button
                onClick={() => onCheckout('manage')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Manage Plan &rarr;
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
