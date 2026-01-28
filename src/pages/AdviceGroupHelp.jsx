import React from 'react';
import AdviceGroupLayout from '../components/advicegroup/AdviceGroupLayout';
import { Button } from '@/components/ui/button';
import { HelpCircle, Mail, ExternalLink, BookOpen, MessageSquare } from 'lucide-react';

export default function AdviceGroupHelp() {
  return (
    <AdviceGroupLayout currentPage="AdviceGroupHelp">
      <div className="min-h-screen bg-[#f8fafc] p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#8b5cf6]/10 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-[#8b5cf6]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#0f172a]">Advice Group Support</h1>
                <p className="text-[#64748b] mt-1">Support resources for managing your advice group and team</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">Managing Your Group</h3>
              <p className="text-sm text-[#64748b] mb-4">Learn to manage team members, clients, and group settings</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                Read Guide <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">Client Management</h3>
              <p className="text-sm text-[#64748b] mb-4">Add, manage, and track client information</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                Learn More <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">SOA Management</h3>
              <p className="text-sm text-[#64748b] mb-4">Manage Statement of Advice requests and templates</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                View Docs <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">Risk Profiles & Portfolios</h3>
              <p className="text-sm text-[#64748b] mb-4">Create and manage investment portfolios</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                Learn More <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Need Assistance?</h2>
            <p className="text-blue-100 mb-6">Our support team is ready to help with any questions about managing your advice group.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Email Support</div>
                  <div className="text-sm text-blue-100">support@aiparaplanner.com</div>
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
                  <div className="text-sm text-blue-100">Browse articles and FAQs</div>
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
                  How do I add new team members?
                  <span className="text-[#64748b] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#64748b] mt-4">Go to Team section and click "Add Adviser" to invite team members to your group.</p>
              </details>

              <details className="border border-[#e2e8f0] rounded-lg p-4 cursor-pointer group">
                <summary className="font-semibold text-[#0f172a] flex justify-between items-center">
                  How do I register new clients?
                  <span className="text-[#64748b] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#64748b] mt-4">Navigate to Clients section and click "Add Client" to register new client information.</p>
              </details>

              <details className="border border-[#e2e8f0] rounded-lg p-4 cursor-pointer group">
                <summary className="font-semibold text-[#0f172a] flex justify-between items-center">
                  How do I customize SOA templates?
                  <span className="text-[#64748b] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#64748b] mt-4">Go to SOA Template section to customize templates for your group and advisers.</p>
              </details>

              <details className="border border-[#e2e8f0] rounded-lg p-4 cursor-pointer group">
                <summary className="font-semibold text-[#0f172a] flex justify-between items-center">
                  How do I set up risk profiles?
                  <span className="text-[#64748b] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#64748b] mt-4">Navigate to Risk Profiles to create investment profiles based on client risk tolerance.</p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </AdviceGroupLayout>
  );
}