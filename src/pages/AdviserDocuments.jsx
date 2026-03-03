import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FolderOpen,
  Search,
  Filter,
  Download,
  FileText,
  File,
  FileCheck,
  FileSpreadsheet,
  ChevronDown,
  Loader2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

// Document type configurations
const documentTypes = {
  'Fact Find': { color: 'bg-blue-100 text-blue-700', icon: FileText },
  'Reverse Fact Find': { color: 'bg-purple-100 text-purple-700', icon: FileCheck },
  'SOA': { color: 'bg-green-100 text-green-700', icon: File },
  'Cashflow': { color: 'bg-orange-100 text-orange-700', icon: FileSpreadsheet },
  'Client Upload': { color: 'bg-slate-100 text-slate-700', icon: Upload },
  'Other': { color: 'bg-gray-100 text-gray-600', icon: File },
};

const filterOptions = [
  { label: 'All Documents', value: 'all' },
  { label: 'Fact Finds', value: 'Fact Find' },
  { label: 'SOA', value: 'SOA' },
  { label: 'Cashflow', value: 'Cashflow' },
  { label: 'Client Uploads', value: 'Client Upload' },
  { label: 'Other', value: 'Other' },
];

const uploadDocumentTypes = [
  { value: 'Fact Find', label: 'Fact Find' },
  { value: 'SOA', label: 'Statement of Advice' },
  { value: 'Cashflow', label: 'Cashflow Projection' },
  { value: 'Other', label: 'Other' },
];

export default function AdviserDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadingId, setDownloadingId] = useState(null);
  const [uploadDocType, setUploadDocType] = useState('Other');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      // Adviser sees documents across all their clients
      const docs = await base44.entities.Document.filter({ adviser_id: user.id });
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      // Try loading all documents as fallback (for advisers without adviser_id filter)
      try {
        const docs = await base44.entities.Document.list();
        setDocuments(docs);
      } catch {
        setDocuments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const user = await base44.auth.me();
      await base44.entities.Document.upload(
        selectedFile,
        {
          document_type: uploadDocType,
          adviser_id: user.id,
          uploaded_by: user.email,
        },
        (pct) => setUploadProgress(pct)
      );
      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadDocType('Other');
      await loadDocuments();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (doc) => {
    setDownloadingId(doc.id);
    try {
      const url = await base44.entities.Document.getDownloadUrl(doc.id);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error('Download URL not available');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download document');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (doc) => {
    if (!confirm(`Delete "${doc.file_name}"?`)) return;
    try {
      await base44.entities.Document.softDelete(doc.id);
      toast.success('Document deleted');
      setDocuments(documents.filter(d => d.id !== doc.id));
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete document');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const docType = doc.document_type || 'Other';
    const matchesFilter = activeFilter === 'all' || docType === activeFilter ||
      (activeFilter === 'Fact Find' && docType === 'Reverse Fact Find');
    const matchesSearch = (doc.file_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTypeConfig = (type) => documentTypes[type] || documentTypes['Other'];

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
    <div style={{ padding: '24px 32px' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Documents</h1>
          <p className="text-sm text-slate-600 mt-1">Manage client documents and resources</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)} className="bg-teal-600 hover:bg-teal-700">
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-64 bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white cursor-pointer min-w-[160px]"
          >
            {filterOptions.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-slate-400 mx-auto mb-3 animate-spin" />
          <p className="text-slate-500">Loading documents...</p>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {searchQuery || activeFilter !== 'all' ? 'No matching documents' : 'No documents yet'}
          </h3>
          <p className="text-slate-600 mb-4">
            {searchQuery || activeFilter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Upload and organize your client documents here'}
          </p>
          {!searchQuery && activeFilter === 'all' && (
            <Button onClick={() => setShowUploadModal(true)} className="bg-teal-600 hover:bg-teal-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload First Document
            </Button>
          )}
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Document</div>
            <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</div>
            <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</div>
            <div className="col-span-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</div>
            <div className="col-span-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</div>
            <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</div>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredDocuments.map((doc) => {
              const docType = doc.document_type || 'Other';
              const typeConfig = getTypeConfig(docType);
              const TypeIcon = typeConfig.icon;
              return (
                <div key={doc.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${typeConfig.color} flex items-center justify-center`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{doc.file_name || 'Untitled'}</p>
                      {doc.uploaded_by && <span className="text-xs text-slate-500">{doc.uploaded_by}</span>}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>{docType}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-slate-600">{doc.client_name || doc.client_id || '—'}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-sm text-slate-600">{formatDate(doc.created_date)}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-sm text-slate-500">{formatFileSize(doc.file_size_bytes)}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                      className="flex items-center gap-1 px-2 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {downloadingId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-slate-500">
        {!loading && `Showing ${filteredDocuments.length} of ${documents.length} documents`}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Upload Document</h3>

            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center mb-4 cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
              />
              {selectedFile ? (
                <>
                  <File className="w-10 h-10 text-teal-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-800">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatFileSize(selectedFile.size)}</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 mb-2">Click to select a file</p>
                  <p className="text-xs text-slate-400">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB)</p>
                </>
              )}
            </div>

            {uploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Document Type</label>
              <div className="relative">
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {uploadDocumentTypes.map((opt, i) => (
                    <option key={i} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                }}
                disabled={uploading}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  'Upload'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
