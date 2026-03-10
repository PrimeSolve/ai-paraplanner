import React, { useState, useEffect, useCallback } from 'react';
import ClientLayout from '../components/client/ClientLayout';
import { base44 } from '@/api/base44Client';
import axiosInstance from '@/api/axiosInstance';
import { formatDate } from '../utils/dateUtils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, Eye, Download, FileText, ClipboardList, TrendingUp, Search } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_CONFIG = {
  'SOA Request':     { icon: ClipboardList, color: '#2563eb', bg: '#DBEAFE', label: 'SOA Request' },
  'Fact Find':       { icon: FileText,      color: '#059669', bg: '#D1FAE5', label: 'Fact Find' },
  'Cashflow Model':  { icon: TrendingUp,    color: '#7C3AED', bg: '#EDE9FE', label: 'Cashflow Model' },
};

export default function ClientAdviceHistory() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [viewRecord, setViewRecord] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const loadRecords = useCallback(async (cId) => {
    try {
      const response = await axiosInstance.get(`/clients/${cId}/advice-history`);
      const data = Array.isArray(response.data) ? response.data : [];
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
        // Try to get client from URL or from user's associated clients
        const urlParams = new URLSearchParams(window.location.search);
        let cId = urlParams.get('clientId') || urlParams.get('client_id');

        if (!cId) {
          // For adviser view, get client from the client sidebar context
          const clients = await base44.entities.Client.filter({ email: user.email });
          if (clients[0]?.id) {
            cId = clients[0].id;
          }
        }

        if (cId) {
          setClientId(cId);
          await loadRecords(cId);
        }
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadRecords]);

  const handleView = async (record) => {
    setViewLoading(true);
    try {
      const response = await axiosInstance.get(`/clients/${clientId}/advice-history/${record.id}`);
      setViewRecord(response.data);
    } catch (error) {
      console.error('Failed to load record:', error);
      toast.error('Failed to load record details');
    } finally {
      setViewLoading(false);
    }
  };

  const handleDownload = (record) => {
    // If we already have the full record with snapshot, use it directly
    const download = async () => {
      try {
        const response = await axiosInstance.get(`/clients/${clientId}/advice-history/${record.id}`);
        const data = response.data;
        const snapshot = data.snapshotJson || '{}';
        const dateStr = new Date(data.createdAt).toISOString().split('T')[0];
        const safeName = (data.name || 'record').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-');
        const safeType = (data.type || 'record').replace(/\s+/g, '-');
        const fileName = `${safeType}-${safeName}-${dateStr}.json`;

        const blob = new Blob([snapshot], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to download:', error);
        toast.error('Failed to download record');
      }
    };
    download();
  };

  const filteredRecords = records.filter(r => {
    const matchesType = filterType === 'All' || r.type === filterType;
    const matchesSearch = !searchQuery ||
      (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.createdBy || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <ClientLayout currentPage="ClientAdviceHistory">
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout currentPage="ClientAdviceHistory">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            Advice History
          </h1>
          <p className="text-slate-500 mt-1 ml-[52px]">
            Point-in-time snapshots of your advice records, frozen at the moment they were created.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type filter pills */}
            <div className="flex gap-2">
              {['All', 'SOA Request', 'Fact Find', 'Cashflow Model'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterType === type
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Records Table */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No advice records yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Records are automatically created when you submit a Fact Find, submit an SOA Request, or build an SOA from a cashflow model.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created By</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, idx) => {
                  const cfg = TYPE_CONFIG[record.type] || TYPE_CONFIG['SOA Request'];
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={record.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        idx === filteredRecords.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: cfg.bg }}
                          >
                            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                          </div>
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: cfg.bg, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-800">{record.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {formatDate(record.createdAt, undefined, undefined, 'N/A')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{record.createdBy}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(record)}
                            className="text-xs"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(record)}
                            className="text-xs"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Record count */}
        {filteredRecords.length > 0 && (
          <p className="text-xs text-slate-400 text-right">
            Showing {filteredRecords.length} of {records.length} records
          </p>
        )}
      </div>

      {/* View Snapshot Modal */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {viewRecord && (() => {
                const cfg = TYPE_CONFIG[viewRecord.type] || TYPE_CONFIG['SOA Request'];
                const Icon = cfg.icon;
                return (
                  <>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div className="text-lg">{viewRecord.name}</div>
                      <div className="text-sm font-normal text-slate-500">
                        {viewRecord.type} — {formatDate(viewRecord.createdAt, undefined, undefined, 'N/A')} by {viewRecord.createdBy}
                      </div>
                    </div>
                  </>
                );
              })()}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh] mt-4">
            {viewLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : viewRecord?.snapshotJson ? (
              <pre className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 whitespace-pre-wrap overflow-x-auto font-mono">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(viewRecord.snapshotJson), null, 2);
                  } catch {
                    return viewRecord.snapshotJson;
                  }
                })()}
              </pre>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No snapshot data available.</p>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setViewRecord(null)}>
              Close
            </Button>
            {viewRecord && (
              <Button onClick={() => handleDownload(viewRecord)}>
                <Download className="w-4 h-4 mr-2" />
                Download JSON
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ClientLayout>
  );
}
