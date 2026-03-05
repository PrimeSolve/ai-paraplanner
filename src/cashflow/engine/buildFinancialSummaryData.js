// Financial Summary / Timeline projection engine
// Extracted from CashflowModelInner — all closure variables converted to explicit ctx parameter

import { ageAtFYStart as _ageAtFYStart, assetCategory, LE_FEMALE, LE_MALE } from "../utils/projectionHelpers.js";
import { buildBondData as _buildBondDataImport } from "./buildEntityData.js";

const LOW_RATE_CAP = 235000;

export const OBJECTIVE_TYPES = [
  { value: "1", label: "Establish An Emergency Fund" }, { value: "2", label: "Reduce Annual Expenses" },
  { value: "3", label: "Increase Cashflow" }, { value: "4", label: "Reduce Your Working Hours" },
  { value: "5", label: "Take A Career Break" }, { value: "6", label: "Send Your Children To Private School" },
  { value: "7", label: "Pay For Childrens University Expenses" }, { value: "8", label: "Provide For Dependants" },
  { value: "9", label: "Go On A Holiday" }, { value: "10", label: "Buy A Car" },
  { value: "11", label: "Gift Money To Children/Dependants" }, { value: "12", label: "Pay For Other School Costs" },
  { value: "13", label: "Allocate Funds For Tutor" }, { value: "14", label: "Allocate Funds For Other Extracurricular Activities" },
  { value: "15", label: "Help A Child Pay For A House" }, { value: "16", label: "Return To Work After Children" },
  { value: "17", label: "Reduce Work Hours To Look After Children" }, { value: "18", label: "Take Parental Leave" },
  { value: "19", label: "Set a wealth target in the future" }, { value: "20", label: "Reduce Exposure To Volatile Growth Investments" },
  { value: "21", label: "Allocate Funds To Low Risk Interest Bearing Assets" }, { value: "22", label: "Retain Investment" },
  { value: "23", label: "Put Aside Funds To Help Children Invest" }, { value: "24", label: "Build A Share Portfolio" },
  { value: "25", label: "Rent Out An Existing Property" }, { value: "26", label: "Purchase A New Principal Residence" },
  { value: "27", label: "Downsize A Principal Residence" }, { value: "28", label: "Move Into A New Rental Property" },
  { value: "29", label: "Purchase A Holiday Home" }, { value: "30", label: "Rent Out Your Holiday Home" },
  { value: "31", label: "Upgrade Your Home" }, { value: "32", label: "Renovate Home" },
  { value: "33", label: "Purchase An Investment Property" }, { value: "34", label: "Eliminate Your Credit Card Debts" },
  { value: "35", label: "Eliminate Your Mortgage" }, { value: "36", label: "Eliminate All Debts" },
  { value: "37", label: "Reduce Investment Debt" }, { value: "38", label: "Reduce Non Deductible Debt" },
  { value: "39", label: "Establish A Reverse Mortgage" }, { value: "40", label: "Increase Investment Debt" },
  { value: "41", label: "Consolidate Debt" }, { value: "42", label: "Increase Contributions To Super" },
  { value: "43", label: "Build Wealth For Your Retirement" }, { value: "46", label: "Move Into Aged Care" },
  { value: "47", label: "Be Assessed For A Home Care Package" }, { value: "48", label: "Establish A Granny Flat Interest Property Transfer" },
  { value: "49", label: "Establish A Granny Flat Interest Dollar Value" }, { value: "50", label: "Bequeath An Amount To Your Estate" },
  { value: "55", label: "Sell An Existing Investment" }, { value: "56", label: "Sell A Portion Of An Existing Investment" },
  { value: "59", label: "Capital Not At Risk Due To Market Fluctuations" },
  { value: "60", label: "Find A Superannuation Product That Is Suitable For Your Requirements" },
  { value: "61", label: "Maximise Centrelink Entitlements" }, { value: "62", label: "Consolidate Superannuation Funds" },
  { value: "63", label: "Update Your Will" },
];

// Resolve DB benefit preference — strategy 118/119/120 overrides fact find
export const resolveDBBenefitPref = (db, dbIdx, engineData, isAdviceModel) => {
  if (!isAdviceModel) return { benefPref: db.benefit_preference || "pension", lumpPct: 0, manualPension: 0, manualLump: 0, useManual: false, startYear: null };
  const allStrats = engineData.advice_request?.strategy?.strategies || [];
  const strats = allStrats.filter(s =>
    (s.strategy_id === "118" || s.strategy_id === "119" || s.strategy_id === "120") &&
    (parseInt(s.db_scheme_idx) || 0) === dbIdx
  );
  if (strats.length === 0) return { benefPref: db.benefit_preference || "pension", lumpPct: 0, manualPension: 0, manualLump: 0, useManual: false, startYear: null };
  const st = strats[strats.length - 1];
  const bp = st.strategy_id === "118" ? "lump_sum" : st.strategy_id === "119" ? "pension" : "combination";
  const lp = bp === "combination" ? Math.min(100, parseFloat(st.db_lump_pct) || 0) / 100 : bp === "lump_sum" ? 1 : 0;
  const useManual = st.db_use_manual === "yes";
  return { benefPref: bp, lumpPct: lp, manualPension: parseFloat(st.db_manual_pension) || 0, manualLump: parseFloat(st.db_manual_lump) || 0, useManual, startYear: parseInt(st.start_year) || null };
};

