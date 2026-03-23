import React, { useState, useEffect, useCallback } from 'react';

import { base44 } from '@/api/base44Client';
import { adviceHistoryApi } from '@/api/adviceHistoryApi';
import { formatDate } from '../utils/dateUtils';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, Download, FileText, ClipboardList, BarChart3, Search, Loader2, Clock, CheckCircle2 } from 'lucide-react';

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
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold"
      style={{
        background: config.bg,
        color: config.fg,
        border: `1px solid ${config.border}`,
      }}
    >
      <Icon className="w-3.5 h-3.5" />
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

  const stats = {
    factFinds: records.filter(r => r.recordType === 'fact_find').length,
    soaRequests: records.filter(r => r.recordType === 'strategy_recommendations').length,
    cashflowModels: records.filter(r => r.recordType === 'cashflow_model').length,
    statementsOfAdvice: records.filter(r => r.recordType === 'soa_document').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
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

      <div className="py-6 px-8">
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <ClipboardList className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-4xl font-bold text-slate-800 mb-1">{stats.factFinds}</div>
              <div className="text-sm text-slate-600">Fact Finds</div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-4xl font-bold text-slate-800 mb-1">{stats.soaRequests}</div>
              <div className="text-sm text-slate-600">SOA Requests</div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-4xl font-bold text-slate-800 mb-1">{stats.cashflowModels}</div>
              <div className="text-sm text-slate-600">Cashflow Models</div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-4xl font-bold text-slate-800 mb-1">{stats.statementsOfAdvice}</div>
              <div className="text-sm text-slate-600">Statements of Advice</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 mb-6">
            <div className="p-6 flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by client name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-slate-200"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-40 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors px-4"
              >
                <option value="All">All Types</option>
                <option value="fact_find">Fact Find</option>
                <option value="strategy_recommendations">SOA Request</option>
                <option value="cashflow_model">Cashflow Model</option>
                <option value="soa_document">Statement of Advice</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Title</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Created By</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <TypeBadge type={record.recordType} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-sm text-slate-800">{record.title || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-800">{formatDate(record.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-800">{record.createdBy || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(record)}
                            disabled={viewLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                            title="View snapshot"
                          >
                            {viewLoading ? <Loader2 className="animate-spin w-4 h-4 inline" /> : 'View'}
                          </button>
                          <button
                            onClick={() => handleDownload(record)}
                            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                            title="Download as JSON"
                          >
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-600">
                        No advice records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Record Count */}
            {records.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm text-slate-600">Showing {filteredRecords.length} of {records.length} records</span>
              </div>
            )}
          </div>
        </div>
    </>
  );
}

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
