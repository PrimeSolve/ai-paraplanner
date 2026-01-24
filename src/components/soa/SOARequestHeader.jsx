import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SOARequestHeader({ title, description, rightContent }) {
  return (
    <div className="bg-white border-b border-slate-200 px-8 py-5 flex-shrink-0">
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-xl font-extrabold text-slate-800 mb-1">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* AI Paraplanner Button */}
          <div className="relative group">
            <button className="flex items-center gap-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-all">
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">Talk to AI Paraplanner</span>
                  <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase">New</span>
                </div>
                <span className="text-teal-50 text-xs leading-tight">Get help building your SOA request</span>
              </div>
            </button>
          </div>

          {/* Projected Position Button */}
          <button className="w-11 h-11 rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md transition-all flex-shrink-0 relative group">
            📊
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Projected Position
            </span>
          </button>

          {rightContent}
        </div>
      </div>
    </div>
  );
}