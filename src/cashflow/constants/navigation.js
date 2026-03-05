// Navigation structure mapping
export const NAV_STRUCTURE = {
  "Summary of Results": {
    icon: "📊",
    subTabs: ["Timeline", "Milestones", "Cashflow", "Retirement", "Portfolio", "Advice Summary"],
    subSubTabs: {},
    adviceOnlySubTabs: ["Advice Summary"],
  },
  "Advice Detail": {
    icon: "📋",
    subTabs: ["Objectives", "Recommendations", "Advice Impact"],
    subSubTabs: {},
    adviceOnly: true,
  },
  "Capital": {
    icon: "📈",
    subTabs: ["Projection"],
    subSubTabs: {},
  },
  "Cashflow/Tax": {
    icon: "💰",
    subTabs: ["Cashflow", "Tax", "CGT", "Unrealised CGT", "Potential Death Tax"],
    subSubTabs: {
      "Cashflow": ["Savings"],
      "Tax": ["Client 1", "Client 2"],
      "CGT": ["Client 1", "Client 2"],
      "Unrealised CGT": ["Client 1", "Client 2"],
    },
  },
  "Entities": {
    icon: "👤",
    subTabs: ["Trusts", "Companies", "SMSF"],
    subSubTabs: {
      "Trusts": [],
      "Companies": [],
      "SMSF": [],
    },
  },
  "Superannuation": {
    icon: "🏦",
    subTabs: ["Super", "Pension", "Annuity", "Defined Benefit"],
    subSubTabs: {
      "Super": ["Super 1", "Super 2"],
      "Pension": ["Pension 1", "Pension 2"],
      "Annuity": ["Annuity 1"],
      "Defined Benefit": [],
    },
  },
  "Investment Products": {
    icon: "📊",
    subTabs: ["Wrap", "Investment Bond"],
    subSubTabs: {
      "Wrap": ["Wrap 1"],
      "Investment Bond": ["Bond 1"],
    },
  },
  "Assets & Liabilities": {
    icon: "🏠",
    subTabs: ["Assets", "Debts"],
    subSubTabs: {
      "Assets": ["Lifestyle Assets", "Defensive Assets", "Property", "Growth Assets"],
      "Debts": ["Home Loan", "Investment Loans", "Other"],
    },
  },
  "Insurance": {
    icon: "🛡️",
    subTabs: ["Projection", "Premium Costs"],
    subSubTabs: {
      "Projection": ["Client", "Partner"],
      "Premium Costs": ["Client", "Partner"],
    },
  },
  "Aged Care": {
    icon: "🏥",
    subTabs: ["Assessment", "Fees", "RAD Balance"],
    subSubTabs: {
      "Assessment": ["Client 1", "Client 2"],
      "Fees": ["Client 1", "Client 2"],
      "RAD Balance": ["Client 1", "Client 2"],
    },
  },
  "Social Security": {
    icon: "🏛️",
    subTabs: ["Assessment"],
    subSubTabs: {
      "Assessment": [],
    },
  },
  "Rates": {
    icon: "⚙️",
    subTabs: ["Model", "Client 1", "Client 2"],
    subSubTabs: {
      "Model": ["Rebalancing"],
      "Client 1": ["Eligibility", "Superannuation"],
      "Client 2": ["Eligibility", "Superannuation"],
    },
  },
};

export const TOP_TABS = Object.keys(NAV_STRUCTURE);
