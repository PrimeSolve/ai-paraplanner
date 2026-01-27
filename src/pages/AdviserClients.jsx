import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdviserSidebar from '../components/adviser/AdviserSidebar.jsx';
import AdviserHeader from '../components/adviser/AdviserHeader.jsx';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, CheckCircle, Clock, MoreHorizontal, Eye, Edit2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AdviserClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [factFindFilter, setFactFindFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.Client.filter({
        adviser_email: currentUser.email
      }, '-created_date');
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (index) => {
    const colors = ['bg-blue-600', 'bg-green-600', 'bg-orange-600', 'bg-purple-600', 'bg-pink-600', 'bg-cyan-600', 'bg-red-600', 'bg-amber-600'];
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
      <div className="flex">
        <AdviserSidebar currentPage="clients" />
        <div style={{ marginLeft: '260px', flex: 1 }}>
          <AdviserHeader user={user} />
          <div className="p-8 flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate fact find stats
  const ffComplete = clients.filter(c => c.fact_find === 'complete').length;
  const ffInProgress = clients.filter(c => c.fact_find === 'in_progress').length;
  const ffSent = clients.filter(c => c.fact_find === 'sent').length;
  const ffNotStarted = clients.filter(c => c.fact_find === 'not_started').length;

  return (
    <div className="flex">
      <AdviserSidebar currentPage="clients" />
      <div style={{ marginLeft: '260px', flex: 1 }}>
        <AdviserHeader user={user} />
        <div className="p-8">
          
          {/* Stats Bar */}
          <div style={{ display: 'flex', gap: '32px', padding: '20px 24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: 'rgba(59, 130, 246, 0.1)' }}>
                👤
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{clients.length}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Total Clients</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: 'rgba(16, 185, 129, 0.1)' }}>
                ✓
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{ffComplete}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>FF Complete</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: 'rgba(245, 158, 11, 0.1)' }}>
                ⟳
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{ffInProgress}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>FF In Progress</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: 'rgba(148, 163, 184, 0.1)' }}>
                ✉
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{ffNotStarted}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>FF Not Sent</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', width: '280px' }}>
              <Search style={{ width: '18px', height: '18px', color: '#94a3b8', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '14px', color: '#1e293b', width: '100%', outline: 'none', fontFamily: 'Inter, sans-serif' }}
              />
            </div>
            <Select value={factFindFilter} onValueChange={setFactFindFilter}>
              <SelectTrigger style={{ width: '180px', height: '40px', padding: '10px 14px' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fact Find Status</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Fact Find
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Added
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClients.map((client, idx) => {
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
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${factFindBadge.className}`}>
                            {factFindBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-800 capitalize">{client.status || 'prospect'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-800">{new Date(client.created_date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            <span className="text-xs text-slate-600">1 month ago</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link to={createPageUrl(`AdviserClientDetail?id=${client.id}`)}>
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                                View
                              </button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Fact Find
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm text-slate-600">Showing 1-{Math.min(itemsPerPage, paginatedClients.length)} of {filteredClients.length} clients</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
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
                {totalPages > 5 && <span className="text-slate-600">...</span>}
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}