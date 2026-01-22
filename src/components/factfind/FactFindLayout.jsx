import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { cn } from '@/lib/utils';
import { 
  Home, User, Users, DollarSign, Building2, CreditCard, 
  TrendingUp, Target, Shield, FileText, Upload, CheckCircle2, 
  LayoutDashboard, RefreshCw, Info
} from 'lucide-react';

const sections = [
  { id: 'welcome', label: 'Welcome', icon: Home, path: 'FactFindWelcome' },
  { id: 'about_you', label: 'About You', icon: User, path: 'FactFindAboutYou' },
  { id: 'household', label: 'Your Household', icon: Users, path: 'FactFindHousehold' },
  { id: 'income', label: 'Your Income', icon: DollarSign, path: 'FactFindIncome' },
  { id: 'property', label: 'Your Property', icon: Building2, path: 'FactFindProperty' },
  { id: 'debts', label: 'Your Debts & Expenses', icon: CreditCard, path: 'FactFindDebts' },
  { id: 'assets', label: 'Your Assets & Investments', icon: TrendingUp, path: 'FactFindAssets' },
  { id: 'goals', label: 'Your Goals & Objectives', icon: Target, path: 'FactFindGoals' },
  { id: 'protection', label: 'Protection', icon: Shield, path: 'FactFindProtection' },
  { id: 'adviser', label: 'Adviser Notes', icon: FileText, path: 'FactFindAdviser' },
  { id: 'documents', label: 'Supporting Documents', icon: Upload, path: 'FactFindDocuments' },
  { id: 'review', label: 'Review & Submit', icon: CheckCircle2, path: 'FactFindReview' }
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
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 ml-2">
            Sections
          </div>
          {sections.map((section) => {
            const Icon = section.icon;
            const completion = getCompletionForSection(section.id);
            const isActive = currentSection === section.id;
            
            return (
              <Link
                key={section.id}
                to={createPageUrl(section.path) + (factFind?.id ? `?id=${factFind.id}` : '')}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all text-sm",
                  isActive 
                    ? "bg-slate-700 text-white" 
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{section.label}</span>
                </div>
                {completion > 0 && (
                  <span className="text-xs text-slate-400">{completion}%</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Dashboard Toggle */}
        <div className="px-4 py-3 border-t border-slate-700 mt-auto">
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                <LayoutDashboard className="w-3.5 h-3.5 text-blue-700" />
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <div className="text-xs font-bold text-slate-200">Progress</div>
                <div className="text-xs text-slate-400">{overallCompletion}% Complete</div>
              </div>
            </div>
            <div className="relative w-11 h-6 bg-slate-600 rounded-full">
              <div className={cn(
                "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform",
                showDashboard ? "left-5" : "left-0.5"
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