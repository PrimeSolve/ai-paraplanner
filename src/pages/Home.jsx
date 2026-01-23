import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Clock, CheckCircle2, AlertCircle, ArrowRight, Plus, DollarSign, TrendingUp, Shield, MessageSquare, RefreshCw, Info } from 'lucide-react';
import { format } from 'date-fns';

export default function Home() {
  const [user, setUser] = useState(null);
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const finds = await base44.entities.FactFind.filter(
          { created_by: currentUser.email },
          '-updated_date',
          1
        );
        if (finds[0]) {
          setFactFind(finds[0]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate financial metrics
  const calculateNetWorth = () => {
    if (!factFind?.assets_liabilities) return 0;
    const totalAssets = (factFind.assets_liabilities.assets || []).reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);
    const totalLiabilities = (factFind.assets_liabilities.liabilities || []).reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0);
    return totalAssets - totalLiabilities;
  };

  const calculateCashflow = () => {
    if (!factFind?.income_expenses) return 0;
    const totalIncome = (factFind.income_expenses.income_sources || []).reduce((sum, i) => sum + (parseFloat(i.annual_amount) || 0), 0);
    const totalExpenses = (factFind.income_expenses.expenses || []).reduce((sum, e) => sum + (parseFloat(e.annual_amount) || 0), 0);
    return (totalIncome - totalExpenses) / 12;
  };

  const calculateInsurance = () => {
    if (!factFind?.insurance) return 0;
    return (factFind.insurance.policies || []).reduce((sum, p) => sum + (parseFloat(p.sum_insured) || 0), 0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (!factFind) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            Welcome, {user?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-lg text-slate-600">
            Start your financial planning journey by creating your first Fact Find.
          </p>
        </div>

        <Card className="border-slate-200 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No Fact Find Yet</h3>
            <p className="text-slate-600 mb-6 text-center max-w-md">
              Begin your comprehensive financial assessment to get personalized advice.
            </p>
            <Link to={createPageUrl('FactFindWelcome')}>
              <Button className="bg-slate-800 hover:bg-slate-700 text-white">
                Create Your Fact Find
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const netWorth = calculateNetWorth();
  const cashflow = calculateCashflow();
  const insurance = calculateInsurance();
  const completionPercentage = factFind.completion_percentage || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-1">Client Dashboard</h3>
            <p className="text-sm text-slate-600">
              A high-level summary of your financial position. Click any section below to review or update details.
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
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-800">{formatCurrency(netWorth)}</div>
                </div>
              </div>
              <h4 className="font-bold text-slate-800 mb-1">Net worth</h4>
              <p className="text-xs text-slate-500">Assets minus liabilities</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-800">{formatCurrency(cashflow)}</div>
                </div>
              </div>
              <h4 className="font-bold text-slate-800 mb-1">Income minus expenses (excluding tax)</h4>
              <p className="text-xs text-slate-500">Monthly cashflow position</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-800">{formatCurrency(insurance)}</div>
                </div>
              </div>
              <h4 className="font-bold text-slate-800 mb-1">Total insurance cover</h4>
              <p className="text-xs text-slate-500">Insurance protection</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card className="border-slate-200 shadow-sm">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-lg">
            <h4 className="font-bold text-white text-lg">Your Progress</h4>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-blue-600">{completionPercentage}%</div>
                <div className="text-sm text-slate-500 font-semibold">Complete</div>
              </div>
              {completionPercentage === 100 && (
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
              )}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden mb-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <Link to={createPageUrl('FactFindWelcome') + `?id=${factFind.id}`}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {completionPercentage === 100 ? 'Review Fact Find' : 'Continue Fact Find'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 mb-2">Review Your Information</h4>
                  <p className="text-sm text-slate-600 mb-3">
                    Check and update your personal and financial details
                  </p>
                  <Link to={createPageUrl('FactFindPersonal') + `?id=${factFind.id}`}>
                    <Button variant="outline" size="sm" className="border-slate-300">
                      Go to Personal Details
                      <ArrowRight className="w-3 h-3 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 mb-2">Submit to Adviser</h4>
                  <p className="text-sm text-slate-600 mb-3">
                    Ready to submit? Send your completed fact find to your adviser
                  </p>
                  <Link to={createPageUrl('FactFindReview') + `?id=${factFind.id}`}>
                    <Button variant="outline" size="sm" className="border-slate-300">
                      Review & Submit
                      <ArrowRight className="w-3 h-3 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        {completionPercentage < 100 && (
          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">💡</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Next Steps</h4>
                  <p className="text-sm text-slate-700 mb-3">
                    Complete all sections to get the most accurate financial advice. Your adviser will have a better 
                    understanding of your situation with complete information.
                  </p>
                  <Link to={createPageUrl('FactFindWelcome') + `?id=${factFind.id}`}>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                      Continue Where You Left Off
                      <ArrowRight className="w-3 h-3 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Summary */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h4 className="font-bold text-slate-800 mb-4">Fact Find Status</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Last Updated</span>
                <span className="text-sm font-semibold text-slate-800">
                  {format(new Date(factFind.updated_date), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Submission Status</span>
                <span className="text-sm font-semibold text-slate-800 capitalize">
                  {factFind.status === 'submitted' ? 'Submitted' : 'Not submitted'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Sections Completed</span>
                <span className="text-sm font-semibold text-slate-800">
                  {factFind.sections_completed?.length || 0} of 14
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}