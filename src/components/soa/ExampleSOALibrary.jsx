import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  processing: {
    label: 'Processing',
    icon: Loader2,
    color: 'text-blue-600 bg-blue-100',
    animate: 'animate-spin',
  },
  ready: {
    label: 'Ready',
    icon: CheckCircle2,
    color: 'text-green-700 bg-green-100',
    animate: '',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-red-700 bg-red-100',
    animate: '',
  },
};

/**
 * Component for managing uploaded example SOAs.
 *
 * Props:
 *  - ownerType: 'advice_group' | 'adviser'
 *  - ownerId: string — advice_group_id or adviser id
 *  - onExtractedSections: (sections: object) => void — notifies parent with extracted section map
 */
export default function ExampleSOALibrary({ ownerType, ownerId, onExtractedSections }) {
  const [examples, setExamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (ownerId) loadExamples();
  }, [ownerId]);

  const loadExamples = async () => {
    try {
      const items = await base44.entities.SoaExample.filter({
        owner_type: ownerType,
        owner_id: ownerId,
      });
      setExamples(items);

      // Aggregate extracted sections from all ready examples
      const sectionMap = {};
      items
        .filter((e) => e.status === 'ready' && e.extracted_sections)
        .forEach((e) => {
          const sections =
            typeof e.extracted_sections === 'string'
              ? JSON.parse(e.extracted_sections)
              : e.extracted_sections;
          Object.entries(sections).forEach(([sectionId, content]) => {
            if (!sectionMap[sectionId]) sectionMap[sectionId] = content;
          });
        });
      onExtractedSections?.(sectionMap);
    } catch {
      // silent — examples are optional
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Upload the document
      const uploadResult = await base44.integrations.Core.UploadFile({ file });

      // 2. Create the soa-example record
      const example = await base44.entities.SoaExample.create({
        name: file.name,
        owner_type: ownerType,
        owner_id: ownerId,
        file_url: uploadResult.file_url || uploadResult.url,
        status: 'processing',
      });

      // 3. Trigger AI extraction
      base44.ai
        .extractTemplate({
          soa_example_id: example.id,
          file_url: uploadResult.file_url || uploadResult.url,
        })
        .then(() => loadExamples())
        .catch(() => loadExamples());

      toast.success('Example uploaded — AI is analyzing your SOA...');
      setExamples((prev) => [example, ...prev]);
    } catch {
      toast.error('Failed to upload example');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.SoaExample.delete(id);
      setExamples((prev) => prev.filter((e) => e.id !== id));
      toast.success('Example removed');
      loadExamples(); // refresh extracted sections
    } catch {
      toast.error('Failed to delete example');
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          <span className="font-semibold text-slate-800">Example SOA Library</span>
          <Badge variant="secondary" className="text-xs">
            {examples.length}
          </Badge>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5 mr-1" />
            )}
            Upload Example SOA
          </Button>
        </div>
      </div>

      {/* List */}
      <div>
        {loading && (
          <div className="flex items-center justify-center py-8 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading examples...
          </div>
        )}

        {!loading && examples.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-500">
            No example SOAs uploaded yet. Upload a PDF or DOCX to get started.
          </div>
        )}

        {!loading &&
          examples.map((ex) => {
            const status = STATUS_CONFIG[ex.status] || STATUS_CONFIG.processing;
            const StatusIcon = status.icon;
            const isExpanded = expandedId === ex.id;

            const extractedSections =
              ex.status === 'ready' && ex.extracted_sections
                ? typeof ex.extracted_sections === 'string'
                  ? JSON.parse(ex.extracted_sections)
                  : ex.extracted_sections
                : null;

            return (
              <div key={ex.id} className="border-b border-slate-100 last:border-b-0">
                <div className="flex items-center gap-3 px-4 py-3">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {ex.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(ex.created_date || ex.created_at)}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}
                  >
                    <StatusIcon className={`w-3 h-3 ${status.animate}`} />
                    {status.label}
                  </span>

                  {ex.status === 'processing' && (
                    <span className="text-xs text-blue-600">AI is analyzing your SOA...</span>
                  )}

                  {extractedSections && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => toggleExpand(ex.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-slate-400 hover:text-red-600"
                    onClick={() => handleDelete(ex.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Expanded extracted sections */}
                {isExpanded && extractedSections && (
                  <div className="px-4 pb-3">
                    <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                      {Object.entries(extractedSections).map(([sectionId, text]) => (
                        <div key={sectionId} className="text-sm">
                          <span className="font-medium text-slate-700 capitalize">
                            {sectionId.replace(/-/g, ' ')}
                          </span>
                          <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
