import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { TrendingUp, Plus, ExternalLink, FileText, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { formatDate } from '../utils/dateUtils';
import { openModel } from '../utils/modelLauncher';
import { toast } from 'sonner';

export default function AdviserModels() {
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [modelsData, clientsData] = await Promise.all([
        base44.entities.CashflowModel.filter({ adviser_email: currentUser.email }, '-updated_date'),
        base44.entities.Client.filter({ adviser_email: currentUser.email })
      ]);

      setModels(modelsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) return `${client.first_name || ''} ${client.last_name || ''}`.trim();
    return 'Unknown Client';
  };

  const handleDelete = async (model) => {
    if (!window.confirm(`Are you sure you want to delete the model "${model.name || 'Untitled'}"? This cannot be undone.`)) {
      return;
    }
    try {
      await base44.entities.CashflowModel.delete(model.id);
      toast.success('Model deleted');
      loadData();
    } catch (error) {
      console.error('Failed to delete model:', error);
      toast.error('Failed to delete model');
    }
  };

  const handleCreateSOA = async (model) => {
    try {
      toast.info('Creating SOA Request from model...');
      // The API endpoint creates an SOA Request linked to the model
      const result = await base44.entities.CashflowModel.update(model.id, {
        create_soa_request: true
      });
      if (result?.soa_request_id) {
        navigate(createPageUrl(`SOARequestWelcome?id=${result.soa_request_id}`));
      } else {
        toast.success('SOA Request created');
        loadData();
      }
    } catch (error) {
      console.error('Failed to create SOA from model:', error);
      toast.error('Failed to create SOA Request');
    }
  };

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
      <div className="py-6 px-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="py-6 px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cashflow Models</h1>
          <p className="text-sm text-slate-600 mt-1">Build and manage cashflow projections for your clients</p>
        </div>
        <Button
          onClick={() => openModel()}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Model
        </Button>
      </div>

      {/* Models Table */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Model Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Updated</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">SOA Link</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.length > 0 ? models.map((model) => {
                const statusBadge = getStatusBadge(model.status);
                return (
                  <tr key={model.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-medium text-sm text-slate-800">
                          {getClientName(model.client_id)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-800 font-medium">{model.name || 'Untitled Model'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{formatDate(model.updated_date || model.created_date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {model.soa_request_id ? (
                        <Link
                          to={createPageUrl(`SOARequestWelcome?id=${model.soa_request_id}`)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View SOA
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-400">No SOA linked</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModel({ modelId: model.id })}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                        >
                          Open
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openModel({ modelId: model.id })}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open in Model App
                            </DropdownMenuItem>
                            {!model.soa_request_id && (
                              <DropdownMenuItem onClick={() => handleCreateSOA(model)}>
                                <FileText className="w-4 h-4 mr-2" />
                                Create SOA
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(model)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                        <TrendingUp className="w-8 h-8 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-1">No models yet</h3>
                      <p className="text-sm text-slate-500 mb-4">Create a cashflow model to build projections for your clients.</p>
                      <Button
                        onClick={() => openModel()}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Model
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
