import React, { useState, useEffect, useRef, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, ReferenceLine, Customized } from "recharts";

import { THEME_STYLE_ID, _psInitialDark, injectThemeCSS, T } from "./constants/theme.jsx";
import { useFactFind } from "./hooks/useFactFind.js";
import { buildProjectionSetup, mergeAdviceEntities, buildDynamicTabs, makeOwnerLabel, buildAssetHelpers, buildEntityOwnerOptions } from "./utils/helpers.js";
import { runProjectionEngine } from "./engine/orchestrator.js";
import { ENTITY_REGISTRY, ENTITY_MAP, ENTITY_LIST, ENTITY_ALIASES, resolveEntity, EntityBadge, entityColor } from "./constants/entities.jsx";
import { NAV_STRUCTURE, TOP_TABS } from "./constants/navigation.js";
import { formatNumber } from "./utils/formatters.js";
import { STRAT_DRAWDOWN, STRAT_PORTFOLIO, STRAT_SURPLUS, STRAT_GROUPS, STRAT_OPTIONS, STRAT_YEARS, STRAT_END_YEARS, stratId, stratLbl, EMPTY_MODEL, EMPTY_STRATEGY } from "./constants/strategyOptions.js";
import { AGE_PENSION_PARAMS } from "./constants/assumptions.js";
import { calcNetSalary, calcMarginalRate } from "./utils/taxCalc.js";
import { assetTypeMap, debtDeductible, offsetWeightFactor, debtFreqLabel } from "./utils/projectionHelpers.js";
import { ffLabelStyle, ffInputStyle, ffSelectStyle, ffRowStyle, ffFullRowStyle, FFField, FFInput, FFSelect, FFToggle, FFRadioRow } from "./components/common/FormFields.jsx";
import { PlaceholderContent, SectionTable } from "./components/common/SectionTable.jsx";
import { CashflowSavingsPage, TaxSchedulePage, CGTPage, UnrealisedCGTPage, AssetChartPage, DebtChartPage, AssetTable, TrustPage, TrustDistOverride, CompanyPage, SMSFPage, SUPER1_DATA, PENSION1_DATA, PROPERTY_TYPES, DEFENSIVE_ASSET_TYPES, GROWTH_ASSET_TYPES, LIFESTYLE_ASSET_TYPES } from "./components/schedules/index.jsx";
import { ModelComparisonDashboard, ModelComparisonDetail, AdviceSummaryTable, ScopeDashboard, ObjectivesDashboard, RecommendationsTable, ProductProjectionTable, PortfolioTransactionsTable, BenefitOfAdviceDashboard, PortfolioDashboard, RetirementDashboard, HealthCheckTable, RetirementBalanceChart, ContributionsChart, IncomeInRetirementChart, CashflowDashboard, IncomeChart, ExpensesChart, CapitalDashboard, DebtChart, PropertyChart, AssetsPerEntityChart, AssetTypeChart, AssetsLiabilitiesChart, FinancialSummaryDashboard, MilestonesDashboard, RebalancingTable, ANNUITY1_DATA, NET_EQUITY_DATA } from "./components/dashboards/index.jsx";
import { AgedCarePage, SocialSecurityTable, EligibilityTable, SuperAssumptionsTable, SuperProductPage, PensionProductPage, BondProductPage, AnnuityProductPage, InsurancePremiumProjection, InsuranceProjectionPage, WrapProjectionPage, PotentialDeathTaxPage, AssumptionsPanel, BasicAssumptionsForm, AssetOverridesPage, AssetAssumptionsPage, SOADocumentBuilder, altEx, altSurvivalPct } from "./components/products/index.jsx";
import { PRINCIPAL_SUB_SECTIONS, CHILD_DEFAULTS, DEPENDANT_DEFAULTS, SUPER_DEFAULTS, PENSION_DEFAULTS, ANNUITY_DEFAULTS, DB_DEFAULTS, WRAP_DEFAULTS, INV_BOND_DEFAULTS, PrincipalsForm, DependantsForm, SuperannuationForm, InvestmentsForm, TrustsCompaniesForm, SMSFForm, AssetsForm, LiabilitiesForm, InsurancePoliciesForm, IncomeForm, ExpensesForm, GoalsForm, RiskProfileForm, ScopeOfAdviceForm } from "./components/factfind/index.jsx";
import { TransactionsForm, ProductReplacementForm, AiFactFind, AiParaplanner, StrategyForm, AdviceProductsEntitiesForm, AdviceInsuranceForm, TaxSuperPlanningForm, AssumptionsForm, PortfolioForm } from "./components/advice/index.jsx";
import { getAccessToken } from '@/auth/msalInstance';
import { adviceHistoryApi } from '@/api/adviceHistoryApi';
class CashflowErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return React.createElement("div", { style: { padding: 40, fontFamily: "monospace" } },
        React.createElement("h2", { style: { color: "var(--ps-red)" } }, "Runtime Error"),
        React.createElement("pre", { style: { background: "#fef2f2", padding: 16, borderRadius: 8, whiteSpace: "pre-wrap", fontSize: 13 } },
          this.state.error.message + "\n\n" + this.state.error.stack
        ),
        React.createElement("button", { onClick: () => this.setState({ error: null }), style: { marginTop: 12, padding: "8px 16px", cursor: "pointer" } }, "Retry")
      );
    }
    return this.props.children;
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'https://api.primesolve.com.au';
const AI_PARAPLANNER_URL = import.meta.env.VITE_AI_PARAPLANNER_URL || 'https://app.aiparaplanner.com.au';

// ═══════════════════════════════════════════════════════════════
// CASHFLOW ASSISTANT — Co-pilot Panel Component
// ═══════════════════════════════════════════════════════════════

const COPILOT_TOOL_DEFINITIONS = [
  {
    name: "addSuperFund",
    description: "Add a new superannuation fund to the client's fact find.",
    input_schema: {
      type: "object",
      properties: {
        owner: { type: "string", enum: ["client1","client2"], description: "Fund owner" },
        fund_name: { type: "string", description: "Fund name e.g. AustralianSuper" },
        product: { type: "string", description: "Investment option name" },
        balance: { type: "string", description: "Current balance $" },
        salary_sacrifice: { type: "string", description: "Annual salary sacrifice $ (optional)" },
        after_tax: { type: "string", description: "Annual after-tax contributions $ (optional)" },
        percent_fee: { type: "string", description: "Investment fee % (optional)" },
        admin_fee: { type: "string", description: "Fixed admin fee $ p.a. (optional)" },
        insurance_fee: { type: "string", description: "Insurance premium $ p.a. (optional)" },
        taxable_portion: { type: "string", description: "Taxable component $ (optional)" },
        tax_free_portion: { type: "string", description: "Tax-free component $ (optional)" },
      },
      required: ["owner", "fund_name", "balance"],
    },
  },
  {
    name: "addAsset",
    description: "Add a new asset (property, shares, savings, etc.) to the fact find.",
    input_schema: {
      type: "object",
      properties: {
        a_name: { type: "string", description: "Asset name/description" },
        a_type: { type: "string", description: "Asset type code: 1=Principal Residence, 2=Car, 7=Lifestyle Other, 8=Savings Account, 9=Term Deposit, 10=AU Bonds, 11=Intl Bonds, 12=AU Shares/ETF, 13=Intl Shares/ETF, 18=Investment Property, 19=Principal Residence (absent), 21=Commercial Property, 26=Managed Funds, 42=Investment Other" },
        a_owner: { type: "string", description: "client1 | client2 | joint | trust_0 | company_0 | smsf_0" },
        a_ownType: { type: "string", description: "1=Sole, 2=Joint, 3=Trust, 4=Company, 5=SMSF" },
        a_value: { type: "string", description: "Current market value $" },
        a_purchase_price: { type: "string", description: "Purchase price $ (optional)" },
        a_purchase_date: { type: "string", description: "YYYY-MM-DD (optional)" },
        a_rental_income: { type: "string", description: "Rental income $ (optional)" },
        a_rental_freq: { type: "string", description: "52=weekly, 12=monthly (optional)" },
      },
      required: ["a_name", "a_type", "a_owner", "a_ownType", "a_value"],
    },
  },
  {
    name: "addLiability",
    description: "Add a new liability (loan, mortgage, credit card) to the fact find.",
    input_schema: {
      type: "object",
      properties: {
        d_name: { type: "string", description: "Liability name" },
        d_type: { type: "string", description: "1=Home loan, 2=Investment loan, 3=Margin, 5=Credit card, 7=Car loan, 8=Personal/Other" },
        d_owner: { type: "string", description: "client1 | client2 | joint | trust_0 | company_0" },
        d_ownType: { type: "string", description: "1=Sole, 2=Joint, 3=Trust, 4=Company" },
        d_balance: { type: "string", description: "Outstanding balance $" },
        d_rate: { type: "string", description: "Interest rate %" },
        d_repayments: { type: "string", description: "Repayment amount $ (optional)" },
        d_freq: { type: "string", description: "12=monthly, 26=fortnightly, 52=weekly (optional)" },
        d_term: { type: "string", description: "Remaining term e.g. '25 years' (optional)" },
        d_io: { type: "string", description: "1=Interest only, 2=Principal & Interest (optional)" },
        d_fixed: { type: "string", description: "1=Fixed, 2=Variable (optional)" },
      },
      required: ["d_name", "d_type", "d_owner", "d_ownType", "d_balance", "d_rate"],
    },
  },
  {
    name: "updateIncome",
    description: "Update employment income for a client.",
    input_schema: {
      type: "object",
      properties: {
        client: { type: "string", enum: ["client1","client2"], description: "Which client" },
        i_gross: { type: "string", description: "Gross annual salary $" },
        i_increase: { type: "string", description: "Annual growth rate %" },
        i_bonus: { type: "string", description: "Annual bonus $" },
      },
      required: ["client"],
    },
  },
  {
    name: "updateClient",
    description: "Update personal details for a client.",
    input_schema: {
      type: "object",
      properties: {
        client: { type: "string", enum: ["client1","client2"], description: "Which client" },
        first_name: { type: "string" },
        last_name: { type: "string" },
        date_of_birth: { type: "string", description: "YYYY-MM-DD" },
        occupation: { type: "string" },
        employer_name: { type: "string" },
        employment_status: { type: "string", description: "1=Full-time, 2=Part-time, 3=Self-employed, 4=Retired" },
        gender: { type: "string", description: "1=Female, 2=Male" },
        email: { type: "string" },
        mobile: { type: "string" },
      },
      required: ["client"],
    },
  },
  {
    name: "addGoal",
    description: "Add a financial goal/objective.",
    input_schema: {
      type: "object",
      properties: {
        o_who: { type: "array", items: { type: "string" }, description: "['client1'], ['client2'], or ['client1','client2']" },
        o_type: { type: "string", description: "Goal type: 6=Education, 9=Holiday, 10=Car, 15=Gift, 32=Renovation, 33=Wedding, 34=Medical, 35=Business, 36=Other lump sum" },
        o_amount: { type: "string", description: "Goal amount $" },
        o_start: { type: "string", description: "Start year YYYY" },
        o_end: { type: "string", description: "End year YYYY (optional, same as start for one-off)" },
        o_importance: { type: "string", description: "1=Essential, 2=Important, 3=Desirable (optional)" },
        o_why: { type: "string", description: "Description / reason (optional)" },
      },
      required: ["o_who", "o_type", "o_amount", "o_start"],
    },
  },
  {
    name: "updateLivingExpenses",
    description: "Set annual living expenses and growth rate.",
    input_schema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Annual living expenses $" },
        growth: { type: "number", description: "Growth rate as decimal e.g. 0.025" },
      },
      required: ["amount"],
    },
  },
  {
    name: "createAdviceModel",
    description: "Create a new advice model (scenario).",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "e.g. 'Advice Model 2'" },
        description: { type: "string" },
      },
      required: ["name"],
    },
  },
  {
    name: "addStrategy",
    description: "Add a strategy to an advice model. Key strategy IDs: 107=Lump sum withdrawal+recontribution to partner, 108=Withdrawal+recontribution own super, 110=Lump sum withdrawal from accum, 130=Regular withdrawal accum, 131=Regular withdrawal pension, 180=One-off withdrawal pension, 200=Purchase investment property, 201=Purchase property via SMSF, 158=FBT salary packaging, 57=Aged care entry/RAD, 137=Granny flat interest.",
    input_schema: {
      type: "object",
      properties: {
        model_id: { type: "string", description: "Target model ID. 'model_default' for first model." },
        strategy_id: { type: "string", description: "Strategy number as string e.g. '107', '200'" },
        owner_id: { type: "string", description: "client1 | client2 | joint | trust_0 | smsf_0" },
        start_year: { type: "string", description: "FY start year e.g. '2028'" },
        end_year: { type: "string", description: "End year or 'Ongoing' or blank (optional)" },
        amount: { type: "string", description: "Dollar amount (optional)" },
        timing: { type: "string", enum: ["SOY","EOY"], description: "Start or end of year (optional)" },
        product_id: { type: "string", description: "super_0, pension_0, smsf_0 etc. (optional)" },
        asset_id: { type: "string", description: "Asset array index as string (optional)" },
        debt_id: { type: "string", description: "Liability array index as string (optional)" },
        notes: { type: "string", description: "Notes (optional)" },
      },
      required: ["strategy_id", "owner_id", "start_year"],
    },
  },
  {
    name: "cloneAdviceModel",
    description: "Clone an existing advice model with a new name.",
    input_schema: {
      type: "object",
      properties: {
        source_model_id: { type: "string", description: "ID of model to clone" },
        new_name: { type: "string", description: "Name for the cloned model" },
      },
      required: ["source_model_id", "new_name"],
    },
  },
  {
    name: "clarify",
    description: "Ask the user a clarifying question when confidence is below 90%.",
    input_schema: {
      type: "object",
      properties: {
        question: { type: "string", description: "The clarifying question" },
      },
      required: ["question"],
    },
  },
  {
    name: "summariseChanges",
    description: "Summarise all changes made in this batch.",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        count: { type: "number" },
      },
      required: ["summary", "count"],
    },
  },
  {
    name: "addChild",
    description: "Add a child to the client's fact find.",
    input_schema: {
      type: "object",
      properties: {
        name:                     { type: "string", description: "Child's full name" },
        date_of_birth:            { type: "string", description: "Date of birth YYYY-MM-DD" },
        financially_dependent:    { type: "string", description: "Financially dependent: 1=Yes, 2=No" },
        education_status:         { type: "string", description: "1=Primary, 2=Secondary, 3=Tertiary, 4=TAFE/Trade, 5=Not in education" },
        financial_dependence_age: { type: "string", description: "Age at which financial dependency ends e.g. '25'" },
        health_issues:            { type: "string", description: "Any health conditions (free text, optional)" },
      },
      required: ["name"],
    },
  },
  {
    name: "addDependant",
    description: "Add a non-child dependant (parent, relative, other) to the fact find.",
    input_schema: {
      type: "object",
      properties: {
        name:               { type: "string", description: "Dependant's full name" },
        date_of_birth:      { type: "string", description: "Date of birth YYYY-MM-DD" },
        relationship:       { type: "string", description: "1=Parent, 2=Sibling/Relative, 3=Other" },
        interdependency:    { type: "string", description: "Financially interdependent: 1=Yes, 2=No" },
        dependant_until_age: { type: "string", description: "Age dependency ends (optional)" },
      },
      required: ["name"],
    },
  },
  {
    name: "addTrust",
    description: "Add a discretionary/unit/other trust to the fact find.",
    input_schema: {
      type: "object",
      properties: {
        trust_name: { type: "string", description: "e.g. The Smith Family Trust" },
        trust_type: { type: "string", description: "1=Discretionary Family, 2=Unit, 3=Hybrid, 4=Testamentary, 5=Other" },
      },
      required: ["trust_name"],
    },
  },
  {
    name: "addCompany",
    description: "Add a company entity to the fact find.",
    input_schema: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "e.g. Smith Investments Pty Ltd" },
        co_type:      { type: "string", description: "1=Pty Ltd, 2=Partnership, 3=Sole trader, 4=Charity" },
        co_purpose:   { type: "string", description: "1=Operating business, 2=Investment, 3=Beneficiary of trust" },
        co_tax_rate:  { type: "string", description: "Tax rate % — default 25 (base rate entity), or 30" },
      },
      required: ["company_name"],
    },
  },
  {
    name: "addSMSF",
    description: "Add an SMSF (Self-Managed Super Fund) to the fact find.",
    input_schema: {
      type: "object",
      properties: {
        smsf_name:      { type: "string", description: "e.g. Smith Family Super Fund" },
        trustee_type:   { type: "string", description: "1=Corporate trustee, 2=Individual trustee" },
        smsf_balance:   { type: "string", description: "Total fund balance $" },
        fund_type:      { type: "string", description: "1=SMSF, 2=SAF (Small APRA Fund)" },
        acct_type:      { type: "string", description: "1=Pooled, 2=Segregated" },
      },
      required: ["smsf_name"],
    },
  },
  {
    name: "addInsurancePolicy",
    description: "Add an insurance policy to the fact find. Policy type codes: 'Life'=Life cover, 'Life with Linked TPD'=Life+TPD, 'Life with Linked TPD/Trauma'=Life+TPD+Trauma, 'TPD (Stand-alone)'=TPD only, 'Trauma (Stand alone)'=Trauma only, 'Income Protection'=IP only, 'Business Expenses'=Business overheads.",
    input_schema: {
      type: "object",
      properties: {
        pol_name:           { type: "string", description: "Policy name e.g. 'AustralianSuper Group Cover'" },
        pol_type:           { type: "string", description: "Policy type — see description for codes" },
        pol_owner:          { type: "string", description: "client1 | client2 | joint" },
        pol_insured:        { type: "string", description: "client1 | client2 (who is insured)" },
        pol_insurer:        { type: "string", description: "Insurer name e.g. 'TAL', 'MLC', 'AIA'" },
        pol_tax_env:        { type: "string", description: "1=Inside Super, 2=Non-super (ordinary)" },
        pol_structure:      { type: "string", description: "1=Stepped, 2=Level" },
        pol_freq:           { type: "string", description: "1=Monthly, 2=Annual" },
        sum_insured_life:   { type: "string", description: "Life cover sum insured $" },
        sum_insured_tpd:    { type: "string", description: "TPD sum insured $" },
        sum_insured_trauma: { type: "string", description: "Trauma sum insured $" },
        sum_insured_ip:     { type: "string", description: "Income protection monthly benefit $" },
        premium_life:       { type: "string", description: "Life premium $" },
        premium_tpd:        { type: "string", description: "TPD premium $" },
        premium_trauma:     { type: "string", description: "Trauma premium $" },
        premium_ip:         { type: "string", description: "IP premium $" },
        pol_waiting:        { type: "string", description: "IP waiting period e.g. '90 days'" },
        pol_benefit_period: { type: "string", description: "IP benefit period e.g. 'To age 65'" },
        pol_number:         { type: "string", description: "Policy number (optional)" },
      },
      required: ["pol_name", "pol_type", "pol_owner"],
    },
  },
  {
    name: "updateRiskProfile",
    description: "Set the risk profile for a client. Risk profile codes: 1=Defensive (100% defensive), 2=Conservative (25/75), 3=Moderate (50/50), 4=Balanced (60/40), 5=Growth (75/25), 6=High Growth (90/10), 7=Aggressive (100% growth). Also accepts plain English e.g. 'balanced', 'growth'.",
    input_schema: {
      type: "object",
      properties: {
        client:            { type: "string", enum: ["client1", "client2"], description: "Which client" },
        specified_profile: { type: "string", description: "Risk profile code (1-7) or plain English e.g. 'balanced'" },
        score:             { type: "number", description: "Questionnaire score 0-100 (optional)" },
        adviser_comments:  { type: "string", description: "Adviser notes / justification" },
        adjusted_profile:  { type: "string", description: "Adjusted profile if different to scored profile" },
        adjustment_reason: { type: "string", description: "Reason for adjustment" },
      },
      required: ["client", "specified_profile"],
    },
  },
  {
    name: "navigate_to",
    description: "Navigate the fact find UI to a specific section so the adviser and client can see it on screen. Use this whenever the adviser says 'let's look at X', 'show me X', 'go to X', or 'jump to X'.",
    input_schema: {
      type: "object",
      properties: {
        section: {
          type: "string",
          description: "The section to navigate to. Must be one of the exact tab/section keys used in the app. Examples: 'superannuation', 'assets', 'liabilities', 'income', 'expenses', 'insurance-policies', 'goals', 'risk-profile', 'principals', 'dependants'.",
        },
        highlight_id: {
          type: "string",
          description: "Optional. The ID of a specific record to highlight after navigating (e.g. a specific super fund ID).",
        },
      },
      required: ["section"],
    },
  },
];

