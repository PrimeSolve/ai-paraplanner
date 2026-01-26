import React, { useState } from 'react';
import PublicLayout from '../components/public/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { 
  FileText, 
  Users, 
  Target, 
  Zap, 
  CheckCircle, 
  Clock,
  Shield,
  TrendingUp,
  ArrowRight,
  Sparkles,
  BarChart3,
  FileCheck,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

export default function PublicHome() {
  const [showWhitepaper, setShowWhitepaper] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [whitepaperEmail, setWhitepaperEmail] = useState('');
  const [demoForm, setDemoForm] = useState({ name: '', email: '', company: '', phone: '' });

  const handleWhitepaperSubmit = (e) => {
    e.preventDefault();
    toast.success('Whitepaper sent to your email!');
    setShowWhitepaper(false);
    setWhitepaperEmail('');
  };

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    toast.success('Demo request received! We\'ll contact you soon.');
    setShowDemo(false);
    setDemoForm({ name: '', email: '', company: '', phone: '' });
  };

  return (
    <PublicLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
      `}</style>

      {/* Hero Section */}
      <section className="min-h-screen pt-32 pb-20 px-12 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-20 items-center relative z-10">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button 
              onClick={() => setShowWhitepaper(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-semibold text-blue-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              The Future of Financial Advice
            </button>
            
            <h1 className="font-display text-6xl font-bold text-slate-900 leading-tight">
              Paraplanning that scales with your practice
            </h1>
            
            <p className="text-xl text-slate-600 leading-relaxed">
              AI-powered platform that transforms how Australian financial advisers create SOAs, manage clients, and deliver exceptional advice.
            </p>
            
            <div className="flex items-center gap-4 pt-4">
              <Button 
                size="lg"
                onClick={() => base44.auth.redirectToLogin()}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base px-8 py-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => setShowDemo(true)}
                className="text-base px-8 py-6 border-2"
              >
                Book a Demo
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
          
          <div className="relative animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                  <span className="text-sm font-semibold text-slate-600">STATEMENT OF ADVICE</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">IN PROGRESS</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Client fact find</div>
                      <div className="text-sm text-slate-500">Completed via AI assistant</div>
                      <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Risk profiling</div>
                      <div className="text-sm text-slate-500">Automated portfolio matching</div>
                      <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">SOA generation</div>
                      <div className="text-sm text-slate-500">AI-powered drafting</div>
                      <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{ width: '65%' }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Time saved vs traditional process:</span>
                    <span className="font-bold text-green-600 text-lg">8.5 hours</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-cyan-400 rounded-full blur-3xl opacity-30 animate-pulse" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-400 rounded-full blur-3xl opacity-30 animate-pulse delay-700" />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Trusted by leading advice groups</p>
          </div>
          <div className="grid grid-cols-4 gap-12 items-center opacity-60">
            <div className="flex items-center justify-center">
              <Building2 className="w-24 h-24 text-slate-400" />
            </div>
            <div className="flex items-center justify-center">
              <Building2 className="w-24 h-24 text-slate-400" />
            </div>
            <div className="flex items-center justify-center">
              <Building2 className="w-24 h-24 text-slate-400" />
            </div>
            <div className="flex items-center justify-center">
              <Building2 className="w-24 h-24 text-slate-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl font-bold text-slate-900 mb-4">
              Everything you need to scale
            </h2>
            <p className="text-xl text-slate-600">
              Comprehensive tools for modern financial advice practices
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">AI-Powered SOAs</h3>
                <p className="text-slate-600 leading-relaxed">
                  Generate comprehensive Statements of Advice in minutes, not hours. Our AI understands compliance and best practice.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Client Portals</h3>
                <p className="text-slate-600 leading-relaxed">
                  Give clients a seamless experience with fact finds, document sharing, and real-time progress tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Risk Profiling</h3>
                <p className="text-slate-600 leading-relaxed">
                  Configurable questionnaires and model portfolios that align with your advice philosophy and compliance requirements.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Time Tracking</h3>
                <p className="text-slate-600 leading-relaxed">
                  Automatic time capture and reporting across all client work. Understand your true profitability per client.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Compliance Built-In</h3>
                <p className="text-slate-600 leading-relaxed">
                  Australian regulatory requirements embedded throughout. Audit trails, document management, and reporting included.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-600 rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Analytics Dashboard</h3>
                <p className="text-slate-600 leading-relaxed">
                  Real-time insights into practice performance, adviser productivity, and client engagement metrics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl font-bold text-slate-900 mb-4">
              The difference is clear
            </h2>
            <p className="text-xl text-slate-600">
              See how AI Paraplanner compares to traditional methods
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 shadow-2xl">
            <div className="grid grid-cols-2 gap-16">
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Traditional Process</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-300">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span>12-15 hours per SOA</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span>Manual data entry</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span>Version control issues</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span>Limited client visibility</span>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-700">
                  <div className="text-4xl font-bold text-red-400">12-15h</div>
                  <div className="text-sm text-slate-400">Average time per SOA</div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">With AI Paraplanner</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span>4-6 hours per SOA</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span>Automated data extraction</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span>Complete audit trail</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span>Real-time client portal</span>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-700">
                  <div className="text-4xl font-bold text-green-400">4-6h</div>
                  <div className="text-sm text-slate-400">Average time per SOA</div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-700 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-500/20 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <span className="text-2xl font-bold text-white">60% time reduction</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(249,115,22,0.1),transparent_50%)]" />
        
        <div className="max-w-4xl mx-auto px-12 text-center relative z-10">
          <h2 className="font-display text-5xl font-bold text-white mb-6">
            Ready to transform your practice?
          </h2>
          <p className="text-xl text-slate-300 mb-10">
            Join leading Australian financial advisers who are scaling their practices with AI
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg px-10 py-7 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => setShowDemo(true)}
              className="text-lg px-10 py-7 border-2 border-white text-white hover:bg-white hover:text-slate-900"
            >
              Book a Demo
            </Button>
          </div>
          
          <p className="text-sm text-slate-400 mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Whitepaper Modal */}
      <Dialog open={showWhitepaper} onOpenChange={setShowWhitepaper}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Download Whitepaper</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleWhitepaperSubmit} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="whitepaper-email">Email Address</Label>
              <Input
                id="whitepaper-email"
                type="email"
                placeholder="your@email.com"
                value={whitepaperEmail}
                onChange={(e) => setWhitepaperEmail(e.target.value)}
                required
                className="mt-2"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Send Whitepaper
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Demo Modal */}
      <Dialog open={showDemo} onOpenChange={setShowDemo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Book a Demo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDemoSubmit} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="demo-name">Full Name</Label>
              <Input
                id="demo-name"
                value={demoForm.name}
                onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="demo-email">Email</Label>
              <Input
                id="demo-email"
                type="email"
                value={demoForm.email}
                onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="demo-company">Company</Label>
              <Input
                id="demo-company"
                value={demoForm.company}
                onChange={(e) => setDemoForm({ ...demoForm, company: e.target.value })}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="demo-phone">Phone</Label>
              <Input
                id="demo-phone"
                type="tel"
                value={demoForm.phone}
                onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                className="mt-2"
              />
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
              Request Demo
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}