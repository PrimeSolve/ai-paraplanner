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
      personalData.mobile,
      personalData.address,
      personalData.health_status,
      personalData.smoker_status,
      personalData.employment_status,
      personalData.employer_name,
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
        personalData.partner.mobile,
        personalData.partner.address,
        personalData.partner.health_status,
        personalData.partner.smoker_status,
        personalData.partner.employment_status,
        personalData.partner.employer_name,
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
    const income = factFind?.income_expenses?.income || {};
    const expenses = factFind?.income_expenses?.expenses || {};

    let totalFields = 0;
    let filledFields = 0;

    // Client income fields
    const clientIncomeFields = [
      income.client?.gross_salary,
      income.client?.investment_income,
      income.client?.other_income
    ];
    totalFields += clientIncomeFields.length;
    filledFields += clientIncomeFields.filter(f => f).length;

    // Partner income fields
    const partnerIncomeFields = [
      income.partner?.gross_salary,
      income.partner?.investment_income,
      income.partner?.other_income
    ];
    totalFields += partnerIncomeFields.length;
    filledFields += partnerIncomeFields.filter(f => f).length;

    // Expenses
    const expenseFields = [
      expenses.living_expenses,
      expenses.debt_repayments,
      expenses.other_expenses
    ];
    totalFields += expenseFields.length;
    filledFields += expenseFields.filter(f => f).length;

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

    // Client super fields
    const clientSuper = superTax.client?.super || {};
    const superFields = [
      clientSuper.salary_sacrifice,
      clientSuper.personal_contribution,
      clientSuper.spouse_contribution
    ];
    totalFields += superFields.length;
    filledFields += superFields.filter(f => f).length;

    // Client tax fields
    const clientTax = superTax.client?.tax || {};
    const taxFields = [
      clientTax.taxable_income,
      clientTax.tax_rate,
      clientTax.tax_file_number
    ];
    totalFields += taxFields.length;
    filledFields += taxFields.filter(f => f).length;

    // Partner super/tax (if partner exists)
    if (superTax.partner) {
      const partnerSuper = superTax.partner.super || {};
      const pSuperFields = [
        partnerSuper.salary_sacrifice,
        partnerSuper.personal_contribution,
        partnerSuper.spouse_contribution
      ];
      totalFields += pSuperFields.length;
      filledFields += pSuperFields.filter(f => f).length;

      const partnerTax = superTax.partner.tax || {};
      const pTaxFields = [
        partnerTax.taxable_income,
        partnerTax.tax_rate,
        partnerTax.tax_file_number
      ];
      totalFields += pTaxFields.length;
      filledFields += pTaxFields.filter(f => f).length;
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
   * Risk Profile Section - Uses visited flag
   */
  const getRiskProfileCompletion = (factFind) => {
    const riskProfile = factFind?.risk_profile || {};
    
    // Complete if visited OR has completion percentage
    if (riskProfile._visited || riskProfile.completionPct) {
      return riskProfile.completionPct || 100;
    }
    
    return 0;
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

  return {
    calculateAllSectionCompletion,
    calculateOverallCompletion,
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