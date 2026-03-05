/**
 * dataMapper.js — Maps between API response format and engine-compatible factFind state.
 *
 * apiToEngine: API response → factFind state (exact field names/types matching useFactFind.js)
 * engineToApi: factFind state + strategies → API request body for saving
 *
 * The engine expects string values for numeric fields (e.g. "85000" not 85000),
 * string codes for enums (e.g. "1" for gender Female), and specific nested structures.
 */

const str = (v) => (v == null ? "" : String(v));
const strOrEmpty = (v) => (v == null || v === "" ? "" : String(v));

// ─── API → Engine ────────────────────────────────────────────────────────────

/**
 * Maps a full advice request API response into the exact data structures
 * expected by useFactFind / the projection engine.
 */
export function apiToEngine(response) {
  const api = response || {};
  const client = api.client || {};
  const partner = api.partner || {};

  const factFind = {
    client1: mapClientPersonal(client),
    client2: partner?.firstName ? mapClientPersonal(partner) : null,
    children: (api.children || []).map(mapChild),
    dependants_list: (api.dependants || []).map(mapDependant),

    superProducts: (api.superFunds || []).map(mapSuperFund),
    products: {
      lifetimePensions: [],
      annuities: [],
      investmentBonds: [],
      wraps: [],
    },
    pensions: (api.pensions || []).map(mapPension),
    annuities: (api.annuities || []).map(mapAnnuity),
    definedBenefits: (api.definedBenefits || []).map(mapDefinedBenefit),

    trusts: (api.trusts || []).map(mapTrust),
    companies: (api.companies || []).map(mapCompany),
    smsfs: (api.smsfs || []).map(mapSmsf),

    homeMortgage: api.homeMortgage
      ? { interestRate: api.homeMortgage.interestRate || 0.06, remainingYears: api.homeMortgage.remainingYears || 25 }
      : { interestRate: 0.06, remainingYears: 25 },

    investmentBonds: (api.investmentBonds || []).map(mapInvestmentBond),

    assets: (api.assets || []).map(mapAsset),
    liabilities: (api.liabilities || api.debts || []).map(mapLiability),

    assetsRegister: [],
    debtsRegister: [],
    insurancePolicies: [],
    insurance: { policies: (api.insurancePolicies || []).map(mapInsurancePolicy) },

    income: {
      client1: mapIncome(api.income?.client1),
      client2: mapIncome(api.income?.client2),
    },
    expenses: mapExpenses(api.expenses),
    cashflowConfig: {
      livingExpenses: api.cashflowConfig?.livingExpenses || 85000,
      livingExpensesGrowth: api.cashflowConfig?.livingExpensesGrowth || 0.025,
    },
    assetAssumptions: api.assetAssumptions || {},
    goals: api.goals || [],
    advice_reason: api.adviceReason || { reasons: [], quick: { client1: { ret_age: "65" }, client2: { ret_age: "67" } }, objectives: [] },
    risk_profile: api.riskProfile || {
      client1: { answers: {}, score: 0, profile: "", specifiedProfile: "", adviserComments: "", clientComments: "", adjustedProfile: "", adjustmentReason: "" },
      client2: { answers: {}, score: 0, profile: "", specifiedProfile: "", adviserComments: "", clientComments: "", adjustedProfile: "", adjustmentReason: "" },
      mode: "", adjustRisk: "no",
    },
    incomeAdjustments: api.incomeAdjustments || [],
    expenseAdjustments: api.expenseAdjustments || [],
    advice_request: mapAdviceRequest(api.adviceRequest),
  };

  return factFind;
}

