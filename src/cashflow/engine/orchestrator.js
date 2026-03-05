import { buildEntityDistributions as _buildEntityDistributions } from "./buildEntityDistributions.js";
import { buildTrustData as _buildTrustData, buildCompanyData as _buildCompanyData, buildBondData as _buildBondData, buildSMSFData as _buildSMSFData } from "./buildEntityData.js";
import { buildPensionStrategyData as _buildPensionStrategyData, buildSuperRegisterData as _buildSuperRegisterData, buildPensionRegisterData as _buildPensionRegisterData, buildAnnuityRegisterData as _buildAnnuityRegisterData, buildDBRegisterData as _buildDBRegisterData } from "./buildRegisterData.js";
import { buildFinancialSummaryData as _buildFinancialSummaryData } from "./buildFinancialSummaryData.js";
import { buildTaxData as _buildTaxData } from "./buildTaxData.js";
import { buildSavingsData as _buildSavingsData } from "./buildSavingsData.js";
import { buildSocialSecurityData as _buildSocialSecurityData } from "./buildSocialSecurityData.js";
import { assembleCGTData as _assembleCGTData } from "./buildCGTData.js";
import { calcInsurancePremiums as _calcInsurancePremiums } from "./calcInsurancePremiums.js";
import { buildHoldingsForCategory as _buildHoldingsForCategory } from "./buildAssetProjections.js";
import { buildDebtData as _buildDebtData } from "./buildDebtData.js";
import { buildAgedCareData as _buildAgedCareData } from "./buildAgedCareData.js";
import { assetCategory } from "../utils/projectionHelpers.js";

/**
 * Run the full projection engine pipeline.
 * CRITICAL: Execution order must be preserved exactly — engine functions have data dependencies.
 */
