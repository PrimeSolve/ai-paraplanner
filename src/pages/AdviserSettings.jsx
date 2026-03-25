import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/api/axiosInstance';
import { base44 } from '@/api/base44Client';
import { formatMemberSince } from '../utils/dateUtils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Shield, Mail, Calendar, Upload, X } from 'lucide-react';

export default function AdviserSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    authorisedRepNumber: '',
    headOfficeAddress: '',
    profile_image_url: '',
  });
  const [notifications, setNotifications] = useState({
    notifyFactFindCompletedEmail: false,
    notifyFactFindCompletedSms: false,
    notifySOAReadEmail: false,
    notifySOAReadSms: false,
  });
  // Snapshot of last-saved state for Cancel reset
  const [savedFormData, setSavedFormData] = useState(null);
  const [savedNotifications, setSavedNotifications] = useState(null);

  useEffect(() => {
    loadAdviser();
  }, []);

  const loadAdviser = async () => {
    try {
      // TODO: confirm PATCH endpoint and field names with primesolve-api if uncertain.
      // Check if these fields exist on the Adviser entity — if not, flag them clearly with TODO comments rather than guessing.
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // TODO: replace base44.auth.me() with GET /api/v1/advisers/{adviserId} once endpoint is confirmed
      const form = {
        full_name: currentUser.display_name || currentUser.full_name || '',
        email: currentUser.email || '',
        mobile: currentUser.mobile || currentUser.phone || '',
        authorisedRepNumber: currentUser.authorisedRepNumber || '',
        headOfficeAddress: currentUser.headOfficeAddress || '',
        profile_image_url: currentUser.profile_image_url || '',
      };
      const notifs = {
        notifyFactFindCompletedEmail: currentUser.notifyFactFindCompletedEmail ?? false,
        notifyFactFindCompletedSms: currentUser.notifyFactFindCompletedSms ?? false,
        notifySOAReadEmail: currentUser.notifySOAReadEmail ?? false,
        notifySOAReadSms: currentUser.notifySOAReadSms ?? false,
      };
      setFormData(form);
      setNotifications(notifs);
      setSavedFormData(form);
      setSavedNotifications(notifs);
    } catch (error) {
      console.error('Failed to load adviser:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (savedFormData) setFormData(savedFormData);
    if (savedNotifications) setNotifications(savedNotifications);
    setSaveError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      // TODO: confirm PATCH endpoint and field names with primesolve-api if uncertain.
      // TODO: confirm this updates Users/Advisers record used in client registration
      const adviserId = user?.id;
      await axiosInstance.patch(`/advisers/${adviserId}`, {
        fullName: formData.full_name,
        mobile: formData.mobile,
        authorisedRepNumber: formData.authorisedRepNumber,
        headOfficeAddress: formData.headOfficeAddress,
        profileImageUrl: formData.profile_image_url,
        notifyFactFindCompletedEmail: notifications.notifyFactFindCompletedEmail,
        notifyFactFindCompletedSms: notifications.notifyFactFindCompletedSms,
        notifySOAReadEmail: notifications.notifySOAReadEmail,
        notifySOAReadSms: notifications.notifySOAReadSms,
      });

      // Update saved snapshots
      setSavedFormData({ ...formData });
      setSavedNotifications({ ...notifications });

      toast.success('Settings saved');
      window.dispatchEvent(new Event('userProfileUpdated'));
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // TODO: wire notification triggers when fact find completion and SOA read events are implemented

  const getInitials = () => {
    if (formData.full_name) {
      const parts = formData.full_name.split(' ');
      return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
    }
    return formData.email?.charAt(0).toUpperCase() || 'A';
  };

  const getMemberSince = () => formatMemberSince(user?.created_date, 'June 2025');

  const isMobileEmpty = !formData.mobile.trim();

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6]"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px' }}>
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
                  onClick={() => setFormData({ ...formData, profile_image_url: '' })}
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
                {formData.full_name || 'Adviser'}
              </h2>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm text-[#8b5cf6]">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Adviser</span>
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
                  id="adviser-profile-image"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadingImage(true);
                      try {
                        const result = await base44.integrations.Core.UploadFile({ file });
                        setFormData({ ...formData, profile_image_url: result.file_url });
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
                  onClick={() => document.getElementById('adviser-profile-image').click()}
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
                    onClick={() => setFormData({ ...formData, profile_image_url: '' })}
                    className="ml-2 text-red-600"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Two-column grid: Full Name + Email */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="border-[#e2e8f0]"
                required
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Email Address</Label>
              <Input
                value={formData.email}
                disabled
                className="border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]"
              />
              <p className="text-xs text-[#94a3b8] mt-1">Email cannot be changed</p>
            </div>
          </div>

          {/* Two-column grid: Mobile + AR Number */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div>
              <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Mobile</Label>
              <Input
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="+61 4XX XXX XXX"
                className="border-[#e2e8f0]"
                required
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Authorised Representative Number</Label>
              <Input
                value={formData.authorisedRepNumber}
                onChange={(e) => setFormData({ ...formData, authorisedRepNumber: e.target.value })}
                placeholder="e.g. 123456"
                className="border-[#e2e8f0]"
              />
            </div>
          </div>

          {/* Full width: Head Office Address */}
          <div className="mt-6">
            <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Head Office Address</Label>
            <Input
              value={formData.headOfficeAddress}
              onChange={(e) => setFormData({ ...formData, headOfficeAddress: e.target.value })}
              placeholder="e.g. Level 1, 123 Collins St, Melbourne VIC 3000"
              className="border-[#e2e8f0]"
            />
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <h3 className="text-lg font-semibold text-[#0f172a] mb-6">Notification Preferences</h3>

          <div className="space-y-8">
            {/* Event 1: Client has completed Fact Find */}
            <div>
              <div className="font-medium text-[#0f172a] mb-1">Client has completed Fact Find</div>
              <div className="text-sm text-[#64748b] mb-4">Notify me when a client submits their fact find</div>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#0f172a]">Email</span>
                  <Switch
                    checked={notifications.notifyFactFindCompletedEmail}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, notifyFactFindCompletedEmail: checked })
                    }
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#0f172a]">SMS</span>
                  <Switch
                    checked={notifications.notifyFactFindCompletedSms}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, notifyFactFindCompletedSms: checked })
                    }
                    disabled={isMobileEmpty}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
              </div>
              {isMobileEmpty && (
                <p className="text-xs text-[#94a3b8] mt-2">
                  Add a mobile number above to enable SMS notifications
                </p>
              )}
            </div>

            {/* Event 2: Client has Read SOA */}
            <div>
              <div className="font-medium text-[#0f172a] mb-1">Client has Read SOA</div>
              <div className="text-sm text-[#64748b] mb-4">Notify me when a client opens their Statement of Advice</div>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#0f172a]">Email</span>
                  <Switch
                    checked={notifications.notifySOAReadEmail}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, notifySOAReadEmail: checked })
                    }
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#0f172a]">SMS</span>
                  <Switch
                    checked={notifications.notifySOAReadSms}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, notifySOAReadSms: checked })
                    }
                    disabled={isMobileEmpty}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
              </div>
              {isMobileEmpty && (
                <p className="text-xs text-[#94a3b8] mt-2">
                  Add a mobile number above to enable SMS notifications
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          {saveError && (
            <p className="text-sm text-red-600 mr-auto">{saveError}</p>
          )}
          <Button
            variant="outline"
            className="border-[#e2e8f0]"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
