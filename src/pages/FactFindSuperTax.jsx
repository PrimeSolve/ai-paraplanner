import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, MessageSquare, RefreshCw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'super', label: 'Superannuation', icon: '💰' },
  { id: 'tax', label: 'Tax', icon: '📋' }
];

export default function FactFindSuperTax() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('super');
  const [activeOwner, setActiveOwner] = useState('client');

  const [superData, setSuperData] = useState({
    client: {
      sg_type: 'default',
      sg_amount: '',
      used_transfer_cap: 'no',
      transfer_cap_used: '',
      current_transfer_cap: '',
      triggered_bring_forward: 'no',
      bring_forward_year: '',
      bring_forward_amount: ''
    },
    partner: {
      sg_type: 'default',
      sg_amount: '',
      used_transfer_cap: 'no',
      transfer_cap_used: '',
      current_transfer_cap: '',
      triggered_bring_forward: 'no',
      bring_forward_year: '',
      bring_forward_amount: ''
    }
  });

  const [taxData, setTaxData] = useState({
    client: {
      pre_existing_losses: '',
      pre_existing_cgt_losses: ''
    },
    partner: {
      pre_existing_losses: '',
      pre_existing_cgt_losses: ''
    }
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (id) {
          const finds = await base44.entities.FactFind.filter({ id });
          if (finds[0]) {
            setFactFind(finds[0]);
            if (finds[0].super_tax?.super_strategy) {
              setSuperData(finds[0].super_tax.super_strategy);
            }
            if (finds[0].super_tax?.tax_planning) {
              setTaxData(finds[0].super_tax.tax_planning);
            }
          }
        }
      } catch (error) {
        console.error('Error loading fact find:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleNext = async () => {
    setSaving(true);
    try {
      const sectionsCompleted = factFind.sections_completed || [];
      if (!sectionsCompleted.includes('super_tax')) {
        sectionsCompleted.push('super_tax');
      }

      await base44.entities.FactFind.update(factFind.id, {
        super_tax: {
          super_strategy: superData,
          tax_planning: taxData
        },
        current_section: 'advice_reason',
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindAdviceReason') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindInsurance') + `?id=${factFind?.id || ''}`);
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="super_tax" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  return (
    <FactFindLayout currentSection="super_tax" factFind={factFind}>
      <FactFindHeader
        title="Super & Tax"
        description="Enter superannuation and tax details. Switch between Client and Partner as needed."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        factFind={factFind}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Owner Selection */}
          <div className="flex items-center justify-between bg-slate-100 border border-slate-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-800 text-sm">Person:</span>
              <div className="flex gap-2">
                {['client', 'partner'].map(owner => (
                  <button
                    key={owner}
                    onClick={() => setActiveOwner(owner)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold border transition-all capitalize",
                      activeOwner === owner
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {owner}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeTab === 'super' ? (
            <Card className="border-slate-200 shadow-sm">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 rounded-t-lg">
                <h4 className="font-bold text-white capitalize">
                  {activeOwner} - Superannuation Details
                </h4>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">
                    How much superannuation guarantee do you receive?
                  </Label>
                  <Select 
                    value={superData[activeOwner].sg_type}
                    onValueChange={(value) => setSuperData({
                      ...superData,
                      [activeOwner]: { ...superData[activeOwner], sg_type: value }
                    })}
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use default SG</SelectItem>
                      <SelectItem value="specify">Specify SG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {superData[activeOwner].sg_type === 'specify' && (
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Specify SG ($)</Label>
                    <Input
                      type="number"
                      value={superData[activeOwner].sg_amount}
                      onChange={(e) => setSuperData({
                        ...superData,
                        [activeOwner]: { ...superData[activeOwner], sg_amount: e.target.value }
                      })}
                      placeholder="0"
                      className="border-slate-300"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">
                    Have you used any amounts against your Transfer Balance Cap?
                  </Label>
                  <Select 
                    value={superData[activeOwner].used_transfer_cap}
                    onValueChange={(value) => setSuperData({
                      ...superData,
                      [activeOwner]: { ...superData[activeOwner], used_transfer_cap: value }
                    })}
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {superData[activeOwner].used_transfer_cap === 'yes' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">
                        Transfer balance cap already used ($)
                      </Label>
                      <Input
                        type="number"
                        value={superData[activeOwner].transfer_cap_used}
                        onChange={(e) => setSuperData({
                          ...superData,
                          [activeOwner]: { ...superData[activeOwner], transfer_cap_used: e.target.value }
                        })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">
                        Current Transfer Balance Cap ($)
                      </Label>
                      <Input
                        type="number"
                        value={superData[activeOwner].current_transfer_cap}
                        onChange={(e) => setSuperData({
                          ...superData,
                          [activeOwner]: { ...superData[activeOwner], current_transfer_cap: e.target.value }
                        })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">
                    Have you triggered the bring forward trigger for NCC?
                  </Label>
                  <Select 
                    value={superData[activeOwner].triggered_bring_forward}
                    onValueChange={(value) => setSuperData({
                      ...superData,
                      [activeOwner]: { ...superData[activeOwner], triggered_bring_forward: value }
                    })}
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {superData[activeOwner].triggered_bring_forward === 'yes' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">
                        Year bring forward was triggered?
                      </Label>
                      <Select 
                        value={superData[activeOwner].bring_forward_year}
                        onValueChange={(value) => setSuperData({
                          ...superData,
                          [activeOwner]: { ...superData[activeOwner], bring_forward_year: value }
                        })}
                      >
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select year..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2023/2024">2023/2024</SelectItem>
                          <SelectItem value="2024/2025">2024/2025</SelectItem>
                          <SelectItem value="2025/2026">2025/2026</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">
                        Amount used against bring forward ($)
                      </Label>
                      <Input
                        type="number"
                        value={superData[activeOwner].bring_forward_amount}
                        onChange={(e) => setSuperData({
                          ...superData,
                          [activeOwner]: { ...superData[activeOwner], bring_forward_amount: e.target.value }
                        })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 shadow-sm">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 rounded-t-lg">
                <h4 className="font-bold text-white capitalize">
                  {activeOwner} - Tax Details
                </h4>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">
                    Pre-existing losses ($)
                  </Label>
                  <Input
                    type="number"
                    value={taxData[activeOwner].pre_existing_losses}
                    onChange={(e) => setTaxData({
                      ...taxData,
                      [activeOwner]: { ...taxData[activeOwner], pre_existing_losses: e.target.value }
                    })}
                    placeholder="0"
                    className="border-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">
                    Pre-existing CGT losses ($)
                  </Label>
                  <Input
                    type="number"
                    value={taxData[activeOwner].pre_existing_cgt_losses}
                    onChange={(e) => setTaxData({
                      ...taxData,
                      [activeOwner]: { ...taxData[activeOwner], pre_existing_cgt_losses: e.target.value }
                    })}
                    placeholder="0"
                    className="border-slate-300"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  disabled={saving}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FactFindLayout>
  );
}