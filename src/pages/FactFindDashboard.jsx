import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Shield, Home, CreditCard, PiggyBank, Users, Briefcase, ShoppingCart, Target, FileText } from 'lucide-react';
import FactFindLayout from '../components/factfind/FactFindLayout';

// Currency formatter
function formatCurrency(value) {
  if (!value || isNaN(value)) return '$0';
  return '$' + Number(value).toLocaleString('en-AU', { maximumFractionDigits: 0 });
}

// Frequency conversion helpers
function toMonthly(amount, frequency) {
  const val = parseFloat(amount) || 0;
  if (val === 0) return 0;
  
  const freq = (frequency || '').toLowerCase();
  
  if (freq.includes('week') && freq.includes('fort')) return val * 26 / 12;
  if (freq.includes('week')) return val * 52 / 12;
  if (freq.includes('month')) return val;
  if (freq.includes('quarter')) return val / 3;
  if (freq.includes('half') || freq.includes('semi')) return val / 6;
  if (freq.includes('annual') || freq.includes('year')) return val / 12;
  
  return val;
}

function toAnnual(amount, frequency) {
  const val = parseFloat(amount) || 0;
  const freq = (frequency || '').toLowerCase();
  
  if (freq.includes('week') && !freq.includes('fort')) return val * 52;
  if (freq.includes('fort')) return val * 26;
  if (freq.includes('month')) return val * 12;
  if (freq.includes('quarter')) return val * 4;
  if (freq.includes('annual') || freq.includes('year')) return val;
  
  return val;
}

// Calculation functions
function calculateNetWorth(factFindData) {
  let totalAssets = 0;
  let totalSuper = 0;
  let totalPensions = 0;
  let totalDebts = 0;

  const assets = factFindData.assets_liabilities?.assets || [];
  assets.forEach(asset => {
    totalAssets += parseFloat(asset.a_value) || 0;
  });

  const superFunds = factFindData.superannuation?.super_accounts || [];
  superFunds.forEach(fund => {
    totalSuper += parseFloat(fund.balance) || 0;
  });

  const pensions = factFindData.superannuation?.pensions || [];
  pensions.forEach(pension => {
    totalPensions += parseFloat(pension.p_balance) || 0;
  });

  const debts = factFindData.assets_liabilities?.liabilities || [];
  debts.forEach(debt => {
    totalDebts += parseFloat(debt.d_balance) || 0;
  });

  return totalAssets + totalSuper + totalPensions - totalDebts;
}

function calculateMonthlySurplus(factFindData) {
  let monthlyIncome = 0;
  let monthlyExpenses = 0;

  // Income
  const clientSalary = parseFloat(factFindData.income_expenses?.income_sources?.[0]?.i_gross_c1) || 0;
  const partnerSalary = parseFloat(factFindData.income_expenses?.income_sources?.[0]?.i_gross_c2) || 0;
  monthlyIncome += (clientSalary + partnerSalary) / 12;

  // Rental income
  const assets = factFindData.assets_liabilities?.assets || [];
  assets.forEach(asset => {
    const rental = parseFloat(asset.a_rental_income) || 0;
    if (rental > 0) {
      monthlyIncome += toMonthly(rental, asset.a_rental_freq);
    }
  });

  // Pension income
  const pensions = factFindData.superannuation?.pensions || [];
  pensions.forEach(p => {
    const income = parseFloat(p.p_income) || 0;
    if (income > 0) {
      monthlyIncome += toMonthly(income, p.p_frequency);
    }
  });

  // Expenses
  const expenses = factFindData.income_expenses?.expenses || [];
  expenses.forEach(exp => {
    const amount = parseFloat(exp.e_disc) || 0;
    if (amount > 0) {
      monthlyExpenses += toMonthly(amount, exp.e_freq);
    }
  });

  // Debt repayments
  const debts = factFindData.assets_liabilities?.liabilities || [];
  debts.forEach(debt => {
    const repayment = parseFloat(debt.d_repayments) || 0;
    if (repayment > 0) {
      monthlyExpenses += toMonthly(repayment, debt.d_freq);
    }
  });

  return monthlyIncome - monthlyExpenses;
}

