import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, MessageSquare, RefreshCw, Info, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const sectionList = [
  { id: 'welcome', label: 'Welcome', path: 'FactFindWelcome' },
  { id: 'prefill', label: 'Pre-fill (upload documents)', path: 'FactFindPrefill' },
  { id: 'personal', label: '1. Personal', path: 'FactFindPersonal' },
  { id: 'dependants', label: '2. Dependants', path: 'FactFindDependants' },
  { id: 'trusts', label: '3. Trusts & Companies', path: 'FactFindTrusts' },
  { id: 'smsf', label: '4. SMSF', path: 'FactFindSMSF' },
  { id: 'superannuation', label: '5. Superannuation', path: 'FactFindSuperannuation' },
  { id: 'investment', label: '6. Investment', path: 'FactFindInvestment' },
  { id: 'assets_liabilities', label: '7. Assets & Liabilities', path: 'FactFindAssetsLiabilities' },
  { id: 'income_expenses', label: '8. Income & Expenses', path: 'FactFindIncomeExpenses' },
  { id: 'insurance', label: '9. Insurance policies', path: 'FactFindInsurance' },
  { id: 'super_tax', label: '10. Super & Tax', path: 'FactFindSuperTax' },
  { id: 'advice_reason', label: '11. Reason for seeking advice', path: 'FactFindAdviceReason' },
  { id: 'risk_profile', label: '12. Risk profile', path: 'FactFindRiskProfile' }
];

export default function FactFindReview() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!factFind) return;

    setSubmitting(true);
    try {
      await base44.entities.FactFind.update(factFind.id, {
        status: 'submitted',
        submitted_date: new Date().toISOString()
      });

      toast.success('Fact Find submitted successfully!');
      navigate(createPageUrl('Home'));
    } catch (error) {
      toast.error('Failed to submit fact find');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindRiskProfile') + `?id=${factFind?.id || ''}`);
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="review" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const completedSections = factFind?.sections_completed || [];
  const totalSections = sectionList.length;
  const completionPercentage = factFind?.completion_percentage || 0;
  const allComplete = completedSections.length === totalSections;

  return (
    <FactFindLayout currentSection="review" factFind={factFind}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-1">Review & Submit Your Fact Find</h3>
            <p className="text-sm text-slate-600">
              Review your responses across all sections before submitting to your adviser. You can click any section to review or update your information.
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
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/30"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Talk to Assistant
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Progress Overview */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-bold text-slate-800 text-lg">Overall Completion</h4>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{completionPercentage}%</div>
                    <div className="text-xs text-slate-500 font-semibold">Complete</div>
                  </div>
                  {allComplete && (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden mb-6">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {sectionList.map(section => {
                  const isComplete = completedSections.includes(section.id);
                  return (
                    <Link
                      key={section.id}
                      to={createPageUrl(section.path) + (factFind?.id ? `?id=${factFind.id}` : '')}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all group hover:shadow-md",
                        isComplete
                          ? "bg-green-50 border-green-300"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600">
                        {section.label}
                      </span>
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-slate-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Submit Card */}
          <Card className="border-slate-200 shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-lg">
              <h4 className="font-bold text-white text-lg">✓ Ready to Submit?</h4>
            </div>
            <CardContent className="p-6">
              <p className="text-slate-700 mb-4 leading-relaxed">
                Once you submit your fact find, your adviser will receive all the information you've provided 
                and will be in touch to discuss your financial planning needs.
              </p>

              {!allComplete && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-amber-900 mb-1">Some sections are incomplete</h5>
                      <p className="text-sm text-amber-800">
                        You can still submit, but your adviser will have a more complete picture if you finish all sections.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  disabled={submitting}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit to Your Adviser
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FactFindLayout>
  );
}