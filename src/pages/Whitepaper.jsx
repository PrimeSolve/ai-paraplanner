import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '../utils';

export default function Whitepaper() {
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-section]');
      let current = 0;
      
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
          current = index;
        }
      });
      
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (index) => {
    const sections = document.querySelectorAll('[data-section]');
    sections[index]?.scrollIntoView({ behavior: 'smooth' });
  };

  const sections = ['Hero', 'Problem', 'Approach', 'Numbers', 'Technology', 'CTA'];

  return (
    <div className="bg-white">
      {/* Close Button */}
      <Link
        to={createPageUrl('Home')}
        className="fixed top-6 right-6 z-50 w-10 h-10 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center hover:bg-slate-50 hover:border-slate-400 transition-all shadow-lg"
      >
        <X className="w-5 h-5 text-slate-700" />
      </Link>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        :root {
          --navy-deep: #0a0f1a;
          --navy: #0f172a;
          --navy-light: #1e293b;
          --slate: #334155;
          --slate-light: #64748b;
          --grey: #94a3b8;
          --grey-light: #e2e8f0;
          --off-white: #f8fafc;
          --blue-electric: #38bdf8;
          --cyan-glow: #22d3ee;
          --coral: #f97316;
          --success: #10b981;
          --purple: #8b5cf6;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        
        .animate-bounce-slow {
          animation: bounce 2s infinite;
        }
      `}</style>

      {/* Table of Contents */}
      <div className="hidden lg:flex fixed top-1/2 left-6 -translate-y-1/2 z-50 flex-col gap-3">
        {sections.map((section, index) => (
          <button
            key={index}
            onClick={() => scrollToSection(index)}
            className="group relative w-3 h-3 rounded-full border-2 transition-all duration-300 hover:scale-125"
            style={{
              background: activeSection === index ? 'var(--blue-electric)' : 'var(--grey-light)',
              borderColor: activeSection === index ? 'var(--blue-electric)' : 'var(--grey)',
            }}
          >
            <span className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {section}
            </span>
          </button>
        ))}
      </div>

      {/* Hero Section */}
      <section 
        data-section="0"
        className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-20"
        style={{ background: 'var(--navy)' }}
      >
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(34, 211, 238, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
              linear-gradient(180deg, var(--navy-deep) 0%, var(--navy) 100%)
            `
          }}
        />
        
        <div className="relative z-10 max-w-4xl text-center">
          <div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8"
            style={{ 
              background: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              color: 'var(--cyan-glow)'
            }}
          >
            <span className="text-sm font-semibold">📄 Whitepaper</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            The AI Paraplanner<br />
            <span 
              className="bg-gradient-to-r from-cyan-400 to-blue-500"
              style={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Revolution is Here
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            How leading advice practices are transforming their paraplanning process — cutting advice preparation from 26 hours to just 5, and beating the FAAA's FinTech predictions.
          </p>
          
          <div className="flex justify-center gap-12 flex-wrap mb-16">
            <div className="text-center">
              <div className="text-5xl font-extrabold mb-2" style={{ color: 'var(--cyan-glow)' }}>
                26→5
              </div>
              <div className="text-sm text-gray-400 font-medium">Hours per client</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extrabold mb-2" style={{ color: 'var(--cyan-glow)' }}>
                23→2
              </div>
              <div className="text-sm text-gray-400 font-medium">Admin hours eliminated</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extrabold mb-2" style={{ color: 'var(--cyan-glow)' }}>
                91%
              </div>
              <div className="text-sm text-gray-400 font-medium">Back-office reduction</div>
            </div>
          </div>
          
          <p className="text-base text-gray-400 max-w-2xl mx-auto">
            The 3 hours of face-to-face client time stays — that's where advice happens. It's the 23 hours of admin that follows we've reduced to just over 2.
          </p>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 text-sm animate-bounce-slow">
          <span>Scroll to explore</span>
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* Section 1: The Problem */}
      <section 
        data-section="1"
        className="py-24 px-6"
        style={{ background: 'var(--off-white)' }}
      >
        <div className="max-w-4xl mx-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--blue-electric)' }}>
            Section 1
          </span>
          
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5" style={{ color: 'var(--navy)' }}>
            The 26-Hour Problem
          </h2>
          
          <p className="text-lg leading-relaxed mb-12" style={{ color: 'var(--slate)' }}>
            The financial advice industry has a productivity crisis. According to the FAAA&apos;s &quot;Mapping FinTech to the Financial Planning Process&quot; report, preparing a single piece of advice takes an average of 26 hours. That&apos;s over three full working days — for one client.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {[
              { icon: '⏰', title: 'Time-Starved Advisers', desc: 'With 26 hours per client, advisers are drowning in paperwork instead of building relationships and growing their practice.', color: 'rgba(239, 68, 68, 0.1)' },
              { icon: '💰', title: 'Rising Costs', desc: 'SOA preparation alone accounts for 10 hours. At typical paraplanner rates, that is a significant cost that gets passed to clients or eats into margins.', color: 'rgba(245, 158, 11, 0.1)' },
              { icon: '📉', title: 'Scalability Ceiling', desc: 'Practices hit a wall. You can only serve so many clients when each one requires this level of time investment.', color: 'rgba(139, 92, 246, 0.1)' },
              { icon: '🔄', title: 'Manual Processes', desc: 'Despite advances in technology, most of the process remains manual — data entry, document preparation, compliance checks.', color: 'rgba(148, 163, 184, 0.15)' }
            ].map((card, i) => (
              <div key={i} className="bg-white border rounded-2xl p-7" style={{ borderColor: 'var(--grey-light)' }}>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: card.color }}
                >
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
                  {card.title}
                </h3>
                <p className="leading-relaxed" style={{ color: 'var(--slate)' }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
          
          {/* FAAA Breakdown */}
          <div className="bg-white border rounded-2xl p-8" style={{ borderColor: 'var(--grey-light)' }}>
            <div className="flex items-center gap-4 mb-2">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'var(--blue-electric)' }}
              >
                📊
              </div>
              <div>
                <h3 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
                  FAAA Advice Process Breakdown
                </h3>
                <p className="text-sm" style={{ color: 'var(--slate)' }}>
                  Time allocation across the six stages of advice
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { label: 'Scoping the Engagement', hours: 3, color: '#3b82f6' },
                { label: 'Fact Finding', hours: 4, color: '#22d3ee' },
                { label: 'Research & Strategy', hours: 5, color: '#8b5cf6' },
                { label: 'SOA Preparation', hours: 10, color: '#f97316' },
                { label: 'Presentation & Implementation', hours: 3, color: '#10b981' },
                { label: 'Ongoing Review', hours: 1, color: '#94a3b8' }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2 text-sm font-semibold">
                    <span style={{ color: 'var(--slate)' }}>{item.label}</span>
                    <span style={{ color: 'var(--slate-light)' }}>{item.hours} hrs</span>
                  </div>
                  <div className="h-3 rounded-full" style={{ background: 'var(--grey-light)' }}>
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(item.hours / 26) * 100}%`, background: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t flex justify-between items-center" style={{ borderColor: 'var(--grey-light)' }}>
              <span className="text-lg font-bold" style={{ color: 'var(--navy)' }}>Total Time Per Client</span>
              <span className="text-3xl font-extrabold" style={{ color: 'var(--coral)' }}>26 hours</span>
            </div>
            
            <p className="text-xs mt-4" style={{ color: 'var(--slate-light)' }}>
              Source: FAAA (formerly FPA) "Mapping FinTech to the Financial Planning Process" report, cited in Parliament of Australia submission
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: The Approach */}
      <section data-section="2" className="py-24 px-6" style={{ background: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--blue-electric)' }}>
            Section 2
          </span>
          
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5 text-white">
            The PrimeSolve Approach
          </h2>
          
          <p className="text-lg leading-relaxed mb-12 text-slate-300">
            We&apos;ve reimagined every stage of the advice process. Here&apos;s our 8-step AI-powered workflow that delivers better outcomes in a fraction of the time.
          </p>
          
          <div className="relative space-y-12">
            {/* Vertical Timeline Line */}
            <div className="absolute left-[27px] top-12 bottom-12 w-0.5" style={{ background: 'var(--blue-electric)' }}></div>
            {[
              {
                step: 1,
                icon: '📧',
                title: 'Send AI Fact Find',
                desc: 'Send your client a branded, mobile-friendly fact find powered by AI. Track their progress in real-time through your dashboard. Clients see an engaging overview of their current financial position as they complete each section.',
                badges: ['Progress Tracking', 'Real-time Dashboard', 'Position Overview']
              },
              {
                step: 2,
                icon: '🤖',
                title: 'Client Completes with AI Help',
                desc: 'Clients do not struggle with forms. AI pre-fills data from uploaded documents, guides them through objectives, and captures everything accurately. Your AI avatar can assist them through the process.',
                badges: ['Smart Pre-fill', 'AI Assistant', 'Guided Objectives']
              },
              {
                step: 3,
                icon: '💬',
                title: 'Build SOA Request with AI',
                desc: 'This is where the magic happens. Have a meaningful conversation with your AI paraplanner assistant to decide on strategies. Build endless cashflow and alternative models to bolster your recommendations — effortlessly, just through conversation. Go straight to SOA or generate a modelling strategy report for deeper analysis.',
                badges: ['Conversational Interface', 'Unlimited Models', 'Strategy Reports']
              },
              {
                step: 4,
                icon: '⚡',
                title: 'AI Prepares Your Plan',
                desc: 'Powered by PrimeSolve optimised modelling engine, AI generates a compliant, comprehensive Statement of Advice.\n\nTraditional paraplanning charges by scope — the more strategies considered, the higher the cost. And building alternative models takes time, so corners get cut. The client misses out.\n\nWe flip that. Our AI explores more strategies, models more scenarios, and considers more alternatives than traditional planning ever could — with no price penalty for being thorough. Our LLM Council (multiple AI models cross-checking each other) ensures accuracy and compliance. Then a qualified paraplanner reviews the final document.\n\nBetter advice. No compromises.',
                badges: ['PrimeSolve Engine', 'LLM Council', 'No Scope Penalty', 'Human Reviewed']
              },
              {
                step: 5,
                icon: '📄',
                title: 'Receive Your SOA',
                desc: 'Get your completed SOA in multiple formats. PDF for compliance records, Word for editing flexibility, plus interactive HTML for enhanced client engagement. You get all three as standard.',
                badges: ['PDF Export', 'Word Export', 'Interactive HTML']
              },
              {
                step: 6,
                icon: '🎥',
                title: 'Avatar Explains the Advice',
                desc: 'Your digital twin walks clients through every recommendation. A fully trained AI model answers their questions, explains key concepts, clarifies trade-offs, and helps them understand why each recommendation makes sense for their situation. Optional — you remain in control.',
                badges: ['Your Avatar', 'AI Q&A', 'Optional Feature']
              },
              {
                step: 7,
                icon: '📊',
                title: 'Stress Test Report',
                desc: 'This is where advice becomes a story. Leveraging PrimeSolve modelling engine, we analyse 50+ alternative strategy models and translate them into clear, client-focused narratives.\n\nWhat if you retire at 60 instead of 65? What if you keep the investment property vs sell it? What happens if school fees increase?\n\nEach scenario shows real lifestyle trade-offs — not just numbers on a spreadsheet. Clients see exactly how different pathways affect their life, making the why behind your recommendation crystal clear.',
                badges: ['Client-Focused Stories', '50+ Scenarios', 'Lifestyle Trade-offs', 'Clear Comparisons']
              },
              {
                step: 8,
                icon: '🛡️',
                title: 'AI Audit Assistant',
                desc: 'The final layer of quality control. Our AI Audit Assistant works alongside the human paraplanner, reviewing stress test reports, raising any concerns or thoughts, and performing comprehensive compliance checks. Peace of mind, built in.',
                badges: ['Final Audit', 'Compliance Checks', 'Human + AI']
              }
            ].map((item) => (
              <div key={item.step} className="relative flex gap-6">
                <div className="flex-shrink-0 relative z-10">
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{ background: 'var(--blue-electric)', color: 'var(--navy)' }}
                  >
                    {item.step}
                  </div>
                </div>
                <div className="flex-1 border rounded-2xl p-6" style={{ borderColor: '#374155', background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="flex items-start gap-4 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: 'rgba(56, 189, 248, 0.1)' }}
                    >
                      {item.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-white flex-1">
                      {item.title}
                    </h3>
                  </div>
                  <p className="leading-relaxed mb-4 whitespace-pre-line text-slate-300">
                    {item.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.badges.map((badge, i) => (
                      <span 
                        key={i}
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ 
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: 'var(--blue-electric)'
                        }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: The Numbers */}
      <section 
        data-section="3"
        className="py-24 px-6"
        style={{ background: 'var(--off-white)' }}
      >
        <div className="max-w-4xl mx-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--blue-electric)' }}>
            Section 3
          </span>
          
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5" style={{ color: 'var(--navy)' }}>
            The Numbers Don't Lie
          </h2>
          
          <p className="text-lg leading-relaxed mb-12" style={{ color: 'var(--slate)' }}>
            Here is a stage-by-stage breakdown of adviser time — comparing the current industry standard (based on FAAA research) with the PrimeSolve approach.
          </p>
          
          <div className="bg-white border rounded-2xl overflow-hidden mb-12" style={{ borderColor: 'var(--grey-light)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--blue-electric)', color: 'white' }}>
                    <th className="text-left p-4 font-bold">Stage</th>
                    <th className="text-center p-4 font-bold">Current</th>
                    <th className="text-center p-4 font-bold">PrimeSolve</th>
                    <th className="text-center p-4 font-bold">Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { stage: 'Scoping the Engagement', current: '3 hrs', prime: '3 hrs', saved: '—' },
                    { stage: 'Fact Finding', current: '4 hrs', prime: '10 mins', saved: '3 hrs 50 mins' },
                    { stage: 'Research & Strategy', current: '5 hrs', prime: '30 mins', saved: '4 hrs 30 mins' },
                    { stage: 'SOA Preparation', current: '10 hrs', prime: '1 hr', saved: '9 hrs' },
                    { stage: 'Presentation & Implementation', current: '3 hrs', prime: '15 mins*', saved: '2 hrs 45 mins' },
                    { stage: 'Ongoing Review', current: '1 hr', prime: '15 mins', saved: '45 mins' }
                  ].map((row, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: 'var(--grey-light)' }}>
                      <td className="p-4 font-semibold" style={{ color: 'var(--navy)' }}>{row.stage}</td>
                      <td className="p-4 text-center" style={{ color: 'var(--slate)' }}>{row.current}</td>
                      <td className="p-4 text-center font-semibold" style={{ color: 'var(--blue-electric)' }}>{row.prime}</td>
                      <td className="p-4 text-center font-semibold" style={{ color: 'var(--success)' }}>{row.saved}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--off-white)' }}>
                    <td className="p-4 font-bold" style={{ color: 'var(--navy)' }}>TOTAL</td>
                    <td className="p-4 text-center font-bold" style={{ color: 'var(--coral)' }}>26 hrs</td>
                    <td className="p-4 text-center font-bold" style={{ color: 'var(--blue-electric)' }}>5 hrs 10 mins</td>
                    <td className="p-4 text-center font-bold" style={{ color: 'var(--success)' }}>20 hrs 50 mins</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-4 text-xs" style={{ color: 'var(--slate-light)', background: 'var(--off-white)' }}>
              *Optional: Advisers can still present personally if preferred
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { value: '91%', label: 'Admin time reduction', color: 'var(--success)' },
              { value: '21 hrs', label: 'Saved per client', color: 'var(--blue-electric)' },
              { value: '5x', label: 'More clients possible', color: 'var(--purple)' }
            ].map((stat, i) => (
              <div key={i} className="bg-white border rounded-2xl p-8 text-center" style={{ borderColor: 'var(--grey-light)' }}>
                <div className="text-5xl font-extrabold mb-3" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--slate)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
          
          {/* Beat FAAA Target */}
          <div className="rounded-2xl p-10 text-center" style={{ background: '#10b981' }}>
            <h3 className="text-3xl font-bold mb-6 text-white">
              We Beat the FAAA's Target
            </h3>
            <p className="mb-10 text-white text-lg max-w-2xl mx-auto">
              The FAAA report suggested that FinTech could potentially reduce the advice process from 26 hours to 8 hours. We've gone further.
            </p>
            <div className="flex items-center justify-center gap-16">
              <div className="text-center">
                <div className="text-5xl font-extrabold mb-3 text-white">8 hrs</div>
                <div className="text-base font-medium text-white opacity-90">FAAA FinTech Target</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-extrabold mb-3 text-white">5 hrs</div>
                <div className="text-base font-medium text-white opacity-90">PrimeSolve Reality</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Technology */}
      <section data-section="4" className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--blue-electric)' }}>
            Section 4
          </span>
          
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5" style={{ color: 'var(--navy)' }}>
            The Technology Behind It
          </h2>
          
          <p className="text-lg leading-relaxed mb-12" style={{ color: 'var(--slate)' }}>
            This is not just automation — it is intelligent augmentation. Here are the key technologies that make it possible.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              { icon: '📋', title: 'AI Fact Find with Progress Tracking', desc: 'Mobile-friendly, branded forms that clients actually complete. Real-time progress tracking, smart pre-fill from documents, and an engaging dashboard showing their current financial position.' },
              { icon: '💬', title: 'Conversational Strategy Building', desc: 'No more clicking through complex interfaces. Simply have a conversation with your AI paraplanner to build strategies, generate models, and refine recommendations.' },
              { icon: '🎥', title: 'AI Avatar Presentation', desc: 'Your digital twin, trained on your advice philosophy, walks clients through their SOA. Answers questions, explains concepts, and builds understanding — 24/7.' },
              { icon: '🛡️', title: 'AI Audit Assistant', desc: 'Automated compliance checks, stress test analysis, and final review. Works alongside human paraplanners to catch issues before they become problems.' },
              { icon: '⚙️', title: 'Commercial-Grade Modelling Engine', desc: 'At the heart of AI Paraplanner is PrimeSolve commercial-grade optimised modelling engine. While others rely on basic calculations, we run sophisticated scenario analysis across hundreds of variables.\n\nThe result? The best pathway of strategies is discovered — not guessed. Every recommendation is backed by comprehensive modelling that would take a human team days to replicate.' },
              { icon: '✍️', title: 'Custom SOA Language Generation', desc: 'No more generic fluff. Our AI assistants generate custom SOA language that is specific to your client situation — powered by the huge dataset from all that modelling.\n\nThe numbers tell the story. Every strategy, every projection, every trade-off flows naturally into compliant, compelling text. You can also tailor base templates for your advice firm voice and style.' }
            ].map((tech, i) => (
              <div key={i} className="bg-gray-50 border rounded-2xl p-6" style={{ borderColor: 'var(--grey-light)' }}>
                <div className="text-3xl mb-4">{tech.icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
                  {tech.title}
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--slate)' }}>
                  {tech.desc}
                </p>
              </div>
            ))}
          </div>
          
          {/* LLM Council Feature */}
          <div 
            className="rounded-2xl p-10 relative overflow-hidden"
            style={{ 
              background: 'var(--navy-light)'
            }}
          >
            <div className="flex justify-center mb-6">
              <div className="px-4 py-1.5 rounded-full text-xs font-bold" style={{ background: 'var(--blue-electric)', color: 'white' }}>
                ✨ Featured Technology
              </div>
            </div>
            
            <h3 className="text-3xl font-extrabold mb-4 text-white text-center">
              The LLM Council
            </h3>
            <p className="text-lg mb-10 text-center text-slate-300 max-w-2xl mx-auto">
              Our proprietary multi-model architecture brings the world&apos;s leading AI models together to debate, critique, and refine every output — ensuring accuracy and eliminating single points of failure.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {[
                { num: 1, title: 'First Opinions', desc: 'Each council member responds to the query independently, bringing their unique strengths and reasoning patterns.' },
                { num: 2, title: 'Peer Review', desc: 'Models anonymously critique and rank each other\'s responses. No favourites — just honest evaluation of accuracy and insight.' },
                { num: 3, title: 'Chairman Synthesis', desc: 'The Chairman model reviews all responses and rankings, then synthesises the collective wisdom into one authoritative answer.' }
              ].map((step) => (
                <div key={step.num} className="rounded-xl p-6" style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-4 text-lg"
                    style={{ background: 'var(--blue-electric)' }}
                  >
                    {step.num}
                  </div>
                  <h4 className="font-bold mb-2 text-white">
                    {step.title}
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-center gap-4 flex-wrap mb-8">
              {[
                { emoji: '🧠', label: 'GPT' },
                { emoji: '🧠', label: 'Gemini' },
                { emoji: '🧠', label: 'Claude' },
                { emoji: '🧠', label: 'Grok' }
              ].map((model, i) => (
                <div 
                  key={i}
                  className="rounded-xl p-4 flex flex-col items-center justify-center gap-2"
                  style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(51, 65, 85, 0.5)', minWidth: '100px' }}
                >
                  <div className="text-2xl">{model.emoji}</div>
                  <div className="text-sm font-semibold text-white">{model.label}</div>
                </div>
              ))}
              <span className="text-2xl text-slate-400">→</span>
              <div 
                className="px-6 py-4 rounded-xl text-center"
                style={{ background: 'var(--blue-electric)' }}
              >
                <div className="text-2xl mb-1">👑</div>
                <div className="text-sm font-bold text-white">Chairman</div>
                <div className="text-xs text-white opacity-90">Final Synthesis</div>
              </div>
            </div>
            
            <p className="text-sm text-center italic text-slate-400">
              Models are surprisingly willing to select another response as superior to their own — ensuring the best insights always rise to the top.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        data-section="5"
        className="py-24 px-6"
        style={{ background: 'var(--navy)' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-5xl mb-6">🚀</div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Join the advisers who are already saving 21 hours per client. See the AI Paraplanner in action and discover what's possible for your practice.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button 
              size="lg"
              className="text-lg px-8 py-6 rounded-xl"
              style={{ background: 'var(--blue-electric)', color: 'white' }}
            >
              Book a Demo
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 rounded-xl border-2"
              style={{ borderColor: 'var(--grey)', color: 'var(--grey)' }}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}