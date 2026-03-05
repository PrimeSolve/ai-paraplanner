// Catherine & Paul Smith demo data — used ONLY for standalone demo mode.
// When the cashflow model is embedded in the parent app, each client's
// own data must be passed via the initialData prop.
export const DEMO_DATA = 
{
    // ── 2 Principals ──
    client1: {
      first_name: "Catherine",
      last_name: "Smith",
      gender: "1",                     // Female
      date_of_birth: "1965-03-14",
      marital_status: "1",             // Married
      living_status: "1",              // Own home
      resident_status: "1",            // Permanent
      address: "42 Banksia Drive",
      suburb: "Mornington",
      state: "7",                      // VIC
      country: "Australia",
      postcode: "3931",
      mobile: "0412 345 678",
      email: "catherine.smith@email.com",
      health_status: "3",              // Good
      smoker_status: "2",              // Non-smoker
      health_insurance: "1",           // Yes
      health_issues: "",
      employment_status: "1",          // Full-time
      occupation: "Office Manager",
      hours_per_week: "38",
      occupation_type: "1",            // Employee
      annual_leave: "20",
      sick_leave: "15",
      long_service_leave: "8",
      employer_name: "Peninsula Medical Group",
      fbt_exempt: "1",
      fbt_category: "hospital",
      fbt_other_benefits: "1500",
      employment_length: "12",
      has_will: "1",                   // Yes
      will_updated: "2022-06-15",
      testamentary_trust: "2",         // No
      power_of_attorney: "2",          // Financial & Medical
      centrelink_benefits: "2",        // No
      benefit_type: "",
      concession_cards: "2",           // No
    },
    client2: {
      first_name: "Paul",
      last_name: "Smith",
      gender: "2",                     // Male
      date_of_birth: "1969-08-22",
      marital_status: "1",             // Married
      living_status: "1",              // Own home
      resident_status: "1",            // Permanent
      address: "42 Banksia Drive",
      suburb: "Mornington",
      state: "7",                      // VIC
      country: "Australia",
      postcode: "3931",
      mobile: "0413 987 654",
      email: "paul.smith@email.com",
      health_status: "3",              // Good
      smoker_status: "2",              // Non-smoker
      health_insurance: "1",           // Yes
      health_issues: "",
      employment_status: "1",          // Full-time
      occupation: "Electrician",
      hours_per_week: "40",
      occupation_type: "1",            // Employee
      annual_leave: "20",
      sick_leave: "12",
      long_service_leave: "4",
      employer_name: "Sparks & Co Electrical",
      employment_length: "8",
      has_will: "1",                   // Yes
      will_updated: "2022-06-15",
      testamentary_trust: "2",         // No
      power_of_attorney: "2",          // Financial & Medical
      centrelink_benefits: "2",        // No
      benefit_type: "",
      concession_cards: "2",           // No
    },
    children: [],
    dependants_list: [],

    // ── 1 Superannuation Fund ──
    superProducts: [
      {
        owner: "client1",
        fund_name: "AustralianSuper",
        product: "Balanced - MySuper",
        member_number: "1002845673",
        balance: "352000",
        contributions: {
          super_guarantee: "",           // Calculated from salary × SG rate
          salary_sacrifice: "5000",
          salary_sacrifice_indexed: false,  // Toggle: grow with inflation
          after_tax: "2000",
          after_tax_indexed: false,         // Toggle: grow with inflation
          spouse_received: "3000",       // Spouse contribution received from Paul ($3k p.a.)
          spouse_received_indexed: false,   // Toggle: grow with inflation
          split_received: "",            // Not receiving a split (she's the splitter)
          split_out_pct: "15",           // Splits 15% of her concessional contributions to Paul's fund
          concessional: "",
        },
        tax_components: {
          unp_amount: "",
          taxable_portion: "310000",
          tax_free_portion: "42000",
        },
        fees: {
          admin_fee: "117",              // $117 p.a. fixed admin
          percent_fee: "0.60",           // 0.60% p.a. investment fee
          insurance_fee: "480",          // $480 p.a. insurance premiums
          ins_inflation_on: true,        // Toggle insurance inflation
          ins_inflation_rate: "5.0",     // 5% p.a. stepped premium inflation
        },
        beneficiaries: [
          { benef_entity: "client2", benef_type: "binding", benef_entitlement: "100" },
        ],
        portfolio: [
          { asset_name: "Balanced - MySuper", allocation_pct: "100", amount: "352000" },
        ],
      },
      {
        owner: "client2",
        fund_name: "REST Super",
        product: "Core Strategy",
        member_number: "7891234560",
        balance: "218000",
        contributions: {
          super_guarantee: "",           // Calculated from salary × SG rate
          salary_sacrifice: "",
          salary_sacrifice_indexed: false,
          after_tax: "",
          after_tax_indexed: false,
          spouse_received: "",           // Not receiving spouse contributions
          spouse_received_indexed: false,
          split_received: "",            // Receives split from Catherine (calculated dynamically)
          split_out_pct: "",             // Not splitting his own contributions
          spouse_contribution_to: "3000", // Paul pays $3k p.a. spouse contribution to Catherine's fund
          spouse_contribution_to_indexed: false,
          concessional: "",
        },
        tax_components: {
          unp_amount: "",
          taxable_portion: "195000",
          tax_free_portion: "23000",
        },
        fees: {
          admin_fee: "78",               // $78 p.a. fixed admin
          percent_fee: "0.58",           // 0.58% p.a. investment fee
          insurance_fee: "360",          // $360 p.a. insurance premiums
          ins_inflation_on: true,
          ins_inflation_rate: "5.0",
        },
        beneficiaries: [
          { benef_entity: "client1", benef_type: "non-binding", benef_entitlement: "100" },
        ],
        portfolio: [
          { asset_name: "Core Strategy", allocation_pct: "100", amount: "218000" },
        ],
      },
    ],
    products: {
      lifetimePensions: [],
      annuities: [],
      investmentBonds: [],
      wraps: [],
    },
    pensions: [
      {
        owner: "client1",
        fund_name: "AustralianSuper",
        product: "Balanced - Pension",
        member_number: "1002845674",
        balance: "185000",
        pension_type: "account-based",    // "account-based", "ttr", "tap", "lifetime"
        drawdown_rate: "5",             // 5% annual drawdown
        drawdown_type: "percentage",     // "percentage" or "dollar"
        drawdown_amount: "",             // Used when drawdown_type is "dollar"
        drawdown_frequency: "monthly",
        fees: {
          admin_fee: "95",
          percent_fee: "0.55",
          insurance_fee: "0",
        },
        tax_components: {
          taxable_portion: "155000",
          tax_free_portion: "30000",
          tax_free_pct: "16.2",
        },
        portfolio: [
          { asset_name: "Balanced - Pension", allocation_pct: "100", amount: "185000" },
        ],
      },
      {
        owner: "client2",
        fund_name: "REST Super",
        product: "Pension",
        member_number: "7891234561",
        balance: "142000",
        pension_type: "account-based",
        drawdown_rate: "5",
        drawdown_type: "percentage",
        drawdown_amount: "",
        drawdown_frequency: "monthly",
        fees: {
          admin_fee: "68",
          percent_fee: "0.52",
          insurance_fee: "0",
        },
        tax_components: {
          taxable_portion: "125000",
          tax_free_portion: "17000",
          tax_free_pct: "12.0",
        },
        portfolio: [
          { asset_name: "Pension", allocation_pct: "100", amount: "142000" },
        ],
      },
    ],
    annuities: [
      {
        owner: "client1",
        product: "Challenger Lifetime Annuity",
        annuity_type: "lifetime",
        tax_environment: "super",          // "super" or "non-super"
        purchase_price: "200000",
        commencement_date: "2020-07-01",
        maturity_date: "",                 // Lifetime — no maturity
        guaranteed_period: "20",           // years
        residual_capital_value: "0",
        cpi_indexed: true,
        income: {
          annual_income: "12000",
          frequency: "monthly",
          tax_free_pct: "",
          taxable_pct: "",
          deductible_amount: "6250",       // purchase price / life expectancy at commencement
        },
        tax_components: {
          taxable_portion: "170000",
          tax_free_portion: "30000",
          tax_free_pct: "15.0",
        },
        centrelink: {
          income_test_assessment: "60",    // % of purchase price
          asset_test_assessment: "60",     // % — reduces to 30% at certain age
        },
        beneficiaries: [
          { benef_entity: "Paul Smith", benef_type: "Reversionary", benef_entitlement: "100" },
        ],
      },
      {
        owner: "client2",
        product: "AMP Fixed Term Annuity",
        annuity_type: "fixed-term",
        tax_environment: "non-super",      // Non-super annuity
        purchase_price: "100000",
        commencement_date: "2022-01-15",
        maturity_date: "2037-01-15",       // 15-year term
        guaranteed_period: "15",
        residual_capital_value: "50000",
        cpi_indexed: false,
        income: {
          annual_income: "7500",
          frequency: "quarterly",
          tax_free_pct: "",
          taxable_pct: "",
          deductible_amount: "3333",       // (purchase - RCV) / term
        },
        tax_components: {
          taxable_portion: "100000",
          tax_free_portion: "0",
          tax_free_pct: "0",
        },
        centrelink: {
          income_test_assessment: "100",
          asset_test_assessment: "100",
        },
        beneficiaries: [],
      },
    ],
    definedBenefits: [
      {
        owner: "client1",
        scheme: "pss",
        status: "contributing",
        date_joined: "1998-03-15",
        super_salary: "135000",
        salary_growth: "3",
        contribution_rate: "5",
        years_service: "27",
        expected_exit_age: "60",
        benefit_preference: "combination",
        combination_lump_pct: "30",
        member_component: "185000",
        productivity_component: "95000",
        employer_component: "420000",
        current_abm: "5.67",
        ten_year_rule_met: "yes",
        accumulated_basic_contribs: "",
        pre_1976_joiner: "",
        planning_54_11: "",
        preserved_benefit: "",
        current_pension_annual: "",
        pension_indexed: "",
        other_scheme_name: "",
        estimated_annual_pension: "",
        notes: "Planning retirement at 60. Wants combination — pension for income security, lump sum for renovations.",
      },
    ],
    trusts: [
      {
        trust_name: "Smith Family Trust",
        trust_type: "1",                // Discretionary Family Trust
        beneficiaries: [
          { benef_entity: "Catherine Smith", benef_entitlement: "50" },
          { benef_entity: "Paul Smith", benef_entitlement: "50" },
        ],
      },
    ],
    companies: [
      {
        company_name: "Smith Property Holdings Pty Ltd",
        co_purpose: "2",               // Investment
        co_type: "1",                   // Pty Ltd
        co_losses: "0",
        co_profit: "45000",
        shareholders: [
          { sh_entity: "Catherine Smith", sh_pct: "50" },
          { sh_entity: "Paul Smith", sh_pct: "50" },
        ],
      },
    ],
    smsfs: [
      {
        smsf_name: "Smith Family SMSF",
        fund_type: "SMSF",
        trustee_type: "corporate",
        acct_type: "pooled",
        smsf_balance: "850000",
        individual_trustee: "",
        accounts: [
          {
            owner: "client1",
            tax_environment: "accumulation",
            fund_percentage: "40",
            balance: "340000",
            tax_free_amt: "68000",
            tax_free_pct: "20.00",
            unp_amt: "",
            super_guarantee: "1",
            salary_sacrifice: "5000",
            after_tax: "",
            pension_type: "",
            pension_drawdown: "",
            beneficiaries: [
              { benef_who: "Paul Smith", benef_type: "binding", benef_entitlement: "100" },
            ],
          },
          {
            owner: "client1",
            tax_environment: "pension",
            fund_percentage: "30",
            balance: "255000",
            tax_free_amt: "52000",
            tax_free_pct: "20.39",
            unp_amt: "",
            super_guarantee: "",
            salary_sacrifice: "",
            after_tax: "",
            pension_type: "account_based",
            pension_drawdown: "18000",
            beneficiaries: [
              { benef_who: "Paul Smith", benef_type: "binding", benef_entitlement: "100" },
            ],
          },
          {
            owner: "client2",
            tax_environment: "accumulation",
            fund_percentage: "30",
            balance: "255000",
            tax_free_amt: "40000",
            tax_free_pct: "15.69",
            unp_amt: "",
            super_guarantee: "1",
            salary_sacrifice: "",
            after_tax: "",
            pension_type: "",
            pension_drawdown: "",
            beneficiaries: [
              { benef_who: "Catherine Smith", benef_type: "binding", benef_entitlement: "100" },
            ],
          },
        ],
      },
      {
        smsf_name: "Smith Segregated SMSF",
        fund_type: "SMSF",
        trustee_type: "corporate",
        acct_type: "segregated",
        smsf_balance: "1600000",
        individual_trustee: "",
        accounts: [
          {
            owner: "client1",
            tax_environment: "accumulation",
            fund_percentage: "",
            balance: "420000",
            tax_free_amt: "85000",
            tax_free_pct: "20.24",
            unp_amt: "",
            super_guarantee: "1",
            salary_sacrifice: "10000",
            after_tax: "",
            pension_type: "",
            pension_drawdown: "",
            beneficiaries: [
              { benef_who: "Paul Smith", benef_type: "binding", benef_entitlement: "100" },
            ],
          },
          {
            owner: "client1",
            tax_environment: "pension",
            fund_percentage: "",
            balance: "380000",
            tax_free_amt: "76000",
            tax_free_pct: "20.00",
            unp_amt: "",
            super_guarantee: "",
            salary_sacrifice: "",
            after_tax: "",
            pension_type: "account_based",
            pension_drawdown: "22000",
            beneficiaries: [
              { benef_who: "Paul Smith", benef_type: "binding", benef_entitlement: "100" },
            ],
          },
          {
            owner: "client2",
            tax_environment: "accumulation",
            fund_percentage: "",
            balance: "480000",
            tax_free_amt: "96000",
            tax_free_pct: "20.00",
            unp_amt: "",
            super_guarantee: "1",
            salary_sacrifice: "",
            after_tax: "",
            pension_type: "",
            pension_drawdown: "",
            beneficiaries: [
              { benef_who: "Catherine Smith", benef_type: "binding", benef_entitlement: "100" },
            ],
          },
          {
            owner: "client2",
            tax_environment: "pension",
            fund_percentage: "",
            balance: "320000",
            tax_free_amt: "64000",
            tax_free_pct: "20.00",
            unp_amt: "",
            super_guarantee: "",
            salary_sacrifice: "",
            after_tax: "",
            pension_type: "account_based",
            pension_drawdown: "16000",
            beneficiaries: [
              { benef_who: "Catherine Smith", benef_type: "binding", benef_entitlement: "100" },
            ],
          },
        ],
      },
    ],
    homeMortgage: { interestRate: 0.06, remainingYears: 25 },

    // ── Investment Bond ──
    investmentBonds: [
      {
        product_name: "Generation Life",
        owner: "client1",
        policy_number: "GLB-442891",
        balance: "100000",
        commencement_date: "2019-03-15",
        tax_treatment: "tax_paid",
        portfolio: [
          { asset_name: "Australian Equities", asset_code: "12", amount: "20000", allocation_pct: "20" },
          { asset_name: "International Equities", asset_code: "13", amount: "20000", allocation_pct: "20" },
          { asset_name: "Managed Funds (Balanced)", asset_code: "26", amount: "20000", allocation_pct: "20" },
          { asset_name: "Australian Fixed Interest", asset_code: "14", amount: "20000", allocation_pct: "20" },
          { asset_name: "Cash", asset_code: "11", amount: "20000", allocation_pct: "20" },
        ],
      },
    ],

    // ── 1 Asset (Family Home) ──
    assets: [
      {
        a_name: "Family Home — 42 Banksia Dr, Mornington",
        a_ownType: "2",                // Joint
        a_owner: "joint",
        a_type: "19",                  // PR (Absent) — rented out while living elsewhere
        a_value: "715000",
        a_purchase_price: "480000",
        a_purchase_date: "2012-04-20",
        a_move_out_date: "2024-03-15",
        a_rental_income: "550",        // $550/week rental income
        a_rental_freq: "52",           // Weekly
      },
      {
        a_name: "Investment Property — 17 Seabreeze Rd, Rosebud",
        a_ownType: "2",                // Joint
        a_owner: "joint",
        a_type: "18",                  // Investment Property
        a_value: "620000",
        a_purchase_price: "485000",
        a_purchase_date: "2018-09-15",
        a_rental_income: "520",        // $520/week
        a_rental_freq: "52",           // Weekly
      },
      {
        a_name: "Toyota RAV4 2021",
        a_ownType: "1",                // Sole
        a_owner: "client1",
        a_type: "2",                   // Car
        a_value: "32000",
        a_purchase_price: "42000",
        a_purchase_date: "2021-03-10",
        a_rental_income: "",
        a_rental_freq: "",
      },
      {
        a_name: "Boat — Haines Hunter 565R",
        a_ownType: "2",                // Joint
        a_owner: "joint",
        a_type: "7",                   // Lifestyle - Other
        a_value: "45000",
        a_purchase_price: "68000",
        a_purchase_date: "2019-11-01",
        a_rental_income: "",
        a_rental_freq: "",
      },
      {
        a_name: "CBA GoalSaver",
        a_ownType: "2",                // Joint
        a_owner: "joint",
        a_type: "8",                   // Savings Account
        a_value: "28000",
        a_purchase_price: "",
        a_purchase_date: "",
        a_rental_income: "",
        a_rental_freq: "",
      },
      {
        a_name: "Westpac Term Deposit",
        a_ownType: "1",                // Sole
        a_owner: "client2",
        a_type: "9",                   // Term Deposits
        a_value: "50000",
        a_purchase_price: "",
        a_purchase_date: "2024-06-01",
        a_rental_income: "",
        a_rental_freq: "",
      },
      {
        a_name: "Vanguard Australian Bond ETF (VAF)",
        a_ownType: "2",                // Joint
        a_owner: "joint",
        a_type: "10",                  // Bonds - Australian
        a_value: "35000",
        a_purchase_price: "33000",
        a_purchase_date: "2023-02-15",
        a_rental_income: "",
        a_rental_freq: "",
      },
      {
        a_name: "iShares Global Bond ETF (IHEB)",
        a_ownType: "1",                // Sole
        a_owner: "client1",
        a_type: "11",                  // Bonds - International
        a_value: "20000",
        a_purchase_price: "18500",
        a_purchase_date: "2023-08-20",
        a_rental_income: "",
        a_rental_freq: "",
      },
      {
        a_name: "Vanguard Australian Shares ETF (VAS)",
        a_ownType: "2",                // Joint
        a_owner: "joint",
        a_type: "12",                  // Australian Shares
        a_value: "65000",
        a_purchase_price: "48000",
        a_purchase_date: "2020-05-10",
        a_rental_income: "",
        a_rental_freq: "",
      },
      {
        a_name: "Betashares NASDAQ 100 ETF (NDQ)",
        a_ownType: "1",                // Sole
        a_owner: "client2",
        a_type: "13",                  // International Shares
        a_value: "42000",
        a_purchase_price: "28000",
        a_purchase_date: "2021-01-20",
        a_rental_income: "",
        a_rental_freq: "",
      },
      {
        a_name: "Magellan Global Fund",
        a_ownType: "2",                // Joint
        a_owner: "joint",
        a_type: "26",                  // Managed Funds
        a_value: "55000",
        a_purchase_price: "50000",
        a_purchase_date: "2022-09-01",
        a_rental_income: "",
        a_rental_freq: "",
      },
      {
        a_name: "Bitcoin Holdings (CoinSpot)",
        a_ownType: "1",                // Sole
        a_owner: "client2",
        a_type: "42",                  // Investment - Other
        a_value: "18000",
        a_purchase_price: "8000",
        a_purchase_date: "2020-12-15",
        a_rental_income: "",
        a_rental_freq: "",
      },
      {
        a_name: "Magellan Global Equities Fund",
        a_ownType: "3",                // Trust
        a_owner: "trust_0",            // Smith Family Trust
        a_type: "12",                  // Australian shares
        a_value: "320000",
        a_purchase_price: "240000",
        a_purchase_date: "2018-03-15",
        a_rental_income: "",
        a_rental_freq: "",
      },
      {
        a_name: "Commercial Unit — 5/12 Industrial Ave, Braeside",
        a_ownType: "4",                // Company
        a_owner: "company_0",          // Smith Property Holdings Pty Ltd
        a_type: "18",                  // Investment property
        a_value: "680000",
        a_purchase_price: "520000",
        a_purchase_date: "2019-07-01",
        a_rental_income: "850",
        a_rental_freq: "52",
      },
      {
        a_name: "Investment Property — 8 Coastal Rd, Dromana",
        a_ownType: "5",                // SMSF
        a_owner: "smsf_0",            // Smith Family SMSF
        a_type: "18",                  // Investment property
        a_value: "720000",
        a_purchase_price: "580000",
        a_purchase_date: "2020-03-15",
        a_rental_income: "680",        // $680/week
        a_rental_freq: "52",           // Weekly
      },
      {
        a_name: "Vanguard Australian Shares ETF (VAS)",
        a_ownType: "5",                // SMSF
        a_owner: "smsf_0",            // Smith Family SMSF
        a_type: "12",                  // Australian shares
        a_value: "200000",
        a_purchase_price: "170000",
        a_purchase_date: "2021-06-01",
        a_rental_income: "",
        a_rental_freq: "",
      },
      // ── Segregated SMSF Assets (one per account) ──
      {
        a_name: "Vanguard Diversified Growth Fund",
        a_ownType: "5",
        a_owner: "smsf_1_acc_0",       // Segregated: SMSF 1, Account 0
        a_type: "26",                   // Managed Funds
        a_value: "420000",
        a_purchase_price: "350000",
        a_purchase_date: "2019-07-01",
        a_rental_income: "",
        a_rental_freq: "",
      },
      {
        a_name: "Vanguard Conservative Fund",
        a_ownType: "5",
        a_owner: "smsf_1_acc_1",       // Segregated: SMSF 1, Account 1
        a_type: "26",                   // Managed Funds
        a_value: "380000",
        a_purchase_price: "340000",
        a_purchase_date: "2020-01-15",
        a_rental_income: "",
        a_rental_freq: "",
      },
      {
        a_name: "Investment Property — 15 Beach Rd, Rye",
        a_ownType: "5",
        a_owner: "smsf_1_acc_2",       // Segregated: SMSF 1, Account 2
        a_type: "18",                   // Investment property
        a_value: "480000",
        a_purchase_price: "410000",
        a_purchase_date: "2021-03-01",
        a_rental_income: "520",         // $520/week
        a_rental_freq: "52",
      },
      {
        a_name: "Australian Shares ETF",
        a_ownType: "5",
        a_owner: "smsf_1_acc_3",       // Segregated: SMSF 1, Account 3
        a_type: "12",                   // Australian shares
        a_value: "320000",
        a_purchase_price: "280000",
        a_purchase_date: "2020-06-01",
        a_rental_income: "",
        a_rental_freq: "",
      },
    ],

    // ── 9 Liabilities (one of every type) ──
    liabilities: [
      {
        d_name: "Home Loan — ANZ Variable",
        d_ownType: "2",                // Joint
        d_owner: "joint",
        d_type: "1",                   // Home loan
        d_rate: "5.99",
        d_freq: "12",                  // Monthly
        d_repayments: "2150",
        d_term: "22 years",
        d_balance: "320000",
        d_io: "2",                     // Not interest-only
        d_fixed: "2",                  // Variable
        d_has_redraw: "1",
        d_redraw: "12500",
        d_redraw_limit: "50000",
        d_security: ["0"],             // Secured against asset index 0 (Family Home)
        d_offset: ["4"],               // CBA GoalSaver linked as offset account
      },
      {
        d_name: "Investment Loan — CBA Fixed",
        d_ownType: "2",                // Joint
        d_owner: "joint",
        d_type: "2",                   // Investment loan
        d_rate: "6.29",
        d_freq: "12",                  // Monthly
        d_repayments: "2680",
        d_term: "25 years",
        d_balance: "445000",
        d_io: "1",                     // Interest-only
        d_fixed: "1",                  // Fixed
        d_redraw: "0",
        d_security: ["1"],             // Secured against asset index 1 (Investment Property)
      },
      {
        d_name: "Margin Loan — Leveraged Equities",
        d_ownType: "1",                // Sole
        d_owner: "client2",
        d_type: "3",                   // Margin loan
        d_rate: "7.45",
        d_freq: "12",                  // Monthly
        d_repayments: "450",
        d_term: "10 years",
        d_balance: "38000",
        d_io: "1",                     // Interest-only (typical for margin loans)
        d_fixed: "2",                  // Variable
        d_redraw: "0",
        d_security: ["8"],             // Secured against asset index 8 (VAS shares)
      },
      {
        d_name: "Split Loan — NAB Fixed/Variable",
        d_ownType: "2",                // Joint
        d_owner: "joint",
        d_type: "4",                   // Split loan
        d_rate: "6.15",
        d_freq: "12",                  // Monthly
        d_repayments: "580",
        d_term: "15 years",
        d_balance: "62000",
        d_io: "2",                     // P&I
        d_fixed: "1",                  // Fixed portion
        d_redraw: "3200",
        d_security: [],
      },
      {
        d_name: "Visa Platinum — Westpac",
        d_ownType: "1",                // Sole
        d_owner: "client1",
        d_type: "5",                   // Credit card
        d_rate: "20.49",
        d_freq: "12",                  // Monthly
        d_repayments: "350",
        d_term: "3 years",
        d_balance: "8200",
        d_io: "2",                     // P&I (paying down)
        d_fixed: "2",                  // Variable
        d_redraw: "0",
        d_security: [],
      },
      {
        d_name: "Car Loan — Toyota Finance",
        d_ownType: "1",                // Sole
        d_owner: "client1",
        d_type: "7",                   // Car loan
        d_rate: "6.99",
        d_freq: "12",                  // Monthly
        d_repayments: "520",
        d_term: "4 years",
        d_balance: "18500",
        d_io: "2",                     // P&I
        d_fixed: "1",                  // Fixed
        d_redraw: "0",
        d_security: ["2"],             // Secured against asset index 2 (Toyota RAV4)
      },
      {
        d_name: "Personal Loan — CBA",
        d_ownType: "1",                // Sole
        d_owner: "client2",
        d_type: "8",                   // Other
        d_rate: "9.99",
        d_freq: "12",                  // Monthly
        d_repayments: "280",
        d_term: "5 years",
        d_balance: "12000",
        d_io: "2",                     // P&I
        d_fixed: "1",                  // Fixed
        d_redraw: "0",
        d_security: [],
      },
      {
        d_name: "Margin Loan — Leveraged Equities",
        d_ownType: "3",                // Trust
        d_owner: "trust_0",            // Smith Family Trust
        d_type: "3",                   // Margin loan
        d_rate: "6.50",
        d_freq: "12",                  // Monthly
        d_repayments: "0",
        d_term: "0",
        d_balance: "85000",
        d_io: "1",                     // Interest only
        d_fixed: "2",                  // Variable
        d_redraw: "0",
        d_security: [],
      },
      {
        d_name: "Commercial Loan — NAB Business",
        d_ownType: "4",                // Company
        d_owner: "company_0",          // Smith Property Holdings Pty Ltd
        d_type: "2",                   // Investment loan
        d_rate: "6.29",
        d_freq: "12",                  // Monthly
        d_repayments: "3200",
        d_term: "20",
        d_balance: "380000",
        d_io: "2",                     // P&I
        d_fixed: "1",                  // Fixed
        d_redraw: "0",
        d_security: [],
      },
    ],

    assetsRegister: [],
    debtsRegister: [],
    insurancePolicies: [],
    insurance: { policies: [
      // ═══ Catherine Smith — 4 policies ═══
      { pol_name: "AustralianSuper Group Cover", pol_type: "Life with Linked TPD", pol_tax_env: "Inside Super", linked_fund_id: "super_0", pol_owner: "client1", pol_insured: "client1", pol_insurer: "TAL", pol_number: "SUP-442891-L", pol_waiting: "", pol_benefit_period: "", sum_insured_life: "750000", sum_insured_tpd: "750000", sum_insured_trauma: "", sum_insured_ip: "", sum_insured_ip2: "", premium_life: "1240", premium_tpd: "890", premium_trauma: "", premium_ip: "", premium_ip2: "", pol_freq: "Annual", pol_structure: "Inside Super" },
      { pol_name: "AustralianSuper Income Protection", pol_type: "Income Protection", pol_tax_env: "Inside Super", linked_fund_id: "super_0", pol_owner: "client1", pol_insured: "client1", pol_insurer: "TAL", pol_number: "SUP-442891-IP", pol_waiting: "90 days", pol_benefit_period: "To age 65", sum_insured_life: "", sum_insured_tpd: "", sum_insured_trauma: "", sum_insured_ip: "5667", sum_insured_ip2: "", premium_life: "", premium_tpd: "", premium_trauma: "", premium_ip: "1680", premium_ip2: "", pol_freq: "Annual", pol_structure: "Inside Super" },
      { pol_name: "MLC Trauma Cover", pol_type: "Trauma (Stand alone)", pol_tax_env: "Non-Super (Ordinary)", linked_fund_id: "", pol_owner: "client1", pol_insured: "client1", pol_insurer: "MLC", pol_number: "ORD-773521", pol_waiting: "", pol_benefit_period: "", sum_insured_life: "", sum_insured_tpd: "", sum_insured_trauma: "200000", sum_insured_ip: "", sum_insured_ip2: "", premium_life: "", premium_tpd: "", premium_trauma: "1120", premium_ip: "", premium_ip2: "", pol_freq: "Annual", pol_structure: "Non-Super (Ordinary)" },
      { pol_name: "Zurich TPD Top-Up", pol_type: "TPD (Stand alone)", pol_tax_env: "Non-Super (Ordinary)", linked_fund_id: "", pol_owner: "client1", pol_insured: "client1", pol_insurer: "Zurich", pol_number: "ORD-998412", pol_waiting: "", pol_benefit_period: "", sum_insured_life: "", sum_insured_tpd: "250000", sum_insured_trauma: "", sum_insured_ip: "", sum_insured_ip2: "", premium_life: "", premium_tpd: "680", premium_trauma: "", premium_ip: "", premium_ip2: "", pol_freq: "Annual", pol_structure: "Non-Super (Ordinary)" },
      // ═══ Paul Smith — 4 policies ═══
      { pol_name: "HostPlus Life Cover", pol_type: "Life (stand-alone)", pol_tax_env: "Inside Super", linked_fund_id: "super_1", pol_owner: "client2", pol_insured: "client2", pol_insurer: "MetLife", pol_number: "SUP-881233-L", pol_waiting: "", pol_benefit_period: "", sum_insured_life: "1000000", sum_insured_tpd: "", sum_insured_trauma: "", sum_insured_ip: "", sum_insured_ip2: "", premium_life: "1560", premium_tpd: "", premium_trauma: "", premium_ip: "", premium_ip2: "", pol_freq: "Annual", pol_structure: "Inside Super" },
      { pol_name: "HostPlus TPD Cover", pol_type: "TPD (Inside Super)", pol_tax_env: "Inside Super", linked_fund_id: "super_1", pol_owner: "client2", pol_insured: "client2", pol_insurer: "MetLife", pol_number: "SUP-881233-TPD", pol_waiting: "", pol_benefit_period: "", sum_insured_life: "", sum_insured_tpd: "600000", sum_insured_trauma: "", sum_insured_ip: "", sum_insured_ip2: "", premium_life: "", premium_tpd: "940", premium_trauma: "", premium_ip: "", premium_ip2: "", pol_freq: "Annual", pol_structure: "Inside Super" },
      { pol_name: "HostPlus Income Protection", pol_type: "Income Protection", pol_tax_env: "Inside Super", linked_fund_id: "super_1", pol_owner: "client2", pol_insured: "client2", pol_insurer: "MetLife", pol_number: "SUP-881233-IP", pol_waiting: "30 days", pol_benefit_period: "To age 65", sum_insured_life: "", sum_insured_tpd: "", sum_insured_trauma: "", sum_insured_ip: "7917", sum_insured_ip2: "", premium_life: "", premium_tpd: "", premium_trauma: "", premium_ip: "2340", premium_ip2: "", pol_freq: "Annual", pol_structure: "Inside Super" },
      { pol_name: "AIA Priority Protection", pol_type: "Life with Linked TPD", pol_tax_env: "Non-Super (Ordinary)", linked_fund_id: "", pol_owner: "client2", pol_insured: "client2", pol_insurer: "AIA", pol_number: "ORD-554672", pol_waiting: "", pol_benefit_period: "", sum_insured_life: "500000", sum_insured_tpd: "500000", sum_insured_trauma: "", sum_insured_ip: "", sum_insured_ip2: "", premium_life: "920", premium_tpd: "1150", premium_trauma: "", premium_ip: "", premium_ip2: "", pol_freq: "Annual", pol_structure: "Non-Super (Ordinary)" },
      // ═══ Catherine Smith — SMSF Policies ═══
      { pol_name: "Smith Segregated SMSF Life Cover", pol_type: "Life (stand-alone)", pol_tax_env: "super", linked_fund_id: "smsf_1_0", pol_owner: "client1", pol_insured: "client1", pol_insurer: "AIA", pol_number: "SMSF-SEG-001-L", pol_waiting: "", pol_benefit_period: "", sum_insured_life: "500000", sum_insured_tpd: "", sum_insured_trauma: "", sum_insured_ip: "", sum_insured_ip2: "", premium_life: "1380", premium_tpd: "", premium_trauma: "", premium_ip: "", premium_ip2: "", pol_freq: "Annual", pol_structure: "Inside Super (SMSF)" },
      { pol_name: "Smith Segregated SMSF TPD Cover", pol_type: "TPD (Inside Super)", pol_tax_env: "super", linked_fund_id: "smsf_1_0", pol_owner: "client1", pol_insured: "client1", pol_insurer: "AIA", pol_number: "SMSF-SEG-001-TPD", pol_waiting: "", pol_benefit_period: "", sum_insured_life: "", sum_insured_tpd: "500000", sum_insured_trauma: "", sum_insured_ip: "", sum_insured_ip2: "", premium_life: "", premium_tpd: "960", premium_trauma: "", premium_ip: "", premium_ip2: "", pol_freq: "Annual", pol_structure: "Inside Super (SMSF)" },
      { pol_name: "Smith Segregated SMSF Income Protection", pol_type: "Income Protection", pol_tax_env: "super", linked_fund_id: "smsf_1_0", pol_owner: "client1", pol_insured: "client1", pol_insurer: "AIA", pol_number: "SMSF-SEG-001-IP", pol_waiting: "90 days", pol_benefit_period: "To age 65", sum_insured_life: "", sum_insured_tpd: "", sum_insured_trauma: "", sum_insured_ip: "5667", sum_insured_ip2: "", premium_life: "", premium_tpd: "", premium_trauma: "", premium_ip: "1940", premium_ip2: "", pol_freq: "Annual", pol_structure: "Inside Super (SMSF)" },
    ] },
    income: {
      client1: {
        i_gross: "85000",
        i_super_inc: "2",              // Exclude super (salary + super on top)
        i_fbt: "2",                    // No fringe benefits
        i_fbt_value: "",
        i_bonus: "",
        i_increase: "2.5",            // 2.5% annual increase
        i_nontax: "2",                // No non-taxable salary
        i_cgt_losses: "3200",          // Existing CGT losses carried forward
        i_revenue_losses: "",
        adjustments: [],
      },
      client2: {
        i_gross: "95000",
        i_super_inc: "2",              // Exclude super
        i_fbt: "2",                    // No fringe benefits
        i_fbt_value: "",
        i_bonus: "",
        i_increase: "2.5",            // 2.5% annual increase
        i_nontax: "2",                // No non-taxable salary
        i_cgt_losses: "10000",         // Existing CGT losses carried forward
        i_revenue_losses: "",
        adjustments: [],
      },
    },
    expenses: {
      rental_cost: "600",          // $600/week rent paid while absent from PR
      rental_freq: "52",        // 52=weekly, 26=fortnightly, 12=monthly
    },
    cashflowConfig: { livingExpenses: 85000, livingExpensesGrowth: 0.025 },
    assetAssumptions: {
      "1":  { label: "Principal Residence",   growthRate: 3.00, incomeYield: 0.00, frankingPct: 0 },
      "18": { label: "Investment Property",   growthRate: 3.00, incomeYield: 4.36, frankingPct: 0 },
      "21": { label: "Commercial Property",  growthRate: 3.00, incomeYield: 6.00, frankingPct: 0 },
      "2":  { label: "Car",                   growthRate: -10.00, incomeYield: 0.00, frankingPct: 0 },
      "7":  { label: "Lifestyle Other",       growthRate: -10.00, incomeYield: 0.00, frankingPct: 0 },
      "8":  { label: "Savings Account",       growthRate: 0.00, incomeYield: 4.50, frankingPct: 0 },
      "9":  { label: "Term Deposits",         growthRate: 0.00, incomeYield: 4.75, frankingPct: 0 },
      "10": { label: "Bonds — Australian",    growthRate: 2.00, incomeYield: 3.50, frankingPct: 0 },
      "11": { label: "Bonds — International", growthRate: 2.00, incomeYield: 3.00, frankingPct: 0 },
      "12": { label: "Australian Shares",     growthRate: 6.00, incomeYield: 4.00, frankingPct: 80 },
      "13": { label: "International Shares",  growthRate: 7.00, incomeYield: 2.00, frankingPct: 0 },
      "26": { label: "Managed Funds",         growthRate: 5.50, incomeYield: 3.00, frankingPct: 40 },
      "42": { label: "Investment Other",      growthRate: 5.00, incomeYield: 0.00, frankingPct: 0 },
      "50": { label: "Receivables",           growthRate: 0.00, incomeYield: 0.00, frankingPct: 0 },
      "51": { label: "Inventory",             growthRate: 0.00, incomeYield: 0.00, frankingPct: 0 },
      "52": { label: "Plant & Equipment",     growthRate: -15.00, incomeYield: 0.00, frankingPct: 0 },
      "53": { label: "Goodwill",              growthRate: 0.00, incomeYield: 0.00, frankingPct: 0 },
      "54": { label: "Intellectual Property",  growthRate: 0.00, incomeYield: 0.00, frankingPct: 0 },
      "55": { label: "Related Party Loan",    growthRate: 0.00, incomeYield: 0.00, frankingPct: 0 },
      "56": { label: "Work in Progress",      growthRate: 0.00, incomeYield: 0.00, frankingPct: 0 },
    },
    goals: [],
    advice_reason: { reasons: [], quick: { client1: { ret_age: "65" }, client2: { ret_age: "67" } }, objectives: [
      { o_who: ["client1", "client2"], o_type: "6", o_property: "", o_debt: "", o_asset: "", o_start: "2025", o_end: "2030", o_freq: "5", o_amount: "18000", o_importance: "3", o_why: "Private school fees for youngest child (Years 7-12)" },
      { o_who: ["client1", "client2"], o_type: "9", o_property: "", o_debt: "", o_asset: "", o_start: "2027", o_end: "2027", o_freq: "5", o_amount: "25000", o_importance: "2", o_why: "Family trip to Europe — 25th wedding anniversary" },
      { o_who: ["client1"], o_type: "32", o_property: "", o_debt: "", o_asset: "", o_start: "2028", o_end: "2028", o_freq: "5", o_amount: "60000", o_importance: "2", o_why: "Kitchen and bathroom renovation" },
      { o_who: ["client1", "client2"], o_type: "10", o_property: "", o_debt: "", o_asset: "", o_start: "2026", o_end: "2032", o_freq: "5", o_amount: "35000", o_importance: "1", o_why: "Replace family car every 6 years" },
      { o_who: ["client2"], o_type: "15", o_property: "", o_debt: "", o_asset: "", o_start: "2033", o_end: "2033", o_freq: "5", o_amount: "80000", o_importance: "3", o_why: "Help eldest child with house deposit" },
    ] },
    risk_profile: { client1: { answers: {}, score: 0, profile: "", specifiedProfile: "", adviserComments: "", clientComments: "", adjustedProfile: "", adjustmentReason: "" }, client2: { answers: {}, score: 0, profile: "", specifiedProfile: "", adviserComments: "", clientComments: "", adjustedProfile: "", adjustmentReason: "" }, mode: "", adjustRisk: "no" },
    incomeAdjustments: [],
    expenseAdjustments: [],
    advice_request: {
      scope: {},
      products_entities: {
        new_trusts: [
          { trust_name: "Smith Investment Trust", trust_type: "1", beneficiaries: [
            { benef_entity: "client1", benef_entitlement: "50" },
            { benef_entity: "client2", benef_entitlement: "50" },
          ]},
        ],
        new_companies: [
          { company_name: "Smith Wealth Pty Ltd", co_purpose: "2", co_type: "1", co_losses: "0", co_profit: "0", shareholders: [
            { sh_entity: "client1", sh_pct: "50" },
            { sh_entity: "client2", sh_pct: "50" },
          ]},
        ],
        new_smsf: [
          { smsf_name: "Smith Retirement SMSF", fund_type: "SMSF", trustee_type: "corporate", acct_type: "pooled", smsf_balance: "0", individual_trustee: "", accounts: [
            { owner: "client1", tax_environment: "accumulation", fund_percentage: "50", balance: "0" },
            { owner: "client2", tax_environment: "accumulation", fund_percentage: "50", balance: "0" },
          ], beneficiaries: [] },
        ],
        products: {},
      },
      insurance: {},
      transactions: { buy: [], sell: [
        { id: "sell_1", description: "Betashares NASDAQ 100 ETF (NDQ)", asset_idx: "9", owner_id: "client2", entity_type: "1", sell_entire_amount: true, amount: "", transaction_costs_pct: "0.5", sell_year: "2026", sell_timing: "end", sell_date: "" },
        { id: "sell_2", description: "Magellan Global Equities Fund", asset_idx: "12", owner_id: "trust_0", entity_type: "3", sell_entire_amount: false, amount: "150000", transaction_costs_pct: "1", sell_year: "2026", sell_timing: "end", sell_date: "" },
        { id: "sell_3", description: "Commercial Unit — 5/12 Industrial Ave", asset_idx: "13", owner_id: "company_0", entity_type: "4", sell_entire_amount: true, amount: "", transaction_costs_pct: "2", sell_year: "2027", sell_timing: "end", sell_date: "" },
        { id: "sell_4", description: "Vanguard Australian Shares ETF (VAS)", asset_idx: "15", owner_id: "smsf_0", entity_type: "5", sell_entire_amount: false, amount: "100000", transaction_costs_pct: "0.5", sell_year: "2026", sell_timing: "end", sell_date: "" },
        { id: "sell_5", description: "Vanguard Conservative Fund", asset_idx: "17", owner_id: "smsf_1", entity_type: "5", sell_entire_amount: false, amount: "150000", transaction_costs_pct: "0.5", sell_year: "2027", sell_timing: "end", sell_date: "" },
      ], debts: [
        { id: "debt_1", description: "Investment Loan — New Property", owner_id: "trust_0", entity_type: "3", debt_type: "2", interest_rate: "6.49", is_interest_only: true, interest_only_end_date: "", loan_amount: "350000", repayments: "0", repayment_freq: "12", term_years: "25", is_redraw_available: false, redraw_limit: "", establishment_cost: "2500", is_offset_available: false, is_purchase_security: true, start_date: "" },
      ],
      newSuper: [],
      newPension: [],
      rollovers: [],
    },
      strategy: { models: [
        { id: "model_default", name: "Advice Model 1", description: "Primary advice recommendation", drawdown_priority_1: "", drawdown_priority_2: "", drawdown_priority_3: "", portfolio_priority: "", surplus_priority_1: "", surplus_priority_2: "", surplus_priority_3: "" },
      ], strategies: [
        { id: "demo_180_cath", strategy_id: "180", owner_id: "client1", start_year: "2028", end_year: "2028", amount: "5000", timing: "SOY", product_id: "pension_0", notes: "Catherine: $5k lump sum withdrawal from ABP. Strategy 180 test." },
        { id: "demo_130_cath", strategy_id: "130", owner_id: "client1", start_year: "2026", end_year: "Ongoing", amount: "1200", timing: "SOY", product_id: "super_0", notes: "Catherine: $1,200/yr lump sum withdrawal from AustralianSuper. Strategy 130 test." },
        { id: "demo_lumpsum_110_soy", strategy_id: "110", owner_id: "client2", start_year: "2026", end_year: "2026", amount: "30000", timing: "SOY", product_id: "super_1", notes: "Paul: $30k lump sum drawdown from REST Super. SOY. LRT $180k used → $55k remaining." },
        { id: "demo_lumpsum_110_eoy", strategy_id: "110", owner_id: "client2", start_year: "2026", end_year: "2026", amount: "30000", timing: "EOY", product_id: "super_1", notes: "Paul: $30k lump sum drawdown from REST Super. EOY same year." },
        { id: "demo_recontr_108_soy", strategy_id: "108", owner_id: "client2", start_year: "2026", end_year: "2026", amount: "50000", timing: "SOY", product_id: "super_1", notes: "Paul: $50k lump sum withdraw + recontrib to self (REST Super). SOY timing. Resets taxable component." },
        { id: "demo_recontr_108_eoy", strategy_id: "108", owner_id: "client2", start_year: "2027", end_year: "2027", amount: "50000", timing: "EOY", product_id: "super_1", notes: "Paul: $50k lump sum withdraw + recontrib to self (REST Super). EOY timing." },
        { id: "demo_recontr_107_soy", strategy_id: "107", owner_id: "client2", start_year: "2028", end_year: "2028", amount: "50000", timing: "SOY", product_id: "super_1", notes: "Paul: $50k withdraw from REST, recontrib to Cathy's AustralianSuper. SOY timing." },
        { id: "demo_granny_137", strategy_id: "137", owner_id: "client1", start_year: "2025", end_year: "Ongoing", amount: "", timing: "SOY", product_id: "", notes: "Catherine transfers principal residence to child + $10k cash in exchange for life interest.", granny_extra_cash: "10000", granny_property_idx: "0" },
        { id: "demo_recontr_107_eoy", strategy_id: "107", owner_id: "client2", start_year: "2029", end_year: "2029", amount: "50000", timing: "EOY", product_id: "super_1", notes: "Paul: $50k withdraw from REST, recontrib to Cathy's AustralianSuper. EOY timing." },
      ] },
      adv_insurance: { client1: null, client2: null, policies: [] },
      tax_super_planning: {
        client1: {
          condition_of_release: "yes",
          condition_of_release_date: "",
          low_rate_used: "0",
          bring_forward_triggered: false,
          bring_forward_year: "",
          bring_forward_used: "0",
          tbc_used: "0",
        },
        client2: {
          condition_of_release: false,
          condition_of_release_date: "",
          low_rate_used: "180000",
          bring_forward_triggered: false,
          bring_forward_year: "",
          bring_forward_used: "0",
          tbc_used: "0",
        },
      },
      assumptions: { basic: null, returns_entities: [], returns_assets: [], rate_adjustments: [], fees: [] },
      portfolio: { transactions: [] },
      cgt_streaming: {},
    },
  };
