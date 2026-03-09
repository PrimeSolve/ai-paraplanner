/**
 * Mapping utilities between Base44 FactFind entity format and the Cashflow model format.
 *
 * Base44 FactFind stores data in sections:
 *   personal (with nested partner), dependants, superannuation, investment,
 *   assets_liabilities, income_expenses, insurance, trusts_companies, smsf,
 *   advice_reason, risk_profile, super_tax, etc.
 *
 * Cashflow model expects a flat structure:
 *   client1, client2, children, superProducts, products, assets, liabilities,
 *   income, expenses, goals, risk_profile, advice_reason, etc.
 */

function mapPerson(src) {
  return {
    first_name: src.first_name || '',
    last_name: src.last_name || '',
    gender: src.gender || '',
    date_of_birth: src.date_of_birth || '',
    marital_status: src.marital_status || '',
    living_status: src.living_status || '',
    resident_status: src.resident_status || '',
    address: src.address || '',
    suburb: src.suburb || '',
    state: src.state || '',
    country: src.country || 'Australia',
    postcode: src.postcode || '',
    mobile: src.phone || src.mobile || '',
    email: src.email || '',
    health_status: src.health_status || '',
    smoker_status: src.smoker_status || '',
    health_insurance: src.health_insurance || '',
    health_issues: src.health_issues || '',
    employment_status: src.employment_status || '',
    occupation: src.occupation || '',
    hours_per_week: src.hours_per_week || '',
    occupation_type: src.occupation_type || '',
    annual_leave: src.annual_leave || '',
    sick_leave: src.sick_leave || '',
    long_service_leave: src.long_service_leave || '',
    employer_name: src.employer || src.employer_name || '',
    fbt_exempt: src.fbt_exempt || '',
    fbt_category: src.fbt_category || '',
    fbt_other_benefits: src.fbt_other_benefits || '',
    employment_length: src.employment_length || '',
    has_will: src.has_will || '',
    will_updated: src.will_updated || '',
    testamentary_trust: src.testamentary_trust || '',
    power_of_attorney: src.power_of_attorney || '',
    centrelink_benefits: src.centrelink_benefits || '',
    benefit_type: src.benefit_type || '',
    concession_cards: src.concession_cards || '',
  };
}

function mapPersonBack(src) {
  return {
    first_name: src.first_name,
    last_name: src.last_name,
    gender: src.gender,
    date_of_birth: src.date_of_birth,
    marital_status: src.marital_status,
    living_status: src.living_status,
    resident_status: src.resident_status,
    address: src.address,
    suburb: src.suburb,
    state: src.state,
    country: src.country,
    postcode: src.postcode,
    phone: src.mobile,
    email: src.email,
    health_status: src.health_status,
    smoker_status: src.smoker_status,
    health_insurance: src.health_insurance,
    health_issues: src.health_issues,
    employment_status: src.employment_status,
    occupation: src.occupation,
    hours_per_week: src.hours_per_week,
    occupation_type: src.occupation_type,
    annual_leave: src.annual_leave,
    sick_leave: src.sick_leave,
    long_service_leave: src.long_service_leave,
    employer: src.employer_name,
    employment_length: src.employment_length,
    has_will: src.has_will,
    will_updated: src.will_updated,
    testamentary_trust: src.testamentary_trust,
    power_of_attorney: src.power_of_attorney,
    centrelink_benefits: src.centrelink_benefits,
    benefit_type: src.benefit_type,
    concession_cards: src.concession_cards,
  };
}

const EMPTY_INCOME = {
  client1: { i_gross: '', i_super_inc: '2', i_fbt: '2', i_fbt_value: '', i_bonus: '', i_increase: '2.5', i_nontax: '2', i_cgt_losses: '', i_revenue_losses: '', adjustments: [] },
  client2: { i_gross: '', i_super_inc: '2', i_fbt: '2', i_fbt_value: '', i_bonus: '', i_increase: '2.5', i_nontax: '2', i_cgt_losses: '', i_revenue_losses: '', adjustments: [] },
};

const EMPTY_RISK_PROFILE_CLIENT = {
  answers: {}, score: 0, profile: '', specifiedProfile: '',
  adviserComments: '', clientComments: '', adjustedProfile: '', adjustmentReason: '',
};

const EMPTY_TAX_SUPER_CLIENT = {
  condition_of_release: false, condition_of_release_date: '',
  low_rate_used: '0', bring_forward_triggered: false,
  bring_forward_year: '', bring_forward_used: '0', tbc_used: '0',
};

/**
 * Map a Base44 FactFind record → cashflow model initialData shape.
 */
