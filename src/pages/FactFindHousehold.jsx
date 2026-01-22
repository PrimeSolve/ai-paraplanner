import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Save, MessageSquare } from 'lucide-react';

export default function FactFindHousehold() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');

      if (id) {
        try {
          const finds = await base44.entities.FactFind.filter({ id });
          if (finds[0]) setFactFind(finds[0]);
        } catch (error) {
          console.error('Error loading fact find:', error);
        }
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleBack = () => {
    navigate(createPageUrl('FactFindAboutYou') + `?id=${factFind?.id || ''}`);
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="household" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  return (
    <FactFindLayout currentSection="household" factFind={factFind}>
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 mb-1">Your Household</h3>
          <p className="text-sm text-slate-600">Tell us about your family and dependents</p>
        </div>
        <Button
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/30"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Ask Assistant
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white">
              <CardTitle className="text-lg font-bold text-slate-800">Household Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <p className="text-slate-600 mb-6">This section is under construction.</p>
                <p className="text-sm text-slate-500">Continue to explore other sections or go back.</p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button
                  disabled
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
                >
                  Next: Your Income
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FactFindLayout>
  );
}