import { ageAtFYStart as _ageAtFYStart, assetCategory, LE_FEMALE, LE_MALE } from "./projectionHelpers.js";

/**
 * Build projection year range from current FY through longest life expectancy.
 */
export function buildProjectionSetup(engineData) {
  const currentFY = (() => {
    const now = new Date();
    return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  })();

  const ageAtFYStart = (dob) => _ageAtFYStart(dob, currentFY);

  const c1AgeNow = ageAtFYStart(engineData.client1?.date_of_birth);
  const c2AgeNow = ageAtFYStart(engineData.client2?.date_of_birth);
  const c1Gender = engineData.client1?.gender;
  const c2Gender = engineData.client2?.gender;
  const c1LE = c1Gender === "1" ? LE_FEMALE : c1Gender === "2" ? LE_MALE : 87;
  const c2LE = c2Gender === "1" ? LE_FEMALE : c2Gender === "2" ? LE_MALE : 87;

  const c1YearsLeft = c1AgeNow !== null ? Math.max(1, c1LE - c1AgeNow) : 0;
  const c2YearsLeft = c2AgeNow !== null ? Math.max(1, c2LE - c2AgeNow) : 0;
  const projectionLength = Math.max(c1YearsLeft, c2YearsLeft, 10);

  const PROJ_YEARS = Array.from({ length: projectionLength }, (_, i) => `${currentFY + i}/${currentFY + i + 1}`);
  const N_YEARS = PROJ_YEARS.length;
  const shortYears = PROJ_YEARS.map(y => { const p = y.split("/"); return p[0].slice(-4) + "/" + p[1].slice(-2); });

  return { currentFY, ageAtFYStart, c1AgeNow, c2AgeNow, c1Gender, c2Gender, PROJ_YEARS, N_YEARS, shortYears };
}

/**
 * Merge new advice entities (trusts, companies, SMSFs, super, pension) into engineData.
 * Mutates engineData in place to preserve existing behavior.
 */
