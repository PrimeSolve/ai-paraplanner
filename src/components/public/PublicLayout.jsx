import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200 sticky top-0 z-50 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('PublicHome')} className="flex items-center gap-2 no-underline">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-600 rounded-lg flex items-center justify-center">
                <span className="text-amber-400 font-bold text-xl">AI</span>
              </div>
              <span className="text-xl font-['Fraunces'] font-semibold text-slate-800">AI Paraplanner</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to={createPageUrl('PublicAbout')} className="text-slate-600 hover:text-slate-800 no-underline font-medium">
                About
              </Link>
              <Link to={createPageUrl('PublicPricing')} className="text-slate-600 hover:text-slate-800 no-underline font-medium">
                Pricing
              </Link>
              <Link to={createPageUrl('PublicContact')} className="text-slate-600 hover:text-slate-800 no-underline font-medium">
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => base44.auth.redirectToLogin()}>
                Sign In
              </Button>
              <Button className="bg-slate-800 hover:bg-slate-700" onClick={() => base44.auth.redirectToLogin()}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-slate-600 rounded-lg flex items-center justify-center">
                  <span className="text-amber-400 font-bold">AI</span>
                </div>
                <span className="font-['Fraunces'] font-semibold text-slate-800">AI Paraplanner</span>
              </div>
              <p className="text-sm text-slate-600">
                Streamline your financial advice workflow with AI-powered tools
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Product</h4>
              <div className="space-y-2">
                <Link to={createPageUrl('PublicPricing')} className="block text-sm text-slate-600 hover:text-slate-800 no-underline">
                  Pricing
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Company</h4>
              <div className="space-y-2">
                <Link to={createPageUrl('PublicAbout')} className="block text-sm text-slate-600 hover:text-slate-800 no-underline">
                  About
                </Link>
                <Link to={createPageUrl('PublicContact')} className="block text-sm text-slate-600 hover:text-slate-800 no-underline">
                  Contact
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-slate-600 hover:text-slate-800 no-underline">Privacy</a>
                <a href="#" className="block text-sm text-slate-600 hover:text-slate-800 no-underline">Terms</a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 text-center text-sm text-slate-600">
            © 2026 AI Paraplanner. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}