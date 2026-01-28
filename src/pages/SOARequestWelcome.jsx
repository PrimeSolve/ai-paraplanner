import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import SOARequestHeader from '../components/soa/SOARequestHeader';
import { 
  Upload, Bot, TrendingUp, Shield, PieChart, FileText,
  ArrowRight, Play
} from 'lucide-react';

export default function SOARequestWelcome() {
  const [loading, setLoading] = useState(true);
  const [soaRequest, setSOARequest] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Check for existing SOA request
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (id) {
          const requests = await base44.entities.SOARequest.filter({ id });
          if (requests[0]) {
            setSOARequest(requests[0]);
          }
        } else {
          // Load most recent for this user
          const requests = await base44.entities.SOARequest.filter(
            { created_by: currentUser.email },
            '-created_date',
            1
          );
          if (requests[0]) {
            setSOARequest(requests[0]);
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

  const handleGetStarted = () => {
    navigate(createPageUrl('SOARequestPrefill') + (soaRequest?.id ? `?id=${soaRequest.id}` : ''));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <SOARequestLayout currentSection="welcome" soaRequest={soaRequest}>
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Info Banner */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-bold text-slate-800 mb-2">Welcome to SOA Request</h3>
              <p className="text-sm text-slate-700">
                Submit your Statement of Advice request to our AI paraplanner for professional SOA preparation.
              </p>
            </CardContent>
          </Card>
          {/* Video Guide Card */}
          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Play className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-slate-800">Watch this quick guide to get started</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">
                    This video walks you through each section of the SOA request and shows you how to use the AI paraplanner.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <Play className="w-16 h-16 mx-auto mb-3 opacity-70" />
                  <p className="text-sm opacity-70">Video Guide Coming Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tools Grid */}
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Tools to help you along the way</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Smart Prefill */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(createPageUrl('SOARequestPrefill'))}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Smart Prefill</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">
                    Upload existing documents and let AI assistants extract relevant information to prefill your SOA request.
                  </p>
                  <div className="flex items-center text-blue-600 text-sm font-semibold group-hover:gap-2 transition-all">
                    Upload documents <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>

              {/* AI Paraplanner */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow cursor-pointer group relative">
                <div className="absolute top-4 right-4 bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded uppercase">
                  New
                </div>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center mb-3">
                    <Bot className="w-6 h-6 text-teal-600" />
                  </div>
                  <CardTitle className="text-lg">AI Paraplanner</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">
                    Get help developing strategy ideas, finding products, and defining scope without completing forms.
                  </p>
                  <div className="flex items-center text-teal-600 text-sm font-semibold group-hover:gap-2 transition-all">
                    Talk to AI Paraplanner <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>

              {/* Cashflow Models */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(createPageUrl('SOARequestCashflow'))}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Cashflow Models</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">
                    View your client's existing position to help make strategy decisions as you build the advice.
                  </p>
                  <div className="flex items-center text-purple-600 text-sm font-semibold group-hover:gap-2 transition-all">
                    View existing position <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>

              {/* Insurance Needs */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(createPageUrl('SOARequestInsurance'))}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                    <Shield className="w-6 h-6 text-amber-600" />
                  </div>
                  <CardTitle className="text-lg">Insurance Needs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">
                    Live calculations help you find the correct cover amounts based on your client's circumstances.
                  </p>
                  <div className="flex items-center text-amber-600 text-sm font-semibold group-hover:gap-2 transition-all">
                    Calculate needs <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio Optimiser */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(createPageUrl('SOARequestPortfolio'))}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                    <PieChart className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Portfolio Optimiser</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">
                    Live calculations to build optimal portfolios, always relating back to your client's risk profile.
                  </p>
                  <div className="flex items-center text-green-600 text-sm font-semibold group-hover:gap-2 transition-all">
                    Build portfolios <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>

              {/* SOA Details */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(createPageUrl('SOARequestDetails'))}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-rose-600" />
                  </div>
                  <CardTitle className="text-lg">SOA Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">
                    Define the relevant sections of your SOA and add AI tips to guide each assistant.
                  </p>
                  <div className="flex items-center text-rose-600 text-sm font-semibold group-hover:gap-2 transition-all">
                    Configure sections <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* How it Works */}
          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>How it works</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 text-center">Upload documents</p>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-400 mx-4" />
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                    <FileText className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 text-center">Define scope & strategy</p>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-400 mx-4" />
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 text-center">Review & submit</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Get Started Button */}
          <div className="flex justify-center py-6">
            <Button 
              onClick={handleGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg"
            >
              Get started <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          </div>
          </div>
          </div>
          </SOARequestLayout>
          );
          }