export function mergeAdviceEntities(engineData, isAdviceModel) {
  if (isAdviceModel && engineData.advice_request?.products_entities) {
    const pe = engineData.advice_request.products_entities;
    const newTrusts = (pe.new_trusts || []).filter(t => t.trust_name);
    const newCompanies = (pe.new_companies || []).filter(c => c.company_name);
    const newSmsfs = (pe.new_smsf || []).filter(s => s.smsf_name);
    const baseTrusts = (engineData.trusts || []).filter(t => !(t.id || "").startsWith("adv_"));
    const baseCompanies = (engineData.companies || []).filter(c => !(c.id || "").startsWith("adv_"));
    const baseSmsfs = (engineData.smsfs || []).filter(s => !(s.id || "").startsWith("adv_"));
    engineData.trusts = [...baseTrusts, ...newTrusts.map(t => ({
      ...t, id: "adv_trust_" + t.trust_name.replace(/\s+/g, "_").toLowerCase(),
      name: t.trust_name, type: t.trust_type,
      assets: [], income: { annual_income: "0" }, expenses: { annual_expenses: "0" },
      distributions: { client1_pct: "50", client2_pct: "50" },
    }))];
    engineData.companies = [...baseCompanies, ...newCompanies.map(c => ({
      ...c, id: "adv_company_" + c.company_name.replace(/\s+/g, "_").toLowerCase(),
      name: c.company_name, company_name: c.company_name,
      co_purpose: c.co_purpose || "2", co_type: c.co_type || "1",
      co_losses: c.co_losses || "0", co_profit: c.co_profit || "0",
      dividends: { client1_pct: "50", client2_pct: "50" },
    }))];
    engineData.smsfs = [...baseSmsfs, ...newSmsfs.map(s => ({
      ...s, id: "adv_smsf_" + s.smsf_name.replace(/\s+/g, "_").toLowerCase(),
      name: s.smsf_name, smsf_name: s.smsf_name,
      smsf_balance: s.smsf_balance || "0",
      accounts: (s.accounts || []).map(acc => ({
        ...acc,
        balance: acc.balance || "0",
        tax_free_amt: "0", tax_free_pct: "0",
        super_guarantee: "0", salary_sacrifice: "0", after_tax: "0",
        pension_drawdown: "0",
        portfolio: {},
      })),
    }))];
  }

  // Merge new super and pension products from advice transactions
  if (isAdviceModel && engineData.advice_request?.transactions) {
    const advTxns = engineData.advice_request.transactions;
    const newSuperProds = (advTxns.newSuper || []).filter(s => s.fund_name);
    const newPensionProds = (advTxns.newPension || []).filter(p => p.fund_name);

    const baseSuper = (engineData.superProducts || []).filter(s => !s._isAdviceProduct);
    const basePensions = (engineData.pensions || []).filter(p => !p._isAdviceProduct);

    engineData.superProducts = [...baseSuper, ...newSuperProds.map(s => ({
      owner: s.owner || "client1",
      fund_name: s.fund_name,
      product: s.product || "",
      member_number: "",
      balance: s.balance || "0",
      contributions: {
        super_guarantee: "",
        salary_sacrifice: s.contributions?.salary_sacrifice || "",
        salary_sacrifice_indexed: s.contributions?.salary_sacrifice_indexed || false,
        after_tax: s.contributions?.after_tax || "",
        after_tax_indexed: s.contributions?.after_tax_indexed || false,
        spouse_received: s.contributions?.spouse_received || "",
        spouse_received_indexed: s.contributions?.spouse_received_indexed || false,
        split_received: s.contributions?.split_received || "",
        split_out_pct: s.contributions?.split_out_pct || "",
        concessional: s.contributions?.concessional || "",
      },
      tax_components: {
        taxable_portion: s.tax_components?.taxable_portion || "0",
        tax_free_portion: s.tax_components?.tax_free_portion || "0",
      },
      fees: {
        admin_fee: s.fees?.admin_fee || "0",
        percent_fee: s.fees?.percent_fee || "0",
        insurance_fee: s.fees?.insurance_fee || "0",
        ins_inflation_on: false,
        ins_inflation_rate: "0",
      },
      beneficiaries: [],
      portfolio: s.portfolio || [],
      is_sg_fund: s.is_sg_fund === true,
      _isAdviceProduct: true,
      _adviceId: s.id,
    }))];

    engineData.pensions = [...basePensions, ...newPensionProds.map(p => ({
      owner: p.owner || "client1",
      fund_name: p.fund_name,
      product: p.product || "",
      member_number: "",
      balance: p.balance || "0",
      pension_type: p.pension_type || "account-based",
      drawdown_rate: p.drawdown_rate || "5",
      drawdown_type: p.drawdown_type || "percentage",
      drawdown_amount: p.drawdown_amount || "",
      drawdown_frequency: p.drawdown_frequency || "monthly",
      fees: {
        admin_fee: p.fees?.admin_fee || "0",
        percent_fee: p.fees?.percent_fee || "0",
        insurance_fee: "0",
      },
      tax_components: {
        taxable_portion: p.tax_components?.taxable_portion || "0",
        tax_free_portion: p.tax_components?.tax_free_portion || "0",
        tax_free_pct: p.tax_components?.tax_free_pct || "",
      },
      portfolio: p.portfolio || [],
      _isAdviceProduct: true,
      _adviceId: p.id,
    }))];
  }
}

/**
 * Build dynamic tab arrays from engine data.
 */
