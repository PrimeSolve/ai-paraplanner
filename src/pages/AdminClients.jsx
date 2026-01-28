import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, CheckCircle, Clock, MoreHorizontal, Eye, Edit2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [adviserFilter, setAdviserFilter] = useState('all');
  const [factFindFilter, setFactFindFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadClients();
  }, []);

  const mockClients = [
    { id: '1', first_name: 'John', last_name: 'Smith', email: 'john.smith@email.com', adviser_email: 'tim@primesolve.com.au', advice_group_id: 'group1', fact_find: 'complete', soas: 3, created_date: '2025-12-15', status: 'active' },
    { id: '2', first_name: 'Sarah', last_name: 'Jones', email: 'sarah.jones@email.com', adviser_email: 'tim@primesolve.com.au', advice_group_id: 'group1', fact_find: 'in_progress', soas: 1, created_date: '2026-01-08', status: 'active' },
    { id: '3', first_name: 'Emma', last_name: 'Clarke', email: 'emma.clarke@email.com', adviser_email: 'jane@wealthpartners.com.au', advice_group_id: 'group2', fact_find: 'complete', soas: 2, created_date: '2025-11-03', status: 'active' },
    { id: '4', first_name: 'Mary', last_name: 'Chen', email: 'mary.chen@email.com', adviser_email: 'rachel@futurefinance.com.au', advice_group_id: 'group3', fact_find: 'sent', soas: 0, created_date: '2026-01-20', status: 'prospect' },
    { id: '5', first_name: 'Robert', last_name: 'Taylor', email: 'robert.taylor@email.com', adviser_email: 'kevin@smartwealth.com.au', advice_group_id: 'group4', fact_find: 'complete', soas: 4, created_date: '2025-09-15', status: 'active' },
    { id: '6', first_name: 'Lisa', last_name: 'Martinez', email: 'lisa.martinez@email.com', adviser_email: 'nick@parkeradvisory.com.au', advice_group_id: 'group5', fact_find: 'not_started', soas: 0, created_date: '2026-01-22', status: 'prospect' },
    { id: '7', first_name: 'David', last_name: 'Wilson', email: 'david.wilson@email.com', adviser_email: 'tim@primesolve.com.au', advice_group_id: 'group1', fact_find: 'complete', soas: 1, created_date: '2026-01-10', status: 'active' },
    { id: '8', first_name: 'Andrew', last_name: 'Mitchell', email: 'andrew.mitchell@email.com', adviser_email: 'jane@wealthpartners.com.au', advice_group_id: 'group2', fact_find: 'in_progress', soas: 0, created_date: '2026-01-18', status: 'active' }
  ];

  const loadClients = async () => {
    try {
      const data = await base44.entities.Client.list('-created_date');
      setClients(data.length > 0 ? data : mockClients);
    } catch (error) {
      console.error('Failed to load clients:', error);
      setClients(mockClients);
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (index) => {
    const colors = ['bg-blue-600', 'bg-green-600', 'bg-orange-600', 'bg-purple-600', 'bg-pink-600', 'bg-cyan-600', 'bg-red-600', 'bg-amber-600'];
    return colors[index % colors.length];
  };

  const getFactFindBadge = (status) => {
    const badges = {
      complete: { label: 'Complete', icon: '✓', className: 'bg-green-100 text-green-700' },
      in_progress: { label: 'In Progress', icon: '⟳', className: 'bg-orange-100 text-orange-700' },
      sent: { label: 'Sent', icon: '✉', className: 'bg-blue-100 text-blue-700' },
      not_started: { label: 'Not Started', icon: '○', className: 'bg-slate-100 text-slate-700' }
    };
    return badges[status] || badges.not_started;
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAdviser = adviserFilter === 'all' || client.adviser_email === adviserFilter;
    const matchesFactFind = factFindFilter === 'all' || client.fact_find === factFindFilter;
    return matchesSearch && matchesAdviser && matchesFactFind;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AdminLayout currentPage="AdminClients">
      <div className="p-8">

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold mb-1">142</div>
            <div className="text-sm opacity-90">Total Clients</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">89</div>
            <div className="text-sm text-slate-600">Fact Finds Complete</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">34</div>
            <div className="text-sm text-slate-600">Fact Finds Pending</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">67</div>
            <div className="text-sm text-slate-600">Active SOAs</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 mb-6">
          <div className="p-6 flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search clients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Adviser</span>
              <Select value={adviserFilter} onValueChange={setAdviserFilter}>
                <SelectTrigger className="w-[180px] h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Advisers</SelectItem>
                  <SelectItem value="tim@primesolve.com.au">Tim Smith</SelectItem>
                  <SelectItem value="jane@wealthpartners.com.au">Jane Brown</SelectItem>
                  <SelectItem value="rachel@futurefinance.com.au">Rachel Lee</SelectItem>
                  <SelectItem value="kevin@smartwealth.com.au">Kevin White</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Fact Find</span>
              <Select value={factFindFilter} onValueChange={setFactFindFilter}>
                <SelectTrigger className="w-[180px] h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sort by</span>
              <Select defaultValue="recent">
                <SelectTrigger className="w-[140px] h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Adviser
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Fact Find
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    SOAs
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((client, idx) => {
                  const factFindBadge = getFactFindBadge(client.fact_find);
                  return (
                    <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${getColorClass(idx)} flex items-center justify-center text-white font-bold text-sm`}>
                            {client.first_name?.charAt(0)}{client.last_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-slate-800">{client.first_name} {client.last_name}</div>
                            <div className="text-xs text-slate-600">{client.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${getColorClass(idx)} flex items-center justify-center text-white text-xs font-bold`}>
                            {client.adviser_email?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div className="text-sm">
                            <div className="font-medium text-slate-800">{client.adviser_email?.split('@')[0] || 'N/A'}</div>
                            <div className="text-xs text-slate-600">Adviser</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${factFindBadge.className}`}>
                          {factFindBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-800">{client.soas || 0} total</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-800">{new Date(client.created_date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="text-xs text-slate-600">1 month ago</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                            View
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Fact Find
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Client
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-600">Showing 1-{Math.min(itemsPerPage, paginatedClients.length)} of {filteredClients.length} clients</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              {totalPages > 5 && <span className="text-slate-600">...</span>}
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}