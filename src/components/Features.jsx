import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

// ── Feature card data ──
const features = [
  {
    icon: '✦',
    title: 'AI-Powered SOA Generation',
    desc: 'AI drafts comprehensive, compliant Statements of Advice in minutes. Every document reviewed by qualified paraplanners before delivery.',
    rgb: '245,124,0',
    expandItems: [
      'Full strategy rationale, product comparisons and fee disclosures',
      'Branded Word, PDF and interactive HTML output',
      'Lifespan compliance framework built in',
      'Human paraplanner review on every document',
    ],
  },
  {
    icon: '◈',
    title: 'Cashflow Modelling Engine',
    desc: "PrimeSolve's advanced optimisation engine models the ultimate pathway for your client. Every recommendation backed by rigorous scenario analysis.",
    rgb: '0,201,177',
    expandItems: [
      '38,500-line deterministic model — super, tax, CGT, estate planning',
      'Dual-model architecture — fact find and advice model',
      'Age Pension optimisation and asset register built-in',
      '80+ financial strategies modelled simultaneously',
    ],
  },
  {
    icon: '▤',
    title: 'Template & Example Library',
    desc: 'Professionally designed SOA templates or bring your own. Fully customisable to match your brand, tone, and way of delivering advice.',
    rgb: '30,136,229',
    expandItems: [
      'Global styling system — fonts, colours, spacing all configurable',
      'Shared templates across advice groups and individual advisers',
      'Version control and full template history',
      'Instant preview before generating any document',
    ],
  },
  {
    icon: '⬡',
    title: 'Multi-role Portal',
    desc: 'Purpose-built dashboards for Platform Admins, Advice Groups, Advisers, and Clients. Everyone sees the right view with the right permissions.',
    rgb: '140,80,255',
    expandItems: [
      'Four-level role hierarchy with granular permission control',
      'Advice group branding applied across all adviser accounts',
      'Client OTP access — no account creation required',
      'Full audit trail and activity log at every level',
    ],
  },
  {
    icon: '⊛',
    title: 'AI Compliance Checking',
    desc: 'Four independent AI models generate, debate, and vote on every response. Dramatically reduces errors and eliminates hallucinations. Human oversight guaranteed.',
    rgb: '220,70,140',
    expandItems: [
      'Multi-agent review — regulatory, strategy, product and quality layers',
      'Flags missing disclosures and non-compliant strategy language',
      'Scores each SOA section before human review',
      'Built on the Lifespan compliance framework',
    ],
  },
  {
    icon: '◎',
    title: 'AI Fact Find Assistant',
    desc: 'Clients chat naturally. The AI asks clarifying questions, explains complex terms, and captures everything accurately with smart pre-fill from uploaded documents.',
    rgb: '0,200,83',
    expandItems: [
      'Voice-enabled via Sage — clients speak, AI listens and records',
      'Document upload extracts and pre-fills all relevant fields',
      '75% faster completion than traditional paper fact finds',
      'Secure OTP client access — no login required',
    ],
  },
];

// Marquee items
const marqueeItems = [
  'Lifespan Compliant', '24hr SOA Turnaround', 'Human Reviewed',
  'Australian Built', 'AI-Powered', '75% Faster Fact Finds',
  '4+ Hours Saved Per SOA', 'PDF + Word + HTML Delivery',
  'Multi-Adviser Portal', 'Built by Advisers',
  'Cashflow Optimisation', 'Smart Pre-fill',
];

