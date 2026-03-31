import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

// ── Pricing data ──
const tiers = [
  {
    id: 'scaled',
    label: 'Scaled Advice',
    price: '350',
    period: 'per transaction',
    featured: false,
    cta: 'Get Started',
    ctaHref: '/Register',
    items: [
      { text: 'AI Fact Find with pre-fill',    teal: false },
      { text: 'AI SOA Request builder',         teal: false },
      { text: 'Human paraplanner review',       teal: false },
      { text: '48-hour turnaround',             teal: false },
      { text: 'PDF + Word + HTML delivery',     teal: false },
    ],
  },
  {
    id: 'comprehensive',
    label: 'Comprehensive Advice',
    price: '700',
    period: 'per transaction',
    featured: true,
    cta: 'Get Started',
    ctaHref: '/Register',
    items: [
      { text: 'Everything in Scaled Advice',        teal: true },
      { text: 'Custom AI avatar',                   teal: true },
      { text: 'Unlimited strategy recommendations', teal: true },
      { text: 'Unlimited cashflow models',          teal: true },
      { text: 'Stress test report',                 teal: true },
      { text: 'Presentation report',                teal: true, isNew: true },
      { text: 'Interactive delivery',               teal: true, isNew: true },
    ],
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    price: null,
    customPrice: 'Custom',
    period: 'volume pricing',
    featured: false,
    cta: 'Contact Us',
    ctaHref: 'mailto:hello@aiparaplanner.com.au',
    items: [
      { text: 'For advice groups',         teal: false },
      { text: 'Prepaid client packages',   teal: false },
      { text: 'Volume discounts available', teal: false },
      { text: 'Dedicated support',         teal: false },
      { text: 'Custom integrations',       teal: false },
    ],
  },
];

// ── Check icon ──
function Check({ teal }) {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, marginTop: 1,
      fontSize: 10, fontWeight: 700,
      background: teal ? 'rgba(0,201,177,0.12)' : 'rgba(255,255,255,0.05)',
      border: teal ? '1px solid rgba(0,201,177,0.3)' : '1px solid rgba(255,255,255,0.12)',
      color: teal ? '#00C9B1' : 'rgba(176,196,222,0.6)',
    }}>
      ✓
    </div>
  );
}

// ── Single pricing card ──
function PriceCard({ tier, index, inView }) {
  const { featured } = tier;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12 }}
      whileHover={{
        y: featured ? -6 : -4,
        borderColor: featured ? 'rgba(0,201,177,0.4)' : 'rgba(255,255,255,0.14)',
        boxShadow: featured
          ? '0 0 0 1px rgba(0,201,177,0.15), 0 40px 100px rgba(0,0,0,0.6), 0 0 60px rgba(0,201,177,0.1)'
          : '0 24px 60px rgba(0,0,0,0.4)',
      }}
      style={{
        position: 'relative',
        borderRadius: 24,
        border: featured
          ? '1px solid rgba(0,201,177,0.25)'
          : '1px solid rgba(255,255,255,0.08)',
        background: featured
          ? 'rgba(0,30,40,0.85)'
          : 'rgba(13,25,41,0.8)',
        backdropFilter: 'blur(24px)',
        padding: featured ? '48px 36px 36px' : '40px 36px 36px',
        overflow: 'hidden',
        boxShadow: featured
          ? '0 0 0 1px rgba(0,201,177,0.08), 0 30px 80px rgba(0,0,0,0.5)'
          : 'none',
      }}
    >
      {/* Featured gradient overlay */}
      {featured && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 24,
          background: 'linear-gradient(160deg, rgba(0,201,177,0.07) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Most Popular badge */}
      {featured && (
        <div style={{
          position: 'absolute', top: -1, left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #00C9B1, #00A693)',
          color: '#060D1A',
          fontSize: 10, fontWeight: 700,
          letterSpacing: '1.5px', textTransform: 'uppercase',
          padding: '5px 18px',
          borderRadius: '0 0 12px 12px',
        }}>
          Most Popular
        </div>
      )}

      {/* Tier label */}
      <div style={{
        fontSize: 10, fontWeight: 500,
        letterSpacing: '2px', textTransform: 'uppercase',
        color: featured ? '#00C9B1' : 'rgba(176,196,222,0.6)',
        marginBottom: 20,
      }}>
        {tier.label}
      </div>

      {/* Price */}
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 52, fontWeight: 400,
        lineHeight: 1, color: '#F0F4FF',
        fontVariantNumeric: 'tabular-nums',
        marginBottom: 6,
      }}>
        {tier.price ? (
          <>
            <span style={{ fontSize: '0.45em', verticalAlign: 'super', fontWeight: 400 }}>$</span>
            <span>{tier.price}</span>
          </>
        ) : (
          <span style={{ fontSize: 36, letterSpacing: '-0.5px' }}>{tier.customPrice}</span>
        )}
      </div>

      {/* Period */}
      <div style={{
        fontSize: 13, color: 'rgba(176,196,222,0.6)',
        fontWeight: 300, marginBottom: 28,
      }}>
        {tier.period}
      </div>

      {/* Divider */}
      <div style={{
        height: 1, marginBottom: 28,
        background: featured
          ? 'rgba(0,201,177,0.15)'
          : 'rgba(255,255,255,0.07)',
      }} />

      {/* Feature list */}
      <ul style={{
        listStyle: 'none',
        display: 'flex', flexDirection: 'column', gap: 13,
        marginBottom: 36,
      }}>
        {tier.items.map((item, i) => (
          <li key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            fontSize: 14, color: 'rgba(176,196,222,0.85)',
            fontWeight: 300, lineHeight: 1.5,
          }}>
            <Check teal={item.teal} />
            <span>
              {item.text}
              {item.isNew && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  fontSize: 10, fontWeight: 600,
                  color: '#00C9B1',
                  background: 'rgba(0,201,177,0.1)',
                  border: '1px solid rgba(0,201,177,0.2)',
                  borderRadius: 100, padding: '1px 7px',
                  letterSpacing: '0.5px', textTransform: 'uppercase',
                  marginLeft: 6, verticalAlign: 'middle',
                }}>
                  New
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <motion.a
        href={tier.ctaHref}
        whileHover={featured
          ? { y: -2, boxShadow: '0 12px 40px rgba(0,201,177,0.45)' }
          : { background: 'rgba(255,255,255,0.08)' }
        }
        style={{
          display: 'block', width: '100%',
          textAlign: 'center', padding: 14,
          borderRadius: 12, fontSize: 15, fontWeight: 600,
          textDecoration: 'none', transition: 'all 0.25s',
          fontFamily: "'DM Sans', sans-serif",
          ...(featured ? {
            background: 'linear-gradient(135deg, #00C9B1, #00A693)',
            color: '#060D1A',
            boxShadow: '0 4px 20px rgba(0,201,177,0.25)',
          } : {
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#F0F4FF',
          }),
        }}
      >
        {tier.cta}
      </motion.a>
    </motion.div>
  );
}

