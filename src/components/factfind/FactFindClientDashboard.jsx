import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

// ── Hardcoded data — will be wired to live factFind later ──

const NET_WORTH = 2450000;
const MONTHLY_CASHFLOW = 4820;
const TOTAL_INSURANCE = 3200000;

const ASSET_BREAKDOWN = {
  total: 3100000,
  items: [
    { label: 'Lifestyle Assets', value: 1200000, color: '#6366F1' },
    { label: 'Investment Assets', value: 850000, color: '#8B5CF6' },
    { label: 'Superannuation', value: 780000, color: '#EC4899' },
    { label: 'Cash & Savings', value: 270000, color: '#14B8A6' },
  ],
};

const DEBT_BREAKDOWN = {
  total: 650000,
  items: [
    { label: 'Mortgage', value: 520000, color: '#EF4444' },
    { label: 'Investment Debt', value: 95000, color: '#F97316' },
    { label: 'Lifestyle Debt', value: 35000, color: '#F59E0B' },
  ],
};

const RETIREMENT = {
  total: 980000,
  items: [
    { label: 'Superannuation', value: 780000, color: '#06B6D4' },
    { label: 'Pension', value: 200000, color: '#3B82F6' },
  ],
};

const FAMILY = {
  client1: { initials: 'CH', color: '#6366F1', name: 'Catherine Hall' },
  client2: { initials: 'PH', color: '#EC4899', name: 'Paul Hall' },
  childrenCount: 2,
  trustsCount: 1,
  companiesCount: 1,
  smsfCount: 0,
};

const INCOME_BREAKDOWN = {
  total: 285000,
  items: [
    { label: 'Salary & Wages', value: 245000, color: '#10B981' },
    { label: 'Investment Income', value: 28000, color: '#22C55E' },
    { label: 'Pension/Annuities', value: 12000, color: '#14B8A6' },
  ],
};

const EXPENSE_BREAKDOWN = {
  total: 227160,
  items: [
    { label: 'Living Expenses', value: 96000, color: '#F97316' },
    { label: 'Debt Servicing', value: 78000, color: '#EF4444' },
    { label: 'Insurance Premiums', value: 53160, color: '#EC4899' },
  ],
};

const RISK_PROFILES = [
  { name: 'Catherine Hall', profile: 'Balanced', width: 50 },
  { name: 'Paul Hall', profile: 'Growth', width: 70 },
];

const INSURANCE_POLICIES = [
  { name: 'Catherine Hall', insurer: 'AIA Australia', type: 'Life', cover: 1500000 },
  { name: 'Paul Hall', insurer: 'TAL', type: 'Life', cover: 1200000 },
  { name: 'Catherine Hall', insurer: 'AIA Australia', type: 'TPD', cover: 500000 },
];

const GOALS = [
  { icon: '🏠', name: 'Pay off home by 55', entity: 'Joint', year: 2038 },
  { icon: '🎓', name: 'Children education fund', entity: 'Joint', year: 2032 },
  { icon: '🏖️', name: 'Retire at 60', entity: 'Catherine', year: 2043 },
  { icon: '🌍', name: 'Annual travel fund', entity: 'Joint', year: '2025+' },
];

// Hardcoded projected position chart data
const CAPITAL_DATA = Array.from({ length: 30 }, (_, i) => ({
  year: 2025 + i,
  assets: 2400000 + i * 80000 + Math.sin(i) * 50000,
  super: 780000 * Math.pow(1.06, i),
  liabilities: Math.max(0, 650000 - i * 25000),
  netWorth: 2400000 + i * 80000 + 780000 * Math.pow(1.06, i) - Math.max(0, 650000 - i * 25000),
}));

const CASHFLOW_DATA = Array.from({ length: 30 }, (_, i) => ({
  year: 2025 + i,
  income: 285000 * Math.pow(1.025, i),
  expenses: 227160 * Math.pow(1.03, i),
  surplus: 285000 * Math.pow(1.025, i) - 227160 * Math.pow(1.03, i),
}));

