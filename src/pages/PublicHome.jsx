import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRedirect } from '@/auth/msalInstance';
import { ChevronDown } from 'lucide-react';
import NeuralBackground from '../components/NeuralBackground';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import AIDelivery from '../components/AIDelivery';

export default function PublicHome() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: '#060D1A', minHeight: '100vh', color: '#F0F4FF', fontFamily: "'DM Sans', sans-serif" }}>
      <NeuralBackground opacity={0.4} />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-4'}`} style={{ background: 'rgba(6,13,26,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-[1400px] mx-auto px-12 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 no-underline">
            <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center font-bold text-[#060D1A] text-sm shadow-lg" style={{ background: 'linear-gradient(135deg, #00C9B1, #00A693)' }}>
              AI
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 600, color: '#F0F4FF' }}>
              AI <span style={{ color: '#00C9B1' }}>Paraplanner</span>
            </span>
          </a>

          <div className="flex items-center gap-9">
            <a href="#how-it-works" className="text-[15px] font-medium no-underline transition-colors" style={{ color: 'rgba(176,196,222,0.65)' }}>How It Works</a>
            <a href="#features" className="text-[15px] font-medium no-underline transition-colors" style={{ color: 'rgba(176,196,222,0.65)' }}>Features</a>
            <a href="#ai-delivery" className="text-[15px] font-medium no-underline transition-colors" style={{ color: 'rgba(176,196,222,0.65)' }}>AI Delivery</a>
            <a href="#pricing" className="text-[15px] font-medium no-underline transition-colors" style={{ color: 'rgba(176,196,222,0.65)' }}>Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => loginRedirect()}
              className="px-6 py-3 rounded-[10px] text-[15px] font-semibold transition-all cursor-pointer"
              style={{ color: '#F0F4FF', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/Register')}
              className="px-6 py-3 rounded-[10px] text-[15px] font-semibold hover:-translate-y-0.5 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              style={{ color: '#060D1A', background: 'linear-gradient(135deg, #00C9B1, #00A693)' }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Hero />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-br from-[#0a0f1a] to-[#0f172a]">
        <div className="max-w-[1200px] mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="font-['Syne'] text-[52px] font-semibold text-white mb-4">
              Breakthrough <span className="text-[#00C9B1]">Features</span>
            </h2>
            <p className="text-[19px] text-[#94a3b8]">
              What makes AI Paraplanner different from everything else.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Feature 1 - AI-Powered SOA Generation */}
            <div className="bg-[#1e293b] rounded-2xl p-8 hover:transform hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center mb-6">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-[20px] font-bold text-white mb-3">AI-Powered SOA Generation</h3>
              <p className="text-[15px] text-[#94a3b8] leading-relaxed">
                AI generates compliant, comprehensive Statements of Advice. Every document is reviewed by qualified paraplanners for quality assurance.
              </p>
            </div>

            {/* Feature 2 - Cashflow Modelling Engine */}
            <div className="bg-[#1e293b] rounded-2xl p-8 hover:transform hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center mb-6">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-[20px] font-bold text-white mb-3">Cashflow Modelling Engine</h3>
              <p className="text-[15px] text-[#94a3b8] leading-relaxed">
                PrimeSolve's advanced optimisation modelling ensures the ultimate pathway for your client. Every recommendation is backed by rigorous scenario analysis.
              </p>
            </div>

            {/* Feature 3 - Template & Example Library */}
            <div className="bg-[#1e293b] rounded-2xl p-8 hover:transform hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center mb-6">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="text-[20px] font-bold text-white mb-3">Template & Example Library</h3>
              <p className="text-[15px] text-[#94a3b8] leading-relaxed">
                Use AI Paraplanner's professionally designed templates or bring your own. Fully customisable to match your brand, your tone, your way of delivering advice.
              </p>
            </div>

            {/* Feature 4 - Multi-role Portal */}
            <div className="bg-[#1e293b] rounded-2xl p-8 hover:transform hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] flex items-center justify-center mb-6">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-[20px] font-bold text-white mb-3">Multi-role Portal</h3>
              <p className="text-[15px] text-[#94a3b8] leading-relaxed">
                Purpose-built dashboards for Admins, Advice Groups, Advisers, and Clients. Everyone gets the right view with the right permissions.
              </p>
            </div>

            {/* Feature 5 - AI Compliance Checking */}
            <div className="bg-[#1e293b] rounded-2xl p-8 hover:transform hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ef4444] to-[#dc2626] flex items-center justify-center mb-6">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-[20px] font-bold text-white mb-3">AI Compliance Checking</h3>
              <p className="text-[15px] text-[#94a3b8] leading-relaxed">
                Four independent AI models generate, debate, and vote on every response. Dramatically reduces errors and eliminates hallucinations. Human oversight guaranteed.
              </p>
            </div>

            {/* Feature 6 - AI Fact Find Assistant */}
            <div className="bg-[#1e293b] rounded-2xl p-8 hover:transform hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ec4899] to-[#be185d] flex items-center justify-center mb-6">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-[20px] font-bold text-white mb-3">AI Fact Find Assistant</h3>
              <p className="text-[15px] text-[#94a3b8] leading-relaxed">
                Clients chat naturally. The AI asks clarifying questions, explains complex terms, and captures everything accurately with smart pre-fill from documents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Delivery Section */}
      <AIDelivery />

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-[#0f172a]">
        <div className="max-w-[1200px] mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="font-['Syne'] text-[52px] font-semibold text-white mb-4">
              Simple, transparent <span className="text-[#00C9B1]">pricing</span>
            </h2>
            <p className="text-[19px] text-[#94a3b8]">
              Start with pay-as-you-go, upgrade when you're ready.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Tier 1 - Scaled Advice */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all">
              <div className="text-sm font-bold text-[#00C9B1] uppercase tracking-wide mb-2">Scaled Advice</div>
              <div className="mb-6">
                <span className="text-[48px] font-bold text-white">$395</span>
                <div className="text-[#94a3b8] text-[15px]">per transaction</div>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1]/20 flex items-center justify-center text-[#00C9B1] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">AI Fact Find with pre-fill</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1]/20 flex items-center justify-center text-[#00C9B1] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">AI SOA Request builder</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1]/20 flex items-center justify-center text-[#00C9B1] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">Human paraplanner review</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1]/20 flex items-center justify-center text-[#00C9B1] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">48-hour turnaround</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1]/20 flex items-center justify-center text-[#00C9B1] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">PDF + Word + HTML delivery</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/Register')}
                className="w-full px-6 py-3 rounded-[10px] text-[15px] font-semibold text-white bg-transparent border-2 border-white/20 hover:border-white hover:bg-white hover:text-[#0f172a] transition-all cursor-pointer"
              >
                Get Started
              </button>
            </div>

            {/* Tier 2 - Comprehensive Advice (FEATURED) */}
            <div className="bg-gradient-to-br from-[#00C9B1]/10 to-[#3b82f6]/10 border-2 border-[#00C9B1] rounded-2xl p-8 transform scale-105 shadow-[0_0_40px_rgba(0,201,177,0.3)] relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#00C9B1] to-[#3b82f6] text-[#0f172a] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Most Popular
              </div>
              <div className="text-sm font-bold text-[#00C9B1] uppercase tracking-wide mb-2">Comprehensive Advice</div>
              <div className="mb-6">
                <span className="text-[48px] font-bold text-white">$695</span>
                <div className="text-[#94a3b8] text-[15px]">per transaction</div>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1] flex items-center justify-center text-[#0f172a] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-white font-medium">Everything in Tier 1</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1] flex items-center justify-center text-[#0f172a] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-white">Custom AI avatar</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1] flex items-center justify-center text-[#0f172a] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-white">SOA AI walkthroughs</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1] flex items-center justify-center text-[#0f172a] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-white">Unlimited strategy recommendations</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1] flex items-center justify-center text-[#0f172a] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-white">Unlimited cashflow models</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1] flex items-center justify-center text-[#0f172a] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-white">Stress test report</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/Register')}
                className="w-full px-6 py-3 rounded-[10px] text-[15px] font-semibold text-white bg-gradient-to-br from-[#f97316] to-[#ea580c] hover:-translate-y-0.5 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                Get Started
              </button>
            </div>

            {/* Tier 3 - Enterprise */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all">
              <div className="text-sm font-bold text-[#00C9B1] uppercase tracking-wide mb-2">Enterprise</div>
              <div className="mb-6">
                <span className="text-[48px] font-bold text-white">Custom</span>
                <div className="text-[#94a3b8] text-[15px]">volume pricing</div>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1]/20 flex items-center justify-center text-[#00C9B1] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">For advice groups</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1]/20 flex items-center justify-center text-[#00C9B1] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">Prepaid client packages</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1]/20 flex items-center justify-center text-[#00C9B1] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">Volume discounts available</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1]/20 flex items-center justify-center text-[#00C9B1] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">Dedicated support</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C9B1]/20 flex items-center justify-center text-[#00C9B1] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">Custom integrations</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/Register')}
                className="w-full px-6 py-3 rounded-[10px] text-[15px] font-semibold text-white bg-transparent border-2 border-white/20 hover:border-white hover:bg-white hover:text-[#0f172a] transition-all cursor-pointer"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#0a0f1a] border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center font-bold text-[#060D1A] text-sm shadow-lg" style={{ background: 'linear-gradient(135deg, #00C9B1, #00A693)' }}>
                AI
              </div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 600, color: '#F0F4FF' }}>
                AI <span style={{ color: '#00C9B1' }}>Paraplanner</span>
              </span>
            </div>

            <div className="flex items-center gap-8">
              <a href="#" className="text-[15px] text-[#94a3b8] hover:text-white transition-colors no-underline">Privacy Policy</a>
              <a href="#" className="text-[15px] text-[#94a3b8] hover:text-white transition-colors no-underline">Terms of Service</a>
              <a href="#" className="text-[15px] text-[#94a3b8] hover:text-white transition-colors no-underline">Contact</a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-[14px] text-[#64748b]">© 2026 AI Paraplanner. All rights reserved.</p>
          </div>
        </div>
      </footer>


    </div>
  );
}
