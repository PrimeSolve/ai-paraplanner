/* ─── buildDebtData ─── extracted from CashflowModelInner ─── */
import { debtFreqLabel, debtDeductible, assetCategory, offsetWeightFactor } from "../utils/projectionHelpers.js";
import { calcNetSalary } from "../utils/taxCalc.js";

/**
 * Builds debt amortisation schedule for a given debt type category.
 * Handles P&I / IO, offset accounts, lump sum repayments, drawdowns,
 * salary packaging (strat 158), repayment overrides (strat 54),
 * and security/LVR tracking.
 *
 * @param {Object} ctx — projection context
 * @param {string} typeFilter — "home", "investment", or "other"
 * @param {string} idPrefix — section ID prefix
 * @param {Object} freqOverrides — per-debt frequency overrides
 * @param {Object} ioOverrides — per-debt IO mode overrides
 * @param {Object} assetOpenBalsArg — asset opening balances from savings engine
 * @returns {Object} { years, sections }
 */
export const buildDebtData = (ctx, typeFilter, idPrefix, freqOverrides = {}, ioOverrides = {}, assetOpenBalsArg = {}) => {
  const {
    N_YEARS, PROJ_YEARS, currentFY,
    engineData, isAdviceModel,
    ffAssets, ffDebts,
    getAssetRates, ownerLabel,
  } = ctx;

    const matchingDebts = ffDebts.filter(d => {
      if (typeFilter === "home") return d.d_type === "1";
      if (typeFilter === "investment") return d.d_type === "2" || d.d_type === "3";
      return !["1","2","3"].includes(d.d_type);
    });

    const sections = [
      { id: `${idPrefix}-header`, rows: [{ label: "Year", values: Array.from({ length: N_YEARS }, (_, i) => i + 1), style: "header" }] },
      { id: `${idPrefix}-divider-0`, isDivider: true },
    ];

    matchingDebts.forEach((d, di) => {
      const bal = parseFloat(d.d_balance) || 0;
      const rate = parseFloat(d.d_rate) || 0;
      const rateStr = rate.toFixed(2) + "%";
      const statedRepay = parseFloat(d.d_repayments) || 0;
      const debtRef2 = `debt_${ffDebts.indexOf(d)}`;
      const freqOverride = freqOverrides[debtRef2];
      const freqNum = parseFloat(freqOverride || d.d_freq) || 12;
      const freq = debtFreqLabel[freqOverride || d.d_freq] || "Monthly";
      // Per-year IO mode: start from fact find value, apply overrides cascading forward
      const ioYearOverrides = ioOverrides[debtRef2] || {};
      const ioForYear = Array.from({ length: N_YEARS }, (_, yi) => {
        let mode = d.d_io || "2"; // default from fact find
        // Apply all overrides at or before this year, in order
        for (let oi = 0; oi <= yi; oi++) {
          if (ioYearOverrides[oi] !== undefined) mode = ioYearOverrides[oi];
        }
        return mode === "1";
      });
      const isIO = ioForYear[0]; // used for PMT/assumptions display (year 1)
      const dedPct = debtDeductible(d.d_type);

      // Parse term remaining in years (e.g. "22 years" → 22)
      const termYears = parseFloat(d.d_term) || 30;
      const totalPeriods = termYears * freqNum; // e.g. 22 years × 12 months = 264 periods

      // PMT calculation: minimum periodic repayment to clear loan within term
      // PMT = PV × r / (1 - (1+r)^-n) where r = periodic rate, n = total periods
      // Daily compounding converted to effective periodic rate
      // Banks charge interest daily: effective periodic rate = (1 + r/365)^(365/freq) - 1
      const dailyRate = rate / 100 / 365;
      const periodicRate = Math.pow(1 + dailyRate, 365 / freqNum) - 1;
      let minPeriodicRepay = 0;
      if (isIO && bal > 0) {
        minPeriodicRepay = bal * periodicRate; // IO: minimum = interest payment
      } else if (!isIO && bal > 0 && periodicRate > 0 && totalPeriods > 0) {
        minPeriodicRepay = bal * periodicRate / (1 - Math.pow(1 + periodicRate, -totalPeriods));
      }
      // Use the GREATER of stated repayment or PMT minimum
      const effectiveRepay = isIO ? 0 : Math.max(statedRepay, minPeriodicRepay);
      const annualRepay = isIO ? 0 : effectiveRepay * freqNum;

      // Amortise across all projection years using period-by-period calculation
      // This correctly tracks interest as balance reduces through the year
      // Strategy 66 (repayment) and 42 (drawdown) for this debt
      const debtRef = `debt_${ffDebts.indexOf(d)}`;
      const advStrategies = isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []) : [];

      const lumpSumSOY = new Array(N_YEARS).fill(0);
      const lumpSumEOY = new Array(N_YEARS).fill(0);
      const drawdownSOY = new Array(N_YEARS).fill(0);
      const drawdownEOY = new Array(N_YEARS).fill(0);

      // strat 67: salary into offset — one entry per person, sum FV benefits
      const strats67 = advStrategies.filter(s => s.strategy_id === "67" && s.product_id === debtRef);
      const strat67Contributors = strats67.flatMap(s => {
        const pct = Math.min(100, Math.max(0, parseFloat(s.amount) || 100)) / 100;
        const startYr = Math.max(0, parseInt(s.start_year) - currentFY);
        const makeContrib = (incomeKey) => {
          const inc = engineData.income?.[incomeKey] || {};
          const gross = parseFloat(inc.i_gross) || 0;
          const net = calcNetSalary(gross, inc.i_super_inc || "2");
          const freq = parseFloat(inc.i_pay_freq) || 26;
          return { salaryPerPeriod: (net * pct) / freq, salaryFreq: freq, startYear: startYr };
        };
        if (s.owner_id === "joint") {
          // Both clients contribute at their own frequencies
          const contribs = [];
          if (engineData.income?.client1?.i_gross) contribs.push(makeContrib("client1"));
          if (engineData.income?.client2?.i_gross) contribs.push(makeContrib("client2"));
          return contribs;
        }
        return [makeContrib(s.owner_id || "client1")];
      });

      // strat 54: annual repayment override — cascades from start year
      const annualRepayOverride = new Array(N_YEARS).fill(null); // null = no override
      advStrategies.filter(s => s.product_id === debtRef).forEach(s => {
        const yIdx = Math.max(0, parseInt(s.start_year) - currentFY);
        const amt = parseFloat(s.amount) || 0;
        if (amt <= 0 || yIdx < 0 || yIdx >= N_YEARS) return;
        const isEOY = (s.timing || "SOY") === "EOY";
        if (s.strategy_id === "66") { if (isEOY) lumpSumEOY[yIdx] += amt; else lumpSumSOY[yIdx] += amt; }
        if (s.strategy_id === "42" || s.strategy_id === "222") { if (isEOY) drawdownEOY[yIdx] += amt; else drawdownSOY[yIdx] += amt; }
        if (s.strategy_id === "54") {
          // cascade from start year onwards
          for (let yi = yIdx; yi < N_YEARS; yi++) annualRepayOverride[yi] = amt;
        }
        if (s.strategy_id === "158") {
          // Salary packaged amount: added to annual repayment (not a lump sum)
          const ownerKey = s.owner_id || "client1";
          const cd = engineData[ownerKey] || {};
          const cat = cd.fbt_category || "";
          const grossCap = cat === "hospital" ? 9010 : cat === "pbi" ? 15900 : cat === "religious" ? Infinity : 0;
          const fbtCap = cd.fbt_exempt === "1" ? Math.max(0, grossCap - (parseFloat(cd.fbt_other_benefits) || 0)) : 0;
          const cappedAmt = Math.min(amt, fbtCap);
          if (cappedAmt > 0) {
            const endYr = s.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY + N_YEARS) - currentFY);
            for (let yi = yIdx; yi <= endYr; yi++) annualRepayOverride[yi] = (annualRepayOverride[yi] || (Math.max(statedRepay, minPeriodicRepay) * freqNum)) + cappedAmt;
          }
        }
      });

      const currentVals = [], revisedVals = [], servicingVals = [];
      const initEndVals = [], endVals = [], dedIntVals = [];
      const interestVals = [], principalVals = [];
      const effectiveAnnualRepayVals = [];
      const offsetBenefitVals = [];
      const redrawnAvailVals = []; // tracks redraw available each year
      let openBal = bal;
      // Opening redraw balance from fact find
      let redrawnAvail = parseFloat(d.d_redraw) || 0;
      // Scheduled balance tracker — where loan "should" be on minimum repayments only
      // Used to calculate extra principal paid = actual principal - scheduled principal
      let scheduledBal = bal;

      for (let y = 0; y < N_YEARS; y++) {
        const currentBal = openBal; // Current Value — never modified

        // SOY transactions day 1: repayment reduces, drawdown increases → Revised Value
        const soyLump = Math.min(lumpSumSOY[y], currentBal);
        // Home/investment loans: cap drawdown by redraw available (accessing own overpayments)
        // Margin loans: uncapped (genuine re-advance)
        const isRedrawnLoan = ["1","2","3"].includes(d.d_type);
        const soyDrawdownRaw = drawdownSOY[y];
        const soyDrawdown = isRedrawnLoan ? Math.min(soyDrawdownRaw, redrawnAvail) : soyDrawdownRaw;
        const revisedBal = Math.max(0, currentBal - soyLump + soyDrawdown);

        currentVals.push(Math.round(currentBal));
        revisedVals.push(Math.round(revisedBal));

        if (revisedBal <= 0) {
          servicingVals.push(0); interestVals.push(0); principalVals.push(0);
          effectiveAnnualRepayVals.push(0); offsetBenefitVals.push(0);
          initEndVals.push(0); endVals.push(0); dedIntVals.push(0);
          redrawnAvailVals.push(Math.round(redrawnAvail));
          openBal = 0;
          continue;
        }

        // Amortisation runs from Revised Value
        let periodBal2 = revisedBal;

        if (ioForYear[y]) {
          // Interest-only: balance stays flat
          const interestThisYear = Math.round(revisedBal * (rate / 100));
          // Offset benefit — weighted average daily balance method
          const ioOffsetBal = Math.min((() => {
            const activeContribs = strat67Contributors.filter(c => y >= c.startYear);
            const offsetAssetIdx = parseInt((d.d_offset || [])[0]);
            const openingOffset = !isNaN(offsetAssetIdx)
              ? (assetOpenBalsArg[offsetAssetIdx]?.[y] ?? (parseFloat((engineData.assets || [])[offsetAssetIdx]?.a_value) || 0))
              : 0;
            if (openingOffset <= 0 && activeContribs.length === 0) return 0;
            // Annual living expenses drawn from offset — grows with CPI each year
            const baseExpenses = parseFloat(engineData.cashflowConfig?.livingExpenses) || 0;
            const expGrowth = parseFloat(engineData.cashflowConfig?.livingExpensesGrowth) || 0.025;
            const annualExpenses = Math.round(baseExpenses * Math.pow(1 + expGrowth, y));
            // Weighted average daily offset balance
            let avgOffset = openingOffset; // sits all year, weight = 1.0
            activeContribs.forEach(c => {
              const annualSalary = c.salaryPerPeriod * c.salaryFreq;
              const weight = offsetWeightFactor(c.salaryFreq);
              avgOffset += annualSalary * weight;
            });
            avgOffset -= annualExpenses * 0.5; // expenses drain linearly
            avgOffset = Math.max(0, avgOffset);
            return avgOffset * (rate / 100);
          })(), interestThisYear);
          const ioAdjustedInterest = interestThisYear - Math.round(ioOffsetBal);
          servicingVals.push(ioAdjustedInterest);
          interestVals.push(ioAdjustedInterest);
          principalVals.push(0);
          effectiveAnnualRepayVals.push(ioAdjustedInterest);
          offsetBenefitVals.push(Math.round(ioOffsetBal));
          initEndVals.push(Math.round(revisedBal));
          // EOY: repayment reduces, drawdown increases → Final End Value
          const eoyLump = Math.min(lumpSumEOY[y], revisedBal);
          openBal = Math.max(0, revisedBal - eoyLump + drawdownEOY[y]);
          endVals.push(Math.round(openBal));
          dedIntVals.push(dedPct === "100%" ? interestThisYear : 0);
          // IO: no principal reduction, scheduled also stays flat
          // Cap EOY drawdown by remaining redraw after SOY drawdown
          const redrawnAfterSOY = Math.max(0, redrawnAvail + soyLump - soyDrawdown);
          const eoyDrawdown = isRedrawnLoan ? Math.min(drawdownEOY[y], redrawnAfterSOY) : drawdownEOY[y];
          openBal = Math.max(0, revisedBal - eoyLump + eoyDrawdown);
          endVals[endVals.length - 1] = Math.round(openBal); // fix end val with capped drawdown
          redrawnAvail = Math.max(0, redrawnAfterSOY + eoyLump - eoyDrawdown);
          redrawnAvailVals.push(Math.round(redrawnAvail));
          scheduledBal = scheduledBal;
        } else {
          // P&I: amortise from revisedBal period-by-period
          // Offset benefit — weighted average daily balance method
          const normalAnnualInterest = revisedBal * (rate / 100);
          const piOffsetBenefit = Math.min((() => {
            const activeContribs = strat67Contributors.filter(c => y >= c.startYear);
            const offsetAssetIdx = parseInt((d.d_offset || [])[0]);
            const openingOffset = !isNaN(offsetAssetIdx)
              ? (assetOpenBalsArg[offsetAssetIdx]?.[y] ?? (parseFloat((engineData.assets || [])[offsetAssetIdx]?.a_value) || 0))
              : 0;
            if (openingOffset <= 0 && activeContribs.length === 0) return 0;
            // Annual living expenses drawn from offset — grows with CPI each year
            const baseExpenses = parseFloat(engineData.cashflowConfig?.livingExpenses) || 0;
            const expGrowth = parseFloat(engineData.cashflowConfig?.livingExpensesGrowth) || 0.025;
            const annualExpenses = Math.round(baseExpenses * Math.pow(1 + expGrowth, y));
            // Weighted average daily offset balance
            let avgOffset = openingOffset; // sits all year, weight = 1.0
            activeContribs.forEach(c => {
              const annualSalary = c.salaryPerPeriod * c.salaryFreq;
              const weight = offsetWeightFactor(c.salaryFreq);
              avgOffset += annualSalary * weight;
            });
            avgOffset -= annualExpenses * 0.5; // expenses drain linearly
            avgOffset = Math.max(0, avgOffset);
            return avgOffset * (rate / 100);
          })(), normalAnnualInterest);
          // Apply strat 54 annual repayment override — clamp between min and max
          let yearlyRepay = effectiveRepay * freqNum;
          if (annualRepayOverride[y] !== null) {
            const minAnnual = minPeriodicRepay * freqNum;
            const maxAnnual = revisedBal; // can't exceed balance
            yearlyRepay = Math.min(Math.max(annualRepayOverride[y], minAnnual), maxAnnual);
          }
          const periodicRepayThisYear = yearlyRepay / freqNum;

          let periodBal = revisedBal;
          let totalInterest = 0;
          let totalServicing = 0;

          for (let p = 0; p < freqNum; p++) {
            if (periodBal <= 0) break;
            const periodInterest = periodBal * periodicRate;
            const periodPayment = Math.min(periodicRepayThisYear, periodBal + periodInterest);
            const periodPrincipal = Math.max(0, periodPayment - periodInterest);
            totalInterest += periodInterest;
            totalServicing += periodPayment;
            periodBal = Math.max(0, periodBal - periodPrincipal);
          }

          const closeBal = Math.max(0, periodBal);
          // EOY lump sum → Final End Value
          const eoyLump = Math.min(lumpSumEOY[y], closeBal);
          const closeBalAfterLump = Math.max(0, closeBal - eoyLump + drawdownEOY[y]);

          const principalReduction = Math.round(revisedBal) - Math.round(closeBal);
          const piOffsetRounded = Math.round(piOffsetBenefit);
          servicingVals.push(Math.round(totalServicing) - piOffsetRounded);
          interestVals.push(Math.round(totalServicing) - principalReduction - piOffsetRounded);
          principalVals.push(principalReduction);
          effectiveAnnualRepayVals.push(Math.round(yearlyRepay));
          offsetBenefitVals.push(piOffsetRounded);
          initEndVals.push(Math.round(closeBal));
          endVals.push(Math.round(closeBalAfterLump));
          dedIntVals.push(dedPct === "100%" ? Math.round(totalServicing) - principalReduction : 0);

          openBal = closeBalAfterLump;

          // Redraw tracking: scheduled balance on minimum repayments only
          let scheduledClose = scheduledBal;
          if (!ioForYear[y] && scheduledBal > 0 && periodicRate > 0 && totalPeriods > 0) {
            const schedPeriodsLeft = Math.max(1, totalPeriods - y * freqNum);
            const schedMinRepay = scheduledBal * periodicRate / (1 - Math.pow(1 + periodicRate, -schedPeriodsLeft));
            let sb = scheduledBal;
            for (let p = 0; p < freqNum; p++) {
              if (sb <= 0) break;
              const si = sb * periodicRate;
              const sp = Math.min(schedMinRepay, sb + si);
              sb = Math.max(0, sb - Math.max(0, sp - si));
            }
            scheduledClose = Math.max(0, sb);
          }
          const scheduledPrincipalPaid = Math.round(scheduledBal - scheduledClose);
          const actualPrincipalPaid = principalReduction;
          const extraPrincipal = Math.max(0, actualPrincipalPaid - scheduledPrincipalPaid);
          // Cap EOY drawdown by redraw remaining after SOY drawdown + extra principal built this year
          const redrawnAfterSOYPI = Math.max(0, redrawnAvail + extraPrincipal + soyLump - soyDrawdown);
          const eoyDrawdown = isRedrawnLoan ? Math.min(drawdownEOY[y], redrawnAfterSOYPI) : drawdownEOY[y];
          // Fix end val to use capped EOY drawdown
          const closeBalCapped = Math.max(0, closeBal - eoyLump + eoyDrawdown);
          endVals[endVals.length - 1] = Math.round(closeBalCapped);
          openBal = closeBalCapped;
          redrawnAvail = Math.max(0, redrawnAfterSOYPI + eoyLump - eoyDrawdown);
          redrawnAvailVals.push(Math.round(redrawnAvail));
          scheduledBal = scheduledClose;
        }
      }

      // Security rows — also project asset values forward
      // Include any assets pledged via Strategy 69 (Pledge asset as security)
      const debtIdxGlobal = ffDebts.indexOf(d);
      const baseSecurity = [...(d.d_security || [])];
      if (isAdviceModel) {
        (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "69").forEach(s => {
          const pledgeDebtIdx = s.pledge_debt_idx;
          const pledgeAssetIdxs = s.pledge_asset_idxs || [];
          if (pledgeDebtIdx !== "" && parseInt(pledgeDebtIdx) === debtIdxGlobal) {
            pledgeAssetIdxs.forEach(aIdx => {
              if (!baseSecurity.includes(String(aIdx))) baseSecurity.push(String(aIdx));
            });
          }
        });
      }
      const securityRows = baseSecurity.map(sIdx => {
        const secAsset = ffAssets[parseInt(sIdx)];
        if (!secAsset) return null;
        const secVal = parseFloat(secAsset.a_value) || 0;
        const secCat = assetCategory(secAsset.a_type);
        const secGr = getAssetRates(parseInt(sIdx), secAsset.a_type).growthRate;
        const secVals = [];
        let sv = secVal;
        for (let y = 0; y < N_YEARS; y++) { secVals.push(Math.round(sv)); sv = sv * (1 + secGr); }
        return { label: secAsset.a_name || `Asset ${parseInt(sIdx) + 1}`, values: secVals, style: "child" };
      }).filter(Boolean);

      // LVR across years
      const startLVRVals = [], revisedLVRVals = [], endLVRVals = [];
      for (let y = 0; y < N_YEARS; y++) {
        const secTotal = securityRows.reduce((sum, r) => sum + (r.values[y] || 0), 0);
        const sLVR = secTotal > 0 ? ((currentVals[y] / secTotal) * 100).toFixed(2) + "%" : "N/A";
        const eLVR = secTotal > 0 ? ((endVals[y] / secTotal) * 100).toFixed(2) + "%" : "N/A";
        startLVRVals.push(sLVR);
        revisedLVRVals.push(sLVR);
        endLVRVals.push(eLVR);
      }

      // Derive owner entity for badge display
      const debtOwnerEntity = ownerLabel({ a_owner: d.d_owner, a_ownType: d.d_ownType });

      // Format repayment info
      const minRepayStr = `$${Math.round(minPeriodicRepay).toLocaleString()}`;
      const statedRepayStr = `$${Math.round(statedRepay).toLocaleString()}`;
      const effectiveRepayStr = `$${Math.round(effectiveRepay).toLocaleString()}`;
      const bumped = !isIO && effectiveRepay > statedRepay;

      sections.push(
        { id: `${idPrefix}-${di}`, title: d.d_name || `Debt ${di + 1}`, entity: debtOwnerEntity, isNew: !!d._isAdvice, rows: [
          { label: "Interest Rate", values: new Array(N_YEARS).fill(rateStr), style: "child" },
          { label: "Loan Type", values: ioForYear.map(io => io ? "IO" : "P & I"), style: "child", editType: "io-select", debtRef: debtRef2, ioForYear, ioYearOverrides, tooltip: "Change loan type in any year — it cascades forward until changed again. Override years show with a purple border." },
          { label: "Term Remaining", values: Array.from({ length: N_YEARS }, (_, i) => Math.max(0, termYears - i) > 0 ? `${Math.max(0, termYears - i)} yrs` : "Paid off"), style: "child" },
          { label: "Repayment Frequency", values: new Array(N_YEARS).fill(freq), style: "child", editable: true, editType: "freq-select", debtRef: debtRef2, currentFreq: freqOverride || d.d_freq || "12" },
          { label: "Min Repayment (PMT)", values: new Array(N_YEARS).fill(minRepayStr), style: "child" },
          { label: "Stated Repayment", values: new Array(N_YEARS).fill(statedRepayStr), style: bumped ? "child-negative" : "child" },
          { label: "Effective Repayment", values: effectiveAnnualRepayVals, style: "highlight" },
          { label: "Current Value", values: currentVals, style: "current-value" },
          ...(lumpSumSOY.some(v => v > 0) ? [{ label: "Lump Sum Repayment (SOY)", values: lumpSumSOY.map(v => -v), style: "child-negative" }] : []),
          ...(drawdownSOY.some(v => v > 0) ? [{ label: "Drawdown (SOY)", values: drawdownSOY, style: "child" }] : []),
          { label: "Revised Value", values: revisedVals, style: "highlight" },
          { label: "Debt Servicing", values: servicingVals, style: "child-negative" },
          { label: "— Interest", values: interestVals, style: "child-negative" },
          { label: "— Principal", values: principalVals, style: "child-negative" },
          ...(offsetBenefitVals.some(v => v > 0) ? [{ label: "— Offset Benefit", values: offsetBenefitVals, style: "child" }] : []),
          { label: "Initial End Value", values: initEndVals, style: "subtotal" },
          ...(lumpSumEOY.some(v => v > 0) ? [{ label: "Lump Sum Repayment (EOY)", values: lumpSumEOY.map(v => -v), style: "child-negative" }] : []),
          ...(drawdownEOY.some(v => v > 0) ? [{ label: "Drawdown (EOY)", values: drawdownEOY, style: "child" }] : []),
          { label: "End Value", values: endVals, style: "end-value" },
          ...(d.d_has_redraw === "1" || redrawnAvailVals.some(v => v > 0) ? [{ label: "Redraw Available", values: redrawnAvailVals, style: "child" }] : []),
          // Assets Held as Security sub-group
          ...(securityRows.length > 0 ? [
            { label: "Assets Held as Security", values: new Array(N_YEARS).fill(""), style: "section-header" },
            ...securityRows,
          ] : []),
          // Loan to Valuation Ratio sub-group
          ...(securityRows.length > 0 ? [
            { label: "Loan to Valuation Ratio", values: new Array(N_YEARS).fill(""), style: "section-header" },
            { label: "Starting LVR", values: startLVRVals, style: "child" },
            { label: "Revised LVR", values: revisedLVRVals, style: "child" },
            { label: "End LVR", values: endLVRVals, style: "child" },
          ] : []),
          // Tax sub-group
          { label: "Tax", values: new Array(N_YEARS).fill(""), style: "section-header" },
          { label: "Deductible Percentage", values: new Array(N_YEARS).fill(dedPct), style: "child" },
          { label: "Deductible Interest", values: dedIntVals, style: "child" },
        ]},
      );
    });

    if (matchingDebts.length === 0) {
      sections.push({ id: `${idPrefix}-empty`, title: "No debts in this category", rows: [] });
    }

    return { years: PROJ_YEARS, sections };
};
