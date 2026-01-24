import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminLayout from '../components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const data = await base44.entities.User.filter({ user_type: 'admin' }, '-created_date');
      setTeam(data);
    } catch (error) {
      console.error('Failed to load team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail, 'admin');
      toast.success('Team member invited successfully');
      setInviteEmail('');
      loadTeam();
    } catch (error) {
      toast.error('Failed to invite team member');
    } finally {
      setInviting(false);
    }
  };

  return (
    <AdminLayout currentPage="AdminTeam">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">Team Members</h1>
        <p className="text-sm text-slate-600 mt-1">Manage AI Paraplanner admin team</p>
      </div>

      <div className="p-8 max-w-4xl">
        {/* Invite Section */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4">Invite Team Member</h3>
          <div className="flex gap-3">
            <Input
              type="email"
              placeholder="email@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleInvite} disabled={inviting} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              {inviting ? 'Inviting...' : 'Invite'}
            </Button>
          </div>
        </Card>

        {/* Team List */}
        <Card>
          <div className="divide-y divide-slate-100">
            {team.map((member) => (
              <div key={member.id} className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center font-semibold text-indigo-600">
                  {member.full_name?.charAt(0) || member.email?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{member.full_name || member.email}</div>
                  <div className="text-sm text-slate-600 flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    {member.email}
                  </div>
                </div>
                <Badge className="bg-indigo-100 text-indigo-600">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}