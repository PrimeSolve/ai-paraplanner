import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, Mail, ExternalLink, BookOpen, MessageSquare } from 'lucide-react';

export default function AdviserHelp() {
  return (
      <div className="bg-[#f8fafc] p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#8b5cf6]/10 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-[#8b5cf6]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#0f172a]">Adviser Support Center</h1>
                <p className="text-[#64748b] mt-1">Help and resources for managing your clients and SOAs</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">Client Management</h3>
              <p className="text-sm text-[#64748b] mb-4">Learn how to manage your client portfolio</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                Read Guide <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">Fact Find Process</h3>
              <p className="text-sm text-[#64748b] mb-4">Guide to completing client fact finds</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                Learn More <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">Creating SOAs</h3>
              <p className="text-sm text-[#64748b] mb-4">Step-by-step guide to generating Statements of Advice</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                View Guide <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">Portfolio & Risk Management</h3>
              <p className="text-sm text-[#64748b] mb-4">Understand risk profiles and model portfolios</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                Learn More <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Questions? We're Here to Help</h2>
            <p className="text-blue-100 mb-6">Get quick answers and support for your advisory practice.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Email Support</div>
                  <div className="text-sm text-blue-100">advisers@aiparaplanner.com</div>
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
                  <div className="font-semibold mb-1">Knowledge Base</div>
                  <div className="text-sm text-blue-100">Search articles and FAQs</div>
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
                  How do I add a new client?
                  <span className="text-[#64748b] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#64748b] mt-4">Click "Add Client" from the Clients page. Enter their details and they'll appear in your client list.</p>
              </details>

              <details className="border border-[#e2e8f0] rounded-lg p-4 cursor-pointer group">
                <summary className="font-semibold text-[#0f172a] flex justify-between items-center">
                  What is the Fact Find process?
                  <span className="text-[#64748b] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#64748b] mt-4">The Fact Find gathers comprehensive client information through a structured questionnaire. Clients can complete it online or you can assist them.</p>
              </details>

              <details className="border border-[#e2e8f0] rounded-lg p-4 cursor-pointer group">
                <summary className="font-semibold text-[#0f172a] flex justify-between items-center">
                  How do I create an SOA?
                  <span className="text-[#64748b] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#64748b] mt-4">After completing a client's Fact Find, go to SOA Requests and create a new SOA. Follow the guided steps to generate the document.</p>
              </details>

              <details className="border border-[#e2e8f0] rounded-lg p-4 cursor-pointer group">
                <summary className="font-semibold text-[#0f172a] flex justify-between items-center">
                  How are clients assigned risk profiles?
                  <span className="text-[#64748b] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#64748b] mt-4">Risk profiles are assigned based on the client's risk tolerance questionnaire results. These determine portfolio allocation recommendations.</p>
              </details>
            </div>
          </div>
        </div>
      </div>
  );
}