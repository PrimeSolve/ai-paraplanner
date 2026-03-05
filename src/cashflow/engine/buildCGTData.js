/* ─── buildCGTData  ─── extracted from CashflowModelInner ─── */

/**
 * Local projectAsset for DRP assets with cost base tracking.
 * Mirrors the version in buildFinancialSummaryData / buildSavingsData.
 */
const _projectAsset = (val, growthRate, assetIdx, typeCode, ctx) => {
  const { N_YEARS, sellLookup, getAssetDRP, getAssetRates } = ctx;
  const vals = [];
  const costBaseArr = [];
  const sells = (assetIdx !== undefined) ? (sellLookup[assetIdx] || []) : [];
  const isDRP = getAssetDRP(assetIdx, typeCode);
  const rates = getAssetRates(assetIdx, typeCode);
  let v = val;
  let cb = val;
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

/**
 * Builds CGT (realised + unrealised) for a single entity.
 *
 * @param {Object} ctx — projection context
 * @param {Function} entityFilter — (asset, sellTxn) => boolean
 * @param {number} discountPct — CGT discount (0.50 individuals, 0.3333 SMSF, 0 companies)
 * @param {Function} taxRateFn — (gain) => estimated tax
 * @param {number} priorLosses — carry-forward CGT losses
 * @returns {Object} { cgtData, cgtChartData, ucgtData, ucgtChartData }
 */
export const buildCGTForEntity = (ctx, entityFilter, discountPct, taxRateFn, priorLosses) => {
  const {
    N_YEARS, PROJ_YEARS, currentFY,
    engineData, isAdviceModel,
    ffAssets, sellLookup,
    getAssetDRP, getAssetRates,
  } = ctx;

    // entityFilter(asset, sellTxn) => true if this asset belongs to entity
    // priorLosses = carry-forward CGT losses from prior years (from fact find)
    const N = N_YEARS;
    const shortYrs = PROJ_YEARS;
    // currentFY comes from ctx (no longer shadowed with new Date())
    const sellTxnsBase = (isAdviceModel && engineData.advice_request?.transactions?.sell) || [];
    // Inject synthetic sells from strategy 190 (SMSF purchase of business real property)
    const strat190Sells = (isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []) : []).filter(s => s.strategy_id === "190").map(s190 => {
      const propVal = parseFloat(ffAssets[parseInt(s190.property_idx)]?.a_value) || 0;
      const pct = (parseFloat(s190.transfer_pct) || 100) / 100;
      const asset = ffAssets[parseInt(s190.property_idx)];
      return {
        asset_idx: s190.property_idx,
        owner_id: asset?.a_owner || "",
        entity_type: asset?.a_ownType || "1",
        sell_entire_amount: pct >= 1,
        amount: s190.purchase_price_override === "1" ? (s190.purchase_price || "0") : String(Math.round(propVal * pct)),
        transaction_costs_pct: s190.transaction_costs_pct || "0",
        sell_year: s190.transfer_year || "",
        sell_timing: "end",
        sbc_eligible: s190.sbc_eligible || "",
        sbc_15yr: s190.sbc_15yr || "",
        sbc_active_asset: s190.sbc_active_asset || "",
        sbc_retirement: s190.sbc_retirement || "",
        sbc_retirement_amt: s190.sbc_retirement_amt || "",
        sbc_rollover: "",
      };
    });
    const strat123Sells = (isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []) : []).filter(s => s.strategy_id === "123").map(s123 => {
      const asset = ffAssets[parseInt(s123.asset_idx)];
      if (!asset || !["12", "13", "26", "42"].includes(asset.a_type)) return null;
      const assetVal = parseFloat(asset.a_value) || 0;
      const pct = (parseFloat(s123.transfer_pct) || 100) / 100;
      return {
        asset_idx: s123.asset_idx,
        owner_id: asset.a_owner || "",
        entity_type: asset.a_ownType || "1",
        sell_entire_amount: pct >= 1,
        amount: s123.transfer_value_override === "1" ? (s123.transfer_value || "0") : String(Math.round(assetVal * pct)),
        transaction_costs_pct: s123.transaction_costs_pct || "0",
        sell_year: s123.transfer_year || "",
        sell_timing: "end",
        sbc_eligible: "", sbc_15yr: "", sbc_active_asset: "", sbc_retirement: "", sbc_retirement_amt: "", sbc_rollover: "",
      };
    }).filter(Boolean);
    const strat263Sells = (isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []) : []).filter(s => s.strategy_id === "263").map(s263 => {
      const asset = ffAssets[parseInt(s263.asset_idx)];
      if (!asset) return null;
      const assetVal = parseFloat(asset.a_value) || 0;
      const pct = (parseFloat(s263.transfer_pct) || 100) / 100;
      return {
        asset_idx: s263.asset_idx,
        owner_id: asset.a_owner || "",
        entity_type: asset.a_ownType || "1",
        sell_entire_amount: pct >= 1,
        amount: s263.transfer_value_override === "1" ? (s263.transfer_value || "0") : String(Math.round(assetVal * pct)),
        transaction_costs_pct: s263.transaction_costs_pct || "0",
        sell_year: s263.transfer_year || "",
        sell_timing: "end",
        sbc_eligible: "", sbc_15yr: "", sbc_active_asset: "", sbc_retirement: "", sbc_rollover: "",
      };
    }).filter(Boolean);
    const sellTxns = [...sellTxnsBase, ...strat190Sells, ...strat123Sells, ...strat263Sells];

    // Local asset projector (mirrors projectAsset in timeline builder)
    const projAsset = (val, growthRate, assetIdx) => {
      const vals = [];
      const sells = (assetIdx !== undefined) ? (sellLookup[assetIdx] || []) : [];
      let v = val;
      for (let y = 0; y < N; y++) {
        sells.forEach(s => { if (s.yearIdx === y && v > 0) { v = s.sellEntire ? 0 : Math.max(0, v - s.amount); } });
        vals.push(Math.round(v));
        v = v * (1 + growthRate);
      }
      return vals;
    };

    // ── REALISED CGT — from sell transactions ──
    // Build move-back absence history for CGT apportionment (strategy 56)
    const moveBackStrats = (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "56" && s.moveback_property_idx !== "");
    const getAbsenceApportionment = (assetIdx, sellYear) => {
      // Check if this property has a move-back strategy
      const mb = moveBackStrats.find(s => parseInt(s.moveback_property_idx) === assetIdx);
      if (!mb) return null; // no move-back history, standard rules apply
      const asset = ffAssets[assetIdx];
      if (!asset) return null;
      const purchaseDate = asset.a_purchase_date ? new Date(asset.a_purchase_date) : null;
      const moveOutDate = asset.a_move_out_date ? new Date(asset.a_move_out_date) : null;
      const moveBackFY = parseInt(mb.start_year) || currentFY;
      const moveBackDate = new Date(moveBackFY, 6, 1); // 1 Jul of move-back FY
      const sellDate = new Date(sellYear, 6, 1); // approx mid-FY
      if (!purchaseDate || !moveOutDate) return null;
      const totalDays = Math.round((sellDate - purchaseDate) / (24*60*60*1000));
      if (totalDays <= 0) return null;
      const absenceDays = Math.round((moveBackDate - moveOutDate) / (24*60*60*1000));
      const SIX_YR_DAYS = Math.round(6 * 365.25);
      // If absence was within 6 years, fully exempt
      if (absenceDays <= SIX_YR_DAYS) return { exempt: 1, taxable: 0, within6yr: true };
      // Partial exemption: lived-in days + 6 years deemed
      const daysAsPR = totalDays - absenceDays + Math.round((sellDate - moveBackDate) / (24*60*60*1000)); // lived before + lived after move back
      const deemedPRDays = SIX_YR_DAYS;
      const totalPRDays = daysAsPR + deemedPRDays;
      const exemptFrac = Math.min(1, totalPRDays / totalDays);
      return { exempt: exemptFrac, taxable: 1 - exemptFrac, within6yr: false, totalDays, daysAsPR, deemedPRDays, investDays: totalDays - totalPRDays };
    };

    const existingLosses = new Array(N).fill(0);
    const assessableVals = new Array(N).fill(0);       // gross gains before discount
    const discountableVals = new Array(N).fill(0);     // gains eligible for discount (held >12m)
    const nonDiscountableVals = new Array(N).fill(0);  // gains NOT eligible (held <12m)
    const assetSellRows = [];
    sellTxns.forEach(s => {
      const assetIdx = parseInt(s.asset_idx);
      const asset = !isNaN(assetIdx) ? ffAssets[assetIdx] : null;
      if (!asset || !entityFilter(asset, s)) return;

      // CGT exemption logic for principal residences
      // Type "19" (absent PR, not moved back): exempt under 6yr rule (will be apportioned if sold after 6yr exceeded)
      if (asset.a_type === "19") {
        // Check if absence exceeds 6 years — if so, apply apportionment
        const purchaseDt = asset.a_purchase_date ? new Date(asset.a_purchase_date) : null;
        const moveOutDt = asset.a_move_out_date ? new Date(asset.a_move_out_date) : null;
        const sellYr = parseInt(s.sell_year) || currentFY;
        const sellDt = new Date(sellYr, 6, 1);
        if (purchaseDt && moveOutDt) {
          const absDs = Math.round((sellDt - moveOutDt) / (24*60*60*1000));
          const SIX = Math.round(6 * 365.25);
          if (absDs <= SIX) return; // within 6yr, fully exempt
          // Exceeded: partial exemption
          const totDs = Math.round((sellDt - purchaseDt) / (24*60*60*1000));
          const prDs = totDs - absDs; // days lived in
          const totalPR = prDs + SIX;
          const exemptF = Math.min(1, totalPR / totDs);
          const taxableF = 1 - exemptF;
          // Fall through to gain calc below with taxableF applied
          // (don't return — we process below with apportionment)
          const currentValA = parseFloat(asset.a_value) || 0;
          const costBaseA = parseFloat(asset.a_purchase_price) || currentValA;
          const sellAmtA = s.sell_entire_amount ? currentValA : Math.min(parseFloat(s.amount) || 0, currentValA);
          const costPortionA = currentValA > 0 ? (costBaseA * sellAmtA / currentValA) : 0;
          const txnCostPctA = (parseFloat(s.transaction_costs_pct) || 0) / 100;
          const netProceedsA = Math.round(sellAmtA * (1 - txnCostPctA));
          const fullGainA = netProceedsA - Math.round(costPortionA);
          const taxableGainA = Math.round(fullGainA * taxableF);
          const yIdxA = sellYr - currentFY;
          if (yIdxA < 0 || yIdxA >= N) return;
          const heldMsA = purchaseDt ? Math.round((sellDt - purchaseDt) / (30.44*24*60*60*1000)) : 999;
          const isDiscA = heldMsA >= 12;
          const procV = new Array(N).fill(0); procV[yIdxA] = netProceedsA;
          const costV = new Array(N).fill(0); costV[yIdxA] = Math.round(costPortionA);
          const fullV = new Array(N).fill(0); fullV[yIdxA] = fullGainA;
          const taxV = new Array(N).fill(0); taxV[yIdxA] = taxableGainA;
          assetSellRows.push({ label: `${asset.a_name || "Asset"} (Absent PR — partial exemption)`, values: new Array(N).fill(""), style: "subheader" });
          assetSellRows.push({ label: "  Proceeds (net of costs)", values: procV, style: "child" });
          assetSellRows.push({ label: "  Cost Base", values: costV, style: "child" });
          assetSellRows.push({ label: `  Full Capital Gain`, values: fullV, style: "child" });
          assetSellRows.push({ label: `  Exempt fraction: ${(exemptF * 100).toFixed(1)}% (${prDs.toLocaleString()} PR + ${SIX.toLocaleString()} deemed = ${totalPR.toLocaleString()} / ${totDs.toLocaleString()} days)`, values: new Array(N).fill(""), style: "child" });
          assetSellRows.push({ label: `  Taxable Gain (${(taxableF * 100).toFixed(1)}%)`, values: taxV, style: taxableGainA >= 0 ? "child" : "child-negative" });
          if (taxableGainA >= 0) {
            assessableVals[yIdxA] += taxableGainA;
            if (isDiscA) discountableVals[yIdxA] += taxableGainA;
            else nonDiscountableVals[yIdxA] += taxableGainA;
          } else existingLosses[yIdxA] += Math.abs(taxableGainA);
          return;
        }
        return; // no dates, assume exempt
      }

      // Type "1" (principal residence): check if it was moved-back-into (has strategy 56 history)
      if (asset.a_type === "1") {
        const sellYr = parseInt(s.sell_year) || currentFY;
        const apportion = getAbsenceApportionment(assetIdx, sellYr);
        if (!apportion) return; // normal PR, fully exempt
        if (apportion.within6yr) return; // was absent but within 6yr, fully exempt
        // Partial exemption applies
        const currentValB = parseFloat(asset.a_value) || 0;
        const costBaseB = parseFloat(asset.a_purchase_price) || currentValB;
        const sellAmtB = s.sell_entire_amount ? currentValB : Math.min(parseFloat(s.amount) || 0, currentValB);
        const costPortionB = currentValB > 0 ? (costBaseB * sellAmtB / currentValB) : 0;
        const txnCostPctB = (parseFloat(s.transaction_costs_pct) || 0) / 100;
        const netProceedsB = Math.round(sellAmtB * (1 - txnCostPctB));
        const fullGainB = netProceedsB - Math.round(costPortionB);
        const taxableGainB = Math.round(fullGainB * apportion.taxable);
        const yIdxB = sellYr - currentFY;
        if (yIdxB < 0 || yIdxB >= N) return;
        const purchaseDtB = asset.a_purchase_date ? new Date(asset.a_purchase_date) : null;
        const sellDtB = new Date(sellYr, 6, 1);
        const heldMsB = purchaseDtB ? Math.round((sellDtB - purchaseDtB) / (30.44*24*60*60*1000)) : 999;
        const isDiscB = heldMsB >= 12;
        const procVB = new Array(N).fill(0); procVB[yIdxB] = netProceedsB;
        const costVB = new Array(N).fill(0); costVB[yIdxB] = Math.round(costPortionB);
        const fullVB = new Array(N).fill(0); fullVB[yIdxB] = fullGainB;
        const taxVB = new Array(N).fill(0); taxVB[yIdxB] = taxableGainB;
        assetSellRows.push({ label: `${asset.a_name || "Asset"} (Moved back — partial CGT exemption)`, values: new Array(N).fill(""), style: "subheader" });
        assetSellRows.push({ label: "  Proceeds (net of costs)", values: procVB, style: "child" });
        assetSellRows.push({ label: "  Cost Base", values: costVB, style: "child" });
        assetSellRows.push({ label: `  Full Capital Gain`, values: fullVB, style: "child" });
        assetSellRows.push({ label: `  Exempt: ${(apportion.exempt * 100).toFixed(1)}% (${apportion.daysAsPR?.toLocaleString()} PR + ${apportion.deemedPRDays?.toLocaleString()} deemed = ${(apportion.daysAsPR + apportion.deemedPRDays)?.toLocaleString()} / ${apportion.totalDays?.toLocaleString()} days)`, values: new Array(N).fill(""), style: "child" });
        assetSellRows.push({ label: `  Taxable Gain (${(apportion.taxable * 100).toFixed(1)}%)`, values: taxVB, style: taxableGainB >= 0 ? "child" : "child-negative" });
        if (taxableGainB >= 0) {
          assessableVals[yIdxB] += taxableGainB;
          if (isDiscB) discountableVals[yIdxB] += taxableGainB;
          else nonDiscountableVals[yIdxB] += taxableGainB;
        } else existingLosses[yIdxB] += Math.abs(taxableGainB);
        return;
      }

      // Pre-CGT assets (acquired before 20 September 1985) are exempt
      const PRE_CGT_DATE = new Date(1985, 8, 20); // 20 Sep 1985
      const assetPurchaseDate = asset.a_purchase_date ? new Date(asset.a_purchase_date) : null;
      if (assetPurchaseDate && assetPurchaseDate < PRE_CGT_DATE) return;
      const sellYear = parseInt(s.sell_year) || currentFY;
      const yIdx = sellYear - currentFY;
      if (yIdx < 0 || yIdx >= N) return;
      const currentVal = parseFloat(asset.a_value) || 0;
      // For DRP assets, use projected value and adjusted cost base at sell year
      const isDRPAsset = getAssetDRP(assetIdx, asset.a_type);
      let projectedVal = currentVal;
      let costBase = parseFloat(asset.a_purchase_price) || currentVal;
      if (isDRPAsset && yIdx > 0) {
        const rates = getAssetRates(assetIdx, asset.a_type);
        const projected = _projectAsset(currentVal, rates.growthRate, assetIdx, asset.a_type, ctx);
        projectedVal = projected.vals[yIdx] || currentVal;
        costBase = projected.costBaseArr[yIdx] || costBase;
      }
      const sellAmt = s.sell_entire_amount ? projectedVal : Math.min(parseFloat(s.amount) || 0, projectedVal);
      const costPortion = projectedVal > 0 ? (costBase * sellAmt / projectedVal) : 0;
      const txnCostPct = (parseFloat(s.transaction_costs_pct) || 0) / 100;
      const netProceeds = Math.round(sellAmt * (1 - txnCostPct));
      const capitalGain = netProceeds - Math.round(costPortion);

      // Check 12-month holding period for CGT discount eligibility
      const purchaseDate = asset.a_purchase_date ? new Date(asset.a_purchase_date) : null;
      const sellDate = new Date(sellYear, 6, 1); // approx mid financial year
      const heldMonths = purchaseDate ? Math.round((sellDate - purchaseDate) / (30.44 * 24 * 60 * 60 * 1000)) : 999;
      const isDiscountEligible = heldMonths >= 12;

      const vals = new Array(N).fill(0);
      vals[yIdx] = capitalGain;
      const discountLabel = isDiscountEligible ? "✓ Discount" : "✗ No Discount";
      const holdLabel = purchaseDate ? `held ${heldMonths}m` : "no purchase date";

      // Detailed rows per sell event
      const proceedsVals = new Array(N).fill(0); proceedsVals[yIdx] = netProceeds;
      const costVals = new Array(N).fill(0); costVals[yIdx] = Math.round(costPortion);
      const gainVals = new Array(N).fill(0); gainVals[yIdx] = capitalGain;

      assetSellRows.push({ label: `${asset.a_name || "Asset"}`, values: new Array(N).fill(""), style: "subheader" });
      assetSellRows.push({ label: "  Proceeds (net of costs)", values: proceedsVals, style: "child" });
      assetSellRows.push({ label: "  Cost Base", values: costVals, style: "child" });

      // ── Small Business CGT Concessions (Div 152) ──
      let adjustedGain = capitalGain;
      const sbcEligible = s.sbc_eligible === "1";
      const sbc15yr = s.sbc_15yr === "1";
      const sbcActiveAsset = s.sbc_active_asset === "1";
      const sbcRetirement = s.sbc_retirement === "1";
      const sbcRetirementAmt = parseFloat(s.sbc_retirement_amt) || 500000;
      const sbcRollover = s.sbc_rollover === "1";

      if (sbcEligible && capitalGain > 0) {
        if (sbc15yr) {
          // 15-Year Exemption: entire gain exempt
          assetSellRows.push({ label: `  Capital Gain (before concessions)`, values: gainVals, style: "child" });
          assetSellRows.push({ label: `  15-Year Exemption (Div 152-B)`, values: (() => { const v = new Array(N).fill(0); v[yIdx] = -capitalGain; return v; })(), style: "child-negative" });
          assetSellRows.push({ label: `  Net Capital Gain`, values: new Array(N).fill(0), style: "highlight" });
          adjustedGain = 0;
        } else {
          let remainingGain = capitalGain;
          const concessionRows = [];
          concessionRows.push({ label: `  Capital Gain (before concessions)`, values: gainVals, style: "child" });

          // 50% Active Asset Reduction (applied to gross gain, before general discount)
          if (sbcActiveAsset && remainingGain > 0) {
            const reduction = Math.round(remainingGain * 0.5);
            concessionRows.push({ label: `  50% Active Asset Reduction (Div 152-C)`, values: (() => { const v = new Array(N).fill(0); v[yIdx] = -reduction; return v; })(), style: "child-negative" });
            remainingGain -= reduction;
          }

          // Retirement Exemption (applied after active asset, before general discount)
          if (sbcRetirement && remainingGain > 0) {
            const retExempt = Math.min(remainingGain, sbcRetirementAmt);
            concessionRows.push({ label: `  Retirement Exemption (Div 152-D) — $${retExempt.toLocaleString()}`, values: (() => { const v = new Array(N).fill(0); v[yIdx] = -retExempt; return v; })(), style: "child-negative" });
            remainingGain -= retExempt;
          }

          // Small Business Rollover (defer entire remaining gain)
          if (sbcRollover && remainingGain > 0) {
            concessionRows.push({ label: `  Small Business Rollover (Div 152-E) — deferred`, values: (() => { const v = new Array(N).fill(0); v[yIdx] = -remainingGain; return v; })(), style: "child-negative" });
            remainingGain = 0;
          }

          const netVals = new Array(N).fill(0); netVals[yIdx] = remainingGain;
          concessionRows.push({ label: `  Net Capital Gain (after SB concessions)`, values: netVals, style: "highlight" });
          concessionRows.forEach(r => assetSellRows.push(r));
          adjustedGain = remainingGain;
        }
      } else {
        // No SB concessions — standard display
        if (discountPct === 0) {
          assetSellRows.push({
            label: `  Capital ${capitalGain >= 0 ? "Gain" : "Loss"} (${holdLabel})`,
            values: gainVals, style: capitalGain >= 0 ? "child" : "child-negative",
          });
        } else {
          assetSellRows.push({
            label: `  Capital ${capitalGain >= 0 ? "Gain" : "Loss"} (${holdLabel}, ${discountLabel})`,
            values: gainVals, style: capitalGain >= 0 ? "child" : "child-negative",
          });
        }
      }

      if (adjustedGain >= 0) {
        assessableVals[yIdx] += adjustedGain;
        if (isDiscountEligible) discountableVals[yIdx] += adjustedGain;
        else nonDiscountableVals[yIdx] += adjustedGain;
      }
      else existingLosses[yIdx] += Math.abs(adjustedGain);
    });

    // ATO CGT calculation order:
    // 1. Gross capital gains per asset
    // 2. Offset losses FIRST against the GROSS (undiscounted) gain
    // 3. THEN apply 50% CGT discount to the remainder (if eligible)
    const priorCGTLosses = parseFloat(priorLosses) || 0;

    // Step 2: Apply losses against gross gains first
    const carriedLosses = new Array(N).fill(0);
    const gainAfterLosses = new Array(N).fill(0);
    const discountableAfterLosses = new Array(N).fill(0);
    let lossPool = priorCGTLosses;
    for (let y = 0; y < N; y++) {
      lossPool += existingLosses[y];
      const grossGain = assessableVals[y];
      const netOfLoss = Math.max(0, grossGain - lossPool);
      const lossUsed = grossGain - netOfLoss;
      lossPool = Math.max(0, lossPool - lossUsed);
      gainAfterLosses[y] = netOfLoss;
      // Pro-rata discount eligibility after loss offset
      const discRatio = grossGain > 0 ? discountableVals[y] / grossGain : 0;
      discountableAfterLosses[y] = Math.round(netOfLoss * discRatio);
      carriedLosses[y] = lossPool;
    }

    // Step 3: Apply discount to the remainder
    const discountOnRemainder = discountableAfterLosses.map(v => Math.round(v * discountPct));
    const netCGTAssessable = gainAfterLosses.map((v, y) => v - discountOnRemainder[y]);

    const isCompanyEntity = discountPct === 0;

    const cgtData = {
      years: shortYrs,
      sections: [
        ...(assetSellRows.length > 0 ? [{ id: "cgt-events", title: "CGT Events", rows: [
          ...assetSellRows,
          { label: `Total Capital ${assessableVals.some(v => v > 0) ? "Gains" : "Losses"} (Gross)`, values: assessableVals, style: "total" },
        ]}] : []),
        ...(existingLosses.some(v => v > 0) || priorCGTLosses > 0 ? [{ id: "cgt-losses", title: isCompanyEntity ? "Offset Losses" : "Step 1 — Offset Losses Against Gross Gain", rows: [
          ...(priorCGTLosses > 0 ? [{ label: "Existing CGT Losses (from Fact Find)", values: [priorCGTLosses, ...new Array(N - 1).fill(0)], style: "child" }] : []),
          { label: "Losses from CGT Events (current year)", values: existingLosses, style: "child" },
          { label: "Gross Gain", values: assessableVals, style: "child" },
          { label: "Less: Losses Applied", values: assessableVals.map((v, y) => -(v - gainAfterLosses[y])), style: "child" },
          { label: "Gain After Losses", values: gainAfterLosses, style: "subtotal" },
        ]}] : []),
        ...(!isCompanyEntity ? [{ id: "cgt-discount", title: "Step 2 — Apply CGT Discount to Remainder", rows: [
          { label: "Discount Eligible (held >12m)", values: discountableAfterLosses, style: "child" },
          { label: "Non-Discount (held <12m)", values: gainAfterLosses.map((v, y) => v - discountableAfterLosses[y]), style: "child" },
          { label: `Discount Applied (${Math.round(discountPct * 100)}%)`, values: discountOnRemainder.map(v => -v), style: "child" },
        ]}] : []),
        { id: "cgt-final", rows: [
          { label: isCompanyEntity ? "Net Capital Gain (Assessable to Company)" : "Net Capital Gain (Assessable)", values: netCGTAssessable, style: "highlight" },
        ]},
        { id: "cgt-carried-forward", rows: [
          { label: "Carried Forward Losses", values: carriedLosses, style: "child" },
        ]},
      ],
    };
    const cgtChartData = shortYrs.map((year, i) => ({
      year,
      assessable: assessableVals[i],
      discountApplied: discountOnRemainder[i],
      finalNet: netCGTAssessable[i],
      carriedLosses: carriedLosses[i],
    }));

    // ── UNREALISED CGT — from all held assets ──
    const ucgtAssetRows = [];
    const ucgtTotalGross = new Array(N).fill(0);
    const ucgtDiscountableGross = new Array(N).fill(0);
    ffAssets.forEach((a, ai) => {
      if (!entityFilter(a, null)) return;
      // Type "19" (absent PR): check 6yr rule — if within, exempt; if exceeded, show partial unrealised gain
      if (a.a_type === "19") {
        const purchDt = a.a_purchase_date ? new Date(a.a_purchase_date) : null;
        const movedDt = a.a_move_out_date ? new Date(a.a_move_out_date) : null;
        if (!purchDt || !movedDt) return; // no dates, assume exempt
        const curV = parseFloat(a.a_value) || 0;
        const cb = parseFloat(a.a_purchase_price) || 0;
        if (cb <= 0) return;
        const rates = getAssetRates(ai, a.a_type);
        const projected = projAsset(curV, rates.growthRate, ai);
        const SIX = Math.round(6 * 365.25);
        const gainArr = projected.map((v, y) => {
          const projDt = new Date(currentFY + y, 6, 1);
          const absDays = Math.round((projDt - movedDt) / (24*60*60*1000));
          if (absDays <= SIX) return 0; // within 6yr, exempt
          const totDays = Math.round((projDt - purchDt) / (24*60*60*1000));
          const prDays = totDays - absDays;
          const exemptF = Math.min(1, (prDays + SIX) / totDays);
          return Math.max(0, Math.round((v - cb) * (1 - exemptF)));
        });
        if (gainArr.every(v => v === 0)) return;
        ucgtAssetRows.push({ label: `${a.a_name || "Asset"} (Absent PR — partial)`, values: gainArr, style: "child" });
        gainArr.forEach((v, y) => { ucgtTotalGross[y] += v; ucgtDiscountableGross[y] += v; });
        return;
      }
      // Type "1" (PR): check for move-back history (strategy 56)
      if (a.a_type === "1") {
        const mb = moveBackStrats.find(s => parseInt(s.moveback_property_idx) === ai);
        if (!mb) return; // normal PR, fully exempt
        const purchDt = a.a_purchase_date ? new Date(a.a_purchase_date) : null;
        const movedDt = a.a_move_out_date ? new Date(a.a_move_out_date) : null;
        if (!purchDt || !movedDt) return;
        const mbFY = parseInt(mb.start_year) || currentFY;
        const mbDate = new Date(mbFY, 6, 1);
        const absDays = Math.round((mbDate - movedDt) / (24*60*60*1000));
        const SIX = Math.round(6 * 365.25);
        if (absDays <= SIX) return; // within 6yr, fully exempt
        const curV = parseFloat(a.a_value) || 0;
        const cb = parseFloat(a.a_purchase_price) || 0;
        if (cb <= 0) return;
        const rates = getAssetRates(ai, a.a_type);
        const projected = projAsset(curV, rates.growthRate, ai);
        const gainArr = projected.map((v, y) => {
          const projDt = new Date(currentFY + y, 6, 1);
          const totDays = Math.round((projDt - purchDt) / (24*60*60*1000));
          const daysLived = (Math.round((movedDt - purchDt) / (24*60*60*1000))) + Math.round((projDt - mbDate) / (24*60*60*1000));
          const exemptF = Math.min(1, (daysLived + SIX) / totDays);
          return Math.max(0, Math.round((v - cb) * (1 - exemptF)));
        });
        if (gainArr.every(v => v === 0)) return;
        ucgtAssetRows.push({ label: `${a.a_name || "Asset"} (Moved back — partial)`, values: gainArr, style: "child" });
        gainArr.forEach((v, y) => { ucgtTotalGross[y] += v; ucgtDiscountableGross[y] += v; });
        return;
      }
      // Non-PR assets
      if (a.a_type === "1" || a.a_type === "19") return; // safety net (already handled above)
      // Pre-CGT assets (acquired before 20 September 1985) are exempt
      const PRE_CGT_DATE_U = new Date(1985, 8, 20);
      const aPurchaseDate = a.a_purchase_date ? new Date(a.a_purchase_date) : null;
      if (aPurchaseDate && aPurchaseDate < PRE_CGT_DATE_U) return;
      const currentVal = parseFloat(a.a_value) || 0;
      const costBase = parseFloat(a.a_purchase_price) || 0;
      if (costBase <= 0) return; // skip if no cost base recorded
      const rates = getAssetRates(ai, a.a_type);
      const projected = projAsset(currentVal, rates.growthRate, ai);
      // Cost base remains static (not indexed for this schedule)
      const gainVals = projected.map(v => Math.max(0, v - costBase));

      // Check 12-month holding for discount eligibility
      const purchaseDate = a.a_purchase_date ? new Date(a.a_purchase_date) : null;
      const today = new Date();
      const heldMonthsFromToday = purchaseDate ? Math.round((today - purchaseDate) / (30.44 * 24 * 60 * 60 * 1000)) : 999;
      // If already held >12m at start, all years are eligible
      // If not yet, calculate which projection year becomes eligible
      const monthsToEligible = Math.max(0, 12 - heldMonthsFromToday);
      const yearsToEligible = Math.ceil(monthsToEligible / 12);

      if (gainVals.some(v => v > 0)) {
        const discLabel = heldMonthsFromToday >= 12 ? "✓ Discount" : `✗ <12m (eligible yr ${yearsToEligible + 1})`;
        ucgtAssetRows.push({ label: `${a.a_name || `Asset ${ai}`} (${discLabel})`, values: gainVals, style: "child" });
        gainVals.forEach((g, y) => {
          ucgtTotalGross[y] += g;
          // Only count as discountable if held >12m by that projection year
          const heldByYear = heldMonthsFromToday + (y * 12);
          if (heldByYear >= 12) ucgtDiscountableGross[y] += g;
        });
      }
    });

    // Apply discount only to eligible portion
    const ucgtDiscountVals = ucgtDiscountableGross.map(v => Math.round(v * discountPct));
    const ucgtFinalVals = ucgtTotalGross.map((v, y) => v - ucgtDiscountVals[y]);
    const ucgtTaxVals = ucgtFinalVals.map(v => Math.round(taxRateFn(v)));

    const ucgtData = {
      years: shortYrs,
      sections: [
        { id: "ucgt-initial", title: "Gross Unrealised CGT by Asset", rows: [
          ...ucgtAssetRows,
          { label: "Total Gross Unrealised CGT", values: ucgtTotalGross, style: "total" },
        ]},
        { id: "ucgt-discount", title: `Discount Available (${Math.round(discountPct * 100)}%)`, rows: [
          { label: "Discount Amount", values: ucgtDiscountVals, style: "child" },
        ]},
        { id: "ucgt-summary", rows: [
          { label: "Gross Unrealised CGT", values: ucgtTotalGross, style: "subtotal" },
          { label: `Discount Applied (${Math.round(discountPct * 100)}%)`, values: ucgtDiscountVals.map(v => -v), style: "child" },
          { label: "Final Unrealised CGT", values: ucgtFinalVals, style: "highlight" },
          { label: "Tax on Unrealised CGT", values: ucgtTaxVals, style: "subtotal" },
        ]},
      ],
    };
    const ucgtChartData = shortYrs.map((year, i) => ({
      year,
      grossCGT: ucgtTotalGross[i],
      discount: ucgtDiscountVals[i],
      finalUnrealised: ucgtFinalVals[i],
      taxOnCGT: ucgtTaxVals[i],
    }));

    return { cgtData, cgtChartData, ucgtData, ucgtChartData };
};

