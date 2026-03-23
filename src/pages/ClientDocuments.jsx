import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { base44 } from '@/api/base44Client';
import axiosInstance from '@/api/axiosInstance';
import { formatDate } from '../utils/dateUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Upload,
  Loader2,
  X,
  File,
  Search,
  Eye,
  Download,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
  FolderOpen,
  Users,
  Calendar,
  ArrowUpDown,
  Inbox,
} from 'lucide-react';

/* ─── constants ─── */

const CATEGORIES = [
  "All",
  "Tax Return",
  "Income Statements",
  "Superannuation",
  "Insurance",
  "Rental Statements",
  "Portfolio & Investments",
  "Loan Statements",
  "Bank Statements",
  "Centrelink",
  "Other",
];

const FILE_TYPE_STYLES = {
  PDF: { bg: '#FEE2E2', text: '#DC2626' },
  IMG: { bg: '#DBEAFE', text: '#2563EB' },
  XLS: { bg: '#D1FAE5', text: '#059669' },
  DOC: { bg: '#E0E7FF', text: '#4F46E5' },
};

function getFileTypeBadge(fileName) {
  if (!fileName) return 'DOC';
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return 'PDF';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff'].includes(ext)) return 'IMG';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'XLS';
  return 'DOC';
}

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── main component ─── */

