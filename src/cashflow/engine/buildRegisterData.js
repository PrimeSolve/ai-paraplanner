// ═══════════════════════════════════════════════════════════════
// Product Register Engines — Super, Pension, Annuity, DB
// All functions receive ctx = { engineData, N_YEARS, PROJ_YEARS, currentFY, isAdviceModel, c1Short, c2Short, ageAtFYStart }
// ═══════════════════════════════════════════════════════════════
import { toShortYears } from "../utils/projectionHelpers.js";

// ── Build pension strategy overrides (strategy 180 lump sums, strategy 23 drawdown) ──
export const buildPensionStrategyData = (ctx) => {
  const { engineData, N_YEARS, currentFY, isAdviceModel } = ctx;

  // Strategy 180: lump sum withdrawals from pension
  const stratPensionLumpSum = (() => {
    if (!isAdviceModel) return [];
    const numP = (engineData.pensions || []).length;
    const arr = Array.from({ length: numP }, () =>
      Array.from({ length: N_YEARS }, () => ({ SOY: null, EOY: null }))
    );
    const strategies = engineData.advice_request?.strategy?.strategies || [];
    strategies.forEach(s => {
      if (s.strategy_id !== "180") return;
      const amt = parseFloat(s.amount) || 0;
      if (amt <= 0) return;
      const cKey = s.owner_id;
      const pensionMatch = s.product_id?.match(/^pension_(\d+)$/);
      const pIdx = pensionMatch ? parseInt(pensionMatch[1]) : (engineData.pensions || []).findIndex(p => p.owner === cKey);
      if (pIdx < 0 || pIdx >= numP) return;
      const sy = Math.max(0, (parseInt(s.start_year) || currentFY) - currentFY);
      const ey = s.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY) - currentFY);
      const slot = (s.timing || "SOY") === "EOY" ? "EOY" : "SOY";
      for (let y = sy; y <= ey; y++) arr[pIdx][y][slot] = { withdrawAmt: amt };
    });
    return arr;
  })();

  // Strategy 23: adjust pension drawdown
  const pensionStratOverrides = (() => {
    if (!isAdviceModel) return {};
    const overrides = {};
    const strategies = engineData.advice_request?.strategy?.strategies || [];
    strategies.forEach(s => {
      if (s.strategy_id !== "23") return;
      const amt = parseFloat(s.amount) || 0;
      if (amt <= 0) return;
      const cKey = s.owner_id;
      const pensionMatchOvr = s.product_id?.match(/^pension_(\d+)$/);
      const pIdx = pensionMatchOvr ? parseInt(pensionMatchOvr[1]) : (engineData.pensions || []).findIndex(p => p.owner === cKey);
      if (pIdx < 0) return;
      const sy = (parseInt(s.start_year) || currentFY) - currentFY;
      const ey = (!s.end_year || s.end_year === "Ongoing") ? N_YEARS - 1 : Math.min(N_YEARS - 1, Math.max(0, (parseInt(s.end_year) || currentFY) - currentFY));
      overrides[pIdx] = { startY: Math.max(0, sy), endY: ey, amount: amt, amtType: s.amount_type || "dollar" };
    });
    return overrides;
  })();

  return { stratPensionLumpSum, pensionStratOverrides };
};

