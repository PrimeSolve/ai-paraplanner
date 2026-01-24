import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, RefreshCw, Info, AlertTriangle, LayoutDashboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { createPageUrl } from '../../utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function FactFindHeader({ title, description, tabs, activeTab, onTabChange, factFind }) {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleRefreshClick = () => {
    setShowRefreshWarning(true);
    setConfirmDelete(false);
  };

  const handleConfirmRefresh = async () => {
    if (!confirmDelete) {
      toast.error('Please confirm you understand this will delete all data');
      return;
    }

    setRefreshing(true);
    setShowRefreshWarning(false);
    try {
      // Reload the fact find data
      if (factFind?.id) {
        const finds = await base44.entities.FactFind.filter({ id: factFind.id });
        if (finds[0]) {
          toast.success('Data refreshed successfully');
          window.location.reload();
        }
      } else {
        toast.success('Data refreshed');
      }
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 px-8 py-5 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 mb-1">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Talk to Assistant - Green Banner */}
          <Link to={createPageUrl('FactFindAssistant') + (factFind?.id ? `?id=${factFind.id}` : '')}>
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-all cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">Talk to our assistant</span>
                  <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Live</span>
                </div>
                <span className="text-teal-50 text-xs leading-tight">Get help completing your fact find</span>
              </div>
            </div>
          </Link>

          {/* Dashboard Button */}
          <Link to={createPageUrl('Home') + (factFind?.id ? `?id=${factFind.id}` : '')}>
            <button
              className="w-11 h-11 rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md transition-all flex-shrink-0 relative group"
            >
              📊
              <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Dashboard
              </span>
            </button>
          </Link>

          {/* Refresh Button */}
          <button
            onClick={handleRefreshClick}
            disabled={refreshing}
            className="w-11 h-11 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-md transition-all flex-shrink-0 relative group"
          >
            🔄
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Refresh Data
            </span>
          </button>

          {/* Info Button */}
          <button
            onClick={() => setShowAssumptions(true)}
            className="w-11 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-all flex-shrink-0 relative group"
          >
            ℹ️
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Key Assumptions
            </span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Refresh Warning Dialog */}
      <Dialog open={showRefreshWarning} onOpenChange={setShowRefreshWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              Refresh Fact Find Data
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-700">
              Are you sure you want to refresh all Fact Find data?
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <div className="flex gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">WARNING: This will:</h4>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• Clear all current fact find data</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Only use this if you want to start fresh with your fact find.
            </p>

            <div className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
              <Checkbox
                id="confirm-delete"
                checked={confirmDelete}
                onCheckedChange={setConfirmDelete}
                className="mt-0.5"
              />
              <label
                htmlFor="confirm-delete"
                className="text-sm text-slate-700 cursor-pointer leading-tight"
              >
                I understand this will delete all my current fact find data
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowRefreshWarning(false)}
                className="border-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRefresh}
                disabled={!confirmDelete}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Yes, Refresh Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Key Assumptions Dialog */}
      <Dialog open={showAssumptions} onOpenChange={setShowAssumptions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Key Assumptions</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Client Information */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs">👤</span>
                </div>
                <h4 className="font-bold text-slate-800 uppercase text-sm">Client Information</h4>
              </div>
              <div className="space-y-3 pl-7">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-slate-600">Primary</span>
                  <span className="text-sm text-slate-900 font-medium col-span-2">
                    {factFind?.personal?.first_name && factFind?.personal?.last_name 
                      ? `${factFind.personal.first_name} ${factFind.personal.last_name}`
                      : 'Not provided'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-slate-600">Email</span>
                  <span className="text-sm text-slate-500 col-span-2">
                    {factFind?.personal?.email || 'Primary email'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-slate-600">Partner</span>
                  <span className="text-sm text-slate-900 font-medium col-span-2">
                    {factFind?.partner_email ? factFind.partner_email.split('@')[0] : 'Not provided'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-slate-600">Email</span>
                  <span className="text-sm text-slate-500 col-span-2">
                    {factFind?.partner_email || 'Partner email'}
                  </span>
                </div>
              </div>
            </div>

            {/* Adviser */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-amber-700 rounded flex items-center justify-center">
                  <span className="text-white text-xs">💼</span>
                </div>
                <h4 className="font-bold text-slate-800 uppercase text-sm">Adviser</h4>
              </div>
              <div className="space-y-3 pl-7">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-slate-600">Name</span>
                  <span className="text-sm text-slate-900 font-medium col-span-2">
                    {factFind?.assigned_adviser || 'John Smith, CFP®'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-slate-600">Email</span>
                  <span className="text-sm text-slate-500 col-span-2">
                    john.smith@example.com.au
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-slate-600">Company</span>
                  <span className="text-sm text-slate-500 col-span-2">
                    Financial Planning Services
                  </span>
                </div>
              </div>
            </div>

            {/* Fact Find Status */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs">📊</span>
                </div>
                <h4 className="font-bold text-slate-800 uppercase text-sm">Fact Find Status</h4>
              </div>
              <div className="space-y-3 pl-7">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Completion</span>
                    <span className="text-sm text-slate-900 font-bold">
                      {factFind?.completion_percentage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${factFind?.completion_percentage || 0}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-slate-600">Submission Status</span>
                  <span className="text-sm text-slate-500 col-span-2">
                    {factFind?.status === 'submitted' ? 'Submitted' : 'Not submitted'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-slate-600">Last Updated</span>
                  <span className="text-sm text-slate-500 col-span-2">
                    {factFind?.updated_date 
                      ? new Date(factFind.updated_date).toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })
                      : 'N/A'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-slate-600">Client ID</span>
                  <span className="text-sm text-slate-900 font-medium col-span-2">
                    #{factFind?.id?.substring(0, 12) || 'Not assigned'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}