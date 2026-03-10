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
  const investData = ff.investments || {};
  const incomes = ff.incomes || [];
  const expenses = ff.expenses || [];
  const insData = ff.insurance_policies || {};
  const depData = ff.dependants || {};
  const tcData = ff.trusts_companies || {};
  const smsfData = ff.smsf || {};
  const superTaxData = ff.super_tax || {};

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

  // Map risk_profile — manual form uses client/partner keys
  const riskData = ff.risk_profile || {};
  const mappedRiskProfile = {
    client1: riskData.client || { answers: {}, score: 0, profile: '' },
    client2: riskData.partner || { answers: {}, score: 0, profile: '' },
    mode: riskData.mode || '',
    adjustRisk: riskData.adjust_risk || 'no',
  };

  // Map advice_reasons — manual form uses client/partner keys in quick
  const advData = ff.advice_reasons || {};
  const mappedAdviceReason = {
    reasons: advData.reasons || [],
    quick: {
      client1: advData.quick?.client || { ret_age: '65' },
      client2: advData.quick?.partner || { ret_age: '67' },
    },
    objectives: advData.objectives || [],
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
    superProducts: superData.funds || [],
    pensions: superData.pensions || [],
    annuities: superData.annuities || [],
    definedBenefits: [],
    trusts,
    companies,
    smsfs: smsfData.smsf_details || [],
    homeMortgage: { interestRate: 0.06, remainingYears: 25 },
    investmentBonds: investData.bonds || [],
    assets: ff.properties || [],
    liabilities: ff.debts || [],
    assetsRegister: [],
    debtsRegister: [],
    insurancePolicies: insData.policies || [],
    insurance: { policies: insData.policies || [] },
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

  // Map advice_reason — CashflowModel uses client1/client2, manual form uses client/partner
  const adviceReason = modelFF.advice_reason || {};
  const mappedAdviceReasons = {
    reasons: adviceReason.reasons || [],
    quick: {
      client: adviceReason.quick?.client1 || {},
      partner: adviceReason.quick?.client2 || {},
    },
    objectives: adviceReason.objectives || [],
  };

  // Map risk_profile — CashflowModel uses client1/client2, manual form uses client/partner
  const riskProfile = modelFF.risk_profile || {};
  const mappedRiskProfile = {
    client: riskProfile.client1 || { answers: {}, score: 0, profile: '' },
    partner: riskProfile.client2 || { answers: {}, score: 0, profile: '' },
    mode: riskProfile.mode || '',
    adjustRisk: riskProfile.adjustRisk || 'no',
  };

  // Single updateSection call with all sub-keys — deep-merge in useFactFind preserves each
  await updateSection('Client1FactFind', {
    // PersonalDetails (FactFindAboutYou)
    PersonalDetails: {
      ...client1Rest,
      partner: modelFF.client2 || null,
    },

    // SuperFunds (FactFindSuperannuation)
    SuperFunds: {
      funds: modelFF.superProducts || [],
      pensions: modelFF.pensions || [],
      annuities: modelFF.annuities || [],
    },

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
      policies: modelFF.insurancePolicies || modelFF.insurance?.policies || [],
    },

    // Dependants (FactFindDependants)
    Dependants: {
      children: modelFF.children || [],
      dependants_list: modelFF.dependants_list || [],
    },

    // TrustsCompanies (FactFindTrusts)
    TrustsCompanies: {
      entities: [...trustEntities, ...companyEntities],
    },

    // AdviceReasons (FactFindAdviceReason)
    AdviceReasons: mappedAdviceReasons,

    // RiskProfile (FactFindRiskProfile)
    RiskProfile: mappedRiskProfile,

    // Smsf (FactFindSMSF)
    Smsf: {
      smsf_details: modelFF.smsfs || [],
    },
  });
}

export default function ClientFactFindAI() {
  const navigate = useNavigate();
  const { factFind, loading, error, updateSection } = useFactFind();

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
      />
    </div>
  );
}