// ── Helpers ──

function fmt(v) {
  if (v == null || isNaN(v)) return '$0';
  if (Math.abs(v) >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  if (Math.abs(v) >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'k';
  return '$' + Number(v).toLocaleString('en-AU', { maximumFractionDigits: 0 });
}

// ── Sub-components ──

function KpiCard({ label, value, gradient, subtitle, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: gradient, borderRadius: 10, padding: '16px 20px',
        color: '#fff', cursor: onClick ? 'pointer' : 'default',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.9, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{fmt(value)}</div>
      {subtitle && <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

function BreakdownTile({ icon, title, total, items, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 10,
        border: '1px solid #E2E8F0',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#EEF2FF', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 18,
        }}>{icon}</div>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: '#64748B', fontWeight: 600 }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>
          {fmt(total)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: idx < items.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                {item.label}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{fmt(item.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FamilyTile({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 10,
        border: '1px solid #E2E8F0',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#EEF2FF', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 18,
        }}>👨‍👩‍👧‍👦</div>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: '#64748B', fontWeight: 600 }}>
          Family & Entities
        </span>
      </div>
      <div style={{ padding: '12px 14px' }}>
        {/* Client circles */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
          {[FAMILY.client1, FAMILY.client2].filter(Boolean).map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: c.color,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>{c.initials}</div>
              <span style={{ fontSize: 13, color: '#334155' }}>{c.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['Children', FAMILY.childrenCount],
            ['Trusts', FAMILY.trustsCount],
            ['Companies', FAMILY.companiesCount],
            ['SMSF', FAMILY.smsfCount],
          ].map(([lbl, val]) => (
            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#64748B' }}>{lbl}</span>
              <span style={{ fontWeight: 600, color: '#1E293B' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RiskProfileTile({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 10,
        border: '1px solid #E2E8F0',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#EEF2FF', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 18,
        }}>📊</div>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: '#64748B', fontWeight: 600 }}>
          Risk Profile
        </span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {RISK_PROFILES.map((rp, idx) => (
          <div key={idx}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: '#475569' }}>{rp.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1E293B' }}>{rp.profile}</span>
            </div>
            <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, #22C55E, #EAB308, #EF4444)',
                width: `${rp.width}%`,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsurancePoliciesTile({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 10,
        border: '1px solid #E2E8F0',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#EEF2FF', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 18,
        }}>🛡️</div>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: '#64748B', fontWeight: 600 }}>
          Insurance Policies
        </span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {INSURANCE_POLICIES.map((pol, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: idx < INSURANCE_POLICIES.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{pol.type} — {pol.name}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>{pol.insurer}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{fmt(pol.cover)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsTile({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 10,
        border: '1px solid #E2E8F0',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#EEF2FF', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 18,
        }}>🎯</div>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: '#64748B', fontWeight: 600 }}>
          Goals & Objectives
        </span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {GOALS.map((g, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: idx < GOALS.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
            <span style={{ fontSize: 18 }}>{g.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{g.name}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>{g.entity}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6366F1' }}>{g.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectedChart() {
  const [mode, setMode] = useState('capital');
  const data = mode === 'capital' ? CAPITAL_DATA : CASHFLOW_DATA;

  return (
    <div style={{
      background: '#fff', borderRadius: 10,
      border: '1px solid #E2E8F0',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#EEF2FF', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18,
          }}>📈</div>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: '#64748B', fontWeight: 600 }}>
            Projected Position
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', borderRadius: 8, padding: 2 }}>
          {['capital', 'cashflow'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '4px 14px', borderRadius: 6, border: 'none',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#6366F1' : '#64748B',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {m === 'capital' ? 'Capital' : 'Cashflow'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
      <ResponsiveContainer width="100%" height={280}>
        {mode === 'capital' ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gAssets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gSuper" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={v => fmt(v)} />
            <Tooltip formatter={v => fmt(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="assets" name="Assets" stroke="#6366F1" fill="url(#gAssets)" />
            <Area type="monotone" dataKey="super" name="Super" stroke="#8B5CF6" fill="url(#gSuper)" />
            <Area type="monotone" dataKey="liabilities" name="Liabilities" stroke="#EF4444" fill="none" strokeDasharray="4 4" />
          </AreaChart>
        ) : (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={v => fmt(v)} />
            <Tooltip formatter={v => fmt(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="income" name="Income" stroke="#10B981" fill="url(#gIncome)" />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" fill="none" strokeDasharray="4 4" />
          </AreaChart>
        )}
      </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Section → tile click mapping ──
const SECTION_MAP = {
  assets: 'assets',
  debts: 'liabilities',
  retirement: 'superannuation',
  family: 'principals',
  income: 'income',
  expenses: 'expenses',
  risk: 'risk-profile',
  insurance: 'insurance-policies',
  goals: 'goals',
};

export default function FactFindClientDashboard({ onOpenSection }) {
  const open = (key) => onOpenSection?.(SECTION_MAP[key] || key);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* KPI Hero Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
          <KpiCard
            label="Net Worth"
            value={NET_WORTH}
            gradient="linear-gradient(135deg, #6366F1, #8B5CF6)"
            subtitle="Assets minus liabilities"
            onClick={() => open('assets')}
          />
          <KpiCard
            label="Monthly Cashflow"
            value={MONTHLY_CASHFLOW}
            gradient="linear-gradient(135deg, #10B981, #059669)"
            subtitle="Income minus expenses"
            onClick={() => open('income')}
          />
          <KpiCard
            label="Total Insurance Cover"
            value={TOTAL_INSURANCE}
            gradient="linear-gradient(135deg, #F59E0B, #D97706)"
            subtitle="Life, TPD, Income Protection"
            onClick={() => open('insurance')}
          />
        </div>

        {/* Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
          {/* Asset Breakdown — span 2 */}
          <div style={{ gridColumn: 'span 2' }}>
            <BreakdownTile
              icon="🏠"
              title="Asset Breakdown"
              total={ASSET_BREAKDOWN.total}
              items={ASSET_BREAKDOWN.items}
              onClick={() => open('assets')}
            />
          </div>

          {/* Debt Breakdown */}
          <BreakdownTile
            icon="💳"
            title="Debt Breakdown"
            total={DEBT_BREAKDOWN.total}
            items={DEBT_BREAKDOWN.items}
            onClick={() => open('debts')}
          />

          {/* Retirement */}
          <BreakdownTile
            icon="🏖️"
            title="Retirement"
            total={RETIREMENT.total}
            items={RETIREMENT.items}
            onClick={() => open('retirement')}
          />

          {/* Family */}
          <FamilyTile onClick={() => open('family')} />

          {/* Income */}
          <BreakdownTile
            icon="💰"
            title="Income (Annual)"
            total={INCOME_BREAKDOWN.total}
            items={INCOME_BREAKDOWN.items}
            onClick={() => open('income')}
          />

          {/* Expenses */}
          <BreakdownTile
            icon="🛒"
            title="Expenses (Annual)"
            total={EXPENSE_BREAKDOWN.total}
            items={EXPENSE_BREAKDOWN.items}
            onClick={() => open('expenses')}
          />

          {/* Risk Profile */}
          <RiskProfileTile onClick={() => open('risk')} />

          {/* Insurance Policies — span 2 */}
          <div style={{ gridColumn: 'span 2' }}>
            <InsurancePoliciesTile onClick={() => open('insurance')} />
          </div>

          {/* Goals — span 2 */}
          <div style={{ gridColumn: 'span 2' }}>
            <GoalsTile onClick={() => open('goals')} />
          </div>
        </div>

        {/* Projected Position Chart — full width */}
        <ProjectedChart />
    </div>
  );
}
