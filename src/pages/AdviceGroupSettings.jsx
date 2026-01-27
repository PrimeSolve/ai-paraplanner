import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Bell, Palette, Lock } from 'lucide-react';
import { toast } from 'sonner';
import AdviceGroupSidebar from '../components/advicegroup/AdviceGroupSidebar';
import AdviceGroupHeader from '../components/advicegroup/AdviceGroupHeader';

export default function AdviceGroupSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [user, setUser] = useState(null);
  const [adviceGroup, setAdviceGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postcode: '',
      country: ''
    },
    logo_url: '',
    notifications: {
      new_soa_submitted: true,
      soa_status_changes: true,
      soa_completed: true,
      comments_feedback: false,
      daily_summary: true,
      weekly_report: false
    },
    branding: {
      primary_colour: '#1d4ed8',
      secondary_colour: '#64748b',
      footer_text: '',
      disclaimer: ''
    },
    permissions: {
      submit_soa: true,
      view_all_completed: false,
      download_soa: true,
      edit_risk_profiles: false,
      edit_model_portfolios: false,
      invite_advisers: false
    }
  });

  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      let groupId = currentUser.advice_group_id;
      if (!groupId) {
        const groups = await base44.entities.AdviceGroup.list('created_date', 1);
        if (groups.length > 0) {
          groupId = groups[0].id;
        }
      }

      if (groupId) {
        const groups = await base44.entities.AdviceGroup.filter({ id: groupId });
        if (groups.length > 0) {
          const group = groups[0];
          setAdviceGroup(group);
          setFormData({
            name: group.name || '',
            contact_email: group.contact_email || '',
            contact_phone: group.contact_phone || '',
            address: group.address || { street: '', city: '', state: '', postcode: '', country: '' },
            logo_url: group.logo_url || '',
            notifications: group.notifications || {
              new_soa_submitted: true,
              soa_status_changes: true,
              soa_completed: true,
              comments_feedback: false,
              daily_summary: true,
              weekly_report: false
            },
            branding: group.branding || {
              primary_colour: '#1d4ed8',
              secondary_colour: '#64748b',
              footer_text: '',
              disclaimer: ''
            },
            permissions: group.permissions || {
              submit_soa: true,
              view_all_completed: false,
              download_soa: true,
              edit_risk_profiles: false,
              edit_model_portfolios: false,
              invite_advisers: false
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadedFile = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, logo_url: uploadedFile.file_url }));
      setLogoFile(URL.createObjectURL(file));
      toast.success('Logo uploaded');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload logo');
    }
  };

  const handleSave = async () => {
    if (!adviceGroup?.id) {
      toast.error('No advice group found');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Business name is required');
      return;
    }

    try {
      setSaving(true);
      await base44.entities.AdviceGroup.update(adviceGroup.id, formData);
      toast.success('Settings saved');
      await loadData();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <AdviceGroupSidebar currentPage="settings" />
        <div style={{ marginLeft: '260px', flex: 1 }}>
          <AdviceGroupHeader user={user} />
          <div className="p-8 flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'permissions', label: 'Permissions', icon: Lock }
  ];

  return (
    <div className="flex">
      <AdviceGroupSidebar currentPage="settings" />

      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AdviceGroupHeader user={user} />

        <div className="p-8 flex-1 bg-gradient-to-br from-slate-50 to-slate-100">
          <div style={{ display: 'flex', gap: '32px' }}>
            {/* Settings Tabs */}
            <div style={{ width: '220px', flexShrink: 0 }}>
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: activeTab === tab.id ? '#3b82f6' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginBottom: '4px',
                      border: 'none',
                      background: activeTab === tab.id ? 'white' : 'transparent',
                      width: '100%',
                      textAlign: 'left',
                      boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none'
                    }}
                  >
                    <Icon size={20} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Settings Content */}
            <div style={{ flex: 1 }}>
              {activeTab === 'general' && (
                <div>
                  {/* Business Details Card */}
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                        Business Details
                      </h3>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>
                        Manage your advice group's business information
                      </p>
                    </div>
                    <div style={{ padding: '24px' }}>
                      <div style={{ marginBottom: '24px' }}>
                        <Label className="text-sm font-bold">Business Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-2"
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        <div>
                          <Label className="text-sm font-bold">Contact Email</Label>
                          <Input
                            type="email"
                            value={formData.contact_email}
                            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-bold">Contact Phone</Label>
                          <Input
                            value={formData.contact_phone}
                            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <Label className="text-sm font-bold">Business Address</Label>
                        <Input
                          value={formData.address.street}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: { ...formData.address, street: e.target.value }
                          })}
                          placeholder="Street address"
                          className="mt-2 mb-2"
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                          <Input
                            value={formData.address.city}
                            onChange={(e) => setFormData({
                              ...formData,
                              address: { ...formData.address, city: e.target.value }
                            })}
                            placeholder="City"
                          />
                          <Input
                            value={formData.address.state}
                            onChange={(e) => setFormData({
                              ...formData,
                              address: { ...formData.address, state: e.target.value }
                            })}
                            placeholder="State"
                          />
                          <Input
                            value={formData.address.postcode}
                            onChange={(e) => setFormData({
                              ...formData,
                              address: { ...formData.address, postcode: e.target.value }
                            })}
                            placeholder="Postcode"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logo Card */}
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                        Logo
                      </h3>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>
                        Upload your business logo for SOA documents
                      </p>
                    </div>
                    <div style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div
                          style={{
                            width: '80px',
                            height: '80px',
                            background: '#f8fafc',
                            border: '2px dashed #e2e8f0',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '32px',
                            color: '#94a3b8',
                            overflow: 'hidden'
                          }}
                        >
                          {logoFile || formData.logo_url ? (
                            <img
                              src={logoFile || formData.logo_url}
                              alt="Logo"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            '📷'
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label htmlFor="logo-input">
                            <Button asChild className="bg-blue-600 hover:bg-blue-700">
                              <span>📤 Upload Logo</span>
                            </Button>
                          </label>
                          <input
                            id="logo-input"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            style={{ display: 'none' }}
                          />
                          <p style={{ fontSize: '12px', color: '#64748b' }}>
                            PNG, JPG up to 2MB. Recommended 200x200px
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? 'Saving...' : '💾 Save Changes'}
                  </Button>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  {/* Email Notifications Card */}
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                        Email Notifications
                      </h3>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>
                        Choose which events trigger email notifications
                      </p>
                    </div>
                    <div style={{ padding: '24px' }}>
                      {[
                        { key: 'new_soa_submitted', label: 'New SOA submitted', desc: 'Receive an email when an adviser submits a new SOA request' },
                        { key: 'soa_status_changes', label: 'SOA status changes', desc: 'Receive updates when an SOA moves to a new status' },
                        { key: 'soa_completed', label: 'SOA completed', desc: 'Receive an email when SOA is marked as complete' },
                        { key: 'comments_feedback', label: 'Comments & feedback', desc: 'Receive notifications when someone comments on an SOA' }
                      ].map(item => (
                        <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }} className="last:border-b-0">
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{item.label}</p>
                            <p style={{ fontSize: '13px', color: '#64748b' }}>{item.desc}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.notifications[item.key]}
                            onChange={(e) => setFormData({
                              ...formData,
                              notifications: { ...formData.notifications, [item.key]: e.target.checked }
                            })}
                            style={{ width: '48px', height: '28px', cursor: 'pointer', accentColor: '#3b82f6' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Reports Card */}
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                        Summary Reports
                      </h3>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>
                        Configure automated summary emails
                      </p>
                    </div>
                    <div style={{ padding: '24px' }}>
                      {[
                        { key: 'daily_summary', label: 'Daily summary', desc: 'Receive a daily overview of SOA activity each morning' },
                        { key: 'weekly_report', label: 'Weekly report', desc: 'Receive a comprehensive weekly report every Monday' }
                      ].map(item => (
                        <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }} className="last:border-b-0">
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{item.label}</p>
                            <p style={{ fontSize: '13px', color: '#64748b' }}>{item.desc}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.notifications[item.key]}
                            onChange={(e) => setFormData({
                              ...formData,
                              notifications: { ...formData.notifications, [item.key]: e.target.checked }
                            })}
                            style={{ width: '48px', height: '28px', cursor: 'pointer', accentColor: '#3b82f6' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    {saving ? 'Saving...' : '💾 Save Changes'}
                  </Button>
                </div>
              )}

              {activeTab === 'branding' && (
                <div>
                  {/* Document Colours Card */}
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                        Document Colours
                      </h3>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>
                        Customise colours used in SOA documents
                      </p>
                    </div>
                    <div style={{ padding: '24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                          <Label className="text-sm font-bold mb-3 block">Primary Colour</Label>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input
                              type="color"
                              value={formData.branding.primary_colour}
                              onChange={(e) => setFormData({
                                ...formData,
                                branding: { ...formData.branding, primary_colour: e.target.value }
                              })}
                              style={{ width: '60px', height: '60px', borderRadius: '8px', cursor: 'pointer', border: 'none' }}
                            />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                                {formData.branding.primary_colour.toUpperCase()}
                              </p>
                              <p style={{ fontSize: '12px', color: '#64748b' }}>
                                Used for headings and accents
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-bold mb-3 block">Secondary Colour</Label>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input
                              type="color"
                              value={formData.branding.secondary_colour}
                              onChange={(e) => setFormData({
                                ...formData,
                                branding: { ...formData.branding, secondary_colour: e.target.value }
                              })}
                              style={{ width: '60px', height: '60px', borderRadius: '8px', cursor: 'pointer', border: 'none' }}
                            />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                                {formData.branding.secondary_colour.toUpperCase()}
                              </p>
                              <p style={{ fontSize: '12px', color: '#64748b' }}>
                                Used for secondary elements
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Footer Card */}
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                        Document Footer
                      </h3>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>
                        Customise the footer text on SOA documents
                      </p>
                    </div>
                    <div style={{ padding: '24px' }}>
                      <div style={{ marginBottom: '24px' }}>
                        <Label className="text-sm font-bold mb-2 block">Footer Text</Label>
                        <textarea
                          value={formData.branding.footer_text}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding, footer_text: e.target.value }
                          })}
                          placeholder="Enter footer text for SOA documents"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '10px',
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            minHeight: '100px',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-bold mb-2 block">Disclaimer</Label>
                        <textarea
                          value={formData.branding.disclaimer}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding, disclaimer: e.target.value }
                          })}
                          placeholder="Enter disclaimer text"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '10px',
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            minHeight: '100px',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    {saving ? 'Saving...' : '💾 Save Changes'}
                  </Button>
                </div>
              )}

              {activeTab === 'permissions' && (
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
                    Permission Settings
                  </h3>
                  <p style={{ color: '#64748b' }}>Permission settings coming soon...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}