import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import { CheckCircle2, AlertCircle, MinusCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

// ==========================================================================
// SECTION CONFIGURATION
// ==========================================================================
const SECTIONS = [
  {
    key: 'scope',
    title: 'Scope of Advice',
    category: 'Request Details',
    page: 'SOARequestScope',
    stateKey: 'scope_of_advice',
    description: 'Define the scope, objectives, and areas covered by this advice.',
    checkComplete: checkScopeComplete,
    checkInScope: null
  },
  {
    key: 'products',
    title: 'Products & Entities',
    category: 'Request Details',
    page: 'SOARequestProducts',
    stateKey: 'products_entities',
    description: 'New products or entities to recommend as part of the advice.',
    checkComplete: checkProductsComplete,
    checkInScope: isProductsInScope
  },
  {
    key: 'insurance_needs',
    title: 'Insurance Needs',
    category: 'Insurance',
    page: 'SOARequestInsurance',
    stateKey: 'insurance',
    description: 'Insurance needs analysis and coverage calculations.',
    checkComplete: checkInsuranceNeedsComplete,
    checkInScope: isInsuranceNeedsInScope
  },
  {
    key: 'insurance_policies',
    title: 'Insurance Policies',
    category: 'Insurance',
    page: 'SOARequestInsurance',
    stateKey: 'insurance',
    description: 'Recommended insurance products and policy details.',
    checkComplete: checkInsurancePoliciesComplete,
    checkInScope: isInsurancePoliciesInScope
  },
  {
    key: 'transactions',
    title: 'Transactions',
    category: 'Request Details',
    page: 'SOARequestTransactions',
    stateKey: 'transactions',
    description: 'Recommended transactions, transfers, and account movements.',
    checkComplete: checkTransactionsComplete,
    checkInScope: isTransactionsInScope
  },
  {
    key: 'portfolio',
    title: 'Portfolio',
    category: 'Request Details',
    page: 'SOARequestPortfolio',
    stateKey: 'portfolio',
    description: 'Specific portfolio and investment recommendations.',
    checkComplete: checkPortfolioComplete,
    checkInScope: isPortfolioInScope
  },
  {
    key: 'strategy',
    title: 'Strategy',
    category: 'Request Details',
    page: 'SOARequestStrategy',
    stateKey: 'strategy',
    description: 'Advice models with projected recommendations and outcomes.',
    checkComplete: checkStrategyComplete,
    checkInScope: null
  },
  {
    key: 'assumptions',
    title: 'Assumptions',
    category: 'Request Details',
    page: 'SOARequestAssumptions',
    stateKey: 'assumptions',
    description: 'Risk/return assumptions and rebalancing logic.',
    checkComplete: checkAssumptionsComplete,
    checkInScope: null
  },
  {
    key: 'soa_details',
    title: 'SOA Details',
    category: 'Request Details',
    page: 'SOARequestDetails',
    stateKey: 'soa_details',
    description: 'SOA metadata, section configuration, and paraplanner notes.',
    checkComplete: checkSoaDetailsComplete,
    checkInScope: null
  }
];

// ==========================================================================
// VALIDATION FUNCTIONS
// ==========================================================================
function checkScopeComplete(soaRequest) {
  const scope = soaRequest?.scope_of_advice;
  if (!scope) return false;
  if (!scope.soa_type) return false;
  
  const checkboxKeys = [
    'insurance_needs', 'insurance_product_advice', 'insurance_business',
    'product_super', 'product_pension', 'product_wrap', 'product_bond',
    'product_annuity', 'product_sma', 'product_other',
    'cashflow_budget', 'cashflow_tax_structures', 'cashflow_estate',
    'retirement_super_contrib', 'retirement_smsf', 'retirement_lumpsum',
    'retirement_pensions', 'retirement_other',
    'assets_review_portfolio', 'assets_new_products',
    'debt_review_levels', 'debt_review_products', 'debt_repayment'
  ];
  
  return checkboxKeys.some(key => scope[key] === true);
}

function isProductsInScope(soaRequest) {
  const scope = soaRequest?.scope_of_advice;
  if (!scope) return true;
  const productKeys = ['product_super', 'product_pension', 'product_wrap', 'product_bond', 'product_annuity', 'product_sma', 'product_other'];
  return productKeys.some(key => scope[key] === true) || scope.cashflow_tax_structures === true;
}

function checkProductsComplete(soaRequest) {
  const pe = soaRequest?.products_entities;
  if (!pe) return false;
  const entities = pe.entities || [];
  const products = pe.products || [];
  if (entities.length === 0 && products.length === 0) return false;
  return entities.some(e => e.name && e.type) || products.some(p => p.description && p.product_type);
}

function isInsuranceNeedsInScope(soaRequest) {
  return soaRequest?.scope_of_advice?.insurance_needs === true;
}

function checkInsuranceNeedsComplete(soaRequest) {
  const ins = soaRequest?.insurance;
  if (!ins) return false;
  const needs = ins.needs_analysis || {};
  return Object.values(needs.client || {}).some(v => v && v !== 0) ||
    Object.values(needs.partner || {}).some(v => v && v !== 0);
}

function isInsurancePoliciesInScope(soaRequest) {
  return soaRequest?.scope_of_advice?.insurance_product_advice === true;
}

function checkInsurancePoliciesComplete(soaRequest) {
  const policies = soaRequest?.insurance?.recommended_policies || [];
  return policies.some(p => p.owner && p.type && p.premium_type);
}

function isTransactionsInScope(soaRequest) {
  const scope = soaRequest?.scope_of_advice;
  return scope?.assets_review_portfolio === true || scope?.assets_new_products === true;
}

function checkTransactionsComplete(soaRequest) {
  const txn = soaRequest?.transactions;
  if (!txn) return false;
  return (txn.buy || []).some(b => b.description && b.amount) ||
    (txn.sell || []).some(s => s.product_id) ||
    (txn.debts || []).some(d => d.description && d.amount);
}

function isPortfolioInScope(soaRequest) {
  const scope = soaRequest?.scope_of_advice;
  return scope?.assets_review_portfolio === true || scope?.assets_new_products === true;
}

function checkPortfolioComplete(soaRequest) {
  const transactions = soaRequest?.portfolio?.transactions || [];
  return transactions.some(t => t.product_id && t.type);
}

function checkStrategyComplete(soaRequest) {
  const strategy = soaRequest?.strategy;
  if (!strategy) return false;
  return (strategy.models || []).some(m => m.name) ||
    (strategy.strategies || []).some(s => s.strategy_id);
}

function checkAssumptionsComplete(soaRequest) {
  const assumptions = soaRequest?.assumptions;
  if (!assumptions) return false;
  const basic = assumptions.basic || {};
  if (basic.inflation_rate || basic.run_until_age) return true;
  return (assumptions.returns_entities || []).length > 0 ||
    (assumptions.fees || []).length > 0;
}

function checkSoaDetailsComplete(soaRequest) {
  const details = soaRequest?.soa_details;
  return !!(details?.reference_number || details?.due_date || details?.adviser_name);
}

// ==========================================================================
// MAIN COMPONENT
// ==========================================================================
export default function SOARequestReview() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [reviewStatus, setReviewStatus] = useState({ sections: {} });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      
      if (!id) {
        toast.error('No SOA Request ID provided');
        setLoading(false);
        return;
      }
      
      const requests = await base44.entities.SOARequest.filter({ id });
      if (!requests[0]) {
        toast.error('SOA Request not found');
        setLoading(false);
        return;
      }
      
      setSOARequest(requests[0]);
      setReviewStatus(requests[0].review_status || { sections: {} });
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  const getSectionStatus = (section) => {
    if (section.checkInScope && !section.checkInScope(soaRequest)) {
      return { status: 'not-required', isMarked: false, excluded: true };
    }
    
    const isMarkedComplete = reviewStatus.sections?.[section.key]?.manually_complete || false;
    const isAutoComplete = section.checkComplete ? section.checkComplete(soaRequest) : false;
    
    if (isMarkedComplete || isAutoComplete) {
      return { status: 'complete', isMarked: true, excluded: false };
    }
    
    return { status: 'pending', isMarked: false, excluded: false };
  };
  
  const toggleMarkComplete = async (sectionKey) => {
    const newStatus = {
      ...reviewStatus,
      sections: {
        ...reviewStatus.sections,
        [sectionKey]: {
          ...reviewStatus.sections?.[sectionKey],
          manually_complete: !reviewStatus.sections?.[sectionKey]?.manually_complete
        }
      }
    };
    
    setReviewStatus(newStatus);
    
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        review_status: newStatus
      });
    } catch (error) {
      console.error('Error saving:', error);
    }
  };
  
  const getProgress = () => {
    const requiredSections = SECTIONS.filter(s => {
      if (s.checkInScope && !s.checkInScope(soaRequest)) return false;
      return true;
    });
    
    const completedSections = requiredSections.filter(s => {
      const status = getSectionStatus(s);
      return status.isMarked;
    });
    
    const pct = requiredSections.length > 0
      ? Math.round((completedSections.length / requiredSections.length) * 100)
      : 0;
    
    return {
      pct,
      completed: completedSections.length,
      total: requiredSections.length,
      allComplete: completedSections.length === requiredSections.length
    };
  };
  
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        status: 'submitted',
        submitted_date: new Date().toISOString(),
        review_status: {
          ...reviewStatus,
          submitted: true,
          submitted_at: new Date().toISOString()
        }
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }
  
  const progress = getProgress();
  
  return (
    <SOARequestLayout currentSection="review" soaRequest={soaRequest}>
      <div className="flex-1 overflow-auto bg-slate-50 px-8 py-6">
        {/* Dark Banner */}
        <div style={{ backgroundColor: '#1E293B', padding: '24px 32px', borderRadius: '16px 16px 0 0' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
            Review & Submit SOA Request
          </h1>
          <p style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8', margin: 0 }}>
            Review your SOA request across all sections before submitting to the AI paraplanner.
          </p>
        </div>

        {/* White Content Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0 0 16px 16px', border: '1px solid #E2E8F0', borderTop: 'none' }}>
          <div className="p-8 space-y-6">
          {/* Progress Overview */}
          <Card className="border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800">Overall Completion</h3>
                <div className="text-right">
                  <span className="text-3xl font-bold text-slate-900">{progress.pct}%</span>
                  <span className="text-sm text-slate-500 ml-2">Complete</span>
                </div>
              </div>
              <Progress value={progress.pct} className="h-3" />
              <p className="text-sm text-slate-500 mt-2">
                {progress.completed} of {progress.total} sections complete
              </p>
            </CardContent>
          </Card>
          
          {/* Scope Tip */}
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-xl">💡</span>
            <div className="text-sm text-green-800">
              <strong className="block mb-1">Some sections may not be required</strong>
              Sections marked "Not required" are excluded based on your Scope of Advice selections.
            </div>
          </div>
          
          {/* Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECTIONS.map(section => {
              const status = getSectionStatus(section);
              
              return (
                <SectionCard
                  key={section.key}
                  section={section}
                  status={status}
                  onNavigate={() => navigate(createPageUrl(section.page) + `?id=${soaRequest.id}`)}
                  onToggleMark={() => toggleMarkComplete(section.key)}
                />
              );
            })}
          </div>
          
          {/* Submit Section */}
          <Card className="border-slate-200">
            <CardContent className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-3xl">
                🤖
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Submit?</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Mark each section as complete to confirm you've entered all required information.
              </p>
              
              {!progress.allComplete && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6 max-w-md mx-auto">
                  <span className="text-2xl">📋</span>
                  <div>
                    <strong className="text-slate-900 block">
                      {progress.total - progress.completed} section{progress.total - progress.completed !== 1 ? 's' : ''} remaining
                    </strong>
                    <span className="text-sm text-slate-600">
                      Mark each section as complete when finished.
                    </span>
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleSubmit}
                disabled={!progress.allComplete || submitting}
                className="bg-blue-600 hover:bg-blue-700 min-w-[280px]"
                size="lg"
              >
                {submitting 
                  ? 'Submitting...'
                  : progress.allComplete
                  ? 'Submit to AI Paraplanner →'
                  : 'Mark all sections complete to submit'
                }
              </Button>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <div className="flex justify-start py-4">
            <Button variant="outline" onClick={() => navigate(createPageUrl('SOARequestDetails') + `?id=${soaRequest?.id}`)}>
              ◀ Back
            </Button>
          </div>
        </div>
      </div>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          onClose={() => {
            setShowSuccessModal(false);
            navigate(createPageUrl('SOAManagement'));
          }}
        />
      )}
    </SOARequestLayout>
  );
}

