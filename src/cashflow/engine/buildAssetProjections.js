/* ─── buildAssetProjections ─── extracted from CashflowModelInner ─── */
import { assetCategory, assetTypeMap, offsetWeightFactor } from "../utils/projectionHelpers.js";

/**
 * Builds asset holdings projections for a given category.
 * Handles property rental income, DRP, offset accounts, granny flat interest,
 * move-back-into-PR, and sell transactions.
 *
 * @param {Object} ctx — projection context
 * @param {string} cat — asset category: "property", "defensive", "growth", "lifestyle"
 * @returns {Array} array of holding objects with rows for the SectionTable
 */
export const buildHoldingsForCategory = (ctx, cat) => {
  const {
    N_YEARS, currentFY,
    engineData, factFind, isAdviceModel,
    ffAssets, sellLookup, ownerLabel,
    getAssetRates,
    offsetAssetIndices, strat67All,
  } = ctx;

    return ffAssets.filter(a => assetCategory(a.a_type) === cat).map((a, i) => {
      const assetIdx = ffAssets.indexOf(a);
      const isOffsetAccount = offsetAssetIndices.has(assetIdx);
      const val = parseFloat(a.a_value) || 0;
      const rates = getAssetRates(assetIdx, a.a_type);
      const gr = rates.growthRate;
      const openingVals = [];   // Value at start of year BEFORE sells
      const sellAmountVals = new Array(N_YEARS).fill(0);
      const purchaseVals = new Array(N_YEARS).fill(0); // placeholder for buy transactions
      const revisedVals = [];   // Value after sells/purchases
      const endVals = [];       // Value after growth applied to revised
      const capitalGrowth = [];
      // Pre-calculate salary inflows per year for offset accounts
      const salaryInflowPerYear = new Array(N_YEARS).fill(0);
      if (isOffsetAccount) {
        const linkedStrats67 = strat67All.filter(s => {
          const debtIdx = parseInt((s.product_id || "").replace("debt_", ""));
          const linkedDebt = (factFind.liabilities || [])[debtIdx];
          return linkedDebt && (linkedDebt.d_offset || []).includes(String(assetIdx));
        });
        linkedStrats67.forEach(s => {
          const pct = Math.min(100, Math.max(0, parseFloat(s.amount) || 100)) / 100;
          const startYr = Math.max(0, parseInt(s.start_year) - currentFY);
          const addSalary = (incomeKey) => {
            const inc = engineData.income?.[incomeKey] || {};
            const gross = parseFloat(inc.i_gross) || 0;
            if (!gross) return;
            let taxable = gross, tax = 0;
            if (taxable <= 18200) tax = 0;
            else if (taxable <= 45000) tax = (taxable-18200)*0.16;
            else if (taxable <= 135000) tax = 4288+(taxable-45000)*0.30;
            else if (taxable <= 190000) tax = 31288+(taxable-135000)*0.37;
            else tax = 51638+(taxable-190000)*0.45;
            const lito = taxable<=37500?700:taxable<=45000?700-(taxable-37500)*0.05:taxable<=66667?Math.max(0,325-(taxable-45000)*0.015):0;
            const medicare = taxable>26000?taxable*0.02:0;
            const netAnnual = Math.round((taxable - Math.max(0,tax-lito) - medicare) * pct);
            // Apply income growth year by year
            const incR = (parseFloat(inc.i_increase) || 0) / 100;
            for (let y = startYr; y < N_YEARS; y++) {
              salaryInflowPerYear[y] += Math.round(netAnnual * Math.pow(1 + incR, y));
            }
          };
          if (s.owner_id === "joint") {
            if (engineData.income?.client1?.i_gross) addSalary("client1");
            if (engineData.income?.client2?.i_gross) addSalary("client2");
          } else {
            addSalary(s.owner_id || "client1");
          }
        });
      }

      // Granny flat interest (strategy 137): if this asset is being transferred, zero out from start year
      const grannyFlatStrat = isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []).find(s => s.strategy_id === "137" && parseInt(s.granny_property_idx) === assetIdx) : null;
      const grannyFlatStartYr = grannyFlatStrat ? Math.max(0, (parseInt(grannyFlatStrat.start_year) || currentFY) - currentFY) : -1;

      // Move back into PR (strategy 56): detect if this absent PR is being moved back into
      const moveBackPRStrat = isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []).find(s => s.strategy_id === "56" && parseInt(s.moveback_property_idx) === assetIdx) : null;
      const moveBackPRYr = moveBackPRStrat ? Math.max(0, (parseInt(moveBackPRStrat.start_year) || currentFY) - currentFY) : -1;

      let running = val;
      for (let y = 0; y < N_YEARS; y++) {
        openingVals.push(Math.round(running));
        // Apply sells at start of year
        let sellThisYear = 0;
        const sells = sellLookup[assetIdx] || [];
        sells.forEach(s => {
          if (s.yearIdx === y && running > 0) {
            sellThisYear = s.sellEntire ? running : Math.min(s.amount, running);
            running = Math.max(0, running - sellThisYear);
          }
        });
        sellAmountVals[y] = Math.round(sellThisYear);
        const revised = Math.round(running);
        revisedVals.push(revised);
        // Add salary inflows for offset accounts, subtract living expenses
        const baseExpenses = parseFloat(engineData.cashflowConfig?.livingExpenses) || 0;
        const expGrowth = parseFloat(engineData.cashflowConfig?.livingExpensesGrowth) || 0.025;
        const annualExpenses = isOffsetAccount ? Math.round(baseExpenses * Math.pow(1 + expGrowth, y)) : 0;
        const netInflow = salaryInflowPerYear[y] - annualExpenses;
        running = Math.max(0, running + netInflow);
        const endVal = Math.round(running * (1 + gr));
        capitalGrowth.push(endVal - Math.round(running));
        endVals.push(endVal);
        running = endVal;
      }
      // currentVals = revisedVals for income calculations (post-sell)
      const currentVals = revisedVals;

      // Property-specific: rental income, purchases, sales, full lifecycle
      if (cat === "property") {
        const weeklyRent = parseFloat(a.a_rental_income) || 0;
        const rentFreq = parseFloat(a.a_rental_freq) || 52;
        let annualRent = weeklyRent * rentFreq;
        // Strategy 88: if this property has a rent-out strategy (PR), use that rental income for the period
        const rentOutStrat = isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []).find(s => s.strategy_id === "88" && parseInt(s.rentout_property_idx) === assetIdx) : null;
        // Strategy 87: if this holiday home has a rent-out strategy
        const hhRentOutStrat = isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []).find(s => s.strategy_id === "87" && parseInt(s.hh_property_idx) === assetIdx) : null;
        const activeRentStrat = rentOutStrat || hhRentOutStrat;
        const rentStratSy = activeRentStrat ? Math.max(0, (parseInt(activeRentStrat.start_year) || currentFY) - currentFY) : -1;
        const rentStratEy = activeRentStrat ? (activeRentStrat.end_year && activeRentStrat.end_year !== "Ongoing" ? Math.min(N_YEARS - 1, (parseInt(activeRentStrat.end_year) || currentFY + 30) - currentFY) : N_YEARS - 1) : -1;
        const rentStratAmt = rentOutStrat ? (parseFloat(rentOutStrat.rentout_rental_income) || 0) * (parseFloat(rentOutStrat.rentout_rental_freq) || 52)
          : hhRentOutStrat ? (parseFloat(hhRentOutStrat.hh_rental_income) || 0) * (parseFloat(hhRentOutStrat.hh_rental_freq) || 52) : 0;
        // Use income yield from assumptions if no specific rental entered, otherwise use actual rental with growth
        const rentGrowthRate = gr; // rental grows at same rate as property
        const rentalVals = [];
        let rent = annualRent;
        let rentStratRunning = rentStratAmt;
        for (let y = 0; y < N_YEARS; y++) {
          // Rental income ceases when moving back into PR (type 19 only)
          if (a.a_type === "19" && moveBackPRYr >= 0 && y >= moveBackPRYr) { rentalVals.push(0); }
          // Strategy 88/87 rental income during rent-out period
          else if (activeRentStrat && y >= rentStratSy && y <= rentStratEy) { rentalVals.push(Math.round(rentStratRunning)); rentStratRunning = rentStratRunning * (1 + rentGrowthRate); }
          else if (activeRentStrat && (y < rentStratSy || y > rentStratEy)) { rentalVals.push(0); rentStratRunning = rentStratRunning * (1 + rentGrowthRate); }
          else { rentalVals.push(Math.round(rent)); }
          rent = rent * (1 + rentGrowthRate);
        }
        if (activeRentStrat && annualRent <= 0) annualRent = rentStratAmt; // for yield calc
        const rentalYield = annualRent > 0 ? ((annualRent / val) * 100).toFixed(2) + "%" : "0.00%";

        return {
          id: `${cat}-ff-${i}`,
          name: a.a_name || `${assetTypeMap[a.a_type] || "Property"} ${i + 1}`,
          entity: ownerLabel(a),
          assetType: assetTypeMap[a.a_type] || "Property",
          grannyFlatInterest: grannyFlatStartYr >= 0,
          grannyFlatStartYear: grannyFlatStrat ? parseInt(grannyFlatStrat.start_year) || currentFY : null,
          moveBackPR: moveBackPRYr >= 0,
          moveBackPRYear: moveBackPRStrat ? parseInt(moveBackPRStrat.start_year) || currentFY : null,
          rows: [
            { label: "Growth Rate", values: new Array(N_YEARS).fill((gr * 100).toFixed(2) + "%"), style: "child" },
            ...(annualRent > 0 ? [{ label: "Rental Yield", values: new Array(N_YEARS).fill(rentalYield), style: "child" }] : []),
            { label: "Current Value", values: openingVals, style: "current-value" },
            { label: "Purchases", values: purchaseVals, style: "child" },
            ...(sellAmountVals.some(v => v > 0) ? [{ label: "Sale Proceeds", values: sellAmountVals.map(v => -v), style: "child-negative" }] : [{ label: "Property Proceeds", values: new Array(N_YEARS).fill(0), style: "child-negative" }]),
            { label: "Revised Value", values: revisedVals, style: "highlight" },
            ...(annualRent > 0 ? [{ label: "Rental Income", values: rentalVals, style: "child" }] : []),
            { label: "Capital Growth", values: capitalGrowth, style: "child" },
            { label: "Property Upgrade", values: new Array(N_YEARS).fill(0), style: "child" },
            { label: "End Value (FV)", values: endVals, style: "end-value" },
          ],
        };
      }

      // Non-property categories: include income yield and franking
      const incYield = rates.incomeYield;
      const frankPct = rates.frankingPct;
      const growthRow = gr !== 0 ? [{ label: cat === "lifestyle" ? "Depreciation" : "Growth Rate", values: new Array(N_YEARS).fill((gr * 100).toFixed(2) + "%"), style: "child" }] : [];
      // Offset accounts: suppress income yield (banks pay no interest on offset accounts)
      const effectiveYield = isOffsetAccount ? 0 : incYield;
      const yieldRow = effectiveYield > 0 ? [{ label: "Income Yield", values: new Array(N_YEARS).fill((effectiveYield * 100).toFixed(2) + "%"), style: "child" }] : [];
      const frankRow = (!isOffsetAccount && frankPct > 0) ? [{ label: "Franking %", values: new Array(N_YEARS).fill((frankPct * 100).toFixed(0) + "% franked"), style: "child" }] : [];

      // Calculate income (zero if offset account)
      const incomeVals = [];
      const frankingVals = [];
      for (let y = 0; y < N_YEARS; y++) {
        const inc = isOffsetAccount ? 0 : Math.round(currentVals[y] * incYield);
        incomeVals.push(inc);
        frankingVals.push(Math.round(inc * (isOffsetAccount ? 0 : frankPct)));
      }
      const incomeRow = effectiveYield > 0 ? [{ label: "Income", values: incomeVals, style: "child" }] : [];
      const frankValRow = (!isOffsetAccount && frankPct > 0) ? [{ label: "Franking Credits", values: frankingVals, style: "child" }] : [];

      // Salary inflow rows for offset accounts (strat 67) — use salaryInflowPerYear already computed
      const salaryInflowRows = [];
      if (isOffsetAccount && salaryInflowPerYear.some(v => v > 0)) {
        // Build per-person rows for display
        const linkedStrats = strat67All.filter(s => {
          const debtIdx = parseInt((s.product_id || "").replace("debt_", ""));
          const linkedDebt = (factFind.liabilities || [])[debtIdx];
          return linkedDebt && (linkedDebt.d_offset || []).includes(String(assetIdx));
        });
        linkedStrats.forEach(s => {
          const pct = Math.min(100, Math.max(0, parseFloat(s.amount) || 100)) / 100;
          const startYr = Math.max(0, parseInt(s.start_year) - currentFY);
          const addContribRow = (incomeKey, ownerName) => {
            const inc = engineData.income?.[incomeKey] || {};
            const gross = parseFloat(inc.i_gross) || 0;
            if (!gross) return;
            let taxable = gross, tax = 0;
            if (taxable <= 18200) tax = 0;
            else if (taxable <= 45000) tax = (taxable-18200)*0.16;
            else if (taxable <= 135000) tax = 4288+(taxable-45000)*0.30;
            else if (taxable <= 190000) tax = 31288+(taxable-135000)*0.37;
            else tax = 51638+(taxable-190000)*0.45;
            const lito = taxable<=37500?700:taxable<=45000?700-(taxable-37500)*0.05:taxable<=66667?Math.max(0,325-(taxable-45000)*0.015):0;
            const medicare = taxable>26000?taxable*0.02:0;
            const net = Math.round(taxable - Math.max(0,tax-lito) - medicare);
            const incR = (parseFloat(inc.i_increase) || 0) / 100;
            const vals = new Array(N_YEARS).fill(0).map((_, y) =>
              y >= startYr ? Math.round(net * pct * Math.pow(1 + incR, y)) : 0
            );
            salaryInflowRows.push({ label: `Salary In — ${ownerName}`, values: vals, style: "child" });
          };
          if (s.owner_id === "joint") {
            const c1n = ((engineData.client1?.first_name||"")+" "+(engineData.client1?.last_name||"")).trim()||"Client 1";
            const c2n = ((engineData.client2?.first_name||"")+" "+(engineData.client2?.last_name||"")).trim()||"Client 2";
            if (engineData.income?.client1?.i_gross) addContribRow("client1", c1n);
            if (engineData.income?.client2?.i_gross) addContribRow("client2", c2n);
          } else {
            const clientKey = s.owner_id || "client1";
            const cn = ((engineData[clientKey]?.first_name||"")+" "+(engineData[clientKey]?.last_name||"")).trim()||clientKey;
            addContribRow(clientKey, cn);
          }
        });
        // Add living expenses outflow row
        const baseExpenses = parseFloat(engineData.cashflowConfig?.livingExpenses) || 0;
        const expGrowth = parseFloat(engineData.cashflowConfig?.livingExpensesGrowth) || 0.025;
        const expVals = new Array(N_YEARS).fill(0).map((_, y) => -Math.round(baseExpenses * Math.pow(1 + expGrowth, y)));
        salaryInflowRows.push({ label: "Living Expenses Out", values: expVals, style: "child-negative" });
      }

      return {
        id: `${cat}-ff-${i}`,
        name: a.a_name || `${assetTypeMap[a.a_type] || "Asset"} ${i + 1}`,
        entity: ownerLabel(a),
        assetType: assetTypeMap[a.a_type] || "Other",
        isOffsetAccount,
        rows: [
          ...growthRow,
          ...yieldRow,
          ...frankRow,
          { label: "Current Value", values: openingVals, style: "current-value" },
          { label: "Purchases", values: purchaseVals, style: "child" },
          ...(sellAmountVals.some(v => v > 0) ? [{ label: "Sale Proceeds", values: sellAmountVals.map(v => -v), style: "child-negative" }] : []),
          { label: "Revised Value", values: revisedVals, style: "highlight" },
          ...salaryInflowRows,
          ...incomeRow,
          { label: "Capital Growth", values: capitalGrowth, style: "child" },
          ...frankValRow,
          { label: "End Value (FV)", values: endVals, style: "end-value" },
        ],
      };
    });
};
