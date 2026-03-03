import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { formatDate } from '../utils/dateUtils';

export default function AdviserFactFinds() {
  const [factFinds, setFactFinds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadFactFinds();
  }, []);

  const loadFactFinds = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.FactFind.filter({
        assigned_adviser: currentUser.email
      }, '-updated_date');
      setFactFinds(data);
    } catch (error) {
      console.error('Failed to load fact finds:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      not_started: 'secondary',
      in_progress: 'default',
      completed: 'default',
      submitted: 'default'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status?.replace('_', ' ')}</Badge>;
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Client Fact Finds</h1>
        <p className="text-sm text-slate-600 mt-1">View fact finds submitted by your clients</p>
      </div>

      <div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-3xl font-['Fraunces'] font-semibold text-teal-600 mb-1">
              {factFinds.length}
            </div>
            <div className="text-sm text-slate-600">Total Fact Finds</div>
          </Card>
          <Card className="p-4">
            <div className="text-3xl font-['Fraunces'] font-semibold text-blue-600 mb-1">
              {factFinds.filter(f => f.status === 'in_progress').length}
            </div>
            <div className="text-sm text-slate-600">In Progress</div>
          </Card>
          <Card className="p-4">
            <div className="text-3xl font-['Fraunces'] font-semibold text-amber-600 mb-1">
              {factFinds.filter(f => f.status === 'completed').length}
            </div>
            <div className="text-sm text-slate-600">Completed</div>
          </Card>
          <Card className="p-4">
            <div className="text-3xl font-['Fraunces'] font-semibold text-green-600 mb-1">
              {factFinds.filter(f => f.status === 'submitted').length}
            </div>
            <div className="text-sm text-slate-600">Submitted</div>
          </Card>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Client
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Progress
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Last Updated
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {factFinds.map((ff) => (
                  <tr key={ff.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center font-semibold text-teal-600">
                          {ff.personal?.first_name?.charAt(0) || ff.created_by?.charAt(0) || 'C'}
                        </div>
                        <span className="font-medium">
                          {ff.personal?.first_name && ff.personal?.last_name 
                            ? `${ff.personal.first_name} ${ff.personal.last_name}`
                            : ff.created_by}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ff.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[100px]">
                          <div 
                            className="bg-teal-500 h-2 rounded-full"
                            style={{ width: `${ff.completion_percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">{ff.completion_percentage || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(ff.updated_date)}
                    </td>
                    <td className="px-6 py-4">
                      <Link to={createPageUrl('Home') + `?id=${ff.id}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        </div>
        </div>
        );
}