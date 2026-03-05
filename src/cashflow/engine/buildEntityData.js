// ═══════════════════════════════════════════════════════════════
// Entity Projection Engines — Trust, Company, Bond, SMSF
// All functions receive ctx = { engineData, N_YEARS, isAdviceModel, currentFY, PROJ_YEARS, shortYears, ffAssets }
// ═══════════════════════════════════════════════════════════════
import { toShortYears } from "../utils/projectionHelpers.js";

export const buildTrustData = (ctx, trustIdx) => {
    const trust = (ctx.engineData.trusts || [])[trustIdx];
    if (!trust) return null;
    const N = ctx.N_YEARS;
    const { newDebtDrawdowns = {}, adviceDebts = [] } = ctx;
    const trustId = `trust_${trustIdx}`;
    const trustAssets = (ctx.engineData.assets || []).filter(a => a.a_owner === trustId);
    const trustDebts = (ctx.engineData.liabilities || []).filter(d => d.d_owner === trustId);
    const aa = ctx.engineData.assetAssumptions || {};

    const propAssets = trustAssets.filter(a => a.a_type === "18" || a.a_type === "21");
    const otherAssets = trustAssets.filter(a => a.a_type !== "18" && a.a_type !== "21");
    const propValues = new Array(N).fill(0);
    const otherValues = new Array(N).fill(0);
    const rentalIncVals = new Array(N).fill(0);
    const investIncVals = new Array(N).fill(0);
    const frankingVals = new Array(N).fill(0);

    propAssets.forEach(a => {
      let val = parseFloat(a.a_value) || 0;
      const weeklyRent = parseFloat(a.a_rental_income) || 0;
      const rentFreq = parseFloat(a.a_rental_freq) || 52;
      let annualRent = weeklyRent * rentFreq;
      const gr = (aa["18"]?.growthRate ?? 3) / 100;
      const iy = (aa["18"]?.incomeYield ?? 4.36) / 100;
      for (let y = 0; y < N; y++) {
        propValues[y] += Math.round(val);
        rentalIncVals[y] += annualRent > 0 ? Math.round(annualRent) : Math.round(val * iy);
        val *= (1 + gr);
        if (annualRent > 0) annualRent *= (1 + gr);
      }
    });
    otherAssets.forEach(a => {
      let val = parseFloat(a.a_value) || 0;
      const typeDef = aa[a.a_type] || {};
      const gr = (typeDef.growthRate ?? 5) / 100;
      const iy = (typeDef.incomeYield ?? 0) / 100;
      const fc = (typeDef.frankingPct ?? typeDef.frankingCredit ?? 0) / 100;
      for (let y = 0; y < N; y++) {
        otherValues[y] += Math.round(val);
        const inc = Math.round(val * iy);
        investIncVals[y] += inc;
        const frankedAmt = Math.round(inc * fc);
        frankingVals[y] += Math.round(frankedAmt * 0.30 / 0.70);
        val *= (1 + gr);
      }
    });
    const totalAssets = propValues.map((p, y) => p + otherValues[y]);

    const debtBalances = new Array(N).fill(0);
    const debtRepayVals = new Array(N).fill(0);
    const deductibleIntVals = new Array(N).fill(0);
    trustDebts.forEach(d => {
      let bal = parseFloat(d.d_balance) || 0;
      const rate = (parseFloat(d.d_rate) || 0) / 100;
      const freq = parseFloat(d.d_freq) || 12;
      const isIO = d.d_io === "1";
      const statedRepay = parseFloat(d.d_repayments) || 0;
      const termYears = parseFloat(d.d_term) || 30;
      const periodicRate = rate / freq;
      const totalPeriods = termYears * freq;
      let minRepay = 0;
      if (!isIO && bal > 0 && periodicRate > 0 && totalPeriods > 0) minRepay = bal * periodicRate / (1 - Math.pow(1 + periodicRate, -totalPeriods));
      const annualRepay = isIO ? Math.round(bal * rate) : Math.round(Math.max(statedRepay, minRepay) * freq);
      for (let y = 0; y < N; y++) {
        if (bal <= 0) continue;
        const interest = Math.round(bal * rate);
        deductibleIntVals[y] += interest;
        const principal = isIO ? 0 : Math.min(bal, annualRepay - interest);
        debtRepayVals[y] += annualRepay;
        bal = Math.max(0, bal - principal);
        debtBalances[y] += -Math.round(bal);
      }
    });

    const totalIncome = rentalIncVals.map((r, y) => r + investIncVals[y]);
    const taxableIncome = totalIncome.map((inc, y) => Math.max(0, inc - deductibleIntVals[y]));
    const beneficiaries = trust.beneficiaries || [];
    const _tdoCfg = (ctx.engineData.advice_request?.trust_dist_override || {})[trustId];
    const _tdoAllocs = (_tdoCfg && _tdoCfg.allocations) ? _tdoCfg.allocations : [];
    const distRows = beneficiaries.map((b, bi) => {
      const defaultPct = (parseFloat(b.benef_entitlement) || 0) / 100;
      const oa = _tdoAllocs[bi];
      const usePct = (_tdoAllocs.length > 0 && oa) ? (parseFloat(oa.defaultPct) || 0) / 100 : defaultPct;
      const ovs = (oa && oa.overrides) ? oa.overrides : {};
      const vals = taxableIncome.map((ti, y) => {
        if (ovs[y] !== undefined && ovs[y] !== "") return Math.round(parseFloat(ovs[y]) || 0);
        return Math.round(ti * usePct);
      });
      return { label: b.benef_entity || "Unknown", values: vals, style: "child", entity: b.benef_entity };
    });
    const netWorth = totalAssets.map((a, y) => a + debtBalances[y]);

    const zeros = new Array(N).fill(0);

    // Sell proceeds for this trust — split by timing
    const trustSellSOY = new Array(N).fill(0);
    const trustSellEOY = new Array(N).fill(0);
    const currentFYTrust = new Date().getFullYear();
    if (ctx.isAdviceModel) {
      (ctx.engineData.advice_request?.transactions?.sell || []).forEach(s => {
        if (s.entity_type !== "3" || s.owner_id !== trustId) return;
        const assetIdx = parseInt(s.asset_idx);
        const asset = !isNaN(assetIdx) ? ctx.ffAssets[assetIdx] : null;
        if (!asset) return;
        const sellYear = parseInt(s.sell_year) || currentFYTrust;
        const yIdx = sellYear - currentFYTrust;
        if (yIdx < 0 || yIdx >= N) return;
        const currentVal = parseFloat(asset.a_value) || 0;
        const sellAmt = s.sell_entire_amount ? currentVal : Math.min(parseFloat(s.amount) || 0, currentVal);
        const txnCostPct = (parseFloat(s.transaction_costs_pct) || 0) / 100;
        const proceeds = Math.round(sellAmt * (1 - txnCostPct));
        if (s.sell_timing === "end") trustSellEOY[yIdx] += proceeds; else trustSellSOY[yIdx] += proceeds;
      });
    }
    const trustSellProceeds = trustSellSOY.map((v, y) => v + trustSellEOY[y]);

    // ═══ TRUST STRATEGY FLOWS ═══
    const trustCashInjectionVals = new Array(N).fill(0);   // 51: inflow
    const trustDistPayoutVals = new Array(N).fill(0);      // 195: outflow (% of income paid as cash)
    const trustDrawingsVals = new Array(N).fill(0);        // 196: outflow (fixed amount drawings)

    if (ctx.isAdviceModel) {
      const strats = ctx.engineData.strategies || [];

      // Strategy 51: Cash injection to trust
      strats.filter(s => s.strategy_id === "51" && String(s.trust_idx) === String(trustIdx)).forEach(s => {
        const amt = parseFloat(s.amount) || 0;
        const startY = (parseInt(s.start_year) || currentFYTrust) - currentFYTrust;
        const endYRaw = parseInt(s.end_year);
        const endY = endYRaw ? (endYRaw - currentFYTrust) : (startY + 1); // default one-off
        for (let y = startY; y < N && y < endY; y++) {
          if (y >= 0) trustCashInjectionVals[y] += Math.round(amt);
        }
      });

      // Strategy 195: Trust distribution payout rate
      const strat195 = strats.find(s => s.strategy_id === "195" && String(s.trust_idx) === String(trustIdx));
      if (strat195) {
        const payoutPct = (parseFloat(strat195.payout_pct) || 0) / 100;
        const startY = (parseInt(strat195.start_year) || currentFYTrust) - currentFYTrust;
        const endYRaw = parseInt(strat195.end_year);
        const endY = endYRaw ? (endYRaw - currentFYTrust) : N;
        for (let y = 0; y < N; y++) {
          if (y >= startY && y < endY) {
            trustDistPayoutVals[y] = Math.round(Math.max(0, totalIncome[y]) * payoutPct);
          }
        }
      }

      // Strategy 196: Take drawings from trust
      strats.filter(s => s.strategy_id === "196" && String(s.trust_idx) === String(trustIdx)).forEach(s => {
        const amt = parseFloat(s.amount) || 0;
        const gr = (parseFloat(s.growth_rate) || 0) / 100;
        const startY = (parseInt(s.start_year) || currentFYTrust) - currentFYTrust;
        const endYRaw = parseInt(s.end_year);
        const endY = endYRaw ? (endYRaw - currentFYTrust) : N;
        let v = amt;
        for (let y = 0; y < N; y++) {
          if (y >= startY && y < endY) trustDrawingsVals[y] += Math.round(v);
          if (y >= startY) v *= (1 + gr);
        }
      });
    }

    // ═══ CASHFLOW CALCULATIONS ═══
    const totalExpenseVals = debtRepayVals.map((dr, y) => dr + deductibleIntVals[y]);
    const surplusCalc = totalIncome.map((inc, y) => inc + trustCashInjectionVals[y] - totalExpenseVals[y] - trustDistPayoutVals[y] - trustDrawingsVals[y]);
    const endValueInitial = new Array(N).fill(0);
    for (let y = 0; y < N; y++) {
      endValueInitial[y] = (y === 0 ? 0 : endValueInitial[y - 1]) + surplusCalc[y];
    }

    // ═══ STRATEGY 198: WIND UP TRUST ═══
    const windUpStrat = ctx.isAdviceModel ? (ctx.engineData.strategies || []).find(s => s.strategy_id === "198" && String(s.trust_idx) === String(trustIdx)) : null;
    const windUpYear = windUpStrat ? (parseInt(windUpStrat.windup_year) || (currentFYTrust + 1)) : null;
    const windUpYIdx = windUpYear ? (windUpYear - currentFYTrust) : -1;
    const hasWindUp = windUpStrat && windUpYIdx >= 0 && windUpYIdx < N;

    const windUpAssetRealisation = new Array(N).fill(0);
    const windUpLiabSettlement = new Array(N).fill(0);
    const windUpCostsArr = new Array(N).fill(0);
    const windUpNetDistributable = new Array(N).fill(0);
    const windUpBeneficiaryDist = [];

    if (hasWindUp) {
      // Asset realisation at wind-up year — use projected values
      let totalRealised = 0;
      const trustAllAssets = (ctx.engineData.assets || []).filter(a => a.a_owner === trustId);
      const aa2 = ctx.engineData.assetAssumptions || {};
      trustAllAssets.forEach(a => {
        let val = parseFloat(a.a_value) || 0;
        const typeDef = aa2[a.a_type] || {};
        const gr = (typeDef.growthRate ?? 5) / 100;
        for (let y = 0; y < windUpYIdx; y++) val *= (1 + gr);
        totalRealised += Math.round(val);
      });
      windUpAssetRealisation[windUpYIdx] = totalRealised;

      // Settle liabilities
      let totalLiab = 0;
      trustDebts.forEach(d => { totalLiab += Math.abs(parseFloat(d.d_balance) || 0); });
      windUpLiabSettlement[windUpYIdx] = -totalLiab;

      // Wind-up costs
      const wuCost = parseFloat(windUpStrat.windup_costs) || 2000;
      windUpCostsArr[windUpYIdx] = wuCost;

      // Net distributable = assets + accumulated cash - liabilities - costs
      const accumulated = windUpYIdx > 0 ? endValueInitial[windUpYIdx - 1] : 0;
      const netDist = totalRealised - totalLiab - wuCost + accumulated + surplusCalc[windUpYIdx];
      windUpNetDistributable[windUpYIdx] = Math.max(0, netDist);

      // Distribute to beneficiaries
      const benefs = trust.beneficiaries || [];
      benefs.forEach(b => {
        const pct = (parseFloat(b.benef_entitlement) || 0) / 100;
        const vals = new Array(N).fill(0);
        vals[windUpYIdx] = Math.round(Math.max(0, netDist) * pct);
        windUpBeneficiaryDist.push({ name: b.benef_entity || "Unknown", pct, vals });
      });

      // Zero out everything from wind-up year onwards
      for (let y = windUpYIdx; y < N; y++) {
        surplusCalc[y] = 0;
        totalIncome[y] = 0;
        if (y > windUpYIdx) {
          endValueInitial[y] = 0;
          propValues[y] = 0;
          otherValues[y] = 0;
          totalAssets[y] = 0;
          debtBalances[y] = 0;
        }
      }
      endValueInitial[windUpYIdx] = 0;
    }

    const startingVals = new Array(N).fill(0);
    for (let y = 1; y < N; y++) { startingVals[y] = endValueInitial[y - 1]; }

    const data = { years: ctx.shortYears, sections: (() => {
    // New debt drawdowns for this trust
    const trustDebtDrawdown = new Array(N).fill(0);
    const trustDebtDrawdownAmt = newDebtDrawdowns[trustId] || 0;
    if (trustDebtDrawdownAmt > 0) trustDebtDrawdown[0] = trustDebtDrawdownAmt;
    const trustEstCosts = new Array(N).fill(0);
    adviceDebts.filter(d => d.d_owner === trustId).forEach(d => {
      const est = parseFloat(ctx.engineData.advice_request?.transactions?.debts?.find(t => t.owner_id === trustId)?.establishment_cost) || 0;
      if (est > 0) trustEstCosts[0] += est;
    });

    return [
      { id: "trust-header", rows: [{ label: "Year", values: ctx.shortYears.map((_, i) => i + 1), style: "header" }] },
      { id: "trust-divider-1", isDivider: true },
      // ══ CASHFLOW STATEMENT ══
      { id: "trust-cashflow-header", isSectionHeader: true, title: "Cashflow Statement", subtitle: "Cash movements and operating performance", icon: "💰", bg: "var(--ps-surface-green)", border: "var(--ps-ring-emerald)" },
      { id: "trust-divider-1b", isDivider: true },
      // ── Cashflow ──
      { id: "trust-cashflow", title: "Cashflow", rows: [
        { label: "Starting Value", values: startingVals, style: "current-value" },
      ]},
      { id: "trust-inflows", title: "Inflows", rows: [
        ...(trustCashInjectionVals.some(v => v > 0) ? [{ label: "Cash Injection (Strat 51)", values: trustCashInjectionVals, style: "child" }] : []),
        { label: "Contribution from Other Entities", values: zeros, style: "child" },
        ...(trustSellSOY.some(v => v > 0) ? [{ label: "Asset Sale Proceeds", values: trustSellSOY, style: "child" }] : []),
        ...(trustDebtDrawdown.some(v => v > 0) ? [{ label: "Debt Drawdown", values: trustDebtDrawdown, style: "child" }] : [{ label: "Debt Drawdown", values: zeros, style: "child" }]),
      ]},
      { id: "trust-outflows", title: "Outflows", rows: [
        ...(trustDistPayoutVals.some(v => v > 0) ? [{ label: "Distribution Paid to Beneficiaries", values: trustDistPayoutVals.map(v => -v), style: "child-negative" }] : []),
        ...(trustDrawingsVals.some(v => v > 0) ? [{ label: "Drawings Taken", values: trustDrawingsVals.map(v => -v), style: "child-negative" }] : []),
        { label: "Drawdown to Other Entities", values: zeros, style: "child-negative" },
        ...(trustEstCosts.some(v => v > 0) ? [{ label: "Establishment Costs", values: trustEstCosts.map(v => -v), style: "child-negative" }] : [{ label: "Establishment Costs", values: zeros, style: "child-negative" }]),
        { label: "Instant Debt Repayments", values: zeros, style: "child-negative" },
        { label: "Asset Purchases", values: zeros, style: "child-negative" },
      ]},
      { id: "trust-revised", rows: [
        { label: "Revised Value", values: startingVals.map((v, y) => v + trustSellSOY[y] + trustDebtDrawdown[y] - trustEstCosts[y]), style: "highlight" },
      ]},
      { id: "trust-divider-2", isDivider: true },
      // ── Income ──
      { id: "trust-income", title: "Income", rows: [
        ...(rentalIncVals.some(v => v > 0) ? [{ label: "Rental Income", values: rentalIncVals, style: "child" }] : []),
        ...(investIncVals.some(v => v > 0) ? [{ label: "Investment Income", values: investIncVals, style: "child" }] : []),
        { label: "Dividends", values: zeros, style: "child" },
        { label: "Total Income", values: totalIncome, style: "total" },
      ]},
      // ── Expenses ──
      { id: "trust-expenses", title: "Expenses", rows: [
        ...(debtRepayVals.some(v => v > 0) ? [{ label: "Debt Repayments", values: debtRepayVals.map(v => -v), style: "child-negative" }] : []),
        ...(deductibleIntVals.some(v => v > 0) ? [{ label: "Interest Expense", values: deductibleIntVals.map(v => -v), style: "child-negative" }] : []),
        { label: "Product Fees", values: zeros, style: "child-negative" },
        { label: "Wind Up Fee", values: zeros, style: "child-negative" },
        { label: "Total Expenses", values: totalExpenseVals.map(v => -v), style: "total" },
      ]},
      // ── Surplus ──
      { id: "trust-surplus", rows: [
        { label: "Surplus", values: surplusCalc, style: "highlight" },
      ]},
      { id: "trust-divider-3", isDivider: true },
      // ── End of Year Adjustments ──
      { id: "trust-end-values", title: "End of Year Adjustments", rows: [
        { label: "End Value (Initial)", values: endValueInitial, style: "subtotal" },
        ...(trustSellEOY.some(v => v > 0) ? [{ label: "Asset Sale Proceeds", values: trustSellEOY, style: "child" }] : []),
        { label: "Contribution from Other Entities", values: zeros, style: "child" },
        { label: "Asset Purchases", values: zeros, style: "child-negative" },
        { label: "Drawdown to Other Entities", values: zeros, style: "child-negative" },
        { label: "Savings Drawdown", values: zeros, style: "child-negative" },
        { label: "End Value", values: endValueInitial.map((v, y) => v + trustSellEOY[y]), style: "end-value" },
      ]},
      { id: "trust-divider-4", isDivider: true },
      // ══ TAX STATEMENT ══
      { id: "trust-tax-statement-header", isSectionHeader: true, title: "Tax Statement", subtitle: "Assessable income, deductions and distributions", icon: "🏛️", bg: "var(--ps-surface-indigo)", border: "var(--ps-ring-indigo)" },
      { id: "trust-divider-4b", isDivider: true },
      // ── Assessable Income ──
      { id: "trust-tax", title: "Assessable Income", rows: [
        ...(rentalIncVals.some(v => v > 0) ? [{ label: "Rental Income", values: rentalIncVals, style: "child" }] : []),
        ...(investIncVals.some(v => v > 0) ? [{ label: "Investment Income", values: investIncVals, style: "child" }] : []),
        { label: "Dividends", values: zeros, style: "child" },
        ...(frankingVals.some(v => v > 0) ? [{ label: "Franking Credits", values: frankingVals, style: "child" }] : []),
        { label: "Capital Gain", values: zeros, style: "child" },
        { label: "Total Income", values: totalIncome, style: "total" },
      ]},
      // ── Deductions ──
      { id: "trust-tax-deductions", title: "Deductions", rows: [
        ...(deductibleIntVals.some(v => v > 0) ? [{ label: "Deductible Interest", values: deductibleIntVals.map(v => -v), style: "child-negative" }] : []),
        { label: "Total Deductions", values: deductibleIntVals.map(v => -v), style: "total" },
      ]},
      { id: "trust-divider-5", isDivider: true },
      // ── Tax Summary ──
      { id: "trust-tax-summary", title: "Tax Summary", rows: [
        { label: "Existing Tax Losses", values: zeros, style: "child" },
        { label: "Net Income", values: taxableIncome, style: "subtotal" },
      ]},
      { id: "trust-divider-6", isDivider: true },
      // ── Trust Distribution ──
      { id: "trust-distribution", title: "Trust Distribution", rows: [
        ...distRows,
        { label: "Total Distributions", values: taxableIncome, style: "total" },
      ]},
      { id: "trust-divider-7", isDivider: true },
      // ── Net Worth ──
      { id: "trust-net-worth", title: "Net Worth", rows: [
        ...(propValues.some(v => v > 0) ? [{ label: "Property Value", values: propValues, style: "child" }] : []),
        ...(otherValues.some(v => v > 0) ? [{ label: "Other Assets", values: otherValues, style: "child" }] : []),
        { label: "Total Assets", values: totalAssets, style: "total" },
        ...(debtBalances.some(v => v < 0) ? [{ label: "Outstanding Debt", values: debtBalances, style: "child-negative" }] : []),
        { label: "Net Worth", values: netWorth, style: "highlight" },
      ]},
      // ── WIND-UP RECONCILIATION (only if strategy 198 active) ──
      ...(hasWindUp ? [
        { id: "trust-divider-windup", isDivider: true },
        { id: "trust-windup-header", isSectionHeader: true, title: "Trust Wind-Up Reconciliation", subtitle: `FY${windUpYear}`, icon: "🏁", bg: "var(--ps-surface-amber)", border: "var(--ps-ring-amber)" },
        { id: "trust-divider-windup2", isDivider: true },
        { id: "trust-windup-recon", title: "Wind-Up Reconciliation", rows: [
          { label: "Asset Realisation", values: windUpAssetRealisation, style: "child" },
          { label: "Less: Outstanding Liabilities", values: windUpLiabSettlement, style: "child-negative" },
          { label: "Less: Wind-Up Costs", values: windUpCostsArr.map(v => -v), style: "child-negative" },
          { label: "Net Distributable Amount", values: windUpNetDistributable, style: "highlight" },
        ]},
        { id: "trust-divider-windup3", isDivider: true },
        { id: "trust-windup-dist", title: "Beneficiary Distribution", rows: [
          ...windUpBeneficiaryDist.map(b => ({ label: `${b.name} (${Math.round(b.pct * 100)}%)`, values: b.vals, style: "child" })),
          { label: "Total Distributed", values: windUpNetDistributable, style: "total" },
        ]},
      ] : []),
    ]; })() };
    const chartData = ctx.shortYears.map((year, i) => ({
      year, distCath: distRows[0]?.values[i] || 0, distPaul: distRows[1]?.values[i] || 0,
      totalDist: distRows.reduce((s, r) => s + (r.values[i] || 0), 0),
      totalAssets: totalAssets[i], debt: Math.abs(debtBalances[i]), netWorth: netWorth[i],
      rentalIncome: rentalIncVals[i], debtRepay: debtRepayVals[i], taxableIncome: taxableIncome[i],
    }));
    return { data, chartData, name: trust.trust_name };
};

