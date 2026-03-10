import React, { useState, useEffect, useCallback } from 'react';
import ClientLayout from '../components/client/ClientLayout';
import { base44 } from '@/api/base44Client';
import { adviceHistoryApi } from '@/api/adviceHistoryApi';
import { formatDate } from '../utils/dateUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, Download, FileText, ClipboardList, BarChart3, Search, Loader2 } from 'lucide-react';

const TYPE_CONFIG = {
  fact_find: {
    label: 'Fact Find',
    icon: ClipboardList,
    bg: '#F0FDF4',
    fg: '#16A34A',
    border: '#BBF7D0',
  },
  strategy_recommendations: {
    label: 'SOA Request',
    icon: FileText,
    bg: '#EEF2FF',
    fg: '#4F46E5',
    border: '#C7D2FE',
  },
  cashflow_model: {
    label: 'Cashflow Model',
    icon: BarChart3,
    bg: '#FFF7ED',
    fg: '#EA580C',
    border: '#FED7AA',
  },
  soa_document: {
    label: 'Statement of Advice',
    icon: FileText,
    bg: '#EEF2FF',
    fg: '#4F46E5',
    border: '#C7D2FE',
  },
  compliance_review: {
    label: 'Compliance Review',
    icon: ClipboardList,
    bg: '#F0FDF4',
    fg: '#16A34A',
    border: '#BBF7D0',
  },
};

function TypeBadge({ type }) {
  const config = TYPE_CONFIG[type] || { label: type, bg: '#F1F5F9', fg: '#475569', border: '#CBD5E1' };
  const Icon = config.icon || FileText;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        background: config.bg,
        color: config.fg,
        border: `1px solid ${config.border}`,
      }}
    >
      <Icon style={{ width: 14, height: 14 }} />
      {config.label}
    </span>
  );
}

