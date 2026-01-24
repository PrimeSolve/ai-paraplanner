import React from 'react';
import AdviserLayout from '../components/adviser/AdviserLayout';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function AdviserCalendar() {
  return (
    <AdviserLayout currentPage="AdviserCalendar">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">Calendar</h1>
        <p className="text-sm text-slate-600 mt-1">Schedule and manage client appointments</p>
      </div>

      <div className="p-8">
        <Card className="p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Calendar coming soon</h3>
          <p className="text-slate-600">Schedule meetings and track important dates</p>
        </Card>
      </div>
    </AdviserLayout>
  );
}