export const buildCompanyData = (ctx, companyIdx) => {
    const company = (ctx.engineData.companies || [])[companyIdx];
    if (!company) return null;
    const N = ctx.N_YEARS;
    const { newDebtDrawdowns = {}, adviceDebts = [] } = ctx;
    const companyTaxRate = (parseFloat(company.co_tax_rate) || 25) / 100;
    const companyId = `company_${companyIdx}`;
    const companyAssets = (ctx.engineData.assets || []).filter(a => a.a_owner === companyId);
    const companyDebts = (ctx.engineData.liabilities || []).filter(d => d.d_owner === companyId);
    const aa = ctx.engineData.assetAssumptions || {};

    const pnl2 = company.pnl || {};
    const incomeLines = pnl2.income_lines || [];
    const expenseLines = pnl2.expense_lines || [];

    // Project each income line individually (with start/end year gating)
    const currentFYCo = new Date().getFullYear();
    const incLineProjections = incomeLines.filter(l => parseFloat(l.amount) > 0).map(line => {
      const baseAmt = parseFloat(line.amount) || 0;
      const gr = (parseFloat(line.growth_rate) || 3) / 100;
      const startY = parseInt(line.start_year) || currentFYCo;
      const endY = parseInt(line.end_year) || (currentFYCo + N + 10); // blank = ongoing
      const vals = new Array(N).fill(0);
      let v = baseAmt;
      for (let y = 0; y < N; y++) {
        const fy = currentFYCo + y;
        if (fy >= startY && fy <= endY) vals[y] = Math.round(v);
        if (fy >= startY) v *= (1 + gr); // grow even before start so amount is correct at start
      }
      return { label: line.label, vals };
    });

    // Project each expense line individually (with start/end year gating)
    const expLineProjections = expenseLines.filter(l => parseFloat(l.amount) > 0).map(line => {
      const baseAmt = parseFloat(line.amount) || 0;
      const gr = (parseFloat(line.growth_rate) || 3) / 100;
      const startY = parseInt(line.start_year) || currentFYCo;
      const endY = parseInt(line.end_year) || (currentFYCo + N + 10);
      const vals = new Array(N).fill(0);
      let v = baseAmt;
      for (let y = 0; y < N; y++) {
        const fy = currentFYCo + y;
        if (fy >= startY && fy <= endY) vals[y] = Math.round(v);
        if (fy >= startY) v *= (1 + gr);
      }
      return { label: line.label, vals };
    });

    // Sum income and expense lines
    const totalIncFromLines = new Array(N).fill(0);
    incLineProjections.forEach(p => p.vals.forEach((v, y) => { totalIncFromLines[y] += v; }));
    const totalExpFromLines = new Array(N).fill(0);
    expLineProjections.forEach(p => p.vals.forEach((v, y) => { totalExpFromLines[y] += v; }));

    // Fallback: if no income lines populated, use total_revenue / co_profit
    const pnl2Rev = parseFloat(pnl2.total_revenue) || 0;
    const pnl2Exp = parseFloat(pnl2.total_expenses) || 0;
    const hasDetailedLines = totalIncFromLines.some(v => v > 0) || totalExpFromLines.some(v => v > 0);
    const baseProfit = hasDetailedLines ? (totalIncFromLines[0] - totalExpFromLines[0]) : (pnl2Rev > 0 ? (pnl2Rev - pnl2Exp) : (parseFloat(company.co_profit) || 0));
    const revGrowth2 = (parseFloat(pnl2.revenue_growth_rate) || 3) / 100;

    // profitVals: use line-item detail if available, otherwise grow baseProfit
    const profitVals = new Array(N).fill(0);
    if (hasDetailedLines) {
      for (let y = 0; y < N; y++) profitVals[y] = totalIncFromLines[y] - totalExpFromLines[y];
    } else {
      let prof = baseProfit;
      for (let y = 0; y < N; y++) { profitVals[y] = Math.round(prof); prof *= (1 + revGrowth2); }
    }

    const propAssets = companyAssets.filter(a => a.a_type === "18" || a.a_type === "21");
    const otherAssets = companyAssets.filter(a => a.a_type !== "18" && a.a_type !== "21");
    const propValues = new Array(N).fill(0);
    const otherValues = new Array(N).fill(0);
    const rentalIncVals = new Array(N).fill(0);

    propAssets.forEach(a => {
      let val = parseFloat(a.a_value) || 0;
      const weeklyRent = parseFloat(a.a_rental_income) || 0;
      const rentFreq = parseFloat(a.a_rental_freq) || 52;
      let annualRent = weeklyRent * rentFreq;
      const gr = (aa["18"]?.growthRate ?? 3) / 100;
      const iy = (aa["18"]?.incomeYield ?? 4.36) / 100;
      for (let y = 0; y < N; y++) {
        propValues[y] += Math.round(val);
        rentalIncVals[y] += annualRent > 0 ? Math.round(annualRent) : Math.round(val * iy);
        val *= (1 + gr);
        if (annualRent > 0) annualRent *= (1 + gr);
      }
    });
    otherAssets.forEach(a => {
      let val = parseFloat(a.a_value) || 0;
      const typeDef = aa[a.a_type] || {};
      const gr = (typeDef.growthRate ?? 5) / 100;
      for (let y = 0; y < N; y++) { otherValues[y] += Math.round(val); val *= (1 + gr); }
    });
    const totalAssets = propValues.map((p, y) => p + otherValues[y]);

    const debtBalances = new Array(N).fill(0);
    const debtRepayVals = new Array(N).fill(0);
    const deductibleIntVals = new Array(N).fill(0);
    companyDebts.forEach(d => {
      let bal = parseFloat(d.d_balance) || 0;
      const rate = (parseFloat(d.d_rate) || 0) / 100;
      const freq = parseFloat(d.d_freq) || 12;
      const isIO = d.d_io === "1";
      const statedRepay = parseFloat(d.d_repayments) || 0;
      const termYears = parseFloat(d.d_term) || 30;
      const periodicRate = rate / freq;
      const totalPeriods = termYears * freq;
      let minRepay = 0;
      if (!isIO && bal > 0 && periodicRate > 0 && totalPeriods > 0) minRepay = bal * periodicRate / (1 - Math.pow(1 + periodicRate, -totalPeriods));
      const annualRepay = isIO ? Math.round(bal * rate) : Math.round(Math.max(statedRepay, minRepay) * freq);
      for (let y = 0; y < N; y++) {
        if (bal <= 0) continue;
        const interest = Math.round(bal * rate);
        deductibleIntVals[y] += interest;
        const principal = isIO ? 0 : Math.min(bal, annualRepay - interest);
        debtRepayVals[y] += annualRepay;
        bal = Math.max(0, bal - principal);
        debtBalances[y] += -Math.round(bal);
      }
    });

    const totalRevenue = hasDetailedLines
      ? totalIncFromLines.map((v, y) => v + rentalIncVals[y])
      : profitVals.map((p, y) => p + rentalIncVals[y]);
    const totalDeductions = hasDetailedLines
      ? totalExpFromLines.map((v, y) => v + deductibleIntVals[y])
      : deductibleIntVals.map(v => v);
    const taxableIncome = totalRevenue.map((r, y) => Math.max(0, r - totalDeductions[y]));
    const taxPayable = taxableIncome.map(ti => Math.round(ti * companyTaxRate));
    const afterTaxProfit = taxableIncome.map((ti, y) => ti - taxPayable[y]);
    const shareholders = company.shareholders || [];
    const netWorth = totalAssets.map((a, y) => a + debtBalances[y]);

    // Zeros for placeholder rows (no data source yet for these)
    const zeros = new Array(N).fill(0);

    // Sell proceeds for this company — split by timing
    const companySellSOY = new Array(N).fill(0);
    const companySellEOY = new Array(N).fill(0);
    const currentFYComp = new Date().getFullYear();
    if (ctx.isAdviceModel) {
      (ctx.engineData.advice_request?.transactions?.sell || []).forEach(s => {
        if (s.entity_type !== "4" || s.owner_id !== companyId) return;
        const assetIdx = parseInt(s.asset_idx);
        const asset = !isNaN(assetIdx) ? ctx.ffAssets[assetIdx] : null;
        if (!asset) return;
        const sellYear = parseInt(s.sell_year) || currentFYComp;
        const yIdx = sellYear - currentFYComp;
        if (yIdx < 0 || yIdx >= N) return;
        const currentVal = parseFloat(asset.a_value) || 0;
        const sellAmt = s.sell_entire_amount ? currentVal : Math.min(parseFloat(s.amount) || 0, currentVal);
        const txnCostPct = (parseFloat(s.transaction_costs_pct) || 0) / 100;
        const proceeds = Math.round(sellAmt * (1 - txnCostPct));
        if (s.sell_timing === "end") companySellEOY[yIdx] += proceeds; else companySellSOY[yIdx] += proceeds;
      });
    }
    const companySellProceeds = companySellSOY.map((v, y) => v + companySellEOY[y]);

    // ═══ ENTITY MONEY FLOW STRATEGIES ═══
    const stratDividendVals = new Array(N).fill(0);        // 20: outflow (dividend paid)
    const stratDirectorFeeVals = new Array(N).fill(0);     // 191: outflow (fees + SG)
    const stratShareholderLoanInVals = new Array(N).fill(0); // 192: inflow (cash from shareholder)
    const stratDiv7ALoanOutVals = new Array(N).fill(0);    // 193: outflow (cash to shareholder)
    const stratCapitalInjectionVals = new Array(N).fill(0); // 194: inflow (share capital)
    const stratDiv7AInterestInVals = new Array(N).fill(0); // 193: interest income from Div 7A loan
    const stratShareholderIntOutVals = new Array(N).fill(0); // 192: interest expense on shareholder loan
    const stratDiv7ARepaymentVals = new Array(N).fill(0);  // 193: repayments received
    const stratSHLoanRepaymentVals = new Array(N).fill(0); // 192: repayments paid
    // Debt creation trackers
    const newDebtsFromStrategies = [];

    if (ctx.isAdviceModel) {
      const strats = ctx.engineData.strategies || [];
      const sgRate = 0.12; // 12% SG rate

      // Strategy 20: Distribute Dividend — now handled via dist_pct on divRows/totalDivPaid
      // (no separate stratDividendVals needed — the distribution rate modifies divRows directly)

      // Strategy 191: Pay Director Fees / Salary
      strats.filter(s => s.strategy_id === "191" && String(s.company_idx) === String(companyIdx)).forEach(s => {
        const amt = parseFloat(s.amount) || 0;
        const gr = (parseFloat(s.growth_rate) || 0) / 100;
        const startY = (parseInt(s.start_year) || currentFYCo) - currentFYCo;
        const endYRaw = parseInt(s.end_year);
        const endY = endYRaw ? (endYRaw - currentFYCo) : N;
        let v = amt;
        for (let y = 0; y < N; y++) {
          if (y >= startY && y < endY) {
            const fees = Math.round(v);
            const sg = Math.round(fees * sgRate);
            stratDirectorFeeVals[y] += fees + sg; // total cost to company
          }
          if (y >= startY) v *= (1 + gr);
        }
      });

      // Strategy 192: Shareholder Loan to Company
      strats.filter(s => s.strategy_id === "192" && String(s.company_idx) === String(companyIdx)).forEach(s => {
        const amt = parseFloat(s.amount) || 0;
        const rate = (parseFloat(s.interest_rate) || 0) / 100;
        const term = parseInt(s.loan_term) || 7;
        const startY = (parseInt(s.start_year) || currentFYCo) - currentFYCo;
        if (startY >= 0 && startY < N) {
          stratShareholderLoanInVals[startY] += Math.round(amt);
          // Create debt on company BS
          newDebtsFromStrategies.push({
            type: "66", label: `Shareholder loan from ${s.lender === "client1" ? (ctx.factFind.client1?.first_name || "Client 1") : (ctx.factFind.client2?.first_name || "Client 2")}`,
            amount: amt, rate, term, startYIdx: startY, direction: "in", stratId: "192", lender: s.lender,
          });
        }
        // Annual interest expense to company, repayments
        if (rate > 0 && amt > 0 && startY >= 0) {
          let balance = amt;
          const annualRepay = term > 0 ? amt / term : 0;
          for (let y = startY; y < N && balance > 0; y++) {
            const interest = Math.round(balance * rate);
            stratShareholderIntOutVals[y] += interest;
            const repay = Math.min(Math.round(annualRepay), Math.round(balance));
            stratSHLoanRepaymentVals[y] += repay;
            balance -= repay;
          }
        }
      });

      // Strategy 193: Div 7A Loan (Company → Shareholder)
      strats.filter(s => s.strategy_id === "193" && String(s.company_idx) === String(companyIdx)).forEach(s => {
        const amt = parseFloat(s.amount) || 0;
        const rate = (parseFloat(s.interest_rate) || 8.27) / 100;
        const term = parseInt(s.loan_term) || 7;
        const startY = (parseInt(s.start_year) || currentFYCo) - currentFYCo;
        if (startY >= 0 && startY < N) {
          stratDiv7ALoanOutVals[startY] += Math.round(amt);
          newDebtsFromStrategies.push({
            type: "60", label: `Div 7A loan to ${s.borrower === "client1" ? (ctx.factFind.client1?.first_name || "Client 1") : (ctx.factFind.client2?.first_name || "Client 2")}`,
            amount: amt, rate, term, startYIdx: startY, direction: "out", stratId: "193", borrower: s.borrower,
          });
        }
        // Div 7A minimum repayments & interest income to company
        if (amt > 0 && startY >= 0) {
          let balance = amt;
          for (let y = startY; y < N && balance > 0; y++) {
            const interest = Math.round(balance * rate);
            // Minimum annual repayment = (P × r × (1+r)^n) / ((1+r)^n - 1) — annuity formula
            const remainYrs = term - (y - startY);
            let minRepay;
            if (remainYrs <= 0) { minRepay = Math.round(balance + interest); }
            else if (rate === 0) { minRepay = Math.round(balance / remainYrs); }
            else {
              const factor = Math.pow(1 + rate, remainYrs);
              minRepay = Math.round((balance * rate * factor) / (factor - 1));
            }
            minRepay = Math.min(minRepay, Math.round(balance + interest));
            const principalRepay = minRepay - interest;
            stratDiv7AInterestInVals[y] += interest;
            stratDiv7ARepaymentVals[y] += Math.max(0, principalRepay);
            balance -= Math.max(0, principalRepay);
          }
        }
      });

      // Strategy 194: Capital Injection / Share Capital
      strats.filter(s => s.strategy_id === "194" && String(s.company_idx) === String(companyIdx)).forEach(s => {
        const amt = parseFloat(s.amount) || 0;
        const startY = (parseInt(s.start_year) || currentFYCo) - currentFYCo;
        if (startY >= 0 && startY < N) {
          stratCapitalInjectionVals[startY] += Math.round(amt);
        }
      });
    }

    // Total Income = operating profit + rental income + Div7A interest + shareholder loan inflow + capital injection
    // Total Expenses = debt repayments + interest + director fees + Div7A outflow + shareholder interest + shareholder loan repayment
    const totalExpenseVals = hasDetailedLines
      ? totalExpFromLines.map((v, y) => v + debtRepayVals[y] + deductibleIntVals[y] + stratDirectorFeeVals[y] + stratDiv7ALoanOutVals[y] + stratShareholderIntOutVals[y] + stratSHLoanRepaymentVals[y])
      : debtRepayVals.map((dr, y) => dr + deductibleIntVals[y] + stratDirectorFeeVals[y] + stratDiv7ALoanOutVals[y] + stratShareholderIntOutVals[y] + stratSHLoanRepaymentVals[y]);
    const totalRevenueWithStrats = totalRevenue.map((r, y) => r + stratDiv7AInterestInVals[y] + stratShareholderLoanInVals[y] + stratCapitalInjectionVals[y] + stratDiv7ARepaymentVals[y]);

    // Early computation of totalDivPaid for surplus calc (full divRows computed later)
    let earlyDistPct = 1.0, earlyDistStartY = 0, earlyDistEndY = N;
    let earlySpecialDivAmt = 0, earlySpecialDivYIdx = -1;
    if (ctx.isAdviceModel) {
      const s20 = (ctx.engineData.strategies || []).find(s => s.strategy_id === "20" && String(s.company_idx) === String(companyIdx));
      if (s20) {
        earlyDistPct = (parseFloat(s20.dist_pct) ?? 100) / 100;
        earlyDistStartY = (parseInt(s20.start_year) || currentFYCo) - currentFYCo;
        const ey = parseInt(s20.end_year);
        earlyDistEndY = ey ? (ey - currentFYCo) : N;
        if (s20.special_div === "1") {
          earlySpecialDivAmt = parseFloat(s20.special_div_amount) || 0;
          earlySpecialDivYIdx = (parseInt(s20.special_div_year) || currentFYCo) - currentFYCo;
        }
      }
    }
    const earlyTotalDivPaid = afterTaxProfit.map((atp, y) => {
      const dp = (y >= earlyDistStartY && y < earlyDistEndY) ? earlyDistPct : 1.0;
      let div = Math.round(Math.max(0, atp) * dp);
      if (y === earlySpecialDivYIdx && earlySpecialDivAmt > 0) div += Math.round(earlySpecialDivAmt);
      return div;
    });

    // Surplus = Total Income - Total Expenses - Dividends Paid
    const surplusVals = totalRevenueWithStrats.map((inc, y) => inc - totalExpenseVals[y] - earlyTotalDivPaid[y]);
    // End Value (Initial) = Revised Value (0) + Surplus (cumulative)
    const endValueInitial = new Array(N).fill(0);
    for (let y = 0; y < N; y++) {
      endValueInitial[y] = (y === 0 ? 0 : endValueInitial[y - 1]) + surplusVals[y];
    }

    // ═══ COMPANY EXIT / SELL STRATEGY (131) ═══
    const exitStrat = ctx.isAdviceModel ? (ctx.engineData.strategies || []).find(s => s.strategy_id === "131" && String(s.company_idx) === String(companyIdx)) : null;
    const exitYear = exitStrat ? (parseInt(exitStrat.sell_year) || (currentFYCo + 1)) : null;
    const exitYIdx = exitYear ? (exitYear - currentFYCo) : -1;
    const hasExit = exitStrat && exitYIdx >= 0 && exitYIdx < N;

    // Exit reconciliation arrays
    const exitAssetRealisation = new Array(N).fill(0);
    const exitLiabSettlement = new Array(N).fill(0);
    const exitWindupCosts = new Array(N).fill(0);
    const exitFinalTax = new Array(N).fill(0);
    const exitNetDistributable = new Array(N).fill(0);
    const exitFrankedDiv = new Array(N).fill(0);
    const exitCapitalReturn = new Array(N).fill(0);
    const exitLiquidatorDist = new Array(N).fill(0);
    const exitSalePrice = new Array(N).fill(0);
    const exitGoodwillPremium = new Array(N).fill(0);
    const exitDistRows = [];
    const exitCGTRows = [];

    if (hasExit) {
      const exitMethod = exitStrat.exit_method || "liquidate";
      const windupCosts = parseFloat(exitStrat.windup_costs) || 0;
      const shareCapital = parseFloat(company.share_capital) || 0;

      // Asset realisation at exit year (projected values)
      const assetValAtExit = totalAssets[exitYIdx] || 0;
      // Liability balances at exit year
      const liabValAtExit = Math.abs(debtBalances[exitYIdx] || 0);

      const netAssetVal = assetValAtExit - liabValAtExit;

      let grossProceeds;
      if (exitMethod === "agreed_price") {
        grossProceeds = parseFloat(exitStrat.sale_price) || 0;
        exitSalePrice[exitYIdx] = grossProceeds;
        exitGoodwillPremium[exitYIdx] = grossProceeds - netAssetVal;
      } else {
        grossProceeds = netAssetVal;
      }

      exitAssetRealisation[exitYIdx] = assetValAtExit;
      exitLiabSettlement[exitYIdx] = -liabValAtExit;
      exitWindupCosts[exitYIdx] = -windupCosts;

      // Final company tax for exit year (on operating profit + any CGT from asset sales)
      const finalOpProfit = hasDetailedLines ? (totalIncFromLines[exitYIdx] - totalExpFromLines[exitYIdx]) : profitVals[exitYIdx];
      const finalTax = Math.max(0, Math.round(finalOpProfit * companyTaxRate));
      exitFinalTax[exitYIdx] = -finalTax;

      // Net distributable
      const netDist = grossProceeds - liabValAtExit - windupCosts - finalTax;
      exitNetDistributable[exitYIdx] = Math.max(0, netDist);

      // Franking account balance at exit (preliminary calc)
      let prelimFrank = parseFloat(company.franking_account_balance) || 0;
      for (let y = 0; y <= exitYIdx; y++) {
        prelimFrank += taxPayable[y]; // tax paid adds to franking
        prelimFrank -= Math.round(afterTaxProfit[y] * companyTaxRate / (1 - companyTaxRate)); // dividends use franking
      }
      prelimFrank += finalTax; // final year tax
      const frankBalAtExit = Math.max(0, prelimFrank);

      // Distribution waterfall
      // 1. Franked dividends — up to retained earnings, limited by franking balance
      const retainedEarnings = parseFloat(company.retained_earnings) || 0;
      const maxFrankedDiv = Math.min(
        Math.max(0, netDist),
        retainedEarnings + (hasDetailedLines ? totalIncFromLines.slice(0, exitYIdx + 1).reduce((s, v, y) => s + v - totalExpFromLines[y], 0) : profitVals.slice(0, exitYIdx + 1).reduce((s, v) => s + v, 0)),
        frankBalAtExit > 0 ? frankBalAtExit / companyTaxRate * (1 - companyTaxRate) : 0
      );
      exitFrankedDiv[exitYIdx] = Math.round(Math.max(0, maxFrankedDiv));

      // 2. Capital return — up to share capital
      const remaining1 = Math.max(0, netDist) - exitFrankedDiv[exitYIdx];
      exitCapitalReturn[exitYIdx] = Math.round(Math.min(remaining1, shareCapital));

      // 3. Liquidator distribution — the rest (CGT event for shareholders)
      exitLiquidatorDist[exitYIdx] = Math.round(Math.max(0, remaining1 - exitCapitalReturn[exitYIdx]));

      // Small Business CGT Concessions for share sale (strategy 131)
      const exitSbcEligible = exitStrat.sbc_eligible === "1";
      const exitSbc15yr = exitStrat.sbc_15yr === "1";
      const exitSbcActiveAsset = exitStrat.sbc_active_asset === "1";
      const exitSbcRetirement = exitStrat.sbc_retirement === "1";
      const exitSbcRetirementAmt = parseFloat(exitStrat.sbc_retirement_amt) || 500000;
      const exitSbcRollover = exitStrat.sbc_rollover === "1";

      // Per-shareholder distribution rows with CGT concession detail
      shareholders.forEach(sh => {
        const pct = (parseFloat(sh.sh_pct) || 0) / 100;
        const shName = sh.sh_entity || "Unknown";
        const shFranked = Math.round(exitFrankedDiv[exitYIdx] * pct);
        const shCapReturn = Math.round(exitCapitalReturn[exitYIdx] * pct);
        const shLiqDist = Math.round(exitLiquidatorDist[exitYIdx] * pct);
        const totalDist = shFranked + shCapReturn + shLiqDist;

        // Distribution row
        const distVals = new Array(N).fill(0);
        distVals[exitYIdx] = totalDist;
        exitDistRows.push({ label: `${shName} (${sh.sh_pct || 0}%)`, values: distVals, style: "child" });

        // CGT on liquidator distribution
        const shareCostBase = Math.round((parseFloat(company.share_capital) || 0) * pct);
        const grossCG = Math.max(0, shLiqDist - shareCostBase);

        if (grossCG > 0) {
          const cgVals = new Array(N).fill(0);
          exitCGTRows.push({ label: `${shName} — Liquidator Distribution`, values: new Array(N).fill(""), style: "subheader" });
          cgVals[exitYIdx] = shLiqDist;
          exitCGTRows.push({ label: "  Distribution Received", values: [...cgVals], style: "child" });
          cgVals[exitYIdx] = shareCostBase;
          exitCGTRows.push({ label: "  Cost Base of Shares", values: [...cgVals], style: "child" });
          cgVals[exitYIdx] = grossCG;
          exitCGTRows.push({ label: "  Gross Capital Gain", values: [...cgVals], style: "child" });

          let netCG = grossCG;
          if (exitSbcEligible) {
            if (exitSbc15yr) {
              cgVals[exitYIdx] = -grossCG;
              exitCGTRows.push({ label: "  15-Year Exemption (Div 152-B)", values: [...cgVals], style: "child-negative" });
              netCG = 0;
            } else {
              if (exitSbcActiveAsset && netCG > 0) {
                const aaRed = Math.round(netCG * 0.5);
                cgVals[exitYIdx] = -aaRed;
                exitCGTRows.push({ label: "  50% Active Asset Reduction (Div 152-C)", values: [...cgVals], style: "child-negative" });
                netCG -= aaRed;
              }
              // 50% General CGT Discount (individuals, shares held >12m)
              if (netCG > 0) {
                const genDisc = Math.round(netCG * 0.5);
                cgVals[exitYIdx] = -genDisc;
                exitCGTRows.push({ label: "  50% General CGT Discount", values: [...cgVals], style: "child-negative" });
                netCG -= genDisc;
              }
              if (exitSbcRetirement && netCG > 0) {
                const retEx = Math.min(netCG, exitSbcRetirementAmt);
                cgVals[exitYIdx] = -retEx;
                exitCGTRows.push({ label: `  Retirement Exemption (Div 152-D) — $${retEx.toLocaleString()}`, values: [...cgVals], style: "child-negative" });
                netCG -= retEx;
              }
              if (exitSbcRollover && netCG > 0) {
                cgVals[exitYIdx] = -netCG;
                exitCGTRows.push({ label: "  Small Business Rollover (Div 152-E)", values: [...cgVals], style: "child-negative" });
                netCG = 0;
              }
            }
          } else {
            // No SB concessions — just 50% general discount for individuals
            if (netCG > 0) {
              const genDisc = Math.round(netCG * 0.5);
              cgVals[exitYIdx] = -genDisc;
              exitCGTRows.push({ label: "  50% General CGT Discount", values: [...cgVals], style: "child-negative" });
              netCG -= genDisc;
            }
          }
          cgVals[exitYIdx] = netCG;
          exitCGTRows.push({ label: "  Net Capital Gain (assessable)", values: [...cgVals], style: "highlight" });
        }

        // Store per-shareholder tax components for cashflow integration
        sh._exitFranked = shFranked;
        sh._exitCapReturn = shCapReturn;
        sh._exitLiqDist = shLiqDist;
        sh._exitNetCG = grossCG > 0 ? (exitCGTRows[exitCGTRows.length - 1]?.values[exitYIdx] || 0) : 0;
        sh._exitFrankingCredit = Math.round(shFranked * companyTaxRate / (1 - companyTaxRate));
      });

      // Zero out income/expense lines after exit year
      for (let y = exitYIdx + 1; y < N; y++) {
        profitVals[y] = 0;
        totalRevenue[y] = 0;
        totalDeductions[y] = 0;
        taxableIncome[y] = 0;
        taxPayable[y] = 0;
        afterTaxProfit[y] = 0;
        surplusVals[y] = 0;
        totalExpenseVals[y] = 0;
        if (hasDetailedLines) { totalIncFromLines[y] = 0; totalExpFromLines[y] = 0; }
        incLineProjections.forEach(lp => { lp.vals[y] = 0; });
        expLineProjections.forEach(lp => { lp.vals[y] = 0; });
        // Zero asset and debt projections
        propValues[y] = 0; otherValues[y] = 0; totalAssets[y] = 0;
        rentalIncVals[y] = 0; debtBalances[y] = 0; debtRepayVals[y] = 0; deductibleIntVals[y] = 0;
      }
    }

    // Franking credits tracking
    const frankOpenBal = new Array(N).fill(0);
    const frankCloseBal2 = new Array(N).fill(0);
    // Franking credits used = tax equivalent attached to fully franked dividends
    const frankUsed = afterTaxProfit.map(atp => -Math.round(atp * companyTaxRate / (1 - companyTaxRate)));
    for (let y = 0; y < N; y++) {
      frankOpenBal[y] = y === 0 ? (parseFloat(company.franking_account_balance) || 0) : frankCloseBal2[y - 1];
      frankCloseBal2[y] = frankOpenBal[y] + taxPayable[y] + frankUsed[y];
      if (hasExit && y === exitYIdx) frankCloseBal2[y] -= exitFrankedDiv[y] * companyTaxRate / (1 - companyTaxRate);
      if (hasExit && y > exitYIdx) { frankOpenBal[y] = 0; frankCloseBal2[y] = 0; }
    }

    // Dividend rows
    // Strategy 20: distribution rate override (default 100%) + special dividend
    let distPct = 1.0; // default: distribute 100% of after-tax profit
    let distStartY = 0;
    let distEndY = N;
    let distFrankType = "franked";
    let distFrankPct = 1.0;
    let specialDivAmt = 0, specialDivYIdx = -1;
    let specialFrankType = "franked", specialFrankPct = 1.0;
    if (ctx.isAdviceModel) {
      const strat20 = (ctx.engineData.strategies || []).find(s => s.strategy_id === "20" && String(s.company_idx) === String(companyIdx));
      if (strat20) {
        distPct = (parseFloat(strat20.dist_pct) ?? 100) / 100;
        distStartY = (parseInt(strat20.start_year) || currentFYCo) - currentFYCo;
        const endYRaw = parseInt(strat20.end_year);
        distEndY = endYRaw ? (endYRaw - currentFYCo) : N;
        distFrankType = strat20.franking_type || "franked";
        distFrankPct = distFrankType === "franked" ? 1 : distFrankType === "unfranked" ? 0 : (parseFloat(strat20.franking_pct) || 50) / 100;
        if (strat20.special_div === "1") {
          specialDivAmt = parseFloat(strat20.special_div_amount) || 0;
          specialDivYIdx = (parseInt(strat20.special_div_year) || currentFYCo) - currentFYCo;
          specialFrankType = strat20.special_franking_type || "franked";
          specialFrankPct = specialFrankType === "franked" ? 1 : specialFrankType === "unfranked" ? 0 : (parseFloat(strat20.special_franking_pct) || 50) / 100;
        }
      }
    }
    const divRows = shareholders.map(sh => {
      const pct = (parseFloat(sh.sh_pct) || 0) / 100;
      const vals = afterTaxProfit.map((atp, y) => {
        if (hasExit && y >= exitYIdx) return 0;
        const yearDistPct = (y >= distStartY && y < distEndY) ? distPct : 1.0;
        let div = Math.round(Math.max(0, atp) * pct * yearDistPct);
        if (y === specialDivYIdx && specialDivAmt > 0) div += Math.round(specialDivAmt * pct);
        return div;
      });
      return { label: `${sh.sh_entity || "Unknown"}`, values: vals, style: "child", entity: sh.sh_entity };
    });
    const totalDivPaid = afterTaxProfit.map((atp, y) => {
      if (hasExit && y >= exitYIdx) return 0;
      const yearDistPct = (y >= distStartY && y < distEndY) ? distPct : 1.0;
      let div = Math.round(Math.max(0, atp) * yearDistPct);
      if (y === specialDivYIdx && specialDivAmt > 0) div += Math.round(specialDivAmt);
      return div;
    });

    // Starting value = previous year's end value
    const startingVals = new Array(N).fill(0);
    for (let y = 1; y < N; y++) { startingVals[y] = endValueInitial[y - 1]; }

    // New debt drawdowns for this company
    const companyDebtDrawdown = new Array(N).fill(0);
    const companyDebtDrawdownAmt = newDebtDrawdowns[companyId] || 0;
    if (companyDebtDrawdownAmt > 0) companyDebtDrawdown[0] = companyDebtDrawdownAmt;
    const companyEstCosts = new Array(N).fill(0);
    adviceDebts.filter(d => d.d_owner === companyId).forEach(d => {
      const est = parseFloat(ctx.engineData.advice_request?.transactions?.debts?.find(t => t.owner_id === companyId)?.establishment_cost) || 0;
      if (est > 0) companyEstCosts[0] += est;
    });

    const data = { years: ctx.shortYears, sections: [
      { id: "company-header", rows: [{ label: "Year", values: ctx.shortYears.map((_, i) => i + 1), style: "header" }] },
      { id: "company-divider-1", isDivider: true },
      // ══ CASHFLOW STATEMENT ══
      { id: "company-cashflow-header", isSectionHeader: true, title: "Cashflow Statement", subtitle: "Cash movements and operating performance", icon: "💰", bg: "var(--ps-surface-green)", border: "var(--ps-ring-emerald)" },
      { id: "company-divider-1b", isDivider: true },
      // ── Cashflow ──
      { id: "company-cashflow", title: "Cashflow", rows: [
        { label: "Starting Value", values: startingVals, style: "current-value" },
      ]},
      { id: "company-inflows", title: "Inflows", rows: [
        { label: "Contribution from Other Entities", values: zeros, style: "child" },
        ...(companySellSOY.some(v => v > 0) ? [{ label: "Asset Sale Proceeds", values: companySellSOY, style: "child" }] : []),
        ...(companyDebtDrawdown.some(v => v > 0) ? [{ label: "Debt Drawdown", values: companyDebtDrawdown, style: "child" }] : [{ label: "Debt Drawdown", values: zeros, style: "child" }]),
        ...(stratShareholderLoanInVals.some(v => v > 0) ? [{ label: "Shareholder Loan Received (Strat 192)", values: stratShareholderLoanInVals, style: "child" }] : []),
        ...(stratCapitalInjectionVals.some(v => v > 0) ? [{ label: "Capital Injection (Strat 194)", values: stratCapitalInjectionVals, style: "child" }] : []),
        ...(stratDiv7ARepaymentVals.some(v => v > 0) ? [{ label: "Div 7A Loan Repayments Received (Strat 193)", values: stratDiv7ARepaymentVals, style: "child" }] : []),
        ...(stratDiv7AInterestInVals.some(v => v > 0) ? [{ label: "Div 7A Interest Income (Strat 193)", values: stratDiv7AInterestInVals, style: "child" }] : []),
      ]},
      { id: "company-outflows", title: "Outflows", rows: [
        { label: "Drawdown to Other Entities", values: zeros, style: "child-negative" },
        ...(companyEstCosts.some(v => v > 0) ? [{ label: "Establishment Costs", values: companyEstCosts.map(v => -v), style: "child-negative" }] : [{ label: "Establishment Costs", values: zeros, style: "child-negative" }]),
        { label: "Instant Debt Repayments", values: zeros, style: "child-negative" },
        { label: "Asset Purchases", values: zeros, style: "child-negative" },
        ...(earlyTotalDivPaid.some(v => v > 0) ? [{ label: "Dividends Paid", values: earlyTotalDivPaid.map(v => -v), style: "child-negative" }] : []),
        ...(stratDirectorFeeVals.some(v => v > 0) ? [{ label: "Director Fees + SG (Strat 191)", values: stratDirectorFeeVals.map(v => -v), style: "child-negative" }] : []),
        ...(stratDiv7ALoanOutVals.some(v => v > 0) ? [{ label: "Div 7A Loan Advanced (Strat 193)", values: stratDiv7ALoanOutVals.map(v => -v), style: "child-negative" }] : []),
        ...(stratShareholderIntOutVals.some(v => v > 0) ? [{ label: "Interest on Shareholder Loan (Strat 192)", values: stratShareholderIntOutVals.map(v => -v), style: "child-negative" }] : []),
        ...(stratSHLoanRepaymentVals.some(v => v > 0) ? [{ label: "Shareholder Loan Repayments (Strat 192)", values: stratSHLoanRepaymentVals.map(v => -v), style: "child-negative" }] : []),
      ]},
      { id: "company-revised", rows: [
        { label: "Revised Value", values: startingVals.map((v, y) => v + companySellSOY[y] + companyDebtDrawdown[y] - companyEstCosts[y]), style: "highlight" },
      ]},
      { id: "company-divider-2", isDivider: true },
      // ── Income ──
      { id: "company-income", title: "Income", rows: [
        ...incLineProjections.map(lp => ({ label: lp.label, values: lp.vals, style: "child" })),
        ...(rentalIncVals.some(v => v > 0) ? [{ label: "Rental Income (Property)", values: rentalIncVals, style: "child" }] : []),
        ...(!hasDetailedLines && profitVals.some(v => v > 0) ? [{ label: "Operating Income", values: profitVals, style: "child" }] : []),
        { label: "Total Income", values: hasDetailedLines ? totalIncFromLines.map((v, y) => v + rentalIncVals[y]) : totalRevenue, style: "total" },
      ]},
      // ── Expenses ──
      { id: "company-expenses", title: "Expenses", rows: [
        ...expLineProjections.map(lp => ({ label: lp.label, values: lp.vals.map(v => -v), style: "child-negative" })),
        ...(debtRepayVals.some(v => v > 0) ? [{ label: "Debt Repayments", values: debtRepayVals.map(v => -v), style: "child-negative" }] : []),
        ...(deductibleIntVals.some(v => v > 0) ? [{ label: "Loan Interest", values: deductibleIntVals.map(v => -v), style: "child-negative" }] : []),
        { label: "Total Expenses", values: hasDetailedLines ? totalExpFromLines.map((v, y) => v + totalExpenseVals[y]).map(v => -v) : totalExpenseVals.map(v => -v), style: "total" },
      ]},
      // ── Surplus ──
      { id: "company-surplus", rows: [
        { label: "Surplus", values: surplusVals, style: "highlight" },
      ]},
      { id: "company-divider-3", isDivider: true },
      // ── End of Year Adjustments ──
      { id: "company-end-values", title: "End of Year Adjustments", rows: [
        { label: "End Value (Initial)", values: endValueInitial, style: "subtotal" },
        ...(companySellEOY.some(v => v > 0) ? [{ label: "Asset Sale Proceeds", values: companySellEOY, style: "child" }] : []),
        { label: "Contribution from Other Entities", values: zeros, style: "child" },
        { label: "Asset Purchases", values: zeros, style: "child-negative" },
        { label: "Drawdown to Other Entities", values: zeros, style: "child-negative" },
        { label: "Savings Drawdown", values: zeros, style: "child-negative" },
        { label: "End Value", values: endValueInitial.map((v, y) => v + companySellEOY[y]), style: "end-value" },
      ]},
      { id: "company-divider-4", isDivider: true },
      // ══════════════════════════════════════════
      // TAX STATEMENT
      // ══════════════════════════════════════════
      { id: "company-tax-statement-header", isSectionHeader: true, title: "Tax Statement", subtitle: "Assessable income, deductions and company tax", icon: "🏛️", bg: "var(--ps-surface-indigo)", border: "var(--ps-ring-indigo)" },
      { id: "company-divider-4b", isDivider: true },
      // ── Assessable Income ──
      { id: "company-tax", title: "Assessable Income", rows: [
        ...incLineProjections.map(lp => ({ label: lp.label, values: lp.vals, style: "child" })),
        ...(rentalIncVals.some(v => v > 0) ? [{ label: "Rental Income", values: rentalIncVals, style: "child" }] : []),
        ...(!hasDetailedLines && profitVals.some(v => v > 0) ? [{ label: "Ordinary Income", values: profitVals, style: "child" }] : []),
        { label: "Franking Credits", values: zeros, style: "child" },
        { label: "Capital Gain", values: zeros, style: "child" },
        { label: "Total Income", values: hasDetailedLines ? totalIncFromLines.map((v, y) => v + rentalIncVals[y]) : totalRevenue, style: "total" },
      ]},
      // ── Deductions ──
      { id: "company-tax-deductions", title: "Deductions", rows: [
        ...expLineProjections.map(lp => ({ label: lp.label, values: lp.vals.map(v => -v), style: "child-negative" })),
        ...(deductibleIntVals.some(v => v > 0) ? [{ label: "Deductible Interest", values: deductibleIntVals.map(v => -v), style: "child-negative" }] : []),
        { label: "Total Deductions", values: hasDetailedLines ? totalExpFromLines.map((v, y) => v + deductibleIntVals[y]).map(v => -v) : deductibleIntVals.map(v => -v), style: "total" },
      ]},
      { id: "company-divider-5", isDivider: true },
      // ── Tax Summary ──
      { id: "company-tax-summary", title: "Tax Summary", rows: [
        { label: "Existing Tax Losses", values: zeros, style: "child" },
        { label: "Operating Profit", values: taxableIncome, style: "child" },
        { label: "Taxable Income", values: taxableIncome, style: "subtotal" },
        { label: `Tax Payable (${(companyTaxRate * 100).toFixed(0)}%)`, values: taxPayable, style: "current-value" },
        { label: "Carried Forward Losses", values: zeros, style: "child" },
      ]},
      { id: "company-divider-6", isDivider: true },
      // ── Franking Credits ──
      { id: "company-franking", title: "Franking Credits", rows: [
        { label: "Opening Balance", values: frankOpenBal, style: "child" },
        { label: "Tax Paid", values: taxPayable, style: "child" },
        { label: "Franking Credits Used", values: frankUsed, style: "child-negative" },
        { label: "Closing Balance", values: frankCloseBal2, style: "highlight" },
      ]},
      { id: "company-divider-7", isDivider: true },
      // ── Dividends Paid ──
      { id: "company-dividends-paid", title: "Dividends Paid", rows: [
        ...divRows,
        { label: "Total Dividends", values: totalDivPaid, style: "total" },
      ]},
      { id: "company-divider-8", isDivider: true },
      // ── Net Worth ──
      { id: "company-net-worth", title: "Net Worth", rows: [
        ...(propValues.some(v => v > 0) ? [{ label: "Property Value", values: propValues, style: "child" }] : []),
        ...(otherValues.some(v => v > 0) ? [{ label: "Other Assets", values: otherValues, style: "child" }] : []),
        { label: "Total Assets", values: totalAssets, style: "total" },
        ...(debtBalances.some(v => v < 0) ? [{ label: "Outstanding Debt", values: debtBalances, style: "child-negative" }] : []),
        { label: "Net Worth", values: netWorth, style: "highlight" },
      ]},
      // ── EXIT RECONCILIATION (only if strategy 131 active) ──
      ...(hasExit ? [
        { id: "company-divider-exit", isDivider: true },
        { id: "company-exit-header", isSectionHeader: true, title: "Company Exit Reconciliation", subtitle: `${exitStrat.exit_method === "agreed_price" ? "Agreed Sale" : "Liquidation"} — FY${exitYear}`, icon: "🏁", bg: "var(--ps-surface-amber)", border: "var(--ps-ring-amber)" },
        { id: "company-divider-exit2", isDivider: true },
        { id: "company-exit-recon", title: "Exit Reconciliation", rows: [
          ...(exitStrat.exit_method === "agreed_price" ? [
            { label: "Agreed Sale Price", values: exitSalePrice, style: "current-value" },
            { label: "Net Asset Value", values: exitAssetRealisation.map((v, y) => v + (exitLiabSettlement[y] || 0)), style: "child" },
            { label: "Goodwill Premium / (Discount)", values: exitGoodwillPremium, style: exitGoodwillPremium[exitYIdx] >= 0 ? "child" : "child-negative" },
          ] : [
            { label: "Asset Realisation", values: exitAssetRealisation, style: "child" },
          ]),
          { label: "Less: Outstanding Liabilities", values: exitLiabSettlement, style: "child-negative" },
          { label: "Less: Wind-up Costs", values: exitWindupCosts, style: "child-negative" },
          { label: "Less: Final Company Tax", values: exitFinalTax, style: "child-negative" },
          { label: "Net Distributable Amount", values: exitNetDistributable, style: "highlight" },
        ]},
        { id: "company-divider-exit3", isDivider: true },
        { id: "company-exit-dist", title: "Distribution Waterfall", rows: [
          { label: "Franked Dividend (from retained profits)", values: exitFrankedDiv, style: "child" },
          { label: "Capital Return (share capital)", values: exitCapitalReturn, style: "child" },
          { label: "Liquidator Distribution (CGT event)", values: exitLiquidatorDist, style: "child" },
          { label: "Total Distribution", values: exitNetDistributable, style: "total" },
        ]},
        { id: "company-divider-exit4", isDivider: true },
        { id: "company-exit-per-sh", title: "Per Shareholder", rows: [
          ...exitDistRows,
        ]},
        ...(exitCGTRows.length > 0 ? [
          { id: "company-divider-exit5", isDivider: true },
          { id: "company-exit-cgt-header", isSectionHeader: true, title: "CGT on Liquidator Distribution", subtitle: "Small business concessions applied at shareholder level", icon: "📋", bg: "var(--ps-surface-indigo)", border: "var(--ps-ring-indigo)" },
          { id: "company-divider-exit6", isDivider: true },
          { id: "company-exit-cgt", title: "Shareholder CGT Schedule", rows: exitCGTRows },
        ] : []),
      ] : []),
    ]};
    const chartData = ctx.shortYears.map((year, i) => ({
      year, netWorth: netWorth[i], totalDividends: afterTaxProfit[i],
      divCatherine: divRows[0]?.values[i] || 0, divPaul: divRows[1]?.values[i] || 0,
      taxPaid: taxPayable[i], operatingProfit: profitVals[i],
    }));
    return { data, chartData, name: company.company_name };
  };

  // ═══════════════════════════════════════════════════════════════
  // Investment Bond Projection Engine

