import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import { 
  Upload, Bot, TrendingUp, Shield, PieChart, FileText,
  ArrowRight
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

        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (id) {
          const requests = await base44.entities.SOARequest.filter({ id });
          if (requests[0]) {
            setSOARequest(requests[0]);
          }
        } else {
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

  const tools = [
    {
      icon: Upload,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: 'Smart Prefill',
      description: 'Upload existing documents and let AI assistants extract relevant information to prefill your SOA request.',
      linkText: 'Upload documents',
      linkColor: 'text-blue-600',
      onClick: () => navigate(createPageUrl('SOARequestPrefill'))
    },
    {
      icon: Bot,
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      title: 'AI Paraplanner',
      description: 'Get help developing strategy ideas, finding products, and defining scope without completing forms.',
      linkText: 'Talk to AI Paraplanner',
      linkColor: 'text-teal-600',
      badge: 'NEW',
      onClick: () => {}
    },
    {
      icon: TrendingUp,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      title: 'Cashflow Models',
      description: "View your client's existing position to help make strategy decisions as you build the advice.",
      linkText: 'View existing position',
      linkColor: 'text-purple-600',
      onClick: () => navigate(createPageUrl('SOARequestCashflow'))
    },
    {
      icon: Shield,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      title: 'Insurance Needs',
      description: "Live calculations help you find the correct cover amounts based on your client's circumstances.",
      linkText: 'Calculate needs',
      linkColor: 'text-amber-600',
      onClick: () => navigate(createPageUrl('SOARequestInsurance'))
    },
    {
      icon: PieChart,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      title: 'Portfolio Optimiser',
      description: "Live calculations to build optimal portfolios, always relating back to your client's risk profile.",
      linkText: 'Build portfolios',
      linkColor: 'text-green-600',
      onClick: () => navigate(createPageUrl('SOARequestPortfolio'))
    },
    {
      icon: FileText,
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      title: 'SOA Details',
      description: 'Define the relevant sections of your SOA and add AI tips to guide each assistant.',
      linkText: 'Configure sections',
      linkColor: 'text-rose-600',
      onClick: () => navigate(createPageUrl('SOARequestDetails'))
    }
  ];

  return (
    <SOARequestLayout currentSection="welcome" soaRequest={soaRequest}>
      <div className="flex-1 overflow-auto bg-slate-50 w-full">
        
        {/* Main Content */}
        <div className="w-full px-6 py-8">
          <div className="space-y-4">
          
          {/* Welcome Banner */}
          <div className="border-blue-200 bg-blue-50 rounded-xl px-6 py-5 shadow-sm border">
            <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">Welcome to SOA Request</h1>
            <p className="text-slate-600 text-sm mb-4 text-center">
              Submit your Statement of Advice request to our AI paraplanner for professional SOA preparation.
            </p>

          </div>

          {/* Tools Section - Centered */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">
              Tools to help you along the way
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tools.map((tool, index) => (
                <div 
                  key={index}
                  onClick={tool.onClick}
                  className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer group relative"
                >
                  {tool.badge && (
                    <span className="absolute top-4 right-4 bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {tool.badge}
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-lg ${tool.iconBg} flex items-center justify-center mb-4 mx-auto`}>
                    <tool.icon className={`w-6 h-6 ${tool.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2 text-center">{tool.title}</h3>
                  <p className="text-sm text-slate-600 mb-4 text-center">{tool.description}</p>
                  <div className={`flex items-center justify-center ${tool.linkColor} text-sm font-semibold group-hover:gap-2 transition-all`}>
                    {tool.linkText} <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How it Works - Distinct Background */}
          <div className="bg-gradient-to-r from-blue-50 to-slate-100 rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-8 text-center">How it works</h2>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center flex-1 max-w-[150px]">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800 text-center">Upload documents</p>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-400 flex-shrink-0" />
              <div className="flex flex-col items-center flex-1 max-w-[150px]">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800 text-center">Define scope & strategy</p>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-400 flex-shrink-0" />
              <div className="flex flex-col items-center flex-1 max-w-[150px]">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800 text-center">Review & submit</p>
              </div>
            </div>
          </div>

          {/* Get Started Button - Centered */}
          <div className="flex justify-center py-4">
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