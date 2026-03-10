import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ClientLayout from '../components/client/ClientLayout';
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

const TYPE_BADGE = {
  pdf: { label: "PDF", bg: "#FEE2E2", fg: "#DC2626" },
  img: { label: "IMG", bg: "#DBEAFE", fg: "#2563EB" },
  xls: { label: "XLS", bg: "#D1FAE5", fg: "#059669" },
  doc: { label: "DOC", bg: "#EDE9FE", fg: "#7C3AED" },
};

const SOURCE_BADGE = {
  Adviser: { bg: "#EEF2FF", fg: "#4F46E5", dot: "#4F46E5" },
  Client:  { bg: "#F0FDF4", fg: "#16A34A", dot: "#16A34A" },
};

function getFileType(fileName) {
  if (!fileName) return "doc";
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff'].includes(ext)) return 'img';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'xls';
  return 'doc';
}

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── sub-components ─── */

function TypeBadge({ type }) {
  const t = TYPE_BADGE[type] || { label: "FILE", bg: "#F1F5F9", fg: "#64748B" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: t.bg, color: t.fg, fontSize: 9, fontWeight: 800, letterSpacing: "0.04em", fontFamily: "monospace", flexShrink: 0 }}>
      {t.label}
    </span>
  );
}

function SourceBadge({ source }) {
  const s = SOURCE_BADGE[source] || { bg: "#F1F5F9", fg: "#64748B", dot: "#64748B" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 20, background: s.bg, color: s.fg, fontSize: 11, fontWeight: 600 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {source}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 10, position: "relative", overflow: "hidden", flex: 1 }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: color + "15" }} />
      <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── main component ─── */

