import React, { useState, useEffect } from 'react';
import ClientLayout from '../components/client/ClientLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { formatMemberSince } from '../utils/dateUtils';
import { User, Mail, Calendar, Upload, X } from 'lucide-react';

export default function ClientProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: '',
    profile_image_url: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [notifications, setNotifications] = useState({
    documentReady: true,
    updates: true,
    newsletter: false
  });


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
        role: currentUser.role || 'user',
        profile_image_url: currentUser.profile_image_url || ''
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
        phone: formData.phone,
        profile_image_url: formData.profile_image_url
      });
      
      setUser(prev => ({
        ...prev,
        full_name: formData.full_name,
        phone: formData.phone,
        profile_image_url: formData.profile_image_url
      }));
      
      toast.success('Profile updated successfully');
      window.dispatchEvent(new Event('userProfileUpdated'));
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update profile');
    }
  };

  const getInitials = () => {
    if (formData.full_name) {
      const parts = formData.full_name.split(' ');
      return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
    }
    return formData.email?.charAt(0).toUpperCase() || 'C';
  };

  const getMemberSince = () => formatMemberSince(user?.created_date, 'June 2025');

  if (loading) {
    return (
      <ClientLayout currentPage="ClientProfile">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6]"></div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout currentPage="ClientProfile">
      <div className="min-h-screen bg-[#f8fafc] p-8">
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
                  {formData.full_name || 'Client'}
                </h2>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm text-[#8b5cf6]">
                    <User className="w-4 h-4" />
                    <span className="font-medium">Client Account</span>
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
                <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Account Type</Label>
                <Input
                  value="Client"
                  disabled
                  className="border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]"
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
                  <div className="font-medium text-[#0f172a] mb-1">Notify me when documents are ready</div>
                  <div className="text-sm text-[#64748b]">Get notified when your SOAs are ready for download</div>
                </div>
                <Switch
                   checked={notifications.documentReady}
                   onCheckedChange={(checked) => setNotifications({...notifications, documentReady: checked})}
                   className="data-[state=checked]:bg-blue-500"
                 />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#0f172a] mb-1">Account updates and news</div>
                  <div className="text-sm text-[#64748b]">Get notified of important account changes</div>
                </div>
                <Switch
                   checked={notifications.updates}
                   onCheckedChange={(checked) => setNotifications({...notifications, updates: checked})}
                   className="data-[state=checked]:bg-blue-500"
                 />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#0f172a] mb-1">Newsletter</div>
                  <div className="text-sm text-[#64748b]">Receive financial planning tips and market updates</div>
                </div>
                <Switch
                   checked={notifications.newsletter}
                   onCheckedChange={(checked) => setNotifications({...notifications, newsletter: checked})}
                   className="data-[state=checked]:bg-blue-500"
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
    </ClientLayout>
  );
}