export default function ClientAdviceHistory() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [viewingRecord, setViewingRecord] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const loadRecords = useCallback(async (cId) => {
    try {
      const data = await adviceHistoryApi.list(cId);
      setRecords(data);
    } catch (error) {
      console.error('Failed to load advice history:', error);
      setRecords([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        const clients = await base44.entities.Client.filter({ email: user.email });
        if (clients[0]?.id) {
          setClientId(clients[0].id);
          await loadRecords(clients[0].id);
        } else {
          setRecords([]);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadRecords]);

  const handleView = async (record) => {
    if (!clientId) return;
    setViewLoading(true);
    try {
      const full = await adviceHistoryApi.getById(clientId, record.id);
      setViewingRecord(full);
    } catch (error) {
      console.error('Failed to load record:', error);
    } finally {
      setViewLoading(false);
    }
  };

  const handleDownload = (record) => {
    const dateStr = new Date(record.createdAt).toISOString().slice(0, 10);
    const safeName = (record.title || 'record').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeType = (record.recordType || 'record').replace(/\s+/g, '-');
    const fileName = `${safeType}-${safeName}-${dateStr}.json`;

    const source = viewingRecord && viewingRecord.id === record.id ? viewingRecord : null;
    if (source) {
      const combined = combineSnapshots(source);
      if (combined) {
        downloadJson(combined, fileName);
        return;
      }
    }

    // Fetch full record to get snapshots then download
    if (!clientId) return;
    adviceHistoryApi.getById(clientId, record.id).then(full => {
      const combined = combineSnapshots(full);
      downloadJson(combined || '{}', fileName);
    }).catch(err => {
      console.error('Failed to download:', err);
    });
  };

  const filteredRecords = records.filter(r => {
    if (filterType !== 'All' && r.recordType !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const typeLabel = TYPE_CONFIG[r.recordType]?.label || r.recordType || '';
      return (
        (r.title || '').toLowerCase().includes(q) ||
        typeLabel.toLowerCase().includes(q) ||
        (r.createdBy || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <ClientLayout currentPage="ClientAdviceHistory">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 80 }}>
          <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: '#6366F1' }} />
        </div>
      </ClientLayout>
    );
  }

  return (
    <>
      {/* Snapshot Viewer Modal */}
      <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Eye style={{ width: 18, height: 18 }} />
              {viewingRecord?.title || 'Advice Record'}
              <TypeBadge type={viewingRecord?.recordType} />
            </DialogTitle>
          </DialogHeader>
          <div className="text-xs text-slate-500 mb-2">
            Created {formatDate(viewingRecord?.createdAt)} by {viewingRecord?.createdBy || 'Unknown'}
          </div>
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: 16,
              fontFamily: 'monospace',
              fontSize: 12,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {viewingRecord?.factFindSnapshot && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4, fontFamily: 'inherit' }}>Fact Find Snapshot</div>
                {formatSnapshotForDisplay(viewingRecord.factFindSnapshot)}
              </div>
            )}
            {viewingRecord?.adviceModelSnapshot && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4, fontFamily: 'inherit' }}>Advice Model Snapshot</div>
                {formatSnapshotForDisplay(viewingRecord.adviceModelSnapshot)}
              </div>
            )}
            {viewingRecord?.projectionSnapshot && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4, fontFamily: 'inherit' }}>Projection Snapshot</div>
                {formatSnapshotForDisplay(viewingRecord.projectionSnapshot)}
              </div>
            )}
            {!viewingRecord?.factFindSnapshot && !viewingRecord?.adviceModelSnapshot && !viewingRecord?.projectionSnapshot && (
              'No snapshot data'
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ClientLayout currentPage="ClientAdviceHistory">
        <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
              Advice History
            </h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              Immutable point-in-time snapshots of your advice records. Each record is frozen at the moment of creation.
            </p>
          </div>

          {/* Filters Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
              <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                  background: '#fff',
                }}
              />
            </div>

            {/* Type Filter */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ key: 'All', label: 'All' }, { key: 'fact_find', label: 'Fact Find' }, { key: 'strategy_recommendations', label: 'SOA Request' }, { key: 'cashflow_model', label: 'Cashflow Model' }, { key: 'soa_document', label: 'Statement of Advice' }].map(({ key: type, label }) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: filterType === type ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                    background: filterType === type ? '#EEF2FF' : '#fff',
                    color: filterType === type ? '#4F46E5' : '#64748B',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Records Table */}
          {filteredRecords.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#F8FAFC',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
            }}>
              <FileText style={{ width: 40, height: 40, color: '#CBD5E1', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#64748B', margin: '0 0 4px' }}>
                No advice records found
              </p>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
                Records are created when you submit a Fact Find, SOA Request, or build an SOA from a cashflow model.
              </p>
            </div>
          ) : (
            <div style={{
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Created</th>
                    <th style={thStyle}>Created By</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, idx) => (
                    <tr
                      key={record.id}
                      style={{
                        borderBottom: idx < filteredRecords.length - 1 ? '1px solid #F1F5F9' : 'none',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <td style={tdStyle}>
                        <TypeBadge type={record.recordType} />
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#1E293B' }}>
                        {record.title || '—'}
                      </td>
                      <td style={{ ...tdStyle, color: '#64748B', fontSize: 13 }}>
                        {formatDate(record.createdAt)}
                      </td>
                      <td style={{ ...tdStyle, color: '#64748B', fontSize: 13 }}>
                        {record.createdBy || '—'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleView(record)}
                            disabled={viewLoading}
                            style={actionBtnStyle}
                            title="View snapshot"
                          >
                            <Eye style={{ width: 14, height: 14 }} />
                            View
                          </button>
                          <button
                            onClick={() => handleDownload(record)}
                            style={actionBtnStyle}
                            title="Download as JSON"
                          >
                            <Download style={{ width: 14, height: 14 }} />
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Record Count */}
          {records.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 12, color: '#94A3B8' }}>
              Showing {filteredRecords.length} of {records.length} records
            </div>
          )}
        </div>
      </ClientLayout>
    </>
  );
}

const thStyle = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: 14,
};

const actionBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '5px 10px',
  borderRadius: 6,
  border: '1px solid #E2E8F0',
  background: '#fff',
  fontSize: 12,
  fontWeight: 600,
  color: '#475569',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

function combineSnapshots(record) {
  const combined = {};
  if (record.factFindSnapshot) combined.factFindSnapshot = record.factFindSnapshot;
  if (record.adviceModelSnapshot) combined.adviceModelSnapshot = record.adviceModelSnapshot;
  if (record.projectionSnapshot) combined.projectionSnapshot = record.projectionSnapshot;
  if (Object.keys(combined).length === 0) return null;
  return JSON.stringify(combined, null, 2);
}

function formatSnapshotForDisplay(snapshotJson) {
  try {
    const parsed = JSON.parse(snapshotJson);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return snapshotJson;
  }
}

function downloadJson(jsonString, fileName) {
  let formatted = jsonString;
  try {
    formatted = JSON.stringify(JSON.parse(jsonString), null, 2);
  } catch { /* use as-is */ }

  const blob = new Blob([formatted], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
