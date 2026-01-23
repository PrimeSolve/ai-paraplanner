import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { ArrowRight, ArrowLeft, MessageSquare, RefreshCw, Info, Plus, Trash2, Edit2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const entityTypes = [
  { id: 'trust', label: 'Trusts', icon: '🏛️' },
  { id: 'company', label: 'Companies', icon: '🏢' },
  { id: 'partnership', label: 'Partnerships', icon: '🤝' }
];

export default function FactFindTrusts() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('trust');
  const [entities, setEntities] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    type: 'trust',
    name: '',
    abn: '',
    tfn: '',
    established_date: '',
    trustee_type: '',
    trustee_name: '',
    beneficiaries: '',
    purpose: '',
    market_value: '',
    income_distribution: '',
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
            if (finds[0].trusts_companies?.entities) {
              setEntities(finds[0].trusts_companies.entities);
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

  const handleAddEntity = () => {
    if (!formData.name) {
      toast.error('Please enter entity name');
      return;
    }

    const entityData = { ...formData, type: activeTab };

    if (editingIndex !== null) {
      const updated = [...entities];
      updated[editingIndex] = entityData;
      setEntities(updated);
      setEditingIndex(null);
    } else {
      setEntities([...entities, entityData]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: activeTab,
      name: '',
      abn: '',
      tfn: '',
      established_date: '',
      trustee_type: '',
      trustee_name: '',
      beneficiaries: '',
      purpose: '',
      market_value: '',
      income_distribution: '',
      notes: ''
    });
  };

  const handleEdit = (index) => {
    setFormData(entities[index]);
    setEditingIndex(index);
    setActiveTab(entities[index].type);
  };

  const handleDelete = (index) => {
    const updated = entities.filter((_, i) => i !== index);
    setEntities(updated);
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      const sectionsCompleted = factFind.sections_completed || [];
      if (!sectionsCompleted.includes('trusts')) {
        sectionsCompleted.push('trusts');
      }

      await base44.entities.FactFind.update(factFind.id, {
        trusts_companies: { entities },
        current_section: 'smsf',
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindSMSF') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindDependants') + `?id=${factFind?.id || ''}`);
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="trusts" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const filteredEntities = entities.filter(e => e.type === activeTab);

  return (
    <FactFindLayout currentSection="trusts" factFind={factFind}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-1">Trusts & Companies</h3>
            <p className="text-sm text-slate-600">
              Add any trusts, companies, or partnerships you own or control.
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

        {/* Tabs */}
        <div className="flex gap-2">
          {entityTypes.map(type => (
            <button
              key={type.id}
              onClick={() => {
                setActiveTab(type.id);
                if (editingIndex === null) {
                  setFormData({ ...formData, type: type.id });
                }
              }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                activeTab === type.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <span>{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Add/Edit Form */}
          <Card className="border-slate-200 shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 rounded-t-lg">
              <h4 className="font-bold text-white">
                {editingIndex !== null ? `Edit ${activeTab === 'trust' ? 'Trust' : activeTab === 'company' ? 'Company' : 'Partnership'}` : `Add a ${activeTab === 'trust' ? 'Trust' : activeTab === 'company' ? 'Company' : 'Partnership'}`}
              </h4>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">
                    {activeTab === 'trust' ? 'Trust name' : activeTab === 'company' ? 'Company name' : 'Partnership name'}
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter name"
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

              {activeTab === 'trust' && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Trustee type</Label>
                      <Select value={formData.trustee_type} onValueChange={(value) => setFormData({ ...formData, trustee_type: value })}>
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Trustee name</Label>
                      <Input
                        value={formData.trustee_name}
                        onChange={(e) => setFormData({ ...formData, trustee_name: e.target.value })}
                        placeholder="Enter trustee name"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Beneficiaries</Label>
                    <Input
                      value={formData.beneficiaries}
                      onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
                      placeholder="Enter beneficiaries (comma separated)"
                      className="border-slate-300"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">Purpose / Business activity</Label>
                <Input
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Describe main purpose or business activity"
                  className="border-slate-300"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Estimated market value ($)</Label>
                  <Input
                    type="number"
                    value={formData.market_value}
                    onChange={(e) => setFormData({ ...formData, market_value: e.target.value })}
                    placeholder="0"
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Annual income/distribution ($)</Label>
                  <Input
                    type="number"
                    value={formData.income_distribution}
                    onChange={(e) => setFormData({ ...formData, income_distribution: e.target.value })}
                    placeholder="0"
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
                  onClick={handleAddEntity}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingIndex !== null ? 'Update' : 'Add'} {activeTab === 'trust' ? 'Trust' : activeTab === 'company' ? 'Company' : 'Partnership'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Empty State or List */}
          {filteredEntities.length === 0 ? (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">
                  No {activeTab === 'trust' ? 'trusts' : activeTab === 'company' ? 'companies' : 'partnerships'} added yet
                </h4>
                <p className="text-sm text-slate-600 mb-4">
                  Add your first {activeTab === 'trust' ? 'trust' : activeTab === 'company' ? 'company' : 'partnership'} using the form above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 shadow-sm">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-3">
                <h4 className="font-bold text-white">
                  Your {activeTab === 'trust' ? 'Trusts' : activeTab === 'company' ? 'Companies' : 'Partnerships'} ({filteredEntities.length})
                </h4>
              </div>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {filteredEntities.map((entity, index) => {
                    const globalIndex = entities.findIndex(e => e === entity);
                    return (
                      <div
                        key={index}
                        className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-slate-800">{entity.name}</span>
                            {entity.abn && (
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold">
                                ABN: {entity.abn}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
                            {entity.purpose && <span><strong>Purpose:</strong> {entity.purpose}</span>}
                            {entity.market_value && <span><strong>Value:</strong> ${parseFloat(entity.market_value).toLocaleString()}</span>}
                            {entity.trustee_name && <span><strong>Trustee:</strong> {entity.trustee_name}</span>}
                            {entity.established_date && <span><strong>Est:</strong> {entity.established_date}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(globalIndex)}
                            className="border-slate-300"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(globalIndex)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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