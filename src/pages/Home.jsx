import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Clock, CheckCircle2, AlertCircle, ArrowRight, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function Home() {
  const [user, setUser] = useState(null);
  const [factFinds, setFactFinds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const finds = await base44.entities.FactFind.filter(
          { created_by: currentUser.email },
          '-updated_date'
        );
        setFactFinds(finds);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const statusConfig = {
    draft: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100', label: 'Draft' },
    in_progress: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'In Progress' },
    completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
    under_review: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Under Review' }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-800 mb-3">
          Welcome back, {user?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-lg text-slate-600">
          Manage your financial planning journey and complete your Fact Find assessment.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card className="border-slate-200 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-slate-800 to-slate-700 text-white border-0">
          <CardHeader>
            <FileText className="w-12 h-12 mb-4 text-amber-400" />
            <CardTitle className="text-2xl">Start New Fact Find</CardTitle>
            <CardDescription className="text-slate-300">
              Begin your comprehensive financial assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to={createPageUrl('FactFindWelcome')}>
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-slate-800">Your Progress</CardTitle>
            <CardDescription>Track your financial planning milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Fact Finds</span>
                <span className="text-2xl font-bold text-slate-800">{factFinds.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Completed</span>
                <span className="text-2xl font-bold text-green-600">
                  {factFinds.filter(f => f.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">In Progress</span>
                <span className="text-2xl font-bold text-blue-600">
                  {factFinds.filter(f => f.status === 'in_progress').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Fact Finds */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Your Fact Finds</h2>
          <Link to={createPageUrl('FactFindWelcome')}>
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
              <Plus className="w-4 h-4 mr-2" />
              New Fact Find
            </Button>
          </Link>
        </div>

        {factFinds.length === 0 ? (
          <Card className="border-slate-200 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Fact Finds Yet</h3>
              <p className="text-slate-600 mb-6 text-center max-w-md">
                Start your financial planning journey by completing your first Fact Find assessment.
              </p>
              <Link to={createPageUrl('FactFindWelcome')}>
                <Button className="bg-slate-800 hover:bg-slate-700 text-white">
                  Create Your First Fact Find
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {factFinds.map((factFind) => {
              const status = statusConfig[factFind.status] || statusConfig.draft;
              const StatusIcon = status.icon;
              
              return (
                <Card
                  key={factFind.id}
                  className="border-slate-200 hover:shadow-md transition-all duration-300 cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 mb-1">
                            Fact Find #{factFind.id.slice(0, 8)}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Last updated {format(new Date(factFind.updated_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${status.bg}`}>
                          <StatusIcon className={`w-4 h-4 ${status.color}`} />
                          <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                        </div>
                        
                        {factFind.status !== 'submitted' && (
                          <Link to={createPageUrl('FactFindWelcome') + `?id=${factFind.id}`}>
                            <Button size="sm" className="bg-slate-800 hover:bg-slate-700 text-white">
                              Continue
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                    
                    {factFind.current_step && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Progress</span>
                          <span className="font-medium text-slate-800">Step {factFind.current_step} of 6</span>
                        </div>
                        <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(factFind.current_step / 6) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}