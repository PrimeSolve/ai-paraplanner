import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterInternal() {
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInviteData();
  }, []);

  const loadInviteData = async () => {
    try {
      // Get invite token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get('email');

      if (!email) {
        // For preview purposes, show dummy data
        setInviteData({
          email: 'invited.user@example.com',
          name: 'Team Member'
        });
        setLoading(false);
        return;
      }

      setInviteData({
        email: email,
        name: 'Team Member'
      });
    } catch (error) {
      console.error('Failed to load invite data:', error);
      toast.error('Failed to load invite details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      // Base44 handles invite completion through their system
      // This is a placeholder for the actual invite completion flow
      toast.success('Account setup complete!');
      
      // Redirect to Home which will route to AdminDashboard
      setTimeout(() => {
        window.location.href = createPageUrl('Home');
      }, 1000);
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(error?.message || 'Failed to complete setup');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F4C5C]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F4C5C] to-[#1a6b7d] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-[#0F4C5C]">AI</span>
            </div>
            <span className="text-2xl font-bold text-white">AI Paraplanner</span>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Welcome to<br />the Team
          </h1>
          
          <p className="text-xl text-white/80 leading-relaxed">
            Complete your account setup to start creating professional Statements of Advice with AI-powered assistance.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Streamlined SOA Creation</h3>
              <p className="text-white/70 text-sm">Generate comprehensive SOAs in minutes, not hours</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Collaborative Workspace</h3>
              <p className="text-white/70 text-sm">Work seamlessly with advisers and team members</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Compliance Ready</h3>
              <p className="text-white/70 text-sm">Built-in compliance checks and quality assurance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Setup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0F4C5C] to-[#1a6b7d] rounded-2xl flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-[#0f172a] mb-2">
              Welcome to the team!
            </h2>
            <p className="text-[#64748b] text-lg">
              You've been invited as a team member. Set your password to get started.
            </p>
          </div>

          {/* Pre-filled Info */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-sm text-[#64748b] mb-1">Email</div>
            <div className="font-medium text-[#0f172a]">{inviteData?.email}</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f172a]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-[#64748b] mt-1.5">
                At least 8 characters
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f172a]"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-[#0F4C5C] to-[#1a6b7d] hover:from-[#0d3f4a] hover:to-[#155563] text-white h-12 text-base font-semibold"
            >
              {submitting ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#64748b]">
            Need help? Contact your administrator
          </div>
        </div>
      </div>
    </div>
  );
}