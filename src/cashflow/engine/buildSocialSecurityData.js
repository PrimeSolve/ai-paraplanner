/* ─── buildSocialSecurityData  ─── extracted from CashflowModelInner ─── */
import { AGE_PENSION_PARAMS } from "../constants/assumptions.js";

/**
 * Builds Age Pension / Social Security projection data.
 * Calculates assets test, income test, deeming, rent assistance,
 * deprived assets (gifting & granny flat), and final pension entitlement.
 *
 * @param {Object} ctx — projection context (closure variables from CashflowModelInner)
 * @returns {Object} ssData — social security projection result
 */
export const buildSocialSecurityData = (ctx) => {
  const {
    N_YEARS, PROJ_YEARS, currentFY,
    engineData, isAdviceModel,
    c1Short, c2Short,
    ffAssets,
    superProj, smsfDataList,
    trustDataList, companyDataList, bondDataList,
  } = ctx;

    const P = AGE_PENSION_PARAMS;
    const N = N_YEARS;
    const shortYears = PROJ_YEARS.map(y => { const p = y.split("/"); return p[0].slice(-4) + "/" + p[1].slice(-2); });

    // Ages
    const c1Dob = engineData.client1?.date_of_birth;
    const c2Dob = engineData.client2?.date_of_birth;
    const ageAtStart = (dob) => {
      if (!dob) return null;
      const d = new Date(dob);
      const now = new Date();
      let a = now.getFullYear() - d.getFullYear();
      if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
      return a;
    };
    const c1StartAge = ageAtStart(c1Dob);
    const c2StartAge = ageAtStart(c2Dob);
    const isCouple = c1Dob && c2Dob;

    // Both must reach pension age for couple assessment
    const c1EligibleYear = c1StartAge !== null ? Math.max(0, P.pensionAge - c1StartAge) : 999;
    const c2EligibleYear = c2StartAge !== null ? Math.max(0, P.pensionAge - c2StartAge) : 999;
    const bothEligibleYear = isCouple ? Math.max(c1EligibleYear, c2EligibleYear) : Math.min(c1EligibleYear, c2EligibleYear);

    // Homeowner detection: principal residence (a_type === "1") in assets
    // Also check if strategy 56 (move back into PR) converts a type "19" to effective "1"
    const ssAssets = engineData.assets || [];
    const hasExistingPR = ssAssets.some(a => a.a_type === "1" && (parseFloat(a.a_value) || 0) > 0);
    const moveBackStratsSS = (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "56" && s.moveback_property_idx !== "");
    const moveBackHomeownerYr = moveBackStratsSS.length > 0 ? Math.min(...moveBackStratsSS.map(s => parseInt(s.start_year) || currentFY)) : 9999;
    // Year-aware homeowner: true from the year the person moves back (or always true if already type "1")
    const isHomeownerFromYear = (y) => {
      if (hasExistingPR) return true;
      return (currentFY + y) >= moveBackHomeownerYr;
    };
    const isHomeowner = hasExistingPR || moveBackHomeownerYr <= currentFY;

    // ── Gather assessable assets per year ──
    // Assets test includes: financial assets (super in pension phase, investments, cash, bonds)
    // + non-financial (investment property market value, personal assets over threshold)
    // Excludes: principal residence, super in accumulation (pre-pension age)
    const assetRows = [];
    const assetTotals = new Array(N).fill(0);

    // 1. Super in pension phase (assessable once in pension)
    (engineData.pensions || []).forEach(pf => {
      const bal = parseFloat(pf.balance) || 0;
      if (bal <= 0) return;
      const owner = pf.owner === "client1" ? c1Short : c2Short;
      const growthRate = 0.07;
      const drawdownRate = (parseFloat(pf.drawdown_rate) || 5) / 100;
      let running = bal;
      const vals = new Array(N).fill(0);
      for (let y = 0; y < N; y++) {
        vals[y] = Math.round(running);
        const drawdown = Math.round(running * drawdownRate);
        running = Math.max(0, running - drawdown + Math.round(running * growthRate));
      }
      assetRows.push({ label: `Pension — ${pf.fund_name || "Pension"} (${owner})`, values: vals });
      vals.forEach((v, y) => { assetTotals[y] += v; });
    });

    // SMSF pension accounts
    (engineData.smsfs || []).forEach((sf, si) => {
      (sf.accounts || []).forEach((acc, ai) => {
        if (acc.tax_environment !== "pension") return;
        const bal = parseFloat(acc.balance) || 0;
        if (bal <= 0) return;
        const owner = acc.owner === "client1" ? c1Short : c2Short;
        const drawdown = parseFloat(acc.pension_drawdown) || 0;
        let running = bal;
        const vals = new Array(N).fill(0);
        for (let y = 0; y < N; y++) {
          vals[y] = Math.round(running);
          running = Math.max(0, running - drawdown + Math.round(running * 0.07));
        }
        assetRows.push({ label: `SMSF Pension — ${sf.smsf_name} (${owner})`, values: vals });
        vals.forEach((v, y) => { assetTotals[y] += v; });
      });
    });

    // 2. Super in accumulation (assessable only from pension age)
    (superProj || []).forEach(proj => {
      const owner = proj.entity;
      const isC1 = proj.sp.owner === "client1";
      const eligYear = isC1 ? c1EligibleYear : c2EligibleYear;
      const vals = new Array(N).fill(0);
      proj.closingVals.forEach((v, y) => { if (y >= eligYear) vals[y] = v; });
      if (vals.some(v => v > 0)) {
        assetRows.push({ label: `Super (accum) — ${proj.sp.fund_name} (${owner})`, values: vals });
        vals.forEach((v, y) => { assetTotals[y] += v; });
      }
    });

    // SMSF accumulation accounts
    smsfDataList.forEach((fund, si) => {
      if (fund.acctResults) {
        fund.acctResults.forEach((r, ai) => {
          if (r.isPension) return;
          const isC1 = (engineData.smsfs[si]?.accounts[ai]?.owner === "client1");
          const eligYear = isC1 ? c1EligibleYear : c2EligibleYear;
          const vals = new Array(N).fill(0);
          r.closingBalArr.forEach((v, y) => { if (y >= eligYear) vals[y] = v; });
          if (vals.some(v => v > 0)) {
            assetRows.push({ label: `SMSF (accum) — ${fund.name} (${r.clientName})`, values: vals });
            vals.forEach((v, y) => { assetTotals[y] += v; });
          }
        });
      }
    });

    // 3. Investment properties (market value, not principal residence)
    // Also assess absent PR (type "19") — it's NOT exempt for Centrelink
    // If strategy 56 moves person back in, property becomes exempt from that year
    const ssFFAssets = engineData.assets || [];
    ssFFAssets.filter(a => a.a_type === "18" || a.a_type === "21").forEach(a => {
      let val = parseFloat(a.a_value) || 0;
      const gr = ((engineData.assetAssumptions?.["18"]?.growthRate ?? 3) / 100);
      const vals = new Array(N).fill(0);
      for (let y = 0; y < N; y++) { vals[y] = Math.round(val); val *= (1 + gr); }
      assetRows.push({ label: `Investment Property — ${a.a_name || "Property"}`, values: vals });
      vals.forEach((v, y) => { assetTotals[y] += v; });
    });
    // Absent PR (type "19") — assessable until moved back in
    ssFFAssets.filter(a => a.a_type === "19").forEach(a => {
      const aIdx = ssFFAssets.indexOf(a);
      const mbS56 = moveBackStratsSS.find(s => parseInt(s.moveback_property_idx) === aIdx);
      const mbYrSS = mbS56 ? Math.max(0, (parseInt(mbS56.start_year) || currentFY) - currentFY) : 9999;
      let val = parseFloat(a.a_value) || 0;
      const gr = ((engineData.assetAssumptions?.["19"]?.growthRate ?? engineData.assetAssumptions?.["18"]?.growthRate ?? 3) / 100);
      const vals = new Array(N).fill(0);
      for (let y = 0; y < N; y++) {
        if (y >= mbYrSS) { val *= (1 + gr); continue; } // exempt from move-back year (now PR again)
        vals[y] = Math.round(val); val *= (1 + gr);
      }
      if (vals.some(v => v > 0)) {
        assetRows.push({ label: `Absent PR — ${a.a_name || "Property"}${mbS56 ? " (exempt from FY" + (parseInt(mbS56.start_year) || currentFY) + ")" : ""}`, values: vals });
        vals.forEach((v, y) => { assetTotals[y] += v; });
      }
    });

    // 4. Financial assets (shares, managed funds, bonds, cash, ETFs — not inside super)
    const financialAssetTotals = new Array(N).fill(0); // needed for deeming
    ffAssets.filter(a => !["1", "18", "19"].includes(a.a_type) && !["4","5","6"].includes(a.a_ownType)).forEach(a => {
      if ((a.a_owner || "").match(/^(trust|companies|smsf)/)) return;
      let val = parseFloat(a.a_value) || 0;
      if (val <= 0) return;
      const typeDef = engineData.assetAssumptions?.[a.a_type] || {};
      const gr = (typeDef.growthRate ?? 5) / 100;
      const vals = new Array(N).fill(0);
      for (let y = 0; y < N; y++) { vals[y] = Math.round(val); val *= (1 + gr); }
      assetRows.push({ label: `${a.a_name || "Investment"}`, values: vals });
      vals.forEach((v, y) => { assetTotals[y] += v; financialAssetTotals[y] += v; });
    });

    // 5. Investment bonds
    bondDataList.forEach((b, bi) => {
      const bond = (engineData.investmentBonds || [])[bi];
      if (!bond) return;
      const vals = b.totalEnd || [];
      if (vals.some(v => v > 0)) {
        assetRows.push({ label: `Investment Bond — ${bond.product_name || "Bond"}`, values: vals.slice(0, N) });
        vals.forEach((v, y) => { if (y < N) { assetTotals[y] += v; financialAssetTotals[y] += v; } });
      }
    });

    // Add pension balances to financial assets for deeming
    assetRows.filter(r => r.label.includes("Pension") || r.label.includes("pension")).forEach(r => {
      r.values.forEach((v, y) => { financialAssetTotals[y] += v; });
    });
    // Add super accum to financial assets once eligible
    assetRows.filter(r => r.label.includes("Super (accum)") || r.label.includes("SMSF (accum)")).forEach(r => {
      r.values.forEach((v, y) => { financialAssetTotals[y] += v; });
    });

    // Less debts (investment debts reduce assessable assets)
    const debtVals = new Array(N).fill(0);
    (engineData.liabilities || []).filter(d => ["2","3"].includes(d.d_type)).forEach(d => {
      let bal = parseFloat(d.d_balance) || 0;
      const rate = (parseFloat(d.d_rate) || 0) / 100;
      const freq = parseFloat(d.d_freq) || 12;
      const isIO = d.d_io === "1";
      const statedRepay = parseFloat(d.d_repayments) || 0;
      const termYears = parseFloat(d.d_term) || 30;
      const periodicRate = rate / freq;
      const totalPeriods = termYears * freq;
      let minRepay = 0;
      if (!isIO && bal > 0 && periodicRate > 0) minRepay = bal * periodicRate / (1 - Math.pow(1 + periodicRate, -totalPeriods));
      for (let y = 0; y < N; y++) {
        if (bal <= 0) continue;
        debtVals[y] += -Math.round(bal);
        const principal = isIO ? 0 : Math.min(bal, Math.max(statedRepay, minRepay) * freq - Math.round(bal * rate));
        bal = Math.max(0, bal - Math.max(0, principal));
      }
    });
    if (debtVals.some(v => v !== 0)) {
      assetRows.push({ label: "Less: Investment Debt", values: debtVals, isNegative: true });
      debtVals.forEach((v, y) => { assetTotals[y] += v; });
    }

    // 6. Deprived assets from gifting (excess over Centrelink limits, assessable for 5 years)
    // Rules: $10k per FY, $30k rolling 5yr. Excess = deprived asset for 5 years.
    const deprivedVals = new Array(N).fill(0);
    if (isAdviceModel) {
      // First, compute per-year gifting amounts from all strat 33 entries
      const annualGifts = new Array(N).fill(0);
      (engineData.advice_request?.strategy?.strategies || []).forEach(s => {
        if (s.strategy_id !== "33") return;
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const ey = s.end_year === "Ongoing" ? N - 1 : Math.min(N - 1, (parseInt(s.end_year) || currentFY) - currentFY);
        const isMax = s.max_gifting === true || s.max_gifting === "true";
        if (isMax) {
          // Max gifting stays within limits — no deprived assets
          return;
        }
        const amt = parseFloat(s.amount) || 0;
        if (amt <= 0) return;
        for (let y = sy; y <= ey; y++) annualGifts[y] += amt;
      });

      // Now compute deprived amounts using rolling 5yr tracking
      // Track each year's excess as a separate item that expires after 5 years
      const deprivedItems = []; // { year, amount }
      let rolling5yrGifts = []; // { year, amount } — within-limits gifts

      for (let y = 0; y < N; y++) {
        const gift = annualGifts[y];
        if (gift <= 0) continue;

        // Remove gifts that have fallen out of the 5-year window from rolling tracker
        rolling5yrGifts = rolling5yrGifts.filter(g => g.year > y - 5);
        const rolling5yrTotal = rolling5yrGifts.reduce((s, g) => s + g.amount, 0);

        // Per-year limit: $10k. Rolling 5yr limit: $30k.
        const yearlyAllowance = Math.min(10000, 30000 - rolling5yrTotal);
        const withinLimits = Math.min(gift, Math.max(0, yearlyAllowance));
        const excess = gift - withinLimits;

        if (withinLimits > 0) rolling5yrGifts.push({ year: y, amount: withinLimits });
        if (excess > 0) deprivedItems.push({ year: y, amount: excess });
      }

      // Build deprivedVals: sum all active deprived items for each year (5-year expiry)
      for (let y = 0; y < N; y++) {
        deprivedVals[y] = deprivedItems
          .filter(d => y >= d.year && y < d.year + 5)
          .reduce((s, d) => s + d.amount, 0);
      }
    }
    const hasDeprived = deprivedVals.some(v => v > 0);
    if (hasDeprived) {
      assetRows.push({ label: "Deprived Assets (Gifting Excess)", values: deprivedVals.map(v => Math.round(v)) });
      deprivedVals.forEach((v, y) => { assetTotals[y] += Math.round(v); financialAssetTotals[y] += Math.round(v); });
    }

    // 7. Deprived assets from granny flat interest (strategy 137/138) — excess over reasonableness test
    const grannyDeprivedVals = new Array(N).fill(0);
    if (isAdviceModel) {
      const GF_CF_TABLE = {65:21.48,66:20.64,67:19.80,68:18.98,69:18.16,70:17.36,71:16.56,72:15.77,73:15.01,74:14.25,75:13.50,76:12.78,77:12.07,78:11.37,79:10.70,80:10.04,81:9.41,82:8.80,83:8.21,84:7.65,85:7.11,86:6.60,87:6.13,88:5.68,89:5.26,90:4.87,91:4.52,92:4.19,93:3.89,94:3.63,95:3.40,96:3.19,97:3.01,98:2.86,99:2.72,100:2.60};
      const GF_PARTNERED_RATE = 46202;
      const gfAgeNextBirthday = (dob) => { if (!dob) return null; const d = new Date(dob); const now = new Date(); return now.getFullYear() - d.getFullYear() + 1; };
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "137" || s.strategy_id === "138").forEach(s => {
        // Age: use younger partner for couples
        const c1AgeNext = gfAgeNextBirthday(engineData.client1?.date_of_birth);
        const c2AgeNext = gfAgeNextBirthday(engineData.client2?.date_of_birth);
        const relevantAge = (c2AgeNext && c1AgeNext && c2AgeNext < c1AgeNext) ? c2AgeNext : (c1AgeNext || 65);
        const cf = GF_CF_TABLE[relevantAge] || (relevantAge > 100 ? 2.60 : 21.48);
        const reasonablenessAmt = Math.round(GF_PARTNERED_RATE * cf);

        let deprivedAsset = 0;
        if (s.strategy_id === "137") {
          const extraCash = parseFloat(s.granny_extra_cash) || 0;
          if (extraCash <= 0) return;
          const propIdx = parseInt(s.granny_property_idx) || 0;
          const homeVal = parseFloat((engineData.assets || [])[propIdx]?.a_value) || 0;
          const totalPaid = homeVal + extraCash;
          const gfValue = Math.max(homeVal, reasonablenessAmt);
          const deprivationAmt = Math.max(0, totalPaid - gfValue);
          deprivedAsset = Math.max(0, deprivationAmt - 10000);
        } else {
          // Strategy 138: funds transfer — value = lesser of cash paid and reasonableness
          const cashAmount = parseFloat(s.granny_cash_amount) || 0;
          if (cashAmount <= 0) return;
          const deprivationAmt = Math.max(0, cashAmount - reasonablenessAmt);
          deprivedAsset = Math.max(0, deprivationAmt - 10000);
        }

        if (deprivedAsset <= 0) return;
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        for (let y = sy; y < Math.min(sy + 5, N); y++) {
          grannyDeprivedVals[y] += deprivedAsset;
        }
      });
    }
    const hasGrannyDeprived = grannyDeprivedVals.some(v => v > 0);
    if (hasGrannyDeprived) {
      assetRows.push({ label: "Deprived Assets (Granny Flat Excess)", values: grannyDeprivedVals.map(v => Math.round(v)) });
      grannyDeprivedVals.forEach((v, y) => { assetTotals[y] += Math.round(v); financialAssetTotals[y] += Math.round(v); });
    }

    // ── Gather assessable income per year ──
    const incomeRows = [];
    const incomeTotals = new Array(N).fill(0);

    // Salaries — stop at retirement age
    const c1Gross = parseFloat(engineData.income?.client1?.i_gross) || 0;
    const c2Gross = parseFloat(engineData.income?.client2?.i_gross) || 0;
    const c1IncR = (parseFloat(engineData.income?.client1?.i_increase) || 0) / 100;
    const c2IncR = (parseFloat(engineData.income?.client2?.i_increase) || 0) / 100;
    const c1RetAgeSS = parseFloat(engineData.advice_reason?.quick?.client1?.ret_age) || 67;
    const c2RetAgeSS = parseFloat(engineData.advice_reason?.quick?.client2?.ret_age) || 67;
    const c1RetYrSS = c1StartAge !== null ? Math.max(0, c1RetAgeSS - c1StartAge) : 999;
    const c2RetYrSS = c2StartAge !== null ? Math.max(0, c2RetAgeSS - c2StartAge) : 999;
    if (c1Gross > 0) {
      let s = c1Gross;
      const vals = new Array(N).fill(0);
      for (let y = 0; y < N; y++) { vals[y] = y >= c1RetYrSS ? 0 : Math.round(s); s *= (1 + c1IncR); }
      incomeRows.push({ label: `${c1Short} — Salary`, values: vals });
      vals.forEach((v, y) => { incomeTotals[y] += v; });
    }
    if (c2Gross > 0) {
      let s = c2Gross;
      const vals = new Array(N).fill(0);
      for (let y = 0; y < N; y++) { vals[y] = y >= c2RetYrSS ? 0 : Math.round(s); s *= (1 + c2IncR); }
      incomeRows.push({ label: `${c2Short} — Salary`, values: vals });
      vals.forEach((v, y) => { incomeTotals[y] += v; });
    }

    // Rental income
    const rentalIncVals = new Array(N).fill(0);
    ffAssets.filter(a => a.a_type === "18" || a.a_type === "21").forEach(a => {
      const weeklyRent = parseFloat(a.a_rental_income) || 0;
      const rentFreq = parseFloat(a.a_rental_freq) || 52;
      let annualRent = weeklyRent * rentFreq;
      const gr = (engineData.assetAssumptions?.["18"]?.growthRate ?? 3) / 100;
      for (let y = 0; y < N; y++) { rentalIncVals[y] += Math.round(annualRent); annualRent *= (1 + gr); }
    });
    // Absent PR rental income (ceases on move-back)
    ffAssets.filter(a => a.a_type === "19").forEach(a => {
      const aIdx = ffAssets.indexOf(a);
      const mbS = moveBackStratsSS.find(s => parseInt(s.moveback_property_idx) === aIdx);
      const mbYr = mbS ? Math.max(0, (parseInt(mbS.start_year) || currentFY) - currentFY) : 9999;
      const weeklyRent = parseFloat(a.a_rental_income) || 0;
      const rentFreq = parseFloat(a.a_rental_freq) || 52;
      let annualRent = weeklyRent * rentFreq;
      const gr = (engineData.assetAssumptions?.["19"]?.growthRate ?? engineData.assetAssumptions?.["18"]?.growthRate ?? 3) / 100;
      for (let y = 0; y < N; y++) {
        if (y >= mbYr) { annualRent *= (1 + gr); continue; }
        rentalIncVals[y] += Math.round(annualRent); annualRent *= (1 + gr);
      }
    });
    if (rentalIncVals.some(v => v > 0)) {
      incomeRows.push({ label: "Rental Income", values: rentalIncVals });
      rentalIncVals.forEach((v, y) => { incomeTotals[y] += v; });
    }

    // Trust distributions
    const trustDistVals = new Array(N).fill(0);
    trustDataList.forEach(t => {
      if (t.chartData) t.chartData.forEach((d, y) => { if (y < N) trustDistVals[y] += (d.distributions || 0); });
    });
    if (trustDistVals.some(v => v > 0)) {
      incomeRows.push({ label: "Trust Distributions", values: trustDistVals });
      trustDistVals.forEach((v, y) => { incomeTotals[y] += v; });
    }

    // Company dividends
    const compDivVals = new Array(N).fill(0);
    companyDataList.forEach(c => {
      if (c.chartData) c.chartData.forEach((d, y) => { if (y < N) compDivVals[y] += (d.dividends || 0); });
    });
    if (compDivVals.some(v => v > 0)) {
      incomeRows.push({ label: "Company Dividends", values: compDivVals });
      compDivVals.forEach((v, y) => { incomeTotals[y] += v; });
    }

    // Deeming income (on financial assets)
    const deemingVals = new Array(N).fill(0);
    const threshold = isCouple ? P.deemingThresholdCouple : P.deemingThresholdSingle;
    for (let y = 0; y < N; y++) {
      const fa = financialAssetTotals[y];
      if (fa <= 0) continue;
      const indexedThreshold = threshold * Math.pow(1 + P.cpiRate, y);
      const lower = Math.min(fa, indexedThreshold) * P.deemingRateLower;
      const upper = Math.max(0, fa - indexedThreshold) * P.deemingRateUpper;
      deemingVals[y] = Math.round((lower + upper) * 26); // annualised (fortnightly × 26)
    }
    if (deemingVals.some(v => v > 0)) {
      incomeRows.push({ label: "Deemed Income (Financial Assets)", values: deemingVals, isDeeming: true });
      deemingVals.forEach((v, y) => { incomeTotals[y] += v; });
    }

    // ── Assets Test Calculation ──
    const assetsTestPension = new Array(N).fill(0);
    const assetsThresholdBase = isCouple
      ? (isHomeowner ? P.assetsThresholdCoupleHO : P.assetsThresholdCoupleNHO)
      : (isHomeowner ? P.assetsThresholdSingleHO : P.assetsThresholdSingleNHO);
    const assetsCutoffBase = isCouple
      ? (isHomeowner ? P.assetsCutoffCoupleHO : P.assetsCutoffCoupleNHO)
      : (isHomeowner ? P.assetsCutoffSingleHO : P.assetsCutoffSingleNHO);
    // Keep static versions for return object
    const assetsThreshold = assetsThresholdBase;
    const assetsCutoff = assetsCutoffBase;
    const maxAnnual = isCouple ? P.maxAnnualCouple : P.maxAnnualSingle;
    for (let y = 0; y < N; y++) {
      if (y < bothEligibleYear) continue;
      // Year-aware homeowner status (strategy 56 may change status mid-projection)
      const hoThisYear = isHomeownerFromYear(y);
      const yearThreshold = isCouple
        ? (hoThisYear ? P.assetsThresholdCoupleHO : P.assetsThresholdCoupleNHO)
        : (hoThisYear ? P.assetsThresholdSingleHO : P.assetsThresholdSingleNHO);
      const yearCutoff = isCouple
        ? (hoThisYear ? P.assetsCutoffCoupleHO : P.assetsCutoffCoupleNHO)
        : (hoThisYear ? P.assetsCutoffSingleHO : P.assetsCutoffSingleNHO);
      const indexedThreshold = yearThreshold * Math.pow(1 + P.cpiRate, y);
      const indexedCutoff = yearCutoff * Math.pow(1 + P.cpiRate, y);
      const indexedMax = maxAnnual * Math.pow(1 + P.cpiRate, y);
      const assets = Math.max(0, assetTotals[y]);
      if (assets <= indexedThreshold) {
        assetsTestPension[y] = Math.round(indexedMax);
      } else if (assets >= indexedCutoff) {
        assetsTestPension[y] = 0;
      } else {
        const excess = assets - indexedThreshold;
        const reductionFortnight = (excess / 1000) * P.assetsReductionRate;
        const reductionAnnual = reductionFortnight * 26;
        assetsTestPension[y] = Math.round(Math.max(0, indexedMax - reductionAnnual));
      }
    }

    // ── Income Test Calculation ──
    const incomeTestPension = new Array(N).fill(0);
    const incomeThreshold = isCouple ? P.incomeThresholdCouple : P.incomeThresholdSingle;
    for (let y = 0; y < N; y++) {
      if (y < bothEligibleYear) continue;
      const indexedThreshold = incomeThreshold * Math.pow(1 + P.cpiRate, y) * 26; // annualised
      const indexedMax = maxAnnual * Math.pow(1 + P.cpiRate, y);
      const income = incomeTotals[y];
      if (income <= indexedThreshold) {
        incomeTestPension[y] = Math.round(indexedMax);
      } else {
        const excess = income - indexedThreshold;
        // Couple: 25c per dollar per person = 50c combined; Single: 50c per dollar
        const effectiveRate = isCouple ? P.incomeReductionRate * 2 : 0.50;
        const reduction = excess * effectiveRate;
        incomeTestPension[y] = Math.round(Math.max(0, indexedMax - reduction));
      }
    }

    // ── Final Pension: Lower of two tests ──
    const finalPension = new Array(N).fill(0);
    const appliedTest = new Array(N).fill("");
    for (let y = 0; y < N; y++) {
      if (y < bothEligibleYear) continue;
      const atP = assetsTestPension[y];
      const itP = incomeTestPension[y];
      finalPension[y] = Math.min(atP, itP);
      appliedTest[y] = atP <= itP ? "Assets" : "Income";
    }

    // ── Rent Assistance (non-homeowners only) ──
    const rentalCost = parseFloat(engineData.expenses?.rental_cost) || 0;
    const rentalFreq = parseFloat(engineData.expenses?.rental_freq) || 52;
    const annualRent = rentalCost * rentalFreq;
    const fortnightlyRent = annualRent / 26;
    const rentAssistVals = new Array(N).fill(0);
    if (!isHomeowner && annualRent > 0) {
      const raThreshold = isCouple ? P.rentAssistThresholdCouple : P.rentAssistThresholdSingle;
      const raMax = isCouple ? P.rentAssistMaxCouple : P.rentAssistMaxSingle;
      for (let y = 0; y < N; y++) {
        if (y < bothEligibleYear || finalPension[y] <= 0) continue;
        // Rent and thresholds indexed by CPI
        const indexedRentFn = fortnightlyRent * Math.pow(1 + P.cpiRate, y);
        const indexedThreshold = raThreshold * Math.pow(1 + P.cpiRate, y);
        const indexedMax = raMax * Math.pow(1 + P.cpiRate, y);
        if (indexedRentFn > indexedThreshold) {
          const ra = Math.min(indexedMax, (indexedRentFn - indexedThreshold) * P.rentAssistRate * 26);
          rentAssistVals[y] = Math.round(ra);
        }
      }
    }

    // Total pension entitlement = base pension + rent assistance
    const totalPensionWithRA = finalPension.map((p, y) => p + rentAssistVals[y]);

    return {
      shortYears,
      bothEligibleYear,
      isCouple,
      isHomeowner,
      assetsThreshold,
      assetsCutoff,
      annualRent,
      // Asset test
      assetRows,
      assetTotals,
      assetsTestPension,
      // Income test
      incomeRows,
      incomeTotals,
      incomeTestPension,
      // Result
      finalPension,
      appliedTest,
      maxAnnual,
      // Rent Assistance
      rentAssistVals,
      totalPensionWithRA,
    };
};
