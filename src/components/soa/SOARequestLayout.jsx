import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { cn } from '@/lib/utils';
import {
  Upload, Home, FileText, TrendingUp, Shield, PieChart,
  DollarSign, Building2, CheckCircle2, MessageSquare
} from 'lucide-react';

const sectionGroups = [
  {
    title: 'GETTING STARTED',
    sections: [
      { id: 'welcome', label: 'Welcome', path: 'SOARequestWelcome', icon: Home },
      { id: 'prefill', label: 'Prefill (upload documents)', path: 'SOARequestPrefill', icon: Upload }
    ]
  },
  {
    title: 'ADVICE CONTENT',
    sections: [
      { id: 'scope', label: '1. Scope of Advice', path: 'SOARequestScope', icon: FileText },
      { id: 'details', label: '2. SOA Details', path: 'SOARequestDetails', icon: FileText },
      { id: 'transactions', label: '3. Transactions', path: 'SOARequestTransactions', icon: TrendingUp },
      { id: 'products', label: '4. Products & Entities', path: 'SOARequestProducts', icon: Building2 }
    ]
  },
  {
    title: 'CALCULATIONS',
    sections: [
      { id: 'insurance', label: '5. Insurance', path: 'SOARequestInsurance', icon: Shield },
      { id: 'portfolio', label: '6. Portfolio', path: 'SOARequestPortfolio', icon: PieChart },
      { id: 'cashflow', label: '7. Cashflow Models', path: 'SOARequestCashflow', icon: DollarSign },
      { id: 'assumptions', label: '8. Assumptions', path: 'SOARequestAssumptions', icon: FileText }
    ]
  },
  {
    title: 'FINAL STEP',
    sections: [
      { id: 'review', label: 'Review & Submit', path: 'SOARequestReview', icon: CheckCircle2 }
    ]
  }
];

export default function SOARequestLayout({ children, currentSection, soaRequest }) {
  const [existingPosition, setExistingPosition] = useState(false);

  const getCompletionForSection = (sectionId) => {
    // TODO: Implement completion tracking
    return 0;
  };

  const overallCompletion = soaRequest?.completion_percentage || 0;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-80 bg-gray-800 text-gray-200 flex flex-col border-r border-gray-900">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-700">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-indigo-600 flex flex-col justify-center px-2 py-1.5 gap-1 shadow-lg">
            <div className="h-0.5 rounded-full bg-blue-100 opacity-95" style={{width: '70%'}}></div>
            <div className="h-0.5 rounded-full bg-blue-100 opacity-95" style={{width: '55%'}}></div>
            <div className="h-0.5 rounded-full bg-blue-100 opacity-95" style={{width: '80%'}}></div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-lg font-extrabold text-slate-50">SOA Request</div>
            {soaRequest?.client_name && (
              <div className="text-xs text-slate-400">
                Client: {soaRequest.client_name}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {sectionGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 ml-2">
                {group.title}
              </div>
              {group.sections.map((section) => {
                const completion = getCompletionForSection(section.id);
                const isActive = currentSection === section.id;
                const Icon = section.icon;

                return (
                  <Link
                    key={section.id}
                    to={createPageUrl(section.path) + (soaRequest?.id ? `?id=${soaRequest.id}` : '')}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all text-sm group",
                      isActive 
                        ? "bg-gray-700 text-white font-medium" 
                        : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-5 h-5" />
                      <span>{section.label}</span>
                    </div>
                    {completion > 0 && (
                      <span className="text-xs text-slate-400 font-semibold">{completion}%</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Existing Position Toggle */}
        <div className="px-4 py-4 border-t border-gray-700 mt-auto">
          <button
            onClick={() => setExistingPosition(!existingPosition)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all",
              existingPosition ? "bg-blue-600/20" : "bg-white/5 hover:bg-white/10"
            )}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center text-blue-700 text-sm">
                📊
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <div className="text-xs font-bold text-gray-200">Existing Position</div>
                <div className="text-xs text-gray-500">View cashflow model</div>
              </div>
            </div>
            <div className="relative w-11 h-6">
              <div className={cn(
                "absolute inset-0 rounded-full transition-colors",
                existingPosition ? "bg-blue-600" : "bg-gray-600"
              )}></div>
              <div className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                existingPosition ? "left-5" : "left-0.5"
              )}></div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}