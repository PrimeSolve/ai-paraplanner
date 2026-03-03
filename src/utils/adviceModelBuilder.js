/**
 * adviceModelBuilder.js
 *
 * Transforms raw SOA Request form data into a unified adviceModel JSON structure
 * that the cashflow model at paraplanner.primesolve.com.au can consume.
 *
 * The adviceModel is the "advised position" counterpart to the factFind (current position).
 * It is always regenerated from the raw form data — never edited directly.
 */

/**
 * Build the full adviceModel from an SOA Request record.
 *
 * @param {object} soaRequest - The full SOA Request record (snake_case keys from API adapter)
 * @returns {object} The adviceModel structure for the cashflow model
 */
export function buildAdviceModel(soaRequest) {
  if (!soaRequest) return {};

  return {
    scope: buildScope(soaRequest),
    models: buildModels(soaRequest),
    strategies: buildStrategies(soaRequest),
    transactions: buildTransactions(soaRequest),
    products: buildProducts(soaRequest),
    insurance: buildInsurance(soaRequest),
    portfolio: buildPortfolio(soaRequest),
    assumptions: buildAssumptions(soaRequest),
    soa_details: buildSoaDetails(soaRequest),
    _generated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Scope
// ---------------------------------------------------------------------------

function buildScope(soaRequest) {
  const scope = soaRequest.scope_of_advice || {};

  const adviceAreas = [];
  const areaKeys = [
    'superannuation', 'investments', 'insurance_needs',
    'insurance_product_advice', 'retirement_planning',
    'estate_planning', 'debt_management', 'portfolio_review',
    // Extended scope keys from the actual form
    'insurance_business',
    'product_super', 'product_pension', 'product_wrap', 'product_bond',
    'product_annuity', 'product_sma', 'product_other',
    'cashflow_budget', 'cashflow_tax_structures', 'cashflow_estate',
    'retirement_super_contrib', 'retirement_smsf', 'retirement_lumpsum',
    'retirement_pensions', 'retirement_other',
    'assets_review_portfolio', 'assets_new_products',
    'debt_review_levels', 'debt_review_products', 'debt_repayment',
  ];

  for (const key of areaKeys) {
    if (scope[key] === true) {
      adviceAreas.push(key);
    }
  }

  return {
    soaType: scope.soa_type || '',
    adviceAreas,
    additionalNotes: scope.additional_notes || '',
  };
}

// ---------------------------------------------------------------------------
// Models (scenarios)
// ---------------------------------------------------------------------------

function buildModels(soaRequest) {
  const strategy = soaRequest.strategy || {};
  const models = strategy.models || [];

  return models.map((m) => ({
    id: m.id,
    name: m.name || '',
    description: m.description || '',
    drawdownPriority: [
      m.drawdown_priority_1,
      m.drawdown_priority_2,
      m.drawdown_priority_3,
    ].filter(Boolean),
    portfolioPriority: m.portfolio_priority || '',
    surplusPriority: [
      m.surplus_priority_1,
      m.surplus_priority_2,
      m.surplus_priority_3,
    ].filter(Boolean),
    preferredEntityIds: m.preferred_entity_ids || [],
    preferredEntityGearedIds: m.preferred_entity_geared_ids || [],
    entityPropertyIds: m.entity_property_ids || [],
    entityPropertyGearedIds: m.entity_property_geared_ids || [],
  }));
}

// ---------------------------------------------------------------------------
// Strategies (actions to implement)
// ---------------------------------------------------------------------------

function buildStrategies(soaRequest) {
  const strategy = soaRequest.strategy || {};
  const strategies = strategy.strategies || [];

  return strategies.map((s) => ({
    id: s.id,
    strategyId: s.strategy_id || '',
    owner: s.owner_id || '',
    startYear: s.start_year || '',
    endYear: s.end_year || '',
    amount: s.amount || '',
    targetProduct: s.product_id || '',
    targetAsset: s.asset_id || '',
    targetDebt: s.debt_id || '',
    adviceModelIds: s.advice_model_ids || [],
    notes: s.notes || '',
  }));
}

// ---------------------------------------------------------------------------
// Transactions (buy / sell / debts)
// ---------------------------------------------------------------------------

function buildTransactions(soaRequest) {
  const txn = soaRequest.transactions || {};

  return {
    buy: (txn.buy || []).map((b) => ({
      id: b.id,
      description: b.description || '',
      assetType: b.asset_type || '',
      amount: b.amount || '',
      owner: b.owner || b.owner_id || '',
      product: b.product_id || '',
      ownership: b.ownership || '',
      notes: b.notes || '',
    })),
    sell: (txn.sell || []).map((s) => ({
      id: s.id,
      productId: s.product_id || '',
      assetName: s.asset_name || '',
      amount: s.amount || '',
      percentage: s.percentage || '',
      notes: s.notes || '',
    })),
    debts: (txn.debts || []).map((d) => ({
      id: d.id,
      description: d.description || '',
      debtType: d.debt_type || '',
      amount: d.amount || '',
      interestRate: d.interest_rate || '',
      repayment: d.repayment || '',
      term: d.term || '',
      notes: d.notes || '',
    })),
  };
}

// ---------------------------------------------------------------------------
// Products (new products, entities, consolidations)
// ---------------------------------------------------------------------------

function buildProducts(soaRequest) {
  const pe = soaRequest.products_entities || {};

  const mapProductArray = (items) =>
    (items || []).map((p) => ({
      id: p.id,
      productName: p.product_name || '',
      provider: p.provider || '',
      person: p.person || '',
      owner: p.owner || '',
      investmentAmount: p.investment_amount || '',
      notes: p.notes || '',
    }));

  const products = pe.products || {};

  return {
    newTrusts: (pe.new_trusts || []).map((t) => ({
      trustName: t.trust_name || '',
      trustType: t.trust_type || '',
      trustee: t.trustee || '',
      beneficiaries: t.beneficiaries || '',
    })),
    newCompanies: (pe.new_companies || []).map((c) => ({
      companyName: c.company_name || '',
      companyType: c.company_type || '',
      directors: c.directors || '',
      shareholders: c.shareholders || '',
    })),
    newSMSF: (pe.new_smsf || []).map((s) => ({
      smsfName: s.smsf_name || '',
      acctType: s.acct_type || '',
      accounts: s.accounts || [],
    })),
    superannuation: mapProductArray(products.superannuation),
    pension: mapProductArray(products.pension),
    annuity: mapProductArray(products.annuity),
    wrap: mapProductArray(products.wrap),
    bond: mapProductArray(products.bond),
  };
}

// ---------------------------------------------------------------------------
// Insurance
// ---------------------------------------------------------------------------

function buildInsurance(soaRequest) {
  const insuranceNeeds = soaRequest.insurance_needs || {};
  const insurancePolicies = soaRequest.insurance_policies || {};

  return {
    needs: {
      client: insuranceNeeds.client || {},
      partner: insuranceNeeds.partner || {},
    },
    policies: (insurancePolicies.policies || []).map((p) => ({
      id: p.id,
      person: p.person || '',
      policyOwner: p.policy_owner || '',
      insured: p.insured || '',
      provider: p.provider || '',
      productName: p.product_name || '',
      coverType: p.cover_type || '',
      sumInsured: p.sum_insured || '',
      premiumType: p.premium_type || '',
      premiumAmount: p.premium_amount || '',
      waitingPeriod: p.waiting_period || '',
      benefitPeriod: p.benefit_period || '',
      insideSuperFund: p.inside_super_fund || '',
      notes: p.notes || '',
    })),
  };
}

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------

function buildPortfolio(soaRequest) {
  const portfolio = soaRequest.portfolio || {};

  return {
    selectedProductId: portfolio.selectedProductId || portfolio.selected_product_id || '',
    transactions: (portfolio.transactions || []).map((t) => ({
      id: t.id,
      productId: t.product_id || '',
      type: t.type || '',
      investmentOption: t.investment_option || '',
      amount: t.amount || '',
      units: t.units || '',
    })),
  };
}

// ---------------------------------------------------------------------------
// Assumptions & Fees
// ---------------------------------------------------------------------------

function buildAssumptions(soaRequest) {
  const assumptions = soaRequest.assumptions || {};
  const basic = assumptions.basic || {};

  return {
    basic: {
      strategyStartDate: basic.strategy_start_date || '',
      inflationRate: basic.inflation_rate ?? 2.5,
      horizonType: basic.horizon_type || 'le+buffer',
      runUntilAge: basic.run_until_age ?? 100,
      lifeExpectancyBuffer: basic.life_expectancy_buffer ?? 5,
      yearsToRun: basic.years_to_run || null,
      applyDesiredIncome: basic.apply_desired_income || false,
      stopExpensesAtRetirement: basic.stop_expenses_at_retirement || false,
      centrelinkOff: basic.centrelink_off || false,
    },
    returnsEntities: (assumptions.returns_entities || []).map((r) => ({
      id: r.id,
      entityId: r.entityId || r.entity_id || '',
      entityName: r.entityName || r.entity_name || '',
      entityType: r.entityType || r.entity_type || '',
      assumptionType: r.assumption_type || 'Use risk profile',
      growthRate: r.growth_rate ?? '',
      incomeRate: r.income_rate ?? '',
      frankingRate: r.franking_rate ?? '',
    })),
    returnsAssets: (assumptions.returns_assets || []).map((r) => ({
      id: r.id,
      assetId: r.asset_id || '',
      override: r.override || 'No',
      growthRate: r.growth_rate ?? '',
      incomeRate: r.income_rate ?? '',
    })),
    rateAdjustments: (assumptions.rate_adjustments || []).map((r) => ({
      id: r.id,
      debtId: r.debt_id || '',
      adjustmentType: r.adjustment_type || '',
      startYear: r.start_year || '',
      endYear: r.end_year || '',
      rateValue: r.rate_value ?? '',
      rateChange: r.rate_change ?? '',
      adviceModelIds: r.advice_model_ids || [],
    })),
    fees: (assumptions.fees || []).map((f) => ({
      id: f.id,
      feeType: f.fee_type || '',
      basis: f.basis || '',
      amount: f.amount ?? '',
      frequency: f.frequency || '',
      appliesToIds: f.applies_to_ids || [],
      startDate: f.start_date || '',
      endDate: f.end_date || '',
      adviceModelIds: f.advice_model_ids || [],
    })),
  };
}

// ---------------------------------------------------------------------------
// SOA Details
// ---------------------------------------------------------------------------

function buildSoaDetails(soaRequest) {
  const details = soaRequest.soa_details || {};

  return {
    referenceNumber: details.reference_number || '',
    dueDate: details.due_date || '',
    adviserName: details.adviser_name || '',
    adviserArn: details.adviser_arn || '',
    afslNumber: details.afsl_number || '',
    licenseeName: details.licensee_name || '',
    adviserPhone: details.adviser_phone || '',
  };
}