export function buildDynamicTabs(engineData, c1Short, c2Short) {
  const superFundTabs = (engineData.superProducts || []).map((sp) => {
    const owner = sp.owner === "client1" ? c1Short : c2Short;
    return { key: `${sp.fund_name} — ${owner}`, product: sp.fund_name, owner, isNew: !!sp._isAdviceProduct };
  });
  const pensionTabs = (engineData.pensions || []).map((pf) => {
    const owner = pf.owner === "client1" ? c1Short : c2Short;
    return { key: `${pf.fund_name} — ${owner}`, product: pf.fund_name, owner, isNew: !!pf._isAdviceProduct };
  });
  const annuityTabs = (engineData.annuities || []).map((an) => {
    const owner = an.owner === "client1" ? c1Short : c2Short;
    return { key: `${an.product} — ${owner}`, product: an.product, owner };
  });
  const bondTabs = (engineData.investmentBonds || []).map((b, i) => {
    const owner = b.owner === "client1" ? c1Short : b.owner === "client2" ? c2Short : "Joint";
    return { key: `${b.product_name || `Bond ${i + 1}`} — ${owner}`, product: b.product_name || `Bond ${i + 1}`, owner, idx: i };
  });
  const dbTabs = (engineData.definedBenefits || []).map((db, i) => {
    const owner = db.owner === "client1" ? c1Short : c2Short;
    const schemeName = db.scheme === "pss" ? "PSS" : db.scheme === "css" ? "CSS" : (db.other_scheme_name || `DB ${i + 1}`);
    return { key: `${schemeName} — ${owner}`, product: schemeName, owner, idx: i };
  });
  const trustTabs = (engineData.trusts || []).map((tr, i) => {
    const isNew = (tr.id || "").startsWith("adv_");
    return { key: tr.trust_name || `Trust ${i + 1}`, product: null, owner: tr.trust_name || `Trust ${i + 1}`, idx: i, isNew };
  });
  const companyTabs = (engineData.companies || []).map((co, i) => {
    const isNew = (co.id || "").startsWith("adv_");
    return { key: co.company_name || `Company ${i + 1}`, product: null, owner: co.company_name || `Company ${i + 1}`, idx: i, isNew };
  });
  const smsfTabs = [];
  (engineData.smsfs || []).forEach((sf, si) => {
    const sfName = sf.smsf_name || `SMSF ${si + 1}`;
    const isNew = (sf.id || "").startsWith("adv_");
    smsfTabs.push({ key: sfName, product: null, owner: sfName, idx: si, type: "fund", isNew });
    if (sf.acct_type === "segregated") {
      (sf.accounts || []).forEach((acc, ai) => {
        const isC1 = acc.owner === "client1";
        const client = isC1 ? engineData.client1 : engineData.client2;
        const clientName = ((client?.first_name || "") + " " + (client?.last_name || "")).trim() || (isC1 ? "Client 1" : "Client 2");
        const envLabel = acc.tax_environment === "pension" ? "Pension" : "Accumulation";
        const tabKey = `${sfName} — ${clientName} ${envLabel}`;
        smsfTabs.push({ key: tabKey, product: sfName, owner: clientName, idx: si, accIdx: ai, type: "seg_account" });
      });
    } else {
      smsfTabs.push({ key: `${sfName} — Members`, product: sfName, owner: "All Members", idx: si, type: "members" });
    }
  });

  // SMSF sub-tabs and sub-sub map for Entities navigation
  const smsfSubTabs = [];
  const smsfSubSubMap = {};
  (engineData.smsfs || []).forEach((sf, si) => {
    const sfName = sf.smsf_name || `SMSF ${si + 1}`;
    smsfSubTabs.push(sfName);
    const children = [sfName];
    if (sf.acct_type === "segregated") {
      (sf.accounts || []).forEach((acc, ai) => {
        const tab = smsfTabs.find(t => t.type === "seg_account" && t.idx === si && t.accIdx === ai);
        if (tab) children.push(tab.key);
      });
    } else {
      const membersTab = smsfTabs.find(t => t.type === "members" && t.idx === si);
      if (membersTab) children.push(membersTab.key);
    }
    smsfSubSubMap[sfName] = children;
  });

  return {
    superFundTabs, pensionTabs, annuityTabs, bondTabs, dbTabs,
    trustTabs, companyTabs, smsfTabs, smsfSubTabs, smsfSubSubMap,
  };
}

/**
 * Build the ownerLabel closure — takes engineData + display names, returns a function.
 */
export function makeOwnerLabel(engineData, c1Display, c2Display) {
  return (a) => {
    if (a.a_ownType === "2" || a.a_owner === "joint") return "Joint";
    if (a.a_owner === "client1") return c1Display;
    if (a.a_owner === "client2") return c2Display;
    const owner = a.a_owner || "";
    const trustMatch = owner.match(/^trust_(\d+)$/);
    if (trustMatch) {
      const t = (engineData.trusts || [])[parseInt(trustMatch[1])];
      return t?.trust_name || owner;
    }
    const compMatch = owner.match(/^company_(\d+)$/);
    if (compMatch) {
      const c = (engineData.companies || [])[parseInt(compMatch[1])];
      return c?.company_name || owner;
    }
    const segMatch = owner.match(/^smsf_(\d+)_acc_(\d+)$/);
    if (segMatch) {
      const sf = (engineData.smsfs || [])[parseInt(segMatch[1])];
      const acc = sf?.accounts?.[parseInt(segMatch[2])];
      if (sf && acc) {
        const isC1 = acc.owner === "client1";
        const cl = isC1 ? engineData.client1 : engineData.client2;
        const name = ((cl?.first_name || "") + " " + (cl?.last_name || "")).trim();
        const env = acc.tax_environment === "pension" ? "Pen" : "Acc";
        return `${name} (${env})`;
      }
      return sf?.smsf_name || owner;
    }
    const smsfMatch = owner.match(/^smsf_(\d+)$/);
    if (smsfMatch) {
      const sf = (engineData.smsfs || [])[parseInt(smsfMatch[1])];
      return sf?.smsf_name || owner;
    }
    return owner || "—";
  };
}

/**
 * Build asset/debt helpers: ffAssets, ffDebts, adviceDebts, sellLookup, getAssetRates, getAssetDRP, etc.
 */
