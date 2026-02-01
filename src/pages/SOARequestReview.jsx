import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SOARequestReview() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [finalNotes, setFinalNotes] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (id) {
          const requests = await base44.entities.SOARequest.filter({ id });
          if (requests[0]) {
            setSOARequest(requests[0]);
            setFinalNotes(requests[0].final_notes || '');
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        status: 'submitted',
        submitted_date: new Date().toISOString(),
        final_notes: finalNotes
      });
      toast.success('SOA request submitted successfully!');
      navigate(createPageUrl('SOAManagement'));
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  const sections = [
    { id: 'scope', label: 'Scope of Advice', data: soaRequest?.scope_of_advice },
    { id: 'products', label: 'Products & Entities', data: soaRequest?.products_entities },
    { id: 'insurance', label: 'Insurance', data: soaRequest?.insurance },
    { id: 'transactions', label: 'Transactions', data: soaRequest?.transactions },
    { id: 'portfolio', label: 'Portfolio', data: soaRequest?.portfolio },
    { id: 'strategy', label: 'Strategy', data: soaRequest?.strategy },
    { id: 'assumptions', label: 'Assumptions', data: soaRequest?.assumptions },
    { id: 'details', label: 'SOA Details', data: soaRequest?.soa_details }
  ];

  return (
    <SOARequestLayout currentSection="review" soaRequest={soaRequest}>
      {/* Dark Banner */}
      <div style={{ backgroundColor: '#1E293B', padding: '24px 32px', borderBottom: '1px solid #334155' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Review and submit</h1>
        <p style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: '1.5' }}>
          Final review and send to paraplanner
        </p>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="w-full space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <h3 className="font-bold text-slate-800 mb-2">Ready to Submit</h3>
              <p className="text-sm text-slate-700">
                Review your SOA request details below. Once submitted, a paraplanner will begin working on your Statement of Advice.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-slate-700">Client:</span>
                  <p className="text-slate-600">{soaRequest?.client_name}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Status:</span>
                  <p className="text-slate-600 capitalize">{soaRequest?.status}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Created:</span>
                  <p className="text-slate-600">{new Date(soaRequest?.created_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Documents Uploaded:</span>
                  <p className="text-slate-600">{soaRequest?.prefill_documents?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Section Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sections.map((section) => {
                const isComplete = section.data && Object.keys(section.data).length > 0;
                return (
                  <div key={section.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm font-medium text-slate-700">{section.label}</span>
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Final Notes for Paraplanner</CardTitle>
              <p className="text-sm text-slate-600">Any additional instructions or context</p>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={finalNotes}
                onChange={(e) => setFinalNotes(e.target.value)}
                placeholder="Add any final instructions, special requirements, or additional context for the paraplanner..."
                rows={6}
                className="text-sm"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 py-6">
            <Button 
              variant="outline"
              onClick={() => navigate(createPageUrl('SOARequestDetails') + `?id=${soaRequest.id}`)}
            >
              Back
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Submitting...' : 'Submit SOA Request'}
            </Button>
          </div>
        </div>
      </div>
    </SOARequestLayout>
  );
}