function mapClientPersonal(c) {
  if (!c) return null;
  return {
    first_name: strOrEmpty(c.firstName),
    last_name: strOrEmpty(c.lastName),
    gender: strOrEmpty(c.gender),
    date_of_birth: strOrEmpty(c.dateOfBirth),
    marital_status: strOrEmpty(c.maritalStatus),
    living_status: strOrEmpty(c.livingStatus),
    resident_status: strOrEmpty(c.residentStatus),
    address: strOrEmpty(c.address),
    suburb: strOrEmpty(c.suburb),
    state: strOrEmpty(c.state),
    country: strOrEmpty(c.country || "Australia"),
    postcode: strOrEmpty(c.postcode),
    mobile: strOrEmpty(c.mobile),
    email: strOrEmpty(c.email),
    health_status: strOrEmpty(c.healthStatus),
    smoker_status: strOrEmpty(c.smokerStatus),
    health_insurance: strOrEmpty(c.healthInsurance),
    health_issues: strOrEmpty(c.healthIssues),
    employment_status: strOrEmpty(c.employmentStatus),
    occupation: strOrEmpty(c.occupation),
    hours_per_week: strOrEmpty(c.hoursPerWeek),
    occupation_type: strOrEmpty(c.occupationType),
    annual_leave: strOrEmpty(c.annualLeave),
    sick_leave: strOrEmpty(c.sickLeave),
    long_service_leave: strOrEmpty(c.longServiceLeave),
    employer_name: strOrEmpty(c.employerName),
    fbt_exempt: strOrEmpty(c.fbtExempt),
    fbt_category: strOrEmpty(c.fbtCategory),
    fbt_other_benefits: strOrEmpty(c.fbtOtherBenefits),
    employment_length: strOrEmpty(c.employmentLength),
    has_will: strOrEmpty(c.hasWill),
    will_updated: strOrEmpty(c.willUpdated),
    testamentary_trust: strOrEmpty(c.testamentaryTrust),
    power_of_attorney: strOrEmpty(c.powerOfAttorney),
    centrelink_benefits: strOrEmpty(c.centrelinkBenefits),
    benefit_type: strOrEmpty(c.benefitType),
    concession_cards: strOrEmpty(c.concessionCards),
  };
}

function mapChild(c) {
  return {
    name: strOrEmpty(c.name),
    date_of_birth: strOrEmpty(c.dateOfBirth),
    relationship: strOrEmpty(c.relationship),
    financially_dependent: strOrEmpty(c.financiallyDependent),
  };
}

function mapDependant(d) {
  return {
    name: strOrEmpty(d.name),
    date_of_birth: strOrEmpty(d.dateOfBirth),
    relationship: strOrEmpty(d.relationship),
    notes: strOrEmpty(d.notes),
  };
}

function mapSuperFund(s) {
  return {
    owner: strOrEmpty(s.owner),
    fund_name: strOrEmpty(s.fundName),
    product: strOrEmpty(s.product),
    member_number: strOrEmpty(s.memberNumber),
    balance: strOrEmpty(s.balance),
    contributions: {
      super_guarantee: strOrEmpty(s.contributions?.superGuarantee),
      salary_sacrifice: strOrEmpty(s.contributions?.salarySacrifice),
      salary_sacrifice_indexed: !!s.contributions?.salarySacrificeIndexed,
      after_tax: strOrEmpty(s.contributions?.afterTax),
      after_tax_indexed: !!s.contributions?.afterTaxIndexed,
      spouse_received: strOrEmpty(s.contributions?.spouseReceived),
      spouse_received_indexed: !!s.contributions?.spouseReceivedIndexed,
      split_received: strOrEmpty(s.contributions?.splitReceived),
      split_out_pct: strOrEmpty(s.contributions?.splitOutPct),
      spouse_contribution_to: strOrEmpty(s.contributions?.spouseContributionTo),
      spouse_contribution_to_indexed: !!s.contributions?.spouseContributionToIndexed,
      concessional: strOrEmpty(s.contributions?.concessional),
    },
    tax_components: {
      unp_amount: strOrEmpty(s.taxComponents?.unpAmount),
      taxable_portion: strOrEmpty(s.taxComponents?.taxablePortion),
      tax_free_portion: strOrEmpty(s.taxComponents?.taxFreePortion),
    },
    fees: {
      admin_fee: strOrEmpty(s.fees?.adminFee),
      percent_fee: strOrEmpty(s.fees?.percentFee),
      insurance_fee: strOrEmpty(s.fees?.insuranceFee),
      ins_inflation_on: !!s.fees?.insInflationOn,
      ins_inflation_rate: strOrEmpty(s.fees?.insInflationRate),
    },
    beneficiaries: (s.beneficiaries || []).map(mapBeneficiary),
    portfolio: (s.portfolio || []).map(mapPortfolioItem),
  };
}

