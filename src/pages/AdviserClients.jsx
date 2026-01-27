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
import AddClientModal from '../components/adviser/AddClientModal.jsx';

export default function AdviserClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [factFindFilter, setFactFindFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
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
          {/* Page Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              + Add Client
            </button>
          </div>
          
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
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fact Find</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SOA Summary</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Added</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClients.map((client, idx) => {
                    const factFindBadge = getFactFindBadge(client.fact_find);
                    return (
                      <tr key={client.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: getColorClass(idx), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>
                              {client.first_name?.charAt(0)}{client.last_name?.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{client.first_name} {client.last_name}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{client.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', ...(() => {
                            const colors = {
                              'bg-green-100 text-green-700': { background: '#dcfce7', color: '#166534' },
                              'bg-orange-100 text-orange-700': { background: '#ffedd5', color: '#92400e' },
                              'bg-blue-100 text-blue-700': { background: '#dbeafe', color: '#0c4a6e' },
                              'bg-slate-100 text-slate-700': { background: '#f1f5f9', color: '#334155' }
                            };
                            const mapping = {
                              'complete': colors['bg-green-100 text-green-700'],
                              'in_progress': colors['bg-orange-100 text-orange-700'],
                              'sent': colors['bg-blue-100 text-blue-700'],
                              'not_started': colors['bg-slate-100 text-slate-700']
                            };
                            return mapping[client.fact_find] || mapping['not_started'];
                          })() }}>
                            {factFindBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>{client.soas || 0} SOA{client.soas !== 1 ? 's' : ''}</div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{new Date(client.created_date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button style={{ padding: '6px 12px', background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                              View Fact Find
                            </button>
                            <button style={{ padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <MoreHorizontal style={{ width: '18px', height: '18px', color: '#64748b' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} clients</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 12px', fontSize: '13px', fontWeight: '500', background: currentPage === 1 ? '#f1f5f9' : 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => (currentPage - 1) + i + 1).filter(p => p > 0 && p <= totalPages).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{ padding: '6px 12px', fontSize: '13px', fontWeight: '600', background: currentPage === page ? '#3b82f6' : 'white', color: currentPage === page ? 'white' : '#64748b', border: currentPage === page ? 'none' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    {page}
                  </button>
                ))}
                {totalPages > 3 && <span style={{ color: '#64748b' }}>...</span>}
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 12px', fontSize: '13px', fontWeight: '500', background: currentPage === totalPages ? '#f1f5f9' : 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Client Modal */}
        <AddClientModal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)}
          onSuccess={loadData}
          adviserEmail={user?.email}
        />
      </div>
    </div>
  );
}