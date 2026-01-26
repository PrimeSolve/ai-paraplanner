import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X } from 'lucide-react';

export default function ManageGroupModal({ open, onOpenChange, group }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState({
    name: '',
    afsl_number: '',
    abn: '',
    contact_email: '',
    business_address: '',
    logo_url: ''
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        afsl_number: group.afsl_number || '123456',
        abn: group.abn || '12 345 678 901',
        contact_email: group.contact_email || '',
        business_address: group.address?.street ? `${group.address.street}\n${group.address.city} ${group.address.state} ${group.address.postcode}` : '',
        logo_url: group.logo_url || ''
      });
    }
  }, [group, open]);

  const handleSave = async () => {
    // Save logic here
    console.log('Saving group:', formData);
  };

  const getGroupInitial = (name) => name?.charAt(0).toUpperCase() || 'A';

  const getColorClass = () => {
    const colors = ['bg-purple-600', 'bg-orange-600', 'bg-green-600', 'bg-blue-600'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header with group info */}
        <div className="pb-4 border-b border-slate-200">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-16 h-16 rounded-xl ${getColorClass()} flex items-center justify-center text-white font-bold text-2xl flex-shrink-0`}>
              {getGroupInitial(group.name)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-slate-900">{group.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-slate-600">AFSL 123456</span>
                <span className="text-xs text-slate-600">5 advisers</span>
                <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-cyan-100 text-cyan-700">
                  Custom template
                </span>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-slate-900">47</div>
              <div className="text-xs text-slate-600">Total SOAs</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-slate-900">8</div>
              <div className="text-xs text-slate-600">This Month</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-slate-900">3.8</div>
              <div className="text-xs text-slate-600">Avg Days Turnaround</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-5 bg-slate-100">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="risk-profiles">Risk Profiles</TabsTrigger>
            <TabsTrigger value="portfolios">Portfolios</TabsTrigger>
            <TabsTrigger value="soa-template">SOA Template</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              {/* Group Logo Section */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Group Logo</h3>
                <div className="flex items-start gap-4">
                  <div className={`w-20 h-20 rounded-lg ${getColorClass()} flex items-center justify-center text-white font-bold text-3xl`}>
                    {getGroupInitial(group.name)}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New Logo
                    </Button>
                    <button className="text-sm text-slate-600 hover:text-slate-900 font-medium">
                      Remove
                    </button>
                    <p className="text-xs text-slate-500 mt-1">PNG or JPG, max 2MB</p>
                  </div>
                </div>
              </div>

              {/* Group Details Section */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Group Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-slate-900">Group Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="mt-1.5"
                        placeholder="Enter group name"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-900">AFSL Number</Label>
                      <Input
                        value={formData.afsl_number}
                        onChange={(e) => setFormData({...formData, afsl_number: e.target.value})}
                        className="mt-1.5"
                        placeholder="Enter AFSL number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-slate-900">ABN</Label>
                      <Input
                        value={formData.abn}
                        onChange={(e) => setFormData({...formData, abn: e.target.value})}
                        className="mt-1.5"
                        placeholder="Enter ABN"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-900">Primary Contact Email</Label>
                      <Input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                        className="mt-1.5"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-slate-900">Business Address</Label>
                    <textarea
                      value={formData.business_address}
                      onChange={(e) => setFormData({...formData, business_address: e.target.value})}
                      className="mt-1.5 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Enter business address"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-6">
            <div className="text-center text-slate-600 py-8">Members management coming soon</div>
          </TabsContent>

          {/* Risk Profiles Tab */}
          <TabsContent value="risk-profiles" className="mt-6">
            <div className="text-center text-slate-600 py-8">Risk profiles management coming soon</div>
          </TabsContent>

          {/* Portfolios Tab */}
          <TabsContent value="portfolios" className="mt-6">
            <div className="text-center text-slate-600 py-8">Portfolios management coming soon</div>
          </TabsContent>

          {/* SOA Template Tab */}
          <TabsContent value="soa-template" className="mt-6">
            <div className="text-center text-slate-600 py-8">SOA Template management coming soon</div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}