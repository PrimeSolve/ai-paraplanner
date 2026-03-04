import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  FileText,
  ClipboardCheck,
  TrendingUp,
  ScrollText,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  User,
  Calendar,
  Hash,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { formatDate } from '../utils/dateUtils';

const RECORD_TYPE_CONFIG = {
  fact_find: { label: 'Fact Find', icon: ClipboardCheck, color: 'bg-blue-100 text-blue-700' },
  strategy_recommendations: { label: 'Strategy Recommendations', icon: ScrollText, color: 'bg-purple-100 text-purple-700' },
  cashflow_model: { label: 'Cashflow Model', icon: TrendingUp, color: 'bg-orange-100 text-orange-700' },
  soa_document: { label: 'Statement of Advice', icon: FileText, color: 'bg-teal-100 text-teal-700' },
  compliance_review: { label: 'Compliance Review', icon: ShieldCheck, color: 'bg-green-100 text-green-700' },
};

const STATUS_CONFIG = {
  Pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
  'In Progress': { color: 'bg-blue-100 text-blue-700', icon: Clock },
  Completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  Approved: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  Archived: { color: 'bg-slate-100 text-slate-500', icon: Archive },
  Superseded: { color: 'bg-slate-100 text-slate-500', icon: Archive },
  'Requires Changes': { color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

function SnapshotSection({ title, data, icon: Icon }) {
  if (!data) return null;

  let parsed = data;
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data);
    } catch {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {Icon && <Icon className="w-5 h-5 text-slate-500" />}
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 rounded-lg p-4 max-h-96 overflow-auto">
              {data}
            </pre>
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-slate-500" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SnapshotTree data={parsed} />
      </CardContent>
    </Card>
  );
}

