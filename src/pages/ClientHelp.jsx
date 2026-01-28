import React from 'react';
import ClientLayout from '../components/client/ClientLayout';
import { Button } from '@/components/ui/button';
import { HelpCircle, Mail, ExternalLink, BookOpen, MessageSquare } from 'lucide-react';

export default function ClientHelp() {
  return (
    <ClientLayout currentPage="ClientHelp">
      <div className="min-h-screen bg-[#f8fafc] p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#8b5cf6]/10 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-[#8b5cf6]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#0f172a]">Client Support Center</h1>
                <p className="text-[#64748b] mt-1">Help and resources for your financial planning journey</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">Getting Started</h3>
              <p className="text-sm text-[#64748b] mb-4">Learn how to use your client portal</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                Read Guide <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">Completing Your Fact Find</h3>
              <p className="text-sm text-[#64748b] mb-4">Step-by-step guide to the fact find process</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                Learn More <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">Understanding Your SOA</h3>
              <p className="text-sm text-[#64748b] mb-4">Learn to interpret your Statement of Advice</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                View Guide <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">Document Center</h3>
              <p className="text-sm text-[#64748b] mb-4">Access and download your financial documents</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                Browse <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
            <p className="text-blue-100 mb-6">Our support team is available to assist you with any questions about your account or documents.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Email Support</div>
                  <div className="text-sm text-blue-100">clients@aiparaplanner.com</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Live Chat</div>
                  <div className="text-sm text-blue-100">Available 9am-5pm AEST</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Help Center</div>
                  <div className="text-sm text-blue-100">Browse FAQs and articles</div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <h3 className="text-lg font-semibold text-[#0f172a] mb-6">Frequently Asked Questions</h3>
            
            <div className="space-y-4">
              <details className="border border-[#e2e8f0] rounded-lg p-4 cursor-pointer group">
                <summary className="font-semibold text-[#0f172a] flex justify-between items-center">
                  What is the Fact Find?
                  <span className="text-[#64748b] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#64748b] mt-4">The Fact Find is a questionnaire that helps your adviser understand your financial situation, goals, and risk tolerance.</p>
              </details>

              <details className="border border-[#e2e8f0] rounded-lg p-4 cursor-pointer group">
                <summary className="font-semibold text-[#0f172a] flex justify-between items-center">
                  How long does the fact find take?
                  <span className="text-[#64748b] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#64748b] mt-4">Most clients complete the Fact Find in 30-45 minutes. You can save your progress and return later if needed.</p>
              </details>

              <details className="border border-[#e2e8f0] rounded-lg p-4 cursor-pointer group">
                <summary className="font-semibold text-[#0f172a] flex justify-between items-center">
                  What is a Statement of Advice (SOA)?
                  <span className="text-[#64748b] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#64748b] mt-4">Your SOA is a comprehensive document outlining your adviser's recommendations tailored to your financial situation and goals.</p>
              </details>

              <details className="border border-[#e2e8f0] rounded-lg p-4 cursor-pointer group">
                <summary className="font-semibold text-[#0f172a] flex justify-between items-center">
                  When will my documents be ready?
                  <span className="text-[#64748b] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#64748b] mt-4">After completing your Fact Find, your adviser will prepare your SOA. You'll receive a notification when it's ready for download.</p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}