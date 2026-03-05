import React, { useState, useEffect } from 'react';
import ClientLayout from '../components/client/ClientLayout';
import { base44 } from '@/api/base44Client';
import { formatDate } from '../utils/dateUtils';
import { openModel } from '../utils/modelLauncher';
import { TrendingUp, ExternalLink, Inbox } from 'lucide-react';

export default function ClientCashflow() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const user = await base44.auth.me();
        const clients = await base44.entities.Client.filter({ user_email: user.email });
        const client = clients[0];

        if (client) {
          const modelsData = await base44.entities.CashflowModel.filter(
            { client_id: client.id },
            '-updated_date'
          );
          setModels(modelsData);
        }
      } catch (error) {
        console.error('Failed to load cashflow models:', error);
      } finally {
        setLoading(false);
      }
    };
    loadModels();
  }, []);

  const getStatusBadge = (status) => {
    const badges = {
      draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
      complete: { label: 'Complete', className: 'bg-green-100 text-green-700' },
      archived: { label: 'Archived', className: 'bg-gray-100 text-gray-500' }
    };
    return badges[status] || badges.draft;
  };

  if (loading) {
    return (
      <ClientLayout currentPage="ClientCashflow">
        <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout currentPage="ClientCashflow">
      <div style={{ padding: '24px 32px' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Cashflow Models</h1>
          <p className="text-slate-600">View your cashflow projections and financial models</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {models.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Inbox className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No cashflow models yet</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Your adviser will create cashflow models for you. They'll appear here once available.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="col-span-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Model</div>
                <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</div>
                <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Updated</div>
                <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</div>
              </div>

              <div className="divide-y divide-slate-100">
                {models.map((model) => {
                  const statusBadge = getStatusBadge(model.status);
                  return (
                    <div key={model.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center">
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-slate-800">{model.name || 'Untitled Model'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-sm text-slate-600">{formatDate(model.updated_date || model.created_date)}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <button
                          onClick={() => openModel({ modelId: model.id })}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
