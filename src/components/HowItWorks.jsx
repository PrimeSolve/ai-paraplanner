import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

// ── Step data ──
const steps = [
  {
    number: '1',
    icon: '🧠',
    label: 'Step 01',
    title: 'Build Your Client Profile',
    desc: 'Send your client an AI-powered Fact Find. Smart pre-fill extracts data from existing documents while the AI assistant guides them through every section — no jargon, no confusion.',
    pills: [
      { text: 'AI-Powered',    color: 'teal' },
      { text: 'Smart Pre-fill', color: 'blue' },
      { text: 'Mobile Friendly', color: 'purple' },
    ],
    iconBg: 'rgba(0,201,177,0.12)',
    iconBorder: 'rgba(0,201,177,0.2)',
    gold: false,
  },
  {
    number: '2',
    icon: '⚡',
    label: 'Step 02',
    title: 'Create a Cashflow Model or SOA Request',
    desc: 'Your AI paraplanner guides you through recommendations in real time. It prompts for missing details, validates your strategy, and ensures nothing slips through the cracks.',
    pills: [
      { text: 'Real-time Guidance', color: 'teal' },
      { text: 'Smart Validation',   color: 'blue' },
      { text: 'Nothing Missed',     color: 'teal' },
    ],
    iconBg: 'rgba(30,136,229,0.12)',
    iconBorder: 'rgba(30,136,229,0.2)',
    gold: false,
  },
  {
    number: '3',
    icon: '📄',
    label: 'Step 03',
    title: 'AI Generates a Compliant SOA',
    desc: "Powered by PrimeSolve's optimised modelling engine, AI drafts a comprehensive, compliant Statement of Advice — including strategy rationale, product comparisons, and fee disclosures.",
    pills: [
      { text: 'Lifespan Compliant', color: 'purple' },
      { text: 'Auto-formatted',     color: 'teal' },
      { text: 'Instant Draft',      color: 'blue' },
    ],
    iconBg: 'rgba(140,80,255,0.12)',
    iconBorder: 'rgba(140,80,255,0.2)',
    gold: false,
  },
  {
    number: '4',
    icon: '✓',
    label: 'Step 04',
    title: 'Human Review & Delivery',
    desc: 'A qualified paraplanner reviews every document before it leaves the platform. Your client receives a beautifully formatted SOA — PDF, Word, and interactive HTML — within 24 hours.',
    pills: [
      { text: 'Human Reviewed', color: 'gold' },
      { text: '24hr Turnaround', color: 'gold' },
      { text: 'PDF + Word + HTML', color: 'gold' },
    ],
    iconBg: 'rgba(245,166,35,0.12)',
    iconBorder: 'rgba(245,166,35,0.2)',
    gold: true,
  },
];

const pillColors = {
  teal:   { bg: 'rgba(0,201,177,0.08)',   color: '#00C9B1', border: 'rgba(0,201,177,0.2)' },
  blue:   { bg: 'rgba(30,136,229,0.08)',  color: '#60B4FF', border: 'rgba(30,136,229,0.2)' },
  purple: { bg: 'rgba(140,80,255,0.08)',  color: '#B794FF', border: 'rgba(140,80,255,0.2)' },
  gold:   { bg: 'rgba(245,166,35,0.08)',  color: '#F5A623', border: 'rgba(245,166,35,0.2)' },
};

// ── Step card component ──
function StepCard({ step, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const isLeft = index % 2 === 0; // odd steps: card left, even steps: card right

  const cardStyle = {
    background: 'rgba(13,25,41,0.75)',
    border: step.gold ? '1px solid rgba(245,166,35,0.15)' : '1px solid rgba(0,201,177,0.12)',
    borderRadius: 18,
    padding: '32px 36px',
    backdropFilter: 'blur(20px)',
    transition: 'all 0.4s ease',
    position: 'relative',
    overflow: 'hidden',
  };

  const nodeColor  = step.gold ? '#F5A623' : '#00C9B1';
  const nodeBg     = step.gold
    ? 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,166,35,0.05))'
    : 'linear-gradient(135deg, rgba(0,201,177,0.15), rgba(0,201,177,0.05))';
  const nodeBorder = step.gold ? 'rgba(245,166,35,0.4)' : 'rgba(0,201,177,0.4)';
  const nodeGlow   = step.gold
    ? '0 0 30px rgba(245,166,35,0.3), inset 0 0 20px rgba(245,166,35,0.08)'
    : '0 0 30px rgba(0,201,177,0.3), inset 0 0 20px rgba(0,201,177,0.08)';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 80px 1fr',
        alignItems: 'start',
        padding: '40px 0',
      }}
    >
      {/* Card — left for even index, right for odd */}
      {isLeft ? (
        <>
          <div style={cardStyle} className="hiw-step-card">
            <CardContent step={step} />
          </div>
          <NodeCircle
            number={step.number}
            color={nodeColor}
            bg={nodeBg}
            border={nodeBorder}
            glow={nodeGlow}
            isInView={isInView}
          />
          <div />
        </>
      ) : (
        <>
          <div />
          <NodeCircle
            number={step.number}
            color={nodeColor}
            bg={nodeBg}
            border={nodeBorder}
            glow={nodeGlow}
            isInView={isInView}
          />
          <div style={cardStyle} className="hiw-step-card">
            <CardContent step={step} />
          </div>
        </>
      )}
    </motion.div>
  );
}