const COPILOT_QUICK_PROMPTS = [
  "I have 2 super funds, total balance around $280k",
  "I own my home, worth about $950k",
  "We have a mortgage of $420k with Commonwealth Bank",
  "I earn $120k a year, my partner earns $85k",
  "We have 2 kids, ages 8 and 11",
  "We want to retire at 60",
  "We're planning a holiday to Europe next year, budget around $25k",
  "We have a car loan of about $22k",
];

function CashflowAssistant({ factFind, updateFF, darkMode, mode = "cashflow", onNavigate, factFindSection }) {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Welcome \u2014 this is your financial fact find. Work through each section at your own pace, filling in as much as you can. I\u2019ll handle the data entry.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [activityFeed, setActivityFeed] = useState([]);
  const [highlightedRecordId, setHighlightedRecordId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const c1 = factFind.client1 || {};
  const c2 = factFind.client2 || {};
  const c1Name = ((c1.first_name || "") + " " + (c1.last_name || "")).trim() || "Client 1";
  const c2Name = factFind.client2 ? ((c2.first_name || "") + " " + (c2.last_name || "")).trim() : null;

  const buildSystemPrompt = () => {
    const c1DOB = c1.date_of_birth || "unknown";
    const c2DOB = c2.date_of_birth || "unknown";
    const calcAge = (dob) => {
      if (!dob || dob === "unknown") return "unknown";
      const d = new Date(dob);
      const now = new Date();
      let age = now.getFullYear() - d.getFullYear();
      if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
      return age;
    };
    const c1Age = calcAge(c1DOB);
    const c2Age = calcAge(c2DOB);

    const superSummary = (factFind.superProducts || []).map(s =>
      `${s.fund_name} (${s.owner === "client1" ? c1Name : (c2Name || "Client 2")}): $${(parseFloat(s.balance)||0).toLocaleString()}`
    ).join(", ") || "None";

    const models = factFind.advice_request?.strategy?.models || [];
    const modelSummary = models.length ? models.map(m => `${m.id}: "${m.name}"`).join(", ") : "None";
    const strategyCount = (factFind.advice_request?.strategy?.strategies || []).length;

    return `You are the PrimeSolve Co-pilot. You write directly into the client fact find using tools.

RULE 1 — BATCH EXECUTION:
When asked to add multiple items, call ALL tool functions before sending any text response. Do not stop between tool calls. Do not ask questions between tool calls. Execute every single tool call first, then confirm at the end.

RULE 2 — CONFIRMATION (MANDATORY):
After ALL tool calls complete, send exactly one confirmation message listing every item added. Format: "Added: [item 1], [item 2], [item 3]." Never confirm something you have not received a tool_result for.

RULE 3 — NO CLARIFYING QUESTIONS on high-confidence requests:
If the user gives enough information to call a tool, call it immediately. Only use the clarify tool if critical information is genuinely missing.

RULE 4 — OWNERSHIP DEFAULTS:
Assets default joint. Debts default joint. Super — only ask which client if there are 2 clients and owner is not specified.

RULE 5 — ASSET TYPE CODES:
1=Principal Residence, 2=Car, 8=Savings, 9=Term Deposit, 12=AU Shares, 13=Intl Shares, 18=Investment Property, 26=Managed Funds, 42=Other Investment.

Current context:
- Client 1: ${c1Name}
- Client 2: ${c2Name || "none"}
- Super funds: ${superSummary}
- Assets: ${(factFind.assets||[]).length}
- Liabilities: ${(factFind.liabilities||[]).length}
- Models: ${modelSummary}
- Strategies: ${strategyCount}
- Children: ${(factFind.children||[]).length}
- Trusts: ${(factFind.trusts||[]).length}, Companies: ${(factFind.companies||[]).length}, SMSFs: ${(factFind.smsfs||[]).length}
- Insurance policies: ${(factFind.insurance?.policies||[]).length}`;
  };

  const executeTool = (toolName, toolInput) => {
    switch (toolName) {
      case "addSuperFund": {
        const ownerName = toolInput.owner === "client1" ? c1Name : (c2Name || "Client 2");
        const newFund = {
          owner: toolInput.owner,
          fund_name: toolInput.fund_name,
          product: toolInput.product || "",
          member_number: "",
          balance: toolInput.balance,
          contributions: {
            super_guarantee: "", salary_sacrifice: toolInput.salary_sacrifice || "",
            salary_sacrifice_indexed: false, after_tax: toolInput.after_tax || "",
            after_tax_indexed: false, spouse_received: "", spouse_received_indexed: false,
            split_received: "", split_out_pct: "", concessional: "",
          },
          tax_components: {
            unp_amount: "",
            taxable_portion: toolInput.taxable_portion || "",
            tax_free_portion: toolInput.tax_free_portion || "",
          },
          fees: {
            admin_fee: toolInput.admin_fee || "", percent_fee: toolInput.percent_fee || "",
            insurance_fee: toolInput.insurance_fee || "", ins_inflation_on: false, ins_inflation_rate: "",
          },
          beneficiaries: [],
          portfolio: toolInput.product ? [{ asset_name: toolInput.product, allocation_pct: "100", amount: toolInput.balance }] : [],
        };
        updateFF("superProducts", [...(factFind.superProducts || []), newFund]);
        return { success: true, summary: `Added super: ${toolInput.fund_name} \u2014 ${ownerName} \u2014 $${Number(toolInput.balance).toLocaleString()}` };
      }
      case "addAsset": {
        updateFF("assets", [...(factFind.assets || []), {
          a_name: toolInput.a_name, a_type: toolInput.a_type, a_owner: toolInput.a_owner,
          a_ownType: toolInput.a_ownType, a_value: toolInput.a_value,
          a_purchase_price: toolInput.a_purchase_price || "",
          a_purchase_date: toolInput.a_purchase_date || "",
          a_rental_income: toolInput.a_rental_income || "",
          a_rental_freq: toolInput.a_rental_freq || "",
        }]);
        return { success: true, summary: `Added asset: ${toolInput.a_name} \u2014 $${Number(toolInput.a_value).toLocaleString()}` };
      }
      case "addLiability": {
        updateFF("liabilities", [...(factFind.liabilities || []), {
          d_name: toolInput.d_name, d_type: toolInput.d_type, d_owner: toolInput.d_owner,
          d_ownType: toolInput.d_ownType, d_balance: toolInput.d_balance, d_rate: toolInput.d_rate,
          d_repayments: toolInput.d_repayments || "", d_freq: toolInput.d_freq || "12",
          d_term: toolInput.d_term || "", d_io: toolInput.d_io || "2", d_fixed: toolInput.d_fixed || "2",
          d_has_redraw: "2", d_redraw: "", d_redraw_limit: "",
          d_security: [], d_offset: [],
        }]);
        return { success: true, summary: `Added liability: ${toolInput.d_name} \u2014 $${Number(toolInput.d_balance).toLocaleString()} @ ${toolInput.d_rate}%` };
      }
      case "updateIncome": {
        const { client, ...fields } = toolInput;
        const name = client === "client1" ? c1Name : (c2Name || "Client 2");
        updateFF(`income.${client}`, { ...(factFind.income?.[client] || {}), ...fields });
        return { success: true, summary: `Updated income: ${name}${fields.i_gross ? ` \u2014 $${Number(fields.i_gross).toLocaleString()} gross` : ""}` };
      }
      case "updateClient": {
        const { client, ...fields } = toolInput;
        updateFF(client, { ...factFind[client], ...fields });
        return { success: true, summary: `Updated client details: ${client}` };
      }
      case "addGoal": {
        const objectives = factFind.advice_reason?.objectives || [];
        updateFF("advice_reason.objectives", [...objectives, {
          o_who: toolInput.o_who, o_type: toolInput.o_type, o_amount: toolInput.o_amount,
          o_start: toolInput.o_start, o_end: toolInput.o_end || toolInput.o_start,
          o_freq: "5", o_property: "", o_debt: "", o_asset: "",
          o_importance: toolInput.o_importance || "2",
          o_why: toolInput.o_why || "",
        }]);
        return { success: true, summary: `Added goal: ${toolInput.o_why || "Goal"} \u2014 $${Number(toolInput.o_amount).toLocaleString()} in ${toolInput.o_start}` };
      }
      case "updateLivingExpenses": {
        updateFF("cashflowConfig", {
          ...factFind.cashflowConfig,
          livingExpenses: toolInput.amount,
          livingExpensesGrowth: toolInput.growth ?? 0.025,
        });
        return { success: true, summary: `Living expenses: $${Number(toolInput.amount).toLocaleString()} p.a.` };
      }
      case "createAdviceModel": {
        const models = factFind.advice_request?.strategy?.models || [];
        const newId = `model_${Date.now()}`;
        updateFF("advice_request.strategy.models", [...models, {
          id: newId, name: toolInput.name, description: toolInput.description || "",
          drawdown_priority_1: "", drawdown_priority_2: "", drawdown_priority_3: "",
          portfolio_priority: "", surplus_priority_1: "", surplus_priority_2: "", surplus_priority_3: "",
        }]);
        return { success: true, modelId: newId, summary: `Created advice model: "${toolInput.name}"` };
      }
      case "addStrategy": {
        const strategies = factFind.advice_request?.strategy?.strategies || [];
        const newStrat = {
          ...EMPTY_STRATEGY,
          id: `strat_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          model_id: toolInput.model_id || "model_default",
          strategy_id: toolInput.strategy_id,
          owner_id: toolInput.owner_id,
          start_year: toolInput.start_year,
          end_year: toolInput.end_year || "",
          amount: toolInput.amount || "",
          timing: toolInput.timing || "SOY",
          product_id: toolInput.product_id || "",
          asset_id: toolInput.asset_id || "",
          debt_id: toolInput.debt_id || "",
          notes: toolInput.notes || "",
        };
        updateFF("advice_request.strategy.strategies", [...strategies, newStrat]);
        const stratLabel = toolInput.amount ? ` \u2014 $${Number(toolInput.amount).toLocaleString()}` : "";
        return { success: true, summary: `Strategy ${toolInput.strategy_id} \u2192 ${toolInput.model_id || "default"} | ${toolInput.owner_id} | ${toolInput.start_year}${stratLabel}` };
      }
      case "cloneAdviceModel": {
        const models = factFind.advice_request?.strategy?.models || [];
        const strategies = factFind.advice_request?.strategy?.strategies || [];
        const source = models.find(m => m.id === toolInput.source_model_id);
        if (!source) return { success: false, summary: `Clone failed: model "${toolInput.source_model_id}" not found` };
        const newId = `model_${Date.now()}`;
        const cloned = strategies
          .filter(s => s.model_id === toolInput.source_model_id)
          .map(s => ({ ...s, id: `strat_${Date.now()}_${Math.random().toString(36).slice(2)}`, model_id: newId }));
        updateFF("advice_request.strategy.models", [...models, { ...source, id: newId, name: toolInput.new_name }]);
        updateFF("advice_request.strategy.strategies", [...strategies, ...cloned]);
        return { success: true, modelId: newId, summary: `Cloned model "${source.name}" \u2192 "${toolInput.new_name}"` };
      }
      case "addChild": {
        const children = factFind.children || [];
        updateFF("children", [...children, {
          name:                     toolInput.name,
          date_of_birth:            toolInput.date_of_birth            || "",
          financially_dependent:    toolInput.financially_dependent    || "1",
          education_status:         toolInput.education_status         || "",
          financial_dependence_age: toolInput.financial_dependence_age || "",
          health_issues:            toolInput.health_issues            || "",
        }]);
        return { success: true, summary: `Added child: ${toolInput.name}${toolInput.date_of_birth ? ` (DOB ${toolInput.date_of_birth})` : ""}` };
      }
      case "addDependant": {
        const depList = factFind.dependants_list || [];
        updateFF("dependants_list", [...depList, {
          name:               toolInput.name,
          date_of_birth:      toolInput.date_of_birth      || "",
          relationship:       toolInput.relationship       || "",
          interdependency:    toolInput.interdependency    || "2",
          dependant_until_age: toolInput.dependant_until_age || "",
        }]);
        const relLabel = { "1":"Parent", "2":"Relative", "3":"Other" }[toolInput.relationship] || "Dependant";
        return { success: true, summary: `Added dependant: ${toolInput.name} (${relLabel})` };
      }
      case "addTrust": {
        const trusts = factFind.trusts || [];
        updateFF("trusts", [...trusts, {
          trust_name:    toolInput.trust_name,
          trust_type:    toolInput.trust_type || "1",
          beneficiaries: [],
        }]);
        const typeLabel = { "1":"Discretionary Family", "2":"Unit", "3":"Hybrid", "4":"Testamentary", "5":"Other" }[toolInput.trust_type] || "Trust";
        return { success: true, summary: `Added trust: ${toolInput.trust_name} (${typeLabel})` };
      }
      case "addCompany": {
        const companies = factFind.companies || [];
        updateFF("companies", [...companies, {
          company_name: toolInput.company_name,
          co_type:      toolInput.co_type    || "1",
          co_purpose:   toolInput.co_purpose || "2",
          co_tax_rate:  toolInput.co_tax_rate || "25",
          co_losses:    "",
          shareholders: [],
          pnl: {
            total_revenue: "", total_expenses: "",
            revenue_growth_rate: "3", expense_growth_rate: "3",
            income_lines: [
              { id: "inc_1", label: "Trading Revenue",    amount: "", growth_rate: "3", start_year: "", end_year: "" },
              { id: "inc_2", label: "Service Revenue",    amount: "", growth_rate: "3", start_year: "", end_year: "" },
              { id: "inc_3", label: "Investment Income",  amount: "", growth_rate: "2", start_year: "", end_year: "" },
              { id: "inc_4", label: "Rental Income",      amount: "", growth_rate: "3", start_year: "", end_year: "" },
            ],
            expense_lines: [
              { id: "exp_1",  label: "Salaries & Wages",    amount: "", growth_rate: "3", start_year: "", end_year: "" },
              { id: "exp_2",  label: "Director Fees",        amount: "", growth_rate: "3", start_year: "", end_year: "" },
              { id: "exp_3",  label: "Superannuation",       amount: "", growth_rate: "3", start_year: "", end_year: "" },
              { id: "exp_4",  label: "Rent / Occupancy",     amount: "", growth_rate: "3", start_year: "", end_year: "" },
              { id: "exp_5",  label: "Insurance",            amount: "", growth_rate: "3", start_year: "", end_year: "" },
              { id: "exp_6",  label: "Accounting & Legal",   amount: "", growth_rate: "3", start_year: "", end_year: "" },
              { id: "exp_7",  label: "Depreciation",         amount: "", growth_rate: "0", start_year: "", end_year: "" },
              { id: "exp_8",  label: "Interest Expense",     amount: "", growth_rate: "0", start_year: "", end_year: "" },
              { id: "exp_9",  label: "Motor Vehicle",        amount: "", growth_rate: "3", start_year: "", end_year: "" },
              { id: "exp_10", label: "Marketing",            amount: "", growth_rate: "3", start_year: "", end_year: "" },
              { id: "exp_11", label: "Other Operating",      amount: "", growth_rate: "3", start_year: "", end_year: "" },
            ],
          },
          share_capital: "", retained_earnings: "", franking_account_balance: "",
          uploaded_pnl: null, uploaded_bs: null,
        }]);
        const coTypeLabel = { "1":"Pty Ltd", "2":"Partnership", "3":"Sole trader", "4":"Charity" }[toolInput.co_type] || "Company";
        return { success: true, summary: `Added company: ${toolInput.company_name} (${coTypeLabel})` };
      }
      case "addSMSF": {
        const smsfs = factFind.smsfs || [];
        updateFF("smsfs", [...smsfs, {
          smsf_name:         toolInput.smsf_name,
          fund_type:         toolInput.fund_type    || "1",
          trustee_type:      toolInput.trustee_type || "1",
          acct_type:         toolInput.acct_type    || "1",
          smsf_balance:      toolInput.smsf_balance || "",
          individual_trustee: "",
          accounts: [],
        }]);
        return { success: true, summary: `Added SMSF: ${toolInput.smsf_name}${toolInput.smsf_balance ? ` — $${Number(toolInput.smsf_balance).toLocaleString()}` : ""}` };
      }
      case "addInsurancePolicy": {
        const policies = factFind.insurance?.policies || [];
        const newPol = {
          pol_name:           toolInput.pol_name,
          pol_type:           toolInput.pol_type           || "",
          pol_tax_env:        toolInput.pol_tax_env        || "",
          pol_owner:          toolInput.pol_owner          || "",
          pol_insured:        toolInput.pol_insured        || toolInput.pol_owner || "",
          pol_insurer:        toolInput.pol_insurer        || "",
          pol_number:         toolInput.pol_number         || "",
          pol_structure:      toolInput.pol_structure      || "1",
          pol_freq:           toolInput.pol_freq           || "1",
          pol_waiting:        toolInput.pol_waiting        || "",
          pol_benefit_period: toolInput.pol_benefit_period || "",
          linked_fund_id:     "",
          sum_insured_life:   toolInput.sum_insured_life   || "",
          sum_insured_tpd:    toolInput.sum_insured_tpd    || "",
          sum_insured_trauma: toolInput.sum_insured_trauma || "",
          sum_insured_ip:     toolInput.sum_insured_ip     || "",
          sum_insured_ip2:    "",
          premium_life:       toolInput.premium_life       || "",
          premium_tpd:        toolInput.premium_tpd        || "",
          premium_trauma:     toolInput.premium_trauma     || "",
          premium_ip:         toolInput.premium_ip         || "",
          premium_ip2:        "",
        };
        updateFF("insurance", { ...(factFind.insurance || {}), policies: [...policies, newPol] });
        const ownerName = toolInput.pol_owner === "client1" ? c1Name : toolInput.pol_owner === "client2" ? c2Name : "Joint";
        return { success: true, summary: `Added insurance: ${toolInput.pol_name} — ${toolInput.pol_type} — ${ownerName}` };
      }
      case "updateRiskProfile": {
        const plainToCode = {
          defensive: "1", conservative: "2", moderate: "3",
          balanced: "4", growth: "5", "high growth": "6", aggressive: "7"
        };
        const riskData = factFind.risk_profile || {
          client1: { answers: {}, score: 0, profile: "", specifiedProfile: "", adviserComments: "", clientComments: "", adjustedProfile: "", adjustmentReason: "" },
          client2: { answers: {}, score: 0, profile: "", specifiedProfile: "", adviserComments: "", clientComments: "", adjustedProfile: "", adjustmentReason: "" },
          mode: "", adjustRisk: "no"
        };
        const code = plainToCode[toolInput.specified_profile.toLowerCase()] || toolInput.specified_profile;
        const profileLabels = { "1":"Defensive","2":"Conservative","3":"Moderate","4":"Balanced","5":"Growth","6":"High Growth","7":"Aggressive" };
        updateFF("risk_profile", {
          ...riskData,
          [toolInput.client]: {
            ...riskData[toolInput.client],
            specifiedProfile:  code,
            profile:           code,
            score:             toolInput.score           ?? riskData[toolInput.client]?.score ?? 0,
            adviserComments:   toolInput.adviser_comments  || riskData[toolInput.client]?.adviserComments || "",
            adjustedProfile:   toolInput.adjusted_profile  || "",
            adjustmentReason:  toolInput.adjustment_reason || "",
          }
        });
        const clientName = toolInput.client === "client1" ? c1Name : c2Name;
        const label = profileLabels[code] || code;
        return { success: true, summary: `Risk profile set: ${clientName} — ${label}` };
      }
      case "clarify":
        return { success: true, summary: null, clarificationQuestion: toolInput.question };
      case "summariseChanges":
        return { success: true, summary: `\u2713 ${toolInput.count} change${toolInput.count !== 1 ? "s" : ""} made \u2014 ${toolInput.summary}`, isFinal: true };
      case "navigate_to": {
        const { section, highlight_id } = toolInput;
        if (onNavigate) onNavigate(section);
        if (highlight_id) setHighlightedRecordId(highlight_id);
        let result = `Navigated to ${section}`;
        if (highlight_id) result += `, highlighted record ${highlight_id}`;
        return { success: true, summary: result };
      }
      default:
        return { success: false, summary: `Unknown tool: ${toolName}` };
    }
  };

  const processResponse = async (apiMessages) => {
    const token = await getAccessToken();
    const response = await fetch("https://api.primesolve.com.au/api/v1/copilot/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: buildSystemPrompt(),
        tools: COPILOT_TOOL_DEFINITIONS,
        messages: apiMessages,
      }),
    });
    return await response.json();
  };

  const MAX_TOOL_ROUNDS = 10;

  const sendMessage = async (userInput) => {
    const text = userInput || input.trim();
    if (!text || loading) return;
    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    let apiMessages = updatedMessages.filter(m => m.role === "user" || m.role === "assistant")
      .map(m => ({ role: m.role, content: m.content }));
    let round = 0;

    try {
      while (round < MAX_TOOL_ROUNDS) {
        round++;
        const data = await processResponse(apiMessages);

        // Detect truncation — don't let Claude silently fabricate success
        if (data.stop_reason === "max_tokens") {
          console.warn("Co-pilot: response truncated — max_tokens hit");
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "My response was cut short. Please try a smaller batch — e.g. add 3–4 items at a time rather than all at once.",
          }]);
          break;
        }

        const toolResults = [];
        let hasToolUse = false;

        for (const block of (data.content || [])) {
          if (block.type === "tool_use") {
            hasToolUse = true;
            const result = executeTool(block.name, block.input);
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
            if (result.summary) {
              // Update activity feed live as each tool fires
              setActivityFeed(prev => [...prev, {
                id: block.id,
                toolName: block.name,
                summary: result.summary,
                success: result.success,
              }]);
            }
            if (result.clarificationQuestion) {
              setMessages(prev => [...prev, { role: "assistant", content: result.clarificationQuestion }]);
            }
          }
          if (block.type === "text" && block.text?.trim()) {
            setMessages(prev => [...prev, { role: "assistant", content: block.text }]);
          }
        }

        // If no tool calls this round, we're done
        if (!hasToolUse) break;

        // Append assistant turn + tool results and continue the loop
        apiMessages = [
          ...apiMessages,
          { role: "assistant", content: data.content },
          { role: "user", content: toolResults },
        ];

        // If stop_reason is end_turn despite having tool_use blocks, we're done
        if (data.stop_reason === "end_turn") break;
      }

      if (round >= MAX_TOOL_ROUNDS) {
        console.warn("Co-pilot: hit MAX_TOOL_ROUNDS safety ceiling");
      }
    } catch (err) {
      console.error("sendMessage error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const superCount = (factFind.superProducts || []).length;
  const assetCount = (factFind.assets || []).length;
  const debtCount = (factFind.liabilities || []).length;
  const modelCount = (factFind.advice_request?.strategy?.models || []).length;
  const stratCount = (factFind.advice_request?.strategy?.strategies || []).length;
  const childCount  = (factFind.children || []).length;
  const entityCount = (factFind.trusts || []).length + (factFind.companies || []).length + (factFind.smsfs || []).length;
  const insCount    = (factFind.insurance?.policies || []).length;

  const Chip = ({ color, children }) => {
    const colorMap = {
      indigo:  { bg: "rgba(79,70,229,0.1)",   fg: "#4F46E5", border: "rgba(79,70,229,0.2)" },
      cyan:    { bg: "rgba(6,182,212,0.1)",    fg: "#0891B2", border: "rgba(6,182,212,0.2)" },
      violet:  { bg: "rgba(139,92,246,0.1)",   fg: "#7C3AED", border: "rgba(139,92,246,0.2)" },
      pink:    { bg: "rgba(236,72,153,0.1)",   fg: "#DB2777", border: "rgba(236,72,153,0.2)" },
      amber:   { bg: "rgba(245,158,11,0.1)",   fg: "#D97706", border: "rgba(245,158,11,0.2)" },
      slate:   { bg: "var(--ps-surface)",       fg: "var(--ps-text-muted)", border: "var(--ps-border)" },
    };
    const c = colorMap[color] || { bg: "rgba(100,116,139,0.08)", fg: "#64748B", border: "rgba(100,116,139,0.15)" };
    return (
      <span style={{
        background: c.bg, color: c.fg, border: `1px solid ${c.border}`,
        borderRadius: 12, padding: "2px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
      }}>{children}</span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--ps-surface)" }}>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          70% { box-shadow: 0 0 0 20px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
      `}</style>
      {/* Panel header */}
      <div style={{
        padding: "10px 14px",
        background: "#4F46E5",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, color: "#fff" }}>{"\u2726"}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Co-pilot</span>
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: mode === "factfind" ? "#4ADE80" : "#A5B4FC",
            background: mode === "factfind" ? "#4ADE8018" : "#A5B4FC18",
            border: `1px solid ${mode === "factfind" ? "#4ADE8035" : "#A5B4FC35"}`,
            borderRadius: 4, padding: "2px 6px",
            textTransform: "uppercase", letterSpacing: "0.07em",
          }}>
            {mode === "factfind" ? "Fact Find" : "Cashflow Model"}
          </span>
        </div>
      </div>

      {/* Context strip */}
      <div style={{
        padding: "6px 14px", background: "var(--ps-surface-alt)", borderBottom: "1px solid var(--ps-border)",
        display: "flex", gap: 6, flexWrap: "wrap",
      }}>
        <Chip color="indigo">{c1Name}</Chip>
        {c2Name && <Chip color="cyan">{c2Name}</Chip>}
        <Chip color="slate">{superCount} super</Chip>
        <Chip color="slate">{assetCount} assets</Chip>
        <Chip color="slate">{debtCount} debts</Chip>
        <Chip color="violet">{modelCount} model{modelCount !== 1 ? "s" : ""}</Chip>
        <Chip color="violet">{stratCount} strategies</Chip>
        <Chip color="pink">{childCount} children</Chip>
        <Chip color="amber">{entityCount} entities</Chip>
        <Chip color="violet">{insCount} policies</Chip>
      </div>

      {/* Activity feed */}
      <div style={{
        padding: "8px 14px", borderBottom: "1px solid var(--ps-border)",
        maxHeight: 160, overflowY: "auto", background: "var(--ps-surface-alt)",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ps-text-subtle)", letterSpacing: "0.07em", marginBottom: 6 }}>
          ACTIVITY {"\u2014"} {activityFeed.length} change{activityFeed.length !== 1 ? "s" : ""} this session
        </div>
        {activityFeed.length === 0 && (
          <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", fontStyle: "italic" }}>No changes yet</div>
        )}
        {activityFeed.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: item.success ? "#059669" : "#EF4444", marginTop: 1, flexShrink: 0 }}>
              {item.success ? "\u2713" : "\u2717"}
            </span>
            <span style={{ fontSize: 11, color: "var(--ps-text-secondary)", lineHeight: 1.5 }}>{item.summary}</span>
          </div>
        ))}
      </div>

          {/* Chat messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column",
                alignItems: m.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "88%", padding: "10px 14px",
                  borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.role === "user" ? "#4F46E5" : "var(--ps-surface-alt)",
                  color: m.role === "user" ? "#fff" : "var(--ps-text-primary)",
                  border: m.role === "user" ? "none" : "1px solid var(--ps-border)",
                  fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap",
                }}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{
                alignSelf: "flex-start", padding: "10px 14px",
                background: "var(--ps-surface-alt)", borderRadius: "14px 14px 14px 4px",
                border: "1px solid var(--ps-border)",
                fontSize: 13, color: "var(--ps-text-muted)",
              }}>
                {"\u2726"} Thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div style={{ padding: "0 14px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 2 }}>QUICK START</div>
              {COPILOT_QUICK_PROMPTS.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)} style={{
                  textAlign: "left", padding: "7px 10px", background: "var(--ps-surface-alt)",
                  border: "1px solid var(--ps-border)", borderRadius: 8, fontSize: 11,
                  color: "var(--ps-text-secondary)", cursor: "pointer", lineHeight: 1.4,
                }}>{q}</button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div style={{
            padding: "10px 12px", borderTop: "1px solid var(--ps-border)",
            display: "flex", gap: 8, background: "var(--ps-surface-alt)",
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Tell the co-pilot what to add..."
              rows={2}
              style={{
                flex: 1, padding: "8px 12px", border: "1.5px solid var(--ps-border-mid)",
                borderRadius: 10, fontSize: 13, resize: "none", fontFamily: "inherit",
                outline: "none", background: "var(--ps-surface-input)",
                color: "var(--ps-text-primary)",
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                padding: "10px 16px",
                background: loading || !input.trim() ? "var(--ps-border)" : "#4F46E5",
                color: loading || !input.trim() ? "var(--ps-text-subtle)" : "#fff",
                border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13,
                cursor: loading || !input.trim() ? "default" : "pointer",
                alignSelf: "flex-end", flexShrink: 0,
              }}
            >{loading ? "..." : "Send"}</button>
          </div>
    </div>
  );
}

function CashflowModelInner({ initialData, onDataChange, onBack, mode, hideAdvice, clientId }) {
  const isFactfindMode = mode === "factfind";
  const [activeTop, setActiveTop] = useState("Summary of Results");

  const [clientInfo, setClientInfo] = useState(null);

  const backToParaplannerUrl = AI_PARAPLANNER_URL;

  const {
    factFind, setFactFind, adviceModel1, setAdviceModel1,
    updateFF, updateAdvice, resetAdviceModel,
    addPrincipal, removePrincipal,
    loadPrincipals, savePrincipals,
    loadDependants, saveDependants,
    debtFreqOverrides, setDebtFreqOverrides,
    debtIOOverrides, setDebtIOOverrides,
    darkMode, setDarkMode,
  } = useFactFind(initialData);

  // ── Principals API: load on mount, auto-save on change ──────
  const urlClientId = useMemo(() => {
    try {
      return clientId || new URLSearchParams(window.location.search).get('clientId');
    } catch { return null; }
  }, [clientId]);

  // Load principals from API on mount when clientId is available
  const principalsLoadedRef = useRef(false);
  useEffect(() => {
    if (urlClientId && !principalsLoadedRef.current) {
      principalsLoadedRef.current = true;
      loadPrincipals(urlClientId);
    }
  }, [urlClientId, loadPrincipals]);

  // Auto-save principals to API when client1/client2 data changes (debounced)
  const principalsSaveTimerRef = useRef(null);
  const principalsInitialised = useRef(false);
  useEffect(() => {
    // Skip the first render and the initial load population
    if (!principalsInitialised.current) {
      principalsInitialised.current = true;
      return;
    }
    if (!urlClientId) return;

    if (principalsSaveTimerRef.current) clearTimeout(principalsSaveTimerRef.current);
    principalsSaveTimerRef.current = setTimeout(() => {
      savePrincipals(urlClientId);
    }, 2000);

    return () => {
      if (principalsSaveTimerRef.current) clearTimeout(principalsSaveTimerRef.current);
    };
  }, [factFind.client1, factFind.client2, urlClientId, savePrincipals]);

  // ── Dependants API: load on mount, auto-save on change ─────
  const dependantsLoadedRef = useRef(false);
  useEffect(() => {
    if (urlClientId && !dependantsLoadedRef.current) {
      dependantsLoadedRef.current = true;
      loadDependants(urlClientId);
    }
  }, [urlClientId, loadDependants]);

  // Auto-save dependants to API when children/dependants_list changes (debounced)
  const dependantsSaveTimerRef = useRef(null);
  const dependantsInitialised = useRef(false);
  useEffect(() => {
    // Skip the first render and the initial load population
    if (!dependantsInitialised.current) {
      dependantsInitialised.current = true;
      return;
    }
    if (!urlClientId) return;

    if (dependantsSaveTimerRef.current) clearTimeout(dependantsSaveTimerRef.current);
    dependantsSaveTimerRef.current = setTimeout(() => {
      saveDependants(urlClientId);
    }, 2000);

    return () => {
      if (dependantsSaveTimerRef.current) clearTimeout(dependantsSaveTimerRef.current);
    };
  }, [factFind.children, factFind.dependants_list, urlClientId, saveDependants]);

  // Notify parent when factFind data changes (for API auto-save)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (onDataChange) onDataChange(factFind, adviceModel1?.advice_request?.strategy?.strategies);
  }, [factFind]); // eslint-disable-line react-hooks/exhaustive-deps

  const [activeSub, setActiveSub] = useState("Timeline");
  const [activeSubSub, setActiveSubSub] = useState("Financial Summary");
  const [selectedModel, setSelectedModel] = useState(isFactfindMode ? "base" : "advice1");
  const isAdviceModel = selectedModel === "advice1";
  const [factFindOpen, setFactFindOpen] = useState(false);
  const [factFindSection, setFactFindSection] = useState(null);
  const [adviceOpen, setAdviceOpen] = useState(false);
  const [adviceSection, setAdviceSection] = useState(null);
  const [showSOABuilder, setShowSOABuilder] = useState(false);
  const [showSummaryDashboard, setShowSummaryDashboard] = useState(true);

  // Co-pilot panel state — persisted via localStorage
  const [assistantOpen, setAssistantOpen] = useState(() => {
    try { return localStorage.getItem("primesolve_copilot_open") === "true"; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("primesolve_copilot_open", String(assistantOpen)); } catch {}
  }, [assistantOpen]);

  // factFind, adviceModel1, and helpers are provided by useFactFind()
  const topConfig = NAV_STRUCTURE[activeTop];

  // Shared CPI index toggle handler — works correctly for both base and advice model
  // fundIdx = index into engineData.superProducts (merged array)
  // field = e.g. "salary_sacrifice_indexed"
  // value = true/false
  const handleSuperCpiToggle = (fundIdx, field, value) => {
    const mergedProds = engineData.superProducts || [];
    const sp = mergedProds[fundIdx];
    if (!sp) return;
    if (sp._isAdviceProduct) {
      // New advice-only product — write into advice_request transactions newSuper list
      const newSuperList = (adviceModel1 || factFind).advice_request?.transactions?.newSuper || [];
      const advIdx = newSuperList.findIndex(a => a.id === sp._adviceId);
      if (advIdx >= 0) {
        const updated = newSuperList.map((a, i) => i === advIdx ? { ...a, contributions: { ...a.contributions, [field]: value } } : a);
        updateAdvice("advice_request.transactions.newSuper", updated);
      }
    } else {
      // Base fund — write to the active model (factFind or adviceModel1)
      const sourceProds = isAdviceModel
        ? [...((adviceModel1?.superProducts) || [])]
        : [...(factFind.superProducts || [])];
      if (sourceProds[fundIdx]) {
        sourceProds[fundIdx] = { ...sourceProds[fundIdx], contributions: { ...sourceProds[fundIdx].contributions, [field]: value } };
        if (isAdviceModel) {
          updateAdvice("superProducts", sourceProds);
        } else {
          updateFF("superProducts", sourceProds);
        }
      }
    }
  };
  // subTabs is computed after smsfSubTabs is built (see below)
  let subTabs = topConfig?.subTabs || [];

  // ═══════════════════════════════════════════════════════════════
  // ENGINE DATA SOURCE — All engine computations read from this.
  // Base model = factFind (read-only projection of existing position)
  // Advice model = adviceModel1 (adviser-modified clone of factFind)
  // Fact Find forms ALWAYS read from factFind directly.
  // ═══════════════════════════════════════════════════════════════
  const engineData = isAdviceModel ? (adviceModel1 || factFind) : factFind;
  const activeUpdate = isAdviceModel ? updateAdvice : updateFF;

  // Merge advice entities/products into engineData (mutates in place)
  mergeAdviceEntities(engineData, isAdviceModel);

  // Map generic tab keys to actual principal names for display
  const c1First = engineData.client1?.first_name || "";
  const c1Last = engineData.client1?.last_name || "";
  const c2First = engineData.client2?.first_name || "";
  const c2Last = engineData.client2?.last_name || "";
  const c1Display = (c1First + " " + c1Last).trim() || "Client 1";
  const c2Display = (c2First + " " + c2Last).trim() || "Client 2";

  // Build dynamic sub-sub tabs for Super and Pension from seed data
  const c1Short = c1First || "Client 1";
  const c2Short = c2First || "Client 2";

  // Build tab metadata from engine data
  const {
    superFundTabs, pensionTabs, annuityTabs, bondTabs, dbTabs,
    trustTabs, companyTabs, smsfTabs, smsfSubTabs, smsfSubSubMap,
  } = buildDynamicTabs(engineData, c1Short, c2Short);

  // Now override subTabs for Entities to expand SMSF into per-fund sub-tabs
  if (activeTop === "Entities") {
    subTabs = (topConfig?.subTabs || []).flatMap(s => s === "SMSF" ? smsfSubTabs : [s]);
  }

  // Filter out advice-only sub tabs when on base model
  if (selectedModel === "base" && topConfig?.adviceOnlySubTabs) {
    subTabs = subTabs.filter(s => !topConfig.adviceOnlySubTabs.includes(s));
  }

  const richTabMap = {};
  superFundTabs.forEach(t => { richTabMap[t.key] = t; });
  pensionTabs.forEach(t => { richTabMap[t.key] = t; });
  annuityTabs.forEach(t => { richTabMap[t.key] = t; });
  bondTabs.forEach(t => { richTabMap[t.key] = t; });
  dbTabs.forEach(t => { richTabMap[t.key] = t; });
  // Entity tabs only register in richTabMap when viewing Entities or CGT sections
  if (activeTop === "Entities" || (activeTop === "Cashflow/Tax" && (activeSub === "CGT" || activeSub === "Unrealised CGT"))) {
    trustTabs.forEach(t => { richTabMap[t.key] = t; });
    companyTabs.forEach(t => { richTabMap[t.key] = t; });
    smsfTabs.forEach(t => { richTabMap[t.key] = t; });
  }
  // Tax/CGT tabs just show entity badge (no product prefix)
  [c1Short, c2Short].forEach(name => { richTabMap[name] = { key: name, product: null, owner: name }; });

  // CGT entity tab names (prefixed to avoid collision with entity section tabs)
  const cgtEntityTabs = [];
  (engineData.trusts || []).forEach(t => { const n = t.trust_name || "Trust"; cgtEntityTabs.push(n); });
  (engineData.companies || []).forEach(c => { const n = c.company_name || "Company"; cgtEntityTabs.push(n); });
  (engineData.smsfs || []).forEach(s => { const n = s.smsf_name || "SMSF"; cgtEntityTabs.push(n); });

  // Override subSubTabs for Products and Cashflow/Tax with client names
  const dynamicSubSubTabs = {
    ...(topConfig?.subSubTabs || {}),
    "Super": superFundTabs.length > 0 ? superFundTabs.map(t => t.key) : ["Super 1", "Super 2"],
    "Pension": pensionTabs.length > 0 ? pensionTabs.map(t => t.key) : ["Pension 1"],
    "Annuity": annuityTabs.length > 0 ? annuityTabs.map(t => t.key) : ["Annuity 1"],
    "Investment Bond": bondTabs.length > 0 ? bondTabs.map(t => t.key) : ["Bond 1"],
    "Defined Benefit": dbTabs.length > 0 ? dbTabs.map(t => t.key) : [],
    "Trusts": trustTabs.length > 0 ? trustTabs.map(t => t.key) : [],
    "Companies": companyTabs.length > 0 ? companyTabs.map(t => t.key) : [],
    ...(activeTop === "Entities" ? smsfSubSubMap : {}),
    "SMSF": smsfTabs.length > 0 ? smsfTabs.map(t => t.key) : [],
    "Tax": [c1Short, c2Short],
    "CGT": [c1Short, c2Short, ...cgtEntityTabs],
    "Unrealised CGT": [c1Short, c2Short, ...cgtEntityTabs],
  };
  const subSubTabs = dynamicSubSubTabs[activeSub] || topConfig?.subSubTabs?.[activeSub] || [];

  const tabDisplayName = (tab) => {
    if (tab === "Client 1") return c1Display;
    if (tab === "Client 2") return c2Display;
    if (tab === "Client") return c1Display;
    if (tab === "Partner") return c2Display;
    return tab;
  };

  // =========================================================================
  // Build projection year range + asset helpers
  // =========================================================================
  const { currentFY, ageAtFYStart, c1AgeNow, c2AgeNow, c1Gender, c2Gender, PROJ_YEARS, N_YEARS, shortYears } = buildProjectionSetup(engineData);

  const ownerLabel = makeOwnerLabel(engineData, c1Display, c2Display);

  const { ffAssets, ffDebts, adviceDebts, newDebtDrawdowns, sellLookup, offsetAssetIndices, strat67All, getAssetRates, getAssetDRP } = buildAssetHelpers(engineData, factFind, isAdviceModel, N_YEARS, currentFY);

  const entityOwnerOptions = buildEntityOwnerOptions(factFind);

  // =========================================================================
  // Run full projection engine pipeline
  // =========================================================================
  const {
    propertyHoldings, defensiveHoldings, growthHoldings, lifestyleHoldings,
    entityDist,
    c1InsPremiums, c2InsPremiums, combinedNonSuperIns,
    annuity1Data, annuity2Data, allDBData,
    bondDataList, trustDataList, companyDataList, smsfDataList,
    superProj, penRollIn, penRollOut, rollInDetailPerPension, rollOutDetailPerPension,
    netWorthChartData, fsCashflowChartData, summaryMeta,
    financialSummaryData,
    ssData,
    agedCareC1, agedCareC2,
    c1PensionShare, c2PensionShare, combinedPension,
    c1CGT, c2CGT, trustCGTList, companyCGTList, smsfCGTList,
    streamedCGTToClient1, streamedCGTToClient2,
    taxClient1Data, taxClient1ChartData, taxClient2Data, taxClient2ChartData,
    savingsData, cashflowChartData, txnChartData, assetOpenBals,
    homeLoanData, investmentLoansData, otherDebtsData,
    allSuperData, allPensionData, super1Data, super2Data, pension1Data, pension2Data,
    dynamicAssetTypeChartData, dynamicMilestones,
    smsfMembersDataMap, smsfSegAccountDataMap,
  } = runProjectionEngine({
    engineData, factFind, isAdviceModel,
    currentFY, ageAtFYStart, N_YEARS, PROJ_YEARS, shortYears,
    c1Display, c2Display, c1Short, c2Short, c1Gender, c2Gender,
    ffAssets, ffDebts, adviceDebts, newDebtDrawdowns,
    sellLookup, offsetAssetIndices, strat67All,
    getAssetRates, getAssetDRP, ownerLabel,
    superFundTabs, pensionTabs, annuityTabs, bondTabs,
    smsfTabs, smsfSubTabs,
    debtFreqOverrides, debtIOOverrides,
  });

  // Build dynamic annuity tabs
  function handleTopChange(tab) {
    setActiveTop(tab);
    const config = NAV_STRUCTURE[tab];
    const newSubTabs = tab === "Entities"
      ? (config?.subTabs || []).flatMap(s => s === "SMSF" ? smsfSubTabs : [s])
      : (config?.subTabs || []);
    const firstSub = newSubTabs[0] || config?.subTabs?.[0] || "";
    setActiveSub(firstSub);
    const freshSubSubTabs = { ...(config?.subSubTabs || {}) };
    if (tab === "Superannuation") {
      Object.assign(freshSubSubTabs,
        { "Super": superFundTabs.length > 0 ? superFundTabs.map(t => t.key) : freshSubSubTabs["Super"] },
        { "Pension": pensionTabs.length > 0 ? pensionTabs.map(t => t.key) : freshSubSubTabs["Pension"] },
        { "Annuity": annuityTabs.length > 0 ? annuityTabs.map(t => t.key) : freshSubSubTabs["Annuity"] },
        { "Defined Benefit": dbTabs.length > 0 ? dbTabs.map(t => t.key) : freshSubSubTabs["Defined Benefit"] },
      );
    }
    if (tab === "Investment Products") {
      Object.assign(freshSubSubTabs,
        { "Investment Bond": bondTabs.length > 0 ? bondTabs.map(t => t.key) : freshSubSubTabs["Investment Bond"] },
      );
    }
    if (tab === "Cashflow/Tax") {
      Object.assign(freshSubSubTabs,
        { "Tax": [c1Short, c2Short], "CGT": [c1Short, c2Short], "Unrealised CGT": [c1Short, c2Short] },
      );
    }
    if (tab === "Entities") {
      Object.assign(freshSubSubTabs,
        { "Trusts": trustTabs.length > 0 ? trustTabs.map(t => t.key) : [] },
        { "Companies": companyTabs.length > 0 ? companyTabs.map(t => t.key) : [] },
        smsfSubSubMap,
      );
    }
    const firstSubSub = freshSubSubTabs[firstSub]?.[0] || "";
    setActiveSubSub(firstSubSub);
  }

  function handleSubChange(tab) {
    setActiveSub(tab);
    const firstSubSub = dynamicSubSubTabs[tab]?.[0] || topConfig?.subSubTabs?.[tab]?.[0] || "";
    setActiveSubSub(firstSubSub);
  }

  // Navigate to a specific page from source tags: [topTab, subTab, subSubTab]
  function navigateTo(navPath) {
    if (!navPath || navPath.length < 2) return;
    let [top, sub, subSub] = navPath;

    // Auto-remap old "Products" nav paths to new top-level sections
    if (top === "Products") {
      const superTypes = ["Superannuation", "Super", "Pension", "Annuity", "Defined Benefit"];
      const investTypes = ["Wrap", "Investment Bond"];
      if (superTypes.includes(sub)) {
        top = "Superannuation";
        if (sub === "Superannuation") sub = "Super";
      } else if (investTypes.includes(sub)) {
        top = "Investment Products";
      }
    }

    setActiveTop(top);
    setActiveSub(sub);
    if (subSub) setActiveSubSub(subSub);
    else {
      const useDynamic = top === "Superannuation" || top === "Investment Products" || top === "Cashflow/Tax" || top === "Entities";
      const dynSST = useDynamic ? dynamicSubSubTabs : NAV_STRUCTURE[top]?.subSubTabs;
      const firstSubSub = dynSST?.[sub]?.[0] || NAV_STRUCTURE[top]?.subSubTabs?.[sub]?.[0] || "";
      setActiveSubSub(firstSubSub);
    }
  }

  const isFinancialSummary =
    activeTop === "Summary of Results" &&
    activeSub === "Timeline";

  const isMilestones =
    activeTop === "Summary of Results" &&
    activeSub === "Milestones";

  const isCapitalDashboard = false; // removed — Capital is now its own top-level section

  const isNetEquity =
    activeTop === "Capital" &&
    activeSub === "Projection";

  const isNetEquityProperty = false;
  const isNetEquityDebt = false;

  const isCashflowDashboard =
    activeTop === "Summary of Results" &&
    activeSub === "Cashflow";

  const isRetirementDashboard =
    activeTop === "Summary of Results" &&
    activeSub === "Retirement";

  const isHealthCheck = false; // removed — replaced by retirement tiles

  const isAdviceSummary =
    activeTop === "Summary of Results" &&
    activeSub === "Advice Summary";

  const isPortfolio =
    activeTop === "Summary of Results" &&
    activeSub === "Portfolio";

  const isBenefitOfAdvice =
    activeTop === "Advice Detail" &&
    activeSub === "Advice Impact";

  const isProductProjection = false;
  const isPortfolioTransactions = false;

  const isObjectives =
    activeTop === "Advice Detail" &&
    activeSub === "Objectives";

  const isRecommendations =
    activeTop === "Advice Detail" &&
    activeSub === "Recommendations";

  const isScope = false;

  const isEligibility1 =
    activeTop === "Rates" &&
    activeSub === "Client 1" &&
    activeSubSub === "Eligibility";

  const isRebalancing =
    activeTop === "Rates" &&
    activeSub === "Model" &&
    activeSubSub === "Rebalancing";

  const isEligibility2 =
    activeTop === "Rates" &&
    activeSub === "Client 2" &&
    activeSubSub === "Eligibility";

  const isAssumptionsSuper1 =
    activeTop === "Rates" &&
    activeSub === "Client 1" &&
    activeSubSub === "Superannuation";

  const isAssumptionsSuper2 =
    activeTop === "Rates" &&
    activeSub === "Client 2" &&
    activeSubSub === "Superannuation";

  const isAgedCare =
    activeTop === "Aged Care" &&
    activeSub === "Assessment";

  const isSS =
    activeTop === "Social Security" &&
    activeSub === "Assessment";

  const isModelComparison =
    activeTop === "Summary of Results" &&
    activeSub === "Model Comparison";

  const isSOADocument =
    activeTop === "SOA Document" &&
    activeSub === "Builder";

  const isModelComparisonDetail = false;

  const isSavings =
    activeTop === "Cashflow/Tax" &&
    activeSub === "Cashflow" &&
    activeSubSub === "Savings";

  const isTaxClient1 =
    activeTop === "Cashflow/Tax" &&
    activeSub === "Tax" &&
    (activeSubSub === c1Short || activeSubSub === c1Display || activeSubSub === "Client 1");

  const isTaxClient2 =
    activeTop === "Cashflow/Tax" &&
    activeSub === "Tax" &&
    (activeSubSub === c2Short || activeSubSub === c2Display || activeSubSub === "Client 2");

  const isCGTClient1 =
    activeTop === "Cashflow/Tax" &&
    activeSub === "CGT" &&
    (activeSubSub === c1Short || activeSubSub === c1Display || activeSubSub === "Client 1");

  const isCGTClient2 =
    activeTop === "Cashflow/Tax" &&
    activeSub === "CGT" &&
    (activeSubSub === c2Short || activeSubSub === c2Display || activeSubSub === "Client 2");

  const matchedCGTTrustIdx = activeTop === "Cashflow/Tax" && activeSub === "CGT"
    ? trustCGTList.findIndex(t => t.name === activeSubSub) : -1;
  const matchedCGTCompanyIdx = activeTop === "Cashflow/Tax" && activeSub === "CGT"
    ? companyCGTList.findIndex(c => c.name === activeSubSub) : -1;
  const matchedCGTSmsfIdx = activeTop === "Cashflow/Tax" && activeSub === "CGT"
    ? smsfCGTList.findIndex(s => s.name === activeSubSub) : -1;

  const isUCGTClient1 =
    activeTop === "Cashflow/Tax" &&
    activeSub === "Unrealised CGT" &&
    (activeSubSub === c1Short || activeSubSub === c1Display || activeSubSub === "Client 1");

  const isUCGTClient2 =
    activeTop === "Cashflow/Tax" &&
    activeSub === "Unrealised CGT" &&
    (activeSubSub === c2Short || activeSubSub === c2Display || activeSubSub === "Client 2");

  const matchedUCGTTrustIdx = activeTop === "Cashflow/Tax" && activeSub === "Unrealised CGT"
    ? trustCGTList.findIndex(t => t.name === activeSubSub) : -1;
  const matchedUCGTCompanyIdx = activeTop === "Cashflow/Tax" && activeSub === "Unrealised CGT"
    ? companyCGTList.findIndex(c => c.name === activeSubSub) : -1;
  const matchedUCGTSmsfIdx = activeTop === "Cashflow/Tax" && activeSub === "Unrealised CGT"
    ? smsfCGTList.findIndex(s => s.name === activeSubSub) : -1;

  const isDeathTax =
    activeTop === "Cashflow/Tax" &&
    activeSub === "Potential Death Tax";

  const matchedSuperIdx = activeTop === "Superannuation" && activeSub === "Super"
    ? superFundTabs.findIndex(t => t.key === activeSubSub) : -1;
  const isSuper1 = matchedSuperIdx === 0;
  const isSuper2 = matchedSuperIdx === 1;

  const matchedPensionIdx = activeTop === "Superannuation" && activeSub === "Pension"
    ? pensionTabs.findIndex(t => t.key === activeSubSub) : -1;
  const isPension1 = matchedPensionIdx === 0;
  const isPension2 = matchedPensionIdx === 1;

  const matchedBondIdx = activeTop === "Investment Products" && activeSub === "Investment Bond"
    ? bondTabs.findIndex(t => t.key === activeSubSub) : -1;

  const matchedDBIdx = activeTop === "Superannuation" && activeSub === "Defined Benefit"
    ? dbTabs.findIndex(t => t.key === activeSubSub) : -1;

  const isDefensiveAssets =
    activeTop === "Assets & Liabilities" &&
    activeSub === "Assets" &&
    activeSubSub === "Defensive Assets";

  const isGrowthAssets =
    activeTop === "Assets & Liabilities" &&
    activeSub === "Assets" &&
    activeSubSub === "Growth Assets";

  const isPropertyAssets =
    activeTop === "Assets & Liabilities" &&
    activeSub === "Assets" &&
    activeSubSub === "Property";

  const isLifestyleAssets =
    activeTop === "Assets & Liabilities" &&
    activeSub === "Assets" &&
    activeSubSub === "Lifestyle Assets";

  const isHomeLoan =
    activeTop === "Assets & Liabilities" &&
    activeSub === "Debts" &&
    activeSubSub === "Home Loan";

  const isInvestmentLoans =
    activeTop === "Assets & Liabilities" &&
    activeSub === "Debts" &&
    activeSubSub === "Investment Loans";

  const isOtherDebts =
    activeTop === "Assets & Liabilities" &&
    activeSub === "Debts" &&
    activeSubSub === "Other";

  const matchedTrustIdx = activeTop === "Entities" && activeSub === "Trusts"
    ? trustTabs.findIndex(t => t.key === activeSubSub) : -1;
  const matchedCompanyIdx = activeTop === "Entities" && activeSub === "Companies"
    ? companyTabs.findIndex(t => t.key === activeSubSub) : -1;
  const isSmsfSubTab = activeTop === "Entities" && smsfSubTabs.includes(activeSub);
  const matchedSmsfIdx = isSmsfSubTab
    ? smsfDataList.findIndex(s => s.name === activeSubSub) : -1;
  const matchedSmsfMembers = isSmsfSubTab
    ? smsfMembersDataMap[activeSubSub] : null;
  const matchedSmsfSegAccount = isSmsfSubTab
    ? smsfSegAccountDataMap[activeSubSub] : null;
  // Fund summary: when activeSubSub matches the fund name itself
  const matchedSmsfFund = isSmsfSubTab
    ? smsfDataList.find(s => s.name === activeSubSub) : null;

  const isAnnuity1 =
    activeTop === "Superannuation" &&
    activeSub === "Annuity" &&
    activeSubSub === (annuityTabs[0]?.key || "Annuity 1");

  const isAnnuity2 =
    activeTop === "Superannuation" &&
    activeSub === "Annuity" &&
    activeSubSub === (annuityTabs[1]?.key || "Annuity 2");

  const isWrap1 =
    activeTop === "Investment Products" &&
    activeSub === "Wrap";

  const isInsuranceClient =
    activeTop === "Insurance" &&
    activeSub === "Projection" &&
    activeSubSub === "Client";

  const isInsurancePartner =
    activeTop === "Insurance" &&
    activeSub === "Projection" &&
    activeSubSub === "Partner";

  const isPremiumCostClient =
    activeTop === "Insurance" &&
    activeSub === "Premium Costs" &&
    activeSubSub === "Client";

  const isPremiumCostPartner =
    activeTop === "Insurance" &&
    activeSub === "Premium Costs" &&
    activeSubSub === "Partner";

  const activePageData = isFinancialSummary ? financialSummaryData
    : isNetEquity ? NET_EQUITY_DATA
    : null;

  // Fact Find sections
  const FACT_FIND_SECTIONS = [
    { id: "principals", icon: "👤", label: "Principals", desc: "Client details, DOB, salary, deductions", color: "#4F46E5" },
    { id: "dependants", icon: "👥", label: "Dependants", desc: "Children & other dependants", color: "#EC4899" },
    { id: "trusts_companies", icon: "🏛️", label: "Trusts & Companies", desc: "Trusts, Pty Ltd entities, shareholders", color: "#D97706" },
    { id: "smsf", icon: "🔒", label: "SMSF", desc: "Self-managed super fund accounts", color: "#6366F1" },
    { id: "superannuation", icon: "🏦", label: "Superannuation", desc: "Super funds, pensions, annuities", color: "#0891B2" },
    { id: "investments", icon: "📊", label: "Investments", desc: "Wraps, master trusts, investment bonds", color: "var(--ps-green)" },
    { id: "assets", icon: "🏠", label: "Assets", desc: "Property, vehicles, investments, cash", color: "#0891B2" },
    { id: "liabilities", icon: "💳", label: "Liabilities", desc: "Loans, mortgages, credit cards", color: "var(--ps-red)" },
    { id: "income", icon: "💵", label: "Income", desc: "Salary, benefits, bonuses, adjustments", color: "var(--ps-green)" },
    { id: "expenses", icon: "🧾", label: "Expenses", desc: "Spending, savings, expense adjustments", color: "var(--ps-red)" },
    { id: "goals", icon: "🎯", label: "Goals", desc: "Advice reasons, objectives & retirement planning", color: "#DB2777" },
    { id: "risk-profile", icon: "📋", label: "Risk Profile", desc: "Risk questionnaire, attitude to investing", color: "#9333EA" },
    { id: "insurance-policies", icon: "🛡️", label: "Insurance Policies", desc: "Life, TPD, Trauma, IP policies", color: "#7C3AED" },
    { id: "assumptions", icon: "⚙️", label: "Modelling", desc: "Growth rates, inflation, modelling parameters", color: "var(--ps-text-muted)" },
    { id: "tax-super-planning", icon: "📊", label: "Tax & Super Planning", desc: "Low rate threshold, bring forward, transfer balance cap", color: "#0891B2" },
  ];

  const FACT_FIND_GROUPS = [
    { label: "People", ids: ["principals", "dependants"] },
    { label: "Entities", ids: ["trusts_companies", "smsf"] },
    { label: "Products", ids: ["superannuation", "investments"] },
    { label: "Capital", ids: ["assets", "liabilities"] },
    { label: "Cashflow", ids: ["income", "expenses"] },
    { label: "Goals & Risk Profile", ids: ["goals", "risk-profile"] },
    { label: "Wealth Protection", ids: ["insurance-policies"] },
    { label: "Assumptions", ids: ["assumptions", "tax-super-planning"] },
  ];

  const factFindPanelJSX = (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0,
      width: factFindSection ? "65vw" : 400,
      background: "var(--ps-surface)",
      boxShadow: "-4px 0 24px var(--ps-shadow-sm)",
      zIndex: 1000,
      display: "flex",
      transition: "width 0.2s ease",
      borderLeft: "1px solid var(--ps-border)",
    }}>
      {/* Left: Section icons */}
      <div style={{
        width: factFindSection ? 280 : "100%",
        borderRight: factFindSection ? "1px solid var(--ps-border)" : "none",
        overflowY: "auto",
        background: "var(--ps-surface-alt)",
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--ps-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>📋</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-primary)" }}>Fact Find</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => { setFactFindOpen(false); setFactFindSection(null); }} style={{
              width: 28, height: 28, borderRadius: 6, border: "1px solid var(--ps-border)",
              background: "var(--ps-surface)", cursor: "pointer", fontSize: 14, color: "var(--ps-text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>
        </div>

        <div style={{ padding: factFindSection ? "12px 10px" : "16px 20px" }}>
          {FACT_FIND_GROUPS.map((group, gi) => (
            <div key={gi} style={{ marginBottom: factFindSection ? 10 : 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)",
                textTransform: "uppercase", letterSpacing: "0.06em",
                marginBottom: factFindSection ? 4 : 8,
                padding: factFindSection ? "0 6px" : 0,
              }}>{group.label}</div>

              {factFindSection ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {group.ids.map(id => {
                    const s = FACT_FIND_SECTIONS.find(x => x.id === id);
                    const isActive = factFindSection === id;
                    return (
                      <button key={id} onClick={() => setFactFindSection(id)} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "7px 10px", borderRadius: 6,
                        border: "none", cursor: "pointer",
                        background: isActive ? "var(--ps-surface-indigo)" : "transparent",
                        transition: "all 0.1s ease",
                      }}>
                        <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{s.icon}</span>
                        <span style={{
                          fontSize: 12, fontWeight: isActive ? 600 : 400,
                          color: isActive ? "#4F46E5" : "var(--ps-text-secondary)",
                        }}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {group.ids.map(id => {
                    const s = FACT_FIND_SECTIONS.find(x => x.id === id);
                    return (
                      <button key={id} onClick={() => setFactFindSection(id)} style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        gap: 6, padding: "14px 8px", borderRadius: 10,
                        border: "1px solid var(--ps-border)", cursor: "pointer",
                        background: "var(--ps-surface)",
                        transition: "all 0.15s ease",
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.background = s.color + "08"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--ps-border)"; e.currentTarget.style.background = "var(--ps-surface)"; }}
                      >
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: s.color + "12",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 20,
                        }}>{s.icon}</div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-primary)", textAlign: "center", lineHeight: "1.3" }}>{s.label}</span>
                        <span style={{ fontSize: 10, color: "var(--ps-text-subtle)", textAlign: "center", lineHeight: "1.3" }}>{s.desc}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Form area */}
      {factFindSection && (
        <div style={{ flex: 1, overflowY: "auto", background: "var(--ps-surface)", display: "flex", flexDirection: "row" }}>
          {/* Form content */}
          <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
            <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--ps-border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: (FACT_FIND_SECTIONS.find(s => s.id === factFindSection)?.color || "#4F46E5") + "15",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17,
              }}>
                {FACT_FIND_SECTIONS.find(s => s.id === factFindSection)?.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>
                  {FACT_FIND_SECTIONS.find(s => s.id === factFindSection)?.label}
                </div>
                <div style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>
                  {FACT_FIND_SECTIONS.find(s => s.id === factFindSection)?.desc}
                </div>
              </div>
            </div>
            <button onClick={() => setFactFindSection(null)} style={{
              padding: "4px 10px", borderRadius: 5, border: "1px solid var(--ps-border)",
              background: "var(--ps-surface)", cursor: "pointer", fontSize: 11, color: "var(--ps-text-muted)", fontWeight: 500,
            }}>← Back</button>
          </div>

          <div style={{ padding: "24px 28px" }}>
            {factFindSection === "principals" ? (
              <PrincipalsForm
                factFind={factFind}
                updateFF={updateFF}
                addPrincipal={addPrincipal}
                removePrincipal={removePrincipal}
                onSavePrincipals={urlClientId ? () => savePrincipals(urlClientId) : null}
              />
            ) : factFindSection === "dependants" ? (
              <DependantsForm
                factFind={factFind}
                updateFF={updateFF}
                clientId={urlClientId}
              />
            ) : factFindSection === "superannuation" ? (
              <SuperannuationForm
                factFind={factFind}
                updateFF={updateFF}
                clientId={urlClientId}
                client1Guid={urlClientId}
                client2Guid={null}
              />
            ) : factFindSection === "investments" ? (
              <InvestmentsForm
                factFind={factFind}
                updateFF={updateFF}
              />
            ) : factFindSection === "trusts_companies" ? (
              <TrustsCompaniesForm
                factFind={factFind}
                updateFF={updateFF}
                clientId={urlClientId}
              />
            ) : factFindSection === "smsf" ? (
              <SMSFForm
                factFind={factFind}
                updateFF={updateFF}
                clientId={urlClientId}
              />
            ) : factFindSection === "assets" ? (
              <AssetsForm
                factFind={factFind}
                updateFF={updateFF}
                entityOwnerOptions={entityOwnerOptions}
              />
            ) : factFindSection === "liabilities" ? (
              <LiabilitiesForm
                factFind={factFind}
                updateFF={updateFF}
                entityOwnerOptions={entityOwnerOptions}
              />
            ) : factFindSection === "insurance-policies" ? (
              <InsurancePoliciesForm
                factFind={factFind}
                updateFF={updateFF}
              />
            ) : factFindSection === "income" ? (
              <IncomeForm
                factFind={factFind}
                updateFF={updateFF}
              />
            ) : factFindSection === "expenses" ? (
              <ExpensesForm
                factFind={factFind}
                updateFF={updateFF}
              />
            ) : factFindSection === "goals" ? (
              <GoalsForm
                factFind={factFind}
                updateFF={updateFF}
              />
            ) : factFindSection === "risk-profile" ? (
              <RiskProfileForm
                factFind={factFind}
                updateFF={updateFF}
              />
            ) : factFindSection === "assumptions" ? (
              <AssumptionsPanel factFind={factFind} updateFF={updateFF} />
            ) : factFindSection === "tax-super-planning" ? (
              <TaxSuperPlanningForm factFind={factFind} updateFF={updateFF} />
            ) : (
              <div style={{
                padding: "40px 24px", borderRadius: 12,
                border: "2px dashed var(--ps-border)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>
                  {FACT_FIND_SECTIONS.find(s => s.id === factFindSection)?.icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 6 }}>
                  {FACT_FIND_SECTIONS.find(s => s.id === factFindSection)?.label} Form
                </div>
                <div style={{ fontSize: 12, color: "var(--ps-text-subtle)" }}>
                  Input fields will be built here
                </div>
              </div>
            )}
          </div>
        </div>

        </div>
      )}
    </div>
  );

  // =========================================================================
  // QUICK RECS FORM
  // =========================================================================
  const QuickRecsForm = ({ factFind, baseFf, updateFF }) => {
    const ff = baseFf || factFind;
    const qr = factFind?.advice_request?.quick_recs || {};
    const save = (patch) => updateFF("advice_request.quick_recs", { ...qr, ...patch });

    const c1 = ff.client1 || {};
    const c2 = ff.client2 || {};
    const c1Name = [c1.first_name, c1.last_name].filter(Boolean).join(" ") || "Client 1";
    const c2Name = [c2.first_name, c2.last_name].filter(Boolean).join(" ") || "Client 2";
    const hasPartner = !!ff.client2?.first_name;
    const FUNERAL_BOND_MAX = 15500;

    // Pull entity lists from fact find
    const entities = ff.advice_request?.entities || {};
    const trusts = (entities.trusts || []).filter(t => t.name);
    const companies = (entities.companies || []).filter(c => c.name);
    // Also check existing entities register
    const ffTrusts = (ff.trusts || []).filter(t => t.e_name);
    const ffCompanies = (ff.companies || []).filter(c => c.e_name);
    const allTrusts = [...ffTrusts.map(t => t.e_name), ...trusts.map(t => t.name)];
    const allCompanies = [...ffCompanies.map(c => c.e_name), ...companies.map(c => c.name)];

    const toggleRec = (key) => save({ [key]: !qr[key] });

    const RecCard = ({ id, icon, title, desc, note, children }) => {
      const selected = !!qr[id];
      return (
        <div onClick={() => toggleRec(id)} style={{
          border: `2px solid ${selected ? "#4F46E5" : "var(--ps-border)"}`,
          borderRadius: 10, padding: "14px 16px", marginBottom: 10,
          background: selected ? "var(--ps-surface-indigo)" : "var(--ps-surface-alt)",
          cursor: "pointer", transition: "all 0.15s",
        }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ fontSize: 22, lineHeight: 1, marginTop: 1 }}>{icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: selected ? "#3730A3" : "var(--ps-text-primary)" }}>{title}</div>
                {selected && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ps-surface)", background: "#4F46E5", padding: "2px 8px", borderRadius: 10 }}>INCLUDED</span>}
              </div>
              <div style={{ fontSize: 11, color: "var(--ps-text-muted)", lineHeight: 1.5 }}>{desc}</div>
              {note && <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginTop: 4, fontStyle: "italic" }}>{note}</div>}
            </div>
          </div>
          {selected && children && (
            <div onClick={e => e.stopPropagation()} style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--ps-ring-indigo)" }}>
              {children}
            </div>
          )}
        </div>
      );
    };

    const inputStyle = { border: "1px solid var(--ps-ring-indigo)", borderRadius: 6, padding: "5px 10px", fontSize: 12, outline: "none", background: "var(--ps-surface-input)", width: "100%" };
    const labelStyle = { fontSize: 11, fontWeight: 600, color: "#3730A3", marginBottom: 4 };

    const SectionHead = ({ label }) => (
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "20px 0 10px" }}>{label}</div>
    );

    return (
      <div style={{ padding: "24px 28px", maxWidth: 740 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>Quick Recs</div>
          <div style={{ fontSize: 13, color: "var(--ps-text-muted)" }}>Select the strategies to include in your recommendations. Each selected item will be added to the advice provided to the client.</div>
        </div>

        <SectionHead label="Estate Planning" />
        <RecCard id="will_c1" icon="📜" title={`Update Will — ${c1Name}`}
          desc="Ensure the will is current, valid and reflects the client's current wishes, assets and family situation." />
        {hasPartner && <RecCard id="will_c2" icon="📜" title={`Update Will — ${c2Name}`}
          desc="Ensure the will is current, valid and reflects the client's current wishes, assets and family situation." />}
        <RecCard id="test_trust_c1" icon="🏛️" title={`Testamentary Trust — ${c1Name}`}
          desc="A testamentary trust established through the will allows tax-effective distribution of estate assets to beneficiaries, including income splitting to minor children at adult tax rates." />
        {hasPartner && <RecCard id="test_trust_c2" icon="🏛️" title={`Testamentary Trust — ${c2Name}`}
          desc="A testamentary trust established through the will allows tax-effective distribution of estate assets to beneficiaries, including income splitting to minor children at adult tax rates." />}

        <SectionHead label="Assets & Liabilities" />
        <RecCard id="credit_card" icon="💳" title="Use Credit Card for Monthly Expenses"
          desc="Pay all monthly living expenses on an interest-free credit card. Leave cash sitting in the offset account for the full month before clearing the card, maximising daily offset balance and reducing mortgage interest. Card must be cleared in full each month." />
        <RecCard id="mda" icon="📊" title="Establish a Managed Discretionary Account (MDA)"
          desc="An MDA allows a licensed investment manager to make portfolio decisions on the client's behalf without requiring prior approval for each transaction. Provides professional, timely portfolio management within an agreed investment mandate.">
          <div>
            <div style={labelStyle}>MDA Provider / Platform Name</div>
            <input style={inputStyle} value={qr.mda_name || ""} onChange={e => save({ mda_name: e.target.value })} placeholder="e.g. Macquarie MDA, Praemium, Managed Portfolio" />
          </div>
        </RecCard>

        <SectionHead label="Centrelink Strategy" />
        <RecCard id="gifting" icon="🎁" title="Maximum Gifting"
          desc="Gift assets to reduce assessable assets and income for Centrelink means testing. Gifting limits: $10,000 per financial year, $30,000 over any rolling 5-year period per couple. Amounts above these limits are treated as deprived assets for 5 years. Set the specific amount in Modelling Strategies."
          note="Gifting limits apply per couple. Centrelink deems deprived assets for 5 years above the limits." />
        <RecCard id="funeral_bond_c1" icon="⚰️" title={`Funeral Bond — ${c1Name}`}
          desc={`A prepaid funeral bond is exempt from the Centrelink assets test up to $${FUNERAL_BOND_MAX.toLocaleString()} per person (current indexed limit). Reduces assessable assets dollar-for-dollar, potentially increasing Age Pension entitlement. Set the amount in Modelling Strategies.`}
          note={`Current exempt limit: $${FUNERAL_BOND_MAX.toLocaleString()} per person, indexed annually by CPI.`} />
        {hasPartner && <RecCard id="funeral_bond_c2" icon="⚰️" title={`Funeral Bond — ${c2Name}`}
          desc={`A prepaid funeral bond is exempt from the Centrelink assets test up to $${FUNERAL_BOND_MAX.toLocaleString()} per person (current indexed limit). Reduces assessable assets dollar-for-dollar, potentially increasing Age Pension entitlement. Set the amount in Modelling Strategies.`}
          note={`Current exempt limit: $${FUNERAL_BOND_MAX.toLocaleString()} per person, indexed annually by CPI.`} />}

      </div>
    );
  };

    // =========================================================================
  // ADVICE PANEL JSX
  const ADVICE_SECTIONS = [
    { id: "scope", icon: "📐", label: "Scope of Advice", desc: "Define what areas the advice will cover", color: "#0D9488" },
    { id: "advice-models", icon: "📊", label: "Advice Models", desc: "Define drawdown, surplus & portfolio models", color: "#4F46E5" },
    { id: "entities", icon: "🏢", label: "Entities", desc: "Trusts, companies, SMSFs & structures", color: "#0891B2" },
    { id: "retirement-products", icon: "🏖️", label: "Retirement Products", desc: "Super funds & pensions", color: "#D97706" },
    { id: "investment-products", icon: "💼", label: "Investment Products", desc: "Wraps, bonds & managed accounts", color: "var(--ps-green)" },
    { id: "product-replacement", icon: "🔁", label: "Product Replacement", desc: "Rollovers & fund transfers", color: "var(--ps-red)" },
    { id: "transactions", icon: "🔄", label: "Transactions", desc: "Buy & sell assets, new debts", color: "#D97706" },
    { id: "portfolio", icon: "📊", label: "Portfolio", desc: "Asset allocation & investment selection", color: "var(--ps-green)" },
    { id: "insurance-needs", icon: "🛡️", label: "Insurance Needs", desc: "Needs analysis & gap assessment", color: "#7C3AED" },
    { id: "insurance-policies", icon: "📋", label: "Insurance Policies", desc: "Policy recommendations & changes", color: "#7C3AED" },
    { id: "quick-recs", icon: "✅", label: "Quick Recs", desc: "Simple recommendations from modelling", color: "var(--ps-green)" },
    { id: "strategies", icon: "⚡", label: "Modelling Strategies", desc: "Strategic recommendations & rationale", color: "#4F46E5" },
    { id: "assumptions", icon: "⚙️", label: "Modelling", desc: "Growth rates, inflation, modelling parameters", color: "var(--ps-text-muted)" },
    { id: "tax-super-planning", icon: "📊", label: "Tax & Super Planning", desc: "Low rate threshold, bring forward, transfer balance cap", color: "#0891B2" },
  ];

  const ADVICE_GROUPS = [
    { label: "Advice Framework", ids: ["scope", "advice-models"] },
    { label: "Entities & Product", ids: ["entities", "retirement-products", "investment-products", "product-replacement"] },
    { label: "Transactions", ids: ["transactions", "portfolio"] },
    { label: "Wealth Protection", ids: ["insurance-needs", "insurance-policies"] },
    { label: "Strategy", ids: ["quick-recs", "strategies"] },
    { label: "Assumptions", ids: ["assumptions", "tax-super-planning"] },
  ];

  const advicePanelJSX = (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0,
      width: adviceSection ? "72vw" : 400,
      maxWidth: adviceSection ? 1300 : 400,
      background: "var(--ps-surface)",
      boxShadow: "-4px 0 24px var(--ps-shadow-sm)",
      zIndex: 1000,
      display: "flex",
      transition: "width 0.2s ease",
      borderLeft: "1px solid var(--ps-border)",
    }}>
      {/* Left: Section nav */}
      <div style={{
        width: adviceSection ? 200 : "100%",
        minWidth: adviceSection ? 200 : undefined,
        borderRight: adviceSection ? "1px solid var(--ps-border)" : "none",
        overflowY: "auto",
        background: "var(--ps-surface-alt)",
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--ps-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-primary)" }}>Advice</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => { setAdviceOpen(false); setAdviceSection(null); }} style={{
              width: 28, height: 28, borderRadius: 6, border: "1px solid var(--ps-border)",
              background: "var(--ps-surface)", cursor: "pointer", fontSize: 14, color: "var(--ps-text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>
        </div>

        <div style={{ padding: adviceSection ? "12px 10px" : "16px 20px" }}>
          {ADVICE_GROUPS.map((group, gi) => (
            <div key={gi} style={{ marginBottom: adviceSection ? 10 : 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)",
                textTransform: "uppercase", letterSpacing: "0.06em",
                marginBottom: adviceSection ? 4 : 8,
                padding: adviceSection ? "0 6px" : 0,
              }}>{group.label}</div>

              {adviceSection ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {group.ids.map(id => {
                    const s = ADVICE_SECTIONS.find(x => x.id === id);
                    const isActive = adviceSection === id;
                    return (
                      <button key={id} onClick={() => setAdviceSection(id)} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "7px 10px", borderRadius: 6,
                        border: "none", cursor: "pointer",
                        background: isActive ? (s.color + "15") : "transparent",
                        transition: "all 0.1s",
                      }}>
                        <span style={{ fontSize: 14 }}>{s.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? s.color : "var(--ps-text-muted)" }}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: group.ids.length === 1 ? "1fr" : "1fr 1fr", gap: 8 }}>
                  {group.ids.map(id => {
                    const s = ADVICE_SECTIONS.find(x => x.id === id);
                    return (
                      <button key={id} onClick={() => setAdviceSection(id)} style={{
                        padding: "14px 16px",
                        borderRadius: 10,
                        border: "1px solid var(--ps-border)",
                        background: "var(--ps-surface)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}>
                        <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)" }}>{s.label}</div>
                        <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", marginTop: 2 }}>{s.desc}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Form area */}
      {adviceSection && (
        <div style={{ flex: 1, overflowY: "auto", background: "var(--ps-surface)", display: "flex", flexDirection: "row" }}>
          {/* Form content */}
          <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--ps-border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: (ADVICE_SECTIONS.find(s => s.id === adviceSection)?.color || "#0D9488") + "15",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 17,
                }}>
                  {ADVICE_SECTIONS.find(s => s.id === adviceSection)?.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>
                    {ADVICE_SECTIONS.find(s => s.id === adviceSection)?.label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>
                    {ADVICE_SECTIONS.find(s => s.id === adviceSection)?.desc}
                  </div>
                </div>
              </div>
              <button onClick={() => setAdviceSection(null)} style={{
                padding: "4px 10px", borderRadius: 5, border: "1px solid var(--ps-border)",
                background: "var(--ps-surface)", cursor: "pointer", fontSize: 11, color: "var(--ps-text-muted)", fontWeight: 500,
              }}>← Back</button>
            </div>

            <div style={{ padding: 16, overflowX: "auto" }}>
              {adviceSection === "scope" ? (
                <ScopeOfAdviceForm factFind={factFind} updateFF={updateFF} />
              ) : adviceSection === "advice-models" ? (
                <StrategyForm factFind={adviceModel1 || factFind} baseFf={factFind} updateFF={updateAdvice} tab="models" />
              ) : adviceSection === "strategies" ? (
                <StrategyForm factFind={adviceModel1 || factFind} baseFf={factFind} updateFF={updateAdvice} tab="strategies" />
              ) : adviceSection === "entities" ? (
                <AdviceProductsEntitiesForm factFind={factFind} updateFF={updateFF} />
              ) : adviceSection === "retirement-products" ? (
                <TransactionsForm factFind={factFind} updateFF={updateFF} updateAdvice={updateAdvice} initialTab="retirement" />
              ) : adviceSection === "investment-products" ? (
                <TransactionsForm factFind={factFind} updateFF={updateFF} updateAdvice={updateAdvice} initialTab="investment" />
              ) : adviceSection === "product-replacement" ? (
                <ProductReplacementForm factFind={factFind} updateFF={updateFF} updateAdvice={updateAdvice} />
              ) : adviceSection === "transactions" ? (
                <TransactionsForm factFind={factFind} updateFF={updateFF} updateAdvice={updateAdvice} initialTab="buy" />
              ) : adviceSection === "portfolio" ? (
                <PortfolioForm factFind={factFind} updateFF={updateFF} />
              ) : adviceSection === "insurance-needs" ? (
                <AdviceInsuranceForm factFind={factFind} updateFF={updateFF} tab="needs" />
              ) : adviceSection === "insurance-policies" ? (
                <AdviceInsuranceForm factFind={factFind} updateFF={updateFF} tab="policies" />
              ) : adviceSection === "quick-recs" ? (
                <QuickRecsForm factFind={adviceModel1 || factFind} baseFf={factFind} updateFF={updateAdvice} />
              ) : adviceSection === "assumptions" ? (
                <AssumptionsForm factFind={factFind} updateFF={updateFF} />
              ) : adviceSection === "tax-super-planning" ? (
                <TaxSuperPlanningForm factFind={factFind} updateFF={updateFF} />
              ) : (
                /* Placeholder for remaining sections */
                <div style={{ border: "2px dashed var(--ps-border)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>
                    {ADVICE_SECTIONS.find(s => s.id === adviceSection)?.icon}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>
                    {ADVICE_SECTIONS.find(s => s.id === adviceSection)?.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ps-text-subtle)", maxWidth: 360, margin: "0 auto" }}>
                    This section will contain the {ADVICE_SECTIONS.find(s => s.id === adviceSection)?.label.toLowerCase()} configuration. Upload the Base44 page to populate.
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      background: "var(--ps-surface)",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      color: "var(--ps-text-primary)",
    }}>
      {/* Demo mode banner */}
      {/* Header Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 24px",
        borderBottom: "1px solid var(--ps-border)",
        background: "var(--ps-surface-alt)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {onBack ? (
            <button
              onClick={onBack}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                color: "#4F46E5", fontSize: 13, fontWeight: 600,
                background: "none", border: "none", cursor: "pointer",
                whiteSpace: "nowrap", padding: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#3730A3"}
              onMouseLeave={e => e.currentTarget.style.color = "#4F46E5"}
            >
              <span style={{ fontSize: 16 }}>&larr;</span> Back to Client
            </button>
          ) : (
            <a
              href={backToParaplannerUrl}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                color: "#4F46E5", fontSize: 13, fontWeight: 600,
                textDecoration: "none", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#3730A3"}
              onMouseLeave={e => e.currentTarget.style.color = "#4F46E5"}
            >
              <span style={{ fontSize: 16 }}>&larr;</span> AI Paraplanner
            </a>
          )}
          <div style={{ width: 1, height: 24, background: "var(--ps-border)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: "var(--ps-text-muted)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>
              Cashflow Model
            </span>
            {clientInfo && (
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ps-text-primary)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                {clientInfo.name || `${clientInfo.first_name || ''} ${clientInfo.last_name || ''}`.trim()}
              </span>
            )}
            {!clientInfo && (
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ps-text-primary)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                {[factFind?.client1?.first_name, factFind?.client2?.first_name]
                  .filter(Boolean).join(" & ")}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!isFactfindMode && (
            <>
              <label style={{ fontSize: 13, color: "var(--ps-text-muted)", fontWeight: 500 }}>Select Model</label>
              <select
                value={selectedModel}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedModel(val);
                  // Auto-initialise advice model if switching to it for first time
                  if (val === "advice1" && !adviceModel1) setAdviceModel1(JSON.parse(JSON.stringify(factFind)));
                  // If switching to base and current page is advice-only, redirect
                  if (val === "base") {
                    const config = NAV_STRUCTURE[activeTop];
                    if (config?.adviceOnly) {
                      setActiveTop("Summary of Results");
                      setActiveSub("Timeline");
                      setActiveSubSub("Financial Summary");
                    } else if (config?.adviceOnlySubTabs?.includes(activeSub)) {
                      setActiveSub(config.subTabs.find(s => !config.adviceOnlySubTabs.includes(s)) || config.subTabs[0]);
                    }
                  }
                }}
                style={{
                  padding: "6px 12px", borderRadius: 6,
                  border: selectedModel === "advice1" ? "2px solid #6366F1" : "1px solid var(--ps-border-input)",
                  fontSize: 13,
                  background: selectedModel === "advice1" ? "var(--ps-surface-indigo)" : "var(--ps-surface)",
                  color: "var(--ps-text-primary)", fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <option value="base">Base Plan (Existing)</option>
                <option value="advice1">Advice Model 1</option>
              </select>
              {selectedModel === "advice1" && (
                <button onClick={resetAdviceModel} style={{
                  padding: "6px 12px", borderRadius: 6,
                  border: "1px solid var(--ps-ring-red)", background: "var(--ps-surface-red)",
                  fontSize: 11, color: "var(--ps-red)", cursor: "pointer", fontWeight: 600,
                }}>Reset to Base</button>
              )}
            </>
          )}
          <button
            onClick={() => setDarkMode(d => !d)}
            style={{
              padding: "6px 10px", borderRadius: 6,
              border: "1px solid var(--ps-border-input)", background: "var(--ps-surface)",
              fontSize: 13, color: "var(--ps-text-secondary)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 34, height: 34,
            }}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <div style={{ width: 1, height: 24, background: "var(--ps-border)", margin: "0 2px" }} />
          {/* ── Co-pilot toggle ── */}
          <button onClick={() => setAssistantOpen(prev => !prev)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 14px",
            background: assistantOpen ? "#4F46E5" : "rgba(79,70,229,0.08)",
            border: "1.5px solid rgba(79,70,229,0.25)",
            borderRadius: 10,
            color: assistantOpen ? "#fff" : "#4F46E5",
            fontWeight: 700, fontSize: 13,
            cursor: "pointer",
            transition: "all 0.15s",
          }}>
            <span style={{ fontSize: 15 }}>{"\u2726"}</span>
            {assistantOpen ? "Close Co-pilot" : "Co-pilot"}
          </button>
          {/* ── Input tools ── */}
          <button
            onClick={() => { setFactFindOpen(!factFindOpen); if (!factFindOpen) { setAdviceOpen(false); setAdviceSection(null); } }}
            style={{
              padding: "6px 14px", borderRadius: 6,
              border: factFindOpen ? "1px solid #6366f1" : "1px solid var(--ps-border-input)",
              background: factFindOpen ? "var(--ps-surface-indigo)" : "var(--ps-surface)",
              fontSize: 12, color: factFindOpen ? "#4F46E5" : "var(--ps-text-secondary)",
              cursor: "pointer", fontWeight: 600,
              display: "flex", alignItems: "center", gap: 5,
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ fontSize: 14 }}>📋</span> Fact Find
          </button>
          {!isFactfindMode && (
            <button
              onClick={() => { setAdviceOpen(!adviceOpen); if (!adviceOpen) { setFactFindOpen(false); setFactFindSection(null); } }}
              style={{
                padding: "6px 14px", borderRadius: 6,
                border: adviceOpen ? "1px solid #0D9488" : "1px solid var(--ps-border-input)",
                background: adviceOpen ? "var(--ps-surface-teal)" : "var(--ps-surface)",
                fontSize: 12, color: adviceOpen ? "#0D9488" : "var(--ps-text-secondary)",
                cursor: "pointer", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 5,
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 14 }}>💡</span> Advice
            </button>
          )}
          {!isFactfindMode && (
            <>
              <div style={{ width: 1, height: 24, background: "var(--ps-border)", margin: "0 2px" }} />
              {/* ── Outputs ── */}
              <button
                onClick={() => {
                  // Create an immutable advice history snapshot before opening SOA builder
                  try {
                    const urlParams = new URLSearchParams(window.location.search);
                    const urlClientId = urlParams.get('clientId');
                    if (urlClientId && factFind) {
                      const c1Name = factFind.client1?.first_name || '';
                      const c1Last = factFind.client1?.last_name || '';
                      const modelName = [c1Name, c1Last].filter(Boolean).join(' ') || 'Cashflow Model';
                      adviceHistoryApi.create(urlClientId, {
                        recordType: 'cashflow_model',
                        title: modelName,
                        factFindSnapshot: JSON.stringify(factFind),
                      }).catch(err => console.error('[AdviceHistory] Failed to create Cashflow Model snapshot:', err));
                    }
                  } catch (err) {
                    console.error('[AdviceHistory] Error creating snapshot:', err);
                  }
                  setShowSOABuilder(true);
                }}
                style={{
                  padding: "6px 18px", borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
                  fontSize: 12, color: "#fff",
                  cursor: "pointer", fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 6,
                  boxShadow: "0 2px 8px rgba(5,150,105,0.35)",
                  letterSpacing: "0.01em",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: 14 }}>📄</span> Build SOA
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top-level navigation */}
      <div style={{
        display: "flex",
        gap: 0,
        padding: "0 20px",
        borderBottom: "1px solid var(--ps-border)",
        background: "var(--ps-surface-alt)",
        overflowX: "auto",
        flexShrink: 0,
        alignItems: "stretch",
      }}>
        {TOP_TABS.filter(tab => {
          const config = NAV_STRUCTURE[tab];
          if (config.adviceOnly && selectedModel === "base") return false;
          if (isFactfindMode && tab === "Advice Detail") return false;
          return true;
        }).map(tab => {
          const isActive = activeTop === tab;
          const config = NAV_STRUCTURE[tab];
          return (
            <button
              key={tab}
              onClick={() => handleTopChange(tab)}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                padding: "0 18px",
                height: 44,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                borderBottom: isActive ? "2px solid #4F46E5" : "2px solid transparent",
                color: isActive ? "#4F46E5" : "var(--ps-text-muted)",
                fontWeight: isActive ? 600 : 400,
                fontSize: 13,
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            >
              <span style={{
                fontSize: 13,
                opacity: isActive ? 1 : 0.55,
                lineHeight: 1,
              }}>{config.icon}</span>
              <span>{tab}</span>
            </button>
          );
        })}
      </div>

      {/* Second-level tabs */}
      {subTabs.length > 0 && (
        <div style={{
          display: "flex",
          gap: 0,
          padding: "0 24px",
          borderBottom: "1px solid var(--ps-border)",
          background: "var(--ps-surface)",
          flexShrink: 0,
        }}>
          {subTabs.map(tab => {
            const isActive = activeSub === tab;
            // Check if this sub-tab is a new advice entity (SMSF funds appear as sub-tabs under Entities)
            const isNewEntity = activeTop === "Entities" && (engineData.smsfs || []).some(s => s.smsf_name === tab && (s.id || "").startsWith("adv_"));
            return (
              <button
                key={tab}
                onClick={() => handleSubChange(tab)}
                style={{
                  padding: "12px 20px 10px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  borderBottom: isActive ? "2px solid #4f46e5" : "2px solid transparent",
                  color: isActive ? "#4f46e5" : "var(--ps-text-muted)",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 14,
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {tabDisplayName(tab)}
                {isNewEntity && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--ps-green)", background: "var(--ps-surface-emerald)", padding: "1px 5px", borderRadius: 4, border: "1px solid var(--ps-ring-green)", letterSpacing: "0.03em" }}>NEW</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Third-level tabs */}
      {subSubTabs.length > 0 && (
        <div style={{
          display: "flex",
          gap: 0,
          padding: "0 24px",
          borderBottom: "1px solid var(--ps-border-input)",
          background: "var(--ps-surface)",
          flexShrink: 0,
        }}>
          {subSubTabs.map(tab => {
            const isActive = activeSubSub === tab;
            const isTableTab = tab === "Health Check" || tab === "Detail";
            return (
              <button
                key={tab}
                onClick={() => setActiveSubSub(tab)}
                style={{
                  padding: "10px 18px 8px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  borderBottom: isActive ? "2px solid #6366f1" : "2px solid transparent",
                  color: isActive ? "#4f46e5" : "var(--ps-text-subtle)",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {isTableTab && <span style={{ fontSize: 11 }}>☷</span>}
                {richTabMap[tab] ? (
                  <>
                    {richTabMap[tab].product && <span>{richTabMap[tab].product}</span>}
                    {richTabMap[tab].owner && <EntityBadge name={richTabMap[tab].owner} size="sm" />}
                    {richTabMap[tab].isNew && <span style={{ marginLeft: 4, fontSize: 9, fontWeight: 700, color: "var(--ps-green)", background: "var(--ps-surface-emerald)", padding: "1px 5px", borderRadius: 4, border: "1px solid var(--ps-ring-green)", letterSpacing: "0.03em" }}>NEW</span>}
                  </>
                ) : tabDisplayName(tab)}
              </button>
            );
          })}
        </div>
      )}

      {/* Content area — flex row with optional co-pilot */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <div style={{ flex: assistantOpen ? "0 0 70%" : "0 0 100%", overflowY: "auto", overflowX: "auto", transition: "flex 0.2s ease" }}>
      <div style={{ padding: "16px 32px" }}>
        {/* Breadcrumb + Edit on same row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 6,
        }}>
          <div style={{
            fontSize: 13, color: "var(--ps-text-subtle)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ color: "var(--ps-text-muted)", fontWeight: 500 }}>{activeTop}</span>
            {activeSub && <><span>›</span><span style={{ color: "var(--ps-text-muted)" }}>{tabDisplayName(activeSub)}</span></>}
            {activeSubSub && <><span>›</span><span style={{ color: "#4f46e5", fontWeight: 500 }}>{tabDisplayName(activeSubSub)}</span></>}
          </div>
          {isFinancialSummary && (
            <button
              onClick={() => setShowSummaryDashboard(v => !v)}
              style={{
                padding: "5px 14px", borderRadius: 6,
                border: "1px solid var(--ps-border)",
                background: showSummaryDashboard ? "var(--ps-surface-alt)" : "var(--ps-surface-indigo)",
                color: showSummaryDashboard ? "var(--ps-text-muted)" : "#4F46E5",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              {showSummaryDashboard ? "▼ Hide" : "▶ Show"} Dashboard & Charts
            </button>
          )}
        </div>

        {/* Render content */}
        {isDefensiveAssets ? (
          <AssetChartPage holdings={defensiveHoldings} years={PROJ_YEARS} assetTypes={DEFENSIVE_ASSET_TYPES} title="Defensive Assets — End Value by Holding" />
        ) : isGrowthAssets ? (
          <AssetChartPage holdings={growthHoldings} years={PROJ_YEARS} assetTypes={GROWTH_ASSET_TYPES} title="Growth Assets — End Value by Holding" />
        ) : isPropertyAssets ? (
          <AssetChartPage holdings={propertyHoldings} years={PROJ_YEARS} assetTypes={PROPERTY_TYPES} title="Property Assets — End Value by Holding" />
        ) : isLifestyleAssets ? (
          <AssetChartPage holdings={lifestyleHoldings} years={PROJ_YEARS} assetTypes={LIFESTYLE_ASSET_TYPES} title="Lifestyle Assets — End Value by Holding" />
        ) : isMilestones ? (
          <MilestonesDashboard dynamicMilestones={dynamicMilestones} />
        ) : isNetEquity ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AssetsLiabilitiesChart />
            <SectionTable
              data={{
                ...financialSummaryData,
                sections: (financialSummaryData?.sections || []).filter(s => s.id === "net-worth" || s.id === "debts"),
              }}
              onNavigate={navigateTo}
            />
          </div>
        ) : isNetEquityProperty ? (
          <PropertyChart />
        ) : isNetEquityDebt ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <DebtChartPage data={investmentLoansData} title="Investment Loans — Outstanding Balance" onCellEdit={isAdviceModel ? (ref, val, type, yearIdx) => type === "io" ? setDebtIOOverrides(prev => ({ ...prev, [ref]: { ...(prev[ref] || {}), [yearIdx]: val } })) : setDebtFreqOverrides(prev => ({...prev, [ref]: val})) : undefined} />
            <DebtChartPage data={homeLoanData} title="Home Loan — Outstanding Balance" onCellEdit={isAdviceModel ? (ref, val, type, yearIdx) => type === "io" ? setDebtIOOverrides(prev => ({ ...prev, [ref]: { ...(prev[ref] || {}), [yearIdx]: val } })) : setDebtFreqOverrides(prev => ({...prev, [ref]: val})) : undefined} />
          </div>
        ) : isCapitalDashboard ? (
          <CapitalDashboard dynamicChartData={dynamicAssetTypeChartData} />
        ) : isCashflowDashboard ? (
          <CashflowDashboard txnChartData={txnChartData} />
        ) : isRetirementDashboard ? (
          <RetirementDashboard
            meta={summaryMeta}
            superProj={superProj}
            pensionFunds={engineData.pensions || []}
            contribData={(() => {
              const c1SG = taxClient1Data.sections.find(s => s.id === "tax-deductions")?.rows.find(r => r.label === "Concessional Contributions")?.values || [];
              const c2SG = taxClient2Data.sections.find(s => s.id === "tax-deductions")?.rows.find(r => r.label === "Concessional Contributions")?.values || [];
              return { c1Total: c1SG.reduce((s,v) => s+(v||0), 0), c2Total: c2SG.reduce((s,v) => s+(v||0), 0) };
            })()}
          />
        ) : isHealthCheck ? (
          <HealthCheckTable />
        ) : isAdviceSummary ? (
          <AdviceSummaryTable navigateTo={navigateTo} />
        ) : isPortfolio ? (
          <PortfolioDashboard />
        ) : isBenefitOfAdvice ? (
          <BenefitOfAdviceDashboard />
        ) : isProductProjection ? (
          <ProductProjectionTable />
        ) : isPortfolioTransactions ? (
          <PortfolioTransactionsTable />
        ) : isObjectives ? (
          <ObjectivesDashboard />
        ) : isRecommendations ? (
          <RecommendationsTable />
        ) : isScope ? (
          <ScopeDashboard />
        ) : isSavings ? (
          <CashflowSavingsPage savingsData={savingsData} cashflowChartData={cashflowChartData} />
        ) : isCGTClient1 ? (
          <CGTPage data={c1CGT.cgtData} chartData={c1CGT.cgtChartData} clientName={c1Display} />
        ) : isCGTClient2 ? (
          <CGTPage data={c2CGT.cgtData} chartData={c2CGT.cgtChartData} clientName={c2Display} />
        ) : matchedCGTTrustIdx >= 0 ? (
          <CGTPage
            data={trustCGTList[matchedCGTTrustIdx].cgtData}
            chartData={trustCGTList[matchedCGTTrustIdx].cgtChartData}
            clientName={trustCGTList[matchedCGTTrustIdx].name}
            isTrust={true}
            trustIdx={matchedCGTTrustIdx}
            beneficiaries={(engineData.trusts || [])[matchedCGTTrustIdx]?.beneficiaries || []}
            streamingConfig={engineData.advice_request?.cgt_streaming?.[`trust_${matchedCGTTrustIdx}`]}
            onUpdateStreaming={(cfg) => {
              const current = engineData.advice_request?.cgt_streaming || {};
              activeUpdate("advice_request.cgt_streaming", { ...current, [`trust_${matchedCGTTrustIdx}`]: cfg });
            }}
          />
        ) : matchedCGTCompanyIdx >= 0 ? (
          <CGTPage data={companyCGTList[matchedCGTCompanyIdx].cgtData} chartData={companyCGTList[matchedCGTCompanyIdx].cgtChartData} clientName={companyCGTList[matchedCGTCompanyIdx].name} />
        ) : matchedCGTSmsfIdx >= 0 ? (
          <CGTPage data={smsfCGTList[matchedCGTSmsfIdx].cgtData} chartData={smsfCGTList[matchedCGTSmsfIdx].cgtChartData} clientName={smsfCGTList[matchedCGTSmsfIdx].name} />
        ) : isTaxClient1 ? (
          <TaxSchedulePage data={taxClient1Data} chartData={taxClient1ChartData} clientName={c1Display} />
        ) : isTaxClient2 ? (
          <TaxSchedulePage data={taxClient2Data} chartData={taxClient2ChartData} clientName={c2Display} />
        ) : isUCGTClient1 ? (
          <UnrealisedCGTPage data={c1CGT.ucgtData} chartData={c1CGT.ucgtChartData} clientName={c1Display} />
        ) : isUCGTClient2 ? (
          <UnrealisedCGTPage data={c2CGT.ucgtData} chartData={c2CGT.ucgtChartData} clientName={c2Display} />
        ) : matchedUCGTTrustIdx >= 0 ? (
          <UnrealisedCGTPage data={trustCGTList[matchedUCGTTrustIdx].ucgtData} chartData={trustCGTList[matchedUCGTTrustIdx].ucgtChartData} clientName={trustCGTList[matchedUCGTTrustIdx].name} />
        ) : matchedUCGTCompanyIdx >= 0 ? (
          <UnrealisedCGTPage data={companyCGTList[matchedUCGTCompanyIdx].ucgtData} chartData={companyCGTList[matchedUCGTCompanyIdx].ucgtChartData} clientName={companyCGTList[matchedUCGTCompanyIdx].name} />
        ) : matchedUCGTSmsfIdx >= 0 ? (
          <UnrealisedCGTPage data={smsfCGTList[matchedUCGTSmsfIdx].ucgtData} chartData={smsfCGTList[matchedUCGTSmsfIdx].ucgtChartData} clientName={smsfCGTList[matchedUCGTSmsfIdx].name} />
        ) : matchedCompanyIdx >= 0 && companyDataList[matchedCompanyIdx] ? (
          <div>
            {companyTabs[matchedCompanyIdx]?.isNew && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "var(--ps-surface-emerald)", border: "1px solid var(--ps-ring-green)", borderRadius: 8, marginBottom: 12, fontSize: 12, fontWeight: 600, color: "var(--ps-green)" }}>
                ✨ New — Added via Advice Model
              </div>
            )}
            <CompanyPage data={companyDataList[matchedCompanyIdx].data} chartData={companyDataList[matchedCompanyIdx].chartData} companyName={companyDataList[matchedCompanyIdx].name} companyIdx={matchedCompanyIdx} factFind={factFind} updateFF={updateFF} />
          </div>
        ) : matchedSmsfMembers ? (
          <SMSFPage data={matchedSmsfMembers.data} accountName={matchedSmsfMembers.name} entityName="Members" memberPctData={matchedSmsfMembers.pctChartData} />
        ) : matchedSmsfSegAccount ? (
          <SMSFPage data={matchedSmsfSegAccount.data} accountName={matchedSmsfSegAccount.name} entityName={matchedSmsfSegAccount.name} segChartData={matchedSmsfSegAccount.segChartData} />
        ) : matchedSmsfFund ? (
          <SMSFPage data={matchedSmsfFund.data} accountName={matchedSmsfFund.name} entityName={matchedSmsfFund.name} memberChartData={matchedSmsfFund.memberChartData} />
        ) : matchedSmsfIdx >= 0 && smsfDataList[matchedSmsfIdx] ? (
          <div>
            {smsfTabs.find(t => t.key === activeSubSub)?.isNew && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "var(--ps-surface-emerald)", border: "1px solid var(--ps-ring-green)", borderRadius: 8, marginBottom: 12, fontSize: 12, fontWeight: 600, color: "var(--ps-green)" }}>
                ✨ New — Added via Advice Model
              </div>
            )}
            <SMSFPage data={smsfDataList[matchedSmsfIdx].data} accountName={smsfDataList[matchedSmsfIdx].name} entityName={smsfDataList[matchedSmsfIdx].name} memberChartData={smsfDataList[matchedSmsfIdx].memberChartData} />
          </div>
        ) : isInvestmentLoans ? (
          <DebtChartPage data={investmentLoansData} title="Investment Loans — Outstanding Balance" onCellEdit={isAdviceModel ? (ref, val, type, yearIdx) => type === "io" ? setDebtIOOverrides(prev => ({ ...prev, [ref]: { ...(prev[ref] || {}), [yearIdx]: val } })) : setDebtFreqOverrides(prev => ({...prev, [ref]: val})) : undefined} />
        ) : isHomeLoan ? (
          <DebtChartPage data={homeLoanData} title="Home Loan — Outstanding Balance" onCellEdit={isAdviceModel ? (ref, val, type, yearIdx) => type === "io" ? setDebtIOOverrides(prev => ({ ...prev, [ref]: { ...(prev[ref] || {}), [yearIdx]: val } })) : setDebtFreqOverrides(prev => ({...prev, [ref]: val})) : undefined} />
        ) : isOtherDebts ? (
          <DebtChartPage data={otherDebtsData} title="Other Debts — Outstanding Balance" onCellEdit={isAdviceModel ? (ref, val, type, yearIdx) => type === "io" ? setDebtIOOverrides(prev => ({ ...prev, [ref]: { ...(prev[ref] || {}), [yearIdx]: val } })) : setDebtFreqOverrides(prev => ({...prev, [ref]: val})) : undefined} />
        ) : matchedTrustIdx >= 0 && trustDataList[matchedTrustIdx] ? (
          <div>
            {trustTabs[matchedTrustIdx]?.isNew && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "var(--ps-surface-emerald)", border: "1px solid var(--ps-ring-green)", borderRadius: 8, marginBottom: 12, fontSize: 12, fontWeight: 600, color: "var(--ps-green)" }}>
                ✨ New — Added via Advice Model
              </div>
            )}
            <TrustPage data={trustDataList[matchedTrustIdx].data} chartData={trustDataList[matchedTrustIdx].chartData} trustName={trustDataList[matchedTrustIdx].name} trustEntity={trustDataList[matchedTrustIdx].name} />
            <TrustDistOverride
              data={trustDataList[matchedTrustIdx].data}
              beneficiaries={(engineData.trusts || [])[matchedTrustIdx]?.beneficiaries || []}
              config={engineData.advice_request?.trust_dist_override?.[`trust_${matchedTrustIdx}`]}
              onUpdate={(cfg) => {
                const current = engineData.advice_request?.trust_dist_override || {};
                activeUpdate("advice_request.trust_dist_override", { ...current, [`trust_${matchedTrustIdx}`]: cfg });
              }}
            />
          </div>
        ) : isRebalancing ? (
          <RebalancingTable model={(() => {
            const models = engineData.advice_request?.strategy?.models || [];
            return models[0] || null;
          })()} />
        ) : isEligibility1 ? (
          <EligibilityTable data={(() => {
            const dob = engineData.client1?.date_of_birth;
            const gender = engineData.client1?.gender;
            const empStatus = engineData.client1?.employment_status;
            const alreadyRetired = empStatus === '7';
            const corMet = engineData.client1?.condition_of_release === true || engineData.client1?.condition_of_release === 'yes';
            const hasPrincipalResidence = (engineData.assets || []).some(a => a.a_type === '1');
            const receivingAllowance = engineData.client1?.centrelink_benefits === '1' && engineData.client1?.benefit_type === '4';
            const retAge = parseFloat(engineData.advice_reason?.quick?.client1?.ret_age) || 67;
            const maritalStatus = engineData.client1?.marital_status;
            const startedAsCouple = maritalStatus === '1' || maritalStatus === '2';
            const partnerDob = engineData.client2?.date_of_birth;
            const partnerGender = engineData.client2?.gender;
            const calcAge = (d) => { if (!d) return null; const bd = new Date(d), n = new Date(currentFY, 6, 1); let a = n.getFullYear() - bd.getFullYear(); if (n.getMonth() < bd.getMonth() || (n.getMonth() === bd.getMonth() && n.getDate() < bd.getDate())) a--; return a; };
            const startAge = calcAge(dob) ?? 60;
            const partnerStartAge = calcAge(partnerDob);
            const presAge = (() => { if (!dob) return 60; const d = new Date(dob); const y = d.getFullYear(), m = d.getMonth()+1; if (y < 1960 || (y===1960 && m<=6)) return 55; if (y<1961) return 56; if (y<1963) return 57; if (y<1964) return 58; if (y<1965) return 59; return 60; })();
            const N = Math.max(17, Math.ceil(altEx(startAge, gender)) + 1);
            const ages = Array.from({length: N}, (_, i) => startAge + i);
            const partnerAlive = (a) => {
              if (!startedAsCouple || partnerStartAge === null) return false;
              const pa = partnerStartAge + (a - startAge);
              return altSurvivalPct(partnerStartAge, pa, partnerGender) > 20;
            };
            // Preservation met at age a: pres age reached AND (already retired, OR age >= 67, OR COR manually flagged)
            const presMet = (a) => a >= presAge && (alreadyRetired || corMet || a >= 67 || a >= retAge);
            // TTR eligible: pres age reached but preservation conditions NOT yet fully met (still working, under 67)
            const ttrElig = (a) => a >= presAge && !presMet(a);
            return [
              { label: 'Age at start of year', values: ages, type: 'number' },
              { label: 'Life expectancy', values: ages.map(a => Math.round(altEx(a, gender)*10)/10), type: 'number' },
              { label: 'Probability still alive', values: ages.map(a => altSurvivalPct(startAge, a, gender) + '%'), type: 'text' },
              { label: 'Alive', values: ages.map(a => altSurvivalPct(startAge, a, gender) > 5 ? 1 : 0), type: 'bool' },
              { label: 'Single', values: ages.map(a => startedAsCouple && partnerAlive(a) ? 0 : 1), type: 'bool' },
              { label: 'Couple', values: ages.map(a => startedAsCouple && partnerAlive(a) ? 1 : 0), type: 'bool' },
              { label: 'Still working', values: ages.map(a => alreadyRetired ? 0 : a < retAge ? 1 : 0), type: 'bool' },
              { label: 'Under 60', values: ages.map(a => a < 60 ? 1 : 0), type: 'bool' },
              { label: 'Over 60', values: ages.map(a => a >= 60 ? 1 : 0), type: 'bool' },
              { label: 'Preservation age', values: ages.map(() => presAge), type: 'number' },
              { label: 'Preservation met', values: ages.map(a => presMet(a) ? 1 : 0), type: 'bool' },
              { label: 'Eligible for TTR', values: ages.map(a => ttrElig(a) ? 1 : 0), type: 'bool' },
              { label: 'Eligible for age pension', values: ages.map(a => a >= 67 ? 1 : 0), type: 'bool' },
              { label: 'Eligible for full pension', values: ages.map(a => presMet(a) ? 1 : 0), type: 'bool' },
              { label: 'Receiving age pension', values: ages.map(() => 0), type: 'bool' },
              { label: 'Eligible for allowance', values: ages.map(a => receivingAllowance && a < 67 ? 1 : 0), type: 'bool' },
              { label: 'Eligible for tax free annuity', values: ages.map(a => a >= 60 ? 1 : 0), type: 'bool' },
              { label: 'SGC Eligible', values: ages.map(a => !alreadyRetired && a < 75 && a < retAge ? 1 : 0), type: 'bool' },
              { label: 'Eligible to make concessional contributions', values: ages.map(a => a < 75 ? 1 : 0), type: 'bool' },
              { label: 'Eligible to make government co-contribution', values: ages.map(a => a < 71 ? 1 : 0), type: 'bool' },
              { label: 'Eligible to make non-concessional contribution', values: ages.map(a => a < 75 ? 1 : 0), type: 'bool' },
              { label: 'Eligible to make spouse contribution', values: ages.map(a => startedAsCouple && partnerAlive(a) && a < 75 ? 1 : 0), type: 'bool' },
              { label: 'Living in principal residence', values: ages.map(() => hasPrincipalResidence ? 1 : 0), type: 'bool' },
              { label: 'Renting out principal residence', values: ages.map(() => 0), type: 'bool' },
              { label: 'Renting', values: ages.map(() => hasPrincipalResidence ? 0 : 1), type: 'bool' },
            ];
          })()} />
        ) : isEligibility2 ? (
          <EligibilityTable data={(() => {
            const dob = engineData.client2?.date_of_birth;
            const gender = engineData.client2?.gender;
            const empStatus = engineData.client2?.employment_status;
            const alreadyRetired = empStatus === '7';
            const corMet = engineData.client2?.condition_of_release === true || engineData.client2?.condition_of_release === 'yes';
            const hasPrincipalResidence = (engineData.assets || []).some(a => a.a_type === '1');
            const receivingAllowance = engineData.client2?.centrelink_benefits === '1' && engineData.client2?.benefit_type === '4';
            const retAge = parseFloat(engineData.advice_reason?.quick?.client2?.ret_age) || 67;
            const maritalStatus = engineData.client2?.marital_status;
            const startedAsCouple = maritalStatus === '1' || maritalStatus === '2';
            const partnerDob = engineData.client1?.date_of_birth;
            const partnerGender = engineData.client1?.gender;
            const calcAge = (d) => { if (!d) return null; const bd = new Date(d), n = new Date(currentFY, 6, 1); let a = n.getFullYear() - bd.getFullYear(); if (n.getMonth() < bd.getMonth() || (n.getMonth() === bd.getMonth() && n.getDate() < bd.getDate())) a--; return a; };
            const startAge = calcAge(dob) ?? 56;
            const partnerStartAge = calcAge(partnerDob);
            const presAge = (() => { if (!dob) return 60; const d = new Date(dob); const y = d.getFullYear(), m = d.getMonth()+1; if (y < 1960 || (y===1960 && m<=6)) return 55; if (y<1961) return 56; if (y<1963) return 57; if (y<1964) return 58; if (y<1965) return 59; return 60; })();
            const N = Math.max(17, Math.ceil(altEx(startAge, gender)) + 1);
            const ages = Array.from({length: N}, (_, i) => startAge + i);
            const partnerAlive = (a) => {
              if (!startedAsCouple || partnerStartAge === null) return false;
              const pa = partnerStartAge + (a - startAge);
              return altSurvivalPct(partnerStartAge, pa, partnerGender) > 20;
            };
            // Preservation met at age a: pres age reached AND (already retired, OR age >= 67, OR COR manually flagged)
            const presMet = (a) => a >= presAge && (alreadyRetired || corMet || a >= 67 || a >= retAge);
            // TTR eligible: pres age reached but preservation conditions NOT yet fully met (still working, under 67)
            const ttrElig = (a) => a >= presAge && !presMet(a);
            return [
              { label: 'Age at start of year', values: ages, type: 'number' },
              { label: 'Life expectancy', values: ages.map(a => Math.round(altEx(a, gender)*10)/10), type: 'number' },
              { label: 'Probability still alive', values: ages.map(a => altSurvivalPct(startAge, a, gender) + '%'), type: 'text' },
              { label: 'Alive', values: ages.map(a => altSurvivalPct(startAge, a, gender) > 5 ? 1 : 0), type: 'bool' },
              { label: 'Single', values: ages.map(a => startedAsCouple && partnerAlive(a) ? 0 : 1), type: 'bool' },
              { label: 'Couple', values: ages.map(a => startedAsCouple && partnerAlive(a) ? 1 : 0), type: 'bool' },
              { label: 'Still working', values: ages.map(a => alreadyRetired ? 0 : a < retAge ? 1 : 0), type: 'bool' },
              { label: 'Under 60', values: ages.map(a => a < 60 ? 1 : 0), type: 'bool' },
              { label: 'Over 60', values: ages.map(a => a >= 60 ? 1 : 0), type: 'bool' },
              { label: 'Preservation age', values: ages.map(() => presAge), type: 'number' },
              { label: 'Preservation met', values: ages.map(a => presMet(a) ? 1 : 0), type: 'bool' },
              { label: 'Eligible for TTR', values: ages.map(a => ttrElig(a) ? 1 : 0), type: 'bool' },
              { label: 'Eligible for age pension', values: ages.map(a => a >= 67 ? 1 : 0), type: 'bool' },
              { label: 'Eligible for full pension', values: ages.map(a => presMet(a) ? 1 : 0), type: 'bool' },
              { label: 'Receiving age pension', values: ages.map(() => 0), type: 'bool' },
              { label: 'Eligible for allowance', values: ages.map(a => receivingAllowance && a < 67 ? 1 : 0), type: 'bool' },
              { label: 'Eligible for tax free annuity', values: ages.map(a => a >= 60 ? 1 : 0), type: 'bool' },
              { label: 'SGC Eligible', values: ages.map(a => !alreadyRetired && a < 75 && a < retAge ? 1 : 0), type: 'bool' },
              { label: 'Eligible to make concessional contributions', values: ages.map(a => a < 75 ? 1 : 0), type: 'bool' },
              { label: 'Eligible to make government co-contribution', values: ages.map(a => a < 71 ? 1 : 0), type: 'bool' },
              { label: 'Eligible to make non-concessional contribution', values: ages.map(a => a < 75 ? 1 : 0), type: 'bool' },
              { label: 'Eligible to make spouse contribution', values: ages.map(a => startedAsCouple && partnerAlive(a) && a < 75 ? 1 : 0), type: 'bool' },
              { label: 'Living in principal residence', values: ages.map(() => hasPrincipalResidence ? 1 : 0), type: 'bool' },
              { label: 'Renting out principal residence', values: ages.map(() => 0), type: 'bool' },
              { label: 'Renting', values: ages.map(() => hasPrincipalResidence ? 0 : 1), type: 'bool' },
            ];
          })()} />
        ) : isAssumptionsSuper1 ? (
          <SuperAssumptionsTable data={(() => {
            const ck = "client1";
            const pensions = engineData.pensions || [];
            const TBC = 1900000;
            const startAge_sa = engineData[ck]?.date_of_birth ? (() => { const d = new Date(engineData[ck].date_of_birth), n = new Date(currentFY, 6, 1); let a = n.getFullYear() - d.getFullYear(); if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--; return a; })() : 60;
            const N_SA = Math.max(17, Math.ceil(altEx(startAge_sa, engineData[ck]?.gender)) + 1);
            // Regular ABP pensions (not TTR) — rollins
            const tbcUsed = new Array(N_SA).fill(0);
            pensions.forEach((p, pi) => {
              if ((p.pension_type || "account-based") === "ttr") return;
              if (p.owner !== ck) return;
              if (!penRollIn?.[pi]) return;
              for (let y = 0; y < N_SA; y++) tbcUsed[y] += (penRollIn[pi][y] || 0);
            });
            // TTR→ABP conversions — balance at conversion year counts against TBC
            allPensionData.forEach(pd => {
              if (!pd?.isTTR || pd.owner !== ck) return;
              for (let y = 0; y < N_SA; y++) tbcUsed[y] += (pd.ttrConversionTBC?.[y] || 0);
            });
            // SMSF pension accounts — opening balance year 0, then SOY inflows in subsequent years
            smsfDataList.forEach(fund => {
              if (!fund?.memberData) return;
              fund.memberData.forEach((m, mi) => {
                if (m.taxEnv !== "pension") return;
                const acc = fund.accounts?.[mi];
                if (!acc || acc.owner !== ck) return;
                tbcUsed[0] += m.startBal || 0;
                for (let y = 1; y < N_SA; y++) tbcUsed[y] += (fund.mSOYInflows?.[mi]?.[y] || 0);
              });
            });
            let runningTBC = 0;
            const tbcUsedCum = tbcUsed.map(v => { runningTBC += v; return runningTBC; });
            const tbcRemaining = tbcUsedCum.map(u => Math.max(0, TBC - u));
            const tbcExceeded = tbcUsedCum.map(u => u > TBC ? 1 : 0);
            const startAge = startAge_sa;
            const ages = Array.from({length: N_SA}, (_, i) => startAge + i);
            return [
              { label: "Concessional contributions cap", values: Array(N_SA).fill(30000), type: "number" },
              { label: "Non-concessional contributions cap", values: Array(N_SA).fill(120000), type: "number" },
              { label: "Transfer balance cap", values: Array(N_SA).fill(TBC), type: "number" },
              { label: "TBC used", values: tbcUsedCum, type: "number" },
              { label: "TBC remaining", values: tbcRemaining, type: "number" },
              { label: "TBC exceeded", values: tbcExceeded, type: "bool" },
              { label: "Minimum pension drawdown rate", values: ages.map(a => a < 65 ? "4%" : a < 75 ? "5%" : a < 80 ? "6%" : a < 85 ? "7%" : a < 90 ? "9%" : "11%"), type: "text" },
              { label: "Super guarantee rate", values: Array(N_SA).fill("12%"), type: "text" },
              { label: "Maximum super guarantee salary", values: Array(N_SA).fill(245680), type: "number" },
              { label: "Government co-contribution max", values: Array(N_SA).fill(500), type: "number" },
              { label: "Low income super tax offset", values: Array(N_SA).fill(500), type: "number" },
              { label: "Div 293 threshold", values: Array(N_SA).fill(250000), type: "number" },
            ];
          })()} />
        ) : isAssumptionsSuper2 ? (
          <SuperAssumptionsTable data={(() => {
            const ck = "client2";
            const pensions = engineData.pensions || [];
            const TBC = 1900000;
            const startAge_sa = engineData[ck]?.date_of_birth ? (() => { const d = new Date(engineData[ck].date_of_birth), n = new Date(currentFY, 6, 1); let a = n.getFullYear() - d.getFullYear(); if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--; return a; })() : 56;
            const N_SA = Math.max(17, Math.ceil(altEx(startAge_sa, engineData[ck]?.gender)) + 1);
            const tbcUsed = new Array(N_SA).fill(0);
            // Regular ABP pensions (not TTR) — rollins
            pensions.forEach((p, pi) => {
              if ((p.pension_type || "account-based") === "ttr") return;
              if (p.owner !== ck) return;
              if (!penRollIn?.[pi]) return;
              for (let y = 0; y < N_SA; y++) tbcUsed[y] += (penRollIn[pi][y] || 0);
            });
            // TTR→ABP conversions — balance at conversion year counts against TBC
            allPensionData.forEach(pd => {
              if (!pd?.isTTR || pd.owner !== ck) return;
              for (let y = 0; y < N_SA; y++) tbcUsed[y] += (pd.ttrConversionTBC?.[y] || 0);
            });
            // SMSF pension accounts — opening balance in year 0, then SOY inflows to pension accounts
            smsfDataList.forEach(fund => {
              if (!fund?.memberData) return;
              fund.memberData.forEach((m, mi) => {
                if (m.taxEnv !== 'pension') return;
                const acc = fund.accounts?.[mi];
                if (!acc || acc.owner !== ck) return;
                if (tbcUsed[0] !== undefined) tbcUsed[0] += m.startBal || 0;
                for (let y = 1; y < N_SA; y++) tbcUsed[y] += (fund.mSOYInflows?.[mi]?.[y] || 0);
              });
            });
            let runningTBC = 0;
            const tbcUsedCum = tbcUsed.map(v => { runningTBC += v; return runningTBC; });
            const tbcRemaining = tbcUsedCum.map(u => Math.max(0, TBC - u));
            const tbcExceeded = tbcUsedCum.map(u => u > TBC ? 1 : 0);
            const startAge = startAge_sa;
            const ages = Array.from({length: N_SA}, (_, i) => startAge + i);
            return [
              { label: "Concessional contributions cap", values: Array(N_SA).fill(30000), type: "number" },
              { label: "Non-concessional contributions cap", values: Array(N_SA).fill(120000), type: "number" },
              { label: "Transfer balance cap", values: Array(N_SA).fill(TBC), type: "number" },
              { label: "TBC used", values: tbcUsedCum, type: "number" },
              { label: "TBC remaining", values: tbcRemaining, type: "number" },
              { label: "TBC exceeded", values: tbcExceeded, type: "bool" },
              { label: "Minimum pension drawdown rate", values: ages.map(a => a < 65 ? "4%" : a < 75 ? "5%" : a < 80 ? "6%" : a < 85 ? "7%" : a < 90 ? "9%" : "11%"), type: "text" },
              { label: "Super guarantee rate", values: Array(N_SA).fill("12%"), type: "text" },
              { label: "Maximum super guarantee salary", values: Array(N_SA).fill(245680), type: "number" },
              { label: "Government co-contribution max", values: Array(N_SA).fill(500), type: "number" },
              { label: "Low income super tax offset", values: Array(N_SA).fill(500), type: "number" },
              { label: "Div 293 threshold", values: Array(N_SA).fill(250000), type: "number" },
            ];
          })()} />
        ) : isAgedCare ? (
          <AgedCarePage
            data={activeSubSub === "Client 2" || activeSubSub === c2Short || activeSubSub === c2Display ? agedCareC2 : agedCareC1}
            shortYears={shortYears}
            projYears={PROJ_YEARS}
            onUpdate={(field, value) => {
              const acData = activeSubSub === "Client 2" || activeSubSub === c2Short || activeSubSub === c2Display ? agedCareC2 : agedCareC1;
              if (!acData) return;
              const strats = engineData.advice_request?.strategy?.strategies || [];
              const idx = strats.findIndex(s => s.strategy_id === "57" && (s.owner_id === acData.clientKey || s.owner_id === "joint"));
              if (idx < 0) return;
              const updated = [...strats];
              updated[idx] = { ...updated[idx], [field]: value };
              activeUpdate("advice_request.strategy.strategies", updated);
            }}
          />
        ) : isSS ? (
          <SocialSecurityTable ssData={ssData} />
        ) : isModelComparison ? (
          <ModelComparisonDashboard />
        ) : isModelComparisonDetail ? (
          <ModelComparisonDetail />
        ) : isInsuranceClient ? (
          <InsuranceProjectionPage clientKey="client" />
        ) : isInsurancePartner ? (
          <InsuranceProjectionPage clientKey="partner" />
        ) : isPremiumCostClient ? (
          <InsurancePremiumProjection personKey="client1" factFind={engineData} updateFF={activeUpdate} />
        ) : isPremiumCostPartner ? (
          <InsurancePremiumProjection personKey="client2" factFind={engineData} updateFF={activeUpdate} />
        ) : isWrap1 ? (
          <WrapProjectionPage />
        ) : isSuper1 ? (
          <SuperProductPage data={super1Data || SUPER1_DATA} fundIdx={0} factFind={engineData} updateFF={activeUpdate} onToggleIndex={handleSuperCpiToggle} />
        ) : isSuper2 ? (
          <SuperProductPage data={super2Data || SUPER1_DATA} fundIdx={1} factFind={engineData} updateFF={activeUpdate} onToggleIndex={handleSuperCpiToggle} />
        ) : matchedSuperIdx > 1 && allSuperData[matchedSuperIdx] ? (
          <SuperProductPage data={allSuperData[matchedSuperIdx]} fundIdx={matchedSuperIdx} factFind={engineData} updateFF={activeUpdate} onToggleIndex={handleSuperCpiToggle} />
        ) : isPension1 ? (
          <PensionProductPage data={pension1Data || PENSION1_DATA} />
        ) : isPension2 ? (
          <PensionProductPage data={pension2Data || PENSION1_DATA} />
        ) : matchedPensionIdx > 1 && allPensionData[matchedPensionIdx] ? (
          <PensionProductPage data={allPensionData[matchedPensionIdx]} />
        ) : matchedBondIdx >= 0 && bondDataList[matchedBondIdx] ? (
          <SMSFPage data={bondDataList[matchedBondIdx].data} accountName={bondDataList[matchedBondIdx].name} entityName={bondDataList[matchedBondIdx].name} memberChartData={bondDataList[matchedBondIdx].chartData} />
        ) : matchedDBIdx >= 0 && allDBData[matchedDBIdx] ? (
          <SectionTable data={allDBData[matchedDBIdx]} onNavigate={navigateTo} />
        ) : isAnnuity1 ? (
          <AnnuityProductPage data={annuity1Data || ANNUITY1_DATA} />
        ) : isAnnuity2 ? (
          <AnnuityProductPage data={annuity2Data || ANNUITY1_DATA} />
        ) : isDeathTax ? (
          <PotentialDeathTaxPage />
        ) : activePageData ? (
          <div>
            {isFinancialSummary && showSummaryDashboard && netWorthChartData && summaryMeta && (
              <FinancialSummaryDashboard
                chartData={netWorthChartData}
                cashflowData={fsCashflowChartData}
                meta={summaryMeta}
                projYears={PROJ_YEARS}
              />
            )}
            <SectionTable data={activePageData} onNavigate={navigateTo} />
          </div>
        ) : (
          <PlaceholderContent topTab={activeTop} subTab={activeSub} subSubTab={activeSubSub} />
        )}
      </div>

      </div>
      {/* Co-pilot panel — 30% when open */}
      {assistantOpen && (
        <div style={{
          flex: "0 0 30%",
          borderLeft: "1px solid var(--ps-border)",
          display: "flex", flexDirection: "column",
          background: "var(--ps-surface)", overflow: "hidden",
          minWidth: 320,
        }}>
          <CashflowAssistant factFind={factFind} updateFF={updateFF} darkMode={darkMode} mode={mode || "cashflow"} onNavigate={(section) => { setFactFindOpen(true); setFactFindSection(section); }} factFindSection={factFindSection} />
        </div>
      )}
      </div>

      {/* Fact Find overlay */}
      {factFindOpen && (
        <>
          <div onClick={() => { setFactFindOpen(false); setFactFindSection(null); }} style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "var(--ps-overlay)",
            zIndex: 999,
          }} />
          {factFindPanelJSX}
        </>
      )}

      {/* Advice overlay */}
      {adviceOpen && (
        <>
          <div onClick={() => { setAdviceOpen(false); setAdviceSection(null); }} style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "var(--ps-overlay)",
            zIndex: 999,
          }} />
          {advicePanelJSX}
        </>
      )}

      {/* ── SOA Builder Full-Screen Overlay ── */}
      {showSOABuilder && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9999, background: darkMode ? "#0F172A" : "#F8FAFC",
          display: "flex", flexDirection: "column",
        }}>
          {/* SOA header bar */}
          <div style={{
            padding: "10px 24px", borderBottom: "1px solid var(--ps-border)",
            background: "var(--ps-surface)", display: "flex", alignItems: "center", gap: 16,
            flexShrink: 0,
          }}>
            <button
              onClick={() => setShowSOABuilder(false)}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "1px solid var(--ps-border-input)",
                background: "var(--ps-surface)", fontSize: 12, color: "var(--ps-text-secondary)",
                cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 5,
              }}
            >← Back to Model</button>
            <div style={{ width: 1, height: 24, background: "var(--ps-border)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>📄</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ps-text-primary)", letterSpacing: "-0.02em" }}>
                  Statement of Advice
                </div>
                <div style={{ fontSize: 11, color: "var(--ps-text-muted)" }}>
                  {`${(factFind.client1?.first_name || "")} ${(factFind.client1?.last_name || "")}`.trim() || "Client"}{factFind.client2?.first_name ? ` & ${factFind.client2.first_name} ${factFind.client2.last_name || ""}`.trim() : ""} · {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <button style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid var(--ps-border-input)",
              background: "var(--ps-surface)", fontSize: 12, color: "var(--ps-text-secondary)",
              cursor: "pointer", fontWeight: 500,
            }}>Preview</button>
            <button style={{
              padding: "6px 18px", borderRadius: 8, border: "none",
              background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
              fontSize: 12, color: "#fff", cursor: "pointer", fontWeight: 700,
              boxShadow: "0 2px 8px rgba(5,150,105,0.35)",
            }}>Generate Document</button>
          </div>
          {/* SOA body — full screen, no model leaking through */}
          <div style={{ flex: 1, overflow: "auto" }}>
            <SOADocumentBuilder
              factFind={factFind}
              engineData={engineData}
              summaryMeta={summaryMeta}
              ssData={ssData}
              strategies={(engineData.advice_request?.strategy?.strategies || [])}
              projYears={PROJ_YEARS}
              superProj={superProj}
              c1Display={c1Display}
              c2Display={c2Display}
              navigateTo={(path) => { setShowSOABuilder(false); navigateTo(path); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CashflowModel({ initialData, onDataChange, onBack, mode, hideAdvice, clientId } = {}) {
  return React.createElement(CashflowErrorBoundary, null,
    React.createElement(CashflowModelInner, { initialData, onDataChange, onBack, mode, hideAdvice, clientId })
  );
}
