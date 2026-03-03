export const DATA_SOURCES = {
  fact_find: {
    label: "Fact Find",
    icon: "\u{1F4CB}",
    color: "#3b82f6",
    fields: {
      personal: { label: "Personal Details", desc: "Name, DOB, marital status, employment" },
      dependants: { label: "Dependants", desc: "Children, ages, dependency status" },
      objectives: { label: "Goals & Objectives", desc: "What the client wants to achieve" },
      assets: { label: "Assets", desc: "Property, investments, cash, personal assets" },
      liabilities: { label: "Liabilities", desc: "Mortgage, loans, credit cards" },
      superannuation: { label: "Superannuation", desc: "Fund names, balances, contributions" },
      income: { label: "Income", desc: "Salary, rental, dividends, government payments" },
      expenses: { label: "Expenses", desc: "Living costs, commitments, discretionary" },
      insurance_existing: { label: "Existing Insurance", desc: "Current life, TPD, IP, trauma cover" },
      estate_planning: { label: "Estate Planning", desc: "Wills, POA, beneficiary nominations" },
      risk_profile: { label: "Risk Profile", desc: "Assessment results and risk tolerance" },
    }
  },
  soa_request: {
    label: "SOA Request",
    icon: "\u{1F4DD}",
    color: "#8b5cf6",
    fields: {
      scope: { label: "Scope of Advice", desc: "What's in/out of scope" },
      strategies: { label: "Strategies", desc: "Recommended strategies and rationale" },
      products: { label: "Products & Entities", desc: "Recommended products, funds, platforms" },
      insurance_recs: { label: "Insurance Recommendations", desc: "Recommended cover amounts and providers" },
      transactions: { label: "Transactions", desc: "Buy/sell/switch instructions" },
      portfolio: { label: "Portfolio Allocations", desc: "Asset allocation per product" },
      fees: { label: "Fee Schedule", desc: "Adviser fees, commissions, ongoing costs" },
    }
  },
  cashflow_model: {
    label: "Cashflow Model",
    icon: "\u{1F4CA}",
    color: "#10b981",
    fields: {
      summary: { label: "Model Summary", desc: "Key outcomes: retirement balance, sustainable income" },
      projections_yearly: { label: "Yearly Projections", desc: "Full year-by-year schedule (large dataset)" },
      retirement_income: { label: "Retirement Income", desc: "Projected income sources in retirement" },
      tax_summary: { label: "Tax Position", desc: "Current and projected tax calculations" },
      milestones: { label: "Key Milestones", desc: "Mortgage payoff, retirement, pension eligibility" },
      super_projections: { label: "Super Projections", desc: "Super balance growth over time" },
      scenarios: { label: "Scenario Comparison", desc: "Current vs recommended comparison" },
    }
  }
};

export const OUTPUT_FORMATS = [
  { value: "prose", label: "Prose" },
  { value: "table", label: "Table with commentary" },
  { value: "chart", label: "Chart with commentary" },
  { value: "structured", label: "Structured data" },
];

export const TONE_OPTIONS = [
  { value: "professional_clear", label: "Professional & clear" },
  { value: "warm_personal", label: "Warm & personal" },
  { value: "technical_detailed", label: "Technical & detailed" },
  { value: "compliance_focused", label: "Compliance-focused" },
];

function section(id, label, desc, group, outputFormat, dataFeeds, order) {
  return {
    id,
    label,
    desc,
    group,
    enabled: true,
    order,
    prompt: {
      system: "",
      output_format: outputFormat,
      max_words: 500,
      tone: "professional_clear",
    },
    example_content: "",
    data_feeds: dataFeeds,
  };
}

