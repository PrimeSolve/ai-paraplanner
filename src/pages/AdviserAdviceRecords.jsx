import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  FileText,
  ClipboardCheck,
  TrendingUp,
  ScrollText,
  ShieldCheck,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { formatDate } from '../utils/dateUtils';

const RECORD_TYPE_CONFIG = {
  fact_find: {
    label: 'Fact Find',
    icon: ClipboardCheck,
    color: 'bg-blue-100 text-blue-700',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  strategy_recommendations: {
    label: 'Strategy Recommendations',
    icon: ScrollText,
    color: 'bg-purple-100 text-purple-700',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  cashflow_model: {
    label: 'Cashflow Model',
    icon: TrendingUp,
    color: 'bg-orange-100 text-orange-700',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  soa_document: {
    label: 'Statement of Advice',
    icon: FileText,
    color: 'bg-teal-100 text-teal-700',
    iconColor: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  compliance_review: {
    label: 'Compliance Review',
    icon: ShieldCheck,
    color: 'bg-green-100 text-green-700',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
  },
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

export default function AdviserAdviceRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [clients, setClients] = useState({});
  const [advisers, setAdvisers] = useState({});
  const itemsPerPage = 10;

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const currentUser = await base44.auth.me();

      const data = await base44.entities.AdviceRecord.filter(
        { adviser_id: currentUser.id },
        '-created_at'
      );
      setRecords(data);

      // Load unique client names
      const clientIds = [...new Set(data.map((r) => r.client_id).filter(Boolean))];
      const clientMap = {};
      await Promise.all(
        clientIds.map(async (id) => {
          try {
            const results = await base44.entities.Client.filter({ id });
            if (results[0]) {
              clientMap[id] = `${results[0].first_name || ''} ${results[0].last_name || ''}`.trim() || 'Client';
            }
          } catch {
            /* skip */
          }
        })
      );
      setClients(clientMap);
    } catch (error) {
      console.error('Failed to load advice records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const clientName = clients[r.client_id] || '';
    const matchesSearch =
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || r.record_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: records.length,
    pending: records.filter((r) => r.status === 'Pending').length,
    completed: records.filter((r) => r.status === 'Completed').length,
    approved: records.filter((r) => r.status === 'Approved').length,
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="py-6 px-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-6 text-white">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
            <ScrollText className="w-6 h-6" />
          </div>
          <div className="text-4xl font-bold mb-1">{stats.total}</div>
          <div className="text-sm opacity-90">Total Records</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{stats.pending}</div>
          <div className="text-sm text-slate-600">Pending</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{stats.completed}</div>
          <div className="text-sm text-slate-600">Completed</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{stats.approved}</div>
          <div className="text-sm text-slate-600">Approved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 mb-6">
        <div className="p-6 flex items-end gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by title or client..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-11 border-slate-200"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Type</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <option value="all">All Types</option>
              <option value="fact_find">Fact Find</option>
              <option value="strategy_recommendations">Strategy Recommendations</option>
              <option value="cashflow_model">Cashflow Model</option>
              <option value="soa_document">SOA Document</option>
              <option value="compliance_review">Compliance Review</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Approved">Approved</option>
              <option value="Archived">Archived</option>
              <option value="Superseded">Superseded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Title</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Version</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((record) => {
                  const typeConfig = RECORD_TYPE_CONFIG[record.record_type] || RECORD_TYPE_CONFIG.fact_find;
                  const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.Pending;
                  const TypeIcon = typeConfig.icon;
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg ${typeConfig.bgColor} flex items-center justify-center`}>
                            <TypeIcon className={`w-4 h-4 ${typeConfig.iconColor}`} />
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-800">{record.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">{clients[record.client_id] || 'Unknown'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">v{record.version || 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{formatDate(record.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link to={createPageUrl('AdviserAdviceRecordDetail') + `?id=${record.id}`}>
                            <Button size="sm" variant="outline" className="gap-1.5">
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                        <ScrollText className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-1">No advice records found</h3>
                      <p className="text-sm text-slate-500">
                        Records are created automatically when you complete fact finds, create strategies, or generate SOAs.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-600">
              Showing {filteredRecords.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
              {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
