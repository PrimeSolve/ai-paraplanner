import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, FileText, ClipboardCheck, ScrollText, TrendingUp, ShieldCheck, Eye, Clock, CheckCircle2, AlertCircle, Archive } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function AdviserClientDetail() {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adviceRecords, setAdviceRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [adviceRequests, setAdviceRequests] = useState([]);
  const [adviceRequestsLoading, setAdviceRequestsLoading] = useState(false);
  const [creatingSoa, setCreatingSoa] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadClient();
  }, []);

  const loadClient = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');

      if (id) {
        const clients = await base44.entities.Client.filter({ id });
        setClient(clients[0]);

        // Load advice records for this client
        setRecordsLoading(true);
        try {
          const records = await base44.entities.AdviceRecord.filter(
            { client_id: id },
            '-created_at'
          );
          setAdviceRecords(records);
        } catch (err) {
          console.error('Failed to load advice records:', err);
        } finally {
          setRecordsLoading(false);
        }

        // Load advice requests (SOAs) for this client
        setAdviceRequestsLoading(true);
        try {
          const requests = await base44.entities.AdviceRequest.filter({ client_id: id });
          setAdviceRequests(requests);
        } catch (err) {
          console.error('Failed to load advice requests:', err);
        } finally {
          setAdviceRequestsLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to load client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSoaRequest = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    setCreatingSoa(true);
    try {
      const newAdviceRequest = await base44.entities.AdviceRequest.create({ client_id: id, status: 'draft' });
      navigate(createPageUrl('SOARequestWelcome') + `?id=${newAdviceRequest.id}`);
    } catch (err) {
      console.error('Failed to create SOA request:', err);
    } finally {
      setCreatingSoa(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      <div className="bg-white border-b border-slate-200 px-6 py-4 mb-6 rounded-lg">
        <div className="flex items-center gap-4 mb-4">
          <Link to={createPageUrl('AdviserClients')}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center text-2xl font-semibold text-teal-600">
            {client?.first_name?.charAt(0) || 'C'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">
              {client?.first_name} {client?.last_name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {client?.email}
              </span>
              {client?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {client.phone}
                </span>
              )}
            </div>
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700">Edit Details</Button>
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleNewSoaRequest} disabled={creatingSoa}>
            {creatingSoa ? 'Creating...' : 'New SOA Request'}
          </Button>
        </div>
      </div>

      <div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="factfinds">Fact Finds</TabsTrigger>
            <TabsTrigger value="soas">SOAs</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Client Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Status</span>
                    <Badge>{client?.status || 'prospect'}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Risk Profile</span>
                    <span className="font-medium">{client?.risk_profile || 'Not assessed'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Client Since</span>
                    <span className="font-medium">{formatDate(client?.created_date)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {adviceRecords.length > 0 ? (
                    <div className="space-y-3">
                      {adviceRecords.slice(0, 5).map((record) => {
                        const typeConfig = RECORD_TYPE_CONFIG[record.record_type] || RECORD_TYPE_CONFIG.fact_find;
                        const TypeIcon = typeConfig.icon;
                        return (
                          <Link key={record.id} to={createPageUrl('AdviserAdviceRecordDetail') + `?id=${record.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors no-underline">
                            <TypeIcon className="w-4 h-4 text-slate-500" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-800 truncate">{record.title}</div>
                              <div className="text-xs text-slate-500">{formatDate(record.created_at)}</div>
                            </div>
                            <Badge variant="secondary" className="text-xs">{record.status}</Badge>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600">No recent activity</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="p-0">
                {recordsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
                  </div>
                ) : adviceRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-3">Type</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-3">Title</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-3">Status</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-3">Version</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-3">Created</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adviceRecords.map((record) => {
                          const typeConfig = RECORD_TYPE_CONFIG[record.record_type] || RECORD_TYPE_CONFIG.fact_find;
                          const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.Pending;
                          const TypeIcon = typeConfig.icon;
                          const StatusIcon = statusConfig.icon;
                          return (
                            <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <TypeIcon className="w-4 h-4 text-slate-500" />
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${typeConfig.color}`}>
                                    {typeConfig.label}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-800">{record.title}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${statusConfig.color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {record.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">v{record.version || 1}</td>
                              <td className="px-6 py-4 text-sm text-slate-600">{formatDate(record.created_at)}</td>
                              <td className="px-6 py-4">
                                <Link to={createPageUrl('AdviserAdviceRecordDetail') + `?id=${record.id}`}>
                                  <Button size="sm" variant="outline" className="gap-1.5">
                                    <Eye className="w-3.5 h-3.5" />
                                    View
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ScrollText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">No advice records yet</h3>
                    <p className="text-xs text-slate-500">Records will appear here as you work with this client.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="factfinds">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-slate-600">Fact finds will appear here</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="soas">
            <Card>
              <CardContent className="p-0">
                {adviceRequestsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
                  </div>
                ) : adviceRequests.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-3">Status</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-3">Created Date</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adviceRequests.map((request) => (
                          <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <Badge variant="secondary" className="text-xs">{request.status}</Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{formatDate(request.created_date || request.created_at)}</td>
                            <td className="px-6 py-4">
                              <Link to={createPageUrl('SOARequestWelcome') + `?id=${request.id}`}>
                                <Button size="sm" variant="outline" className="gap-1.5">
                                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                                  Continue
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">No SOA Requests yet</h3>
                    <p className="text-xs text-slate-500">SOA Requests will appear here once created.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-slate-600">Documents will appear here</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
        </div>
        );
}