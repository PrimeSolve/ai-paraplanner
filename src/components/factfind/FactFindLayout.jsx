import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { cn } from '@/lib/utils';
import { LayoutDashboard } from 'lucide-react';

const sectionGroups = [
  {
    title: 'GETTING STARTED',
    sections: [
      { id: 'welcome', label: 'Welcome', path: 'FactFindWelcome' },
      { id: 'prefill', label: 'Pre-fill (upload documents)', path: 'FactFindPrefill' }
    ]
  },
  {
    title: 'PERSONAL',
    sections: [
      { id: 'personal', label: '1. Personal', path: 'FactFindPersonal' },
      { id: 'dependants', label: '2. Dependants', path: 'FactFindDependants' }
    ]
  },
  {
    title: 'OTHER ENTITIES',
    sections: [
      { id: 'trusts', label: '3. Trusts & Companies', path: 'FactFindTrusts' },
      { id: 'smsf', label: '4. SMSF', path: 'FactFindSMSF' }
    ]
  },
  {
    title: 'FINANCIAL PRODUCTS',
    sections: [
      { id: 'superannuation', label: '5. Superannuation', path: 'FactFindSuperannuation' },
      { id: 'investment', label: '6. Investment', path: 'FactFindInvestment' }
    ]
  },
  {
    title: 'NET WORTH POSITION',
    sections: [
      { id: 'assets_liabilities', label: '7. Assets & Liabilities', path: 'FactFindAssetsLiabilities' }
    ]
  },
  {
    title: 'CASHFLOW',
    sections: [
      { id: 'income_expenses', label: '8. Income & Expenses', path: 'FactFindIncomeExpenses' }
    ]
  },
  {
    title: 'INSURANCE',
    sections: [
      { id: 'insurance', label: '9. Insurance policies', path: 'FactFindInsurance' }
    ]
  },
  {
    title: 'PLANNING',
    sections: [
      { id: 'super_tax', label: '10. Super & Tax', path: 'FactFindSuperTax' },
      { id: 'advice_reason', label: '11. Reason for seeking advice', path: 'FactFindAdviceReason' },
      { id: 'risk_profile', label: '12. Risk profile', path: 'FactFindRiskProfile' }
    ]
  },
  {
    title: 'FINAL STEP',
    sections: [
      { id: 'review', label: 'Review & Submit', path: 'FactFindReview' }
    ]
  }
];

export default function FactFindLayout({ children, currentSection, factFind }) {
  const [showDashboard, setShowDashboard] = useState(false);

  const getCompletionForSection = (sectionId) => {
    if (!factFind) return 0;
    const completed = factFind.sections_completed || [];
    return completed.includes(sectionId) ? 100 : 0;
  };

  const overallCompletion = factFind?.completion_percentage || 0;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-80 bg-slate-800 text-slate-200 flex flex-col border-r border-slate-900">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-indigo-600 flex flex-col justify-center px-2 py-1.5 gap-1 shadow-lg">
            <div className="h-0.5 rounded-full bg-blue-100 opacity-95" style={{width: '70%'}}></div>
            <div className="h-0.5 rounded-full bg-blue-100 opacity-95" style={{width: '55%'}}></div>
            <div className="h-0.5 rounded-full bg-blue-100 opacity-95" style={{width: '80%'}}></div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-lg font-extrabold text-slate-50">Fact Find</div>
            {factFind?.personal?.first_name && (
              <div className="text-xs text-slate-400">
                Client: {factFind.personal.first_name} {factFind.personal.last_name}
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
                
                return (
                  <Link
                    key={section.id}
                    to={createPageUrl(section.path) + (factFind?.id ? `?id=${factFind.id}` : '')}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all text-sm",
                      isActive 
                        ? "bg-slate-700 text-white font-medium" 
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    )}
                  >
                    <span>{section.label}</span>
                    {completion > 0 && (
                      <span className="text-xs text-slate-400 font-semibold">{completion}%</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Dashboard Toggle */}
        <div className="px-4 py-3 border-t border-slate-700 mt-auto">
          <Link
            to={createPageUrl('Home')}
            className="w-full flex items-center justify-between px-3 py-3 hover:bg-slate-700/30 rounded-lg transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <LayoutDashboard className="w-4 h-4 text-slate-700" />
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <div className="text-sm font-semibold text-white">Dashboard view</div>
                <div className="text-xs text-slate-400">View progress summary</div>
              </div>
            </div>
            <div className="w-5 h-5 rounded-full bg-white flex-shrink-0"></div>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}