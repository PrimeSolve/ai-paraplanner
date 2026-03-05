/* ─── buildAgedCareData ─── extracted from CashflowModelInner ─── */
import { AGE_PENSION_PARAMS } from "../constants/assumptions.js";

/**
 * Builds aged care means testing projections for a client.
 *
 * @param {Object} ctx — projection context
 * @param {number}   ctx.N_YEARS        — projection length
 * @param {number}   ctx.currentFY      — current financial year number
 * @param {Object}   ctx.engineData     — full model data
 * @param {boolean}  ctx.isAdviceModel   — whether we are in advice mode
 * @param {Array}    ctx.superProj      — super projection results array
 * @param {Array}    ctx.smsfDataList   — SMSF data list from buildSMSFData
 * @param {string}   ctx.c1Short        — client 1 short display name
 * @param {Function} ctx.ageAtFYStart   — (dob) => age at FY start
 * @param {string} clientKey — "client1" or "client2"
 * @returns {Object|null} aged care projection data
 */
export const buildAgedCareData = (ctx, clientKey) => {
  const {
    N_YEARS, currentFY,
    engineData, isAdviceModel,
    superProj, smsfDataList,
    c1Short, ageAtFYStart,
  } = ctx;

  const ck = clientKey;
  const ckNum = ck === "client1" ? "client1" : "client2";
  const clientData = engineData[ck];
  if (!clientData) return null;

  // Find strategy 57 for this client
  const strats57 = isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []).filter(
    s => s.strategy_id === "57" && (s.owner_id === ckNum || s.owner_id === "joint")
  ) : [];
  if (strats57.length === 0) return null;

  const strat = strats57[0];
  const rad = parseFloat(strat.amount) || 0;
  const radPct = Math.min(100, Math.max(0, parseFloat(strat.rad_pct) || 100));
  const radLumpSum = Math.round(rad * radPct / 100);
  const dapPortion = rad - radLumpSum;
  const entryYear = parseInt(strat.start_year) || (currentFY + 18);
  const entryYearIdx = Math.max(0, entryYear - currentFY);

  // Client info
  const dob = clientData.date_of_birth;
  const clientAge = dob ? ageAtFYStart(dob) : 60;
  const entryAge = clientAge + entryYearIdx;
  const clientName = ck === "client1"
    ? ((engineData.client1?.first_name || "") + " " + (engineData.client1?.last_name || "")).trim() || "Client 1"
    : ((engineData.client2?.first_name || "") + " " + (engineData.client2?.last_name || "")).trim() || "Client 2";

  // Partner info
  const partnerKey = ck === "client1" ? "client2" : "client1";
  const partnerData = engineData[partnerKey];
  const hasPartner = !!partnerData?.date_of_birth;
  const partnerName = partnerKey === "client1"
    ? ((engineData.client1?.first_name || "") + " " + (engineData.client1?.last_name || "")).trim() || "Client 1"
    : ((engineData.client2?.first_name || "") + " " + (engineData.client2?.last_name || "")).trim() || "Client 2";

  // ── Legislated Rates (Pre-1 Nov 2025 rules, current to 19 Mar 2026) ──
  const MPIR = 0.0765;                  // Maximum Permissible Interest Rate (Jan-Mar 2026: 7.65%)
  const BASIC_DAILY_FEE_ANNUAL = Math.round(AGE_PENSION_PARAMS.maxAnnualSingle * 0.85);
  const BASIC_DAILY_FEE = +(BASIC_DAILY_FEE_ANNUAL / 365).toFixed(2);
  const DAP_ANNUAL_CALC = (radAmt) => Math.round(radAmt * MPIR);
  const ADDITIONAL_SERVICES = 15000;
  const INFLATION = parseFloat(engineData.cashflowConfig?.livingExpensesGrowth) || 0.025;

  // Maximum Accommodation Supplement Amount (MASA) — the daily threshold that determines
  // whether MTCF applies and accommodation status (supported vs full payer)
  const MASA_DAILY = 70.94;

  // ── Aged Care Means Test Thresholds ──
  const AC_MEANS = {
    // Income test
    incomeFreeSingle: 34762,               // Income free area — single
    incomeFreeCoupleSeparated: 34034,       // Illness-separated couple (each)
    incomeTestRate: 0.50,                   // 50% of income above free area

    // Asset test — tiered thresholds
    assetTier0: 63000,                      // Asset free area
    assetTier1: 210555.20,                  // End of 17.5% band (= home cap)
    assetTier2: 505665.60,                  // End of 1% band
    assetRate1: 0.175,                      // 17.5% on assets $63k–$210.5k
    assetRate2: 0.01,                       // 1% on assets $210.5k–$505.7k
    assetRate3: 0.02,                       // 2% on assets above $505.7k
    assetTier1Amount: 25822.16,             // Cumulative at end of tier 1
    assetTier2Amount: 28773.26,             // Cumulative at end of tier 2

    // MTCF caps
    annualMTCFCap: 35238.11,
    lifetimeMTCFCap: 84571.66,

    // Cost of care cap (highest daily rate including primary supplements)
    costOfCareDaily: 403.80,

    // RAD retention
    radRetentionRate: 0.02,                 // 2% pa of RAD balance
    radRetentionMaxYears: 5,

    // Home value cap for means assessment
    homeCap: 210555.20,
  };

  // ── Gather assessable assets at a projection year ──
  const homeAssets = (engineData.assets || []).filter(a => a.a_type === "1");
  const homeValue = homeAssets.reduce((s, a) => s + (parseFloat(a.a_value) || 0), 0);
  const isHomeowner = homeValue > 0;
  const homeRetained = true; // per Tim: keep the home for now
  const partnerInHome = hasPartner && homeRetained;
  const HOME_CAP = AC_MEANS.homeCap;

  const gatherAssessableAssets = (yearIdx) => {
    const items = [];
    let total = 0;
    const yi = Math.min(yearIdx, N_YEARS - 1);

    // Super accumulation — from real projection engine (superProj closingVals)
    (superProj || []).forEach((proj, fi) => {
      if (proj.sp?.owner !== ckNum) return;
      const bal = (proj.closingVals && proj.closingVals[yi]) || 0;
      if (bal > 0) {
        items.push({ label: `Super (accum) — ${proj.sp.fund_name || "Super " + (fi+1)}`, value: Math.round(bal) });
        total += Math.round(bal);
      }
    });

    // Pensions — project locally (no centralised pension projection array exists)
    (engineData.pensions || []).forEach(pf => {
      if (pf.owner !== ckNum) return;
      let bal = parseFloat(pf.balance) || 0;
      if (bal <= 0) return;
      const pfDrawdownRate = (parseFloat(pf.drawdown_rate) || 5) / 100;
      const pfDrawdownType = pf.drawdown_type || "percentage";
      const pfDrawdownFixed = parseFloat(pf.drawdown_amount) || 0;
      const pfAdminFee = parseFloat(pf.fees?.admin_fee) || 0;
      const pfPctFee = (parseFloat(pf.fees?.percent_fee) || 0) / 100;
      const pfGrowthRate = 0.07;
      const pfClientDob = pf.owner === "client1" ? engineData.client1?.date_of_birth : engineData.client2?.date_of_birth;
      const pfStartAge = ageAtFYStart(pfClientDob) ?? clientAge;
      const pfMinDrawdownRate = (age) => {
        if (age < 65) return 0.04; if (age < 75) return 0.05; if (age < 80) return 0.06;
        if (age < 85) return 0.07; if (age < 90) return 0.09; if (age < 95) return 0.11; return 0.14;
      };
      for (let y = 0; y < yi; y++) {
        if (bal <= 0) break;
        const age = pfStartAge + y;
        const minDraw = Math.round(bal * pfMinDrawdownRate(age));
        let drawdown = pfDrawdownType === "dollar" ? Math.max(minDraw, pfDrawdownFixed) : Math.max(minDraw, Math.round(bal * pfDrawdownRate));
        drawdown = Math.min(drawdown, bal);
        const fees = Math.round(pfAdminFee + (bal * pfPctFee));
        const avgBal = bal - drawdown / 2 - fees / 2;
        bal = Math.max(0, bal - drawdown - fees + Math.round(Math.max(0, avgBal) * pfGrowthRate));
      }
      items.push({ label: `Pension — ${pf.fund_name || "Pension"}`, value: Math.round(bal) });
      total += Math.round(bal);
    });

    // SMSF — from real projection engine (mClosingBal per member)
    (smsfDataList || []).forEach((sf, sfIdx) => {
      const smsf = (engineData.smsfs || [])[sfIdx];
      const accounts = smsf?.accounts || [];
      const mClosing = sf.mClosingBal || [];
      (sf.memberData || []).forEach((member, mi) => {
        // Determine owner from accounts array
        const acc = accounts[mi];
        const accOwner = acc?.owner || (member.clientName === c1Short ? "client1" : "client2");
        if (accOwner !== ck) return;
        const bal = (mClosing[mi] && mClosing[mi][yi]) || 0;
        if (bal > 0) {
          const envLabel = member.taxEnv === "pension" ? "Pension" : "Accumulation";
          items.push({ label: `SMSF — ${sf.name || smsf?.smsf_name || "SMSF"} (${envLabel})`, value: Math.round(bal) });
          total += Math.round(bal);
        }
      });
    });

    // Investment assets (non-home) — grow from fact find using asset assumptions
    (engineData.assets || []).filter(a => a.a_type !== "1").forEach(a => {
      let val = parseFloat(a.a_value) || 0;
      const gr = (engineData.assetAssumptions?.[a.a_type]?.growthRate ?? 3) / 100;
      for (let y = 0; y < yi; y++) { val *= (1 + gr); }
      items.push({ label: a.a_name || "Asset", value: Math.round(val) });
      total += Math.round(val);
    });

    // RAD is an assessable asset (balance sheet swap: cash → RAD)
    items.push({ label: "RAD (Refundable Accommodation Deposit)", value: radLumpSum });
    total += radLumpSum;

    // Home — only if NOT exempt
    if (isHomeowner && !partnerInHome) {
      const cappedHome = Math.min(homeValue, HOME_CAP);
      items.push({ label: "Home (capped — no partner in home)", value: cappedHome });
      total += cappedHome;
    } else if (isHomeowner && partnerInHome) {
      items.push({ label: "Home (EXEMPT — partner remains)", value: 0, exempt: true, fullValue: homeValue });
    }

    return { items, total };
  };

  // ── Gather assessable income at entry year ──
  const gatherAssessableIncome = (yearIdx) => {
    const items = [];
    let total = 0;

    const salary = parseFloat(clientData.gross_salary) || 0;
    if (salary > 0) {
      items.push({ label: "Employment Income", value: salary });
      total += salary;
    }

    // Deemed income from financial assets (NOT RAD — RAD is not deemed)
    const assetData = gatherAssessableAssets(yearIdx);
    const deemedAssets = assetData.total - radLumpSum; // RAD excluded from deeming
    const deemingThreshold = hasPartner ? AGE_PENSION_PARAMS.deemingThresholdCouple : AGE_PENSION_PARAMS.deemingThresholdSingle;
    const deemedLower = Math.min(Math.max(0, deemedAssets), deemingThreshold) * AGE_PENSION_PARAMS.deemingRateLower;
    const deemedUpper = Math.max(0, deemedAssets - deemingThreshold) * AGE_PENSION_PARAMS.deemingRateUpper;
    const deemedIncome = Math.round(deemedLower + deemedUpper);
    if (deemedIncome > 0) {
      items.push({ label: "Deemed Income (financial assets)", value: deemedIncome });
      total += deemedIncome;
    }

    // Rental income
    (engineData.assets || []).filter(a => a.a_type === "18" || a.a_type === "21").forEach(a => {
      const rent = parseFloat(a.a_income) || 0;
      if (rent > 0) {
        items.push({ label: `Rental Income — ${a.a_name || "Property"}`, value: Math.round(rent) });
        total += Math.round(rent);
      }
    });

    items.push({ label: "RAD Deemed Income", value: 0, note: "RAD is NOT deemed for income test" });

    return { items, total };
  };

  const entryAssets = gatherAssessableAssets(entryYearIdx);
  const entryIncome = gatherAssessableIncome(entryYearIdx);

  // ── MEANS TEST CALCULATION (Pre-1 Nov 2025 legislated formula) ──
  //
  // Means Tested Amount (MTA) = Income Test Contribution + Asset Test Contribution
  // Both are calculated as annual amounts then ÷ 364 to get daily rate.
  //
  // MTCF daily = lesser of (MTA daily − MASA) or (cost of care daily)
  // If MTA daily ≤ MASA → no MTCF (resident is "supported")
  // If MTCF daily < $1 → reduced to nil
  // Subject to annual cap and lifetime cap.

  // STEP 1: Income test contribution
  const incomeFreeArea = hasPartner ? AC_MEANS.incomeFreeCoupleSeparated : AC_MEANS.incomeFreeSingle;
  const incomeAboveThreshold = Math.max(0, entryIncome.total - incomeFreeArea);
  const incomeTestedAnnual = incomeAboveThreshold * AC_MEANS.incomeTestRate;
  const incomeTestedDaily = incomeTestedAnnual / 364;

  // STEP 2: Asset test contribution (tiered)
  // Tier 1: $63,000 – $210,555.20 → 17.5%
  // Tier 2: $210,555.20 – $505,665.60 → 1%
  // Tier 3: $505,665.60+ → 2%
  const totalAssets = entryAssets.total;
  let assetTestedAnnual = 0;
  if (totalAssets <= AC_MEANS.assetTier0) {
    assetTestedAnnual = 0;
  } else if (totalAssets <= AC_MEANS.assetTier1) {
    assetTestedAnnual = (totalAssets - AC_MEANS.assetTier0) * AC_MEANS.assetRate1;
  } else if (totalAssets <= AC_MEANS.assetTier2) {
    assetTestedAnnual = AC_MEANS.assetTier1Amount + (totalAssets - AC_MEANS.assetTier1) * AC_MEANS.assetRate2;
  } else {
    assetTestedAnnual = AC_MEANS.assetTier2Amount + (totalAssets - AC_MEANS.assetTier2) * AC_MEANS.assetRate3;
  }
  const assetTestedDaily = assetTestedAnnual / 364;

  // STEP 3: Means Tested Amount (MTA)
  const mtaDaily = incomeTestedDaily + assetTestedDaily;
  const mtaAnnual = Math.round(mtaDaily * 364);

  // STEP 4: Means-Tested Care Fee
  const mtcfDailyRaw = mtaDaily - MASA_DAILY;
  const mtcfDailyCostCapped = Math.min(Math.max(0, mtcfDailyRaw), AC_MEANS.costOfCareDaily);
  const mtcfDaily = mtcfDailyCostCapped < 1.0 ? 0 : mtcfDailyCostCapped;
  const mtcfAnnual = Math.min(Math.round(mtcfDaily * 364), Math.round(AC_MEANS.annualMTCFCap));

  // STEP 5: Accommodation Status
  // MTA daily ≥ MASA → Full Payer (pays accommodation payment: RAD/DAP)
  // MTA daily < MASA → Supported (pays accommodation contribution: RAC/DAC, govt supplements)
  const isFullPayer = mtaDaily >= MASA_DAILY;
  const accommodationStatus = isFullPayer ? "Full Payer" : "Supported";

  // ── Government Accommodation Supplement (only for supported residents) ──
  // If MTA < MASA, government supplements accommodation up to MASA ($70.94/day)
  // Full payers get $0 — they pay full RAD/DAP
  const ACCOM_SUPPLEMENT_DAILY = MASA_DAILY;
  const ACCOM_SUPPLEMENT_ANNUAL = Math.round(ACCOM_SUPPLEMENT_DAILY * 365);
  const govtAccomSupplementEligible = !isFullPayer;

  // ── Payment Method ──
  const paymentMethod = radPct >= 100 ? "full_rad" : radPct <= 0 ? "full_dap" : "partial";
  const dapAnnual = DAP_ANNUAL_CALC(dapPortion);

  // ── RAD Retention ──
  const RETENTION_RATE = AC_MEANS.radRetentionRate;  // 2% pa of RAD balance
  const MAX_RETENTION_YEARS = AC_MEANS.radRetentionMaxYears;  // 5 years max

  // ── Build year-by-year arrays ──
  const years = N_YEARS;
  const radBalance = new Array(years).fill(0);
  const basicDailyFee = new Array(years).fill(0);
  const meansTested = new Array(years).fill(0);
  const dapPayments = new Array(years).fill(0);
  const additionalServices = new Array(years).fill(0);
  const totalExpenses = new Array(years).fill(0);
  const retentionDeducted = new Array(years).fill(0);
  const cumulativeRetention = new Array(years).fill(0);
  const govtContribution = new Array(years).fill(0);
  const mtcfLifetimeCumulative = new Array(years).fill(0);
  const ages = new Array(years).fill(0);
  const homeExemptStatus = new Array(years).fill("");

  let cumulativeRet = 0;
  let mtcfLifetime = 0;
  let currentRAD = radLumpSum;

  for (let y = 0; y < years; y++) {
    ages[y] = clientAge + y;

    if (y < entryYearIdx) {
      radBalance[y] = 0;
      homeExemptStatus[y] = "N/A";
      continue;
    }

    const yearsInCare = y - entryYearIdx;
    const inflator = Math.pow(1 + INFLATION, yearsInCare);

    // Home exemption status
    if (partnerInHome) {
      homeExemptStatus[y] = "Exempt (partner in home)";
    } else if (yearsInCare < 2) {
      homeExemptStatus[y] = "Exempt (2-year rule)";
    } else {
      homeExemptStatus[y] = "Assessable (capped)";
    }

    // RAD retention: 2% pa of RAD balance, max 5 years
    let yearRetention = 0;
    if (radLumpSum > 0 && yearsInCare < MAX_RETENTION_YEARS) {
      yearRetention = Math.round(currentRAD * RETENTION_RATE);
      cumulativeRet += yearRetention;
    }
    retentionDeducted[y] = yearRetention;
    cumulativeRetention[y] = cumulativeRet;

    // RAD balance
    currentRAD = radLumpSum - cumulativeRet;
    radBalance[y] = Math.max(0, currentRAD);

    // Fees (inflated)
    basicDailyFee[y] = Math.round(BASIC_DAILY_FEE_ANNUAL * inflator);

    // MTCF with lifetime cap
    const mtcfThisYear = Math.round(mtcfAnnual * inflator);
    const mtcfCapped = Math.min(mtcfThisYear, Math.max(0, AC_MEANS.lifetimeMTCFCap - mtcfLifetime));
    meansTested[y] = mtcfCapped;
    mtcfLifetime += mtcfCapped;
    mtcfLifetimeCumulative[y] = mtcfLifetime;

    // DAP
    dapPayments[y] = Math.round(dapAnnual * inflator);

    // Additional + personal
    additionalServices[y] = Math.round(ADDITIONAL_SERVICES * inflator);

    // Total resident expenses (cashflow)
    totalExpenses[y] = basicDailyFee[y] + meansTested[y] + dapPayments[y] + additionalServices[y];

    // Government accommodation supplement (supported residents only)
    govtContribution[y] = govtAccomSupplementEligible ? Math.round(ACCOM_SUPPLEMENT_ANNUAL * inflator) : 0;
  }

  // Estate RAD refund
  const estateRefund = radBalance.map((v, i) => i >= entryYearIdx ? v : 0);

  return {
    clientKey: ck,
    clientName,
    partnerName,
    hasPartner,
    entryYear,
    entryYearIdx,
    entryAge,
    rad,
    radPct,
    radLumpSum,
    dapPortion,
    dapAnnual,
    paymentMethod,
    accommodationStatus,
    ages,
    // Legislated rates
    MPIR,
    BASIC_DAILY_FEE,
    BASIC_DAILY_FEE_ANNUAL,
    MEANS_TESTED_FEE_CAP_ANNUAL: AC_MEANS.annualMTCFCap,
    MEANS_TESTED_FEE_LIFETIME_CAP: AC_MEANS.lifetimeMTCFCap,
    ADDITIONAL_SERVICES,
    // Means assessment detail
    meansAssessment: {
      entryAssets,
      entryIncome,
      incomeFreeArea,
      incomeAboveThreshold,
      incomeTestedAnnual,
      incomeTestedDaily,
      totalAssets,
      assetTestedAnnual,
      assetTestedDaily,
      mtaDaily,
      mtaAnnual,
      masaDaily: MASA_DAILY,
      mtcfDaily,
      mtcfAnnual,
      thresholds: AC_MEANS,
      homeValue,
      isHomeowner,
      homeRetained,
      partnerInHome,
      HOME_CAP,
    },
    // Government
    ACCOM_SUPPLEMENT_DAILY,
    ACCOM_SUPPLEMENT_ANNUAL,
    govtAccomSupplementEligible,
    // Year-by-year data
    radBalance,
    basicDailyFee,
    meansTested,
    dapPayments,
    additionalServices,
    totalExpenses,
    retentionDeducted,
    cumulativeRetention,
    govtContribution,
    mtcfLifetimeCumulative,
    estateRefund,
    homeExemptStatus,
    // Pension impact
    radIsAssessableAsset: true,
    radIsDeemedIncome: false,
  };
};
