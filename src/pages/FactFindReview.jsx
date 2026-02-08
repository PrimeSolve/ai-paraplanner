import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import { useFactFind } from '@/components/factfind/useFactFind';
import { useCompletionLogic } from '@/components/factfind/useCompletionLogic';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Info, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';

const SECTIONS = [
  { key: 'personal', title: 'Personal Details', category: 'Personal', path: 'FactFindPersonal' },
  { key: 'dependants', title: 'Dependants', category: 'Personal', path: 'FactFindDependants' },
  { key: 'trusts_companies', title: 'Trusts & Companies', category: 'Other Entities', path: 'FactFindTrusts' },
  { key: 'smsf', title: 'SMSF', category: 'Other Entities', path: 'FactFindSMSF' },
  { key: 'superannuation', title: 'Superannuation', category: 'Financial Products', path: 'FactFindSuperannuation' },
  { key: 'investments', title: 'Investment Accounts', category: 'Financial Products', path: 'FactFindInvestment' },
  { key: 'assets_liabilities', title: 'Assets & Liabilities', category: 'Net Worth', path: 'FactFindAssetsLiabilities' },
  { key: 'income_expenses', title: 'Income & Expenses', category: 'Cashflow', path: 'FactFindIncomeExpenses' },
  { key: 'insurance', title: 'Insurance Policies', category: 'Insurance', path: 'FactFindInsurance' },
  { key: 'super_tax', title: 'Super & Tax Planning', category: 'Planning', path: 'FactFindSuperTax' },
  { key: 'advice_reason', title: 'Reason for Seeking Advice', category: 'Planning', path: 'FactFindAdviceReason' },
  { key: 'risk_profile', title: 'Risk Profile', category: 'Planning', path: 'FactFindRiskProfile' }
];

