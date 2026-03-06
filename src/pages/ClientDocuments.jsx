import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  FileText,
  Download,
  Search,
  Inbox,
  Upload,
  Eye,
  X,
  File,
  FileSpreadsheet,
  FileImage,
  Shield,
  Mail,
  Scale,
  BarChart3,
  FolderOpen,
  CloudUpload,
  Loader2,
} from 'lucide-react';

const CATEGORIES = [
  { key: 'All', label: 'All' },
  { key: 'Identity', label: 'Identity' },
  { key: 'Financial Statements', label: 'Financial Statements' },
  { key: 'Insurance', label: 'Insurance' },
  { key: 'Correspondence', label: 'Correspondence' },
  { key: 'Legal', label: 'Legal' },
  { key: 'Reports', label: 'Reports' },
  { key: 'Other', label: 'Other' },
];

const CATEGORY_ICONS = {
  Identity: Shield,
  'Financial Statements': FileSpreadsheet,
  Insurance: Shield,
  Correspondence: Mail,
  Legal: Scale,
  Reports: BarChart3,
  Other: FolderOpen,
};

const SOURCE_STYLES = {
  'Fact Find Upload': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Client Upload': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'Adviser Upload': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

function getFileIcon(fileName) {
  if (!fileName) return FileText;
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return FileImage;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
  return FileText;
}

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClientDocuments() {
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
  const fileInputRef = useRef(null);

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

  const filteredDocuments = documents.filter((doc) => {
    const name = (doc.fileName || doc.file_name || doc.name || '').toLowerCase();
    const uploader = (doc.uploadedBy || doc.uploaded_by || '').toLowerCase();
    const client = (doc.clientName || doc.client_name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || name.includes(query) || uploader.includes(query) || client.includes(query);

    const docCategory = doc.category || doc.fileType || doc.file_type || 'Other';
    const matchesCategory = activeCategory === 'All' || docCategory === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const handleUpload = async () => {
    if (!selectedFiles.length || !clientId) return;
    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', uploadCategory);
        await axiosInstance.post(`/clients/${clientId}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      await loadDocuments(clientId);
      setUploadModalOpen(false);
      setSelectedFiles([]);
      setUploadCategory('Other');
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

  if (loading) {
    return (
      <ClientLayout currentPage="ClientDocuments">
        <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout currentPage="ClientDocuments">
      <div style={{ padding: '24px 32px' }}>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Documents</h1>
            <p className="text-slate-500 text-sm">Manage and access your financial documents</p>
          </div>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border-none cursor-pointer ${
                activeCategory === cat.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, uploader, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full bg-white"
            />
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {documents.length === 0 && !searchQuery && activeCategory === 'All' ? (
            /* Empty State */
            <div className="px-6 py-20 text-center">
              <Inbox className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No documents yet</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                Upload your first document to get started. Documents from fact finds, advisers, and your own uploads will appear here.
              </p>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded by</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocuments.length > 0 ? (
                      filteredDocuments.map((doc) => {
                        const displayName = doc.fileName || doc.file_name || doc.name || 'Untitled';
                        const category = doc.category || doc.fileType || doc.file_type || 'Other';
                        const clientName = doc.clientName || doc.client_name || '—';
                        const uploadedBy = doc.uploadedBy || doc.uploaded_by || '—';
                        const source = doc.source || 'Client Upload';
                        const displayDate = doc.uploadedAt || doc.uploaded_at || doc.createdDate || doc.created_date || doc.date;
                        const fileSize = doc.fileSize || doc.file_size;
                        const FileIcon = getFileIcon(displayName);
                        const sourceStyle = SOURCE_STYLES[source] || SOURCE_STYLES['Client Upload'];
                        const CategoryIcon = CATEGORY_ICONS[category] || FolderOpen;

                        return (
                          <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                            {/* Name */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                  <FileIcon className="w-4.5 h-4.5" />
                                </div>
                                <span className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{displayName}</span>
                              </div>
                            </td>
                            {/* Category */}
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                <CategoryIcon className="w-3 h-3" />
                                {category}
                              </span>
                            </td>
                            {/* Client */}
                            <td className="px-4 py-4">
                              <span className="text-sm text-slate-600">{clientName}</span>
                            </td>
                            {/* Uploaded by */}
                            <td className="px-4 py-4">
                              <span className="text-sm text-slate-600">{uploadedBy}</span>
                            </td>
                            {/* Source */}
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${sourceStyle.bg} ${sourceStyle.text} ${sourceStyle.border}`}>
                                {source}
                              </span>
                            </td>
                            {/* Date */}
                            <td className="px-4 py-4">
                              <span className="text-sm text-slate-500">{formatDate(displayDate)}</span>
                            </td>
                            {/* Size */}
                            <td className="px-4 py-4">
                              <span className="text-sm text-slate-500">{formatFileSize(fileSize)}</span>
                            </td>
                            {/* Actions */}
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleView(doc)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors bg-transparent border-none cursor-pointer"
                                  title="View"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View
                                </button>
                                <button
                                  onClick={() => handleDownload(doc)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors bg-transparent border-none cursor-pointer"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Download
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center">
                          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500 font-medium mb-1">No documents found</p>
                          <p className="text-slate-400 text-sm">Try adjusting your search or category filter</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Drag and drop files or browse to upload documents to your vault.
            </DialogDescription>
          </DialogHeader>

          {/* Category Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {CATEGORIES.filter((c) => c.key !== 'All').map((cat) => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            <CloudUpload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-blue-500' : 'text-slate-400'}`} />
            <p className="text-sm font-medium text-slate-700 mb-1">
              {dragOver ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-slate-500">or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <File className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeSelectedFile(idx)}
                    className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0 bg-transparent border-none cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setUploadModalOpen(false);
                setSelectedFiles([]);
                setUploadCategory('Other');
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-transparent border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </ClientLayout>
  );
}