function mapPension(p) {
  return {
    owner: strOrEmpty(p.owner),
    fund_name: strOrEmpty(p.fundName),
    product: strOrEmpty(p.product),
    member_number: strOrEmpty(p.memberNumber),
    balance: strOrEmpty(p.balance),
    pension_type: strOrEmpty(p.pensionType),
    drawdown_rate: strOrEmpty(p.drawdownRate),
    drawdown_type: strOrEmpty(p.drawdownType),
    drawdown_amount: strOrEmpty(p.drawdownAmount),
    drawdown_frequency: strOrEmpty(p.drawdownFrequency),
    fees: {
      admin_fee: strOrEmpty(p.fees?.adminFee),
      percent_fee: strOrEmpty(p.fees?.percentFee),
      insurance_fee: strOrEmpty(p.fees?.insuranceFee),
    },
    tax_components: {
      taxable_portion: strOrEmpty(p.taxComponents?.taxablePortion),
      tax_free_portion: strOrEmpty(p.taxComponents?.taxFreePortion),
      tax_free_pct: strOrEmpty(p.taxComponents?.taxFreePct),
    },
    portfolio: (p.portfolio || []).map(mapPortfolioItem),
  };
}

function mapAnnuity(a) {
  return {
    owner: strOrEmpty(a.owner),
    product: strOrEmpty(a.product),
    annuity_type: strOrEmpty(a.annuityType),
    tax_environment: strOrEmpty(a.taxEnvironment),
    purchase_price: strOrEmpty(a.purchasePrice),
    commencement_date: strOrEmpty(a.commencementDate),
    maturity_date: strOrEmpty(a.maturityDate),
    guaranteed_period: strOrEmpty(a.guaranteedPeriod),
    residual_capital_value: strOrEmpty(a.residualCapitalValue),
    cpi_indexed: !!a.cpiIndexed,
    income: {
      annual_income: strOrEmpty(a.income?.annualIncome),
      frequency: strOrEmpty(a.income?.frequency),
      tax_free_pct: strOrEmpty(a.income?.taxFreePct),
      taxable_pct: strOrEmpty(a.income?.taxablePct),
      deductible_amount: strOrEmpty(a.income?.deductibleAmount),
    },
    tax_components: {
      taxable_portion: strOrEmpty(a.taxComponents?.taxablePortion),
      tax_free_portion: strOrEmpty(a.taxComponents?.taxFreePortion),
      tax_free_pct: strOrEmpty(a.taxComponents?.taxFreePct),
    },
    centrelink: {
      income_test_assessment: strOrEmpty(a.centrelink?.incomeTestAssessment),
      asset_test_assessment: strOrEmpty(a.centrelink?.assetTestAssessment),
    },
    beneficiaries: (a.beneficiaries || []).map(mapBeneficiary),
  };
}

function mapDefinedBenefit(db) {
  return {
    owner: strOrEmpty(db.owner),
    scheme: strOrEmpty(db.scheme),
    status: strOrEmpty(db.status),
    date_joined: strOrEmpty(db.dateJoined),
    super_salary: strOrEmpty(db.superSalary),
    salary_growth: strOrEmpty(db.salaryGrowth),
    contribution_rate: strOrEmpty(db.contributionRate),
    years_service: strOrEmpty(db.yearsService),
    expected_exit_age: strOrEmpty(db.expectedExitAge),
    benefit_preference: strOrEmpty(db.benefitPreference),
    combination_lump_pct: strOrEmpty(db.combinationLumpPct),
    member_component: strOrEmpty(db.memberComponent),
    productivity_component: strOrEmpty(db.productivityComponent),
    employer_component: strOrEmpty(db.employerComponent),
    current_abm: strOrEmpty(db.currentAbm),
    ten_year_rule_met: strOrEmpty(db.tenYearRuleMet),
    accumulated_basic_contribs: strOrEmpty(db.accumulatedBasicContribs),
    pre_1976_joiner: strOrEmpty(db.pre1976Joiner),
    planning_54_11: strOrEmpty(db.planning5411),
    preserved_benefit: strOrEmpty(db.preservedBenefit),
    current_pension_annual: strOrEmpty(db.currentPensionAnnual),
    pension_indexed: strOrEmpty(db.pensionIndexed),
    other_scheme_name: strOrEmpty(db.otherSchemeName),
    estimated_annual_pension: strOrEmpty(db.estimatedAnnualPension),
    notes: strOrEmpty(db.notes),
  };
}

function mapTrust(t) {
  return {
    trust_name: strOrEmpty(t.trustName),
    trust_type: strOrEmpty(t.trustType),
    beneficiaries: (t.beneficiaries || []).map((b) => ({
      benef_entity: strOrEmpty(b.benefEntity),
      benef_entitlement: strOrEmpty(b.benefEntitlement),
    })),
  };
}

