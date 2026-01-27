import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AdminLayout from '../components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, Users, CheckCircle, Briefcase, Star, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRole } from '../components/RoleContext';

export default function AdminAdvisers() {
  const [advisers, setAdvisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    loadAdvisers();
  }, []);

  const loadAdvisers = async () => {
    try {
      const data = await base44.entities.User.filter({ user_type: 'adviser' }, '-created_date');
      setAdvisers(data.length > 0 ? data : mockAdvisers);
    } catch (error) {
      console.error('Failed to load advisers:', error);
      setAdvisers(mockAdvisers);
    } finally {
      setLoading(false);
    }
  };

  const mockAdvisers = [
    { id: '1', full_name: 'Tim Smith', email: 'tim@primesolve.com.au', company: 'PrimeSolve Financial', plan: 'unlimited', clients: 12, soas: 8, joined: '15 Nov 2025' },
    { id: '2', full_name: 'Jane Brown', email: 'jane@wealthpartners.com.au', company: 'Wealth Partners', plan: 'unlimited', clients: 28, soas: 15, joined: '8 Oct 2025' },
    { id: '3', full_name: 'Rachel Lee', email: 'rachel@futurefinance.com.au', company: 'Future Finance', plan: 'pay_per_soa', clients: 6, soas: 3, joined: '20 Dec 2025' },
    { id: '4', full_name: 'Kevin White', email: 'kevin@smartwealth.com.au', company: 'Smart Wealth', plan: 'unlimited', clients: 19, soas: 11, joined: '6 Sep 2025' },
    { id: '5', full_name: 'Nick Parker', email: 'nick@parkeradvisory.com.au', company: 'Parker Advisory', plan: 'trial', clients: 3, soas: 1, joined: '18 Jan 2026' },
    { id: '6', full_name: 'Sarah Mitchell', email: 'sarah@mitchellfinancial.com.au', company: 'Mitchell Financial', plan: 'trial', clients: 1, soas: 0, joined: '22 Jan 2026' },
    { id: '7', full_name: 'David Thompson', email: 'david@securefinance.com.au', company: 'Secure Finance', plan: 'cancelled', clients: 8, soas: 5, joined: '1 Aug 2020' }
  ];

  const filteredAdvisers = advisers.filter(adviser =>
    adviser.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adviser.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getColorClass = (index) => {
    const colors = [
      'bg-blue-600',
      'bg-orange-600',
      'bg-pink-600',
      'bg-purple-600',
      'bg-green-600',
      'bg-cyan-600',
      'bg-teal-600',
      'bg-indigo-600'
    ];
    return colors[index % colors.length];
  };

  const getPlanBadge = (plan) => {
    const plans = {
      'unlimited': { label: 'Unlimited', color: 'bg-green-100 text-green-700' },
      'pay_per_soa': { label: 'Pay-per-SOA', color: 'bg-orange-100 text-orange-700' },
      'trial': { label: 'Trial', color: 'bg-yellow-100 text-yellow-700' },
      'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-700' }
    };
    const config = plans[plan] || { label: 'Unlimited', color: 'bg-green-100 text-green-700' };
    return config;
  };

  const paginatedAdvisers = filteredAdvisers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAdvisers.length / itemsPerPage);

  return (
    <AdminLayout currentPage="AdminAdvisers">
      <div className="p-8">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold mb-1">{advisers.length}</div>
            <div className="text-sm opacity-90">Total Advisers</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">18</div>
            <div className="text-sm text-slate-600">Unlimited Plans</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">4</div>
            <div className="text-sm text-slate-600">Pay-per-SOA</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-1">2</div>
            <div className="text-sm text-slate-600">On Trial</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 mb-6">
          <div className="p-6 flex items-end gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search advisers or companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Plan</span>
              <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <option value="all">All Plans</option>
                <option value="unlimited">Unlimited</option>
                <option value="pay_per_soa">Pay-per-SOA</option>
                <option value="trial">Trial</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sort by</span>
              <select className="px-4 h-11 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <option>Activity</option>
                <option>Name</option>
                <option>Joined</option>
              </select>
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
                    Adviser
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedAdvisers.length > 0 ? paginatedAdvisers.map((adviser, idx) => (
                  <tr key={adviser.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${getColorClass(idx)} flex items-center justify-center text-white font-bold text-sm`}>
                          {adviser.full_name?.charAt(0) || adviser.email?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-800">{adviser.full_name || adviser.email}</div>
                          <div className="text-xs text-slate-600">{adviser.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-800 font-medium">{adviser.company || 'Company Name'}</div>
                      <div className="text-xs text-slate-600">AFSL 123456</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${getPlanBadge(adviser.plan || 'unlimited').color}`}>
                        {getPlanBadge(adviser.plan || 'unlimited').label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-800">{adviser.clients || 0}</span>
                          <span className="text-xs text-slate-600">Clients</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-800">{adviser.soas || 0}</span>
                          <span className="text-xs text-slate-600">SOAs</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">{adviser.joined || '15 Nov 2025'}</span>
                        <span className="text-xs text-slate-600">3 months ago</span>
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
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Adviser
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Adviser
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-600">
                      No advisers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-600">Showing {filteredAdvisers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredAdvisers.length)} of {filteredAdvisers.length} advisers</span>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50">
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50">
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}