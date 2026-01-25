import React from 'react';
import PublicLayout from '../components/public/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { FileText, Users, Target, Zap, CheckCircle, TrendingUp } from 'lucide-react';

export default function PublicHome() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-50 to-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-['Fraunces'] font-bold text-slate-800 mb-6">
              Transform Your Financial Advice Practice
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              AI-powered paraplanning platform designed for Australian financial advisers. Streamline SOAs, manage clients, and deliver exceptional advice.
            </p>
            <div className="flex items-center gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-slate-800 hover:bg-slate-700 text-lg px-8 py-6"
                onClick={() => base44.auth.redirectToLogin()}
              >
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6"
                onClick={() => window.location.href = '#features'}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-['Fraunces'] font-bold text-slate-800 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-slate-600">
              Built for financial advisers, advice groups, and their clients
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                  <FileText className="w-7 h-7 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">SOA Automation</h3>
                <p className="text-slate-600">
                  AI-assisted Statement of Advice creation with templates, prefill, and compliance checks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Client Management</h3>
                <p className="text-slate-600">
                  Comprehensive client portals for fact finds, documents, and communication
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Risk Profiling</h3>
                <p className="text-slate-600">
                  Configurable risk profiles and model portfolios for consistent advice delivery
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-['Fraunces'] font-bold text-slate-800 mb-6">
                Save Hours on Every SOA
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">AI-Powered Prefill</h4>
                    <p className="text-slate-600">Extract data from existing documents automatically</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Template Management</h4>
                    <p className="text-slate-600">Customize SOA templates at group and adviser level</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Compliance Ready</h4>
                    <p className="text-slate-600">Built-in checks and documentation tracking</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">Traditional SOA</span>
                    <span className="font-bold text-slate-800">12-15 hours</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-red-500 h-3 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">With AI Paraplanner</span>
                    <span className="font-bold text-green-600">4-6 hours</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-green-600 font-semibold text-lg">
                    <TrendingUp className="w-5 h-5" />
                    60% time reduction
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-['Fraunces'] font-bold text-white mb-4">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join leading Australian financial advisers using AI Paraplanner
          </p>
          <Button 
            size="lg" 
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 text-lg px-8 py-6"
            onClick={() => base44.auth.redirectToLogin()}
          >
            Start Your Free Trial
          </Button>
          <p className="text-sm text-slate-400 mt-4">No credit card required • 14-day trial</p>
        </div>
      </section>
    </PublicLayout>
  );
}