import React, { useState, useEffect } from 'react';
import ClientLayout from '../components/client/ClientLayout';
import { base44 } from '@/api/base44Client';
import { formatDate } from '../utils/dateUtils';
import {
  FileText,
  Download,
  Search,
  Inbox
} from 'lucide-react';
import { toast } from 'sonner';

export default function ClientDocuments() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const user = await base44.auth.me();
        try {
          const docs = await base44.entities.Document?.filter({ client_email: user.email }) || [];
          setDocuments(docs);
        } catch {
          setDocuments([]);
        }
      } catch (error) {
        console.error('Failed to load documents:', error);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    loadDocuments();
  }, []);

  const filteredDocuments = documents.filter(doc => {
    return (doc.name || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <ClientLayout currentPage="ClientDocuments">
        <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
        </div>
      </ClientLayout>
    );
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-AU', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <ClientLayout currentPage="ClientDocuments">
      <div style={{ padding: '24px 32px' }}>
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">My Documents</h1>
          <p className="text-slate-600">Access your financial documents, fact finds, and reports</p>
        </div>

        {documents.length > 0 && (
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full bg-white"
              />
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {documents.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Inbox className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No documents yet</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Documents will appear here once your adviser uploads them.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="col-span-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Document</div>
                <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</div>
                <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</div>
                <div className="col-span-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</div>
                <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <div key={doc.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center">
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{doc.type || 'Document'}</span>
                      </div>
                      <div className="col-span-2"><span className="text-sm text-slate-600">{formatDate(doc.created_date || doc.date)}</span></div>
                      <div className="col-span-1"><span className="text-sm text-slate-500">{doc.size || '\u2014'}</span></div>
                      <div className="col-span-2 flex items-center justify-end">
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center">
                    <p className="text-slate-500">No documents match your search</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
