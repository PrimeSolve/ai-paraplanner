import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdviceGroupLayout from '../components/advicegroup/AdviceGroupLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

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

  return (
    <AdviceGroupLayout currentPage="AdviceGroupSettings">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">Group Settings</h1>
        <p className="text-sm text-slate-600 mt-1">Manage your advice group details</p>
      </div>

      <div className="p-8 max-w-4xl">
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
    </AdviceGroupLayout>
  );
}