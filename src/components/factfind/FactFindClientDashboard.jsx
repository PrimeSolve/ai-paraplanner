import React from 'react';

const fC = (v) => {
  if (!v && v !== 0) return '$0';
  const abs = Math.abs(v);
  if (abs >= 1000000) return (v < 0 ? '-' : '') + '$' + (abs / 1000000).toFixed(2) + 'M';
  if (abs >= 1000) return (v < 0 ? '-' : '') + '$' + Math.round(abs / 1000) + 'k';
  return (v < 0 ? '-$' : '$') + Math.round(abs).toLocaleString('en-AU');
};

function Panel({ title, icon, total, rows, onClick }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = '#6366F1'; }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.borderColor = '#E2E8F0'; }}
      style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', cursor: onClick ? 'pointer' : 'default', transition: 'border-color 0.15s' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>{icon}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
        </div>
        {onClick && <span style={{ fontSize: 10, color: '#C7D2FE', fontWeight: 600 }}>Edit →</span>}
      </div>
      <div style={{ padding: '12px 14px' }}>
        {total != null && <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.02em' }}>{fC(total)}</div>}
        {rows && rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#475569' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, display: 'inline-block', flexShrink: 0 }} />
              {r.label}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>{fC(r.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FactFindClientDashboard({ factFind, completionData = {}, onTileClick }) {
  const ff = factFind?.client1_fact_find || factFind?.client1_profile || {};
  const personal = ff.personal_details || {};
  const partner = personal.partner || {};
  const superFunds = ff.super_funds?.funds || [];
  const pensions = ff.super_funds?.pensions || [];
  const assets = ff.properties || [];
  const debts = ff.debts || [];
  const policies = ff.insurance_policies?.policies || [];
  const incomes = ff.incomes || [];
  const expenses = ff.expenses || [];
  const dependants = ff.dependants || {};
  const trusts = (ff.trusts_companies?.entities || []).filter(e => e.type === 'trust');
  const companies = (ff.trusts_companies?.entities || []).filter(e => e.type === 'company');
  const smsf = ff.smsf?.smsf_details || [];
  const riskProfile = ff.risk_profile || {};

  // KPI calculations
  const totalAssets = assets.reduce((s, a) => s + (parseFloat(a.value) || 0), 0)
    + superFunds.reduce((s, f) => s + (parseFloat(f.balance) || 0), 0)
    + pensions.reduce((s, p) => s + (parseFloat(p.balance) || 0), 0);
  const totalDebts = debts.reduce((s, d) => s + (parseFloat(d.balance) || parseFloat(d.amount) || 0), 0);
  const netWorth = totalAssets - totalDebts;
  const totalIncome = (parseFloat(incomes[0]?.i_gross) || 0) + (parseFloat(incomes[1]?.i_gross) || 0);
  const totalExpenses = parseFloat(expenses[0]?.living_expenses) || 0;
  const monthlyCashflow = (totalIncome - totalExpenses) / 12;
  const totalCover = policies.reduce((s, p) => s + (parseFloat(p.cover_amount) || 0), 0);
  const totalSuper = superFunds.reduce((s, f) => s + (parseFloat(f.balance) || 0), 0);
  const totalPension = pensions.reduce((s, p) => s + (parseFloat(p.balance) || 0), 0);

  // Asset breakdown
  const lifestyleAssets = assets.filter(a => a.asset_type === 'lifestyle').reduce((s, a) => s + (parseFloat(a.value) || 0), 0);
  const investmentAssets = assets.filter(a => a.asset_type === 'investment').reduce((s, a) => s + (parseFloat(a.value) || 0), 0);
  const cashAssets = assets.filter(a => a.asset_type === 'cash' || a.asset_type === 'savings').reduce((s, a) => s + (parseFloat(a.value) || 0), 0);

  // Debt breakdown
  const mortgage = debts.filter(d => d.liability_type === 'mortgage' || d.debt_type === 'mortgage').reduce((s, d) => s + (parseFloat(d.balance) || parseFloat(d.amount) || 0), 0);
  const investDebt = debts.filter(d => d.liability_type === 'investment_loan').reduce((s, d) => s + (parseFloat(d.balance) || 0), 0);
  const lifestyleDebt = debts.filter(d => d.liability_type === 'personal_loan' || d.liability_type === 'credit_card').reduce((s, d) => s + (parseFloat(d.balance) || 0), 0);

  // Income breakdown
  const salary = (parseFloat(incomes[0]?.i_gross) || 0) + (parseFloat(incomes[1]?.i_gross) || 0);
  const investIncome = (parseFloat(incomes[0]?.i_investment) || 0) + (parseFloat(incomes[1]?.i_investment) || 0);
  const pensionIncome = (parseFloat(incomes[0]?.i_pension) || 0) + (parseFloat(incomes[1]?.i_pension) || 0);

  // Expense breakdown
  const living = parseFloat(expenses[0]?.living_expenses) || 0;
  const debtServicing = debts.reduce((s, d) => s + (parseFloat(d.repayment) || parseFloat(d.monthly_repayment) || 0), 0) * 12;
  const insurancePremiums = policies.reduce((s, p) => s + (parseFloat(p.annual_premium) || 0), 0);

  // Client initials
  const c1Initial = ((personal.first_name?.[0] || '') + (personal.last_name?.[0] || '')).toUpperCase() || 'C1';
  const c2Initial = ((partner.first_name?.[0] || '') + (partner.last_name?.[0] || '')).toUpperCase() || '';
  const hasPartner = !!partner.first_name;

  // Risk
  const c1Risk = riskProfile.client?.profile || riskProfile.client1?.profile || '';
  const c2Risk = riskProfile.partner?.profile || riskProfile.client2?.profile || '';
  const c1Name = [personal.first_name, personal.last_name].filter(Boolean).join(' ') || 'Client 1';
  const c2Name = [partner.first_name, partner.last_name].filter(Boolean).join(' ') || 'Client 2';

  // Goals
  const goals = ff.advice_reasons?.goals || ff.advice_reasons?.quick?.client?.goals || [];

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Hero KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { label: 'Net Worth', value: fC(netWorth), sub: 'Assets minus liabilities', bg: '#4F46E5' },
          { label: 'Monthly Cashflow', value: fC(monthlyCashflow), sub: 'Income minus expenses', bg: '#059669' },
          { label: 'Total Insurance Cover', value: fC(totalCover), sub: 'Life, TPD, Income Protection', bg: '#D97706' },
        ].map((k, i) => (
          <div key={i} style={{ background: k.bg, borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'white', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{k.value}</div>
            <div style={{ fontSize: 10, color: 'white', opacity: 0.65, marginTop: 3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2 — assets, debt, retirement */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: 12 }}>
        <Panel title="Asset Breakdown" icon="🏦" total={totalAssets} onClick={() => onTileClick?.('assets_liabilities')} rows={[
          { label: 'Lifestyle assets', color: '#6366F1', value: lifestyleAssets },
          { label: 'Investment assets', color: '#0891B2', value: investmentAssets },
          { label: 'Superannuation', color: '#059669', value: totalSuper },
          { label: 'Cash & savings', color: '#D97706', value: cashAssets },
        ]} />
        <Panel title="Debt Breakdown" icon="💳" total={totalDebts} onClick={() => onTileClick?.('assets_liabilities')} rows={[
          { label: 'Mortgage', color: '#EF4444', value: mortgage },
          { label: 'Investment debt', color: '#F97316', value: investDebt },
          { label: 'Lifestyle debt', color: '#DC2626', value: lifestyleDebt },
        ]} />
        <Panel title="Retirement" icon="🌴" total={totalSuper + totalPension} onClick={() => onTileClick?.('superannuation')} rows={[
          { label: 'Superannuation', color: '#6366F1', value: totalSuper },
          { label: 'Pension', color: '#0891B2', value: totalPension },
        ]} />
      </div>

      {/* Row 3 — family, income, expenses, risk */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 1fr', gap: 12 }}>
        {/* Family */}
        <div onClick={() => onTileClick?.('personal')}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#6366F1'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
          style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>👨‍👩‍👧‍👦</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Family & Entities</span>
            </div>
            <span style={{ fontSize: 10, color: '#C7D2FE', fontWeight: 600 }}>Edit →</span>
          </div>
          <div style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', marginBottom: 12 }}>
              {[{ i: c1Initial, c: '#4F46E5' }, ...(hasPartner ? [{ i: c2Initial, c: '#0891B2' }] : [])].map((p, i) => (
                <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: p.c, border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', marginLeft: i > 0 ? -8 : 0 }}>{p.i}</div>
              ))}
            </div>
            {[
              { l: 'Children', v: (dependants.children || []).length },
              { l: 'Trusts', v: trusts.length },
              { l: 'Companies', v: companies.length },
              { l: 'SMSF', v: smsf.length },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', marginBottom: 3 }}>
                <span>{s.l}</span><span style={{ fontWeight: 600, color: '#0F172A' }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        <Panel title="Income (Annual)" icon="💰" total={totalIncome} onClick={() => onTileClick?.('income_expenses')} rows={[
          { label: 'Salary & Wages', color: '#6366F1', value: salary },
          { label: 'Investment Income', color: '#0891B2', value: investIncome },
          { label: 'Pension/Annuities', color: '#059669', value: pensionIncome },
        ]} />
        <Panel title="Expenses (Annual)" icon="📤" total={totalExpenses + debtServicing + insurancePremiums} onClick={() => onTileClick?.('income_expenses')} rows={[
          { label: 'Living Expenses', color: '#F97316', value: living },
          { label: 'Debt Servicing', color: '#EF4444', value: debtServicing },
          { label: 'Insurance Premiums', color: '#DC2626', value: insurancePremiums },
        ]} />

        {/* Risk */}
        <div onClick={() => onTileClick?.('risk_profile')}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#6366F1'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
          style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>📊</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Risk Profile</span>
            </div>
            <span style={{ fontSize: 10, color: '#C7D2FE', fontWeight: 600 }}>Edit →</span>
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[{ name: c1Name, profile: c1Risk, color: '#4F46E5' }, ...(hasPartner ? [{ name: c2Name, profile: c2Risk, color: '#0891B2' }] : [])].map((p, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#1E293B' }}>{p.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: p.color }}>{p.profile || '—'}</span>
                </div>
                <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2 }}>
                  <div style={{ width: p.profile ? '40%' : '0%', height: '100%', background: p.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4 — insurance, goals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Insurance */}
        <div onClick={() => onTileClick?.('insurance')}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#6366F1'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
          style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>🛡️</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Insurance Policies</span>
            </div>
            <span style={{ fontSize: 10, color: '#C7D2FE', fontWeight: 600 }}>Edit →</span>
          </div>
          <div style={{ padding: '12px 14px' }}>
            {policies.length === 0 ? (
              <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>No policies added yet</div>
            ) : policies.slice(0, 4).map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < Math.min(policies.length, 4) - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#1E293B' }}>{p.policy_type || p.type || 'Policy'} — {p.life_insured || p.owner || ''}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8' }}>{p.insurer || ''}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>{fC(parseFloat(p.cover_amount) || 0)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div onClick={() => onTileClick?.('advice_reason')}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#6366F1'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
          style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>🎯</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Goals & Objectives</span>
            </div>
            <span style={{ fontSize: 10, color: '#C7D2FE', fontWeight: 600 }}>Edit →</span>
          </div>
          <div style={{ padding: '12px 14px' }}>
            {goals.length === 0 ? (
              <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>No goals added yet — use the co-pilot to capture client objectives</div>
            ) : goals.slice(0, 5).map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < Math.min(goals.length, 5) - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <span style={{ fontSize: 14 }}>{g.icon || '🎯'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#1E293B' }}>{g.label || g.goal || g.description || 'Goal'}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8' }}>{g.entity || g.owner || ''}</div>
                </div>
                {g.year && <div style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5' }}>{g.year}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