function calculateTotalCover(factFindData) {
  let totalCover = 0;
  const policies = factFindData.insurance?.policies || [];
  
  policies.forEach(policy => {
    const sumInsured = parseFloat(policy.pol_sum) || 0;
    totalCover += sumInsured;
  });

  return totalCover;
}

function calculateAssetBreakdown(factFindData) {
  let lifestyle = 0;
  let investment = 0;
  let superannuation = 0;
  let cash = 0;

  const assets = factFindData.assets_liabilities?.assets || [];
  
  assets.forEach(asset => {
    const value = parseFloat(asset.a_value) || 0;
    const type = (asset.a_type || '').toLowerCase();
    
    if (type.includes('cash') || type.includes('savings') || type.includes('bank')) {
      cash += value;
    } else if (type.includes('home') || type.includes('car') || type.includes('personal') || type.includes('lifestyle')) {
      lifestyle += value;
    } else if (type.includes('investment') || type.includes('shares') || type.includes('property')) {
      investment += value;
    } else {
      lifestyle += value;
    }
  });

  const superFunds = factFindData.superannuation?.super_accounts || [];
  superFunds.forEach(fund => {
    superannuation += parseFloat(fund.balance) || 0;
  });

  return {
    total: lifestyle + investment + superannuation + cash,
    lifestyle,
    investment,
    superannuation,
    cash
  };
}

function calculateDebtBreakdown(factFindData) {
  let mortgage = 0;
  let investmentDebt = 0;
  let lifestyleDebt = 0;

  const debts = factFindData.assets_liabilities?.liabilities || [];
  
  debts.forEach(debt => {
    const balance = parseFloat(debt.d_balance) || 0;
    const type = (debt.d_type || '').toLowerCase();
    
    if (type.includes('home loan') || type.includes('mortgage')) {
      mortgage += balance;
    } else if (type.includes('investment')) {
      investmentDebt += balance;
    } else {
      lifestyleDebt += balance;
    }
  });

  return {
    total: mortgage + investmentDebt + lifestyleDebt,
    mortgage,
    investment: investmentDebt,
    lifestyle: lifestyleDebt
  };
}

function calculateRetirement(factFindData) {
  let superannuation = 0;
  let pension = 0;

  const superFunds = factFindData.superannuation?.super_accounts || [];
  superFunds.forEach(fund => {
    superannuation += parseFloat(fund.balance) || 0;
  });

  const pensions = factFindData.superannuation?.pensions || [];
  pensions.forEach(p => {
    pension += parseFloat(p.p_balance) || 0;
  });

  return {
    total: superannuation + pension,
    superannuation,
    pension
  };
}

function calculateFamilyEntities(factFindData) {
  const hasPartner = !!(factFindData.personal?.partner_email);
  const children = factFindData.dependants?.dependants_list || [];
  const trusts = factFindData.trusts_companies?.entities?.filter(e => e.entity_type === 'trust') || [];
  const companies = factFindData.trusts_companies?.entities?.filter(e => e.entity_type === 'company') || [];
  const smsfs = factFindData.smsf?.smsf_details || [];

  return {
    hasPartner,
    childrenCount: children.length,
    trustsCount: trusts.length,
    companiesCount: companies.length,
    smsfCount: smsfs.length
  };
}

function calculateIncomeBreakdown(factFindData) {
  let salary = 0;
  let investmentIncome = 0;
  let pensionAnnuities = 0;

  const clientSalary = parseFloat(factFindData.income_expenses?.income_sources?.[0]?.i_gross_c1) || 0;
  const partnerSalary = parseFloat(factFindData.income_expenses?.income_sources?.[0]?.i_gross_c2) || 0;
  salary = clientSalary + partnerSalary;

  const assets = factFindData.assets_liabilities?.assets || [];
  assets.forEach(asset => {
    const rental = parseFloat(asset.a_rental_income) || 0;
    if (rental > 0) {
      investmentIncome += toAnnual(rental, asset.a_rental_freq);
    }
  });

  const pensions = factFindData.superannuation?.pensions || [];
  pensions.forEach(p => {
    const income = parseFloat(p.p_income) || 0;
    if (income > 0) {
      pensionAnnuities += toAnnual(income, p.p_frequency);
    }
  });

  return {
    total: salary + investmentIncome + pensionAnnuities,
    salary,
    investment: investmentIncome,
    pensionAnnuities
  };
}

