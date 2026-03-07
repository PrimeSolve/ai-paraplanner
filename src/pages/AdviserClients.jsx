import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Users, CheckCircle, Clock, MoreHorizontal, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { openModel } from '../utils/modelLauncher';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { formatDate } from '../utils/dateUtils';
import AddClientModal from '../components/adviser/AddClientModal.jsx';
import EditClientModal from '../components/adviser/EditClientModal.jsx';
import { useRole } from '../components/RoleContext';
import { toast } from 'sonner';

export default function AdviserClients() {
  const navigate = useNavigate();
  const { switchRole } = useRole();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [factFindFilter, setFactFindFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const itemsPerPage = 8;

  useEffect(() => {
    loadData();

    // Listen for custom event from header button
    const handleOpenDialog = () => setShowAddModal(true);
    window.addEventListener('openAddClientDialog', handleOpenDialog);
    return () => window.removeEventListener('openAddClientDialog', handleOpenDialog);
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // The backend scopes clients by adviser_id from the JWT automatically,
      // so no need to send adviser_email as a filter parameter.
      const data = await base44.entities.Client.filter({}, '-created_date');
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (client) => {
    if (!window.confirm(`Are you sure you want to delete ${client.first_name} ${client.last_name}? This cannot be undone.`)) {
      return;
    }
    try {
      await base44.entities.Client.delete(client.id);
      toast.success('Client deleted');
      loadData();
    } catch (error) {
      console.error('Failed to delete client:', error);
      toast.error('Failed to delete client');
    }
  };

  const getColorValue = (index) => {
    const colors = ['#2563eb', '#16a34a', '#ea580c', '#a855f7', '#ec4899', '#06b6d4', '#dc2626', '#b45309'];
    return colors[index % colors.length];
  };

  const getFactFindBadge = (status) => {
    const badges = {
      complete: { label: 'Complete', className: 'bg-green-100 text-green-700' },
      in_progress: { label: 'In Progress', className: 'bg-orange-100 text-orange-700' },
      sent: { label: 'Sent', className: 'bg-blue-100 text-blue-700' },
      not_started: { label: 'Not Started', className: 'bg-slate-100 text-slate-700' }
    };
    return badges[status] || badges.not_started;
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFactFind = factFindFilter === 'all' || client.fact_find === factFindFilter;
    return matchesSearch && matchesFactFind;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  // Calculate fact find stats
  const ffComplete = clients.filter(c => c.fact_find === 'complete').length;
  const ffInProgress = clients.filter(c => c.fact_find === 'in_progress').length;
  const ffSent = clients.filter(c => c.fact_find === 'sent').length;
  const ffNotStarted = clients.filter(c => c.fact_find === 'not_started').length;

  const getColorClass = (index) => {
    const colors = [
      'bg-blue-600',
      'bg-orange-600',
      'bg-pink-600',
      'bg-purple-600',
      'bg-green-600',
      'bg-cyan-600',
      'bg-teal-600',
      'bg-indigo-600'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="py-6 px-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-4xl font-bold mb-1">{clients.length}</div>
          <div className="text-sm opacity-90">Total Clients</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{ffComplete}</div>
          <div className="text-sm text-slate-600">FF Complete</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{ffInProgress}</div>
          <div className="text-sm text-slate-600">FF In Progress</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{ffNotStarted}</div>
          <div className="text-sm text-slate-600">FF Not Sent</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 mb-6">
        <div className="p-6 flex items-end gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-slate-200"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Fact Find Status</span>
            <select value={factFindFilter} onChange={(e) => setFactFindFilter(e.target.value)} className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <option value="all">All Fact Find Status</option>
              <option value="complete">Complete</option>
              <option value="in_progress">In Progress</option>
              <option value="sent">Sent</option>
              <option value="not_started">Not Started</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Fact Find</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">SOA Summary</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Added</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.length > 0 ? paginatedClients.map((client, idx) => {
                const factFindBadge = getFactFindBadge(client.fact_find);
                return (
                  <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${getColorClass(idx)} flex items-center justify-center text-white font-bold text-sm`}>
                          {client.first_name?.charAt(0)}{client.last_name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-800">{client.first_name} {client.last_name}</div>
                          <div className="text-xs text-slate-600">{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${(() => {
                        const mapping = {
                          'complete': 'bg-green-100 text-green-700',
                          'in_progress': 'bg-orange-100 text-orange-700',
                          'sent': 'bg-blue-100 text-blue-700',
                          'not_started': 'bg-slate-100 text-slate-700'
                        };
                        return mapping[client.fact_find] || mapping['not_started'];
                      })()}`}>
                        {factFindBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-blue-600">{client.soas || 0} SOA{client.soas !== 1 ? 's' : ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-800">{formatDate(client.created_date)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email;
                            switchRole('client', client.email, clientName);
                            navigate(createPageUrl(`ClientDashboard?client_email=${client.email}`));
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                        >
                          View
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openModel({ clientId: client.id })}>
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Open Model
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('Email integration coming soon. You can share the Fact Find link manually.')}>
                              <span className="mr-2">📧</span>
                              Send Fact Find
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingClient(client)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Client
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClient(client)}>
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
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-600">
                    No clients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-600">Showing {filteredClients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} clients</span>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50">
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50">
              Next →
            </button>
          </div>
        </div>
       </div>
       <AddClientModal
       isOpen={showAddModal}
       onClose={() => setShowAddModal(false)}
       onSuccess={loadData}
       adviserEmail={user?.email}
       />
       <EditClientModal
       isOpen={!!editingClient}
       onClose={() => setEditingClient(null)}
       onSuccess={loadData}
       client={editingClient}
       />
       </div>
  );
}