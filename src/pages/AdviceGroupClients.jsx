
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

export default function AdviceGroupClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.advice_group_id) {
        const data = await base44.entities.Client.filter({
          advice_group_id: currentUser.advice_group_id
        }, '-created_date');
        setClients(data);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c =>
    c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="py-6 px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">Clients</h1>
          <p className="text-sm text-slate-600 mt-1">All clients across your adviser network</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          Export Data
        </Button>
      </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-3xl font-['Fraunces'] font-semibold text-cyan-600 mb-1">
              {clients.length}
            </div>
            <div className="text-sm text-slate-600">Total Clients</div>
          </Card>
          <Card className="p-4">
            <div className="text-3xl font-['Fraunces'] font-semibold text-green-600 mb-1">
              {clients.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-slate-600">Active</div>
          </Card>
          <Card className="p-4">
            <div className="text-3xl font-['Fraunces'] font-semibold text-blue-600 mb-1">
              {clients.filter(c => c.status === 'prospect').length}
            </div>
            <div className="text-sm text-slate-600">Prospects</div>
          </Card>
          <Card className="p-4">
            <div className="text-3xl font-['Fraunces'] font-semibold text-amber-600 mb-1">12</div>
            <div className="text-sm text-slate-600">New This Month</div>
          </Card>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
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
                    Adviser
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Joined
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600">
                          {client.first_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <div className="font-medium">{client.first_name} {client.last_name}</div>
                          <div className="text-xs text-slate-500">{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {client.adviser_email?.split('@')[0] || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status || 'prospect'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(client.created_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Button size="sm" variant="outline">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
    </div>
  );
}
