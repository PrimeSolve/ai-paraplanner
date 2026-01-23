import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, RefreshCw, Info } from 'lucide-react';
import { createPageUrl } from '../../utils';
import { cn } from '@/lib/utils';

export default function FactFindHeader({ title, description, tabs, activeTab, onTabChange, factFind }) {
  return (
    <div className="bg-white border-b border-slate-200 px-8 py-5 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 mb-1">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Info className="w-4 h-4 mr-2" />
            Key Assumptions
          </Button>
          <Link to={createPageUrl('FactFindAssistant') + (factFind?.id ? `?id=${factFind.id}` : '')}>
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/30"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Talk to Assistant
            </Button>
          </Link>
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
    </div>
  );
}