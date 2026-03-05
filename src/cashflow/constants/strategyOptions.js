export const STRAT_DRAWDOWN = [
  { value: "Superannuation", label: "Superannuation" }, { value: "Pension", label: "Pension" },
  { value: "Portfolio", label: "Portfolio" }, { value: "Debt drawdown", label: "Debt drawdown" },
  { value: "Investment property", label: "Investment property" }, { value: "Principal residence", label: "Principal residence" },
];
export const STRAT_PORTFOLIO = [
  { value: "Minimise tax", label: "Minimise tax" }, { value: "Defensive first", label: "Defensive first" }, { value: "Aggressive first", label: "Aggressive first" },
];
export const STRAT_SURPLUS = [
  { value: "Build cash", label: "Build cash" }, { value: "Non-deductible debt", label: "Non-deductible debt" },
  { value: "Deductible debt", label: "Deductible debt" }, { value: "Concessional", label: "Concessional" },
  { value: "Non-concessional (Super)", label: "Non-concessional (Super)" },
  { value: "Model portfolio (no gearing)", label: "Model portfolio (no gearing)" },
  { value: "Model portfolio (gearing)", label: "Model portfolio (gearing)" },
  { value: "Investment property (no gearing)", label: "Investment property (no gearing)" },
  { value: "Investment property (gearing)", label: "Investment property (gearing)" },
  { value: "Investment bond", label: "Investment bond" }, { value: "Annuity (Lifetime)", label: "Annuity (Lifetime)" },
  { value: "Principal residence", label: "Principal residence" }, { value: "Utilise offset account", label: "Utilise offset account" },
  { value: "Optimise redraw facility", label: "Optimise redraw facility" },
  { value: "Meet emergency funding/savings goals", label: "Meet emergency funding/savings goals" },
  { value: "Debt recycling", label: "Debt recycling" },
];
export const STRAT_GROUPS = [
  { id: "super", icon: "🏦", label: "Superannuation", items: [
    { value: "101", label: "Salary sacrifice to superannuation" },
    { value: "55", label: "Make non-concessional contribution to super" },
    { value: "52", label: "Make a self employed tax deductible contribution" },
    { value: "63", label: "Nominate super contributions split to partner" },
    { value: "234", label: "Downsizer contribution" },
    { value: "109s", label: "Make spouse contribution to partner's super" },
    { value: "107", label: "Take lump sum and re-contribute to partner's super" },
    { value: "108", label: "Take lump sum and re-contribute to super" },
    { value: "130", label: "Withdraw a lump sum from super" },
  ]},
  { id: "pension", icon: "💸", label: "Retirement Income Streams", items: [
    { value: "14", label: "Commence a new Account Based Pension" },
    { value: "15", label: "Commence a Transition to Retirement pension" },
    { value: "97", label: "Roll money from pension to super" },
    { value: "96", label: "Roll existing pension to new Account Based Pension" },
    { value: "184", label: "Commute pension, consolidate super, commence new pension" },
    { value: "23", label: "Set pension payment" },
    { value: "180", label: "Withdraw lump sum from pension" },
    { value: "82", label: "Redeem annuity" },
  ]},
  { id: "definedbenefit", icon: "🏛️", label: "Defined Benefit", items: [
    { value: "58", label: "Nominate 54/11 condition of release" },
    { value: "118", label: "Take defined benefit super as a lump sum at retirement" },
    { value: "119", label: "Take defined benefit super as a pension at retirement" },
    { value: "120", label: "Take defined benefit super as combination lump sum + pension" },
  ]},
  { id: "wealth", icon: "💰", label: "Wealth Creation & Investment", items: [
    { value: "86", label: "Re-invest dividends" },
    { value: "17", label: "Contribute to existing insurance bond" },
    { value: "177", label: "Withdraw cash from investment product" },
  ]},
  { id: "debt", icon: "🏠", label: "Debt Management", items: [
    { value: "66", label: "Lump sum debt repayment" },
    { value: "54", label: "Specify annual debt repayments" },
    { value: "42", label: "Debt drawdown / Redraw" },
    { value: "158", label: "Salary package debt" },
    { value: "67", label: "Pay salary into offset account" },
    { value: "69", label: "Pledge asset as security for loan" },
  ]},
  { id: "cashflow", icon: "💵", label: "Cashflow & Lifestyle", items: [
    { value: "271", label: "Create a savings buffer" },
    { value: "83", label: "Adjust expense item" },
    { value: "272", label: "Adjust income item" },
    { value: "270", label: "Adjust work hours" },
  ]},
  { id: "socsec", icon: "🏛️", label: "Social Security & Government", items: [
    { value: "1", label: "Apply for Paid Parental Leave" },
    { value: "210", label: "JobSeeker Payment" },
    { value: "219", label: "Disability Support Pension" },
    { value: "33", label: "Gift money to beneficiaries" },
  ]},
  { id: "property", icon: "🏡", label: "Property & Accommodation", items: [
    { value: "56", label: "Move back into your principal residence" },
    { value: "87", label: "Rent out holiday home" },
    { value: "88", label: "Rent out your principal residence" },
  ]},
  { id: "estate", icon: "👴", label: "Aged Care & Estate", items: [
    { value: "57", label: "Move into Aged Care" },
    { value: "145", label: "Support at Home (Home Care)" },

    { value: "137", label: "Granny flat interest — Property transfer" },
    { value: "138", label: "Granny flat interest — Funds transfer" },
    { value: "48", label: "Make a binding nomination on your super account" },
    { value: "62", label: "Nominate reversionary beneficiary for pension" },
  ]},
  { id: "entities", icon: "🏢", label: "Entities", items: [
    { value: "129", label: "Wind up your SMSF" },
    { value: "198", label: "Wind up trust" },
    { value: "131", label: "Sell / wind up company" },
    { value: "190", label: "SMSF purchase business real property (commercial)" },
    { value: "123", label: "Transfer asset into SMSF in-specie" },
    { value: "20", label: "Distribute dividend (company → shareholder)" },
    { value: "191", label: "Pay director fees / salary (company → personal)" },
    { value: "192", label: "Shareholder loan to company (personal → company)" },
    { value: "193", label: "Div 7A loan (company → shareholder)" },
    { value: "194", label: "Capital injection / share capital (personal → company)" },
    { value: "51", label: "Cash injection to trust" },
    { value: "195", label: "Trust distribution payout rate" },
    { value: "196", label: "Take drawings from trust" },
    { value: "263", label: "Transfer assets to related party" },
  ]},
];

