import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Search, Users, CheckCircle2, Clock, AlertCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [factFinds, setFactFinds] = useState([]);
  const [filteredFinds, setFilteredFinds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.role !== 'admin') {
          return;
        }
        
        const allFinds = await base44.entities.FactFind.list('-updated_date');
        setFactFinds(allFinds);
        setFilteredFinds(allFinds);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFinds(factFinds);
    } else {
      const filtered = factFinds.filter(ff => 
        ff.created_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ff.personal_info?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ff.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFinds(filtered);
    }
  }, [searchTerm, factFinds]);

  const statusConfig = {
    draft: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100', label: 'Draft' },
    in_progress: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'In Progress' },
    completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
    under_review: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Under Review' }
  };

  const stats = {
    total: factFinds.length,
    completed: factFinds.filter(f => f.status === 'completed').length,
    inProgress: factFinds.filter(f => f.status === 'in_progress').length,
    draft: factFinds.filter(f => f.status === 'draft').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Access Denied</h2>
              <p className="text-slate-600">You need admin privileges to view this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800 mb-3">Admin Dashboard</h1>
        <p className="text-lg text-slate-600">Manage and review all client Fact Finds</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Fact Finds</p>
                <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <FileText className="w-10 h-10 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Drafts</p>
                <p className="text-3xl font-bold text-slate-600">{stats.draft}</p>
              </div>
              <Users className="w-10 h-10 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-800">All Fact Finds</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFinds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No fact finds found
                  </TableCell>
                </TableRow>
              ) : (
                filteredFinds.map((factFind) => {
                  const status = statusConfig[factFind.status] || statusConfig.draft;
                  const StatusIcon = status.icon;
                  
                  return (
                    <TableRow key={factFind.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">
                        {factFind.personal_info?.full_name || 'Not provided'}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {factFind.created_by}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.bg} ${status.color} border-0`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-amber-500 h-2 rounded-full"
                              style={{ width: `${((factFind.current_step || 1) / 6) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-600">
                            {factFind.current_step || 1}/6
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {format(new Date(factFind.updated_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Link to={createPageUrl('FactFindWelcome') + `?id=${factFind.id}`}>
                          <Button size="sm" variant="outline" className="border-slate-300">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}