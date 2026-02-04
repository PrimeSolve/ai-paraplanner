import React, { useState } from 'react';

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
  {
    id: 'fee-structures',
    name: 'Fee Structures',
    description: 'Platform fee tiers and structures',
    icon: '💰',
    rowCount: 36,
    columnCount: 6,
    lastUpdated: '2024-02-20T16:45:00',
    updatedBy: 'Tim Hall',
    linkedTo: 'platforms',
    linkColumn: 'platformId',
    linkedFrom: [],
    versions: [
      { id: 'v1', date: '2024-02-20T16:45:00', uploadedBy: 'Tim Hall', rowCount: 36, filename: 'fees_feb2024.csv' },
    ],
    columns: [
      { id: 'id', name: 'ID', type: 'text', isKey: true, isDropdown: false },
      { id: 'platformId', name: 'Platform ID', type: 'text', isKey: false, isDropdown: false, isLink: true },
      { id: 'tierName', name: 'Tier Name', type: 'text', isKey: false, isDropdown: true },
      { id: 'minBalance', name: 'Min Balance', type: 'currency', isKey: false, isDropdown: false },
      { id: 'maxBalance', name: 'Max Balance', type: 'currency', isKey: false, isDropdown: false },
      { id: 'feePercent', name: 'Fee %', type: 'percentage', isKey: false, isDropdown: false },
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

const DatabaseListView = ({ databases, onSelectDatabase, onNewDatabase }) => {
  return (
    <div>
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
            {databases.length}
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Databases</div>
        </div>

        <div style={{
          backgroundColor: colors.card,
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
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
            {databases.reduce((sum, db) => sum + db.rowCount, 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: colors.textMuted }}>Total Rows</div>
        </div>

        <div style={{
          backgroundColor: colors.card,
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
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
            {databases.filter(db => db.linkedTo).length}
          </div>
          <div style={{ fontSize: '14px', color: colors.textMuted }}>Linked Databases</div>
        </div>

        <div style={{
          backgroundColor: colors.card,
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
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
            {databases.reduce((sum, db) => sum + db.columns.filter(c => c.isDropdown).length, 0)}
          </div>
          <div style={{ fontSize: '14px', color: colors.textMuted }}>Dropdown Fields</div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
      }}>
        {databases.map(db => (
          <DatabaseCard 
            key={db.id} 
            database={db} 
            onClick={() => onSelectDatabase(db)}
          />
        ))}
        
        <div
          onClick={onNewDatabase}
          style={{
            backgroundColor: colors.background,
            borderRadius: '16px',
            padding: '24px',
            border: `2px dashed ${colors.border}`,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '280px',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={e => {
            e.currentTarget.style.borderColor = colors.primary;
            e.currentTarget.style.backgroundColor = colors.primaryLight;
          }}
          onMouseOut={e => {
            e.currentTarget.style.borderColor = colors.border;
            e.currentTarget.style.backgroundColor = colors.background;
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: colors.card,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            color: colors.primary,
            marginBottom: '16px',
          }}>
            +
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>
            Create New Database
          </div>
          <div style={{ fontSize: '13px', color: colors.textMuted }}>
            Upload CSV or Excel file
          </div>
        </div>
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

const NewDatabaseModal = ({ onClose, onCreated, existingDatabases }) => {
  const [step, setStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [databaseInfo, setDatabaseInfo] = useState({
    name: '',
    description: '',
    icon: '📊',
  });

  const iconOptions = ['📊', '🏦', '📈', '💰', '🛡️', '🏛️', '📦', '👥', '📋', '⚙️'];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    setUploadedFile(file);
    const mockColumns = [
      { id: 'col1', name: 'ID', type: 'text', isKey: true, isDropdown: false },
      { id: 'col2', name: 'Name', type: 'text', isKey: false, isDropdown: true },
      { id: 'col3', name: 'Category', type: 'text', isKey: false, isDropdown: true },
    ];
    const mockPreview = [
      { col1: 'PLT001', col2: 'Sample Item 1', col3: 'Category A' },
      { col1: 'PLT002', col2: 'Sample Item 2', col3: 'Category B' },
    ];
    setPreviewData({ columns: mockColumns, rows: mockPreview, totalRows: 47 });
    
    const baseName = file.name.replace(/\.(csv|xlsx|xls)$/i, '').replace(/[_-]/g, ' ');
    setDatabaseInfo(prev => ({
      ...prev,
      name: baseName.charAt(0).toUpperCase() + baseName.slice(1),
    }));
  };

  const handleCreate = () => {
    const newDatabase = {
      id: `db-${Date.now()}`,
      name: databaseInfo.name,
      description: databaseInfo.description,
      icon: databaseInfo.icon,
      rowCount: previewData.totalRows,
      columnCount: previewData.columns.length,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Tim Hall',
      linkedTo: null,
      linkedFrom: [],
      versions: [{
        id: 'v1',
        date: new Date().toISOString(),
        uploadedBy: 'Tim Hall',
        rowCount: previewData.totalRows,
        filename: uploadedFile.name,
      }],
      columns: previewData.columns,
    };
    onCreated(newDatabase);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: colors.card,
        borderRadius: '16px',
        width: '700px',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, margin: 0 }}>
              Create New Database
            </h2>
            <p style={{ fontSize: '13px', color: colors.textMuted, margin: '4px 0 0 0' }}>
              Step {step} of 2
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: colors.background,
              color: colors.textMuted,
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {step === 1 && (
            <div>
              <div
                onClick={() => document.getElementById('file-input').click()}
                style={{
                  border: `2px dashed ${dragOver ? colors.primary : colors.border}`,
                  borderRadius: '12px',
                  padding: '48px',
                  textAlign: 'center',
                  backgroundColor: dragOver ? colors.primaryLight : colors.background,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                {uploadedFile ? (
                  <>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: colors.text, marginBottom: '8px' }}>
                      {uploadedFile.name}
                    </div>
                    <div style={{ fontSize: '14px', color: colors.textMuted }}>
                      {previewData?.totalRows} rows • {previewData?.columns.length} columns
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: colors.text, marginBottom: '8px' }}>
                      Drop your CSV or Excel file here
                    </div>
                    <div style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '16px' }}>
                      or click to browse
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textMuted,
                  marginBottom: '10px',
                }}>
                  Icon
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setDatabaseInfo({ ...databaseInfo, icon })}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        border: `2px solid ${databaseInfo.icon === icon ? colors.primary : colors.border}`,
                        backgroundColor: databaseInfo.icon === icon ? colors.primaryLight : colors.card,
                        fontSize: '24px',
                        cursor: 'pointer',
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textMuted,
                  marginBottom: '10px',
                }}>
                  Database Name
                </label>
                <input
                  type="text"
                  value={databaseInfo.name}
                  onChange={(e) => setDatabaseInfo({ ...databaseInfo, name: e.target.value })}
                  placeholder="e.g. Investment Platforms"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.card,
                    fontSize: '15px',
                    color: colors.text,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textMuted,
                  marginBottom: '10px',
                }}>
                  Description
                </label>
                <textarea
                  value={databaseInfo.description}
                  onChange={(e) => setDatabaseInfo({ ...databaseInfo, description: e.target.value })}
                  placeholder="Brief description..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.card,
                    fontSize: '15px',
                    color: colors.text,
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
              color: colors.textMuted,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={() => {
              if (step < 2) {
                setStep(step + 1);
              } else {
                handleCreate();
              }
            }}
            disabled={step === 1 && !uploadedFile}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: (step === 1 && !uploadedFile) ? colors.border : colors.primary,
              color: (step === 1 && !uploadedFile) ? colors.textMuted : 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (step === 1 && !uploadedFile) ? 'not-allowed' : 'pointer',
            }}
          >
            {step === 2 ? 'Create Database' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminDataManager() {
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [showNewDatabaseModal, setShowNewDatabaseModal] = useState(false);
  const [databases, setDatabases] = useState(sampleDatabases);

  const handleDatabaseCreated = (newDatabase) => {
    setDatabases([...databases, newDatabase]);
  };

  if (selectedDatabase) {
    return (
      <div style={{ padding: '32px' }}>
        <DatabaseDetailView database={selectedDatabase} onBack={() => setSelectedDatabase(null)} />
      </div>
    );
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
        <button
          onClick={() => setShowNewDatabaseModal(true)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: colors.primary,
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          + New Database
        </button>
      </div>

      <DatabaseListView 
        databases={databases}
        onSelectDatabase={setSelectedDatabase}
        onNewDatabase={() => setShowNewDatabaseModal(true)}
      />

      {showNewDatabaseModal && (
        <NewDatabaseModal 
          onClose={() => setShowNewDatabaseModal(false)}
          onCreated={handleDatabaseCreated}
          existingDatabases={databases}
        />
      )}
    </div>
  );
}