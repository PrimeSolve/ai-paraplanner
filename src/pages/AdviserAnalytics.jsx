import React from 'react';
import AdviserLayout from '../components/adviser/AdviserLayout';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, FileText, DollarSign } from 'lucide-react';

export default function AdviserAnalytics() {
  const stats = [
    { label: 'Clients Growth', value: '+12%', icon: Users, color: 'text-teal-600' },
    { label: 'SOAs Completed', value: '23', icon: FileText, color: 'text-blue-600' },
    { label: 'Avg Completion Time', value: '4.2 days', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Revenue', value: '$124K', icon: DollarSign, color: 'text-amber-600' }
  ];

  return (
    <AdviserLayout currentPage="AdviserAnalytics">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">Analytics</h1>
        <p className="text-sm text-slate-600 mt-1">Track your performance and insights</p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx}>
                <CardContent className="p-6">
                  <Icon className={`w-8 h-8 ${stat.color} mb-3`} />
                  <div className="text-2xl font-['Fraunces'] font-semibold text-slate-800 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Detailed analytics coming soon</h3>
            <p className="text-slate-600">Track trends, performance metrics, and business insights</p>
          </CardContent>
        </Card>
      </div>
    </AdviserLayout>
  );
}