function mapCompany(c) {
  return {
    company_name: strOrEmpty(c.companyName),
    co_purpose: strOrEmpty(c.coPurpose),
    co_type: strOrEmpty(c.coType),
    co_losses: strOrEmpty(c.coLosses),
    co_profit: strOrEmpty(c.coProfit),
    shareholders: (c.shareholders || []).map((s) => ({
      sh_entity: strOrEmpty(s.shEntity),
      sh_pct: strOrEmpty(s.shPct),
    })),
  };
}

function mapSmsf(s) {
  return {
    smsf_name: strOrEmpty(s.smsfName),
    fund_type: strOrEmpty(s.fundType || "SMSF"),
    trustee_type: strOrEmpty(s.trusteeType),
    acct_type: strOrEmpty(s.acctType),
    smsf_balance: strOrEmpty(s.smsfBalance),
    individual_trustee: strOrEmpty(s.individualTrustee),
    accounts: (s.accounts || []).map((a) => ({
      owner: strOrEmpty(a.owner),
      tax_environment: strOrEmpty(a.taxEnvironment),
      fund_percentage: strOrEmpty(a.fundPercentage),
      balance: strOrEmpty(a.balance),
      tax_free_amt: strOrEmpty(a.taxFreeAmt),
      tax_free_pct: strOrEmpty(a.taxFreePct),
      unp_amt: strOrEmpty(a.unpAmt),
      super_guarantee: strOrEmpty(a.superGuarantee),
      salary_sacrifice: strOrEmpty(a.salarySacrifice),
      after_tax: strOrEmpty(a.afterTax),
      pension_type: strOrEmpty(a.pensionType),
      pension_drawdown: strOrEmpty(a.pensionDrawdown),
      beneficiaries: (a.beneficiaries || []).map((b) => ({
        benef_who: strOrEmpty(b.benefWho),
        benef_type: strOrEmpty(b.benefType),
        benef_entitlement: strOrEmpty(b.benefEntitlement),
      })),
    })),
  };
}

function mapInvestmentBond(b) {
  return {
    product_name: strOrEmpty(b.productName),
    owner: strOrEmpty(b.owner),
    policy_number: strOrEmpty(b.policyNumber),
    balance: strOrEmpty(b.balance),
    commencement_date: strOrEmpty(b.commencementDate),
    tax_treatment: strOrEmpty(b.taxTreatment),
    portfolio: (b.portfolio || []).map(mapPortfolioItem),
  };
}

function mapAsset(a) {
  return {
    a_name: strOrEmpty(a.name),
    a_ownType: strOrEmpty(a.ownType),
    a_owner: strOrEmpty(a.owner),
    a_type: strOrEmpty(a.type),
    a_value: strOrEmpty(a.value),
    a_purchase_price: strOrEmpty(a.purchasePrice),
    a_purchase_date: strOrEmpty(a.purchaseDate),
    a_move_out_date: strOrEmpty(a.moveOutDate),
    a_rental_income: strOrEmpty(a.rentalIncome),
    a_rental_freq: strOrEmpty(a.rentalFreq),
  };
}

function mapLiability(d) {
  return {
    d_name: strOrEmpty(d.name),
    d_ownType: strOrEmpty(d.ownType),
    d_owner: strOrEmpty(d.owner),
    d_type: strOrEmpty(d.type),
    d_rate: strOrEmpty(d.rate),
    d_freq: strOrEmpty(d.freq),
    d_repayments: strOrEmpty(d.repayments),
    d_term: strOrEmpty(d.term),
    d_balance: strOrEmpty(d.balance),
    d_io: strOrEmpty(d.io),
    d_fixed: strOrEmpty(d.fixed),
    d_has_redraw: strOrEmpty(d.hasRedraw),
    d_redraw: strOrEmpty(d.redraw),
    d_redraw_limit: strOrEmpty(d.redrawLimit),
    d_security: d.security || [],
    d_offset: d.offset || [],
  };
}

