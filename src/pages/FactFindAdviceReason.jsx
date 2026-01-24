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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, MessageSquare, RefreshCw, Info, Plus, Trash2, Edit2, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'reasons', label: 'Reasons', icon: '📋' },
  { id: 'objectives', label: 'Objectives', icon: '🎯' }
];

const adviceReasons = [
  { id: 'retirement', label: 'Retirement', icon: '🎯' },
  { id: 'estate', label: 'Estate', icon: '🏛️' },
  { id: 'wealth_protection', label: 'Wealth Protection', icon: '🛡️' },
  { id: 'financial_products', label: 'Financial Products', icon: '💼' },
  { id: 'detailed_objectives', label: 'Detailed Objectives', icon: '📊' }
];

export default function FactFindAdviceReason() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('reasons');
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [activeOwner, setActiveOwner] = useState('client');

  const [retirementData, setRetirementData] = useState({
    client: {
      desired_retirement_age: '',
      retirement_age_importance: '',
      desired_retirement_income: '',
      retirement_income_importance: ''
    },
    partner: {
      desired_retirement_age: '',
      retirement_age_importance: '',
      desired_retirement_income: '',
      retirement_income_importance: ''
    }
  });

  const [estateData, setEstateData] = useState({
    client: {
      bequeath_amount: '',
      bequeath_importance: '',
      funeral_bond: 'no',
      funeral_bond_amount: '',
      funeral_bond_importance: ''
    },
    partner: {
      bequeath_amount: '',
      bequeath_importance: '',
      funeral_bond: 'no',
      funeral_bond_amount: '',
      funeral_bond_importance: ''
    }
  });

  const wealthProtectionOptions = [
    'Provide for your family in the event of your death',
    'Protect yourself and your family in the event of Total & Permanent Disablement',
    'Protect yourself and your family in the event of temporary illness',
    'Protect your family against unforseen medical costs arising from a specific illness',
    'Protect your assets against creditors',
    "Guarantee that a portion of your assets can't lose money"
  ];

  const [wealthProtectionData, setWealthProtectionData] = useState({
    client: {
      protections: [],
      importance: ''
    },
    partner: {
      protections: [],
      importance: ''
    }
  });

  const superannuationFeatures = [
    'Access to a low cost product',
    'Access to a product that offers low cost investment options',
    'Access to top performing investment managers',
    'Access to term deposits',
    'Access to direct shares - Australian',
    'Access to direct shares - International',
    'Access to broad investment menu',
    'Access to socially responsible investments',
    'Access to model portfolios',
    'Access to lifecycle investment strategy',
    'Automatic rebalancing back to your preferred risk profile',
    'Able to make tax effective contributions to the product',
    'Ability to make regular investment switches',
    'Up to date portfolio information is available',
    'Ability to manage tax effectiveness of investment strategy',
    'Access to low cost insurance',
    'Access to insurance features consistent with my requirements'
  ];

  const [superannuationData, setSuperannuationData] = useState({
    client: {
      features: [],
      importance: ''
    },
    partner: {
      features: [],
      importance: ''
    }
  });

  const [objectives, setObjectives] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [objectiveForm, setObjectiveForm] = useState({
    objective_type: '',
    start_year: '',
    end_year: '',
    amount: '',
    importance: ''
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
            if (finds[0].advice_reason) {
              const data = finds[0].advice_reason;
              if (data.selected_reasons) setSelectedReasons(data.selected_reasons);
              if (data.retirement) setRetirementData(data.retirement);
              if (data.estate) setEstateData(data.estate);
              if (data.wealth_protection) setWealthProtectionData(data.wealth_protection);
              if (data.superannuation) setSuperannuationData(data.superannuation);
              if (data.objectives) setObjectives(data.objectives);
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

  const toggleReason = (reasonId) => {
    setSelectedReasons(prev =>
      prev.includes(reasonId)
        ? prev.filter(id => id !== reasonId)
        : [...prev, reasonId]
    );
  };

  const handleAddObjective = () => {
    if (!objectiveForm.objective_type || !objectiveForm.amount) {
      toast.error('Please enter objective type and amount');
      return;
    }

    if (editingIndex !== null) {
      const updated = [...objectives];
      updated[editingIndex] = objectiveForm;
      setObjectives(updated);
      setEditingIndex(null);
    } else {
      setObjectives([...objectives, objectiveForm]);
    }

    resetObjectiveForm();
  };

  const resetObjectiveForm = () => {
    setObjectiveForm({
      objective_type: '',
      start_year: '',
      end_year: '',
      amount: '',
      importance: ''
    });
  };

  const handleEditObjective = (index) => {
    setObjectiveForm(objectives[index]);
    setEditingIndex(index);
  };

  const handleDeleteObjective = (index) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      const sectionsCompleted = factFind.sections_completed || [];
      if (!sectionsCompleted.includes('advice_reason')) {
        sectionsCompleted.push('advice_reason');
      }

      await base44.entities.FactFind.update(factFind.id, {
        advice_reason: {
          selected_reasons: selectedReasons,
          retirement: retirementData,
          estate: estateData,
          wealth_protection: wealthProtectionData,
          superannuation: superannuationData,
          objectives
        },
        current_section: 'risk_profile',
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindRiskProfile') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindSuperTax') + `?id=${factFind?.id || ''}`);
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="advice_reason" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  return (
    <FactFindLayout currentSection="advice_reason" factFind={factFind}>
      <FactFindHeader
        title="Reason for seeking advice"
        description="Select the areas you want help with, and record your objectives."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        factFind={factFind}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="w-full space-y-4">
          {activeTab === 'reasons' ? (
            <>
              {/* Reason Selection */}
              <Card className="border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 rounded-t-lg">
                  <h4 className="font-bold text-white">📋 Specify your reasons for seeking advice</h4>
                </div>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-3">
                    {adviceReasons.map(reason => (
                      <button
                        key={reason.id}
                        onClick={() => toggleReason(reason.id)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left",
                          selectedReasons.includes(reason.id)
                            ? "bg-blue-50 border-blue-600 shadow-md"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <span className="text-2xl">{reason.icon}</span>
                        <span className="font-bold text-slate-800">{reason.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Retirement Objectives */}
              {selectedReasons.includes('retirement') && (
                <Card className="border-slate-200 shadow-sm">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-t-lg">
                    <h4 className="font-bold text-white">🎯 Retirement objectives</h4>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-bold text-slate-800 text-sm">Select person:</span>
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

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Desired retirement age</Label>
                        <Input
                          type="number"
                          value={retirementData[activeOwner].desired_retirement_age}
                          onChange={(e) => setRetirementData({
                            ...retirementData,
                            [activeOwner]: { ...retirementData[activeOwner], desired_retirement_age: e.target.value }
                          })}
                          placeholder="Age"
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">How important is achieving this goal</Label>
                        <Select
                          value={retirementData[activeOwner].retirement_age_importance}
                          onValueChange={(value) => setRetirementData({
                            ...retirementData,
                            [activeOwner]: { ...retirementData[activeOwner], retirement_age_importance: value }
                          })}
                        >
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_important">Not important</SelectItem>
                            <SelectItem value="important">Important</SelectItem>
                            <SelectItem value="very_important">Very important</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Desired income in retirement ($)</Label>
                        <Input
                          type="number"
                          value={retirementData[activeOwner].desired_retirement_income}
                          onChange={(e) => setRetirementData({
                            ...retirementData,
                            [activeOwner]: { ...retirementData[activeOwner], desired_retirement_income: e.target.value }
                          })}
                          placeholder="0"
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Desired income in retirement (Rank)</Label>
                        <Select
                          value={retirementData[activeOwner].retirement_income_importance}
                          onValueChange={(value) => setRetirementData({
                            ...retirementData,
                            [activeOwner]: { ...retirementData[activeOwner], retirement_income_importance: value }
                          })}
                        >
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_important">Not important</SelectItem>
                            <SelectItem value="important">Important</SelectItem>
                            <SelectItem value="very_important">Very important</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Estate Objectives */}
              {selectedReasons.includes('estate') && (
                <Card className="border-slate-200 shadow-sm">
                  <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 rounded-t-lg">
                    <h4 className="font-bold text-white">🏛️ Estate objectives</h4>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-bold text-slate-800 text-sm">Select person:</span>
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

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">
                          How much would you like to bequeath to your estate? ($)
                        </Label>
                        <Input
                          type="number"
                          value={estateData[activeOwner].bequeath_amount}
                          onChange={(e) => setEstateData({
                            ...estateData,
                            [activeOwner]: { ...estateData[activeOwner], bequeath_amount: e.target.value }
                          })}
                          placeholder="0"
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">
                          How important is it to meet this objective?
                        </Label>
                        <Select
                          value={estateData[activeOwner].bequeath_importance}
                          onValueChange={(value) => setEstateData({
                            ...estateData,
                            [activeOwner]: { ...estateData[activeOwner], bequeath_importance: value }
                          })}
                        >
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_important">Not important</SelectItem>
                            <SelectItem value="important">Important</SelectItem>
                            <SelectItem value="very_important">Very important</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">
                          Do you wish to purchase a funeral bond?
                        </Label>
                        <Select
                          value={estateData[activeOwner].funeral_bond}
                          onValueChange={(value) => setEstateData({
                            ...estateData,
                            [activeOwner]: { ...estateData[activeOwner], funeral_bond: value }
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
                      {estateData[activeOwner].funeral_bond === 'yes' && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-semibold text-sm">Funeral bond amount ($)</Label>
                            <Input
                              type="number"
                              value={estateData[activeOwner].funeral_bond_amount}
                              onChange={(e) => setEstateData({
                                ...estateData,
                                [activeOwner]: { ...estateData[activeOwner], funeral_bond_amount: e.target.value }
                              })}
                              placeholder="0"
                              className="border-slate-300"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-semibold text-sm">
                              How important is achieving this objective?
                            </Label>
                            <Select
                              value={estateData[activeOwner].funeral_bond_importance}
                              onValueChange={(value) => setEstateData({
                                ...estateData,
                                [activeOwner]: { ...estateData[activeOwner], funeral_bond_importance: value }
                              })}
                            >
                              <SelectTrigger className="border-slate-300">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not_important">Not important</SelectItem>
                                <SelectItem value="important">Important</SelectItem>
                                <SelectItem value="very_important">Very important</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Wealth Protection Objectives */}
              {selectedReasons.includes('wealth_protection') && (
                <Card className="border-slate-200 shadow-sm">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 rounded-t-lg">
                    <h4 className="font-bold text-white">🛡️ Wealth protection objectives</h4>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-bold text-slate-800 text-sm">Select person:</span>
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

                    <div className="space-y-3">
                      <Label className="text-slate-700 font-semibold text-sm">
                        Specify what insurance you want to protect your family against:
                      </Label>
                      {wealthProtectionOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Checkbox
                            checked={wealthProtectionData[activeOwner].protections.includes(option)}
                            onCheckedChange={(checked) => {
                              const protections = checked
                                ? [...wealthProtectionData[activeOwner].protections, option]
                                : wealthProtectionData[activeOwner].protections.filter(p => p !== option);
                              setWealthProtectionData({
                                ...wealthProtectionData,
                                [activeOwner]: { ...wealthProtectionData[activeOwner], protections }
                              });
                            }}
                          />
                          <span className="text-sm text-slate-700">{option}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">
                        Specify how important providing protection is:
                      </Label>
                      <Select
                        value={wealthProtectionData[activeOwner].importance}
                        onValueChange={(value) => setWealthProtectionData({
                          ...wealthProtectionData,
                          [activeOwner]: { ...wealthProtectionData[activeOwner], importance: value }
                        })}
                      >
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_important">Not important</SelectItem>
                          <SelectItem value="important">Important</SelectItem>
                          <SelectItem value="very_important">Very important</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Financial Products - Superannuation */}
              {selectedReasons.includes('financial_products') && (
                <Card className="border-slate-200 shadow-sm">
                  <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 rounded-t-lg">
                    <h4 className="font-bold text-white">💼 Financial products - Superannuation</h4>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-bold text-slate-800 text-sm">Select person:</span>
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

                    <div className="space-y-3">
                      <Label className="text-slate-700 font-semibold text-sm">
                        Select superannuation features that are important:
                      </Label>
                      <div className="grid md:grid-cols-2 gap-3">
                        {superannuationFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Checkbox
                              checked={superannuationData[activeOwner].features.includes(feature)}
                              onCheckedChange={(checked) => {
                                const features = checked
                                  ? [...superannuationData[activeOwner].features, feature]
                                  : superannuationData[activeOwner].features.filter(f => f !== feature);
                                setSuperannuationData({
                                  ...superannuationData,
                                  [activeOwner]: { ...superannuationData[activeOwner], features }
                                });
                              }}
                            />
                            <span className="text-sm text-slate-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">
                        How important is it for you to find a superannuation account that is consistent with your objectives?
                      </Label>
                      <Select
                        value={superannuationData[activeOwner].importance}
                        onValueChange={(value) => setSuperannuationData({
                          ...superannuationData,
                          [activeOwner]: { ...superannuationData[activeOwner], importance: value }
                        })}
                      >
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_important">Not important</SelectItem>
                          <SelectItem value="important">Important</SelectItem>
                          <SelectItem value="very_important">Very important</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <>
              {/* Detailed Objectives Form */}
              <Card className="border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 rounded-t-lg">
                  <h4 className="font-bold text-white">
                    {editingIndex !== null ? 'Edit Objective' : 'Add New Objective'}
                  </h4>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Objective type</Label>
                      <Input
                        value={objectiveForm.objective_type}
                        onChange={(e) => setObjectiveForm({ ...objectiveForm, objective_type: e.target.value })}
                        placeholder="e.g., Buy a house, Travel, Education"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Amount ($)</Label>
                      <Input
                        type="number"
                        value={objectiveForm.amount}
                        onChange={(e) => setObjectiveForm({ ...objectiveForm, amount: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Start year</Label>
                      <Input
                        type="number"
                        value={objectiveForm.start_year}
                        onChange={(e) => setObjectiveForm({ ...objectiveForm, start_year: e.target.value })}
                        placeholder="e.g., 2024"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">End year</Label>
                      <Input
                        type="number"
                        value={objectiveForm.end_year}
                        onChange={(e) => setObjectiveForm({ ...objectiveForm, end_year: e.target.value })}
                        placeholder="e.g., 2030"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Importance</Label>
                      <Select
                        value={objectiveForm.importance}
                        onValueChange={(value) => setObjectiveForm({ ...objectiveForm, importance: value })}
                      >
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_important">Not important</SelectItem>
                          <SelectItem value="important">Important</SelectItem>
                          <SelectItem value="very_important">Very important</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    {editingIndex !== null && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingIndex(null);
                          resetObjectiveForm();
                        }}
                        className="border-slate-300"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      onClick={handleAddObjective}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {editingIndex !== null ? 'Update Objective' : 'Add Objective'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Objectives List */}
              {objectives.length === 0 ? (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-2">No objectives added yet</h4>
                    <p className="text-sm text-slate-600 mb-4">
                      Start by adding your first financial objective to track your goals
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-slate-200 shadow-sm">
                  <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-3">
                    <h4 className="font-bold text-white">Your objectives ({objectives.length})</h4>
                  </div>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Objective type</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Start year</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">End year</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Importance</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {objectives.map((obj, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm text-slate-800 font-medium">{obj.objective_type}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{obj.start_year}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{obj.end_year}</td>
                              <td className="px-4 py-3 text-sm text-slate-800 font-semibold">
                                ${parseFloat(obj.amount).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600 capitalize">
                                {obj.importance?.replace('_', ' ')}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditObjective(index)}
                                    className="border-slate-300"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteObjective(index)}
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
            </>
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