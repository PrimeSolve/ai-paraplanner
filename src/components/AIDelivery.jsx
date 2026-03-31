import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';

// ── Conversation script ──
const conversation = [
  {
    role: 'ai',
    text: "Hi Sarah! I've successfully captured your financial data. I'm ready to walk you through your Statement of Advice. Where would you like to start?",
    thinkMs: 1200,
  },
  {
    role: 'user',
    text: "Can you explain the superannuation recommendation?",
  },
  {
    role: 'ai',
    text: "Of course. Based on your current super balance of $284,000 and your goal to retire at 62, we're recommending consolidating your three funds into a single low-cost platform. This alone saves you approximately $1,840 per year in fees.",
    thinkMs: 1800,
  },
  {
    role: 'user',
    text: "Why that fund specifically?",
  },
  {
    role: 'ai',
    text: "Great question. It ranked #1 across your three priorities — low fees at 0.18% p.a., strong 10-year returns of 9.2%, and ESG screening. Your adviser compared 57 options before making this recommendation.",
    thinkMs: 1600,
  },
  {
    role: 'user',
    text: "What about the insurance advice?",
  },
  {
    role: 'ai',
    text: "Your current life cover of $500k would leave a $340k shortfall based on your mortgage and income replacement needs. We're recommending increasing to $1.2M. I can walk you through the full projection if you'd like?",
    thinkMs: 1400,
  },
];

// ── Feature list items ──
const featureItems = [
  { icon: '💬', title: 'Ask questions anytime',      sub: 'The AI knows your SOA inside out — 24/7' },
  { icon: '⚡', title: 'Available 24/7',              sub: 'Clients review advice on their own schedule' },
  { icon: '🛡', title: 'Consistent & compliant',     sub: 'Every explanation is accurate and on-message' },
  { icon: '✦', title: 'Beautiful presentation',      sub: 'Not PDF junk — an engaging interactive experience' },
];

// ── Chat message component ──
function ChatMessage({ role, text, visible }) {
  const isAI = role === 'ai';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-end',
        flexDirection: isAI ? 'row' : 'row-reverse',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, flexShrink: 0,
        fontFamily: "'Syne', sans-serif",
        background: isAI
          ? 'linear-gradient(135deg, #00C9B1, #007A6E)'
          : 'linear-gradient(135deg, #1E88E5, #0D4A8A)',
        color: '#fff',
      }}>
        {isAI ? 'AI' : 'S'}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '78%',
        padding: '11px 15px',
        borderRadius: 16,
        fontSize: 13,
        lineHeight: 1.6,
        fontWeight: 300,
        ...(isAI ? {
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(176,196,222,0.9)',
          borderBottomLeftRadius: 4,
        } : {
          background: 'linear-gradient(135deg, #00C9B1, #00A693)',
          color: '#060D1A',
          fontWeight: 400,
          borderBottomRightRadius: 4,
        }),
      }}>
        {text}
      </div>
    </motion.div>
  );
}

// ── Typing indicator ──
function TypingIndicator({ visible }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: 'linear-gradient(135deg, #00C9B1, #007A6E)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#fff',
        fontFamily: "'Syne', sans-serif", flexShrink: 0,
      }}>AI</div>
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, borderBottomLeftRadius: 4,
        padding: '13px 16px',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#00C9B1',
            animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </motion.div>
  );
}

// ── Animated chat hook ──
function useChat(started) {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const timerRef = useRef(null);

  const runChat = useCallback(() => {
    setMessages([]);
    setTyping(false);
    let index = 0;

    function next() {
      if (index >= conversation.length) {
        // After 5s pause, fade out and restart
        timerRef.current = setTimeout(() => {
          setMessages([]);
          timerRef.current = setTimeout(runChat, 600);
        }, 5000);
        return;
      }

      const item = conversation[index];

      if (item.role === 'ai') {
        setTyping(true);
        timerRef.current = setTimeout(() => {
          setTyping(false);
          setTimeout(() => {
            setMessages(prev => [...prev, { role: item.role, text: item.text, id: Date.now() }]);
            index++;
            timerRef.current = setTimeout(next, 1200);
          }, 300);
        }, item.thinkMs);
      } else {
        timerRef.current = setTimeout(() => {
          setMessages(prev => [...prev, { role: item.role, text: item.text, id: Date.now() }]);
          index++;
          timerRef.current = setTimeout(next, 600);
        }, 500);
      }
    }

    timerRef.current = setTimeout(next, 800);
  }, []);

  useEffect(() => {
    if (!started) return;
    runChat();
    return () => clearTimeout(timerRef.current);
  }, [started, runChat]);

  return { messages, typing };
}