function calculateExpenseBreakdown(factFindData) {
  let living = 0;
  let debtServicing = 0;
  let insurance = 0;

  const expenses = factFindData.income_expenses?.expenses || [];
  expenses.forEach(exp => {
    const amount = parseFloat(exp.e_disc) || 0;
    if (amount > 0) {
      living += toAnnual(amount, exp.e_freq);
    }
  });

  const debts = factFindData.assets_liabilities?.liabilities || [];
  debts.forEach(debt => {
    const repayment = parseFloat(debt.d_repayments) || 0;
    if (repayment > 0) {
      debtServicing += toAnnual(repayment, debt.d_freq);
    }
  });

  const policies = factFindData.insurance?.policies || [];
  policies.forEach(policy => {
    const ownerType = (policy.pol_owner_type || '').toLowerCase();
    if (ownerType === 'super fund') return;
    
    const premium = parseFloat(policy.pol_premium) || 0;
    if (premium > 0) {
      insurance += toAnnual(premium, policy.pol_freq);
    }
  });

  return {
    total: living + debtServicing + insurance,
    living,
    debtServicing,
    insurance
  };
}

function getRiskProfile(factFindData) {
  const clientFirst = factFindData.personal?.first_name || '';
  const clientLast = factFindData.personal?.last_name || '';
  const clientName = `${clientFirst} ${clientLast}`.trim() || 'Client';
  const clientRisk = factFindData.risk_profile?.risk_tolerance || 'Not assessed';

  let partner = null;
  if (factFindData.personal?.partner_email) {
    const partnerFirst = factFindData.personal?.partner_first_name || '';
    const partnerLast = factFindData.personal?.partner_last_name || '';
    const partnerName = `${partnerFirst} ${partnerLast}`.trim() || 'Partner';
    const partnerRisk = factFindData.risk_profile?.partner_risk_tolerance || 'Not assessed';
    partner = { name: partnerName, profile: partnerRisk };
  }

  return {
    client: { name: clientName, profile: clientRisk },
    partner
  };
}

function getTopAssets(factFindData) {
  const allAssets = [];
  
  const assets = factFindData.assets_liabilities?.assets || [];
  assets.forEach(asset => {
    const value = parseFloat(asset.a_value) || 0;
    if (value > 0) {
      allAssets.push({ name: asset.a_name || 'Asset', value });
    }
  });
  
  const superFunds = factFindData.superannuation?.super_accounts || [];
  superFunds.forEach(fund => {
    const value = parseFloat(fund.balance) || 0;
    if (value > 0) {
      allAssets.push({ name: fund.fund_name || 'Super Fund', value });
    }
  });
  
  const pensions = factFindData.superannuation?.pensions || [];
  pensions.forEach(p => {
    const value = parseFloat(p.p_balance) || 0;
    if (value > 0) {
      allAssets.push({ name: p.pension_name || 'Pension', value });
    }
  });
  
  allAssets.sort((a, b) => b.value - a.value);
  return allAssets.slice(0, 6);
}

