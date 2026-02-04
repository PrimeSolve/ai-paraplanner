import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AvatarMarketing() {
  return (
    <div style={{ fontFamily: 'DM Sans, -apple-system, BlinkMacSystemFont, sans-serif', color: '#0f172a', lineHeight: 1.6, background: '#f8fafc', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:wght@400;500;600;700&display=swap');
        
        html {
          scroll-behavior: smooth;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 60px rgba(34, 211, 238, 0.4); }
          50% { box-shadow: 0 0 80px rgba(34, 211, 238, 0.6); }
        }
      `}</style>

      {/* Navigation */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
        <Link to={createPageUrl('PublicHome')} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '14px', boxShadow: '0 4px 12px rgba(29, 78, 216, 0.3)' }}>AI</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 600, color: '#0f172a' }}>AI <span style={{ color: '#3b82f6' }}>Paraplanner</span></div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
          <a href={createPageUrl('PublicHome') + '#how-it-works'} style={{ fontSize: '15px', fontWeight: 500, color: '#334155', textDecoration: 'none', transition: 'color 0.2s ease' }}>How It Works</a>
          <a href={createPageUrl('PublicHome') + '#features'} style={{ fontSize: '15px', fontWeight: 500, color: '#334155', textDecoration: 'none', transition: 'color 0.2s ease' }}>Features</a>
          <Link to={createPageUrl('AvatarMarketing')} style={{ fontSize: '15px', fontWeight: 500, color: '#3b82f6', textDecoration: 'none' }}>AI Avatar</Link>
          <a href={createPageUrl('PublicHome') + '#pricing'} style={{ fontSize: '15px', fontWeight: 500, color: '#334155', textDecoration: 'none', transition: 'color 0.2s ease' }}>Pricing</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to={createPageUrl('SignIn')} style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', color: '#334155', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s ease' }}>Log In</Link>
          <Link to={createPageUrl('Register')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)', transition: 'all 0.2s ease' }}>Register</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ minHeight: '100vh', padding: '140px 48px 80px', background: '#0f172a', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, background: 'radial-gradient(ellipse at 30% 20%, rgba(34, 211, 238, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), linear-gradient(180deg, #0a0f1a 0%, #0f172a 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div style={{ maxWidth: '560px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.3)', borderRadius: '50px', fontSize: '13px', fontWeight: 600, color: '#22d3ee', marginBottom: '24px' }}>
              <div style={{ width: '8px', height: '8px', background: '#22d3ee', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
              AI Avatar Technology
            </div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(42px, 5vw, 56px)', fontWeight: 600, lineHeight: 1.15, color: 'white', marginBottom: '24px' }}>Your AI Avatar.<br /><span style={{ color: '#22d3ee' }}>Explaining your advice.</span></h1>
            <p style={{ fontSize: '19px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '36px' }}>Imagine your client receiving their SOA as a beautiful, interactive document. They click play, and a digital version of you walks them through every recommendation, every strategy, every fee.</p>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '48px' }}>
              <Link to={createPageUrl('Register')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)' }}>Get Started</Link>
              <a href="#how-it-works" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', background: 'white', color: '#0f172a', border: '2px solid #e2e8f0' }}>See How It Works</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: '#94a3b8' }}>
                <div style={{ width: '24px', height: '24px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '14px' }}>✓</div>
                <span><strong style={{ color: 'white' }}>Ask questions anytime</strong> — The AI knows your SOA inside out</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: '#94a3b8' }}>
                <div style={{ width: '24px', height: '24px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '14px' }}>✓</div>
                <span><strong style={{ color: 'white' }}>Available 24/7</strong> — Clients review advice on their schedule</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: '#94a3b8' }}>
                <div style={{ width: '24px', height: '24px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '14px' }}>✓</div>
                <span><strong style={{ color: 'white' }}>Consistent messaging</strong> — Every explanation is accurate and compliant</span>
              </div>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '140%', height: '140%', background: 'radial-gradient(circle at center, rgba(34, 211, 238, 0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', background: 'linear-gradient(135deg, #1e293b, #0a0f1a)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3)', aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ width: '80px', height: '80px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px' }}>🎥</div>
                <p style={{ fontSize: '14px' }}>Avatar Demo Video</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ padding: '100px 48px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{ display: 'inline-block', fontSize: '13px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Why AI Avatars</span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Transform How Clients <span style={{ color: '#22d3ee' }}>Experience</span> Advice</h2>
            <p style={{ fontSize: '18px', color: '#334155', maxWidth: '600px', margin: '0 auto' }}>Move beyond static PDFs. Give your clients an engaging, interactive way to understand their financial plan.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
            {[
              { icon: '💬', title: 'Interactive Q&A', text: 'Clients can ask questions and get instant, accurate answers about their advice.' },
              { icon: '🕐', title: 'Available 24/7', text: 'No more waiting for callbacks. Clients engage with their advice when it suits them.' },
              { icon: '✓', title: 'Always Compliant', text: 'Every explanation is consistent, accurate, and aligned with your SOA.' },
              { icon: '⚡', title: 'Faster for Clients', text: 'Natural conversations that get right to the point. No more confusing forms — clients just talk, and the AI captures everything.' }
            ].map((benefit, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '32px', textAlign: 'center', transition: 'all 0.3s ease' }}>
                <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.25)' }}>{benefit.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>{benefit.title}</h3>
                <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6 }}>{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two Paths Section */}
      <section style={{ padding: '100px 48px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{ display: 'inline-block', fontSize: '13px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Choose Your Path</span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Stock Avatars or <span style={{ color: '#22d3ee' }}>Your Digital Twin</span></h2>
            <p style={{ fontSize: '18px', color: '#334155', maxWidth: '600px', margin: '0 auto' }}>Start immediately with professional stock avatars, or create a custom avatar that looks and sounds like you.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: '24px', padding: '48px', position: 'relative' }}>
              <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '24px', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.25)' }}>👥</div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>Stock Avatars</h3>
              <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>Choose from 20+ professional avatars ready to represent your practice.</p>
              <ul style={{ listStyle: 'none', marginBottom: '32px', padding: 0 }}>
                {['Instant setup — start today', 'Diverse range of personalities', 'Professional quality guaranteed', 'Included in all plans'].map((feature, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', fontSize: '15px', color: '#334155' }}>
                    <svg width="20" height="20" fill="none" stroke="#10b981" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <a href="#avatars" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px 24px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', background: 'white', color: '#0f172a', border: '2px solid #e2e8f0' }}>Browse Avatars</a>
            </div>
            
            <div style={{ background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.03) 0%, white 100%)', border: '2px solid #f97316', borderRadius: '24px', padding: '48px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '24px', right: '24px', padding: '6px 14px', background: '#f97316', borderRadius: '50px', fontSize: '12px', fontWeight: 700, color: 'white' }}>Premium</div>
              <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '24px', boxShadow: '0 10px 30px rgba(249, 115, 22, 0.25)' }}>🎬</div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>Custom Avatar</h3>
              <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>Create an AI avatar that looks and sounds exactly like you.</p>
              <ul style={{ listStyle: 'none', marginBottom: '32px', padding: 0 }}>
                {['Your face, your voice', 'Build stronger client trust', 'Ready in 3-5 business days', 'Included in Pro plan'].map((feature, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', fontSize: '15px', color: '#334155' }}>
                    <svg width="20" height="20" fill="none" stroke="#10b981" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <a href="#custom" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px 24px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)' }}>See Example</a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '100px 48px', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 20% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{ display: 'inline-block', fontSize: '13px', fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Custom Avatar</span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 600, color: 'white', marginBottom: '16px' }}>Create Your Digital Twin in <span style={{ color: '#22d3ee' }}>3 Simple Steps</span></h2>
            <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>Record a short video, upload it, and we'll do the rest. Your custom avatar will be ready within days.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            {[
              { number: '1', icon: '📹', title: 'Record Your Video', text: "Film yourself speaking professionally for 3 minutes in good lighting. We'll provide guidance to get the best results." },
              { number: '2', icon: '☁️', title: 'Upload & Submit', text: 'Upload your video to our secure platform. Our AI technology powered by HeyGen will process and train your avatar.' },
              { number: '3', icon: '✨', title: 'Avatar Ready', text: 'Your custom avatar will be ready within 3-5 business days. Start creating personalised client experiences immediately.' }
            ].map((step, idx) => (
              <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: '36px', textAlign: 'center', position: 'relative' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #22d3ee, #3b82f6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(34, 211, 238, 0.3)' }}>{step.number}</div>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>{step.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>{step.title}</h3>
                <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6 }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stock Avatars */}
      <section id="avatars" style={{ padding: '100px 48px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{ display: 'inline-block', fontSize: '13px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Stock Avatars</span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Choose Your <span style={{ color: '#22d3ee' }}>AI Representative</span></h2>
            <p style={{ fontSize: '18px', color: '#334155', maxWidth: '600px', margin: '0 auto' }}>Professional avatars with distinct personalities. Find the perfect voice for your practice.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '28px' }}>
            {[
              { name: 'James', traits: 'Authoritative • Trustworthy • Clear' },
              { name: 'Mia', traits: 'Calm • Approachable • Patient' },
              { name: 'Marcus', traits: 'Energetic • Engaging • Friendly' },
              { name: 'Sarah', traits: 'Modern • Confident • Direct' },
              { name: 'Emma', traits: 'Professional • Warm • Reassuring' },
              { name: 'Richard', traits: 'Experienced • Distinguished • Wise' },
              { name: 'Nicole', traits: 'Warm • Trustworthy • Articulate' },
              { name: 'Daniel', traits: 'Friendly • Relaxed • Supportive' }
            ].map((avatar, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', transition: 'all 0.3s ease', cursor: 'pointer' }}>
                <div style={{ width: '100%', aspectRatio: '16/10', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '48px' }}>👤</div>
                <div style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{avatar.name}</h4>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>{avatar.traits}</p>
                </div>
              </div>
            ))}
          </div>
          
          <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '15px', color: '#64748b' }}><strong style={{ color: '#0f172a' }}>20+ avatars available</strong> — Browse the full collection when you register</p>
        </div>
      </section>

      {/* Custom Avatar Showcase */}
      <section id="custom" style={{ padding: '100px 48px', background: 'linear-gradient(135deg, #f8fafc 0%, white 100%)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '16/9', borderRadius: '24px', boxShadow: '0 30px 60px rgba(0, 0, 0, 0.15)' }}>
              <iframe src="https://www.youtube-nocookie.com/embed/_5vfADBD2BM?rel=0" loading="lazy" title="Custom Avatar Demo" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }} />
            </div>
          </div>
          
          <div style={{ maxWidth: '440px' }}>
            <span style={{ display: 'inline-block', fontSize: '13px', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Premium Feature</span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 600, color: '#0f172a', marginBottom: '20px', lineHeight: 1.2 }}>Your Face. Your Voice. Your Digital Twin.</h2>
            <p style={{ fontSize: '17px', color: '#334155', lineHeight: 1.7, marginBottom: '28px' }}>Build deeper trust with clients by delivering advice through a familiar face — yours. Your custom avatar captures your mannerisms, tone, and style.</p>
            <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px' }}><strong style={{ color: '#0f172a' }}>Watch the example:</strong> A custom avatar delivering a personalised Fact Find welcome message to a client.</p>
            <ul style={{ listStyle: 'none', marginBottom: '32px', padding: 0 }}>
              {[
                'Trained on your unique presentation style',
                'Speaks in your voice with natural inflection',
                'Welcome clients to Fact Finds, explain SOAs, and more',
                'Included in Pro plan at no extra cost'
              ].map((feature, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', fontSize: '15px', color: '#334155' }}>
                  <svg width="20" height="20" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {feature}
                </li>
              ))}
            </ul>
            <Link to={createPageUrl('Register')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)' }}>Create Your Avatar</Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '100px 48px', background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', textAlign: 'center' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 32px' }}>🚀</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 600, color: 'white', marginBottom: '16px' }}>Ready to Transform Client Engagement?</h2>
          <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '40px', lineHeight: 1.7 }}>Join advisers who are already using AI avatars to deliver advice that clients actually understand and engage with.</p>
          <Link to={createPageUrl('Register')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '16px 40px', borderRadius: '10px', fontSize: '17px', fontWeight: 600, textDecoration: 'none', background: 'white', color: '#0f172a', boxShadow: '0 4px 14px rgba(255, 255, 255, 0.2)' }}>Register Now</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 48px', background: '#0a0f1a', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '12px' }}>AI</div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 600, color: 'white' }}>AI Paraplanner</span>
        </div>
        <p style={{ fontSize: '14px', color: '#64748b' }}>Powered by PrimeSolve</p>
      </footer>
    </div>
  );
}