function SnapshotTree({ data, depth = 0 }) {
  if (data === null || data === undefined) {
    return <span className="text-slate-400 italic">null</span>;
  }

  if (typeof data !== 'object') {
    return <span className="text-slate-700">{String(data)}</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-slate-400 italic">Empty list</span>;
    }
    return (
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="border-l-2 border-slate-200 pl-4">
            <div className="text-xs text-slate-400 font-mono mb-1">#{idx + 1}</div>
            <SnapshotTree data={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <span className="text-slate-400 italic">Empty</span>;
  }

  return (
    <div className={`space-y-2 ${depth > 0 ? 'border-l-2 border-slate-100 pl-4' : ''}`}>
      {entries.map(([key, value]) => {
        const isNested = value !== null && typeof value === 'object';
        const displayKey = key
          .replace(/_/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .replace(/^\w/, (c) => c.toUpperCase())
          .trim();

        if (isNested) {
          return (
            <div key={key}>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                {displayKey}
              </div>
              <SnapshotTree data={value} depth={depth + 1} />
            </div>
          );
        }

        return (
          <div key={key} className="flex items-start gap-3 py-1">
            <span className="text-sm text-slate-500 min-w-[140px] flex-shrink-0">{displayKey}</span>
            <span className="text-sm text-slate-800 font-medium">{String(value ?? '\u2014')}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdviserAdviceRecordDetail() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState('');
  const [adviserName, setAdviserName] = useState('');
  const [supersededByRecord, setSupersededByRecord] = useState(null);

  useEffect(() => {
    loadRecord();
  }, []);

  const loadRecord = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');

      if (!id) {
        setLoading(false);
        return;
      }

      const results = await base44.entities.AdviceRecord.filter({ id });
      const rec = results[0];
      if (!rec) {
        setLoading(false);
        return;
      }

      setRecord(rec);

      // Load client name
      if (rec.client_id) {
        try {
          const clients = await base44.entities.Client.filter({ id: rec.client_id });
          if (clients[0]) {
            setClientName(`${clients[0].first_name || ''} ${clients[0].last_name || ''}`.trim());
          }
        } catch { /* skip */ }
      }

      // Load adviser name
      if (rec.adviser_id) {
        try {
          const advisers = await base44.entities.User.filter({ id: rec.adviser_id });
          if (advisers[0]) {
            setAdviserName(`${advisers[0].first_name || ''} ${advisers[0].last_name || ''}`.trim());
          }
        } catch { /* skip */ }
      }

      // Load superseded-by record
      if (rec.superseded_by_id) {
        try {
          const superseded = await base44.entities.AdviceRecord.filter({ id: rec.superseded_by_id });
          if (superseded[0]) setSupersededByRecord(superseded[0]);
        } catch { /* skip */ }
      }
    } catch (error) {
      console.error('Failed to load advice record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await base44.entities.AdviceRecord.update(record.id, { status: newStatus });
      setRecord({ ...record, status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div style={{ padding: '24px 32px' }}>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-slate-800">Record not found</h2>
          <Link to={createPageUrl('AdviserAdviceRecords')}>
            <Button variant="outline" className="mt-4">Back to Records</Button>
          </Link>
        </div>
      </div>
    );
  }

  const typeConfig = RECORD_TYPE_CONFIG[record.record_type] || RECORD_TYPE_CONFIG.fact_find;
  const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.Pending;
  const TypeIcon = typeConfig.icon;

  const hasFactFindSnapshot = record.fact_find_snapshot;
  const hasAdviceModelSnapshot = record.advice_model_snapshot;
  const hasProjectionSnapshot = record.projection_snapshot;
  const hasAnySnapshot = hasFactFindSnapshot || hasAdviceModelSnapshot || hasProjectionSnapshot;

  // Determine which tabs to show
  const snapshotTabs = [];
  if (hasFactFindSnapshot) snapshotTabs.push({ key: 'factfind', label: 'Fact Find Snapshot', icon: ClipboardCheck });
  if (hasAdviceModelSnapshot) snapshotTabs.push({ key: 'advicemodel', label: 'Advice Model Snapshot', icon: ScrollText });
  if (hasProjectionSnapshot) snapshotTabs.push({ key: 'projection', label: 'Projection Snapshot', icon: TrendingUp });

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Back navigation */}
      <div className="mb-6">
        <Link to={createPageUrl('AdviserAdviceRecords')}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Advice Records
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl ${typeConfig.color.split(' ')[0]} flex items-center justify-center`}>
              <TypeIcon className="w-7 h-7 text-slate-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{record.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${statusConfig.color}`}>
                  {record.status}
                </span>
              </div>
            </div>
          </div>

          {/* Status update actions */}
          <div className="flex items-center gap-2">
            {record.status === 'Pending' && (
              <Button
                onClick={() => handleStatusUpdate('In Progress')}
                variant="outline"
                size="sm"
              >
                Mark In Progress
              </Button>
            )}
            {(record.status === 'Pending' || record.status === 'In Progress') && (
              <Button
                onClick={() => handleStatusUpdate('Completed')}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Mark Completed
              </Button>
            )}
          </div>
        </div>

        {/* Superseded warning */}
        {record.status === 'Superseded' && supersededByRecord && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              This record has been superseded by{' '}
              <Link
                to={createPageUrl('AdviserAdviceRecordDetail') + `?id=${supersededByRecord.id}`}
                className="font-semibold underline"
              >
                {supersededByRecord.title}
              </Link>{' '}
              (created {formatDate(supersededByRecord.created_at)}).
            </div>
          </div>
        )}

        {/* Metadata grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-xs text-slate-500">Client</div>
              <div className="text-sm font-medium text-slate-800">{clientName || '\u2014'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-xs text-slate-500">Adviser</div>
              <div className="text-sm font-medium text-slate-800">{adviserName || record.created_by || '\u2014'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-xs text-slate-500">Created</div>
              <div className="text-sm font-medium text-slate-800">
                {formatDate(record.created_at, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Hash className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-xs text-slate-500">Version</div>
              <div className="text-sm font-medium text-slate-800">v{record.version || 1}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes section */}
      {record.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{record.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Snapshot Tabs */}
      {hasAnySnapshot ? (
        <Tabs defaultValue={snapshotTabs[0]?.key || 'factfind'} className="w-full">
          <TabsList className="mb-6">
            {snapshotTabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <TabsTrigger key={tab.key} value={tab.key} className="gap-2">
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {hasFactFindSnapshot && (
            <TabsContent value="factfind">
              <SnapshotSection
                title="Fact Find - Point in Time Snapshot"
                data={record.fact_find_snapshot}
                icon={ClipboardCheck}
              />
            </TabsContent>
          )}

          {hasAdviceModelSnapshot && (
            <TabsContent value="advicemodel">
              <SnapshotSection
                title="Advice Model - Point in Time Snapshot"
                data={record.advice_model_snapshot}
                icon={ScrollText}
              />
            </TabsContent>
          )}

          {hasProjectionSnapshot && (
            <TabsContent value="projection">
              <SnapshotSection
                title="Projection Results - Point in Time Snapshot"
                data={record.projection_snapshot}
                icon={TrendingUp}
              />
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">No snapshots</h3>
              <p className="text-sm text-slate-500">This record does not contain any data snapshots.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
