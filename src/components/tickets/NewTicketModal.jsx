import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';

const CATEGORIES = ['Billing', 'Technical', 'SOA', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function NewTicketModal({ onClose, onSuccess }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [relatedClientId, setRelatedClientId] = useState('');
  const [relatedSOAId, setRelatedSOAId] = useState('');
  const [relatedFeature, setRelatedFeature] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // SOA category data
  const [clients, setClients] = useState([]);
  const [soaRequests, setSoaRequests] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingSOAs, setLoadingSOAs] = useState(false);

  useEffect(() => {
    if (category === 'SOA') {
      loadClients();
    }
  }, [category]);

  useEffect(() => {
    if (relatedClientId) {
      loadSOARequests(relatedClientId);
    } else {
      setSoaRequests([]);
      setRelatedSOAId('');
    }
  }, [relatedClientId]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const user = await base44.auth.me();
      const clientList = await base44.entities.Client.filter({ adviser_email: user.email });
      setClients(clientList);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadSOARequests = async (clientId) => {
    try {
      setLoadingSOAs(true);
      const soas = await base44.entities.SOARequest.filter({ client_id: clientId });
      setSoaRequests(soas);
    } catch (err) {
      console.error('Failed to load SOA requests:', err);
    } finally {
      setLoadingSOAs(false);
    }
  };

  const validate = () => {
    const errors = {};
    if (!subject.trim()) errors.subject = 'Subject is required';
    if (!category) errors.category = 'Category is required';
    if (!description.trim()) errors.description = 'Description is required';
    if (category === 'SOA' && !relatedClientId) errors.relatedClientId = 'Client is required for SOA tickets';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError('');

    try {
      await base44.entities.Ticket.create({
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
        related_client_id: relatedClientId || null,
        related_s_o_a_id: relatedSOAId || null,
        related_feature: relatedFeature.trim() || null,
        additional_context: additionalContext.trim() || null,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to create ticket:', err);
      setError('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">New Support Ticket</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={e => { setSubject(e.target.value); setFieldErrors(prev => ({ ...prev, subject: '' })); }}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${fieldErrors.subject ? 'border-red-300' : 'border-slate-200'}`}
              placeholder="Brief description of your issue"
            />
            {fieldErrors.subject && <p className="text-xs text-red-500 mt-1">{fieldErrors.subject}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category *</label>
            <select
              value={category}
              onChange={e => {
                setCategory(e.target.value);
                setFieldErrors(prev => ({ ...prev, category: '' }));
                setRelatedClientId('');
                setRelatedSOAId('');
                setRelatedFeature('');
                setAdditionalContext('');
              }}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${fieldErrors.category ? 'border-red-300' : 'border-slate-200'}`}
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {fieldErrors.category && <p className="text-xs text-red-500 mt-1">{fieldErrors.category}</p>}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority *</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Dynamic fields by category */}
          {category === 'SOA' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client *</label>
                <select
                  value={relatedClientId}
                  onChange={e => { setRelatedClientId(e.target.value); setFieldErrors(prev => ({ ...prev, relatedClientId: '' })); }}
                  disabled={loadingClients}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 ${fieldErrors.relatedClientId ? 'border-red-300' : 'border-slate-200'}`}
                >
                  <option value="">Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {`${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email}
                    </option>
                  ))}
                </select>
                {fieldErrors.relatedClientId && <p className="text-xs text-red-500 mt-1">{fieldErrors.relatedClientId}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Related SOA</label>
                <select
                  value={relatedSOAId}
                  onChange={e => setRelatedSOAId(e.target.value)}
                  disabled={!relatedClientId || loadingSOAs}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="">Select an SOA request...</option>
                  {soaRequests.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title || s.subject || `SOA #${s.id?.substring(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {category === 'Technical' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Which page or feature is affected?</label>
              <input
                type="text"
                value={relatedFeature}
                onChange={e => setRelatedFeature(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g. Fact Find, SOA Builder, Dashboard..."
              />
            </div>
          )}

          {category === 'Other' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Additional context</label>
              <textarea
                value={additionalContext}
                onChange={e => setAdditionalContext(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Any additional information that might help us..."
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description *</label>
            <textarea
              value={description}
              onChange={e => { setDescription(e.target.value); setFieldErrors(prev => ({ ...prev, description: '' })); }}
              rows={4}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${fieldErrors.description ? 'border-red-300' : 'border-slate-200'}`}
              placeholder="Describe your issue in detail..."
            />
            {fieldErrors.description && <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>}
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
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
              disabled={submitting}
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
