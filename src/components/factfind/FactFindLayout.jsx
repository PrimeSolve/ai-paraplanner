import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import { useRole } from '../RoleContext';
import { useCompletionLogic } from './useCompletionLogic';
import { useSectionState } from './useSectionState';
import { useVoiceSession } from './useVoiceSession';

const sectionGroups = [
  {
    title: 'OVERVIEW',
    sections: [
      { id: 'dashboard', label: 'Dashboard', path: 'FactFindDashboard', icon: LayoutDashboard }
    ]
  },
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
  const navigate = useNavigate();
  const { navigationChain } = useRole();
  const [showDashboard, setShowDashboard] = useState(false);
  const { calculateAllSectionCompletion, getDisplayState } = useCompletionLogic();
  const { SECTIONS } = useSectionState();
  const [activeTabId, setActiveTabId] = useState(currentSection || 'dashboard');

  // Create a placeholder updateSection function (voice updates will be handled by individual pages)
  const updateSection = (sectionKey, data) => {
    console.log('[FactFindLayout] Voice update:', sectionKey, data);
    // Individual pages will handle their own updates via their useFactFind hook
  };

  // Voice session hook
  const { status, writeCount, startVoice, stopVoice } = useVoiceSession({
    factFind,
    updateSection,
    activeTabId,
    clientId: factFind?.id || 'default'
  });

  console.log('[DEBUG] startVoice function exists:', typeof startVoice);

  // Update active tab when section changes
  useEffect(() => {
    if (currentSection) {
      setActiveTabId(currentSection);
    }
  }, [currentSection]);

  // Check if LiveKit SDK is available
  useEffect(() => {
    console.log('[Voice] FactFindLayout mounted - LivekitClient available:', typeof window.LivekitClient);
  }, []);

  const handleNavClick = async (e, targetPath) => {
    e.preventDefault();
    
    console.log('=== NAV START ===');
    
    // Wait for save to complete
    const savePromise = new Promise((resolve) => {
      const handler = () => {
        window.removeEventListener('factfind-save-complete', handler);
        console.log('=== SAVE COMPLETE RECEIVED ===');
        resolve();
      };
      window.addEventListener('factfind-save-complete', handler);
      
      // Dispatch the save event
      window.dispatchEvent(new Event('factfind-save-before-nav'));
      
      // Safety timeout — navigate anyway after 2 seconds if save hangs
      setTimeout(() => {
        window.removeEventListener('factfind-save-complete', handler);
        console.log('=== SAVE TIMEOUT — NAVIGATING ANYWAY ===');
        resolve();
      }, 2000);
    });
    
    await savePromise;
    
    // NOW navigate
    console.log('=== NAVIGATING TO:', targetPath, '===');
    navigate(targetPath);
  };

  const displayState = useMemo(() => {
    if (!factFind) return {};
    return getDisplayState(factFind);
  }, [factFind, getDisplayState]);

  const getCompletionForSection = (sectionId) => {
    const sectionKey = sectionId === 'personal' ? 'personal'
      : sectionId === 'dependants' ? 'dependants'
        : sectionId === 'trusts' ? 'trusts_companies'
          : sectionId === 'smsf' ? 'smsf'
            : sectionId === 'superannuation' ? 'superannuation'
              : sectionId === 'investment' ? 'investments'
                : sectionId === 'assets_liabilities' ? 'assets_liabilities'
                  : sectionId === 'income_expenses' ? 'income_expenses'
                    : sectionId === 'insurance' ? 'insurance'
                      : sectionId === 'super_tax' ? 'super_tax'
                        : sectionId === 'advice_reason' ? 'advice_reason'
                          : sectionId === 'risk_profile' ? 'risk_profile'
                            : null;
    
    if (!sectionKey || !displayState[sectionKey]) return 0;
    return displayState[sectionKey].percentage;
  };

  const getCompletionDisplay = (sectionId) => {
    const sectionKey = sectionId === 'personal' ? 'personal'
      : sectionId === 'dependants' ? 'dependants'
        : sectionId === 'trusts' ? 'trusts_companies'
          : sectionId === 'smsf' ? 'smsf'
            : sectionId === 'superannuation' ? 'superannuation'
              : sectionId === 'investment' ? 'investments'
                : sectionId === 'assets_liabilities' ? 'assets_liabilities'
                  : sectionId === 'income_expenses' ? 'income_expenses'
                    : sectionId === 'insurance' ? 'insurance'
                      : sectionId === 'super_tax' ? 'super_tax'
                        : sectionId === 'advice_reason' ? 'advice_reason'
                          : sectionId === 'risk_profile' ? 'risk_profile'
                            : null;
    
    if (!sectionKey || !displayState[sectionKey]) return { value: '0%', color: '#9ca3af' };
    const state = displayState[sectionKey];
    return { value: state.displayValue, color: state.color };
  };

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
              <div className="text-lg font-extrabold text-slate-50">Fact Find</div>
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
                       to={createPageUrl(section.path) + (factFind?.id ? `?id=${factFind.id}` : '')}
                       onClick={(e) => handleNavClick(e, createPageUrl(section.path) + (factFind?.id ? `?id=${factFind.id}` : ''))}
                       className={cn(
                         "flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all text-sm",
                         isActive 
                           ? "bg-slate-700 text-white font-medium" 
                           : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                       )}
                     >
                       <span className="flex items-center gap-2">
                         {Icon && <Icon className="w-4 h-4" />}
                         {section.label}
                       </span>
                       <span 
                         className="text-xs font-semibold"
                         style={{ color: getCompletionDisplay(section.id).color }}
                       >
                         {getCompletionDisplay(section.id).value}
                       </span>
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
             onClick={() => navigate(createPageUrl('ClientDashboard'))}
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
        {/* Voice Control Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: status === 'connected' ? '#f0fdf4' : '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          borderRadius: '8px',
          margin: '0 24px 16px 24px',
        }}>
          <button 
            onClick={async () => {
              console.log('[TEST] Button clicked');
              try {
                const res = await fetch('https://solver-cors-proxy.tim-hall.workers.dev/livekit/start', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ClientId: 'test-001' }),
                });
                const data = await res.json();
                console.log('[TEST] Response:', data);
                alert('Room created: ' + data.room_name);
              } catch (err) {
                console.log('[TEST] Error:', err);
                alert('Error: ' + err.message);
              }
            }}
            style={{ background: 'red', color: 'white', padding: '10px 20px', fontSize: '16px', margin: '10px' }}
          >
            TEST CONNECTION
          </button>
          
          {status === 'idle' || status === 'error' || status === 'disconnected' ? (
            <button
              onClick={() => { 
                console.log('[DEBUG] Button clicked'); 
                startVoice(); 
              }}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🎙 Start Voice Session
            </button>
          ) : status === 'connecting' ? (
            <span style={{ color: '#f59e0b', fontWeight: 500 }}>Connecting...</span>
          ) : (
            <>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#16a34a',
                fontWeight: 500,
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#16a34a',
                  display: 'inline-block',
                }} />
                Voice Active — {writeCount} fields written
              </span>
              <button
                onClick={stopVoice}
                style={{
                  padding: '6px 12px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                }}
              >
                End Session
              </button>
            </>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}