// Flatten for backward compatibility (lookup by value)
export const STRAT_OPTIONS = STRAT_GROUPS.flatMap(g => g.items.map(i => ({ ...i, group: g.id, groupLabel: g.label, groupIcon: g.icon })));
export const STRAT_YEARS = Array.from({ length: 26 }, (_, i) => ({ value: String(2025 + i), label: String(2025 + i) }));
export const STRAT_END_YEARS = [{ value: "Ongoing", label: "Ongoing" }, ...STRAT_YEARS];

export const stratId = () => "str_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
export const stratLbl = (id) => STRAT_OPTIONS.find(s => s.value === id)?.label || id || "—";

export const EMPTY_MODEL = { id: "", name: "", description: "", drawdown_priority_1: "", drawdown_priority_2: "", drawdown_priority_3: "", portfolio_priority: "", surplus_priority_1: "", surplus_priority_2: "", surplus_priority_3: "" };
export const EMPTY_STRATEGY = { id: "", strategy_id: "", owner_id: "", start_year: "2025", end_year: "", amount: "", amount_type: "dollar", timing: "SOY", product_id: "", asset_id: "", debt_id: "", notes: "", rollout_fund: "", rollin_fund: "", link_pension: "no", pension_product_name: "", rollover_type: "entire", rollover_retain: "", rad_pct: "100", granny_extra_cash: "", granny_property_idx: "", granny_cash_amount: "", granny_sell_created: "", hcp_classification: "", hcp_pensioner_status: "", pledge_debt_idx: "", pledge_asset_idxs: [], moveback_property_idx: "", rentout_property_idx: "", rentout_rental_income: "", rentout_rental_freq: "52", hh_property_idx: "", hh_rental_income: "", hh_rental_freq: "52", hh_rented: "", hh_days_available: "", hh_pct_rented: "100" };
