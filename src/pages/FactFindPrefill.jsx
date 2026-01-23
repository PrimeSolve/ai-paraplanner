import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  MessageSquare, RefreshCw, Info, Upload, 
  FileText, DollarSign, PiggyBank, Shield, 
  Home, TrendingUp, CreditCard, Landmark, 
  Gift, FolderOpen, ArrowRight
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

export default function FactFindPrefill() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (id) {
          const finds = await base44.entities.FactFind.filter({ id });
          if (finds[0]) {
            setFactFind(finds[0]);
            setUploadedFiles(finds[0].supporting_documents || []);
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

  const handleFileUpload = async (docType, event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(docType);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return {
          file_url,
          file_name: file.name,
          file_type: docType,
          uploaded_date: new Date().toISOString()
        };
      });

      const newFiles = await Promise.all(uploadPromises);
      const allFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(allFiles);

      if (factFind?.id) {
        await base44.entities.FactFind.update(factFind.id, {
          supporting_documents: allFiles
        });
      }

      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload files');
      console.error('Upload error:', error);
    } finally {
      setUploading(null);
    }
  };

  const handleSkip = () => {
    if (factFind?.id) {
      navigate(createPageUrl('FactFindPersonal') + `?id=${factFind.id}`);
    }
  };

  const handleProcess = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }

    setLoading(true);
    try {
      toast.success('Documents are being processed. You can continue to the Fact Find.');
      navigate(createPageUrl('FactFindPersonal') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to process documents');
    } finally {
      setLoading(false);
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

  return (
    <FactFindLayout currentSection="prefill" factFind={factFind}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 mb-1">
            Getting started – Pre-fill your Fact Find
          </h3>
          <p className="text-sm text-slate-600">
            Save time by uploading your financial documents. Our AI will pre-fill as much of the Fact Find as possible for you to review and confirm.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Info className="w-4 h-4 mr-2" />
            Key Assumptions
          </Button>
          <Link to={createPageUrl('FactFindAssistant') + (factFind?.id ? `?id=${factFind.id}` : '')}>
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/30"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Talk to Assistant
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-5">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 mb-2">AI-powered pre-fill</h3>
                  <p className="text-sm text-slate-700 mb-3">
                    Upload your financial documents and our AI assistants will extract key information to pre-fill your Fact Find.
                  </p>
                  <p className="text-sm text-slate-600 mb-3">
                    <strong>How it works:</strong> Upload documents → AI extracts data → You review and confirm → Complete any remaining questions.
                  </p>
                  <p className="text-xs text-slate-500">
                    All information is processed securely and privately. You can upload multiple documents of each type.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Upload Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {documentTypes.map((docType) => {
              const Icon = docType.icon;
              const isUploading = uploading === docType.id;
              const uploadCount = uploadedFiles.filter(f => f.file_type === docType.id).length;
              
              return (
                <Card key={docType.id} className="border-slate-200 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[docType.color]}`}>
                        <Icon className="w-6 h-6" />
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
                                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
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
                            ✓ {uploadCount} file{uploadCount !== 1 ? 's' : ''} uploaded
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
                  <strong className="text-slate-800">{uploadedFiles.length} documents</strong> uploaded so far. 
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
                    disabled={uploadedFiles.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
                  >
                    Process documents & continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FactFindLayout>
  );
}