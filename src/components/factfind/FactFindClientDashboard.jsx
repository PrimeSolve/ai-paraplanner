import React from 'react';

const fC = (v) => {
  if (!v && v !== 0) return '$0';
  const abs = Math.abs(v);
  if (abs >= 1000000) return (v < 0 ? '-' : '') + '$' + (abs / 1000000).toFixed(2) + 'M';
  if (abs >= 1000) return (v < 0 ? '-' : '') + '$' + Math.round(abs / 1000) + 'k';
  return (v < 0 ? '-$' : '$') + Math.round(abs).toLocaleString('en-AU');
};

export default function FactFindClientDashboard({ factFind, completionData = {}, onTileClick }) {
  const ff = factFind?.client1_fact_find || factFind?.client1_profile || {};
  const personal = ff.personal_details || {};
  const superFunds = ff.super_funds?.funds || [];
  const pensions = ff.super_funds?.pensions || [];
  const assets = ff.properties || [];
  const debts = ff.debts || [];
  const policies = ff.insurance_policies?.policies || [];
  const incomes = ff.incomes || [];
  const expenses = ff.expenses || [];

  const totalAssets = assets.reduce((s, a) => s + (parseFloat(a.value) || 0), 0)
    + superFunds.reduce((s, f) => s + (parseFloat(f.balance) || 0), 0)
    + pensions.reduce((s, p) => s + (parseFloat(p.balance) || 0), 0);
  const totalDebts = debts.reduce((s, d) => s + (parseFloat(d.balance) || parseFloat(d.amount) || 0), 0);
  const netWorth = totalAssets - totalDebts;
  const totalIncome = (parseFloat(incomes[0]?.i_gross) || 0) + (parseFloat(incomes[1]?.i_gross) || 0);
  const totalExpenses = parseFloat(expenses[0]?.living_expenses) || 0;
  const monthlyCashflow = (totalIncome - totalExpenses) / 12;
  const totalCover = policies.reduce((s, p) => s + (parseFloat(p.cover_amount) || 0), 0);

  const clientName = [personal.first_name, personal.last_name].filter(Boolean).join(' ') || 'Client';

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {[
          { label: 'Net Worth',            value: fC(netWorth),          sub: 'Assets minus liabilities',     bg: '#4F46E5' },
          { label: 'Monthly Cashflow',     value: fC(monthlyCashflow),   sub: 'Income minus expenses',         bg: '#059669' },
          { label: 'Total Insurance Cover',value: fC(totalCover),        sub: 'Life, TPD, Income Protection',  bg: '#D97706' },
        ].map((k, i) => (
          <div key={i} style={{ background: k.bg, borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'white', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'white', opacity: 0.65, marginTop: 5 }}>{k.sub}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
