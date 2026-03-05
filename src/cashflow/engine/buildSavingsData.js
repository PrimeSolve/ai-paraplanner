// Build Cashflow / Savings data — extracted from CashflowModelInner
// Pure function: all dependencies passed via ctx

import { ageAtFYStart as _ageAtFYStart } from "../utils/projectionHelpers.js";
import { resolveDBBenefitPref } from "./buildFinancialSummaryData.js";
import { OBJECTIVE_TYPES } from "./buildFinancialSummaryData.js";

export const buildSavingsData = (ctx) => {
  const {
    N_YEARS, PROJ_YEARS, currentFY,
    engineData, factFind, isAdviceModel,
    ffAssets, ffDebts,
    getAssetRates, getAssetDRP, sellLookup,
    entityDist, combinedPension, combinedNonSuperIns,
    taxClient1Data, taxClient2Data,
    superProj, stratPensionLumpSum,
    agedCareC1, agedCareC2,
    adviceDebts, newDebtDrawdowns,
    debtFreqOverrides, debtIOOverrides,
  } = ctx;
  const ageAtFYStart = (dob) => _ageAtFYStart(dob, currentFY);
  const _resolveDBBenefitPref = resolveDBBenefitPref;

  // Local asset projector (for DRP sell-transaction projection)
  const projectAsset = (val, growthRate, assetIdx, typeCode) => {
    const vals = [];
    const costBaseArr = [];
    const sells = (assetIdx !== undefined) ? (sellLookup[assetIdx] || []) : [];
    const isDRP = getAssetDRP(assetIdx, typeCode);
    const rates = getAssetRates(assetIdx, typeCode);
    let v = val;
    let cb = val; // cost base tracks original + reinvested dividends for DRP
    for (let y = 0; y < N_YEARS; y++) {
      sells.forEach(s => { if (s.yearIdx === y && v > 0) { const pct = s.sellEntire ? 1 : Math.min(1, s.amount / v); cb = cb * (1 - pct); v = s.sellEntire ? 0 : Math.max(0, v - s.amount); } });
      vals.push(Math.round(v));
      costBaseArr.push(Math.round(cb));
      if (isDRP && rates.incomeYield > 0) {
        const halfGrowth = Math.pow(1 + growthRate, 0.5) - 1;
        const halfYield = rates.incomeYield / 2;
        v = v * (1 + halfGrowth);
        const div1 = Math.round(v * halfYield);
        v += div1; cb += div1;
        v = v * (1 + halfGrowth);
        const div2 = Math.round(v * halfYield);
        v += div2; cb += div2;
      } else {
        v = v * (1 + growthRate);
      }
    }
    return { vals, costBaseArr };
  };

    const shortYears = PROJ_YEARS.map(y => { const p = y.split("/"); return p[0].slice(-4) + "/" + p[1].slice(-2); });

    // Helper: calculate net after-tax salary (same as calcNetSalary but inline for savings engine)
    const netSalaryForSavings = (gross, superIncluded) => {
      if (!gross) return 0;
      const taxable = superIncluded === "1" ? Math.round(gross / 1.115) : gross;
      let tax = 0;
      if (taxable <= 18200) tax = 0;
      else if (taxable <= 45000) tax = (taxable - 18200) * 0.16;
      else if (taxable <= 135000) tax = 4288 + (taxable - 45000) * 0.30;
      else if (taxable <= 190000) tax = 31288 + (taxable - 135000) * 0.37;
      else tax = 51638 + (taxable - 190000) * 0.45;
      const lito = taxable<=37500?700:taxable<=45000?700-(taxable-37500)*0.05:taxable<=66667?Math.max(0,325-(taxable-45000)*0.015):0;
      const medicare = taxable>26000?taxable*0.02:0;
      return Math.round(taxable - Math.max(0,tax-lito) - medicare);
    };

    // Strategy 67: determine per-client % of salary going to offset, per year
    const strat67Sav = isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "67") : [];
    // Per-client offset pct arrays [N_YEARS]
    const c1OffsetPct = new Array(N_YEARS).fill(0);
    const c2OffsetPct = new Array(N_YEARS).fill(0);
    strat67Sav.forEach(s => {
      const pct = Math.min(100, Math.max(0, parseFloat(s.amount) || 100)) / 100;
      const startYr = Math.max(0, parseInt(s.start_year) - currentFY);
      const endYr = s.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY + N_YEARS) - currentFY);
      for (let y = startYr; y <= endYr; y++) {
        if (s.owner_id === "joint" || s.owner_id === "client1") c1OffsetPct[y] = Math.max(c1OffsetPct[y], pct);
        if (s.owner_id === "joint" || s.owner_id === "client2") c2OffsetPct[y] = Math.max(c2OffsetPct[y], pct);
      }
    });

    // Combined salary projection — stops at each client's retirement age
    const c1Gross = parseFloat(engineData.income?.client1?.i_gross) || 0;
    const c2Gross = parseFloat(engineData.income?.client2?.i_gross) || 0;
    const c1Net = netSalaryForSavings(c1Gross, engineData.income?.client1?.i_super_inc);
    const c2Net = netSalaryForSavings(c2Gross, engineData.income?.client2?.i_super_inc);
    const c1IncR = parseFloat(engineData.income?.client1?.i_increase) || 0;
    const c2IncR = parseFloat(engineData.income?.client2?.i_increase) || 0;
    const c1DobSav = engineData.client1?.date_of_birth;
    const c2DobSav = engineData.client2?.date_of_birth;
    const c1RetAgeSav = parseFloat(engineData.advice_reason?.quick?.client1?.ret_age) || 67;
    const c2RetAgeSav = parseFloat(engineData.advice_reason?.quick?.client2?.ret_age) || 67;
    const ageNow = (dob) => {
      if (!dob) return 60;
      const d = new Date(dob); const n = new Date(currentFY, 6, 1);
      let a = n.getFullYear() - d.getFullYear();
      if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
      return a;
    };
    const c1RetYrSav = Math.max(0, c1RetAgeSav - ageNow(c1DobSav));
    const c2RetYrSav = Math.max(0, c2RetAgeSav - ageNow(c2DobSav));

    // Gross salary that stays in savings pool (gross × (1 - offsetPct))
    // Net salary to offset (deducted from savings pool)
    const salaries = [];          // gross portion remaining in savings pool
    const salaryToOffset = [];    // net salary redirected to offset (not in savings pool)
    const paygWithheld = [];      // PAYG withheld on gross salary (approximation of tax on gross)
    let s1Gross = c1Gross, s2Gross = c2Gross;
    let s1Net = c1Net, s2Net = c2Net;
    for (let y = 0; y < N_YEARS; y++) {
      const c1Active = y < c1RetYrSav;
      const c2Active = y < c2RetYrSav;
      const c1GrossY = c1Active ? Math.round(s1Gross) : 0;
      const c2GrossY = c2Active ? Math.round(s2Gross) : 0;
      const c1NetY   = c1Active ? Math.round(s1Net * Math.pow(1 + c1IncR/100, y)) : 0;
      const c2NetY   = c2Active ? Math.round(s2Net * Math.pow(1 + c2IncR/100, y)) : 0;

      // Net redirected to offset
      const c1ToOffset = Math.round(c1NetY * c1OffsetPct[y]);
      const c2ToOffset = Math.round(c2NetY * c2OffsetPct[y]);
      salaryToOffset.push(c1ToOffset + c2ToOffset);

      // Gross remaining in savings (gross × (1 - offsetPct))
      // PAYG already withheld means gross hits account as net, so we track gross staying in pool
      const c1GrossRemaining = Math.round(c1GrossY * (1 - c1OffsetPct[y]));
      const c2GrossRemaining = Math.round(c2GrossY * (1 - c2OffsetPct[y]));
      salaries.push(c1GrossRemaining + c2GrossRemaining);

      // PAYG withheld on the gross going to offset (approximation: gross - net on redirected portion)
      const c1PAYG = Math.round((c1GrossY - c1NetY) * c1OffsetPct[y]);
      const c2PAYG = Math.round((c2GrossY - c2NetY) * c2OffsetPct[y]);
      paygWithheld.push(c1PAYG + c2PAYG);

      s1Gross = s1Gross * (1 + c1IncR / 100);
      s2Gross = s2Gross * (1 + c2IncR / 100);
    }

    // Strategy 1: Paid Parental Leave — separate income line in savings
    const pplSavVals = new Array(N_YEARS).fill(0);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "1").forEach(s => {
        const weeks = parseInt(s.ppl_weeks) || 0;
        if (weeks <= 0) return;
        const totalPay = Math.round(weeks * 948.10);
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        if (sy >= N_YEARS) return;
        pplSavVals[sy] += totalPay;
      });
    }

    // Strategy 210: JobSeeker Payment — separate income line in savings
    const jsSavVals = new Array(N_YEARS).fill(0);
    const JS_FN_SAV = 789.90;
    const JS_ANN_SAV = Math.round(JS_FN_SAV * 26);
    if (isAdviceModel) {
      const c1AgeSav = ageAtFYStart(engineData.client1?.date_of_birth);
      const c2AgeSav = ageAtFYStart(engineData.client2?.date_of_birth);
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "210").forEach(s => {
        const owner = s.owner_id || "client1";
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const ey = s.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY + 30) - currentFY);
        if (sy >= N_YEARS) return;
        const clientAge = owner === "client1" ? c1AgeSav : c2AgeSav;
        const inflRate = parseFloat(engineData.assumptions?.a_cpi) / 100 || 0.025;
        for (let y = sy; y <= ey && y < N_YEARS; y++) {
          if (clientAge !== null && (clientAge + y) >= 67) break;
          jsSavVals[y] += Math.round(JS_ANN_SAV * Math.pow(1 + inflRate, y));
        }
      });
    }

    // Strategy 219: Disability Support Pension — separate income line in savings
    const dspSavVals = new Array(N_YEARS).fill(0);
    const DSP_SINGLE_FN_SAV = 1149.00;
    const DSP_COUPLE_FN_SAV = 866.80;
    const hasPartnerSav = !!engineData.client2?.first_name;
    const DSP_FN_SAV = hasPartnerSav ? DSP_COUPLE_FN_SAV : DSP_SINGLE_FN_SAV;
    const DSP_ANN_SAV = Math.round(DSP_FN_SAV * 26);
    if (isAdviceModel) {
      const c1AgeSavDSP = ageAtFYStart(engineData.client1?.date_of_birth);
      const c2AgeSavDSP = ageAtFYStart(engineData.client2?.date_of_birth);
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "219").forEach(s => {
        const owner = s.owner_id || "client1";
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const ey = s.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY + 30) - currentFY);
        if (sy >= N_YEARS) return;
        const clientAge = owner === "client1" ? c1AgeSavDSP : c2AgeSavDSP;
        const inflRate = parseFloat(engineData.assumptions?.a_cpi) / 100 || 0.025;
        for (let y = sy; y <= ey && y < N_YEARS; y++) {
          if (clientAge !== null && (clientAge + y) >= 67) break; // transitions to Age Pension
          dspSavVals[y] += Math.round(DSP_ANN_SAV * Math.pow(1 + inflRate, y));
        }
      });
    }

    // Offset drawdown: living expenses funded from offset account (cash inflow to savings)
    const livingExpBase = parseFloat(engineData.cashflowConfig?.livingExpenses) || 0;
    const livingGrowthSav = parseFloat(engineData.cashflowConfig?.livingExpensesGrowth) || 0.025;
    const offsetDrawdown = new Array(N_YEARS).fill(0);
    const hasOffset = strat67Sav.length > 0;
    if (hasOffset) {
      for (let y = 0; y < N_YEARS; y++) {
        offsetDrawdown[y] = Math.round(livingExpBase * Math.pow(1 + livingGrowthSav, y));
      }
    }

    // Strategy 158: packaged amount is pre-tax — reduce gross salary in savings hub
    // (it flows to the loan as extra repayment, not through savings)
    const strat158Sav = isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "158") : [];
    const getFbtCapSav = (clientKey) => {
      const cd = engineData[clientKey] || {};
      if (cd.fbt_exempt !== "1") return 0;
      const cat = cd.fbt_category || "";
      const grossCap = cat === "hospital" ? 9010 : cat === "pbi" ? 15900 : cat === "religious" ? Infinity : 0;
      return Math.max(0, grossCap - (parseFloat(cd.fbt_other_benefits) || 0));
    };
    const pkg158 = new Array(N_YEARS).fill(0);
    strat158Sav.forEach(s => {
      const ownerKey = s.owner_id || "client1";
      const cap = getFbtCapSav(ownerKey);
      const amt = Math.min(parseFloat(s.amount) || 0, cap);
      if (amt <= 0) return;
      const startYr = Math.max(0, parseInt(s.start_year) - currentFY);
      const endYr = s.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY + N_YEARS) - currentFY);
      for (let y = startYr; y <= endYr; y++) pkg158[y] += amt;
    });
    // Salary stays gross in savings hub — packaging flows directly to loan (shown in debt servicing)
    const totalIncomeSalary = salaries;

    // Rental income from investment properties and absent PR (combined, 100% — both clients)
    const rentalVals = new Array(N_YEARS).fill(0);
    const moveBackStratsSav = (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "56" && s.moveback_property_idx !== "");
    ffAssets.filter(a => a.a_type === "18" || a.a_type === "21" || a.a_type === "19" || (a.a_type === "20" && (a.a_hh_rented === "longterm" || a.a_hh_rented === "airbnb" || a.a_hh_rented === "mixed"))).forEach(a => {
      const assetIdx = ffAssets.indexOf(a);
      const mbStratS = a.a_type === "19" ? moveBackStratsSav.find(s => parseInt(s.moveback_property_idx) === assetIdx) : null;
      const mbStartYrS = mbStratS ? (parseInt(mbStratS.start_year) || currentFY) : 9999;
      const weeklyRent = parseFloat(a.a_rental_income) || 0;
      const rentFreq = parseFloat(a.a_rental_freq) || 52;
      const annualRent = weeklyRent * rentFreq;
      const rentGrowth = getAssetRates(assetIdx, a.a_type).growthRate;
      let rent = annualRent;
      for (let y = 0; y < N_YEARS; y++) {
        const fy = currentFY + y;
        if (fy >= mbStartYrS) { rent = rent * (1 + rentGrowth); continue; }
        rentalVals[y] += Math.round(rent); rent = rent * (1 + rentGrowth);
      }
    });
    // Strategy 88: Rent out PR — add rental income in savings
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "88" && s.rentout_property_idx !== "").forEach(s => {
        const propIdx = parseInt(s.rentout_property_idx);
        const a = ffAssets[propIdx];
        if (!a) return;
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const ey = s.end_year && s.end_year !== "Ongoing" ? Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY + 30) - currentFY) : N_YEARS - 1;
        const rentAmt = parseFloat(s.rentout_rental_income) || 0;
        const rentFreq = parseFloat(s.rentout_rental_freq) || 52;
        const annualRent = rentAmt * rentFreq;
        if (annualRent <= 0) return;
        const rentGrowth = getAssetRates(propIdx, a.a_type).growthRate;
        let rent = annualRent * Math.pow(1 + rentGrowth, sy);
        for (let y = sy; y <= ey && y < N_YEARS; y++) {
          rentalVals[y] += Math.round(rent);
          rent = rent * (1 + rentGrowth);
        }
      });
    }

    // Strategy 87: Rent out holiday home — add rental income in savings
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "87" && s.hh_property_idx !== "").forEach(s => {
        const propIdx = parseInt(s.hh_property_idx);
        const a = ffAssets[propIdx];
        if (!a) return;
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const ey = s.end_year && s.end_year !== "Ongoing" ? Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY + 30) - currentFY) : N_YEARS - 1;
        const rentAmt = parseFloat(s.hh_rental_income) || 0;
        const rentFreq = parseFloat(s.hh_rental_freq) || 52;
        const annualRent = rentAmt * rentFreq;
        if (annualRent <= 0) return;
        const rentGrowth = getAssetRates(propIdx, a.a_type).growthRate;
        let rent = annualRent * Math.pow(1 + rentGrowth, sy);
        for (let y = sy; y <= ey && y < N_YEARS; y++) {
          rentalVals[y] += Math.round(rent);
          rent = rent * (1 + rentGrowth);
        }
      });
    }

    // Investment income from non-property assets (combined household)
    // Exclude offset accounts — banks pay no interest on offset accounts
    const offsetAssetIdxsSav = new Set(
      (factFind.liabilities || []).flatMap(d => (d.d_offset || []).map(i => parseInt(i)))
    );
    const investIncVals = new Array(N_YEARS).fill(0);
    ffAssets.filter(a => !["1", "18"].includes(a.a_type)).forEach(a => {
      const assetIdx = ffAssets.indexOf(a);
      if (offsetAssetIdxsSav.has(assetIdx)) return; // no interest on offset accounts
      if (getAssetDRP(assetIdx, a.a_type)) return; // DRP — dividends reinvested, no cash
      const val = parseFloat(a.a_value) || 0;
      if (val <= 0) return;
      const rates = getAssetRates(assetIdx, a.a_type);
      if (rates.incomeYield <= 0) return;
      let running = val;
      for (let y = 0; y < N_YEARS; y++) {
        investIncVals[y] += Math.round(running * rates.incomeYield);
        running = running * (1 + rates.growthRate);
      }
    });

    // Pension drawdown income (combined household)
    const pensionFundsSav = engineData.pensions || [];
    const pensionIncVals = new Array(N_YEARS).fill(0);
    pensionFundsSav.forEach(pf => {
      const bal0 = parseFloat(pf.balance) || 0;
      if (bal0 <= 0) return;
      const drawdownRate = (parseFloat(pf.drawdown_rate) || 5) / 100;
      const drawdownType = pf.drawdown_type || "percentage";
      const drawdownFixed = parseFloat(pf.drawdown_amount) || 0;
      const adminFee = parseFloat(pf.fees?.admin_fee) || 0;
      const pctFee = (parseFloat(pf.fees?.percent_fee) || 0) / 100;
      const pensionGrowthRate = 0.07;
      const clientKey = pf.owner;
      const clientDobSav = clientKey === "client1" ? engineData.client1?.date_of_birth : engineData.client2?.date_of_birth;
      const startAge = ageAtFYStart(clientDobSav) ?? (clientKey === "client1" ? 60 : 56);
      const minDrawdownRate = (age) => {
        if (age < 65) return 0.04; if (age < 75) return 0.05; if (age < 80) return 0.06;
        if (age < 85) return 0.07; if (age < 90) return 0.09; if (age < 95) return 0.11; return 0.14;
      };
      let running = bal0;
      for (let y = 0; y < N_YEARS; y++) {
        if (running <= 0) continue;
        const age = startAge + y;
        const minDraw = Math.round(running * minDrawdownRate(age));
        let drawdown = drawdownType === "dollar" ? Math.max(minDraw, drawdownFixed) : Math.max(minDraw, Math.round(running * drawdownRate));
        drawdown = Math.min(drawdown, running);
        pensionIncVals[y] += drawdown;
        const fees = Math.round(adminFee + (running * pctFee));
        const avgBal = running - drawdown / 2 - fees / 2;
        running = Math.max(0, running - drawdown - fees + Math.round(Math.max(0, avgBal) * pensionGrowthRate));
      }
    });

    // Annuity income (combined household)
    const annuityIncVals = new Array(N_YEARS).fill(0);
    const annuityRedemptionSOY = new Array(N_YEARS).fill(0); // net proceeds to savings at SOY

    // Parse strategy 82 (redeem annuity) entries
    const strat82s = (isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []) : [])
      .filter(s => s.strategy_id === "82" && s.product_id?.startsWith("annuity_"));

    (engineData.annuities || []).forEach((an, ai) => {
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
      const purchasePrice = parseFloat(an.purchase_price) || 0;

      // Find any strat 82 applying to this annuity
      const redemption = strat82s.find(s => s.product_id === `annuity_${ai}`);
      const redeemYear = redemption ? Math.max(0, parseInt(redemption.start_year) - currentFY) : -1;
      const isPartial = redemption?.redemption_type === "partial";
      const partialPct = isPartial ? (parseFloat(redemption.partial_pct) || 100) / 100 : 1;
      const exitCostPct = redemption ? (parseFloat(redemption.exit_cost_pct) || 0) / 100 : 0;

      if (redemption && redeemYear >= 0 && redeemYear < N_YEARS) {
        const redemptionBase = Math.round(purchasePrice * partialPct);
        const exitCost = Math.round(redemptionBase * exitCostPct);
        annuityRedemptionSOY[redeemYear] += (redemptionBase - exitCost);
      }

      for (let y = 0; y < N_YEARS; y++) {
        if (isFixedTerm && y >= remainingTerm) continue;
        // If fully redeemed, stop income from redemption year onwards
        if (redemption && !isPartial && y >= redeemYear && redeemYear >= 0) continue;
        const income = cpiIndexed ? Math.round(annualIncome * Math.pow(1 + cpiRate, y)) : annualIncome;
        // If partial redemption, reduce income proportionally from redemption year
        const scaledIncome = (redemption && isPartial && y >= redeemYear && redeemYear >= 0)
          ? Math.round(income * (1 - partialPct))
          : income;
        annuityIncVals[y] += scaledIncome;
      }
    });

    // Entity distributions (combined household)
    const trustDistCombined = entityDist.c1TrustDist.map((v, y) => v + entityDist.c2TrustDist[y]);
    const companyDivCombined = entityDist.c1CompanyDiv.map((v, y) => v + entityDist.c2CompanyDiv[y]);
    const exitCapReturnCombined = entityDist.c1ExitCapReturn.map((v, y) => v + entityDist.c2ExitCapReturn[y]);

    // ── Sell Transactions (Advice) — net proceeds flow into cashflow, CGT computed ──
    const sellTxns = (isAdviceModel && engineData.advice_request?.transactions?.sell) || [];
    const sellProceedsSOY = new Array(N_YEARS).fill(0);
    const sellProceedsEOY = new Array(N_YEARS).fill(0);
    const sellCGTVals = new Array(N_YEARS).fill(0); // discounted capital gain
    const sellRowsSOY = [];
    const sellRowsEOY = [];
    const currentFYSell = new Date().getFullYear();
    sellTxns.forEach((s) => {
      // Only personal sells flow into personal cashflow (not trust/company/smsf)
      const isPersonalSell = !s.entity_type || s.entity_type === "1" || s.entity_type === "2";
      if (!isPersonalSell) return;
      const assetIdx = parseInt(s.asset_idx);
      const asset = !isNaN(assetIdx) ? ffAssets[assetIdx] : null;
      if (!asset) return;
      const sellYear = parseInt(s.sell_year) || currentFYSell;
      const yIdx = sellYear - currentFYSell;
      if (yIdx < 0 || yIdx >= N_YEARS) return;
      const currentVal = parseFloat(asset.a_value) || 0;
      // For DRP assets, project forward to get the actual value and cost base at sell year
      const isDRPAsset = getAssetDRP(assetIdx, asset.a_type);
      let projectedVal = currentVal;
      let costBase = parseFloat(asset.a_purchase_price) || currentVal;
      if (isDRPAsset && yIdx > 0) {
        const rates = getAssetRates(assetIdx, asset.a_type);
        const projected = projectAsset(currentVal, rates.growthRate, assetIdx, asset.a_type);
        projectedVal = projected.vals[yIdx] || currentVal;
        costBase = projected.costBaseArr[yIdx] || costBase;
      }
      const sellAmt = s.sell_entire_amount ? projectedVal : Math.min(parseFloat(s.amount) || 0, projectedVal);
      const costPortion = s.sell_entire_amount ? costBase : (costBase * sellAmt / Math.max(projectedVal, 1));
      const txnCostPct = (parseFloat(s.transaction_costs_pct) || 0) / 100;
      const netProceeds = Math.round(sellAmt * (1 - txnCostPct));
      const capitalGain = Math.max(0, netProceeds - costPortion);
      const purchaseDate = asset.a_purchase_date ? new Date(asset.a_purchase_date) : null;
      const sellDate = new Date(sellYear, 6, 1);
      const heldOver12m = purchaseDate ? ((sellDate - purchaseDate) / (365.25 * 24 * 60 * 60 * 1000)) > 1 : true;
      const discountedGain = heldOver12m ? Math.round(capitalGain * 0.5) : capitalGain;
      const isEOY = s.sell_timing === "end";
      if (isEOY) { sellProceedsEOY[yIdx] += netProceeds; } else { sellProceedsSOY[yIdx] += netProceeds; }
      sellCGTVals[yIdx] += discountedGain;
      const vals = new Array(N_YEARS).fill(0);
      vals[yIdx] = netProceeds;
      const row = { label: `Sale: ${s.description || "Asset"}`, values: vals, style: "child" };
      if (isEOY) sellRowsEOY.push(row); else sellRowsSOY.push(row);
    });
    const sellProceedsVals = sellProceedsSOY.map((v, y) => v + sellProceedsEOY[y]);

    // PAYG vs final tax reconciliation: final tax from tax engine, PAYG withheld on offset salary
    // Refund (PAYG > final tax) is a cash inflow; bill (PAYG < final tax) is an outflow
    // We approximate: final tax already handled in taxVals. PAYG withheld on redirected salary
    // reduces what went into offset (already net). Refund = paygWithheld (over-withheld approx 0 for wage earners)
    // For now: PAYG withheld hits savings as a refund adjustment at year end
    const taxRefundVals = paygWithheld.map(p => 0); // placeholder — wire to tax engine delta later

    // DB Pension income for savings
    const dbPensionSavVals = new Array(N_YEARS).fill(0);
    const dbLumpSumSavVals = new Array(N_YEARS).fill(0);
    (engineData.definedBenefits || []).forEach((db, dbIdx) => {
      if (!db.scheme) return;
      const resolved = _resolveDBBenefitPref(db, dbIdx, engineData, isAdviceModel);
      const exitAgeDB = parseFloat(db.expected_exit_age) || 65;
      const clientDobDB = db.owner === "client1" ? engineData.client1?.date_of_birth : engineData.client2?.date_of_birth;
      const startAgeDB = ageAtFYStart(clientDobDB) ?? (db.owner === "client1" ? 60 : 56);
      const exitYrDB = resolved.startYear ? Math.max(0, resolved.startYear - currentFY) : Math.max(0, Math.round(exitAgeDB - startAgeDB));
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

      if (statusDB === "pension") {
        const existing = parseFloat(db.current_pension_annual) || 0;
        const indexed = db.pension_indexed !== "no";
        for (let y = 0; y < N_YEARS; y++) dbPensionSavVals[y] += Math.round(existing * Math.pow(1 + (indexed ? cpiDB : 0), y));
        return;
      }

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
        const pcf = exitAgeDB <= 55 ? 12 : exitAgeDB <= 60 ? 12 - ((exitAgeDB - 55) * 0.2) : exitAgeDB <= 65 ? 11 - ((exitAgeDB - 60) * 0.2) : 10;
        exitPension = pcf > 0 ? Math.round((exitBenefit * pensionPctDB) / pcf) : 0;
      } else if (isCSS) {
        const cssYrs = (parseFloat(db.years_service) || 0) + exitYrDB;
        const cssFinalSal = currentSalaryDB * Math.pow(1 + salaryGrowthDB, exitYrDB);
        const cssPct = Math.min(0.525, (cssYrs / 40) * 0.525) * (exitAgeDB >= 65 ? 1 : exitAgeDB >= 60 ? 0.95 : exitAgeDB >= 55 ? 0.85 : 0.75);
        exitPension = Math.round(cssFinalSal * cssPct * pensionPctDB);
        exitBenefit = Math.round(cssFinalSal * cssPct * 11);
      } else {
        exitPension = Math.round((parseFloat(db.estimated_annual_pension) || 0) * pensionPctDB);
        exitBenefit = exitPension * 11;
      }
      // Manual override from strategy
      if (resolved.useManual) {
        if (resolved.manualPension > 0) exitPension = resolved.manualPension;
        if (resolved.manualLump > 0) exitBenefit = Math.round(resolved.manualLump / Math.max(lumpPctDB, 0.01));
      }
      // Lump sum at exit — store NET (after concessional tax)
      const exitLump = Math.round(exitBenefit * lumpPctDB);
      if (exitLump > 0 && exitYrDB < N_YEARS) {
        const memberCompS = parseFloat(db.member_component) || 0;
        const prodCompS = parseFloat(db.productivity_component) || 0;
        const employerCompS = parseFloat(db.employer_component) || 0;
        const totalCompS = memberCompS + prodCompS + employerCompS;
        const untaxedPctS = isPSS && totalCompS > 0 ? employerCompS / totalCompS : isCSS ? 0.6 : 0.5;
        const untaxedLumpS = Math.round(exitLump * untaxedPctS);
        const taxedLumpS = exitLump - untaxedLumpS;
        const ageAtExitS = (ageAtFYStart(clientDobDB) ?? (db.owner === "client1" ? 60 : 56)) + exitYrDB;
        let lumpTaxS = 0;
        if (ageAtExitS >= 60) {
          lumpTaxS = Math.round(Math.min(untaxedLumpS, 1780000) * 0.15 + Math.max(0, untaxedLumpS - 1780000) * 0.45);
        } else {
          lumpTaxS = Math.round(Math.max(0, taxedLumpS - 235000) * 0.15 + untaxedLumpS * 0.30);
        }
        dbLumpSumSavVals[exitYrDB] += (exitLump - lumpTaxS);
      }
      for (let y = exitYrDB; y < N_YEARS; y++) {
        dbPensionSavVals[y] += Math.round(exitPension * Math.pow(1 + cpiDB, y - exitYrDB));
      }
    });

    // Bond contributions (Strategy 17) and withdrawals (Strategy 177) — savings cashflow
    const bondContribSavVals = new Array(N_YEARS).fill(0);
    const invProdWithdrawSOY = new Array(N_YEARS).fill(0);
    const invProdWithdrawEOY = new Array(N_YEARS).fill(0);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "17").forEach(s => {
        const amt = parseFloat(s.amount) || 0;
        if (amt <= 0) return;
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const ey = s.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY + 30) - currentFY);
        for (let y = sy; y <= ey && y < N_YEARS; y++) {
          bondContribSavVals[y] += Math.round(amt);
        }
      });
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "177").forEach(s => {
        const amt = parseFloat(s.amount) || 0;
        if (amt <= 0) return;
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const ey = s.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY + 30) - currentFY);
        const isSOY = (s.timing || "SOY") === "SOY";
        for (let y = sy; y <= ey && y < N_YEARS; y++) {
          if (isSOY) invProdWithdrawSOY[y] += Math.round(amt);
          else invProdWithdrawEOY[y] += Math.round(amt);
        }
      });
    }
    const hasBondContrib = bondContribSavVals.some(v => v > 0);
    const hasInvProdWithdrawSOY = invProdWithdrawSOY.some(v => v > 0);
    const hasInvProdWithdrawEOY = invProdWithdrawEOY.some(v => v > 0);

    // Strategy 272: Income adjustments (cashflow component)
    const incAdjVals = new Array(N_YEARS).fill(0);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "272").forEach(s => {
        const amt = parseFloat(s.adj_amount) || 0;
        if (amt <= 0) return;
        const dir = s.adj_direction === "decrease" ? -1 : 1;
        const startYr = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const endYr = s.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY + N_YEARS) - currentFY);
        for (let y = startYr; y <= endYr; y++) incAdjVals[y] += Math.round(amt * dir);
      });
    }

    const totalIncome = salaries.map((sal, y) =>
      sal + rentalVals[y] + investIncVals[y] + pensionIncVals[y] + annuityIncVals[y] +
      trustDistCombined[y] + companyDivCombined[y] + exitCapReturnCombined[y] + combinedPension[y] + offsetDrawdown[y] + pplSavVals[y] + jsSavVals[y] + dspSavVals[y] + dbPensionSavVals[y] + dbLumpSumSavVals[y] + incAdjVals[y]
    );

    // Expenses
    const livingExp = parseFloat(engineData.cashflowConfig?.livingExpenses) || 85000;
    const livingGrowth = parseFloat(engineData.cashflowConfig?.livingExpensesGrowth) || 0.025;
    const livingVals = [];
    let le = livingExp;
    for (let y = 0; y < N_YEARS; y++) { livingVals.push(Math.round(le)); le = le * (1 + livingGrowth); }

    // Rent paid expense — from expenses section, ceases on move-back into PR (strategy 56)
    const moveBackStratsSav2 = (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "56" && s.moveback_property_idx !== "");
    const moveBackYrSav = moveBackStratsSav2.length > 0 ? Math.min(...moveBackStratsSav2.map(s => parseInt(s.start_year) || 9999)) : 9999;
    const rentPaidAmtSav = parseFloat(engineData.expenses?.rental_cost) || 0;
    const rentPaidFreqSav = parseFloat(engineData.expenses?.rental_freq) || 52;
    const annualRentPaidSav = rentPaidAmtSav * rentPaidFreqSav;
    const rentPaidValsSav = new Array(N_YEARS).fill(0);
    if (annualRentPaidSav > 0) {
      let rp = annualRentPaidSav;
      for (let y = 0; y < N_YEARS; y++) {
        const fy = currentFY + y;
        if (fy >= moveBackYrSav) break;
        rentPaidValsSav[y] = Math.round(rp);
        rp = rp * (1 + livingGrowth);
      }
    }

    // Holiday home holding costs — savings tab
    const hhExpenseValsSav = new Array(N_YEARS).fill(0);
    ffAssets.filter(a => a.a_type === "20").forEach(a => {
      const holdingCosts = parseFloat(a.a_hh_holding_costs) || 0;
      const mgmtCosts = parseFloat(a.a_hh_mgmt_costs) || 0;
      const totalAnnualCost = holdingCosts + mgmtCosts;
      if (totalAnnualCost <= 0) return;
      const costGrowth = parseFloat(engineData.assumptions?.a_cpi) / 100 || 0.025;
      let cost = totalAnnualCost;
      for (let y = 0; y < N_YEARS; y++) {
        hhExpenseValsSav[y] += Math.round(cost);
        cost = cost * (1 + costGrowth);
      }
    });

    // Debt servicing - IO = interest only, P&I = MAX(stated, PMT minimum)
    const annualDebtServ = ffDebts.reduce((sum, d) => {
      const dRef4 = `debt_${ffDebts.indexOf(d)}`;
      const bal = parseFloat(d.d_balance) || 0;
      const rate = parseFloat(d.d_rate) || 0;
      const statedRepay = parseFloat(d.d_repayments) || 0;
      const freqNum = parseFloat(debtFreqOverrides[dRef4] || d.d_freq) || 12;
      const isIO = (debtIOOverrides[dRef4] !== undefined ? debtIOOverrides[dRef4] : d.d_io) === "1";
      if (isIO) {
        return sum + Math.round(bal * (rate / 100)); // interest only
      }
      // PMT minimum
      const termYears = parseFloat(d.d_term) || 30;
      const totalPeriods = termYears * freqNum;
      const periodicRate = rate / 100 / freqNum;
      let minRepay = 0;
      if (bal > 0 && periodicRate > 0 && totalPeriods > 0) {
        minRepay = bal * periodicRate / (1 - Math.pow(1 + periodicRate, -totalPeriods));
      }
      const effectiveRepay = Math.max(statedRepay, minRepay);
      return sum + effectiveRepay * freqNum;
    }, 0);
    // Add strategy 158 packaged amount to debt servicing (pre-tax dollars going to loan)
    const debtServVals = new Array(N_YEARS).fill(Math.round(annualDebtServ)).map((v, y) => v + (pkg158[y] || 0));

    // Strategy 66 (repayment) flows out of savings; strategy 42 (drawdown) flows into savings
    const lumpSumDebtRepayVals = new Array(N_YEARS).fill(0);
    const debtDrawdownInflowVals = new Array(N_YEARS).fill(0);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).forEach(s => {
        const amt = parseFloat(s.amount) || 0;
        const yIdx = Math.max(0, parseInt(s.start_year) - currentFY);
        if (amt <= 0 || yIdx < 0 || yIdx >= N_YEARS) return;
        if (s.strategy_id === "66") lumpSumDebtRepayVals[yIdx] += amt;
        if (s.strategy_id === "42") debtDrawdownInflowVals[yIdx] += amt;
      });
    }

    // Taxes from both clients
    const c1FinalTax = taxClient1Data.sections.find(s => s.id === "tax-final")?.rows[0]?.values || new Array(N_YEARS).fill(0);
    const c2FinalTax = taxClient2Data.sections.find(s => s.id === "tax-final")?.rows[0]?.values || new Array(N_YEARS).fill(0);
    const taxVals = c1FinalTax.map((t, i) => t + (c2FinalTax[i] || 0));

    // SG contributions
    const c1SG = taxClient1Data.sections.find(s => s.id === "tax-deductions")?.rows.find(r => r.label === "Concessional Contributions")?.values || new Array(N_YEARS).fill(0);
    const c2SG = taxClient2Data.sections.find(s => s.id === "tax-deductions")?.rows.find(r => r.label === "Concessional Contributions")?.values || new Array(N_YEARS).fill(0);
    const contribVals = c1SG.map((c, i) => c + (c2SG[i] || 0));

    // Objectives / Goals — project as expenses per year
    const objectivesList = engineData.advice_reason?.objectives || [];
    const objectiveVals = new Array(N_YEARS).fill(0);
    const objectiveRows = [];
    const currentFYStart = new Date().getFullYear(); // e.g. 2025
    objectivesList.forEach((obj, idx) => {
      const amount = parseFloat(obj.o_amount) || 0;
      if (amount <= 0) return;
      const startYear = parseInt(obj.o_start) || currentFYStart;
      const endYear = parseInt(obj.o_end) || startYear;
      const freq = obj.o_freq; // "5" = annual, "1" = weekly, "2" = fortnightly, "3" = monthly, "4" = quarterly, "6" = one-off
      const cpiRate = 0.025;
      const typeLabel = (OBJECTIVE_TYPES.find(t => t.value === obj.o_type) || {}).label || `Objective ${idx + 1}`;
      const vals = new Array(N_YEARS).fill(0);
      for (let y = 0; y < N_YEARS; y++) {
        const projYear = currentFYStart + y;
        if (projYear < startYear || projYear > endYear) continue;
        // Annual amount — index by CPI from start year
        const yearsFromStart = projYear - startYear;
        const indexed = Math.round(amount * Math.pow(1 + cpiRate, yearsFromStart));
        vals[y] = indexed;
        objectiveVals[y] += indexed;
      }
      if (vals.some(v => v > 0)) {
        objectiveRows.push({ label: typeLabel, values: vals, style: "child" });
      }
    });

    const agedCareCombined = (agedCareC1?.totalExpenses || new Array(N_YEARS).fill(0)).map((v, i) => v + ((agedCareC2?.totalExpenses || [])[i] || 0));

    // RAD lump sum withdrawals (SOY — one-off in entry year)
    const radWithdrawalSOY = new Array(N_YEARS).fill(0);
    if (agedCareC1?.radLumpSum > 0 && agedCareC1?.entryYearIdx != null) {
      radWithdrawalSOY[agedCareC1.entryYearIdx] += agedCareC1.radLumpSum;
    }
    if (agedCareC2?.radLumpSum > 0 && agedCareC2?.entryYearIdx != null) {
      radWithdrawalSOY[agedCareC2.entryYearIdx] += agedCareC2.radLumpSum;
    }
    const hasRadWithdrawal = radWithdrawalSOY.some(v => v > 0);

    // ── Opening balance: cash/savings/TD assets owned by clients personally ──
    const cashAssetTypes = ["8", "9"]; // Savings Account, Term Deposits
    const openingCashBalance = (engineData.assets || [])
      .filter(a => cashAssetTypes.includes(a.a_type) && (a.a_owner === "client1" || a.a_owner === "client2" || a.a_owner === "joint" || !a.a_owner))
      .reduce((s, a) => s + (parseFloat(a.a_value) || 0), 0);

    // New debt drawdowns for personal entities
    const personalDebtDrawdown = new Array(N_YEARS).fill(0);
    const personalDebtRows = [];
    Object.entries(newDebtDrawdowns).forEach(([owner, amt]) => {
      if (owner === "client1" || owner === "client2" || owner === "joint") {
        personalDebtDrawdown[0] += amt;
        const vals = new Array(N_YEARS).fill(0); vals[0] = amt;
        const debtInfo = adviceDebts.find(d => d.d_owner === owner);
        personalDebtRows.push({ label: `Debt Drawdown: ${debtInfo?.d_name || "New Loan"}`, values: vals, style: "child" });
      }
    });
    const hasAnnuityRedemption = annuityRedemptionSOY.some(v => v > 0);
    const hasDebtDrawdown = debtDrawdownInflowVals.some(v => v > 0);

    // ── Strategy cashflows: Super/Pension withdrawals → Inflows to savings ──
    // Strat 110/130: super lump sum withdrawals (net of tax) — already in superProj.recontrWithdrawVals (negative)
    // Strat 180: pension lump sum withdrawals — need to aggregate from stratPensionLumpSum
    const superWithdrawSOY = new Array(N_YEARS).fill(0);
    const superWithdrawEOY = new Array(N_YEARS).fill(0);
    const superWithdrawSOYRows = [];
    const superWithdrawEOYRows = [];
    (superProj || []).forEach((proj, fi) => {
      // recontrWithdrawVals are negative — flip to positive for savings inflow
      // But only strat 110/130 (pure drawdowns) go to savings. Strat 107/108 are recontributions (stay in super).
      // The recontrWithdrawVals include ALL withdrawals. We need to separate pure drawdowns.
      // Actually recontrSelfVals/recontrToPartnerVals handle recontribs separately.
      // For savings: net cash to client = |withdrawal| - |tax| - |recontrib to self| - |recontrib to partner|
      if (!proj.recontrWithdrawVals) return;
      const fundName = proj.sp?.fund_name || `Super ${fi + 1}`;
      const soyVals = new Array(N_YEARS).fill(0);
      const eoyVals = new Array(N_YEARS).fill(0);
      for (let y = 0; y < N_YEARS; y++) {
        const withdrawSOY = Math.abs(proj.recontrWithdrawVals[y] || 0);
        const taxSOY = Math.abs(proj.recontrTaxVals?.[y] || 0);
        const recontrSelfSOY = Math.abs(proj.recontrSelfVals?.[y] || 0);
        const recontrToPartnerSOY = Math.abs(proj.recontrToPartnerVals?.[y] || 0);
        const netToClientSOY = Math.max(0, withdrawSOY - taxSOY - recontrSelfSOY - recontrToPartnerSOY);
        if (netToClientSOY > 0) { soyVals[y] = netToClientSOY; superWithdrawSOY[y] += netToClientSOY; }

        const withdrawEOY = Math.abs(proj.recontrWithdrawEOYVals?.[y] || 0);
        // EOY recontribs tracked separately via tfWithdrawEOYVals etc — for now treat EOY withdrawals as net
        if (withdrawEOY > 0) { eoyVals[y] = withdrawEOY; superWithdrawEOY[y] += withdrawEOY; }
      }
      if (soyVals.some(v => v > 0)) superWithdrawSOYRows.push({ label: `Super Withdrawal — ${fundName}`, values: soyVals, style: "child" });
      if (eoyVals.some(v => v > 0)) superWithdrawEOYRows.push({ label: `Super Withdrawal — ${fundName}`, values: eoyVals, style: "child" });
    });

    // Strat 180: pension lump sum withdrawals
    const pensionWithdrawSOY = new Array(N_YEARS).fill(0);
    const pensionWithdrawEOY = new Array(N_YEARS).fill(0);
    const pensionWithdrawSOYRows = [];
    const pensionWithdrawEOYRows = [];
    (stratPensionLumpSum || []).forEach((penArr, pi) => {
      const pf = (engineData.pensions || [])[pi];
      if (!pf) return;
      const fundName = pf.fund_name || `Pension ${pi + 1}`;
      const soyVals = new Array(N_YEARS).fill(0);
      const eoyVals = new Array(N_YEARS).fill(0);
      for (let y = 0; y < N_YEARS; y++) {
        const soyW = penArr[y]?.SOY?.withdrawAmt || 0;
        const eoyW = penArr[y]?.EOY?.withdrawAmt || 0;
        if (soyW > 0) { soyVals[y] = soyW; pensionWithdrawSOY[y] += soyW; }
        if (eoyW > 0) { eoyVals[y] = eoyW; pensionWithdrawEOY[y] += eoyW; }
      }
      if (soyVals.some(v => v > 0)) pensionWithdrawSOYRows.push({ label: `Pension Withdrawal — ${fundName}`, values: soyVals, style: "child" });
      if (eoyVals.some(v => v > 0)) pensionWithdrawEOYRows.push({ label: `Pension Withdrawal — ${fundName}`, values: eoyVals, style: "child" });
    });

    // ── Strategy cashflows: NCC/Spouse/Downsizer contributions → Outflows from savings ──
    // Strat 55 (NCC), 109s (spouse NCC), 234 (downsizer) — already computed in superProj lump arrays
    const nccOutflowSOY = new Array(N_YEARS).fill(0);
    const nccOutflowEOY = new Array(N_YEARS).fill(0);
    const nccOutflowSOYRows = [];
    const nccOutflowEOYRows = [];
    (superProj || []).forEach((proj, fi) => {
      const fundName = proj.sp?.fund_name || `Super ${fi + 1}`;
      const soyVals = new Array(N_YEARS).fill(0);
      const eoyVals = new Array(N_YEARS).fill(0);
      for (let y = 0; y < N_YEARS; y++) {
        const nccSOY = (proj.lumpNccSOYVals?.[y] || 0) + (proj.lumpSpouseSOYVals?.[y] || 0);
        const nccEOY = (proj.lumpNccEOYVals?.[y] || 0) + (proj.lumpSpouseEOYVals?.[y] || 0);
        if (nccSOY > 0) { soyVals[y] = nccSOY; nccOutflowSOY[y] += nccSOY; }
        if (nccEOY > 0) { eoyVals[y] = nccEOY; nccOutflowEOY[y] += nccEOY; }
      }
      if (soyVals.some(v => v > 0)) nccOutflowSOYRows.push({ label: `NCC/Spouse Contribution — ${fundName}`, values: soyVals, style: "child" });
      if (eoyVals.some(v => v > 0)) nccOutflowEOYRows.push({ label: `NCC/Spouse Contribution — ${fundName}`, values: eoyVals, style: "child" });
    });

    // Strat 33: Gifting — annual outflow from savings
    const giftingVals = new Array(N_YEARS).fill(0);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).forEach(s => {
        if (s.strategy_id !== "33") return;
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const ey = s.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY) - currentFY);
        const isMax = s.max_gifting === true || s.max_gifting === "true";
        if (isMax) {
          // $10k/yr, $30k rolling 5yr: pattern is $10k, $10k, $10k, $0, $0, repeat
          let rolling5yr = 0;
          const window = [];
          for (let y = sy; y <= ey; y++) {
            // Remove amounts that have fallen out of the 5-year rolling window
            while (window.length > 0 && window[0].year <= y - 5) {
              rolling5yr -= window[0].amt;
              window.shift();
            }
            // Can gift up to $10k this year, but limited by $30k rolling cap
            const available = Math.min(10000, 30000 - rolling5yr);
            if (available > 0) {
              giftingVals[y] += available;
              rolling5yr += available;
              window.push({ year: y, amt: available });
            }
          }
        } else {
          const amt = parseFloat(s.amount) || 0;
          if (amt <= 0) return;
          for (let y = sy; y <= ey; y++) giftingVals[y] += amt;
        }
      });
    }
    const hasGifting = giftingVals.some(v => v > 0);

    // Strategy 137/138: Granny flat interest — extra cash / funds transfer outflow (SOY, one-off in start year)
    const grannyContribVals = new Array(N_YEARS).fill(0);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "137" || s.strategy_id === "138").forEach(s => {
        const extraCash = s.strategy_id === "138" ? (parseFloat(s.granny_cash_amount) || 0) : (parseFloat(s.granny_extra_cash) || 0);
        if (extraCash <= 0) return;
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        if (sy < N_YEARS) grannyContribVals[sy] += extraCash;
      });
    }
    const hasGrannyContrib = grannyContribVals.some(v => v > 0);

    // Strategy 145: Support at Home (Home Care) — client out-of-pocket contribution
    const SAH_LEVELS_SAV = { "1": 10731, "2": 16034, "3": 21966, "4": 29696, "5": 39697, "6": 48114, "7": 58148, "8": 78106 };
    const SAH_CONTRIB_SAV = { "full": 0.05, "part": 0.125, "sfr": 0.50 };
    const sahExpenseSav = new Array(N_YEARS).fill(0);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "145").forEach(s => {
        const classification = s.hcp_classification || "";
        const pensionerStatus = s.hcp_pensioner_status || "full";
        const annualSubsidy = SAH_LEVELS_SAV[classification] || 0;
        if (annualSubsidy === 0) return;
        const usableBudget = annualSubsidy * 0.90;
        const contribRate = SAH_CONTRIB_SAV[pensionerStatus] || 0.05;
        const baseOOP = Math.round(usableBudget * contribRate);
        const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const ey = s.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY + 30) - currentFY);
        if (sy >= N_YEARS) return;
        const inflRate = parseFloat(engineData.assumptions?.a_cpi) / 100 || 0.025;
        for (let y = sy; y <= ey && y < N_YEARS; y++) {
          sahExpenseSav[y] += Math.round(baseOOP * Math.pow(1 + inflRate, y));
        }
      });
    }
    const hasSahExpense = sahExpenseSav.some(v => v > 0);

    // Bond contributions (Strategy 17) — cash outflow from savings

    // ── Update totalExpenses to include gifting ──
    // Strategy 83: Expense adjustments
    const expAdjVals = new Array(N_YEARS).fill(0);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "83").forEach(s => {
        const amt = parseFloat(s.adj_amount) || 0;
        if (amt <= 0) return;
        const dir = s.adj_direction === "decrease" ? -1 : 1;
        const startYr = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
        const endYr = s.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY + N_YEARS) - currentFY);
        for (let y = startYr; y <= endYr; y++) expAdjVals[y] += Math.round(amt * dir);
      });
    }
    const totalExpenses = livingVals.map((l, i) => l + rentPaidValsSav[i] + hhExpenseValsSav[i] + debtServVals[i] + (taxVals[i] - (paygWithheld[i] || 0)) + contribVals[i] + combinedNonSuperIns[i] + objectiveVals[i] + lumpSumDebtRepayVals[i] + (agedCareCombined[i] || 0) + giftingVals[i] + grannyContribVals[i] + sahExpenseSav[i] + bondContribSavVals[i] + expAdjVals[i]);

    // ── Aggregate SOY inflows and outflows ──
    const soyInflowVals = new Array(N_YEARS).fill(0);  // money IN to savings
    const soyOutflowVals = new Array(N_YEARS).fill(0);  // money OUT of savings
    for (let y = 0; y < N_YEARS; y++) {
      soyInflowVals[y] = (sellProceedsSOY[y] || 0) + (personalDebtDrawdown[y] || 0)
        + (annuityRedemptionSOY[y] || 0) + (debtDrawdownInflowVals[y] || 0)
        + superWithdrawSOY[y] + pensionWithdrawSOY[y] + invProdWithdrawSOY[y];
      soyOutflowVals[y] = (radWithdrawalSOY[y] || 0) + nccOutflowSOY[y];
    }
    const hasSoyInflows = soyInflowVals.some(v => v > 0);
    const hasSoyOutflows = soyOutflowVals.some(v => v > 0);
    const hasAnySoyTxns = hasSoyInflows || hasSoyOutflows;

    // ── EOY inflows/outflows ──
    const eoyInflowVals = new Array(N_YEARS).fill(0);
    const eoyOutflowVals = new Array(N_YEARS).fill(0);

    // Strategy 271: Savings buffer — divert surplus to buffer account
    const bufferContribVals = new Array(N_YEARS).fill(0);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "271").forEach(s => {
        const basisType = s.buffer_basis || "salary";
        const c1G = parseFloat(engineData.income?.client1?.i_gross) || 0;
        const c2G = parseFloat(engineData.income?.client2?.i_gross) || 0;
        const totalSal = c1G + c2G;
        const lifestyleExp = parseFloat(engineData.income?.client1?.i_lifestyle_expenses || engineData.expenses?.total) || 0;
        const basisPct = parseFloat(s.buffer_pct) || 10;
        const basisAmt = basisType === "salary" ? totalSal : basisType === "lifestyle" ? lifestyleExp : 0;
        const targetBuffer = basisType === "custom" ? (parseFloat(s.buffer_amount_override) || 0) : Math.round(basisAmt * basisPct / 100);
        // Check existing balance in the selected account
        const acctIdx = s.buffer_account;
        const existingBal = (acctIdx && acctIdx !== "new") ? (parseFloat((engineData.assets || [])[parseInt(acctIdx)]?.a_value) || 0) : 0;
        const shortfall = Math.max(0, targetBuffer - existingBal);
        if (shortfall <= 0) return; // already have enough — no contribution needed
        const rampYears = Math.max(1, Math.min(5, parseInt(s.ramp_years) || 1));
        const annualContrib = Math.round(shortfall / rampYears);
        for (let y = 0; y < Math.min(rampYears, N_YEARS); y++) {
          bufferContribVals[y] += annualContrib;
        }
      });
    }

    for (let y = 0; y < N_YEARS; y++) {
      eoyInflowVals[y] = (sellProceedsEOY[y] || 0) + superWithdrawEOY[y] + pensionWithdrawEOY[y] + invProdWithdrawEOY[y];
      eoyOutflowVals[y] = nccOutflowEOY[y] + bufferContribVals[y];
    }
    const eoyNetVals = eoyInflowVals.map((v, y) => v - eoyOutflowVals[y]);
    const hasEoyTxns = eoyNetVals.some(v => v !== 0);

    // ── Build running balance arrays ──
    const openBalVals = new Array(N_YEARS).fill(0);
    const soyNetVals = new Array(N_YEARS).fill(0);
    const revisedVals = new Array(N_YEARS).fill(0);
    const surplusVals = new Array(N_YEARS).fill(0);
    const endInitialVals = new Array(N_YEARS).fill(0);
    const endVals = new Array(N_YEARS).fill(0);

    for (let y = 0; y < N_YEARS; y++) {
      openBalVals[y] = y === 0 ? openingCashBalance : endVals[y - 1];
      soyNetVals[y] = soyInflowVals[y] - soyOutflowVals[y];
      revisedVals[y] = openBalVals[y] + soyNetVals[y];
      surplusVals[y] = totalIncome[y] - totalExpenses[y];
      endInitialVals[y] = revisedVals[y] + surplusVals[y];
      endVals[y] = endInitialVals[y] + eoyNetVals[y];
    }

    // ── SOY Inflow rows ──
    const soyInflowRows = [
      ...sellRowsSOY,
      ...personalDebtRows,
      ...(hasAnnuityRedemption ? [{ label: "Annuity Redemption (Net)", values: annuityRedemptionSOY, style: "child" }] : []),
      ...(hasDebtDrawdown ? [{ label: "Debt Drawdown", values: debtDrawdownInflowVals, style: "child" }] : []),
      ...superWithdrawSOYRows,
      ...pensionWithdrawSOYRows,
      ...(hasInvProdWithdrawSOY ? [{ label: "Investment Product Withdrawal", values: invProdWithdrawSOY, style: "child" }] : []),
    ];
    // ── SOY Outflow rows ──
    const soyOutflowRows = [
      ...(hasRadWithdrawal ? [{ label: "RAD — Aged Care Deposit", values: radWithdrawalSOY.map(v => v > 0 ? -v : 0), style: "child-negative", nav: ["Aged Care", "Assessment", null] }] : []),
      ...nccOutflowSOYRows.map(r => ({ ...r, values: r.values.map(v => v > 0 ? -v : 0), style: "child-negative" })),
    ];
    // ── EOY rows ──
    const eoyInflowRows = [
      ...sellRowsEOY,
      ...superWithdrawEOYRows,
      ...pensionWithdrawEOYRows,
      ...(hasInvProdWithdrawEOY ? [{ label: "Investment Product Withdrawal", values: invProdWithdrawEOY, style: "child" }] : []),
    ];
    const eoyOutflowRows = [
      ...nccOutflowEOYRows.map(r => ({ ...r, values: r.values.map(v => v > 0 ? -v : 0), style: "child-negative" })),
      ...(bufferContribVals.some(v => v > 0) ? [{ label: "Savings Buffer Contribution", values: bufferContribVals.map(v => v > 0 ? -v : 0), style: "child-negative" }] : []),
    ];

    const savData = {
      years: shortYears,
      sections: [

        // Opening Balance
        { id: "sav-open", rows: [
          { label: "Opening Balance", values: openBalVals, style: "current-value" },
        ]},

        // SOY Inflows (money coming INTO savings)
        ...(hasSoyInflows ? [{ id: "sav-soy-inflows", title: "Inflows (SOY)", rows: [
          ...soyInflowRows,
          { label: "Total Inflows", values: soyInflowVals, style: "total" },
        ]}] : []),

        // SOY Outflows (money going OUT of savings)
        ...(hasSoyOutflows ? [{ id: "sav-soy-outflows", title: "Outflows (SOY)", rows: [
          ...soyOutflowRows,
          { label: "Total Outflows", values: soyOutflowVals.map(v => v > 0 ? -v : 0), style: "total" },
        ]}] : []),

        // Revised Balance
        ...(hasAnySoyTxns ? [{ id: "sav-revised", rows: [
          { label: "Revised Balance", values: revisedVals, style: "highlight" },
        ]}] : []),

        { id: "sav-income", title: "Income", rows: [
          { label: "Salary (Combined)", values: salaries, style: "child" },
          ...(pplSavVals.some(v => v > 0) ? [{ label: "Paid Parental Leave", values: pplSavVals, style: "child" }] : []),
          ...(jsSavVals.some(v => v > 0) ? [{ label: "JobSeeker Payment", values: jsSavVals, style: "child" }] : []),
          ...(dspSavVals.some(v => v > 0) ? [{ label: "Disability Support Pension", values: dspSavVals, style: "child" }] : []),
          ...(offsetDrawdown.some(v => v > 0) ? [{ label: "Offset Drawdown (Living)", values: offsetDrawdown, style: "child" }] : []),
          ...(rentalVals.some(v => v > 0) ? [{ label: "Rental Income", values: rentalVals, style: "child" }] : []),
          ...(investIncVals.some(v => v > 0) ? [{ label: "Investment Income", values: investIncVals, style: "child" }] : []),
          ...(pensionIncVals.some(v => v > 0) ? [{ label: "Pension Income", values: pensionIncVals, style: "child" }] : []),
          ...(annuityIncVals.some(v => v > 0) ? [{ label: "Annuity Income", values: annuityIncVals, style: "child" }] : []),
          ...(dbPensionSavVals.some(v => v > 0) ? [{ label: "DB Pension Income", values: dbPensionSavVals, style: "child" }] : []),
          ...(dbLumpSumSavVals.some(v => v > 0) ? [{ label: "DB Lump Sum (net)", values: dbLumpSumSavVals, style: "child" }] : []),
          ...(trustDistCombined.some(v => v > 0) ? [{ label: "Trust Distributions", values: trustDistCombined, style: "child" }] : []),
          ...(companyDivCombined.some(v => v > 0) ? [{ label: "Company Dividends", values: companyDivCombined, style: "child" }] : []),
          ...(exitCapReturnCombined.some(v => v > 0) ? [{ label: "Company Exit — Capital Return (tax-free)", values: exitCapReturnCombined, style: "child" }] : []),
          ...(combinedPension.some(v => v > 0) ? [{ label: "Age Pension", values: combinedPension, style: "child" }] : []),
          ...(incAdjVals.some(v => v !== 0) ? [{ label: "Income Adjustments", values: incAdjVals, style: incAdjVals[0] >= 0 ? "child" : "child-negative" }] : []),
          { label: "Total Income", values: totalIncome, style: "total" },
        ]},
        { id: "sav-expenses", title: "Expenses", subSections: [
          { id: "sav-exp-fixed", label: "Fixed Expenses", summaryValues: null, rows: [
            { label: "Living", values: livingVals, style: "child" },
            ...(rentPaidValsSav.some(v => v > 0) ? [{ label: "Rent Paid", values: rentPaidValsSav, style: "child" }] : []),
            ...(hhExpenseValsSav.some(v => v > 0) ? [{ label: "Holiday Home Costs", values: hhExpenseValsSav, style: "child" }] : []),
            { label: "Debt Servicing", values: debtServVals, style: "child" },
            ...(lumpSumDebtRepayVals.some(v => v > 0) ? [{ label: "Lump Sum Debt Repayments", values: lumpSumDebtRepayVals.map(v => -v), style: "child-negative" }] : []),
            { label: "Taxes Payable", values: taxVals, style: "child" },
            ...(paygWithheld.some(v => v > 0) ? [{ label: "PAYG Withheld (Offset Salary)", values: paygWithheld.map(v => -v), style: "child-negative" }] : []),
            { label: "Contributions", values: contribVals, style: "child" },
            ...(combinedNonSuperIns.some(v => v > 0) ? [{ label: "Insurance (Non-Super)", values: combinedNonSuperIns, style: "child" }] : []),
            ...((agedCareC1?.totalExpenses || []).some(v => v > 0) || (agedCareC2?.totalExpenses || []).some(v => v > 0) ? [{ label: "Aged Care", values: (agedCareC1?.totalExpenses || new Array(N_YEARS).fill(0)).map((v, i) => v + ((agedCareC2?.totalExpenses || [])[i] || 0)), style: "child", nav: ["Aged Care", "Assessment", null] }] : []),
            ...(hasGifting ? [{ label: "Gifting", values: giftingVals, style: "child" }] : []),
            ...(hasGrannyContrib ? [{ label: "Granny Flat Contribution", values: grannyContribVals, style: "child" }] : []),
            ...(hasSahExpense ? [{ label: "Support at Home (Home Care)", values: sahExpenseSav, style: "child" }] : []),
            ...(hasBondContrib ? [{ label: "Bond Contributions", values: bondContribSavVals, style: "child" }] : []),
            ...(expAdjVals.some(v => v !== 0) ? [{ label: "Expense Adjustments", values: expAdjVals, style: expAdjVals[0] >= 0 ? "child" : "child-negative" }] : []),
          ]},
          ...(objectiveRows.length > 0 ? [{ id: "sav-exp-objectives", label: "Objectives / Goals", summaryValues: objectiveVals, rows: objectiveRows }] : []),
        ], footerRows: [
          { label: "Total Expenses", values: totalExpenses, style: "total" },
        ]},
        { id: "sav-end-initial", rows: [
          { label: "End Value (Initial)", values: endInitialVals, style: "highlight" },
        ]},

        // EOY Adjustments
        ...(hasEoyTxns ? [{ id: "sav-eoy-adjustments", title: "End of Year Adjustments", rows: [
          ...eoyInflowRows,
          ...eoyOutflowRows,
          ...(eoyInflowRows.length + eoyOutflowRows.length > 1 ? [{ label: "Net EOY Adjustments", values: eoyNetVals, style: "total" }] : []),
        ]}] : []),

        { id: "sav-end-fv", rows: [
          { label: "End Value (FV)", values: endVals, style: "end-value" },
        ]},
      ],
    };

    const cfChartData = shortYears.map((year, i) => ({
      year: year.slice(-5),
      openBalance: openBalVals[i],
      startAdj: soyNetVals[i],
      surplus: surplusVals[i],
      endAdj: eoyNetVals[i],
      endBalance: endVals[i],
      endValue: endVals[i],
      income: totalIncome[i],
      expenses: -totalExpenses[i],
    }));

    const txnChartData = shortYears.map((year, i) => ({
      year: year.slice(-5),
      surplus: surplusVals[i] >= 0 ? surplusVals[i] : 0,
      deficit: surplusVals[i] < 0 ? surplusVals[i] : 0,
      capitalIn: soyInflowVals[i] + eoyInflowVals[i],
      capitalOut: -(soyOutflowVals[i] + eoyOutflowVals[i]),
    }));

    // Project per-asset opening balances independently (for offset benefit calculation)
    // Each asset projects from its own opening value — no pooling
    const assetOpenBals = {};
    ffAssets.forEach((a, ai) => {
      if (!["8","9","10","11"].includes(a.a_type)) return;
      const assetVal = parseFloat(a.a_value) || 0;
      const isOffsetIdx = (factFind.liabilities || []).some(d => (d.d_offset || []).includes(String(ai)));
      const bals = [];
      let running = assetVal;
      for (let y = 0; y < N_YEARS; y++) {
        bals.push(Math.round(running));
        // Offset accounts grow by net salary inflows minus living expenses
        if (isOffsetIdx && hasOffset) {
          const baseExp = parseFloat(engineData.cashflowConfig?.livingExpenses) || 0;
          const expGr = parseFloat(engineData.cashflowConfig?.livingExpensesGrowth) || 0.025;
          const expY = Math.round(baseExp * Math.pow(1 + expGr, y));
          // Use salaryToOffset for this year as the net inflow
          const netInflow = (salaryToOffset[y] || 0) - expY;
          running = Math.max(0, running + netInflow);
        }
      }
      assetOpenBals[ai] = bals;
    });

    return { savData, cfChartData, txnChartData, assetOpenBals };
  };