// Breakdown Card Component
function BreakdownCard({ icon, title, total, items, emptyMessage }) {
  if (total === 0 && items.every(i => i.value === 0)) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="text-center py-8 text-slate-400">
          <div className="text-4xl mb-2 opacity-50">📊</div>
          <div>{emptyMessage || 'No data recorded yet'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-lg">
          {icon}
        </div>
        <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
          {title}
        </div>
      </div>
      
      <div className="text-2xl font-extrabold text-slate-800 mb-3">
        {formatCurrency(total)}
      </div>
      
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
              {item.label}
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {formatCurrency(item.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FactFindDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const factFindId = searchParams.get('id');
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!factFindId) {
        navigate('/');
        return;
      }

      try {
        const data = await base44.entities.FactFind.filter({ id: factFindId });
        if (data && data.length > 0) {
          setFactFind(data[0]);
        }
      } catch (error) {
        console.error('Error loading fact find:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [factFindId, navigate]);

  if (loading) {
    return (
      <FactFindLayout currentSection="dashboard" factFindId={factFindId}>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-500">Loading dashboard...</div>
        </div>
      </FactFindLayout>
    );
  }

  if (!factFind) {
    return (
      <FactFindLayout currentSection="dashboard" factFindId={factFindId}>
        <div className="text-center py-12">
          <div className="text-slate-500">Fact find not found</div>
        </div>
      </FactFindLayout>
    );
  }

  // Calculate all metrics
  const netWorth = calculateNetWorth(factFind);
  const monthlySurplus = calculateMonthlySurplus(factFind);
  const totalCover = calculateTotalCover(factFind);
  const assetBreakdown = calculateAssetBreakdown(factFind);
  const debtBreakdown = calculateDebtBreakdown(factFind);
  const retirement = calculateRetirement(factFind);
  const familyEntities = calculateFamilyEntities(factFind);
  const incomeBreakdown = calculateIncomeBreakdown(factFind);
  const expenseBreakdown = calculateExpenseBreakdown(factFind);
  const riskProfile = getRiskProfile(factFind);
  const topAssets = getTopAssets(factFind);
  const policies = factFind.insurance?.policies || [];
  const goals = factFind.advice_reason?.detailed_notes || '';

  const hasAnyData = netWorth !== 0 || monthlySurplus !== 0 || totalCover !== 0;

  return (
    <FactFindLayout currentSection="dashboard" factFind={factFind}>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Your Financial Dashboard</h1>
            <p className="text-slate-600">Complete financial summary</p>
          </div>

          {/* Empty State */}
          {!hasAnyData && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <div className="text-5xl mb-4">📊</div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Your Financial Dashboard</h2>
              <p className="text-slate-600 mb-6">Complete your Fact Find to see your financial summary here.</p>
              <button 
                onClick={() => navigate(createPageUrl('FactFindPersonal') + (factFindId ? `?id=${factFindId}` : ''))}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Start Your Fact Find →
              </button>
            </div>
          )}

          {hasAnyData && (
            <>
              {/* Top 3 Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl p-5 text-white bg-gradient-to-br from-indigo-500 to-purple-600">
            <div className="text-xs uppercase tracking-wide opacity-90 mb-1">Net Worth</div>
            <div className="text-3xl font-extrabold">{formatCurrency(netWorth)}</div>
            <div className="text-sm opacity-80 mt-1">Assets minus liabilities</div>
          </div>
          
          <div className="rounded-xl p-5 text-white bg-gradient-to-br from-emerald-500 to-green-600">
            <div className="text-xs uppercase tracking-wide opacity-90 mb-1">Monthly Surplus</div>
            <div className="text-3xl font-extrabold">{formatCurrency(monthlySurplus)}</div>
            <div className="text-sm opacity-80 mt-1">Income minus expenses</div>
          </div>
          
          <div className="rounded-xl p-5 text-white bg-gradient-to-br from-amber-500 to-orange-600">
            <div className="text-xs uppercase tracking-wide opacity-90 mb-1">Total Insurance</div>
            <div className="text-3xl font-extrabold">{formatCurrency(totalCover)}</div>
            <div className="text-sm opacity-80 mt-1">Life, TPD, Income Protection</div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Asset Breakdown - span 2 */}
          <div className="lg:col-span-2">
            <BreakdownCard
              icon="🏠"
              title="Asset Breakdown"
              total={assetBreakdown.total}
              items={[
                { label: 'Lifestyle Assets', value: assetBreakdown.lifestyle, color: 'bg-blue-500' },
                { label: 'Investment Assets', value: assetBreakdown.investment, color: 'bg-purple-500' },
                { label: 'Superannuation', value: assetBreakdown.superannuation, color: 'bg-pink-500' },
                { label: 'Cash & Savings', value: assetBreakdown.cash, color: 'bg-teal-500' }
              ]}
              emptyMessage="No assets recorded"
            />
          </div>

          {/* Debt Breakdown */}
          <BreakdownCard
            icon="💳"
            title="Debt Breakdown"
            total={debtBreakdown.total}
            items={[
              { label: 'Mortgage', value: debtBreakdown.mortgage, color: 'bg-red-500' },
              { label: 'Investment Debt', value: debtBreakdown.investment, color: 'bg-orange-500' },
              { label: 'Lifestyle Debt', value: debtBreakdown.lifestyle, color: 'bg-amber-500' }
            ]}
            emptyMessage="No debts recorded"
          />

          {/* Retirement */}
          <BreakdownCard
            icon="🏖️"
            title="Retirement"
            total={retirement.total}
            items={[
              { label: 'Superannuation', value: retirement.superannuation, color: 'bg-cyan-500' },
              { label: 'Pension', value: retirement.pension, color: 'bg-blue-500' }
            ]}
            emptyMessage="No retirement funds"
          />

          {/* Family & Entities */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                👨‍👩‍👧‍👦
              </div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Family & Entities
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Partner</span>
                <span className="text-sm font-semibold text-slate-800">{familyEntities.hasPartner ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Children</span>
                <span className="text-sm font-semibold text-slate-800">{familyEntities.childrenCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Trusts</span>
                <span className="text-sm font-semibold text-slate-800">{familyEntities.trustsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Companies</span>
                <span className="text-sm font-semibold text-slate-800">{familyEntities.companiesCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">SMSF</span>
                <span className="text-sm font-semibold text-slate-800">{familyEntities.smsfCount}</span>
              </div>
            </div>
          </div>

          {/* Income Breakdown */}
          <BreakdownCard
            icon="💰"
            title="Income Breakdown (Annual)"
            total={incomeBreakdown.total}
            items={[
              { label: 'Salary & Wages', value: incomeBreakdown.salary, color: 'bg-emerald-500' },
              { label: 'Investment Income', value: incomeBreakdown.investment, color: 'bg-green-500' },
              { label: 'Pension/Annuities', value: incomeBreakdown.pensionAnnuities, color: 'bg-teal-500' }
            ]}
            emptyMessage="No income recorded"
          />

          {/* Expense Breakdown */}
          <BreakdownCard
            icon="🛒"
            title="Expense Breakdown (Annual)"
            total={expenseBreakdown.total}
            items={[
              { label: 'Living Expenses', value: expenseBreakdown.living, color: 'bg-orange-500' },
              { label: 'Debt Servicing', value: expenseBreakdown.debtServicing, color: 'bg-red-500' },
              { label: 'Insurance Premiums', value: expenseBreakdown.insurance, color: 'bg-pink-500' }
            ]}
            emptyMessage="No expenses recorded"
          />

          {/* Risk Profile */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                📊
              </div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Risk Profile
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600">{riskProfile.client.name}</span>
                  <span className="text-xs font-semibold text-slate-800">{riskProfile.client.profile}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-red-500" style={{ width: '70%' }} />
                </div>
              </div>
              {riskProfile.partner && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-600">{riskProfile.partner.name}</span>
                    <span className="text-xs font-semibold text-slate-800">{riskProfile.partner.profile}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-red-500" style={{ width: '70%' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Insurance Policies - span 2 */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                🛡️
              </div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Insurance Policies
              </div>
            </div>
            {policies.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2 opacity-50">🛡️</div>
                <div>No insurance policies</div>
              </div>
            ) : (
              <div className="space-y-3">
                {policies.map((policy, idx) => (
                  <div key={idx} className="border-b border-slate-100 pb-3 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-semibold text-sm text-slate-800">
                        {policy.pol_type || 'Insurance'} - {policy.pol_owner || 'Client'}
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {formatCurrency(policy.pol_sum)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>{policy.pol_insurer || 'Unknown Insurer'}</span>
                      <span>{formatCurrency(policy.pol_premium)} {policy.pol_freq || ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Goals & Objectives - span 2 */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                🎯
              </div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Goals & Objectives
              </div>
            </div>
            {!goals ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2 opacity-50">🎯</div>
                <div>No goals recorded</div>
              </div>
            ) : (
              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {goals}
              </div>
            )}
          </div>

          {/* Major Asset Positions Chart - full width */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                📈
              </div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Major Asset Positions
              </div>
            </div>
            {topAssets.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2 opacity-50">📈</div>
                <div>No assets to display</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topAssets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
            </>
          )}
        </div>
      </div>
    </FactFindLayout>
  );
}