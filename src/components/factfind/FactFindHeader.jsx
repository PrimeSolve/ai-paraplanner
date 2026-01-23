import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, RefreshCw, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPageUrl } from '../../utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function FactFindHeader({ title, description, tabs, activeTab, onTabChange, factFind }) {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
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
        <div className="flex gap-3">
          {/* Talk to Assistant - Green Banner */}
          <Link to={createPageUrl('FactFindAssistant') + (factFind?.id ? `?id=${factFind.id}` : '')}>
            <div className="flex items-center gap-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-full px-4 py-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-teal-600" />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm">Talk to our assistant</span>
                  <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded">LIVE</span>
                </div>
                <span className="text-teal-50 text-xs">Get help completing your Fact Find</span>
              </div>
            </div>
          </Link>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
          >
            <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
          </Button>

          {/* Info Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAssumptions(true)}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
          >
            <Info className="w-5 h-5" />
          </Button>
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

      {/* Key Assumptions Dialog */}
      <Dialog open={showAssumptions} onOpenChange={setShowAssumptions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Key Assumptions</DialogTitle>
            <DialogDescription>
              The following assumptions are used throughout your Fact Find calculations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
              <h4 className="font-bold text-slate-800 mb-2">Investment Returns</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• Growth assets: 7% p.a. (after fees, pre-tax)</li>
                <li>• Defensive assets: 3.5% p.a. (after fees, pre-tax)</li>
                <li>• Cash/Term deposits: 2.5% p.a.</li>
              </ul>
            </div>

            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
              <h4 className="font-bold text-slate-800 mb-2">Inflation & Growth</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• CPI inflation: 2.5% p.a.</li>
                <li>• Wage growth: 3.5% p.a.</li>
                <li>• Age Pension indexation: 2.5% p.a.</li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
              <h4 className="font-bold text-slate-800 mb-2">Superannuation</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• Superannuation Guarantee: 11.5% (2024/25)</li>
                <li>• Concessional cap: $30,000 p.a.</li>
                <li>• Non-concessional cap: $120,000 p.a.</li>
                <li>• Transfer Balance Cap: $1.9 million (2024/25)</li>
              </ul>
            </div>

            <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
              <h4 className="font-bold text-slate-800 mb-2">Age Pension (Full Rate 2024/25)</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• Single: $1,116.30 per fortnight</li>
                <li>• Couple (combined): $1,682.80 per fortnight</li>
                <li>• Assets test threshold (homeowner couple): $451,500</li>
                <li>• Income test threshold: $204 per fortnight (couple)</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 italic">
                These assumptions are indicative and may be adjusted based on your specific circumstances. 
                Speak with your adviser for personalized projections.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}