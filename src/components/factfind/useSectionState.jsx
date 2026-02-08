import { useCallback } from 'react';
import { useCompletionLogic } from './useCompletionLogic';

const SECTIONS = [
  { key: 'personal', title: 'Personal Details', category: 'Personal' },
  { key: 'dependants', title: 'Dependants', category: 'Personal' },
  { key: 'trusts_companies', title: 'Trusts & Companies', category: 'Other Entities' },
  { key: 'smsf', title: 'SMSF', category: 'Other Entities' },
  { key: 'superannuation', title: 'Superannuation', category: 'Financial Products' },
  { key: 'investments', title: 'Investment Accounts', category: 'Financial Products' },
  { key: 'assets_liabilities', title: 'Assets & Liabilities', category: 'Net Worth' },
  { key: 'income_expenses', title: 'Income & Expenses', category: 'Cashflow' },
  { key: 'insurance', title: 'Insurance Policies', category: 'Insurance' },
  { key: 'super_tax', title: 'Super & Tax Planning', category: 'Planning' },
  { key: 'advice_reason', title: 'Reason for Seeking Advice', category: 'Planning' },
  { key: 'risk_profile', title: 'Risk Profile', category: 'Planning' }
];

export const useSectionState = () => {
  const { calculateAllSectionCompletion } = useCompletionLogic();

  const getSectionCardState = useCallback((section, factFind, reviewStatus) => {
    const sectionPercentages = calculateAllSectionCompletion(factFind || {});
    const percentage = sectionPercentages[section.key] || 0;
    const isManuallyComplete = reviewStatus?.sections?.[section.key]?.manually_complete || false;

    // STATE 1: Complete (green)
    if (percentage === 100 || isManuallyComplete) {
      return {
        status: 'complete',
        borderColor: '#10b981',
        background: '#f0fdf4',
        icon: '✓',
        iconBg: '#d1fae5',
        iconColor: '#059669',
        badge: isManuallyComplete && percentage < 100 ? 'Marked complete' : '✓ Complete',
        badgeColor: '#059669',
        actionText: 'Review section →',
        percentage: isManuallyComplete ? 100 : percentage,
        isManuallyComplete
      };
    }

    // STATE 2: In Progress (amber)
    if (percentage > 0 && percentage < 100) {
      return {
        status: 'partial',
        borderColor: '#f59e0b',
        background: '#fffbeb',
        icon: '◐',
        iconBg: '#fef3c7',
        iconColor: '#d97706',
        badge: `${Math.round(percentage)}% complete`,
        badgeColor: '#d97706',
        actionText: 'Continue →',
        percentage,
        isManuallyComplete: false
      };
    }

    // STATE 3: Not Started (red)
    return {
      status: 'empty',
      borderColor: '#ef4444',
      background: '#fef2f2',
      icon: '!',
      iconBg: '#fee2e2',
      iconColor: '#dc2626',
      badge: 'Not started',
      badgeColor: '#dc2626',
      actionText: 'Start section →',
      percentage: 0,
      isManuallyComplete: false
    };
  }, [calculateAllSectionCompletion]);

  const calculateOverallProgress = useCallback((factFind, reviewStatus) => {
    let completedSections = 0;
    const totalSections = SECTIONS.length;

    SECTIONS.forEach(section => {
      const state = getSectionCardState(section, factFind, reviewStatus);
      if (state.status === 'complete') {
        completedSections++;
      }
    });

    const percentage = Math.round((completedSections / totalSections) * 100);
    
    // Determine progress bar color
    let barColor = '#ef4444';
    if (percentage >= 100) barColor = '#10b981';
    else if (percentage >= 80) barColor = '#2563eb';
    else if (percentage >= 50) barColor = '#f59e0b';

    return {
      percentage,
      completed: completedSections,
      total: totalSections,
      remaining: totalSections - completedSections,
      barColor
    };
  }, [getSectionCardState]);

  return {
    SECTIONS,
    getSectionCardState,
    calculateOverallProgress
  };
};