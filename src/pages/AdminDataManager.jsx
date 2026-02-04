import React, { useState } from 'react';
import { Upload, Play, Download, Copy, Trash2, Settings } from 'lucide-react';

const colors = {
  primary: '#7C3AED',
  primaryLight: '#EDE9FE',
  accent: '#14B8A6',
  accentLight: '#CCFBF1',
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  success: '#10B981',
  successBg: '#D1FAE5',
  error: '#EF4444',
  errorBg: '#FEE2E2',
};

const sampleDatabases = [
  {
    id: 'platforms',
    name: 'Investment Platforms',
    description: 'Wrap platforms and their details',
    icon: '🏦',
    rowCount: 12,
    columnCount: 8,
    lastUpdated: '2024-03-10T14:30:00',
    updatedBy: 'Tim Hall',
    linkedTo: null,
    linkedFrom: ['products', 'fee-structures'],
    versions: [
      { id: 'v3', date: '2024-03-10T14:30:00', uploadedBy: 'Tim Hall', rowCount: 12, filename: 'platforms_march2024.csv' },
      { id: 'v2', date: '2024-02-15T09:00:00', uploadedBy: 'Alex Chen', rowCount: 11, filename: 'platforms_feb2024.csv' },
      { id: 'v1', date: '2024-01-05T11:20:00', uploadedBy: 'Tim Hall', rowCount: 10, filename: 'platforms_initial.csv' },
    ],
    columns: [
      { id: 'id', name: 'ID', type: 'text', isKey: true, isDropdown: false },
      { id: 'name', name: 'Platform Name', type: 'text', isKey: false, isDropdown: true },
      { id: 'provider', name: 'Provider', type: 'text', isKey: false, isDropdown: true },
      { id: 'minInvestment', name: 'Min Investment', type: 'currency', isKey: false, isDropdown: false },
      { id: 'adminFee', name: 'Admin Fee %', type: 'percentage', isKey: false, isDropdown: false },
      { id: 'supportsSuper', name: 'Supports Super', type: 'boolean', isKey: false, isDropdown: false },
      { id: 'supportsPension', name: 'Supports Pension', type: 'boolean', isKey: false, isDropdown: false },
      { id: 'status', name: 'Status', type: 'text', isKey: false, isDropdown: true },
    ],
  },
  {
    id: 'products',
    name: 'Managed Funds',
    description: 'Available managed funds and ETFs',
    icon: '📈',
    rowCount: 487,
    columnCount: 12,
    lastUpdated: '2024-03-08T10:15:00',
    updatedBy: 'Alex Chen',
    linkedTo: 'platforms',
    linkColumn: 'platformId',
    linkedFrom: [],
    versions: [
      { id: 'v2', date: '2024-03-08T10:15:00', uploadedBy: 'Alex Chen', rowCount: 487, filename: 'funds_march2024.csv' },
      { id: 'v1', date: '2024-01-10T14:00:00', uploadedBy: 'Tim Hall', rowCount: 412, filename: 'funds_initial.csv' },
    ],
    columns: [
      { id: 'id', name: 'Fund ID', type: 'text', isKey: true, isDropdown: false },
      { id: 'platformId', name: 'Platform ID', type: 'text', isKey: false, isDropdown: false, isLink: true },
      { id: 'fundName', name: 'Fund Name', type: 'text', isKey: false, isDropdown: true },
      { id: 'manager', name: 'Fund Manager', type: 'text', isKey: false, isDropdown: true },
    ],
  },
];

const samplePlatformData = [
  { id: 'PLT001', name: 'HUB24 Super', provider: 'HUB24', minInvestment: 1000, adminFee: 0.25, supportsSuper: true, supportsPension: true, status: 'Active' },
  { id: 'PLT002', name: 'Netwealth Super', provider: 'Netwealth', minInvestment: 5000, adminFee: 0.30, supportsSuper: true, supportsPension: true, status: 'Active' },
  { id: 'PLT003', name: 'BT Panorama', provider: 'Westpac', minInvestment: 10000, adminFee: 0.35, supportsSuper: true, supportsPension: true, status: 'Active' },
];

