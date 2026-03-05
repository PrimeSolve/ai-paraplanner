/**
 * SOA Data Registry
 *
 * Defines every data table available for SOA generation, organised into 9 groups.
 * Each table carries a token-size hint so the UI can estimate prompt cost.
 */

export const SOA_DATA_GROUPS = [
  { id: 'client',        label: 'Client',           icon: '👤', color: '#3b82f6' },
  { id: 'balance_sheet', label: 'Balance Sheet',     icon: '🏦', color: '#6366f1' },
  { id: 'entities',      label: 'Entities',          icon: '🏢', color: '#8b5cf6' },
  { id: 'cashflow',      label: 'Cashflow',          icon: '📊', color: '#10b981' },
  { id: 'tax',           label: 'Tax',               icon: '🧾', color: '#f59e0b' },
  { id: 'cgt',           label: 'Capital Gains',     icon: '📈', color: '#ef4444' },
  { id: 'super',         label: 'Superannuation',    icon: '🏛️', color: '#0ea5e9' },
  { id: 'strategies',    label: 'Strategies',        icon: '💡', color: '#ec4899' },
  { id: 'projections',   label: 'Projections',       icon: '🔮', color: '#14b8a6' },
];

export const SOA_DATA_TABLES = [
  // ── Client ──────────────────────────────────────────────
  {
    id: 'client.personal',
    label: 'Personal Details',
    group: 'client',
    description: 'Name, DOB, marital status, employment, contact information',
    tokenEstimate: 'small',
  },
  {
    id: 'client.dependants',
    label: 'Dependants',
    group: 'client',
    description: 'Children, ages, dependency status, special needs',
    tokenEstimate: 'small',
  },
  {
    id: 'client.goals',
    label: 'Goals & Objectives',
    group: 'client',
    description: 'Stated financial goals, lifestyle objectives, priorities',
    tokenEstimate: 'small',
  },
  {
    id: 'client.risk_profile',
    label: 'Risk Profile',
    group: 'client',
    description: 'Assessment results, risk tolerance, investment experience',
    tokenEstimate: 'small',
  },

  // ── Balance Sheet ───────────────────────────────────────
  {
    id: 'balance_sheet.super',
    label: 'Superannuation',
    group: 'balance_sheet',
    description: 'Fund names, balances, investment options, insurance within super',
    tokenEstimate: 'medium',
  },
  {
    id: 'balance_sheet.investments',
    label: 'Investments',
    group: 'balance_sheet',
    description: 'Managed funds, shares, ETFs, fixed interest holdings',
    tokenEstimate: 'medium',
  },
  {
    id: 'balance_sheet.property',
    label: 'Property',
    group: 'balance_sheet',
    description: 'Residential, investment property, valuations, rental income',
    tokenEstimate: 'medium',
  },
  {
    id: 'balance_sheet.cash',
    label: 'Cash & Savings',
    group: 'balance_sheet',
    description: 'Bank accounts, term deposits, offset accounts',
    tokenEstimate: 'small',
  },
  {
    id: 'balance_sheet.liabilities',
    label: 'Liabilities',
    group: 'balance_sheet',
    description: 'Mortgages, personal loans, credit cards, HECS/HELP',
    tokenEstimate: 'medium',
  },

  // ── Entities ────────────────────────────────────────────
  {
    id: 'entities.trusts',
    label: 'Trusts',
    group: 'entities',
    description: 'Family trusts, unit trusts, trustees, beneficiaries, deeds',
    tokenEstimate: 'medium',
  },
  {
    id: 'entities.companies',
    label: 'Companies',
    group: 'entities',
    description: 'Company structures, directors, shareholders, ABN/ACN',
    tokenEstimate: 'medium',
  },
  {
    id: 'entities.smsf',
    label: 'SMSF',
    group: 'entities',
    description: 'Self-managed super fund details, members, investment strategy',
    tokenEstimate: 'medium',
  },
  {
    id: 'entities.ownership_map',
    label: 'Ownership Map',
    group: 'entities',
    description: 'Cross-entity ownership relationships and control structures',
    tokenEstimate: 'small',
  },
  {
    id: 'entities.estate_planning',
    label: 'Estate Planning',
    group: 'entities',
    description: 'Wills, POA, binding death benefit nominations, succession',
    tokenEstimate: 'medium',
  },
  {
    id: 'entities.distributions',
    label: 'Distributions',
    group: 'entities',
    description: 'Trust and company distribution history and strategy',
    tokenEstimate: 'medium',
  },

  // ── Cashflow ────────────────────────────────────────────
  {
    id: 'cashflow.annual',
    label: 'Annual Cashflow Schedule',
    group: 'cashflow',
    description: 'Full 30-year cashflow: income, expenses, net cashflow, savings balance',
    tokenEstimate: 'large',
  },
  {
    id: 'cashflow.milestones',
    label: 'Key Milestones',
    group: 'cashflow',
    description: 'Top 8 milestone rows: retirement, mortgage payoff, pension start, etc.',
    tokenEstimate: 'small',
  },
  {
    id: 'cashflow.retirement_income',
    label: 'Retirement Income',
    group: 'cashflow',
    description: 'Projected income sources in retirement: super pension, Age Pension, other',
    tokenEstimate: 'medium',
  },
  {
    id: 'cashflow.base_vs_advice',
    label: 'Base vs Advice Comparison',
    group: 'cashflow',
    description: 'Side-by-side comparison of current path vs recommended strategy',
    tokenEstimate: 'medium',
  },

  // ── Tax ─────────────────────────────────────────────────
  {
    id: 'tax.annual',
    label: 'Annual Tax Schedule',
    group: 'tax',
    description: 'Full 30-year tax projections: taxable income, offsets, payable',
    tokenEstimate: 'large',
  },
  {
    id: 'tax.current_year',
    label: 'Current Year Tax',
    group: 'tax',
    description: 'Detailed current-year tax position and breakdown',
    tokenEstimate: 'medium',
  },
  {
    id: 'tax.strategy_saving',
    label: 'Strategy Tax Saving',
    group: 'tax',
    description: 'Tax savings attributable to recommended strategies',
    tokenEstimate: 'small',
  },
  {
    id: 'tax.super_contributions',
    label: 'Super Contributions Tax',
    group: 'tax',
    description: 'Concessional/non-concessional contribution tax treatment',
    tokenEstimate: 'medium',
  },

  // ── CGT ─────────────────────────────────────────────────
  {
    id: 'cgt.unrealised',
    label: 'Unrealised Gains',
    group: 'cgt',
    description: 'Unrealised capital gains across all assets with cost base',
    tokenEstimate: 'medium',
  },
  {
    id: 'cgt.realised_history',
    label: 'Realised History',
    group: 'cgt',
    description: 'Historical capital gains/losses events and net position',
    tokenEstimate: 'medium',
  },
  {
    id: 'cgt.strategy_impact',
    label: 'Strategy CGT Impact',
    group: 'cgt',
    description: 'Capital gains tax impact of recommended strategies',
    tokenEstimate: 'small',
  },

  // ── Super ───────────────────────────────────────────────
  {
    id: 'super.projections',
    label: 'Super Projections',
    group: 'super',
    description: 'Projected super balance growth to retirement and beyond',
    tokenEstimate: 'large',
  },
  {
    id: 'super.contributions_history',
    label: 'Contributions History',
    group: 'super',
    description: 'Historical and projected concessional/NCC contributions',
    tokenEstimate: 'medium',
  },
  {
    id: 'super.pension_payments',
    label: 'Pension Payments',
    group: 'super',
    description: 'Account-based pension drawdown schedule and minimums',
    tokenEstimate: 'medium',
  },
  {
    id: 'super.insurance',
    label: 'Insurance in Super',
    group: 'super',
    description: 'Life, TPD, IP cover held within super funds',
    tokenEstimate: 'medium',
  },

  // ── Strategies ──────────────────────────────────────────
  {
    id: 'strategies.recommended',
    label: 'Recommended Strategies',
    group: 'strategies',
    description: 'Full list of recommended strategies with rationale and priority',
    tokenEstimate: 'medium',
  },
  {
    id: 'strategies.comparison',
    label: 'Strategy Comparison',
    group: 'strategies',
    description: 'Alternatives considered and why recommended option was chosen',
    tokenEstimate: 'medium',
  },
  {
    id: 'strategies.products',
    label: 'Product Recommendations',
    group: 'strategies',
    description: 'Specific products, platforms, funds recommended',
    tokenEstimate: 'medium',
  },
  {
    id: 'strategies.portfolio',
    label: 'Portfolio Allocation',
    group: 'strategies',
    description: 'Target asset allocation and rebalancing approach',
    tokenEstimate: 'small',
  },
  {
    id: 'strategies.transactions',
    label: 'Transactions',
    group: 'strategies',
    description: 'Buy/sell/switch/rollover instructions to implement advice',
    tokenEstimate: 'medium',
  },

  // ── Projections ─────────────────────────────────────────
  {
    id: 'projections.timeline',
    label: 'Projection Timeline',
    group: 'projections',
    description: 'Year-by-year timeline of key financial events and milestones',
    tokenEstimate: 'medium',
  },
  {
    id: 'projections.net_worth_chart',
    label: 'Net Worth Chart Data',
    group: 'projections',
    description: 'Net worth trajectory data for chart rendering',
    tokenEstimate: 'medium',
  },
  {
    id: 'projections.income_chart',
    label: 'Income Chart Data',
    group: 'projections',
    description: 'Projected income streams over time for chart rendering',
    tokenEstimate: 'medium',
  },
  {
    id: 'projections.expenses_chart',
    label: 'Expenses Chart Data',
    group: 'projections',
    description: 'Projected expenses breakdown over time for chart rendering',
    tokenEstimate: 'medium',
  },
];