// ═══════════════════════════════════════════════════════════════
// Super Register
// ═══════════════════════════════════════════════════════════════
export const buildSuperRegisterData = (ctx, fundIndex, superProj) => {
  const { engineData, N_YEARS, PROJ_YEARS, c1Short, c2Short, ageAtFYStart } = ctx;
  const shortYears = toShortYears(PROJ_YEARS);
  const sf = (engineData.superProducts || [])[fundIndex];
  if (!sf) return null;

  const proj = superProj?.[fundIndex];
  if (!proj) return null;

  const LOW_RATE_CAP = 235000;
  const clientKey = sf.owner;
  const clientGross = parseFloat(engineData.income?.[clientKey]?.i_gross) || 0;
  const clientInc = parseFloat(engineData.income?.[clientKey]?.i_increase) || 0;
  const entity = sf.owner === "client1" ? c1Short : c2Short;

  // Project ages — use same DOB source as timeline
  const clientDob = sf.owner === "client1" ? engineData.client1?.date_of_birth : engineData.client2?.date_of_birth;
  const startAge = ageAtFYStart(clientDob) ?? (sf.owner === "client1" ? 60 : 56);

  return {
    years: shortYears,
    fundName: `${sf.fund_name} — ${sf.product}`,
    entity,
    memberNumber: sf.member_number || "",
    sections: [
      { id: "super-header", rows: [
        { label: "Year", values: shortYears.map((_, i) => i + 1), style: "header" },
        { label: "Age", values: shortYears.map((_, i) => startAge + i), style: "header" },
        { label: "Growth Rate", values: new Array(N_YEARS).fill("7.00%"), style: "child" },
      ]},
      { id: "super-lrt", title: "Low Rate Threshold", rows: (() => {
        const lrtUsed = parseFloat(engineData.tax_super_planning?.[sf.owner]?.low_rate_used) || 0;
        const lrtCap = LOW_RATE_CAP;
        // Per year: show N/A if age >= 60, otherwise show running values
        const lrtCapRow = shortYears.map((_, i) => {
          const age = startAge + i;
          return age >= 60 ? "N/A" : lrtCap;
        });
        const lrtUsedRow = shortYears.map((_, i) => {
          const age = startAge + i;
          if (age >= 60) return "N/A";
          // Accumulate: initial used + consumed in prior years
          let totalUsed = lrtUsed;
          for (let j = 0; j <= i; j++) totalUsed += (proj.lrtConsumedVals?.[j] || 0);
          return Math.min(totalUsed, lrtCap);
        });
        const lrtRemainingRow = shortYears.map((_, i) => {
          const age = startAge + i;
          if (age >= 60) return "N/A";
          let totalUsed = lrtUsed;
          for (let j = 0; j <= i; j++) totalUsed += (proj.lrtConsumedVals?.[j] || 0);
          return Math.max(0, lrtCap - totalUsed);
        });
        return [
          { label: "LRT Cap", values: lrtCapRow, style: "child" },
          { label: "LRT Used", values: lrtUsedRow, style: "child-negative" },
          { label: "LRT Remaining", values: lrtRemainingRow, style: "child" },
        ];
      })() },
      { id: "super-opening", rows: [
        { label: "Opening Balance", values: proj.openVals, style: "current-value" },
      ]},
      ...(() => {
        const hasLumpNccEOY    = proj.lumpNccEOYVals?.some(v => v > 0);
        const hasLumpSpouseEOY = proj.lumpSpouseEOYVals?.some(v => v > 0);
        const hasLumpPersonEOY = proj.lumpPersonalDeductibleEOYVals?.some(v => v > 0);
        const hasWithdrawEOY   = proj.recontrWithdrawEOYVals?.some(v => v < 0);
        const hasAnyEoyTxn = hasLumpNccEOY || hasLumpSpouseEOY || hasLumpPersonEOY || hasWithdrawEOY;
        const hasRollout   = proj.rollOutVals?.some(v => v < 0);
        const hasRollin    = proj.rollInVals?.some(v => v > 0);
        const hasWithdraw  = proj.recontrWithdrawVals?.some(v => v < 0);
        const hasTax       = proj.recontrTaxVals?.some(v => v < 0);
        const hasSelf      = proj.recontrSelfVals?.some(v => v > 0);
        const hasToPartner = proj.recontrToPartnerVals?.some(v => v < 0);
        const hasFromPartner = proj.recontrFromPartnerVals?.some(v => v > 0);
        if (!hasRollout && !hasRollin && !hasWithdraw && !hasSelf && !hasToPartner && !hasFromPartner) return [];
        const hasLumpNccSOY    = proj.lumpNccSOYVals?.some(v => v > 0);
        const hasLumpSpouseSOY = proj.lumpSpouseSOYVals?.some(v => v > 0);
        const hasLumpPersonSOY = proj.lumpPersonalDeductibleSOYVals?.some(v => v > 0);
        const hasAnySoyTxn = hasRollout || hasRollin || hasWithdraw || hasSelf || hasToPartner || hasFromPartner || hasLumpNccSOY || hasLumpSpouseSOY || hasLumpPersonSOY;
        return [
          ...(hasAnySoyTxn ? [{ id: "super-transactions", title: "Transactions (SOY)", rows: [
            ...(hasRollout ? (proj.rollOutDetails?.length > 0
              ? proj.rollOutDetails.map(d => ({ label: `Roll-out — ${d.label}`, values: d.vals.map(v => v > 0 ? -v : 0), style: "child-negative", source: { label: d.label, nav: d.nav } }))
              : [{ label: "Roll-out", values: proj.rollOutVals, style: "child-negative" }]) : []),
            ...(hasRollin ? (proj.rollInDetails?.length > 0
              ? proj.rollInDetails.map(d => ({ label: `Roll-in — ${d.label}`, values: d.vals, style: "child", source: { label: d.label, nav: d.nav } }))
              : [{ label: "Roll-in", values: proj.rollInVals, style: "child" }]) : []),
            ...(hasLumpNccSOY    ? [{ label: "NCC (Lump Sum)",                  values: proj.lumpNccSOYVals,                     style: "child" }] : []),
            ...(hasLumpSpouseSOY ? [{ label: "Spouse Contribution",             values: proj.lumpSpouseSOYVals,                  style: "child" }] : []),
            ...(hasLumpPersonSOY ? [{ label: "Personal Deductible Contribution", values: proj.lumpPersonalDeductibleSOYVals,     style: "child" }] : []),
            ...(hasWithdraw      ? [{ label: "Lump Sum Withdrawal",             values: proj.recontrWithdrawVals,                style: "child-negative" }] : []),
            ...(hasTax           ? [{ label: "Withdrawal Tax",                  values: proj.recontrTaxVals,                     style: "child-negative" }] : []),
            ...(hasSelf          ? [{ label: "Re-contribution (to self)",       values: proj.recontrSelfVals,                    style: "child" }] : []),
            ...(hasToPartner     ? [{ label: "Re-contribution (to partner)",    values: proj.recontrToPartnerVals,               style: "child-negative" }] : []),
            ...(hasFromPartner   ? [{ label: "Re-contribution (from partner)",  values: proj.recontrFromPartnerVals,             style: "child" }] : []),
          ]}] : []),
          { id: "super-revised", rows: [
            { label: "Revised Balance", values: proj.transactedVals, style: "highlight" },
          ]},
        ];
      })(),
      { id: "super-contributions", title: "Contributions", rows: [
        { label: "Employer SG", values: proj.sgVals, style: "child" },
        ...(proj.ssVals.some(v => v > 0) ? [{ label: "Salary Sacrifice", values: proj.ssVals, style: "child",
          indexToggle: { fundIndex, field: "salary_sacrifice_indexed", active: sf.contributions?.salary_sacrifice_indexed === true } }] : []),
        ...(proj.atVals.some(v => v > 0) ? [{ label: "After-Tax (NCC)", values: proj.atVals, style: "child",
          indexToggle: { fundIndex, field: "after_tax_indexed", active: sf.contributions?.after_tax_indexed === true } }] : []),
        ...(proj.spouseVals.some(v => v > 0) ? [{ label: "Spouse Contribution", values: proj.spouseVals, style: "child",
          indexToggle: { fundIndex, field: "spouse_received_indexed", active: sf.contributions?.spouse_received_indexed === true } }] : []),
        ...(proj.cgtCapVals.some(v => v > 0) ? [{ label: "CGT Cap Contribution (SB Concession)", values: proj.cgtCapVals, style: "child" }] : []),
        ...(proj.inSpecieVals.some(v => v > 0) ? [{ label: "In-Specie Transfer (NCC)", values: proj.inSpecieVals, style: "child" }] : []),
        ...(proj.splitInVals.some(v => v > 0) ? [{ label: "Contribution Split (In)", values: proj.splitInVals, style: "child" }] : []),
        ...(proj.splitOutVals.some(v => v < 0) ? [{ label: "Contribution Split (Out)", values: proj.splitOutVals, style: "child-negative" }] : []),
        { label: "Total Contributions", values: proj.totalContribVals, style: "total" },
      ]},
      { id: "super-contribtax", rows: [
        { label: "Contributions Tax (15%)", values: proj.contribTaxVals, style: "child-negative" },
      ]},
      { id: "super-fees", title: "Fees & Insurance", rows: [
        { label: "Admin / Platform Fees", values: proj.adminFeeVals, style: "child-negative" },
        ...(proj.insPremVals.some(v => v !== 0) ? [{ label: "Insurance Premiums", values: proj.insPremVals, style: "child-negative" }] : []),
        { label: "Total Fees & Insurance", values: proj.totalFeeVals, style: "total" },
      ]},
      { id: "super-growth", rows: [
        { label: "Investment Returns", values: proj.growthVals, style: "child" },
      ]},
      ...(() => {
        const _hasLumpNccEOY    = proj.lumpNccEOYVals?.some(v => v > 0);
        const _hasLumpSpouseEOY = proj.lumpSpouseEOYVals?.some(v => v > 0);
        const _hasLumpPersonEOY = proj.lumpPersonalDeductibleEOYVals?.some(v => v > 0);
        const _hasWithdrawEOY   = proj.recontrWithdrawEOYVals?.some(v => v < 0);
        if (!_hasLumpNccEOY && !_hasLumpSpouseEOY && !_hasLumpPersonEOY && !_hasWithdrawEOY) return [];
        return [{ id: "super-eoy-transactions", title: "Transactions (EOY)", rows: [
          ...(_hasLumpNccEOY    ? [{ label: "NCC (Lump Sum)",                   values: proj.lumpNccEOYVals,                    style: "child" }] : []),
          ...(_hasLumpSpouseEOY ? [{ label: "Spouse Contribution",              values: proj.lumpSpouseEOYVals,                  style: "child" }] : []),
          ...(_hasLumpPersonEOY ? [{ label: "Personal Deductible Contribution", values: proj.lumpPersonalDeductibleEOYVals,     style: "child" }] : []),
          ...(_hasWithdrawEOY   ? [{ label: "Lump Sum Withdrawal",              values: proj.recontrWithdrawEOYVals,             style: "child-negative" }] : []),
        ]}];
      })(),
      { id: "super-closing", rows: [
        { label: "Closing Balance", values: proj.closingVals, style: "end-value" },
      ]},
      { id: "super-tax-components", title: "Tax Components", rows: [
        // ── SOY: Opening + Transactions → Revised ──
        { label: "Tax-Free (Opening)",               values: proj.tfOpenVals,                  style: "current-value" },
        ...(() => {
          const hasRollout   = proj.tfRollOutVals?.some(v => v < 0);
          const hasRollin    = proj.tfRollInVals?.some(v => v > 0);
          const hasWithdraw  = proj.tfWithdrawSOYVals?.some(v => v < 0);
          const hasSelf      = proj.tfRecontrSelfSOYVals?.some(v => v > 0);
          const hasToPartner = proj.tfRecontrToPartnerSOYVals?.some(v => v < 0);
          const hasFromPartner = proj.tfRecontrFromPartnerSOYVals?.some(v => v > 0);
          if (!hasRollout && !hasRollin && !hasWithdraw && !hasSelf && !hasToPartner && !hasFromPartner) return [];
          return [
            ...(hasRollout     ? [{ label: "  Roll-out (TF)",                    values: proj.tfRollOutVals,               style: "child-negative" }] : []),
            ...(hasRollin      ? [{ label: "  Roll-in (TF)",                     values: proj.tfRollInVals,                style: "child" }] : []),
            ...(hasWithdraw    ? [{ label: "  Lump Sum Withdrawal (TF)",          values: proj.tfWithdrawSOYVals,           style: "child-negative" }] : []),
            ...(hasSelf        ? [{ label: "  Re-contribution to Self",           values: proj.tfRecontrSelfSOYVals,        style: "child" }] : []),
            ...(hasToPartner   ? [{ label: "  Re-contribution to Partner (TF)",   values: proj.tfRecontrToPartnerSOYVals,   style: "child-negative" }] : []),
            ...(hasFromPartner ? [{ label: "  Re-contribution from Partner",      values: proj.tfRecontrFromPartnerSOYVals, style: "child" }] : []),
            { label: "Tax-Free (Revised)",             values: proj.tfRevisedVals,               style: "highlight" },
          ];
        })(),
        // ── EOY: Contributions + Recontribs → Closing ──
        ...(proj.tfNccVals?.some(v => v > 0) ? [{ label: "  Non-Concessional Contributions",    values: proj.tfNccVals,                   style: "child" }] : []),
        ...(proj.tfSplitOutVals?.some(v => v < 0) ? [{ label: "  Contribution Split-out (TF)", values: proj.tfSplitOutVals,              style: "child-negative" }] : []),
        ...(proj.tfWithdrawEOYVals?.some(v => v < 0) ? [{ label: "  Lump Sum Withdrawal EOY (TF)", values: proj.tfWithdrawEOYVals,        style: "child-negative" }] : []),
        ...(proj.tfRecontrSelfEOYVals?.some(v => v > 0) ? [{ label: "  Re-contribution to Self EOY",   values: proj.tfRecontrSelfEOYVals,  style: "child" }] : []),
        ...(proj.tfRecontrToPartnerEOYVals?.some(v => v < 0) ? [{ label: "  Re-contribution to Partner EOY (TF)", values: proj.tfRecontrToPartnerEOYVals, style: "child-negative" }] : []),
        ...(proj.tfRecontrFromPartnerEOYVals?.some(v => v > 0) ? [{ label: "  Re-contribution from Partner EOY", values: proj.tfRecontrFromPartnerEOYVals, style: "child" }] : []),
        { label: "Tax-Free (Closing)",                values: proj.tfClosingVals,               style: "end-value" },
        { label: "Tax-Free %",                        values: proj.taxFreePctVals,              style: "child" },
      ]},
    ],
  };
};

