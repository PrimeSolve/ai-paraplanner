import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AdviceGroupSidebar from '../components/advicegroup/AdviceGroupSidebar';
import AdviceGroupHeader from '../components/advicegroup/AdviceGroupHeader';
import AdminLayout from '../components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Shield, Mail, Calendar, Upload, X } from 'lucide-react';

export default function AdviceGroupMyProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    profile_image_url: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
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
        full_name: currentUser.display_name || currentUser.full_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        profile_image_url: currentUser.profile_image_url || ''
      });
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
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
    return 'January 2026';
  };

  if (loading) {
    return (
      <div className="flex">
        <AdviceGroupSidebar currentPage="settings" />
        <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <AdviceGroupHeader user={user} />
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdviceGroupSidebar currentPage="settings" />
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AdviceGroupHeader user={user} />
        <div className="min-h-screen bg-[#f8fafc] p-8" style={{ flex: 1 }}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <div className="flex items-center gap-4">
              {formData.profile_image_url ? (
                <div className="relative group">
                  <img 
                    src={formData.profile_image_url} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                  <button
                    onClick={() => setFormData({...formData, profile_image_url: ''})}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                  {getInitials()}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-[#0f172a] mb-2">
                  {formData.full_name || 'User'}
                </h2>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm text-[#8b5cf6]">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Advice Group</span>
                  </div>
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

            {/* Profile Image Upload */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Profile Image</Label>
              <div className="flex items-center gap-4">
                {formData.profile_image_url ? (
                  <img 
                    src={formData.profile_image_url} 
                    alt="Profile preview" 
                    className="w-20 h-20 rounded-lg object-cover border border-[#e2e8f0]"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    {getInitials()}
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    id="profile-image"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadingImage(true);
                        try {
                          const result = await base44.integrations.Core.UploadFile({ file });
                          setFormData({...formData, profile_image_url: result.file_url});
                          toast.success('Image uploaded');
                        } catch (error) {
                          toast.error('Failed to upload image');
                        } finally {
                          setUploadingImage(false);
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingImage}
                    onClick={() => document.getElementById('profile-image').click()}
                    className="border-[#e2e8f0]"
                  >
                    {uploadingImage ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </>
                    )}
                  </Button>
                  {formData.profile_image_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setFormData({...formData, profile_image_url: ''})}
                      className="ml-2 text-red-600"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

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
                  value={user?.role === 'admin' ? 'Administrator' : 'Advice Group'}
                  disabled
                  className="border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]"
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
              onClick={async () => {
                try {
                  await base44.auth.updateMe({
                    display_name: formData.full_name,
                    phone: formData.phone,
                    profile_image_url: formData.profile_image_url
                  });
                  setUser(prev => ({ ...prev, display_name: formData.full_name, phone: formData.phone, profile_image_url: formData.profile_image_url }));
                  toast.success('Profile updated successfully');
                  window.dispatchEvent(new Event('userProfileUpdated'));
                } catch (error) {
                  console.error('Error:', error);
                  toast.error('Failed to update profile');
                }
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
        </div>
        </div>
        </div>
        );
        }