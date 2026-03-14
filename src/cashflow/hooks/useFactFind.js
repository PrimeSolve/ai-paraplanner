import { useState, useRef, useCallback } from "react";
import React from "react";
import { _psInitialDark, injectThemeCSS } from "../constants/theme.jsx";
import { principalsApi } from "../../api/principalsApi.js";
import { dependantsApi } from "../../api/dependantsApi.js";
import { trustsApi } from "../../api/trustsApi.js";
import { companiesApi } from "../../api/companiesApi.js";
import { smsfApi } from "../../api/smsfApi.js";
import { pensionsApi } from "../../api/pensionsApi.js";
import { annuitiesApi } from "../../api/annuitiesApi.js";
import { definedBenefitsApi } from "../../api/definedBenefitsApi.js";
import { debtsApi } from "../../api/debtsApi.js";
import { expensesApi } from "../../api/expensesApi.js";
import { insuranceApi } from "../../api/insuranceApi.js";
import { investmentWrapsApi } from "../../api/investmentWrapsApi.js";
import { investmentBondsApi } from "../../api/investmentBondsApi.js";
import { useRole } from "../../components/RoleContext.jsx";

export function useFactFind(initialData) {
  // Resolve clientId from navigation chain
  const { navigationChain } = useRole();
  const clientNav = navigationChain?.find(n => n.type === 'client');
  const clientId = clientNav?.id || null;
  const [darkMode, setDarkMode] = useState(_psInitialDark);
  // Inject theme CSS on mount and when darkMode changes
  React.useEffect(() => {
    injectThemeCSS(darkMode);
  }, [darkMode]);
  const [debtFreqOverrides, setDebtFreqOverrides] = useState({});
  const [debtIOOverrides, setDebtIOOverrides] = useState({}); // { debtRef: { yearIdx: "1"(IO)|"2"(P&I) } } // { debtRef: newFreq } e.g. { "debt_0": "26" }

  // Advice model — deep clone of factFind with adviser modifications.
  // Initialize immediately from initialData if available (avoids race with setTimeout).
  const [adviceModel1, setAdviceModel1] = useState(() =>
    initialData ? JSON.parse(JSON.stringify(initialData)) : null
  );
  const [factFind, setFactFind] = useState(initialData || {
    client1: {
      first_name: "", last_name: "", gender: "", date_of_birth: "",
      marital_status: "", living_status: "", resident_status: "",
      address: "", suburb: "", state: "", country: "Australia", postcode: "",
      mobile: "", email: "",
      health_status: "", smoker_status: "", health_insurance: "", health_issues: "",
      employment_status: "", occupation: "", hours_per_week: "",
      occupation_type: "", annual_leave: "", sick_leave: "", long_service_leave: "",
      employer_name: "", fbt_exempt: "", fbt_category: "", fbt_other_benefits: "",
      employment_length: "",
      has_will: "", will_updated: "", testamentary_trust: "",
      power_of_attorney: "",
      centrelink_benefits: "", benefit_type: "", concession_cards: "",
    },
    client2: null,
    children: [],
    dependants_list: [],
    superProducts: [],
    products: { lifetimePensions: [], annuities: [], investmentBonds: [], wraps: [] },
    pensions: [],
    annuities: [],
    definedBenefits: [],
    trusts: [],
    companies: [],
    smsfs: [],
    homeMortgage: { interestRate: 0.06, remainingYears: 25 },
    investmentBonds: [],
    assets: [],
    liabilities: [],
    assetsRegister: [],
    debtsRegister: [],
    insurancePolicies: [],
    insurance: { policies: [] },
    income: {
      client1: { i_gross: "", i_super_inc: "2", i_fbt: "2", i_fbt_value: "", i_bonus: "", i_increase: "2.5", i_nontax: "2", i_cgt_losses: "", i_revenue_losses: "", adjustments: [] },
      client2: { i_gross: "", i_super_inc: "2", i_fbt: "2", i_fbt_value: "", i_bonus: "", i_increase: "2.5", i_nontax: "2", i_cgt_losses: "", i_revenue_losses: "", adjustments: [] },
    },
    expenses: {},
    cashflowConfig: { livingExpenses: 0, livingExpensesGrowth: 0.025 },
    assetAssumptions: {},
    goals: [],
    advice_reason: { reasons: [], quick: { client1: { ret_age: "65" }, client2: { ret_age: "67" } }, objectives: [] },
    risk_profile: { client1: { answers: {}, score: 0, profile: "", specifiedProfile: "", adviserComments: "", clientComments: "", adjustedProfile: "", adjustmentReason: "" }, client2: { answers: {}, score: 0, profile: "", specifiedProfile: "", adviserComments: "", clientComments: "", adjustedProfile: "", adjustmentReason: "" }, mode: "", adjustRisk: "no" },
    incomeAdjustments: [],
    expenseAdjustments: [],
    advice_request: {
      scope: {},
      products_entities: { new_trusts: [], new_companies: [], new_smsf: [], products: {} },
      insurance: {},
      transactions: { buy: [], sell: [], debts: [], newSuper: [], newPension: [], rollovers: [] },
      strategy: { models: [], strategies: [] },
      adv_insurance: { client1: null, client2: null, policies: [] },
      tax_super_planning: {
        client1: { condition_of_release: false, condition_of_release_date: "", low_rate_used: "0", bring_forward_triggered: false, bring_forward_year: "", bring_forward_used: "0", tbc_used: "0" },
        client2: { condition_of_release: false, condition_of_release_date: "", low_rate_used: "0", bring_forward_triggered: false, bring_forward_year: "", bring_forward_used: "0", tbc_used: "0" },
      },
      assumptions: { basic: null, returns_entities: [], returns_assets: [], rate_adjustments: [], fees: [] },
      portfolio: { transactions: [] },
      cgt_streaming: {},
    },
  });

  // Sync factFind when initialData changes (e.g. switching between clients or async load)
  const prevInitialDataRef = useRef(initialData);
  React.useEffect(() => {
    if (initialData && initialData !== prevInitialDataRef.current) {
      prevInitialDataRef.current = initialData;
      setFactFind(initialData);
      setAdviceModel1(JSON.parse(JSON.stringify(initialData)));
    }
  }, [initialData]);

  // Helper to update a nested factFind path
  const updateFF = (path, value) => {
    setFactFind(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
    // Sync fact find changes to advice model so projections stay current
    setAdviceModel1(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  // Initialise advice model from base factFind (effect avoids setting state during render
  // and prevents the race condition that setTimeout causes with async data loading)
  React.useEffect(() => {
    setAdviceModel1(prev =>
      prev === null ? JSON.parse(JSON.stringify(factFind)) : prev
    );
  }, [factFind]);

  // Helper to update advice model (same API as updateFF)
  const updateAdvice = (path, value) => {
    setAdviceModel1(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  // Reset advice model to match current base
  const resetAdviceModel = () => setAdviceModel1(JSON.parse(JSON.stringify(factFind)));

  const addPrincipal = (num) => {
    updateFF(`client${num}`, {
      first_name: "", last_name: "", gender: "", date_of_birth: "",
      marital_status: "", living_status: "", resident_status: "",
      address: "", suburb: "", state: "", country: "Australia", postcode: "",
      mobile: "", email: "",
      health_status: "", smoker_status: "", health_insurance: "", health_issues: "",
      employment_status: "", occupation: "", hours_per_week: "",
      occupation_type: "", annual_leave: "", sick_leave: "", long_service_leave: "",
      employer_name: "", employment_length: "",
      has_will: "", will_updated: "", testamentary_trust: "",
      power_of_attorney: "",
      centrelink_benefits: "", benefit_type: "", concession_cards: "",
    });
  };

  const removePrincipal = (num) => {
    updateFF(`client${num}`, null);
  };

  // ── Principals API integration ──────────────────────────────

  /**
   * Load principal data from GET /clients/{clientId} and merge into
   * the factFind.client1 (and optionally client2) state.
   * @param {string} clientId - The primary client's ID
   * @param {string} [client2Id] - Optional partner/spouse client ID
   */
  const loadPrincipals = useCallback(async (clientId, client2Id) => {
    try {
      const data = await principalsApi.get(clientId);
      setFactFind(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.client1 = { ...next.client1, ...data };
        return next;
      });
      setAdviceModel1(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        next.client1 = { ...next.client1, ...data };
        return next;
      });

      if (client2Id) {
        const data2 = await principalsApi.get(client2Id);
        setFactFind(prev => {
          const next = JSON.parse(JSON.stringify(prev));
          next.client2 = { ...(next.client2 || {}), ...data2 };
          return next;
        });
        setAdviceModel1(prev => {
          if (!prev) return prev;
          const next = JSON.parse(JSON.stringify(prev));
          next.client2 = { ...(next.client2 || {}), ...data2 };
          return next;
        });
      }
    } catch (err) {
      console.error('[useFactFind] Failed to load principals from API:', err);
    }
  }, []);

  /**
   * Save principal data via PUT /clients/{clientId}.
   * Extracts client1/client2 fields from factFind and saves to the API.
   * @param {string} clientId - The primary client's ID
   * @param {string} [client2Id] - Optional partner/spouse client ID
   */
  const savePrincipals = useCallback(async (clientId, client2Id) => {
    try {
      const ff = factFind;
      if (ff.client1) {
        await principalsApi.save(clientId, ff.client1);
      }
      if (client2Id && ff.client2) {
        await principalsApi.save(client2Id, ff.client2);
      }
    } catch (err) {
      console.error('[useFactFind] Failed to save principals to API:', err);
    }
  }, [factFind]);

  // ── Dependants API integration ─────────────────────────────

  /**
   * Load dependants from GET /dependants?clientId={id} and populate
   * factFind.children and factFind.dependants_list based on dep_type.
   * @param {string} clientId - The client ID (GUID)
   */
  const loadDependants = useCallback(async (clientId) => {
    try {
      const records = await dependantsApi.getAll(clientId);
      const arr = Array.isArray(records) ? records : [];
      const children = arr.filter(d => d.dep_type === 'child').map(({ dep_type, ...rest }) => rest);
      const depsList = arr.filter(d => d.dep_type === 'dependant').map(({ dep_type, ...rest }) => rest);

      setFactFind(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.children = children;
        next.dependants_list = depsList;
        return next;
      });
      setAdviceModel1(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        next.children = children;
        next.dependants_list = depsList;
        return next;
      });
    } catch (err) {
      console.error('[useFactFind] Failed to load dependants from API:', err);
    }
  }, []);

  /**
   * Save dependants by syncing the full list via create/update/delete.
   * Compares local state against the API and reconciles differences.
   * @param {string} clientId - The client ID (GUID)
   */
  const saveDependants = useCallback(async (clientId) => {
    try {
      const ff = factFind;
      const localChildren = (ff.children || []).map(c => ({ ...c, dep_type: 'child' }));
      const localDeps = (ff.dependants_list || []).map(d => ({ ...d, dep_type: 'dependant' }));
      const localAll = [...localChildren, ...localDeps];

      // Fetch current server state to diff against
      const serverAll = await dependantsApi.getAll(clientId);
      const serverById = new Map((serverAll || []).filter(r => r.id).map(r => [r.id, r]));

      // Determine which local records have IDs (existing) vs new
      const localById = new Map(localAll.filter(r => r.id).map(r => [r.id, r]));

      // Delete server records not present locally
      for (const serverId of serverById.keys()) {
        if (!localById.has(serverId)) {
          await dependantsApi.remove(serverId);
        }
      }

      // Create or update local records
      for (const rec of localAll) {
        if (rec.id && serverById.has(rec.id)) {
          await dependantsApi.update(rec.id, { ...rec, client_id: clientId });
        } else {
          await dependantsApi.create({ ...rec, client_id: clientId });
        }
      }
    } catch (err) {
      console.error('[useFactFind] Failed to save dependants to API:', err);
    }
  }, [factFind]);

  // ── Trusts API integration ─────────────────────────────────

  /**
   * Load trusts from GET /trusts?clientId={id} and populate
   * factFind.trusts.
   * @param {string} clientId - The client ID (GUID)
   */
  const loadTrusts = useCallback(async (clientId) => {
    try {
      const records = await trustsApi.getAll(clientId);
      const arr = Array.isArray(records) ? records : [];

      setFactFind(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.trusts = arr;
        return next;
      });
      setAdviceModel1(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        next.trusts = arr;
        return next;
      });
    } catch (err) {
      console.error('[useFactFind] Failed to load trusts from API:', err);
    }
  }, []);

  /**
   * Save trusts by syncing the full list via create/update/delete.
   * Compares local state against the API and reconciles differences.
   * @param {string} clientId - The client ID (GUID)
   */
  const saveTrusts = useCallback(async (clientId) => {
    try {
      const ff = factFind;
      const localAll = (ff.trusts || []).map(t => ({ ...t, client_id: clientId }));

      // Fetch current server state to diff against
      const serverAll = await trustsApi.getAll(clientId);
      const serverById = new Map((serverAll || []).filter(r => r.id).map(r => [r.id, r]));

      // Determine which local records have IDs (existing) vs new
      const localById = new Map(localAll.filter(r => r.id).map(r => [r.id, r]));

      // Delete server records not present locally
      for (const serverId of serverById.keys()) {
        if (!localById.has(serverId)) {
          await trustsApi.remove(serverId);
        }
      }

      // Create or update local records
      for (const rec of localAll) {
        if (rec.id && serverById.has(rec.id)) {
          await trustsApi.update(rec.id, rec);
        } else {
          await trustsApi.create(clientId, rec);
        }
      }
    } catch (err) {
      console.error('[useFactFind] Failed to save trusts to API:', err);
    }
  }, [factFind]);

  // ── Companies API integration ──────────────────────────────

  /**
   * Load companies from GET /companies?clientId={id} and populate
   * factFind.companies.
   * @param {string} clientId - The client ID (GUID)
   */
  const loadCompanies = useCallback(async (clientId) => {
    try {
      const records = await companiesApi.getAll(clientId);
      const arr = Array.isArray(records) ? records : [];

      setFactFind(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.companies = arr;
        return next;
      });
      setAdviceModel1(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        next.companies = arr;
        return next;
      });
    } catch (err) {
      console.error('[useFactFind] Failed to load companies from API:', err);
    }
  }, []);

  /**
   * Save companies by syncing the full list via create/update/delete.
   * Compares local state against the API and reconciles differences.
   * @param {string} clientId - The client ID (GUID)
   */
  const saveCompanies = useCallback(async (clientId) => {
    try {
      const ff = factFind;
      const localAll = (ff.companies || []).map(c => ({ ...c, client_id: clientId }));

      // Fetch current server state to diff against
      const serverAll = await companiesApi.getAll(clientId);
      const serverById = new Map((serverAll || []).filter(r => r.id).map(r => [r.id, r]));

      // Determine which local records have IDs (existing) vs new
      const localById = new Map(localAll.filter(r => r.id).map(r => [r.id, r]));

      // Delete server records not present locally
      for (const serverId of serverById.keys()) {
        if (!localById.has(serverId)) {
          await companiesApi.remove(serverId);
        }
      }

      // Create or update local records
      for (const rec of localAll) {
        if (rec.id && serverById.has(rec.id)) {
          await companiesApi.update(rec.id, rec);
        } else {
          await companiesApi.create(clientId, rec);
        }
      }
    } catch (err) {
      console.error('[useFactFind] Failed to save companies to API:', err);
    }
  }, [factFind]);

  // ── SMSFs API integration ────────────────────────────────────

  /**
   * Load SMSFs from GET /smsfs (filtered client-side) and populate
   * factFind.smsfs.
   * @param {string} clientId - The client ID (GUID)
   */
  const loadSmsfs = useCallback(async (clientId) => {
    try {
      const records = await smsfApi.getAll(clientId);
      const arr = Array.isArray(records) ? records : [];

      setFactFind(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.smsfs = arr;
        return next;
      });
      setAdviceModel1(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        next.smsfs = arr;
        return next;
      });
    } catch (err) {
      console.error('[useFactFind] Failed to load SMSFs from API:', err);
    }
  }, []);

  /**
   * Save SMSFs by syncing the full list via create/update/delete.
   * Compares local state against the API and reconciles differences.
   * @param {string} clientId - The client ID (GUID)
   */
  const saveSmsfs = useCallback(async (clientId) => {
    try {
      const ff = factFind;
      const localAll = (ff.smsfs || []).map(s => ({ ...s, client_id: clientId }));

      // Fetch current server state to diff against
      const serverAll = await smsfApi.getAll(clientId);
      const serverById = new Map((serverAll || []).filter(r => r.id).map(r => [r.id, r]));

      // Determine which local records have IDs (existing) vs new
      const localById = new Map(localAll.filter(r => r.id).map(r => [r.id, r]));

      // Delete server records not present locally
      for (const serverId of serverById.keys()) {
        if (!localById.has(serverId)) {
          await smsfApi.remove(serverId);
        }
      }

      // Create or update local records
      for (const rec of localAll) {
        if (rec.id && serverById.has(rec.id)) {
          await smsfApi.update(rec.id, rec);
        } else {
          await smsfApi.create(rec);
        }
      }
    } catch (err) {
      console.error('[useFactFind] Failed to save SMSFs to API:', err);
    }
  }, [factFind]);

  // ── Pensions API integration ──────────────────────────────────

  /**
   * Load pensions from GET /pensions?clientId={id} and populate
   * factFind.pensions.
   * @param {string} clientId - The client ID (GUID)
   */
  const loadPensions = useCallback(async (clientId) => {
    try {
      const records = await pensionsApi.getAll(clientId);
      const arr = Array.isArray(records) ? records : [];

      setFactFind(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.pensions = arr;
        return next;
      });
      setAdviceModel1(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        next.pensions = arr;
        return next;
      });
    } catch (err) {
      console.error('[useFactFind] Failed to load pensions from API:', err);
    }
  }, []);

  /**
   * Save pensions by syncing the full list via create/update/delete.
   * Compares local state against the API and reconciles differences.
   * @param {string} clientId - The client ID (GUID)
   * @param {object} clientGuidMap - Map of owner keys to client GUIDs
   */
  const savePensions = useCallback(async (clientId, clientGuidMap) => {
    try {
      const ff = factFind;
      const localAll = ff.pensions || [];

      // Fetch current server state to diff against
      const serverAll = await pensionsApi.getAll(clientId);
      const serverById = new Map((serverAll || []).filter(r => r.id).map(r => [r.id, r]));

      // Determine which local records have IDs (existing) vs new
      const localById = new Map(localAll.filter(r => r.id).map(r => [r.id, r]));

      // Delete server records not present locally
      for (const serverId of serverById.keys()) {
        if (!localById.has(serverId)) {
          await pensionsApi.remove(serverId);
        }
      }

      // Create or update local records
      for (let i = 0; i < localAll.length; i++) {
        const rec = localAll[i];
        const defaultName = `Pension ${i + 1}`;
        if (rec.id && serverById.has(rec.id)) {
          await pensionsApi.update(rec.id, rec, clientGuidMap);
        } else {
          await pensionsApi.create(rec, clientGuidMap, defaultName);
        }
      }
    } catch (err) {
      console.error('[useFactFind] Failed to save pensions to API:', err);
    }
  }, [factFind]);

  // ── Annuities API integration ──────────────────────────────────

  /**
   * Load annuities from GET /annuities?clientId={id} and populate
   * factFind.annuities.
   * @param {string} clientId - The client ID (GUID)
   */
  const loadAnnuities = useCallback(async (clientId) => {
    try {
      const records = await annuitiesApi.getAll(clientId);
      const arr = Array.isArray(records) ? records : [];

      setFactFind(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.annuities = arr;
        return next;
      });
      setAdviceModel1(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        next.annuities = arr;
        return next;
      });
    } catch (err) {
      console.error('[useFactFind] Failed to load annuities from API:', err);
    }
  }, []);

  /**
   * Save annuities by syncing the full list via create/update/delete.
   * Compares local state against the API and reconciles differences.
   * @param {string} clientId - The client ID (GUID)
   * @param {object} clientGuidMap - Map of owner keys to client GUIDs
   */
  const saveAnnuities = useCallback(async (clientId, clientGuidMap) => {
    try {
      const ff = factFind;
      const localAll = ff.annuities || [];

      // Fetch current server state to diff against
      const serverAll = await annuitiesApi.getAll(clientId);
      const serverById = new Map((serverAll || []).filter(r => r.id).map(r => [r.id, r]));

      // Determine which local records have IDs (existing) vs new
      const localById = new Map(localAll.filter(r => r.id).map(r => [r.id, r]));

      // Delete server records not present locally
      for (const serverId of serverById.keys()) {
        if (!localById.has(serverId)) {
          await annuitiesApi.remove(serverId);
        }
      }

      // Create or update local records
      for (let i = 0; i < localAll.length; i++) {
        const rec = localAll[i];
        const defaultName = `Annuity ${i + 1}`;
        if (rec.id && serverById.has(rec.id)) {
          await annuitiesApi.update(rec.id, rec, clientGuidMap);
        } else {
          await annuitiesApi.create(rec, clientGuidMap, defaultName);
        }
      }
    } catch (err) {
      console.error('[useFactFind] Failed to save annuities to API:', err);
    }
  }, [factFind]);

  // ── Defined Benefits API integration ──────────────────────────

  /**
   * Load defined benefits from GET /defined-benefits?clientId={id} and populate
   * factFind.definedBenefits.
   * @param {string} clientId - The client ID (GUID)
   */
  const loadDefinedBenefits = useCallback(async (clientId) => {
    try {
      const records = await definedBenefitsApi.getAll(clientId);
      const arr = Array.isArray(records) ? records : [];

      setFactFind(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.definedBenefits = arr;
        return next;
      });
      setAdviceModel1(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        next.definedBenefits = arr;
        return next;
      });
    } catch (err) {
      console.error('[useFactFind] Failed to load defined benefits from API:', err);
    }
  }, []);

  /**
   * Save defined benefits by syncing the full list via create/update/delete.
   * Compares local state against the API and reconciles differences by id.
   * @param {string} clientId - The client ID (GUID)
   * @param {object} clientGuidMap - Map of owner keys to client GUIDs
   */
  const saveDefinedBenefits = useCallback(async (clientId, clientGuidMap) => {
    try {
      const ff = factFind;
      const localAll = ff.definedBenefits || [];

      // Fetch current server state to diff against
      const serverAll = await definedBenefitsApi.getAll(clientId);
      const serverById = new Map((serverAll || []).filter(r => r.id).map(r => [r.id, r]));

      // Determine which local records have IDs (existing) vs new
      const localById = new Map(localAll.filter(r => r.id).map(r => [r.id, r]));

      // Delete server records not present locally
      for (const serverId of serverById.keys()) {
        if (!localById.has(serverId)) {
          await definedBenefitsApi.remove(serverId);
        }
      }

      // Create or update local records
      for (const rec of localAll) {
        if (rec.id && serverById.has(rec.id)) {
          await definedBenefitsApi.update(rec.id, rec);
        } else {
          await definedBenefitsApi.create(rec, clientGuidMap);
        }
      }
    } catch (err) {
      console.error('[useFactFind] Failed to save defined benefits to API:', err);
    }
  }, [factFind]);

  // ── Debts API integration ─────────────────────────────────────

  /**
   * Load debts from GET /debts?clientId={id} and populate
   * factFind.liabilities.
   * @param {string} clientId - The client ID (GUID)
   */
  const loadDebts = useCallback(async (clientId) => {
    try {
      const records = await debtsApi.getAll(clientId);
      const arr = Array.isArray(records) ? records : [];

      setFactFind(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.liabilities = arr;
        return next;
      });
      setAdviceModel1(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        next.liabilities = arr;
        return next;
      });
    } catch (err) {
      console.error('[useFactFind] Failed to load debts from API:', err);
    }
  }, []);

  /**
   * Save debts by syncing the full list via create/update/delete.
   * Compares local state against the API and reconciles differences by id.
   * @param {string} clientId - The client ID (GUID)
   * @param {object} clientGuidMap - Map of owner keys to client GUIDs
   */
  const saveDebts = useCallback(async (clientId, clientGuidMap) => {
    try {
      const ff = factFind;
      const localAll = ff.liabilities || [];

      // Fetch current server state to diff against
      const serverAll = await debtsApi.getAll(clientId);
      const serverById = new Map((serverAll || []).filter(r => r.id).map(r => [r.id, r]));

      // Determine which local records have IDs (existing) vs new
      const localById = new Map(localAll.filter(r => r.id).map(r => [r.id, r]));

      // Delete server records not present locally
      for (const serverId of serverById.keys()) {
        if (!localById.has(serverId)) {
          await debtsApi.remove(serverId);
        }
      }

      // Create or update local records
      for (let i = 0; i < localAll.length; i++) {
        const rec = localAll[i];
        const defaultName = `Debt ${i + 1}`;
        if (rec.id && serverById.has(rec.id)) {
          await debtsApi.update(rec.id, rec);
        } else {
          await debtsApi.create(rec, clientGuidMap, defaultName);
        }
      }
    } catch (err) {
      console.error('[useFactFind] Failed to save debts to API:', err);
    }
  }, [factFind]);

  // ── Expenses API integration ─────────────────────────────────

  /**
   * Load expense record from GET /expenses?clientId={id} and populate
   * factFind.expenses with inbound-mapped data.
   * @param {string} clientId - The client ID (GUID)
   */
  const loadExpenses = useCallback(async (clientId) => {
    try {
      const record = await expensesApi.getByClientId(clientId);
      if (!record) return;

      const expenseData = {
        id: record.id,
        e_disc: record.e_disc,
        e_save: record.e_save,
        e_freq: record.e_freq,
        rental_cost: record.rental_cost,
        rental_freq: record.rental_freq,
        adjustments: record.adjustments || [],
      };

      setFactFind(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.expenses = expenseData;
        return next;
      });
      setAdviceModel1(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        next.expenses = expenseData;
        return next;
      });
    } catch (err) {
      console.error('[useFactFind] Failed to load expenses from API:', err);
    }
  }, []);

  /**
   * Save expense record via upsert (POST or PUT).
   * @param {string} clientId - The client ID (GUID)
   */
  const saveExpenses = useCallback(async (clientId) => {
    try {
      const ff = factFind;
      const data = ff.expenses || {};
      const result = await expensesApi.upsert(clientId, data);
      // Store the returned id back into state if it was a new record
      if (result && result.id && !data.id) {
        setFactFind(prev => {
          const next = JSON.parse(JSON.stringify(prev));
          next.expenses = { ...next.expenses, id: result.id };
          return next;
        });
        setAdviceModel1(prev => {
          if (!prev) return prev;
          const next = JSON.parse(JSON.stringify(prev));
          next.expenses = { ...next.expenses, id: result.id };
          return next;
        });
      }
    } catch (err) {
      console.error('[useFactFind] Failed to save expenses to API:', err);
    }
  }, [factFind]);

  // ── Insurance API integration ─────────────────────────────────

  /**
   * Load insurance policies from GET /insurance?clientId={id} and populate
   * factFind.insurance.policies with inbound-mapped data.
   * @param {string} clientId - The client ID (GUID)
   */
  const loadInsurance = useCallback(async (clientId) => {
    try {
      const records = await insuranceApi.getAll(clientId);
      const arr = Array.isArray(records) ? records : [];

      setFactFind(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.insurance = { ...(next.insurance || {}), policies: arr };
        return next;
      });
      setAdviceModel1(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        next.insurance = { ...(next.insurance || {}), policies: arr };
        return next;
      });
    } catch (err) {
      console.error('[useFactFind] Failed to load insurance from API:', err);
    }
  }, []);

  // ── Investments API integration (wraps + bonds) ─────────────

  /**
   * Load investment wraps and bonds in parallel from their respective APIs
   * and populate factFind.wraps and factFind.investmentBonds.
   * @param {string} clientId - The client ID (GUID)
   */
  const loadInvestments = useCallback(async (clientId) => {
    try {
      const [wraps, bonds] = await Promise.all([
        investmentWrapsApi.getAll(clientId),
        investmentBondsApi.getAll(clientId),
      ]);

      setFactFind(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.wraps = Array.isArray(wraps) ? wraps : [];
        next.investmentBonds = Array.isArray(bonds) ? bonds : [];
        return next;
      });
      setAdviceModel1(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        next.wraps = Array.isArray(wraps) ? wraps : [];
        next.investmentBonds = Array.isArray(bonds) ? bonds : [];
        return next;
      });
    } catch (err) {
      console.error('[useFactFind] Failed to load investments from API:', err);
    }
  }, []);

  return {
    factFind, setFactFind, adviceModel1, setAdviceModel1,
    updateFF, updateAdvice, resetAdviceModel,
    addPrincipal, removePrincipal,
    loadPrincipals, savePrincipals,
    loadDependants, saveDependants,
    loadTrusts, saveTrusts,
    loadCompanies, saveCompanies,
    loadSmsfs, saveSmsfs,
    loadPensions, savePensions,
    loadAnnuities, saveAnnuities,
    loadDefinedBenefits, saveDefinedBenefits,
    loadDebts, saveDebts,
    loadExpenses, saveExpenses,
    loadInsurance,
    loadInvestments,
    debtFreqOverrides, setDebtFreqOverrides,
    debtIOOverrides, setDebtIOOverrides,
    darkMode, setDarkMode,
    clientId,
  };
}