export const DEFAULT_SECTION_GROUPS = [
  {
    group: "welcome-intro",
    groupLabel: "Welcome & Introduction",
    icon: "\u{1F44B}",
    sections: [
      section("cover-letter", "Cover Letter", "Personalised introduction letter to the client", "welcome-intro", "rich_text", ["fact_find.personal", "fact_find.objectives"], 1),
      section("cover-page", "Cover Page", "Title page with client and adviser details", "welcome-intro", "auto", ["fact_find.personal"], 2),
      section("how-to-read", "How to Read This Document", "Guide for navigating the SOA", "welcome-intro", "rich_text", [], 3),
    ],
  },
  {
    group: "executive-summary-scope",
    groupLabel: "Executive Summary & Scope",
    icon: "\u{1F4CB}",
    sections: [
      section("executive-summary", "Executive Summary", "High-level overview of all recommendations", "executive-summary-scope", "hybrid", ["fact_find.objectives", "fact_find.superannuation", "fact_find.assets", "soa_request.strategies", "soa_request.products", "cashflow_model.summary", "cashflow_model.retirement_income"], 4),
      section("financial-needs", "Financial Needs & Objectives", "Client's stated goals and objectives", "executive-summary-scope", "hybrid", ["fact_find.objectives"], 5),
      section("scope-of-advice", "Scope of Advice", "What this advice covers and doesn't cover", "executive-summary-scope", "auto", ["soa_request.scope"], 6),
    ],
  },
  {
    group: "relevant-circumstances",
    groupLabel: "Relevant Circumstances",
    icon: "\u{1F464}",
    sections: [
      section("personal-information", "Personal Information", "Demographics and life situation", "relevant-circumstances", "auto", ["fact_find.personal"], 7),
      section("dependants", "Dependants", "Client's dependants", "relevant-circumstances", "auto", ["fact_find.dependants"], 8),
      section("financial-position", "Financial Position", "Assets and liabilities summary", "relevant-circumstances", "table", ["fact_find.assets", "fact_find.liabilities", "fact_find.superannuation"], 9),
      section("cash-flow-statement", "Cash Flow Statement", "Income and expenses", "relevant-circumstances", "table", ["fact_find.income", "fact_find.expenses"], 10),
      section("insurance-in-force", "Insurance in Force", "Existing coverage", "relevant-circumstances", "table", ["fact_find.insurance_existing"], 11),
      section("estate-planning", "Estate Planning", "Current arrangements", "relevant-circumstances", "hybrid", ["fact_find.estate_planning"], 12),
      section("tax-position", "Tax Position", "Current tax situation", "relevant-circumstances", "auto", ["cashflow_model.tax_summary"], 13),
    ],
  },
  {
    group: "recommended-strategies",
    groupLabel: "Recommended Strategies",
    icon: "\u{1F4A1}",
    sections: [
      section("wealth-asset-protection", "Wealth & Asset Protection", "Insurance strategies", "recommended-strategies", "hybrid", ["fact_find.insurance_existing", "soa_request.insurance_recs"], 14),
      section("insurance-needs-analysis", "Insurance Needs Analysis", "Requirements analysis", "recommended-strategies", "auto", ["soa_request.insurance_recs"], 15),
      section("recommended-insurance-cover", "Recommended Insurance Cover", "Coverage amounts", "recommended-strategies", "auto", ["soa_request.insurance_recs"], 16),
      section("debt-management", "Debt Management", "Debt strategies", "recommended-strategies", "hybrid", ["fact_find.liabilities", "soa_request.strategies"], 17),
      section("wealth-accumulation", "Wealth Accumulation", "Investment strategies", "recommended-strategies", "hybrid", ["soa_request.strategies", "soa_request.products"], 18),
      section("retirement-planning", "Retirement Planning", "Retirement preparation", "recommended-strategies", "hybrid", ["fact_find.objectives", "fact_find.superannuation", "soa_request.strategies", "cashflow_model.summary", "cashflow_model.retirement_income", "cashflow_model.milestones", "cashflow_model.super_projections"], 19),
    ],
  },
  {
    group: "product-recommendations",
    groupLabel: "Product Recommendations",
    icon: "\u{1F3AF}",
    sections: [
      section("recommended-insurance-product", "Recommended Insurance Product", "Insurance recommendations", "product-recommendations", "auto", ["soa_request.insurance_recs", "soa_request.products"], 20),
      section("recommended-wealth-product", "Recommended Wealth Product", "Investment products", "product-recommendations", "auto", ["soa_request.products"], 21),
      section("recommended-portfolio", "Recommended Portfolio", "Portfolio recommendation", "product-recommendations", "auto", ["soa_request.portfolio"], 22),
    ],
  },
  {
    group: "implementation",
    groupLabel: "Implementation",
    icon: "\u{2699}\u{FE0F}",
    sections: [
      section("transactions", "Transactions", "Buy/sell/switch instructions", "implementation", "auto", ["soa_request.transactions"], 23),
      section("projected-outcomes", "Projected Outcomes", "Projected financial outcomes", "implementation", "chart", ["cashflow_model.projections_yearly", "cashflow_model.scenarios", "cashflow_model.retirement_income", "cashflow_model.milestones"], 24),
    ],
  },
  {
    group: "fees-disclosure",
    groupLabel: "Fees & Disclosure",
    icon: "\u{1F4B0}",
    sections: [
      section("adviser-fee-disclosure", "Adviser Fee Disclosure", "Full fee disclosure", "fees-disclosure", "rich_text", ["soa_request.fees"], 25),
      section("commissions", "Commissions", "Commission disclosure", "fees-disclosure", "rich_text", ["soa_request.fees"], 26),
      section("disclaimer", "Disclaimer", "Legal disclaimers", "fees-disclosure", "rich_text", [], 27),
      section("how-to-proceed", "How to Proceed", "Next steps", "fees-disclosure", "rich_text", ["fact_find.personal"], 28),
    ],
  },
  {
    group: "appendices",
    groupLabel: "Appendices",
    icon: "\u{1F4CE}",
    sections: [
      section("detailed-projections", "Detailed Projections", "Full year-by-year schedule", "appendices", "table", ["cashflow_model.projections_yearly"], 29),
      section("risk-profile-assessment", "Risk Profile Assessment", "Risk assessment results", "appendices", "auto", ["fact_find.risk_profile"], 30),
      section("authority-to-proceed", "Authority to Proceed", "Client sign-off", "appendices", "rich_text", ["fact_find.personal"], 31),
    ],
  },
];

export function getSectionStatus(section) {
  const hasPrompt = !!section.prompt?.system;
  const hasExample = !!section.example_content;
  const hasDataFeeds = section.data_feeds?.length > 0;

  if (hasPrompt && hasExample && hasDataFeeds) return "configured";
  if (hasPrompt || hasExample) return "partial";
  if (section.prompt?.output_format === "auto" && hasDataFeeds) return "auto";
  return "needs-config";
}

export function countConfigured(groups) {
  let configured = 0;
  let total = 0;
  for (const group of groups) {
    for (const s of group.sections) {
      total++;
      const status = getSectionStatus(s);
      if (status === "configured" || status === "auto") configured++;
    }
  }
  return { configured, total };
}

export function getAllDataFeedKeys() {
  const keys = [];
  for (const [source, config] of Object.entries(DATA_SOURCES)) {
    for (const field of Object.keys(config.fields)) {
      keys.push(`${source}.${field}`);
    }
  }
  return keys;
}
