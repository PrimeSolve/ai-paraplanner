import React, { useState } from 'react';
import ClientLayout from '../components/client/ClientLayout';
import { 
  FileText, 
  Download, 
  Upload, 
  Filter,
  Search,
  File,
  FileCheck,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';

// Document type configurations
const documentTypes = {
  'Fact Find': { color: 'bg-blue-100 text-blue-700', icon: FileText },
  'Reverse Fact Find': { color: 'bg-purple-100 text-purple-700', icon: FileCheck },
  'SOA': { color: 'bg-green-100 text-green-700', icon: File },
  'Cashflow': { color: 'bg-orange-100 text-orange-700', icon: FileSpreadsheet },
  'Client Upload': { color: 'bg-slate-100 text-slate-700', icon: Upload },
  'Other': { color: 'bg-gray-100 text-gray-600', icon: File },
};

// Mock document data
const mockDocuments = [
  { id: 1, name: 'Fact Find - January 2026', type: 'Fact Find', date: '20/01/2026', size: '1.2 MB', status: 'complete' },
  { id: 2, name: 'Statement of Advice - Jan 2026.pdf', type: 'SOA', date: '20/01/2026', size: '2.4 MB', status: 'complete' },
  { id: 3, name: 'Cashflow Projection 2026-2030.pdf', type: 'Cashflow', date: '18/01/2026', size: '856 KB', status: 'complete' },
  { id: 4, name: 'Tax Return 2024-25.pdf', type: 'Client Upload', date: '15/01/2026', size: '1.8 MB', status: 'uploaded' },
  { id: 5, name: 'Reverse Fact Find - Dec 2025', type: 'Reverse Fact Find', date: '10/12/2025', size: '980 KB', status: 'complete' },
  { id: 6, name: 'Super Statement - Dec 2025.pdf', type: 'Client Upload', date: '05/12/2025', size: '2.1 MB', status: 'uploaded' },
  { id: 7, name: 'Insurance Policy Summary.pdf', type: 'Other', date: '01/12/2025', size: '450 KB', status: 'complete' },
  { id: 8, name: 'Fact Find - November 2025', type: 'Fact Find', date: '15/11/2025', size: '1.1 MB', status: 'complete' },
];

const filterOptions = [
  { label: 'All Documents', value: 'all' },
  { label: 'Fact Finds', value: 'Fact Find' },
  { label: 'SOA', value: 'SOA' },
  { label: 'Cashflow', value: 'Cashflow' },
  { label: 'Uploads', value: 'Client Upload' },
  { label: 'Other', value: 'Other' },
];

export default function ClientDocuments() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesFilter = activeFilter === 'all' || doc.type === activeFilter || 
      (activeFilter === 'Fact Find' && doc.type === 'Reverse Fact Find');
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTypeConfig = (type) => documentTypes[type] || documentTypes['Other'];

  return (
    <ClientLayout currentPage="ClientDocuments">
      <div style={{ padding: '24px 32px' }}>
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">My Documents</h1>
          <p className="text-slate-600">Access your financial documents, fact finds, and reports</p>
        </div>

        {/* Search, Filter & Upload */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 bg-white"
            />
          </div>

          {/* Filter & Upload */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer min-w-[160px]"
              >
                {filterOptions.map((filter) => (
                  <option key={filter.value} value={filter.value}>{filter.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="col-span-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Document</div>
            <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</div>
            <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</div>
            <div className="col-span-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</div>
            <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => {
                const typeConfig = getTypeConfig(doc.type);
                const TypeIcon = typeConfig.icon;
                return (
                  <div key={doc.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center">
                    <div className="col-span-5 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${typeConfig.color} flex items-center justify-center`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                        {doc.status === 'uploaded' && <span className="text-xs text-slate-500">Uploaded by you</span>}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>{doc.type}</span>
                    </div>
                    <div className="col-span-2"><span className="text-sm text-slate-600">{doc.date}</span></div>
                    <div className="col-span-1"><span className="text-sm text-slate-500">{doc.size}</span></div>
                    <div className="col-span-2 flex items-center justify-end">
                      <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No documents found</p>
                <p className="text-sm text-slate-400 mt-1">{searchQuery ? 'Try adjusting your search' : 'Documents will appear here once available'}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-500">Showing {filteredDocuments.length} of {mockDocuments.length} documents</div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Upload Document</h3>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center mb-4">
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-2">Drag and drop your file here, or</p>
                <button className="text-sm text-blue-600 font-medium hover:text-blue-700">browse to upload</button>
                <p className="text-xs text-slate-400 mt-3">Supported formats: PDF, DOC, DOCX, XLS, XLSX (Max 10MB)</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Document Type</label>
                <div className="relative">
                  <select className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Client Upload">General Upload</option>
                    <option value="Other">Tax Documents</option>
                    <option value="Other">Insurance Documents</option>
                    <option value="Other">Super Statements</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowUploadModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={() => setShowUploadModal(false)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Upload</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}