export const buildBondData = (ctx, bondIdx) => {
    const bond = (ctx.engineData.investmentBonds || [])[bondIdx];
    if (!bond) return null;
    const N = ctx.N_YEARS;
    const aa = ctx.engineData.assetAssumptions || {};
    const shortYears = ctx.shortYears;
    const portfolio = bond.portfolio || [];
    const totalBalance = parseFloat(bond.balance) || portfolio.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const bondTaxRate = 0.30;

    // Weighted-average rates from portfolio
    const avgGrowth = portfolio.length > 0
      ? portfolio.reduce((s, p) => s + ((aa[p.asset_code]?.growthRate ?? 5) / 100) * ((parseFloat(p.amount) || 0) / Math.max(totalBalance, 1)), 0)
      : 0.05;
    const avgIncome = portfolio.length > 0
      ? portfolio.reduce((s, p) => s + ((aa[p.asset_code]?.incomeYield ?? 0) / 100) * ((parseFloat(p.amount) || 0) / Math.max(totalBalance, 1)), 0)
      : 0.02;
    const avgFrankPct = portfolio.length > 0
      ? portfolio.reduce((s, p) => s + ((aa[p.asset_code]?.frankingPct ?? aa[p.asset_code]?.frankingCredit ?? 0) / 100) * ((parseFloat(p.amount) || 0) / Math.max(totalBalance, 1)), 0)
      : 0;

    // Build SOY/EOY contribution and withdrawal arrays from strategies
    const soyContribs = new Array(N).fill(0);
    const eoyContribs = new Array(N).fill(0);
    const soyWithdrawals = new Array(N).fill(0);
    const eoyWithdrawals = new Array(N).fill(0);

    if (ctx.isAdviceModel) {
      const strats = ctx.engineData.advice_request?.strategy?.strategies || [];
      strats.filter(s => s.strategy_id === "17" && (parseInt(s.bond_idx) || 0) === bondIdx).forEach(s => {
        const amt = parseFloat(s.amount) || 0;
        if (amt <= 0) return;
        const sy = Math.max(0, (parseInt(s.start_year) || ctx.currentFY) - ctx.currentFY);
        const ey = s.end_year === "Ongoing" ? N - 1 : Math.min(N - 1, (parseInt(s.end_year) || ctx.currentFY + 30) - ctx.currentFY);
        const isSOY = (s.timing || "SOY") === "SOY";
        for (let y = sy; y <= ey && y < N; y++) {
          if (isSOY) soyContribs[y] += Math.round(amt); else eoyContribs[y] += Math.round(amt);
        }
      });
      strats.filter(s => s.strategy_id === "177" && (parseInt(s.bond_idx) || 0) === bondIdx).forEach(s => {
        const amt = parseFloat(s.amount) || 0;
        if (amt <= 0) return;
        const sy = Math.max(0, (parseInt(s.start_year) || ctx.currentFY) - ctx.currentFY);
        const ey = s.end_year === "Ongoing" ? N - 1 : Math.min(N - 1, (parseInt(s.end_year) || ctx.currentFY + 30) - ctx.currentFY);
        const isSOY = (s.timing || "SOY") === "SOY";
        for (let y = sy; y <= ey && y < N; y++) {
          if (isSOY) soyWithdrawals[y] += Math.round(amt); else eoyWithdrawals[y] += Math.round(amt);
        }
      });
    }

    const totalContribs = soyContribs.map((v, y) => v + eoyContribs[y]);
    const totalWithdrawals = soyWithdrawals.map((v, y) => v + eoyWithdrawals[y]);

    // ══ CASHFLOW SCHEDULE — cash hub, starts at 0 each year ══
    const cashOpen = new Array(N).fill(0);
    const cashRevised = soyContribs.map((c, y) => c - soyWithdrawals[y]);
    const cashClose = cashRevised.map((r, y) => r + eoyContribs[y] - eoyWithdrawals[y]);
    const hasSOY = soyContribs.some(v => v > 0) || soyWithdrawals.some(v => v > 0);
    const hasEOY = eoyContribs.some(v => v > 0) || eoyWithdrawals.some(v => v > 0);
    const hasCashflow = hasSOY || hasEOY;

    // ══ INVESTMENT SCHEDULE — portfolio value over time ══
    const invOpen = new Array(N).fill(0);
    const invSoyNet = new Array(N).fill(0);
    const invRevised = new Array(N).fill(0);
    const invGrowth = new Array(N).fill(0);
    const invIncome = new Array(N).fill(0);
    const invFranking = new Array(N).fill(0);
    const invTax = new Array(N).fill(0);
    const invEoyNet = new Array(N).fill(0);
    const invEnd = new Array(N).fill(0);

    let invRunning = totalBalance;
    for (let y = 0; y < N; y++) {
      invOpen[y] = Math.round(invRunning);
      const soyCash = soyContribs[y] - soyWithdrawals[y];
      invSoyNet[y] = soyCash;
      invRunning += soyCash;
      invRevised[y] = Math.round(invRunning);

      const growth = Math.round(invRunning * avgGrowth);
      const income = Math.round(invRunning * avgIncome);
      const frankedAmt = Math.round(income * avgFrankPct);
      const fc = Math.round(frankedAmt * 0.30 / 0.70);
      const grossTax = Math.round((income + fc) * bondTaxRate);
      const netTax = Math.max(0, grossTax - fc);
      invGrowth[y] = growth;
      invIncome[y] = income;
      invFranking[y] = fc;
      invTax[y] = netTax;
      invRunning = invRunning + growth + income - netTax;

      const eoyCash = eoyContribs[y] - eoyWithdrawals[y];
      invEoyNet[y] = eoyCash;
      invRunning += eoyCash;
      invEnd[y] = Math.round(invRunning);
    }

    const afterTaxReturn = invGrowth.map((g, y) => g + invIncome[y] - invTax[y]);
    const commDate = bond.commencement_date ? new Date(bond.commencement_date) : null;
    const yearsHeld = commDate ? Math.floor((new Date().getTime() - commDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
    const taxFreeYear = Math.max(0, 10 - yearsHeld);

    // Per-investment breakdown (static projection)
    const investmentSections = portfolio.map((inv, ii) => {
      const typeDef = aa[inv.asset_code] || {};
      const label = inv.asset_name || typeDef.label || `Investment ${ii + 1}`;
      const startVal = parseFloat(inv.amount) || 0;
      const gr = (typeDef.growthRate ?? 5) / 100;
      const iy = (typeDef.incomeYield ?? 0) / 100;
      const fpct = (typeDef.frankingPct ?? typeDef.frankingCredit ?? 0) / 100;
      let r = startVal;
      const iOpen = [], iEnd = [], iGr = [], iInc = [], iFr = [], iTx = [];
      for (let y = 0; y < N; y++) {
        iOpen.push(Math.round(r));
        const inc = Math.round(r * iy); iInc.push(inc);
        const fk = Math.round(Math.round(inc * fpct) * 0.30 / 0.70); iFr.push(fk);
        const gt = Math.round((inc + fk) * bondTaxRate);
        const nt = Math.max(0, gt - fk); iTx.push(nt);
        const g = Math.round(r * gr); iGr.push(g);
        r = r + g + inc - nt; iEnd.push(Math.round(r));
      }
      return { id: `bond-inv-${ii}`, title: label, rows: [
        { label: "Opening Value", values: iOpen, style: "current-value" },
        { label: "Capital Growth", values: iGr, style: "child" },
        ...(iInc.some(v => v > 0) ? [{ label: "Income Earned", values: iInc, style: "child" }] : []),
        ...(iFr.some(v => v > 0) ? [{ label: "Franking Credits", values: iFr, style: "child" }] : []),
        { label: "Internal Tax (30%)", values: iTx.map(v => -v), style: "child-negative" },
        { label: "Closing Value", values: iEnd, style: "end-value" },
      ]};
    });

    const data = { years: ctx.shortYears, sections: [
      { id: "bond-header", rows: [{ label: "Year", values: ctx.shortYears.map((_, i) => i + 1), style: "header" }] },
      { id: "bond-d0", isDivider: true },
      // ══ CASHFLOW ══
      ...(hasCashflow ? [
        { id: "bond-cf-header", isSectionHeader: true, title: "Bond Cashflow", subtitle: "Cash moving in and out of the bond", icon: "💵", bg: "var(--ps-surface-emerald)", border: "var(--ps-ring-green)" },
        { id: "bond-cf-d0", isDivider: true },
        { id: "bond-cf-open", rows: [{ label: "Opening Cash", values: cashOpen, style: "current-value" }] },
        ...(hasSOY ? [{ id: "bond-cf-soy", title: "Start of Year", rows: [
          ...(soyContribs.some(v => v > 0) ? [{ label: "Contributions", values: soyContribs, style: "child" }] : []),
          ...(soyWithdrawals.some(v => v > 0) ? [{ label: "Withdrawals", values: soyWithdrawals.map(v => -v), style: "child-negative" }] : []),
        ]}] : []),
        ...(hasSOY ? [{ id: "bond-cf-rev", rows: [{ label: "Revised Cash", values: cashRevised, style: "highlight" }] }] : []),
        ...(hasEOY ? [{ id: "bond-cf-eoy", title: "End of Year", rows: [
          ...(eoyContribs.some(v => v > 0) ? [{ label: "Contributions", values: eoyContribs, style: "child" }] : []),
          ...(eoyWithdrawals.some(v => v > 0) ? [{ label: "Withdrawals", values: eoyWithdrawals.map(v => -v), style: "child-negative" }] : []),
        ]}] : []),
        { id: "bond-cf-close", rows: [{ label: "Net Cash Deployed", values: cashClose, style: "end-value" }] },
        { id: "bond-cf-d1", isDivider: true },
      ] : []),
      // ══ INVESTMENT VALUE ══
      { id: "bond-inv-header-main", isSectionHeader: true, title: "Investment Value", subtitle: `Tax-paid structure — 30% internal tax on earnings${taxFreeYear > 0 ? ` — tax-free withdrawals in ${taxFreeYear} years` : " — tax-free withdrawals available"}`, icon: "🔒", bg: "var(--ps-surface-orange)", border: "var(--ps-ring-orange)" },
      { id: "bond-d1", isDivider: true },
      { id: "bond-inv-value", title: "Bond Portfolio", rows: [
        { label: "Opening Balance", values: invOpen, style: "current-value" },
        ...(invSoyNet.some(v => v !== 0) ? [{ label: "Net Cash (SOY)", values: invSoyNet, style: "child" }] : []),
        ...(invSoyNet.some(v => v !== 0) ? [{ label: "Revised Balance", values: invRevised, style: "highlight" }] : []),
        { label: "Capital Growth", values: invGrowth, style: "child" },
        { label: "Income Earned", values: invIncome, style: "child" },
        ...(invFranking.some(v => v > 0) ? [{ label: "Franking Credits", values: invFranking, style: "child" }] : []),
        { label: "Internal Tax (30%)", values: invTax.map(v => -v), style: "child-negative" },
        { label: "After-Tax Return", values: afterTaxReturn, style: "total" },
        ...(invEoyNet.some(v => v !== 0) ? [{ label: "Net Cash (EOY)", values: invEoyNet, style: "child" }] : []),
        { label: "Closing Balance", values: invEnd, style: "end-value" },
      ]},
      { id: "bond-d2", isDivider: true },
      // ══ INVESTMENT BREAKDOWN ══
      ...(investmentSections.length > 0 ? [
        { id: "bond-inv-header", isSectionHeader: true, title: "Investment Breakdown", subtitle: `${portfolio.length} investments — ${portfolio.map(p => `${p.allocation_pct}%`).join(", ")}`, icon: "📊", bg: "var(--ps-surface-sky)", border: "var(--ps-ring-sky)" },
        { id: "bond-d3", isDivider: true },
        ...investmentSections.flatMap((s, i) => [s, { id: `bond-inv-d-${i}`, isDivider: true }]),
      ] : []),
      // ══ TAX ══
      { id: "bond-tax-header", isSectionHeader: true, title: "Internal Tax", subtitle: "Tax paid within the bond at 30% — no personal tax liability", icon: "🏛️", bg: "var(--ps-surface-indigo)", border: "var(--ps-ring-indigo)" },
      { id: "bond-d4", isDivider: true },
      { id: "bond-tax", title: "Tax Summary", rows: [
        { label: "Gross Income", values: invIncome.map((inc, y) => inc + invFranking[y]), style: "child" },
        ...(invFranking.some(v => v > 0) ? [{ label: "Franking Credits", values: invFranking, style: "child" }] : []),
        { label: "Tax @ 30%", values: invIncome.map((inc, y) => Math.round((inc + invFranking[y]) * bondTaxRate)), style: "child" },
        ...(invFranking.some(v => v > 0) ? [{ label: "Franking Offset", values: invFranking, style: "child" }] : []),
        { label: "Net Tax Paid", values: invTax, style: "child-negative" },
      ]},
    ]};

    const chartData = ctx.shortYears.map((year, y) => ({ year, "Bond Value": invEnd[y] }));
    return { data, name: bond.product_name || `Bond ${bondIdx + 1}`, chartData: { data: chartData, keys: ["Bond Value"], colors: ["#6366F1"] }, totalEnd: invEnd, totalContribs, totalWithdrawals };
};

export const buildSegregatedSMSFData = (ctx, smsfIdx) => {
    const smsf = (ctx.engineData.smsfs || [])[smsfIdx];
    if (!smsf) return null;
    const N = ctx.N_YEARS;
    const aa = ctx.engineData.assetAssumptions || {};
    const accounts = smsf.accounts || [];
    const M = accounts.length;
    const smsfTaxRate = 0.15;
    const companyTaxRate = 0.30;
    const sgRate = 0.12;
    const zeros = new Array(N).fill(0);
    const shortYears = ctx.shortYears;

    // Build full entity-style data per account
    const acctResults = accounts.map((acc, ai) => {
      const accId = `smsf_${smsfIdx}_acc_${ai}`;
      const isC1 = acc.owner === "client1";
      const client = isC1 ? ctx.engineData.client1 : ctx.engineData.client2;
      const clientName = ((client?.first_name || "") + " " + (client?.last_name || "")).trim();
      const isPension = acc.tax_environment === "pension";
      const taxRate = isPension ? 0 : smsfTaxRate;

      // Assets & debts for this account
      const accAssets = (ctx.engineData.assets || []).filter(a => a.a_owner === accId);
      const accDebts = (ctx.engineData.liabilities || []).filter(d => d.d_owner === accId);

      // Sell proceeds for this account — split by timing
      const accSellSOY = new Array(N).fill(0);
      const accSellEOY = new Array(N).fill(0);
      const currentFYSegSmsf = new Date().getFullYear();
      if (ctx.isAdviceModel) {
        (ctx.engineData.advice_request?.transactions?.sell || []).forEach(s => {
          if (s.entity_type !== "5") return;
          const assetIdx = parseInt(s.asset_idx);
          const asset = !isNaN(assetIdx) ? ctx.ffAssets[assetIdx] : null;
          if (!asset || asset.a_owner !== accId) return;
          const sellYear = parseInt(s.sell_year) || currentFYSegSmsf;
          const yIdx = sellYear - currentFYSegSmsf;
          if (yIdx < 0 || yIdx >= N) return;
          const currentVal = parseFloat(asset.a_value) || 0;
          const sellAmt = s.sell_entire_amount ? currentVal : Math.min(parseFloat(s.amount) || 0, currentVal);
          const txnCostPct = (parseFloat(s.transaction_costs_pct) || 0) / 100;
          const proceeds = Math.round(sellAmt * (1 - txnCostPct));
          if (s.sell_timing === "end") accSellEOY[yIdx] += proceeds; else accSellSOY[yIdx] += proceeds;
        });
      }
      const accSellProceeds = accSellSOY.map((v, y) => v + accSellEOY[y]);

      // ── Asset projections (same as trust) ──
      const propValues = new Array(N).fill(0);
      const otherValues = new Array(N).fill(0);
      const rentalIncVals = new Array(N).fill(0);
      const investIncVals = new Array(N).fill(0);
      const frankingVals = new Array(N).fill(0);

      accAssets.filter(a => a.a_type === "18" || a.a_type === "21").forEach(a => {
        let val = parseFloat(a.a_value) || 0;
        const weeklyRent = parseFloat(a.a_rental_income) || 0;
        const rentFreq = parseFloat(a.a_rental_freq) || 52;
        let annualRent = weeklyRent * rentFreq;
        const gr = (aa["18"]?.growthRate ?? 3) / 100;
        const iy = (aa["18"]?.incomeYield ?? 4.36) / 100;
        for (let y = 0; y < N; y++) {
          propValues[y] += Math.round(val);
          rentalIncVals[y] += annualRent > 0 ? Math.round(annualRent) : Math.round(val * iy);
          val *= (1 + gr);
          if (annualRent > 0) annualRent *= (1 + gr);
        }
      });
      accAssets.filter(a => a.a_type !== "18" && a.a_type !== "21").forEach(a => {
        let val = parseFloat(a.a_value) || 0;
        const typeDef = aa[a.a_type] || {};
        const gr = (typeDef.growthRate ?? 5) / 100;
        const iy = (typeDef.incomeYield ?? 0) / 100;
        const fc = (typeDef.frankingPct ?? typeDef.frankingCredit ?? 0) / 100;
        for (let y = 0; y < N; y++) {
          otherValues[y] += Math.round(val);
          const inc = Math.round(val * iy);
          investIncVals[y] += inc;
          const frankedAmt = Math.round(inc * fc);
          frankingVals[y] += Math.round(frankedAmt * companyTaxRate / (1 - companyTaxRate));
          val *= (1 + gr);
        }
      });
      const totalAssets = propValues.map((p, y) => p + otherValues[y]);

      // ── Debt projections (same as trust) ──
      const debtBalances = new Array(N).fill(0);
      const debtRepayVals = new Array(N).fill(0);
      const deductibleIntVals = new Array(N).fill(0);
      accDebts.forEach(d => {
        let bal = parseFloat(d.d_balance) || 0;
        const rate = (parseFloat(d.d_rate) || 0) / 100;
        const freq = parseFloat(d.d_freq) || 12;
        const isIO = d.d_io === "1";
        const statedRepay = parseFloat(d.d_repayments) || 0;
        const termYears = parseFloat(d.d_term) || 30;
        const periodicRate = rate / freq;
        const totalPeriods = termYears * freq;
        let minRepay = 0;
        if (!isIO && bal > 0 && periodicRate > 0 && totalPeriods > 0) minRepay = bal * periodicRate / (1 - Math.pow(1 + periodicRate, -totalPeriods));
        const annualRepay = isIO ? Math.round(bal * rate) : Math.round(Math.max(statedRepay, minRepay) * freq);
        for (let y = 0; y < N; y++) {
          if (bal <= 0) continue;
          const interest = Math.round(bal * rate);
          deductibleIntVals[y] += interest;
          const principal = isIO ? 0 : Math.min(bal, annualRepay - interest);
          debtRepayVals[y] += annualRepay;
          bal = Math.max(0, bal - principal);
          debtBalances[y] += -Math.round(bal);
        }
      });

      // ── Income ──
      const totalIncome = rentalIncVals.map((r, y) => r + investIncVals[y]);
      const totalIncomeForTax = rentalIncVals.map((r, y) => r + investIncVals[y] + frankingVals[y]); // for tax statement

      // ── Insurance Premiums (accumulation accounts only) ──
      const smsfAcctFundId = `smsf_${smsfIdx}_${ai}`;
      const linkedInsPolicies = isPension ? [] : (ctx.engineData.insurance?.policies || []).filter(p =>
        p.linked_fund_id === smsfAcctFundId
      );
      const baseInsPremium = linkedInsPolicies.reduce((sum, pol) => {
        return sum + (parseFloat(pol.premium_life) || 0) + (parseFloat(pol.premium_tpd) || 0) + (parseFloat(pol.premium_trauma) || 0) + (parseFloat(pol.premium_ip) || 0);
      }, 0);
      // IP premiums are deductible for SMSF tax purposes
      const baseIpPremium = linkedInsPolicies.reduce((sum, pol) => sum + (parseFloat(pol.premium_ip) || 0), 0);
      // Insurance inflation — use 5% default stepped
      const insInflRate = 0.05;
      const insPremVals = new Array(N).fill(0);
      const insIpDeductVals = new Array(N).fill(0);
      for (let y = 0; y < N; y++) {
        insPremVals[y] = Math.round(baseInsPremium * Math.pow(1 + insInflRate, y));
        insIpDeductVals[y] = Math.round(baseIpPremium * Math.pow(1 + insInflRate, y));
      }

      // ── Expenses ──
      const adminAudit = 0; // placeholder
      const totalExpenseVals = deductibleIntVals.map((di, y) => di + adminAudit + insPremVals[y]);

      // ── Contributions / Drawdowns ──
      const gross = parseFloat(client?.employment_income) || 0;
      const incPct = parseFloat(ctx.engineData.assumptionsSummary?.income_growth) || 3;
      const superInc = client?.super_included;
      const baseSal = superInc === "1" ? gross / (1 + sgRate) : gross;
      const salSac = parseFloat(acc.salary_sacrifice) || 0;
      const annualDrawdown = parseFloat(acc.pension_drawdown) || 0;
      const sgVals = new Array(N).fill(0);
      const salSacVals = new Array(N).fill(0);
      const contribCC = new Array(N).fill(0);
      const drawdownVals = new Array(N).fill(0);
      let sal = baseSal;
      // Strategy 270: work hours reduction for SG calc
      const _s270r2 = (ctx.isAdviceModel ? (ctx.engineData.advice_request?.strategy?.strategies || []) : [])
        .filter(s => s.strategy_id === "270" && s.owner_id === (isC1 ? "client1" : "client2"));
      for (let y = 0; y < N; y++) {
        let salAdj = sal;
        _s270r2.forEach(s => {
          const pct = (parseFloat(s.reduction_pct) || 0) / 100;
          const sy = Math.max(0, (parseInt(s.start_year) || ctx.currentFY) - ctx.currentFY);
          const ey = s.end_year === "Ongoing" ? N - 1 : Math.min(N - 1, (parseInt(s.end_year) || ctx.currentFY + N) - ctx.currentFY);
          if (pct > 0 && pct <= 1 && y >= sy && y <= ey) salAdj = Math.round(salAdj * (1 - pct));
        });
        if (isPension) {
          drawdownVals[y] = annualDrawdown;
        } else {
          sgVals[y] = Math.round(salAdj * sgRate);
          const totalCC = Math.min(30000, sgVals[y] + salSac);
          salSacVals[y] = totalCC - sgVals[y];
          contribCC[y] = totalCC;
        }
        sal *= (1 + incPct / 100);
      }

      // ── Tax ──
      const grossIncome = totalIncomeForTax; // tax uses franking-inclusive income
      // Deductions: interest + IP premiums (IP is tax-deductible for SMSF)
      const totalDeductions = totalExpenseVals.map((exp, y) => deductibleIntVals[y] + adminAudit + insIpDeductVals[y]);
      const taxableIncome = grossIncome.map((inc, y) => Math.max(0, inc - totalDeductions[y]));
      const grossTax = taxableIncome.map(ti => Math.round(ti * taxRate));
      const frankingOffset = isPension ? zeros.slice() : frankingVals.slice();
      const netTax = grossTax.map((gt, y) => gt - frankingOffset[y]);
      const afterTaxIncome = grossIncome.map((inc, y) => inc - totalExpenseVals[y] - Math.max(0, netTax[y]));

      // ── Surplus ──
      // Strategy 190: deduct property purchase if targeting this segregated account
      const strat190PurchaseAcct = new Array(N).fill(0);
      if (ctx.isAdviceModel) {
        const accRef = `smsf_${smsfIdx}_${ai}`;
        (ctx.engineData.strategies || []).filter(s => s.strategy_id === "190" && s.smsf_ref === accRef).forEach(s190 => {
          const currentFYSeg = new Date().getFullYear();
          const yIdx = (parseInt(s190.transfer_year) || currentFYSeg) - currentFYSeg;
          if (yIdx >= 0 && yIdx < N) {
            const propVal = parseFloat(ctx.ffAssets[parseInt(s190.property_idx)]?.a_value) || 0;
            const pct = (parseFloat(s190.transfer_pct) || 100) / 100;
            const price = s190.purchase_price_override === "1" ? (parseFloat(s190.purchase_price) || 0) : Math.round(propVal * pct);
            const txnCost = Math.round(price * ((parseFloat(s190.transaction_costs_pct) || 0) / 100));
            strat190PurchaseAcct[yIdx] += price + txnCost;
          }
        });
      }
      const surplusVals = afterTaxIncome.map((v, y) => v - strat190PurchaseAcct[y]);
      const contribNet = isPension ? drawdownVals.map(v => -v) : contribCC;

      // ── Balance tracking ──
      const openBal = parseFloat(acc.balance) || 0;
      let runBal = openBal;
      let runTF = parseFloat(acc.tax_free_amt) || 0;
      let runTX = openBal - runTF;
      const openBalArr = [], closingBalArr = [];
      const tfArr = [], txArr = [], tfPctArr = [];
      const startingVals = new Array(N).fill(0);
      const endValueInitial = new Array(N).fill(0);

      for (let y = 0; y < N; y++) {
        openBalArr.push(Math.round(runBal));
        startingVals[y] = Math.round(runBal);
        const contrib = contribCC[y];
        const drawdown = drawdownVals[y];
        const surplus = surplusVals[y];

        // Drawdowns reduce proportionally
        if (drawdown > 0 && runBal > 0) {
          const tfProp = runTF / (runTF + runTX || 1);
          const drawTF = Math.round(drawdown * tfProp);
          runTF -= drawTF;
          runTX -= (drawdown - drawTF);
        }
        // CC after contributions tax → taxable
        if (contrib > 0) {
          const cTax = Math.round(contrib * smsfTaxRate);
          runTX += (contrib - cTax);
        }
        // Surplus → taxable
        runTX += surplus;

        // Sell proceeds add to balance (taxable component)
        if (accSellProceeds[y] > 0) {
          runTX += accSellProceeds[y];
        }

        runBal = runBal + contrib - drawdown + surplus + accSellProceeds[y];
        closingBalArr.push(Math.round(runBal));
        endValueInitial[y] = Math.round(runBal);

        if (runTX < 0) { runTF += runTX; runTX = 0; }
        if (runTF < 0) { runTX += runTF; runTF = 0; }
        tfArr.push(Math.round(runTF));
        txArr.push(Math.round(runTX));
        const total = runTF + runTX;
        tfPctArr.push(total > 0 ? Math.round(runTF / total * 10000) / 100 : 0);
      }

      const netWorth = totalAssets.map((a, y) => a + debtBalances[y]);

      return {
        clientName, isPension, accId, taxRate, openBal,
        accAssets, accDebts, accSellProceeds, accSellSOY, accSellEOY,
        propValues, otherValues, totalAssets, debtBalances, netWorth,
        rentalIncVals, investIncVals, frankingVals, totalIncome, totalIncomeForTax,
        deductibleIntVals, debtRepayVals, totalExpenseVals,
        insPremVals, insIpDeductVals,
        sgVals, salSacVals, contribCC, drawdownVals, contribNet,
        taxableIncome, grossTax, frankingOffset, netTax, afterTaxIncome, surplusVals,
        openBalArr, closingBalArr, startingVals, endValueInitial,
        tfArr, txArr, tfPctArr,
      };
    });

    // ── Fund-level summary ──
    const totalFundBal = new Array(N).fill(0);
    acctResults.forEach(r => { r.closingBalArr.forEach((v, y) => { totalFundBal[y] += v; }); });
    const fundTotalAssets = new Array(N).fill(0);
    const fundTotalDebt = new Array(N).fill(0);
    acctResults.forEach(r => {
      r.totalAssets.forEach((v, y) => { fundTotalAssets[y] += v; });
      r.debtBalances.forEach((v, y) => { fundTotalDebt[y] += v; });
    });
    const fundNetWorth = fundTotalAssets.map((a, y) => a + fundTotalDebt[y]);

    const memberBalanceRows = acctResults.map(r => ({
      label: `${r.clientName} (${r.isPension ? "Pension" : "Accumulation"})`,
      values: r.closingBalArr, style: "child", entity: r.clientName,
    }));

    // Fund summary data
    const data = { years: ctx.shortYears, sections: [
      { id: "smsf-header", rows: [{ label: "Year", values: ctx.shortYears.map((_, i) => i + 1), style: "header" }] },
      { id: "smsf-d1", isDivider: true },
      { id: "smsf-label", isSectionHeader: true, title: "Fund Summary", subtitle: `Segregated — ${M} accounts, each with own assets & debts`, icon: "🔒", bg: "var(--ps-surface-green)", border: "var(--ps-ring-emerald)" },
      { id: "smsf-d1b", isDivider: true },
      // Per-account summary
      ...acctResults.flatMap((r, ai) => {
        const envLabel = r.isPension ? "Pension" : "Accumulation";
        const assetList = r.accAssets.map(a => a.a_name || "Asset").join(", ");
        return [
          { id: `smsf-seg-${ai}-hdr`, isSectionHeader: true, title: `${r.clientName} — ${envLabel}`, subtitle: assetList || "No assets", icon: r.isPension ? "🏖️" : "💼", bg: r.isPension ? "var(--ps-surface-orange)" : "var(--ps-surface-sky)", border: r.isPension ? "var(--ps-ring-orange)" : "var(--ps-ring-sky)" },
          { id: `smsf-seg-${ai}-sum`, rows: [
            { label: "Opening Balance", values: r.openBalArr, style: "current-value" },
            { label: "Closing Balance", values: r.closingBalArr, style: "end-value" },
            { label: "Tax-Free Component", values: r.tfArr, style: "child" },
            { label: "Taxable Component", values: r.txArr, style: "child" },
            { label: "Tax-Free %", values: r.tfPctArr, style: "child", format: "pct" },
          ]},
          { id: `smsf-seg-${ai}-d`, isDivider: true },
        ];
      }),
      // Fund totals
      { id: "smsf-totals", title: "Fund Total", rows: [
        ...memberBalanceRows,
        { label: "Total Fund Balance", values: totalFundBal, style: "highlight" },
      ]},
      { id: "smsf-d-nw", isDivider: true },
      { id: "smsf-nw", title: "Net Worth", rows: [
        { label: "Total Assets", values: fundTotalAssets, style: "child" },
        ...(fundTotalDebt.some(v => v < 0) ? [{ label: "Total Debt", values: fundTotalDebt, style: "child-negative" }] : []),
        { label: "Net Worth", values: fundNetWorth, style: "highlight" },
      ]},
    ]};

    // Stacked chart
    const memberChartData = ctx.shortYears.map((year, y) => {
      const obj = { year };
      acctResults.forEach(r => {
        const envLabel = r.isPension ? "Pen" : "Acc";
        obj[`${r.clientName} (${envLabel})`] = r.closingBalArr[y];
      });
      return obj;
    });
    const memberChartKeys = acctResults.map(r => `${r.clientName} (${r.isPension ? "Pen" : "Acc"})`);
    const memberChartColors = ["#6366F1", "#F59E0B", "#0EA5E9", "#10B981", "#EC4899", "#8B5CF6"];

    return {
      data, name: smsf.smsf_name, acctType: "segregated",
      acctResults, shortYears: ctx.shortYears, totalFundBal,
      memberChartData: { data: memberChartData, keys: memberChartKeys, colors: memberChartColors },
      // Compatibility fields (not used for segregated rendering)
      memberData: acctResults.map(r => ({ clientName: r.clientName, startBal: r.openBal, taxEnv: r.isPension ? "pension" : "accumulation" })),
      mClosingBal: acctResults.map(r => r.closingBalArr),
      mFinalPct: acctResults.map(() => zeros),
    };
};

export const buildSMSFData = (ctx, smsfIdx) => {
    const smsf = (ctx.engineData.smsfs || [])[smsfIdx];
    if (!smsf) return null;
    if (smsf.acct_type === "segregated") return buildSegregatedSMSFData(ctx, smsfIdx);
    const N = ctx.N_YEARS;
    const { newDebtDrawdowns = {} } = ctx;
    const smsfId = `smsf_${smsfIdx}`;
    const aa = ctx.engineData.assetAssumptions || {};
    const smsfAssets = (ctx.engineData.assets || []).filter(a => a.a_owner === smsfId);
    const smsfDebts = (ctx.engineData.liabilities || []).filter(d => d.d_owner === smsfId);
    const smsfTaxRate = 0.15;
    const zeros = new Array(N).fill(0);

    // Sell proceeds for this SMSF — split by timing
    const smsfSellSOY = new Array(N).fill(0);
    const smsfSellEOY = new Array(N).fill(0);
    const currentFYSmsf = new Date().getFullYear();
    if (ctx.isAdviceModel) {
      (ctx.engineData.advice_request?.transactions?.sell || []).forEach(s => {
        if (s.entity_type !== "5") return;
        if (s.owner_id !== smsfId && !s.owner_id?.startsWith(`smsf_${smsfIdx}_`)) return;
        const assetIdx = parseInt(s.asset_idx);
        const asset = !isNaN(assetIdx) ? ctx.ffAssets[assetIdx] : null;
        if (!asset) return;
        const sellYear = parseInt(s.sell_year) || currentFYSmsf;
        const yIdx = sellYear - currentFYSmsf;
        if (yIdx < 0 || yIdx >= N) return;
        const currentVal = parseFloat(asset.a_value) || 0;
        const sellAmt = s.sell_entire_amount ? currentVal : Math.min(parseFloat(s.amount) || 0, currentVal);
        const txnCostPct = (parseFloat(s.transaction_costs_pct) || 0) / 100;
        const proceeds = Math.round(sellAmt * (1 - txnCostPct));
        if (s.sell_timing === "end") smsfSellEOY[yIdx] += proceeds; else smsfSellSOY[yIdx] += proceeds;
      });
    }
    const smsfSellProceeds = smsfSellSOY.map((v, y) => v + smsfSellEOY[y]);

    // Asset projections
    const propValues = new Array(N).fill(0);
    const otherValues = new Array(N).fill(0);
    const rentalIncVals = new Array(N).fill(0);
    const investIncVals = new Array(N).fill(0);
    const frankingVals = new Array(N).fill(0);

    smsfAssets.filter(a => a.a_type === "18" || a.a_type === "21").forEach(a => {
      let val = parseFloat(a.a_value) || 0;
      const weeklyRent = parseFloat(a.a_rental_income) || 0;
      const rentFreq = parseFloat(a.a_rental_freq) || 52;
      let annualRent = weeklyRent * rentFreq;
      const gr = (aa["18"]?.growthRate ?? 3) / 100;
      const iy = (aa["18"]?.incomeYield ?? 4.36) / 100;
      for (let y = 0; y < N; y++) {
        propValues[y] += Math.round(val);
        rentalIncVals[y] += annualRent > 0 ? Math.round(annualRent) : Math.round(val * iy);
        val *= (1 + gr);
        if (annualRent > 0) annualRent *= (1 + gr);
      }
    });
    smsfAssets.filter(a => a.a_type !== "18" && a.a_type !== "21").forEach(a => {
      let val = parseFloat(a.a_value) || 0;
      const typeDef = aa[a.a_type] || {};
      const gr = (typeDef.growthRate ?? 5) / 100;
      const iy = (typeDef.incomeYield ?? 0) / 100;
      const frankPct = (typeDef.frankingPct ?? 0) / 100; // % of dividends that are franked
      const companyTaxRate = 0.30;
      for (let y = 0; y < N; y++) {
        otherValues[y] += Math.round(val);
        const income = Math.round(val * iy);
        investIncVals[y] += income;
        // Franking credit = franked portion × (company tax / (1 - company tax))
        const frankedAmt = Math.round(income * frankPct);
        const frankingCredit = Math.round(frankedAmt * companyTaxRate / (1 - companyTaxRate));
        frankingVals[y] += frankingCredit;
        val *= (1 + gr);
      }
    });
    const totalAssets = propValues.map((p, y) => p + otherValues[y]);

    // Debt projections
    const debtBalances = new Array(N).fill(0);
    const debtRepayVals = new Array(N).fill(0);
    const deductibleIntVals = new Array(N).fill(0);
    smsfDebts.forEach(d => {
      let bal = parseFloat(d.d_balance) || 0;
      const rate = (parseFloat(d.d_rate) || 0) / 100;
      const freq = parseFloat(d.d_freq) || 12;
      const isIO = d.d_io === "1";
      const statedRepay = parseFloat(d.d_repayments) || 0;
      const termYears = parseFloat(d.d_term) || 30;
      const periodicRate = rate / freq;
      const totalPeriods = termYears * freq;
      let minRepay = 0;
      if (!isIO && bal > 0 && periodicRate > 0 && totalPeriods > 0) minRepay = bal * periodicRate / (1 - Math.pow(1 + periodicRate, -totalPeriods));
      const annualRepay = isIO ? Math.round(bal * rate) : Math.round(Math.max(statedRepay, minRepay) * freq);
      for (let y = 0; y < N; y++) {
        if (bal <= 0) continue;
        const interest = Math.round(bal * rate);
        deductibleIntVals[y] += interest;
        const principal = isIO ? 0 : Math.min(bal, annualRepay - interest);
        debtRepayVals[y] += annualRepay;
        bal = Math.max(0, bal - principal);
        debtBalances[y] += -Math.round(bal);
      }
    });

    // Contributions from members — detailed breakdown
    const accounts = smsf.accounts || [];
    const sgRate = 0.12;
    const contribVals = new Array(N).fill(0);
    const drawdownVals = new Array(N).fill(0);
    const memberContribRows = [];
    const memberDetail = []; // per-member SG, salSac, insurance, drawdown etc.
    accounts.forEach(acc => {
      const isC1 = acc.owner === "client1";
      const client = isC1 ? ctx.engineData.client1 : ctx.engineData.client2;
      const clientName = ((client?.first_name || "") + " " + (client?.last_name || "")).trim();
      const isPension = acc.tax_environment === "pension";
      const gross = parseFloat(client?.employment_income) || 0;
      const incPct = parseFloat(ctx.engineData.assumptionsSummary?.income_growth) || 3;
      const superInc = client?.super_included;
      const baseSal = superInc === "1" ? gross / (1 + sgRate) : gross;
      const salSac = parseFloat(acc.salary_sacrifice) || 0;
      const afterTaxContrib = parseFloat(acc.after_tax) || 0;
      const annualDrawdown = parseFloat(acc.pension_drawdown) || 0;
      // Retirement year for this member
      const memberRetAge = parseFloat(ctx.engineData.advice_reason?.quick?.[isC1 ? "client1" : "client2"]?.ret_age) || 67;
      const memberDob = client?.date_of_birth;
      const memberAgeNow = memberDob ? (() => {
        const d = new Date(memberDob); const n = new Date(ctx.currentFY, 6, 1); // 1 July of current FY
        let a = n.getFullYear() - d.getFullYear();
        if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
        return a;
      })() : 60;
      const memberRetYr = Math.max(0, memberRetAge - memberAgeNow);
      const sgVals = new Array(N).fill(0);
      const salSacVals = new Array(N).fill(0);
      const personalDeductVals = new Array(N).fill(0);
      const nccVals = new Array(N).fill(0);
      const insuranceVals = new Array(N).fill(0);
      const drawdownMemberVals = new Array(N).fill(0);
      const memberVals = new Array(N).fill(0);
      let sal = baseSal;
      // Strategy 270: work hours reduction for SG calc
      const _s270r1 = (ctx.isAdviceModel ? (ctx.engineData.advice_request?.strategy?.strategies || []) : [])
        .filter(s => s.strategy_id === "270" && s.owner_id === (isC1 ? "client1" : "client2"));
      for (let y = 0; y < N; y++) {
        let salAdj = sal;
        _s270r1.forEach(s => {
          const pct = (parseFloat(s.reduction_pct) || 0) / 100;
          const sy = Math.max(0, (parseInt(s.start_year) || ctx.currentFY) - ctx.currentFY);
          const ey = s.end_year === "Ongoing" ? N - 1 : Math.min(N - 1, (parseInt(s.end_year) || ctx.currentFY + N) - ctx.currentFY);
          if (pct > 0 && pct <= 1 && y >= sy && y <= ey) salAdj = Math.round(salAdj * (1 - pct));
        });
        if (isPension) {
          // Pension accounts: no contributions, has drawdowns
          drawdownMemberVals[y] = annualDrawdown;
          drawdownVals[y] += annualDrawdown;
        } else {
          // Accumulation accounts: contributions stop at retirement (SG + salary sacrifice)
          const retired = y >= memberRetYr;
          sgVals[y] = retired ? 0 : Math.round(salAdj * sgRate);
          const totalCC = Math.min(30000, sgVals[y] + (retired ? 0 : salSac));
          salSacVals[y] = totalCC - sgVals[y];
          nccVals[y] = afterTaxContrib;
          memberVals[y] = totalCC;
          contribVals[y] += totalCC;
        }
        sal *= (1 + incPct / 100);
      }
      memberContribRows.push({ label: clientName, values: memberVals, style: "child" });
      memberDetail.push({ clientName, sgVals, salSacVals, personalDeductVals, nccVals, insuranceVals, concVals: memberVals, drawdownVals: drawdownMemberVals, isPension });
    });

    // Income — cashflow excludes franking credits and capital gains (tax concepts only)
    const totalIncome = rentalIncVals.map((r, y) => r + investIncVals[y]);
    const totalIncomeForTax = rentalIncVals.map((r, y) => r + investIncVals[y] + frankingVals[y]); // includes franking for tax statement
    const totalExpenseVals = debtRepayVals.map((dr, y) => dr + deductibleIntVals[y]);

    // Strategy 190: SMSF purchase of business real property — deduct purchase price from cash
    const strat190PurchaseVals = new Array(N).fill(0);
    if (ctx.isAdviceModel) {
      (ctx.engineData.strategies || []).filter(s => s.strategy_id === "190").forEach(s190 => {
        const smsfRef = s190.smsf_ref || "";
        // Check if this strategy targets this SMSF
        if (smsfRef === smsfId || smsfRef.startsWith(smsfId + "_")) {
          const yIdx = (parseInt(s190.transfer_year) || currentFYSmsf) - currentFYSmsf;
          if (yIdx >= 0 && yIdx < N) {
            const propVal = parseFloat(ctx.ffAssets[parseInt(s190.property_idx)]?.a_value) || 0;
            const pct = (parseFloat(s190.transfer_pct) || 100) / 100;
            const price = s190.purchase_price_override === "1" ? (parseFloat(s190.purchase_price) || 0) : Math.round(propVal * pct);
            const txnCost = Math.round(price * ((parseFloat(s190.transaction_costs_pct) || 0) / 100));
            strat190PurchaseVals[yIdx] += price + txnCost;
          }
        }
      });
    }

    const surplusVals = totalIncome.map((inc, y) => inc + contribVals[y] - drawdownVals[y] - totalExpenseVals[y] - strat190PurchaseVals[y]);

    // Cashflow
    const endValueInitial = new Array(N).fill(0);
    for (let y = 0; y < N; y++) {
      endValueInitial[y] = (y === 0 ? 0 : endValueInitial[y - 1]) + surplusVals[y];
    }
    const startingVals = new Array(N).fill(0);
    for (let y = 1; y < N; y++) { startingVals[y] = endValueInitial[y - 1]; }

    // Tax — ECPI (Exempt Current Pension Income)
    // Pension proportion of fund = sum of pension member balances / total fund balance
    // Income × pension % = exempt (0% tax)
    // Income × accumulation % = taxable at 15%
    // Franking credits: gross up assessable income, then claimed as refundable offset
    const pensionPctOfFund = new Array(N).fill(0);
    const ecpiVals = new Array(N).fill(0);
    const taxableIncome = new Array(N).fill(0);
    const grossTax = new Array(N).fill(0);
    const frankingOffset = new Array(N).fill(0);
    const taxPayable = new Array(N).fill(0);
    const afterTaxIncome = new Array(N).fill(0);

    const initBals = accounts.map(acc => parseFloat(acc.balance) || 0);
    let estBals = [...initBals];
    for (let y = 0; y < N; y++) {
      const totalBal = estBals.reduce((s, b) => s + b, 0);
      let pensionBal = 0;
      accounts.forEach((acc, ai) => {
        if (acc.tax_environment === "pension") pensionBal += estBals[ai];
      });
      pensionPctOfFund[y] = totalBal > 0 ? Math.round(pensionBal / totalBal * 10000) / 100 : 0;
      const pensionPct = totalBal > 0 ? pensionBal / totalBal : 0;
      const grossIncome = totalIncomeForTax[y] - deductibleIntVals[y];
      ecpiVals[y] = Math.round(grossIncome * pensionPct);
      taxableIncome[y] = Math.max(0, grossIncome - ecpiVals[y]);
      grossTax[y] = Math.round(taxableIncome[y] * smsfTaxRate);
      // Franking credits offset — only accumulation portion's franking is used
      // (pension portion's franking generates a refund too in practice, but simplifying)
      frankingOffset[y] = frankingVals[y];
      taxPayable[y] = grossTax[y] - frankingOffset[y]; // can go negative (refund)
      afterTaxIncome[y] = grossIncome - Math.max(0, taxPayable[y]);

      // Rough estimate: advance balances for next year's pension % calc
      for (let m = 0; m < accounts.length; m++) {
        const pct = totalBal > 0 ? estBals[m] / totalBal : 0;
        const mReturn = Math.round(afterTaxIncome[y] * pct);
        const mContrib = memberDetail[m]?.concVals[y] || 0;
        const mDrawdown = memberDetail[m]?.drawdownVals[y] || 0;
        estBals[m] = estBals[m] + mContrib - mDrawdown + mReturn;
      }
    }

    // ── 5-Step Member Balance Tracking ──
    const fundBalance = parseFloat(smsf.smsf_balance) || 0;
    const M = accounts.length;
    const memberData = accounts.map((acc, ai) => {
      const isC1 = acc.owner === "client1";
      const client = isC1 ? ctx.engineData.client1 : ctx.engineData.client2;
      const clientName = ((client?.first_name || "") + " " + (client?.last_name || "")).trim();
      const startBal = parseFloat(acc.balance) || Math.round(fundBalance * (parseFloat(acc.fund_percentage) || 0) / 100);
      const taxEnv = acc.tax_environment || "accumulation";
      return { clientName, startBal, taxEnv, accIdx: ai };
    });

    // Per-member per-year tracking arrays
    const mOpenBal = memberData.map(() => new Array(N).fill(0));
    const mOpenPct = memberData.map(() => new Array(N).fill(0));
    // Step 2: after start-of-year inflows/outflows
    const mSOYInflows = memberData.map(() => new Array(N).fill(0));  // asset proceeds, NCC, rollovers in
    const mSOYOutflows = memberData.map(() => new Array(N).fill(0)); // asset purchases, rollovers out, withdrawals
    const mRevisedBal = memberData.map(() => new Array(N).fill(0));
    const mRevisedPct = memberData.map(() => new Array(N).fill(0));
    // Step 3: member-specific during year
    const mContribCC = memberData.map(() => new Array(N).fill(0));   // concessional contributions
    const mInsurance = memberData.map(() => new Array(N).fill(0));   // insurance premiums
    const mPostContribBal = memberData.map(() => new Array(N).fill(0));
    const mPostContribPct = memberData.map(() => new Array(N).fill(0));
    // Step 4: shared allocation
    const mReturnShare = memberData.map(() => new Array(N).fill(0)); // investment returns allocated
    const mExpenseShare = memberData.map(() => new Array(N).fill(0)); // fund expenses allocated
    const mTaxShare = memberData.map(() => new Array(N).fill(0));    // tax allocated
    const mEndInitBal = memberData.map(() => new Array(N).fill(0));
    const mEndInitPct = memberData.map(() => new Array(N).fill(0));
    // Step 5: end of year adjustments
    const mDrawdown = memberData.map(() => new Array(N).fill(0));
    const mEOYNCC = memberData.map(() => new Array(N).fill(0));
    const mEOYWithdrawals = memberData.map(() => new Array(N).fill(0));
    const mClosingBal = memberData.map(() => new Array(N).fill(0));
    const mFinalPct = memberData.map(() => new Array(N).fill(0));
    // Tax components
    const mTaxFree = memberData.map(() => new Array(N).fill(0));
    const mTaxable = memberData.map(() => new Array(N).fill(0));
    const mTaxFreePct = memberData.map(() => new Array(N).fill(0));

    const totalMemberBal = new Array(N).fill(0);

    // Running balances and components
    const bals = memberData.map(m => m.startBal);
    const runTF = accounts.map(acc => parseFloat(acc.tax_free_amt) || 0);
    const runTX = memberData.map((m, i) => m.startBal - runTF[i]);

    for (let y = 0; y < N; y++) {
      // ── Step 1: Opening ──
      const totalOpen = bals.reduce((s, b) => s + b, 0);
      for (let m = 0; m < M; m++) {
        mOpenBal[m][y] = Math.round(bals[m]);
        mOpenPct[m][y] = totalOpen > 0 ? Math.round(bals[m] / totalOpen * 10000) / 100 : 0;
      }

      // ── Step 2: Start-of-year inflows/outflows ──
      for (let m = 0; m < M; m++) {
        // Rollovers out reduce proportionally
        if (mSOYOutflows[m][y] > 0 && bals[m] > 0) {
          const tfProp = runTF[m] / (runTF[m] + runTX[m] || 1);
          const outTF = Math.round(mSOYOutflows[m][y] * tfProp);
          runTF[m] -= outTF;
          runTX[m] -= (mSOYOutflows[m][y] - outTF);
        }
        // Rollovers in — assume proportional (simplified)
        if (mSOYInflows[m][y] > 0) {
          runTX[m] += mSOYInflows[m][y]; // simplified: treat as taxable
        }
        bals[m] = bals[m] + mSOYInflows[m][y] - mSOYOutflows[m][y];
        mRevisedBal[m][y] = Math.round(bals[m]);
      }
      const totalRevised = bals.reduce((s, b) => s + b, 0);
      for (let m = 0; m < M; m++) {
        mRevisedPct[m][y] = totalRevised > 0 ? Math.round(bals[m] / totalRevised * 10000) / 100 : 0;
      }

      // ── Step 3: Member-specific during year ──
      for (let m = 0; m < M; m++) {
        const det = memberDetail[m];
        if (det?.isPension) {
          mContribCC[m][y] = 0;
          mDrawdown[m][y] = det.drawdownVals[y] || 0;
          mInsurance[m][y] = det.insuranceVals[y] || 0;
          // Drawdowns reduce proportionally
          if (mDrawdown[m][y] > 0 && bals[m] > 0) {
            const tfProp = runTF[m] / (runTF[m] + runTX[m] || 1);
            const drawTF = Math.round(mDrawdown[m][y] * tfProp);
            runTF[m] -= drawTF;
            runTX[m] -= (mDrawdown[m][y] - drawTF);
          }
          // Insurance reduces taxable
          runTX[m] -= mInsurance[m][y];
          bals[m] = bals[m] - mDrawdown[m][y] - mInsurance[m][y];
        } else {
          mContribCC[m][y] = det?.concVals[y] || 0;
          mDrawdown[m][y] = 0;
          mInsurance[m][y] = det?.insuranceVals[y] || 0;
          // Concessional contributions (after 15% contributions tax) → taxable
          const contribTax = Math.round(mContribCC[m][y] * smsfTaxRate);
          runTX[m] += (mContribCC[m][y] - contribTax);
          // Insurance reduces taxable
          runTX[m] -= mInsurance[m][y];
          bals[m] = bals[m] + mContribCC[m][y] - mInsurance[m][y];
        }
        mPostContribBal[m][y] = Math.round(bals[m]);
      }
      const totalPostContrib = bals.reduce((s, b) => s + b, 0);
      for (let m = 0; m < M; m++) {
        mPostContribPct[m][y] = totalPostContrib > 0 ? Math.round(bals[m] / totalPostContrib * 10000) / 100 : 0;
      }

      // ── Step 4: Shared allocation by post-contribution % ──
      const fundExpenses = 0;
      for (let m = 0; m < M; m++) {
        const pct = totalPostContrib > 0 ? bals[m] / totalPostContrib : 0;
        mReturnShare[m][y] = Math.round(totalIncome[y] * pct);
        mExpenseShare[m][y] = Math.round(fundExpenses * pct);
        mTaxShare[m][y] = Math.round(taxPayable[y] * pct);
        const netShared = mReturnShare[m][y] - mExpenseShare[m][y] - mTaxShare[m][y];
        // Investment returns and expenses → taxable component
        runTX[m] += netShared;
        bals[m] = bals[m] + netShared;
        mEndInitBal[m][y] = Math.round(bals[m]);
      }
      const totalEndInit = bals.reduce((s, b) => s + b, 0);
      for (let m = 0; m < M; m++) {
        mEndInitPct[m][y] = totalEndInit > 0 ? Math.round(bals[m] / totalEndInit * 10000) / 100 : 0;
      }

      // ── Step 5: End of year adjustments (NCC, withdrawals) ──
      for (let m = 0; m < M; m++) {
        // NCC → tax-free component
        runTF[m] += mEOYNCC[m][y];
        // Withdrawals reduce proportionally
        if (mEOYWithdrawals[m][y] > 0 && bals[m] > 0) {
          const tfProp = runTF[m] / (runTF[m] + runTX[m] || 1);
          const wdTF = Math.round(mEOYWithdrawals[m][y] * tfProp);
          runTF[m] -= wdTF;
          runTX[m] -= (mEOYWithdrawals[m][y] - wdTF);
        }
        bals[m] = bals[m] + mEOYNCC[m][y] - mEOYWithdrawals[m][y];
        mClosingBal[m][y] = Math.round(bals[m]);
        // Clamp components
        if (runTX[m] < 0) { runTF[m] += runTX[m]; runTX[m] = 0; }
        if (runTF[m] < 0) { runTX[m] += runTF[m]; runTF[m] = 0; }
        // Store components
        mTaxFree[m][y] = Math.round(runTF[m]);
        mTaxable[m][y] = Math.round(runTX[m]);
        const total = runTF[m] + runTX[m];
        mTaxFreePct[m][y] = total > 0 ? Math.round(runTF[m] / total * 10000) / 100 : 0;
      }
      const totalClosing = bals.reduce((s, b) => s + b, 0);
      for (let m = 0; m < M; m++) {
        mFinalPct[m][y] = totalClosing > 0 ? Math.round(bals[m] / totalClosing * 10000) / 100 : 0;
      }
      totalMemberBal[y] = Math.round(totalClosing);
    }

    // Build display rows
    const memberBalanceRows = memberData.map((m, i) => ({
      label: `${m.clientName} (${m.taxEnv === "pension" ? "Pension" : "Accumulation"})`,
      values: mClosingBal[i], style: "child", entity: m.clientName,
    }));
    const memberPctRows = memberData.map((m, i) => ({
      label: `${m.clientName} %`,
      values: mFinalPct[i], style: "child", format: "pct",
    }));

    const netWorth = totalAssets.map((a, y) => a + debtBalances[y]);

    // New debt drawdowns for this SMSF
    const smsfDebtDrawdown = new Array(N).fill(0);
    const smsfDebtDrawdownAmt = newDebtDrawdowns[smsfId] || 0;
    if (smsfDebtDrawdownAmt > 0) smsfDebtDrawdown[0] = smsfDebtDrawdownAmt;

    const data = { years: ctx.shortYears, sections: [
      { id: "smsf-header", rows: [{ label: "Year", values: ctx.shortYears.map((_, i) => i + 1), style: "header" }] },
      { id: "smsf-divider-1", isDivider: true },
      // ══ CASHFLOW STATEMENT ══
      { id: "smsf-cashflow-header", isSectionHeader: true, title: "Cashflow Statement", subtitle: "Fund-level cash movements", icon: "💰", bg: "var(--ps-surface-green)", border: "var(--ps-ring-emerald)" },
      { id: "smsf-divider-1b", isDivider: true },
      { id: "smsf-cashflow", title: "Cashflow", rows: [
        { label: "Starting Value", values: startingVals, style: "current-value" },
      ]},
      { id: "smsf-inflows", title: "Inflows", rows: [
        ...memberContribRows.map(r => ({ ...r, label: `Contributions — ${r.label}` })),
        ...(smsfSellSOY.some(v => v > 0) ? [{ label: "Asset Sale Proceeds", values: smsfSellSOY, style: "child" }] : []),
        ...(smsfDebtDrawdown.some(v => v > 0) ? [{ label: "Debt Drawdown", values: smsfDebtDrawdown, style: "child" }] : []),
        { label: "Total Contributions", values: contribVals, style: "total" },
      ]},
      { id: "smsf-outflows", title: "Outflows", rows: [
        { label: "Pension Drawdowns", values: zeros, style: "child-negative" },
        { label: "Lump Sum Withdrawals", values: zeros, style: "child-negative" },
        ...(strat190PurchaseVals.some(v => v > 0) ? [{ label: "Property Purchase (Strat 190)", values: strat190PurchaseVals.map(v => -v), style: "child-negative" }] : []),
      ]},
      { id: "smsf-revised", rows: [
        { label: "Revised Value", values: startingVals.map((s, y) => s + contribVals[y] + smsfSellSOY[y] + smsfDebtDrawdown[y]), style: "highlight" },
      ]},
      { id: "smsf-divider-2", isDivider: true },
      // ── Income ──
      { id: "smsf-income", title: "Income", rows: [
        ...(rentalIncVals.some(v => v > 0) ? [{ label: "Rental Income", values: rentalIncVals, style: "child" }] : []),
        ...(investIncVals.some(v => v > 0) ? [{ label: "Investment Income (Dividends/Interest)", values: investIncVals, style: "child" }] : []),
        { label: "Total Income", values: totalIncome, style: "total" },
      ]},
      // ── Expenses ──
      { id: "smsf-expenses", title: "Expenses", rows: [
        ...(debtRepayVals.some(v => v > 0) ? [{ label: "Debt Repayments", values: debtRepayVals.map(v => -v), style: "child-negative" }] : []),
        ...(deductibleIntVals.some(v => v > 0) ? [{ label: "Interest Expense", values: deductibleIntVals.map(v => -v), style: "child-negative" }] : []),
        { label: "Admin & Audit Fees", values: zeros, style: "child-negative" },
        { label: "Insurance Premiums", values: zeros, style: "child-negative" },
        { label: "Total Expenses", values: totalExpenseVals.map(v => -v), style: "total" },
      ]},
      { id: "smsf-surplus", rows: [
        { label: "Surplus", values: surplusVals, style: "highlight" },
      ]},
      { id: "smsf-divider-3", isDivider: true },
      // ── End of Year ──
      { id: "smsf-end-values", title: "End of Year Adjustments", rows: [
        { label: "End Value (Initial)", values: endValueInitial, style: "subtotal" },
        ...(smsfSellEOY.some(v => v > 0) ? [{ label: "Asset Sale Proceeds", values: smsfSellEOY, style: "child" }] : []),
        { label: "Asset Revaluation", values: zeros, style: "child" },
        { label: "End Value", values: endValueInitial.map((v, y) => v + smsfSellEOY[y]), style: "end-value" },
      ]},
      { id: "smsf-divider-4", isDivider: true },
      // ══ TAX STATEMENT ══
      { id: "smsf-tax-statement-header", isSectionHeader: true, title: "Tax Statement", subtitle: "ECPI applies — pension income is tax-exempt", icon: "🏛️", bg: "var(--ps-surface-indigo)", border: "var(--ps-ring-indigo)" },
      { id: "smsf-divider-4b", isDivider: true },
      { id: "smsf-tax", title: "Assessable Income", rows: [
        ...(rentalIncVals.some(v => v > 0) ? [{ label: "Rental Income", values: rentalIncVals, style: "child" }] : []),
        ...(investIncVals.some(v => v > 0) ? [{ label: "Investment Income (Dividends/Interest)", values: investIncVals, style: "child" }] : []),
        ...(frankingVals.some(v => v > 0) ? [{ label: "Franking Credits", values: frankingVals, style: "child" }] : []),
        { label: "Capital Gain (Discounted)", values: zeros, style: "child" },
        { label: "Total Fund Income", values: totalIncomeForTax, style: "total" },
      ]},
      { id: "smsf-tax-deductions", title: "Deductions", rows: [
        ...(deductibleIntVals.some(v => v > 0) ? [{ label: "Deductible Interest", values: deductibleIntVals.map(v => -v), style: "child-negative" }] : []),
        { label: "Admin & Audit Fees", values: zeros, style: "child-negative" },
        { label: "Total Deductions", values: deductibleIntVals.map(v => -v), style: "total" },
      ]},
      { id: "smsf-divider-5", isDivider: true },
      { id: "smsf-ecpi", title: "ECPI (Exempt Current Pension Income)", rows: [
        { label: "Pension % of Fund", values: pensionPctOfFund, style: "child", format: "pct" },
        { label: "Exempt Income (ECPI)", values: ecpiVals, style: "child" },
        { label: "Taxable Income (Accumulation)", values: taxableIncome, style: "subtotal" },
      ]},
      { id: "smsf-divider-5b", isDivider: true },
      { id: "smsf-tax-summary", title: "Tax Summary", rows: [
        { label: `Gross Tax (${(smsfTaxRate * 100).toFixed(0)}% on Accumulation)`, values: grossTax, style: "child" },
        ...(frankingVals.some(v => v > 0) ? [{ label: "Franking Credit Offset", values: frankingOffset, style: "child" }] : []),
        { label: "Net Tax Payable", values: taxPayable, style: "current-value" },
        { label: "After-Tax Income", values: afterTaxIncome, style: "child" },
      ]},
      { id: "smsf-divider-6", isDivider: true },
      // ── Member Balances ──
      { id: "smsf-member-balances", title: "Member Balances", rows: [
        ...memberBalanceRows,
        { label: "Total Fund Balance", values: totalMemberBal, style: "highlight" },
      ]},
      { id: "smsf-divider-6b", isDivider: true },
      { id: "smsf-member-pct", title: "Member Allocation %", rows: [
        ...memberPctRows,
      ]},
      { id: "smsf-divider-7", isDivider: true },
      // ── Net Worth ──
      { id: "smsf-net-worth", title: "Net Worth (Assets Held)", rows: [
        ...(propValues.some(v => v > 0) ? [{ label: "Property Value", values: propValues, style: "child" }] : []),
        ...(otherValues.some(v => v > 0) ? [{ label: "Other Assets", values: otherValues, style: "child" }] : []),
        { label: "Total Assets", values: totalAssets, style: "total" },
        ...(debtBalances.some(v => v < 0) ? [{ label: "Outstanding Debt", values: debtBalances, style: "child-negative" }] : []),
        { label: "Net Worth", values: netWorth, style: "highlight" },
      ]},
    ]};

    const chartData = ctx.shortYears.map((year, i) => ({
      year, netWorth: netWorth[i], totalMemberBal: totalMemberBal[i],
      taxPaid: taxPayable[i], rentalIncome: rentalIncVals[i],
      contributions: contribVals[i], taxableIncome: taxableIncome[i],
    }));
    // Member chart data for stacked area chart
    const memberChartData = ctx.shortYears.map((year, y) => {
      const obj = { year };
      memberData.forEach((m, i) => {
        const envLabel = m.taxEnv === "pension" ? "Pen" : "Acc";
        obj[`${m.clientName} (${envLabel})`] = mClosingBal[i][y];
      });
      obj.total = totalMemberBal[y];
      return obj;
    });
    const memberChartKeys = memberData.map((m) => {
      const envLabel = m.taxEnv === "pension" ? "Pen" : "Acc";
      return `${m.clientName} (${envLabel})`;
    });
    const memberChartColors = ["#6366F1", "#F59E0B", "#0EA5E9", "#10B981", "#EC4899", "#8B5CF6"];

    return { data, chartData, name: smsf.smsf_name, memberData, memberDetail, mOpenBal, mOpenPct, mSOYInflows, mSOYOutflows, mRevisedBal, mRevisedPct, mContribCC, mDrawdown, mInsurance, mPostContribBal, mPostContribPct, mReturnShare, mExpenseShare, mTaxShare, mEndInitBal, mEndInitPct, mEOYNCC, mEOYWithdrawals, mClosingBal, mFinalPct, mTaxFree, mTaxable, mTaxFreePct, totalMemberBal, shortYears: ctx.shortYears, rentalIncVals, investIncVals, frankingVals, taxableIncome, taxPayable, grossTax, frankingOffset, deductibleIntVals, totalIncome, afterTaxIncome, memberContribRows, pensionPctOfFund, ecpiVals, memberChartData: { data: memberChartData, keys: memberChartKeys, colors: memberChartColors } };
  };
