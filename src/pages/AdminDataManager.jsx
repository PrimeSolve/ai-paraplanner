import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@/api/axiosInstance';

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

const Spinner = ({ size = 24 }) => (
  <div
    style={{
      width: size,
      height: size,
      border: `3px solid ${colors.border}`,
      borderTopColor: colors.primary,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }}
  />
);

const spinnerKeyframes = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 24px', color: colors.textMuted, fontSize: '14px' }}>
        <Spinner size={18} />
        Loading options...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px 24px', backgroundColor: colors.errorBg, color: colors.error, fontSize: '14px', borderRadius: '8px', margin: '8px 16px 16px' }}>
        {error}
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div style={{ padding: '16px 24px', color: colors.textMuted, fontSize: '14px' }}>
        No options available for this fund.
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: colors.primaryLight }}>
            {['Name', 'Risk Level', '1yr', '3yr', '5yr', '10yr', 'ICR'].map((col) => (
              <th key={col} style={{
                padding: '10px 14px',
                textAlign: 'left',
                fontSize: '11px',
                fontWeight: '600',
                color: colors.primary,
                borderBottom: `1px solid ${colors.border}`,
              }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {options.map((opt, idx) => (
            <tr key={opt.id || idx} style={{ borderBottom: `1px solid ${colors.border}` }}>
              <td style={{ padding: '10px 14px', fontSize: '13px', color: colors.text }}>{opt.name}</td>
              <td style={{ padding: '10px 14px', fontSize: '13px', color: colors.text }}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: opt.riskLevel === 'High' ? colors.errorBg
                    : opt.riskLevel === 'Medium' ? colors.warningBg
                    : colors.successBg,
                  color: opt.riskLevel === 'High' ? colors.error
                    : opt.riskLevel === 'Medium' ? colors.warning
                    : colors.success,
                }}>
                  {opt.riskLevel}
                </span>
              </td>
              <td style={{ padding: '10px 14px', fontSize: '13px', color: colors.text }}>{opt.return1yr != null ? `${opt.return1yr}%` : '-'}</td>
              <td style={{ padding: '10px 14px', fontSize: '13px', color: colors.text }}>{opt.return3yr != null ? `${opt.return3yr}%` : '-'}</td>
              <td style={{ padding: '10px 14px', fontSize: '13px', color: colors.text }}>{opt.return5yr != null ? `${opt.return5yr}%` : '-'}</td>
              <td style={{ padding: '10px 14px', fontSize: '13px', color: colors.text }}>{opt.return10yr != null ? `${opt.return10yr}%` : '-'}</td>
              <td style={{ padding: '10px 14px', fontSize: '13px', color: colors.text }}>{opt.iCR != null ? `${opt.iCR}%` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function AdminDataManager() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFundId, setExpandedFundId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    axiosInstance.get('/funds')
      .then((res) => setFunds(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load funds.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredFunds = useMemo(() => {
    if (!searchTerm.trim()) return funds;
    const term = searchTerm.toLowerCase();
    return funds.filter(
      (f) =>
        (f.provider || '').toLowerCase().includes(term) ||
        (f.schemeName || '').toLowerCase().includes(term)
    );
  }, [funds, searchTerm]);

  const handleRowClick = (fundId) => {
    setExpandedFundId((prev) => (prev === fundId ? null : fundId));
  };

  return (
    <>
      <style>{spinnerKeyframes}</style>
      <div style={{ padding: '32px' }}>
        {/* Search bar */}
        <div style={{
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <span style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.textLight,
              fontSize: '16px',
              pointerEvents: 'none',
            }}>
              &#128269;
            </span>
            <input
              type="text"
              placeholder="Search by provider or scheme name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                borderRadius: '10px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.card,
                fontSize: '14px',
                color: colors.text,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Loading state */}
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
            <span style={{ fontSize: '14px', color: colors.textMuted }}>Loading funds...</span>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div style={{
            padding: '20px 24px',
            backgroundColor: colors.errorBg,
            color: colors.error,
            borderRadius: '12px',
            fontSize: '14px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Funds table */}
        {!loading && !error && (
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
                    {['Provider', 'Scheme Name', 'Fund Type'].map((col) => (
                      <th key={col} style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: colors.textMuted,
                        borderBottom: `1px solid ${colors.border}`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFunds.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: colors.textMuted, fontSize: '14px' }}>
                        {searchTerm ? 'No funds match your search.' : 'No funds found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredFunds.map((fund) => (
                      <React.Fragment key={fund.id}>
                        <tr
                          onClick={() => handleRowClick(fund.id)}
                          style={{
                            borderBottom: `1px solid ${colors.border}`,
                            cursor: 'pointer',
                            backgroundColor: expandedFundId === fund.id ? colors.primaryLight : 'transparent',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseOver={(e) => {
                            if (expandedFundId !== fund.id) e.currentTarget.style.backgroundColor = colors.background;
                          }}
                          onMouseOut={(e) => {
                            if (expandedFundId !== fund.id) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td style={{ padding: '14px 16px', fontSize: '14px', color: colors.text, fontWeight: '500' }}>
                            {fund.provider}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '14px', color: colors.text }}>
                            {fund.schemeName}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: colors.accentLight,
                              color: colors.accent,
                              fontSize: '12px',
                              fontWeight: '500',
                            }}>
                              {fund.fundType}
                            </span>
                          </td>
                        </tr>
                        {expandedFundId === fund.id && (
                          <tr>
                            <td colSpan={3} style={{ padding: 0, backgroundColor: colors.background }}>
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
      </div>
    </>
  );
}
