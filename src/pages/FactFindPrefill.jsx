import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { documentsApi } from '@/api/primeSolveClient';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Upload, FileText, DollarSign, PiggyBank, Shield,
  Home, TrendingUp, CreditCard, Landmark,
  Gift, FolderOpen, ArrowRight, CheckCircle2,
  AlertTriangle, Loader2, X
} from 'lucide-react';

const documentTypes = [
  { id: 'tax_return', icon: FileText, title: 'Tax return', description: 'Personal or business tax returns.', color: 'blue' },
  { id: 'income_statements', icon: DollarSign, title: 'Income statements', description: 'Payslips, group certificates and income summaries.', color: 'green' },
  { id: 'super_statements', icon: PiggyBank, title: 'Superannuation statements', description: 'Super fund statements or annual reports.', color: 'indigo' },
  { id: 'insurance_policies', icon: Shield, title: 'Insurance policies', description: 'Life, TPD, trauma and income protection policies.', color: 'amber' },
  { id: 'rental_statements', icon: Home, title: 'Rental statements', description: 'Property rental income statements.', color: 'purple' },
  { id: 'portfolio_reports', icon: TrendingUp, title: 'Portfolio & investment reports', description: 'Wrap, platform or portfolio valuation statements.', color: 'emerald' },
  { id: 'loan_statements', icon: CreditCard, title: 'Loan statements', description: 'Mortgage, investment or personal loan statements.', color: 'red' },
  { id: 'bank_statements', icon: Landmark, title: 'Bank account statements', description: 'Everyday, savings or offset account statements.', color: 'cyan' },
  { id: 'centrelink', icon: Gift, title: 'Centrelink / social security', description: 'Centrelink schedules or social security assessments.', color: 'pink' },
  { id: 'other', icon: FolderOpen, title: 'Other documents', description: 'Any other financial documents you\'d like us to review.', color: 'slate' }
];

const SECTION_LABELS = {
  personal: 'Personal Details',
  income: 'Income',
  superannuation: 'Superannuation',
  insurance: 'Insurance',
  assets_liabilities: 'Assets & Liabilities',
  liabilities: 'Liabilities',
};

const CONFIDENCE_THRESHOLD = 0.85;

/**
 * Recursively collect all confidence values from the extracted JSON.
 * Returns an array of { section, field, confidence, value }.
 */
function collectConfidenceFields(obj, section = '', path = '') {
  const results = [];
  if (!obj || typeof obj !== 'object') return results;

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      results.push(...collectConfidenceFields(item, section, `${path}[${i}]`));
    });
    return results;
  }

  // If this object has { value, confidence }, it's a leaf field
  if ('confidence' in obj && 'value' in obj) {
    results.push({
      section,
      field: path,
      confidence: obj.confidence,
      value: obj.value,
    });
    return results;
  }

  for (const [key, val] of Object.entries(obj)) {
    const nextSection = section || key;
    const nextPath = path ? `${path}.${key}` : key;
    results.push(...collectConfidenceFields(val, nextSection, nextPath));
  }
  return results;
}

/**
 * Strip confidence wrappers to produce flat values for pre-filling.
 */
function flattenExtractedData(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(flattenExtractedData);

  if ('confidence' in obj && 'value' in obj) {
    return obj.value;
  }

  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    result[key] = flattenExtractedData(val);
  }
  return result;
}

