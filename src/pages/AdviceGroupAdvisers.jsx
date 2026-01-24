import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdviceGroupLayout from '../components/advicegroup/AdviceGroupLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AdviceGroupAdvisers() {
  const [advisers, setAdvisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.advice_group_id) {
        const data = await base44.entities.User.filter({
          advice_group_id: currentUser.advice_group_id,
          user_type: 'adviser'
        });
        setAdvisers(data);
      }
    } catch (error) {
      console.error('Failed to load advisers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    try {
      await base44.users.inviteUser(inviteEmail, 'user');
      toast.success('Adviser invited successfully');
      setInviteEmail('');
      setShowInvite(false);
      loadData();
    } catch (error) {
      toast.error('Failed to invite adviser');
    }
  };

  const filteredAdvisers = advisers.filter(a =>
    a.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdviceGroupLayout currentPage="AdviceGroupAdvisers">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">Advisers</h1>
            <p className="text-sm text-slate-600 mt-1">Manage your advice team</p>
          </div>
          <Button onClick={() => setShowInvite(!showInvite)} className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="w-4 h-4 mr-2" />
            Invite Adviser
          </Button>
        </div>
      </div>

      <div className="p-8">
        {showInvite && (
          <Card className="p-6 mb-6">
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="adviser@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleInvite} className="bg-cyan-600 hover:bg-cyan-700">
                Send Invite
              </Button>
            </div>
          </Card>
        )}

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search advisers..."
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
                    Adviser
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Clients
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Active SOAs
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAdvisers.map((adviser) => (
                  <tr key={adviser.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center font-semibold text-cyan-600">
                          {adviser.full_name?.charAt(0) || adviser.email?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{adviser.full_name || adviser.email}</div>
                          <div className="text-xs text-slate-500">{adviser.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">12</td>
                    <td className="px-6 py-4 text-sm">3</td>
                    <td className="px-6 py-4">
                      <Badge>Active</Badge>
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
    </AdviceGroupLayout>
  );
}