export function buildAssetHelpers(engineData, factFind, isAdviceModel, N_YEARS, currentFY) {
  const ffAssets = engineData.assets || [];

  // Merge advice debts
  const adviceDebts = (isAdviceModel && engineData.advice_request?.transactions?.debts || []).map(d => ({
    d_name: d.description || "New Debt",
    d_ownType: d.entity_type === "3" ? "3" : d.entity_type === "4" ? "4" : d.entity_type === "5" ? "5" : d.owner_id === "joint" ? "2" : "1",
    d_owner: d.owner_id || "",
    d_type: d.debt_type || "8",
    d_rate: d.interest_rate || "0",
    d_freq: d.repayment_freq || "12",
    d_repayments: d.repayments || "0",
    d_term: d.term_years || "30",
    d_balance: d.loan_amount || "0",
    d_io: d.is_interest_only ? "1" : "2",
    d_fixed: "2",
    d_redraw: d.redraw_limit || "0",
    d_security: [],
    _isAdvice: true,
  }));

  const baseLiabilities = factFind.liabilities || [];
  const mergedLiabilities = (engineData.liabilities || []).map((d, i) => {
    const base = baseLiabilities[i];
    return base?.d_offset?.length > 0 ? { ...d, d_offset: base.d_offset } : d;
  });
  const ffDebts = [...mergedLiabilities, ...adviceDebts];

  // New debt drawdowns
  const newDebtDrawdowns = {};
  adviceDebts.forEach(d => {
    const owner = d.d_owner || "";
    const amt = parseFloat(d.d_balance) || 0;
    if (amt > 0) {
      if (!newDebtDrawdowns[owner]) newDebtDrawdowns[owner] = 0;
      newDebtDrawdowns[owner] += amt;
    }
  });

  // Asset rates
  const typeAssumptions = engineData.assetAssumptions || {};
  const assetOverrides = engineData.assetOverrides || {};
  const fallbackGrowth = { property: 0.03, defensive: 0.02, growth: 0.06, lifestyle: -0.10 };

  const getAssetRates = (assetIndex, typeCode) => {
    const ov = assetOverrides[assetIndex] || {};
    const td = typeAssumptions[typeCode] || {};
    const cat = assetCategory(typeCode);
    return {
      growthRate: (ov.growthRate ?? td.growthRate ?? (fallbackGrowth[cat] || 0) * 100) / 100,
      incomeYield: (ov.incomeYield ?? td.incomeYield ?? 0) / 100,
      frankingPct: (ov.frankingPct ?? ov.frankingCredit ?? td.frankingPct ?? td.frankingCredit ?? 0) / 100,
    };
  };

  // DRP state
  const DRP_ELIGIBLE_TYPES = ["12", "13", "26", "42"];
  const drpStrategy86 = isAdviceModel
    ? (engineData.advice_request?.strategy?.strategies || []).find(s => s.strategy_id === "86")
    : null;
  const drp86Selections = drpStrategy86?.drp_selections || {};

  const getAssetDRP = (assetIdx, typeCode) => {
    if (!DRP_ELIGIBLE_TYPES.includes(typeCode)) return false;
    const key = `asset_${assetIdx}`;
    if (drp86Selections[key] !== undefined) return drp86Selections[key];
    const asset = (factFind.assets || [])[assetIdx];
    return asset?.a_drp === "yes";
  };

  // Sell transaction lookup
  const sellLookup = {};
  const currentFYAsset = new Date().getFullYear();
  if (isAdviceModel) {
    (engineData.advice_request?.transactions?.sell || []).forEach(s => {
      const idx = parseInt(s.asset_idx);
      if (isNaN(idx)) return;
      const yIdx = (parseInt(s.sell_year) || currentFYAsset) - currentFYAsset;
      if (yIdx < 0 || yIdx >= N_YEARS) return;
      if (!sellLookup[idx]) sellLookup[idx] = [];
      sellLookup[idx].push({
        yearIdx: yIdx,
        sellEntire: !!s.sell_entire_amount,
        amount: parseFloat(s.amount) || 0,
        txnCostPct: (parseFloat(s.transaction_costs_pct) || 0) / 100,
      });
    });

    // Strategy 190: SMSF purchase of business real property
    (engineData.strategies || []).filter(s => s.strategy_id === "190").forEach(s190 => {
      const idx = parseInt(s190.property_idx);
      if (isNaN(idx)) return;
      const asset = ffAssets[idx];
      if (!asset || asset.a_type !== "21") return;
      const yIdx = (parseInt(s190.transfer_year) || currentFYAsset) - currentFYAsset;
      if (yIdx < 0 || yIdx >= N_YEARS) return;
      const pct = (parseFloat(s190.transfer_pct) || 100) / 100;
      const propVal = parseFloat(asset.a_value) || 0;
      const sellAmt = s190.purchase_price_override === "1" ? (parseFloat(s190.purchase_price) || 0) : Math.round(propVal * pct);
      const isEntire = pct >= 1;
      if (!sellLookup[idx]) sellLookup[idx] = [];
      sellLookup[idx].push({
        yearIdx: yIdx, sellEntire: isEntire, amount: isEntire ? 0 : sellAmt,
        txnCostPct: (parseFloat(s190.transaction_costs_pct) || 0) / 100, isStrat190: true,
      });
    });

    // Strategy 123: In-specie transfer to SMSF
    (engineData.strategies || []).filter(s => s.strategy_id === "123").forEach(s123 => {
      const idx = parseInt(s123.asset_idx);
      if (isNaN(idx)) return;
      const asset = ffAssets[idx];
      if (!asset || !["12", "13", "26", "42"].includes(asset.a_type)) return;
      const yIdx = (parseInt(s123.transfer_year) || currentFYAsset) - currentFYAsset;
      if (yIdx < 0 || yIdx >= N_YEARS) return;
      const pct = (parseFloat(s123.transfer_pct) || 100) / 100;
      const assetVal = parseFloat(asset.a_value) || 0;
      const transferVal = s123.transfer_value_override === "1" ? (parseFloat(s123.transfer_value) || 0) : Math.round(assetVal * pct);
      const isEntire = pct >= 1;
      if (!sellLookup[idx]) sellLookup[idx] = [];
      sellLookup[idx].push({
        yearIdx: yIdx, sellEntire: isEntire, amount: isEntire ? 0 : transferVal,
        txnCostPct: (parseFloat(s123.transaction_costs_pct) || 0) / 100, isStrat123: true,
      });
    });

    // Strategy 263: Transfer asset to related party
    (engineData.strategies || []).filter(s => s.strategy_id === "263").forEach(s263 => {
      const idx = parseInt(s263.asset_idx);
      if (isNaN(idx)) return;
      const asset = ffAssets[idx];
      if (!asset) return;
      const yIdx = (parseInt(s263.transfer_year) || currentFYAsset) - currentFYAsset;
      if (yIdx < 0 || yIdx >= N_YEARS) return;
      const pct = (parseFloat(s263.transfer_pct) || 100) / 100;
      const assetVal = parseFloat(asset.a_value) || 0;
      const transferVal = s263.transfer_value_override === "1" ? (parseFloat(s263.transfer_value) || 0) : Math.round(assetVal * pct);
      const isEntire = pct >= 1;
      if (!sellLookup[idx]) sellLookup[idx] = [];
      sellLookup[idx].push({
        yearIdx: yIdx, sellEntire: isEntire, amount: isEntire ? 0 : transferVal,
        txnCostPct: (parseFloat(s263.transaction_costs_pct) || 0) / 100, isStrat263: true,
      });
    });
  }

  // Offset asset indices
  const offsetAssetIndices = new Set(
    (factFind.liabilities || []).flatMap(d => (d.d_offset || []).map(i => parseInt(i)))
  );

  // Strat 67 contributors
  const strat67All = isAdviceModel ? (engineData.advice_request?.strategy?.strategies || []).filter(s => s.strategy_id === "67") : [];

  return {
    ffAssets, ffDebts, adviceDebts, newDebtDrawdowns,
    sellLookup, offsetAssetIndices, strat67All,
    getAssetRates, getAssetDRP,
  };
}

/**
 * Build entity owner options from factFind for forms.
 */
export function buildEntityOwnerOptions(factFind) {
  const opts = [];
  if (factFind.client1) opts.push({ value: "client1", label: ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim() || "Client 1" });
  if (factFind.client2) opts.push({ value: "client2", label: ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim() || "Client 2" });
  opts.push({ value: "joint", label: "Joint" });
  (factFind.trusts || []).forEach(t => {
    if (t.id) opts.push({ value: t.id, label: t.name || t.id });
  });
  (factFind.companies || []).forEach(c => {
    if (c.id) opts.push({ value: c.id, label: c.name || c.id });
  });
  (factFind.smsfs || []).forEach(s => {
    if (s.segregated) {
      (s.accounts || []).forEach(a => {
        if (a.id) opts.push({ value: a.id, label: `${s.name || s.id} — ${a.memberName || a.id}` });
      });
    } else {
      if (s.id) opts.push({ value: s.id, label: s.name || s.id });
    }
  });
  return opts;
}
