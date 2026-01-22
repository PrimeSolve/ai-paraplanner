import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Clock, Shield, CheckCircle2, ArrowRight } from 'lucide-react';

export default function FactFindStart() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const factFind = await base44.entities.FactFind.create({
        status: 'in_progress',
        current_step: 1
      });
      
      navigate(createPageUrl('FactFindStep1') + `?id=${factFind.id}`);
    } catch (error) {
      console.error('Error creating fact find:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Clock,
      title: 'Takes 15-20 minutes',
      description: 'Complete at your own pace with auto-save functionality'
    },
    {
      icon: Shield,
      title: 'Secure & Confidential',
      description: 'Your information is encrypted and protected'
    },
    {
      icon: CheckCircle2,
      title: 'Personalized Advice',
      description: 'Get tailored financial recommendations based on your data'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-800 to-slate-600 mb-6">
          <FileText className="w-10 h-10 text-amber-400" />
        </div>
        <h1 className="text-4xl font-bold text-slate-800 mb-4">
          Complete Your Fact Find
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Help us understand your financial situation so we can provide you with 
          personalized advice and recommendations tailored to your goals.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} className="border-slate-200 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-amber-600" />
                </div>
                <CardTitle className="text-lg text-slate-800">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{feature.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <CardTitle className="text-2xl text-slate-800">What to Expect</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-amber-700">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Personal Information</h3>
                <p className="text-slate-600">Basic details about you and your family</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-amber-700">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Employment & Income</h3>
                <p className="text-slate-600">Your current employment status and income sources</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-amber-700">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Financial Situation</h3>
                <p className="text-slate-600">Assets, liabilities, and monthly expenses</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-amber-700">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Goals & Objectives</h3>
                <p className="text-slate-600">Your short-term and long-term financial goals</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-amber-700">5</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Insurance Coverage</h3>
                <p className="text-slate-600">Current insurance policies and protection needs</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-amber-700">6</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Review & Submit</h3>
                <p className="text-slate-600">Review all your information before submission</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-200 flex justify-center">
            <Button
              onClick={handleStart}
              disabled={isLoading}
              size="lg"
              className="bg-slate-800 hover:bg-slate-700 text-white px-8"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Starting...
                </>
              ) : (
                <>
                  Begin Fact Find
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}