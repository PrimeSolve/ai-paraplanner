import React, { useState, useEffect, useRef } from 'react';
import { useRole } from '../components/RoleContext';
import { clientSettingsApi } from '@/api/clientSettings';
import { User, Mail, Phone, Shield, Camera } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading_photo, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const { navigationChain } = useRole();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    profile_photo_url: ''
  });

  const getClientId = () => {
    const currentLevel = navigationChain.length > 0
      ? navigationChain[navigationChain.length - 1]
      : null;
    const chainId = currentLevel?.type === 'client' ? currentLevel.id : null;
    return chainId || new URLSearchParams(window.location.search).get('clientId');
  };

  useEffect(() => {
    loadSettings();
  }, [navigationChain]);

  const loadSettings = async () => {
    const clientId = getClientId();
    if (!clientId) {
      console.error('No clientId available');
      setLoading(false);
      return;
    }

    try {
      const data = await clientSettingsApi.getClientSettings(clientId);
      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
        profile_photo_url: data.profile_photo_url || ''
      });
    } catch (error) {
      console.error('Failed to load client settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const clientId = getClientId();
    if (!clientId) return;

    setSaving(true);
    try {
      await clientSettingsApi.updateClientSettings(clientId, {
        full_name: formData.full_name,
        phone_number: formData.phone_number
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const clientId = getClientId();
    if (!clientId) return;

    setUploadingPhoto(true);
    try {
      const data = await clientSettingsApi.uploadProfilePhoto(clientId, file);
      setFormData((prev) => ({ ...prev, profile_photo_url: data.profile_photo_url || '' }));
      toast.success('Profile photo updated');
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getInitials = () => {
    const name = formData.full_name || formData.email || '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
          Account Settings
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Manage your profile and preferences
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Personal Information */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User className="w-4 h-4" />
                Personal Information
              </h3>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Your name"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#1e293b'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#94a3b8',
                      background: '#f8fafc'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    Email address cannot be changed
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    placeholder="+61 4XX XXX XXX"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#1e293b'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={loadSettings}
              style={{
                padding: '10px 20px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: 'white',
                color: '#475569',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: '#0f4c5c',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Profile Photo */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '24px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>
              Profile Photo
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                {uploading_photo ? (
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '60px',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '4px solid #f1f5f9'
                  }}>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                  </div>
                ) : formData.profile_photo_url ? (
                  <img
                    src={formData.profile_photo_url}
                    alt="Profile"
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '60px',
                      objectFit: 'cover',
                      border: '4px solid #f1f5f9'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '60px',
                    background: 'linear-gradient(135deg, #0f4c5c, #1a6b7c)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '36px',
                    fontWeight: '700',
                    border: '4px solid #f1f5f9'
                  }}>
                    {getInitials()}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading_photo}
                  style={{
                    padding: '8px 16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#475569',
                    cursor: uploading_photo ? 'not-allowed' : 'pointer',
                    opacity: uploading_photo ? 0.5 : 1
                  }}
                >
                  {uploading_photo ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield className="w-4 h-4" />
              Security
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
              Security is managed via your Microsoft account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
