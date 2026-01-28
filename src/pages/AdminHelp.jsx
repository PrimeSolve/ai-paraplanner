import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HelpCircle, Mail, ExternalLink, BookOpen, MessageSquare } from 'lucide-react';

export default function AdminHelp() {
  return (
    <AdminLayout currentPage="AdminHelp">
      <div className="min-h-screen bg-[#f8fafc] p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#8b5cf6]/10 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-[#8b5cf6]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#0f172a]">Admin Support Center</h1>
                <p className="text-[#64748b] mt-1">Find answers and get support for managing your AI Paraplanner system</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">System Administration Guide</h3>
              <p className="text-sm text-[#64748b] mb-4">Learn how to manage users, teams, and system settings</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                Read Guide <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">Team Management</h3>
              <p className="text-sm text-[#64748b] mb-4">Manage advisers, clients, and advice groups</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                Learn More <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">SOA Queue Management</h3>
              <p className="text-sm text-[#64748b] mb-4">Manage and monitor Statement of Advice requests</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                View Docs <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:border-[#3b82f6] transition-colors cursor-pointer">
              <BookOpen className="w-6 h-6 text-[#3b82f6] mb-3" />
              <h3 className="font-semibold text-[#0f172a] mb-2">Settings & Configuration</h3>
              <p className="text-sm text-[#64748b] mb-4">Configure system defaults and preferences</p>
              <Button variant="ghost" className="text-[#3b82f6]">
                View Guide <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Need Additional Help?</h2>
            <p className="text-blue-100 mb-6">Our support team is here to help. Get in touch with us for technical assistance and system inquiries.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Email Support</div>
                  <div className="text-sm text-blue-100">admin@aiparaplanner.com</div>
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
                  <div className="text-sm text-blue-100">View FAQ and articles</div>
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
                <p className="text-[#64748b] mt-4">Go to Settings → Team and click "Add Member". You can invite users by email and assign them specific roles.</p>
              </details>

              <details className="border border-[#e2e8f0] rounded-lg p-4 cursor-pointer group">
                <summary className="font-semibold text-[#0f172a] flex justify-between items-center">
                  How can I manage advice groups?
                  <span className="text-[#64748b] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#64748b] mt-4">Navigate to Management → Advice Groups to view, edit, and manage all advice groups in the system.</p>
              </details>

              <details className="border border-[#e2e8f0] rounded-lg p-4 cursor-pointer group">
                <summary className="font-semibold text-[#0f172a] flex justify-between items-center">
                  How do I reset user passwords?
                  <span className="text-[#64748b] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#64748b] mt-4">Users can reset their own passwords through the "My Profile" page using the "Change Password" option.</p>
              </details>

              <details className="border border-[#e2e8f0] rounded-lg p-4 cursor-pointer group">
                <summary className="font-semibold text-[#0f172a] flex justify-between items-center">
                  What is the SOA Queue?
                  <span className="text-[#64748b] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#64748b] mt-4">The SOA Queue displays all pending Statement of Advice requests. You can monitor progress, filter by status, and reassign as needed.</p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}