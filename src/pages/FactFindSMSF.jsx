import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, MessageSquare, RefreshCw, Info, Plus, Trash2, Edit2, Building2 } from 'lucide-react';

export default function FactFindSMSF() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [smsfList, setSmsfList] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    fund_name: '',
    abn: '',
    tfn: '',
    established_date: '',
    trustee_structure: '',
    trustee_name: '',
    members: '',
    total_balance: '',
    investment_strategy: '',
    auditor: '',
    administrator: '',
    bank_account: '',
    notes: ''
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
            if (finds[0].smsf?.smsf_details) {
              setSmsfList(finds[0].smsf.smsf_details);
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

  const handleAddSMSF = () => {
    if (!formData.fund_name) {
      toast.error('Please enter fund name');
      return;
    }

    if (editingIndex !== null) {
      const updated = [...smsfList];
      updated[editingIndex] = formData;
      setSmsfList(updated);
      setEditingIndex(null);
    } else {
      setSmsfList([...smsfList, formData]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      fund_name: '',
      abn: '',
      tfn: '',
      established_date: '',
      trustee_structure: '',
      trustee_name: '',
      members: '',
      total_balance: '',
      investment_strategy: '',
      auditor: '',
      administrator: '',
      bank_account: '',
      notes: ''
    });
  };

  const handleEdit = (index) => {
    setFormData(smsfList[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    const updated = smsfList.filter((_, i) => i !== index);
    setSmsfList(updated);
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      const sectionsCompleted = factFind.sections_completed || [];
      if (!sectionsCompleted.includes('smsf')) {
        sectionsCompleted.push('smsf');
      }

      await base44.entities.FactFind.update(factFind.id, {
        smsf: { smsf_details: smsfList },
        current_section: 'superannuation',
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindSuperannuation') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindTrusts') + `?id=${factFind?.id || ''}`);
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="smsf" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  return (
    <FactFindLayout currentSection="smsf" factFind={factFind}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 mb-1">SMSF</h3>
          <p className="text-sm text-slate-600">
            Add details about your Self-Managed Superannuation Fund(s).
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Info className="w-4 h-4 mr-2" />
            Key Assumptions
          </Button>
          <Button
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/30"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Talk to Assistant
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Add/Edit Form */}
          <Card className="border-slate-200 shadow-sm">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 rounded-t-lg">
              <h4 className="font-bold text-white">
                {editingIndex !== null ? 'Edit SMSF' : 'Add an SMSF'}
              </h4>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Fund name</Label>
                  <Input
                    value={formData.fund_name}
                    onChange={(e) => setFormData({ ...formData, fund_name: e.target.value })}
                    placeholder="Enter fund name"
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">ABN</Label>
                  <Input
                    value={formData.abn}
                    onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                    placeholder="Enter ABN"
                    className="border-slate-300"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">TFN</Label>
                  <Input
                    value={formData.tfn}
                    onChange={(e) => setFormData({ ...formData, tfn: e.target.value })}
                    placeholder="Enter TFN"
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Established date</Label>
                  <Input
                    type="date"
                    value={formData.established_date}
                    onChange={(e) => setFormData({ ...formData, established_date: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Trustee structure</Label>
                  <Select value={formData.trustee_structure} onValueChange={(value) => setFormData({ ...formData, trustee_structure: value })}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual trustees</SelectItem>
                      <SelectItem value="company">Corporate trustee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Trustee name(s)</Label>
                  <Input
                    value={formData.trustee_name}
                    onChange={(e) => setFormData({ ...formData, trustee_name: e.target.value })}
                    placeholder="Enter trustee name(s)"
                    className="border-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">Fund members</Label>
                <Input
                  value={formData.members}
                  onChange={(e) => setFormData({ ...formData, members: e.target.value })}
                  placeholder="Enter member names (comma separated)"
                  className="border-slate-300"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Total fund balance ($)</Label>
                  <Input
                    type="number"
                    value={formData.total_balance}
                    onChange={(e) => setFormData({ ...formData, total_balance: e.target.value })}
                    placeholder="0"
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Investment strategy</Label>
                  <Select value={formData.investment_strategy} onValueChange={(value) => setFormData({ ...formData, investment_strategy: value })}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Auditor</Label>
                  <Input
                    value={formData.auditor}
                    onChange={(e) => setFormData({ ...formData, auditor: e.target.value })}
                    placeholder="Enter auditor name"
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Administrator</Label>
                  <Input
                    value={formData.administrator}
                    onChange={(e) => setFormData({ ...formData, administrator: e.target.value })}
                    placeholder="Enter administrator name"
                    className="border-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">Bank account details</Label>
                <Input
                  value={formData.bank_account}
                  onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                  placeholder="Enter bank and BSB"
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">Additional notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any other relevant information"
                  className="border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {editingIndex !== null && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingIndex(null);
                      resetForm();
                    }}
                    className="border-slate-300"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleAddSMSF}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingIndex !== null ? 'Update SMSF' : 'Add SMSF'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Empty State or List */}
          {smsfList.length === 0 ? (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">
                  No SMSFs added yet
                </h4>
                <p className="text-sm text-slate-600 mb-4">
                  Add your first Self-Managed Superannuation Fund using the form above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 shadow-sm">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-3">
                <h4 className="font-bold text-white">
                  Your SMSFs ({smsfList.length})
                </h4>
              </div>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {smsfList.map((smsf, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-slate-800">{smsf.fund_name}</span>
                          {smsf.abn && (
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-semibold">
                              ABN: {smsf.abn}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
                          {smsf.total_balance && (
                            <span><strong>Balance:</strong> ${parseFloat(smsf.total_balance).toLocaleString()}</span>
                          )}
                          {smsf.members && (
                            <span><strong>Members:</strong> {smsf.members}</span>
                          )}
                          {smsf.trustee_name && (
                            <span><strong>Trustee:</strong> {smsf.trustee_name}</span>
                          )}
                          {smsf.investment_strategy && (
                            <span><strong>Strategy:</strong> {smsf.investment_strategy}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(index)}
                          className="border-slate-300"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(index)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
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