export function runProjectionEngine({
  engineData, factFind, isAdviceModel,
  currentFY, ageAtFYStart, N_YEARS, PROJ_YEARS, shortYears,
  c1Display, c2Display, c1Short, c2Short, c1Gender, c2Gender,
  ffAssets, ffDebts, adviceDebts, newDebtDrawdowns,
  sellLookup, offsetAssetIndices, strat67All,
  getAssetRates, getAssetDRP, ownerLabel,
  superFundTabs, pensionTabs, annuityTabs, bondTabs,
  smsfTabs, smsfSubTabs,
  debtFreqOverrides, debtIOOverrides,
}) {
  // =========================================================================
  // 1. Asset Holdings (4 categories)
  // =========================================================================
  const _holdingsCtx = {
    N_YEARS, currentFY,
    engineData, factFind, isAdviceModel,
    ffAssets, sellLookup, ownerLabel,
    getAssetRates,
    offsetAssetIndices, strat67All,
  };
  const propertyHoldings = _buildHoldingsForCategory(_holdingsCtx, "property");
  const defensiveHoldings = _buildHoldingsForCategory(_holdingsCtx, "defensive");
  const growthHoldings = _buildHoldingsForCategory(_holdingsCtx, "growth");
  const lifestyleHoldings = _buildHoldingsForCategory(_holdingsCtx, "lifestyle");

  // =========================================================================
  // 2. Entity Distributions (trust/company → personal)
  // =========================================================================
  const entityDist = _buildEntityDistributions({ engineData, N_YEARS, isAdviceModel, currentFY });

  // =========================================================================
  // 3. Insurance Premiums
  // =========================================================================
  const _insCtx = { N_YEARS, engineData };
  const c1InsPremiums = _calcInsurancePremiums(_insCtx, "client1");
  const c2InsPremiums = _calcInsurancePremiums(_insCtx, "client2");
  const combinedNonSuperIns = c1InsPremiums.nonSuperTotalVals.map((v, y) => v + c2InsPremiums.nonSuperTotalVals[y]);

  // =========================================================================
  // 4. Register context + Pension strategy + Annuity + DB data
  // =========================================================================
  const _regCtx = { engineData, N_YEARS, PROJ_YEARS, currentFY, isAdviceModel, c1Short, c2Short, ageAtFYStart };

  const { stratPensionLumpSum, pensionStratOverrides } = _buildPensionStrategyData({ engineData, N_YEARS, currentFY, isAdviceModel });

  const annuity1Data = _buildAnnuityRegisterData(_regCtx, 0);
  const annuity2Data = _buildAnnuityRegisterData(_regCtx, 1);

  const allDBData = (engineData.definedBenefits || []).map((_, i) => _buildDBRegisterData(_regCtx, i));

  // =========================================================================
  // 5. Entity data (bonds, trusts, companies, SMSFs)
  // =========================================================================
  const _entityCtx = { engineData, factFind, N_YEARS, isAdviceModel, currentFY, PROJ_YEARS, shortYears, ffAssets, newDebtDrawdowns, adviceDebts };

  const bondDataList = (engineData.investmentBonds || []).map((_, i) => _buildBondData(_entityCtx, i)).filter(Boolean);
  const trustDataList = (engineData.trusts || []).map((_, i) => _buildTrustData(_entityCtx, i)).filter(Boolean);
  const companyDataList = (engineData.companies || []).map((_, i) => _buildCompanyData(_entityCtx, i)).filter(Boolean);
  const smsfDataList = (engineData.smsfs || []).map((_, i) => _buildSMSFData(_entityCtx, i)).filter(Boolean);

  // =========================================================================
  // 6. Financial Summary (needs smsfDataList, bondDataList, tabs)
  // =========================================================================
  const _fsSummaryCtx = {
    N_YEARS, PROJ_YEARS, currentFY, shortYears,
    engineData, factFind, isAdviceModel,
    c1Display, c2Display, c1Short, c2Short, c1Gender, c2Gender,
    entityDist, combinedNonSuperIns,
    ffAssets, ffDebts,
    getAssetRates, getAssetDRP, sellLookup, ownerLabel,
    debtFreqOverrides, debtIOOverrides,
    smsfDataList, smsfTabs, bondTabs, superFundTabs, pensionTabs, annuityTabs, smsfSubTabs,
    buildBondData: _buildBondData,
  };
  const { superProjections: superProj, rollInPerPension: penRollIn, rollOutPerPension: penRollOut, rollInDetailPerPension, rollOutDetailPerPension, netWorthChartData, cashflowChartData: fsCashflowChartData, summaryMeta, ...financialSummaryRest } = _buildFinancialSummaryData(_fsSummaryCtx);
  const financialSummaryData = financialSummaryRest;

  // =========================================================================
  // 7. Social Security / Age Pension
  // =========================================================================
  const _ssCtx = {
    N_YEARS, PROJ_YEARS, currentFY,
    engineData, isAdviceModel,
    c1Short, c2Short,
    ffAssets,
    superProj, smsfDataList,
    trustDataList, companyDataList, bondDataList,
  };
  const ssData = _buildSocialSecurityData(_ssCtx);

  // =========================================================================
  // 8. Aged Care
  // =========================================================================
  const _agedCareCtx = {
    N_YEARS, currentFY,
    engineData, isAdviceModel,
    superProj, smsfDataList, c1Short, ageAtFYStart,
  };
  const agedCareC1 = _buildAgedCareData(_agedCareCtx, "client1");
  const agedCareC2 = _buildAgedCareData(_agedCareCtx, "client2");
  const c1PensionShare = ssData.totalPensionWithRA.map(v => Math.round(v * (ssData.isCouple ? 0.5 : 1)));
  const c2PensionShare = ssData.isCouple ? ssData.totalPensionWithRA.map(v => Math.round(v * 0.5)) : new Array(N_YEARS).fill(0);
  const combinedPension = ssData.totalPensionWithRA;

  // =========================================================================
  // 9. Pension/RAD patching of financialSummaryData (mutations preserved)
  // =========================================================================
  if (combinedPension.some(v => v > 0)) {
    const fs = financialSummaryData;
    const sections = fs.sections || [];
    const c1Sec = sections.find(s => s.id === "income-client1");
    if (c1Sec) {
      const taxRow = c1Sec.rows.findIndex(r => r.label === "Tax Payable");
      if (taxRow >= 0) c1Sec.rows.splice(taxRow, 0, { label: "Age Pension", values: c1PensionShare, style: "child", source: { label: "Assessment", nav: ["Social Security", "Assessment", null] } });
      const totalRow = c1Sec.rows.find(r => r.label === "Total Cash Inflow");
      if (totalRow) totalRow.values = totalRow.values.map((v, y) => v + c1PensionShare[y]);
    }
    const c2Sec = sections.find(s => s.id === "income-client2");
    if (c2Sec) {
      const taxRow = c2Sec.rows.findIndex(r => r.label === "Tax Payable");
      if (taxRow >= 0) c2Sec.rows.splice(taxRow, 0, { label: "Age Pension", values: c2PensionShare, style: "child", source: { label: "Assessment", nav: ["Social Security", "Assessment", null] } });
      const totalRow = c2Sec.rows.find(r => r.label === "Total Cash Inflow");
      if (totalRow) totalRow.values = totalRow.values.map((v, y) => v + c2PensionShare[y]);
    }
    const combinedSec = sections.find(s => s.id === "combined-cashflow");
    if (combinedSec) {
      const totalRow = combinedSec.rows.find(r => r.label === "Total Net Income");
      if (totalRow) totalRow.values = totalRow.values.map((v, y) => v + combinedPension[y]);
    }
    const cashflowSec = sections.find(s => s.id === "net-cashflow");
    if (cashflowSec) {
      const cfRow = cashflowSec.rows.find(r => r.label === "Net Cashflow");
      if (cfRow) cfRow.values = cfRow.values.map((v, y) => v + combinedPension[y]);
    }
  }

  // Patch net worth with RAD Value (aged care asset — estate refund)
  {
    const radValueCombined = new Array(N_YEARS).fill(0);
    if (agedCareC1?.radBalance) agedCareC1.radBalance.forEach((v, i) => { radValueCombined[i] += v; });
    if (agedCareC2?.radBalance) agedCareC2.radBalance.forEach((v, i) => { radValueCombined[i] += v; });
    if (radValueCombined.some(v => v > 0)) {
      const fs = financialSummaryData;
      const sections = fs.sections || [];
      const nwSec = sections.find(s => s.id === "net-worth");
      if (nwSec) {
        const subs = nwSec.subSections || [];
        subs.push({
          id: "nw-rad",
          label: "RAD Value",
          summaryValues: radValueCombined,
          rows: [
            ...(agedCareC1?.radBalance?.some(v => v > 0) ? [{ label: `${((engineData.client1?.first_name || "") + " " + (engineData.client1?.last_name || "")).trim() || "Client 1"} — RAD`, values: agedCareC1.radBalance, style: "child", nav: ["Aged Care", "Assessment", null] }] : []),
            ...(agedCareC2?.radBalance?.some(v => v > 0) ? [{ label: `${((engineData.client2?.first_name || "") + " " + (engineData.client2?.last_name || "")).trim() || "Client 2"} — RAD`, values: agedCareC2.radBalance, style: "child", nav: ["Aged Care", "Assessment", null] }] : []),
          ],
        });
        const footer = nwSec.footerRows || [];
        const assetsTotalRow = footer.find(r => r.label === "Assets Total");
        if (assetsTotalRow) {
          assetsTotalRow.values = assetsTotalRow.values.map((v, y) => v + radValueCombined[y]);
        }
      }
      const debtSec = sections.find(s => s.id === "debts");
      if (debtSec) {
        const debtFooter = debtSec.footerRows || [];
        debtFooter.forEach(r => {
          if (r.label === "Net Equity (FV) - Ex PR" || r.label === "Net Equity (FV)") {
            r.values = r.values.map((v, y) => v + radValueCombined[y]);
          }
        });
      }
      if (netWorthChartData) {
        netWorthChartData.forEach((d, y) => {
          if (d.totalAssets != null) d.totalAssets += radValueCombined[y];
          if (d.netWorth != null) d.netWorth += radValueCombined[y];
        });
      }
    }
  }

  // =========================================================================
  // 10. CGT Assembly
  // =========================================================================
  const _cgtAssemblyCtx = {
    N_YEARS, PROJ_YEARS, currentFY,
    engineData, isAdviceModel,
    ffAssets, sellLookup,
    getAssetDRP, getAssetRates,
    trustDataList, companyDataList, smsfDataList,
    entityDist,
  };
  const { c1CGT, c2CGT, trustCGTList, companyCGTList, smsfCGTList, streamedCGTToClient1, streamedCGTToClient2 } = _assembleCGTData(_cgtAssemblyCtx);

  // =========================================================================
  // 11. Tax (2x per client)
  // =========================================================================
  const _taxCtx = {
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
  };
  const { taxData: taxClient1Data, taxChartData: taxClient1ChartData } = _buildTaxData(_taxCtx, "client1");
  const { taxData: taxClient2Data, taxChartData: taxClient2ChartData } = _buildTaxData(_taxCtx, "client2");

  // =========================================================================
  // 12. Savings (cashflow hub)
  // =========================================================================
  const _savCtx = {
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
  };
  const { savData: savingsData, cfChartData: cashflowChartData, txnChartData, assetOpenBals } = _buildSavingsData(_savCtx);

  // =========================================================================
  // 13. Debt schedules (3x)
  // =========================================================================
  const _debtCtx = {
    N_YEARS, PROJ_YEARS, currentFY,
    engineData, isAdviceModel,
    ffAssets, ffDebts,
    getAssetRates, ownerLabel,
  };
  const homeLoanData = _buildDebtData(_debtCtx, "home", "homeloan", debtFreqOverrides, debtIOOverrides, assetOpenBals);
  const investmentLoansData = _buildDebtData(_debtCtx, "investment", "invloan", debtFreqOverrides, debtIOOverrides, assetOpenBals);
  const otherDebtsData = _buildDebtData(_debtCtx, "other", "otherdebt", debtFreqOverrides, debtIOOverrides, assetOpenBals);

  // =========================================================================
  // 14. Super/Pension register data (needs superProj)
  // =========================================================================
  const allSuperData = (engineData.superProducts || []).map((_, i) => _buildSuperRegisterData(_regCtx, i, superProj));
  const allPensionData = (engineData.pensions || []).map((_, i) => _buildPensionRegisterData(_regCtx, i, penRollIn?.[i] || null, penRollOut?.[i] || null, rollInDetailPerPension?.[i] || [], rollOutDetailPerPension?.[i] || [], stratPensionLumpSum, pensionStratOverrides));
  const super1Data = allSuperData[0] || null;
  const super2Data = allSuperData[1] || null;
  const pension1Data = allPensionData[0] || null;
  const pension2Data = allPensionData[1] || null;

  // =========================================================================
  // 15. Dynamic Capital Projections — aggregate all engines
  // =========================================================================
  const dynamicAssetTypeChartData = (() => {
    const N = N_YEARS;
    const superTotal = new Array(N).fill(0);
    (superProj || []).forEach(proj => {
      proj.closingVals.forEach((v, y) => { if (y < N) superTotal[y] += v; });
    });
    const pensionTotal = new Array(N).fill(0);
    (engineData.pensions || []).forEach(pf => {
      const bal = parseFloat(pf.balance) || 0;
      const drawdown = parseFloat(pf.pension_drawdown) || 0;
      const growthRate = 0.05;
      let running = bal;
      for (let y = 0; y < N; y++) {
        running = running * (1 + growthRate) - drawdown;
        pensionTotal[y] += Math.max(0, Math.round(running));
      }
    });
    const smsfTotal = new Array(N).fill(0);
    smsfDataList.forEach(fund => {
      if (fund.totalMemberBal) {
        fund.totalMemberBal.forEach((v, y) => { if (y < N) smsfTotal[y] += v; });
      } else if (fund.totalFundBal) {
        fund.totalFundBal.forEach((v, y) => { if (y < N) smsfTotal[y] += v; });
      }
    });
    const bondTotal = new Array(N).fill(0);
    bondDataList.forEach(b => {
      (b.totalEnd || []).forEach((v, y) => { if (y < N) bondTotal[y] += v; });
    });
    const propTotal = new Array(N).fill(0);
    const growthTotal = new Array(N).fill(0);
    const defensiveTotal = new Array(N).fill(0);
    const lifestyleTotal = new Array(N).fill(0);
    const aa = factFind.assetAssumptions || {};
    (factFind.assets || []).forEach(a => {
      if (a.a_ownType === "4" || a.a_ownType === "5" || a.a_ownType === "6") return;
      if ((a.a_owner || "").match(/^(trust|companies|smsf)/)) return;
      const cat = assetCategory(a.a_type);
      let val = parseFloat(a.a_value) || 0;
      const typeDef = aa[a.a_type] || {};
      const gr = (typeDef.growthRate ?? (cat === "property" ? 3 : cat === "growth" ? 6 : cat === "defensive" ? 2 : -10)) / 100;
      for (let y = 0; y < N; y++) {
        if (cat === "property") propTotal[y] += Math.round(val);
        else if (cat === "growth") growthTotal[y] += Math.round(val);
        else if (cat === "defensive") defensiveTotal[y] += Math.round(val);
        else if (cat === "lifestyle") lifestyleTotal[y] += Math.round(val);
        val *= (1 + gr);
      }
    });
    const entityTotal = new Array(N).fill(0);
    trustDataList.forEach(t => {
      if (t.chartData) t.chartData.forEach((d, y) => { if (y < N) entityTotal[y] += d.netWorth || 0; });
    });
    companyDataList.forEach(c => {
      if (c.chartData) c.chartData.forEach((d, y) => { if (y < N) entityTotal[y] += d.netWorth || 0; });
    });

    return Array.from({ length: N }, (_, y) => ({
      year: y + 1,
      investmentProperties: propTotal[y],
      super: superTotal[y] + smsfTotal[y],
      pension: pensionTotal[y],
      investmentAssets: growthTotal[y],
      defensive: defensiveTotal[y],
      lifestyleAssets: lifestyleTotal[y],
      investmentBond: bondTotal[y],
      entities: entityTotal[y],
    }));
  })();

  // =========================================================================
  // 16. Dynamic Milestones
  // =========================================================================
  const dynamicMilestones = (() => {
    const milestones = [];
    const currentYear = new Date().getFullYear();
    (factFind.investmentBonds || []).forEach(b => {
      if (b.commencement_date) {
        const commYear = new Date(b.commencement_date).getFullYear();
        const taxFreeYear = commYear + 10;
        if (taxFreeYear >= currentYear) {
          milestones.push({ milestone: `${b.product_name || "Investment Bond"} — tax-free withdrawals`, entity: b.owner === "client1" ? c1Display : c2Display, year: taxFreeYear, icon: "🔒", type: "milestone" });
        }
      }
    });
    (factFind.smsfs || []).forEach(sf => {
      (sf.accounts || []).forEach(acc => {
        if (acc.tax_environment === "pension" && parseFloat(acc.pension_drawdown) > 0) {
          const isC1 = acc.owner === "client1";
          const client = isC1 ? factFind.client1 : factFind.client2;
          const name = ((client?.first_name || "") + " " + (client?.last_name || "")).trim();
          milestones.push({ milestone: `${sf.smsf_name} — ${name} pension commenced`, entity: name, year: currentYear, icon: "💰", type: "event" });
        }
      });
    });
    return milestones;
  })();

  // =========================================================================
  // 17. SMSF Members Matrix data
  // =========================================================================
  const smsfMembersDataMap = {};
  smsfTabs.filter(t => t.type === "members").forEach(tab => {
    const fund = smsfDataList[tab.idx];
    if (!fund) return;
    const N = N_YEARS;
    const zeros = new Array(N).fill(0);
    const M = fund.memberData.length;

    const sections = [
      { id: "sm-header", rows: [{ label: "Year", values: fund.shortYears.map((_, i) => i + 1), style: "header" }] },
      { id: "sm-d0", isDivider: true },
    ];

    for (let ai = 0; ai < M; ai++) {
      const md = fund.memberData[ai];
      const det = fund.memberDetail[ai];
      const isPen = det?.isPension;
      const envLabel = isPen ? "Pension" : "Accumulation";
      const accLabel = `${md.clientName} — ${envLabel}`;

      sections.push({ id: `sm-${ai}-hdr`, isSectionHeader: true, title: accLabel, subtitle: isPen ? "Pension phase — ECPI exempt" : "Accumulation phase — 15% tax", icon: isPen ? "🏖️" : "💼", bg: isPen ? "var(--ps-surface-orange)" : "var(--ps-surface-sky)", border: isPen ? "var(--ps-ring-orange)" : "var(--ps-ring-sky)" });
      sections.push({ id: `sm-${ai}-d1`, isDivider: true });

      sections.push({ id: `sm-${ai}-open`, title: "Balance", rows: [
        { label: "Opening Balance", values: fund.mOpenBal[ai], style: "current-value" },
        { label: "Opening %", values: fund.mOpenPct[ai], style: "child", format: "pct" },
      ]});

      sections.push({ id: `sm-${ai}-soy`, title: "Start of Year Movements", rows: [
        { label: "Rollovers In", values: fund.mSOYInflows[ai], style: "child" },
        { label: "Rollovers Out", values: fund.mSOYOutflows[ai].map(v => -v), style: "child-negative" },
      ]});
      sections.push({ id: `sm-${ai}-rev`, rows: [
        { label: "Revised Balance", values: fund.mRevisedBal[ai], style: "highlight" },
        { label: "Revised %", values: fund.mRevisedPct[ai], style: "child", format: "pct" },
      ]});
      sections.push({ id: `sm-${ai}-d2`, isDivider: true });

      if (isPen) {
        sections.push({ id: `sm-${ai}-draw`, title: "Pension Drawdowns", rows: [
          { label: "Pension Drawdown", values: fund.mDrawdown[ai].map(v => -v), style: "child-negative" },
        ]});
      } else {
        sections.push({ id: `sm-${ai}-cc`, title: "Contributions", rows: [
          { label: "SGC", values: det?.sgVals || zeros, style: "child" },
          ...(det?.salSacVals?.some(v => v > 0) ? [{ label: "Salary Sacrifice", values: det.salSacVals, style: "child" }] : []),
          { label: "Total Concessional", values: fund.mContribCC[ai], style: "total" },
        ]});
      }
      sections.push({ id: `sm-${ai}-ins`, rows: [
        { label: "Insurance Premiums", values: fund.mInsurance[ai].map(v => -v), style: "child-negative" },
      ]});
      sections.push({ id: `sm-${ai}-pc`, rows: [
        { label: isPen ? "Post-Drawdown Balance" : "Post-Contribution Balance", values: fund.mPostContribBal[ai], style: "subtotal" },
        { label: isPen ? "Post-Drawdown %" : "Post-Contribution %", values: fund.mPostContribPct[ai], style: "child", format: "pct" },
      ]});
      sections.push({ id: `sm-${ai}-d3`, isDivider: true });

      sections.push({ id: `sm-${ai}-shared`, title: "Fund Returns & Tax", rows: [
        { label: "Investment Returns", values: fund.mReturnShare[ai], style: "child" },
        { label: "Fund Expenses", values: fund.mExpenseShare[ai].map(v => -v), style: "child-negative" },
        { label: `Tax Share (${isPen ? "exempt" : "15%"})`, values: fund.mTaxShare[ai].map(v => -v), style: "child-negative" },
      ]});
      sections.push({ id: `sm-${ai}-ei`, rows: [
        { label: "End Value (Initial)", values: fund.mEndInitBal[ai], style: "subtotal" },
        { label: "Initial End %", values: fund.mEndInitPct[ai], style: "child", format: "pct" },
      ]});
      sections.push({ id: `sm-${ai}-d4`, isDivider: true });

      sections.push({ id: `sm-${ai}-eoy`, title: "End of Year", rows: [
        { label: "Non-Concessional Contributions", values: fund.mEOYNCC[ai], style: "child" },
        { label: "Withdrawals", values: fund.mEOYWithdrawals[ai].map(v => -v), style: "child-negative" },
      ]});
      sections.push({ id: `sm-${ai}-close`, rows: [
        { label: "Closing Balance", values: fund.mClosingBal[ai], style: "end-value" },
        { label: "Final %", values: fund.mFinalPct[ai], style: "child", format: "pct" },
      ]});
      sections.push({ id: `sm-${ai}-components`, title: "Tax Components", rows: [
        { label: "Tax-Free Component", values: fund.mTaxFree[ai], style: "child" },
        { label: "Taxable Component", values: fund.mTaxable[ai], style: "child" },
        { label: "Tax-Free %", values: fund.mTaxFreePct[ai], style: "child", format: "pct" },
      ]});

      if (ai < M - 1) {
        sections.push({ id: `sm-${ai}-d5`, isDivider: true });
      }
    }

    sections.push({ id: "sm-dfinal", isDivider: true });
    sections.push({ id: "sm-totals", title: "Fund Total", rows: [
      { label: "Total Fund Balance", values: fund.totalMemberBal, style: "highlight" },
      { label: "Pension % of Fund", values: fund.pensionPctOfFund, style: "child", format: "pct" },
    ]});

    const membersData = { years: fund.shortYears, sections };
    const pctChartData = fund.shortYears.map((year, y) => {
      const obj = { year };
      fund.memberData.forEach((m, i) => {
        const envLabel = m.taxEnv === "pension" ? "Pen" : "Acc";
        obj[`${m.clientName} (${envLabel})`] = fund.mFinalPct[i][y];
      });
      return obj;
    });
    const pctKeys = fund.memberData.map(m => {
      const envLabel = m.taxEnv === "pension" ? "Pen" : "Acc";
      return `${m.clientName} (${envLabel})`;
    });
    const pctColors = ["#6366F1", "#F59E0B", "#0EA5E9", "#10B981", "#EC4899", "#8B5CF6"];

    smsfMembersDataMap[tab.key] = { data: membersData, name: tab.key, pctChartData: { data: pctChartData, keys: pctKeys, colors: pctColors } };
  });

  // =========================================================================
  // 18. SMSF Segregated Account schedule data
  // =========================================================================
  const smsfSegAccountDataMap = {};
  smsfTabs.filter(t => t.type === "seg_account").forEach(tab => {
    const fund = smsfDataList[tab.idx];
    if (!fund || !fund.acctType || !fund.acctResults) return;
    const ai = tab.accIdx;
    const r = fund.acctResults[ai];
    if (!r) return;
    const N = N_YEARS;
    const zeros = new Array(N).fill(0);
    const isPension = r.isPension;
    const envLabel = isPension ? "Pension" : "Accumulation";

    const sections = [
      { id: "seg-header", rows: [{ label: "Year", values: fund.shortYears.map((_, i) => i + 1), style: "header" }] },
      { id: "seg-d0", isDivider: true },
      { id: "seg-cf-header", isSectionHeader: true, title: "Cashflow Statement", subtitle: `${r.clientName} — ${envLabel}`, icon: isPension ? "🏖️" : "💼", bg: isPension ? "var(--ps-surface-orange)" : "var(--ps-surface-sky)", border: isPension ? "var(--ps-ring-orange)" : "var(--ps-ring-sky)" },
      { id: "seg-d0b", isDivider: true },
      { id: "seg-cashflow", title: "Cashflow", rows: [
        { label: "Starting Value", values: r.startingVals, style: "current-value" },
      ]},
      ...(!isPension ? [{ id: "seg-inflows", title: "Inflows", rows: [
        { label: "SG Contributions", values: r.sgVals, style: "child" },
        ...(r.salSacVals.some(v => v > 0) ? [{ label: "Salary Sacrifice", values: r.salSacVals, style: "child" }] : []),
        ...(r.accSellSOY.some(v => v > 0) ? [{ label: "Asset Sale Proceeds", values: r.accSellSOY, style: "child" }] : []),
        { label: "Total Concessional", values: r.contribCC, style: "total" },
      ]}] : []),
      ...(isPension ? [{ id: "seg-outflows", title: "Outflows", rows: [
        { label: "Pension Drawdown", values: r.drawdownVals.map(v => -v), style: "child-negative" },
      ]},
      ...(r.accSellSOY.some(v => v > 0) ? [{ id: "seg-pension-inflows", title: "Inflows", rows: [
        { label: "Asset Sale Proceeds", values: r.accSellSOY, style: "child" },
      ]}] : [])] : []),
      { id: "seg-d1", isDivider: true },
      { id: "seg-income", title: "Income", rows: [
        ...(r.rentalIncVals.some(v => v > 0) ? [{ label: "Rental Income", values: r.rentalIncVals, style: "child" }] : []),
        ...(r.investIncVals.some(v => v > 0) ? [{ label: "Investment Income", values: r.investIncVals, style: "child" }] : []),
        { label: "Total Income", values: r.totalIncome, style: "total" },
      ]},
      { id: "seg-expenses", title: "Expenses", rows: [
        ...(r.deductibleIntVals.some(v => v > 0) ? [{ label: "Interest Expense", values: r.deductibleIntVals.map(v => -v), style: "child-negative" }] : []),
        ...(r.debtRepayVals.some(v => v > 0) ? [{ label: "Debt Repayments", values: r.debtRepayVals.map(v => -v), style: "child-negative" }] : []),
        ...(r.insPremVals.some(v => v > 0) ? [{ label: "Insurance Premiums", values: r.insPremVals.map(v => -v), style: "child-negative" }] : []),
        { label: "Total Expenses", values: r.totalExpenseVals.map(v => -v), style: "total" },
      ]},
      { id: "seg-surplus", rows: [
        { label: "Surplus", values: r.surplusVals, style: "highlight" },
      ]},
      { id: "seg-d2", isDivider: true },
      { id: "seg-eoy", title: "End of Year", rows: [
        ...(r.accSellEOY.some(v => v > 0) ? [{ label: "Asset Sale Proceeds", values: r.accSellEOY, style: "child" }] : []),
        { label: "Closing Balance", values: r.closingBalArr, style: "end-value" },
      ]},
      { id: "seg-d3", isDivider: true },
      { id: "seg-tax-header", isSectionHeader: true, title: "Tax Statement", subtitle: isPension ? "Pension — tax-exempt income" : "Accumulation — 15% tax on income", icon: "🏛️", bg: "var(--ps-surface-indigo)", border: "var(--ps-ring-indigo)" },
      { id: "seg-d3b", isDivider: true },
      { id: "seg-tax-income", title: "Assessable Income", rows: [
        ...(r.rentalIncVals.some(v => v > 0) ? [{ label: "Rental Income", values: r.rentalIncVals, style: "child" }] : []),
        ...(r.investIncVals.some(v => v > 0) ? [{ label: "Investment Income", values: r.investIncVals, style: "child" }] : []),
        ...(r.frankingVals.some(v => v > 0) ? [{ label: "Franking Credits", values: r.frankingVals, style: "child" }] : []),
        { label: "Total Income", values: r.totalIncomeForTax, style: "total" },
      ]},
      { id: "seg-tax-deduct", title: "Deductions", rows: [
        ...(r.deductibleIntVals.some(v => v > 0) ? [{ label: "Deductible Interest", values: r.deductibleIntVals.map(v => -v), style: "child-negative" }] : []),
        ...(r.insIpDeductVals.some(v => v > 0) ? [{ label: "Income Protection Insurance", values: r.insIpDeductVals.map(v => -v), style: "child-negative" }] : []),
        { label: "Total Deductions", values: r.deductibleIntVals.map((v, y) => -(v + r.insIpDeductVals[y])), style: "total" },
      ]},
      { id: "seg-d4", isDivider: true },
      { id: "seg-tax-summary", title: "Tax Summary", rows: isPension ? [
        { label: "Taxable Income", values: r.taxableIncome, style: "child" },
        { label: "Tax Rate", values: new Array(N).fill("0% (exempt)"), style: "child" },
        { label: "Tax Payable", values: zeros, style: "child" },
      ] : [
        { label: "Taxable Income", values: r.taxableIncome, style: "child" },
        { label: "Gross Tax (15%)", values: r.grossTax, style: "child" },
        ...(r.frankingOffset.some(v => v > 0) ? [{ label: "Franking Credit Offset", values: r.frankingOffset, style: "child" }] : []),
        { label: "Net Tax Payable", values: r.netTax, style: "child-negative" },
      ]},
      { id: "seg-d5", isDivider: true },
      { id: "seg-components", title: "Tax Components", rows: [
        { label: "Tax-Free Component", values: r.tfArr, style: "child" },
        { label: "Taxable Component", values: r.txArr, style: "child" },
        { label: "Tax-Free %", values: r.tfPctArr, style: "child", format: "pct" },
      ]},
      { id: "seg-d6", isDivider: true },
      { id: "seg-nw-header", isSectionHeader: true, title: "Assets & Liabilities", subtitle: "Account net worth", icon: "📊", bg: "var(--ps-surface-green)", border: "var(--ps-ring-emerald)" },
      { id: "seg-d6b", isDivider: true },
      { id: "seg-nw", title: "Net Worth", rows: [
        ...(r.propValues.some(v => v > 0) ? [{ label: "Property Value", values: r.propValues, style: "child" }] : []),
        ...(r.otherValues.some(v => v > 0) ? [{ label: "Other Assets", values: r.otherValues, style: "child" }] : []),
        { label: "Total Assets", values: r.totalAssets, style: "total" },
        ...(r.debtBalances.some(v => v < 0) ? [{ label: "Outstanding Debt", values: r.debtBalances, style: "child-negative" }] : []),
        { label: "Net Worth", values: r.netWorth, style: "highlight" },
      ]},
    ];

    const segChartData = fund.shortYears.map((year, y) => {
      const obj = { year, balance: r.closingBalArr[y] };
      if (!isPension) {
        if (r.sgVals[y] > 0) obj["SG Contributions"] = r.sgVals[y];
        if (r.salSacVals[y] > 0) obj["Salary Sacrifice"] = r.salSacVals[y];
      }
      if (r.drawdownVals[y] > 0) obj["Pension Drawdown"] = -r.drawdownVals[y];
      return obj;
    });

    const barKeys = [];
    const barColors = [];
    if (!isPension) {
      if (r.sgVals.some(v => v > 0)) { barKeys.push("SG Contributions"); barColors.push("#6366F1"); }
      if (r.salSacVals.some(v => v > 0)) { barKeys.push("Salary Sacrifice"); barColors.push("#8B5CF6"); }
    }
    if (r.drawdownVals.some(v => v > 0)) { barKeys.push("Pension Drawdown"); barColors.push("#F43F5E"); }

    smsfSegAccountDataMap[tab.key] = {
      data: { years: fund.shortYears, sections }, name: tab.key,
      segChartData: { data: segChartData, barKeys, barColors },
    };
  });

  // =========================================================================
  // Return all engine outputs
  // =========================================================================
  return {
    // Holdings
    propertyHoldings, defensiveHoldings, growthHoldings, lifestyleHoldings,
    // Entity distributions
    entityDist,
    // Insurance
    c1InsPremiums, c2InsPremiums, combinedNonSuperIns,
    // Register data
    annuity1Data, annuity2Data, allDBData,
    stratPensionLumpSum, pensionStratOverrides,
    // Entity data
    bondDataList, trustDataList, companyDataList, smsfDataList,
    // Financial summary
    superProj, penRollIn, penRollOut, rollInDetailPerPension, rollOutDetailPerPension,
    netWorthChartData, fsCashflowChartData, summaryMeta,
    financialSummaryData,
    // Social security
    ssData,
    // Aged care
    agedCareC1, agedCareC2,
    c1PensionShare, c2PensionShare, combinedPension,
    // CGT
    c1CGT, c2CGT, trustCGTList, companyCGTList, smsfCGTList,
    streamedCGTToClient1, streamedCGTToClient2,
    // Tax
    taxClient1Data, taxClient1ChartData, taxClient2Data, taxClient2ChartData,
    // Savings/Cashflow
    savingsData, cashflowChartData, txnChartData, assetOpenBals,
    // Debt
    homeLoanData, investmentLoansData, otherDebtsData,
    // Super/Pension register
    allSuperData, allPensionData, super1Data, super2Data, pension1Data, pension2Data,
    // Charts & milestones
    dynamicAssetTypeChartData, dynamicMilestones,
    // SMSF display data
    smsfMembersDataMap, smsfSegAccountDataMap,
  };
}
