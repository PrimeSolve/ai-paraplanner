import { useState, useRef, useCallback } from "react";
import React from "react";
import { _psInitialDark, injectThemeCSS } from "../constants/theme.jsx";
import { principalsApi } from "../../api/principalsApi.js";

export function useFactFind(initialData) {
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

  return {
    factFind, setFactFind, adviceModel1, setAdviceModel1,
    updateFF, updateAdvice, resetAdviceModel,
    addPrincipal, removePrincipal,
    loadPrincipals, savePrincipals,
    debtFreqOverrides, setDebtFreqOverrides,
    debtIOOverrides, setDebtIOOverrides,
    darkMode, setDarkMode,
  };
}
