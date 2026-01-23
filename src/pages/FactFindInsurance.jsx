import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, MessageSquare, RefreshCw, Info, Plus, Trash2, Edit2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FactFindInsurance() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    policy_type: '',
    policy_name: '',
    insurer: '',
    policy_number: '',
    insured_person: '',
    owner: '',
    sum_insured: '',
    premium_amount: '',
    premium_frequency: '',
    benefit_period: '',
    waiting_period: '',
    policy_start_date: '',
    policy_expiry_date: '',
    beneficiaries: '',
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
            if (finds[0].insurance?.policies) {
              setPolicies(finds[0].insurance.policies);
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

  const handleAddPolicy = () => {
    if (!formData.policy_name || !formData.policy_type) {
      toast.error('Please enter policy name and type');
      return;
    }

    if (editingIndex !== null) {
      const updated = [...policies];
      updated[editingIndex] = formData;
      setPolicies(updated);
      setEditingIndex(null);
    } else {
      setPolicies([...policies, formData]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      policy_type: '',
      policy_name: '',
      insurer: '',
      policy_number: '',
      insured_person: '',
      owner: '',
      sum_insured: '',
      premium_amount: '',
      premium_frequency: '',
      benefit_period: '',
      waiting_period: '',
      policy_start_date: '',
      policy_expiry_date: '',
      beneficiaries: '',
      notes: ''
    });
  };

  const handleEdit = (index) => {
    setFormData(policies[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    setPolicies(policies.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      const sectionsCompleted = factFind.sections_completed || [];
      if (!sectionsCompleted.includes('insurance')) {
        sectionsCompleted.push('insurance');
      }

      await base44.entities.FactFind.update(factFind.id, {
        insurance: { policies },
        current_section: 'super_tax',
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindSuperTax') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindIncomeExpenses') + `?id=${factFind?.id || ''}`);
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="insurance" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  return (
    <FactFindLayout currentSection="insurance" factFind={factFind}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-1">Insurance policies</h3>
            <p className="text-sm text-slate-600">
              Add your current insurance policies and coverage details.
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
            <Link to={createPageUrl('FactFindAssistant') + (factFind?.id ? `?id=${factFind.id}` : '')}>
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/30"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Talk to Assistant
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Add/Edit Form */}
          <Card className="border-slate-200 shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 rounded-t-lg">
              <h4 className="font-bold text-white">
                {editingIndex !== null ? 'Edit Insurance Policy' : 'Add an Insurance Policy'}
              </h4>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Policy type</Label>
                  <Select value={formData.policy_type} onValueChange={(value) => setFormData({ ...formData, policy_type: value })}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="life">Life insurance</SelectItem>
                      <SelectItem value="tpd">TPD (Total & Permanent Disability)</SelectItem>
                      <SelectItem value="trauma">Trauma/Critical illness</SelectItem>
                      <SelectItem value="income_protection">Income protection</SelectItem>
                      <SelectItem value="health">Health insurance</SelectItem>
                      <SelectItem value="home_contents">Home & contents</SelectItem>
                      <SelectItem value="vehicle">Vehicle insurance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Policy name</Label>
                  <Input
                    value={formData.policy_name}
                    onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
                    placeholder="Enter policy name"
                    className="border-slate-300"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Insurer</Label>
                  <Input
                    value={formData.insurer}
                    onChange={(e) => setFormData({ ...formData, insurer: e.target.value })}
                    placeholder="Enter insurer name"
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Policy number</Label>
                  <Input
                    value={formData.policy_number}
                    onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                    placeholder="Enter policy number"
                    className="border-slate-300"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Insured person</Label>
                  <Input
                    value={formData.insured_person}
                    onChange={(e) => setFormData({ ...formData, insured_person: e.target.value })}
                    placeholder="Enter insured person"
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Policy owner</Label>
                  <Input
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    placeholder="Enter policy owner"
                    className="border-slate-300"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Sum insured ($)</Label>
                  <Input
                    type="number"
                    value={formData.sum_insured}
                    onChange={(e) => setFormData({ ...formData, sum_insured: e.target.value })}
                    placeholder="0"
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Premium amount ($)</Label>
                  <Input
                    type="number"
                    value={formData.premium_amount}
                    onChange={(e) => setFormData({ ...formData, premium_amount: e.target.value })}
                    placeholder="0"
                    className="border-slate-300"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Premium frequency</Label>
                  <Select value={formData.premium_frequency} onValueChange={(value) => setFormData({ ...formData, premium_frequency: value })}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Benefit period</Label>
                  <Input
                    value={formData.benefit_period}
                    onChange={(e) => setFormData({ ...formData, benefit_period: e.target.value })}
                    placeholder="e.g., 2 years, Until age 65"
                    className="border-slate-300"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Waiting period</Label>
                  <Input
                    value={formData.waiting_period}
                    onChange={(e) => setFormData({ ...formData, waiting_period: e.target.value })}
                    placeholder="e.g., 30 days, 90 days"
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Policy start date</Label>
                  <Input
                    type="date"
                    value={formData.policy_start_date}
                    onChange={(e) => setFormData({ ...formData, policy_start_date: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Policy expiry date</Label>
                  <Input
                    type="date"
                    value={formData.policy_expiry_date}
                    onChange={(e) => setFormData({ ...formData, policy_expiry_date: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Beneficiaries</Label>
                  <Input
                    value={formData.beneficiaries}
                    onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
                    placeholder="Enter beneficiaries"
                    className="border-slate-300"
                  />
                </div>
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
                  onClick={handleAddPolicy}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingIndex !== null ? 'Update Policy' : 'Add Policy'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Policies List */}
          {policies.length === 0 ? (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">No insurance policies added yet</h4>
                <p className="text-sm text-slate-600 mb-4">
                  Add your first insurance policy using the form above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 shadow-sm">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-3">
                <h4 className="font-bold text-white">📊 Insurance Policies ({policies.length})</h4>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Policy type</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Policy name</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Insurer</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Insured person</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Sum insured</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Premium</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {policies.map((policy, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-800 capitalize">
                            {policy.policy_type?.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-800 font-medium">{policy.policy_name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{policy.insurer}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{policy.insured_person}</td>
                          <td className="px-4 py-3 text-sm text-slate-800 font-semibold">
                            {policy.sum_insured ? `$${parseFloat(policy.sum_insured).toLocaleString()}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {policy.premium_amount && policy.premium_frequency 
                              ? `$${parseFloat(policy.premium_amount).toLocaleString()} ${policy.premium_frequency}`
                              : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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