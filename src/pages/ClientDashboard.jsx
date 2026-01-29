import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import ClientLayout from '../components/client/ClientLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  Download,
  Calendar
} from 'lucide-react';

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [factFinds, setFactFinds] = useState([]);
  const [soaRequests, setSoaRequests] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        const factFindData = await base44.entities.FactFind.filter({ 
          created_by: userData.email 
        }, '-created_date');
        setFactFinds(factFindData);

        const soaData = await base44.entities.SOARequest.filter({
          client_email: userData.email
        }, '-created_date');
        setSoaRequests(soaData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <ClientLayout currentPage="ClientDashboard">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
        </div>
      </ClientLayout>
    );
  }

  const currentFactFind = factFinds.find(ff => ff.status !== 'submitted') || factFinds[0];

  return (
    <ClientLayout currentPage="ClientDashboard">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-40">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Fraunces' }}>
          Dashboard
        </h1>
      </div>

      <div className="p-8 max-w-7xl">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-600 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Fraunces' }}>
            Welcome back, {user?.full_name?.split(' ')[0]}
          </h2>
          <p className="text-slate-100 text-lg max-w-2xl">
            Track your financial planning journey. Complete your fact find, review documents, and stay connected with your adviser.
          </p>
        </div>

        {/* Fact Find Status */}
        {currentFactFind ? (
          <Card className={`mb-8 ${currentFactFind.status !== 'submitted' ? 'border-2 border-amber-500' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-amber-500" />
                  Your Fact Find
                </CardTitle>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  currentFactFind.status === 'submitted' 
                    ? 'bg-green-100 text-green-700'
                    : currentFactFind.status === 'in_progress'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {currentFactFind.status === 'submitted' && <CheckCircle2 className="w-4 h-4" />}
                  {currentFactFind.status === 'in_progress' && <Clock className="w-4 h-4" />}
                  {currentFactFind.status === 'submitted' ? 'Complete' : currentFactFind.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-semibold text-slate-700">{currentFactFind.completion_percentage || 0}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${currentFactFind.completion_percentage || 0}%` }}
                  />
                </div>
              </div>

              {currentFactFind.status !== 'submitted' ? (
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div>
                    <p className="font-semibold text-amber-900 mb-1">Continue where you left off</p>
                    <p className="text-sm text-amber-700">Complete your fact find to move forward with your financial plan</p>
                  </div>
                  <Link to={createPageUrl('FactFindWelcome') + `?id=${currentFactFind.id}`}>
                    <Button className="bg-amber-500 hover:bg-amber-600">
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div>
                    <p className="font-semibold text-green-900 mb-1">Fact Find Complete</p>
                    <p className="text-sm text-green-700">Your adviser is reviewing your information</p>
                  </div>
                  <Link to={createPageUrl('FactFindWelcome') + `?id=${currentFactFind.id}`}>
                    <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                      Review
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 border-2 border-amber-500">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Get Started</h3>
                  <p className="text-slate-600">Begin your financial planning journey by completing your fact find</p>
                </div>
                <Link to={createPageUrl('FactFindWelcome')}>
                  <Button className="bg-amber-500 hover:bg-amber-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Start Fact Find
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Link to={createPageUrl('ClientDocuments')} className="no-underline">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Documents</div>
                    <div className="text-sm text-slate-500">View all files</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('ClientMessages')} className="no-underline">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Messages</div>
                    <div className="text-sm text-slate-500">Chat with adviser</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('ClientSettings')} className="no-underline">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Download className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Settings</div>
                    <div className="text-sm text-slate-500">Manage profile</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        {soaRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {soaRequests.slice(0, 3).map((soa) => (
                  <div key={soa.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Statement of Advice</div>
                        <div className="text-sm text-slate-500">
                          {new Date(soa.created_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      soa.status === 'completed' 
                        ? 'bg-green-100 text-green-700'
                        : soa.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {soa.status}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientLayout>
  );
}