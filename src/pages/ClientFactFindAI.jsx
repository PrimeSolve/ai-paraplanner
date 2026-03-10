import React, { useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CashflowModel from '@/cashflow/cashflow-model.jsx';
import { useFactFind } from '@/components/factfind/useFactFind';

/**
 * Convert the DB factFind object (as returned by the useFactFind hook)
 * into the shape that CashflowModel's internal useFactFind hook expects.
 */
function dbToModelFormat(db) {
  if (!db) return undefined;

  const personal = db.personal || {};
  const superData = db.superannuation || {};
  const investData = db.investment || {};
  const alData = db.assets_liabilities || {};
  const insData = db.insurance || {};
  const depData = db.dependants || {};
  const tcData = db.trusts_companies || {};
  const smsfData = db.smsf || {};

  // Map personal → client1 (strip out the partner sub-object)
  const { partner, ...client1Fields } = personal;

  // Read income/expenses from client1_profile (same key the API returns and
  // FactFindIncomeExpenses reads from). Each income object is a flat field map
  // with an embedded `adjustments` array.
  const profileIncomes = db.client1_profile?.incomes || [];
  const profileExpenses = db.client1_profile?.expenses || [];
  const clientIncomeObj = profileIncomes[0] || {};
  const partnerIncomeObj = profileIncomes[1] || {};
  const expenseObj = profileExpenses[0] || {};
  const { adjustments: clientIncAdj, ...clientIncFields } = clientIncomeObj;
  const { adjustments: partnerIncAdj, ...partnerIncFields } = partnerIncomeObj;
  const { adjustments: expAdj, ...expFields } = expenseObj;

  // Map trusts_companies entities into separate arrays
  const entities = tcData.entities || [];
  const trusts = entities.filter(e => e.type === 'trust');
  const companies = entities.filter(e => e.type === 'company');

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
    assets: alData.assets || [],
    liabilities: alData.liabilities || [],
    assetsRegister: [],
    debtsRegister: [],
    insurancePolicies: insData.policies || [],
    insurance: { policies: insData.policies || [] },
    income: {
      client1: Object.keys(clientIncFields).length ? clientIncFields : { i_gross: '', i_super_inc: '2', i_fbt: '2', i_fbt_value: '', i_bonus: '', i_increase: '2.5', i_nontax: '2', i_cgt_losses: '', i_revenue_losses: '', adjustments: [] },
      client2: Object.keys(partnerIncFields).length ? partnerIncFields : { i_gross: '', i_super_inc: '2', i_fbt: '2', i_fbt_value: '', i_bonus: '', i_increase: '2.5', i_nontax: '2', i_cgt_losses: '', i_revenue_losses: '', adjustments: [] },
    },
    expenses: Object.keys(expFields).length ? expFields : {},
    cashflowConfig: { livingExpenses: 0, livingExpensesGrowth: 0.025 },
    assetAssumptions: {},
    goals: [],
    advice_reason: db.advice_reason || { reasons: [], quick: { client1: { ret_age: '65' }, client2: { ret_age: '67' } }, objectives: [] },
    risk_profile: db.risk_profile || { client1: { answers: {}, score: 0, profile: '' }, client2: { answers: {}, score: 0, profile: '' }, mode: '', adjustRisk: 'no' },
    incomeAdjustments: clientIncAdj || [],
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
        client1: { condition_of_release: false, condition_of_release_date: '', low_rate_used: '0', bring_forward_triggered: false, bring_forward_year: '', bring_forward_used: '0', tbc_used: '0' },
        client2: { condition_of_release: false, condition_of_release_date: '', low_rate_used: '0', bring_forward_triggered: false, bring_forward_year: '', bring_forward_used: '0', tbc_used: '0' },
      },
      assumptions: { basic: null, returns_entities: [], returns_assets: [], rate_adjustments: [], fees: [] },
      portfolio: { transactions: [] },
      cgt_streaming: {},
    },
  };
}

/**
 * Save the CashflowModel factFind state back to the DB via updateSection().
 * Calls updateSection for each section that maps to a DB section key.
 */
async function saveAllSections(modelFF, updateSection) {
  console.log('[ClientFactFindAI] saveAllSections CALLED');
  console.log('[ClientFactFindAI] modelFF.income:', JSON.stringify(modelFF.income, null, 2));
  console.log('[ClientFactFindAI] modelFF.expenses:', JSON.stringify(modelFF.expenses));
  console.log('[ClientFactFindAI] modelFF.incomeAdjustments:', JSON.stringify(modelFF.incomeAdjustments));

  const { client2, ...client1Rest } = modelFF.client1 || {};

  // personal
  await updateSection('personal', {
    ...client1Rest,
    partner: modelFF.client2 || null,
  });

  // superannuation
  await updateSection('superannuation', {
    funds: modelFF.superProducts || [],
    pensions: modelFF.pensions || [],
    annuities: modelFF.annuities || [],
  });

  // investment
  await updateSection('investment', {
    wraps: modelFF.products?.wraps || [],
    bonds: modelFF.investmentBonds || modelFF.products?.investmentBonds || [],
  });

  // assets_liabilities
  await updateSection('assets_liabilities', {
    assets: modelFF.assets || [],
    liabilities: modelFF.liabilities || [],
  });

  // income_expenses — save to Client1FactFind with the same { incomes, expenses }
  // structure that FactFindIncomeExpenses uses, so the API stores it under
  // client1Profile where all pages read from.
  const incomes = [
    { ...(modelFF.income?.client1 || {}), adjustments: modelFF.incomeAdjustments || [] },
  ];
  if (modelFF.client2) {
    incomes.push({ ...(modelFF.income?.client2 || {}), adjustments: [] });
  }
  const expenses = [
    { ...(modelFF.expenses || {}), adjustments: modelFF.expenseAdjustments || [] },
  ];
  const incomeExpensesPayload = { incomes, expenses };
  console.log('[ClientFactFindAI] income_expenses PAYLOAD:', JSON.stringify(incomeExpensesPayload, null, 2));
  await updateSection('Client1FactFind', incomeExpensesPayload);

  // insurance
  await updateSection('insurance', {
    policies: modelFF.insurancePolicies || modelFF.insurance?.policies || [],
  });

  // dependants
  await updateSection('dependants', {
    children: modelFF.children || [],
    dependants_list: modelFF.dependants_list || [],
  });

  // trusts_companies — merge trusts and companies back into entities array
  const trustEntities = (modelFF.trusts || []).map(t => ({ ...t, type: 'trust' }));
  const companyEntities = (modelFF.companies || []).map(c => ({ ...c, type: 'company' }));
  await updateSection('trusts_companies', {
    entities: [...trustEntities, ...companyEntities],
  });

  // advice_reason
  if (modelFF.advice_reason) {
    await updateSection('advice_reason', modelFF.advice_reason);
  }

  // risk_profile
  if (modelFF.risk_profile) {
    await updateSection('risk_profile', modelFF.risk_profile);
  }
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
