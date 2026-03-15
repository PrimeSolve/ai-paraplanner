import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFactFind } from '@/components/factfind/useFactFind';
import { useVoiceSession } from '@/components/factfind/useVoiceSession';
import { useCompletionLogic } from '@/components/factfind/useCompletionLogic';
import { getAccessToken } from '@/auth/msalInstance';
import ProgressBar from '@/components/factfind/ProgressBar';
import FactFindClientDashboard from '@/components/factfind/FactFindClientDashboard';
import LifeTimeline from '@/components/factfind/LifeTimeline';
import FactFindPopup from '@/components/factfind/FactFindPopup';

// ─── Co-pilot tool definitions (mirrored from CashflowAssistant) ───
const COPILOT_TOOL_DEFINITIONS = [
  { name: "addSuperFund", description: "Add a new superannuation fund.", input_schema: { type: "object", properties: { owner: { type: "string", enum: ["client1","client2"] }, fund_name: { type: "string" }, product: { type: "string" }, balance: { type: "string" }, salary_sacrifice: { type: "string" }, after_tax: { type: "string" }, percent_fee: { type: "string" }, admin_fee: { type: "string" }, insurance_fee: { type: "string" }, taxable_portion: { type: "string" }, tax_free_portion: { type: "string" } }, required: ["owner","fund_name","balance"] } },
  { name: "addAsset", description: "Add a new asset.", input_schema: { type: "object", properties: { a_name: { type: "string" }, a_type: { type: "string" }, a_owner: { type: "string" }, a_ownType: { type: "string" }, a_value: { type: "string" }, a_purchase_price: { type: "string" }, a_purchase_date: { type: "string" }, a_rental_income: { type: "string" }, a_rental_freq: { type: "string" } }, required: ["a_name","a_type","a_owner","a_ownType","a_value"] } },
  { name: "addLiability", description: "Add a new liability.", input_schema: { type: "object", properties: { d_name: { type: "string" }, d_type: { type: "string" }, d_owner: { type: "string" }, d_ownType: { type: "string" }, d_balance: { type: "string" }, d_rate: { type: "string" }, d_repayments: { type: "string" }, d_freq: { type: "string" }, d_term: { type: "string" }, d_io: { type: "string" }, d_fixed: { type: "string" } }, required: ["d_name","d_type","d_owner","d_ownType","d_balance","d_rate"] } },
  { name: "updateIncome", description: "Update employment income.", input_schema: { type: "object", properties: { client: { type: "string", enum: ["client1","client2"] }, i_gross: { type: "string" }, i_increase: { type: "string" }, i_bonus: { type: "string" } }, required: ["client"] } },
  { name: "updateClient", description: "Update personal details.", input_schema: { type: "object", properties: { client: { type: "string", enum: ["client1","client2"] }, first_name: { type: "string" }, last_name: { type: "string" }, date_of_birth: { type: "string" }, occupation: { type: "string" }, employer_name: { type: "string" }, employment_status: { type: "string" }, gender: { type: "string" }, email: { type: "string" }, mobile: { type: "string" } }, required: ["client"] } },
  { name: "addGoal", description: "Add a financial goal.", input_schema: { type: "object", properties: { o_who: { type: "array", items: { type: "string" } }, o_type: { type: "string" }, o_amount: { type: "string" }, o_start: { type: "string" }, o_end: { type: "string" }, o_importance: { type: "string" }, o_why: { type: "string" } }, required: ["o_who","o_type","o_amount","o_start"] } },
  { name: "updateLivingExpenses", description: "Set annual living expenses.", input_schema: { type: "object", properties: { amount: { type: "number" }, growth: { type: "number" } }, required: ["amount"] } },
  { name: "addChild", description: "Add a child.", input_schema: { type: "object", properties: { name: { type: "string" }, date_of_birth: { type: "string" }, financially_dependent: { type: "string" }, education_status: { type: "string" }, financial_dependence_age: { type: "string" }, health_issues: { type: "string" } }, required: ["name"] } },
  { name: "addDependant", description: "Add a non-child dependant.", input_schema: { type: "object", properties: { name: { type: "string" }, date_of_birth: { type: "string" }, relationship: { type: "string" }, interdependency: { type: "string" }, dependant_until_age: { type: "string" } }, required: ["name"] } },
  { name: "addTrust", description: "Add a trust.", input_schema: { type: "object", properties: { trust_name: { type: "string" }, trust_type: { type: "string" } }, required: ["trust_name"] } },
  { name: "addCompany", description: "Add a company.", input_schema: { type: "object", properties: { company_name: { type: "string" }, co_type: { type: "string" }, co_purpose: { type: "string" }, co_tax_rate: { type: "string" } }, required: ["company_name"] } },
  { name: "addSMSF", description: "Add an SMSF.", input_schema: { type: "object", properties: { smsf_name: { type: "string" }, trustee_type: { type: "string" }, smsf_balance: { type: "string" }, fund_type: { type: "string" }, acct_type: { type: "string" } }, required: ["smsf_name"] } },
  { name: "addInsurancePolicy", description: "Add an insurance policy.", input_schema: { type: "object", properties: { pol_name: { type: "string" }, pol_type: { type: "string" }, pol_owner: { type: "string" }, pol_insured: { type: "string" }, pol_insurer: { type: "string" }, pol_tax_env: { type: "string" }, pol_structure: { type: "string" }, pol_freq: { type: "string" }, sum_insured_life: { type: "string" }, sum_insured_tpd: { type: "string" }, sum_insured_trauma: { type: "string" }, sum_insured_ip: { type: "string" }, premium_life: { type: "string" }, premium_tpd: { type: "string" }, premium_trauma: { type: "string" }, premium_ip: { type: "string" }, pol_waiting: { type: "string" }, pol_benefit_period: { type: "string" }, pol_number: { type: "string" } }, required: ["pol_name","pol_type","pol_owner"] } },
  { name: "updateRiskProfile", description: "Set client risk profile (1-7 or plain English).", input_schema: { type: "object", properties: { client: { type: "string", enum: ["client1","client2"] }, specified_profile: { type: "string" }, score: { type: "number" }, adviser_comments: { type: "string" }, adjusted_profile: { type: "string" }, adjustment_reason: { type: "string" } }, required: ["client","specified_profile"] } },
  { name: "clarify", description: "Ask a clarifying question.", input_schema: { type: "object", properties: { question: { type: "string" } }, required: ["question"] } },
  { name: "summariseChanges", description: "Summarise changes made.", input_schema: { type: "object", properties: { summary: { type: "string" }, count: { type: "number" } }, required: ["summary","count"] } },
];