// ── Feature card component ──
function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [expanded, setExpanded] = useState(false);
  const { rgb } = feature;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      onClick={() => setExpanded(e => !e)}
      style={{
        position: 'relative',
        background: 'rgba(13,25,41,0.8)',
        border: expanded
          ? `1px solid rgba(${rgb},0.4)`
          : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20,
        padding: '32px 30px',
        backdropFilter: 'blur(20px)',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'border-color 0.35s ease, box-shadow 0.35s ease, transform 0.35s ease',
        transform: expanded ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: expanded
          ? `0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(${rgb},0.1)`
          : 'none',
      }}
      whileHover={{
        y: -6,
        borderColor: `rgba(${rgb},0.35)`,
        boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(${rgb},0.08)`,
      }}
    >
      {/* Corner glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 130, height: 130,
        background: `radial-gradient(circle at top right, rgba(${rgb},0.07) 0%, transparent 70%)`,
        pointerEvents: 'none', borderRadius: '0 20px 0 0',
      }} />

      {/* Icon */}
      <motion.div
        whileHover={{ scale: 1.12, rotate: -5 }}
        style={{
          width: 52, height: 52, borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, fontSize: 22,
          background: `rgba(${rgb},0.1)`,
          border: `1px solid rgba(${rgb},0.25)`,
          transition: 'all 0.3s ease',
        }}
      >
        {feature.icon}
      </motion.div>

      {/* Title */}
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 19, fontWeight: 700,
        letterSpacing: '-0.4px', lineHeight: 1.25,
        marginBottom: 12, color: '#F0F4FF',
        transition: 'color 0.3s',
      }}>
        {feature.title}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 14, color: 'rgba(176,196,222,0.65)',
        fontWeight: 300, lineHeight: 1.7,
        marginBottom: 20,
      }}>
        {feature.desc}
      </div>

      {/* Explore toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12, fontWeight: 500,
        color: `rgba(${rgb},0.9)`,
        letterSpacing: '0.3px',
      }}>
        <span>{expanded ? 'Close' : 'Explore'}</span>
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.25 }}
          style={{
            display: 'inline-block',
            width: 12, height: 12,
            borderRight: `1.5px solid rgba(${rgb},0.8)`,
            borderBottom: `1.5px solid rgba(${rgb},0.8)`,
            transform: 'rotate(-45deg)',
          }}
        />
      </div>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: `1px solid rgba(${rgb},0.15)`,
            }}>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {feature.expandItems.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      fontSize: 13, color: 'rgba(176,196,222,0.8)',
                      fontWeight: 300, lineHeight: 1.5,
                    }}
                  >
                    <span style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      background: `rgba(${rgb},0.12)`,
                      border: `1px solid rgba(${rgb},0.3)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: `rgb(${rgb})`, fontWeight: 700,
                      marginTop: 1,
                    }}>✓</span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Marquee strip ──
function Marquee() {
  const doubled = [...marqueeItems, ...marqueeItems];
  return (
    <div style={{
      position: 'relative', zIndex: 10,
      overflow: 'hidden',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '20px 0',
      marginTop: 80,
      background: 'rgba(6,13,26,0.6)',
    }}>
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
        style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap', width: 'max-content' }}
      >
        {doubled.map((item, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            fontSize: 13, fontWeight: 400,
            color: 'rgba(176,196,222,0.5)',
            letterSpacing: '0.3px',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#00C9B1', opacity: 0.6,
              display: 'inline-block',
            }} />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Main export ──
export default function Features() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' });

  return (
    <>
      <section id="features" style={{
        position: 'relative', zIndex: 10,
        padding: '120px 60px 0',
        maxWidth: 1200, margin: '0 auto',
      }}>
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', marginBottom: 80 }}
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
            What Sets Us Apart
          </div>

          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(36px, 4vw, 54px)',
            fontWeight: 700, letterSpacing: '-1px',
            lineHeight: 1.1, marginBottom: 16,
          }}>
            Breakthrough{' '}
            <em style={{
              fontStyle: 'normal',
              background: 'linear-gradient(135deg, #00C9B1, #00E5FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Features</em>
          </h2>

          <p style={{
            fontSize: 17, color: 'rgba(176,196,222,0.65)',
            fontWeight: 300, lineHeight: 1.7,
            maxWidth: 520, margin: '0 auto',
          }}>
            Everything a modern advice practice needs — built by advisers who've lived the pain.
          </p>
        </motion.div>

        {/* 6-card grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
        }}>
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>

      </section>

      {/* Marquee strip — full width, outside max-width container */}
      <Marquee />
    </>
  );
}
