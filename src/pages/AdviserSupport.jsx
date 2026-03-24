import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useRole } from '@/components/RoleContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { LifeBuoy, Plus, X, Eye, Clock, AlertCircle, MessageSquare, CheckCircle2 } from 'lucide-react';
import NewTicketModal from '@/components/tickets/NewTicketModal';

export default function AdviserSupport() {
  const { user: roleUser } = useRole();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAdviserId, setCurrentAdviserId] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();

      // Get adviser record to find adviserId
      let adviserId = null;
      const advisers = await base44.entities.Adviser.filter({ user_id: user.id });
      if (advisers.length > 0) {
        adviserId = advisers[0].id;
      }
      setCurrentAdviserId(adviserId);

      if (adviserId) {
        const data = await base44.entities.Ticket.filter(
          { adviser_id: adviserId },
          '-created_at'
        );
        setTickets(data);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'InProgress' || t.status === 'In Progress').length,
    awaiting: tickets.filter(t => t.status === 'Open').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
  };

  const totalPages = Math.ceil(tickets.length / itemsPerPage);
  const paginatedTickets = tickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getCategoryBadge = (category) => {
    const styles = {
      Billing: 'bg-amber-100 text-amber-700',
      Technical: 'bg-blue-100 text-blue-700',
      SOA: 'bg-purple-100 text-purple-700',
      Other: 'bg-gray-100 text-gray-600',
    };
    return styles[category] || 'bg-gray-100 text-gray-600';
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      Low: 'bg-gray-100 text-gray-600',
      Medium: 'bg-amber-100 text-amber-700',
      High: 'bg-orange-100 text-orange-700',
      Urgent: 'bg-red-100 text-red-700',
    };
    return styles[priority] || 'bg-gray-100 text-gray-600';
  };

  const getStatusBadge = (status) => {
    const styles = {
      Open: 'bg-blue-100 text-blue-700',
      InProgress: 'bg-amber-100 text-amber-700',
      'In Progress': 'bg-amber-100 text-amber-700',
      Resolved: 'bg-green-100 text-green-700',
    };
    return styles[status] || 'bg-blue-100 text-blue-700';
  };

  const getStatusLabel = (status) => {
    if (status === 'InProgress') return 'In Progress';
    return status;
  };

  if (loading) {
    return (
      <div className="py-6 px-8" style={{ fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC', minHeight: '100vh' }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="py-6 px-8" style={{ fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Support Tickets</h1>
          <p className="text-sm text-slate-500 mt-1">Raise and track requests with the PrimeSolve team</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-colors"
          style={{ background: '#4F46E5' }}
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: '#EEF2FF' }}>
            <AlertCircle className="w-6 h-6" style={{ color: '#4F46E5' }} />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{stats.open}</div>
          <div className="text-sm text-slate-600">Open Tickets</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: '#FEF3C7' }}>
            <Clock className="w-6 h-6" style={{ color: '#D97706' }} />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{stats.inProgress}</div>
          <div className="text-sm text-slate-600">In Progress</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: '#ECFEFF' }}>
            <MessageSquare className="w-6 h-6" style={{ color: '#0891B2' }} />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{stats.awaiting}</div>
          <div className="text-sm text-slate-600">Awaiting Response</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: '#F0FDF4' }}>
            <CheckCircle2 className="w-6 h-6" style={{ color: '#059669' }} />
          </div>
          <div className="text-4xl font-bold text-slate-800 mb-1">{stats.resolved}</div>
          <div className="text-sm text-slate-600">Resolved</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 w-24 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Ticket #</th>
                <th className="text-left px-6 py-3 flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Subject</th>
                <th className="text-left px-6 py-3 w-36 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Category</th>
                <th className="text-left px-6 py-3 w-32 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Priority</th>
                <th className="text-left px-6 py-3 w-32 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Status</th>
                <th className="text-left px-6 py-3 w-32 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Created</th>
                <th className="text-left px-6 py-3 w-20 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.length > 0 ? paginatedTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-gray-50 bg-white hover:bg-gray-50 cursor-pointer transition-colors duration-100"
                  onClick={() => { setSelectedTicket(ticket); setShowViewModal(true); }}
                >
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500 font-mono">#{ticket.ticket_number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-800">{ticket.subject}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getCategoryBadge(ticket.category)}`}>
                      {ticket.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getPriorityBadge(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{formatDate(ticket.created_at)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); setShowViewModal(true); }}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4">
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <LifeBuoy className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">No support tickets</p>
                      <p className="text-xs text-gray-400 mt-1">Raise a ticket and we'll get back to you shortly</p>
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
              Showing {tickets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, tickets.length)} of {tickets.length} tickets
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
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
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewModal && (
        <NewTicketModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => { setShowNewModal(false); loadTickets(); toast.success('Ticket submitted successfully'); }}
        />
      )}

      {/* View Ticket Modal */}
      {showViewModal && selectedTicket && (
        <ViewTicketModal
          ticket={selectedTicket}
          onClose={() => { setShowViewModal(false); setSelectedTicket(null); }}
        />
      )}
    </div>
  );
}

function ViewTicketModal({ ticket, onClose }) {
  const getStatusBadge = (status) => {
    const styles = {
      Open: 'bg-blue-100 text-blue-700',
      InProgress: 'bg-amber-100 text-amber-700',
      'In Progress': 'bg-amber-100 text-amber-700',
      Resolved: 'bg-green-100 text-green-700',
    };
    return styles[status] || 'bg-blue-100 text-blue-700';
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      Low: 'bg-gray-100 text-gray-600',
      Medium: 'bg-amber-100 text-amber-700',
      High: 'bg-orange-100 text-orange-700',
      Urgent: 'bg-red-100 text-red-700',
    };
    return styles[priority] || 'bg-amber-100 text-amber-700';
  };

  const getCategoryBadge = (category) => {
    const styles = {
      Billing: 'bg-amber-100 text-amber-700',
      Technical: 'bg-blue-100 text-blue-700',
      SOA: 'bg-purple-100 text-purple-700',
      Other: 'bg-gray-100 text-gray-600',
    };
    return styles[category] || 'bg-gray-100 text-gray-600';
  };

  const getStatusLabel = (status) => {
    if (status === 'InProgress') return 'In Progress';
    return status;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Ticket #{ticket.ticket_number}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Subject</label>
            <p className="text-sm font-medium text-slate-800">{ticket.subject}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Category</label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getCategoryBadge(ticket.category)}`}>
                {ticket.category}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(ticket.status)}`}>
                {getStatusLabel(ticket.status)}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Priority</label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getPriorityBadge(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Created</label>
              <p className="text-sm font-medium text-slate-800">{formatDate(ticket.created_at)}</p>
            </div>
          </div>
          {ticket.related_client_name && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Related Client</label>
              <p className="text-sm font-medium text-slate-800">{ticket.related_client_name}</p>
            </div>
          )}
          {ticket.related_feature && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Related Feature</label>
              <p className="text-sm font-medium text-slate-800">{ticket.related_feature}</p>
            </div>
          )}
          {ticket.additional_context && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Additional Context</label>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.additional_context}</p>
            </div>
          )}
          {ticket.description && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</label>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
