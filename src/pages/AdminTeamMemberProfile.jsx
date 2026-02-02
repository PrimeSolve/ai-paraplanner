import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Shield, FileText, Upload, Calendar, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTeamMemberProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [member, setMember] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'user'
  });
  const [notifications, setNotifications] = useState({
    new_clients: true,
    system_alerts: true,
    weekly_summary: false
  });

  useEffect(() => {
    loadMemberData();
  }, []);

  const loadMemberData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const memberId = urlParams.get('id');
      
      if (!memberId) {
        toast.error('No member ID provided');
        navigate(createPageUrl('AdminTeam'));
        return;
      }

      const adminRecord = await base44.entities.Admin.filter({ id: memberId });
      if (!adminRecord || adminRecord.length === 0) {
        toast.error('Member not found');
        navigate(createPageUrl('AdminTeam'));
        return;
      }

      const adminData = adminRecord[0];
      setAdmin(adminData);

      // Try to load User record if exists
      if (adminData.user_id) {
        const userRecord = await base44.entities.User.filter({ id: adminData.user_id });
        if (userRecord && userRecord.length > 0) {
          setMember(userRecord[0]);
          setFormData({
            full_name: userRecord[0].full_name || `${adminData.first_name || ''} ${adminData.last_name || ''}`.trim(),
            email: adminData.email,
            phone: adminData.phone || '',
            role: userRecord[0].role || 'user'
          });
        } else {
          setFormData({
            full_name: `${adminData.first_name || ''} ${adminData.last_name || ''}`.trim(),
            email: adminData.email,
            phone: adminData.phone || '',
            role: 'user'
          });
        }
      } else {
        setFormData({
          full_name: `${adminData.first_name || ''} ${adminData.last_name || ''}`.trim(),
          email: adminData.email,
          phone: adminData.phone || '',
          role: 'user'
        });
      }
    } catch (error) {
      console.error('Failed to load member:', error);
      toast.error('Failed to load member data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const nameParts = formData.full_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await base44.entities.Admin.update(admin.id, {
        email: formData.email,
        first_name: firstName,
        last_name: lastName,
        phone: formData.phone
      });

      toast.success('Profile updated successfully');
      navigate(createPageUrl('AdminTeam'));
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    const parts = name.split(' ');
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
  };

  const getAvatarColor = (email) => {
    const colors = [
      'bg-[#ec4899]',
      'bg-[#22d3ee]',
      'bg-[#f97316]',
      'bg-[#8b5cf6]',
      'bg-[#10b981]',
      'bg-[#3b82f6]'
    ];
    const index = email?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="py-6 px-8 max-w-5xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(createPageUrl('AdminTeam'))}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Team
      </Button>

      {/* Profile Header Card */}
      <Card className="bg-white p-8 mb-6">
        <div className="flex items-center gap-6">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold ${getAvatarColor(formData.email)}`}>
            {getInitials(formData.full_name || formData.email)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">{formData.full_name || 'No name'}</h1>
            <div className="flex items-center gap-4 text-sm text-[#64748b]">
              <div className="flex items-center gap-2">
                {formData.role === 'admin' ? (
                  <Badge className="bg-[#8b5cf6]/10 text-[#8b5cf6] border-0">
                    <Shield className="w-3 h-3 mr-1" />
                    System Administrator
                  </Badge>
                ) : (
                  <Badge className="bg-[#3b82f6]/10 text-[#3b82f6] border-0">
                    <FileText className="w-3 h-3 mr-1" />
                    Paraplanner
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {formData.email}
              </div>
              {admin?.created_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Member since {new Date(admin.created_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Details */}
      <Card className="bg-white p-8 mb-6">
        <h2 className="text-xl font-bold text-[#0f172a] mb-6">Personal Details</h2>
        
        {/* Profile Image */}
        <div className="mb-6">
          <label className="text-sm font-medium text-[#0f172a] mb-3 block">Profile Image</label>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white text-lg font-bold ${getAvatarColor(formData.email)}`}>
              {getInitials(formData.full_name || formData.email)}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
              <Button variant="outline" size="sm" disabled className="text-red-600">
                Remove
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-[#0f172a] mb-2 block">Full Name</label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#0f172a] mb-2 block">Email Address</label>
            <Input
              value={formData.email}
              disabled
              className="bg-[#f8fafc] text-[#94a3b8]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#0f172a] mb-2 block">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#0f172a] mb-2 block">Role</label>
            <Input
              value={formData.role === 'admin' ? 'System Administrator' : 'Paraplanner'}
              disabled
              className="bg-[#f8fafc] text-[#94a3b8]"
            />
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-white p-8 mb-6">
        <h2 className="text-xl font-bold text-[#0f172a] mb-6">Notification Preferences</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-[#0f172a]">Email me when new clients are added</div>
              <div className="text-sm text-[#64748b] mt-1">Get notified of new client registrations</div>
            </div>
            <Switch
              checked={notifications.new_clients}
              onCheckedChange={(checked) => setNotifications({ ...notifications, new_clients: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-[#0f172a]">Email me on system alerts</div>
              <div className="text-sm text-[#64748b] mt-1">Get notified of important system events</div>
            </div>
            <Switch
              checked={notifications.system_alerts}
              onCheckedChange={(checked) => setNotifications({ ...notifications, system_alerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-[#0f172a]">Weekly admin summary</div>
              <div className="text-sm text-[#64748b] mt-1">Receive a weekly summary of system activity</div>
            </div>
            <Switch
              checked={notifications.weekly_summary}
              onCheckedChange={(checked) => setNotifications({ ...notifications, weekly_summary: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl('AdminTeam'))}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#3b82f6] hover:bg-[#2563eb]"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}