import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Shield, Mail, Calendar } from 'lucide-react';

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: ''
  });
  const [notifications, setNotifications] = useState({
    newSOA: true,
    soaComments: true,
    dailySummary: false
  });
  const [twoFactor, setTwoFactor] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData({
        full_name: currentUser.full_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        role: currentUser.role || 'user'
      });
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await base44.auth.updateMe({
        full_name: formData.full_name,
        phone: formData.phone
      });
      toast.success('Profile updated successfully');
      loadUser();
      // Trigger event to update user in AdminLayout
      window.dispatchEvent(new Event('userProfileUpdated'));
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const getInitials = () => {
    if (formData.full_name) {
      const parts = formData.full_name.split(' ');
      return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
    }
    return formData.email?.charAt(0).toUpperCase() || 'U';
  };

  const getMemberSince = () => {
    if (user?.created_date) {
      const date = new Date(user.created_date);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return 'June 2025';
  };

  if (loading) {
    return (
      <AdminLayout currentPage="MyProfile">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="MyProfile">
      <div className="min-h-screen bg-[#f8fafc] p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                {getInitials()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-[#0f172a] mb-2">
                  {formData.full_name || 'User'}
                </h2>
                <div className="flex items-center gap-4 flex-wrap">
                  {formData.role === 'admin' && (
                    <div className="flex items-center gap-1.5 text-sm text-[#8b5cf6]">
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">Admin</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-sm text-[#64748b]">
                    <Mail className="w-4 h-4" />
                    <span>{formData.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-[#64748b]">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {getMemberSince()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <h3 className="text-lg font-semibold text-[#0f172a] mb-6">Personal Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="border-[#e2e8f0]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Email Address</Label>
                <Input
                  value={formData.email}
                  disabled
                  className="border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="0412 345 678"
                  className="border-[#e2e8f0]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Role</Label>
                <Input
                  value={formData.role === 'admin' ? 'Admin' : 'User'}
                  disabled
                  className="border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] capitalize"
                />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <h3 className="text-lg font-semibold text-[#0f172a] mb-6">Security</h3>
            
            <div className="space-y-6">
              {/* Password */}
              <div className="flex items-center justify-between pb-6 border-b border-[#e2e8f0]">
                <div>
                  <div className="font-medium text-[#0f172a] mb-1">Password</div>
                  <div className="text-sm text-[#64748b]">Last changed 3 months ago</div>
                </div>
                <Button variant="outline" className="border-[#e2e8f0]">
                  Change Password
                </Button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#0f172a] mb-1">Two-Factor Authentication</div>
                  <div className="text-sm text-[#64748b]">Add an extra layer of security to your account</div>
                </div>
                <Switch
                  checked={twoFactor}
                  onCheckedChange={setTwoFactor}
                />
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <h3 className="text-lg font-semibold text-[#0f172a] mb-6">Notification Preferences</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#0f172a] mb-1">Email me when assigned a new SOA</div>
                  <div className="text-sm text-[#64748b]">Get notified when an SOA is assigned to you</div>
                </div>
                <Switch
                  checked={notifications.newSOA}
                  onCheckedChange={(checked) => setNotifications({...notifications, newSOA: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#0f172a] mb-1">Email me on SOA comments</div>
                  <div className="text-sm text-[#64748b]">Get notified when someone comments on your SOAs</div>
                </div>
                <Switch
                  checked={notifications.soaComments}
                  onCheckedChange={(checked) => setNotifications({...notifications, soaComments: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#0f172a] mb-1">Daily summary email</div>
                  <div className="text-sm text-[#64748b]">Receive a daily summary of your assigned work</div>
                </div>
                <Switch
                  checked={notifications.dailySummary}
                  onCheckedChange={(checked) => setNotifications({...notifications, dailySummary: checked})}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              className="border-[#e2e8f0]"
              onClick={() => loadUser()}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}