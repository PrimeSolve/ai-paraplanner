import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function SOAManagement() {
  const [user, setUser] = useState(null);
  const [factFinds, setFactFinds] = useState([]);
  const [soaRequests, setSOARequests] = useState([]);
  const [filteredSOAs, setFilteredSOAs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fact_find_id: '',
    status: 'pending'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.role !== 'admin') {
          return;
        }
        
        const allFinds = await base44.entities.FactFind.list('-updated_date');
        const allSOAs = await base44.entities.SOARequest.list('-updated_date');
        setFactFinds(allFinds);
        setSOARequests(allSOAs);
        setFilteredSOAs(allSOAs);
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
      setFilteredSOAs(soaRequests);
    } else {
      const filtered = soaRequests.filter(soa =>
        soa.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        soa.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        soa.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSOAs(filtered);
    }
  }, [searchTerm, soaRequests]);

  const handleSubmitSOA = async (e) => {
    e.preventDefault();
    
    if (!formData.fact_find_id) {
      toast.error('Please select a client/fact find');
      return;
    }

    setSubmitting(true);
    try {
      const selectedFF = factFinds.find(ff => ff.id === formData.fact_find_id);
      if (!selectedFF) {
        toast.error('Fact find not found');
        return;
      }

      const soaData = {
        fact_find_id: formData.fact_find_id,
        client_name: selectedFF.personal?.first_name && selectedFF.personal?.last_name 
          ? `${selectedFF.personal.first_name} ${selectedFF.personal.last_name}`
          : 'Not provided',
        client_email: selectedFF.personal?.email || selectedFF.created_by,
        status: formData.status,
        submitted_date: new Date().toISOString()
      };

      await base44.entities.SOARequest.create(soaData);
      
      // Refresh SOA list
      const allSOAs = await base44.entities.SOARequest.list('-updated_date');
      setSOARequests(allSOAs);
      setFilteredSOAs(allSOAs);
      
      // Reset form
      setFormData({
        fact_find_id: '',
        status: 'pending'
      });
      toast.success('SOA request created successfully');
    } catch (error) {
      console.error('Error creating SOA request:', error);
      toast.error('Failed to create SOA request');
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-slate-100 text-slate-700' },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
    awaiting_review: { label: 'Awaiting Review', color: 'bg-amber-100 text-amber-700' }
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
        <h1 className="text-4xl font-bold text-slate-800 mb-3">SOA Management</h1>
        <p className="text-lg text-slate-600">Create and manage Statement of Advice (SOA) requests</p>
      </div>

      {/* Create SOA Form */}
      <Card className="border-slate-200 mb-8">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-slate-800">Submit SOA Request</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmitSOA} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fact-find">Select Client/Fact Find</Label>
                <Select value={formData.fact_find_id} onValueChange={(value) => setFormData({...formData, fact_find_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {factFinds.map(ff => (
                      <SelectItem key={ff.id} value={ff.id}>
                        {ff.personal?.first_name && ff.personal?.last_name 
                          ? `${ff.personal.first_name} ${ff.personal.last_name}` 
                          : `Client #${ff.id.substring(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="awaiting_review">Awaiting Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-start pt-4">
              <Button type="submit" disabled={submitting} className="bg-slate-800 hover:bg-slate-900">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* SOA Requests Table */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-800">SOA Requests</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by client name..."
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
                <TableHead>Client Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Completed Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSOAs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No SOA requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSOAs.map((soa) => {
                  const status = statusConfig[soa.status] || statusConfig.pending;
                  return (
                    <TableRow key={soa.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{soa.client_name}</TableCell>
                      <TableCell className="text-slate-600">{soa.client_email}</TableCell>
                      <TableCell>
                        <Badge className={`${status.color} border-0`}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {soa.submitted_date ? format(new Date(soa.submitted_date), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {soa.completed_date ? format(new Date(soa.completed_date), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {soa.adviser_notes ? soa.adviser_notes.substring(0, 50) + '...' : 'No notes'}
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