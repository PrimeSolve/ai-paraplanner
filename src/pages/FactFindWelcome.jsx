import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { useFactFind } from '../components/factfind/useFactFind';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Upload, TrendingUp, ArrowRight, FileText, Mic
} from 'lucide-react';

export default function FactFindWelcome() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading } = useFactFind();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const handleBegin = async () => {
    if (factFind?.id) {
      navigate(createPageUrl('FactFindPersonal') + `?id=${factFind.id}`);
    }
  };

  if (ffLoading) {
    return (
      <FactFindLayout currentSection="welcome" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  return (
    <FactFindLayout currentSection="welcome" factFind={factFind}>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="w-full space-y-4">
          {/* Welcome Banner */}
          <div className="bg-white rounded-xl px-6 py-5 shadow-sm border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Welcome to your Fact Find
            </h1>
            <p className="text-slate-600 text-sm">
              We'll guide you step-by-step to capture the information needed to prepare personalised financial advice.
            </p>
          </div>

          {/* Video Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white mb-1">
                Watch this quick guide to get started
              </h2>
              <p className="text-blue-50 text-sm">
                This video walks you through each section of the Fact Find and shows you how to use our AI assistant to complete it faster.
              </p>
            </div>
            <CardContent className="p-0">
              <div className="aspect-video bg-slate-900 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <FileText className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Video player would appear here</p>
                  <p className="text-xs mt-1">Synthesia video embed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tools Section */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-3">Tools to help you along the way</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-5">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Smart Document Upload</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Upload tax returns, super statements, and policies. Our AI extracts the key information automatically.
                  </p>
                  <Button variant="link" className="text-blue-600 p-0 h-auto font-semibold text-sm">
                    Upload documents →
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">
                  New
                </div>
                <CardContent className="p-5">
                  <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center mb-4">
                    <Mic className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">AI Assistant</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Get help anytime. Ask questions, get explanations, or complete sections entirely by voice conversation.
                  </p>
                  <Button variant="link" className="text-orange-600 p-0 h-auto font-semibold text-sm">
                    Talk to assistant →
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-5">
                  <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center mb-4">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Progress Dashboard</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Track your completion in real-time. See what's done, what's left, and your overall progress at a glance.
                  </p>
                  <Button variant="link" className="text-green-600 p-0 h-auto font-semibold text-sm">
                    View dashboard →
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* How it Works */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-6">How it works</h2>
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1 text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-1">Provide your information</h4>
                  <p className="text-xs text-slate-600">Complete each section at your own pace</p>
                </div>
                
                <ArrowRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                
                <div className="flex-1 text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-blue-600">2</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-1">AI processes & pre-fills</h4>
                  <p className="text-xs text-slate-600">Smart automation saves you time</p>
                </div>
                
                <ArrowRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                
                <div className="flex-1 text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-blue-600">3</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-1">Review & submit</h4>
                  <p className="text-xs text-slate-600">Get personalized advice</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-center">
                <Button
                  onClick={handleBegin}
                  disabled={ffLoading}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-lg shadow-blue-600/30"
                >
                  {factFind ? 'Continue Fact Find' : 'Get Started'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FactFindLayout>
  );
}