export default function FactFindPrefill() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadingType, setUploadingType] = useState(null);
  const [processingDocs, setProcessingDocs] = useState(new Map()); // docId -> status
  const [extractionResults, setExtractionResults] = useState([]); // array of parsed extracted sections
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [prefilling, setPrefilling] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (id) {
          const finds = await base44.entities.FactFind.filter({ id });
          if (finds[0]) {
            setFactFind(finds[0]);
          }
        }
      } catch (error) {
        console.error('Error loading fact find:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Poll processing documents for completion
  const pollDocument = useCallback(async (docId) => {
    try {
      const doc = await documentsApi.pollUntilExtracted(docId);
      setProcessingDocs(prev => {
        const next = new Map(prev);
        next.set(docId, 'extracted');
        return next;
      });

      // Parse the extracted sections
      if (doc.extracted_sections) {
        const parsed = typeof doc.extracted_sections === 'string'
          ? JSON.parse(doc.extracted_sections)
          : doc.extracted_sections;
        setExtractionResults(prev => [...prev, { docId, sections: parsed }]);
      }

      setUploadedDocs(prev =>
        prev.map(d => d.id === docId ? { ...d, status: 'Extracted' } : d)
      );
    } catch {
      setProcessingDocs(prev => {
        const next = new Map(prev);
        next.set(docId, 'error');
        return next;
      });
    }
  }, []);

  const handleFileUpload = async (docType, event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Determine client ID from factFind
    const clientId = factFind?.client_id;
    if (!clientId) {
      toast.error('No client ID found. Please start from a client profile.');
      return;
    }

    setUploadingType(docType);
    try {
      const uploadPromises = files.map(async (file) => {
        const result = await documentsApi.upload(file, clientId, docType);
        return result;
      });

      const newDocs = await Promise.all(uploadPromises);
      setUploadedDocs(prev => [...prev, ...newDocs]);

      // Start polling each document for extraction
      for (const doc of newDocs) {
        setProcessingDocs(prev => {
          const next = new Map(prev);
          next.set(doc.id, 'processing');
          return next;
        });
        pollDocument(doc.id);
      }

      toast.success(`${files.length} file(s) uploaded — extraction started`);
    } catch (error) {
      toast.error('Failed to upload files');
      console.error('Upload error:', error);
    } finally {
      setUploadingType(null);
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleRemoveDoc = (docId) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== docId));
    setProcessingDocs(prev => {
      const next = new Map(prev);
      next.delete(docId);
      return next;
    });
    setExtractionResults(prev => prev.filter(r => r.docId !== docId));
  };

  const handleSkip = () => {
    if (factFind?.id) {
      navigate(createPageUrl('FactFindPersonal') + `?id=${factFind.id}`);
    }
  };

  const handleProcess = async () => {
    if (uploadedDocs.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }

    // Check if any docs are still processing
    const stillProcessing = [...processingDocs.values()].some(s => s === 'processing');
    if (stillProcessing) {
      toast.info('Some documents are still being extracted. Please wait.');
      return;
    }

    if (extractionResults.length === 0) {
      toast.info('No extraction results yet. Documents may still be processing.');
      return;
    }

    // Build summary data
    const allFields = [];
    const populatedSections = new Set();

    for (const result of extractionResults) {
      const fields = collectConfidenceFields(result.sections);
      allFields.push(...fields);
      for (const f of fields) {
        populatedSections.add(f.section);
      }
    }

    const lowConfidenceFields = allFields.filter(f => f.confidence < CONFIDENCE_THRESHOLD);

    setSummaryData({
      totalDocuments: extractionResults.length,
      populatedSections: [...populatedSections],
      totalFields: allFields.length,
      lowConfidenceFields,
    });
    setShowSummary(true);
  };

  const handleConfirmPrefill = async () => {
    setPrefilling(true);
    try {
      // Merge extraction results into fact find sections
      const mergedSections = {};
      for (const result of extractionResults) {
        const flat = flattenExtractedData(result.sections);
        for (const [section, data] of Object.entries(flat)) {
          if (!mergedSections[section]) {
            mergedSections[section] = data;
          } else {
            // Merge arrays by concatenation, objects by shallow merge
            if (Array.isArray(data) && Array.isArray(mergedSections[section])) {
              mergedSections[section] = [...mergedSections[section], ...data];
            } else if (typeof data === 'object' && typeof mergedSections[section] === 'object') {
              mergedSections[section] = { ...mergedSections[section], ...data };
            }
          }
        }
      }

      // Save the pre-filled data along with the raw extraction for confidence highlighting
      if (factFind?.id) {
        await base44.entities.FactFind.update(factFind.id, {
          ...mergedSections,
          ai_extracted_data: extractionResults.map(r => r.sections),
          supporting_documents: uploadedDocs.map(d => ({
            id: d.id,
            file_name: d.file_name,
            file_type: d.file_type,
            status: d.status || 'Extracted',
            uploaded_at: d.uploaded_at,
          })),
        });
      }

      setShowSummary(false);
      toast.success('Fact Find pre-filled with extracted data');
      navigate(createPageUrl('FactFindPersonal') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to pre-fill fact find');
      console.error('Prefill error:', error);
    } finally {
      setPrefilling(false);
    }
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="prefill" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    pink: 'bg-pink-50 text-pink-600',
    slate: 'bg-slate-50 text-slate-600'
  };

  const allProcessing = [...processingDocs.values()].some(s => s === 'processing');
  const extractedCount = [...processingDocs.values()].filter(s => s === 'extracted').length;

  return (
    <FactFindLayout currentSection="prefill" factFind={factFind}>
      <FactFindHeader
        title="Getting started — Pre-fill your Fact Find"
        description="Save time by uploading your financial documents. Our AI will pre-fill as much of the Fact Find as possible for you to review and confirm."
        factFind={factFind}
      />

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="w-full space-y-4">
          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-5">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 mb-2">AI-powered pre-fill</h3>
                  <p className="text-sm text-slate-700 mb-3">
                    Upload your financial documents and our AI assistants will extract key information to pre-fill your Fact Find.
                  </p>
                  <p className="text-sm text-slate-600 mb-3">
                    <strong>How it works:</strong> Upload documents &rarr; AI extracts data &rarr; You review and confirm &rarr; Complete any remaining questions.
                  </p>
                  <p className="text-xs text-slate-500">
                    All information is processed securely and privately. You can upload multiple documents of each type.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extraction Status Banner */}
          {uploadedDocs.length > 0 && (
            <Card className={`border ${allProcessing ? 'border-amber-200 bg-amber-50/50' : 'border-green-200 bg-green-50/50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {allProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                      <span className="text-sm font-medium text-amber-800">
                        Extracting data from {processingDocs.size} document(s)... {extractedCount} complete
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {extractedCount} document(s) extracted successfully
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Uploaded Documents List */}
          {uploadedDocs.length > 0 && (
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Uploaded Documents</h4>
                <div className="space-y-2">
                  {uploadedDocs.map((doc) => {
                    const docStatus = processingDocs.get(doc.id) || 'processing';
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-700">{doc.file_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {docStatus === 'processing' && (
                            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Processing...
                            </Badge>
                          )}
                          {docStatus === 'extracted' && (
                            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Extracted
                            </Badge>
                          )}
                          {docStatus === 'error' && (
                            <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Error
                            </Badge>
                          )}
                          <button
                            onClick={() => handleRemoveDoc(doc.id)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Upload Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {documentTypes.map((docType) => {
              const Icon = docType.icon;
              const isUploading = uploadingType === docType.id;
              const uploadCount = uploadedDocs.filter(d => d.file_type === docType.id).length;

              return (
                <Card key={docType.id} className="border-slate-200 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[docType.color]}`}>
                       <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 mb-1">{docType.title}</h4>
                        <p className="text-xs text-slate-600 mb-3">{docType.description}</p>

                        <label className="cursor-pointer">
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => handleFileUpload(docType.id, e)}
                            className="hidden"
                            disabled={isUploading}
                          />
                          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-all text-sm font-medium text-slate-700">
                            {isUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                Choose files
                              </>
                            )}
                          </div>
                        </label>

                        {uploadCount > 0 && (
                          <p className="text-xs text-green-600 mt-2 font-medium">
                            {uploadCount} file{uploadCount !== 1 ? 's' : ''} uploaded
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer Actions */}
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  <strong className="text-slate-800">{uploadedDocs.length} documents</strong> uploaded so far.
                  You can continue to the Fact Find at any time.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSkip}
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Skip & fill manually
                  </Button>
                  <Button
                    onClick={handleProcess}
                    disabled={uploadedDocs.length === 0 || allProcessing}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
                  >
                    {allProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        Review extracted data & continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Extraction Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              AI Extraction Summary
            </DialogTitle>
          </DialogHeader>

          {summaryData && (
            <div className="space-y-4">
              <p className="text-sm text-slate-700">
                AI found data in <strong>{summaryData.populatedSections.length} sections</strong> from{' '}
                <strong>{summaryData.totalDocuments} document{summaryData.totalDocuments !== 1 ? 's' : ''}</strong>.
              </p>

              {/* Section checklist */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">Sections populated:</h4>
                {Object.entries(SECTION_LABELS).map(([key, label]) => {
                  const populated = summaryData.populatedSections.includes(key);
                  return (
                    <div key={key} className="flex items-center gap-2 py-1">
                      <Checkbox checked={populated} disabled className="pointer-events-none" />
                      <span className={`text-sm ${populated ? 'text-slate-800' : 'text-slate-400'}`}>
                        {label}
                      </span>
                      {populated && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Low confidence fields */}
              {summaryData.lowConfidenceFields.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Fields needing attention ({summaryData.lowConfidenceFields.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {summaryData.lowConfidenceFields.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-amber-50 border border-amber-100">
                        <span className="text-xs text-amber-800">
                          {SECTION_LABELS[f.section] || f.section} &rarr; {f.field}
                        </span>
                        <Badge variant="outline" className="text-amber-700 border-amber-300 text-xs">
                          {Math.round(f.confidence * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-amber-600">
                    These fields will be highlighted in amber for you to review and confirm.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSummary(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPrefill}
              disabled={prefilling}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {prefilling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Pre-filling...
                </>
              ) : (
                'Apply & continue to Fact Find'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FactFindLayout>
  );
}