// ═══════════════════════════════════════════════════════════════
// Pension Register
// ═══════════════════════════════════════════════════════════════
export const buildPensionRegisterData = (ctx, pensionIndex, rollInArr = null, rollOutArr = null, rollInDetails = [], rollOutDetails = [], stratPensionLumpSum = [], pensionStratOverrides = {}) => {
  const { engineData, N_YEARS, PROJ_YEARS, currentFY, isAdviceModel, c1Short, c2Short, ageAtFYStart } = ctx;
  const shortYears = toShortYears(PROJ_YEARS);
  const pf = (engineData.pensions || [])[pensionIndex];
  if (!pf) return null;

  const entity = pf.owner === "client1" ? c1Short : c2Short;
  const clientDob = pf.owner === "client1" ? engineData.client1?.date_of_birth : engineData.client2?.date_of_birth;
  const startAge = ageAtFYStart(clientDob) ?? (pf.owner === "client1" ? 60 : 56);

  const bal = parseFloat(pf.balance) || 0;
  const drawdownRate = (parseFloat(pf.drawdown_rate) || 5) / 100;
  const drawdownType = pf.drawdown_type || "percentage";
  const drawdownFixed = parseFloat(pf.drawdown_amount) || 0;
  const adminFee = parseFloat(pf.fees?.admin_fee) || 0;
  const pctFee = (parseFloat(pf.fees?.percent_fee) || 0) / 100;
  const pensionType = pf.pension_type || "account-based";
  const pensionGrowthRate = 0.07;

  // TTR → ABP auto-conversion: compute preservation met per year
  const isTTR = pensionType === "ttr";
  const clientKey_prd = pf.owner || "client1";
  const clientData_prd = engineData[clientKey_prd] || {};
  const alreadyRetired_prd = clientData_prd.employment_status === "7";
  const corMet_prd = clientData_prd.condition_of_release === true || clientData_prd.condition_of_release === "yes";
  const retAge_prd = parseFloat(engineData.advice_reason?.quick?.[clientKey_prd]?.ret_age) || 67;
  const presAge_prd = (() => {
    if (!clientDob) return 60;
    const d = new Date(clientDob); const y = d.getFullYear(), m = d.getMonth() + 1;
    if (y < 1960 || (y === 1960 && m <= 6)) return 55;
    if (y < 1961) return 56; if (y < 1963) return 57; if (y < 1964) return 58;
    if (y < 1965) return 59; return 60;
  })();
  // presMet(age): preservation conditions fully met — TTR converts to ABP
  const presMet_prd = (age) => age >= presAge_prd && (alreadyRetired_prd || corMet_prd || age >= 67 || age >= retAge_prd);
  // effectivePensionType(age): "ttr" until presMet, then "account-based"
  const effectivePensionType = (age) => (isTTR && !presMet_prd(age)) ? "ttr" : (isTTR ? "account-based" : pensionType);

  // TTR earnings taxed at 15%; ABP/TAP tax-free — now year-aware
  const earningsTaxRate = pensionType === "ttr" ? 0.15 : 0; // fallback; overridden per-year below

  // ABP/TTR minimum drawdown rates by age (ATO Schedule 7)
  const abpMinRate = (age) => {
    if (age < 65) return 0.04;
    if (age < 75) return 0.05;
    if (age < 80) return 0.06;
    if (age < 85) return 0.07;
    if (age < 90) return 0.09;
    if (age < 95) return 0.11;
    return 0.14;
  };

  // TAP payment factors (SIS Schedule 6)
  const TAP_FACTORS = [
    0,1.00,1.98,2.94,3.88,4.80,5.70,6.58,7.44,8.28,9.10,  // terms 0-10
    9.90,10.68,11.44,12.18,12.90,13.60,14.28,14.94,15.58,16.20, // 11-20
    16.80,17.38,17.94,18.48,19.00,19.50,19.98,20.44,20.88,21.30, // 21-30
    21.70,22.08,22.44,22.78,23.10,23.40,23.68,23.94,24.18,24.40, // 31-40
    24.60,24.78,24.94,25.08,25.20,25.30,25.38,25.44,25.48,25.50,25.50, // 41-50
  ];
  const tapRemainingTerm = parseInt(pf.tap_remaining_term) || 20;
  let tapTerm = tapRemainingTerm;
  const tapPostSep2007 = true; // Assume post-2007 for ABP floor

  // ABP/TTR max rate — TTR capped at 10% until presMet, then uncapped
  const abpMaxRate = (age) => {
    if (effectivePensionType(age) === "ttr") return 0.10;
    return 1.00;
  };

  const openVals = [], drawdownVals = [], feeVals = [], growthVals = [], closingVals = [];
  const minDrawdownVals = [], maxDrawdownVals = [];
  const rollOutVals = [], rollInVals = [], revisedVals = [];
  const lumpSumSOYVals = [], lumpSumEOYVals = []; // strategy 180 lump sum withdrawals
  const ttrConversionTBC = new Array(N_YEARS).fill(0); // TBC credit on TTR→ABP conversion
  let running = bal;

  for (let y = 0; y < N_YEARS; y++) {
    const age = startAge + y;
    const openBal = Math.round(running);
    openVals.push(openBal);

    // ── Rollovers (after opening, before drawdown) ──
    const yearRollOut = rollOutArr?.[y] || 0;
    const yearRollIn = rollInArr?.[y] || 0;
    rollOutVals.push(yearRollOut > 0 ? -yearRollOut : 0);
    rollInVals.push(yearRollIn);
    running = openBal - yearRollOut + yearRollIn;
    const revisedBal = Math.round(running);
    revisedVals.push(revisedBal);

    // Strategy 180: SOY lump sum withdrawal (before drawdown)
    const ls180SOY = stratPensionLumpSum?.[pensionIndex]?.[y]?.SOY;
    const ls180SOYAmt = ls180SOY ? Math.min(ls180SOY.withdrawAmt, Math.max(0, running)) : 0;
    if (ls180SOYAmt > 0) { running -= ls180SOYAmt; }
    lumpSumSOYVals.push(ls180SOYAmt > 0 ? -ls180SOYAmt : 0);

    if (revisedBal <= 0) {
      drawdownVals.push(0); feeVals.push(0); growthVals.push(0); closingVals.push(0);
      lumpSumEOYVals.push(0);
      minDrawdownVals.push("0%"); maxDrawdownVals.push("0%");
      running = 0;
      continue;
    }

    let minDrawdown, maxDrawdown, minLabel, maxLabel;

    if (pensionType === "tap") {
      // TAP: payment = balance / factor, ±10% band
      const factor = tapTerm > 0 && tapTerm < TAP_FACTORS.length ? TAP_FACTORS[tapTerm] : 1;
      const calcPayment = Math.round(revisedBal / factor);
      const tapMin = Math.round(calcPayment * 0.9);
      const tapMax = Math.round(calcPayment * 1.1);

      // Post-Sep 2007: ABP minimum as floor
      const abpFloor = tapPostSep2007 ? Math.round(revisedBal * abpMinRate(age)) : 0;
      minDrawdown = Math.max(tapMin, abpFloor);
      maxDrawdown = tapMax;

      const tapMinPct = revisedBal > 0 ? (minDrawdown / revisedBal * 100).toFixed(1) : "0.0";
      const tapMaxPct = revisedBal > 0 ? (maxDrawdown / revisedBal * 100).toFixed(1) : "0.0";
      minLabel = tapMinPct + "%";
      maxLabel = tapMaxPct + "%";
      tapTerm = Math.max(0, tapTerm - 1);
    } else {
      // ABP or TTR
      const minRate = abpMinRate(age);
      const maxRate = abpMaxRate(age);
      minDrawdown = Math.round(revisedBal * minRate);
      maxDrawdown = Math.round(revisedBal * maxRate);
      minLabel = (minRate * 100).toFixed(0) + "%";
      const effTypeLbl = effectivePensionType(age);
      maxLabel = effTypeLbl === "ttr" ? "10%" : "100%";
    }

    // Drawdown: clamp between min and max
    // Strategy override: use strategy amount if within active window
    const stratOvr = pensionStratOverrides[pensionIndex];
    const useStratDrawdown = stratOvr && y >= stratOvr.startY && y <= stratOvr.endY;
    let effectiveDrawdownFixed = drawdownFixed;
    let effectiveDrawdownType = drawdownType;
    if (useStratDrawdown) {
      if (stratOvr.amtType === "percentage") {
        effectiveDrawdownFixed = Math.round(running * (stratOvr.amount / 100));
        effectiveDrawdownType = "dollar";
      } else {
        effectiveDrawdownFixed = stratOvr.amount;
        effectiveDrawdownType = "dollar";
      }
    }
    let drawdown;
    if (effectiveDrawdownType === "dollar") {
      drawdown = Math.max(minDrawdown, Math.min(maxDrawdown, effectiveDrawdownFixed));
    } else {
      drawdown = Math.max(minDrawdown, Math.min(maxDrawdown, Math.round(revisedBal * drawdownRate)));
    }
    drawdown = Math.min(drawdown, revisedBal);
    drawdownVals.push(-drawdown);
    minDrawdownVals.push(minLabel);
    maxDrawdownVals.push(maxLabel);

    // Fees
    const fees = Math.round(adminFee + (revisedBal * pctFee));
    feeVals.push(-fees);

    // Growth (TTR: taxed at 15% on earnings; ABP/TAP: tax-free) — year-aware for TTR→ABP conversion
    const effType = effectivePensionType(age);
    const effEarningsTax = effType === "ttr" ? 0.15 : 0;
    const avgBal = revisedBal - drawdown / 2 - fees / 2;
    const grossGrowth = Math.round(Math.max(0, avgBal) * pensionGrowthRate);
    const growth = Math.round(grossGrowth * (1 - effEarningsTax));
    growthVals.push(growth);

    running = revisedBal - drawdown - fees + growth;

    // TTR→ABP conversion: in the first year presMet fires, record balance as TBC credit
    if (isTTR && presMet_prd(age) && !presMet_prd(age - 1)) {
      ttrConversionTBC[y] = Math.round(revisedBal); // balance at start of conversion year
    }

    // Strategy 180: EOY lump sum withdrawal (last thing before closing)
    const ls180EOY = stratPensionLumpSum?.[pensionIndex]?.[y]?.EOY;
    const ls180EOYAmt = ls180EOY ? Math.min(ls180EOY.withdrawAmt, Math.max(0, running)) : 0;
    if (ls180EOYAmt > 0) { running -= ls180EOYAmt; }
    lumpSumEOYVals.push(ls180EOYAmt > 0 ? -ls180EOYAmt : 0);
    if (running < 0) running = 0;
    closingVals.push(Math.round(running));
  }

  // Tax components: fixed % at commencement
  const taxFreePct = parseFloat(pf.tax_components?.tax_free_pct) || 0;
  const taxFreePctDecimal = taxFreePct / 100;

  // Age-aware tax treatment:
  // Age 60+: ENTIRE drawdown is tax-free (both components) — not assessable
  // Under 60: tax-free component is tax-free, taxable component is assessable with 15% offset
  const assessableVals = [], taxOffsetVals = [];
  const taxFreeDrawdownVals = [], taxableDrawdownVals = [];

  for (let y = 0; y < N_YEARS; y++) {
    const age = startAge + y;
    const grossDrawdown = Math.abs(drawdownVals[y] || 0);

    if (age >= 60) {
      // Entire payment is tax-free — nothing assessable
      taxFreeDrawdownVals.push(grossDrawdown);
      taxableDrawdownVals.push(0);
      assessableVals.push(0);
      taxOffsetVals.push(0);
    } else {
      // Split by commencement proportion
      const tfDraw = Math.round(grossDrawdown * taxFreePctDecimal);
      const txDraw = grossDrawdown - tfDraw;
      taxFreeDrawdownVals.push(tfDraw);
      taxableDrawdownVals.push(txDraw);
      // Taxable component is assessable income
      assessableVals.push(txDraw);
      // 15% tax offset on the taxable component
      taxOffsetVals.push(Math.round(txDraw * 0.15));
    }
  }

  const pensionTypeLabel = pensionType === "ttr" ? "Transition to Retirement" : pensionType === "tap" ? "Term Allocated Pension" : pensionType === "lifetime" ? "Lifetime Pension" : "Account Based Pension";

  return {
    years: shortYears,
    fundName: `${pf.fund_name} — ${pf.product}`,
    entity,
    memberNumber: pf.member_number || "",
    pensionTypeLabel,
    ttrConversionTBC,
    isTTR,
    owner: pf.owner,
    sections: [
      { id: "pen-header", rows: [
        { label: "Year", values: shortYears.map((_, i) => i + 1), style: "header" },
        { label: "Age", values: shortYears.map((_, i) => startAge + i), style: "header" },
        { label: "Growth Rate", values: Array.from({length: N_YEARS}, (_, y) => { const age = startAge + y; const et = effectivePensionType(age) === "ttr" ? 0.15 : 0; return et > 0 ? (pensionGrowthRate * (1 - et) * 100).toFixed(2) + "%" : "7.00%"; }), style: "child" },
        { label: "Min Drawdown Rate", values: minDrawdownVals, style: "child" },
        { label: "Max Drawdown Rate", values: maxDrawdownVals, style: "child" },
        ...(isTTR ? [{ label: "Phase", values: Array.from({length: N_YEARS}, (_, y) => effectivePensionType(startAge + y) === "ttr" ? "TTR" : "ABP ✓"), style: "child" }] : []),
      ]},
      { id: "pen-opening", rows: [
        { label: "Opening Balance", values: openVals, style: "current-value" },
      ]},
      ...(rollOutVals.some(v => v < 0) || rollInVals.some(v => v > 0) ? [{ id: "pen-rollovers", title: "Roll-ins / Roll-outs", rows: [
        ...(rollOutVals.some(v => v < 0) ? (rollOutDetails?.length > 0
          ? rollOutDetails.map(d => ({ label: `Roll-Out — ${d.label}`, values: d.vals.map(v => v > 0 ? -v : 0), style: "child-negative", source: { label: d.label, nav: d.nav } }))
          : [{ label: "Roll-Out", values: rollOutVals, style: "child-negative" }]) : []),
        ...(rollInVals.some(v => v > 0) ? (rollInDetails?.length > 0
          ? rollInDetails.map(d => ({ label: `Roll-In — ${d.label}`, values: d.vals, style: "child", source: { label: d.label, nav: d.nav } }))
          : [{ label: "Roll-In", values: rollInVals, style: "child" }]) : []),
        { label: "Revised Balance", values: revisedVals, style: "highlight" },
      ]}] : []),
      ...(lumpSumSOYVals.some(v => v < 0) ? [{ id: "pen-lumpsum-soy", title: "Transactions (SOY)", rows: [
        { label: "Lump Sum Withdrawal", values: lumpSumSOYVals, style: "child-negative" },
      ]}] : []),
      { id: "pen-drawdowns", title: "Drawdowns", rows: [
        { label: "Pension Payment", values: drawdownVals, style: "child-negative" },
      ]},
      { id: "pen-fees", title: "Fees", rows: [
        { label: "Total Fees", values: feeVals, style: "child-negative" },
      ]},
      { id: "pen-growth", rows: [
        { label: "Investment Returns", values: growthVals, style: "child" },
      ]},
      ...(lumpSumEOYVals.some(v => v < 0) ? [{ id: "pen-lumpsum-eoy", title: "Transactions (EOY)", rows: [
        { label: "Lump Sum Withdrawal", values: lumpSumEOYVals, style: "child-negative" },
      ]}] : []),
      { id: "pen-closing", rows: [
        { label: "Closing Balance", values: closingVals, style: "end-value" },
      ]},
      { id: "pen-tax-components", title: "Tax Components", rows: [
        { label: "Tax-Free % (at commencement)", values: Array.from({length: N_YEARS}, (_, y) => openVals[y] > 0 || revisedVals[y] > 0 ? taxFreePct.toFixed(1) + "%" : "—"), style: "child" },
        { label: "Taxable Drawdown", values: taxableDrawdownVals, style: "child" },
        { label: "Tax-Free Drawdown", values: taxFreeDrawdownVals, style: "child" },
      ]},
    ],
    // Expose for tax schedule
    assessableVals,
    taxOffsetVals,
  };
};

