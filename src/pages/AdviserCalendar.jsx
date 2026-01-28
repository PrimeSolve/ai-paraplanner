import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function AdviserCalendar() {
  return (
    <div style={{ padding: '24px 32px' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Calendar</h1>
        <p className="text-sm text-slate-600 mt-1">Schedule and manage client appointments</p>
      </div>

      <Card className="p-12 text-center">
        <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Calendar coming soon</h3>
        <p className="text-slate-600">Schedule meetings and track important dates</p>
      </Card>
    </div>
  );
}