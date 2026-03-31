import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRedirect } from '@/auth/msalInstance';
import { ChevronDown } from 'lucide-react';
import NeuralBackground from '../components/NeuralBackground';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import AIDelivery from '../components/AIDelivery';
import Pricing from '../components/Pricing';

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
      <Features />

      {/* AI Delivery Section */}
      <AIDelivery />

      {/* Pricing Section */}
      <Pricing />

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
