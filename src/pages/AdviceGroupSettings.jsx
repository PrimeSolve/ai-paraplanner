import React, { useState, useEffect } from 'react';
import axiosInstance from '@/api/axiosInstance';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Palette, Lock } from 'lucide-react';
import { toast } from 'sonner';


export default function AdviceGroupSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [user, setUser] = useState(null);
  const [adviceGroup, setAdviceGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    afsl_number: '',
    abn: '',
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
    branding: {
      primary_colour: '#1d4ed8',
      secondary_colour: '#64748b',
      footer_text: '',
      disclaimer: ''
    },
    permissions: {
      edit_risk_profiles: false,
      edit_model_portfolios: false,
      override_soa_template: false
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
            afsl_number: group.afsl_number || '',
            abn: group.abn || '',
            contact_email: group.contact_email || '',
            contact_phone: group.contact_phone || '',
            address: group.address || { street: '', city: '', state: '', postcode: '', country: '' },
            logo_url: group.logo_url || '',
            branding: group.branding || {
              primary_colour: '#1d4ed8',
              secondary_colour: '#64748b',
              footer_text: '',
              disclaimer: ''
            },
            permissions: {
              edit_risk_profiles: group.permissions?.edit_risk_profiles ?? false,
              edit_model_portfolios: group.permissions?.edit_model_portfolios ?? false,
              override_soa_template: group.permissions?.override_soa_template ?? group.permissions?.invite_advisers ?? false
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
      await axiosInstance.patch(`/advice-groups/${adviceGroup.id}`, formData);
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'permissions', label: 'Permissions', icon: Lock }
  ];

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="flex gap-8">
            {/* Settings Tabs */}
            <div className="w-[220px] shrink-0">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-[10px] text-sm font-medium w-full text-left mb-1 border-none cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'text-blue-500 bg-white shadow-sm'
                        : 'text-slate-600 bg-transparent'
                    }`}
                  >
                    <Icon size={20} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Settings Content */}
            <div className="flex-1">
              {activeTab === 'general' && (
                <div>
                  {/* Business Details Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
                    <div className="px-6 py-5 border-b border-slate-200">
                      <h3 className="text-base font-bold text-slate-800 mb-1">
                        Business Details
                      </h3>
                      <p className="text-sm text-slate-500">
                        Manage your advice group's business information
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="mb-6">
                        <Label className="text-sm font-bold">Business Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-5 mb-6">
                        <div>
                          <Label className="text-sm font-bold">AFSL Number</Label>
                          <Input
                            value={formData.afsl_number}
                            onChange={(e) => setFormData({ ...formData, afsl_number: e.target.value })}
                            placeholder="e.g. 123456"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-bold">ABN</Label>
                          <Input
                            value={formData.abn}
                            onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                            placeholder="e.g. 12 345 678 901"
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-5 mb-6">
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

                      <div className="mb-6">
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
                        <div className="grid grid-cols-[2fr_1fr_1fr] gap-3">
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
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
                    <div className="px-6 py-5 border-b border-slate-200">
                      <h3 className="text-base font-bold text-slate-800 mb-1">
                        Logo
                      </h3>
                      <p className="text-sm text-slate-500">
                        Upload your business logo for SOA documents
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-5">
                        <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-3xl text-slate-400 overflow-hidden">
                          {logoFile || formData.logo_url ? (
                            <img
                              src={logoFile || formData.logo_url}
                              alt="Logo"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            '\u{1F4F7}'
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="logo-input">
                            <Button asChild className="bg-blue-600 hover:bg-blue-700">
                              <span>Upload Logo</span>
                            </Button>
                          </label>
                          <input
                            id="logo-input"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <p className="text-xs text-slate-500">
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
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}

              {activeTab === 'branding' && (
                <div>
                  {/* Document Colours Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
                    <div className="px-6 py-5 border-b border-slate-200">
                      <h3 className="text-base font-bold text-slate-800 mb-1">
                        Document Colours
                      </h3>
                      <p className="text-sm text-slate-500">
                        Customise colours used in SOA documents
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-bold mb-3 block">Primary Colour</Label>
                          <div className="flex gap-3 items-center">
                            <input
                              type="color"
                              value={formData.branding.primary_colour}
                              onChange={(e) => setFormData({
                                ...formData,
                                branding: { ...formData.branding, primary_colour: e.target.value }
                              })}
                              className="w-[60px] h-[60px] rounded-lg cursor-pointer border-none"
                            />
                            <div>
                              <p className="text-[13px] font-semibold text-slate-800">
                                {formData.branding.primary_colour.toUpperCase()}
                              </p>
                              <p className="text-xs text-slate-500">
                                Used for headings and accents
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-bold mb-3 block">Secondary Colour</Label>
                          <div className="flex gap-3 items-center">
                            <input
                              type="color"
                              value={formData.branding.secondary_colour}
                              onChange={(e) => setFormData({
                                ...formData,
                                branding: { ...formData.branding, secondary_colour: e.target.value }
                              })}
                              className="w-[60px] h-[60px] rounded-lg cursor-pointer border-none"
                            />
                            <div>
                              <p className="text-[13px] font-semibold text-slate-800">
                                {formData.branding.secondary_colour.toUpperCase()}
                              </p>
                              <p className="text-xs text-slate-500">
                                Used for secondary elements
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Footer Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
                    <div className="px-6 py-5 border-b border-slate-200">
                      <h3 className="text-base font-bold text-slate-800 mb-1">
                        Document Footer
                      </h3>
                      <p className="text-sm text-slate-500">
                        Customise the footer text on SOA documents
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="mb-6">
                        <Label className="text-sm font-bold mb-2 block">Footer Text</Label>
                        <textarea
                          value={formData.branding.footer_text}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding, footer_text: e.target.value }
                          })}
                          placeholder="Enter footer text for SOA documents"
                          className="w-full px-3.5 py-3 border-2 border-slate-200 rounded-[10px] font-[inherit] text-sm min-h-[100px] resize-y"
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
                          className="w-full px-3.5 py-3 border-2 border-slate-200 rounded-[10px] font-[inherit] text-sm min-h-[100px] resize-y"
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}

              {activeTab === 'permissions' && (
                <div>
                  {/* Configuration Access Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
                    <div className="px-6 py-5 border-b border-slate-200">
                      <h3 className="text-base font-bold text-slate-800 mb-1">
                        Configuration Access
                      </h3>
                      <p className="text-sm text-slate-500">
                        Control who can modify configuration settings
                      </p>
                    </div>
                    <div className="p-6">
                      {[
                        { key: 'edit_risk_profiles', label: 'Advisers can edit risk profiles', desc: 'Allow advisers to create and modify risk profiles' },
                        { key: 'edit_model_portfolios', label: 'Advisers can edit model portfolios', desc: 'Allow advisers to create and modify model portfolios' },
                        { key: 'override_soa_template', label: 'Advisers can override SOA template', desc: 'Allow advisers to override the default SOA template for individual requests' }
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between pb-4 border-b border-slate-200 last:border-b-0 mb-4 last:mb-0">
                          <div>
                            <p className="text-sm font-semibold text-slate-800 mb-1">{item.label}</p>
                            <p className="text-[13px] text-slate-500">{item.desc}</p>
                          </div>
                          <Switch
                            checked={formData.permissions[item.key]}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              permissions: { ...formData.permissions, [item.key]: checked }
                            })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>
    </div>
  );
}