// ── Derived look-ups ──────────────────────────────────────

/** Map of groupId → group metadata */
export const GROUP_MAP = Object.fromEntries(
  SOA_DATA_GROUPS.map((g) => [g.id, g])
);

/** Map of tableId → table metadata */
export const TABLE_MAP = Object.fromEntries(
  SOA_DATA_TABLES.map((t) => [t.id, t])
);

/** Tables indexed by group */
export const TABLES_BY_GROUP = SOA_DATA_GROUPS.reduce((acc, g) => {
  acc[g.id] = SOA_DATA_TABLES.filter((t) => t.group === g.id);
  return acc;
}, {});

/** All table IDs as a flat array */
export const ALL_TABLE_IDS = SOA_DATA_TABLES.map((t) => t.id);

// ── Token budget estimation ───────────────────────────────

const TOKEN_WEIGHTS = { small: 200, medium: 600, large: 1500 };

export function estimateTokenBudget(selectedIds) {
  let total = 0;
  for (const id of selectedIds) {
    const table = TABLE_MAP[id];
    if (table) total += TOKEN_WEIGHTS[table.tokenEstimate] || 0;
  }
  return total;
}

export function tokenBudgetLabel(totalTokens) {
  if (totalTokens <= 1500)  return { label: 'Small',      color: '#10b981' };
  if (totalTokens <= 4000)  return { label: 'Medium',     color: '#f59e0b' };
  if (totalTokens <= 8000)  return { label: 'Large',      color: '#f97316' };
  return                           { label: 'Very Large', color: '#ef4444' };
}