export default function FactFindReview() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading, updateSection } = useFactFind();
  const { calculateAllSectionCompletion, getDisplayState } = useCompletionLogic();
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showKeyInfo, setShowKeyInfo] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);
  const [refreshConfirmed, setRefreshConfirmed] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const reviewStatus = factFind?.review_status || { sections: {}, submitted: false };
  
  const displayState = useMemo(() => {
    if (!factFind) return {};
    return getDisplayState(factFind);
  }, [factFind, getDisplayState]);

  const progress = useMemo(() => {
    let completedSections = 0;
    SECTIONS.forEach(section => {
      if (displayState[section.key]?.isComplete) {
        completedSections++;
      }
    });

    const percentage = Math.round((completedSections / SECTIONS.length) * 100);
    let barColor = '#ef4444';
    if (percentage >= 100) barColor = '#10b981';
    else if (percentage >= 80) barColor = '#2563eb';
    else if (percentage >= 50) barColor = '#f59e0b';

    return {
      percentage,
      completed: completedSections,
      total: SECTIONS.length,
      remaining: SECTIONS.length - completedSections,
      barColor
    };
  }, [displayState]);

  const handleToggleMark = async (sectionKey) => {
    if (!factFind) return;
    const currentStatus = reviewStatus?.sections?.[sectionKey]?.manually_complete || false;
    const updatedReviewStatus = {
      ...reviewStatus,
      sections: {
        ...reviewStatus?.sections,
        [sectionKey]: { manually_complete: !currentStatus }
      }
    };
    await updateSection('review_status', updatedReviewStatus);
  };

  const handleNavigateToSection = (path) => {
    navigate(createPageUrl(path) + (factFind?.id ? `?id=${factFind.id}` : ''));
  };

  const handleSubmit = async () => {
    if (!factFind) return;
    setSubmitting(true);
    try {
      const updatedReviewStatus = {
        ...reviewStatus,
        submitted: true,
        submitted_at: new Date().toISOString()
      };
      await updateSection('review_status', updatedReviewStatus);
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (error) {
      toast.error('Failed to submit fact find');
      setSubmitting(false);
    }
  };

  const handleRefreshConfirm = async () => {
    if (!refreshConfirmed) {
      toast.error('Please confirm you understand this will delete all data');
      return;
    }

    try {
      const emptyFactFind = {
        personal: {},
        dependants: {},
        trusts_companies: {},
        smsf: {},
        superannuation: {},
        investment: {},
        assets_liabilities: {},
        income_expenses: {},
        insurance: {},
        super_tax: {},
        advice_reason: {},
        risk_profile: {},
        review_status: { sections: {}, submitted: false, submitted_at: null }
      };

      for (const [key, value] of Object.entries(emptyFactFind)) {
        await updateSection(key, value);
      }
      
      setShowRefresh(false);
      setRefreshConfirmed(false);
      window.location.reload();
    } catch (error) {
      toast.error('Failed to refresh data');
    }
  };

  if (ffLoading) {
    return (
      <FactFindLayout currentSection="review" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  return (
    <>
      {/* Key Info Modal */}
      <Dialog open={showKeyInfo} onOpenChange={setShowKeyInfo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-6 h-6">👤</div>
              Key Information
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Client Information</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <div>
                  <div className="font-medium text-slate-700">Primary</div>
                  {factFind?.personal?.first_name && factFind?.personal?.last_name
                    ? `${factFind.personal.first_name} ${factFind.personal.last_name}`
                    : 'Not provided'}
                </div>
                <div>
                  <div className="font-medium text-slate-700">Partner</div>
                  {factFind?.partner_email ? factFind.partner_email : 'Not provided'}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Adviser</h4>
              <div className="text-sm text-slate-600">
                {user?.full_name || 'Your adviser'}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Fact Find Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Completion</span>
                  <span className="font-semibold text-slate-700">{progress.percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${progress.percentage}%`,
                      backgroundColor: progress.barColor
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Submitted: {reviewStatus.submitted ? 'Yes' : 'Not yet'}</span>
                  <span>
                    Last Updated: {factFind?.updated_date
                      ? new Date(factFind.updated_date).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refresh Data Modal */}
      <Dialog open={showRefresh} onOpenChange={setShowRefresh}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              Refresh Fact Find Data
            </DialogTitle>
            <DialogDescription>
              This will delete all your current data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900">
                ⚠️ This action will clear all sections and cannot be undone.
              </p>
            </div>

            <div className="flex items-start gap-3 border border-slate-200 rounded-lg p-3 bg-slate-50">
              <Checkbox
                id="confirm-refresh"
                checked={refreshConfirmed}
                onCheckedChange={setRefreshConfirmed}
                className="mt-0.5"
              />
              <label htmlFor="confirm-refresh" className="text-sm text-slate-700 cursor-pointer">
                I understand this will delete all my current fact find data
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setShowRefresh(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRefreshConfirm}
                disabled={!refreshConfirmed}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Refresh Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Fact Find?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-600">
              Your adviser will be notified and will review your information.
            </p>

            {progress.remaining > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-900">
                  <strong>{progress.remaining} sections are incomplete.</strong>
                </p>
                <p className="text-sm text-amber-800 mt-1">
                  You can still submit, but consider completing all sections first.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit →'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">✓ Fact Find Submitted</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <p className="text-slate-600">
              Your fact find has been successfully submitted to your adviser.
            </p>
            <p className="text-sm text-slate-500">
              You can still make changes if needed — your adviser will review the most recent version.
            </p>
            <div className="space-y-2 text-sm text-slate-700 text-left bg-slate-50 p-3 rounded-lg">
              <p className="font-semibold">What Happens Next:</p>
              <ul className="space-y-1 ml-4">
                <li>• Your adviser will review your information</li>
                <li>• They'll prepare recommendations</li>
                <li>• You'll be contacted to discuss</li>
              </ul>
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccess(false);
                  navigate(createPageUrl('ClientDashboard'));
                }}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => navigate(createPageUrl('ClientDashboard'))}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                View Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FactFindLayout currentSection="review" factFind={factFind}>
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Review & Submit Your Fact Find</h1>
                <p className="text-slate-600 mt-2">Review your progress and mark sections as complete</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowKeyInfo(true)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Key Information"
                >
                  <Info className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowRefresh(true)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-orange-600 transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Overall Completion</span>
                <span className="text-2xl font-bold" style={{ color: progress.barColor }}>
                  {progress.percentage}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{
                    width: `${progress.percentage}%`,
                    backgroundColor: progress.barColor
                  }}
                />
              </div>
              <p className="text-sm text-slate-600">
                {progress.completed} of {progress.total} sections complete
              </p>
            </div>

            {/* Section Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              {SECTIONS.map(section => {
                const state = displayState[section.key] || {};
                const percentage = state.percentage || 0;
                const isManuallyComplete = state.isManuallyComplete || false;
                const isComplete = state.isComplete || false;

                // Determine card state colors
                let borderColor = '#ef4444';
                let background = '#fef2f2';
                let icon = '!';
                let iconBg = '#fee2e2';
                let iconColor = '#dc2626';
                let badge = 'Not started';
                let badgeColor = '#dc2626';
                let actionText = 'Start section →';

                if (isComplete) {
                  borderColor = '#10b981';
                  background = '#f0fdf4';
                  icon = '✓';
                  iconBg = '#d1fae5';
                  iconColor = '#059669';
                  badge = isManuallyComplete && percentage < 100 ? 'Marked complete' : '✓ Complete';
                  badgeColor = '#059669';
                  actionText = 'Review section →';
                } else if (percentage > 0) {
                  borderColor = '#f59e0b';
                  background = '#fffbeb';
                  icon = '◐';
                  iconBg = '#fef3c7';
                  iconColor = '#d97706';
                  badge = `${Math.round(percentage)}% complete`;
                  badgeColor = '#d97706';
                  actionText = 'Continue →';
                }

                return (
                  <div
                    key={section.key}
                    style={{
                      background,
                      border: `1px solid ${borderColor}`,
                      borderRadius: '12px',
                      padding: '20px',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    className="hover:shadow-lg hover:-translate-y-0.5 space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p
                          style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}
                          className="uppercase tracking-wider mb-1"
                        >
                          {section.category}
                        </p>
                        <h3 style={{ fontSize: '15px', fontWeight: 700 }} className="text-slate-900">
                          {section.title}
                        </h3>
                      </div>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: iconBg,
                          color: iconColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}
                      >
                        {icon}
                      </div>
                    </div>

                    {/* Percentage */}
                    <div style={{ fontSize: '18px', fontWeight: 800, color: badgeColor }}>
                      {percentage}%
                    </div>

                    {/* Action Row */}
                    <div
                      onClick={() => handleNavigateToSection(section.path)}
                      style={{
                        paddingTop: '12px',
                        borderTop: `1px solid ${borderColor}`,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <span style={{ fontSize: '13px', fontWeight: 700, color: badgeColor }}>
                        {actionText}
                      </span>
                      <span style={{ fontSize: '16px', opacity: 0.7 }}>→</span>
                    </div>

                    {/* Mark Complete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMark(section.key);
                      }}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        border: isManuallyComplete ? '1px solid #10b981' : '1px solid #cbd5e1',
                        background: isManuallyComplete ? '#d1fae5' : '#fff',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: isManuallyComplete ? '#059669' : '#64748b',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                      className="hover:opacity-80"
                    >
                      <span>{isManuallyComplete ? '✓' : '○'}</span>
                      {isManuallyComplete ? 'Marked complete' : 'Mark as complete'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Submit Section */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span>✓</span>
                  {progress.remaining === 0 ? 'Ready to Submit!' : 'Ready to Submit?'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {progress.remaining === 0 ? (
                  <p className="text-slate-600">
                    All sections are complete. Your adviser will receive all the information you've provided.
                  </p>
                ) : (
                  <>
                    <p className="text-slate-600">
                      You can still submit, but your adviser will have a more complete picture if you finish all sections.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-amber-900 mb-2">
                        ⚠ {progress.remaining} sections remaining
                      </p>
                      <p className="text-sm text-amber-800">
                        {SECTIONS.filter(s => !displayState[s.key]?.isComplete).map(s => s.title).join(', ')}
                      </p>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl('FactFindRiskProfile') + `?id=${factFind?.id}`)}
                    className="border-slate-300"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setShowConfirm(true)}
                    disabled={submitting}
                    className={cn(
                      'text-white font-semibold flex-1',
                      progress.remaining === 0
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    )}
                  >
                    {submitting ? 'Submitting...' : 'Submit Fact Find →'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FactFindLayout>
    </>
  );
}