const DatabaseCard = ({ database, onClick }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: colors.card,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: `1px solid ${colors.border}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseOver={e => {
        e.currentTarget.style.borderColor = colors.primary;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: colors.primaryLight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
        }}>
          {database.icon}
        </div>
        {database.linkedTo && (
          <div style={{
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: colors.accentLight,
            color: colors.accent,
            fontSize: '11px',
            fontWeight: '600',
          }}>
            🔗 Linked
          </div>
        )}
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, margin: '0 0 4px 0' }}>
        {database.name}
      </h3>
      <p style={{ fontSize: '13px', color: colors.textMuted, margin: '0 0 16px 0' }}>
        {database.description}
      </p>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: colors.text }}>{database.rowCount.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: colors.textLight }}>Rows</div>
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: colors.text }}>{database.columnCount}</div>
          <div style={{ fontSize: '12px', color: colors.textLight }}>Columns</div>
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: colors.text }}>{database.versions.length}</div>
          <div style={{ fontSize: '12px', color: colors.textLight }}>Versions</div>
        </div>
      </div>

      <div style={{
        padding: '12px',
        backgroundColor: colors.background,
        borderRadius: '8px',
        fontSize: '12px',
        color: colors.textMuted,
      }}>
        Updated {formatDate(database.lastUpdated)} by {database.updatedBy}
      </div>
    </div>
  );
};

const DatabaseDetailView = ({ database, onBack }) => {
  const [activeTab, setActiveTab] = useState('data');

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 0',
          border: 'none',
          background: 'transparent',
          color: colors.textMuted,
          fontSize: '14px',
          cursor: 'pointer',
          marginBottom: '24px',
        }}
      >
        ← Back to Databases
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: colors.primaryLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
          }}>
            {database.icon}
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: colors.text, margin: '0 0 4px 0' }}>
              {database.name}
            </h1>
            <p style={{ fontSize: '14px', color: colors.textMuted, margin: 0 }}>
              {database.description}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
        {[
          { id: 'data', label: 'Data' },
          { id: 'columns', label: 'Columns' },
          { id: 'versions', label: 'Versions' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? colors.card : 'transparent',
              color: activeTab === tab.id ? colors.text : colors.textMuted,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'data' && (
        <div style={{
          backgroundColor: colors.card,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.background }}>
                  {database.columns.map(col => (
                    <th key={col.id} style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: colors.textMuted,
                      borderBottom: `1px solid ${colors.border}`,
                    }}>
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {samplePlatformData.map((row, idx) => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    {database.columns.map(col => (
                      <td key={col.id} style={{
                        padding: '14px 16px',
                        fontSize: '14px',
                        color: colors.text,
                      }}>
                        {col.type === 'boolean' ? (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: row[col.id] ? colors.successBg : colors.background,
                            color: row[col.id] ? colors.success : colors.textMuted,
                            fontSize: '12px',
                          }}>
                            {row[col.id] ? 'Yes' : 'No'}
                          </span>
                        ) : col.type === 'currency' ? (
                          `$${row[col.id]?.toLocaleString()}`
                        ) : col.type === 'percentage' ? (
                          `${row[col.id]}%`
                        ) : col.id === 'status' ? (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: row[col.id] === 'Active' ? colors.successBg : colors.warningBg,
                            color: row[col.id] === 'Active' ? colors.success : colors.warning,
                            fontSize: '12px',
                          }}>
                            {row[col.id]}
                          </span>
                        ) : (
                          row[col.id]
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'columns' && (
        <div style={{
          backgroundColor: colors.card,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          overflow: 'hidden',
        }}>
          {database.columns.map((col, idx) => (
            <div 
              key={col.id}
              style={{
                padding: '16px 24px',
                borderBottom: idx < database.columns.length - 1 ? `1px solid ${colors.border}` : 'none',
                display: 'grid',
                gridTemplateColumns: '200px 120px 1fr',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: colors.text }}>{col.name}</div>
                <div style={{ fontSize: '12px', color: colors.textLight, fontFamily: 'monospace' }}>{col.id}</div>
              </div>
              <div style={{ fontSize: '13px', color: colors.textMuted }}>{col.type}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {col.isKey && (
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: colors.warningBg,
                    color: colors.warning,
                    fontSize: '12px',
                    fontWeight: '500',
                  }}>
                    Primary Key
                  </span>
                )}
                {col.isDropdown && (
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: colors.primaryLight,
                    color: colors.primary,
                    fontSize: '12px',
                    fontWeight: '500',
                  }}>
                    Dropdown
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'versions' && (
        <div style={{
          backgroundColor: colors.card,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          overflow: 'hidden',
        }}>
          {database.versions.map((version, idx) => (
            <div 
              key={version.id}
              style={{
                padding: '20px 24px',
                borderBottom: idx < database.versions.length - 1 ? `1px solid ${colors.border}` : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: idx === 0 ? colors.successBg : colors.background,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700',
                color: idx === 0 ? colors.success : colors.textMuted,
              }}>
                v{database.versions.length - idx}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: colors.text }}>
                    {version.filename}
                  </span>
                  {idx === 0 && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: colors.successBg,
                      color: colors.success,
                      fontSize: '11px',
                      fontWeight: '600',
                    }}>
                      CURRENT
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: colors.textMuted }}>
                  {formatDate(version.date)} by {version.uploadedBy} • {version.rowCount.toLocaleString()} rows
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function AdminDataManager() {
  const [selectedDatabase, setSelectedDatabase] = useState(null);

  if (selectedDatabase) {
    return <DatabaseDetailView database={selectedDatabase} onBack={() => setSelectedDatabase(null)} />;
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.text, margin: 0, marginBottom: '8px' }}>
            Data Manager
          </h2>
          <p style={{ fontSize: '15px', color: colors.textMuted, margin: 0 }}>
            Manage your reference data, upload new databases, and configure relationships
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '32px',
      }}>
        <div style={{
          backgroundColor: colors.primary,
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            fontSize: '20px',
          }}>
            🗄️
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
            {sampleDatabases.length}
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Databases</div>
        </div>

        <div style={{
          backgroundColor: colors.card,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: colors.primaryLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            fontSize: '20px',
          }}>
            📊
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.text, marginBottom: '4px' }}>
            {sampleDatabases.reduce((sum, db) => sum + db.rowCount, 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: colors.textMuted }}>Total Rows</div>
        </div>

        <div style={{
          backgroundColor: colors.card,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: colors.accentLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            fontSize: '20px',
          }}>
            🔗
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.text, marginBottom: '4px' }}>
            {sampleDatabases.filter(db => db.linkedTo).length}
          </div>
          <div style={{ fontSize: '14px', color: colors.textMuted }}>Linked Databases</div>
        </div>

        <div style={{
          backgroundColor: colors.card,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: colors.successBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            fontSize: '20px',
          }}>
            ✓
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.text, marginBottom: '4px' }}>
            {sampleDatabases.reduce((sum, db) => sum + db.columns.filter(c => c.isDropdown).length, 0)}
          </div>
          <div style={{ fontSize: '14px', color: colors.textMuted }}>Dropdown Fields</div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
      }}>
        {sampleDatabases.map(db => (
          <DatabaseCard 
            key={db.id} 
            database={db} 
            onClick={() => setSelectedDatabase(db)}
          />
        ))}
      </div>
    </div>
  );
}