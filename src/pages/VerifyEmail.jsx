import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mail, Code } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function VerifyEmail() {
  const [step, setStep] = useState('enter'); // 'enter' or 'verify'
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Check URL params for pre-filled email
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlEmail = params.get('email');
    if (urlEmail) {
      setEmail(urlEmail);
      setStep('verify');
    }
  }, []);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    try {
      setLoading(true);
      console.log('Sending OTP to:', email);
      await base44.auth.resendOtp(email);
      toast.success('Verification code sent to your email');
      setStep('verify');
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error(error?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error('Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      console.log('Verifying OTP for:', email);
      const result = await base44.auth.verifyOtp({
        email,
        otpCode
      });
      console.log('Verification success:', result);
      toast.success('Email verified successfully!');
      
      // Redirect to SignIn with email pre-filled
      setTimeout(() => {
        window.location.href = createPageUrl('SignIn') + `?email=${encodeURIComponent(email)}`;
      }, 1500);
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error(error?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setResendLoading(true);
      await base44.auth.resendOtp(email);
      toast.success('New verification code sent to your email');
    } catch (error) {
      toast.error(error?.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-['DM_Sans']">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Left Panel - Brand */}
      <div className="w-[45%] bg-[#0f172a] p-12 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 opacity-100" style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(34, 211, 238, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
          `
        }} />

        <Link to={createPageUrl('SignIn')} className="flex items-center gap-3 no-underline relative z-10">
          <div className="w-[42px] h-[42px] bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg">
            AI
          </div>
          <span className="font-['Playfair_Display'] text-[22px] font-semibold text-white">
            AI <span className="text-[#22d3ee]">Paraplanner</span>
          </span>
        </Link>

        <div className="flex-1 flex flex-col justify-center relative z-10">
          <h1 className="font-['Playfair_Display'] text-[42px] font-semibold text-white leading-tight mb-5">
            Verify your <span className="text-[#22d3ee]">email address</span>
          </h1>
          <p className="text-[18px] text-[#94a3b8] leading-relaxed">
            We've sent a verification code to your email. Enter it below to confirm your account and get started.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-[55%] p-12 px-20 flex flex-col justify-center bg-[#f8fafc] relative">
        <div className="absolute top-12 right-20">
          <Link to={createPageUrl('SignIn')} className="text-[14px] text-[#3b82f6] font-semibold hover:underline no-underline">
            Back to Sign In
          </Link>
        </div>

        <div className="max-w-[420px] w-full mx-auto">
          {step === 'enter' ? (
            <>
              <h2 className="font-['Playfair_Display'] text-[32px] font-semibold text-[#0f172a] mb-2">
                Enter your email
              </h2>
              <p className="text-[16px] text-[#64748b] mb-8">
                We'll send you a verification code.
              </p>

              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="block text-[14px] font-semibold text-[#0f172a] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-[50px] px-4 pl-12 border-2 border-[#e2e8f0] rounded-[10px] focus:border-[#3b82f6] text-[15px]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[50px] rounded-[10px] text-[16px] font-semibold text-white bg-gradient-to-br from-[#f97316] to-[#ea580c] hover:opacity-90"
                >
                  {loading ? 'Sending code...' : (
                    <>
                      Send Verification Code <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-['Playfair_Display'] text-[32px] font-semibold text-[#0f172a] mb-2">
                Enter your code
              </h2>
              <p className="text-[16px] text-[#64748b] mb-8">
                Check your email for a 6-digit verification code.
              </p>

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label className="block text-[14px] font-semibold text-[#0f172a] mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <Code className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                    <Input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength="6"
                      required
                      className="h-[50px] px-4 pl-12 border-2 border-[#e2e8f0] rounded-[10px] focus:border-[#3b82f6] text-[15px] tracking-[0.2em]"
                    />
                  </div>
                  <p className="text-[13px] text-[#64748b] mt-2">
                    Verification code for: <strong>{email}</strong>
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[50px] rounded-[10px] text-[16px] font-semibold text-white bg-gradient-to-br from-[#f97316] to-[#ea580c] hover:opacity-90"
                >
                  {loading ? 'Verifying...' : (
                    <>
                      Verify Email <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-4 border-t border-[#e2e8f0]">
                  <p className="text-[14px] text-[#64748b] mb-3">Didn't receive the code?</p>
                  <Button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendLoading}
                    variant="ghost"
                    className="text-[#3b82f6] font-semibold hover:text-[#1e40af]"
                  >
                    {resendLoading ? 'Sending...' : 'Resend Code'}
                  </Button>
                </div>

                <Button
                  type="button"
                  onClick={() => setStep('enter')}
                  variant="ghost"
                  className="w-full text-[#64748b] hover:text-[#334155]"
                >
                  Use different email
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}