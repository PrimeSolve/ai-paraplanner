import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@/api/axiosInstance';
import {
  Home,
  ChevronRight,
  Database,
  Layers,
  Calendar,
  AlertCircle,
  Search,
  Upload,
  Eye,
  MoreHorizontal,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

// ============================================
// DESIGN TOKENS
// ============================================
const colors = {
  core: {
    navy: '#1e293b',
    slate: '#475569',
    slateLight: '#64748b',
    grey: '#94a3b8',
    greyLight: '#e2e8f0',
    offWhite: '#f8fafc',
    white: '#ffffff',
  },
  accent: {
    teal: '#14b8a6',
    tealDeep: '#0d9488',
    blue: '#3b82f6',
    blueDeep: '#1d4ed8',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    purple: '#8b5cf6',
    cyan: '#06b6d4',
  }
};

const spinnerKeyframes = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

const Spinner = ({ size = 24 }) => (
  <div
    style={{
      width: size,
      height: size,
      border: `3px solid ${colors.core.greyLight}`,
      borderTopColor: colors.accent.teal,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }}
  />
);

// ============================================
// KPI CARD COMPONENT
// ============================================
const KpiCard = ({ icon: Icon, value, label, barColor }) => (
  <div style={{
    background: colors.core.white,
    borderRadius: '16px',
    padding: '20px 24px',
    border: `1px solid ${colors.core.greyLight}`,
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: barColor,
    }} />
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${barColor}15`,
      }}>
        <Icon size={20} color={barColor} />
      </div>
    </div>
    <div style={{
      fontSize: '28px',
      fontWeight: 700,
      color: colors.core.navy,
      marginBottom: '4px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {value}
    </div>
    <div style={{
      fontSize: '13px',
      color: colors.core.slateLight,
    }}>
      {label}
    </div>
  </div>
);

// ============================================
// STATUS BADGE
// ============================================
const StatusBadge = ({ status }) => {
  const map = {
    'Active': { bg: 'rgba(16, 185, 129, 0.1)', color: colors.accent.success },
    'Inactive': { bg: 'rgba(148, 163, 184, 0.15)', color: colors.core.grey },
    'Review': { bg: 'rgba(245, 158, 11, 0.1)', color: colors.accent.warning },
  };
  const style = map[status] || map['Active'];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '4px 10px',
      borderRadius: '6px',
      background: style.bg,
      color: style.color,
      fontSize: '12px',
      fontWeight: 600,
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: style.color,
      }} />
      {status}
    </span>
  );
};

// ============================================
// TYPE PILL
// ============================================
const TypePill = ({ type }) => (
  <span style={{
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    background: colors.core.offWhite,
    border: `1px solid ${colors.core.greyLight}`,
    color: colors.core.slate,
    fontSize: '12px',
    fontWeight: 500,
  }}>
    {type || '—'}
  </span>
);

// ============================================
// FUND OPTIONS PANEL (kept from original)
// ============================================
const FundOptionsPanel = ({ fundId }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    axiosInstance.get(`/funds/${fundId}/options`)
      .then((res) => {
        if (!cancelled) setOptions(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load fund options.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [fundId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 24px', color: colors.core.slateLight, fontSize: '14px' }}>
        <Spinner size={18} />
        Loading options...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px 24px', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: colors.accent.error, fontSize: '14px', borderRadius: '8px', margin: '8px 16px 16px' }}>
        {error}
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div style={{ padding: '16px 24px', color: colors.core.slateLight, fontSize: '14px' }}>
        No options available for this fund.
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: colors.core.offWhite }}>
            {['Name', 'Risk Level', '1yr', '3yr', '5yr', '10yr', 'ICR'].map((col) => (
              <th key={col} style={{
                padding: '10px 14px',
                textAlign: 'left',
                fontSize: '11px',
                fontWeight: 700,
                color: colors.core.slateLight,
                borderBottom: `1px solid ${colors.core.greyLight}`,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {options.map((opt, idx) => (
            <tr key={opt.id || idx} style={{ borderBottom: `1px solid ${colors.core.greyLight}` }}>
              <td style={{ padding: '10px 14px', fontSize: '13px', color: colors.core.navy }}>{opt.name}</td>
              <td style={{ padding: '10px 14px', fontSize: '13px' }}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  backgroundColor: opt.riskLevel === 'High' ? 'rgba(239, 68, 68, 0.1)'
                    : opt.riskLevel === 'Medium' ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(16, 185, 129, 0.1)',
                  color: opt.riskLevel === 'High' ? colors.accent.error
                    : opt.riskLevel === 'Medium' ? colors.accent.warning
                    : colors.accent.success,
                }}>
                  {opt.riskLevel}
                </span>
              </td>
              <td style={{ padding: '10px 14px', fontSize: '13px', color: colors.core.navy }}>{opt.return1yr != null ? `${opt.return1yr}%` : '-'}</td>
              <td style={{ padding: '10px 14px', fontSize: '13px', color: colors.core.navy }}>{opt.return3yr != null ? `${opt.return3yr}%` : '-'}</td>
              <td style={{ padding: '10px 14px', fontSize: '13px', color: colors.core.navy }}>{opt.return5yr != null ? `${opt.return5yr}%` : '-'}</td>
              <td style={{ padding: '10px 14px', fontSize: '13px', color: colors.core.navy }}>{opt.return10yr != null ? `${opt.return10yr}%` : '-'}</td>
              <td style={{ padding: '10px 14px', fontSize: '13px', color: colors.core.navy }}>{opt.icr != null ? `${opt.icr}%` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function AdminDataManager() {
  const [funds, setFunds] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('funds');
  const [expandedFundId, setExpandedFundId] = useState(null);

  // Fetch funds
  useEffect(() => {
    setLoading(true);
    setError(null);

    axiosInstance.get('/funds')
      .then((res) => {
        console.log('[AdminDataManager] funds response:', res.data);
        setFunds(res.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load funds.'))
      .finally(() => setLoading(false));
  }, []);

  // Fetch investment options count
  useEffect(() => {
    setOptionsLoading(true);
    axiosInstance.get('/funds/options')
      .then((res) => {
        setOptions(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        setOptions([]);
      })
      .finally(() => setOptionsLoading(false));
  }, []);

  // Derive fund types for filter dropdown
  const fundTypes = useMemo(() => {
    const types = new Set(funds.map(f => f.fundType).filter(Boolean));
    return ['All', ...Array.from(types).sort()];
  }, [funds]);

  // Filtered funds
  const filteredFunds = useMemo(() => {
    let result = funds;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (f) =>
          (f.provider || '').toLowerCase().includes(term) ||
          (f.fundType || '').toLowerCase().includes(term) ||
          (f.name || '').toLowerCase().includes(term) ||
          (f.apirCode || '').toLowerCase().includes(term)
      );
    }

    if (typeFilter !== 'All') {
      result = result.filter(f => f.fundType === typeFilter);
    }

    if (statusFilter !== 'All') {
      result = result.filter(f => (f.status || 'Active') === statusFilter);
    }

    return result;
  }, [funds, searchTerm, typeFilter, statusFilter]);

  const handleRowClick = (fundId) => {
    setExpandedFundId((prev) => (prev === fundId ? null : fundId));
  };

  // Mock import history (placeholder for real data)
  const importHistory = [
    { id: 1, date: '2026-03-28', file: 'pds-library-march-2026.csv', records: 7594, status: 'Completed' },
    { id: 2, date: '2026-03-15', file: 'fund-options-update.csv', records: 342, status: 'Completed' },
    { id: 3, date: '2026-03-01', file: 'pds-library-march-2026-patch.csv', records: 128, status: 'Completed' },
    { id: 4, date: '2026-02-28', file: 'pds-library-feb-2026.csv', records: 7412, status: 'Completed' },
    { id: 5, date: '2026-02-15', file: 'etf-data-update.csv', records: 89, status: 'Failed' },
  ];

  const tabs = [
    { id: 'funds', label: 'Investment Funds' },
    { id: 'options', label: 'Investment Options' },
    { id: 'history', label: 'Import History' },
  ];

  return (
    <>
      <style>{spinnerKeyframes}</style>
      <div style={{ padding: '24px 32px' }}>

        {/* BREADCRUMB */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
          fontSize: '13px',
          color: colors.core.grey,
        }}>
          <Home size={14} />
          <ChevronRight size={12} />
          <span style={{ color: colors.core.slateLight, fontWeight: 500 }}>Data Manager</span>
        </div>

        {/* PAGE HEADER */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 700,
            color: colors.core.navy,
            margin: '0 0 4px 0',
            fontFamily: "'Syne', 'Plus Jakarta Sans', sans-serif",
          }}>
            Data Manager
          </h1>
          <p style={{
            fontSize: '14px',
            color: colors.core.slateLight,
            margin: 0,
          }}>
            Manage investment fund library and model portfolio data
          </p>
        </div>

        {/* KPI ROW */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '24px',
        }}>
          <KpiCard
            icon={Database}
            value={loading ? '...' : funds.length.toLocaleString()}
            label="Investment Funds"
            barColor={colors.accent.teal}
          />
          <KpiCard
            icon={Layers}
            value={optionsLoading ? '...' : options.length.toLocaleString()}
            label="Investment Options"
            barColor={colors.accent.blue}
          />
          <KpiCard
            icon={Calendar}
            value={importHistory.length > 0 ? importHistory[0].date : '—'}
            label="Last Import"
            barColor={colors.accent.success}
          />
          <KpiCard
            icon={AlertCircle}
            value={funds.filter(f => (f.status || '') === 'Review').length}
            label="Pending Review"
            barColor={colors.accent.warning}
          />
        </div>

        {/* TAB ROW */}
        <div style={{
          display: 'flex',
          gap: '0',
          borderBottom: `1px solid ${colors.core.greyLight}`,
          marginBottom: '24px',
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? colors.core.navy : colors.core.slateLight,
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${colors.accent.teal}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* INVESTMENT FUNDS TAB */}
        {activeTab === 'funds' && (
          <>
            {/* FILTERS BAR */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap',
            }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
                <Search size={16} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.core.grey,
                  pointerEvents: 'none',
                }} />
                <input
                  type="text"
                  placeholder="Search funds by name or APIR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '10px',
                    border: `1px solid ${colors.core.greyLight}`,
                    backgroundColor: colors.core.white,
                    fontSize: '14px',
                    color: colors.core.navy,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Type filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.core.greyLight}`,
                  backgroundColor: colors.core.white,
                  fontSize: '14px',
                  color: colors.core.slate,
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: '160px',
                }}
              >
                {fundTypes.map(t => (
                  <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.core.greyLight}`,
                  backgroundColor: colors.core.white,
                  fontSize: '14px',
                  color: colors.core.slate,
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: '140px',
                }}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Review">Review</option>
              </select>

              {/* Results count */}
              <span style={{
                fontSize: '13px',
                color: colors.core.grey,
                whiteSpace: 'nowrap',
              }}>
                {filteredFunds.length.toLocaleString()} results
              </span>

              {/* Import Data button */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openNewDatabaseDialog'))}
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: `linear-gradient(135deg, ${colors.accent.teal}, ${colors.accent.tealDeep})`,
                  color: colors.core.white,
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Upload size={16} />
                Import Data
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 0',
                gap: '16px',
              }}>
                <Spinner size={36} />
                <span style={{ fontSize: '14px', color: colors.core.slateLight }}>Loading funds...</span>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div style={{
                padding: '20px 24px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: colors.accent.error,
                borderRadius: '12px',
                fontSize: '14px',
                textAlign: 'center',
              }}>
                {error}
              </div>
            )}

            {/* Funds Table */}
            {!loading && !error && (
              <div style={{
                backgroundColor: colors.core.white,
                borderRadius: '16px',
                border: `1px solid ${colors.core.greyLight}`,
                overflow: 'hidden',
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: colors.core.offWhite }}>
                        {[
                          { label: 'FUND NAME', width: '2.5fr' },
                          { label: 'ISSUER', width: '1fr' },
                          { label: 'TYPE', width: '1fr' },
                          { label: 'APIR', width: '1fr' },
                          { label: 'STATUS', width: '1fr' },
                          { label: 'ACTIONS', width: '1fr' },
                        ].map((col) => (
                          <th key={col.label} style={{
                            padding: '14px 20px',
                            textAlign: 'left',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: colors.core.slateLight,
                            borderBottom: `1px solid ${colors.core.greyLight}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap',
                          }}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFunds.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{
                            padding: '48px',
                            textAlign: 'center',
                            color: colors.core.grey,
                            fontSize: '14px',
                          }}>
                            {searchTerm || typeFilter !== 'All' || statusFilter !== 'All'
                              ? 'No funds match your filters.'
                              : 'No funds found.'}
                          </td>
                        </tr>
                      ) : (
                        filteredFunds.map((fund) => (
                          <React.Fragment key={fund.id}>
                            <tr
                              style={{
                                borderBottom: `1px solid ${colors.core.greyLight}`,
                                cursor: 'pointer',
                                backgroundColor: expandedFundId === fund.id ? `${colors.accent.teal}08` : 'transparent',
                                transition: 'background-color 0.15s ease',
                              }}
                              onMouseOver={(e) => {
                                if (expandedFundId !== fund.id) e.currentTarget.style.backgroundColor = colors.core.offWhite;
                              }}
                              onMouseOut={(e) => {
                                if (expandedFundId !== fund.id) e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              {/* FUND NAME */}
                              <td style={{ padding: '14px 20px', maxWidth: '280px' }}>
                                <div style={{
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  color: colors.core.navy,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {fund.name || fund.provider || '—'}
                                </div>
                                {fund.subLabel && (
                                  <div style={{
                                    fontSize: '12px',
                                    color: colors.core.grey,
                                    marginTop: '2px',
                                  }}>
                                    {fund.subLabel}
                                  </div>
                                )}
                              </td>

                              {/* ISSUER */}
                              <td style={{ padding: '14px 20px' }}>
                                <span style={{
                                  fontSize: '12px',
                                  color: colors.core.slateLight,
                                }}>
                                  {fund.provider || '—'}
                                </span>
                              </td>

                              {/* TYPE */}
                              <td style={{ padding: '14px 20px' }}>
                                <TypePill type={fund.fundType} />
                              </td>

                              {/* APIR */}
                              <td style={{ padding: '14px 20px' }}>
                                <span style={{
                                  fontSize: '11px',
                                  color: colors.core.grey,
                                  fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                                  letterSpacing: '0.3px',
                                }}>
                                  {fund.apirCode || '—'}
                                </span>
                              </td>

                              {/* STATUS */}
                              <td style={{ padding: '14px 20px' }}>
                                <StatusBadge status={fund.status || 'Active'} />
                              </td>

                              {/* ACTIONS */}
                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRowClick(fund.id);
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      color: colors.accent.blue,
                                      background: 'rgba(59, 130, 246, 0.08)',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Eye size={13} />
                                    View
                                  </button>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '28px',
                                      height: '28px',
                                      fontSize: '16px',
                                      color: colors.core.grey,
                                      background: 'none',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <MoreHorizontal size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded row: fund options */}
                            {expandedFundId === fund.id && (
                              <tr>
                                <td colSpan={6} style={{ padding: 0, backgroundColor: colors.core.offWhite }}>
                                  <FundOptionsPanel fundId={fund.id} />
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* INVESTMENT OPTIONS TAB */}
        {activeTab === 'options' && (
          <div style={{
            backgroundColor: colors.core.white,
            borderRadius: '16px',
            border: `1px solid ${colors.core.greyLight}`,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${colors.core.greyLight}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: colors.core.navy,
                margin: 0,
              }}>
                Investment Options
              </h3>
              <span style={{ fontSize: '13px', color: colors.core.grey }}>
                {optionsLoading ? '...' : `${options.length.toLocaleString()} options`}
              </span>
            </div>

            {optionsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
                <Spinner size={24} />
                <span style={{ fontSize: '14px', color: colors.core.slateLight }}>Loading options...</span>
              </div>
            ) : options.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: colors.core.grey, fontSize: '14px' }}>
                No investment options loaded. Use Import Data to add options.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.core.offWhite }}>
                      {['OPTION NAME', 'FUND', 'RISK LEVEL', 'ICR', 'STATUS'].map((col) => (
                        <th key={col} style={{
                          padding: '14px 20px',
                          textAlign: 'left',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: colors.core.slateLight,
                          borderBottom: `1px solid ${colors.core.greyLight}`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {options.slice(0, 50).map((opt, idx) => (
                      <tr key={opt.id || idx} style={{
                        borderBottom: `1px solid ${colors.core.greyLight}`,
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = colors.core.offWhite}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 500, color: colors.core.navy }}>
                          {opt.name || '—'}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '12px', color: colors.core.slateLight }}>
                          {opt.fundName || '—'}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                          {opt.riskLevel ? (
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 500,
                              backgroundColor: opt.riskLevel === 'High' ? 'rgba(239, 68, 68, 0.1)'
                                : opt.riskLevel === 'Medium' ? 'rgba(245, 158, 11, 0.1)'
                                : 'rgba(16, 185, 129, 0.1)',
                              color: opt.riskLevel === 'High' ? colors.accent.error
                                : opt.riskLevel === 'Medium' ? colors.accent.warning
                                : colors.accent.success,
                            }}>
                              {opt.riskLevel}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: colors.core.navy }}>
                          {opt.icr != null ? `${opt.icr}%` : '—'}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <StatusBadge status={opt.status || 'Active'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* IMPORT HISTORY TAB */}
        {activeTab === 'history' && (
          <div style={{
            backgroundColor: colors.core.white,
            borderRadius: '16px',
            border: `1px solid ${colors.core.greyLight}`,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${colors.core.greyLight}`,
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: colors.core.navy,
                margin: 0,
              }}>
                Import History
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: colors.core.offWhite }}>
                    {['DATE', 'FILE', 'RECORDS IMPORTED', 'STATUS', 'ACTIONS'].map((col) => (
                      <th key={col} style={{
                        padding: '14px 20px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: colors.core.slateLight,
                        borderBottom: `1px solid ${colors.core.greyLight}`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importHistory.map((item) => (
                    <tr key={item.id} style={{
                      borderBottom: `1px solid ${colors.core.greyLight}`,
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = colors.core.offWhite}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: colors.core.navy, fontWeight: 500 }}>
                        {item.date}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={14} color={colors.core.grey} />
                          <span style={{ fontSize: '13px', color: colors.core.slate }}>
                            {item.file}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: colors.core.navy }}>
                        {item.records.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: item.status === 'Completed'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                          color: item.status === 'Completed'
                            ? colors.accent.success
                            : colors.accent.error,
                        }}>
                          {item.status === 'Completed'
                            ? <CheckCircle size={12} />
                            : <XCircle size={12} />
                          }
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: colors.accent.blue,
                          background: 'rgba(59, 130, 246, 0.08)',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}>
                          <Eye size={13} />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
