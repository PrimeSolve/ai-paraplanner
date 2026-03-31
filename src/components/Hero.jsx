import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0 },
};

const fadeRight = {
  hidden: { opacity: 0, x: 32 },
  show:   { opacity: 1, x: 0 },
};

// ── Stat counter hook ──
function useCounter(target, duration = 1800, startDelay = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now();
      function update(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    }, startDelay);
    return () => clearTimeout(timer);
  }, [target, duration, startDelay]);
  return value;
}

export default function Hero() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const stat1 = useCounter(75);
  const stat2 = useCounter(24);
  const stat3 = useCounter(4);

  return (
    <>
      {/* ── Orb background ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={orbStyle(600, 600, '-200px', '-100px', 'rgba(0,201,177,0.25)', '18s', '0s')} />
        <div style={orbStyle(500, 500, '100px', 'auto', 'rgba(30,136,229,0.2)',   '22s', '-6s',  { right: '-150px' })} />
        <div style={orbStyle(400, 400, 'auto',  'auto', 'rgba(100,60,200,0.15)',  '16s', '-12s', { bottom: 0, left: '30%' })} />
      </div>

      {/* ── Grid overlay ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(0,201,177,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,201,177,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, black 40%, transparent 100%)',
        maskImage:       'radial-gradient(ellipse 80% 80% at 50% 0%, black 40%, transparent 100%)',
      }} />

      {/* ── Hero section ── */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        minHeight: 'calc(100vh - 77px)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        gap: '60px',
        padding: '80px 60px 60px',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>

        {/* ── LEFT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Badge */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(0,201,177,0.1)',
              border: '1px solid rgba(0,201,177,0.25)',
              borderRadius: '100px', padding: '6px 14px 6px 8px',
              width: 'fit-content',
            }}
          >
            <span style={{
              width: 8, height: 8, background: '#00C9B1',
              borderRadius: '50%', display: 'inline-block',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 12, color: '#00C9B1', fontWeight: 500, letterSpacing: '0.3px' }}>
              Now live — Built by Australian advisers
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ duration: 0.8, delay: 0.35 }}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(42px, 4.5vw, 62px)',
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-1px',
            }}
          >
            Paraplanning that{' '}
            <em style={{
              fontStyle: 'normal',
              background: 'linear-gradient(135deg, #00C9B1 0%, #00E5FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>scales</em>{' '}
            with your practice.
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{
              fontSize: 17, lineHeight: 1.7,
              color: 'rgba(176,196,222,0.65)',
              maxWidth: 460, fontWeight: 300,
            }}
          >
            AI handles the preparation. Humans ensure the quality.
            Your clients get advice they actually understand.
          </motion.p>

          {/* Actions */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ duration: 0.8, delay: 0.65 }}
            style={{ display: 'flex', gap: 14, alignItems: 'center' }}
          >
            <a href="/Register" style={{
              background: 'linear-gradient(135deg, #00C9B1, #00A693)',
              color: '#060D1A', padding: '14px 28px', borderRadius: 10,
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'all 0.25s',
            }}>
              Get Started →
            </a>
            <a href="#how-it-works" style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#F0F4FF', padding: '14px 24px', borderRadius: 10,
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 400,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
            }}>
              See How It Works ▾
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ duration: 0.8, delay: 0.8 }}
            style={{
              display: 'flex', gap: 36, paddingTop: 8,
              borderTop: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <StatItem number={`${stat1}%`} label="Faster Fact Finds" />
            <StatItem number={`${stat2}hr`} label="SOA Turnaround" />
            <StatItem number={`${stat3}+ hrs`} label="Adviser Prep Time Saved" />
          </motion.div>

        </div>

        {/* ── RIGHT — Video Card ── */}
        <motion.div
          variants={fadeRight} initial="hidden" animate="show"
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div style={{
            borderRadius: 20,
            overflow: 'hidden',
            border: '1px solid rgba(0,201,177,0.2)',
            background: 'rgba(13,25,41,0.7)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,201,177,0.08) inset',
            transition: 'transform 0.4s ease, box-shadow 0.4s ease',
          }}>

            {/* Mac-style topbar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#FF5F57','#FEBC2E','#28C840'].map(c => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: 'rgba(176,196,222,0.65)', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                AI Paraplanner in Action
              </span>
              <span style={{
                fontSize: 10, background: 'rgba(0,201,177,0.15)', color: '#00C9B1',
                border: '1px solid rgba(0,201,177,0.3)', padding: '2px 8px',
                borderRadius: 20, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase',
              }}>
                Live Demo
              </span>
            </div>

            {/* Video */}
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              background: '#000',
            }}>
              {!videoLoaded && (
                <div
                  onClick={() => setVideoLoaded(true)}
                  style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 20,
                    background: 'linear-gradient(135deg, #060D1A 0%, #0D1929 100%)',
                    cursor: 'pointer', zIndex: 2,
                  }}
                >
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00C9B1, #00A693)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 40px rgba(0,201,177,0.4)',
                  }}>
                    <div style={{
                      width: 0, height: 0,
                      borderTop: '13px solid transparent',
                      borderBottom: '13px solid transparent',
                      borderLeft: '22px solid #060D1A',
                      marginLeft: 5,
                    }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: 14, color: '#F0F4FF',
                      fontWeight: 500, marginBottom: 4,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      Watch the demo
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: 'rgba(176,196,222,0.5)',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 300,
                    }}>
                      1 min 50 sec
                    </div>
                  </div>
                </div>
              )}
              {videoLoaded && (
                <iframe
                  src="https://www.youtube.com/embed/iINCz8Lrq5Q?autoplay=1&rel=0&modestbranding=1&color=white"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    border: 'none',
                  }}
                />
              )}
            </div>

            {/* Footer pills */}
            <div style={{ display: 'flex', gap: 12, padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
              <Pill color="0,201,177" textColor="#00C9B1" label="AI-Powered" />
              <Pill color="30,136,229" textColor="#60B4FF" label="Compliant SOA" />
              <Pill color="140,80,255" textColor="#B794FF" label="Human Reviewed" />
            </div>

          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          style={{
            position: 'absolute', bottom: 30, left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 10, color: 'rgba(176,196,222,0.65)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 500 }}>
            Scroll
          </span>
          <div style={{
            width: 1, height: 40,
            background: 'linear-gradient(to bottom, transparent, #00C9B1, transparent)',
            animation: 'scrollPulse 2s ease-in-out infinite',
          }} />
        </motion.div>

      </section>
    </>
  );
}

// ── Sub-components ──

function StatItem({ number, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{
        fontFamily: "'Syne', sans-serif", fontSize: 32,
        fontWeight: 700, letterSpacing: '-1px',
        color: '#F0F4FF', lineHeight: 1,
      }}>
        {number}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(176,196,222,0.65)', fontWeight: 400, letterSpacing: '0.3px' }}>
        {label}
      </div>
    </div>
  );
}

function Pill({ color, textColor, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500,
      background: `rgba(${color},0.1)`,
      color: textColor,
      border: `1px solid rgba(${color},0.2)`,
    }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: textColor }} />
      {label}
    </div>
  );
}

// Helper for orb divs
function orbStyle(w, h, top, left, color, duration, delay, extra = {}) {
  return {
    position: 'absolute',
    width: w, height: h,
    borderRadius: '50%',
    filter: 'blur(80px)',
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    top, left,
    animation: `orbFloat ${duration} ease-in-out infinite`,
    animationDelay: delay,
    ...extra,
  };
}