export default function ClientDocuments() {
  /* ─── state (original + new UI state) ─── */
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
  const fileInputRef = useRef(null);

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

  /* close menu on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (menuOpen !== null) setMenuOpen(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

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
  const lastUploadFormatted = lastUploadDate
    ? lastUploadDate.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
    : "—";

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
      // Fallback to blob_url if available
      if (doc.blobUrl || doc.blob_url) {
        window.open(doc.blobUrl || doc.blob_url, '_blank');
      }
    }
  };

  const handleView = (doc) => {
    const url = doc.blobUrl || doc.blob_url;
    if (url) {
      window.open(url, '_blank');
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

  const SortIcon = ({ col }) => (
    <span style={{ fontSize: 10, opacity: sortCol === col ? 1 : 0.3, marginLeft: 4 }}>
      {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", color: "#0F172A", background: "#fff" };

  /* ─── render ─── */

  if (loading) {
    return (
      <ClientLayout currentPage="ClientDocuments">
        <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#F8FAFC", minHeight: "100vh", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#4F46E5" }} />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout currentPage="ClientDocuments">
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#F8FAFC", minHeight: "100vh", padding: "28px 32px", color: "#0F172A" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          .pill:hover { background: #EEF2FF !important; color: #4F46E5 !important; border-color: #C7D2FE !important; }
          .doc-row:hover { background: #F8FAFC !important; }
          .doc-row:hover .row-actions { opacity: 1 !important; }
          .action-btn:hover { background: #EEF2FF !important; color: #4F46E5 !important; }
          .menu-item:hover { background: #F8FAFC; }
          .menu-item.danger:hover { background: #FEF2F2 !important; }
        `}</style>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.03em" }}>Documents</h1>
            <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>Client file vault</p>
          </div>
          <button onClick={() => setUploadModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: "#4F46E5", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, boxShadow: "0 2px 12px rgba(79,70,229,0.3)", fontFamily: "inherit" }}>
            ↑ Upload Document
          </button>
        </div>

        {/* 3 stat tiles */}
        <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
          <StatCard icon="📁" label="Total Documents" value={documents.length} sub={`${documents.length} files stored`} color="#4F46E5" />
          <StatCard icon="🔗" label="Shared with Client" value={sharedCount} sub="Visible in client portal" color="#059669" />
          <StatCard icon="🕐" label="Last Upload" value={lastUploadFormatted} color="#0891B2" />
        </div>

        {/* Filters */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94A3B8" }}>🔍</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search documents…" style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, outline: "none", width: 220, background: "#F8FAFC", color: "#0F172A", fontFamily: "inherit" }} />
          </div>
          <div style={{ width: 1, height: 28, background: "#E2E8F0", flexShrink: 0 }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} className="pill" onClick={() => setActiveCategory(cat)} style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${activeCategory === cat ? "#4F46E5" : "#E2E8F0"}`, background: activeCategory === cat ? "#EEF2FF" : "#fff", color: activeCategory === cat ? "#4F46E5" : "#64748B", fontSize: 12, fontWeight: activeCategory === cat ? 700 : 500, cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
          {documents.length === 0 && !searchQuery && activeCategory === 'All' ? (
            /* Empty State */
            <div style={{ padding: "64px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#334155", marginBottom: 6 }}>No documents yet</h3>
              <p style={{ fontSize: 14, color: "#64748B", maxWidth: 380, margin: "0 auto 20px" }}>
                Upload your first document to get started. Documents from fact finds, advisers, and your own uploads will appear here.
              </p>
              <button onClick={() => setUploadModalOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: "#4F46E5", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
                ↑ Upload Document
              </button>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 160px 110px 110px 80px 100px", padding: "10px 16px", borderBottom: "1.5px solid #E2E8F0", background: "#F8FAFC" }}>
                {[
                  { key: null,         label: ""          },
                  { key: "name",       label: "Document"  },
                  { key: "category",   label: "Category"  },
                  { key: "uploadedBy", label: "Source"    },
                  { key: "date",       label: "Date"      },
                  { key: "size",       label: "Size"      },
                  { key: null,         label: "Actions"   },
                ].map(({ key, label }, i) => (
                  <div key={i} onClick={() => key && handleSort(key)} style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", cursor: key ? "pointer" : "default", userSelect: "none" }}>
                    {label}{key && <SortIcon col={key} />}
                  </div>
                ))}
              </div>

              {filteredDocuments.length === 0 && (
                <div style={{ padding: "48px 24px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No documents found</div>
              )}

              {filteredDocuments.map((doc, i) => {
                const displayName = doc.fileName || doc.file_name || doc.name || 'Untitled';
                const category = doc.category || doc.fileType || doc.file_type || 'Other';
                const displayDate = doc.uploadedAt || doc.uploaded_at || doc.createdDate || doc.created_date || doc.date;
                const fileSize = doc.fileSize || doc.file_size;
                const fileType = getFileType(displayName);
                const source = getSource(doc);
                const docId = doc.id || doc.documentId;
                const isShared = !!doc.shared;

                return (
                  <div key={docId} className="doc-row" style={{ display: "grid", gridTemplateColumns: "44px 1fr 160px 110px 110px 80px 100px", padding: "12px 16px", borderBottom: i < filteredDocuments.length - 1 ? "1px solid #F1F5F9" : "none", alignItems: "center", background: "#fff", transition: "background 0.1s" }}>
                    <TypeBadge type={fileType} />

                    <div style={{ paddingRight: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", lineHeight: 1.3 }}>{displayName}</div>
                      {isShared && <div style={{ fontSize: 11, color: "#059669", marginTop: 2, fontWeight: 500 }}>✓ Shared with client</div>}
                    </div>

                    <div><span style={{ fontSize: 11, fontWeight: 600, background: "#F1F5F9", color: "#475569", padding: "3px 8px", borderRadius: 6 }}>{category}</span></div>

                    <SourceBadge source={source} />

                    <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
                      {displayDate ? new Date(displayDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "2-digit" }) : '—'}
                    </div>

                    <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: "monospace" }}>{formatFileSize(fileSize)}</div>

                    <div className="row-actions" style={{ display: "flex", gap: 4, opacity: 0, transition: "opacity 0.15s" }}>
                      <button className="action-btn" onClick={() => handleView(doc)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", fontSize: 11, fontWeight: 600, color: "#475569", cursor: "pointer", transition: "all 0.12s", fontFamily: "inherit" }}>View</button>
                      <div style={{ position: "relative" }}>
                        <button className="action-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === docId ? null : docId); }} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", fontSize: 15, color: "#64748B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}>⋯</button>
                        {menuOpen === docId && (
                          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", right: 0, top: 32, zIndex: 50, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", minWidth: 180 }}>
                            <button className="menu-item" onClick={() => handleDownload(doc)} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#374151", fontFamily: "inherit" }}>
                              Download
                            </button>
                            <button className="menu-item" onClick={() => handleRename(doc)} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#374151", fontFamily: "inherit" }}>
                              Rename
                            </button>
                            <button className="menu-item" onClick={() => handleShare(doc)} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#374151", fontFamily: "inherit" }}>
                              {isShared ? 'Unshare with client' : 'Share with client'}
                            </button>
                            <button className="menu-item danger" onClick={() => handleDelete(doc)} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#DC2626", fontFamily: "inherit" }}>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div style={{ padding: "10px 16px", borderTop: "1px solid #F1F5F9", background: "#F8FAFC", fontSize: 12, color: "#94A3B8", display: "flex", justifyContent: "space-between" }}>
                <span>{filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}</span>
                {activeCategory !== 'All' && <span>Filtered: {activeCategory}</span>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upload Modal */}
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
    </ClientLayout>
  );
}
