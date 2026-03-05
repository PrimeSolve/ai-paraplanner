// =========================================================================
// Trust Distribution & Company Dividend helpers (per client, per year)
// Used by Timeline, Tax, and Savings engines
// =========================================================================
// Closure dependencies: engineData, N_YEARS, isAdviceModel, currentFY

export const buildEntityDistributions = ({ engineData, N_YEARS, isAdviceModel, currentFY }) => {
  const N = N_YEARS;
  const aa = engineData.assetAssumptions || {};
  const c1Name = ((engineData.client1?.first_name || "") + " " + (engineData.client1?.last_name || "")).trim();
  const c2Name = ((engineData.client2?.first_name || "") + " " + (engineData.client2?.last_name || "")).trim();

  // Per-client arrays
  const c1TrustDist = new Array(N).fill(0);
  const c2TrustDist = new Array(N).fill(0);
  const c1CompanyDiv = new Array(N).fill(0);
  const c2CompanyDiv = new Array(N).fill(0);
  const c1FrankingCredits = new Array(N).fill(0);
  const c2FrankingCredits = new Array(N).fill(0);
  // Exit-specific: capital return (tax-free) and liquidator CGT (capital gain)
  const c1ExitCapReturn = new Array(N).fill(0);
  const c2ExitCapReturn = new Array(N).fill(0);
  const c1ExitLiqCGT = new Array(N).fill(0);
  const c2ExitLiqCGT = new Array(N).fill(0);
  // Strategy flows: dividends (20), director fees (191), Div 7A proceeds (193), capital outflows (192, 194)
  const c1StratDividend = new Array(N).fill(0);
  const c2StratDividend = new Array(N).fill(0);
  const c1StratDivFranking = new Array(N).fill(0);
  const c2StratDivFranking = new Array(N).fill(0);
  const c1DirectorFees = new Array(N).fill(0);
  const c2DirectorFees = new Array(N).fill(0);
  const c1Div7AProceeds = new Array(N).fill(0);
  const c2Div7AProceeds = new Array(N).fill(0);
  const c1Div7ARepayments = new Array(N).fill(0);
  const c2Div7ARepayments = new Array(N).fill(0);
  const c1SHLoanOutflow = new Array(N).fill(0);    // 192: cash leaving personal
  const c2SHLoanOutflow = new Array(N).fill(0);
  const c1SHLoanInterestInc = new Array(N).fill(0); // 192: interest income to personal
  const c2SHLoanInterestInc = new Array(N).fill(0);
  const c1CapInjectionOutflow = new Array(N).fill(0); // 194: cash leaving personal
  const c2CapInjectionOutflow = new Array(N).fill(0);
  const c1TrustContribOutflow = new Array(N).fill(0); // 51: personal → trust
  const c2TrustContribOutflow = new Array(N).fill(0);
  const c1TrustDrawings = new Array(N).fill(0);       // 196: trust → personal (drawings)
  const c2TrustDrawings = new Array(N).fill(0);
  const c1TrustDistPayout = new Array(N).fill(0);     // 195: trust → personal (distribution payout)
  const c2TrustDistPayout = new Array(N).fill(0);

  // Trust distributions
  (engineData.trusts || []).forEach((trust, ti) => {
    const trustId = `trust_${ti}`;
    const trustAssets = (engineData.assets || []).filter(a => a.a_owner === trustId);
    const trustDebts = (engineData.liabilities || []).filter(d => d.d_owner === trustId);

    // Project income
    const incomeVals = new Array(N).fill(0);
    const frankingVals = new Array(N).fill(0);
    trustAssets.forEach(a => {
      let val = parseFloat(a.a_value) || 0;
      const typeDef = aa[a.a_type] || {};
      const gr = (typeDef.growthRate ?? 5) / 100;
      const iy = (typeDef.incomeYield ?? 0) / 100;
      const fc = (typeDef.frankingPct ?? typeDef.frankingCredit ?? 0) / 100;
      // Property types: use rental income if available
      if (a.a_type === "18" || a.a_type === "19" || a.a_type === "20" || a.a_type === "21") {
        const weeklyRent = parseFloat(a.a_rental_income) || 0;
        const rentFreq = parseFloat(a.a_rental_freq) || 52;
        let annualRent = weeklyRent * rentFreq;
        const propGr = (aa[a.a_type]?.growthRate ?? 3) / 100;
        const propIy = (aa[a.a_type]?.incomeYield ?? 4) / 100;
        for (let y = 0; y < N; y++) {
          incomeVals[y] += annualRent > 0 ? Math.round(annualRent) : Math.round(val * propIy);
          val *= (1 + propGr);
          if (annualRent > 0) annualRent *= (1 + propGr);
        }
      } else {
        for (let y = 0; y < N; y++) {
          const inc = Math.round(val * iy);
          incomeVals[y] += inc;
          const frankedAmt = Math.round(inc * fc);
          frankingVals[y] += Math.round(frankedAmt * 0.30 / 0.70);
          val *= (1 + gr);
        }
      }
    });

    // Project deductible interest
    const deductIntVals = new Array(N).fill(0);
    trustDebts.forEach(d => {
      let bal = parseFloat(d.d_balance) || 0;
      const rate = (parseFloat(d.d_rate) || 0) / 100;
      const isIO = d.d_io === "1";
      const freq = parseFloat(d.d_freq) || 12;
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
        deductIntVals[y] += interest;
        const principal = isIO ? 0 : Math.min(bal, annualRepay - interest);
        bal = Math.max(0, bal - principal);
      }
    });

    // Taxable income = income - deductions, distributed by beneficiary %
    const taxableIncome = incomeVals.map((inc, y) => Math.max(0, inc - deductIntVals[y]));

    const _edoCfg = (engineData.advice_request?.trust_dist_override || {})[`trust_${ti}`];
    const _edoAllocs = (_edoCfg && _edoCfg.allocations) ? _edoCfg.allocations : [];

    (trust.beneficiaries || []).forEach((b, bi) => {
      const defaultPct = (parseFloat(b.benef_entitlement) || 0) / 100;
      const name = (b.benef_entity || "").trim();
      const oa = _edoAllocs[bi];
      const usePct = (_edoAllocs.length > 0 && oa) ? (parseFloat(oa.defaultPct) || 0) / 100 : defaultPct;
      const ovs = (oa && oa.overrides) ? oa.overrides : {};

      for (let y = 0; y < N; y++) {
        let dist, frank;
        if (ovs[y] !== undefined && ovs[y] !== "") {
          dist = Math.round(parseFloat(ovs[y]) || 0);
          frank = taxableIncome[y] > 0 ? Math.round(frankingVals[y] * (dist / taxableIncome[y])) : 0;
        } else {
          const pct = (_edoAllocs.length > 0 && oa) ? usePct : defaultPct;
          dist = Math.round(taxableIncome[y] * pct);
          frank = Math.round(frankingVals[y] * pct);
        }
        if (name === c1Name) { c1TrustDist[y] += dist; c1FrankingCredits[y] += frank; }
        else if (name === c2Name) { c2TrustDist[y] += dist; c2FrankingCredits[y] += frank; }
      }
    });
  });

  // Company dividends (after company tax, franked)
  (engineData.companies || []).forEach((company, ci) => {
    const companyId = `company_${ci}`;
    const companyAssets = (engineData.assets || []).filter(a => a.a_owner === companyId);
    const companyDebts = (engineData.liabilities || []).filter(d => d.d_owner === companyId);
    const companyTaxRate = (parseFloat(company.co_tax_rate) || 25) / 100;

    // Revenue: derive from P&L if available, fallback to co_profit
    const pnl = company.pnl || {};
    const pnlRevenue = parseFloat(pnl.total_revenue) || 0;
    const pnlExpenses = parseFloat(pnl.total_expenses) || 0;
    const baseProfit = pnlRevenue > 0 ? (pnlRevenue - pnlExpenses) : (parseFloat(company.co_profit) || 0);
    const revGrowth = (parseFloat(pnl.revenue_growth_rate) || 3) / 100;
    const revenueVals = new Array(N).fill(0);
    const deductIntVals = new Array(N).fill(0);
    let prof = baseProfit;
    for (let y = 0; y < N; y++) { revenueVals[y] = Math.round(prof); prof *= (1 + revGrowth); }

    companyAssets.filter(a => a.a_type === "18" || a.a_type === "21").forEach(a => {
      let val = parseFloat(a.a_value) || 0;
      const weeklyRent = parseFloat(a.a_rental_income) || 0;
      const rentFreq = parseFloat(a.a_rental_freq) || 52;
      let annualRent = weeklyRent * rentFreq;
      const gr = (aa["18"]?.growthRate ?? 3) / 100;
      const iy = (aa["18"]?.incomeYield ?? 4.36) / 100;
      for (let y = 0; y < N; y++) {
        revenueVals[y] += annualRent > 0 ? Math.round(annualRent) : Math.round(val * iy);
        val *= (1 + gr);
        if (annualRent > 0) annualRent *= (1 + gr);
      }
    });

    companyDebts.forEach(d => {
      let bal = parseFloat(d.d_balance) || 0;
      const rate = (parseFloat(d.d_rate) || 0) / 100;
      const isIO = d.d_io === "1";
      const freq = parseFloat(d.d_freq) || 12;
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
        deductIntVals[y] += interest;
        const principal = isIO ? 0 : Math.min(bal, annualRepay - interest);
        bal = Math.max(0, bal - principal);
      }
    });

    const taxableIncome = revenueVals.map((r, y) => Math.max(0, r - deductIntVals[y]));
    const taxPayable = taxableIncome.map(ti => Math.round(ti * companyTaxRate));
    const afterTaxProfit = taxableIncome.map((ti, y) => ti - taxPayable[y]);

    // Check for exit strategy (131)
    const coExitStrat = isAdviceModel ? (engineData.strategies || []).find(s => s.strategy_id === "131" && String(s.company_idx) === String(ci)) : null;
    const coExitYear = coExitStrat ? (parseInt(coExitStrat.sell_year) || 0) : 0;
    const coExitYIdx = coExitYear > 0 ? (coExitYear - new Date().getFullYear()) : -1;

    // Strategy 20: distribution rate override for this company
    let coDistPct = 1.0;
    let coDistStartY = 0;
    let coDistEndY = N;
    let coDistFrankType = "franked";
    let coDistFrankPct = 1.0;
    let coSpecialDivAmt = 0, coSpecialDivYIdx = -1;
    let coSpecialFrankPct = 1.0;
    if (isAdviceModel) {
      const strat20 = (engineData.strategies || []).find(s => s.strategy_id === "20" && String(s.company_idx) === String(ci));
      if (strat20) {
        coDistPct = (parseFloat(strat20.dist_pct) ?? 100) / 100;
        coDistStartY = (parseInt(strat20.start_year) || new Date().getFullYear()) - new Date().getFullYear();
        const endYRaw = parseInt(strat20.end_year);
        coDistEndY = endYRaw ? (endYRaw - new Date().getFullYear()) : N;
        coDistFrankType = strat20.franking_type || "franked";
        coDistFrankPct = coDistFrankType === "franked" ? 1 : coDistFrankType === "unfranked" ? 0 : (parseFloat(strat20.franking_pct) || 50) / 100;
        if (strat20.special_div === "1") {
          coSpecialDivAmt = parseFloat(strat20.special_div_amount) || 0;
          coSpecialDivYIdx = (parseInt(strat20.special_div_year) || new Date().getFullYear()) - new Date().getFullYear();
          const sFT = strat20.special_franking_type || "franked";
          coSpecialFrankPct = sFT === "franked" ? 1 : sFT === "unfranked" ? 0 : (parseFloat(strat20.special_franking_pct) || 50) / 100;
        }
      }
    }

    (company.shareholders || []).forEach(sh => {
      const pct = (parseFloat(sh.sh_pct) || 0) / 100;
      const name = (sh.sh_entity || "").trim();
      for (let y = 0; y < N; y++) {
        // Stop dividends from exit year onwards (exit distributes separately)
        if (coExitYIdx >= 0 && y >= coExitYIdx) continue;
        const yearDistPct = (y >= coDistStartY && y < coDistEndY) ? coDistPct : 1.0;
        let div = Math.round(Math.max(0, afterTaxProfit[y]) * pct * yearDistPct);
        let frankableDiv = Math.round(div * coDistFrankPct);
        // Special dividend
        if (y === coSpecialDivYIdx && coSpecialDivAmt > 0) {
          const specialShare = Math.round(coSpecialDivAmt * pct);
          div += specialShare;
          frankableDiv += Math.round(specialShare * coSpecialFrankPct);
        }
        const frank = Math.round(frankableDiv * companyTaxRate / (1 - companyTaxRate));
        if (name === c1Name) { c1CompanyDiv[y] += div; c1FrankingCredits[y] += frank; }
        else if (name === c2Name) { c2CompanyDiv[y] += div; c2FrankingCredits[y] += frank; }
      }

      // Exit year: distribute exit proceeds to shareholders in three tax buckets
      if (coExitYIdx >= 0 && coExitYIdx < N) {
        const companyTR = (parseFloat(company.co_tax_rate) || 25) / 100;
        // Replicate the distribution waterfall from buildCompanyData
        // First compute net distributable
        let coAssetVal = 0;
        const coAssets = (engineData.assets || []).filter(a => a.a_owner === `company_${ci}`);
        coAssets.forEach(a => { coAssetVal += parseFloat(a.a_value) || 0; }); // approximate current
        let coLiabVal = 0;
        const coDebts = (engineData.liabilities || []).filter(d => d.d_owner === `company_${ci}`);
        coDebts.forEach(d => { coLiabVal += parseFloat(d.d_balance) || 0; });
        const exitGross = coExitStrat.exit_method === "agreed_price" ? (parseFloat(coExitStrat.sale_price) || 0) : (coAssetVal - coLiabVal);
        const windupCost = parseFloat(coExitStrat.windup_costs) || 0;
        const finalTax = Math.max(0, Math.round((revenueVals[coExitYIdx] || 0) * companyTR));
        const netDist = Math.max(0, exitGross - windupCost - finalTax);

        // Franking balance (simplified)
        const initFrank = parseFloat(company.franking_account_balance) || 0;
        let frankBal = initFrank;
        for (let fy = 0; fy <= coExitYIdx; fy++) frankBal += taxPayable[fy] - Math.round(afterTaxProfit[fy] * companyTR / (1 - companyTR));
        frankBal = Math.max(0, frankBal + finalTax);

        // Waterfall
        const retEarnings = parseFloat(company.retained_earnings) || 0;
        const accProfit = revenueVals.slice(0, coExitYIdx + 1).reduce((s, v) => s + v, 0) - taxPayable.slice(0, coExitYIdx + 1).reduce((s, v) => s + v, 0);
        const maxFranked = Math.min(netDist, retEarnings + accProfit, frankBal > 0 ? frankBal / companyTR * (1 - companyTR) : 0);
        const frankedDist = Math.max(0, Math.round(maxFranked));
        const shareCapital = parseFloat(company.share_capital) || 0;
        const rem1 = Math.max(0, netDist - frankedDist);
        const capReturn = Math.round(Math.min(rem1, shareCapital));
        const liqDist = Math.round(Math.max(0, rem1 - capReturn));

        // Split to shareholders
        const shFranked = Math.round(frankedDist * pct);
        const shFrank = Math.round(shFranked * companyTR / (1 - companyTR));
        const shCapReturn = Math.round(capReturn * pct);
        const shLiqDist = Math.round(liqDist * pct);

        // Apply SB concessions to liquidator CGT at shareholder level
        const shCostBase = Math.round(shareCapital * pct);
        let shNetCG = Math.max(0, shLiqDist - shCostBase);
        if (coExitStrat.sbc_eligible === "1" && shNetCG > 0) {
          if (coExitStrat.sbc_15yr === "1") { shNetCG = 0; }
          else {
            if (coExitStrat.sbc_active_asset === "1") shNetCG = Math.round(shNetCG * 0.5);
            // 50% general discount for individuals
            shNetCG = Math.round(shNetCG * 0.5);
            if (coExitStrat.sbc_retirement === "1") {
              const retAmt = parseFloat(coExitStrat.sbc_retirement_amt) || 500000;
              shNetCG = Math.max(0, shNetCG - retAmt);
            }
            if (coExitStrat.sbc_rollover === "1") shNetCG = 0;
          }
        } else if (shNetCG > 0) {
          shNetCG = Math.round(shNetCG * 0.5); // 50% general discount only
        }

        // Route to correct client
        if (name === c1Name) {
          c1CompanyDiv[coExitYIdx] += shFranked; // franked dividend (assessable)
          c1FrankingCredits[coExitYIdx] += shFrank;
          c1ExitCapReturn[coExitYIdx] += shCapReturn; // tax-free
          c1ExitLiqCGT[coExitYIdx] += shNetCG; // net capital gain after concessions
        } else if (name === c2Name) {
          c2CompanyDiv[coExitYIdx] += shFranked;
          c2FrankingCredits[coExitYIdx] += shFrank;
          c2ExitCapReturn[coExitYIdx] += shCapReturn;
          c2ExitLiqCGT[coExitYIdx] += shNetCG;
        }
      }
    });
  });

  // ═══ STRATEGY MONEY FLOWS (personal ↔ company/trust) ═══
  if (isAdviceModel) {
    const strats = engineData.strategies || [];
    const sgRate = 0.12;
    const coTaxRate = 0.25;

    // Strategy 20: Distribute Dividend — now handled via dist_pct modifying the main c1CompanyDiv/c2CompanyDiv flow above

    // Strategy 191: Director Fees → personal income
    strats.filter(s => s.strategy_id === "191").forEach(s => {
      const recipient = s.recipient || "";
      const amt = parseFloat(s.amount) || 0;
      const gr = (parseFloat(s.growth_rate) || 0) / 100;
      const startY = (parseInt(s.start_year) || currentFY) - currentFY;
      const endYRaw = parseInt(s.end_year);
      const endY = endYRaw ? (endYRaw - currentFY) : N;
      let v = amt;
      for (let y = 0; y < N; y++) {
        if (y >= startY && y < endY) {
          if (recipient === "client1") c1DirectorFees[y] += Math.round(v);
          else if (recipient === "client2") c2DirectorFees[y] += Math.round(v);
        }
        if (y >= startY) v *= (1 + gr);
      }
    });

    // Strategy 192: Shareholder Loan to Company → personal outflow + interest income
    strats.filter(s => s.strategy_id === "192").forEach(s => {
      const lender = s.lender || "";
      const amt = parseFloat(s.amount) || 0;
      const rate = (parseFloat(s.interest_rate) || 0) / 100;
      const term = parseInt(s.loan_term) || 7;
      const startY = (parseInt(s.start_year) || currentFY) - currentFY;
      if (startY >= 0 && startY < N) {
        if (lender === "client1") c1SHLoanOutflow[startY] += Math.round(amt);
        else if (lender === "client2") c2SHLoanOutflow[startY] += Math.round(amt);
      }
      // Interest income to lender + repayments received
      if (rate > 0 && amt > 0 && startY >= 0) {
        let balance = amt;
        const annualRepay = term > 0 ? amt / term : 0;
        for (let y = startY; y < N && balance > 0; y++) {
          const interest = Math.round(balance * rate);
          const repay = Math.min(Math.round(annualRepay), Math.round(balance));
          if (lender === "client1") { c1SHLoanInterestInc[y] += interest; }
          else if (lender === "client2") { c2SHLoanInterestInc[y] += interest; }
          balance -= repay;
        }
      }
    });

    // Strategy 193: Div 7A Loan → personal inflow + repayments
    strats.filter(s => s.strategy_id === "193").forEach(s => {
      const borrower = s.borrower || "";
      const amt = parseFloat(s.amount) || 0;
      const rate = (parseFloat(s.interest_rate) || 8.27) / 100;
      const term = parseInt(s.loan_term) || 7;
      const startY = (parseInt(s.start_year) || currentFY) - currentFY;
      if (startY >= 0 && startY < N) {
        if (borrower === "client1") c1Div7AProceeds[startY] += Math.round(amt);
        else if (borrower === "client2") c2Div7AProceeds[startY] += Math.round(amt);
      }
      // Repayments from borrower (cash outflow from personal)
      if (amt > 0 && startY >= 0) {
        let balance = amt;
        for (let y = startY; y < N && balance > 0; y++) {
          const interest = Math.round(balance * rate);
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
          if (borrower === "client1") c1Div7ARepayments[y] += minRepay;
          else if (borrower === "client2") c2Div7ARepayments[y] += minRepay;
          balance -= Math.max(0, principalRepay);
        }
      }
    });

    // Strategy 194: Capital Injection → personal outflow
    strats.filter(s => s.strategy_id === "194").forEach(s => {
      const investor = s.investor || "";
      const amt = parseFloat(s.amount) || 0;
      const startY = (parseInt(s.start_year) || currentFY) - currentFY;
      if (startY >= 0 && startY < N) {
        if (investor === "client1") c1CapInjectionOutflow[startY] += Math.round(amt);
        else if (investor === "client2") c2CapInjectionOutflow[startY] += Math.round(amt);
      }
    });

    // Strategy 51: Cash Injection to Trust → outflow from source
    strats.filter(s => s.strategy_id === "51").forEach(s => {
      const contributor = s.contributor || "";
      const amt = parseFloat(s.amount) || 0;
      const startY = (parseInt(s.start_year) || currentFY) - currentFY;
      const endYRaw = parseInt(s.end_year);
      const endY = endYRaw ? (endYRaw - currentFY) : (startY + 1); // default one-off
      // Only personal sources create personal outflow (company/trust outflows handled in their own engines)
      if (contributor === "client1" || contributor === "client2") {
        for (let y = startY; y < N && y < endY; y++) {
          if (y >= 0) {
            if (contributor === "client1") c1TrustContribOutflow[y] += Math.round(amt);
            else c2TrustContribOutflow[y] += Math.round(amt);
          }
        }
      }
    });

    // Strategy 195: Trust distribution payout → personal inflow (cash from trust)
    strats.filter(s => s.strategy_id === "195").forEach(s => {
      const trustIdx = parseInt(s.trust_idx);
      const trust = (engineData.trusts || [])[trustIdx];
      if (!trust) return;
      const payoutPct = (parseFloat(s.payout_pct) || 0) / 100;
      const startY = (parseInt(s.start_year) || currentFY) - currentFY;
      const endYRaw = parseInt(s.end_year);
      const endY = endYRaw ? (endYRaw - currentFY) : N;
      // Calculate trust income per year (simplified — mirrors trust engine)
      const trustAssets = (engineData.assets || []).filter(a => a.a_owner === `trust_${trustIdx}`);
      const aa2 = engineData.assetAssumptions || {};
      const trustIncPerYear = new Array(N).fill(0);
      trustAssets.forEach(a => {
        let val = parseFloat(a.a_value) || 0;
        const typeDef = aa2[a.a_type] || {};
        const gr = (typeDef.growthRate ?? 5) / 100;
        const iy = (typeDef.incomeYield ?? 4) / 100;
        for (let y = 0; y < N; y++) { trustIncPerYear[y] += Math.round(val * iy); val *= (1 + gr); }
      });
      // Distribute payout pro-rata to beneficiaries
      const benefs = trust.beneficiaries || [];
      benefs.forEach(b => {
        const bPct = (parseFloat(b.benef_entitlement) || 0) / 100;
        const bName = (b.benef_entity || "").trim();
        for (let y = 0; y < N; y++) {
          if (y >= startY && y < endY) {
            const payout = Math.round(Math.max(0, trustIncPerYear[y]) * payoutPct * bPct);
            if (bName === c1Name) c1TrustDistPayout[y] += payout;
            else if (bName === c2Name) c2TrustDistPayout[y] += payout;
          }
        }
      });
    });

    // Strategy 196: Take drawings from trust → personal inflow
    strats.filter(s => s.strategy_id === "196").forEach(s => {
      const recipient = s.recipient || "";
      const amt = parseFloat(s.amount) || 0;
      const gr = (parseFloat(s.growth_rate) || 0) / 100;
      const startY = (parseInt(s.start_year) || currentFY) - currentFY;
      const endYRaw = parseInt(s.end_year);
      const endY = endYRaw ? (endYRaw - currentFY) : N;
      let v = amt;
      for (let y = 0; y < N; y++) {
        if (y >= startY && y < endY) {
          if (recipient === "client1") c1TrustDrawings[y] += Math.round(v);
          else if (recipient === "client2") c2TrustDrawings[y] += Math.round(v);
        }
        if (y >= startY) v *= (1 + gr);
      }
    });

    // Strategy 198: Wind up trust → distribute net proceeds to beneficiaries as cash
    strats.filter(s => s.strategy_id === "198").forEach(s => {
      const trustIdx = parseInt(s.trust_idx);
      const trust = (engineData.trusts || [])[trustIdx];
      if (!trust) return;
      const windUpYIdx = (parseInt(s.windup_year) || (currentFY + 1)) - currentFY;
      if (windUpYIdx < 0 || windUpYIdx >= N) return;
      // Approximate net distributable (simplified — full calc in buildTrustData)
      const trustAssets2 = (engineData.assets || []).filter(a => a.a_owner === `trust_${trustIdx}`);
      const trustDebts2 = (engineData.liabilities || []).filter(d => d.d_owner === `trust_${trustIdx}`);
      const aa2 = engineData.assetAssumptions || {};
      let totalRealised = 0;
      trustAssets2.forEach(a => {
        let val = parseFloat(a.a_value) || 0;
        const typeDef = aa2[a.a_type] || {};
        const gr = (typeDef.growthRate ?? 5) / 100;
        for (let y2 = 0; y2 < windUpYIdx; y2++) val *= (1 + gr);
        totalRealised += Math.round(val);
      });
      let totalLiab = 0;
      trustDebts2.forEach(d => { totalLiab += Math.abs(parseFloat(d.d_balance) || 0); });
      const wuCost = parseFloat(s.windup_costs) || 2000;
      const netDist = Math.max(0, totalRealised - totalLiab - wuCost);
      // Distribute to beneficiaries
      (trust.beneficiaries || []).forEach(b => {
        const pct = (parseFloat(b.benef_entitlement) || 0) / 100;
        const bName = (b.benef_entity || "").trim();
        const share = Math.round(netDist * pct);
        if (bName === c1Name) c1TrustDrawings[windUpYIdx] += share;
        else if (bName === c2Name) c2TrustDrawings[windUpYIdx] += share;
      });
      // Stop trust distributions from wind-up year onwards
      for (let y = windUpYIdx; y < N; y++) {
        c1TrustDist[y] = 0;
        c2TrustDist[y] = 0;
      }
    });
  }

  return {
    c1TrustDist, c2TrustDist, c1CompanyDiv, c2CompanyDiv, c1FrankingCredits, c2FrankingCredits,
    c1ExitCapReturn, c2ExitCapReturn, c1ExitLiqCGT, c2ExitLiqCGT,
    c1StratDividend, c2StratDividend, c1StratDivFranking, c2StratDivFranking,
    c1DirectorFees, c2DirectorFees,
    c1Div7AProceeds, c2Div7AProceeds, c1Div7ARepayments, c2Div7ARepayments,
    c1SHLoanOutflow, c2SHLoanOutflow, c1SHLoanInterestInc, c2SHLoanInterestInc,
    c1CapInjectionOutflow, c2CapInjectionOutflow,
    c1TrustContribOutflow, c2TrustContribOutflow,
    c1TrustDrawings, c2TrustDrawings,
    c1TrustDistPayout, c2TrustDistPayout,
  };
};