// ── Main export ──
export default function AIDelivery() {
  const sectionRef  = useRef(null);
  const leftRef     = useRef(null);
  const rightRef    = useRef(null);
  const chatBodyRef = useRef(null);

  const leftInView  = useInView(leftRef,  { once: true, margin: '-80px' });
  const rightInView = useInView(rightRef, { once: true, margin: '-80px' });
  const [chatStarted, setChatStarted] = useState(false);

  const { messages, typing } = useChat(chatStarted);

  // Start chat when right panel comes into view
  useEffect(() => {
    if (rightInView && !chatStarted) {
      setTimeout(() => setChatStarted(true), 800);
    }
  }, [rightInView, chatStarted]);

  // Auto-scroll chat body
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, typing]);

  return (
    <section
      ref={sectionRef}
      id="ai-delivery"
      style={{
        position: 'relative', zIndex: 10,
        padding: '120px 60px 140px',
        maxWidth: 1200, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 80, alignItems: 'center',
      }}
    >
      {/* ── LEFT ── */}
      <motion.div
        ref={leftRef}
        initial={{ opacity: 0, x: -32 }}
        animate={leftInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.9 }}
      >
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,201,177,0.08)',
          border: '1px solid rgba(0,201,177,0.2)',
          borderRadius: 100, padding: '5px 14px',
          fontSize: 11, fontWeight: 500, color: '#00C9B1',
          letterSpacing: '1px', textTransform: 'uppercase',
          marginBottom: 24,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#00C9B1', display: 'inline-block',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          AI Delivery
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(36px, 3.8vw, 54px)',
          fontWeight: 700, letterSpacing: '-1px',
          lineHeight: 1.1, marginBottom: 20,
        }}>
          Your AI avatar.
          <em style={{
            fontStyle: 'normal', display: 'block',
            background: 'linear-gradient(135deg, #00C9B1, #00E5FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Explaining your advice.
          </em>
        </h2>

        {/* Description */}
        <p style={{
          fontSize: 16, color: 'rgba(176,196,222,0.6)',
          fontWeight: 300, lineHeight: 1.75,
          marginBottom: 36, maxWidth: 460,
        }}>
          Imagine your client receiving their SOA as a beautiful, interactive experience.
          A digital version of you walks them through every recommendation, every strategy,
          every fee — in plain English, any time they want.
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
          {featureItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={leftInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(0,201,177,0.1)',
                border: '1px solid rgba(0,201,177,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 15,
              }}>
                {item.icon}
              </div>
              <div style={{ paddingTop: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(176,196,222,0.6)', fontWeight: 300 }}>{item.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.a
          href="/Register"
          whileHover={{ y: -2, boxShadow: '0 12px 40px rgba(0,201,177,0.4)' }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg, #00C9B1, #00A693)',
            color: '#060D1A', padding: '14px 28px', borderRadius: 12,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15, fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Get Started →
        </motion.a>
      </motion.div>

      {/* ── RIGHT — Chat card ── */}
      <motion.div
        ref={rightRef}
        initial={{ opacity: 0, x: 32 }}
        animate={rightInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.9, delay: 0.2 }}
      >
        {/* Chat card */}
        <motion.div
          whileHover={{ y: -4, boxShadow: '0 60px 100px rgba(0,0,0,0.7), 0 0 80px rgba(0,201,177,0.08) inset' }}
          style={{
            borderRadius: 24,
            border: '1px solid rgba(0,201,177,0.2)',
            background: 'rgba(13,25,41,0.85)',
            backdropFilter: 'blur(24px)',
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,201,177,0.05) inset',
          }}
        >
          {/* Topbar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px',
            background: 'rgba(0,201,177,0.07)',
            borderBottom: '1px solid rgba(0,201,177,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #00C9B1, #007A6E)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
                fontFamily: "'Syne', sans-serif",
              }}>AI</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F4FF' }}>AI Fact Find Assistant</div>
                <div style={{ fontSize: 11, color: '#00C9B1', fontWeight: 400 }}>Goals Discovery Session</div>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 10, color: '#00C9B1',
              fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', background: '#00C9B1',
                animation: 'livePulse 1.5s ease-in-out infinite',
              }} />
              Live
            </div>
          </div>

          {/* Chat body */}
          <div
            ref={chatBodyRef}
            style={{
              padding: '24px 20px',
              display: 'flex', flexDirection: 'column', gap: 18,
              minHeight: 400, maxHeight: 400,
              overflowY: 'hidden', position: 'relative',
            }}
          >
            {messages.map(msg => (
              <ChatMessage key={msg.id} role={msg.role} text={msg.text} visible={true} />
            ))}
            {typing && <TypingIndicator visible={true} />}
          </div>

          {/* Input bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.2)',
          }}>
            <input
              type="text"
              readOnly
              placeholder="Ask anything about your advice..."
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: '9px 16px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, color: 'rgba(176,196,222,0.5)',
                outline: 'none', fontStyle: 'italic',
              }}
            />
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00C9B1, #00A693)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, cursor: 'pointer',
            }}>
              <div style={{
                width: 0, height: 0,
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderLeft: '9px solid #060D1A',
                marginLeft: 2,
              }} />
            </div>
          </div>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={rightInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{
            display: 'flex', marginTop: 16,
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.07)',
            overflow: 'hidden',
          }}
        >
          {[
            { num: '24', unit: 'hr',    label: 'SOA turnaround' },
            { num: '75', unit: '%',     label: 'Faster fact finds' },
            { num: '4',  unit: '+ hrs', label: 'Adviser time saved' },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1, padding: '16px 20px',
              background: 'rgba(13,25,41,0.6)',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 22, fontWeight: 600, color: '#F0F4FF',
              }}>
                {stat.num}<span style={{ color: '#00C9B1' }}>{stat.unit}</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(176,196,222,0.6)', marginTop: 3 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
