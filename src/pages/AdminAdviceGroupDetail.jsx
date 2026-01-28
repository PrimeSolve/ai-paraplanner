import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useRole } from '../components/RoleContext';
import AdviceGroupLayout from '../components/advicegroup/AdviceGroupLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building2, Users, FileText, Settings, Mail, Phone, Trash2, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AdminAdviceGroupDetail() {
  const { switchRole } = useRole();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    status: 'active',
    subscription_tier: 'professional',
    logo_url: '',
    abn: '',
    afsl: '',
    address: {
      street: '',
      city: '',
      state: '',
      postcode: ''
    }
  });

  useEffect(() => {
    loadGroup();
  }, []);

  const loadGroup = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      
      if (id) {
        const groups = await base44.entities.AdviceGroup.filter({ id });
        const groupData = groups[0];
        setGroup(groupData);
        switchRole('advice_group', groupData.id, groupData.name);
        setFormData({
          name: groupData.name || '',
          slug: groupData.slug || '',
          contact_email: groupData.contact_email || '',
          contact_phone: groupData.contact_phone || '',
          status: groupData.status || 'active',
          subscription_tier: groupData.subscription_tier || 'professional',
          logo_url: groupData.logo_url || '',
          abn: groupData.abn || '',
          afsl: groupData.afsl || '',
          address: groupData.address || {
            street: '',
            city: '',
            state: '',
            postcode: ''
          }
        });
      }
    } catch (error) {
      console.error('Failed to load group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await base44.entities.AdviceGroup.update(group.id, formData);
      loadGroup();
    } catch (error) {
      console.error('Failed to update advice group:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <AdviceGroupLayout currentPage="settings">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdviceGroupLayout>
    );
  }

  return (
    <AdviceGroupLayout currentPage="settings">
      {/* Header */}
      <div className="bg-white py-4 border-b border-slate-200 sticky top-0 z-10" style={{ paddingLeft: 0, paddingRight: '32px' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to={createPageUrl('AdminAdviceGroups')} className="text-sm text-slate-600 hover:text-slate-900 no-underline">Advice Groups</Link>
            <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-slate-900 mt-1">{group?.name || 'Advice Group'}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm">
              {group?.afsl && <span className="text-slate-600">AFSL {group.afsl}</span>}
              <span className="text-slate-600">5 advisers</span>
              <Badge className="bg-cyan-100 text-cyan-700">Custom template</Badge>
            </div>
          </div>
          <button className="text-slate-600 hover:text-red-600 transition-colors flex items-center gap-2 px-4 py-2">
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">Delete Group</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-0 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`pb-3 px-0 font-medium text-sm transition-colors ${
              activeTab === 'template'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Template
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 px-0 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'members'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Members
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">5</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-0 font-medium text-sm transition-colors ${
              activeTab === 'settings'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <form onSubmit={handleSaveChanges} className="space-y-6 max-w-4xl">
            {/* Group Details Section */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Group Details</h2>

              {/* Logo Upload */}
              <div className="mb-8 pb-8 border-b border-slate-200">
                <p className="text-sm font-semibold text-slate-900 mb-4">Group Logo</p>
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-lg border-2 border-slate-300 flex items-center justify-center text-4xl flex-shrink-0">
                    🏢
                  </div>
                  <div className="space-y-2">
                    <button type="button" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                      Upload New Logo
                    </button>
                    <button type="button" className="block text-sm font-semibold text-slate-700 hover:text-slate-900">
                      Remove
                    </button>
                    <p className="text-xs text-slate-600 mt-2">PNG or SVG, max 2MB</p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Group Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">AFSL Number</label>
                  <input
                    type="text"
                    value={formData.afsl}
                    onChange={(e) => setFormData({...formData, afsl: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">ABN</label>
                  <input
                    type="text"
                    value={formData.abn}
                    onChange={(e) => setFormData({...formData, abn: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Primary Contact Email</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Business Address</label>
                <textarea
                  value={`${formData.address?.street || ''}\n${formData.address?.city || ''} ${formData.address?.state || ''} ${formData.address?.postcode || ''}`}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    setFormData({
                      ...formData,
                      address: {
                        street: lines[0] || '',
                        city: lines[1]?.split(' ')[0] || '',
                        state: lines[1]?.split(' ')[1] || '',
                        postcode: lines[1]?.split(' ')[2] || ''
                      }
                    });
                  }}
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => loadGroup()}
                className="px-6 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Template Tab */}
        {activeTab === 'template' && (
          <div className="text-slate-600">Template configuration coming soon...</div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="text-slate-600">Members list coming soon...</div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="text-slate-600">Settings coming soon...</div>
        )}
      </div>
    </AdviceGroupLayout>
  );
}