function mapInsurancePolicy(p) {
  return {
    pol_name: strOrEmpty(p.polName),
    pol_type: strOrEmpty(p.polType),
    pol_tax_env: strOrEmpty(p.polTaxEnv),
    linked_fund_id: strOrEmpty(p.linkedFundId),
    pol_owner: strOrEmpty(p.polOwner),
    pol_insured: strOrEmpty(p.polInsured),
    pol_insurer: strOrEmpty(p.polInsurer),
    pol_number: strOrEmpty(p.polNumber),
    pol_waiting: strOrEmpty(p.polWaiting),
    pol_benefit_period: strOrEmpty(p.polBenefitPeriod),
    sum_insured_life: strOrEmpty(p.sumInsuredLife),
    sum_insured_tpd: strOrEmpty(p.sumInsuredTpd),
    sum_insured_trauma: strOrEmpty(p.sumInsuredTrauma),
    sum_insured_ip: strOrEmpty(p.sumInsuredIp),
    sum_insured_ip2: strOrEmpty(p.sumInsuredIp2),
    premium_life: strOrEmpty(p.premiumLife),
    premium_tpd: strOrEmpty(p.premiumTpd),
    premium_trauma: strOrEmpty(p.premiumTrauma),
    premium_ip: strOrEmpty(p.premiumIp),
    premium_ip2: strOrEmpty(p.premiumIp2),
    pol_freq: strOrEmpty(p.polFreq),
    pol_structure: strOrEmpty(p.polStructure),
  };
}

function mapIncome(inc) {
  if (!inc) return { i_gross: "", i_super_inc: "", i_fbt: "", i_fbt_value: "", i_bonus: "", i_increase: "", i_nontax: "", i_cgt_losses: "", i_revenue_losses: "", adjustments: [] };
  return {
    i_gross: strOrEmpty(inc.gross),
    i_super_inc: strOrEmpty(inc.superInc),
    i_fbt: strOrEmpty(inc.fbt),
    i_fbt_value: strOrEmpty(inc.fbtValue),
    i_bonus: strOrEmpty(inc.bonus),
    i_increase: strOrEmpty(inc.increase),
    i_nontax: strOrEmpty(inc.nontax),
    i_cgt_losses: strOrEmpty(inc.cgtLosses),
    i_revenue_losses: strOrEmpty(inc.revenueLosses),
    adjustments: inc.adjustments || [],
  };
}

function mapExpenses(exp) {
  if (!exp) return { rental_cost: "", rental_freq: "" };
  return {
    rental_cost: strOrEmpty(exp.rentalCost),
    rental_freq: strOrEmpty(exp.rentalFreq),
  };
}

function mapBeneficiary(b) {
  return {
    benef_entity: strOrEmpty(b.benefEntity),
    benef_type: strOrEmpty(b.benefType),
    benef_entitlement: strOrEmpty(b.benefEntitlement),
  };
}

function mapPortfolioItem(p) {
  return {
    asset_name: strOrEmpty(p.assetName),
    asset_code: strOrEmpty(p.assetCode),
    allocation_pct: strOrEmpty(p.allocationPct),
    amount: strOrEmpty(p.amount),
  };
}

function mapAdviceRequest(ar) {
  if (!ar) return {
    scope: {},
    products_entities: { new_trusts: [], new_companies: [], new_smsf: [], products: {} },
    insurance: {},
    transactions: { buy: [], sell: [], debts: [], newSuper: [], newPension: [], rollovers: [] },
    strategy: { models: [], strategies: [] },
    adv_insurance: { client1: null, client2: null, policies: [] },
    tax_super_planning: {
      client1: { condition_of_release: "", condition_of_release_date: "", low_rate_used: "0", bring_forward_triggered: false, bring_forward_year: "", bring_forward_used: "0", tbc_used: "0" },
      client2: { condition_of_release: "", condition_of_release_date: "", low_rate_used: "0", bring_forward_triggered: false, bring_forward_year: "", bring_forward_used: "0", tbc_used: "0" },
    },
    assumptions: { basic: null, returns_entities: [], returns_assets: [], rate_adjustments: [], fees: [] },
    portfolio: { transactions: [] },
    cgt_streaming: {},
  };
  // Pass through — the API stores this in the same nested structure
  return ar;
}


// ─── Engine → API ────────────────────────────────────────────────────────────

/**
 * Reverse mapping: factFind state + strategies → API-compatible payload for saving.
 */
