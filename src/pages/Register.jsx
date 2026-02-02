import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Users, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Register() {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Adviser fields
    fullName: '',
    email: '',
    afslNumber: '',
    phone: '',
    password: '',
    // Advice Group fields
    groupName: '',
    primaryContact: '',
    // Common
    agreeToTerms: false,
    agreeToMarketing: false
  });
  const [loading, setLoading] = useState(false);

  const handleAccountTypeSelect = (type) => {
    setAccountType(type);
    setTimeout(() => setStep(2), 300);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setAccountType('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submit button clicked, accountType:', accountType);
    
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the Terms of Service');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting registration for:', accountType);
      
      // Register user
      if (accountType === 'adviser') {
        console.log('Registering adviser:', formData.email);
        await base44.auth.register({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName
        });
      } else if (accountType === 'advice_group') {
        console.log('Registering advice group:', formData.email);
        await base44.auth.register({
          email: formData.email,
          password: formData.password,
          full_name: formData.primaryContact
        });
        
        // Create AdviceGroup record
        console.log('Creating AdviceGroup record...');
        await base44.entities.AdviceGroup.create({
          user_id: '', // Will be set after user verifies email
          name: formData.groupName,
          contact_email: formData.email,
          contact_phone: formData.phone || '',
          status: 'active',
          subscription_tier: 'professional'
        });
        console.log('AdviceGroup created');
      }
      
      console.log('Registration complete, redirecting to VerifyEmail');
      toast.success('Account created! Please verify your email.');
      
      // Redirect to VerifyEmail with email pre-filled
      window.location.href = createPageUrl('VerifyEmail') + `?email=${encodeURIComponent(formData.email)}`;
    } catch (error) {
      console.error('Registration error:', error);
      alert('Error: ' + error.message);
      toast.error(error?.message || 'Registration failed');
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
            Join the future of <span className="text-[#22d3ee]">financial advice</span>
          </h1>
          <p className="text-[18px] text-[#94a3b8] leading-relaxed mb-10">
            AI-powered paraplanning that helps you deliver better advice, faster. Get started in minutes.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[rgba(34,211,238,0.15)] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#22d3ee]" />
              </div>
              <span className="text-[15px] text-[#94a3b8]">24-hour SOA turnaround</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[rgba(34,211,238,0.15)] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#22d3ee]" />
              </div>
              <span className="text-[15px] text-[#94a3b8]">AI-powered fact finds & SOA builder</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[rgba(34,211,238,0.15)] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#22d3ee]" />
              </div>
              <span className="text-[15px] text-[#94a3b8]">Human paraplanner review on every SOA</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[rgba(34,211,238,0.15)] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#22d3ee]" />
              </div>
              <span className="text-[15px] text-[#94a3b8]">Your own AI avatar to explain advice</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-[55%] p-12 px-20 flex flex-col overflow-y-auto bg-[#f8fafc]">
        <div className="flex justify-end mb-10">
          <div className="text-[14px] text-[#64748b]">
            Already have an account?{' '}
            <Link to={createPageUrl('SignIn')} className="text-[#3b82f6] font-semibold hover:underline no-underline">
              Log In
            </Link>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`flex items-center gap-2 ${step === 1 ? 'opacity-100' : 'opacity-40'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold ${
              step === 1 ? 'bg-[#3b82f6] text-white' : step > 1 ? 'bg-[#10b981] text-white' : 'bg-[#e2e8f0] text-[#64748b]'
            }`}>
              {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </div>
            <span className="text-[14px] font-medium text-[#0f172a]">Account Type</span>
          </div>
          <div className="flex-1 h-[2px] bg-[#e2e8f0] max-w-[60px]" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'opacity-100' : 'opacity-40'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold ${
              step === 2 ? 'bg-[#3b82f6] text-white' : 'bg-[#e2e8f0] text-[#64748b]'
            }`}>
              2
            </div>
            <span className="text-[14px] font-medium text-[#0f172a]">Your Details</span>
          </div>
        </div>

        {/* Step 1: Account Type Selection */}
        {step === 1 && (
          <div>
            <h2 className="font-['Playfair_Display'] text-[32px] font-semibold text-[#0f172a] mb-2">
              Create your account
            </h2>
            <p className="text-[16px] text-[#64748b] mb-8">
              How will you be using AI Paraplanner?
            </p>

            <div className="grid grid-cols-2 gap-5 mb-8">
              <button
                onClick={() => handleAccountTypeSelect('adviser')}
                className={`border-2 rounded-2xl p-7 text-left transition-all cursor-pointer bg-white ${
                  accountType === 'adviser' 
                    ? 'border-[#3b82f6] shadow-[0_4px_20px_rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.04)]' 
                    : 'border-[#e2e8f0] hover:border-[#3b82f6] hover:shadow-[0_4px_20px_rgba(59,130,246,0.1)]'
                }`}
              >
                <div className="w-[52px] h-[52px] rounded-xl bg-[rgba(59,130,246,0.15)] flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-[#3b82f6]" />
                </div>
                <h3 className="text-[18px] font-bold text-[#0f172a] mb-1.5">I'm an Adviser</h3>
                <p className="text-[14px] text-[#64748b] leading-relaxed">
                  Individual adviser working under an AFSL. We'll connect you to your advice group.
                </p>
              </button>

              <button
                onClick={() => handleAccountTypeSelect('advice_group')}
                className={`border-2 rounded-2xl p-7 text-left transition-all cursor-pointer bg-white ${
                  accountType === 'advice_group' 
                    ? 'border-[#3b82f6] shadow-[0_4px_20px_rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.04)]' 
                    : 'border-[#e2e8f0] hover:border-[#3b82f6] hover:shadow-[0_4px_20px_rgba(59,130,246,0.1)]'
                }`}
              >
                <div className="w-[52px] h-[52px] rounded-xl bg-[rgba(249,115,22,0.15)] flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[#f97316]" />
                </div>
                <h3 className="text-[18px] font-bold text-[#0f172a] mb-1.5">I'm an Advice Group</h3>
                <p className="text-[14px] text-[#64748b] leading-relaxed">
                  Licensee or dealer group managing multiple advisers under your AFSL.
                </p>
              </button>
            </div>

            <div className="text-center">
              <p className="text-[14px] text-[#64748b] mb-4">or sign up with</p>
              <div className="grid grid-cols-2 gap-4">
                <button className="h-12 border-2 border-[#e2e8f0] rounded-[10px] flex items-center justify-center gap-2 hover:bg-white transition-colors bg-white">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-[15px] font-medium text-[#0f172a]">Google</span>
                </button>
                <button className="h-12 border-2 border-[#e2e8f0] rounded-[10px] flex items-center justify-center gap-2 hover:bg-white transition-colors bg-white">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#000"/>
                  </svg>
                  <span className="text-[15px] font-medium text-[#0f172a]">Apple</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Registration Form */}
        {step === 2 && accountType === 'adviser' && (
          <div>
            <h2 className="font-['Playfair_Display'] text-[32px] font-semibold text-[#0f172a] mb-2">
              Adviser Registration
            </h2>
            <p className="text-[16px] text-[#64748b] mb-8">
              Enter your details to create your account
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
                  className="h-[50px] px-4 border-2 border-[#e2e8f0] rounded-[10px] focus:border-[#3b82f6] text-[15px]"
                />
              </div>

              <div>
                <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">Email Address</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john@example.com"
                  required
                  className="h-[50px] px-4 border-2 border-[#e2e8f0] rounded-[10px] focus:border-[#3b82f6] text-[15px]"
                />
              </div>

              <div>
                <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">AFSL Number</Label>
                <Input
                  type="text"
                  value={formData.afslNumber}
                  onChange={(e) => setFormData({...formData, afslNumber: e.target.value})}
                  placeholder="123456"
                  className="h-[50px] px-4 border-2 border-[#e2e8f0] rounded-[10px] focus:border-[#3b82f6] text-[15px]"
                />
                <p className="text-[13px] text-[#64748b] mt-1.5">We'll match you to your advice group</p>
              </div>

              <div>
                <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">
                  Phone <span className="font-normal text-[#64748b]">(optional)</span>
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="0412 345 678"
                  className="h-[50px] px-4 border-2 border-[#e2e8f0] rounded-[10px] focus:border-[#3b82f6] text-[15px]"
                />
              </div>

              <div>
                <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Create a strong password"
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

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: checked})}
                    className="mt-0.5"
                  />
                  <label className="text-[14px] text-[#64748b] leading-relaxed">
                    I agree to the{' '}
                    <a href="#" className="text-[#3b82f6] hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-[#3b82f6] hover:underline">Privacy Policy</a>
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={formData.agreeToMarketing}
                    onCheckedChange={(checked) => setFormData({...formData, agreeToMarketing: checked})}
                    className="mt-0.5"
                  />
                  <label className="text-[14px] text-[#64748b] leading-relaxed">
                    Send me product updates and tips (you can unsubscribe anytime)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  className="h-12 px-6 rounded-[10px] border-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 rounded-[10px] text-[16px] font-semibold text-white bg-gradient-to-br from-[#f97316] to-[#ea580c] hover:opacity-90"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && accountType === 'advice_group' && (
          <div>
            <h2 className="font-['Playfair_Display'] text-[32px] font-semibold text-[#0f172a] mb-2">
              Advice Group Registration
            </h2>
            <p className="text-[16px] text-[#64748b] mb-8">
              Set up your group account to manage your advisers
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">Group / Licensee Name</Label>
                <Input
                  type="text"
                  value={formData.groupName}
                  onChange={(e) => setFormData({...formData, groupName: e.target.value})}
                  placeholder="ABC Financial Group"
                  required
                  className="h-[50px] px-4 border-2 border-[#e2e8f0] rounded-[10px] focus:border-[#3b82f6] text-[15px]"
                />
              </div>

              <div>
                <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">AFSL Number</Label>
                <Input
                  type="text"
                  value={formData.afslNumber}
                  onChange={(e) => setFormData({...formData, afslNumber: e.target.value})}
                  placeholder="123456"
                  className="h-[50px] px-4 border-2 border-[#e2e8f0] rounded-[10px] focus:border-[#3b82f6] text-[15px]"
                />
                <p className="text-[13px] text-[#64748b] mt-1.5">Advisers registering with this AFSL will be linked to your group</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">Primary Contact Name</Label>
                  <Input
                    type="text"
                    value={formData.primaryContact}
                    onChange={(e) => setFormData({...formData, primaryContact: e.target.value})}
                    placeholder="Jane Smith"
                    required
                    className="h-[50px] px-4 border-2 border-[#e2e8f0] rounded-[10px] focus:border-[#3b82f6] text-[15px]"
                  />
                </div>
                <div>
                  <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">
                    Phone <span className="font-normal text-[#64748b]">(optional)</span>
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="0412 345 678"
                    className="h-[50px] px-4 border-2 border-[#e2e8f0] rounded-[10px] focus:border-[#3b82f6] text-[15px]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">Email Address</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="admin@abcfinancial.com.au"
                  required
                  className="h-[50px] px-4 border-2 border-[#e2e8f0] rounded-[10px] focus:border-[#3b82f6] text-[15px]"
                />
              </div>

              <div>
                <Label className="text-[14px] font-semibold text-[#0f172a] mb-2 block">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Create a strong password"
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

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: checked})}
                    className="mt-0.5"
                  />
                  <label className="text-[14px] text-[#64748b] leading-relaxed">
                    I agree to the{' '}
                    <a href="#" className="text-[#3b82f6] hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-[#3b82f6] hover:underline">Privacy Policy</a>
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={formData.agreeToMarketing}
                    onCheckedChange={(checked) => setFormData({...formData, agreeToMarketing: checked})}
                    className="mt-0.5"
                  />
                  <label className="text-[14px] text-[#64748b] leading-relaxed">
                    Send me product updates and tips (you can unsubscribe anytime)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  className="h-12 px-6 rounded-[10px] border-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 rounded-[10px] text-[16px] font-semibold text-white bg-gradient-to-br from-[#f97316] to-[#ea580c] hover:opacity-90"
                >
                  {loading ? 'Creating group account...' : 'Create Group Account'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}