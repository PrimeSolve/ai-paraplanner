/**
 * Fact Find Percentage Completion Logic
 * Calculates completion percentage per section based on filled fields
 */

export function useCompletionLogic() {
  /**
   * Personal Section - Client + optional Partner
   * 15 fields per person
   */
  const getPersonalCompletion = (factFind) => {
    const personalData = factFind?.personal || {};
    
    const clientFields = [
      personalData.first_name,
      personalData.last_name,
      personalData.gender,
      personalData.date_of_birth,
      personalData.marital_status,
      personalData.living_status,
      personalData.resident_status,
      personalData.email,
      personalData.phone || personalData.mobile,
      personalData.address,
      personalData.health_status,
      personalData.smoker_status,
      personalData.employment_status,
      personalData.employer || personalData.employer_name,
      personalData.occupation
    ];

    let totalFields = clientFields.length;
    let filledFields = clientFields.filter(f => f && f !== '').length;

    // Partner fields (if partner exists)
    const hasPartner = !!personalData.partner?.first_name;
    if (hasPartner) {
      const partnerFields = [
        personalData.partner.first_name,
        personalData.partner.last_name,
        personalData.partner.gender,
        personalData.partner.date_of_birth,
        personalData.partner.marital_status,
        personalData.partner.living_status,
        personalData.partner.resident_status,
        personalData.partner.email,
        personalData.partner.phone || personalData.partner.mobile,
        personalData.partner.address,
        personalData.partner.health_status,
        personalData.partner.smoker_status,
        personalData.partner.employment_status,
        personalData.partner.employer || personalData.partner.employer_name,
        personalData.partner.occupation
      ];
      totalFields += partnerFields.length;
      filledFields += partnerFields.filter(f => f && f !== '').length;
    }

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };

  /**
   * Dependants Section - Children + Adult Dependants
   */
  const getDependantsCompletion = (factFind) => {
    const children = factFind?.dependants?.children || [];
    const adults = factFind?.dependants?.dependants_list || [];

    if (children.length === 0 && adults.length === 0) return 0;

    let totalFields = 0;
    let filledFields = 0;

    // Children: 3 fields per child (name, dob, financially_dependent)
    children.forEach(c => {
      totalFields += 3;
      if (c.first_name) filledFields++;
      if (c.date_of_birth) filledFields++;
      if (c.financially_dependent !== undefined && c.financially_dependent !== '') filledFields++;
    });

    // Adult dependants: 4 fields per adult
    adults.forEach(a => {
      totalFields += 4;
      if (a.first_name) filledFields++;
      if (a.relationship) filledFields++;
      if (a.date_of_birth) filledFields++;
      if (a.financially_dependent !== undefined && a.financially_dependent !== '') filledFields++;
    });

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };

  /**
   * Trusts & Companies Section
   */
  const getTrustsCompletion = (factFind) => {
    const entities = factFind?.trusts_companies?.entities || [];

    if (entities.length === 0) return 0;

    let totalFields = 0;
    let filledFields = 0;

    entities.forEach(e => {
      // Each trust/company has 3 key fields
      totalFields += 3;
      
      if (e.name) filledFields++;
      if (e.type) filledFields++;
      
      // Beneficiaries/Shareholders: 1+ = complete
      const relatedEntities = e.beneficiaries || e.shareholders || [];
      if (relatedEntities.length > 0) filledFields++;
    });

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };

  /**
   * SMSF Section
   */
  const getSmsfCompletion = (factFind) => {
    const smsf = factFind?.smsf;
    
    if (!smsf || !smsf.name) return 0;

    let totalFields = 5; // Fund-level fields
    let filledFields = 0;

    if (smsf.name) filledFields++;
    if (smsf.fund_type) filledFields++;
    if (smsf.trustee_type) filledFields++;
    if (smsf.type) filledFields++; // account type
    if (smsf.balance) filledFields++;

    // Accounts: 5 fields per account
    const accounts = smsf.accounts || [];
    accounts.forEach(a => {
      totalFields += 5;
      if (a.owner) filledFields++;
      if (a.tax_environment) filledFields++;
      if (a.fund_percentage) filledFields++;
      if (a.balance) filledFields++;
      if (a.beneficiaries && a.beneficiaries.length > 0) filledFields++;
    });

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };

  /**
   * Superannuation Section - Funds, Pensions, Annuities
   */
  const getSuperCompletion = (factFind) => {
    const funds = factFind?.superannuation?.funds || [];
    const pensions = factFind?.superannuation?.pensions || [];
    const annuities = factFind?.superannuation?.annuities || [];

    if (funds.length === 0 && pensions.length === 0 && annuities.length === 0) {
      return 0;
    }

    let totalFields = 0;
    let filledFields = 0;

    // Super Funds: 7 fields per fund
    funds.forEach(f => {
      totalFields += 7;
      if (f.fund_name) filledFields++;
      if (f.product) filledFields++;
      if (f.owner) filledFields++;
      if (f.balance) filledFields++;
      if (f.super_guarantee !== undefined && f.super_guarantee !== '') filledFields++;
      if (f.beneficiaries && f.beneficiaries.length > 0) filledFields++;
      if (f.portfolio && f.portfolio.length > 0) filledFields++;
    });

    // Pensions: 9 fields per pension
    pensions.forEach(p => {
      totalFields += 9;
      if (p.fund_name) filledFields++;
      if (p.product) filledFields++;
      if (p.owner) filledFields++;
      if (p.balance) filledFields++;
      if (p.pension_type) filledFields++;
      if (p.commencement_date) filledFields++;
      if (p.annual_income) filledFields++;
      if (p.beneficiaries && p.beneficiaries.length > 0) filledFields++;
      if (p.portfolio && p.portfolio.length > 0) filledFields++;
    });

    // Annuities: 7 fields per annuity
    annuities.forEach(a => {
      totalFields += 7;
      if (a.provider) filledFields++;
      if (a.owner) filledFields++;
      if (a.annuity_type) filledFields++;
      if (a.purchase_price) filledFields++;
      if (a.commencement_date) filledFields++;
      if (a.annual_income) filledFields++;
      if (a.beneficiaries && a.beneficiaries.length > 0) filledFields++;
    });

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };

  /**
   * Investments Section - Wraps & Bonds
   */
  const getInvestmentsCompletion = (factFind) => {
    const wraps = factFind?.investments?.wraps || [];
    const bonds = factFind?.investments?.bonds || [];

    if (wraps.length === 0 && bonds.length === 0) return 0;

    let totalFields = 0;
    let filledFields = 0;

    // Wraps: 6 fields per wrap
    wraps.forEach(w => {
      totalFields += 6;
      if (w.platform_name) filledFields++;
      if (w.owner) filledFields++;
      if (w.balance) filledFields++;
      if (w.type) filledFields++;
      if (w.portfolio && w.portfolio.length > 0) filledFields++;
      if (w.beneficiaries && w.beneficiaries.length > 0) filledFields++;
    });

    // Bonds: 6 fields per bond
    bonds.forEach(b => {
      totalFields += 6;
      if (b.product_name) filledFields++;
      if (b.owner) filledFields++;
      if (b.balance) filledFields++;
      if (b.type) filledFields++;
      if (b.portfolio && b.portfolio.length > 0) filledFields++;
      if (b.beneficiaries && b.beneficiaries.length > 0) filledFields++;
    });

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };

  /**
   * Assets & Liabilities Section
   */
  const getAssetsLiabilitiesCompletion = (factFind) => {
    const assets = factFind?.assets_liabilities?.assets || [];
    const liabilities = factFind?.assets_liabilities?.liabilities || [];

    if (assets.length === 0 && liabilities.length === 0) return 0;

    let totalFields = 0;
    let filledFields = 0;

    // Assets: 4 fields per asset
    assets.forEach(a => {
      totalFields += 4;
      if (a.asset_name) filledFields++;
      if (a.asset_type) filledFields++;
      if (a.value) filledFields++;
      if (a.owner) filledFields++;
    });

    // Liabilities: 4 fields per liability
    liabilities.forEach(l => {
      totalFields += 4;
      if (l.liability_type) filledFields++;
      if (l.lender) filledFields++;
      if (l.balance) filledFields++;
      if (l.owner) filledFields++;
    });

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };

  /**
   * Income & Expenses Section
   */
  const getIncomeExpensesCompletion = (factFind) => {
    const incomeExpenses = factFind?.income_expenses || {};
    const incomeSources = incomeExpenses.income_sources || [];
    const expenses = incomeExpenses.expenses || [];

    if (incomeSources.length === 0 && expenses.length === 0) return 0;

    let totalFields = 0;
    let filledFields = 0;

    // Income sources: 3 fields per source
    incomeSources.forEach(s => {
      totalFields += 3;
      if (s.source_type) filledFields++;
      if (s.amount) filledFields++;
      if (s.owner) filledFields++;
    });

    // Expenses: 3 fields per expense
    expenses.forEach(e => {
      totalFields += 3;
      if (e.expense_type) filledFields++;
      if (e.amount) filledFields++;
      if (e.frequency) filledFields++;
    });

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };

  /**
   * Insurance Section
   */
  const getInsuranceCompletion = (factFind) => {
    const policies = factFind?.insurance?.policies || [];

    if (policies.length === 0) return 0;

    let totalFields = 0;
    let filledFields = 0;

    // Per policy: 6 core fields
    policies.forEach(p => {
      totalFields += 6;
      if (p.policy_owner) filledFields++;
      if (p.insurance_type) filledFields++;
      if (p.insurer) filledFields++;
      if (p.policy_number) filledFields++;
      if (p.cover_amount) filledFields++;
      if (p.premium) filledFields++;
    });

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };

  /**
   * Superannuation & Tax Section
   */
  const getSuperTaxCompletion = (factFind) => {
    const superTax = factFind?.super_tax || {};
    
    let totalFields = 0;
    let filledFields = 0;

    // Client super/tax: 8 fields
    const clientSuper = superTax.client?.super || {};
    const clientTax = superTax.client?.tax || {};
    const clientFields = [
      clientSuper.sg_mode,
      clientSuper.tbc_used,
      clientSuper.ncc_trigger,
      clientSuper.cc_used,
      clientSuper.low_rate_used,
      clientSuper.div293,
      clientTax.pre_losses,
      clientTax.pre_cgt_losses
    ];
    totalFields += clientFields.length;
    filledFields += clientFields.filter(f => f || f === 0).length;

    // Partner super/tax (if partner data exists): 8 fields
    if (superTax.partner) {
      const partnerSuper = superTax.partner.super || {};
      const partnerTax = superTax.partner.tax || {};
      const partnerFields = [
        partnerSuper.sg_mode,
        partnerSuper.tbc_used,
        partnerSuper.ncc_trigger,
        partnerSuper.cc_used,
        partnerSuper.low_rate_used,
        partnerSuper.div293,
        partnerTax.pre_losses,
        partnerTax.pre_cgt_losses
      ];
      totalFields += partnerFields.length;
      filledFields += partnerFields.filter(f => f || f === 0).length;
    }

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };

  /**
   * Advice Reason Section - Uses visited flag
   */
  const getAdviceReasonCompletion = (factFind) => {
    const adviceReason = factFind?.advice_reason || {};
    
    // This section is complete if visited
    if (adviceReason._visited || (adviceReason.reasons && adviceReason.reasons.length > 0)) {
      return 100;
    }
    
    return 0;
  };

  /**
   * Risk Profile Section
   */
  const getRiskProfileCompletion = (factFind) => {
    const riskProfile = factFind?.risk_profile || {};
    
    // Check for client profile selection
    let filledFields = 0;
    let totalFields = 2;

    if (riskProfile.client?.profile || riskProfile.client?.specifiedProfile) {
      filledFields++;
    }
    
    // Check for partner profile (if partner exists)
    if (riskProfile.partner) {
      if (riskProfile.partner?.profile || riskProfile.partner?.specifiedProfile) {
        filledFields++;
      }
      totalFields = 2;
    }

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };

  /**
   * Calculate completion percentage for all sections
   */
  const calculateAllSectionCompletion = (factFind) => {
    return {
      personal: getPersonalCompletion(factFind),
      dependants: getDependantsCompletion(factFind),
      trusts_companies: getTrustsCompletion(factFind),
      smsf: getSmsfCompletion(factFind),
      superannuation: getSuperCompletion(factFind),
      investments: getInvestmentsCompletion(factFind),
      assets_liabilities: getAssetsLiabilitiesCompletion(factFind),
      income_expenses: getIncomeExpensesCompletion(factFind),
      insurance: getInsuranceCompletion(factFind),
      super_tax: getSuperTaxCompletion(factFind),
      advice_reason: getAdviceReasonCompletion(factFind),
      risk_profile: getRiskProfileCompletion(factFind)
    };
  };

  /**
   * Calculate overall Fact Find completion percentage
   */
  const calculateOverallCompletion = (factFind) => {
    const sections = calculateAllSectionCompletion(factFind);
    
    const totalPercentage = Object.values(sections).reduce((sum, pct) => sum + pct, 0);
    const sectionCount = Object.keys(sections).length;
    
    return Math.round(totalPercentage / sectionCount);
  };

  /**
   * Get display state for all sections (combines calculated % + manual marks)
   */
  const getDisplayState = (factFind) => {
    const sections = calculateAllSectionCompletion(factFind);
    const reviewStatus = factFind?.review_status?.sections || {};
    const displayState = {};

    Object.entries(sections).forEach(([key, percentage]) => {
      const isManuallyComplete = reviewStatus[key]?.manually_complete || false;
      const isComplete = percentage === 100 || isManuallyComplete;

      displayState[key] = {
        percentage,
        isManuallyComplete,
        isComplete,
        displayValue: percentage === 100 || isManuallyComplete ? '✓' : `${percentage || 0}%`,
        color: percentage === 100 ? '#10b981'
          : isManuallyComplete ? '#10b981'
            : percentage >= 50 ? '#f59e0b'
              : percentage > 0 ? '#ef4444'
                : '#9ca3af'
      };
    });

    return displayState;
  };

  return {
    calculateAllSectionCompletion,
    calculateOverallCompletion,
    getDisplayState,
    getPersonalCompletion,
    getDependantsCompletion,
    getTrustsCompletion,
    getSmsfCompletion,
    getSuperCompletion,
    getInvestmentsCompletion,
    getAssetsLiabilitiesCompletion,
    getIncomeExpensesCompletion,
    getInsuranceCompletion,
    getSuperTaxCompletion,
    getAdviceReasonCompletion,
    getRiskProfileCompletion
  };
}