export function engineToApi(factFindState, strategies) {
  const ff = factFindState;

  return {
    client: reverseMapClient(ff.client1),
    partner: ff.client2 ? reverseMapClient(ff.client2) : null,
    children: (ff.children || []).map(reverseMapChild),
    dependants: (ff.dependants_list || []).map(reverseMapDependant),

    superFunds: (ff.superProducts || []).map(reverseMapSuperFund),
    pensions: (ff.pensions || []).map(reverseMapPension),
    annuities: (ff.annuities || []).map(reverseMapAnnuity),
    definedBenefits: (ff.definedBenefits || []).map(reverseMapDefinedBenefit),

    trusts: (ff.trusts || []).map(reverseMapTrust),
    companies: (ff.companies || []).map(reverseMapCompany),
    smsfs: (ff.smsfs || []).map(reverseMapSmsf),

    homeMortgage: ff.homeMortgage,
    investmentBonds: (ff.investmentBonds || []).map(reverseMapInvestmentBond),

    assets: (ff.assets || []).map(reverseMapAsset),
    liabilities: (ff.liabilities || []).map(reverseMapLiability),

    insurancePolicies: (ff.insurance?.policies || []).map(reverseMapInsurancePolicy),

    income: {
      client1: reverseMapIncome(ff.income?.client1),
      client2: reverseMapIncome(ff.income?.client2),
    },
    expenses: reverseMapExpenses(ff.expenses),
    cashflowConfig: ff.cashflowConfig,
    assetAssumptions: ff.assetAssumptions,
    goals: ff.goals,
    adviceReason: ff.advice_reason,
    riskProfile: ff.risk_profile,
    incomeAdjustments: ff.incomeAdjustments,
    expenseAdjustments: ff.expenseAdjustments,
    adviceRequest: ff.advice_request,
    strategies: strategies || ff.advice_request?.strategy?.strategies || [],
  };
}

function reverseMapClient(c) {
  if (!c) return null;
  return {
    firstName: c.first_name,
    lastName: c.last_name,
    gender: c.gender,
    dateOfBirth: c.date_of_birth,
    maritalStatus: c.marital_status,
    livingStatus: c.living_status,
    residentStatus: c.resident_status,
    address: c.address,
    suburb: c.suburb,
    state: c.state,
    country: c.country,
    postcode: c.postcode,
    mobile: c.mobile,
    email: c.email,
    healthStatus: c.health_status,
    smokerStatus: c.smoker_status,
    healthInsurance: c.health_insurance,
    healthIssues: c.health_issues,
    employmentStatus: c.employment_status,
    occupation: c.occupation,
    hoursPerWeek: c.hours_per_week,
    occupationType: c.occupation_type,
    annualLeave: c.annual_leave,
    sickLeave: c.sick_leave,
    longServiceLeave: c.long_service_leave,
    employerName: c.employer_name,
    fbtExempt: c.fbt_exempt,
    fbtCategory: c.fbt_category,
    fbtOtherBenefits: c.fbt_other_benefits,
    employmentLength: c.employment_length,
    hasWill: c.has_will,
    willUpdated: c.will_updated,
    testamentaryTrust: c.testamentary_trust,
    powerOfAttorney: c.power_of_attorney,
    centrelinkBenefits: c.centrelink_benefits,
    benefitType: c.benefit_type,
    concessionCards: c.concession_cards,
  };
}

function reverseMapChild(c) {
  return { name: c.name, dateOfBirth: c.date_of_birth, relationship: c.relationship, financiallyDependent: c.financially_dependent };
}

function reverseMapDependant(d) {
  return { name: d.name, dateOfBirth: d.date_of_birth, relationship: d.relationship, notes: d.notes };
}

function reverseMapSuperFund(s) {
  return {
    owner: s.owner,
    fundName: s.fund_name,
    product: s.product,
    memberNumber: s.member_number,
    balance: s.balance,
    contributions: {
      superGuarantee: s.contributions?.super_guarantee,
      salarySacrifice: s.contributions?.salary_sacrifice,
      salarySacrificeIndexed: s.contributions?.salary_sacrifice_indexed,
      afterTax: s.contributions?.after_tax,
      afterTaxIndexed: s.contributions?.after_tax_indexed,
      spouseReceived: s.contributions?.spouse_received,
      spouseReceivedIndexed: s.contributions?.spouse_received_indexed,
      splitReceived: s.contributions?.split_received,
      splitOutPct: s.contributions?.split_out_pct,
      spouseContributionTo: s.contributions?.spouse_contribution_to,
      spouseContributionToIndexed: s.contributions?.spouse_contribution_to_indexed,
      concessional: s.contributions?.concessional,
    },
    taxComponents: {
      unpAmount: s.tax_components?.unp_amount,
      taxablePortion: s.tax_components?.taxable_portion,
      taxFreePortion: s.tax_components?.tax_free_portion,
    },
    fees: {
      adminFee: s.fees?.admin_fee,
      percentFee: s.fees?.percent_fee,
      insuranceFee: s.fees?.insurance_fee,
      insInflationOn: s.fees?.ins_inflation_on,
      insInflationRate: s.fees?.ins_inflation_rate,
    },
    beneficiaries: (s.beneficiaries || []).map((b) => ({ benefEntity: b.benef_entity, benefType: b.benef_type, benefEntitlement: b.benef_entitlement })),
    portfolio: (s.portfolio || []).map((p) => ({ assetName: p.asset_name, assetCode: p.asset_code, allocationPct: p.allocation_pct, amount: p.amount })),
  };
}

