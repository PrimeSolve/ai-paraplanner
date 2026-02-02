import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login attempt started');
    console.log('Email:', formData.email);
    console.log('Password:', formData.password ? '(provided)' : '(empty)');
    setLoading(true);
    try {
      console.log('Calling base44.auth.login...');
      const result = await base44.auth.login({
        email: formData.email,
        password: formData.password
      });
      console.log('Login successful, result:', result);
      toast.success('Login successful!');
      window.location.href = createPageUrl('Home');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
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

        <Link to={createPageUrl('PublicHome')} className="flex items-center gap-3 no-underline relative z-10">
          <div className="w-[42px] h-[42px] bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg">
            AI
          </div>
          <span className="font-['Playfair_Display'] text-[22px] font-semibold text-white">
            AI <span className="text-[#22d3ee]">Paraplanner</span>
          </span>
        </Link>

        <div className="flex-1 flex flex-col justify-center relative z-10">
          <h1 className="font-['Playfair_Display'] text-[42px] font-semibold text-white leading-tight mb-5">
            Welcome back to <span className="text-[#22d3ee]">AI Paraplanner</span>
          </h1>
          <p className="text-[18px] text-[#94a3b8] leading-relaxed mb-10">
            Log in to access your dashboard, manage clients, and continue delivering exceptional financial advice.
          </p>

          <div className="flex gap-10">
            <div>
              <div className="font-['Playfair_Display'] text-[32px] font-bold text-[#22d3ee] mb-1">75%</div>
              <div className="text-[14px] text-[#94a3b8]">Faster Fact Finds</div>
            </div>
            <div>
              <div className="font-['Playfair_Display'] text-[32px] font-bold text-[#22d3ee] mb-1">24hr</div>
              <div className="text-[14px] text-[#94a3b8]">SOA Turnaround</div>
            </div>
            <div>
              <div className="font-['Playfair_Display'] text-[32px] font-bold text-[#22d3ee] mb-1">4+ hrs</div>
              <div className="text-[14px] text-[#94a3b8]">Saved Per Client</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-[55%] p-12 px-20 flex flex-col justify-center bg-[#f8fafc] relative">
        <div className="absolute top-12 right-20 text-[14px] text-[#64748b]">
          Don't have an account?{' '}
          <Link to={createPageUrl('Register')} className="text-[#3b82f6] font-semibold hover:underline no-underline">
            Register
          </Link>
        </div>

        <div className="max-w-[420px] w-full mx-auto">
          <h2 className="font-['Playfair_Display'] text-[32px] font-semibold text-[#0f172a] mb-2">
            Log in to your account
          </h2>
          <p className="text-[16px] text-[#64748b] mb-8">
            Enter your credentials to access your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[14px] font-semibold text-[#0f172a] mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="you@example.com"
                required
                className="h-[50px] px-4 border-2 border-[#e2e8f0] rounded-[10px] focus:border-[#3b82f6] text-[15px]"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#0f172a] mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter your password"
                  required
                  className="h-[50px] px-4 pr-12 border-2 border-[#e2e8f0] rounded-[10px] focus:border-[#3b82f6] text-[15px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#334155]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => setFormData({...formData, rememberMe: checked})}
                />
                <label className="text-[14px] text-[#334155] cursor-pointer">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-[14px] text-[#3b82f6] font-medium hover:underline">
                Forgot password?
              </a>
            </div>

            <Button
              type="button"
              disabled={loading}
              onClick={(e) => {
                alert('Login button clicked');
                handleSubmit(e);
              }}
              className="w-full h-[50px] rounded-[10px] text-[16px] font-semibold text-white bg-gradient-to-br from-[#f97316] to-[#ea580c] hover:opacity-90"
            >
              {loading ? 'Logging in...' : (
                <>
                  Log In <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-[14px] text-[#64748b] mb-4">or continue with</p>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" className="h-12 border-2 border-[#e2e8f0] rounded-[10px] flex items-center justify-center gap-2 hover:bg-white transition-colors bg-white">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-[15px] font-medium text-[#0f172a]">Google</span>
                </button>
                <button type="button" className="h-12 border-2 border-[#e2e8f0] rounded-[10px] flex items-center justify-center gap-2 hover:bg-white transition-colors bg-white">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#000"/>
                  </svg>
                  <span className="text-[15px] font-medium text-[#0f172a]">Apple</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}