export default function ClientDocuments() {
  /* ─── state ─── */
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('Other');
  const [shareWithClient, setShareWithClient] = useState(false);
  const [sortCol, setSortCol] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [menuOpen, setMenuOpen] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  /* ─── data fetching (UNCHANGED) ─── */

  const loadDocuments = useCallback(async (cId) => {
    try {
      const response = await axiosInstance.get(`/clients/${cId}/documents`);
      const data = Array.isArray(response.data) ? response.data : (response.data?.items || response.data?.data || []);
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
      // Fallback to existing documents API
      try {
        const { documentsApi } = await import('@/api/primeSolveClient');
        const docs = await documentsApi.getByClient(cId);
        setDocuments(docs);
      } catch {
        setDocuments([]);
      }
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        const clients = await base44.entities.Client.filter({ email: user.email });
        if (clients[0]?.id) {
          setClientId(clients[0].id);
          await loadDocuments(clients[0].id);
        } else {
          setDocuments([]);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadDocuments]);

  /* close menu on outside click — aligned with AdviserDocuments */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ─── derived data ─── */

  const filteredDocuments = useMemo(() => {
    let list = documents.filter((doc) => {
      const name = (doc.fileName || doc.file_name || doc.name || '').toLowerCase();
      const uploader = (doc.uploadedBy || doc.uploaded_by || '').toLowerCase();
      const client = (doc.clientName || doc.client_name || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || name.includes(query) || uploader.includes(query) || client.includes(query);

      const docCategory = doc.category || doc.fileType || doc.file_type || 'Other';
      const matchesCategory = activeCategory === 'All' || docCategory === activeCategory;

      return matchesSearch && matchesCategory;
    });

    list = [...list].sort((a, b) => {
      let av, bv;
      if (sortCol === 'name') {
        av = (a.fileName || a.file_name || a.name || '').toLowerCase();
        bv = (b.fileName || b.file_name || b.name || '').toLowerCase();
      } else if (sortCol === 'category') {
        av = (a.category || a.fileType || a.file_type || 'Other').toLowerCase();
        bv = (b.category || b.fileType || b.file_type || 'Other').toLowerCase();
      } else if (sortCol === 'size') {
        av = a.fileSize || a.file_size || 0;
        bv = b.fileSize || b.file_size || 0;
      } else if (sortCol === 'uploadedBy') {
        av = (a.uploadedBy || a.uploaded_by || a.source || '').toLowerCase();
        bv = (b.uploadedBy || b.uploaded_by || b.source || '').toLowerCase();
      } else {
        av = a.uploadedAt || a.uploaded_at || a.createdDate || a.created_date || a.date || '';
        bv = b.uploadedAt || b.uploaded_at || b.createdDate || b.created_date || b.date || '';
      }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

    return list;
  }, [documents, searchQuery, activeCategory, sortCol, sortDir]);

  const sharedCount = documents.filter(d => d.shared).length;
  const lastUploadDate = useMemo(() => {
    if (!documents.length) return null;
    const dates = documents
      .map(d => new Date(d.uploadedAt || d.uploaded_at || d.createdDate || d.created_date || d.date || 0))
      .filter(d => !isNaN(d.getTime()) && d.getTime() > 0);
    if (!dates.length) return null;
    return new Date(Math.max(...dates.map(d => d.getTime())));
  }, [documents]);

  /* ─── handlers (UNCHANGED API calls) ─── */

  const handleUpload = async () => {
    if (!selectedFiles.length || !clientId) return;
    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', uploadCategory);
        formData.append('shared', shareWithClient);
        await axiosInstance.post(`/clients/${clientId}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      await loadDocuments(clientId);
      setUploadModalOpen(false);
      setSelectedFiles([]);
      setUploadCategory('Other');
      setShareWithClient(false);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    const docId = doc.id || doc.documentId;
    try {
      const response = await axiosInstance.get(`/clients/${clientId}/documents/${docId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName || doc.file_name || doc.name || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      if (doc.blobUrl || doc.blob_url) {
        window.open(doc.blobUrl || doc.blob_url, '_blank');
      }
    }
  };

  const handleView = async (doc) => {
    const docId = doc.id || doc.documentId;
    try {
      const response = await axiosInstance.get(`/clients/${clientId}/documents/${docId}/url`);
      const sasUrl = response.data?.url || response.data;
      if (sasUrl) {
        window.open(sasUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to get document URL:', err);
    }
  };

  const handleDelete = async (doc) => {
    const docId = doc.id || doc.documentId;
    try {
      await axiosInstance.delete(`/clients/${clientId}/documents/${docId}`);
      await loadDocuments(clientId);
    } catch (error) {
      console.error('Delete failed:', error);
    }
    setMenuOpen(null);
  };

  const handleShare = async (doc) => {
    const docId = doc.id || doc.documentId;
    try {
      await axiosInstance.patch(`/clients/${clientId}/documents/${docId}`, { shared: !doc.shared });
      await loadDocuments(clientId);
    } catch (error) {
      console.error('Share toggle failed:', error);
    }
    setMenuOpen(null);
  };

  const handleRename = async (doc) => {
    const docId = doc.id || doc.documentId;
    const displayName = doc.fileName || doc.file_name || doc.name || 'Untitled';
    const newName = window.prompt('Rename document:', displayName);
    if (newName && newName.trim() && newName !== displayName) {
      try {
        await axiosInstance.patch(`/clients/${clientId}/documents/${docId}`, { fileName: newName.trim() });
        await loadDocuments(clientId);
      } catch (error) {
        console.error('Rename failed:', error);
      }
    }
    setMenuOpen(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  /* ─── helpers ─── */

  const getSource = (doc) => {
    const raw = doc.source || doc.uploadedBy || doc.uploaded_by || 'Client';
    if (/adviser/i.test(raw)) return 'Adviser';
    return 'Client';
  };

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", color: "#0F172A", background: "#fff" };

  /* ─── render ─── */

  if (loading) {
    return (
      <div className="py-6 px-8 flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <div className="py-6 px-8">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Documents</h1>
            <p className="text-sm text-slate-500 mt-1">Client file vault</p>
          </div>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        {/* ─── KPI Tiles ─── */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
              <FolderOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">{documents.length}</div>
            <div className="text-sm text-slate-600">Total Documents</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">{sharedCount}</div>
            <div className="text-sm text-slate-600">Shared with Client</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">
              {lastUploadDate ? formatDate(lastUploadDate) : '—'}
            </div>
            <div className="text-sm text-slate-600">Last Upload</div>
          </div>
        </div>

        {/* ─── Filter Bar ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 mb-6">
          <div className="p-6 flex items-center gap-4">
            <div className="flex gap-2 flex-wrap flex-1 min-w-0">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      : 'text-slate-500 border border-transparent hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative shrink-0 w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-11 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-300 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* ─── Table ─── */}
        <div className="bg-white rounded-2xl border border-slate-200">
          {documents.length === 0 && !searchQuery && activeCategory === 'All' ? (
            <div className="py-16 px-6 text-center">
              <Inbox className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No documents yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">
                Upload your first document to get started. Documents from fact finds, advisers, and your own uploads will appear here.
              </p>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 w-[52px]">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</span>
                    </th>
                    <th className="text-left px-3 py-3">
                      <button onClick={() => handleSort('name')} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 uppercase tracking-wider bg-transparent border-none cursor-pointer">
                        Document <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left px-3 py-3">
                      <button onClick={() => handleSort('category')} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 uppercase tracking-wider bg-transparent border-none cursor-pointer">
                        Category <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left px-3 py-3">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Source</span>
                    </th>
                    <th className="text-left px-3 py-3">
                      <button onClick={() => handleSort('date')} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 uppercase tracking-wider bg-transparent border-none cursor-pointer">
                        Date <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left px-3 py-3">
                      <button onClick={() => handleSort('size')} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 uppercase tracking-wider bg-transparent border-none cursor-pointer">
                        Size <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-right px-6 py-3 w-[130px]">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((doc) => {
                      const displayName = doc.fileName || doc.file_name || doc.name || 'Untitled';
                      const category = doc.category || doc.fileType || doc.file_type || 'Other';
                      const displayDate = doc.uploadedAt || doc.uploaded_at || doc.createdDate || doc.created_date || doc.date;
                      const fileSize = doc.fileSize || doc.file_size;
                      const typeBadge = getFileTypeBadge(displayName);
                      const typeStyle = FILE_TYPE_STYLES[typeBadge] || FILE_TYPE_STYLES.DOC;
                      const source = getSource(doc);
                      const docId = doc.id || doc.documentId;
                      const isHovered = hoveredRow === docId;
                      const isShared = !!doc.shared;

                      return (
                        <tr
                          key={docId}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          onMouseEnter={() => setHoveredRow(docId)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          {/* File type badge */}
                          <td className="px-6 py-4">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ background: typeStyle.bg, color: typeStyle.text, fontFamily: "'DM Mono', 'SF Mono', monospace" }}
                            >
                              {typeBadge}
                            </div>
                          </td>

                          {/* Name + shared subtitle */}
                          <td className="px-3 py-4">
                            <div>
                              <div className="text-sm font-medium text-slate-800">{displayName}</div>
                              {isShared && (
                                <div className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                                  ✓ Shared with client
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Category badge */}
                          <td className="px-3 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                              {category}
                            </span>
                          </td>

                          {/* Source */}
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: source === 'Adviser' ? '#4F46E5' : '#059669' }}
                              />
                              <span className="text-sm text-slate-600 font-medium">{source}</span>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="px-3 py-4">
                            <span className="text-sm text-slate-500">{formatDate(displayDate)}</span>
                          </td>

                          {/* Size */}
                          <td className="px-3 py-4">
                            <span className="text-sm text-slate-500">{formatFileSize(fileSize)}</span>
                          </td>

                          {/* Actions — visible on hover or when menu is open */}
                          <td className="px-6 py-4">
                            <div
                              className="flex items-center justify-end gap-1.5 transition-opacity"
                              style={{ opacity: isHovered || menuOpen === docId ? 1 : 0 }}
                            >
                              <button
                                onClick={() => handleView(doc)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </button>
                              <div className="relative" ref={menuOpen === docId ? menuRef : undefined}>
                                <button
                                  onClick={() => setMenuOpen(menuOpen === docId ? null : docId)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {menuOpen === docId && (
                                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[180px] overflow-hidden">
                                    <button
                                      onClick={() => handleDownload(doc)}
                                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left border-none bg-transparent cursor-pointer"
                                    >
                                      <Download className="w-4 h-4 text-slate-400" />
                                      Download
                                    </button>
                                    <button
                                      onClick={() => handleRename(doc)}
                                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left border-none bg-transparent cursor-pointer"
                                    >
                                      <Pencil className="w-4 h-4 text-slate-400" />
                                      Rename
                                    </button>
                                    <button
                                      onClick={() => handleShare(doc)}
                                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left border-none bg-transparent cursor-pointer"
                                    >
                                      <Share2 className="w-4 h-4 text-slate-400" />
                                      {isShared ? 'Unshare' : 'Share'}
                                    </button>
                                    <div className="h-px bg-slate-100 mx-1" />
                                    <button
                                      onClick={() => handleDelete(doc)}
                                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left border-none bg-transparent cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Search className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                        <p className="text-sm font-medium text-slate-600 mb-1">No documents found</p>
                        <p className="text-xs text-slate-400">Try adjusting your search or category filter</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
                </span>
                {activeCategory !== 'All' && (
                  <span className="text-sm text-slate-500">Filtered: {activeCategory}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Upload Modal ─── */}
      {uploadModalOpen && (
        <div onClick={() => setUploadModalOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: 480, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.15)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>Upload Document</div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Add a file to the client vault</div>
              </div>
              <button onClick={() => { setUploadModalOpen(false); setSelectedFiles([]); setUploadCategory('Other'); setShareWithClient(false); }} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94A3B8" }}>✕</button>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? "#4F46E5" : "#CBD5E1"}`, borderRadius: 12, padding: "32px 24px", textAlign: "center", marginBottom: 16, background: dragOver ? "#EEF2FF" : "#F8FAFC", transition: "all 0.15s", cursor: "pointer" }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Drop file here or click to browse</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>PDF, Word, Excel, JPG, PNG — max 20 MB</div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>

            {/* Selected files */}
            {selectedFiles.length > 0 && (
              <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {selectedFiles.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 12px', background: '#F8FAFC', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <File className="w-4 h-4" style={{ color: '#94A3B8', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#334155', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                        <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button onClick={() => removeSelectedFile(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                      <X className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Category</label>
              <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} style={inputStyle}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div onClick={() => setShareWithClient(s => !s)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "12px 14px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0", cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Share with client</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Visible in client portal</div>
              </div>
              <div style={{ width: 40, height: 22, borderRadius: 11, background: shareWithClient ? "#4F46E5" : "#E2E8F0", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, left: shareWithClient ? 20 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              style={{ width: "100%", padding: 11, background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: uploading || selectedFiles.length === 0 ? "not-allowed" : "pointer", opacity: uploading || selectedFiles.length === 0 ? 0.5 : 1, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>Upload Document{selectedFiles.length > 0 ? ` (${selectedFiles.length})` : ''}</>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