// ── Smart Suggest mapping ─────────────────────────────────

const SMART_SUGGEST_RULES = [
  {
    keywords: ['executive', 'summary', 'overview'],
    tables: ['client.personal', 'cashflow.milestones', 'strategies.recommended', 'projections.timeline'],
  },
  {
    keywords: ['super', 'contribution'],
    tables: [
      ...SOA_DATA_TABLES.filter((t) => t.group === 'super').map((t) => t.id),
      'tax.super_contributions',
      'strategies.recommended',
    ],
  },
  {
    keywords: ['retirement', 'pension', 'income'],
    tables: ['cashflow.retirement_income', 'super.projections', 'super.pension_payments', 'cashflow.milestones'],
  },
  {
    keywords: ['tax'],
    tables: [
      ...SOA_DATA_TABLES.filter((t) => t.group === 'tax').map((t) => t.id),
      'cgt.unrealised',
      'super.contributions_history',
    ],
  },
  {
    keywords: ['estate', 'will', 'nomination'],
    tables: [
      'entities.estate_planning',
      'entities.ownership_map',
      ...SOA_DATA_TABLES.filter((t) => t.group === 'balance_sheet').map((t) => t.id),
    ],
  },
  {
    keywords: ['insurance'],
    tables: ['super.insurance', 'client.personal', 'client.dependants'],
  },
  {
    keywords: ['trust', 'distribution'],
    tables: ['entities.trusts', 'entities.distributions', 'tax.current_year'],
  },
  {
    keywords: ['smsf'],
    tables: [
      'entities.smsf',
      ...SOA_DATA_TABLES.filter((t) => t.group === 'super').map((t) => t.id),
      ...SOA_DATA_TABLES.filter((t) => t.group === 'cgt').map((t) => t.id),
    ],
  },
  {
    keywords: ['cashflow', 'budget', 'expenses'],
    tables: ['cashflow.annual', 'cashflow.milestones', 'tax.annual'],
  },
  {
    keywords: ['portfolio', 'investment', 'product'],
    tables: [
      'strategies.products',
      'strategies.portfolio',
      'strategies.transactions',
      'balance_sheet.investments',
      'cgt.unrealised',
    ],
  },
];

const DEFAULT_SUGGESTION = ['client.personal', 'cashflow.milestones', 'strategies.recommended'];

/**
 * Given a section label and prompt text, return the best-matching table IDs.
 */
export function smartSuggest(sectionLabel = '', promptText = '') {
  const haystack = `${sectionLabel} ${promptText}`.toLowerCase();

  for (const rule of SMART_SUGGEST_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) {
      return [...new Set(rule.tables)];
    }
  }

  return [...DEFAULT_SUGGESTION];
}
