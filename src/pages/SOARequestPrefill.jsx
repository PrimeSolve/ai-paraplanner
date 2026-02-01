import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import SOARequestHeader from '../components/soa/SOARequestHeader';
import { Upload, FileText, MessageCircle, FileSpreadsheet, Shield, DollarSign, TrendingUp, Folder, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const documentTypes = [
  { id: 'file_notes', icon: FileText, title: 'File notes', description: 'Meeting notes, previous SOAs, and client history.', color: 'blue' },
  { id: 'correspondence', icon: MessageCircle, title: 'Client correspondence', description: 'Emails and messages about advice needs and objectives.', color: 'purple' },
  { id: 'portfolio', icon: FileSpreadsheet, title: 'Portfolio worksheet', description: 'Portfolio analysis and asset allocation worksheets.', color: 'green' },
  { id: 'insurance_needs', icon: Shield, title: 'Insurance needs worksheet', description: 'Needs analysis and calculations for insurance recommendations.', color: 'amber' },
  { id: 'insurance_quotes', icon: DollarSign, title: 'Insurance quotes', description: 'Quotes and policy comparison documents from providers.', color: 'rose' },
  { id: 'comparisons', icon: TrendingUp, title: 'Platform/provider comparisons', description: 'Research and comparison documents for platforms or providers.', color: 'indigo' },
  { id: 'cashflow', icon: TrendingUp, title: 'Cashflow modelling', description: 'Upload modelling projections and cashflow analysis documents.', color: 'cyan' },
  { id: 'other', icon: Folder, title: 'Other supporting documents', description: 'Any other documents relevant to your SOA request.', color: 'slate' }
];

export default function SOARequestPrefill() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [user, setUser] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (id) {
          const requests = await base44.entities.SOARequest.filter({ id });
          if (requests[0]) {
            setSOARequest(requests[0]);
            setUploadedDocs(requests[0].prefill_documents || []);
          }
        } else {
          // Create new SOA request
          const newRequest = await base44.entities.SOARequest.create({
            client_name: currentUser.full_name || currentUser.email,
            client_email: currentUser.email,
            status: 'draft'
          });
          setSOARequest(newRequest);
          navigate(createPageUrl('SOARequestPrefill') + `?id=${newRequest.id}`, { replace: true });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load SOA request');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleFileUpload = async (type, files) => {
    if (!files || files.length === 0) return;

    setProcessing(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return {
          type,
          file_url,
          file_name: file.name,
          uploaded_date: new Date().toISOString()
        };
      });

      const newDocs = await Promise.all(uploadPromises);
      const updatedDocs = [...uploadedDocs, ...newDocs];
      
      await base44.entities.SOARequest.update(soaRequest.id, {
        prefill_documents: updatedDocs
      });

      setUploadedDocs(updatedDocs);
      toast.success(`${newDocs.length} document(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload documents');
    } finally {
      setProcessing(false);
    }
  };

  const handleSkip = () => {
    navigate(createPageUrl('SOARequestScope') + `?id=${soaRequest.id}`);
  };

  const handleProcess = () => {
    // TODO: Process documents with AI
    toast.success('Processing documents...');
    navigate(createPageUrl('SOARequestScope') + `?id=${soaRequest.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    slate: 'bg-slate-100 text-slate-600'
  };

  return (
    <SOARequestLayout currentSection="prefill" soaRequest={soaRequest}>
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        {/* Dark Banner */}
        <div style={{ backgroundColor: '#1E293B', padding: '24px 32px', borderRadius: '16px 16px 0 0', marginBottom: '0' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
            Prefill
          </h1>
          <p style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8', margin: 0 }}>
            Upload documents such as file notes, insurance quotes, cashflow modelling to build the form faster
          </p>
        </div>

        {/* White Content Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0 0 16px 16px', border: '1px solid #E2E8F0', borderTop: 'none', padding: '24px 32px' }}>
        <div className="w-full space-y-6">
          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-bold text-slate-800 mb-2">AI-powered prefill for SOA requests</h3>
              <p className="text-sm text-slate-700 mb-3">
                Upload supporting documents and our AI will extract relevant information to streamline your SOA request process.
              </p>
              <p className="text-sm text-slate-600">
                <strong>How it works:</strong> Upload documents → AI extracts data → Information pre-populates relevant sections → You review and complete remaining fields.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                All information is processed securely and privately. You can upload multiple documents of each type.
              </p>
            </CardContent>
          </Card>

          {/* Document Upload Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {documentTypes.map((docType) => {
              const Icon = docType.icon;
              const docsOfType = uploadedDocs.filter(d => d.type === docType.id);
              
              return (
                <Card key={docType.id} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${colorClasses[docType.color]} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{docType.title}</CardTitle>
                        <p className="text-xs text-slate-600 mt-1">{docType.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <label className="block">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleFileUpload(docType.id, e.target.files)}
                        className="hidden"
                        disabled={processing}
                      />
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <Folder className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Choose files</p>
                        {docsOfType.length > 0 && (
                          <p className="text-xs text-slate-500 mt-1">{docsOfType.length} file(s) uploaded</p>
                        )}
                      </div>
                    </label>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Status */}
          <div className="text-center py-4">
            <p className="text-sm font-semibold text-slate-700">
              <strong>{uploadedDocs.length} documents</strong> uploaded so far. You can continue to the SOA request at any time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 py-6">
            <Button 
              variant="outline"
              onClick={handleSkip}
              disabled={processing}
              className="px-6"
            >
              Skip & start manually
            </Button>
            <Button 
              onClick={handleProcess}
              disabled={processing || uploadedDocs.length === 0}
              className="bg-blue-600 hover:bg-blue-700 px-6"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process documents & continue'
              )}
            </Button>
          </div>
        </div>
      </div>
    </SOARequestLayout>
  );
}