export const buildFinancialSummaryData = (ctx) => {
  const {
    N_YEARS, PROJ_YEARS, currentFY, shortYears,
    engineData, factFind, isAdviceModel,
    c1Display, c2Display, c1Short, c2Short, c1Gender, c2Gender,
    entityDist, combinedNonSuperIns,
    ffAssets, ffDebts,
    getAssetRates, getAssetDRP, sellLookup, ownerLabel,
    debtFreqOverrides, debtIOOverrides,
    smsfDataList, smsfTabs, bondTabs, superFundTabs, pensionTabs, annuityTabs, smsfSubTabs,
  } = ctx;
  const ageAtFYStart = (dob) => _ageAtFYStart(dob, currentFY);
  const _buildBondData = ctx.buildBondData || _buildBondDataImport;

  const N = N_YEARS;
  const years = PROJ_YEARS;

    // ── Ages ──
    const today = new Date();
    const ageOf = (dob) => {
      if (!dob) return null;
      const d = new Date(dob);
      const fyStart = new Date(currentFY, 6, 1); // 1 July — consistent with super register
      let a = fyStart.getFullYear() - d.getFullYear();
      if (fyStart.getMonth() < d.getMonth() || (fyStart.getMonth() === d.getMonth() && fyStart.getDate() < d.getDate())) a--;
      return a;
    };
    const c1Age = ageOf(engineData.client1?.date_of_birth);
    const c2Age = ageOf(engineData.client2?.date_of_birth);
    const ageRows = [];
    if (c1Age !== null) ageRows.push({ label: "Age", values: Array.from({ length: N }, (_, i) => c1Age + i), style: "header", entity: "Catherine" });
    if (c2Age !== null) ageRows.push({ label: "Age", values: Array.from({ length: N }, (_, i) => c2Age + i), style: "header", entity: "Paul Andrew" });

    // ── Income (from engineData.income) ──
    const c1Gross = parseFloat(engineData.income?.client1?.i_gross) || 0;
    const c2Gross = parseFloat(engineData.income?.client2?.i_gross) || 0;
    const c1Inc = parseFloat(engineData.income?.client1?.i_increase) || 0;
    const c2Inc = parseFloat(engineData.income?.client2?.i_increase) || 0;
    const c1SuperInc = engineData.income?.client1?.i_super_inc; // "1" = included, "2" = excluded
    const c2SuperInc = engineData.income?.client2?.i_super_inc;

    // Retirement year per client
    const ageNowFS = (dob) => {
      if (!dob) return 60;
      const d = new Date(dob); const n = new Date(currentFY, 6, 1); // 1 July of current FY
      let a = n.getFullYear() - d.getFullYear();
      if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
      return a;
    };
    const c1RetAgeFS = parseFloat(engineData.advice_reason?.quick?.client1?.ret_age) || 67;
    const c2RetAgeFS = parseFloat(engineData.advice_reason?.quick?.client2?.ret_age) || 67;
    const c1RetYrFS = Math.max(0, c1RetAgeFS - ageNowFS(engineData.client1?.date_of_birth));
    const c2RetYrFS = Math.max(0, c2RetAgeFS - ageNowFS(engineData.client2?.date_of_birth));

    const projectSalary = (gross, incPct, retYear) => {
      const vals = [];
      let s = gross;
      for (let y = 0; y < N; y++) { vals.push(y >= retYear ? 0 : Math.round(s)); s = s * (1 + incPct / 100); }
      return vals;
    };
    const c1SalaryRaw = projectSalary(c1Gross, c1Inc, c1RetYrFS);
    const c2SalaryRaw = projectSalary(c2Gross, c2Inc, c2RetYrFS);

    // Strategy 158: salary package debt — FBT exempt employers only
    const getFbtCap = (ck) => {
      const cd = engineData[ck] || {};
      if (cd.fbt_exempt !== "1") return 0;
      const cat = cd.fbt_category || "";
      const grossCap = cat === "hospital" ? 9010 : cat === "pbi" ? 15900 : cat === "religious" ? Infinity : 0;
      return Math.max(0, grossCap - (parseFloat(cd.fbt_other_benefits) || 0));
    };
    const c1FbtCap = getFbtCap("client1");
    const c2FbtCap = getFbtCap("client2");

    const strat158s = isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "158") : [];
    const c1Pkg = new Array(N).fill(0);
    const c2Pkg = new Array(N).fill(0);
    strat158s.forEach(s => {
      const amt = Math.min(parseFloat(s.amount) || 0, s.owner_id === "client2" ? c2FbtCap : c1FbtCap);
      if (amt <= 0) return;
      const startYr = Math.max(0, parseInt(s.start_year) - currentFY);
      const endYr = s.end_year === "Ongoing" ? N - 1 : Math.min(N - 1, (parseInt(s.end_year) || currentFY + N) - currentFY);
      for (let y = startYr; y <= endYr; y++) {
        if (s.owner_id === "client2") c2Pkg[y] += amt;
        else c1Pkg[y] += amt;
      }
    });

    // Salary stays GROSS on income row — packaging shows as a named deduction
    const c1Salary = c1SalaryRaw;
    const c2Salary = c2SalaryRaw;

    // Strategy 270: Adjust work hours — reduce salary by a percentage
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "270").forEach(s => {
        const pct = (parseFloat(s.reduction_pct) || 0) / 100;
        if (pct <= 0 || pct > 1) return;
        const startYr = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const endYr = s.end_year === "Ongoing" ? N - 1 : Math.min(N - 1, (parseInt(s.end_year) || currentFY + N) - currentFY);
        const arr = s.owner_id === "client2" ? c2Salary : c1Salary;
        for (let y = startYr; y <= endYr; y++) {
          arr[y] = Math.round(arr[y] * (1 - pct));
        }
      });
    }

    // Strategy 1: Paid Parental Leave — taxable income at national minimum wage
    const PPL_WEEKLY_RATE = 948.10;
    const c1PPL = new Array(N).fill(0);
    const c2PPL = new Array(N).fill(0);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "1").forEach(s => {
        const weeks = parseInt(s.ppl_weeks) || 0;
        if (weeks <= 0) return;
        const totalPay = Math.round(weeks * PPL_WEEKLY_RATE);
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        if (sy >= N) return;
        if (s.owner_id === "client2") c2PPL[sy] += totalPay;
        else c1PPL[sy] += totalPay;
      });
    }
    // Add PPL to salary arrays so it flows through tax
    const c1SalaryExPPL = c1Salary.map(v => v); // copy before PPL
    const c2SalaryExPPL = c2Salary.map(v => v);
    c1PPL.forEach((v, y) => { if (v > 0) c1Salary[y] += v; });
    c2PPL.forEach((v, y) => { if (v > 0) c2Salary[y] += v; });

    // Strategy 210: JobSeeker Payment — taxable income, ceases at Age Pension age (67)
    const JS_FORTNIGHTLY_FS = 789.90;
    const JS_ANNUAL_BASE_FS = Math.round(JS_FORTNIGHTLY_FS * 26);
    const c1JS = new Array(N).fill(0);
    const c2JS = new Array(N).fill(0);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "210").forEach(s => {
        const owner = s.owner_id || "client1";
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const ey = s.end_year === "Ongoing" ? N - 1 : Math.min(N - 1, (parseInt(s.end_year) || currentFY + 30) - currentFY);
        if (sy >= N) return;
        const clientAge = owner === "client1" ? c1Age : c2Age;
        const inflRate = parseFloat(engineData.assumptions?.a_cpi) / 100 || 0.025;
        for (let y = sy; y <= ey && y < N; y++) {
          if ((clientAge + y) >= 67) break;
          const indexed = Math.round(JS_ANNUAL_BASE_FS * Math.pow(1 + inflRate, y));
          if (owner === "client2") c2JS[y] += indexed;
          else c1JS[y] += indexed;
        }
      });
    }
    c1JS.forEach((v, y) => { if (v > 0) c1Salary[y] += v; });
    c2JS.forEach((v, y) => { if (v > 0) c2Salary[y] += v; });

    // Strategy 219: Disability Support Pension — taxable income, ceases at Age Pension age (67) then transitions to Age Pension
    const DSP_SINGLE_FN_FS = 1149.00; // Single 21+, Sep 2025
    const DSP_COUPLE_FN_FS = 866.80;  // Partnered (each), Sep 2025
    const hasPartnerFS = !!engineData.client2?.first_name;
    const DSP_FN_FS = hasPartnerFS ? DSP_COUPLE_FN_FS : DSP_SINGLE_FN_FS;
    const DSP_ANNUAL_BASE_FS = Math.round(DSP_FN_FS * 26);
    const c1DSP = new Array(N).fill(0);
    const c2DSP = new Array(N).fill(0);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "219").forEach(s => {
        const owner = s.owner_id || "client1";
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const ey = s.end_year === "Ongoing" ? N - 1 : Math.min(N - 1, (parseInt(s.end_year) || currentFY + 30) - currentFY);
        if (sy >= N) return;
        const clientAge = owner === "client1" ? c1Age : c2Age;
        const inflRate = parseFloat(engineData.assumptions?.a_cpi) / 100 || 0.025;
        for (let y = sy; y <= ey && y < N; y++) {
          if ((clientAge + y) >= 67) break; // transitions to Age Pension at 67
          const indexed = Math.round(DSP_ANNUAL_BASE_FS * Math.pow(1 + inflRate, y));
          if (owner === "client2") c2DSP[y] += indexed;
          else c1DSP[y] += indexed;
        }
      });
    }
    c1DSP.forEach((v, y) => { if (v > 0) c1Salary[y] += v; });
    c2DSP.forEach((v, y) => { if (v > 0) c2Salary[y] += v; });

    // SG contributions (12% of base salary — if super-inclusive, base = gross / 1.12) — stops at retirement
    const sgRate = 0.12;
    const c1BaseSalary = projectSalary(c1SuperInc === "1" ? c1Gross / (1 + sgRate) : c1Gross, c1Inc, c1RetYrFS);
    const c2BaseSalary = projectSalary(c2SuperInc === "1" ? c2Gross / (1 + sgRate) : c2Gross, c2Inc, c2RetYrFS);
    const c1SG = c1BaseSalary.map(s => Math.round(s * sgRate));
    const c2SG = c2BaseSalary.map(s => Math.round(s * sgRate));
    const c1SalSac = parseFloat(engineData.superProducts?.find(sp => sp.owner === "client1")?.contributions?.salary_sacrifice) || 0;

    // Simple tax estimate (marginal rates)
    const estimateTax = (salary) => {
      if (salary <= 18200) return 0;
      if (salary <= 45000) return Math.round((salary - 18200) * 0.16);
      if (salary <= 135000) return Math.round(4288 + (salary - 45000) * 0.30);
      if (salary <= 190000) return Math.round(31288 + (salary - 135000) * 0.37);
      return Math.round(51638 + (salary - 190000) * 0.45);
    };

    // Rental income from investment properties (split 50/50 for joint)
    const c1RentalVals = new Array(N).fill(0);
    const c2RentalVals = new Array(N).fill(0);
    const c1RentalBreakdown = [];
    const c2RentalBreakdown = [];
    ffAssets.filter(a => a.a_type === "18" || a.a_type === "21" || (a.a_type === "20" && (a.a_hh_rented === "longterm" || a.a_hh_rented === "airbnb" || a.a_hh_rented === "mixed"))).forEach(a => {
      const assetIdx = ffAssets.indexOf(a);
      const weeklyRent = parseFloat(a.a_rental_income) || 0;
      const rentFreq = parseFloat(a.a_rental_freq) || 52;
      const annualRent = weeklyRent * rentFreq;
      const rentGrowth = getAssetRates(assetIdx, a.a_type).growthRate;
      let rent = annualRent;
      const share = a.a_ownType === "2" ? 0.5 : 1;
      const c1Share = (a.a_ownType === "2" || a.a_owner === "client1") ? share : 0;
      const c2Share = (a.a_ownType === "2" || a.a_owner === "client2") ? share : 0;
      if (c1Share > 0) c1RentalBreakdown.push({ name: a.a_name || "Investment Property", value: Math.round(annualRent * c1Share), nav: ["Assets & Liabilities", "Assets", "Property"] });
      if (c2Share > 0) c2RentalBreakdown.push({ name: a.a_name || "Investment Property", value: Math.round(annualRent * c2Share), nav: ["Assets & Liabilities", "Assets", "Property"] });
      for (let y = 0; y < N; y++) {
        c1RentalVals[y] += Math.round(rent * c1Share);
        c2RentalVals[y] += Math.round(rent * c2Share);
        rent = rent * (1 + rentGrowth);
      }
    });
    // Holiday home (type "20") rental income — all assessable, flows if rented
    ffAssets.filter(a => a.a_type === "20" && (a.a_hh_rented === "longterm" || a.a_hh_rented === "airbnb" || a.a_hh_rented === "mixed")).forEach(a => {
      const assetIdx = ffAssets.indexOf(a);
      const weeklyRent = parseFloat(a.a_rental_income) || 0;
      const rentFreq = parseFloat(a.a_rental_freq) || 52;
      const annualRent = weeklyRent * rentFreq;
      const rentGrowth = getAssetRates(assetIdx, a.a_type).growthRate;
      let rent = annualRent;
      const share = a.a_ownType === "2" ? 0.5 : 1;
      const c1Share = (a.a_ownType === "2" || a.a_owner === "client1") ? share : 0;
      const c2Share = (a.a_ownType === "2" || a.a_owner === "client2") ? share : 0;
      if (c1Share > 0) c1RentalBreakdown.push({ name: a.a_name || "Holiday Home", value: Math.round(annualRent * c1Share), nav: ["Assets & Liabilities", "Assets", "Property"] });
      if (c2Share > 0) c2RentalBreakdown.push({ name: a.a_name || "Holiday Home", value: Math.round(annualRent * c2Share), nav: ["Assets & Liabilities", "Assets", "Property"] });
      for (let y = 0; y < N; y++) {
        c1RentalVals[y] += Math.round(rent * c1Share);
        c2RentalVals[y] += Math.round(rent * c2Share);
        rent = rent * (1 + rentGrowth);
      }
    });
    // Absent PR (type "19") rental income — ceases on move-back (strategy 56)
    const moveBackStratsFS = (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "56" && s.moveback_property_idx !== "");
    ffAssets.filter(a => a.a_type === "19").forEach(a => {
      const assetIdx = ffAssets.indexOf(a);
      const mbFS = moveBackStratsFS.find(s => parseInt(s.moveback_property_idx) === assetIdx);
      const mbYrFS = mbFS ? (parseInt(mbFS.start_year) || currentFY) : 9999;
      const weeklyRent = parseFloat(a.a_rental_income) || 0;
      const rentFreq = parseFloat(a.a_rental_freq) || 52;
      const annualRent = weeklyRent * rentFreq;
      const rentGrowth = getAssetRates(assetIdx, a.a_type).growthRate;
      let rent = annualRent;
      const share = a.a_ownType === "2" ? 0.5 : 1;
      const c1Share = (a.a_ownType === "2" || a.a_owner === "client1") ? share : 0;
      const c2Share = (a.a_ownType === "2" || a.a_owner === "client2") ? share : 0;
      if (c1Share > 0) c1RentalBreakdown.push({ name: a.a_name || "Absent PR (rental)", value: Math.round(annualRent * c1Share), nav: ["Assets & Liabilities", "Assets", "Property"] });
      if (c2Share > 0) c2RentalBreakdown.push({ name: a.a_name || "Absent PR (rental)", value: Math.round(annualRent * c2Share), nav: ["Assets & Liabilities", "Assets", "Property"] });
      for (let y = 0; y < N; y++) {
        const fy = currentFY + y;
        if (fy >= mbYrFS) { rent = rent * (1 + rentGrowth); continue; }
        c1RentalVals[y] += Math.round(rent * c1Share);
        c2RentalVals[y] += Math.round(rent * c2Share);
        rent = rent * (1 + rentGrowth);
      }
    });

    // Strategy 88: Rent out PR — rental income from start_year to end_year
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "88" && s.rentout_property_idx !== "").forEach(s => {
        const propIdx = parseInt(s.rentout_property_idx);
        const a = ffAssets[propIdx];
        if (!a) return;
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const ey = s.end_year && s.end_year !== "Ongoing" ? Math.min(N - 1, (parseInt(s.end_year) || currentFY + 30) - currentFY) : N - 1;
        const rentAmt = parseFloat(s.rentout_rental_income) || 0;
        const rentFreq = parseFloat(s.rentout_rental_freq) || 52;
        const annualRent = rentAmt * rentFreq;
        if (annualRent <= 0) return;
        const rentGrowth = getAssetRates(propIdx, a.a_type).growthRate;
        let rent = annualRent * Math.pow(1 + rentGrowth, sy);
        const share = a.a_ownType === "2" ? 0.5 : 1;
        const c1Share = (a.a_ownType === "2" || a.a_owner === "client1") ? share : 0;
        const c2Share = (a.a_ownType === "2" || a.a_owner === "client2") ? share : 0;
        if (c1Share > 0) c1RentalBreakdown.push({ name: (a.a_name || "PR") + " (rent out)", value: Math.round(annualRent * c1Share), nav: ["Assets & Liabilities", "Assets", "Property"] });
        if (c2Share > 0) c2RentalBreakdown.push({ name: (a.a_name || "PR") + " (rent out)", value: Math.round(annualRent * c2Share), nav: ["Assets & Liabilities", "Assets", "Property"] });
        for (let y = sy; y <= ey && y < N; y++) {
          c1RentalVals[y] += Math.round(rent * c1Share);
          c2RentalVals[y] += Math.round(rent * c2Share);
          rent = rent * (1 + rentGrowth);
        }
      });
    }

    // Strategy 87: Rent out holiday home — rental income from start_year to end_year (assessable in full)
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "87" && s.hh_property_idx !== "").forEach(s => {
        const propIdx = parseInt(s.hh_property_idx);
        const a = ffAssets[propIdx];
        if (!a) return;
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const ey = s.end_year && s.end_year !== "Ongoing" ? Math.min(N - 1, (parseInt(s.end_year) || currentFY + 30) - currentFY) : N - 1;
        const rentAmt = parseFloat(s.hh_rental_income) || 0;
        const rentFreq = parseFloat(s.hh_rental_freq) || 52;
        const annualRent = rentAmt * rentFreq;
        if (annualRent <= 0) return;
        const rentGrowth = getAssetRates(propIdx, a.a_type).growthRate;
        let rent = annualRent * Math.pow(1 + rentGrowth, sy);
        const share = a.a_ownType === "2" ? 0.5 : 1;
        const c1Share = (a.a_ownType === "2" || a.a_owner === "client1") ? share : 0;
        const c2Share = (a.a_ownType === "2" || a.a_owner === "client2") ? share : 0;
        if (c1Share > 0) c1RentalBreakdown.push({ name: (a.a_name || "Holiday Home") + " (rent out)", value: Math.round(annualRent * c1Share), nav: ["Assets & Liabilities", "Assets", "Property"] });
        if (c2Share > 0) c2RentalBreakdown.push({ name: (a.a_name || "Holiday Home") + " (rent out)", value: Math.round(annualRent * c2Share), nav: ["Assets & Liabilities", "Assets", "Property"] });
        for (let y = sy; y <= ey && y < N; y++) {
          c1RentalVals[y] += Math.round(rent * c1Share);
          c2RentalVals[y] += Math.round(rent * c2Share);
          rent = rent * (1 + rentGrowth);
        }
      });
    }

    // Investment income from non-property assets (interest, dividends, distributions)
    // Split by ownership: joint = 50/50, sole = 100% to owner
    const c1InvestIncVals = new Array(N).fill(0);
    const c2InvestIncVals = new Array(N).fill(0);
    const c1FrankingVals = new Array(N).fill(0);
    const c2FrankingVals = new Array(N).fill(0);
    const c1InvestBreakdown = [];
    const c2InvestBreakdown = [];
    ffAssets.filter(a => !["1", "18"].includes(a.a_type)).forEach(a => {
      const assetIdx = ffAssets.indexOf(a);
      const val = parseFloat(a.a_value) || 0;
      if (val <= 0) return;
      const rates = getAssetRates(assetIdx, a.a_type);
      if (rates.incomeYield <= 0) return;
      const share = a.a_ownType === "2" ? 0.5 : 1;
      const c1Share = (a.a_ownType === "2" || a.a_owner === "client1") ? share : 0;
      const c2Share = (a.a_ownType === "2" || a.a_owner === "client2") ? share : 0;
      let running = val;
      const yr1Income = Math.round(val * rates.incomeYield);
      if (c1Share > 0) {
        const cat = assetCategory(a.a_type);
        const navTab = cat === "defensive" ? "Defensive Assets" : "Growth Assets";
        c1InvestBreakdown.push({ name: a.a_name || "Investment", value: Math.round(yr1Income * c1Share), nav: ["Assets & Liabilities", "Assets", navTab] });
      }
      if (c2Share > 0) {
        const cat = assetCategory(a.a_type);
        const navTab = cat === "defensive" ? "Defensive Assets" : "Growth Assets";
        c2InvestBreakdown.push({ name: a.a_name || "Investment", value: Math.round(yr1Income * c2Share), nav: ["Assets & Liabilities", "Assets", navTab] });
      }
      for (let y = 0; y < N; y++) {
        const inc = Math.round(running * rates.incomeYield);
        const frankedAmt = Math.round(inc * rates.frankingPct);
        const frank = Math.round(frankedAmt * 0.30 / 0.70); // company tax gross-up
        c1InvestIncVals[y] += Math.round(inc * c1Share);
        c2InvestIncVals[y] += Math.round(inc * c2Share);
        c1FrankingVals[y] += Math.round(frank * c1Share);
        c2FrankingVals[y] += Math.round(frank * c2Share);
        running = running * (1 + rates.growthRate);
      }
    });

    // Defined Benefit pension income
    const c1DBPensionVals = new Array(N).fill(0);
    const c2DBPensionVals = new Array(N).fill(0);
    const c1DBLumpSumVals = new Array(N).fill(0);
    const c2DBLumpSumVals = new Array(N).fill(0);
    const c1DBLumpSumGross = new Array(N).fill(0);
    const c2DBLumpSumGross = new Array(N).fill(0);
    const c1DBLumpSumTax = new Array(N).fill(0);
    const c2DBLumpSumTax = new Array(N).fill(0);
    // Breakdown info for tooltip (per-year, per-client)
    const dbLumpBreakdowns = { client1: {}, client2: {} };
    const dbSchemes = engineData.definedBenefits || [];
    dbSchemes.forEach((db, dbIdx) => {
      if (!db.scheme) return;
      const resolved = resolveDBBenefitPref(db, dbIdx, engineData, isAdviceModel);
      const exitAge = parseFloat(db.expected_exit_age) || 65;
      const clientDobDB = db.owner === "client1" ? engineData.client1?.date_of_birth : engineData.client2?.date_of_birth;
      const startAgeDB = ageAtFYStart(clientDobDB) ?? (db.owner === "client1" ? 60 : 56);
      const exitYrDB = resolved.startYear ? Math.max(0, resolved.startYear - currentFY) : Math.max(0, Math.round(exitAge - startAgeDB));
      const cpiDB = parseFloat(engineData.assumptions?.a_cpi) / 100 || 0.025;
      const statusDB = db.status || "contributing";
      const isPSS = db.scheme === "pss";
      const isCSS = db.scheme === "css";
      const currentSalaryDB = parseFloat(db.super_salary) || 0;
      const salaryGrowthDB = (parseFloat(db.salary_growth) || 3) / 100;
      const contribRateDB = (parseFloat(db.contribution_rate) || 5) / 100;
      const benefPref = resolved.benefPref;
      const lumpPctDB = benefPref === "combination"
        ? Math.min(100, parseFloat(resolved.lumpPct > 0 ? resolved.lumpPct * 100 : db.combination_lump_pct) || 0) / 100
        : benefPref === "lump_sum" ? 1 : 0;
      const pensionPctDB = 1 - lumpPctDB;
      const pensionArr = db.owner === "client2" ? c2DBPensionVals : c1DBPensionVals;
      const lumpArr = db.owner === "client2" ? c2DBLumpSumVals : c1DBLumpSumVals;

      if (statusDB === "pension") {
        const existing = parseFloat(db.current_pension_annual) || 0;
        const indexed = db.pension_indexed !== "no";
        for (let y = 0; y < N; y++) pensionArr[y] += Math.round(existing * Math.pow(1 + (indexed ? cpiDB : 0), y));
        return;
      }

      // Calculate exit benefit and pension
      let exitPension = 0;
      let exitBenefit = 0;
      if (isPSS) {
        const currentABMDB = parseFloat(db.current_abm) || 0;
        const tenYrDB = db.ten_year_rule_met === "yes";
        const abmAccDB = tenYrDB ? 0.11 + (2 * contribRateDB) : 0.11 + (2 * Math.min(contribRateDB, 0.05));
        const projABM = currentABMDB + (abmAccDB * exitYrDB);
        const projFAS = currentSalaryDB * Math.pow(1 + salaryGrowthDB, exitYrDB);
        exitBenefit = Math.round(projFAS * projABM);
        const mbl = projFAS >= 50000 ? projFAS * 10 : 500000;
        exitBenefit = Math.min(exitBenefit, mbl);
        const pcf = exitAge <= 55 ? 12 : exitAge <= 60 ? 12 - ((exitAge - 55) * 0.2) : exitAge <= 65 ? 11 - ((exitAge - 60) * 0.2) : 10;
        exitPension = pcf > 0 ? Math.round((exitBenefit * pensionPctDB) / pcf) : 0;
      } else if (isCSS) {
        const cssYrs = (parseFloat(db.years_service) || 0) + exitYrDB;
        const cssFinalSal = currentSalaryDB * Math.pow(1 + salaryGrowthDB, exitYrDB);
        const cssPct = Math.min(0.525, (cssYrs / 40) * 0.525) * (exitAge >= 65 ? 1 : exitAge >= 60 ? 0.95 : exitAge >= 55 ? 0.85 : 0.75);
        exitPension = Math.round(cssFinalSal * cssPct * pensionPctDB);
        exitBenefit = Math.round(cssFinalSal * cssPct * 11);
      } else {
        exitPension = Math.round((parseFloat(db.estimated_annual_pension) || 0) * pensionPctDB);
        exitBenefit = exitPension * 11;
      }

      // Manual override from strategy — use adviser-specified amounts
      if (resolved.useManual) {
        if (resolved.manualPension > 0) exitPension = resolved.manualPension;
        if (resolved.manualLump > 0) exitBenefit = Math.round(resolved.manualLump / Math.max(lumpPctDB, 0.01));
      }

      // Lump sum at exit year — compute tax and store NET
      const exitLump = Math.round(exitBenefit * lumpPctDB);
      if (exitLump > 0 && exitYrDB < N) {
        const memberComp = parseFloat(db.member_component) || 0;
        const prodComp = parseFloat(db.productivity_component) || 0;
        const employerComp = parseFloat(db.employer_component) || 0;
        const totalComp = memberComp + prodComp + employerComp;
        const untaxedPct = isPSS && totalComp > 0 ? employerComp / totalComp : isCSS ? 0.6 : 0.5;
        const untaxedLump = Math.round(exitLump * untaxedPct);
        const taxedLump = exitLump - untaxedLump;
        const ageAtExit = startAgeDB + exitYrDB;
        let lumpTax = 0;
        let taxMethod = "";
        if (ageAtExit >= 60) {
          // Taxed element: tax-free. Untaxed element: 15% up to $1.78m, 45% above
          const untaxedPlanCap = 1780000;
          const taxAt15 = Math.min(untaxedLump, untaxedPlanCap);
          const taxAt45 = Math.max(0, untaxedLump - untaxedPlanCap);
          lumpTax = Math.round(taxAt15 * 0.15 + taxAt45 * 0.45);
          taxMethod = "Over 60: taxed element tax-free, untaxed at 15%";
        } else {
          const lowRateCap = 235000;
          const taxedAboveCap = Math.max(0, taxedLump - lowRateCap);
          lumpTax = Math.round(taxedAboveCap * 0.15 + untaxedLump * 0.30);
          taxMethod = "Under 60: taxed element low rate cap then 15%, untaxed at 30%";
        }
        const grossArr = db.owner === "client2" ? c2DBLumpSumGross : c1DBLumpSumGross;
        const taxArr = db.owner === "client2" ? c2DBLumpSumTax : c1DBLumpSumTax;
        const lumpArr = db.owner === "client2" ? c2DBLumpSumVals : c1DBLumpSumVals;
        grossArr[exitYrDB] += exitLump;
        taxArr[exitYrDB] += lumpTax;
        lumpArr[exitYrDB] += (exitLump - lumpTax);
        // Store breakdown for tooltip
        const bk = dbLumpBreakdowns[db.owner];
        bk[exitYrDB] = { gross: exitLump, taxedElement: taxedLump, untaxedElement: untaxedLump, tax: lumpTax, net: exitLump - lumpTax, method: taxMethod, schemeName: isPSS ? "PSS" : isCSS ? "CSS" : "DB" };
      }

      // Pension from exit year onwards, CPI-indexed
      for (let y = exitYrDB; y < N; y++) {
        pensionArr[y] += Math.round(exitPension * Math.pow(1 + cpiDB, y - exitYrDB));
      }
    });

    // Strategy 272: Income adjustments (taxable portion flows to tax return)
    const c1IncAdj = new Array(N).fill(0);
    const c2IncAdj = new Array(N).fill(0);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "272").forEach(s => {
        const amt = parseFloat(s.adj_amount) || 0;
        if (amt <= 0) return;
        const isTaxable = s.adj_type !== "3"; // type 3 = non-taxable
        if (!isTaxable) return;
        const dir = s.adj_direction === "decrease" ? -1 : 1;
        const startYr = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const endYr = s.end_year === "Ongoing" ? N - 1 : Math.min(N - 1, (parseInt(s.end_year) || currentFY + N) - currentFY);
        const arr = s.owner_id === "client2" ? c2IncAdj : c1IncAdj;
        for (let y = startYr; y <= endYr; y++) arr[y] += Math.round(amt * dir);
      });
    }

    const c1TotalIncome = c1Salary.map((s, y) => s + c1RentalVals[y] + c1InvestIncVals[y] + c1DBPensionVals[y] + c1IncAdj[y]);
    const c2TotalIncome = c2Salary.map((s, y) => s + c2RentalVals[y] + c2InvestIncVals[y] + c2DBPensionVals[y] + c2IncAdj[y]);

    // Holiday home deductions — apportioned holding costs + 100% management costs
    const c1HHDeductions = new Array(N).fill(0);
    const c2HHDeductions = new Array(N).fill(0);
    ffAssets.filter(a => a.a_type === "20" && (a.a_hh_rented === "longterm" || a.a_hh_rented === "airbnb" || a.a_hh_rented === "mixed")).forEach(a => {
      const daysAvail = parseFloat(a.a_hh_days_available) || 0;
      const pctRented = parseFloat(a.a_hh_pct_rented) || 100;
      const deductibleFraction = (daysAvail / 365) * (pctRented / 100);
      const holdingCosts = parseFloat(a.a_hh_holding_costs) || 0;
      const mgmtCosts = parseFloat(a.a_hh_mgmt_costs) || 0;
      const annualDeduction = Math.round(holdingCosts * deductibleFraction) + mgmtCosts;
      const costGrowth = parseFloat(engineData.assumptions?.a_cpi) / 100 || 0.025;
      const share = a.a_ownType === "2" ? 0.5 : 1;
      const c1Share = (a.a_ownType === "2" || a.a_owner === "client1") ? share : 0;
      const c2Share = (a.a_ownType === "2" || a.a_owner === "client2") ? share : 0;
      let ded = annualDeduction;
      for (let y = 0; y < N; y++) {
        c1HHDeductions[y] += Math.round(ded * c1Share);
        c2HHDeductions[y] += Math.round(ded * c2Share);
        ded = ded * (1 + costGrowth);
      }
    });

    // Tax: include franking credits as grossed-up income, then subtract as offset
    // Holiday home deductions reduce taxable income
    const c1TaxableIncome = c1TotalIncome.map((inc, y) => Math.max(0, inc + c1FrankingVals[y] - c1HHDeductions[y]));
    const c2TaxableIncome = c2TotalIncome.map((inc, y) => Math.max(0, inc + c2FrankingVals[y] - c2HHDeductions[y]));
    const c1Tax = c1TaxableIncome.map((ti, y) => -(estimateTax(ti) - c1FrankingVals[y]));
    const c2Tax = c2TaxableIncome.map((ti, y) => -(estimateTax(ti) - c2FrankingVals[y]));
    const c1NetIncome = c1TotalIncome.map((s, i) => s + c1Tax[i]);
    const c2NetIncome = c2TotalIncome.map((s, i) => s + c2Tax[i]);
    const totalNetIncome = c1NetIncome.map((v, i) => v + c2NetIncome[i]);

    // ── Expenses ──
    const livingExp = parseFloat(engineData.cashflowConfig?.livingExpenses) || 0;
    const livingGrowth = parseFloat(engineData.cashflowConfig?.livingExpensesGrowth) || 0.025;
    const livingVals = [];
    let le = livingExp;
    for (let y = 0; y < N; y++) { livingVals.push(Math.round(le)); le = le * (1 + livingGrowth); }

    // Rent paid expense — from expenses section, ceases on move-back into PR (strategy 56)
    const moveBackStratsExp = (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "56" && s.moveback_property_idx !== "");
    const moveBackYrExp = moveBackStratsExp.length > 0 ? Math.min(...moveBackStratsExp.map(s => parseInt(s.start_year) || 9999)) : 9999;
    const rentPaidAmt = parseFloat(engineData.expenses?.rental_cost) || 0;
    const rentPaidFreq = parseFloat(engineData.expenses?.rental_freq) || 52;
    const annualRentPaid = rentPaidAmt * rentPaidFreq;
    const rentPaidVals = new Array(N).fill(0);
    if (annualRentPaid > 0) {
      let rp = annualRentPaid;
      for (let y = 0; y < N; y++) {
        const fy = currentFY + y;
        if (fy >= moveBackYrExp) break;
        rentPaidVals[y] = Math.round(rp);
        rp = rp * (1 + livingGrowth);
      }
    }

    // Holiday home holding costs — real cash outflow (rates, insurance, body corp + management)
    const hhExpenseVals = new Array(N).fill(0);
    ffAssets.filter(a => a.a_type === "20").forEach(a => {
      const holdingCosts = parseFloat(a.a_hh_holding_costs) || 0;
      const mgmtCosts = parseFloat(a.a_hh_mgmt_costs) || 0;
      const totalAnnualCost = holdingCosts + mgmtCosts;
      if (totalAnnualCost <= 0) return;
      const costGrowth = parseFloat(engineData.assumptions?.a_cpi) / 100 || 0.025;
      let cost = totalAnnualCost;
      for (let y = 0; y < N; y++) {
        hhExpenseVals[y] += Math.round(cost);
        cost = cost * (1 + costGrowth);
      }
    });

    // Debt servicing from liabilities - IO = interest, P&I = MAX(stated, PMT min)
    // Track per-loan servicing for breakdown display
    const debtBreakdowns = ffDebts.map(d => {
      const dRef2 = `debt_${ffDebts.indexOf(d)}`;
      const bal = parseFloat(d.d_balance) || 0;
      const rate = parseFloat(d.d_rate) || 0;
      const statedRepay = parseFloat(d.d_repayments) || 0;
      const freqNum = parseFloat(debtFreqOverrides[dRef2] || d.d_freq) || 12;
      const isIO = (debtIOOverrides[dRef2] !== undefined ? debtIOOverrides[dRef2] : d.d_io) === "1";
      let annualServ = 0;
      if (isIO) {
        annualServ = Math.round(bal * (rate / 100));
      } else {
        const termYears = parseFloat(d.d_term) || 30;
        const totalPeriods = termYears * freqNum;
        const periodicRate = rate / 100 / freqNum;
        let minRepay = 0;
        if (bal > 0 && periodicRate > 0 && totalPeriods > 0) {
          minRepay = bal * periodicRate / (1 - Math.pow(1 + periodicRate, -totalPeriods));
        }
        annualServ = Math.round(Math.max(statedRepay, minRepay) * freqNum);
      }
      const debtSubTab = d.d_type === "1" ? "Home Loan" : ["2","3"].includes(d.d_type) ? "Investment Loans" : "Other";
      return { name: d.d_name || "Loan", value: annualServ, isIO, nav: ["Assets & Liabilities", "Debts", debtSubTab] };
    });
    const totalDebtServicing = new Array(N).fill(debtBreakdowns.reduce((s, b) => s + b.value, 0));

    const totalExpenses = livingVals.map((l, i) => l + rentPaidVals[i] + hhExpenseVals[i] + totalDebtServicing[i] + Math.abs(c1Tax[i]) + Math.abs(c2Tax[i]) + combinedNonSuperIns[i]);
    const netCashflow = totalNetIncome.map((ni, i) => ni - livingVals[i] - rentPaidVals[i] - hhExpenseVals[i] - totalDebtServicing[i] - combinedNonSuperIns[i]);

    // ── Net Worth: Assets projected ──
    const projectAsset = (val, growthRate, assetIdx, typeCode) => {
      const vals = [];
      const sells = (assetIdx !== undefined) ? (sellLookup[assetIdx] || []) : [];
      const gfStrat = isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []).find(s => s.strategy_id === "137" && parseInt(s.granny_property_idx) === assetIdx) : null;
      const gfStartYr = gfStrat ? Math.max(0, (parseInt(gfStrat.start_year) || currentFY) - currentFY) : -1;
      const isDRP = typeCode ? getAssetDRP(assetIdx, typeCode) : false;
      const rates = (assetIdx !== undefined && typeCode) ? getAssetRates(assetIdx, typeCode) : null;
      let v = val;
      let costBase = parseFloat((factFind.assets || [])[assetIdx]?.a_purchase_price) || val;
      const costBaseArr = [];
      for (let y = 0; y < N; y++) {
        sells.forEach(s => {
          if (s.yearIdx === y && v > 0) {
            v = s.sellEntire ? 0 : Math.max(0, v - s.amount);
            costBase = s.sellEntire ? 0 : Math.max(0, costBase - s.amount);
          }
        });
        if (isDRP && rates && v > 0) {
          // Half-yearly: H1 growth → H1 dividend reinvested → H2 growth → H2 dividend reinvested
          const halfGrowth = Math.pow(1 + growthRate, 0.5) - 1;
          const halfYield = rates.incomeYield / 2;
          // H1
          v = v * (1 + halfGrowth);
          const div1 = Math.round(v * halfYield);
          v += div1;
          costBase += div1;
          // H2
          v = v * (1 + halfGrowth);
          const div2 = Math.round(v * halfYield);
          v += div2;
          costBase += div2;
          vals.push(Math.round(v));
          costBaseArr.push(Math.round(costBase));
        } else {
          vals.push(Math.round(v));
          costBaseArr.push(Math.round(costBase));
          v = v * (1 + growthRate);
        }
      }
      return { vals, costBaseArr, isDRP };
    };

    // Categorise assets from factFind
    const prAssets = ffAssets.filter(a => a.a_type === "1" || a.a_type === "19");
    const ipAssets = ffAssets.filter(a => a.a_type === "18" || a.a_type === "21");
    const hhAssets = ffAssets.filter(a => a.a_type === "20");
    const defAssets = ffAssets.filter(a => ["8","9","10","11"].includes(a.a_type));
    const growAssets = ffAssets.filter(a => ["12","13","26","42"].includes(a.a_type));
    const lifeAssets = ffAssets.filter(a => ["2","7"].includes(a.a_type));
    const companyOpAssets = ffAssets.filter(a => ["50","51","52","53","54","55","56"].includes(a.a_type));

    // Helper: group assets by entity, create entity-level rows with breakdown links
    const assetTypeNavMap = {
      "1": "Property", "18": "Property", "21": "Property", "19": "Property", "20": "Property",
      "8": "Defensive", "9": "Defensive", "10": "Defensive", "11": "Defensive",
      "12": "Growth", "13": "Growth", "26": "Growth", "42": "Growth",
      "2": "Lifestyle", "7": "Lifestyle",
      "50": "Growth", "51": "Growth", "52": "Growth", "53": "Growth", "54": "Growth", "55": "Growth", "56": "Growth",
    };
    const assetTypeMap = { "1": "Principal Residence", "18": "Investment Property", "19": "Principal Residence (Absent)", "20": "Holiday Home", "2": "Car", "8": "Savings Account", "9": "Term Deposits", "12": "Australian Shares", "13": "International Shares", "26": "Managed Funds", "10": "Bonds Australian", "11": "Bonds International", "7": "Lifestyle Other", "42": "Investment Other", "50": "Receivables", "51": "Inventory", "52": "Plant & Equipment", "53": "Goodwill", "54": "IP", "55": "Related Party Loan", "56": "WIP" };

    const buildEntityGroupedRows = (assets) => {
      // Group by assetType + entity combo
      const groupMap = {};
      assets.forEach(a => {
        const entity = ownerLabel(a);
        const typeName = assetTypeMap[a.a_type] || "Other";
        const key = `${typeName}|||${entity}`;
        if (!groupMap[key]) groupMap[key] = { typeName, entity, assets: [] };
        groupMap[key].assets.push(a);
      });

      const rows = [];
      Object.values(groupMap).forEach(group => {
        const groupVals = new Array(N).fill(0);
        const breakdown = [];
        group.assets.forEach(a => {
          const assetIdx = ffAssets.indexOf(a);
          const val = parseFloat(a.a_value) || 0;
          const rates = getAssetRates(assetIdx, a.a_type);
          const projected = projectAsset(val, rates.growthRate, assetIdx, a.a_type);
          projected.vals.forEach((v, y) => { groupVals[y] += v; });
          const navTab = assetTypeNavMap[a.a_type] || "Property";
          breakdown.push({ name: a.a_name || "Asset", value: val, nav: ["Assets & Liabilities", "Assets", navTab] });
        });
        // Label is just the type name — entity badge shows the owner
        const label = group.typeName;
        rows.push({ label, values: groupVals, style: "child", entity: group.entity, breakdown: breakdown.length > 1 ? breakdown : breakdown });
      });
      return rows;
    };

    const prRows = buildEntityGroupedRows(prAssets);
    const prSummary = prRows.length > 0 ? prRows[0].values.map((_, y) => prRows.reduce((s, r) => s + r.values[y], 0)) : new Array(N).fill(0);

    const ipRows = buildEntityGroupedRows(ipAssets);
    const ipSummary = ipRows.length > 0 ? ipRows[0].values.map((_, y) => ipRows.reduce((s, r) => s + r.values[y], 0)) : new Array(N).fill(0);

    const hhRows = buildEntityGroupedRows(hhAssets);
    const hhSummary = hhRows.length > 0 ? hhRows[0].values.map((_, y) => hhRows.reduce((s, r) => s + r.values[y], 0)) : new Array(N).fill(0);

    const defRows = buildEntityGroupedRows(defAssets);
    const defSummary = defRows.length > 0 ? defRows[0].values.map((_, y) => defRows.reduce((s, r) => s + r.values[y], 0)) : new Array(N).fill(0);

    const groRows = buildEntityGroupedRows(growAssets);
    const groSummary = groRows.length > 0 ? groRows[0].values.map((_, y) => groRows.reduce((s, r) => s + r.values[y], 0)) : new Array(N).fill(0);

    const lifeRows = buildEntityGroupedRows(lifeAssets);
    const lifeSummary = lifeRows.length > 0 ? lifeRows[0].values.map((_, y) => lifeRows.reduce((s, r) => s + r.values[y], 0)) : new Array(N).fill(0);

    // Super projections (simple: balance + SG contributions + growth at 6%)
    const superFunds = engineData.superProducts || [];
    const superGrowthRate = 0.07; // 7% gross return assumption (before fees/tax)
    // TODO: Super growth assumptions — wire into assumptions system:
    //   - Per-fund growth rate based on portfolio allocation (defensive/balanced/growth mix)
    //   - Add super growth rate to Assumptions > Returns panel (per fund or per allocation profile)
    //   - Apply 15% earnings tax in accumulation phase (net return = gross × (1 - 0.15))
    //   - Pension phase: 0% earnings tax (tax-free investment returns)
    //   - Consider linking to asset type assumptions for portfolio components
    //   - Allow adviser override per fund (e.g. conservative assumption vs fund benchmark)
    const ccCap = 30000; // Concessional contributions cap
    const nccCap = 120000; // Non-concessional contributions cap
    const contribTaxRate = 0.15; // 15% contributions tax on concessional

    // Inflation rate from assumptions
    const inflationRate = (parseFloat(engineData.assumptions?.basic?.inflationRate ?? engineData.assetAssumptions ? 2.5 : 2.5) || 2.5) / 100;

    // ── Strategy Execution Engine ──
    // Resolved strategy overrides keyed by clientKey → per-year arrays of contribution adjustments
    // Supported strategies:
    //   101: Salary sacrifice to super → extra SS added to client's super fund(s)
    //   55:  Non-concessional contribution → extra NCC
    //   52:  Self-employed deductible contribution → extra CC (treated as SS equivalent)
    //   234: Downsizer contribution → NCC capped at $300k per person
    //   63:  Contribution split → override split_out_pct on client's fund
    //   23/185: Pension drawdown (increase/decrease) → set drawdown amount on client's pension
    //   66/54: Extra debt repayments → reduces surplus (flows into cashflow, not modelled in super engine)
    const activeStrategies = isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []) : [];

    // Helpers: year-range arrays
    const stratYearArray = (startYr, endYr, amount, baseYear = currentFY) => {
      const arr = new Array(N).fill(0);
      const sy = Math.max(0, (parseInt(startYr) || baseYear) - baseYear);
      const ey = endYr === "Ongoing" ? N - 1 : Math.min(N - 1, (parseInt(endYr) || baseYear) - baseYear);
      for (let y = sy; y <= ey; y++) arr[y] = amount;
      return arr;
    };

    // Build per-client extra SS and NCC arrays from strategies
    const stratExtraSS = { client1: new Array(N).fill(0), client2: new Array(N).fill(0) };
    const stratExtraNCC = { client1: new Array(N).fill(0), client2: new Array(N).fill(0) };
    const stratExtraSpouse = { client1: new Array(N).fill(0), client2: new Array(N).fill(0) }; // extra spouse contributions received
    const stratSplitPct = { client1: new Array(N).fill(0), client2: new Array(N).fill(0) };    // override split-out % per year
    // Pension drawdown overrides: { [pensionIdx]: { type: "dollar"|"percentage", amount, startY, endY } }
    const stratPensionDrawdownOverride = {};

    // Recontribution strategy: per-fund per-year { withdrawAmt, recontribAmt, timing: "SOY"|"EOY", toPartner }
    // 108: withdraw + recontrib to same fund. 107: withdraw from client's fund, recontrib to partner's fund.
    const stratRecontrByFund = superFunds.map(() => Array.from({length: N}, () => ({ SOY: null, EOY: null })));
    // Lump sum contribution transactions by fund/year/timing: { ncc, spouseNcc, personalDeductible }
    const stratLumpContrib = superFunds.map(() => Array.from({length: N}, () => ({ SOY: null, EOY: null })));

    activeStrategies.forEach(s => {
      const amt = parseFloat(s.amount) || 0;
      const cKey = s.owner_id; // "client1" or "client2"
      const sy = (parseInt(s.start_year) || currentFY) - currentFY;
      const ey = (!s.end_year || s.end_year === "Ongoing") ? N - 1 : Math.min(N - 1, Math.max(0, (parseInt(s.end_year) || currentFY) - currentFY));
      const validClient = cKey === "client1" || cKey === "client2";

      switch (s.strategy_id) {
        case "101": // Salary sacrifice to super
          if (validClient && amt > 0) {
            for (let y = Math.max(0, sy); y <= Math.max(0, ey); y++) stratExtraSS[cKey][y] += amt;
          }
          break;
        case "55":  // Non-concessional contribution — ongoing if no timing, lump sum if SOY/EOY
        case "234": // Downsizer contribution (NCC, capped at $300k; cap enforced later)
          if (validClient && amt > 0) {
            const cap = s.strategy_id === "234" ? 300000 : Infinity;
            const cappedAmt = Math.min(amt, cap);
            if (s.timing === "SOY" || s.timing === "EOY") {
              // Lump sum — route to transaction path, resolve to fund in second pass
              // Store on cKey for now; resolved to fund index in second pass
              if (!stratLumpContrib._pending55) stratLumpContrib._pending55 = [];
              stratLumpContrib._pending55.push({ s, cappedAmt });
            } else {
              for (let y = Math.max(0, sy); y <= Math.max(0, ey); y++) stratExtraNCC[cKey][y] += cappedAmt;
            }
          }
          break;
        case "52":  // Personal deductible — always EOY lump sum
          if (validClient && amt > 0) {
            if (!stratLumpContrib._pending52) stratLumpContrib._pending52 = [];
            stratLumpContrib._pending52.push({ s, amt });
          }
          break;
        case "63":  // Contribution split to partner — amount is % of CC to split
          if (validClient && amt > 0) {
            const splitPct = Math.min(amt, 85) / 100; // ATO max 85% of taxable contributions
            if (!stratSplitPct[cKey]) stratSplitPct[cKey] = new Array(N).fill(0);
            for (let y = Math.max(0, sy); y <= Math.max(0, ey); y++) stratSplitPct[cKey][y] = splitPct;
          }
          break;
        case "109s": // Spouse contribution — ongoing if no timing, lump sum if SOY/EOY
          if (validClient && amt > 0) {
            if (s.timing === "SOY" || s.timing === "EOY") {
              if (!stratLumpContrib._pending109) stratLumpContrib._pending109 = [];
              stratLumpContrib._pending109.push({ s, amt });
            } else {
              for (let y = Math.max(0, sy); y <= Math.max(0, ey); y++) stratExtraSpouse[cKey][y] += amt;
            }
          }
          break;
        case "107": // Lump sum withdraw + recontribute to PARTNER's super
        case "108": // Lump sum withdraw + recontribute to SAME fund
        case "130": // Withdraw lump sum from super (no recontrib — resolved in second pass)
          // Resolved in second pass after sgFundByClient is built
          break;
        case "23":  // Set pension payment amount
          if (validClient && amt > 0) {
            const pensionMatch23 = s.product_id?.match(/^pension_(\d+)$/);
            const pIdx23 = pensionMatch23 ? parseInt(pensionMatch23[1]) : (engineData.pensions || []).findIndex(p => p.owner === cKey);
            if (pIdx23 >= 0) {
              const amtType23 = s.amount_type || "dollar";
              const ey23 = (!s.end_year || s.end_year === "Ongoing") ? N - 1 : Math.min(N - 1, Math.max(0, (parseInt(s.end_year) || currentFY) - currentFY));
              stratPensionDrawdownOverride[pIdx23] = { amtType: amtType23, amount: amt, startY: Math.max(0, sy), endY: ey23 };
            }
          }
          break;
        default: break;
      }
    });

    // Build per-fund projections — two-pass:
    // Pass 1: Calculate each fund's own contributions (to determine split-out amounts)
    // Pass 2: Apply cross-fund transfers (splits) and calculate final balances
    
    // Determine SG fund per client:
    // If any advice product is flagged is_sg_fund for a client → only that fund gets SG, base funds get 0
    // If no fund is flagged → SG goes to the first base fund for that client (original behaviour)
    const sgFundByClient = {};
    superFunds.forEach((sp, fi) => {
      const ck = sp.owner;
      if (!sgFundByClient[ck]) sgFundByClient[ck] = { idx: fi, isExplicit: false };
      if (sp.is_sg_fund) sgFundByClient[ck] = { idx: fi, isExplicit: true };
    });

    // Second strategy pass: resolve 107/108 now that sgFundByClient is available
    // Helper: preservation age from DOB (ATO schedule)
    const calcPreservationAge = (dob) => {
      if (!dob) return 60;
      const d = new Date(dob);
      const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
      if (y < 1960) return 55;
      if (y === 1960 && m <= 6) return 55; // before 1 Jul 1960
      if (y < 1961 || (y === 1960 && m >= 7)) {
        if (y < 1961) return 56;
      }
      if (y < 1962 || (y === 1961 && m >= 7)) return y < 1962 ? 56 : (y === 1961 ? 57 : 57);
      if (y === 1961) return 57;
      if (y === 1962) return 57;
      if (y === 1963) return 58;
      if (y === 1964 && m < 7) return 59;
      return 60; // born 1 Jul 1964 or later
    };

    // Lump sum tax rates (2024/25 — update annually)
    const LUMP_SUM_LOW_RATE_CAP = LOW_RATE_CAP;
    const LUMP_SUM_TAX_ABOVE_CAP = 0.17; // 15% + 2% Medicare
    const LUMP_SUM_TAX_UNDER_PRES_AGE = 0.22; // 20% + 2% Medicare (taxed element)

    // Pre-compute per-client low-rate-used tracking (reduces as withdrawals consume it)
    const lowRateRemaining = {
      client1: LUMP_SUM_LOW_RATE_CAP - (parseFloat(engineData.tax_super_planning?.client1?.low_rate_used) || 0),
      client2: LUMP_SUM_LOW_RATE_CAP - (parseFloat(engineData.tax_super_planning?.client2?.low_rate_used) || 0),
    };

    activeStrategies.forEach(s => {
      if (s.strategy_id !== "107" && s.strategy_id !== "108" && s.strategy_id !== "110" && s.strategy_id !== "130") return;
      const amt = parseFloat(s.amount) || 0;
      const cKey = s.owner_id;
      const validClient = cKey === "client1" || cKey === "client2";
      if (!validClient || amt <= 0) return;
      const sy = (parseInt(s.start_year) || currentFY) - currentFY;
      const ey = (!s.end_year || s.end_year === "Ongoing") ? N - 1 : Math.min(N - 1, Math.max(0, (parseInt(s.end_year) || currentFY) - currentFY));
      const toPartner = s.strategy_id === "107";
      const pureDrawdown = s.strategy_id === "110" || s.strategy_id === "130"; // no recontrib
      const timing = s.timing || "SOY";

      // Resolve specific fund from product_id, fall back to SG/first fund
      let srcFundIdx = -1;
      if (s.product_id) {
        const superMatch = s.product_id.match(/^super_(\d+)$/);
        const newSuperMatch = s.product_id.match(/^new_super_(.+)$/);
        if (superMatch) srcFundIdx = parseInt(superMatch[1]);
        else if (newSuperMatch) srcFundIdx = superFunds.findIndex(sf => sf._adviceId === newSuperMatch[1]);
      }
      if (srcFundIdx < 0) srcFundIdx = sgFundByClient[cKey]?.idx ?? superFunds.findIndex(sf => sf.owner === cKey);
      if (srcFundIdx < 0) return;

      const clientDob = engineData[cKey]?.date_of_birth;
      const startAge = ageAtFYStart(clientDob) ?? 60;
      const presAge = calcPreservationAge(clientDob);

      for (let y = Math.max(0, sy); y <= Math.max(0, ey); y++) {
        const ageAtYear = startAge + y;

        // ── Lump sum tax calculation ──
        // After 60: no tax on any component
        // Between preservation age and 59: taxable component — first $X at 0% (low rate cap), rest at 17%
        // Under preservation age: taxable component taxed at 22%
        // Tax-free component: always 0% tax
        // We don't know the exact TF proportion yet (depends on running balance at year y),
        // but we use Pass A's taxFreePropA as the best estimate.
        // For strategy resolution we store a tax estimator function; actual tax applied in Pass C.

        let withdrawalTax = 0;
        let netRecontrib = amt;

        if (ageAtYear >= 60) {
          // No tax — full amount available to recontribute
          withdrawalTax = 0;
          netRecontrib = amt;
        } else {
          // Need to estimate taxable component — use seed proportion as approximation
          // Pass C will recalculate with actual running proportion
          const seedTaxable = parseFloat(superFunds[srcFundIdx]?.tax_components?.taxable_portion) || 0;
          const seedTaxFree = parseFloat(superFunds[srcFundIdx]?.tax_components?.tax_free_portion) || 0;
          const seedTotal = seedTaxable + seedTaxFree || 1;
          const taxableProp = seedTaxable / seedTotal;
          const taxableAmt = Math.round(amt * taxableProp);

          if (ageAtYear >= 60) {
            // Age 60+ — completely tax free, LRT irrelevant
            withdrawalTax = 0;
          } else if (ageAtYear < presAge) {
            // Under preservation age — 22% flat on taxable component, LRT does NOT apply
            withdrawalTax = Math.round(taxableAmt * LUMP_SUM_TAX_UNDER_PRES_AGE);
          } else {
            // Preservation age to 59 — LRT applies: first $235k at 0%, above at 17%
            const capRemaining = lowRateRemaining[cKey];
            const withinCap = Math.min(taxableAmt, Math.max(0, capRemaining));
            const aboveCap = Math.max(0, taxableAmt - withinCap);
            withdrawalTax = Math.round(aboveCap * LUMP_SUM_TAX_ABOVE_CAP);
            lowRateRemaining[cKey] = Math.max(0, capRemaining - withinCap);
          }
          netRecontrib = amt - withdrawalTax;
        }

        const timingSlot = timing === "EOY" ? "EOY" : "SOY";
        stratRecontrByFund[srcFundIdx][y][timingSlot] = {
          withdrawAmt: amt,
          recontribAmt: pureDrawdown ? 0 : amt,
          withdrawalTax,
          timing,
          toPartner,
          pureDrawdown,
          cKey,
        };
      }
    });

    // Resolve lump sum contribution transactions (55 SOY/EOY, 52 EOY, 109s SOY/EOY)
    // Must run after sgFundByClient is built
    const resolveLumpContribs = (pending, type) => {
      (pending || []).forEach(({ s, amt, cappedAmt }) => {
        const amount = cappedAmt ?? amt;
        const cKey = s.owner_id;
        const sy = (parseInt(s.start_year) || currentFY) - currentFY;
        const ey = (!s.end_year || s.end_year === "Ongoing") ? N - 1 : Math.min(N - 1, Math.max(0, (parseInt(s.end_year) || currentFY) - currentFY));
        const timing = s.strategy_id === "52" ? "EOY" : (s.timing || "EOY");
        const slot = timing === "SOY" ? "SOY" : "EOY";
        // Resolve fund: use product_id if set, else SG fund
        let fundIdx = -1;
        if (s.product_id) {
          const sm = s.product_id.match(/^super_(\d+)$/);
          const nm = s.product_id.match(/^new_super_(.+)$/);
          if (sm) fundIdx = parseInt(sm[1]);
          else if (nm) fundIdx = superFunds.findIndex(sf => sf._adviceId === nm[1]);
        }
        if (fundIdx < 0) fundIdx = sgFundByClient[cKey]?.idx ?? superFunds.findIndex(sf => sf.owner === cKey);
        if (fundIdx < 0) return;
        for (let y = Math.max(0, sy); y <= Math.max(0, ey); y++) {
          if (!stratLumpContrib[fundIdx][y][slot]) stratLumpContrib[fundIdx][y][slot] = { ncc: 0, spouseNcc: 0, personalDeductible: 0 };
          const entry = stratLumpContrib[fundIdx][y][slot];
          if (type === "ncc") entry.ncc += amount;
          else if (type === "spouse") entry.spouseNcc += amount;
          else if (type === "personal") entry.personalDeductible += amount;
        }
      });
    };
    resolveLumpContribs(stratLumpContrib._pending55, "ncc");
    resolveLumpContribs(stratLumpContrib._pending52, "personal");
    resolveLumpContribs(stratLumpContrib._pending109, "spouse");

    // Build contribution transfer cutoffs: if a rollover has transfer_contributions=true,
    // the roll-out fund's contributions (SS, NCC, SG) stop from rollover_year onwards.
    // Key: fund index → cutoff year index (contributions zeroed from this year)
    const contribCutoffByFund = {}; // { [fundIndex]: cutoffY }
    if (isAdviceModel) {
      (engineData.advice_request?.transactions?.rollovers || []).forEach(r => {
        if (!r.transfer_contributions) return;
        const rollYear = (parseInt(r.rollover_year) || currentFY) - currentFY;
        // Resolve roll-out fund index
        const superMatch = r.rollout_fund?.match(/^super_(\d+)$/);
        const newSuperMatch = r.rollout_fund?.match(/^new_super_(.+)$/);
        let outFundIdx = -1;
        if (superMatch) {
          outFundIdx = parseInt(superMatch[1]);
        } else if (newSuperMatch) {
          const advId = newSuperMatch[1];
          outFundIdx = superFunds.findIndex(sf => sf._adviceId === advId);
        }
        if (outFundIdx >= 0) {
          // Use earliest cutoff if multiple rollovers hit same fund
          if (contribCutoffByFund[outFundIdx] === undefined || rollYear < contribCutoffByFund[outFundIdx]) {
            contribCutoffByFund[outFundIdx] = Math.max(0, rollYear);
          }
        }
      });
    }

    // Pass 1: per-fund contribution calculations
    const fundCalcs = superFunds.map((sp, fi) => {
      const clientKey = sp.owner;
      const clientGross = parseFloat(engineData.income?.[clientKey]?.i_gross) || 0;
      const clientInc = parseFloat(engineData.income?.[clientKey]?.i_increase) || 0;
      const superInc = engineData.income?.[clientKey]?.i_super_inc;
      const baseSalary = superInc === "1" ? clientGross / (1 + sgRate) : clientGross;
      const ss = parseFloat(sp.contributions?.salary_sacrifice) || 0;
      const ssIndexed = sp.contributions?.salary_sacrifice_indexed === true;
      const afterTax = parseFloat(sp.contributions?.after_tax) || 0;
      const atIndexed = sp.contributions?.after_tax_indexed === true;
      const spouseReceived = parseFloat(sp.contributions?.spouse_received) || 0;
      const spouseIndexed = sp.contributions?.spouse_received_indexed === true;
      const splitOutPct = (parseFloat(sp.contributions?.split_out_pct) || 0) / 100;

      // This fund receives SG only if it is the designated SG fund for this client
      const isSgFund = sgFundByClient[clientKey]?.idx === fi;

      // Contribution transfer cutoff: if this fund is being rolled out with transfer_contributions,
      // stop all contributions (SS, NCC, SG) from the rollover year onwards
      const cutoffY = contribCutoffByFund[fi] ?? Infinity;

      // Strategy 63: contribution split override — replaces fund's base split_out_pct when active
      const hasSplitStrat = (stratSplitPct[clientKey] || []).some(v => v > 0);

      // Retirement year for this client
      const clientDobSuper = engineData[clientKey]?.date_of_birth;
      const clientRetAgeSuper = parseFloat(engineData.advice_reason?.quick?.[clientKey]?.ret_age) || 67;
      const clientAgeNow = clientDobSuper ? (() => {
        const d = new Date(clientDobSuper); const n = new Date(currentFY, 6, 1); // 1 July of current FY
        let a = n.getFullYear() - d.getFullYear();
        if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
        return a;
      })() : 60;
      const retYrSuper = Math.max(0, clientRetAgeSuper - clientAgeNow);

      let salary = baseSalary;
      const sgPerYear = [], ccPerYear = [], splitOutPerYear = [];
      const ssPerYear = [], atPerYear = [], spousePerYear = [];
      for (let y = 0; y < N; y++) {
        const retired = y >= retYrSuper;
        const cpiMult = ssIndexed || atIndexed || spouseIndexed ? Math.pow(1 + inflationRate, y) : 1;
        const contributed = y < cutoffY; // false from rollover year onwards — base contributions stop
        const sg = (!retired && isSgFund && contributed) ? Math.round(salary * sgRate) : 0;
        const baseYearSS = (retired || !contributed) ? 0 : Math.round(ss * (ssIndexed ? cpiMult : 1));
        // Strategy extra SS is also gated on contributed — once this fund is rolled out, 
        // the strategy SS flows to the roll-in fund (which becomes the new SG/primary fund)
        const extraSS = contributed ? (stratExtraSS[clientKey]?.[y] || 0) : 0;
        const yearSS = baseYearSS + (retired ? 0 : extraSS);
        // Strategy 55/234: extra NCC added on top, subject to NCC cap
        const extraNCC = contributed ? (stratExtraNCC[clientKey]?.[y] || 0) : 0;
        // Strategy spouse: extra spouse contribution received (strategy 55 on receiving client)
        const extraSpouse = contributed ? (stratExtraSpouse[clientKey]?.[y] || 0) : 0;
        const yearAT = contributed ? Math.round(afterTax * (atIndexed ? cpiMult : 1)) + extraNCC : 0;
        const yearSpouse = contributed ? Math.round(spouseReceived * (spouseIndexed ? cpiMult : 1)) + extraSpouse : 0;
        const totalCC = Math.min(ccCap, sg + yearSS);
        // Strategy 63: override split % if active this year (only on SG/primary fund)
        const activeSplitPct = (isSgFund && hasSplitStrat) ? (stratSplitPct[clientKey]?.[y] ?? splitOutPct) : splitOutPct;
        const splitOut = Math.round(totalCC * activeSplitPct);
        sgPerYear.push(sg);
        ssPerYear.push(yearSS);
        atPerYear.push(yearAT);
        spousePerYear.push(yearSpouse);
        ccPerYear.push(totalCC);
        splitOutPerYear.push(splitOut);
        salary = salary * (1 + clientInc / 100);
      }
      return { sp, clientKey, baseSalary, clientInc, ssIndexed, atIndexed, spouseIndexed, splitOutPct, sgPerYear, ssPerYear, atPerYear, spousePerYear, ccPerYear, splitOutPerYear };
    });

    // Resolve split-in amounts: find who receives each fund's split-out
    // Convention: split goes to the other client's first fund
    const splitInPerFund = superFunds.map(() => new Array(N).fill(0));
    fundCalcs.forEach((fc, fi) => {
      if (fc.splitOutPct <= 0) return;
      // Find the other client's fund index
      const otherClient = fc.clientKey === "client1" ? "client2" : "client1";
      const targetIdx = superFunds.findIndex(s => s.owner === otherClient);
      if (targetIdx >= 0) {
        for (let y = 0; y < N; y++) {
          splitInPerFund[targetIdx][y] += fc.splitOutPerYear[y];
        }
      }
    });

    // ── Rollover flows per super fund (two-pass approach) ──
    // Pass A: Run projections WITHOUT rollovers to get projected opening balances
    // Pass B: Resolve actual rollover $ amounts from projected balances
    // Pass C: Re-run projections WITH resolved amounts
    const advRollovers = isAdviceModel ? (engineData.advice_request?.transactions?.rollovers || []) : [];
    const pensionFunds = engineData.pensions || [];

    // Parse rollover instructions
    const parsedRollovers = advRollovers.map(r => {
      if (!r.rollout_fund || !r.rollin_fund) return null;
      const rollYear = Math.max(0, (parseInt(r.rollover_year) || currentFY) - currentFY);
      if (rollYear >= N) return null;

      const resolveIdx = (fundRef, type) => {
        const superMatch = fundRef.match(/^super_(\d+)$/);
        if (superMatch) return { idx: parseInt(superMatch[1]), type: "super" };
        const newSuperMatch = fundRef.match(/^new_super_/);
        if (newSuperMatch) {
          const advId = fundRef.replace("new_super_", "");
          return { idx: superFunds.findIndex(s => s._adviceId === advId), type: "super" };
        }
        const penMatch = fundRef.match(/^pension_(\d+)$/);
        if (penMatch) return { idx: parseInt(penMatch[1]), type: "pension" };
        const newPenMatch = fundRef.match(/^new_pension_/);
        if (newPenMatch) {
          const advId = fundRef.replace("new_pension_", "");
          return { idx: pensionFunds.findIndex(p => p._adviceId === advId), type: "pension" };
        }
        return { idx: -1, type: "" };
      };

      const out = resolveIdx(r.rollout_fund);
      const inn = resolveIdx(r.rollin_fund);
      return { out, inn, rollYear, entire: r.rollover_entire, amtType: r.amount_type, amtVal: parseFloat(r.amount) || 0, amtPct: parseFloat(r.amount_pct) || 0 };
    }).filter(Boolean);

    // Build per-fund rollover nav links (for register display)
    // Per-rollover detail rows: each entry is { label, nav, vals[N] }
    // Keyed by fund index — arrays of individual rollover rows
    const rollInDetailPerFund  = superFunds.map(() => []); // [{ label, nav, vals }]
    const rollOutDetailPerFund = superFunds.map(() => []);
    const rollInDetailPerPension  = pensionFunds.map(() => []);
    const rollOutDetailPerPension = pensionFunds.map(() => []);

    const getFundLabel = (ref) => {
      if (ref.type === "super") {
        const sf = superFunds[ref.idx];
        return sf ? { label: sf.fund_name || "Super", nav: ["Products", "Superannuation", superFundTabs[ref.idx]?.key || ""] } : { label: "Super", nav: null };
      }
      if (ref.type === "pension") {
        const pf = pensionFunds[ref.idx];
        return pf ? { label: pf.fund_name || "Pension", nav: ["Products", "Pension", pensionTabs[ref.idx]?.key || ""] } : { label: "Pension", nav: null };
      }
      return { label: "Unknown", nav: null };
    };

    // Pass A: pre-compute roll-ins per super fund per year from parsed rollovers
    // This ensures funds receiving rollovers have correct projected balances for subsequent rollover sizing
    const passARollInPerFund = superFunds.map(() => new Array(N).fill(0));
    const passARollInPerPension = pensionFunds.map(() => new Array(N).fill(0));
    parsedRollovers.forEach(pr => {
      if (pr.out.idx < 0 || pr.inn.idx < 0) return;
      // Use opening balance of source fund (from stored balance, not projected) as estimate for Pass A
      let srcBal = 0;
      if (pr.out.type === "super") srcBal = parseFloat(superFunds[pr.out.idx]?.balance) || 0;
      else if (pr.out.type === "pension") srcBal = parseFloat(pensionFunds[pr.out.idx]?.balance) || 0;
      const amt = pr.entire ? srcBal : pr.amtType === "retain" ? Math.max(0, srcBal - pr.amtVal) : pr.amtType === "percentage" ? Math.round(srcBal * pr.amtPct / 100) : pr.amtVal;
      if (amt <= 0) return;
      if (pr.inn.type === "super" && pr.inn.idx >= 0) {
        while (passARollInPerFund.length <= pr.inn.idx) passARollInPerFund.push(new Array(N).fill(0));
        passARollInPerFund[pr.inn.idx][pr.rollYear] += amt;
      } else if (pr.inn.type === "pension" && pr.inn.idx >= 0) {
        while (passARollInPerPension.length <= pr.inn.idx) passARollInPerPension.push(new Array(N).fill(0));
        passARollInPerPension[pr.inn.idx][pr.rollYear] += amt;
      }
    });

    // ── CGT Cap Super Contributions (from SB CGT concessions — strategy 131) ──
    const cgtCapContribByFund = superFunds.map(() => new Array(N).fill(0));
    if (isAdviceModel) {
      (engineData.strategies || []).filter(s => s.strategy_id === "131").forEach(exitS => {
        const coIdx = parseInt(exitS.company_idx) || 0;
        const co = (engineData.companies || [])[coIdx];
        if (!co) return;
        const exitYr = parseInt(exitS.sell_year) || 0;
        const exitYIdx = exitYr - new Date().getFullYear();
        if (exitYIdx < 0 || exitYIdx >= N) return;
        const retCfg = exitS.sbc_retirement_config || {};
        (co.shareholders || []).forEach((sh, si) => {
          const cfg = retCfg[si] || {};
          const superAmt = parseFloat(cfg.super_amt || cfg.retirement_amt) || 0;
          const superFund = cfg.super_fund || "";
          const shouldContrib = cfg.contribute_super === "1" || (superAmt > 0 && superFund);
          // Under-55 must contribute (mandatory), 55+ optional
          if (superAmt > 0 && superFund && shouldContrib) {
            // Map fund reference to index
            if (superFund.startsWith("super_")) {
              const fIdx = parseInt(superFund.replace("super_", ""));
              if (fIdx >= 0 && fIdx < superFunds.length) cgtCapContribByFund[fIdx][exitYIdx] += superAmt;
            }
            // SMSF: find the SMSF super fund equivalent
            if (superFund.startsWith("smsf_")) {
              const smsfIdx = parseInt(superFund.replace("smsf_", ""));
              // Find super fund that maps to this SMSF member
              superFunds.forEach((spf, fIdx) => {
                if (spf.fund_type === "smsf" && parseInt(spf.smsf_idx) === smsfIdx) {
                  cgtCapContribByFund[fIdx][exitYIdx] += superAmt;
                }
              });
            }
          }
        });
      });
    }

    // ── In-Specie Transfer NCC (strategy 123) — asset transfer counts as NCC to destination fund ──
    const inSpecieNCCByFund = superFunds.map(() => new Array(N).fill(0));
    if (isAdviceModel) {
      (engineData.strategies || []).filter(s => s.strategy_id === "123").forEach(s123 => {
        const assetIdx = parseInt(s123.asset_idx);
        const asset = ffAssets[assetIdx];
        if (!asset || !["12", "13", "26", "42"].includes(asset.a_type)) return;
        const yIdx = (parseInt(s123.transfer_year) || new Date().getFullYear()) - new Date().getFullYear();
        if (yIdx < 0 || yIdx >= N) return;
        const assetVal = parseFloat(asset.a_value) || 0;
        const pct = (parseFloat(s123.transfer_pct) || 100) / 100;
        const transferVal = s123.transfer_value_override === "1" ? (parseFloat(s123.transfer_value) || 0) : Math.round(assetVal * pct);
        const destFund = s123.dest_fund || "";
        // Map destination fund reference to super fund index
        if (destFund.startsWith("super_")) {
          const fIdx = parseInt(destFund.replace("super_", ""));
          if (fIdx >= 0 && fIdx < superFunds.length) inSpecieNCCByFund[fIdx][yIdx] += transferVal;
        }
        if (destFund.startsWith("smsf_")) {
          // Could be smsf_0 (pooled) or smsf_0_1 (segregated account)
          const parts = destFund.split("_");
          const smsfIdx = parseInt(parts[1]);
          // Find super fund that maps to this SMSF
          superFunds.forEach((spf, fIdx) => {
            if (spf.fund_type === "smsf" && parseInt(spf.smsf_idx) === smsfIdx) {
              inSpecieNCCByFund[fIdx][yIdx] += transferVal;
            }
          });
          // Also check if any retail super linked to member should receive it
          // For SMSFs, the contribution goes directly to the SMSF fund
        }
      });
    }

    // Pass A: quick projection to get opening balances per year (including roll-ins)
    const projectedOpenBals = fundCalcs.map((fc, fi) => {
      const sp = fc.sp;
      const bal = parseFloat(sp.balance) || 0;
      const adminFee = parseFloat(sp.fees?.admin_fee) || 0;
      const pctFee = (parseFloat(sp.fees?.percent_fee) || 0) / 100;
      const staticInsFee = parseFloat(sp.fees?.insurance_fee) || 0;
      let running = bal;
      // Tax component tracking in Pass A — needed to proportion rollovers correctly
      let runTaxFreeA = parseFloat(sp.tax_components?.tax_free_portion) || 0;
      let runTaxableA = parseFloat(sp.tax_components?.taxable_portion) || 0;
      if (Math.abs((runTaxFreeA + runTaxableA) - bal) > 1 && bal > 0) {
        const ratio = bal / (runTaxFreeA + runTaxableA || 1);
        runTaxableA = Math.round(runTaxableA * ratio);
        runTaxFreeA = bal - runTaxableA;
      }
      const openBals = [];
      const taxFreePropA = []; // tax-free proportion at start of each year
      for (let y = 0; y < N; y++) {
        // Inject roll-ins from other rollovers (Pass A estimate)
        const fi = fundCalcs.indexOf(fc);
        const passARollIn = passARollInPerFund[fi]?.[y] || 0;
        if (passARollIn > 0) { running += passARollIn; runTaxableA += passARollIn; }
        openBals.push(Math.round(running));
        const total = runTaxableA + runTaxFreeA;
        taxFreePropA.push(total > 0 ? runTaxFreeA / total : 0);
        const totalNCC = fc.atPerYear[y] + fc.spousePerYear[y];
        const cgtCapContrib = cgtCapContribByFund[fi]?.[y] || 0;
        const inSpecieNCC = inSpecieNCCByFund[fi]?.[y] || 0;
        const netCC = fc.ccPerYear[y] - fc.splitOutPerYear[y] + splitInPerFund[fi][y];
        const cTax = Math.round(netCC * contribTaxRate);
        const netContrib = netCC - cTax + totalNCC + cgtCapContrib + inSpecieNCC;
        const fees = Math.round(adminFee + running * pctFee + staticInsFee);
        const growth = Math.round((running + (netContrib - fees) / 2) * superGrowthRate);
        // Update tax components
        runTaxFreeA += totalNCC + cgtCapContrib + inSpecieNCC; // NCC and CGT cap contribs are tax-free component
        runTaxableA += (netCC - cTax) + growth - fees;
        if (runTaxableA < 0) { runTaxFreeA += runTaxableA; runTaxableA = 0; }
        if (runTaxFreeA < 0) { runTaxableA += runTaxFreeA; runTaxFreeA = 0; }
        running = running + netContrib - fees + growth;
      }
      return { openBals, taxFreePropA };
    });

    // Pass A (Pension): quick projection to get pension opening balances per year (no rollovers)
    const projectedPensionOpenBals = pensionFunds.map((pf) => {
      const bal = parseFloat(pf.balance) || 0;
      const adminFee = parseFloat(pf.fees?.admin_fee) || 0;
      const pctFee = (parseFloat(pf.fees?.percent_fee) || 0) / 100;
      const drawdownRate = (parseFloat(pf.drawdown_rate) || 5) / 100;
      const drawdownType = pf.drawdown_type || "percentage";
      const drawdownFixed = parseFloat(pf.drawdown_amount) || 0;
      const pensionGrowthRate = 0.07;
      const clientDobP = pf.owner === "client1" ? engineData.client1?.date_of_birth : engineData.client2?.date_of_birth;
      const startAgeP = ageAtFYStart(clientDobP) ?? 60;
      const abpMinRateP = (age) => { if (age < 65) return 0.04; if (age < 75) return 0.05; if (age < 80) return 0.06; if (age < 85) return 0.07; if (age < 90) return 0.09; if (age < 95) return 0.11; return 0.14; };
      let running = bal;
      const openBals = [];
      for (let y = 0; y < N; y++) {
        openBals.push(Math.round(running));
        if (running <= 0) { continue; }
        const age = startAgeP + y;
        const minDraw = Math.round(running * abpMinRateP(age));
        const drawdown = drawdownType === "dollar" ? Math.max(minDraw, drawdownFixed) : Math.max(minDraw, Math.round(running * drawdownRate));
        const fees = Math.round(adminFee + running * pctFee);
        const avgBal = running - drawdown / 2 - fees / 2;
        running = Math.max(0, running - drawdown - fees + Math.round(Math.max(0, avgBal) * pensionGrowthRate));
      }
      return openBals;
    });

    // Pass B: Resolve actual $ amounts for each rollover
    const rollOutPerFund = superFunds.map(() => new Array(N).fill(0));
    const rollInPerFund = superFunds.map(() => new Array(N).fill(0));
    // Pension rollover arrays — indexed by pension fund index
    const rollOutPerPension = pensionFunds.map(() => new Array(N).fill(0));
    const rollInPerPension = pensionFunds.map(() => new Array(N).fill(0));
    // Tax component transfer arrays for super rollovers — how much tax-free flows into each fund per year
    const rollInTaxFreePerFund = superFunds.map(() => new Array(N).fill(0));
    const rollInTaxablePerFund = superFunds.map(() => new Array(N).fill(0));
    // Recontribution NCC flows to partner's fund (strategy 107): tax-free amount added to target fund per year
    const stratRecontrNccByFund = superFunds.map(() => new Array(N).fill(0)); // NCC flowing into this fund from 107

    parsedRollovers.forEach(pr => {
      if (pr.out.idx < 0) return;

      // Resolve source opening balance
      let srcOpenBal = 0;
      if (pr.out.type === "super") {
        srcOpenBal = projectedOpenBals[pr.out.idx]?.openBals?.[pr.rollYear] || 0;
      } else if (pr.out.type === "pension") {
        srcOpenBal = projectedPensionOpenBals[pr.out.idx]?.[pr.rollYear] || 0;
      }

      let amount = 0;
      if (pr.entire) {
        amount = srcOpenBal;
      } else if (pr.amtType === "retain") {
        amount = Math.max(0, srcOpenBal - Math.round(pr.amtVal));
      } else if (pr.amtType === "percentage") {
        amount = Math.round(srcOpenBal * (pr.amtPct / 100));
      } else {
        amount = Math.round(pr.amtVal);
      }
      if (amount <= 0) return;

      const innLabel = getFundLabel(pr.inn);
      const outLabel = getFundLabel(pr.out);

      // ── Write rollout for source fund ──
      if (pr.out.type === "super") {
        rollOutPerFund[pr.out.idx][pr.rollYear] += amount;
        // Add individual row for register display
        while (rollOutDetailPerFund.length <= pr.out.idx) rollOutDetailPerFund.push([]);
        let row = rollOutDetailPerFund[pr.out.idx].find(r => r.label === innLabel.label);
        if (!row) { row = { label: innLabel.label, nav: innLabel.nav, vals: new Array(N).fill(0) }; rollOutDetailPerFund[pr.out.idx].push(row); }
        row.vals[pr.rollYear] += amount;
      } else if (pr.out.type === "pension") {
        while (rollOutPerPension.length <= pr.out.idx) rollOutPerPension.push(new Array(N).fill(0));
        rollOutPerPension[pr.out.idx][pr.rollYear] += amount;
        while (rollOutDetailPerPension.length <= pr.out.idx) rollOutDetailPerPension.push([]);
        let row = rollOutDetailPerPension[pr.out.idx].find(r => r.label === innLabel.label);
        if (!row) { row = { label: innLabel.label, nav: innLabel.nav, vals: new Array(N).fill(0) }; rollOutDetailPerPension[pr.out.idx].push(row); }
        row.vals[pr.rollYear] += amount;
      }

      // ── Write roll-in for destination fund ──
      if (pr.inn.type === "super" && pr.inn.idx >= 0) {
        rollInPerFund[pr.inn.idx][pr.rollYear] += amount;
        while (rollInDetailPerFund.length <= pr.inn.idx) rollInDetailPerFund.push([]);
        let row = rollInDetailPerFund[pr.inn.idx].find(r => r.label === outLabel.label);
        if (!row) { row = { label: outLabel.label, nav: outLabel.nav, vals: new Array(N).fill(0) }; rollInDetailPerFund[pr.inn.idx].push(row); }
        row.vals[pr.rollYear] += amount;
        // Tax components
        if (pr.out.type === "super") {
          const tfProp = projectedOpenBals[pr.out.idx]?.taxFreePropA?.[pr.rollYear] ?? 0;
          const rollInTF = Math.round(amount * tfProp);
          rollInTaxFreePerFund[pr.inn.idx][pr.rollYear] += rollInTF;
          rollInTaxablePerFund[pr.inn.idx][pr.rollYear] += (amount - rollInTF);
        } else if (pr.out.type === "pension") {
          const pen = pensionFunds[pr.out.idx];
          const tfPct = (parseFloat(pen?.tax_components?.tax_free_pct) || 0) / 100;
          const rollInTF = Math.round(amount * tfPct);
          rollInTaxFreePerFund[pr.inn.idx][pr.rollYear] += rollInTF;
          rollInTaxablePerFund[pr.inn.idx][pr.rollYear] += (amount - rollInTF);
        }
      } else if (pr.inn.type === "pension" && pr.inn.idx >= 0) {
        while (rollInPerPension.length <= pr.inn.idx) rollInPerPension.push(new Array(N).fill(0));
        while (rollOutPerPension.length <= pr.inn.idx) rollOutPerPension.push(new Array(N).fill(0));
        rollInPerPension[pr.inn.idx][pr.rollYear] += amount;
        while (rollInDetailPerPension.length <= pr.inn.idx) rollInDetailPerPension.push([]);
        let row = rollInDetailPerPension[pr.inn.idx].find(r => r.label === outLabel.label);
        if (!row) { row = { label: outLabel.label, nav: outLabel.nav, vals: new Array(N).fill(0) }; rollInDetailPerPension[pr.inn.idx].push(row); }
        row.vals[pr.rollYear] += amount;
      }
    });

    // Calculate weighted tax-free % for new pensions marked "calc"
    // For each such pension, sum (amount × tf_proportion) across all rollovers into it, divide by total
    pensionFunds.forEach((pf, pi) => {
      if (pf.tax_components?.tax_free_pct !== "calc") return;
      let totalIn = 0;
      let totalTFIn = 0;
      parsedRollovers.forEach(pr => {
        if (pr.inn.type !== "pension" || pr.inn.idx !== pi) return;
        // Get the resolved amount for this rollover
        let srcOpenBal = 0;
        if (pr.out.type === "super") srcOpenBal = projectedOpenBals[pr.out.idx]?.openBals?.[pr.rollYear] || 0;
        else if (pr.out.type === "pension") srcOpenBal = projectedPensionOpenBals[pr.out.idx]?.[pr.rollYear] || 0;
        let amount = 0;
        if (pr.entire) amount = srcOpenBal;
        else if (pr.amtType === "retain") amount = Math.max(0, srcOpenBal - Math.round(pr.amtVal));
        else if (pr.amtType === "percentage") amount = Math.round(srcOpenBal * (pr.amtPct / 100));
        else amount = Math.round(pr.amtVal);
        if (amount <= 0) return;
        // Get tax-free proportion of source
        let tfProp = 0;
        if (pr.out.type === "super") tfProp = projectedOpenBals[pr.out.idx]?.taxFreePropA?.[pr.rollYear] ?? 0;
        else if (pr.out.type === "pension") tfProp = (parseFloat(pensionFunds[pr.out.idx]?.tax_components?.tax_free_pct) || 0) / 100;
        totalIn += amount;
        totalTFIn += amount * tfProp;
      });
      // Store calculated weighted % back onto the pension fund object for register display
      const weightedPct = totalIn > 0 ? (totalTFIn / totalIn) * 100 : 0;
      pf.tax_components = { ...pf.tax_components, tax_free_pct: weightedPct.toFixed(2) };
    });

    // Resolve strategy 107 recontribution targets: find partner's primary fund and route NCC there
    superFunds.forEach((sf, fi) => {
      for (let y = 0; y < N; y++) {
        for (const slot of ["SOY", "EOY"]) {
          const rc = stratRecontrByFund[fi][y][slot];
          if (!rc || !rc.toPartner) continue;
          const partnerKey = rc.cKey === "client1" ? "client2" : "client1";
          const partnerFundIdx = sgFundByClient[partnerKey]?.idx ?? superFunds.findIndex(s => s.owner === partnerKey);
          if (partnerFundIdx >= 0) {
            stratRecontrNccByFund[partnerFundIdx][y] += rc.recontribAmt;
          }
        } // end slot loop
      }
    });

    // Pass 2: Build full projections with splits and spouse contributions
    const superProjections = fundCalcs.map((fc, fi) => {
      const sp = fc.sp;
      const bal = parseFloat(sp.balance) || 0;
      const adminFee = parseFloat(sp.fees?.admin_fee) || 0;
      const pctFee = (parseFloat(sp.fees?.percent_fee) || 0) / 100;

      // Insurance premiums: pull from actual policies linked to this super fund
      const fundId = `super_${fi}`;
      const linkedPolicies = (engineData.insurance?.policies || []).filter(p =>
        p.linked_fund_id === fundId || (p.pol_insured === sp.owner && (p.pol_tax_env || "").toLowerCase().includes("super") && !(p.pol_tax_env || "").toLowerCase().includes("non"))
      );
      // Sum all linked premiums for this fund
      const baseInsurancePremium = linkedPolicies.reduce((sum, pol) => {
        return sum + (parseFloat(pol.premium_life) || 0) + (parseFloat(pol.premium_tpd) || 0) + (parseFloat(pol.premium_trauma) || 0) + (parseFloat(pol.premium_ip) || 0);
      }, 0);
      // Fallback to static insurance_fee if no policies linked
      const staticInsFee = parseFloat(sp.fees?.insurance_fee) || 0;
      const useInsurance = baseInsurancePremium > 0 ? baseInsurancePremium : staticInsFee;

      // Per-fund insurance inflation toggle and rate
      const insInflationOn = sp.fees?.ins_inflation_on !== false; // default on
      const insInflationRate = (parseFloat(sp.fees?.ins_inflation_rate) || 5) / 100;

      // Tax components — opening values from seed data
      const openTaxable = parseFloat(sp.tax_components?.taxable_portion) || 0;
      const openTaxFree = parseFloat(sp.tax_components?.tax_free_portion) || 0;

      const vals = [];
      const sgVals = [], ssVals = [], atVals = [], spouseVals = [], splitInVals = [], splitOutVals = [], cgtCapVals = [], inSpecieVals = [];
      const contribTaxVals = [];
      const adminFeeVals = [], insPremVals = [], totalFeeVals = [], growthVals = [], totalContribVals = [];
      const taxableVals = [], taxFreeVals = [], taxFreePctVals = [];
      const rollOutVals = [], rollInVals = [], revisedVals = [];
      const rollOutTaxFreeVals = [], rollInTaxFreeVals = [], rollInTaxableVals = [];
      const transactedVals = []; // balance after ALL transactions
      const yearEndVals = [];       // actual closing balance after EOY transactions (rollovers + recontribs) — feeds "Revised Balance"
      // Recontribution: three distinct rows
      const recontrWithdrawVals = [];      // lump sum withdrawal SOY (negative)
      const recontrWithdrawEOYVals = [];   // lump sum withdrawal EOY (negative)
      const recontrTaxVals = [];            // withdrawal tax payable (negative — leaves the fund)
      const recontrSelfVals = [];          // re-contribution back to THIS fund (108 — green)
      const recontrToPartnerVals = [];     // re-contribution sent TO partner's fund (107 — red/negative)
      const recontrFromPartnerVals = [];   // re-contribution received FROM partner's fund (107 on receiving end — green)

      // ── Tax-free component tracking arrays ──
      // SOY / Revised section
      const tfOpenVals = [];               // TF at start of year (before any movements)
      const tfRollOutVals = [];            // TF leaving via rollover (negative)
      const tfRollInVals = [];             // TF arriving via rollover (positive)
      const tfWithdrawSOYVals = [];        // TF leaving via SOY lump sum withdrawal (negative)
      const tfRecontrSelfSOYVals = [];     // TF arriving via SOY recontrib to self (positive)
      const tfRecontrToPartnerSOYVals = [];// TF leaving via SOY recontrib to partner (negative)
      const tfRecontrFromPartnerSOYVals =[];// TF arriving via SOY recontrib from partner (positive)
      const tfRevisedVals = [];            // TF after all SOY transactions (Revised TF)
      // EOY / Closing section
      const tfNccVals = [];                // TF added by NCC during year (positive)
      const tfSplitOutVals = [];           // TF leaving via contribution split-out (negative)
      const tfWithdrawEOYVals = [];        // TF leaving via EOY lump sum withdrawal (negative)
      const tfRecontrSelfEOYVals = [];     // TF arriving via EOY recontrib to self (positive)
      const tfRecontrToPartnerEOYVals = [];// TF leaving via EOY recontrib to partner (negative)
      const tfRecontrFromPartnerEOYVals =[];// TF arriving via EOY recontrib from partner (positive)
      const tfClosingVals = [];            // TF at end of year (after all movements)
      const lrtConsumedVals = [];          // Low rate threshold consumed this year
      const lrtRemainingVals = [];         // Low rate threshold remaining after this year
      // Lump sum contribution transaction arrays
      const lumpNccSOYVals = [], lumpSpouseSOYVals = [], lumpPersonalDeductibleSOYVals = [];
      const lumpNccEOYVals = [], lumpSpouseEOYVals = [], lumpPersonalDeductibleEOYVals = [];
      // Track LRT consumed specifically for this fund's client across the projection
      const clientKeyForLrt = sp.owner;
      const lrtOpeningRemaining = LUMP_SUM_LOW_RATE_CAP - (parseFloat(engineData.tax_super_planning?.[clientKeyForLrt]?.low_rate_used) || 0);
      let lrtRunningRemaining = lrtOpeningRemaining; // local shadow — updated as each year consumes cap
      let running = bal;
      let runTaxable = openTaxable;
      let runTaxFree = openTaxFree;
      // Normalise if components don't add up to balance
      if (Math.abs((runTaxable + runTaxFree) - bal) > 1 && bal > 0) {
        const ratio = bal / (runTaxable + runTaxFree || 1);
        runTaxable = Math.round(runTaxable * ratio);
        runTaxFree = bal - runTaxable;
      }

      for (let y = 0; y < N; y++) {
        const openBal = Math.round(running);
        vals.push(openBal);

        // ── Rollovers (after opening, before contributions) ──
        const yearRollOut = rollOutPerFund[fi][y] || 0;
        const yearRollIn  = rollInPerFund[fi][y]  || 0;

        // TF opening snapshot BEFORE rollovers — pure opening position
        tfOpenVals.push(Math.round(runTaxFree));

        rollOutVals.push(yearRollOut > 0 ? -yearRollOut : 0);
        rollInVals.push(yearRollIn);
        running = openBal - yearRollOut + yearRollIn;
        const revisedBal = Math.round(running);
        revisedVals.push(revisedBal);

        // ── Tax component rollover adjustments (ATO proportioning rule) ──
        // Roll-OUT: reduce taxable/tax-free proportionally to the amount leaving
        if (yearRollOut > 0) {
          const totalComp = runTaxable + runTaxFree || 1;
          const tfProp = runTaxFree / totalComp;
          const rollOutTF = Math.round(yearRollOut * tfProp);
          const rollOutTaxable = yearRollOut - rollOutTF;
          runTaxFree    = Math.max(0, runTaxFree    - rollOutTF);
          runTaxable    = Math.max(0, runTaxable    - rollOutTaxable);
          rollOutTaxFreeVals.push(-rollOutTF);
        } else {
          rollOutTaxFreeVals.push(0);
        }
        // Roll-IN: add the proportional tax components carried from the source fund (computed in Pass B)
        if (yearRollIn > 0) {
          const inTF = rollInTaxFreePerFund[fi][y] || 0;
          const inTaxable = rollInTaxablePerFund[fi][y] || 0;
          runTaxFree += inTF;
          runTaxable += inTaxable;
          rollInTaxFreeVals.push(inTF);
          rollInTaxableVals.push(inTaxable);
        } else {
          rollInTaxFreeVals.push(0);
          rollInTaxableVals.push(0);
        }
        tfRollOutVals.push(rollOutTaxFreeVals[rollOutTaxFreeVals.length - 1] || 0);
        tfRollInVals.push(rollInTaxFreeVals[rollInTaxFreeVals.length - 1] || 0);

        // Snapshot tax components AFTER rollover adjustments
        taxableVals.push(Math.round(runTaxable));
        taxFreeVals.push(Math.round(runTaxFree));
        taxFreePctVals.push(openBal > 0 ? ((runTaxFree / openBal) * 100).toFixed(1) + "%" : "0.0%");

        // ── Recontribution strategy: SOY timing ──
        const rc = stratRecontrByFund[fi][y].SOY;
        const rcNccIn = stratRecontrNccByFund[fi][y] || 0;
        let recontrWithdraw = 0, recontrTax = 0, recontrSelf = 0, recontrToPartner = 0, recontrFromPartner = 0;
        let tfWithdrawSOY = 0, tfRecontrSelfSOY = 0, tfRecontrToPartnerSOY = 0, tfRecontrFromPartnerSOY = 0;

        if (rc && rc.timing === "SOY") {
          const withdrawAmt = Math.min(rc.withdrawAmt, Math.round(running));
          if (withdrawAmt > 0) {
            // Use actual running TF proportion for precise tax calculation
            const totalComp = runTaxable + runTaxFree || 1;
            const tfPropW = runTaxFree / totalComp;
            const wTF = Math.round(withdrawAmt * tfPropW);
            const wTaxable = withdrawAmt - wTF;

            // Recalculate tax using actual proportions at this point in time
            const clientKey2 = rc.cKey;
            const clientDob2 = engineData[clientKey2]?.date_of_birth;
            const presAge2 = calcPreservationAge(clientDob2);
            const ageAtYear2 = (ageAtFYStart(clientDob2) ?? 60) + y;
            let withdrawalTax = 0;
            if (ageAtYear2 >= 60) {
              withdrawalTax = 0; // tax free at 60+
            } else if (ageAtYear2 < presAge2) {
              // Under preservation age — 22% flat, LRT does NOT apply
              withdrawalTax = Math.round(wTaxable * LUMP_SUM_TAX_UNDER_PRES_AGE);
            } else {
              // Preservation age to 59 — LRT applies
              const capRem = lowRateRemaining[clientKey2];
              const withinCap = Math.min(wTaxable, Math.max(0, capRem));
              const aboveCap = Math.max(0, wTaxable - withinCap);
              withdrawalTax = Math.round(aboveCap * LUMP_SUM_TAX_ABOVE_CAP);
              lowRateRemaining[clientKey2] = Math.max(0, capRem - withinCap);
            }

            // Apply withdrawal to components
            runTaxFree = Math.max(0, runTaxFree - wTF);
            runTaxable = Math.max(0, runTaxable - wTaxable);
            running -= withdrawAmt;
            // Tax leaves the fund immediately (withheld at source)
            running -= withdrawalTax;
            runTaxable = Math.max(0, runTaxable - withdrawalTax);

            recontrWithdraw = withdrawAmt;
            recontrTax = withdrawalTax;
            tfWithdrawSOY = wTF;

            const netRecontrib = rc.pureDrawdown ? 0 : (withdrawAmt - withdrawalTax);
            if (!rc.pureDrawdown) {
              if (!rc.toPartner) {
                running += netRecontrib;
                runTaxFree += netRecontrib;
                recontrSelf = netRecontrib;
                tfRecontrSelfSOY = netRecontrib;
              } else {
                recontrToPartner = netRecontrib;
                tfRecontrToPartnerSOY = netRecontrib;
                const partnerKey2 = clientKey2 === "client1" ? "client2" : "client1";
                const partnerFundIdx2 = sgFundByClient[partnerKey2]?.idx ?? superFunds.findIndex(sf => sf.owner === partnerKey2);
                if (partnerFundIdx2 >= 0) stratRecontrNccByFund[partnerFundIdx2][y] = netRecontrib;
              }
            }
          }
        }
        // NCC flowing IN from partner's 107 strategy (SOY timing)
        if (rcNccIn > 0) {
          const hasSOY107 = superFunds.some((sf, sfi) => {
            const srcRc = stratRecontrByFund[sfi][y].SOY;
            return srcRc && srcRc.toPartner &&
              (sgFundByClient[srcRc.cKey === "client1" ? "client2" : "client1"]?.idx ?? superFunds.findIndex(s => s.owner !== srcRc.cKey)) === fi;
          });
          if (hasSOY107) {
            running += rcNccIn;
            runTaxFree += rcNccIn;
            recontrFromPartner = rcNccIn;
            tfRecontrFromPartnerSOY = rcNccIn;
          }
        }
        recontrWithdrawVals.push(recontrWithdraw > 0 ? -recontrWithdraw : 0);
        recontrWithdrawEOYVals.push(0); // filled in EOY block below
        recontrTaxVals.push(recontrTax > 0 ? -recontrTax : 0);
        recontrSelfVals.push(recontrSelf);
        recontrToPartnerVals.push(recontrToPartner > 0 ? -recontrToPartner : 0);
        recontrFromPartnerVals.push(recontrFromPartner);
        transactedVals.push(Math.round(running));

        // LRT tracking: how much cap was consumed this year (SOY only — EOY updated below)
        const lrtAfterSOY = lowRateRemaining[clientKeyForLrt];
        const lrtConsumedSOY = Math.max(0, lrtRunningRemaining - lrtAfterSOY);
        lrtRunningRemaining = lrtAfterSOY;
        lrtConsumedVals.push(lrtConsumedSOY);
        lrtRemainingVals.push(Math.max(0, lrtRunningRemaining));

        // ── SOY lump sum contributions ──
        const lcSOY = stratLumpContrib[fi][y].SOY;
        const lsNccSOY = lcSOY?.ncc || 0;
        const lsSpouseSOY = lcSOY?.spouseNcc || 0;
        const lsPersonalSOY = lcSOY?.personalDeductible || 0;
        const lumpContribTaxRate = 0.15;
        if (lsNccSOY > 0) { running += lsNccSOY; runTaxFree += lsNccSOY; }
        if (lsSpouseSOY > 0) { running += lsSpouseSOY; runTaxFree += lsSpouseSOY; }
        if (lsPersonalSOY > 0) { const net = Math.round(lsPersonalSOY * (1 - lumpContribTaxRate)); running += net; runTaxable += net; }
        lumpNccSOYVals.push(lsNccSOY);
        lumpSpouseSOYVals.push(lsSpouseSOY);
        lumpPersonalDeductibleSOYVals.push(lsPersonalSOY);

        // TF SOY transaction vals + Revised TF
        tfWithdrawSOYVals.push(tfWithdrawSOY > 0 ? -tfWithdrawSOY : 0);
        tfRecontrSelfSOYVals.push(tfRecontrSelfSOY);
        tfRecontrToPartnerSOYVals.push(tfRecontrToPartnerSOY > 0 ? -tfRecontrToPartnerSOY : 0);
        tfRecontrFromPartnerSOYVals.push(tfRecontrFromPartnerSOY);
        tfRevisedVals.push(Math.round(runTaxFree));

        const sg = fc.sgPerYear[y];
        const totalCC = fc.ccPerYear[y];
        const splitOut = fc.splitOutPerYear[y];
        const splitIn = splitInPerFund[fi][y];

        sgVals.push(sg);
        ssVals.push(fc.ssPerYear[y]);
        atVals.push(fc.atPerYear[y]);
        spouseVals.push(fc.spousePerYear[y]);
        // CGT Cap contributions (from SB CGT retirement exemption / 15yr exemption)
        const cgtCapAmt = cgtCapContribByFund[fi]?.[y] || 0;
        // In-specie transfer NCC (strategy 123)
        const inSpecieAmt = inSpecieNCCByFund[fi]?.[y] || 0;
        cgtCapVals.push(cgtCapAmt);
        inSpecieVals.push(inSpecieAmt);
        splitOutVals.push(splitOut > 0 ? -splitOut : 0);
        splitInVals.push(splitIn);

        // Concessional after split-out (net CC staying in this fund)
        const netCC = totalCC - splitOut;
        // Non-concessional = after-tax + spouse received (both are NCC)
        const totalNCC = Math.min(nccCap, fc.atPerYear[y] + fc.spousePerYear[y]);
        // Split-in is concessional in receiving fund (taxed below)
        const totalContrib = netCC + totalNCC + cgtCapAmt + inSpecieAmt;
        totalContribVals.push(totalContrib + splitIn);

        // Contributions tax
        const cTax = Math.round(netCC * contribTaxRate);
        const splitInTax = Math.round(splitIn * contribTaxRate);
        contribTaxVals.push(-(cTax + splitInTax));

        // Net contributions after tax
        const netContrib = totalContrib + splitIn - cTax - splitInTax;

        // Fees — split admin/platform fees from insurance premiums
        const yearAdminFees = Math.round(adminFee + (revisedBal * pctFee));
        const yearInsPremium = Math.round(useInsurance * (insInflationOn ? Math.pow(1 + insInflationRate, y) : 1));
        const totalFees = yearAdminFees + yearInsPremium;
        adminFeeVals.push(-yearAdminFees);
        insPremVals.push(-yearInsPremium);
        totalFeeVals.push(-totalFees);

        // Growth on average balance (revised after rollovers)
        const avgBal = revisedBal + (netContrib - totalFees) / 2;
        const growth = Math.round(avgBal * superGrowthRate);
        growthVals.push(growth);

        // Tax component tracking:
        // NCC → tax-free; CGT cap contrib → tax-free; in-specie NCC → tax-free; split-out reduces TF proportionally; all else → taxable
        runTaxFree = runTaxFree + totalNCC + cgtCapAmt + inSpecieAmt;
        tfNccVals.push(totalNCC + cgtCapAmt + inSpecieAmt);
        let tfSplitOutYear = 0;
        if (splitOut > 0 && openBal > 0) {
          const tfProportion = runTaxFree / (runTaxable + runTaxFree || 1);
          const splitOutTF = Math.round(splitOut * tfProportion);
          runTaxFree -= splitOutTF;
          runTaxable -= (splitOut - splitOutTF);
          tfSplitOutYear = splitOutTF;
        }
        tfSplitOutVals.push(tfSplitOutYear > 0 ? -tfSplitOutYear : 0);
        const netCCAfterTax = netCC - cTax;
        const netSplitInAfterTax = splitIn - splitInTax;
        runTaxable = runTaxable + netCCAfterTax + netSplitInAfterTax - totalFees + growth;

        // Update running balance
        running = revisedBal + netContrib - totalFees + growth;

        // ── Recontribution strategy: EOY timing ──
        const rcEOY = stratRecontrByFund[fi][y].EOY;
        let tfWithdrawEOY = 0, tfRecontrSelfEOY = 0, tfRecontrToPartnerEOY = 0, tfRecontrFromPartnerEOY = 0;
        if (rcEOY) {
          const withdrawAmt = Math.min(rcEOY.withdrawAmt, Math.round(running));
          if (withdrawAmt > 0) {
            const totalComp = runTaxable + runTaxFree || 1;
            const tfPropW = runTaxFree / totalComp;
            const wTF = Math.round(withdrawAmt * tfPropW);
            const wTaxable = withdrawAmt - wTF;

            // Tax calculation using actual proportions
            const clientKey2 = rcEOY.cKey;
            const clientDob2 = engineData[clientKey2]?.date_of_birth;
            const presAge2 = calcPreservationAge(clientDob2);
            const ageAtYear2 = (ageAtFYStart(clientDob2) ?? 60) + y;
            let withdrawalTaxEOY = 0;
            if (ageAtYear2 >= 60) {
              withdrawalTaxEOY = 0; // tax free at 60+
            } else if (ageAtYear2 < presAge2) {
              // Under preservation age — 22% flat, LRT does NOT apply
              withdrawalTaxEOY = Math.round(wTaxable * LUMP_SUM_TAX_UNDER_PRES_AGE);
            } else {
              // Preservation age to 59 — LRT applies
              const capRem = lowRateRemaining[clientKey2];
              const withinCap = Math.min(wTaxable, Math.max(0, capRem));
              const aboveCap = Math.max(0, wTaxable - withinCap);
              withdrawalTaxEOY = Math.round(aboveCap * LUMP_SUM_TAX_ABOVE_CAP);
              lowRateRemaining[clientKey2] = Math.max(0, capRem - withinCap);
            }

            runTaxFree = Math.max(0, runTaxFree - wTF);
            runTaxable = Math.max(0, runTaxable - wTaxable);
            running -= withdrawAmt;
            running -= withdrawalTaxEOY;
            runTaxable = Math.max(0, runTaxable - withdrawalTaxEOY);
            tfWithdrawEOY = wTF;

            const netRecontribEOY = rcEOY.pureDrawdown ? 0 : (withdrawAmt - withdrawalTaxEOY);
            recontrWithdrawEOYVals[recontrWithdrawEOYVals.length - 1] = -withdrawAmt;
            recontrTaxVals[recontrTaxVals.length - 1] = withdrawalTaxEOY > 0 ? -withdrawalTaxEOY : 0;
            // Update LRT tracking for EOY
            const lrtAfterEOY = lowRateRemaining[clientKey2];
            const lrtConsumedEOY = Math.max(0, lrtRunningRemaining - lrtAfterEOY);
            if (lrtConsumedEOY > 0) {
              lrtConsumedVals[lrtConsumedVals.length - 1] += lrtConsumedEOY;
              lrtRunningRemaining = lrtAfterEOY;
              lrtRemainingVals[lrtRemainingVals.length - 1] = Math.max(0, lrtRunningRemaining);
            }
            if (!rcEOY.pureDrawdown) {
              if (!rcEOY.toPartner) {
                running += netRecontribEOY;
                runTaxFree += netRecontribEOY;
                recontrSelfVals[recontrSelfVals.length - 1] = netRecontribEOY;
                tfRecontrSelfEOY = netRecontribEOY;
              } else {
                recontrToPartnerVals[recontrToPartnerVals.length - 1] = -netRecontribEOY;
                tfRecontrToPartnerEOY = netRecontribEOY;
                const partnerKey2b = clientKey2 === "client1" ? "client2" : "client1";
                const partnerFundIdx2 = sgFundByClient[partnerKey2b]?.idx ?? superFunds.findIndex(sf => sf.owner === partnerKey2b);
                if (partnerFundIdx2 >= 0) stratRecontrNccByFund[partnerFundIdx2][y] = netRecontribEOY;
              }
            }
          }
        }
        // NCC from 107 EOY flowing into this fund
        if (rcNccIn > 0) {
          const hasEOY107 = superFunds.some((sf, sfi) => {
            const srcRc = stratRecontrByFund[sfi][y].EOY;
            return srcRc && srcRc.toPartner &&
              (sgFundByClient[srcRc.cKey === "client1" ? "client2" : "client1"]?.idx ?? superFunds.findIndex(s => s.owner !== srcRc.cKey)) === fi;
          });
          if (hasEOY107) {
            running += rcNccIn;
            runTaxFree += rcNccIn;
            recontrFromPartnerVals[recontrFromPartnerVals.length - 1] = rcNccIn;
            tfRecontrFromPartnerEOY = rcNccIn;
          }
        }
        tfWithdrawEOYVals.push(tfWithdrawEOY > 0 ? -tfWithdrawEOY : 0);
        tfRecontrSelfEOYVals.push(tfRecontrSelfEOY);
        tfRecontrToPartnerEOYVals.push(tfRecontrToPartnerEOY > 0 ? -tfRecontrToPartnerEOY : 0);
        tfRecontrFromPartnerEOYVals.push(tfRecontrFromPartnerEOY);

        // ── EOY lump sum contributions ──
        const lcEOY = stratLumpContrib[fi][y].EOY;
        const lsNccEOY = lcEOY?.ncc || 0;
        const lsSpouseEOY = lcEOY?.spouseNcc || 0;
        const lsPersonalEOY = lcEOY?.personalDeductible || 0;
        if (lsNccEOY > 0) { running += lsNccEOY; runTaxFree += lsNccEOY; }
        if (lsSpouseEOY > 0) { running += lsSpouseEOY; runTaxFree += lsSpouseEOY; }
        if (lsPersonalEOY > 0) { const net = Math.round(lsPersonalEOY * (1 - lumpContribTaxRate)); running += net; runTaxable += net; }
        lumpNccEOYVals.push(lsNccEOY);
        lumpSpouseEOYVals.push(lsSpouseEOY);
        lumpPersonalDeductibleEOYVals.push(lsPersonalEOY);

        // Clamp
        if (runTaxable < 0) { runTaxFree += runTaxable; runTaxable = 0; }
        if (runTaxFree < 0) { runTaxable += runTaxFree; runTaxFree = 0; }
        tfClosingVals.push(Math.round(runTaxFree));
        yearEndVals.push(Math.round(running)); // actual closing balance after ALL transactions
      }

      const entity = sp.owner === "client1" ? c1Short : c2Short;
      return {
        sp, entity, openVals: vals, sgVals, ssVals, atVals, cgtCapVals, inSpecieVals,
        spouseVals, splitInVals, splitOutVals,
        contribTaxVals, adminFeeVals, insPremVals, totalFeeVals, growthVals, totalContribVals,
        taxableVals, taxFreeVals, taxFreePctVals,
        rollOutVals, rollInVals, revisedVals, transactedVals,
        rollInDetails: rollInDetailPerFund[fi] || [], rollOutDetails: rollOutDetailPerFund[fi] || [],
        rollOutTaxFreeVals, rollInTaxFreeVals, rollInTaxableVals,
        recontrWithdrawVals, recontrWithdrawEOYVals, recontrTaxVals, recontrSelfVals, recontrToPartnerVals, recontrFromPartnerVals,
        tfOpenVals, tfRollOutVals, tfRollInVals,
        tfWithdrawSOYVals, tfRecontrSelfSOYVals, tfRecontrToPartnerSOYVals, tfRecontrFromPartnerSOYVals,
        tfRevisedVals,
        tfNccVals, tfSplitOutVals,
        tfWithdrawEOYVals, tfRecontrSelfEOYVals, tfRecontrToPartnerEOYVals, tfRecontrFromPartnerEOYVals,
        tfClosingVals, lrtConsumedVals, lrtRemainingVals,
        lumpNccSOYVals, lumpSpouseSOYVals, lumpPersonalDeductibleSOYVals,
        lumpNccEOYVals, lumpSpouseEOYVals, lumpPersonalDeductibleEOYVals,
        closingVals: yearEndVals,
      };
    });

    // Group super by entity (owner)
    const superEntityMap = {};
    superProjections.forEach(proj => {
      if (!superEntityMap[proj.entity]) superEntityMap[proj.entity] = [];
      superEntityMap[proj.entity].push(proj);
    });
    const superRows = Object.entries(superEntityMap).map(([entity, projs]) => {
      const entityVals = new Array(N).fill(0);
      const breakdown = [];
      projs.forEach(proj => {
        proj.closingVals.forEach((v, y) => { entityVals[y] += v; });
        const bal = parseFloat(proj.sp.balance) || 0;
        breakdown.push({ name: `${proj.sp.fund_name} — ${proj.sp.product}`, value: bal, nav: ["Products", "Superannuation", superFundTabs[superFunds.indexOf(proj.sp)]?.key || `Super ${superFunds.indexOf(proj.sp) + 1}`] });
      });
      // Add SMSF accounts for this entity
      const clientKey = entity === c1Short ? "client1" : entity === c2Short ? "client2" : null;
      if (clientKey) {
        (engineData.smsfs || []).forEach((sf, si) => {
          const fund = smsfDataList[si];
          if (!fund) return;
          (sf.accounts || []).forEach((acc, ai) => {
            if (acc.owner !== clientKey) return;
            const closingBals = fund.mClosingBal?.[ai];
            if (!closingBals) return;
            closingBals.forEach((v, y) => { if (y < N) entityVals[y] += v; });
            const bal = parseFloat(acc.balance) || 0;
            const envLabel = acc.tax_environment === "pension" ? "Pension" : "Accumulation";
            const sfName = sf.smsf_name || `SMSF ${si + 1}`;
            // Find the matching tab for navigation
            const segTab = smsfTabs.find(t => t.type === "seg_account" && t.idx === si && t.accIdx === ai);
            const membersTab = smsfTabs.find(t => t.type === "members" && t.idx === si);
            const smsfSubTab = smsfSubTabs.find(s => s === sfName);
            const navTarget = segTab ? [smsfSubTab || sfName, segTab.key] : membersTab ? [smsfSubTab || sfName, membersTab.key] : [sfName];
            breakdown.push({ name: `${sfName} — ${envLabel}`, value: bal, nav: ["Entities", ...navTarget] });
          });
        });
      }
      return { label: entity, values: entityVals, style: "child", entity, breakdown };
    });
    const superSummary = superRows.length > 0 ? superRows[0].values.map((_, y) => superRows.reduce((s, r) => s + r.values[y], 0)) : new Array(N).fill(0);

    // Investment bond totals
    const bondSummary = new Array(N).fill(0);
    const bondRows = [];
    (engineData.investmentBonds || []).forEach((b, bi) => {
      const bondResult = _buildBondData({ engineData, factFind, N_YEARS, isAdviceModel, currentFY, PROJ_YEARS, shortYears, ffAssets }, bi);
      if (!bondResult) return;
      const owner = b.owner === "client1" ? c1Short : b.owner === "client2" ? c2Short : "Joint";
      bondResult.totalEnd.forEach((v, y) => { if (y < N) bondSummary[y] += v; });
      const bondTab = bondTabs[bi];
      bondRows.push({
        label: `${b.product_name || `Bond ${bi + 1}`} — ${owner}`,
        values: bondResult.totalEnd.slice(0, N), style: "child", entity: owner,
        breakdown: [{ name: b.product_name || `Bond ${bi + 1}`, value: parseFloat(b.balance) || 0, nav: ["Products", "Investment Bond", bondTab?.key || `Bond ${bi + 1}`] }],
      });
    });

    const assetsTotal = prSummary.map((_, y) => prSummary[y] + ipSummary[y] + hhSummary[y] + defSummary[y] + groSummary[y] + lifeSummary[y] + superSummary[y] + bondSummary[y]);

    // ── Debts projected ──
    const amortiseDebt = (d) => {
      const dRef = `debt_${ffDebts.indexOf(d)}`;
      const dBal = parseFloat(d.d_balance) || 0;
      const dRate = parseFloat(d.d_rate) || 0;
      const dStatedRepay = parseFloat(d.d_repayments) || 0;
      const dFreq = parseFloat(debtFreqOverrides[dRef] || d.d_freq) || 12;
      const dIsIO = (debtIOOverrides[dRef] !== undefined ? debtIOOverrides[dRef] : d.d_io) === "1";
      const dTermYears = parseFloat(d.d_term) || 30;
      const dTotalPeriods = dTermYears * dFreq;
      const dPeriodicRate = dRate / 100 / dFreq;

      // PMT minimum
      let dMinRepay = 0;
      if (!dIsIO && dBal > 0 && dPeriodicRate > 0 && dTotalPeriods > 0) {
        dMinRepay = dBal * dPeriodicRate / (1 - Math.pow(1 + dPeriodicRate, -dTotalPeriods));
      }
      const dEffective = dIsIO ? 0 : Math.max(dStatedRepay, dMinRepay);

      const vals = [];
      let open = dBal;
      for (let y = 0; y < N; y++) {
        vals.push(Math.round(open));
        if (open <= 0) continue;
        if (dIsIO) {
          // Balance unchanged
        } else {
          let periodBal = open;
          for (let p = 0; p < dFreq; p++) {
            if (periodBal <= 0) break;
            const pInt = periodBal * dPeriodicRate;
            const pPrinc = Math.max(0, Math.min(dEffective, periodBal + pInt) - pInt);
            periodBal = Math.max(0, periodBal - pPrinc);
          }
          open = periodBal;
        }
      }
      return vals;
    };

    const homeDebts = ffDebts.filter(d => d.d_type === "1");
    const invDebts = ffDebts.filter(d => ["2","3"].includes(d.d_type));
    const otherDebts = ffDebts.filter(d => !["1","2","3"].includes(d.d_type));

    const debtOwnerLabel = (d) => {
      if (d.d_ownType === "2" || d.d_owner === "joint") return "Joint";
      if (d.d_owner === "client1") return c1Display;
      if (d.d_owner === "client2") return c2Display;
      // Reuse asset owner resolution for entities
      return ownerLabel({ a_owner: d.d_owner, a_ownType: d.d_ownType });
    };

    const buildEntityGroupedDebtRows = (debts, navTab, categoryLabel) => {
      const entityMap = {};
      debts.forEach(d => {
        const entity = debtOwnerLabel(d);
        if (!entityMap[entity]) entityMap[entity] = [];
        entityMap[entity].push(d);
      });
      const rows = [];
      Object.entries(entityMap).forEach(([entity, entityDebts]) => {
        const entityVals = new Array(N).fill(0);
        const breakdown = [];
        entityDebts.forEach(d => {
          const projected = amortiseDebt(d);
          projected.forEach((v, y) => { entityVals[y] += v; });
          breakdown.push({ name: d.d_name || "Loan", value: parseFloat(d.d_balance) || 0, isIO: d.d_io === "1", nav: ["Assets & Liabilities", "Debts", navTab] });
        });
        const label = categoryLabel;
        rows.push({ label, values: entityVals, style: "child", entity, breakdown });
      });
      return rows;
    };

    const homeDebtRows = buildEntityGroupedDebtRows(homeDebts, "Home Loan", "Home Loan");
    const homeDebtSummary = homeDebtRows.length > 0 ? homeDebtRows[0].values.map((_, y) => homeDebtRows.reduce((s, r) => s + r.values[y], 0)) : new Array(N).fill(0);

    const invDebtRows = buildEntityGroupedDebtRows(invDebts, "Investment Loans", "Investment Loan");
    const invDebtSummary = invDebtRows.length > 0 ? invDebtRows[0].values.map((_, y) => invDebtRows.reduce((s, r) => s + r.values[y], 0)) : new Array(N).fill(0);

    const otherDebtRows = buildEntityGroupedDebtRows(otherDebts, "Other", "Other Debt");
    const otherDebtSummary = otherDebtRows.length > 0 ? otherDebtRows[0].values.map((_, y) => otherDebtRows.reduce((s, r) => s + r.values[y], 0)) : new Array(N).fill(0);

    const debtsTotal = homeDebtSummary.map((_, y) => homeDebtSummary[y] + invDebtSummary[y] + otherDebtSummary[y]);
    const netEquityFV = assetsTotal.map((a, y) => a - debtsTotal[y]);
    const netEquityExPR = netEquityFV.map((ne, y) => ne - prSummary[y]);

    // ── Pension drawdown income per client ──
    const buildPensionDrawdowns = (clientKey) => {
      const clientPensions = pensionFunds.filter(p => p.owner === clientKey);
      const totalDrawdown = new Array(N).fill(0);
      const breakdowns = [];

      clientPensions.forEach(pf => {
        const bal0 = parseFloat(pf.balance) || 0;
        const drawdownRate = (parseFloat(pf.drawdown_rate) || 5) / 100;
        const drawdownType = pf.drawdown_type || "percentage";
        const drawdownFixed = parseFloat(pf.drawdown_amount) || 0;
        const adminFee = parseFloat(pf.fees?.admin_fee) || 0;
        const pctFee = (parseFloat(pf.fees?.percent_fee) || 0) / 100;
        const pensionGrowthRate = 0.07;

        const minDrawdownRate = (age) => {
          if (age < 65) return 0.04;
          if (age < 75) return 0.05;
          if (age < 80) return 0.06;
          if (age < 85) return 0.07;
          if (age < 90) return 0.09;
          if (age < 95) return 0.11;
          return 0.14;
        };

        const clientDobPen = clientKey === "client1" ? engineData.client1?.date_of_birth : engineData.client2?.date_of_birth;
        const startAge = ageAtFYStart(clientDobPen) ?? (clientKey === "client1" ? 60 : 56);

        let running = bal0;
        const drawdownVals = [];
        for (let y = 0; y < N; y++) {
          if (running <= 0) { drawdownVals.push(0); continue; }
          const age = startAge + y;
          const minRate = minDrawdownRate(age);
          const minDraw = Math.round(running * minRate);
          let drawdown;
          if (drawdownType === "dollar") {
            drawdown = Math.max(minDraw, drawdownFixed);
          } else {
            drawdown = Math.max(minDraw, Math.round(running * drawdownRate));
          }
          drawdown = Math.min(drawdown, running);
          drawdownVals.push(drawdown);
          const fees = Math.round(adminFee + (running * pctFee));
          const avgBal = running - drawdown / 2 - fees / 2;
          const growth = Math.round(Math.max(0, avgBal) * pensionGrowthRate);
          running = Math.max(0, running - drawdown - fees + growth);
        }

        drawdownVals.forEach((d, y) => { totalDrawdown[y] += d; });
        if (bal0 > 0) {
          const pensionIdx = pensionFunds.indexOf(pf);
          breakdowns.push({
            name: `${pf.fund_name} — ${pf.product}`,
            value: bal0,
            nav: ["Products", "Pension", pensionTabs[pensionIdx]?.key || `Pension ${pensionIdx + 1}`],
          });
        }
      });

      // SMSF pension accounts — add drawdowns to personal cashflow
      (engineData.smsfs || []).forEach((sf, si) => {
        (sf.accounts || []).forEach(acc => {
          if (acc.tax_environment !== "pension" || acc.owner !== clientKey) return;
          const annualDrawdown = parseFloat(acc.pension_drawdown) || 0;
          if (annualDrawdown <= 0) return;
          const sfName = sf.smsf_name || `SMSF ${si + 1}`;
          for (let y = 0; y < N; y++) { totalDrawdown[y] += annualDrawdown; }
          breakdowns.push({
            name: `${sfName} — Pension`,
            value: parseFloat(acc.balance) || 0,
            nav: ["Entities", "SMSF", `${sfName} — Members`],
          });
        });
      });

      return { values: totalDrawdown, breakdowns };
    };

    const c1Pension = buildPensionDrawdowns("client1");
    const c2Pension = buildPensionDrawdowns("client2");

    // ── Annuity income per client ──
    const annuityFunds = engineData.annuities || [];
    const buildAnnuityIncome = (clientKey) => {
      const clientAnnuities = annuityFunds.filter(a => a.owner === clientKey);
      const totalIncome = new Array(N).fill(0);
      const breakdowns = [];
      clientAnnuities.forEach(an => {
        const annualIncome = parseFloat(an.income?.annual_income) || 0;
        if (annualIncome <= 0) return;
        const cpiIndexed = an.cpi_indexed !== false;
        const cpiRate = 0.025;
        const isFixedTerm = an.annuity_type === "fixed-term";
        const commDate = an.commencement_date ? new Date(an.commencement_date) : null;
        const matDate = an.maturity_date ? new Date(an.maturity_date) : null;
        const termYears = matDate && commDate ? Math.round((matDate - commDate) / (365.25 * 86400000)) : 0;
        const yearsElapsed = commDate ? Math.round((new Date(currentFY, 6, 1) - commDate) / (365.25 * 86400000)) : 0;
        const remainingTerm = isFixedTerm ? Math.max(0, termYears - yearsElapsed) : 99;
        for (let y = 0; y < N; y++) {
          if (isFixedTerm && y >= remainingTerm) continue;
          totalIncome[y] += cpiIndexed ? Math.round(annualIncome * Math.pow(1 + cpiRate, y)) : annualIncome;
        }
        const anIdx = annuityFunds.indexOf(an);
        breakdowns.push({
          name: an.product,
          value: annualIncome,
          nav: ["Products", "Annuity", annuityTabs[anIdx]?.key || `Annuity ${anIdx + 1}`],
        });
      });
      return { values: totalIncome, breakdowns };
    };
    const c1Annuity = buildAnnuityIncome("client1");
    const c2Annuity = buildAnnuityIncome("client2");

    // Rebuild net income to include pension drawdowns, annuity income, trust distributions, and company dividends
    const c1NetIncomeWithPension = c1NetIncome.map((v, y) => v + c1Pension.values[y] + c1Annuity.values[y] + entityDist.c1TrustDist[y] + entityDist.c1CompanyDiv[y] + entityDist.c1ExitCapReturn[y] + entityDist.c1DirectorFees[y] + entityDist.c1Div7AProceeds[y] + entityDist.c1SHLoanInterestInc[y] - entityDist.c1Div7ARepayments[y] - entityDist.c1SHLoanOutflow[y] - entityDist.c1CapInjectionOutflow[y] - entityDist.c1TrustContribOutflow[y] + entityDist.c1TrustDrawings[y] + entityDist.c1TrustDistPayout[y]);
    const c2NetIncomeWithPension = c2NetIncome.map((v, y) => v + c2Pension.values[y] + c2Annuity.values[y] + entityDist.c2TrustDist[y] + entityDist.c2CompanyDiv[y] + entityDist.c2ExitCapReturn[y] + entityDist.c2DirectorFees[y] + entityDist.c2Div7AProceeds[y] + entityDist.c2SHLoanInterestInc[y] - entityDist.c2Div7ARepayments[y] - entityDist.c2SHLoanOutflow[y] - entityDist.c2CapInjectionOutflow[y] - entityDist.c2TrustContribOutflow[y] + entityDist.c2TrustDrawings[y] + entityDist.c2TrustDistPayout[y]);

    // ── Sell Transaction proceeds per client for Timeline ──
    const c1SellProceeds = new Array(N).fill(0);
    const c2SellProceeds = new Array(N).fill(0);
    const tlSellRows = [];
    if (isAdviceModel) {
      const sellTxnsTL = (engineData.advice_request?.transactions?.sell || []);
      const currentFYTL = new Date().getFullYear();
      sellTxnsTL.forEach(s => {
        const assetIdx = parseInt(s.asset_idx);
        const asset = !isNaN(assetIdx) ? ffAssets[assetIdx] : null;
        if (!asset) return;
        const isPersonal = !["3", "4", "5"].includes(s.entity_type);
        if (!isPersonal) return; // entity sales don't directly hit personal cashflow
        const sellYear = parseInt(s.sell_year) || currentFYTL;
        const yIdx = sellYear - currentFYTL;
        if (yIdx < 0 || yIdx >= N) return;
        const currentVal = parseFloat(asset.a_value) || 0;
        const sellAmt = s.sell_entire_amount ? currentVal : Math.min(parseFloat(s.amount) || 0, currentVal);
        const txnCostPct = (parseFloat(s.transaction_costs_pct) || 0) / 100;
        const netProceeds = Math.round(sellAmt * (1 - txnCostPct));
        const isJoint = asset.a_owner === "joint";
        const isC1 = asset.a_owner === "client1";
        if (isJoint) {
          c1SellProceeds[yIdx] += Math.round(netProceeds * 0.5);
          c2SellProceeds[yIdx] += Math.round(netProceeds * 0.5);
        } else if (isC1) {
          c1SellProceeds[yIdx] += netProceeds;
        } else {
          c2SellProceeds[yIdx] += netProceeds;
        }
        const vals = new Array(N).fill(0);
        vals[yIdx] = netProceeds;
        tlSellRows.push({ label: `Sale: ${s.description}`, values: vals, style: "child" });
      });
    }
    const c1NetWithSell = c1NetIncomeWithPension.map((v, y) => v + c1SellProceeds[y] + c1DBLumpSumVals[y]);
    const c2NetWithSell = c2NetIncomeWithPension.map((v, y) => v + c2SellProceeds[y] + c2DBLumpSumVals[y]);
    // Note: Age pension (c1PensionShare / c2PensionShare) added post-build via patchFinancialSummaryWithPension
    const totalNetIncomeWithPension = c1NetWithSell.map((v, y) => v + c2NetWithSell[y]);

    // Objectives / Goals — project as expenses
    const tlObjectivesList = engineData.advice_reason?.objectives || [];
    const tlObjectiveVals = new Array(N).fill(0);
    const tlObjectiveRows = [];
    const tlFYStart = new Date().getFullYear();
    tlObjectivesList.forEach((obj, idx) => {
      const amount = parseFloat(obj.o_amount) || 0;
      if (amount <= 0) return;
      const startYear = parseInt(obj.o_start) || tlFYStart;
      const endYear = parseInt(obj.o_end) || startYear;
      const cpiRate = 0.025;
      const typeLabel = (OBJECTIVE_TYPES.find(t => t.value === obj.o_type) || {}).label || `Objective ${idx + 1}`;
      const vals = new Array(N).fill(0);
      for (let y = 0; y < N; y++) {
        const projYear = tlFYStart + y;
        if (projYear < startYear || projYear > endYear) continue;
        const yearsFromStart = projYear - startYear;
        vals[y] = Math.round(amount * Math.pow(1 + cpiRate, yearsFromStart));
        tlObjectiveVals[y] += vals[y];
      }
      if (vals.some(v => v > 0)) {
        tlObjectiveRows.push({ label: typeLabel, values: vals, style: "child" });
      }
    });

    // Strategy 145: Support at Home (Home Care) — client out-of-pocket contribution as expense
    const SAH_LEVELS_FS = { "1": 10731, "2": 16034, "3": 21966, "4": 29696, "5": 39697, "6": 48114, "7": 58148, "8": 78106 };
    const SAH_CONTRIB_FS = { "full": 0.05, "part": 0.125, "sfr": 0.50 };
    const sahExpenseFS = new Array(N).fill(0);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "145").forEach(s => {
        const classification = s.hcp_classification || "";
        const pensionerStatus = s.hcp_pensioner_status || "full";
        const annualSubsidy = SAH_LEVELS_FS[classification] || 0;
        if (annualSubsidy === 0) return;
        const usableBudget = annualSubsidy * 0.90; // 90% after care management
        const contribRate = SAH_CONTRIB_FS[pensionerStatus] || 0.05;
        const baseOOP = Math.round(usableBudget * contribRate);
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const ey = s.end_year === "Ongoing" ? N - 1 : Math.min(N - 1, (parseInt(s.end_year) || currentFY + 30) - currentFY);
        if (sy >= N) return;
        const inflRate = parseFloat(engineData.assumptions?.a_cpi) / 100 || 0.025;
        for (let y = sy; y <= ey && y < N; y++) {
          sahExpenseFS[y] += Math.round(baseOOP * Math.pow(1 + inflRate, y));
        }
      });
    }

    const totalExpensesFS = livingVals.map((l, i) => l + rentPaidVals[i] + hhExpenseVals[i] + totalDebtServicing[i] + combinedNonSuperIns[i] + tlObjectiveVals[i] + sahExpenseFS[i]);
    const netCashflowWithPension = totalNetIncomeWithPension.map((v, y) => v - totalExpensesFS[y]);

    return {
      years,
      sections: [
        { id: "ages", rows: ageRows },
        { id: "income-client1", title: "Net Income", entity: c1Display, source: { label: "Tax Schedule", nav: ["Cashflow/Tax", "Tax", c1Display] }, rows: [
          { label: "Salary", values: c1SalaryExPPL, style: "child" },
          ...(c1PPL.some(v => v > 0) ? [{ label: "Paid Parental Leave", values: c1PPL, style: "child" }] : []),
          ...(c1JS.some(v => v > 0) ? [{ label: "JobSeeker Payment", values: c1JS, style: "child" }] : []),
          ...(c1DSP.some(v => v > 0) ? [{ label: "Disability Support Pension", values: c1DSP, style: "child" }] : []),
          ...(c1RentalVals.some(v => v > 0) ? [{ label: "Rental Income", values: c1RentalVals, style: "child", source: { label: "Property", nav: ["Assets & Liabilities", "Assets", "Property"] }, breakdown: c1RentalBreakdown }] : []),
          ...(c1InvestIncVals.some(v => v > 0) ? [{ label: "Investment Income", values: c1InvestIncVals, style: "child", breakdown: c1InvestBreakdown }] : []),
          ...(c1FrankingVals.some(v => v > 0) ? [{ label: "Franking Credits", values: c1FrankingVals, style: "child" }] : []),
          ...(c1Pension.values.some(v => v > 0) ? [{ label: "Pension Income", values: c1Pension.values, style: "child", breakdown: c1Pension.breakdowns }] : []),
          ...(c1Annuity.values.some(v => v > 0) ? [{ label: "Annuity Income", values: c1Annuity.values, style: "child", breakdown: c1Annuity.breakdowns }] : []),
          ...(c1DBPensionVals.some(v => v > 0) ? [{ label: "DB Pension Income", values: c1DBPensionVals, style: "child", source: { label: "Defined Benefit", nav: ["Products", "Defined Benefit", null] } }] : []),
          ...(c1DBLumpSumVals.some(v => v > 0) ? [{ label: "DB Lump Sum (net)", values: c1DBLumpSumVals, style: "child", source: { label: "Defined Benefit", nav: ["Products", "Defined Benefit", null] },
            breakdown: (() => {
              const bk = dbLumpBreakdowns.client1;
              const items = [];
              Object.entries(bk).forEach(([yr, d]) => {
                items.push({ name: `${d.schemeName} Gross Benefit`, value: d.gross });
                items.push({ name: `  Taxed Element`, value: d.taxedElement });
                items.push({ name: `  Untaxed Element`, value: d.untaxedElement });
                items.push({ name: `  Tax on Lump Sum`, value: -d.tax });
                items.push({ name: `  Net Lump Sum`, value: d.net });
              });
              return items;
            })() }] : []),
          ...(entityDist.c1TrustDist.some(v => v > 0) ? [{ label: "Trust Distributions", values: entityDist.c1TrustDist, style: "child", source: { label: "Entities", nav: ["Entities", "Trusts", null] } }] : []),
          ...(entityDist.c1CompanyDiv.some(v => v > 0) ? [{ label: "Company Dividends", values: entityDist.c1CompanyDiv, style: "child", source: { label: "Entities", nav: ["Entities", "Companies", null] } }] : []),
          ...(entityDist.c1StratDividend.some(v => v > 0) ? [{ label: "Strategy — Dividends Received", values: entityDist.c1StratDividend, style: "child" }] : []),
          ...(entityDist.c1DirectorFees.some(v => v > 0) ? [{ label: "Strategy — Director Fees", values: entityDist.c1DirectorFees, style: "child" }] : []),
          ...(entityDist.c1Div7AProceeds.some(v => v > 0) ? [{ label: "Strategy — Div 7A Loan Received", values: entityDist.c1Div7AProceeds, style: "child" }] : []),
          ...(entityDist.c1Div7ARepayments.some(v => v > 0) ? [{ label: "Strategy — Div 7A Repayments", values: entityDist.c1Div7ARepayments.map(v => -v), style: "child-negative" }] : []),
          ...(entityDist.c1SHLoanOutflow.some(v => v > 0) ? [{ label: "Strategy — Shareholder Loan to Company", values: entityDist.c1SHLoanOutflow.map(v => -v), style: "child-negative" }] : []),
          ...(entityDist.c1SHLoanInterestInc.some(v => v > 0) ? [{ label: "Strategy — Loan Interest Received", values: entityDist.c1SHLoanInterestInc, style: "child" }] : []),
          ...(entityDist.c1CapInjectionOutflow.some(v => v > 0) ? [{ label: "Strategy — Capital Injection to Company", values: entityDist.c1CapInjectionOutflow.map(v => -v), style: "child-negative" }] : []),
          ...(entityDist.c1TrustContribOutflow.some(v => v > 0) ? [{ label: "Strategy — Cash Injection to Trust", values: entityDist.c1TrustContribOutflow.map(v => -v), style: "child-negative" }] : []),
          ...(entityDist.c1TrustDrawings.some(v => v > 0) ? [{ label: "Strategy — Trust Drawings Received", values: entityDist.c1TrustDrawings, style: "child" }] : []),
          ...(entityDist.c1TrustDistPayout.some(v => v > 0) ? [{ label: "Strategy — Trust Distribution Payout", values: entityDist.c1TrustDistPayout, style: "child" }] : []),
          ...(entityDist.c1ExitCapReturn.some(v => v > 0) ? [{ label: "Company Exit — Capital Return (tax-free)", values: entityDist.c1ExitCapReturn, style: "child" }] : []),
          ...(c1SellProceeds.some(v => v > 0) ? [{ label: "Asset Sale Proceeds", values: c1SellProceeds, style: "child" }] : []),
          ...(c1HHDeductions.some(v => v > 0) ? [{ label: "Holiday Home Deductions", values: c1HHDeductions.map(v => -v), style: "child-negative" }] : []),
          ...(c1IncAdj.some(v => v !== 0) ? [{ label: "Income Adjustment", values: c1IncAdj, style: c1IncAdj.find(v => v !== 0) >= 0 ? "child" : "child-negative" }] : []),
          { label: "Tax Payable", values: c1Tax, style: "child-negative" },
          { label: "Total Cash Inflow", values: c1NetWithSell, style: "total" },
        ]},
        { id: "income-client2", title: "Net Income", entity: c2Display, source: { label: "Tax Schedule", nav: ["Cashflow/Tax", "Tax", c2Display] }, rows: [
          { label: "Salary", values: c2SalaryExPPL, style: "child" },
          ...(c2PPL.some(v => v > 0) ? [{ label: "Paid Parental Leave", values: c2PPL, style: "child" }] : []),
          ...(c2JS.some(v => v > 0) ? [{ label: "JobSeeker Payment", values: c2JS, style: "child" }] : []),
          ...(c2DSP.some(v => v > 0) ? [{ label: "Disability Support Pension", values: c2DSP, style: "child" }] : []),
          ...(c2RentalVals.some(v => v > 0) ? [{ label: "Rental Income", values: c2RentalVals, style: "child", source: { label: "Property", nav: ["Assets & Liabilities", "Assets", "Property"] }, breakdown: c2RentalBreakdown }] : []),
          ...(c2InvestIncVals.some(v => v > 0) ? [{ label: "Investment Income", values: c2InvestIncVals, style: "child", breakdown: c2InvestBreakdown }] : []),
          ...(c2FrankingVals.some(v => v > 0) ? [{ label: "Franking Credits", values: c2FrankingVals, style: "child" }] : []),
          ...(c2Pension.values.some(v => v > 0) ? [{ label: "Pension Income", values: c2Pension.values, style: "child", breakdown: c2Pension.breakdowns }] : []),
          ...(c2Annuity.values.some(v => v > 0) ? [{ label: "Annuity Income", values: c2Annuity.values, style: "child", breakdown: c2Annuity.breakdowns }] : []),
          ...(c2DBPensionVals.some(v => v > 0) ? [{ label: "DB Pension Income", values: c2DBPensionVals, style: "child", source: { label: "Defined Benefit", nav: ["Products", "Defined Benefit", null] } }] : []),
          ...(c2DBLumpSumVals.some(v => v > 0) ? [{ label: "DB Lump Sum (net)", values: c2DBLumpSumVals, style: "child", source: { label: "Defined Benefit", nav: ["Products", "Defined Benefit", null] },
            breakdown: (() => {
              const bk = dbLumpBreakdowns.client2;
              const items = [];
              Object.entries(bk).forEach(([yr, d]) => {
                items.push({ name: `${d.schemeName} Gross Benefit`, value: d.gross });
                items.push({ name: `  Taxed Element`, value: d.taxedElement });
                items.push({ name: `  Untaxed Element`, value: d.untaxedElement });
                items.push({ name: `  Tax on Lump Sum`, value: -d.tax });
                items.push({ name: `  Net Lump Sum`, value: d.net });
              });
              return items;
            })() }] : []),
          ...(entityDist.c2TrustDist.some(v => v > 0) ? [{ label: "Trust Distributions", values: entityDist.c2TrustDist, style: "child", source: { label: "Entities", nav: ["Entities", "Trusts", null] } }] : []),
          ...(entityDist.c2CompanyDiv.some(v => v > 0) ? [{ label: "Company Dividends", values: entityDist.c2CompanyDiv, style: "child", source: { label: "Entities", nav: ["Entities", "Companies", null] } }] : []),
          ...(entityDist.c2StratDividend.some(v => v > 0) ? [{ label: "Strategy — Dividends Received", values: entityDist.c2StratDividend, style: "child" }] : []),
          ...(entityDist.c2DirectorFees.some(v => v > 0) ? [{ label: "Strategy — Director Fees", values: entityDist.c2DirectorFees, style: "child" }] : []),
          ...(entityDist.c2Div7AProceeds.some(v => v > 0) ? [{ label: "Strategy — Div 7A Loan Received", values: entityDist.c2Div7AProceeds, style: "child" }] : []),
          ...(entityDist.c2Div7ARepayments.some(v => v > 0) ? [{ label: "Strategy — Div 7A Repayments", values: entityDist.c2Div7ARepayments.map(v => -v), style: "child-negative" }] : []),
          ...(entityDist.c2SHLoanOutflow.some(v => v > 0) ? [{ label: "Strategy — Shareholder Loan to Company", values: entityDist.c2SHLoanOutflow.map(v => -v), style: "child-negative" }] : []),
          ...(entityDist.c2SHLoanInterestInc.some(v => v > 0) ? [{ label: "Strategy — Loan Interest Received", values: entityDist.c2SHLoanInterestInc, style: "child" }] : []),
          ...(entityDist.c2CapInjectionOutflow.some(v => v > 0) ? [{ label: "Strategy — Capital Injection to Company", values: entityDist.c2CapInjectionOutflow.map(v => -v), style: "child-negative" }] : []),
          ...(entityDist.c2TrustContribOutflow.some(v => v > 0) ? [{ label: "Strategy — Cash Injection to Trust", values: entityDist.c2TrustContribOutflow.map(v => -v), style: "child-negative" }] : []),
          ...(entityDist.c2TrustDrawings.some(v => v > 0) ? [{ label: "Strategy — Trust Drawings Received", values: entityDist.c2TrustDrawings, style: "child" }] : []),
          ...(entityDist.c2TrustDistPayout.some(v => v > 0) ? [{ label: "Strategy — Trust Distribution Payout", values: entityDist.c2TrustDistPayout, style: "child" }] : []),
          ...(entityDist.c2ExitCapReturn.some(v => v > 0) ? [{ label: "Company Exit — Capital Return (tax-free)", values: entityDist.c2ExitCapReturn, style: "child" }] : []),
          ...(c2SellProceeds.some(v => v > 0) ? [{ label: "Asset Sale Proceeds", values: c2SellProceeds, style: "child" }] : []),
          ...(c2HHDeductions.some(v => v > 0) ? [{ label: "Holiday Home Deductions", values: c2HHDeductions.map(v => -v), style: "child-negative" }] : []),
          ...(c2IncAdj.some(v => v !== 0) ? [{ label: "Income Adjustment", values: c2IncAdj, style: c2IncAdj.find(v => v !== 0) >= 0 ? "child" : "child-negative" }] : []),
          { label: "Tax Payable", values: c2Tax, style: "child-negative" },
          { label: "Total Cash Inflow", values: c2NetWithSell, style: "total" },
        ]},
        { id: "combined-cashflow", rows: [
          { label: "Total Net Income", values: totalNetIncomeWithPension, style: "highlight" },
        ]},
        { id: "expenses", title: "Expenses", source: { label: "Cashflow", nav: ["Cashflow/Tax", "Savings", null] }, subSections: [
          { id: "tl-exp-fixed", label: "Fixed Expenses", summaryValues: null, rows: [
            { label: "Living", values: livingVals, style: "child" },
            ...(rentPaidVals.some(v => v > 0) ? [{ label: "Rent Paid", values: rentPaidVals, style: "child", source: { label: "Expenses", nav: ["Expenses", null, null] } }] : []),
            ...(hhExpenseVals.some(v => v > 0) ? [{ label: "Holiday Home Costs", values: hhExpenseVals, style: "child", source: { label: "Property", nav: ["Assets & Liabilities", "Assets", "Property"] } }] : []),
            { label: "Debt Servicing", values: totalDebtServicing, style: "child", source: { label: "Debts", nav: ["Assets & Liabilities", "Debts", "Home Loan"] }, breakdown: debtBreakdowns },
            ...(combinedNonSuperIns.some(v => v > 0) ? [{ label: "Insurance (Non-Super)", values: combinedNonSuperIns, style: "child", source: { label: "Premiums", nav: ["Insurance", "Premium Costs", "Client"] } }] : []),
            ...(sahExpenseFS.some(v => v > 0) ? [{ label: "Support at Home (Home Care)", values: sahExpenseFS, style: "child" }] : []),
          ]},
          ...(tlObjectiveRows.length > 0 ? [{ id: "tl-exp-objectives", label: "Objectives / Goals", summaryValues: tlObjectiveVals, rows: tlObjectiveRows }] : []),
        ], footerRows: [
          { label: "Total Expenses", values: totalExpensesFS, style: "total" },
        ]},
        { id: "net-cashflow", rows: [
          { label: "Net Cashflow", values: netCashflowWithPension, style: "highlight" },
        ]},
        { id: "divider-1", isDivider: true },
        { id: "super-client1", title: "Superannuation Contribution Summary", entity: c1Display, source: { label: "Super", nav: ["Entities", "SMSF", `Acc — ${c1Display}`] }, rows: [
          { label: "Employer SG Contributions", values: c1SG, style: "child" },
          { label: "Salary Sacrifice", values: new Array(N).fill(Math.round(c1SalSac)), style: "child" },
          { label: "Total", values: c1SG.map((sg, i) => sg + Math.round(c1SalSac)), style: "total" },
        ]},
        { id: "super-client2", title: "Superannuation Contribution Summary", entity: c2Display, source: { label: "Super", nav: ["Entities", "SMSF", `Acc — ${c2Display}`] }, rows: [
          { label: "Employer SG Contributions", values: c2SG, style: "child" },
          { label: "Total", values: c2SG, style: "total" },
        ]},
        { id: "divider-2", isDivider: true },
        { id: "net-worth", title: "Net Worth", source: { label: "Assets", nav: ["Assets & Liabilities", "Assets", "Property"] }, subSections: [
          { id: "nw-lifestyle", label: "Lifestyle", summaryValues: lifeSummary, rows: lifeRows },
          { id: "nw-principal-residence", label: "Principal Residence", summaryValues: prSummary, rows: prRows },
          { id: "nw-investment-properties", label: "Investment Properties", summaryValues: ipSummary, rows: ipRows },
          ...(hhRows.length > 0 ? [{ id: "nw-holiday-homes", label: "Holiday Homes", summaryValues: hhSummary, rows: hhRows }] : []),
          { id: "nw-defensive", label: "Defensive Assets", summaryValues: defSummary, rows: defRows },
          { id: "nw-equities", label: "Equities/Managed Funds", summaryValues: groSummary, rows: groRows },
          { id: "nw-super", label: "Superannuation", summaryValues: superSummary, rows: superRows },
          ...(bondRows.length > 0 ? [{ id: "nw-bonds", label: "Investment Bonds", summaryValues: bondSummary, rows: bondRows }] : []),
        ], footerRows: [
          { label: "Assets Total", values: assetsTotal, style: "total" },
        ]},
        { id: "debts", title: "Debts", source: { label: "Debts", nav: ["Assets & Liabilities", "Debts", "Home Loan"] }, subSections: [
          { id: "nw-home-debt", label: "Home Loan", summaryValues: homeDebtSummary, rows: homeDebtRows },
          { id: "nw-investment-debt", label: "Investment Debt", summaryValues: invDebtSummary, rows: invDebtRows },
          ...(otherDebtRows.length > 0 ? [{ id: "nw-other-debt", label: "Other Debt", summaryValues: otherDebtSummary, rows: otherDebtRows }] : []),
        ], footerRows: [
          { label: "Debts Total", values: debtsTotal, style: "total" },
          { label: "Net Equity (FV) - Ex PR", values: netEquityExPR, style: "highlight" },
          { label: "Net Equity (FV)", values: netEquityFV, style: "highlight" },
        ]},
      ],
      superProjections,
      rollInPerPension,
      rollOutPerPension,
      rollInDetailPerPension,
      rollOutDetailPerPension,
      cashflowChartData: PROJ_YEARS.map((yr, y) => ({
        year: yr,
        c1Income: c1NetWithSell[y] || 0,
        c2Income: c2NetWithSell[y] || 0,
        livingExp: livingVals[y] || 0,
        debtExp: totalDebtServicing[y] || 0,
        insuranceExp: combinedNonSuperIns[y] || 0,
        livingExpNeg: -(livingVals[y] || 0),
        debtExpNeg: -(totalDebtServicing[y] || 0),
        insuranceExpNeg: -(combinedNonSuperIns[y] || 0),
        surplus: ((c1NetWithSell[y] || 0) + (c2NetWithSell[y] || 0)) - (livingVals[y] || 0) - (rentPaidVals[y] || 0) - (hhExpenseVals[y] || 0) - (totalDebtServicing[y] || 0) - (combinedNonSuperIns[y] || 0),
      })),
      netWorthChartData: PROJ_YEARS.map((yr, y) => ({
        year: yr,
        fy: currentFY + y,
        super: superSummary[y] || 0,
        property: (prSummary[y] || 0) + (ipSummary[y] || 0) + (hhSummary[y] || 0),
        investments: (defSummary[y] || 0) + (groSummary[y] || 0) + (bondSummary[y] || 0),
        lifestyle: lifeSummary[y] || 0,
        debt: -(debtsTotal[y] || 0),
        netWorth: netEquityFV[y] || 0,
      })),
      summaryMeta: {
        c1Name: c1Display, c2Name: c2Display,
        c1AgeNow: c1Age, c2AgeNow: c2Age,
        c1RetAge: c1RetAgeFS, c2RetAge: c2RetAgeFS,
        c1RetYr: c1RetYrFS, c2RetYr: c2RetYrFS,
        c1LE: c1Gender === "1" ? LE_FEMALE : c1Gender === "2" ? LE_MALE : 87,
        c2LE: c2Gender === "1" ? LE_FEMALE : c2Gender === "2" ? LE_MALE : 87,
        currentFY,
      },
    };
  };
