import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CashflowModel from '@/cashflow/cashflow-model.jsx';
import { useFactFind } from '@/components/factfind/useFactFind';
import { useVoiceSession } from '@/components/factfind/useVoiceSession';

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

export default function ClientFactFindAI() {
  const navigate = useNavigate();
  const { factFind, loading, error, updateSection, clientId } = useFactFind();

  // Transform DB data → CashflowModel format (only recompute when factFind changes)
  const initialData = useMemo(() => dbToModelFormat(factFind), [factFind]);

  const { status: voiceStatus, startVoice, stopVoice } = useVoiceSession({
    factFind,
    updateSection,
    activeTabId: 'dashboard',
    clientId,
  });
  const voiceConnected = voiceStatus === 'connected';
  const voiceConnecting = voiceStatus === 'connecting';

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
    <div style={{ width:'100vw', height:'100vh', overflow:'hidden', position:'relative' }}>
      <CashflowModel
        mode="factfind"
        hideAdvice={true}
        initialData={initialData}
        onBack={() => navigate(-1)}
        clientId={clientId}
      />
      {/* Voice button — fixed bottom right */}
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', alignItems:'center', gap:10 }}>
        {voiceConnected && (
          <div style={{ background:'white', border:'1px solid #E2E8F0', borderRadius:8, padding:'8px 14px', fontSize:13, color:'#059669', fontWeight:500, boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
            🎙️ Sage is listening...
          </div>
        )}
        <button
          onClick={voiceConnected ? stopVoice : startVoice}
          style={{
            width:52, height:52, borderRadius:'50%', border:'none',
            background: voiceConnected ? '#DC2626' : voiceConnecting ? '#D97706' : '#4F46E5',
            color:'white', fontSize:22, cursor:'pointer',
            boxShadow:'0 4px 12px rgba(0,0,0,0.2)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
          {voiceConnected ? '⏹' : voiceConnecting ? '⏳' : '🎙️'}
        </button>
      </div>
    </div>
  );
}
