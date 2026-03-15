import React from 'react';

// Hardcoded data — will be wired to live factFind later
const CURRENT_YEAR = 2025;

const MILESTONES = [
  { year: 2025, label: 'Now',                    icon: '📍', color: '#6366F1' },
  { year: 2028, label: 'Upgrade Home',           icon: '🏠', color: '#3B82F6' },
  { year: 2032, label: 'Kids Education Fund',    icon: '🎓', color: '#8B5CF6' },
  { year: 2035, label: 'Investment Property',    icon: '🏢', color: '#06B6D4' },
  { year: 2038, label: 'Home Paid Off',          icon: '🎉', color: '#10B981' },
  { year: 2043, label: 'Catherine Retires (60)', icon: '🏖️', color: '#F59E0B' },
  { year: 2045, label: 'Paul Retires (62)',      icon: '🏖️', color: '#EC4899' },
  { year: 2055, label: 'Age Pension Eligible',   icon: '🏛️', color: '#14B8A6' },
];

const LIFE_GOALS = [
  { icon: '🏠', name: 'Upgrade family home',         entity: 'Joint', year: 2028, status: 'On Track' },
  { icon: '🎓', name: 'Children education fund',     entity: 'Joint', year: 2032, status: 'On Track' },
  { icon: '🏢', name: 'Buy investment property',     entity: 'Joint', year: 2035, status: 'Planned' },
  { icon: '🎉', name: 'Pay off home loan',           entity: 'Joint', year: 2038, status: 'On Track' },
  { icon: '🏖️', name: 'Catherine retire at 60',      entity: 'Catherine', year: 2043, status: 'Planned' },
  { icon: '🏖️', name: 'Paul retire at 62',           entity: 'Paul', year: 2045, status: 'Planned' },
  { icon: '🌍', name: 'Annual travel budget $15k',   entity: 'Joint', year: '2025+', status: 'Active' },
  { icon: '🏛️', name: 'Age pension eligibility',     entity: 'Both', year: 2055, status: 'Planned' },
];

const CLIENT_AGES = {
  client1: { name: 'Catherine', dob: '1983-04-15', ageNow: 42 },
  client2: { name: 'Paul', dob: '1983-09-22', ageNow: 41 },
};

function getStatusColor(status) {
  if (status === 'On Track') return '#10B981';
  if (status === 'Active') return '#6366F1';
  if (status === 'Planned') return '#94A3B8';
  return '#64748B';
}

export default function LifeTimeline() {
  const timelineStart = CURRENT_YEAR;
  const timelineEnd = 2060;
  const totalSpan = timelineEnd - timelineStart;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Client ages header */}
        <div style={{
          display: 'flex', gap: 24, marginBottom: 24,
          padding: '16px 20px', background: '#F8FAFC',
          borderRadius: 12, border: '1px solid #E2E8F0',
        }}>
          {Object.values(CLIENT_AGES).map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: i === 0 ? '#6366F1' : '#EC4899',
                color: '#fff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 13, fontWeight: 700,
              }}>
                {c.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Age {c.ageNow}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Visual timeline track */}
        <div style={{
          background: '#fff', borderRadius: 12,
          border: '1px solid #E2E8F0', padding: '32px 24px',
          marginBottom: 24, position: 'relative',
        }}>
          {/* Retirement zone highlight */}
          <div style={{
            position: 'absolute',
            left: `${((2043 - timelineStart) / totalSpan) * 100}%`,
            right: `${((timelineEnd - 2055) / totalSpan) * 100}%`,
            top: 0, bottom: 0,
            background: 'rgba(99, 102, 241, 0.04)',
            borderLeft: '2px dashed #C7D2FE',
            borderRight: '2px dashed #C7D2FE',
            borderRadius: 8,
          }}>
            <div style={{
              position: 'absolute', top: 8, left: 8,
              fontSize: 10, color: '#818CF8', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              Retirement Zone
            </div>
          </div>

          {/* Timeline line */}
          <div style={{
            position: 'relative', height: 4,
            background: '#E2E8F0', borderRadius: 2,
            margin: '48px 0 24px',
          }}>
            {/* Filled portion to current year */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: '2%', background: '#6366F1', borderRadius: 2,
            }} />

            {/* Milestone markers */}
            {MILESTONES.map((ms, idx) => {
              const pct = ((ms.year - timelineStart) / totalSpan) * 100;
              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${pct}%`, top: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  {/* Dot */}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: ms.color, border: '3px solid #fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 10,
                    cursor: 'default',
                  }}>
                    {ms.icon}
                  </div>
                  {/* Label - alternate above/below */}
                  <div style={{
                    position: 'absolute',
                    [idx % 2 === 0 ? 'bottom' : 'top']: 28,
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: ms.color }}>{ms.year}</div>
                    <div style={{ fontSize: 10, color: '#64748B', maxWidth: 80, lineHeight: 1.2 }}>
                      {ms.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Year ticks */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48, padding: '0 4px' }}>
            {[2025, 2030, 2035, 2040, 2045, 2050, 2055, 2060].map(yr => (
              <span key={yr} style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>{yr}</span>
            ))}
          </div>
        </div>

        {/* Goals table */}
        <div style={{
          background: '#fff', borderRadius: 12,
          border: '1px solid #E2E8F0', overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #E2E8F0',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>🎯</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
              Life Goals & Milestones
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['', 'Goal', 'Entity', 'Target Year', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 600, color: '#64748B',
                    textTransform: 'uppercase', letterSpacing: 0.5,
                    borderBottom: '1px solid #E2E8F0',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LIFE_GOALS.map((g, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 16px', fontSize: 18, width: 48 }}>{g.icon}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{g.name}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748B' }}>{g.entity}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#6366F1' }}>{g.year}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: 12,
                      fontSize: 11, fontWeight: 600,
                      color: getStatusColor(g.status),
                      background: getStatusColor(g.status) + '15',
                    }}>
                      {g.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
