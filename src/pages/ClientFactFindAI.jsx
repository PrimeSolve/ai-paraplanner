import React, { useMemo, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CashflowModel from '@/cashflow/cashflow-model.jsx';
import { useFactFind } from '@/components/factfind/useFactFind';
import { useCompletionLogic } from '@/components/factfind/useCompletionLogic';
import ProgressBar from '@/components/factfind/ProgressBar';
import FactFindClientDashboard from '@/components/factfind/FactFindClientDashboard';
import LifeTimeline from '@/components/factfind/LifeTimeline';
import FactFindPopup from '@/components/factfind/FactFindPopup';
import { useVoiceSession } from '../components/factfind/useVoiceSession';

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

  // NOTE: PersonalDetails (client1/client2 principal data) is intentionally
  // excluded from this save.  Principal fields are persisted via
  // principalsApi.save() which targets PUT /clients/{id} — the correct
  // endpoint.  Including them here would send them to /advice-requests/{id}
  // instead, overwriting the wrong resource.

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
  // PersonalDetails is NOT included here — it is saved via principalsApi.save()
  // which correctly targets PUT /api/v1/clients/{id}.
  await updateSection('Client1FactFind', {
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

    // Dependants is intentionally excluded from this save — dependant
    // fields are persisted via their own dedicated endpoint, mirroring the
    // same pattern used for PersonalDetails / principalsApi.save().

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

  // Dashboard state
  const [dashView, setDashView] = useState('dashboard');
  const [factFindPopupOpen, setFactFindPopupOpen] = useState(false);
  const [factFindPopupSection, setFactFindPopupSection] = useState(null);

  // Completion logic
  const { calculateAllSectionCompletion } = useCompletionLogic();

  // Transform DB data → CashflowModel format (only recompute when factFind changes)
  const initialData = useMemo(() => dbToModelFormat(factFind), [factFind]);

  // Completion data derived from the DB-level factFind
  const completionData = useMemo(() => calculateAllSectionCompletion(factFind), [factFind, calculateAllSectionCompletion]);

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

  const { status: voiceStatus, startVoice, stopVoice, connected: voiceConnected, connecting: voiceConnecting } = useVoiceSession({
    factFind,
    updateSection,
    activeTabId: factFindPopupSection || 'dashboard',
    clientId,
  });

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
    <div style={{ width:'100vw', height:'100vh', display:'flex', flexDirection:'row', overflow:'hidden' }}>

      {/* LEFT — dashboard */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Top nav */}
        <div style={{ display:'flex', alignItems:'center', background:'white', borderBottom:'1px solid #E2E8F0', padding:'0 16px', height:48, flexShrink:0, gap:0 }}>
          <button onClick={()=>navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'#475569', fontSize:12, fontWeight:500, padding:'0 16px 0 0', borderRight:'1px solid #E2E8F0', height:'100%' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Client
          </button>
          <div style={{ padding:'0 16px', borderRight:'1px solid #E2E8F0', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.1em' }}>Client Fact Find</div>
            <div style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>{factFind?.personal_details?.first_name} {factFind?.personal_details?.last_name}</div>
          </div>
          <div style={{ flex:1 }}/>
          <span style={{ fontSize:11, color:'#94A3B8', marginRight:12 }}>✓ Saved</span>
          <button style={{ display:'flex', alignItems:'center', gap:6, background:'#4F46E5', border:'none', borderRadius:7, padding:'7px 16px', fontSize:12, fontWeight:700, color:'white', cursor:'pointer', marginRight:8 }}>
            + Close Co-pilot
          </button>
          <button onClick={()=>{ setFactFindPopupSection(null); setFactFindPopupOpen(true); }} style={{ display:'flex', alignItems:'center', gap:6, background:'white', border:'1px solid #E2E8F0', borderRadius:7, padding:'7px 14px', fontSize:12, fontWeight:600, color:'#475569', cursor:'pointer' }}>
            📋 Fact Find
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ flexShrink:0, borderBottom:'1px solid #E2E8F0' }}>
          <ProgressBar completionData={completionData} />
        </div>

        {/* Dashboard / Milestones tabs */}
        <div style={{ display:'flex', background:'white', borderBottom:'1px solid #E2E8F0', flexShrink:0 }}>
          {[{id:'dashboard',label:'Dashboard'},{id:'milestones',label:'Milestones'}].map(t=>(
            <button key={t.id} onClick={()=>setDashView(t.id)} style={{ padding:'10px 20px', fontSize:13, fontWeight:600, color:dashView===t.id?'#4F46E5':'#64748B', background:'none', border:'none', borderBottom:dashView===t.id?'2px solid #4F46E5':'2px solid transparent', cursor:'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard content — scrollable */}
        <div style={{ flex:1, overflowY:'auto', background:'#F1F5F9' }}>
          {dashView === 'dashboard' ? (
            <FactFindClientDashboard
              factFind={factFind}
              completionData={completionData}
              onTileClick={(sectionId)=>{ setFactFindPopupSection(sectionId); setFactFindPopupOpen(true); }}
            />
          ) : (
            <LifeTimeline factFind={factFind} />
          )}
        </div>
      </div>

      {/* RIGHT — co-pilot with voice */}
      <div style={{ width:380, flexShrink:0, borderLeft:'1px solid #E2E8F0', background:'white', display:'flex', flexDirection:'column', height:'100vh' }}>
        {/* Indigo header */}
        <div style={{ background:'#4F46E5', flexShrink:0 }}>
          <div style={{ padding:'12px 16px 10px', display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background: voiceConnected ? '#34D399' : '#A5B4FC' }}/>
            <span style={{ fontSize:13, fontWeight:700, color:'white' }}>Co-pilot</span>
            <span style={{ fontSize:10, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:20, padding:'2px 8px', color:'white', fontWeight:600 }}>FACT FIND</span>
            <span style={{ marginLeft:'auto', fontSize:11, color:'rgba(255,255,255,0.7)' }}>
              {factFind?.personal_details?.first_name} {factFind?.personal_details?.last_name}
            </span>
          </div>
          {/* Voice button */}
          <div style={{ padding:'0 16px 14px' }}>
            <button
              onClick={voiceConnected ? stopVoice : startVoice}
              style={{ width:'100%', padding:'11px 0', borderRadius:8, border:'none', cursor:'pointer', background: voiceConnected ? 'rgba(255,255,255,0.2)' : 'white', color: voiceConnected ? 'white' : '#4F46E5', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="12" rx="3"/>
                <path d="M5 10a7 7 0 0014 0"/><line x1="12" y1="19" x2="12" y2="22"/>
                <line x1="8" y1="22" x2="16" y2="22"/>
              </svg>
              {voiceConnecting ? 'Connecting…' : voiceConnected ? 'Connected — tap to end' : 'Speak with your adviser assistant'}
            </button>
          </div>
        </div>

        {/* Chat co-pilot */}
        <div style={{ flex:1, overflowY:'auto', padding:16, background:'#F8FAFC', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ background:'white', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#334155', lineHeight:1.5, border:'1px solid #E2E8F0' }}>
            Welcome — this is your financial fact find. Work through each section at your own pace, filling in as much as you can. I'll handle the data entry.
          </div>
          <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:4 }}>Quick start</div>
          {['I have 2 super funds, total balance around $230k','I own my home, worth about $550k','I earn $120k a year, my partner earns $55k','We want to retire at 60','We have 2 kids, ages 8 and 11','We have a mortgage of $410k'].map((q,i)=>(
            <div key={i} style={{ fontSize:12, color:'#475569', padding:'7px 11px', border:'1px solid #E2E8F0', borderRadius:7, cursor:'pointer', background:'white' }}>{q}</div>
          ))}
        </div>
        <div style={{ padding:'12px 16px', borderTop:'1px solid #E2E8F0', background:'white', flexShrink:0 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', border:'1px solid #D1D5DB', borderRadius:8, padding:'8px 12px' }}>
            <input type="text" placeholder="Tell the co-pilot what to add..." style={{ flex:1, border:'none', background:'transparent', fontSize:13, outline:'none', color:'#1E293B' }}/>
            <button style={{ background:'#4F46E5', color:'white', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>▶</button>
          </div>
        </div>
      </div>

      {/* Fact Find popup overlay */}
      {factFindPopupOpen && (
        <FactFindPopup
          section={factFindPopupSection}
          onClose={()=>setFactFindPopupOpen(false)}
        />
      )}
    </div>
  );
}