const COPILOT_QUICK_PROMPTS = [
  "I have 2 super funds, total balance around $280k",
  "I own my home, worth about $950k",
  "We have a mortgage of $420k with Commonwealth Bank",
  "I earn $120k a year, my partner earns $85k",
  "We have 2 kids, ages 8 and 11",
  "We want to retire at 60",
];

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

// ─── Deep-set helper for dot-notation paths (e.g. "income.client1") ───
function deepSet(obj, path, value) {
  const keys = path.split('.');
  const next = { ...obj };
  let cursor = next;
  for (let i = 0; i < keys.length - 1; i++) {
    cursor[keys[i]] = { ...(cursor[keys[i]] || {}) };
    cursor = cursor[keys[i]];
  }
  cursor[keys[keys.length - 1]] = value;
  return next;
}

export default function ClientFactFindAI() {
  const navigate = useNavigate();
  const { factFind, loading, error, updateSection, clientId } = useFactFind();

  // ── Dashboard state ──
  const [dashView, setDashView] = useState('dashboard');
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupSection, setPopupSection] = useState(null);
  const openSection = (id) => { setPopupSection(id); setPopupOpen(true); };

  // ── Transform DB → model format ──
  const initialData = useMemo(() => dbToModelFormat(factFind), [factFind]);

  // ── Local model-format state for co-pilot tool execution ──
  const [modelFF, setModelFF] = useState({});
  const modelFFRef = useRef(modelFF);
  useEffect(() => { if (initialData) { setModelFF(initialData); modelFFRef.current = initialData; } }, [initialData]);
  useEffect(() => { modelFFRef.current = modelFF; }, [modelFF]);

  const updateFF = useCallback((path, value) => {
    setModelFF(prev => {
      const next = deepSet(prev, path, value);
      return next;
    });
  }, []);

  // ── Debounced auto-save back to DB ──
  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (!factFind?.id || !updateSection || !modelFF.client1) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveAllSections(modelFF, updateSection).catch(err => {
        console.error('ClientFactFindAI auto-save failed:', err);
      });
    }, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [modelFF, factFind?.id, updateSection]);

  // ── Completion data ──
  const { calculateAllSectionCompletion } = useCompletionLogic();
  const completionData = useMemo(() => calculateAllSectionCompletion(factFind), [factFind, calculateAllSectionCompletion]);

  // ── Voice / LiveKit ──
  const { status: voiceStatus, startVoice, stopVoice, connected } = useVoiceSession({
    factFind,
    updateSection,
    activeTabId: popupSection || 'dashboard',
    clientId,
  });

  // ── Co-pilot chat state ──
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Welcome \u2014 this is your financial fact find. Work through each section at your own pace, filling in as much as you can. I\u2019ll handle the data entry.",
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activityFeed, setActivityFeed] = useState([]);
  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Client names ──
  const c1 = modelFF.client1 || {};
  const c2 = modelFF.client2 || {};
  const c1Name = ((c1.first_name || "") + " " + (c1.last_name || "")).trim() || "Client 1";
  const c2Name = modelFF.client2 ? ((c2.first_name || "") + " " + (c2.last_name || "")).trim() : null;
  const clientName = c1Name + (c2Name ? ` & ${c2Name}` : "");

  // ── Co-pilot system prompt ──
  const buildSystemPrompt = useCallback(() => {
    const ff = modelFFRef.current;
    const superSummary = (ff.superProducts || []).map(s =>
      `${s.fund_name} (${s.owner === "client1" ? c1Name : (c2Name || "Client 2")}): $${(parseFloat(s.balance)||0).toLocaleString()}`
    ).join(", ") || "None";

    return `You are the PrimeSolve Co-pilot. You write directly into the client fact find using tools.

RULE 1 \u2014 BATCH EXECUTION: When asked to add multiple items, call ALL tool functions before sending any text response.
RULE 2 \u2014 CONFIRMATION: After ALL tool calls complete, send exactly one confirmation message listing every item added.
RULE 3 \u2014 NO CLARIFYING QUESTIONS on high-confidence requests.
RULE 4 \u2014 OWNERSHIP DEFAULTS: Assets/debts default joint. Super \u2014 only ask which client if 2 clients and owner not specified.
RULE 5 \u2014 ASSET TYPE CODES: 1=Principal Residence, 2=Car, 8=Savings, 9=Term Deposit, 12=AU Shares, 13=Intl Shares, 18=Investment Property, 26=Managed Funds, 42=Other.

Current context:
- Client 1: ${c1Name}
- Client 2: ${c2Name || "none"}
- Super funds: ${superSummary}
- Assets: ${(ff.assets||[]).length}
- Liabilities: ${(ff.liabilities||[]).length}
- Children: ${(ff.children||[]).length}
- Trusts: ${(ff.trusts||[]).length}, Companies: ${(ff.companies||[]).length}, SMSFs: ${(ff.smsfs||[]).length}
- Insurance policies: ${(ff.insurance?.policies||[]).length}`;
  }, [c1Name, c2Name]);

  // ── Co-pilot tool execution ──
  const executeTool = useCallback((toolName, toolInput) => {
    const ff = modelFFRef.current;
    switch (toolName) {
      case "addSuperFund": {
        const newFund = { owner: toolInput.owner, fund_name: toolInput.fund_name, product: toolInput.product || "", member_number: "", balance: toolInput.balance, contributions: { super_guarantee: "", salary_sacrifice: toolInput.salary_sacrifice || "", salary_sacrifice_indexed: false, after_tax: toolInput.after_tax || "", after_tax_indexed: false, spouse_received: "", spouse_received_indexed: false, split_received: "", split_out_pct: "", concessional: "" }, tax_components: { unp_amount: "", taxable_portion: toolInput.taxable_portion || "", tax_free_portion: toolInput.tax_free_portion || "" }, fees: { admin_fee: toolInput.admin_fee || "", percent_fee: toolInput.percent_fee || "", insurance_fee: toolInput.insurance_fee || "", ins_inflation_on: false, ins_inflation_rate: "" }, beneficiaries: [], portfolio: toolInput.product ? [{ asset_name: toolInput.product, allocation_pct: "100", amount: toolInput.balance }] : [] };
        updateFF("superProducts", [...(ff.superProducts || []), newFund]);
        return { success: true, summary: `Added super: ${toolInput.fund_name} \u2014 $${Number(toolInput.balance).toLocaleString()}` };
      }
      case "addAsset": {
        updateFF("assets", [...(ff.assets || []), { a_name: toolInput.a_name, a_type: toolInput.a_type, a_owner: toolInput.a_owner, a_ownType: toolInput.a_ownType, a_value: toolInput.a_value, a_purchase_price: toolInput.a_purchase_price || "", a_purchase_date: toolInput.a_purchase_date || "", a_rental_income: toolInput.a_rental_income || "", a_rental_freq: toolInput.a_rental_freq || "" }]);
        return { success: true, summary: `Added asset: ${toolInput.a_name} \u2014 $${Number(toolInput.a_value).toLocaleString()}` };
      }
      case "addLiability": {
        updateFF("liabilities", [...(ff.liabilities || []), { d_name: toolInput.d_name, d_type: toolInput.d_type, d_owner: toolInput.d_owner, d_ownType: toolInput.d_ownType, d_balance: toolInput.d_balance, d_rate: toolInput.d_rate, d_repayments: toolInput.d_repayments || "", d_freq: toolInput.d_freq || "12", d_term: toolInput.d_term || "", d_io: toolInput.d_io || "2", d_fixed: toolInput.d_fixed || "2", d_has_redraw: "2", d_redraw: "", d_redraw_limit: "", d_security: [], d_offset: [] }]);
        return { success: true, summary: `Added liability: ${toolInput.d_name} \u2014 $${Number(toolInput.d_balance).toLocaleString()} @ ${toolInput.d_rate}%` };
      }
      case "updateIncome": {
        const { client, ...fields } = toolInput;
        updateFF(`income.${client}`, { ...(ff.income?.[client] || {}), ...fields });
        return { success: true, summary: `Updated income: ${client === "client1" ? c1Name : (c2Name || "Client 2")}${fields.i_gross ? ` \u2014 $${Number(fields.i_gross).toLocaleString()} gross` : ""}` };
      }
      case "updateClient": {
        const { client, ...fields } = toolInput;
        updateFF(client, { ...ff[client], ...fields });
        return { success: true, summary: `Updated client details: ${client}` };
      }
      case "addGoal": {
        const objectives = ff.advice_reason?.objectives || [];
        updateFF("advice_reason.objectives", [...objectives, { o_who: toolInput.o_who, o_type: toolInput.o_type, o_amount: toolInput.o_amount, o_start: toolInput.o_start, o_end: toolInput.o_end || toolInput.o_start, o_freq: "5", o_property: "", o_debt: "", o_asset: "", o_importance: toolInput.o_importance || "2", o_why: toolInput.o_why || "" }]);
        return { success: true, summary: `Added goal: ${toolInput.o_why || "Goal"} \u2014 $${Number(toolInput.o_amount).toLocaleString()}` };
      }
      case "updateLivingExpenses": {
        updateFF("cashflowConfig", { ...ff.cashflowConfig, livingExpenses: toolInput.amount, livingExpensesGrowth: toolInput.growth ?? 0.025 });
        return { success: true, summary: `Living expenses: $${Number(toolInput.amount).toLocaleString()} p.a.` };
      }
      case "addChild": {
        updateFF("children", [...(ff.children || []), { name: toolInput.name, date_of_birth: toolInput.date_of_birth || "", financially_dependent: toolInput.financially_dependent || "1", education_status: toolInput.education_status || "", financial_dependence_age: toolInput.financial_dependence_age || "", health_issues: toolInput.health_issues || "" }]);
        return { success: true, summary: `Added child: ${toolInput.name}` };
      }
      case "addDependant": {
        updateFF("dependants_list", [...(ff.dependants_list || []), { name: toolInput.name, date_of_birth: toolInput.date_of_birth || "", relationship: toolInput.relationship || "", interdependency: toolInput.interdependency || "2", dependant_until_age: toolInput.dependant_until_age || "" }]);
        return { success: true, summary: `Added dependant: ${toolInput.name}` };
      }
      case "addTrust": {
        updateFF("trusts", [...(ff.trusts || []), { trust_name: toolInput.trust_name, trust_type: toolInput.trust_type || "1", beneficiaries: [] }]);
        return { success: true, summary: `Added trust: ${toolInput.trust_name}` };
      }
      case "addCompany": {
        updateFF("companies", [...(ff.companies || []), { company_name: toolInput.company_name, co_type: toolInput.co_type || "1", co_purpose: toolInput.co_purpose || "2", co_tax_rate: toolInput.co_tax_rate || "25", co_losses: "", shareholders: [], pnl: { total_revenue: "", total_expenses: "", revenue_growth_rate: "3", expense_growth_rate: "3", income_lines: [], expense_lines: [] }, share_capital: "", retained_earnings: "", franking_account_balance: "" }]);
        return { success: true, summary: `Added company: ${toolInput.company_name}` };
      }
      case "addSMSF": {
        updateFF("smsfs", [...(ff.smsfs || []), { smsf_name: toolInput.smsf_name, fund_type: toolInput.fund_type || "1", trustee_type: toolInput.trustee_type || "1", acct_type: toolInput.acct_type || "1", smsf_balance: toolInput.smsf_balance || "", individual_trustee: "", accounts: [] }]);
        return { success: true, summary: `Added SMSF: ${toolInput.smsf_name}` };
      }
      case "addInsurancePolicy": {
        const policies = ff.insurance?.policies || [];
        updateFF("insurance", { ...(ff.insurance || {}), policies: [...policies, { pol_name: toolInput.pol_name, pol_type: toolInput.pol_type || "", pol_tax_env: toolInput.pol_tax_env || "", pol_owner: toolInput.pol_owner || "", pol_insured: toolInput.pol_insured || toolInput.pol_owner || "", pol_insurer: toolInput.pol_insurer || "", pol_number: toolInput.pol_number || "", pol_structure: toolInput.pol_structure || "1", pol_freq: toolInput.pol_freq || "1", pol_waiting: toolInput.pol_waiting || "", pol_benefit_period: toolInput.pol_benefit_period || "", linked_fund_id: "", sum_insured_life: toolInput.sum_insured_life || "", sum_insured_tpd: toolInput.sum_insured_tpd || "", sum_insured_trauma: toolInput.sum_insured_trauma || "", sum_insured_ip: toolInput.sum_insured_ip || "", sum_insured_ip2: "", premium_life: toolInput.premium_life || "", premium_tpd: toolInput.premium_tpd || "", premium_trauma: toolInput.premium_trauma || "", premium_ip: toolInput.premium_ip || "", premium_ip2: "" }] });
        return { success: true, summary: `Added insurance: ${toolInput.pol_name}` };
      }
      case "updateRiskProfile": {
        const plainToCode = { defensive: "1", conservative: "2", moderate: "3", balanced: "4", growth: "5", "high growth": "6", aggressive: "7" };
        const riskData = ff.risk_profile || { client1: { answers: {}, score: 0, profile: "" }, client2: { answers: {}, score: 0, profile: "" }, mode: "", adjustRisk: "no" };
        const code = plainToCode[toolInput.specified_profile.toLowerCase()] || toolInput.specified_profile;
        updateFF("risk_profile", { ...riskData, [toolInput.client]: { ...riskData[toolInput.client], specifiedProfile: code, profile: code, score: toolInput.score ?? riskData[toolInput.client]?.score ?? 0, adviserComments: toolInput.adviser_comments || "", adjustedProfile: toolInput.adjusted_profile || "", adjustmentReason: toolInput.adjustment_reason || "" } });
        const profileLabels = { "1":"Defensive","2":"Conservative","3":"Moderate","4":"Balanced","5":"Growth","6":"High Growth","7":"Aggressive" };
        return { success: true, summary: `Risk profile: ${toolInput.client === "client1" ? c1Name : c2Name} \u2014 ${profileLabels[code] || code}` };
      }
      case "clarify":
        return { success: true, summary: null, clarificationQuestion: toolInput.question };
      case "summariseChanges":
        return { success: true, summary: `\u2713 ${toolInput.count} change${toolInput.count !== 1 ? "s" : ""} \u2014 ${toolInput.summary}`, isFinal: true };
      default:
        return { success: false, summary: `Unknown tool: ${toolName}` };
    }
  }, [updateFF, c1Name, c2Name]);

  // ── Co-pilot API call ──
  const processResponse = useCallback(async (apiMessages) => {
    const token = await getAccessToken();
    const response = await fetch("https://api.primesolve.com.au/api/v1/copilot/message", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 8192, system: buildSystemPrompt(), tools: COPILOT_TOOL_DEFINITIONS, messages: apiMessages }),
    });
    return await response.json();
  }, [buildSystemPrompt]);

  // ── Send message ──
  const sendMessage = useCallback(async (userInput) => {
    const text = userInput || chatInput.trim();
    if (!text || chatLoading) return;
    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setChatInput("");
    setChatLoading(true);

    let apiMessages = updatedMessages.filter(m => m.role === "user" || m.role === "assistant").map(m => ({ role: m.role, content: m.content }));
    let round = 0;
    const MAX_TOOL_ROUNDS = 10;

    try {
      while (round < MAX_TOOL_ROUNDS) {
        round++;
        const data = await processResponse(apiMessages);
        if (data.stop_reason === "max_tokens") {
          setMessages(prev => [...prev, { role: "assistant", content: "My response was cut short. Please try a smaller batch." }]);
          break;
        }
        const toolResults = [];
        let hasToolUse = false;
        for (const block of (data.content || [])) {
          if (block.type === "tool_use") {
            hasToolUse = true;
            const result = executeTool(block.name, block.input);
            toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
            if (result.summary) setActivityFeed(prev => [...prev, { id: block.id, toolName: block.name, summary: result.summary, success: result.success }]);
            if (result.clarificationQuestion) setMessages(prev => [...prev, { role: "assistant", content: result.clarificationQuestion }]);
          }
          if (block.type === "text" && block.text?.trim()) setMessages(prev => [...prev, { role: "assistant", content: block.text }]);
        }
        if (!hasToolUse) break;
        apiMessages = [...apiMessages, { role: "assistant", content: data.content }, { role: "user", content: toolResults }];
        if (data.stop_reason === "end_turn") break;
      }
    } catch (err) {
      console.error("sendMessage error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setChatLoading(false);
  }, [chatInput, chatLoading, messages, processResponse, executeTool]);

  // ── Loading / Error ──
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

  // ── Counts for co-pilot context strip ──
  const superCount = (modelFF.superProducts || []).length;
  const assetCount = (modelFF.assets || []).length;
  const debtCount = (modelFF.liabilities || []).length;
  const childCount = (modelFF.children || []).length;
  const entityCount = (modelFF.trusts || []).length + (modelFF.companies || []).length + (modelFF.smsfs || []).length;
  const insCount = (modelFF.insurance?.policies || []).length;

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>

      {/* ═══ LEFT PANEL — Dashboard ═══ */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>

        {/* Top nav bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', background: '#fff', borderBottom: '1px solid #E2E8F0', gap: 12, flexShrink: 0 }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#64748B', fontWeight: 500 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6"/></svg>
            Back to Client
          </button>
          <div style={{ width: 1, height: 20, background: '#E2E8F0' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Client Fact Find</span>
          <span style={{ fontSize: 12, color: '#64748B' }}>/ {clientName}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>{"\u2713"} Saved</span>
          </div>
        </div>

        {/* Progress bar strip */}
        <ProgressBar completionData={completionData} onContinue={openSection} />

        {/* Dashboard / Milestones tab toggle */}
        <div style={{ display: 'flex', gap: 0, background: '#fff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
          {['dashboard', 'milestones'].map(tab => (
            <button
              key={tab}
              onClick={() => setDashView(tab)}
              style={{
                padding: '10px 24px', fontSize: 13, fontWeight: 600,
                color: dashView === tab ? '#4F46E5' : '#64748B',
                background: 'none', border: 'none',
                borderBottom: dashView === tab ? '2px solid #4F46E5' : '2px solid transparent',
                cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {tab === 'dashboard' ? 'Dashboard' : 'Milestones'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {dashView === 'dashboard' ? (
          <FactFindClientDashboard
            factFind={factFind}
            completionData={completionData}
            onTileClick={openSection}
          />
        ) : (
          <LifeTimeline factFind={factFind} />
        )}
      </div>

      {/* ═══ RIGHT PANEL — Co-pilot ═══ */}
      <div style={{ width: 380, flexShrink: 0, borderLeft: '1px solid #E2E8F0', background: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>

        {/* Co-pilot header */}
        <div style={{ background: '#4F46E5', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#34D399' : '#A5B4FC' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Co-pilot</span>
          <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '2px 8px', color: 'white', fontWeight: 600 }}>FACT FIND</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{clientName}</span>
        </div>

        {/* Voice button */}
        <div style={{ background: '#4F46E5', padding: '0 16px 14px', flexShrink: 0 }}>
          <button
            onClick={connected ? stopVoice : startVoice}
            style={{ width: '100%', padding: '11px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: connected ? 'rgba(255,255,255,0.2)' : 'white', color: connected ? 'white' : '#4F46E5', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3"/>
              <path d="M5 10a7 7 0 0014 0"/><line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="8" y1="22" x2="16" y2="22"/>
            </svg>
            {connected ? 'Connected \u2014 tap to end' : voiceStatus === 'connecting' ? 'Connecting\u2026' : 'Speak with your adviser assistant'}
          </button>
        </div>

        {/* Context strip */}
        <div style={{ padding: '6px 14px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 4, flexWrap: 'wrap', flexShrink: 0 }}>
          <span style={{ background: 'rgba(79,70,229,0.1)', color: '#4F46E5', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 12, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{c1Name}</span>
          {c2Name && <span style={{ background: 'rgba(6,182,212,0.1)', color: '#0891B2', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 12, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{c2Name}</span>}
          <span style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 12, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{superCount} super</span>
          <span style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 12, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{assetCount} assets</span>
          <span style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 12, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{debtCount} debts</span>
          <span style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 12, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{childCount} children</span>
          <span style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 12, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{entityCount} entities</span>
          <span style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 12, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{insCount} policies</span>
        </div>

        {/* Activity feed */}
        <div style={{ padding: '6px 14px', borderBottom: '1px solid #E2E8F0', maxHeight: 120, overflowY: 'auto', background: '#F8FAFC', flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', marginBottom: 4 }}>
            ACTIVITY \u2014 {activityFeed.length} change{activityFeed.length !== 1 ? 's' : ''} this session
          </div>
          {activityFeed.length === 0 && <div style={{ fontSize: 10, color: '#94A3B8', fontStyle: 'italic' }}>No changes yet</div>}
          {activityFeed.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 2 }}>
              <span style={{ fontSize: 10, color: item.success ? '#059669' : '#EF4444', marginTop: 1, flexShrink: 0 }}>{item.success ? '\u2713' : '\u2717'}</span>
              <span style={{ fontSize: 10, color: '#475569', lineHeight: 1.5 }}>{item.summary}</span>
            </div>
          ))}
        </div>

        {/* Chat messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, background: '#F8FAFC' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '88%', padding: '9px 13px',
                borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: m.role === 'user' ? '#4F46E5' : 'white',
                color: m.role === 'user' ? '#fff' : '#1E293B',
                border: m.role === 'user' ? 'none' : '1px solid #E2E8F0',
                fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap',
              }}>{m.content}</div>
            </div>
          ))}
          {chatLoading && (
            <div style={{ alignSelf: 'flex-start', padding: '9px 13px', background: 'white', borderRadius: '14px 14px 14px 4px', border: '1px solid #E2E8F0', fontSize: 12, color: '#94A3B8' }}>
              {'\u2726'} Thinking...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div style={{ padding: '0 14px 6px', display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 2 }}>QUICK START</div>
            {COPILOT_QUICK_PROMPTS.map((q, i) => (
              <button key={i} onClick={() => sendMessage(q)} style={{
                textAlign: 'left', padding: '6px 9px', background: 'white',
                border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 10,
                color: '#475569', cursor: 'pointer', lineHeight: 1.4,
              }}>{q}</button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8, background: 'white', flexShrink: 0 }}>
          <textarea
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Tell the co-pilot what to add..."
            rows={2}
            style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #CBD5E1', borderRadius: 10, fontSize: 12, resize: 'none', fontFamily: 'inherit', outline: 'none', background: '#F8FAFC', color: '#1E293B' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={chatLoading || !chatInput.trim()}
            style={{
              padding: '10px 16px',
              background: chatLoading || !chatInput.trim() ? '#CBD5E1' : '#4F46E5',
              color: chatLoading || !chatInput.trim() ? '#94A3B8' : '#fff',
              border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 12,
              cursor: chatLoading || !chatInput.trim() ? 'default' : 'pointer',
              alignSelf: 'flex-end', flexShrink: 0,
            }}
          >{chatLoading ? '...' : 'Send'}</button>
        </div>
      </div>

      {/* ═══ Popup overlay ═══ */}
      <FactFindPopup
        open={popupOpen}
        section={popupSection}
        factFind={factFind}
        updateFF={updateSection}
        onClose={() => setPopupOpen(false)}
      />
    </div>
  );
}