// ── Main export ──
export default function Pricing() {
  const headerRef = useRef(null);
  const gridRef   = useRef(null);
  const noteRef   = useRef(null);
  const stripRef  = useRef(null);

  const headerInView = useInView(headerRef, { once: true, margin: '-60px' });
  const gridInView   = useInView(gridRef,   { once: true, margin: '-60px' });
  const noteInView   = useInView(noteRef,   { once: true, margin: '-60px' });
  const stripInView  = useInView(stripRef,  { once: true, margin: '-60px' });

  return (
    <section id="pricing" style={{
      position: 'relative', zIndex: 10,
      padding: '120px 60px 140px',
      maxWidth: 1100, margin: '0 auto',
    }}>

      {/* Header */}
      <motion.div
        ref={headerRef}
        initial={{ opacity: 0, y: 28 }}
        animate={headerInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center', marginBottom: 70 }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,201,177,0.08)',
          border: '1px solid rgba(0,201,177,0.2)',
          borderRadius: 100, padding: '5px 14px',
          fontSize: 11, fontWeight: 500, color: '#00C9B1',
          letterSpacing: '1px', textTransform: 'uppercase',
          marginBottom: 20,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#00C9B1', display: 'inline-block',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          Transparent Pricing
        </div>

        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(36px, 4vw, 54px)',
          fontWeight: 700, letterSpacing: '-1px',
          lineHeight: 1.1, marginBottom: 16,
        }}>
          Simple, transparent{' '}
          <em style={{
            fontStyle: 'normal',
            background: 'linear-gradient(135deg, #00C9B1, #00E5FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>pricing</em>
        </h2>

        <p style={{
          fontSize: 17, color: 'rgba(176,196,222,0.6)',
          fontWeight: 300, lineHeight: 1.7,
        }}>
          Start with pay-as-you-go, upgrade when you're ready.
        </p>
      </motion.div>

      {/* Cards grid */}
      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.08fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {tiers.map((tier, i) => (
          <PriceCard key={tier.id} tier={tier} index={i} inView={gridInView} />
        ))}
      </div>

      {/* Footer note */}
      <motion.div
        ref={noteRef}
        initial={{ opacity: 0, y: 16 }}
        animate={noteInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        style={{
          textAlign: 'center', marginTop: 40,
          fontSize: 13, color: 'rgba(176,196,222,0.6)',
          fontWeight: 300,
        }}
      >
        All prices in AUD and exclude GST. &nbsp;·&nbsp; No lock-in contracts. &nbsp;·&nbsp;
        <a href="mailto:hello@aiparaplanner.com.au" style={{ color: '#00C9B1', textDecoration: 'none' }}>
          Questions? Talk to our team →
        </a>
      </motion.div>

      {/* CTA strip */}
      <motion.div
        ref={stripRef}
        initial={{ opacity: 0, y: 24 }}
        animate={stripInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        style={{
          marginTop: 80,
          borderRadius: 24,
          border: '1px solid rgba(0,201,177,0.12)',
          background: 'rgba(0,201,177,0.04)',
          padding: '48px 52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 32,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(0,201,177,0.08) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div>
          <h3 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 24, fontWeight: 700,
            letterSpacing: '-0.4px', marginBottom: 8,
          }}>
            Not sure which plan is right for you?
          </h3>
          <p style={{
            fontSize: 15, color: 'rgba(176,196,222,0.6)',
            fontWeight: 300, lineHeight: 1.6,
          }}>
            Book a 15-minute call with our team. We'll walk you through the platform
            and recommend the right fit for your practice.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0 }}>
          <motion.a
            href="mailto:hello@aiparaplanner.com.au"
            whileHover={{ y: -2, boxShadow: '0 12px 40px rgba(0,201,177,0.4)' }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #00C9B1, #00A693)',
              color: '#060D1A', padding: '14px 28px', borderRadius: 12,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15, fontWeight: 600,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Book a Demo →
          </motion.a>
          <motion.a
            href="#faq"
            whileHover={{ borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)' }}
            style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#F0F4FF', padding: '14px 24px', borderRadius: 12,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15, fontWeight: 400,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            View FAQ
          </motion.a>
        </div>
      </motion.div>

    </section>
  );
}
