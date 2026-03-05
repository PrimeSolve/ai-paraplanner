// Build Tax Schedule data — extracted from CashflowModelInner
// Pure function: all dependencies passed via ctx

import { ageAtFYStart as _ageAtFYStart } from "../utils/projectionHelpers.js";
import { resolveDBBenefitPref } from "./buildFinancialSummaryData.js";

export const buildTaxData = (ctx, clientKey) => {
  const {
    N_YEARS, PROJ_YEARS, currentFY,
    engineData, isAdviceModel,
    c1Display, c2Display, c1Short, c2Short,
    ffAssets, ffDebts,
    getAssetRates, getAssetDRP,
    entityDist,
    c1CGT, c2CGT,
    streamedCGTToClient1, streamedCGTToClient2,
    c1PensionShare, c2PensionShare,
    c1InsPremiums, c2InsPremiums,
    ssData,
    debtFreqOverrides, debtIOOverrides,
  } = ctx;
  const ageAtFYStart = (dob) => _ageAtFYStart(dob, currentFY);

    const gross = parseFloat(engineData.income?.[clientKey]?.i_gross) || 0;
    const incPct = parseFloat(engineData.income?.[clientKey]?.i_increase) || 0;
    const superInc = engineData.income?.[clientKey]?.i_super_inc;  // "1" = included, "2" = excluded
    const sgRate = 0.12;
    const clientLabel = clientKey === "client1" ? c1Display : c2Display;
    const shortYears = PROJ_YEARS.map(y => { const p = y.split("/"); return p[0].slice(-4) + "/" + p[1].slice(-2); });

    // Project salary — stops at retirement age
    const clientDobStr = engineData[clientKey]?.date_of_birth;
    const clientRetAge = parseFloat(engineData.advice_reason?.quick?.[clientKey]?.ret_age) || 67;
    const clientCurrentAge = clientDobStr ? (() => {
      const d = new Date(clientDobStr); const n = new Date(currentFY, 6, 1);
      let a = n.getFullYear() - d.getFullYear();
      if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
      return a;
    })() : (clientKey === "client1" ? 60 : 56);
    const retirementYear = Math.max(0, clientRetAge - clientCurrentAge);
    const salaries = [];
    let s = gross;
    for (let y = 0; y < N_YEARS; y++) { salaries.push(y >= retirementYear ? 0 : Math.round(s)); s = s * (1 + incPct / 100); }

    // Paid Parental Leave (Strategy 1) — taxable income
    const pplVals = new Array(N_YEARS).fill(0);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(st => st.strategy_id === "1").forEach(st => {
        const weeks = parseInt(st.ppl_weeks) || 0;
        if (weeks <= 0) return;
        const totalPay = Math.round(weeks * 948.10);
        const sy = Math.max(0, (parseInt(st.start_year) || currentFY) - currentFY);
        if (sy >= N_YEARS) return;
        if ((st.owner_id || "client1") === clientKey) pplVals[sy] += totalPay;
      });
    }
    // Add PPL to salaries for tax purposes
    const salariesExPPL = salaries.map((s, y) => s); // copy before PPL
    pplVals.forEach((v, y) => { if (v > 0) salaries[y] += v; });

    // JobSeeker Payment (Strategy 210) — taxable income, ceases at Age Pension age (67)
    const jobseekerVals = new Array(N_YEARS).fill(0);
    const JOBSEEKER_FORTNIGHTLY = 789.90; // Single 22+, no children, Mar 2025
    const JOBSEEKER_ANNUAL_BASE = Math.round(JOBSEEKER_FORTNIGHTLY * 26); // $20,537
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(st => st.strategy_id === "210").forEach(st => {
        if ((st.owner_id || "client1") !== clientKey) return;
        const sy = Math.max(0, (parseInt(st.start_year) || currentFY) - currentFY);
        const ey = st.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(st.end_year) || currentFY + 30) - currentFY);
        if (sy >= N_YEARS) return;
        for (let y = sy; y <= ey && y < N_YEARS; y++) {
          // Cease at Age Pension age (67)
          const ageThisYear = clientCurrentAge + y;
          if (ageThisYear >= 67) break;
          // Index with CPI (use inflation rate from assumptions)
          const inflRate = parseFloat(engineData.assumptions?.a_cpi) / 100 || 0.025;
          const indexed = Math.round(JOBSEEKER_ANNUAL_BASE * Math.pow(1 + inflRate, y));
          jobseekerVals[y] += indexed;
        }
      });
    }
    // Add JobSeeker to salaries for tax purposes (it's taxable)
    const salariesExJS = salaries.map(s => s); // copy before JobSeeker
    jobseekerVals.forEach((v, y) => { if (v > 0) salaries[y] += v; });

    // Disability Support Pension (Strategy 219) — taxable income, ceases at Age Pension age (67)
    const dspVals = new Array(N_YEARS).fill(0);
    const DSP_SINGLE_FN_TX = 1149.00;
    const DSP_COUPLE_FN_TX = 866.80;
    const hasPartnerTX = !!engineData.client2?.first_name;
    const DSP_FN_TX = hasPartnerTX ? DSP_COUPLE_FN_TX : DSP_SINGLE_FN_TX;
    const DSP_ANNUAL_BASE_TX = Math.round(DSP_FN_TX * 26);
    if (isAdviceModel) {
      (engineData.advice_request?.strategy?.strategies || []).filter(st => st.strategy_id === "219").forEach(st => {
        if ((st.owner_id || "client1") !== clientKey) return;
        const sy = Math.max(0, (parseInt(st.start_year) || currentFY) - currentFY);
        const ey = st.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(st.end_year) || currentFY + 30) - currentFY);
        if (sy >= N_YEARS) return;
        for (let y = sy; y <= ey && y < N_YEARS; y++) {
          const ageThisYear = clientCurrentAge + y;
          if (ageThisYear >= 67) break; // transitions to Age Pension
          const inflRate = parseFloat(engineData.assumptions?.a_cpi) / 100 || 0.025;
          const indexed = Math.round(DSP_ANNUAL_BASE_TX * Math.pow(1 + inflRate, y));
          dspVals[y] += indexed;
        }
      });
    }
    // Add DSP to salaries for tax purposes (it's taxable)
    const salariesExDSP = salaries.map(s => s); // copy before DSP
    dspVals.forEach((v, y) => { if (v > 0) salaries[y] += v; });

    // Rental income from investment properties (type "18") and absent PR (type "19")
    const investProps = ffAssets.filter(a => a.a_type === "18" || a.a_type === "21" || a.a_type === "19");
    const rentalIncomeVals = new Array(N_YEARS).fill(0);
    // Move-back strategies: type "19" assets with strategy 56 cease rental income from start_year
    const moveBackStratsAll = (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "56" && s.moveback_property_idx !== "");
    investProps.forEach(a => {
      const assetIdx = ffAssets.indexOf(a);
      // Check if this absent PR is being moved back into
      const mbStrat = a.a_type === "19" ? moveBackStratsAll.find(s => parseInt(s.moveback_property_idx) === assetIdx) : null;
      const mbStartYr = mbStrat ? (parseInt(mbStrat.start_year) || currentFY) : 9999;
      const weeklyRent = parseFloat(a.a_rental_income) || 0;
      const rentFreq = parseFloat(a.a_rental_freq) || 52;
      const annualRent = weeklyRent * rentFreq;
      // Split: joint = 50%, sole owner matching clientKey = 100%, else 0%
      const share = a.a_ownType === "2" ? 0.5 : a.a_owner === clientKey ? 1 : 0;
      const rentGrowth = getAssetRates(assetIdx, a.a_type).growthRate; // 3% rental growth assumption
      let rent = annualRent * share;
      for (let y = 0; y < N_YEARS; y++) {
        const fy = currentFY + y;
        // If moved back into this property, rental income ceases from move-back year
        if (fy >= mbStartYr) { rent = rent * (1 + rentGrowth); continue; }
        rentalIncomeVals[y] += Math.round(rent);
        rent = rent * (1 + rentGrowth);
      }
    });

    // Investment income from non-property assets (interest, dividends, distributions)
    // DRP assets: still assessable for tax (franking credits apply) but use DRP-compounded balance
    const investIncomeVals = new Array(N_YEARS).fill(0);
    const frankingVals = new Array(N_YEARS).fill(0);
    ffAssets.filter(a => !["1", "18"].includes(a.a_type)).forEach(a => {
      const assetIdx = ffAssets.indexOf(a);
      const val = parseFloat(a.a_value) || 0;
      if (val <= 0) return;
      const rates = getAssetRates(assetIdx, a.a_type);
      if (rates.incomeYield <= 0) return;
      const share = a.a_ownType === "2" ? 0.5 : a.a_owner === clientKey ? 1 : 0;
      if (share === 0) return;
      const isDRP = getAssetDRP(assetIdx, a.a_type);
      let running = val;
      for (let y = 0; y < N_YEARS; y++) {
        const inc = Math.round(running * rates.incomeYield * share);
        investIncomeVals[y] += inc;
        const frankedAmt = Math.round(inc * rates.frankingPct);
        frankingVals[y] += Math.round(frankedAmt * 0.30 / 0.70);
        if (isDRP) {
          // Half-yearly compounding: balance grows faster
          const halfGrowth = Math.pow(1 + rates.growthRate, 0.5) - 1;
          const halfYield = rates.incomeYield / 2;
          running = running * (1 + halfGrowth);
          running += Math.round(running * halfYield);
          running = running * (1 + halfGrowth);
          running += Math.round(running * halfYield);
        } else {
          running = running * (1 + rates.growthRate);
        }
      }
    });

    // Total gross income = salary + rental + investment income
    const totalIncomeExPension = salaries.map((sal, y) => sal + rentalIncomeVals[y] + investIncomeVals[y]);

    // Pension assessable income: taxable component of drawdown if under 60
    const clientDobTax = clientKey === "client1" ? engineData.client1?.date_of_birth : engineData.client2?.date_of_birth;
    const clientAgeTax = ageAtFYStart(clientDobTax) ?? (clientKey === "client1" ? 60 : 56);
    const pensionAssessable = new Array(N_YEARS).fill(0);
    const pensionTaxOffset = new Array(N_YEARS).fill(0);
    const clientPensions = (engineData.pensions || []).filter(p => p.owner === clientKey);
    clientPensions.forEach(pf => {
      const pfBal = parseFloat(pf.balance) || 0;
      if (pfBal <= 0) return;
      const pfDrawdownRate = (parseFloat(pf.drawdown_rate) || 5) / 100;
      const pfDrawdownType = pf.drawdown_type || "percentage";
      const pfDrawdownFixed = parseFloat(pf.drawdown_amount) || 0;
      const pfAdminFee = parseFloat(pf.fees?.admin_fee) || 0;
      const pfPctFee = (parseFloat(pf.fees?.percent_fee) || 0) / 100;
      const pfGrowthRate = 0.07;
      const pfTaxFreePct = (parseFloat(pf.tax_components?.tax_free_pct) || 0) / 100;
      const pfType = pf.pension_type || "account-based";
      const pfIsTTR = pfType === "ttr";
      // TTR→ABP conversion context for income loop
      const pfClientDob = pf.owner === "client1" ? engineData.client1?.date_of_birth : engineData.client2?.date_of_birth;
      const pfClientData = engineData[pf.owner] || {};
      const pfAlreadyRetired = pfClientData.employment_status === "7";
      const pfCorMet = pfClientData.condition_of_release === true || pfClientData.condition_of_release === "yes";
      const pfRetAge = parseFloat(engineData.advice_reason?.quick?.[pf.owner]?.ret_age) || 67;
      const pfPresAge = (() => {
        if (!pfClientDob) return 60;
        const d = new Date(pfClientDob); const y = d.getFullYear(), m = d.getMonth() + 1;
        if (y < 1960 || (y === 1960 && m <= 6)) return 55;
        if (y < 1961) return 56; if (y < 1963) return 57; if (y < 1964) return 58;
        if (y < 1965) return 59; return 60;
      })();
      const pfPresMet = (age) => age >= pfPresAge && (pfAlreadyRetired || pfCorMet || age >= 67 || age >= pfRetAge);
      const pfEffType = (age) => (pfIsTTR && !pfPresMet(age)) ? "ttr" : (pfIsTTR ? "account-based" : pfType);

      const pfAbpMinRate = (age) => {
        if (age < 65) return 0.04; if (age < 75) return 0.05; if (age < 80) return 0.06;
        if (age < 85) return 0.07; if (age < 90) return 0.09; if (age < 95) return 0.11; return 0.14;
      };

      let pfRunning = pfBal;
      for (let y = 0; y < N_YEARS; y++) {
        const age = clientAgeTax + y;
        if (pfRunning <= 0) continue;
        const minDraw = Math.round(pfRunning * pfAbpMinRate(age));
        const effPfType = pfEffType(age);
        const pfEarningsTax = effPfType === "ttr" ? 0.15 : 0;
        const maxDraw = effPfType === "ttr" ? Math.round(pfRunning * 0.10) : pfRunning;
        let drawdown;
        if (pfDrawdownType === "dollar") {
          drawdown = Math.max(minDraw, Math.min(maxDraw, pfDrawdownFixed));
        } else {
          drawdown = Math.max(minDraw, Math.min(maxDraw, Math.round(pfRunning * pfDrawdownRate)));
        }
        drawdown = Math.min(drawdown, pfRunning);

        // Under 60: taxable component is assessable with 15% offset
        if (age < 60) {
          const txDraw = Math.round(drawdown * (1 - pfTaxFreePct));
          pensionAssessable[y] += txDraw;
          pensionTaxOffset[y] += Math.round(txDraw * 0.15);
        }
        // Age 60+: nothing assessable

        const fees = Math.round(pfAdminFee + (pfRunning * pfPctFee));
        const avgBal = pfRunning - drawdown / 2 - fees / 2;
        const growth = Math.round(Math.max(0, avgBal) * pfGrowthRate * (1 - pfEarningsTax)); // pfEarningsTax now year-aware
        pfRunning = Math.max(0, pfRunning - drawdown - fees + growth);
      }
    });

    // SMSF pension accounts — assess taxable component if under 60
    (engineData.smsfs || []).forEach(sf => {
      (sf.accounts || []).forEach(acc => {
        if (acc.tax_environment !== "pension" || acc.owner !== clientKey) return;
        const smsfDrawdown = parseFloat(acc.pension_drawdown) || 0;
        if (smsfDrawdown <= 0) return;
        const smsfTFPct = (parseFloat(acc.tax_free_pct) || 0) / 100;
        for (let y = 0; y < N_YEARS; y++) {
          const age = clientAgeTax + y;
          if (age < 60) {
            const txDraw = Math.round(smsfDrawdown * (1 - smsfTFPct));
            pensionAssessable[y] += txDraw;
            pensionTaxOffset[y] += Math.round(txDraw * 0.15);
          }
        }
      });
    });

    const totalIncome = totalIncomeExPension.map((inc, y) => inc + pensionAssessable[y]);

    // DB Pension assessable income
    const dbPensionAssessable = new Array(N_YEARS).fill(0);
    const dbPensionTaxOffset = new Array(N_YEARS).fill(0);
    (engineData.definedBenefits || []).forEach((db, dbIdx) => {
      if (!db.scheme || db.owner !== clientKey) return;
      const resolved = resolveDBBenefitPref(db, dbIdx, engineData, isAdviceModel);
      const exitAgeDB = parseFloat(db.expected_exit_age) || 65;
      const exitYrDB = resolved.startYear ? Math.max(0, resolved.startYear - currentFY) : Math.max(0, Math.round(exitAgeDB - clientCurrentAge));
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

      // Untaxed % — PSS employer component as proportion of total benefit
      // For CSS, employer-financed indexed pension is treated as untaxed element
      const memberComp = parseFloat(db.member_component) || 0;
      const prodComp = parseFloat(db.productivity_component) || 0;
      const employerComp = parseFloat(db.employer_component) || 0;
      const totalComp = memberComp + prodComp + employerComp;
      const untaxedPct = isPSS && totalComp > 0 ? employerComp / totalComp : isCSS ? 0.6 : 0.5;

      let exitPension = 0;
      if (statusDB === "pension") {
        exitPension = parseFloat(db.current_pension_annual) || 0;
        const indexed = db.pension_indexed !== "no";
        for (let y = 0; y < N_YEARS; y++) {
          const pension = Math.round(exitPension * Math.pow(1 + (indexed ? cpiDB : 0), y));
          const age = clientCurrentAge + y;
          if (age >= 60) {
            // Over 60: taxed element tax-free, untaxed element assessable (with 10% offset)
            const untaxedAmount = Math.round(pension * untaxedPct);
            dbPensionAssessable[y] += untaxedAmount;
            dbPensionTaxOffset[y] += Math.round(untaxedAmount * 0.10);
          } else {
            // Under 60: entire pension is assessable, 15% tax offset
            dbPensionAssessable[y] += pension;
            dbPensionTaxOffset[y] += Math.round(pension * 0.15);
          }
        }
        return;
      }

      // Calculate exit pension
      if (isPSS) {
        const currentABMDB = parseFloat(db.current_abm) || 0;
        const tenYrDB = db.ten_year_rule_met === "yes";
        const abmAccDB = tenYrDB ? 0.11 + (2 * contribRateDB) : 0.11 + (2 * Math.min(contribRateDB, 0.05));
        const projABM = currentABMDB + (abmAccDB * exitYrDB);
        const projFAS = currentSalaryDB * Math.pow(1 + salaryGrowthDB, exitYrDB);
        let benefit = Math.round(projFAS * projABM);
        const mbl = projFAS >= 50000 ? projFAS * 10 : 500000;
        benefit = Math.min(benefit, mbl);
        const pcf = exitAgeDB <= 55 ? 12 : exitAgeDB <= 60 ? 12 - ((exitAgeDB - 55) * 0.2) : exitAgeDB <= 65 ? 11 - ((exitAgeDB - 60) * 0.2) : 10;
        exitPension = pcf > 0 ? Math.round((benefit * pensionPctDB) / pcf) : 0;
      } else if (isCSS) {
        const cssYrs = (parseFloat(db.years_service) || 0) + exitYrDB;
        const cssFinalSal = currentSalaryDB * Math.pow(1 + salaryGrowthDB, exitYrDB);
        const cssPct = Math.min(0.525, (cssYrs / 40) * 0.525) * (exitAgeDB >= 65 ? 1 : exitAgeDB >= 60 ? 0.95 : exitAgeDB >= 55 ? 0.85 : 0.75);
        exitPension = Math.round(cssFinalSal * cssPct * pensionPctDB);
      } else {
        exitPension = Math.round((parseFloat(db.estimated_annual_pension) || 0) * pensionPctDB);
      }

      for (let y = exitYrDB; y < N_YEARS; y++) {
        const yearsPost = y - exitYrDB;
        const pension = Math.round(exitPension * Math.pow(1 + cpiDB, yearsPost));
        const age = clientCurrentAge + y;
        if (age >= 60) {
          const untaxedAmount = Math.round(pension * untaxedPct);
          dbPensionAssessable[y] += untaxedAmount;
          dbPensionTaxOffset[y] += Math.round(untaxedAmount * 0.10);
        } else {
          dbPensionAssessable[y] += pension;
          dbPensionTaxOffset[y] += Math.round(pension * 0.15);
        }
      }
    });

    const totalIncomeWithDB = totalIncome.map((inc, y) => inc + dbPensionAssessable[y]);

    // Annuity assessable income
    const annuityAssessable = new Array(N_YEARS).fill(0);
    const annuityTaxOffset = new Array(N_YEARS).fill(0);
    const clientAnnuities = (engineData.annuities || []).filter(a => a.owner === clientKey);
    clientAnnuities.forEach(an => {
      const anIncome = parseFloat(an.income?.annual_income) || 0;
      if (anIncome <= 0) return;
      const isSuper = an.tax_environment === "super";
      const cpiIndexed = an.cpi_indexed !== false;
      const cpiRate = 0.025;
      const deductibleAmt = parseFloat(an.income?.deductible_amount) || 0;
      const anTaxFreePct = (parseFloat(an.tax_components?.tax_free_pct) || 0) / 100;
      const isFixedTerm = an.annuity_type === "fixed-term";
      const commDate = an.commencement_date ? new Date(an.commencement_date) : null;
      const matDate = an.maturity_date ? new Date(an.maturity_date) : null;
      const termYears = matDate && commDate ? Math.round((matDate - commDate) / (365.25 * 86400000)) : 0;
      const yearsElapsed = commDate ? Math.round((new Date(currentFY, 6, 1) - commDate) / (365.25 * 86400000)) : 0;
      const remainingTerm = isFixedTerm ? Math.max(0, termYears - yearsElapsed) : 99;

      for (let y = 0; y < N_YEARS; y++) {
        const age = clientAgeTax + y;
        if (isFixedTerm && y >= remainingTerm) continue;
        const income = cpiIndexed ? Math.round(anIncome * Math.pow(1 + cpiRate, y)) : anIncome;

        if (isSuper && age >= 60) {
          // Super annuity, 60+: entirely tax-free — nothing assessable
        } else if (isSuper && age < 60) {
          // Super annuity, under 60: taxable component less deductible, 15% offset
          const taxableIncome = Math.round(income * (1 - anTaxFreePct));
          const assessable = Math.max(0, taxableIncome - deductibleAmt);
          annuityAssessable[y] += assessable;
          annuityTaxOffset[y] += Math.round(assessable * 0.15);
        } else {
          // Non-super: income less deductible amount is assessable, no 15% offset
          annuityAssessable[y] += Math.max(0, income - deductibleAmt);
        }
      }
    });

    const totalIncomeWithAnnuity = totalIncomeWithDB.map((inc, y) => inc + annuityAssessable[y]);

    // Trust distributions and company dividends (assessable income + franking gross-up)
    const isC1 = clientKey === "client1";
    const trustDistVals = isC1 ? entityDist.c1TrustDist : entityDist.c2TrustDist;
    const companyDivVals = isC1 ? entityDist.c1CompanyDiv : entityDist.c2CompanyDiv;
    const entityFrankingVals = isC1 ? entityDist.c1FrankingCredits : entityDist.c2FrankingCredits;
    const stratDirFeeVals = isC1 ? entityDist.c1DirectorFees : entityDist.c2DirectorFees;
    const stratLoanInterest = isC1 ? entityDist.c1SHLoanInterestInc : entityDist.c2SHLoanInterestInc;
    const totalIncomeWithEntities = totalIncomeWithAnnuity.map((inc, y) => inc + trustDistVals[y] + companyDivVals[y] + entityFrankingVals[y] + frankingVals[y] + stratDirFeeVals[y] + stratLoanInterest[y]);

    // Age Pension income (split per client)
    const agePensionVals = clientKey === "client1" ? c1PensionShare : c2PensionShare;
    const totalIncomeWithPensionGovt = totalIncomeWithEntities.map((inc, y) => inc + agePensionVals[y]);

    // ── Sell Transaction CGT per client (advice model only) ──
    // Net CGT assessable from CGT engine (losses absorbed, discount applied)
    // CGT losses can only offset CGT gains, not other income — this is handled in the CGT engine
    const cgtEngineData = clientKey === "client1" ? c1CGT : c2CGT;
    const sellCGTClient = cgtEngineData.cgtChartData.map(d => d.finalNet);
    const sellProceedsClient = new Array(N_YEARS).fill(0);
    if (isAdviceModel) {
      const sellTxnsClient = (engineData.advice_request?.transactions?.sell || []);
      const currentFYSellTax = new Date().getFullYear();
      sellTxnsClient.forEach(s => {
        const assetIdx = parseInt(s.asset_idx);
        const asset = !isNaN(assetIdx) ? ffAssets[assetIdx] : null;
        if (!asset) return;
        const isPersonal = !["3", "4", "5"].includes(s.entity_type);
        if (!isPersonal) return;
        const isJoint = asset.a_owner === "joint";
        const isOwner = asset.a_owner === clientKey;
        if (!isJoint && !isOwner) return;
        const share = isJoint ? 0.5 : 1.0;
        const sellYear = parseInt(s.sell_year) || currentFYSellTax;
        const yIdx = sellYear - currentFYSellTax;
        if (yIdx < 0 || yIdx >= N_YEARS) return;
        const currentVal = parseFloat(asset.a_value) || 0;
        const sellAmt = s.sell_entire_amount ? currentVal : Math.min(parseFloat(s.amount) || 0, currentVal);
        const txnCostPct = (parseFloat(s.transaction_costs_pct) || 0) / 100;
        const netProceeds = Math.round(sellAmt * (1 - txnCostPct));
        sellProceedsClient[yIdx] += Math.round(netProceeds * share);
      });
    }
    // Add streamed trust CGT (from CGT streaming) to client's personal assessable CGT
    const streamedTrustCGT = clientKey === "client1" ? streamedCGTToClient1 : streamedCGTToClient2;
    // Add company exit liquidator CGT (after SB concessions applied)
    const exitLiqCGTVals = clientKey === "client1" ? entityDist.c1ExitLiqCGT : entityDist.c2ExitLiqCGT;
    const totalCGTClient = sellCGTClient.map((v, y) => v + streamedTrustCGT[y] + exitLiqCGTVals[y]);
    const totalIncomeWithCGT = totalIncomeWithPensionGovt.map((inc, y) => inc + totalCGTClient[y]);

    // Concessional contributions (SG + salary sacrifice deduction)
    const salSac = parseFloat(engineData.superProducts?.find(sp => sp.owner === clientKey)?.contributions?.salary_sacrifice) || 0;
    const baseSalaries = [];
    let bs = superInc === "1" ? gross / (1 + sgRate) : gross;
    for (let y = 0; y < N_YEARS; y++) { baseSalaries.push(Math.round(bs)); bs = bs * (1 + incPct / 100); }
    const sgAmts = baseSalaries.map(sal => Math.round(sal * sgRate));
    const concContribs = sgAmts.map(sg => Math.min(30000, sg + salSac)); // cap at $30k CC cap

    // Deductible interest from investment loans — period-by-period amortisation
    const investDebts = ffDebts.filter(d => ["2","3"].includes(d.d_type));
    const deductibleInterest = new Array(N_YEARS).fill(0);
    investDebts.forEach(d => {
      const dRef5 = `debt_${ffDebts.indexOf(d)}`;
      const dBal = parseFloat(d.d_balance) || 0;
      const dRate = parseFloat(d.d_rate) || 0;
      const dStatedRepay = parseFloat(d.d_repayments) || 0;
      const dFreq = parseFloat(debtFreqOverrides[dRef5] || d.d_freq) || 12;
      const share = d.d_ownType === "2" ? 0.5 : d.d_owner === clientKey ? 1 : 0;
      if (share === 0) return;

      const dTermYears = parseFloat(d.d_term) || 30;
      const dTotalPeriods = dTermYears * dFreq;
      const dDailyRate = dRate / 100 / 365;
      const dPeriodicRate = Math.pow(1 + dDailyRate, 365 / dFreq) - 1;

      // Build strategy overrides for this debt (same logic as debt engine)
      const advStrats = isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []) : [];
      const dLumpSOY = new Array(N_YEARS).fill(0);
      const dLumpEOY = new Array(N_YEARS).fill(0);
      const dRepayOverride = new Array(N_YEARS).fill(null);
      advStrats.filter(s => s.product_id === dRef5).forEach(s => {
        const yIdx = Math.max(0, parseInt(s.start_year) - currentFY);
        const amt = parseFloat(s.amount) || 0;
        if (yIdx >= N_YEARS) return;
        const isEOY = (s.timing || "SOY") === "EOY";
        if (s.strategy_id === "66") { if (isEOY) dLumpEOY[yIdx] += amt; else dLumpSOY[yIdx] += amt; }
        if (s.strategy_id === "54") { for (let yi = yIdx; yi < N_YEARS; yi++) dRepayOverride[yi] = amt; }
        if (s.strategy_id === "158") {
          // Salary packaged: adds to annual repayment (same as debt engine)
          const ownerKey = s.owner_id || "client1";
          const cd = engineData[ownerKey] || {};
          const cat = cd.fbt_category || "";
          const grossCap = cat === "hospital" ? 9010 : cat === "pbi" ? 15900 : cat === "religious" ? Infinity : 0;
          const fbtCap = cd.fbt_exempt === "1" ? Math.max(0, grossCap - (parseFloat(cd.fbt_other_benefits) || 0)) : 0;
          const cappedAmt = Math.min(amt, fbtCap);
          if (cappedAmt > 0) {
            const endYr = s.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY + N_YEARS) - currentFY);
            for (let yi = yIdx; yi <= endYr; yi++) dRepayOverride[yi] = (dRepayOverride[yi] || 0) + cappedAmt;
          }
        }
      });

      // Per-year IO mode
      const ioYearOvr = debtIOOverrides[dRef5] || {};
      const ioForYearTax = Array.from({ length: N_YEARS }, (_, yi) => {
        let mode = d.d_io || "2";
        for (let oi = 0; oi <= yi; oi++) { if (ioYearOvr[oi] !== undefined) mode = ioYearOvr[oi]; }
        return mode === "1";
      });

      let open = dBal;
      for (let y = 0; y < N_YEARS; y++) {
        if (open <= 0) break;
        const isIO = ioForYearTax[y];
        // Apply SOY lump sum
        open = Math.max(0, open - dLumpSOY[y]);
        if (open <= 0) break;

        if (isIO) {
          deductibleInterest[y] += Math.round(open * (dRate / 100) * share);
          open = Math.max(0, open - dLumpEOY[y]);
        } else {
          // Effective repayment with override
          let dMinRepay = 0;
          if (open > 0 && dPeriodicRate > 0 && dTotalPeriods > 0) {
            const periodsLeft = Math.max(1, dTotalPeriods - y * dFreq);
            dMinRepay = open * dPeriodicRate / (1 - Math.pow(1 + dPeriodicRate, -periodsLeft));
          }
          let yearlyRepay = Math.max(dStatedRepay, dMinRepay) * dFreq;
          if (dRepayOverride[y] !== null) yearlyRepay = Math.min(Math.max(dRepayOverride[y], dMinRepay * dFreq), open);
          const periodicRepay = yearlyRepay / dFreq;

          let yearInterest = 0;
          let periodBal = open;
          for (let p = 0; p < dFreq; p++) {
            if (periodBal <= 0) break;
            const pInt = periodBal * dPeriodicRate;
            yearInterest += pInt;
            const pPrinc = Math.max(0, Math.min(periodicRepay, periodBal + pInt) - pInt);
            periodBal = Math.max(0, periodBal - pPrinc);
          }
          deductibleInterest[y] += Math.round(yearInterest * share);
          open = Math.max(0, periodBal - dLumpEOY[y]);
        }
      }
    });

    // Insurance IP deduction (non-super IP premiums are tax-deductible)
    const insIpDeduction = clientKey === "client1" ? c1InsPremiums.nonSuperIpVals : c2InsPremiums.nonSuperIpVals;

    // Strategy 158: per-client salary packaging deduction (FBT exempt employers only)
    const strat158Tax = isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "158") : [];
    const clientPkg = new Array(N_YEARS).fill(0);
    strat158Tax.forEach(s => {
      const ownerKey = s.owner_id || "client1";
      if (ownerKey !== clientKey) return;
      const cd = engineData[ownerKey] || {};
      if (cd.fbt_exempt !== "1") return;
      const cat = cd.fbt_category || "";
      const grossCap = cat === "hospital" ? 9010 : cat === "pbi" ? 15900 : cat === "religious" ? Infinity : 0;
      const fbtCap = Math.max(0, grossCap - (parseFloat(cd.fbt_other_benefits) || 0));
      const amt = Math.min(parseFloat(s.amount) || 0, fbtCap);
      if (amt <= 0) return;
      const startYr = Math.max(0, parseInt(s.start_year) - currentFY);
      const endYr = s.end_year === "Ongoing" ? N_YEARS - 1 : Math.min(N_YEARS - 1, (parseInt(s.end_year) || currentFY + N_YEARS) - currentFY);
      for (let y = startYr; y <= endYr; y++) clientPkg[y] += amt;
    });

    const totalDeductions = totalIncomeWithAnnuity.map((_, y) => concContribs[y] + deductibleInterest[y] + insIpDeduction[y] + (clientPkg[y] || 0));
    // Gross up taxable income by franking credits, then claim as offset
    const taxableIncome = totalIncomeWithCGT.map((inc, y) => Math.max(0, inc - totalDeductions[y]));

    // Australian tax rates 2024-25
    const calcTax = (ti) => {
      if (ti <= 18200) return 0;
      if (ti <= 45000) return Math.round((ti - 18200) * 0.16);
      if (ti <= 135000) return Math.round(4288 + (ti - 45000) * 0.30);
      if (ti <= 190000) return Math.round(31288 + (ti - 135000) * 0.37);
      return Math.round(51638 + (ti - 190000) * 0.45);
    };

    const taxPayable = taxableIncome.map(ti => calcTax(ti));

    // LITO offset
    const calcLITO = (ti) => {
      if (ti <= 45000) return 700;
      if (ti <= 66667) return Math.round(700 - (ti - 45000) * 0.05);
      return 0;
    };
    const lito = taxableIncome.map(ti => calcLITO(ti));
    // SAPTO — Seniors and Pensioners Tax Offset (each member of a couple: $1,602, single: $2,230)
    // Available to those receiving age pension
    const saptoMax = ssData.isCouple ? 1602 : 2230;
    const saptoVals = agePensionVals.map((ap, y) => {
      if (ap <= 0) return 0;
      const ti = taxableIncome[y];
      // SAPTO phases out: couple member shading-out at $50,119 rebate income
      const cutout = ssData.isCouple ? 50119 : 32279;
      const threshold = ssData.isCouple ? 28974 : 32279 - (saptoMax / 0.125);
      if (ti <= threshold) return saptoMax;
      if (ti >= cutout) return 0;
      return Math.round(Math.max(0, saptoMax - (ti - threshold) * 0.125));
    });
    // Combined franking credits (personal investments + entity distributions)
    const combinedFrankingVals = frankingVals.map((f, y) => f + entityFrankingVals[y]);
    // Non-refundable offsets (LITO, SAPTO, pension offset, annuity offset) — cannot create a refund
    const nonRefundableOffsets = lito.map((l, y) => l + saptoVals[y] + pensionTaxOffset[y] + annuityTaxOffset[y] + dbPensionTaxOffset[y]);
    // Total offsets for display
    const totalOffsets = nonRefundableOffsets.map((nr, y) => nr + combinedFrankingVals[y]);

    // Medicare levy (2%)
    const medicare = taxableIncome.map(ti => Math.round(ti * 0.02));

    // Apply non-refundable offsets first (can't reduce below zero), then franking (refundable, can create refund)
    const finalTax = taxPayable.map((tp, y) => {
      const afterNonRefundable = Math.max(0, tp - nonRefundableOffsets[y]);
      const afterFranking = afterNonRefundable - combinedFrankingVals[y];
      return afterFranking + medicare[y];
    });

    const taxData = {
      years: shortYears,
      sections: [
        { id: "tax-income", title: "Income", entity: clientLabel, rows: [
          { label: "Salary", values: salariesExPPL, style: "child" },
          ...(pplVals.some(v => v > 0) ? [{ label: "Paid Parental Leave", values: pplVals, style: "child" }] : []),
          ...(jobseekerVals.some(v => v > 0) ? [{ label: "JobSeeker Payment", values: jobseekerVals, style: "child" }] : []),
          ...(dspVals.some(v => v > 0) ? [{ label: "Disability Support Pension", values: dspVals, style: "child" }] : []),
          ...(rentalIncomeVals.some(v => v > 0) ? [{ label: "Rental Income", values: rentalIncomeVals, style: "child" }] : []),
          ...(investIncomeVals.some(v => v > 0) ? [{ label: "Investment Income", values: investIncomeVals, style: "child" }] : []),
          ...(pensionAssessable.some(v => v > 0) ? [{ label: "Pension Income (Taxable)", values: pensionAssessable, style: "child" }] : []),
          ...(annuityAssessable.some(v => v > 0) ? [{ label: "Annuity Income (Assessable)", values: annuityAssessable, style: "child" }] : []),
          ...(dbPensionAssessable.some(v => v > 0) ? [{ label: "DB Pension (Assessable)", values: dbPensionAssessable, style: "child", source: { label: "Defined Benefit", nav: ["Products", "Defined Benefit", null] } }] : []),
          ...(trustDistVals.some(v => v > 0) ? [{ label: "Trust Distributions", values: trustDistVals, style: "child" }] : []),
          ...(companyDivVals.some(v => v > 0) ? [{ label: "Company Dividends", values: companyDivVals, style: "child" }] : []),
          ...(combinedFrankingVals.some(v => v > 0) ? [{ label: "Franking Credits", values: combinedFrankingVals, style: "child" }] : []),
          ...(agePensionVals.some(v => v > 0) ? [{ label: "Age Pension", values: agePensionVals, style: "child" }] : []),
          ...(sellCGTClient.some(v => v > 0) ? [{ label: "Net Capital Gain (Personal)", values: sellCGTClient, style: "child", source: { label: "CGT Schedule", nav: ["Cashflow/Tax", "CGT", clientKey === "client1" ? c1Short : c2Short] } }] : []),
          ...(streamedTrustCGT.some(v => v > 0) ? [{ label: "CGT Streamed from Trust", values: streamedTrustCGT, style: "child" }] : []),
          ...(exitLiqCGTVals.some(v => v > 0) ? [{ label: "Company Exit — Liquidator CGT (after concessions)", values: exitLiqCGTVals, style: "child" }] : []),
          { label: "Total Income", values: totalIncomeWithCGT, style: "total" },
        ]},
        { id: "tax-deductions", title: "Deductions", rows: [
          { label: "Concessional Contributions", values: concContribs, style: "child" },
          { label: "Deductible Interest", values: deductibleInterest, style: "child" },
          ...(insIpDeduction.some(v => v > 0) ? [{ label: "Income Protection Insurance", values: insIpDeduction, style: "child" }] : []),
          ...(clientPkg.some(v => v > 0) ? [{ label: "Salary Packaging (FBT Exempt)", values: clientPkg, style: "child" }] : []),
          { label: "Total Deductions", values: totalDeductions, style: "total" },
        ]},
        { id: "tax-taxable-income", rows: [
          { label: "Taxable Income", values: taxableIncome, style: "highlight" },
        ]},
        { id: "tax-payable", rows: [
          { label: "Tax Payable", values: taxPayable, style: "subtotal" },
        ]},
        { id: "tax-offsets", title: "Offsets", rows: [
          { label: "LITO", values: lito, style: "child" },
          ...(saptoVals.some(v => v > 0) ? [{ label: "SAPTO", values: saptoVals, style: "child" }] : []),
          ...(combinedFrankingVals.some(v => v > 0) ? [{ label: "Franking Credit Offset", values: combinedFrankingVals, style: "child" }] : []),
          ...(pensionTaxOffset.some(v => v > 0) ? [{ label: "Pension 15% Tax Offset", values: pensionTaxOffset, style: "child" }] : []),
          ...(annuityTaxOffset.some(v => v > 0) ? [{ label: "Annuity 15% Tax Offset", values: annuityTaxOffset, style: "child" }] : []),
          ...(dbPensionTaxOffset.some(v => v > 0) ? [{ label: "DB Pension 10% Tax Offset", values: dbPensionTaxOffset, style: "child" }] : []),
          { label: "Total Offsets", values: totalOffsets, style: "total" },
        ]},
        { id: "tax-levies", title: "Levies", rows: [
          { label: "Medicare Levy", values: medicare, style: "child" },
          { label: "Total Levies", values: medicare, style: "total" },
        ]},
        { id: "tax-final", rows: [
          { label: "Final Taxes Payable", values: finalTax, style: "highlight" },
        ]},
      ],
    };

    const taxChartData = shortYears.map((year, i) => ({
      year,
      taxableIncome: taxableIncome[i],
      taxPayable: taxPayable[i],
      offsets: totalOffsets[i],
      levies: medicare[i],
      finalTax: finalTax[i],
    }));

    return { taxData, taxChartData };
  };
