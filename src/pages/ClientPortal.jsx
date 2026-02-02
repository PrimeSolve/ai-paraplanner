import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ArrowRight } from 'lucide-react';

export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Load user's most recent fact find
        const finds = await base44.entities.FactFind.filter(
          { created_by: currentUser.email },
          '-updated_date',
          1
        );
        if (finds[0]) {
          setFactFind(finds[0]);
        }
      } catch (error) {
        console.error('Error loading client data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-800 mb-3">
          Welcome, {user?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-lg text-slate-600">
          {factFind ? 'Continue your financial planning journey' : 'Start your financial planning journey by creating your first Fact Find.'}
        </p>
      </div>

      {!factFind ? (
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
      ) : (
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">Fact Find in Progress</h3>
                  <p className="text-sm text-slate-600">
                    {factFind.completion_percentage || 0}% complete
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{factFind.completion_percentage || 0}%</div>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-4 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-500"
                  style={{ width: `${factFind.completion_percentage || 0}%` }}
                />
              </div>
              <Link to={createPageUrl('FactFindWelcome') + `?id=${factFind.id}`}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {factFind.completion_percentage === 100 ? 'Review Fact Find' : 'Continue Fact Find'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}