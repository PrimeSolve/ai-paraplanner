import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  const getCompletionForSection = (sectionId) => {
    // TODO: Implement completion tracking
    return 0;
  };

  const overallCompletion = soaRequest?.completion_percentage || 0;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-80 bg-gray-800 text-gray-200 flex flex-col border-r border-gray-900 fixed left-0 top-0 bottom-0 z-50">
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #374151',
          height: '64px',
          flexShrink: 0,
          gap: '12px',
        }}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="text-sm font-extrabold text-slate-50">SOA Request</div>
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
                      "flex flex-col px-3 py-2 rounded-lg mb-2 transition-all group",
                      isActive 
                        ? "bg-gray-700 text-white" 
                        : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-0.5">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="font-semibold text-xs">{section.label}</span>
                      {completion > 0 && (
                        <span className="text-xs text-slate-400 font-semibold ml-auto">{completion}%</span>
                      )}
                    </div>
                    {section.description && (
                      <p className="text-xs text-gray-400 leading-relaxed ml-7">{section.description}</p>
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
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>←</span> Save & Close
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden ml-80 pt-16">
        {children}
      </div>
    </div>
  );
}