/**
 * Builds CGT for all entity types (clients, trusts, companies, SMSFs)
 * and patches trust/company/SMSF income/tax sections with CGT results.
 * Mutates trustDataList, companyDataList, smsfDataList, entityDist in place.
 *
 * @param {Object} ctx — projection context
 * @returns {Object} { c1CGT, c2CGT, trustCGTList, companyCGTList, smsfCGTList, streamedCGTToClient1, streamedCGTToClient2 }
 */
export const assembleCGTData = (ctx) => {
  const {
    N_YEARS, PROJ_YEARS, currentFY,
    engineData, isAdviceModel,
    ffAssets, sellLookup,
    getAssetDRP, getAssetRates,
    trustDataList, companyDataList, smsfDataList,
    entityDist,
  } = ctx;

  const _cgtCtx = { N_YEARS, PROJ_YEARS, currentFY, engineData, isAdviceModel, ffAssets, sellLookup, getAssetDRP, getAssetRates };
  // Tax rate helpers — imported from utils/taxCalc.js

  // Entity filters
  const isClient1Asset = (a) => a.a_owner === "client1" || (a.a_owner === "joint" && true);
  const isClient2Asset = (a) => a.a_owner === "client2" || (a.a_owner === "joint" && true);
  const isClient1Sell = (a, s) => {
    if (["3","4","5"].includes(a.a_ownType || s?.entity_type)) return false;
    return a.a_owner === "client1" || a.a_owner === "joint";
  };
  const isClient2Sell = (a, s) => {
    if (["3","4","5"].includes(a.a_ownType || s?.entity_type)) return false;
    return a.a_owner === "client2" || a.a_owner === "joint";
  };

  // Build per entity
  const c1Income = engineData.income?.client1 || {};
  const c2Income = engineData.income?.client2 || {};

  const c1CGT = buildCGTForEntity(_cgtCtx, 
    (a, s) => s ? isClient1Sell(a, s) : (a.a_owner === "client1" || a.a_owner === "joint"),
    0.50, // 50% individual discount
    (v) => Math.round(v * 0.37), // approx marginal rate
    c1Income.i_cgt_losses || 0
  );
  const c2CGT = buildCGTForEntity(_cgtCtx, 
    (a, s) => s ? isClient2Sell(a, s) : (a.a_owner === "client2" || a.a_owner === "joint"),
    0.50,
    (v) => Math.round(v * 0.37),
    c2Income.i_cgt_losses || 0
  );

  // Trusts
  const trustCGTList = (engineData.trusts || []).map((tr, ti) => {
    const trustOwnerKey = `trust_${ti}`;
    return {
      name: tr.trust_name || `Trust ${ti + 1}`,
      ...buildCGTForEntity(_cgtCtx, 
        (a) => a.a_owner === trustOwnerKey || a.a_ownType === "3" && a.a_owner === trustOwnerKey,
        0.50, // trusts get 50% discount
        (v) => Math.round(v * 0.37), // distributed at beneficiary marginal rate
        0
      ),
    };
  });

  // ── Inject CGT assessable into trust income/tax statements ──
  // Also compute streamed CGT per client for personal tax returns
  const streamedCGTToClient1 = new Array(N_YEARS).fill(0);
  const streamedCGTToClient2 = new Array(N_YEARS).fill(0);

  trustCGTList.forEach((tCGT, ti) => {
    const trustData = trustDataList[ti];
    if (!trustData) return;
    const cgtVals = tCGT.cgtChartData.map(d => d.finalNet);
    const hasCGT = cgtVals.some(v => v > 0);
    if (!hasCGT) return;
    const cgtSource = { label: "CGT Schedule", nav: ["Cashflow/Tax", "CGT", tCGT.name] };

    // Check streaming config
    const streamCfg = engineData.advice_request?.cgt_streaming?.[`trust_${ti}`];
    const isStreaming = streamCfg?.enabled && (streamCfg.allocations || []).length > 0;
    const trust = (engineData.trusts || [])[ti];
    const beneficiaries = trust?.beneficiaries || [];
    const c1Name = ((engineData.client1?.first_name || "") + " " + (engineData.client1?.last_name || "")).trim();
    const c2Name = ((engineData.client2?.first_name || "") + " " + (engineData.client2?.last_name || "")).trim();

    // Calculate streamed amounts per beneficiary
    let totalStreamedVals = new Array(N_YEARS).fill(0);
    if (isStreaming) {
      (streamCfg.allocations || []).forEach((a, ai) => {
        const pct = (parseFloat(a.pct) || 0) / 100;
        const overrides = a.overrides || {};
        const streamed = cgtVals.map((v, y) => {
          const ov = overrides[y];
          if (ov !== undefined && ov !== "") return Math.min(parseFloat(ov) || 0, v);
          return Math.round(v * pct);
        });
        streamed.forEach((v, y) => { totalStreamedVals[y] += v; });

        // Route to the correct client's personal CGT
        const benefName = a.name || "";
        if (benefName === c1Name || benefName === "client1" || (beneficiaries[ai] && beneficiaries[ai].benef_entity === c1Name)) {
          streamed.forEach((v, y) => { streamedCGTToClient1[y] += v; });
        } else if (benefName === c2Name || benefName === "client2" || (beneficiaries[ai] && beneficiaries[ai].benef_entity === c2Name)) {
          streamed.forEach((v, y) => { streamedCGTToClient2[y] += v; });
        }
      });
    }

    // Remainder = what stays on the trust after streaming
    const remainsOnTrust = cgtVals.map((v, y) => Math.max(0, v - totalStreamedVals[y]));

    // Patch income section: show full CGT, then streamed out, then remainder
    const incSection = trustData.data.sections.find(s => s.id === "trust-income");
    if (incSection) {
      const cgIdx = incSection.rows.findIndex(r => r.label === "Capital Gain");
      if (cgIdx >= 0) {
        const newRows = [{ label: "Net Capital Gain (Assessable)", values: cgtVals, style: "child", source: cgtSource }];
        if (isStreaming && totalStreamedVals.some(v => v > 0)) {
          newRows.push({ label: "Less: CGT Streamed to Beneficiaries", values: totalStreamedVals.map(v => -v), style: "child" });
          newRows.push({ label: "CGT Retained in Trust", values: remainsOnTrust, style: "child" });
        }
        incSection.rows.splice(cgIdx, 1, ...newRows);
      }
      const totIdx = incSection.rows.findIndex(r => r.label === "Total Income");
      if (totIdx >= 0) incSection.rows[totIdx].values = incSection.rows[totIdx].values.map((v, y) => v + remainsOnTrust[y]);
    }

    // Patch tax assessable section
    const taxSection = trustData.data.sections.find(s => s.id === "trust-tax");
    if (taxSection) {
      const cgIdx = taxSection.rows.findIndex(r => r.label === "Capital Gain");
      if (cgIdx >= 0) {
        const newRows = [{ label: "Net Capital Gain (Assessable)", values: cgtVals, style: "child", source: cgtSource }];
        if (isStreaming && totalStreamedVals.some(v => v > 0)) {
          newRows.push({ label: "Less: CGT Streamed to Beneficiaries", values: totalStreamedVals.map(v => -v), style: "child" });
          newRows.push({ label: "CGT Retained in Trust", values: remainsOnTrust, style: "child" });
        }
        taxSection.rows.splice(cgIdx, 1, ...newRows);
      }
      const totIdx = taxSection.rows.findIndex(r => r.label === "Total Income");
      if (totIdx >= 0) taxSection.rows[totIdx].values = taxSection.rows[totIdx].values.map((v, y) => v + remainsOnTrust[y]);
    }

    // Update Net Income with only the remainder
    const taxSummary = trustData.data.sections.find(s => s.id === "trust-tax-summary");
    if (taxSummary) {
      const niIdx = taxSummary.rows.findIndex(r => r.label === "Net Income");
      if (niIdx >= 0) taxSummary.rows[niIdx].values = taxSummary.rows[niIdx].values.map((v, y) => v + remainsOnTrust[y]);
    }

    // Update distribution rows — only the remainder gets distributed pro-rata
    const distSection = trustData.data.sections.find(s => s.id === "trust-distribution");
    if (distSection) {
      const _cgtOvCfg = (engineData.advice_request?.trust_dist_override || {})[`trust_${ti}`];
      const _cgtOvAllocs = (_cgtOvCfg && _cgtOvCfg.allocations) ? _cgtOvCfg.allocations : [];
      beneficiaries.forEach((b, bi) => {
        const defaultPct = (parseFloat(b.benef_entitlement) || 0) / 100;
        const oa = _cgtOvAllocs[bi];
        const pct = (_cgtOvAllocs.length > 0 && oa) ? (parseFloat(oa.defaultPct) || 0) / 100 : defaultPct;
        if (distSection.rows[bi]) {
          distSection.rows[bi].values = distSection.rows[bi].values.map((v, y) => v + Math.round(remainsOnTrust[y] * pct));
        }
        // Also add the non-streamed CGT to personal tax distributions
        const bName = (b.benef_entity || "").trim();
        for (let y = 0; y < N_YEARS; y++) {
          const cgtShare = Math.round(remainsOnTrust[y] * pct);
          if (cgtShare > 0) {
            if (bName === c1Name) entityDist.c1TrustDist[y] += cgtShare;
            else if (bName === c2Name) entityDist.c2TrustDist[y] += cgtShare;
          }
        }
      });
      const totIdx = distSection.rows.findIndex(r => r.label === "Total Distributions");
      if (totIdx >= 0) distSection.rows[totIdx].values = distSection.rows[totIdx].values.map((v, y) => v + remainsOnTrust[y]);
    }

    // Update chart data
    if (trustData.chartData) {
      trustData.chartData.forEach((d, y) => {
        if (remainsOnTrust[y]) d.totalDist = (d.totalDist || 0) + remainsOnTrust[y];
      });
    }
  });

  // Companies
  const companyCGTList = (engineData.companies || []).map((co, ci) => {
    const compOwnerKey = `company_${ci}`;
    return {
      name: co.company_name || `Company ${ci + 1}`,
      ...buildCGTForEntity(_cgtCtx, 
        (a) => a.a_owner === compOwnerKey || a.a_ownType === "4" && a.a_owner === compOwnerKey,
        0.0, // companies get NO CGT discount
        (v) => Math.round(v * 0.25), // 25% company tax
        0
      ),
    };
  });

  // SMSFs
  const smsfCGTList = (engineData.smsfs || []).map((sf, si) => {
    const smsfOwnerKey = `smsf_${si}`;
    return {
      name: sf.smsf_name || `SMSF ${si + 1}`,
      ...buildCGTForEntity(_cgtCtx, 
        (a) => a.a_ownType === "5" && (a.a_owner === smsfOwnerKey || a.a_owner?.startsWith(`smsf_${si}_`)),
        0.3333, // SMSF accumulation: 1/3 discount
        (v) => Math.round(v * 0.15), // 15% super tax (0% in pension phase)
        0
      ),
    };
  });

  // ── Inject CGT assessable into company income/tax statements ──
  companyCGTList.forEach((cCGT, ci) => {
    const compData = companyDataList[ci];
    if (!compData) return;
    const cgtVals = cCGT.cgtChartData.map(d => d.finalNet);
    const hasCGT = cgtVals.some(v => v > 0);
    if (!hasCGT) return;
    const cgtSource = { label: "CGT Schedule", nav: ["Cashflow/Tax", "CGT", cCGT.name] };
    // Patch income section
    const incSection = compData.data.sections.find(s => s.id === "company-income");
    if (incSection) {
      const cgIdx = incSection.rows.findIndex(r => r.label === "Capital Gain");
      if (cgIdx >= 0) incSection.rows[cgIdx] = { label: "Net Capital Gain (Assessable)", values: cgtVals, style: "child", source: cgtSource };
      const totIdx = incSection.rows.findIndex(r => r.label === "Total Income");
      if (totIdx >= 0) incSection.rows[totIdx].values = incSection.rows[totIdx].values.map((v, y) => v + cgtVals[y]);
    }
    // Patch tax assessable section
    const taxSection = compData.data.sections.find(s => s.id === "company-tax");
    if (taxSection) {
      const cgIdx = taxSection.rows.findIndex(r => r.label === "Capital Gain");
      if (cgIdx >= 0) taxSection.rows[cgIdx] = { label: "Net Capital Gain (Assessable)", values: cgtVals, style: "child", source: cgtSource };
      const totIdx = taxSection.rows.findIndex(r => r.label === "Total Income");
      if (totIdx >= 0) taxSection.rows[totIdx].values = taxSection.rows[totIdx].values.map((v, y) => v + cgtVals[y]);
    }
    // Update taxable income and tax payable
    const taxSummary = compData.data.sections.find(s => s.id === "company-tax-summary");
    if (taxSummary) {
      const tiIdx = taxSummary.rows.findIndex(r => r.label === "Taxable Income");
      if (tiIdx >= 0) taxSummary.rows[tiIdx].values = taxSummary.rows[tiIdx].values.map((v, y) => v + cgtVals[y]);
      const tpIdx = taxSummary.rows.findIndex(r => r.label && r.label.startsWith("Tax Payable"));
      if (tpIdx >= 0) taxSummary.rows[tpIdx].values = taxSummary.rows[tpIdx].values.map((v, y) => v + Math.round(cgtVals[y] * 0.25));
    }
  });

  // ── Inject CGT assessable into SMSF income/tax statements ──
  smsfCGTList.forEach((sCGT, si) => {
    const smsfData = smsfDataList[si];
    if (!smsfData) return;
    const cgtVals = sCGT.cgtChartData.map(d => d.finalNet);
    const hasCGT = cgtVals.some(v => v > 0);
    if (!hasCGT) return;
    const cgtSource = { label: "CGT Schedule", nav: ["Cashflow/Tax", "CGT", sCGT.name] };

    // Patch income section (pooled = smsf-income, segregated has per-account seg-income)
    const incSection = smsfData.data.sections.find(s => s.id === "smsf-income");
    if (incSection) {
      const cgIdx = incSection.rows.findIndex(r => r.label === "Capital Gain");
      if (cgIdx >= 0) incSection.rows[cgIdx] = { label: "Net Capital Gain (Discounted)", values: cgtVals, style: "child", source: cgtSource };
      const totIdx = incSection.rows.findIndex(r => r.label === "Total Income");
      if (totIdx >= 0) incSection.rows[totIdx].values = incSection.rows[totIdx].values.map((v, y) => v + cgtVals[y]);
    }
    // Patch tax assessable section
    const taxSection = smsfData.data.sections.find(s => s.id === "smsf-tax");
    if (taxSection) {
      const cgIdx = taxSection.rows.findIndex(r => r.label && r.label.includes("Capital Gain"));
      if (cgIdx >= 0) taxSection.rows[cgIdx] = { label: "Net Capital Gain (Discounted)", values: cgtVals, style: "child", source: cgtSource };
      const totIdx = taxSection.rows.findIndex(r => r.label === "Total Fund Income");
      if (totIdx >= 0) taxSection.rows[totIdx].values = taxSection.rows[totIdx].values.map((v, y) => v + cgtVals[y]);
    }
    // Update tax summary
    const taxSummary = smsfData.data.sections.find(s => s.id === "smsf-tax-summary");
    if (taxSummary) {
      const tiIdx = taxSummary.rows.findIndex(r => r.label === "Taxable Income");
      if (tiIdx >= 0) taxSummary.rows[tiIdx].values = taxSummary.rows[tiIdx].values.map((v, y) => v + cgtVals[y]);
      const tpIdx = taxSummary.rows.findIndex(r => r.label && r.label.startsWith("Tax Payable"));
      if (tpIdx >= 0) taxSummary.rows[tpIdx].values = taxSummary.rows[tpIdx].values.map((v, y) => v + Math.round(cgtVals[y] * 0.15));
    }
  });

  return { c1CGT, c2CGT, trustCGTList, companyCGTList, smsfCGTList, streamedCGTToClient1, streamedCGTToClient2 };
};