export function mapFactFindToCashflow(ff) {
  const p = ff.personal || {};
  const partner = p.partner || null;

  const client1 = mapPerson(p);
  const client2 = partner ? mapPerson(partner) : null;

  const deps = ff.dependants || [];
  const superSection = ff.superannuation || {};
  const invSection = ff.investment || {};
  const alSection = ff.assets_liabilities || {};
  const ieSection = ff.income_expenses || {};
  const insSection = ff.insurance || {};
  const tcSection = ff.trusts_companies || {};
  const smsfSection = ff.smsf || {};
  const arSection = ff.advice_reason || {};
  const rpSection = ff.risk_profile || {};
  const stSection = ff.super_tax || {};

  return {
    client1,
    client2,
    children: Array.isArray(deps) ? deps.filter(d => d.relationship === 'child' || d.type === 'child') : [],
    dependants_list: Array.isArray(deps) ? deps : [],
    superProducts: superSection.products || superSection.funds || [],
    products: {
      lifetimePensions: invSection.lifetimePensions || [],
      annuities: invSection.annuities || [],
      investmentBonds: invSection.bonds || invSection.investmentBonds || [],
      wraps: invSection.wraps || [],
    },
    pensions: superSection.pensions || [],
    annuities: superSection.annuities || [],
    definedBenefits: superSection.definedBenefits || [],
    trusts: tcSection.trusts || [],
    companies: tcSection.companies || [],
    smsfs: smsfSection.funds || smsfSection.smsfs || [],
    homeMortgage: alSection.homeMortgage || { interestRate: 0.06, remainingYears: 25 },
    investmentBonds: invSection.bonds || invSection.investmentBonds || [],
    assets: alSection.assets || [],
    liabilities: alSection.liabilities || [],
    assetsRegister: alSection.assetsRegister || [],
    debtsRegister: alSection.debtsRegister || [],
    insurancePolicies: insSection.policies || [],
    insurance: { policies: insSection.policies || [] },
    income: ieSection.income || EMPTY_INCOME,
    expenses: ieSection.expenses || {},
    cashflowConfig: ieSection.cashflowConfig || { livingExpenses: 0, livingExpensesGrowth: 0.025 },
    assetAssumptions: ff.assetAssumptions || {},
    goals: arSection.goals || [],
    advice_reason: {
      reasons: arSection.reasons || [],
      quick: arSection.quick || { client1: { ret_age: '65' }, client2: { ret_age: '67' } },
      objectives: arSection.objectives || [],
    },
    risk_profile: {
      client1: rpSection.client1 || { ...EMPTY_RISK_PROFILE_CLIENT },
      client2: rpSection.client2 || { ...EMPTY_RISK_PROFILE_CLIENT },
      mode: rpSection.mode || '',
      adjustRisk: rpSection.adjustRisk || 'no',
    },
    incomeAdjustments: ieSection.incomeAdjustments || [],
    expenseAdjustments: ieSection.expenseAdjustments || [],
    advice_request: ff.advice_request || {
      scope: {},
      products_entities: { new_trusts: [], new_companies: [], new_smsf: [], products: {} },
      insurance: {},
      transactions: { buy: [], sell: [], debts: [], newSuper: [], newPension: [], rollovers: [] },
      strategy: { models: [], strategies: [] },
      adv_insurance: { client1: null, client2: null, policies: [] },
      tax_super_planning: stSection.tax_super_planning || {
        client1: { ...EMPTY_TAX_SUPER_CLIENT },
        client2: { ...EMPTY_TAX_SUPER_CLIENT },
      },
      assumptions: { basic: null, returns_entities: [], returns_assets: [], rate_adjustments: [], fees: [] },
      portfolio: { transactions: [] },
      cgt_streaming: {},
    },
  };
}

/**
 * Map cashflow model data back → Base44 FactFind sections for saving.
 */
export function mapCashflowToFactFind(data) {
  const c1 = data.client1 || {};
  const c2 = data.client2 || null;

  return {
    personal: {
      ...mapPersonBack(c1),
      partner: c2 ? mapPersonBack(c2) : null,
    },
    dependants: data.dependants_list || data.children || [],
    superannuation: {
      products: data.superProducts || [],
      pensions: data.pensions || [],
      annuities: data.annuities || [],
      definedBenefits: data.definedBenefits || [],
    },
    investment: {
      wraps: data.products?.wraps || [],
      bonds: data.products?.investmentBonds || data.investmentBonds || [],
      lifetimePensions: data.products?.lifetimePensions || [],
      annuities: data.products?.annuities || [],
    },
    assets_liabilities: {
      assets: data.assets || [],
      liabilities: data.liabilities || [],
      assetsRegister: data.assetsRegister || [],
      debtsRegister: data.debtsRegister || [],
      homeMortgage: data.homeMortgage || {},
    },
    income_expenses: {
      income: data.income || {},
      expenses: data.expenses || {},
      cashflowConfig: data.cashflowConfig || {},
      incomeAdjustments: data.incomeAdjustments || [],
      expenseAdjustments: data.expenseAdjustments || [],
    },
    insurance: { policies: data.insurancePolicies || data.insurance?.policies || [] },
    trusts_companies: {
      trusts: data.trusts || [],
      companies: data.companies || [],
    },
    smsf: { funds: data.smsfs || [] },
    advice_reason: data.advice_reason || {},
    risk_profile: data.risk_profile || {},
    super_tax: data.advice_request?.tax_super_planning || {},
    advice_request: data.advice_request || {},
    assetAssumptions: data.assetAssumptions || {},
  };
}

/**
 * Strip Base44 metadata fields that shouldn't be in update payloads.
 */
export function stripMetadata(obj) {
  const clean = { ...obj };
  delete clean.id;
  delete clean.created_date;
  delete clean.updated_date;
  delete clean.created_by;
  delete clean.created_by_id;
  delete clean.entity_name;
  delete clean.app_id;
  delete clean.is_sample;
  delete clean.is_deleted;
  delete clean.deleted_date;
  delete clean.environment;
  return clean;
}