// ═══════════════════════════════════════════════════════════════
// Annuity Register
// ═══════════════════════════════════════════════════════════════
export const buildAnnuityRegisterData = (ctx, annuityIndex) => {
  const { engineData, N_YEARS, PROJ_YEARS, currentFY, isAdviceModel, c1Short, c2Short, ageAtFYStart } = ctx;
  const shortYears = toShortYears(PROJ_YEARS);
  const annuities = engineData.annuities || [];
  const an = annuities[annuityIndex];
  if (!an) return null;

  const entity = an.owner === "client1" ? c1Short : c2Short;
  const clientDob = an.owner === "client1" ? engineData.client1?.date_of_birth : engineData.client2?.date_of_birth;
  const startAge = ageAtFYStart(clientDob) ?? (an.owner === "client1" ? 60 : 56);

  const purchasePrice = parseFloat(an.purchase_price) || 0;
  const annualIncome = parseFloat(an.income?.annual_income) || 0;
  const deductibleAmt = parseFloat(an.income?.deductible_amount) || 0;
  const taxFreePct = (parseFloat(an.tax_components?.tax_free_pct) || 0) / 100;
  const isSuper = an.tax_environment === "super";
  const isLifetime = an.annuity_type === "lifetime";
  const isFixedTerm = an.annuity_type === "fixed-term";
  const rcv = parseFloat(an.residual_capital_value) || 0;
  const cpiIndexed = an.cpi_indexed !== false;
  const cpiRate = 0.025;
  const commDate = an.commencement_date ? new Date(an.commencement_date) : null;
  const matDate = an.maturity_date ? new Date(an.maturity_date) : null;
  const termYears = matDate && commDate ? Math.round((matDate - commDate) / (365.25 * 86400000)) : 0;
  const yearsElapsed = commDate ? Math.round((new Date(currentFY, 6, 1) - commDate) / (365.25 * 86400000)) : 0;
  const remainingTerm = isFixedTerm ? Math.max(0, termYears - yearsElapsed) : 99;

  // Centrelink assessment rates
  const incomeTestPct = (parseFloat(an.centrelink?.income_test_assessment) || 100) / 100;
  const assetTestPct = (parseFloat(an.centrelink?.asset_test_assessment) || 100) / 100;

  // Strategy 82 — check if this annuity is being redeemed
  const strat82 = isAdviceModel
    ? (engineData.advice_request?.strategy?.strategies || []).find(s => s.strategy_id === "82" && s.product_id === `annuity_${annuityIndex}`)
    : null;
  const redeemFYYear = strat82 ? parseInt(strat82.start_year) : null;
  const redeemYearIdx = redeemFYYear ? Math.max(0, redeemFYYear - currentFY) : -1;
  const isPartialRedeem = strat82?.redemption_type === "partial";
  const partialRedeemPct = isPartialRedeem ? (parseFloat(strat82.partial_pct) || 100) / 100 : 1;
  const exitCostPct = strat82 ? (parseFloat(strat82.exit_cost_pct) || 0) / 100 : 0;
  const redemptionBase = Math.round(purchasePrice * partialRedeemPct);
  const exitCostAmt = Math.round(redemptionBase * exitCostPct);
  const netProceeds = redemptionBase - exitCostAmt;
  const redemptionVals = new Array(N_YEARS).fill(0);
  if (strat82 && redeemYearIdx >= 0 && redeemYearIdx < N_YEARS) redemptionVals[redeemYearIdx] = netProceeds;

  const incomeVals = [], deductibleVals = [], assessableVals = [], taxOffsetVals = [];
  const assetTestVals = [], incomeTestVals = [];
  const yearLabels = [], ageLabels = [];

  for (let y = 0; y < N_YEARS; y++) {
    const age = startAge + y;
    yearLabels.push(y + 1);
    ageLabels.push(age);

    // Fully redeemed — zero everything from redemption year
    if (strat82 && !isPartialRedeem && redeemYearIdx >= 0 && y >= redeemYearIdx) {
      incomeVals.push(0); deductibleVals.push(0); assessableVals.push(0);
      taxOffsetVals.push(0); assetTestVals.push(0); incomeTestVals.push(0);
      continue;
    }

    // Income — CPI indexed or flat
    const yrsFromNow = y;
    const remainingAtYear = remainingTerm - y;
    if (isFixedTerm && remainingAtYear <= 0) {
      // Term expired — no more income
      incomeVals.push(0); deductibleVals.push(0); assessableVals.push(0);
      taxOffsetVals.push(0); assetTestVals.push(rcv > 0 && remainingAtYear === 0 ? rcv : 0);
      incomeTestVals.push(0);
      continue;
    }

    const baseIncome = cpiIndexed ? Math.round(annualIncome * Math.pow(1 + cpiRate, yrsFromNow)) : annualIncome;
    // Partial redemption — reduce income from redemption year
    const income = (isPartialRedeem && redeemYearIdx >= 0 && y >= redeemYearIdx)
      ? Math.round(baseIncome * (1 - partialRedeemPct))
      : baseIncome;
    incomeVals.push(income);

    // Deductible amount (purchase price / life expectancy or (purchase-RCV)/term)
    const deductible = Math.round(deductibleAmt);
    deductibleVals.push(deductible);

    // Net assessable = income - deductible (but not below zero)
    const netAssessable = Math.max(0, income - deductible);

    // Tax treatment by age and super/non-super
    if (isSuper && age >= 60) {
      // Super annuity, 60+: entirely tax-free
      assessableVals.push(0);
      taxOffsetVals.push(0);
    } else if (isSuper && age < 60) {
      // Super annuity, under 60: taxable component less deductible is assessable, 15% offset
      const taxableIncome = Math.round(income * (1 - taxFreePct));
      const assessable = Math.max(0, taxableIncome - deductible);
      assessableVals.push(assessable);
      taxOffsetVals.push(Math.round(assessable * 0.15));
    } else {
      // Non-super annuity: income less deductible is always assessable (no 15% offset)
      assessableVals.push(netAssessable);
      taxOffsetVals.push(0);
    }

    // Centrelink assessment
    // Asset test: purchase price × assessment rate (lifetime may reduce at certain ages)
    const assetAssessRate = isLifetime && age >= 84 ? assetTestPct * 0.5 : assetTestPct;
    assetTestVals.push(Math.round(purchasePrice * assetAssessRate));
    // Income test: (income - deductible) × assessment rate
    incomeTestVals.push(Math.round(Math.max(0, income - deductible) * incomeTestPct));
  }

  const typeLabel = isLifetime ? "Lifetime" : isFixedTerm ? "Fixed Term" : an.annuity_type || "Standard";
  const envLabel = isSuper ? "Super" : "Non-Super";

  return {
    years: shortYears,
    productName: an.product,
    entity,
    typeLabel,
    envLabel,
    sections: [
      { id: "an-header", rows: [
        { label: "Year", values: yearLabels, style: "header" },
        { label: "Age", values: ageLabels, style: "header" },
        { label: "Annuity Type", values: new Array(N_YEARS).fill(typeLabel), style: "child" },
        { label: "Tax Environment", values: new Array(N_YEARS).fill(envLabel), style: "child" },
        ...(isFixedTerm ? [{ label: "Remaining Term", values: Array.from({ length: N_YEARS }, (_, y) => Math.max(0, remainingTerm - y)), style: "child" }] : []),
      ]},
      { id: "an-income", title: "Income", rows: [
        ...(strat82 ? [{ label: isPartialRedeem ? `Partial Redemption (${partialRedeemPct*100}%) — Net Proceeds` : "Redemption — Net Proceeds", values: redemptionVals, style: "child" },
          { label: "Exit Cost", values: new Array(N_YEARS).fill(0).map((_, y) => y === redeemYearIdx ? -exitCostAmt : 0), style: "child-negative" }] : []),
        { label: "Annuity Income", values: incomeVals, style: "child" },
        { label: "Deductible Amount", values: deductibleVals, style: "child-negative" },
        { label: "Net Assessable", values: assessableVals, style: "subtotal" },
      ]},
      { id: "an-tax", title: "Tax", rows: [
        { label: "Assessable Income", values: assessableVals, style: "child" },
        ...(taxOffsetVals.some(v => v > 0) ? [{ label: "15% Tax Offset", values: taxOffsetVals, style: "child" }] : []),
      ]},
      { id: "an-centrelink", title: "Centrelink", rows: [
        { label: "Asset Test Value", values: assetTestVals, style: "child" },
        { label: "Income Test Value", values: incomeTestVals, style: "child" },
      ]},
    ],
    // Expose for tax schedule
    assessableVals,
    taxOffsetVals,
    incomeVals,
    purchasePrice,
  };
};