// ==========================================================================
// SECTION CARD COMPONENT
// ==========================================================================
function SectionCard({ section, status, onNavigate, onToggleMark }) {
  const statusStyles = {
    complete: 'border-green-500 bg-green-50',
    pending: 'border-red-400 bg-red-50',
    'not-required': 'border-slate-300 bg-slate-50 opacity-70'
  };
  
  const badgeStyles = {
    complete: 'bg-green-100 text-green-700',
    pending: 'bg-red-100 text-red-700',
    'not-required': 'bg-slate-100 text-slate-500'
  };
  
  const StatusIcon = status.status === 'complete' ? CheckCircle2
    : status.status === 'not-required' ? MinusCircle
    : AlertCircle;
  
  return (
    <div className={`rounded-xl border-2 p-5 transition-all hover:shadow-md ${statusStyles[status.status]}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {section.category}
          </span>
          <h4 className="font-bold text-slate-900 mt-1">{section.title}</h4>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeStyles[status.status]}`}>
          {status.status === 'complete' ? '✓ Complete' : status.status === 'not-required' ? 'Not required' : 'Pending'}
        </span>
      </div>
      
      <p className="text-sm text-slate-600 mb-4">{section.description}</p>
      
      <div 
        className="flex items-center justify-between pt-4 border-t border-slate-200 cursor-pointer hover:text-blue-600"
        onClick={onNavigate}
      >
        <span className="text-sm font-bold text-blue-600">
          {status.status === 'complete' ? 'Review' : status.status === 'not-required' ? 'View anyway' : 'Complete this section'}
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>
      
      {status.status !== 'not-required' && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMark(); }}
          className={`mt-3 px-4 py-2 rounded-full text-xs font-bold border transition-all w-full
            ${status.isMarked
              ? 'bg-green-100 border-green-500 text-green-700'
              : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
            }`}
        >
          {status.isMarked ? '✓ Complete' : '○ Mark as complete'}
        </button>
      )}
    </div>
  );
}

// ==========================================================================
// SUCCESS MODAL
// ==========================================================================
function SuccessModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-0" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 rounded-t-xl">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">✓</span> SOA Request Submitted
          </h3>
        </div>
        
        <div className="p-6">
          <p className="text-slate-700 mb-4">
            Your SOA request has been successfully submitted to the AI paraplanner.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            The AI paraplanner will now generate your Statement of Advice. You'll be notified when it's ready for review.
          </p>
          
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <h4 className="font-bold text-slate-800 mb-3">What Happens Next</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                AI paraplanner processes your request
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Draft SOA generated within 24-48 hours
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                You'll receive notification when ready
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Review, edit, and finalise the document
              </li>
            </ul>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button onClick={onClose} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}