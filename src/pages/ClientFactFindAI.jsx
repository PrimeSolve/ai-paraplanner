import React, { useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CashflowModel from '@/cashflow/cashflow-model.jsx';
import { useFactFind } from '@/components/factfind/useFactFind';

/**
 * Convert the DB factFind object (as returned by the useFactFind hook)
 * into the shape that CashflowModel's internal useFactFind hook expects.
 *
 * Manual FactFind pages store all data under client1_fact_find (API: client1FactFind)
 * with sub-keys: personal_details, super_funds, investments, properties, debts,
 * incomes, expenses, insurance_policies, dependants, trusts_companies,
 * advice_reasons, risk_profile, smsf, super_tax.
 * The API also exposes it via client1_profile; we read from both with fallback.
 */
function dbToModelFormat(db) {
  if (!db) return undefined;

  // Read from the same location the manual pages use (client1_fact_find / client1_profile)
  const ff = db.client1_fact_find || db.client1_profile || {};

  const personal = ff.personal_details || {};
  const superData = ff.super_funds || {};
  const rawInvest = ff.investments;
  const incomes = ff.incomes || [];
  const expenses = ff.expenses || [];
  const rawIns = ff.insurance_policies;
  const rawDep = ff.dependants;
  const rawTc = ff.trusts_companies;
  const rawSmsf = ff.smsf;
  const superTaxData = ff.super_tax || {};

  // Handle both flat array (API) and wrapper object (legacy) formats
  const investData = Array.isArray(rawInvest) ? { wraps: rawInvest.filter(i => i.inv_type === 'wrap' || !i.inv_type), bonds: rawInvest.filter(i => i.inv_type === 'bond') } : (rawInvest || {});
  const insData = Array.isArray(rawIns) ? { policies: rawIns } : (rawIns || {});
  const depData = Array.isArray(rawDep) ? { children: rawDep.filter(d => d.dep_type === 'child').map(({ dep_type, ...r }) => r), dependants_list: rawDep.filter(d => d.dep_type === 'dependant').map(({ dep_type, ...r }) => r) } : (rawDep || {});
  const tcData = Array.isArray(rawTc) ? { entities: rawTc } : (rawTc || {});
  const smsfData = Array.isArray(rawSmsf) ? { smsf_details: rawSmsf } : (rawSmsf || {});

  // Map personal_details → client1 (strip out the partner sub-object)
  const { partner, ...client1Fields } = personal;

  // Map incomes/expenses — manual form stores flat objects per person
  // incomes[0] = client income (flat fields + adjustments), incomes[1] = partner
  const clientIncomeEntry = incomes[0] || {};
  const partnerIncomeEntry = incomes[1] || {};
  const expenseEntry = expenses[0] || {};

  // Separate adjustments from income/expense fields
  const { adjustments: clientAdj, ...clientIncFields } = clientIncomeEntry;
  const { adjustments: partnerAdj, ...partnerIncFields } = partnerIncomeEntry;
  const { adjustments: expAdj, ...expFields } = expenseEntry;

  // Map trusts_companies entities into separate arrays
  const entities = tcData.entities || [];
  const trusts = entities.filter(e => e.type === 'trust');
  const companies = entities.filter(e => e.type === 'company');
  const tcCurrentTab = tcData.current_tab || 'trust';
  const tcActiveIndex = tcData.active_index || { trust: 0, company: 0 };
  const smsfActiveIndex = smsfData.active_index ?? 0;

  // Map risk_profile — manual form uses client/partner keys.
  // Spread the raw DB object to preserve extra fields (otherInfo, currentPerson,
  // currentTab, completionPct) that CashflowModel doesn't manage but the manual
  // form saves.  We only remap the person-keyed sub-objects.
  const riskData = ff.risk_profile || {};
  const {
    client: riskClient, partner: riskPartner,
    adjust_risk: riskAdjustRisk,
    ...riskRest               // otherInfo, currentPerson, currentTab, completionPct, etc.
  } = riskData;
  const mappedRiskProfile = {
    ...riskRest,
    client1: riskClient || { answers: {}, score: 0, profile: '' },
    client2: riskPartner || { answers: {}, score: 0, profile: '' },
    mode: riskData.mode || '',
    adjustRisk: riskAdjustRisk || 'no',
  };

  // Map advice_reasons — manual form uses client/partner keys in quick.
  // Spread raw DB object to preserve any extra fields.
  const advData = ff.advice_reasons || {};
  const mappedAdviceReason = {
    ...advData,
    quick: {
      client1: advData.quick?.client || { ret_age: '65' },
      client2: advData.quick?.partner || { ret_age: '67' },
    },
  };

  return {
    client1: {
      first_name: '', last_name: '', gender: '', date_of_birth: '',
      marital_status: '', living_status: '', resident_status: '',
      address: '', suburb: '', state: '', country: 'Australia', postcode: '',
      mobile: '', email: '',
      health_status: '', smoker_status: '', health_insurance: '', health_issues: '',
      employment_status: '', occupation: '', hours_per_week: '',
      occupation_type: '', annual_leave: '', sick_leave: '', long_service_leave: '',
      employer_name: '', fbt_exempt: '', fbt_category: '', fbt_other_benefits: '',
      employment_length: '',
      has_will: '', will_updated: '', testamentary_trust: '',
      power_of_attorney: '',
      centrelink_benefits: '', benefit_type: '', concession_cards: '',
      ...client1Fields,
    },
    client2: partner ? { ...partner } : null,
    children: depData.children || [],
    dependants_list: depData.dependants_list || [],
    _depCurrentTab: depData.current_tab || 'children',
    _depActiveIndex: depData.active_index ?? 0,
    superProducts: superData.funds || [],
    pensions: superData.pensions || [],
    annuities: superData.annuities || [],
    definedBenefits: [],
    trusts,
    companies,
    smsfs: smsfData.smsf_details || [],
    _smsfActiveIndex: smsfActiveIndex,
    _tcCurrentTab: tcCurrentTab,
    _tcActiveIndex: tcActiveIndex,
    homeMortgage: { interestRate: 0.06, remainingYears: 25 },
    investmentBonds: investData.bonds || [],
    assets: ff.properties || [],
    liabilities: ff.debts || [],
    assetsRegister: [],
    debtsRegister: [],
    insurancePolicies: insData.policies || [],
    insurance: { policies: insData.policies || [] },
    _insActiveIdx: insData.active_idx ?? 0,
    income: {
      client1: Object.keys(clientIncFields).length ? clientIncFields : { i_gross: '', i_super_inc: '2', i_fbt: '2', i_fbt_value: '', i_bonus: '', i_increase: '2.5', i_nontax: '2', i_cgt_losses: '', i_revenue_losses: '', adjustments: [] },
      client2: Object.keys(partnerIncFields).length ? partnerIncFields : { i_gross: '', i_super_inc: '2', i_fbt: '2', i_fbt_value: '', i_bonus: '', i_increase: '2.5', i_nontax: '2', i_cgt_losses: '', i_revenue_losses: '', adjustments: [] },
    },
    expenses: expFields,
    cashflowConfig: { livingExpenses: 0, livingExpensesGrowth: 0.025 },
    assetAssumptions: {},
    goals: [],
    advice_reason: mappedAdviceReason,
    risk_profile: mappedRiskProfile,
    incomeAdjustments: clientAdj || [],
    expenseAdjustments: expAdj || [],
    products: {
      lifetimePensions: [],
      annuities: [],
      investmentBonds: investData.bonds || [],
      wraps: investData.wraps || [],
    },
    advice_request: {
      scope: {},
      products_entities: { new_trusts: [], new_companies: [], new_smsf: [], products: {} },
      insurance: {},
      transactions: { buy: [], sell: [], debts: [], newSuper: [], newPension: [], rollovers: [] },
      strategy: { models: [], strategies: [] },
      adv_insurance: { client1: null, client2: null, policies: [] },
      tax_super_planning: {
        client1: superTaxData.client?.super || { condition_of_release: false, condition_of_release_date: '', low_rate_used: '0', bring_forward_triggered: false, bring_forward_year: '', bring_forward_used: '0', tbc_used: '0' },
        client2: superTaxData.partner?.super || { condition_of_release: false, condition_of_release_date: '', low_rate_used: '0', bring_forward_triggered: false, bring_forward_year: '', bring_forward_used: '0', tbc_used: '0' },
      },
      assumptions: { basic: null, returns_entities: [], returns_assets: [], rate_adjustments: [], fees: [] },
      portfolio: { transactions: [] },
      cgt_streaming: {},
    },
  };
}

/**
 * Save the CashflowModel factFind state back to the DB via updateSection().
 *
 * All manual FactFind pages save via updateSection('Client1FactFind', { SubKey: data }).
 * The useFactFind hook deep-merges sub-keys within client1_fact_find, so each sub-key
 * is preserved independently. We use a single call with all sub-keys for efficiency.
 *
 * Sub-key mapping (PascalCase → snake_case via toSnakeKeys in useFactFind):
 *   PersonalDetails  → personal_details
 *   SuperFunds       → super_funds
 *   Investments      → investments
 *   Properties       → properties        (manual pages use Properties, not assets)
 *   Debts            → debts             (manual pages use Debts, not liabilities)
 *   incomes          → incomes           (flat array, not income_sources with nested fields)
 *   expenses         → expenses          (flat array, not nested fields)
 *   InsurancePolicies→ insurance_policies
 *   Dependants       → dependants
 *   TrustsCompanies  → trusts_companies
 *   AdviceReasons    → advice_reasons
 *   RiskProfile      → risk_profile
 *   Smsf             → smsf
 */
async function saveAllSections(modelFF, updateSection) {
  console.log('[ClientFactFindAI] saveAllSections CALLED');

  const { client2: _c2, ...client1Rest } = modelFF.client1 || {};

  // Build incomes array — flat objects with adjustments included (matches manual form)
  const clientIncomeFields = modelFF.income?.client1 || {};
  const incomes = [
    { ...clientIncomeFields, adjustments: modelFF.incomeAdjustments || [] },
  ];
  if (modelFF.client2) {
    const partnerIncomeFields = modelFF.income?.client2 || {};
    incomes.push({ ...partnerIncomeFields, adjustments: [] });
  }

  // Build expenses array — flat objects with adjustments included (matches manual form)
  const expenseFields = modelFF.expenses || {};
  const expenses = [
    { ...expenseFields, adjustments: modelFF.expenseAdjustments || [] },
  ];

  // Merge trusts and companies into entities array (matches FactFindTrusts)
  const trustEntities = (modelFF.trusts || []).map(t => ({ ...t, type: 'trust' }));
  const companyEntities = (modelFF.companies || []).map(c => ({ ...c, type: 'company' }));

  // Map advice_reason — CashflowModel uses client1/client2, manual form uses client/partner.
  // Spread raw object to preserve any extra fields, then override the person-keyed quick.
  const adviceReason = modelFF.advice_reason || {};
  const { client1: aqClient1, client2: aqClient2, ...aqQuickRest } = adviceReason.quick || {};
  const mappedAdviceReasons = {
    ...adviceReason,
    quick: {
      ...aqQuickRest,
      client: aqClient1 || {},
      partner: aqClient2 || {},
    },
  };
  // Remove the CashflowModel-only keys that don't exist in the manual form
  delete mappedAdviceReasons.quick.client1;
  delete mappedAdviceReasons.quick.client2;

  // Map risk_profile — CashflowModel uses client1/client2, manual form uses client/partner.
  // Spread raw object to preserve otherInfo, currentPerson, currentTab, completionPct.
  const riskProfile = modelFF.risk_profile || {};
  const {
    client1: rpClient1, client2: rpClient2, adjustRisk: rpAdjustRisk,
    ...rpRest   // preserves otherInfo, currentPerson, currentTab, completionPct, mode, etc.
  } = riskProfile;
  const mappedRiskProfile = {
    ...rpRest,
    client: rpClient1 || { answers: {}, score: 0, profile: '' },
    partner: rpClient2 || { answers: {}, score: 0, profile: '' },
    adjustRisk: rpAdjustRisk || 'no',
  };

  // Single updateSection call with all sub-keys — deep-merge in useFactFind preserves each
  await updateSection('Client1FactFind', {
    // PersonalDetails (FactFindAboutYou)
    PersonalDetails: {
      ...client1Rest,
      partner: modelFF.client2 || null,
    },

    // SuperFunds (FactFindSuperannuation) — flat array for API compatibility
    SuperFunds: [
      ...(modelFF.superProducts || []).map(f => ({ ...f, type: 'super' })),
      ...(modelFF.pensions || []).map(p => ({ ...p, type: 'pension' })),
      ...(modelFF.annuities || []).map(a => ({ ...a, type: 'annuity' })),
    ],

    // Investments (FactFindInvestment)
    Investments: {
      wraps: modelFF.products?.wraps || [],
      bonds: modelFF.investmentBonds || modelFF.products?.investmentBonds || [],
    },

    // Properties & Debts (FactFindAssetsLiabilities)
    Properties: modelFF.assets || [],
    Debts: modelFF.liabilities || [],

    // incomes & expenses (FactFindIncomeExpenses) — already lowercase in manual form
    incomes,
    expenses,

    // InsurancePolicies (FactFindInsurance)
    InsurancePolicies: {
      activeIdx: modelFF._insActiveIdx ?? 0,
      policies: modelFF.insurancePolicies || modelFF.insurance?.policies || [],
    },

    // Dependants (FactFindDependants)
    Dependants: {
      children: modelFF.children || [],
      dependants_list: modelFF.dependants_list || [],
      currentTab: modelFF._depCurrentTab || 'children',
      activeIndex: modelFF._depActiveIndex ?? 0,
    },

    // TrustsCompanies (FactFindTrusts)
    TrustsCompanies: {
      entities: [...trustEntities, ...companyEntities],
      currentTab: modelFF._tcCurrentTab || 'trust',
      activeIndex: modelFF._tcActiveIndex || { trust: 0, company: 0 },
    },

    // AdviceReasons (FactFindAdviceReason)
    AdviceReasons: mappedAdviceReasons,

    // RiskProfile (FactFindRiskProfile)
    RiskProfile: mappedRiskProfile,

    // Smsf (FactFindSMSF)
    Smsf: {
      smsf_details: modelFF.smsfs || [],
      activeIndex: modelFF._smsfActiveIndex ?? 0,
    },
  });
}

export default function ClientFactFindAI() {
  const navigate = useNavigate();
  const { factFind, loading, error, updateSection, clientId } = useFactFind();

  // Transform DB data → CashflowModel format (only recompute when factFind changes)
  const initialData = useMemo(() => dbToModelFormat(factFind), [factFind]);

  // Debounced save: on every CashflowModel data change, save back to DB
  const saveTimerRef = useRef(null);

  const handleDataChange = useCallback((modelFactFind) => {
    if (!factFind?.id || !updateSection) return;

    // Debounce saves by 2 seconds
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveAllSections(modelFactFind, updateSection).catch(err => {
        console.error('ClientFactFindAI auto-save failed:', err);
      });
    }, 2000);
  }, [factFind?.id, updateSection]);

  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 16, color: '#666' }}>Loading fact find...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 16, color: '#c00' }}>Error loading fact find: {error}</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <CashflowModel
        mode="factfind"
        hideAdvice={true}
        initialData={initialData}
        onDataChange={handleDataChange}
        onBack={() => navigate(-1)}
        clientId={clientId}
      />
    </div>
  );
}