// ═══════════════════════════════════════════════════════════════
// Defined Benefit Register
// ═══════════════════════════════════════════════════════════════
export const buildDBRegisterData = (ctx, dbIndex) => {
  const { engineData, N_YEARS, PROJ_YEARS, c1Short, c2Short, ageAtFYStart } = ctx;
  const shortYears = toShortYears(PROJ_YEARS);
  const dbs = engineData.definedBenefits || [];
  const db = dbs[dbIndex];
  if (!db) return null;

  const N = N_YEARS;
  const scheme = db.scheme || "";
  const isPSS = scheme === "pss";
  const isCSS = scheme === "css";
  const isOther = scheme === "other";
  const status = db.status || "contributing";
  const currentSalary = parseFloat(db.super_salary) || 0;
  const salaryGrowth = (parseFloat(db.salary_growth) || 3) / 100;
  const contribRate = (parseFloat(db.contribution_rate) || 5) / 100;
  const exitAge = parseFloat(db.expected_exit_age) || 65;
  const clientDob = db.owner === "client1" ? engineData.client1?.date_of_birth : engineData.client2?.date_of_birth;
  const startAge = ageAtFYStart(clientDob) ?? (db.owner === "client1" ? 60 : 56);
  const cpi = parseFloat(engineData.assumptions?.a_cpi) / 100 || 0.025;
  const exitYearIdx = Math.max(0, Math.round(exitAge - startAge));
  const benefitPref = db.benefit_preference || "pension";
  const lumpPct = benefitPref === "combination" ? Math.min(100, parseFloat(db.combination_lump_pct) || 0) / 100 : benefitPref === "lump_sum" ? 1 : 0;
  const pensionPct = 1 - lumpPct;

  // Year-by-year arrays
  const ageVals = [];
  const salaryVals = [];
  const abmVals = [];
  const benefitVals = [];
  const pensionIncomeVals = [];
  const lumpSumVals = [];
  const cumulativePensionVals = [];
  const statusVals = [];

  // PSS
  const currentABM = parseFloat(db.current_abm) || 0;
  const tenYearMet = db.ten_year_rule_met === "yes";
  const abmAccrual = isPSS ? (tenYearMet ? 0.11 + (2 * contribRate) : 0.11 + (2 * Math.min(contribRate, 0.05))) : 0;

  // CSS
  const cssYearsService = parseFloat(db.years_service) || 0;

  let runningABM = currentABM;
  let runningPension = 0;
  let cumulativePension = 0;
  let hasExited = false;
  let exitBenefit = 0;
  let exitLump = 0;
  let exitPensionAnnual = 0;

  // If already receiving pension
  const existingPension = parseFloat(db.current_pension_annual) || 0;
  const pensionIsIndexed = db.pension_indexed !== "no";

  for (let y = 0; y < N; y++) {
    const age = startAge + y;
    ageVals.push(age);

    if (status === "pension") {
      // Already receiving pension — just index it
      const pension = Math.round(existingPension * Math.pow(1 + (pensionIsIndexed ? cpi : 0), y));
      salaryVals.push(0);
      abmVals.push("—");
      benefitVals.push(0);
      pensionIncomeVals.push(pension);
      lumpSumVals.push(0);
      cumulativePension += pension;
      cumulativePensionVals.push(cumulativePension);
      statusVals.push("Receiving");
      continue;
    }

    if (status === "preserved" && !hasExited) {
      // Preserved — waiting to claim
      const preservedBen = parseFloat(db.preserved_benefit) || 0;
      if (y < exitYearIdx) {
        // Employer component grows at CPI, member/productivity at fund rate (~5%)
        const growthApprox = preservedBen * Math.pow(1 + 0.04, y);
        salaryVals.push(0);
        abmVals.push("—");
        benefitVals.push(Math.round(growthApprox));
        pensionIncomeVals.push(0);
        lumpSumVals.push(0);
        cumulativePensionVals.push(cumulativePension);
        statusVals.push("Preserved");
        continue;
      }
    }

    if (!hasExited && y >= exitYearIdx && status !== "pension") {
      // EXIT YEAR — calculate benefit
      hasExited = true;
      const projSalary = currentSalary * Math.pow(1 + salaryGrowth, y);

      if (isPSS) {
        runningABM = currentABM + (abmAccrual * Math.min(y, exitYearIdx));
        const fas = projSalary; // simplified — last 3 yr average approximated by exit salary
        exitBenefit = Math.round(fas * runningABM);
        const mbl = fas >= 50000 ? fas * 10 : 500000;
        exitBenefit = Math.min(exitBenefit, mbl);
        const pcf = age <= 55 ? 12 : age <= 60 ? 12 - ((age - 55) * 0.2) : age <= 65 ? 11 - ((age - 60) * 0.2) : 10;
        exitLump = Math.round(exitBenefit * lumpPct);
        exitPensionAnnual = pcf > 0 ? Math.round((exitBenefit * pensionPct) / pcf) : 0;
      } else if (isCSS) {
        const projYearsService = cssYearsService + y;
        const cssPct = Math.min(0.525, (projYearsService / 40) * 0.525) * (age >= 65 ? 1 : age >= 60 ? 0.95 : age >= 55 ? 0.85 : 0.75);
        exitPensionAnnual = Math.round(projSalary * cssPct);
        exitBenefit = Math.round(exitPensionAnnual * 11); // approximate lump equiv
        exitLump = Math.round(exitBenefit * lumpPct);
        if (lumpPct > 0) exitPensionAnnual = Math.round(exitPensionAnnual * pensionPct);
      } else {
        // Other DB
        exitPensionAnnual = Math.round(parseFloat(db.estimated_annual_pension) || 0);
        exitBenefit = exitPensionAnnual * 11;
        exitLump = Math.round(exitBenefit * lumpPct);
        if (lumpPct > 0) exitPensionAnnual = Math.round(exitPensionAnnual * pensionPct);
      }
      runningPension = exitPensionAnnual;

      salaryVals.push(Math.round(projSalary));
      abmVals.push(isPSS ? runningABM.toFixed(2) : "—");
      benefitVals.push(exitBenefit);
      pensionIncomeVals.push(runningPension);
      lumpSumVals.push(exitLump);
      cumulativePension += runningPension;
      cumulativePensionVals.push(cumulativePension);
      statusVals.push("Exit");
      continue;
    }

    if (hasExited) {
      // Post-exit: pension indexed by CPI
      const yearsPostExit = y - exitYearIdx;
      const indexedPension = Math.round(exitPensionAnnual * Math.pow(1 + cpi, yearsPostExit));
      salaryVals.push(0);
      abmVals.push("—");
      benefitVals.push(0);
      pensionIncomeVals.push(indexedPension);
      lumpSumVals.push(0);
      cumulativePension += indexedPension;
      cumulativePensionVals.push(cumulativePension);
      statusVals.push("Receiving");
      continue;
    }

    // Contributing — pre-exit
    const projSalary = currentSalary * Math.pow(1 + salaryGrowth, y);
    if (isPSS) {
      runningABM = currentABM + (abmAccrual * y);
      const fas = projSalary;
      const benefit = Math.round(fas * runningABM);
      salaryVals.push(Math.round(projSalary));
      abmVals.push(runningABM.toFixed(2));
      benefitVals.push(benefit);
    } else if (isCSS) {
      const projYears = cssYearsService + y;
      const cssPct = Math.min(0.525, (projYears / 40) * 0.525) * (age >= 65 ? 1 : age >= 60 ? 0.95 : age >= 55 ? 0.85 : 0.75);
      salaryVals.push(Math.round(projSalary));
      abmVals.push("—");
      benefitVals.push(Math.round(projSalary * cssPct * 11));
    } else {
      salaryVals.push(Math.round(projSalary));
      abmVals.push("—");
      benefitVals.push(0);
    }
    pensionIncomeVals.push(0);
    lumpSumVals.push(0);
    cumulativePensionVals.push(cumulativePension);
    statusVals.push("Contributing");
  }

  const schemeName = isPSS ? "PSS" : isCSS ? "CSS" : (db.other_scheme_name || "Defined Benefit");
  const ownerName = db.owner === "client1" ? c1Short : c2Short;

  const sections = [
    { id: "db-overview", title: `${schemeName} — Overview`, rows: [
      { label: "Age", values: ageVals, style: "header-age" },
      { label: "Status", values: statusVals, style: "child" },
      ...(salaryVals.some(v => v > 0) ? [{ label: "Super Salary", values: salaryVals, style: "child" }] : []),
      ...(isPSS && abmVals.some(v => v !== "—") ? [{ label: "Accrued Benefit Multiple", values: abmVals, style: "child" }] : []),
      ...(benefitVals.some(v => v > 0) ? [{ label: "Projected Total Benefit", values: benefitVals, style: "highlight" }] : []),
    ]},
    { id: "db-income", title: "Benefit Payments", rows: [
      { label: "Age", values: ageVals, style: "header-age" },
      ...(lumpSumVals.some(v => v > 0) ? [{ label: "Lump Sum (at exit)", values: lumpSumVals, style: "child" }] : []),
      { label: "Annual Pension Income", values: pensionIncomeVals, style: "highlight" },
      { label: "Cumulative Pension Received", values: cumulativePensionVals, style: "end-value" },
    ]},
  ];

  return {
    years: shortYears,
    sections,
    entity: ownerName,
    schemeName,
    pensionIncomeVals,
    lumpSumVals,
    exitYearIdx,
  };
};