function NodeCircle({ number, color, bg, border, glow, isInView }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      paddingTop: 28, position: 'relative', zIndex: 5,
    }}>
      <div style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Pulse ring */}
        <div style={{
          position: 'absolute',
          inset: -8,
          borderRadius: '50%',
          border: `1px solid ${color}40`,
          animation: 'nodeRingPulse 3s ease-in-out infinite',
        }} />
        {/* Circle */}
        <motion.div
          animate={isInView ? { scale: [0.8, 1.1, 1] } : {}}
          transition={{ duration: 0.6 }}
          style={{
            width: 56, height: 56,
            borderRadius: '50%',
            background: bg,
            border: `1.5px solid ${border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Syne', sans-serif",
            fontSize: 20, fontWeight: 700,
            color,
            boxShadow: isInView ? glow : 'none',
          }}
        >
          {number}
        </motion.div>
      </div>
    </div>
  );
}

function CardContent({ step }) {
  return (
    <>
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18, fontSize: 20,
        background: step.iconBg,
        border: `1px solid ${step.iconBorder}`,
      }}>
        {step.icon}
      </div>

      {/* Label */}
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: step.gold ? '#F5A623' : '#00C9B1',
        marginBottom: 10,
      }}>
        {step.label}
      </div>

      {/* Title */}
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 22, fontWeight: 700,
        letterSpacing: '-0.5px', lineHeight: 1.2,
        marginBottom: 14, color: '#F0F4FF',
      }}>
        {step.title}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 15, lineHeight: 1.7,
        color: 'rgba(176,196,222,0.65)',
        fontWeight: 300, marginBottom: 22,
      }}>
        {step.desc}
      </div>

      {/* Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {step.pills.map((pill, i) => {
          const c = pillColors[pill.color];
          return (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 100,
              fontSize: 11, fontWeight: 500,
              background: c.bg, color: c.color, border: `1px solid ${c.border}`,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
              {pill.text}
            </span>
          );
        })}
      </div>
    </>
  );
}

// ── Timeline fill on scroll ──
function TimelineFill({ timelineRef }) {
  const fillRef   = useRef(null);
  const signalRef = useRef(null);

  useEffect(() => {
    function update() {
      if (!timelineRef.current || !fillRef.current || !signalRef.current) return;
      const rect    = timelineRef.current.getBoundingClientRect();
      const winH    = window.innerHeight;
      const total   = rect.height;
      const scrolled = Math.max(0, winH * 0.6 - rect.top);
      const pct     = Math.min(100, Math.max(0, (scrolled / total) * 100));

      fillRef.current.style.height  = pct + '%';
      signalRef.current.style.top   = pct + '%';
      signalRef.current.style.opacity = pct > 2 && pct < 97 ? '1' : '0';
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <>
      {/* Track */}
      <div style={{
        position: 'absolute', left: '50%', top: 40, bottom: 40,
        width: 2, transform: 'translateX(-50%)',
        background: 'rgba(0,201,177,0.08)', overflow: 'hidden',
      }}>
        <div ref={fillRef} style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '0%',
          background: 'linear-gradient(to bottom, #00C9B1, rgba(0,201,177,0.2))',
          transition: 'height 0.05s linear',
          borderRadius: 2,
        }} />
      </div>
      {/* Signal dot */}
      <div ref={signalRef} style={{
        position: 'absolute', left: '50%',
        transform: 'translateX(-50%)',
        width: 8, height: 8, borderRadius: '50%',
        background: '#00C9B1',
        boxShadow: '0 0 12px rgba(0,201,177,0.8)',
        top: '0%', transition: 'top 0.05s linear',
        zIndex: 2, opacity: 0,
      }} />
    </>
  );
}

// ── Main export ──
export default function HowItWorks() {
  const timelineRef = useRef(null);
  const headerRef   = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' });
  const ctaRef      = useRef(null);
  const ctaInView   = useInView(ctaRef, { once: true, margin: '-60px' });

  return (
    <section id="how-it-works" style={{
      position: 'relative', zIndex: 10,
      padding: '120px 60px 140px',
      maxWidth: 1100, margin: '0 auto',
    }}>

      {/* Header */}
      <motion.div
        ref={headerRef}
        initial={{ opacity: 0, y: 30 }}
        animate={headerInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center', marginBottom: 90 }}
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
            background: '#00C9B1',
            animation: 'pulse 2s ease-in-out infinite',
            display: 'inline-block',
          }} />
          The Process
        </div>

        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(36px, 4vw, 52px)',
          fontWeight: 700, letterSpacing: '-1px',
          lineHeight: 1.1, marginBottom: 16,
        }}>
          How It{' '}
          <em style={{
            fontStyle: 'normal',
            background: 'linear-gradient(135deg, #00C9B1, #00E5FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Works</em>
        </h2>

        <p style={{
          fontSize: 17, color: 'rgba(176,196,222,0.65)',
          fontWeight: 300, lineHeight: 1.7,
          maxWidth: 560, margin: '0 auto',
        }}>
          From fact find to advice delivery — a seamless journey powered by AI and backed by humans.
        </p>
      </motion.div>

      {/* Timeline */}
      <div ref={timelineRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <TimelineFill timelineRef={timelineRef} />
        {steps.map((step, i) => (
          <StepCard key={i} step={step} index={i} />
        ))}
      </div>

      {/* CTA */}
      <motion.div
        ref={ctaRef}
        initial={{ opacity: 0, y: 24 }}
        animate={ctaInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center', marginTop: 80 }}
      >
        <p style={{
          fontSize: 15, color: 'rgba(176,196,222,0.65)',
          marginBottom: 24, fontWeight: 300,
        }}>
          Ready to see it in action? Set up your first advice request in minutes.
        </p>
        <a href="/Register" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'linear-gradient(135deg, #00C9B1, #00A693)',
          color: '#060D1A', padding: '15px 32px', borderRadius: 12,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15, fontWeight: 600,
          textDecoration: 'none', transition: 'all 0.25s',
        }}>
          Get Started Free →
        </a>
      </motion.div>

    </section>
  );
}
