import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import AdviceGroupSidebar from '../components/advicegroup/AdviceGroupSidebar';
import AdviceGroupHeader from '../components/advicegroup/AdviceGroupHeader';

export default function AdviceGroupSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postcode: '',
      country: 'Australia'
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.advice_group_id) {
        const groups = await base44.entities.AdviceGroup.filter({ id: currentUser.advice_group_id });
        if (groups[0]) {
          setGroup(groups[0]);
          setFormData({
            name: groups[0].name || '',
            contact_email: groups[0].contact_email || '',
            contact_phone: groups[0].contact_phone || '',
            address: groups[0].address || {
              street: '',
              city: '',
              state: '',
              postcode: '',
              country: 'Australia'
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to load group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (group?.id) {
        await base44.entities.AdviceGroup.update(group.id, formData);
        toast.success('Settings saved successfully');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const colors = {
    core: {
      navy: '#1e293b',
      slate: '#475569',
      slateLight: '#64748b',
      grey: '#94a3b8',
      greyLight: '#e2e8f0',
      offWhite: '#f8fafc',
      white: '#ffffff',
    },
    accent: {
      blue: '#3b82f6',
      blueDeep: '#1d4ed8',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      coral: '#f97316',
      purple: '#8b5cf6',
      pink: '#ec4899',
      cyan: '#06b6d4',
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      background: colors.core.offWhite,
    }}>
      <AdviceGroupSidebar currentPage="settings" />

      <div style={{
        marginLeft: '260px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <AdviceGroupHeader user={user} />

        {/* Main Content */}
        <div style={{
          flex: 1,
          padding: '32px',
        }}>
          <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Business Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Your Advice Group"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    placeholder="info@example.com"
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                    placeholder="+61 2 1234 5678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Street Address</Label>
                <Input
                  value={formData.address?.street || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {...formData.address, street: e.target.value}
                  })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.address?.city || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: {...formData.address, city: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={formData.address?.state || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: {...formData.address, state: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <Label>Postcode</Label>
                  <Input
                    value={formData.address?.postcode || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: {...formData.address, postcode: e.target.value}
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={loadData}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}