function reverseMapPension(p) {
  return {
    owner: p.owner, fundName: p.fund_name, product: p.product, memberNumber: p.member_number,
    balance: p.balance, pensionType: p.pension_type, drawdownRate: p.drawdown_rate,
    drawdownType: p.drawdown_type, drawdownAmount: p.drawdown_amount,
    drawdownFrequency: p.drawdown_frequency,
    fees: { adminFee: p.fees?.admin_fee, percentFee: p.fees?.percent_fee, insuranceFee: p.fees?.insurance_fee },
    taxComponents: { taxablePortion: p.tax_components?.taxable_portion, taxFreePortion: p.tax_components?.tax_free_portion, taxFreePct: p.tax_components?.tax_free_pct },
    portfolio: (p.portfolio || []).map((i) => ({ assetName: i.asset_name, assetCode: i.asset_code, allocationPct: i.allocation_pct, amount: i.amount })),
  };
}

function reverseMapAnnuity(a) {
  return {
    owner: a.owner, product: a.product, annuityType: a.annuity_type,
    taxEnvironment: a.tax_environment, purchasePrice: a.purchase_price,
    commencementDate: a.commencement_date, maturityDate: a.maturity_date,
    guaranteedPeriod: a.guaranteed_period, residualCapitalValue: a.residual_capital_value,
    cpiIndexed: a.cpi_indexed,
    income: { annualIncome: a.income?.annual_income, frequency: a.income?.frequency, taxFreePct: a.income?.tax_free_pct, taxablePct: a.income?.taxable_pct, deductibleAmount: a.income?.deductible_amount },
    taxComponents: { taxablePortion: a.tax_components?.taxable_portion, taxFreePortion: a.tax_components?.tax_free_portion, taxFreePct: a.tax_components?.tax_free_pct },
    centrelink: { incomeTestAssessment: a.centrelink?.income_test_assessment, assetTestAssessment: a.centrelink?.asset_test_assessment },
    beneficiaries: (a.beneficiaries || []).map((b) => ({ benefEntity: b.benef_entity, benefType: b.benef_type, benefEntitlement: b.benef_entitlement })),
  };
}

function reverseMapDefinedBenefit(db) {
  return {
    owner: db.owner, scheme: db.scheme, status: db.status,
    dateJoined: db.date_joined, superSalary: db.super_salary,
    salaryGrowth: db.salary_growth, contributionRate: db.contribution_rate,
    yearsService: db.years_service, expectedExitAge: db.expected_exit_age,
    benefitPreference: db.benefit_preference, combinationLumpPct: db.combination_lump_pct,
    memberComponent: db.member_component, productivityComponent: db.productivity_component,
    employerComponent: db.employer_component, currentAbm: db.current_abm,
    tenYearRuleMet: db.ten_year_rule_met, accumulatedBasicContribs: db.accumulated_basic_contribs,
    pre1976Joiner: db.pre_1976_joiner, planning5411: db.planning_54_11,
    preservedBenefit: db.preserved_benefit, currentPensionAnnual: db.current_pension_annual,
    pensionIndexed: db.pension_indexed, otherSchemeName: db.other_scheme_name,
    estimatedAnnualPension: db.estimated_annual_pension, notes: db.notes,
  };
}

function reverseMapTrust(t) {
  return {
    trustName: t.trust_name, trustType: t.trust_type,
    beneficiaries: (t.beneficiaries || []).map((b) => ({ benefEntity: b.benef_entity, benefEntitlement: b.benef_entitlement })),
  };
}

