import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

export default function AdminSettings() {
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    // Load logo preview from saved business details
    const saved = localStorage.getItem('businessDetails');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.logo_url) {
        setLogoPreview(parsed.logo_url);
      }
    }
  }, []);
  
  const [businessDetails, setBusinessDetails] = useState(() => {
    const saved = localStorage.getItem('businessDetails');
    return saved ? JSON.parse(saved) : {
      companyName: 'AI Paraplanner',
      abn: '12 345 678 901',
      businessEmail: 'hello@aiparaplanner.com.au',
      supportEmail: 'support@aiparaplanner.com.au',
      address: 'Level 10, 123 Collins Street\nMelbourne VIC 3000',
      role: 'admin',
      logo_url: null
    };
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        toast.loading('Uploading logo...', { id: 'logo-upload' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setLogoPreview(file_url);
        setBusinessDetails({...businessDetails, logo_url: file_url});
        toast.success('Logo uploaded successfully', { id: 'logo-upload' });
      } catch (error) {
        toast.error('Failed to upload logo', { id: 'logo-upload' });
      }
    }
  };

  return (
    <div className="py-6 px-8">
            {/* Business Details */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-1">Business Details</h2>
                  <p className="text-sm text-[#64748b]">Your company information displayed to advisers</p>
                </div>

                <div className="space-y-6">
                  {/* Company Logo */}
                  <div>
                    <Label className="text-sm font-medium text-[#0f172a] mb-3 block">Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] rounded-xl flex items-center justify-center text-white font-bold text-xl">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          'AI'
                        )}
                      </div>
                      <div className="flex gap-3">
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          <span className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-[#3b82f6] hover:bg-[#2563eb] text-white h-9 px-4 py-2">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload New Logo
                          </span>
                        </label>
                        {logoPreview && (
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setLogoPreview(null);
                              setBusinessDetails({...businessDetails, logo_url: null});
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#64748b] mt-2">PNG or SVG, max 2MB</p>
                  </div>

                  {/* Company Name, ABN & Role */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Company Name</Label>
                      <Input
                        value={businessDetails.companyName}
                        onChange={(e) => setBusinessDetails({...businessDetails, companyName: e.target.value})}
                        className="border-[#e2e8f0]"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">ABN</Label>
                      <Input
                        value={businessDetails.abn}
                        onChange={(e) => setBusinessDetails({...businessDetails, abn: e.target.value})}
                        className="border-[#e2e8f0]"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Role</Label>
                      <Select
                        value={businessDetails.role}
                        onValueChange={(value) => setBusinessDetails({...businessDetails, role: value})}
                      >
                        <SelectTrigger className="border-[#e2e8f0]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="advice_group">Advice Group</SelectItem>
                          <SelectItem value="adviser">Adviser</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Emails */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Business Contact Email</Label>
                      <Input
                        type="email"
                        value={businessDetails.businessEmail}
                        onChange={(e) => setBusinessDetails({...businessDetails, businessEmail: e.target.value})}
                        className="border-[#e2e8f0]"
                      />
                      <p className="text-xs text-[#64748b] mt-1">Used for invoicing and business enquiries</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Support Email</Label>
                      <Input
                        type="email"
                        value={businessDetails.supportEmail}
                        onChange={(e) => setBusinessDetails({...businessDetails, supportEmail: e.target.value})}
                        className="border-[#e2e8f0]"
                      />
                      <p className="text-xs text-[#64748b] mt-1">Displayed to advisers for support requests</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <Label className="text-sm font-medium text-[#0f172a] mb-2 block">Business Address</Label>
                    <Textarea
                      value={businessDetails.address}
                      onChange={(e) => setBusinessDetails({...businessDetails, address: e.target.value})}
                      className="border-[#e2e8f0] min-h-[100px]"
                    />
                  </div>

                  <div className="pt-4 border-t border-[#e2e8f0]">
                    <Button 
                      className="bg-[#0f172a] hover:bg-[#1e293b] text-white"
                      onClick={() => {
                        localStorage.setItem('businessDetails', JSON.stringify(businessDetails));
                        window.dispatchEvent(new Event('businessDetailsUpdated'));
                        toast.success('Business details saved successfully');
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            );
            }