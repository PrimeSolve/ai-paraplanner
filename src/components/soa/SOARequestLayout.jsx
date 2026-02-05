import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { cn } from '@/lib/utils';
import { useRole } from '../RoleContext';
import {
  Upload, Home, FileText, TrendingUp, Shield, PieChart,
  DollarSign, Building2, CheckCircle2, MessageSquare
} from 'lucide-react';

const sectionGroups = [
  {
    title: 'GETTING STARTED',
    sections: [
      { 
         id: 'welcome', 
         label: 'Welcome', 
         description: 'Learn how to build and submit your SOA request',
         path: 'SOARequestWelcome', 
         icon: MessageSquare 
       },
      { 
        id: 'prefill', 
        label: 'Prefill', 
        description: 'Upload documents such as file notes, insurance quotes, cashflow modelling to build the form faster',
        path: 'SOARequestPrefill', 
        icon: Upload 
      }
    ]
  },
  {
    title: 'REQUEST DETAILS',
    sections: [
      { 
        id: 'scope', 
        label: 'Scope of advice', 
        description: "Define what's in and out of scope",
        path: 'SOARequestScope', 
        icon: FileText 
      },
      { 
        id: 'products', 
        label: 'Products & entities', 
        description: 'Add the new products or entities you are recommending',
        path: 'SOARequestProducts', 
        icon: Building2 
      },
      { 
        id: 'insurance', 
        label: 'Insurance', 
        description: 'Use the calculators to build insurance needs and define recommendations',
        path: 'SOARequestInsurance', 
        icon: Shield 
      },
      { 
        id: 'transactions', 
        label: 'Transactions', 
        description: 'Specify assets you want to buy or sell or any new debts required to support',
        path: 'SOARequestTransactions', 
        icon: TrendingUp 
      },
      { 
        id: 'portfolio', 
        label: 'Portfolio', 
        description: 'Build portfolios for each product',
        path: 'SOARequestPortfolio', 
        icon: PieChart 
      },
      { 
        id: 'strategy', 
        label: 'Strategy', 
        description: 'Optional section models to compare cashflow scenarios, as well as add strategy recommendations to your product strategy',
        path: 'SOARequestStrategy', 
        icon: TrendingUp 
      },
      { 
        id: 'assumptions', 
        label: 'Assumptions', 
        description: 'Define values, choices, longevity',
        path: 'SOARequestAssumptions', 
        icon: FileText 
      },
      { 
        id: 'details', 
        label: 'SOA details', 
        description: 'Define SOA requirements',
        path: 'SOARequestDetails', 
        icon: FileText 
      }
    ]
  },
  {
    title: 'FINAL STEP',
    sections: [
      { 
        id: 'review', 
        label: 'Review and submit', 
        description: 'Final review and send to paraplanner',
        path: 'SOARequestReview', 
        icon: CheckCircle2 
      }
    ]
  }
];

export default function SOARequestLayout({ children, currentSection, soaRequest }) {
  const navigate = useNavigate();
  const { navigationChain } = useRole();

  const getCompletionForSection = (sectionId) => {
    // TODO: Implement completion tracking
    return 0;
  };

  const overallCompletion = soaRequest?.completion_percentage || 0;

  return (
    <div className="flex bg-slate-50 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Sidebar Navigation */}
      <div className="bg-slate-800 text-slate-200 flex flex-col border-r border-slate-900 z-40" style={{ position: 'fixed', left: 0, top: '64px', bottom: 0, width: '320px' }}>
        {/* Brand */}
        <Link to={createPageUrl('Home')}>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700 flex-shrink-0 cursor-pointer hover:bg-slate-700/50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-indigo-600 flex flex-col justify-center px-2 py-1.5 gap-1 shadow-lg">
              <div className="h-0.5 rounded-full bg-blue-100 opacity-95" style={{width: '70%'}}></div>
              <div className="h-0.5 rounded-full bg-blue-100 opacity-95" style={{width: '55%'}}></div>
              <div className="h-0.5 rounded-full bg-blue-100 opacity-95" style={{width: '80%'}}></div>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="text-lg font-extrabold text-slate-50">SOA Request</div>
              <div className="text-xs text-slate-400">
                Client: {navigationChain?.find(n => n.type === 'client')?.name || 'Unknown Client'}
              </div>
            </div>
          </div>
        </Link>

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
                    title={section.description}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg mb-2 transition-all group",
                      isActive 
                        ? "bg-gray-700 text-white" 
                        : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-semibold text-xs">{section.label}</span>
                    {completion > 0 && (
                      <span className="text-xs text-slate-400 font-semibold ml-auto">{completion}%</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Save & Close Button */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: 'auto'
        }}>
          <button
            onClick={() => navigate(createPageUrl('AdviserSOARequests'))}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #0F4C5C 0%, #1A6B7C 100%)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(15, 76, 92, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 76, 92, 0.5)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 76, 92, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Save & Close
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden ml-80 pt-4">
        {children}
      </div>
    </div>
  );
}