function reverseMapCompany(c) {
  return {
    companyName: c.company_name, coPurpose: c.co_purpose, coType: c.co_type,
    coLosses: c.co_losses, coProfit: c.co_profit,
    shareholders: (c.shareholders || []).map((s) => ({ shEntity: s.sh_entity, shPct: s.sh_pct })),
  };
}

function reverseMapSmsf(s) {
  return {
    smsfName: s.smsf_name, fundType: s.fund_type, trusteeType: s.trustee_type,
    acctType: s.acct_type, smsfBalance: s.smsf_balance, individualTrustee: s.individual_trustee,
    accounts: (s.accounts || []).map((a) => ({
      owner: a.owner, taxEnvironment: a.tax_environment, fundPercentage: a.fund_percentage,
      balance: a.balance, taxFreeAmt: a.tax_free_amt, taxFreePct: a.tax_free_pct,
      unpAmt: a.unp_amt, superGuarantee: a.super_guarantee,
      salarySacrifice: a.salary_sacrifice, afterTax: a.after_tax,
      pensionType: a.pension_type, pensionDrawdown: a.pension_drawdown,
      beneficiaries: (a.beneficiaries || []).map((b) => ({ benefWho: b.benef_who, benefType: b.benef_type, benefEntitlement: b.benef_entitlement })),
    })),
  };
}

function reverseMapInvestmentBond(b) {
  return {
    productName: b.product_name, owner: b.owner, policyNumber: b.policy_number,
    balance: b.balance, commencementDate: b.commencement_date,
    taxTreatment: b.tax_treatment,
    portfolio: (b.portfolio || []).map((p) => ({ assetName: p.asset_name, assetCode: p.asset_code, allocationPct: p.allocation_pct, amount: p.amount })),
  };
}

function reverseMapAsset(a) {
  return {
    name: a.a_name, ownType: a.a_ownType, owner: a.a_owner, type: a.a_type,
    value: a.a_value, purchasePrice: a.a_purchase_price, purchaseDate: a.a_purchase_date,
    moveOutDate: a.a_move_out_date, rentalIncome: a.a_rental_income, rentalFreq: a.a_rental_freq,
  };
}

function reverseMapLiability(d) {
  return {
    name: d.d_name, ownType: d.d_ownType, owner: d.d_owner, type: d.d_type,
    rate: d.d_rate, freq: d.d_freq, repayments: d.d_repayments, term: d.d_term,
    balance: d.d_balance, io: d.d_io, fixed: d.d_fixed,
    hasRedraw: d.d_has_redraw, redraw: d.d_redraw, redrawLimit: d.d_redraw_limit,
    security: d.d_security, offset: d.d_offset,
  };
}

function reverseMapInsurancePolicy(p) {
  return {
    polName: p.pol_name, polType: p.pol_type, polTaxEnv: p.pol_tax_env,
    linkedFundId: p.linked_fund_id, polOwner: p.pol_owner, polInsured: p.pol_insured,
    polInsurer: p.pol_insurer, polNumber: p.pol_number, polWaiting: p.pol_waiting,
    polBenefitPeriod: p.pol_benefit_period,
    sumInsuredLife: p.sum_insured_life, sumInsuredTpd: p.sum_insured_tpd,
    sumInsuredTrauma: p.sum_insured_trauma, sumInsuredIp: p.sum_insured_ip,
    sumInsuredIp2: p.sum_insured_ip2,
    premiumLife: p.premium_life, premiumTpd: p.premium_tpd,
    premiumTrauma: p.premium_trauma, premiumIp: p.premium_ip, premiumIp2: p.premium_ip2,
    polFreq: p.pol_freq, polStructure: p.pol_structure,
  };
}

function reverseMapIncome(inc) {
  if (!inc) return null;
  return {
    gross: inc.i_gross, superInc: inc.i_super_inc, fbt: inc.i_fbt,
    fbtValue: inc.i_fbt_value, bonus: inc.i_bonus, increase: inc.i_increase,
    nontax: inc.i_nontax, cgtLosses: inc.i_cgt_losses,
    revenueLosses: inc.i_revenue_losses, adjustments: inc.adjustments,
  };
}

function reverseMapExpenses(exp) {
  if (!exp) return null;
  return { rentalCost: exp.rental_cost, rentalFreq: exp.rental_freq };
}
