import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.login({
        email: formData.email,
        password: formData.password
      });
      toast.success('Login successful!');
      window.location.href = createPageUrl('Home');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-['Poppins'] bg-gradient-to-br from-slate-50 to-slate-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-4 bg-white/95 backdrop-blur-md border-b border-black/5">
        <div className="max-w-[1400px] mx-auto px-12 flex items-center justify-between">
          <Link to={createPageUrl('PublicHome')} className="flex items-center gap-3 no-underline">
            <div className="w-[42px] h-[42px] bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg">
              AI
            </div>
            <span className="font-['Playfair_Display'] text-[22px] font-semibold text-[#0f172a]">
              AI <span className="text-[#3b82f6]">Paraplanner</span>
            </span>
          </Link>

          <Link 
            to={createPageUrl('Register')}
            className="text-[15px] font-medium text-[#334155] hover:text-[#0f172a] no-underline"
          >
            Don't have an account? <span className="text-[#3b82f6]">Register</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center pt-[100px] pb-20 px-6">
        <div className="max-w-[480px] w-full">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-10">
            <div className="text-center mb-8">
              <h1 className="font-['Playfair_Display'] text-[36px] font-semibold text-[#0f172a] mb-3">
                Welcome back
              </h1>
              <p className="text-[15px] text-[#64748b]">
                Log in to your AI Paraplanner account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john@example.com"
                  required
                  className="h-12 px-4 border-2 border-slate-200 rounded-[10px] focus:border-[#3b82f6]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[14px] font-semibold text-[#0f172a]">Password</Label>
                  <a href="#" className="text-[13px] text-[#3b82f6] hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter your password"
                  required
                  className="h-12 px-4 border-2 border-slate-200 rounded-[10px] focus:border-[#3b82f6]"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-[10px] text-[16px] font-semibold text-white bg-gradient-to-br from-[#f97316] to-[#ea580c] hover:-translate-y-0.5 shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? 'Logging in...' : (
                  <>
                    Log In <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[14px] text-[#64748b]">
                Don't have an account?{' '}
                <Link to={createPageUrl('Register')} className="text-[#3b82f6] font-semibold hover:underline">
                  Sign up for free
                </Link>
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
              <p className="text-[13px] text-center text-[#94a3b8]">
                By logging in, you agree to our{' '}
                <a href="#" className="text-[#3b82f6] hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-[#3b82f6] hover:underline">Privacy Policy</a>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link to={createPageUrl('PublicHome')} className="text-[14px] text-[#64748b] hover:text-[#0f172a] no-underline">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}