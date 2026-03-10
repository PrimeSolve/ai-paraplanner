import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AdviserLayout from '../components/adviser/AdviserLayout';
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
  FileText,
  Download,
  Search,
  Inbox,
  Upload,
  Eye,
  X,
  File,
  CloudUpload,
  Loader2,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
  ArrowUpDown,
  Calendar,
  Users,
  FolderOpen,
} from 'lucide-react';

/* ─── constants ─── */

const CATEGORIES = [
  'All',
  'Tax Return',
  'Income Statements',
  'Superannuation',
  'Insurance',
  'Rental Statements',
  'Portfolio & Investments',
  'Loan Statements',
  'Bank Statements',
  'Centrelink',
  'Other',
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

/* ─── component ─── */

export default function AdviserDocuments() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('Other');
  const [shareWithClient, setShareWithClient] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [renameModal, setRenameModal] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  /* ─── data fetching (unchanged API calls) ─── */

  const loadDocuments = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/documents');
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.items || response.data?.data || [];
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
      try {
        const { documentsApi } = await import('@/api/primeSolveClient');
        const docs = await documentsApi.getAll();
        setDocuments(docs);
      } catch {
        setDocuments([]);
      }
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await loadDocuments();
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
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ─── derived data ─── */

  const filteredDocuments = useMemo(() => {
    let list = documents.filter((doc) => {
      const name = (doc.fileName || doc.file_name || doc.name || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || name.includes(query);

      const docCategory = doc.category || doc.fileType || doc.file_type || 'Other';
      const matchesCategory = activeCategory === 'All' || docCategory === activeCategory;

      return matchesSearch && matchesCategory;
    });

    list.sort((a, b) => {
      let valA, valB;
      if (sortField === 'name') {
        valA = (a.fileName || a.file_name || a.name || '').toLowerCase();
        valB = (b.fileName || b.file_name || b.name || '').toLowerCase();
      } else if (sortField === 'category') {
        valA = (a.category || a.fileType || a.file_type || 'Other').toLowerCase();
        valB = (b.category || b.fileType || b.file_type || 'Other').toLowerCase();
      } else if (sortField === 'size') {
        valA = a.fileSize || a.file_size || 0;
        valB = b.fileSize || b.file_size || 0;
      } else {
        valA = new Date(a.uploadedAt || a.uploaded_at || a.createdDate || a.created_date || a.date || 0).getTime();
        valB = new Date(b.uploadedAt || b.uploaded_at || b.createdDate || b.created_date || b.date || 0).getTime();
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [documents, searchQuery, activeCategory, sortField, sortDir]);

  const totalDocuments = documents.length;
  const sharedCount = documents.filter((d) => d.shared).length;
  const lastUploadDate = useMemo(() => {
    if (!documents.length) return null;
    const dates = documents
      .map((d) => new Date(d.uploadedAt || d.uploaded_at || d.createdDate || d.created_date || d.date || 0))
      .filter((d) => !isNaN(d.getTime()));
    if (!dates.length) return null;
    return new Date(Math.max(...dates.map((d) => d.getTime())));
  }, [documents]);

  /* ─── handlers (unchanged API calls) ─── */

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', uploadCategory);
        formData.append('shared', shareWithClient);
        await axiosInstance.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      await loadDocuments();
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
      const response = await axiosInstance.get(`/documents/${docId}/download`, {
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

  const handleView = (doc) => {
    const url = doc.blobUrl || doc.blob_url;
    if (url) window.open(url, '_blank');
  };

  const handleDelete = async (doc) => {
    const docId = doc.id || doc.documentId;
    try {
      await axiosInstance.delete(`/documents/${docId}`);
      await loadDocuments();
    } catch (error) {
      console.error('Delete failed:', error);
    }
    setOpenMenuId(null);
  };

  const handleShare = async (doc) => {
    const docId = doc.id || doc.documentId;
    try {
      await axiosInstance.patch(`/documents/${docId}`, { shared: !doc.shared });
      await loadDocuments();
    } catch (error) {
      console.error('Share toggle failed:', error);
    }
    setOpenMenuId(null);
  };

  const handleRename = async () => {
    if (!renameModal || !renameValue.trim()) return;
    const docId = renameModal.id || renameModal.documentId;
    try {
      await axiosInstance.patch(`/documents/${docId}`, { fileName: renameValue.trim() });
      await loadDocuments();
    } catch (error) {
      console.error('Rename failed:', error);
    }
    setRenameModal(null);
    setRenameValue('');
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

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  /* ─── inline styles ─── */

  const s = {
    page: {
      fontFamily: "'DM Sans', sans-serif",
      background: '#F8FAFC',
      minHeight: '100vh',
      padding: '28px 32px',
    },
    card: {
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 14,
    },
    pill: (active) => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '7px 16px',
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      border: active ? '1px solid #C7D2FE' : '1px solid transparent',
      background: active ? '#EEF2FF' : 'transparent',
      color: active ? '#4F46E5' : '#64748B',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
      fontFamily: "'DM Sans', sans-serif",
    }),
    statTile: (colour) => ({
      ...{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14 },
      padding: '20px 24px',
      flex: 1,
      minWidth: 180,
    }),
    statValue: (colour) => ({
      fontSize: 28,
      fontWeight: 700,
      color: colour,
      marginBottom: 2,
      fontFamily: "'DM Sans', sans-serif",
    }),
    statLabel: {
      fontSize: 13,
      color: '#64748B',
      fontWeight: 500,
    },
    thBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#64748B',
      fontFamily: "'DM Sans', sans-serif",
    },
    fileTypeBadge: (type) => {
      const c = FILE_TYPE_STYLES[type] || FILE_TYPE_STYLES.DOC;
      return {
        width: 36,
        height: 36,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "'DM Mono', 'SF Mono', monospace",
        background: c.bg,
        color: c.text,
        flexShrink: 0,
      };
    },
    categoryBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 500,
      background: '#F1F5F9',
      color: '#475569',
    },
    sourceDot: (source) => ({
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: source === 'Adviser' || source === 'Adviser Upload' ? '#4F46E5' : '#059669',
      flexShrink: 0,
    }),
    actionBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '5px 12px',
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 500,
      background: '#F1F5F9',
      color: '#334155',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.15s',
      fontFamily: "'DM Sans', sans-serif",
    },
    moreBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F1F5F9',
      border: 'none',
      cursor: 'pointer',
      color: '#64748B',
      transition: 'all 0.15s',
    },
    menu: {
      position: 'absolute',
      right: 0,
      top: '100%',
      marginTop: 4,
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      zIndex: 50,
      minWidth: 180,
      overflow: 'hidden',
    },
    menuItem: (danger) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      padding: '9px 14px',
      fontSize: 13,
      fontWeight: 500,
      color: danger ? '#DC2626' : '#334155',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background 0.15s',
      fontFamily: "'DM Sans', sans-serif",
    }),
    uploadBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 20px',
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      background: '#4F46E5',
      color: '#fff',
      border: 'none',
      cursor: 'pointer',
      transition: 'background 0.15s',
      fontFamily: "'DM Sans', sans-serif",
    },
  };

  /* ─── render ─── */

  if (loading) {
    return (
      <AdviserLayout currentPage="AdviserDocuments">
        <div style={s.page} className="flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#4F46E5' }} />
        </div>
      </AdviserLayout>
    );
  }

  const getSource = (doc) => {
    const raw = doc.source || doc.uploadedBy || doc.uploaded_by || 'Client';
    if (/adviser/i.test(raw)) return 'Adviser';
    return 'Client';
  };

  return (
    <AdviserLayout currentPage="AdviserDocuments">
      <div style={s.page}>
        {/* ─── Header Row ─── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
              Documents
            </h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
              Manage and organise client documents
            </p>
          </div>
          <button
            style={s.uploadBtn}
            onClick={() => setUploadModalOpen(true)}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#4338CA')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#4F46E5')}
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        {/* ─── Stat Tiles ─── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={s.statTile('#4F46E5')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FolderOpen className="w-[18px] h-[18px]" style={{ color: '#4F46E5' }} />
              </div>
            </div>
            <div style={s.statValue('#4F46E5')}>{totalDocuments}</div>
            <div style={s.statLabel}>Total Documents</div>
          </div>

          <div style={s.statTile('#059669')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users className="w-[18px] h-[18px]" style={{ color: '#059669' }} />
              </div>
            </div>
            <div style={s.statValue('#059669')}>{sharedCount}</div>
            <div style={s.statLabel}>Shared with Client</div>
          </div>

          <div style={s.statTile('#0891B2')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ECFEFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar className="w-[18px] h-[18px]" style={{ color: '#0891B2' }} />
              </div>
            </div>
            <div style={s.statValue('#0891B2')}>
              {lastUploadDate ? formatDate(lastUploadDate) : '—'}
            </div>
            <div style={s.statLabel}>Last Upload</div>
          </div>
        </div>

        {/* ─── Category Pills + Search ─── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                style={s.pill(activeCategory === cat)}
                onClick={() => setActiveCategory(cat)}
                onMouseEnter={(e) => {
                  if (activeCategory !== cat) e.currentTarget.style.background = '#F1F5F9';
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== cat) e.currentTarget.style.background = 'transparent';
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', minWidth: 260 }}>
            <Search
              className="w-4 h-4"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
            />
            <input
              type="text"
              placeholder="Search documents…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 36px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                fontSize: 13,
                outline: 'none',
                background: '#fff',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>
        </div>

        {/* ─── Table ─── */}
        <div style={s.card}>
          {documents.length === 0 && !searchQuery && activeCategory === 'All' ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <Inbox className="w-16 h-16 mx-auto" style={{ color: '#CBD5E1', marginBottom: 16 }} />
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#334155', marginBottom: 6 }}>No documents yet</h3>
              <p style={{ fontSize: 14, color: '#64748B', maxWidth: 380, margin: '0 auto 20px' }}>
                Upload your first document to get started. Documents from advisers and clients will appear here.
              </p>
              <button
                style={s.uploadBtn}
                onClick={() => setUploadModalOpen(true)}
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', width: 52 }}>
                      <span style={{ ...s.thBtn, cursor: 'default' }}>Type</span>
                    </th>
                    <th style={{ padding: '12px 12px', textAlign: 'left' }}>
                      <button style={s.thBtn} onClick={() => toggleSort('name')}>
                        Name <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th style={{ padding: '12px 12px', textAlign: 'left' }}>
                      <button style={s.thBtn} onClick={() => toggleSort('category')}>
                        Category <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th style={{ padding: '12px 12px', textAlign: 'left' }}>
                      <span style={s.thBtn}>Source</span>
                    </th>
                    <th style={{ padding: '12px 12px', textAlign: 'left' }}>
                      <button style={s.thBtn} onClick={() => toggleSort('date')}>
                        Date <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th style={{ padding: '12px 12px', textAlign: 'left' }}>
                      <button style={s.thBtn} onClick={() => toggleSort('size')}>
                        Size <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th style={{ padding: '12px 20px', textAlign: 'right', width: 130 }}>
                      <span style={s.thBtn}>Actions</span>
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
                      const source = getSource(doc);
                      const docId = doc.id || doc.documentId;
                      const isHovered = hoveredRow === docId;
                      const isShared = !!doc.shared;

                      return (
                        <tr
                          key={docId}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            background: isHovered ? '#F8FAFC' : '#fff',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={() => setHoveredRow(docId)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          {/* File type badge */}
                          <td style={{ padding: '14px 20px' }}>
                            <div style={s.fileTypeBadge(typeBadge)}>{typeBadge}</div>
                          </td>

                          {/* Name + shared subtitle */}
                          <td style={{ padding: '14px 12px' }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 500, color: '#0F172A', marginBottom: isShared ? 2 : 0 }}>
                                {displayName}
                              </div>
                              {isShared && (
                                <div style={{ fontSize: 12, color: '#059669', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  ✓ Shared with client
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Category badge */}
                          <td style={{ padding: '14px 12px' }}>
                            <span style={s.categoryBadge}>{category}</span>
                          </td>

                          {/* Source */}
                          <td style={{ padding: '14px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <div style={s.sourceDot(source)} />
                              <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{source}</span>
                            </div>
                          </td>

                          {/* Date */}
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{ fontSize: 13, color: '#64748B' }}>{formatDate(displayDate)}</span>
                          </td>

                          {/* Size */}
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{ fontSize: 13, color: '#64748B' }}>{formatFileSize(fileSize)}</span>
                          </td>

                          {/* Actions (hover-reveal) */}
                          <td style={{ padding: '14px 20px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: 6,
                                opacity: isHovered || openMenuId === docId ? 1 : 0,
                                transition: 'opacity 0.15s',
                              }}
                            >
                              <button
                                style={s.actionBtn}
                                onClick={() => handleView(doc)}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </button>
                              <div style={{ position: 'relative' }} ref={openMenuId === docId ? menuRef : undefined}>
                                <button
                                  style={s.moreBtn}
                                  onClick={() => setOpenMenuId(openMenuId === docId ? null : docId)}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {openMenuId === docId && (
                                  <div style={s.menu}>
                                    <button
                                      style={s.menuItem(false)}
                                      onClick={() => handleDownload(doc)}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                    >
                                      <Download className="w-4 h-4" style={{ color: '#64748B' }} />
                                      Download
                                    </button>
                                    <button
                                      style={s.menuItem(false)}
                                      onClick={() => {
                                        setRenameModal(doc);
                                        setRenameValue(displayName);
                                        setOpenMenuId(null);
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                    >
                                      <Pencil className="w-4 h-4" style={{ color: '#64748B' }} />
                                      Rename
                                    </button>
                                    <button
                                      style={s.menuItem(false)}
                                      onClick={() => handleShare(doc)}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                    >
                                      <Share2 className="w-4 h-4" style={{ color: '#64748B' }} />
                                      {isShared ? 'Unshare' : 'Share'}
                                    </button>
                                    <div style={{ height: 1, background: '#F1F5F9', margin: '2px 0' }} />
                                    <button
                                      style={s.menuItem(true)}
                                      onClick={() => handleDelete(doc)}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                    >
                                      <Trash2 className="w-4 h-4" style={{ color: '#DC2626' }} />
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
                      <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center' }}>
                        <Search className="w-10 h-10 mx-auto" style={{ color: '#CBD5E1', marginBottom: 12 }} />
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#475569', marginBottom: 4 }}>No documents found</p>
                        <p style={{ fontSize: 13, color: '#94A3B8' }}>Try adjusting your search or category filter</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── Upload Modal ─── */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Upload Document</DialogTitle>
            <DialogDescription style={{ fontSize: 14, color: '#64748B' }}>
              Drag and drop files or browse to upload documents.
            </DialogDescription>
          </DialogHeader>

          {/* Category */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Category
            </label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                fontSize: 13,
                outline: 'none',
                background: '#fff',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Share toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Share with client</label>
            <button
              type="button"
              onClick={() => setShareWithClient(!shareWithClient)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                background: shareWithClient ? '#4F46E5' : '#CBD5E1',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: 3,
                  left: shareWithClient ? 23 : 3,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                }}
              />
            </button>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#4F46E5' : '#CBD5E1'}`,
              borderRadius: 14,
              padding: '36px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? '#EEF2FF' : '#FAFBFC',
              transition: 'all 0.15s',
            }}
          >
            <CloudUpload className="w-10 h-10 mx-auto" style={{ color: dragOver ? '#4F46E5' : '#94A3B8', marginBottom: 10 }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: '#334155', marginBottom: 4 }}>
              {dragOver ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p style={{ fontSize: 12, color: '#94A3B8' }}>or click to browse</p>
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
            <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '8px 12px',
                    background: '#F8FAFC',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <File className="w-4 h-4" style={{ color: '#94A3B8', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#334155', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </p>
                      <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeSelectedFile(idx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, flexShrink: 0 }}
                  >
                    <X className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
            <button
              onClick={() => {
                setUploadModalOpen(false);
                setSelectedFiles([]);
                setUploadCategory('Other');
                setShareWithClient(false);
              }}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                color: '#475569',
                background: '#fff',
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              style={{
                ...s.uploadBtn,
                opacity: uploading || selectedFiles.length === 0 ? 0.5 : 1,
                cursor: uploading || selectedFiles.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload{selectedFiles.length > 0 ? ` (${selectedFiles.length})` : ''}
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Rename Modal ─── */}
      <Dialog open={!!renameModal} onOpenChange={(open) => { if (!open) { setRenameModal(null); setRenameValue(''); } }}>
        <DialogContent className="sm:max-w-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>Rename Document</DialogTitle>
            <DialogDescription style={{ fontSize: 13, color: '#64748B' }}>
              Enter a new name for this document.
            </DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              fontSize: 14,
              outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
            }}
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
            <button
              onClick={() => { setRenameModal(null); setRenameValue(''); }}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                color: '#475569',
                background: '#fff',
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleRename}
              style={s.uploadBtn}
            >
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdviserLayout>
  );
}
