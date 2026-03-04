import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRedirect } from '@/auth/msalInstance';
import { ChevronDown } from 'lucide-react';

export default function PublicHome() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="font-['Poppins']">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');

        :root {
          --navy-deep: #0a0f1a;
          --navy: #0f172a;
          --navy-light: #1e293b;
          --slate: #334155;
          --slate-light: #64748b;
          --cyan-glow: #22d3ee;
          --blue-electric: #3b82f6;
          --blue-deep: #1d4ed8;
          --coral: #f97316;
          --coral-light: #fb923c;
          --coral-dark: #ea580c;
          --white: #ffffff;
          --off-white: #f8fafc;
          --grey-light: #e2e8f0;
          --grey: #94a3b8;
          --success: #10b981;
        }
      `}</style>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3 shadow-lg' : 'py-4'} bg-white/95 backdrop-blur-md border-b border-black/5`}>
        <div className="max-w-[1400px] mx-auto px-12 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 no-underline">
            <div className="w-[42px] h-[42px] bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg">
              AI
            </div>
            <span className="font-['Playfair_Display'] text-[22px] font-semibold text-[#0f172a]">
              AI <span className="text-[#3b82f6]">Paraplanner</span>
            </span>
          </a>

          <div className="flex items-center gap-9">
            <a href="#how-it-works" className="text-[15px] font-medium text-[#334155] hover:text-[#0f172a] no-underline relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#3b82f6] after:transition-all hover:after:w-full">How It Works</a>
            <a href="#features" className="text-[15px] font-medium text-[#334155] hover:text-[#0f172a] no-underline relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#3b82f6] after:transition-all hover:after:w-full">Features</a>
            <a href="#pricing" className="text-[15px] font-medium text-[#334155] hover:text-[#0f172a] no-underline relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#3b82f6] after:transition-all hover:after:w-full">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => loginRedirect()}
              className="px-6 py-3 rounded-[10px] text-[15px] font-semibold text-[#0f172a] bg-transparent border-2 border-[#e2e8f0] hover:border-[#0f172a] hover:bg-[#0f172a] hover:text-white transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/Register')}
              className="px-6 py-3 rounded-[10px] text-[15px] font-semibold text-white bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] hover:-translate-y-0.5 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen pt-[140px] pb-20 px-12 relative overflow-hidden">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6972a3fd8e7c6c1f67cdacab/775a01db7_shutterstock_1125352451.jpg"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#f0f4f8]/85 via-[#e8eef5]/80 to-[#dce5f0]/85" />
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 gap-20 items-center relative z-10">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="font-['Playfair_Display'] text-[60px] leading-[1.15] font-semibold mb-6">
              <span className="text-[#0f172a]">Paraplanning that </span>
              <span className="text-[#3b82f6]">scales</span>
              <span className="text-[#0f172a]"> with your practice</span>
            </h1>

            <p className="text-[19px] text-[#0f172a] leading-[1.7] mb-9 max-w-[520px]">
              AI handles the preparation. Humans ensure the quality. Your clients get advice they actually understand.
            </p>

            <div className="flex gap-4 mb-12">
              <button
                onClick={() => navigate('/Register')}
                className="px-8 py-4 rounded-[12px] text-[17px] font-semibold text-white bg-gradient-to-br from-[#f97316] to-[#ea580c] hover:-translate-y-0.5 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                Get Started
              </button>
              <a
                href="#how-it-works"
                className="px-8 py-4 rounded-[12px] text-[17px] font-semibold text-[#0f172a] bg-white border-2 border-[#e2e8f0] hover:border-[#0f172a] inline-flex items-center gap-2 no-underline transition-all"
              >
                See How It Works
                <ChevronDown className="w-5 h-5" />
              </a>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-[36px] font-bold text-[#0f172a] mb-1">75%</div>
                <div className="text-[15px] text-[#64748b]">Faster Fact Finds</div>
              </div>
              <div>
                <div className="text-[36px] font-bold text-[#0f172a] mb-1">24hr</div>
                <div className="text-[15px] text-[#64748b]">SOA Turnaround</div>
              </div>
              <div>
                <div className="text-[36px] font-bold text-[#0f172a] mb-1">4+ hrs</div>
                <div className="text-[15px] text-[#64748b]">Adviser Prep Time Saved</div>
              </div>
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src="https://app.heygen.com/embed/67699df2c2294868a5b586c42f2fa217"
                className="w-full aspect-video border-0"
                allow="fullscreen"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6972a3fd8e7c6c1f67cdacab/06d841c8f_techwaves.png"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0f172a]/85" />
        <div className="max-w-[1200px] mx-auto px-12 relative z-10">
          <div className="text-center mb-20">
            <h2 className="font-['Playfair_Display'] text-[52px] font-semibold text-white mb-4">
              How It <span className="text-[#22d3ee]">Works</span>
            </h2>
            <p className="text-[19px] text-[#94a3b8] max-w-[700px] mx-auto">
              From fact find to advice delivery — a seamless journey powered by AI and backed by humans.
            </p>
          </div>

          <div className="space-y-12 relative">
            {/* Center line */}
            <div className="absolute left-1/2 top-[60px] bottom-[60px] w-[2px] bg-[#22d3ee] -translate-x-1/2" />

            {/* Step 1 */}
            <div className="grid grid-cols-2 gap-16 items-start relative">
              <div className="text-right bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur-sm">
                <h3 className="text-[24px] font-bold text-white mb-3">Build Your Client Profile</h3>
                <p className="text-[16px] text-[#94a3b8] leading-relaxed mb-4">
                  Send your client an AI-powered Fact Find. Smart pre-fill extracts data from documents while the AI assistant guides them through every section.
                </p>
                <div className="flex gap-2 justify-end flex-wrap">
                  <span className="px-3 py-1 bg-[#1e293b] text-[#22d3ee] text-[13px] font-semibold rounded-full">AI-Powered</span>
                  <span className="px-3 py-1 bg-[#1e293b] text-[#22d3ee] text-[13px] font-semibold rounded-full">Smart Pre-fill</span>
                  <span className="px-3 py-1 bg-[#1e293b] text-[#22d3ee] text-[13px] font-semibold rounded-full">Mobile Friendly</span>
                </div>
              </div>
              <div></div>
              <div className="absolute left-1/2 top-8 -translate-x-1/2 w-14 h-14 rounded-full bg-[#22d3ee] flex items-center justify-center text-[#0f172a] text-[22px] font-bold shadow-[0_0_30px_rgba(34,211,238,0.6)] z-10">1</div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-2 gap-16 items-start relative">
              <div></div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur-sm">
                <h3 className="text-[24px] font-bold text-white mb-3">Create a Cashflow Model or SOA Request</h3>
                <p className="text-[16px] text-[#94a3b8] leading-relaxed mb-4">
                  Your AI paraplanner guides you through recommendations in real time. It prompts for missing details, validates your strategy, and ensures nothing slips through.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#1e293b] text-[#22d3ee] text-[13px] font-semibold rounded-full">Real-time Guidance</span>
                  <span className="px-3 py-1 bg-[#1e293b] text-[#22d3ee] text-[13px] font-semibold rounded-full">Smart Validation</span>
                  <span className="px-3 py-1 bg-[#1e293b] text-[#22d3ee] text-[13px] font-semibold rounded-full">Nothing Missed</span>
                </div>
              </div>
              <div className="absolute left-1/2 top-8 -translate-x-1/2 w-14 h-14 rounded-full bg-[#22d3ee] flex items-center justify-center text-[#0f172a] text-[22px] font-bold shadow-[0_0_30px_rgba(34,211,238,0.6)] z-10">2</div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-2 gap-16 items-start relative">
              <div className="text-right bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur-sm">
                <h3 className="text-[24px] font-bold text-white mb-3">AI Generates a Compliant SOA</h3>
                <p className="text-[16px] text-[#94a3b8] leading-relaxed mb-4">
                  Powered by PrimeSolve's optimised modelling engine, AI generates a compliant, comprehensive Statement of Advice. Every document is reviewed by qualified paraplanners.
                </p>
                <div className="flex gap-2 justify-end flex-wrap">
                  <span className="px-3 py-1 bg-[#1e293b] text-[#22d3ee] text-[13px] font-semibold rounded-full">PrimeSolve Engine</span>
                  <span className="px-3 py-1 bg-[#1e293b] text-[#22d3ee] text-[13px] font-semibold rounded-full">Human Reviewed</span>
                  <span className="px-3 py-1 bg-[#1e293b] text-[#22d3ee] text-[13px] font-semibold rounded-full">Compliant</span>
                </div>
              </div>
              <div></div>
              <div className="absolute left-1/2 top-8 -translate-x-1/2 w-14 h-14 rounded-full bg-[#22d3ee] flex items-center justify-center text-[#0f172a] text-[22px] font-bold shadow-[0_0_30px_rgba(34,211,238,0.6)] z-10">3</div>
            </div>

            {/* Step 4 */}
            <div className="grid grid-cols-2 gap-16 items-start relative">
              <div></div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur-sm">
                <h3 className="text-[24px] font-bold text-white mb-3">Review, Refine & Deliver</h3>
                <p className="text-[16px] text-[#94a3b8] leading-relaxed mb-4">
                  Get your completed SOA in 24 hours. Choose PDF or Word for compliance records, plus interactive HTML for client engagement — you get all three. Review, refine, and deliver to your client.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#1e293b] text-[#22d3ee] text-[13px] font-semibold rounded-full">PDF Export</span>
                  <span className="px-3 py-1 bg-[#1e293b] text-[#22d3ee] text-[13px] font-semibold rounded-full">Word Export</span>
                  <span className="px-3 py-1 bg-[#1e293b] text-[#22d3ee] text-[13px] font-semibold rounded-full">Interactive HTML</span>
                </div>
              </div>
              <div className="absolute left-1/2 top-8 -translate-x-1/2 w-14 h-14 rounded-full bg-[#22d3ee] flex items-center justify-center text-[#0f172a] text-[22px] font-bold shadow-[0_0_30px_rgba(34,211,238,0.6)] z-10">4</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-br from-[#0a0f1a] to-[#0f172a]">
        <div className="max-w-[1200px] mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="font-['Playfair_Display'] text-[52px] font-semibold text-white mb-4">
              Breakthrough <span className="text-[#22d3ee]">Features</span>
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

      {/* AI Avatar Section */}
      <section id="avatar" className="py-24 bg-[#f8fafc]">
        <div className="max-w-[1200px] mx-auto px-12">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-['Playfair_Display'] text-[48px] font-semibold text-[#0f172a] mb-4 leading-tight">
                Your AI avatar.
              </h2>
              <h3 className="font-['Playfair_Display'] text-[48px] font-semibold text-[#f97316] mb-6 leading-tight">
                Explaining your advice.
              </h3>
              <p className="text-[17px] text-[#334155] leading-relaxed mb-8">
                Imagine your client receiving their SOA as a beautiful, interactive HTML document. They click play, and a digital version of you walks them through every recommendation, every strategy, every fee.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#10b981] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">✓</div>
                  <div>
                    <span className="text-[16px] font-bold text-[#0f172a]">Ask questions anytime</span>
                    <span className="text-[16px] text-[#64748b]"> — The AI knows your SOA inside out</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#10b981] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">✓</div>
                  <div>
                    <span className="text-[16px] font-bold text-[#0f172a]">Available 24/7</span>
                    <span className="text-[16px] text-[#64748b]"> — Clients review advice on their schedule</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#10b981] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">✓</div>
                  <div>
                    <span className="text-[16px] font-bold text-[#0f172a]">Consistent messaging</span>
                    <span className="text-[16px] text-[#64748b]"> — Every explanation is accurate and compliant</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#10b981] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">✓</div>
                  <div>
                    <span className="text-[16px] font-bold text-[#0f172a]">Beautiful presentation</span>
                    <span className="text-[16px] text-[#64748b]"> — Not PDF junk, but engaging HTML</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/Register')}
                className="inline-block px-8 py-4 rounded-[12px] text-[17px] font-bold text-white bg-gradient-to-br from-[#f97316] to-[#ea580c] hover:-translate-y-0.5 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                Get Started
              </button>
            </div>
            <div>
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] p-4">
                  <h3 className="text-white font-bold text-[17px]">AI Fact Find Assistant</h3>
                  <p className="text-white/80 text-[14px]">Goals Discovery Session</p>
                </div>

                {/* Chat Body */}
                <div className="p-6 space-y-4 bg-slate-50">
                  {/* Avatar Message 1 */}
                  <div className="flex gap-3 items-start">
                    <img
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6972a3fd8e7c6c1f67cdacab/2b487cd9c_image.png"
                      alt="AI Avatar"
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="bg-[#f8fafc] rounded-2xl rounded-tl-sm p-4 max-w-[75%]">
                      <p className="text-[14px] text-slate-700 leading-relaxed">
                        "Hi Sarah, we have successfully captured your relevant financial data now. We are going to switch gears now and work together to define your lifestyle and financial goals. Ready to get started?"
                      </p>
                    </div>
                  </div>

                  {/* User Message */}
                  <div className="flex gap-3 items-start justify-end">
                    <div className="bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] rounded-2xl rounded-tr-sm p-4 max-w-[75%]">
                      <p className="text-[14px] text-white leading-relaxed">
                        "Sure, ask me what you need to know."
                      </p>
                    </div>
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-white font-bold flex-shrink-0">
                      S
                    </div>
                  </div>

                  {/* Avatar Message 2 */}
                  <div className="flex gap-3 items-start">
                    <img
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6972a3fd8e7c6c1f67cdacab/2b487cd9c_image.png"
                      alt="AI Avatar"
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="bg-[#f8fafc] rounded-2xl rounded-tl-sm p-4 max-w-[75%]">
                      <p className="text-[14px] text-slate-700 leading-relaxed">
                        "Great. We can see you have children currently in grade 5 and grade 3. Have you decided on where they might go to high school?"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-[#0f172a]">
        <div className="max-w-[1200px] mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="font-['Playfair_Display'] text-[52px] font-semibold text-white mb-4">
              Simple, transparent <span className="text-[#22d3ee]">pricing</span>
            </h2>
            <p className="text-[19px] text-[#94a3b8]">
              Start with pay-as-you-go, upgrade when you're ready.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Tier 1 - Scaled Advice */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all">
              <div className="text-sm font-bold text-[#22d3ee] uppercase tracking-wide mb-2">Scaled Advice</div>
              <div className="mb-6">
                <span className="text-[48px] font-bold text-white">$395</span>
                <div className="text-[#94a3b8] text-[15px]">per transaction</div>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee]/20 flex items-center justify-center text-[#22d3ee] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">AI Fact Find with pre-fill</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee]/20 flex items-center justify-center text-[#22d3ee] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">AI SOA Request builder</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee]/20 flex items-center justify-center text-[#22d3ee] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">Human paraplanner review</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee]/20 flex items-center justify-center text-[#22d3ee] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">48-hour turnaround</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee]/20 flex items-center justify-center text-[#22d3ee] text-xs mt-0.5 flex-shrink-0">✓</div>
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
            <div className="bg-gradient-to-br from-[#22d3ee]/10 to-[#3b82f6]/10 border-2 border-[#22d3ee] rounded-2xl p-8 transform scale-105 shadow-[0_0_40px_rgba(34,211,238,0.3)] relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] text-[#0f172a] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Most Popular
              </div>
              <div className="text-sm font-bold text-[#22d3ee] uppercase tracking-wide mb-2">Comprehensive Advice</div>
              <div className="mb-6">
                <span className="text-[48px] font-bold text-white">$695</span>
                <div className="text-[#94a3b8] text-[15px]">per transaction</div>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee] flex items-center justify-center text-[#0f172a] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-white font-medium">Everything in Tier 1</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee] flex items-center justify-center text-[#0f172a] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-white">Custom AI avatar</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee] flex items-center justify-center text-[#0f172a] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-white">SOA AI walkthroughs</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee] flex items-center justify-center text-[#0f172a] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-white">Unlimited strategy recommendations</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee] flex items-center justify-center text-[#0f172a] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-white">Unlimited cashflow models</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee] flex items-center justify-center text-[#0f172a] text-xs mt-0.5 flex-shrink-0">✓</div>
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
              <div className="text-sm font-bold text-[#22d3ee] uppercase tracking-wide mb-2">Enterprise</div>
              <div className="mb-6">
                <span className="text-[48px] font-bold text-white">Custom</span>
                <div className="text-[#94a3b8] text-[15px]">volume pricing</div>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee]/20 flex items-center justify-center text-[#22d3ee] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">For advice groups</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee]/20 flex items-center justify-center text-[#22d3ee] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">Prepaid client packages</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee]/20 flex items-center justify-center text-[#22d3ee] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">Volume discounts available</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee]/20 flex items-center justify-center text-[#22d3ee] text-xs mt-0.5 flex-shrink-0">✓</div>
                  <span className="text-[15px] text-[#e2e8f0]">Dedicated support</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22d3ee]/20 flex items-center justify-center text-[#22d3ee] text-xs mt-0.5 flex-shrink-0">✓</div>
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
              <div className="w-[42px] h-[42px] bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg">
                AI
              </div>
              <span className="font-['Playfair_Display'] text-[22px] font-semibold text-white">
                AI <span className="text-[#3b82f6]">Paraplanner</span>
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
