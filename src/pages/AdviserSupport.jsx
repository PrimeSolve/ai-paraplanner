import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { LifeBuoy, Plus, X, Eye, Clock, AlertCircle, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function AdviserSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
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
      const user = await base44.auth.me();
      setCurrentUser(user);
      const data = await base44.entities.Ticket.filter(
        { adviser_name: user.full_name },
        '-created_date'
      );
      setTickets(data);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      'Open': { color: '#4F46E5', bg: '#EEF2FF' },
      'In Progress': { color: '#D97706', bg: '#FEF3C7' },
      'Awaiting Response': { color: '#0891B2', bg: '#ECFEFF' },
      'Resolved': { color: '#059669', bg: '#F0FDF4' },
      'Closed': { color: '#64748B', bg: '#F1F5F9' },
    };
    return styles[status] || styles['Open'];
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      'Low': { color: '#64748B', bg: '#F1F5F9', bold: false },
      'Medium': { color: '#D97706', bg: '#FEF3C7', bold: false },
      'High': { color: '#DC2626', bg: '#FEF2F2', bold: false },
      'Urgent': { color: '#DC2626', bg: '#FEF2F2', bold: true },
    };
    return styles[priority] || styles['Medium'];
  };

  const stats = {
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    awaiting: tickets.filter(t => t.status === 'Awaiting Response').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
  };

  const totalPages = Math.ceil(tickets.length / itemsPerPage);
  const paginatedTickets = tickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
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
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Ticket #</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Subject</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Priority</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.length > 0 ? paginatedTickets.map((ticket) => {
                const statusStyle = getStatusStyle(ticket.status);
                const priorityStyle = getPriorityStyle(ticket.priority);
                return (
                  <tr key={ticket.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-800">#{ticket.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-800">{ticket.subject}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-lg text-xs"
                        style={{
                          background: priorityStyle.bg,
                          color: priorityStyle.color,
                          fontWeight: priorityStyle.bold ? 700 : 600,
                        }}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-800">
                        {ticket.created_date
                          ? new Date(ticket.created_date).toLocaleDateString('en-AU', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })
                          : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => { setSelectedTicket(ticket); setShowViewModal(true); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">
                      No support tickets yet — click <strong>+ New Ticket</strong> to raise a request with the PrimeSolve team.
                    </p>
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
          onSuccess={() => { setShowNewModal(false); loadTickets(); }}
          currentUser={currentUser}
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

function NewTicketModal({ onClose, onSuccess, currentUser }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await base44.entities.Ticket.create({
        subject,
        category,
        priority,
        description: description,
        status: 'Open',
        adviser_name: currentUser.full_name,
        advice_group_name: currentUser.advice_group_name,
        created_date: new Date().toISOString(),
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create ticket:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">New Support Ticket</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Brief description of your issue"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="General">General</option>
              <option value="Billing">Billing</option>
              <option value="Technical">Technical</option>
              <option value="Compliance">Compliance</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Describe your issue in detail..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !description.trim()}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
              style={{ background: '#4F46E5' }}
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewTicketModal({ ticket, onClose }) {
  const statusStyle = {
    'Open': { color: '#4F46E5', bg: '#EEF2FF' },
    'In Progress': { color: '#D97706', bg: '#FEF3C7' },
    'Awaiting Response': { color: '#0891B2', bg: '#ECFEFF' },
    'Resolved': { color: '#059669', bg: '#F0FDF4' },
    'Closed': { color: '#64748B', bg: '#F1F5F9' },
  }[ticket.status] || { color: '#4F46E5', bg: '#EEF2FF' };

  const priorityStyle = {
    'Low': { color: '#64748B', bg: '#F1F5F9' },
    'Medium': { color: '#D97706', bg: '#FEF3C7' },
    'High': { color: '#DC2626', bg: '#FEF2F2' },
    'Urgent': { color: '#DC2626', bg: '#FEF2F2' },
  }[ticket.priority] || { color: '#D97706', bg: '#FEF3C7' };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Ticket #{ticket.id}</h2>
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
              <p className="text-sm font-medium text-slate-800">{ticket.category || '—'}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</label>
              <span
                className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold"
                style={{ background: statusStyle.bg, color: statusStyle.color }}
              >
                {ticket.status}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Priority</label>
              <span
                className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold"
                style={{ background: priorityStyle.bg, color: priorityStyle.color }}
              >
                {ticket.priority}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Created</label>
              <p className="text-sm font-medium text-slate-800">
                {ticket.created_date
                  ? new Date(ticket.created_date).toLocaleDateString('en-AU', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })
                  : '—'}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Assigned To</label>
            <p className="text-sm font-medium text-slate-800">{ticket.assigned_to || '—'}</p>
          </div>
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
