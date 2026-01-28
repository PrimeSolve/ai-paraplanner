import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MoreHorizontal, Eye, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import NewSOARequestModal from '../components/adviser/NewSOARequestModal.jsx';

export default function AdviserSOARequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewModal, setShowNewModal] = useState(false);
  const itemsPerPage = 8;

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.SOARequest.filter({
        created_by: currentUser.email
      }, '-created_date');
      setRequests(data);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': { bg: '#f1f5f9', color: '#64748b', label: 'Draft' },
      'in_progress': { bg: '#e0e7ff', color: '#4f46e5', label: 'In Progress' },
      'submitted': { bg: '#dcfce7', color: '#16a34a', label: 'Complete' },
      'completed': { bg: '#dcfce7', color: '#16a34a', label: 'Complete' }
    };
    return colors[status] || colors.draft;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': { bg: '#fee2e2', color: '#dc2626', icon: '⬤', label: 'High' },
      'normal': { bg: '#fef3c7', color: '#d97706', icon: '⬤', label: 'Normal' },
      'low': { bg: '#dbeafe', color: '#0284c7', icon: '⬤', label: 'Low' }
    };
    return colors[priority] || colors.normal;
  };

  const getClientColor = (index) => {
    const colors = ['#2563eb', '#16a34a', '#ea580c', '#a855f7', '#ec4899', '#06b6d4', '#dc2626', '#b45309'];
    return colors[index % colors.length];
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: requests.length,
    ready: requests.filter(r => r.status === 'draft').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    submitted: requests.filter(r => r.status === 'submitted').length,
    complete: requests.filter(r => r.status === 'completed').length
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button onClick={() => setShowNewModal(true)} style={{ padding: '10px 18px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          + New SOA Request
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: '16px', padding: '20px 24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: 'rgba(59, 130, 246, 0.1)' }}>
            📋
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{stats.total}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Total Requests</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: 'rgba(139, 92, 246, 0.1)' }}>
            ✎
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{stats.ready}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Ready to Review</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: 'rgba(245, 158, 11, 0.1)' }}>
            ⟳
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{stats.inProgress}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>In Progress</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: 'rgba(16, 185, 129, 0.1)' }}>
            ✓
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{stats.complete}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Complete</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', width: '280px' }}>
          <Search style={{ width: '18px', height: '18px', color: '#94a3b8', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontSize: '14px', color: '#1e293b', width: '100%', outline: 'none', fontFamily: 'Inter, sans-serif' }}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger style={{ width: '180px', height: '40px', padding: '10px 14px' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger style={{ width: '160px', height: '40px', padding: '10px 14px' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
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
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submitted</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.map((req, idx) => {
                    const statusColor = getStatusColor(req.status);
                    const priorityColor = getPriorityColor(req.priority || 'normal');
                    return (
                      <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: getClientColor(idx), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '12px', flexShrink: 0 }}>
                              {req.client_name?.charAt(0) || 'C'}
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{req.client_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{req.type || 'Comprehensive'}</div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: statusColor.bg, color: statusColor.color }}>
                            {statusColor.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: priorityColor.bg, color: priorityColor.color }}>
                            <span style={{ fontSize: '8px' }}>⬤</span>
                            {priorityColor.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                            {req.submitted_date ? new Date(req.submitted_date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: req.status === 'completed' ? '#16a34a' : '#dc2626' }}>
                            {req.completed_date ? new Date(req.completed_date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Link to={createPageUrl(`SOARequestWelcome?id=${req.id}`)} style={{ padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#3b82f6', fontWeight: '500', textDecoration: 'none' }}>
                              View
                            </Link>
                            {req.status === 'completed' && (
                              <button style={{ padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#10b981', fontWeight: '500' }}>
                                Download
                              </button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button style={{ padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                  <MoreHorizontal style={{ width: '18px', height: '18px', color: '#64748b' }} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', color: '#3b82f6', cursor: 'pointer' }}>
                                  <Eye style={{ width: '14px', height: '14px' }} />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', color: '#ef4444', cursor: 'pointer' }}>
                                  Delete
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
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} requests</span>
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
              <NewSOARequestModal
              isOpen={showNewModal}
              onClose={() => setShowNewModal(false)}
              onSuccess={loadRequests}
              adviserEmail={user?.email}
              />
              </div>
              );