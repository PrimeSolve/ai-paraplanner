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
        {rightContent}
      </div>
    </div>
  );
}