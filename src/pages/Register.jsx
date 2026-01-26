import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: '',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      await base44.auth.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName
      });
      toast.success('Registration successful! Please check your email to verify your account.');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-['Poppins']">
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
            to={createPageUrl('Login')}
            className="text-[15px] font-medium text-[#334155] hover:text-[#0f172a] no-underline"
          >
            Already have an account? <span className="text-[#3b82f6]">Log in</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-[100px] pb-20 px-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 gap-20 items-center">
          {/* Left Side - Benefits */}
          <div>
            <h1 className="font-['Playfair_Display'] text-[48px] leading-[1.15] font-semibold mb-6 text-[#0f172a]">
              Start scaling your practice <span className="text-[#3b82f6]">today</span>
            </h1>
            <p className="text-[17px] text-[#334155] leading-relaxed mb-10">
              Join hundreds of advisers who are transforming their paraplanning with AI.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-[#0f172a] mb-1">24-hour SOA turnaround</h3>
                  <p className="text-[15px] text-[#64748b]">AI-powered preparation, human expert review</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-[#0f172a] mb-1">75% faster fact finds</h3>
                  <p className="text-[15px] text-[#64748b]">Smart pre-fill and AI guidance for clients</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-[#0f172a] mb-1">Your AI avatar delivers advice</h3>
                  <p className="text-[15px] text-[#64748b]">Clients get 24/7 interactive SOA walkthroughs</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-[#0f172a] mb-1">Pay as you go</h3>
                  <p className="text-[15px] text-[#64748b]">No upfront costs, start with a single client</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-10">
            <h2 className="font-['Playfair_Display'] text-[32px] font-semibold text-[#0f172a] mb-2">
              Create your account
            </h2>
            <p className="text-[15px] text-[#64748b] mb-8">
              Get started with your 14-day trial. No credit card required.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">Full Name</Label>
                <Input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="John Smith"
                  required
                  className="h-12 px-4 border-2 border-slate-200 rounded-[10px] focus:border-[#3b82f6]"
                />
              </div>

              <div>
                <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">Work Email</Label>
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
                <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">Company / Practice</Label>
                <Input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  placeholder="Your Financial Group"
                  className="h-12 px-4 border-2 border-slate-200 rounded-[10px] focus:border-[#3b82f6]"
                />
              </div>

              <div>
                <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">Phone Number</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+61 400 000 000"
                  className="h-12 px-4 border-2 border-slate-200 rounded-[10px] focus:border-[#3b82f6]"
                />
              </div>

              <div>
                <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Minimum 8 characters"
                  required
                  className="h-12 px-4 border-2 border-slate-200 rounded-[10px] focus:border-[#3b82f6]"
                />
              </div>

              <div>
                <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">Confirm Password</Label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Re-enter your password"
                  required
                  className="h-12 px-4 border-2 border-slate-200 rounded-[10px] focus:border-[#3b82f6]"
                />
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: checked})}
                  className="mt-1"
                />
                <label className="text-[14px] text-[#64748b] leading-relaxed">
                  I agree to the <a href="#" className="text-[#3b82f6] hover:underline">Terms of Service</a> and <a href="#" className="text-[#3b82f6] hover:underline">Privacy Policy</a>
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-[10px] text-[16px] font-semibold text-white bg-gradient-to-br from-[#f97316] to-[#ea580c] hover:-translate-y-0.5 shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? 'Creating account...' : (
                  <>
                    Create Account <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[14px] text-[#64748b]">
                Already have an account?{' '}
                <Link to={createPageUrl('Login')} className="text-[#3b82f6] font-semibold hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}