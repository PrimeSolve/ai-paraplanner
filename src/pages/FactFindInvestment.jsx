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
import { ArrowRight, ArrowLeft, MessageSquare, RefreshCw, Info, Plus, Trash2, Edit2, TrendingUp, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const investmentTypes = [
  { id: 'wrap', label: 'Wrap / Mastertrust', icon: '📁' },
  { id: 'bond', label: 'Investment bonds', icon: '💎' }
];

export default function FactFindInvestment() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('wrap');
  const [activeOwner, setActiveOwner] = useState('client');
  const [investments, setInvestments] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    type: 'wrap',
    owner: 'client',
    platform_name: '',
    account_number: '',
    platform_type: '',
    current_value: '',
    investment_strategy: '',
    asset_allocation: '',
    adviser_name: '',
    annual_fees: '',
    bond_provider: '',
    bond_type: '',
    investment_amount: '',
    term_years: '',
    annual_contribution: '',
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
            if (finds[0].investment?.investments) {
              setInvestments(finds[0].investment.investments);
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

  const handleAddInvestment = () => {
    if (!formData.platform_name && !formData.bond_provider) {
      toast.error('Please enter required information');
      return;
    }

    const investmentData = { ...formData, type: activeTab, owner: activeOwner };

    if (editingIndex !== null) {
      const updated = [...investments];
      updated[editingIndex] = investmentData;
      setInvestments(updated);
      setEditingIndex(null);
    } else {
      setInvestments([...investments, investmentData]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: activeTab,
      owner: activeOwner,
      platform_name: '',
      account_number: '',
      platform_type: '',
      current_value: '',
      investment_strategy: '',
      asset_allocation: '',
      adviser_name: '',
      annual_fees: '',
      bond_provider: '',
      bond_type: '',
      investment_amount: '',
      term_years: '',
      annual_contribution: '',
      notes: ''
    });
  };

  const handleEdit = (index) => {
    setFormData(investments[index]);
    setEditingIndex(index);
    setActiveTab(investments[index].type);
    setActiveOwner(investments[index].owner);
  };

  const handleDelete = (index) => {
    const updated = investments.filter((_, i) => i !== index);
    setInvestments(updated);
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      const sectionsCompleted = factFind.sections_completed || [];
      if (!sectionsCompleted.includes('investment')) {
        sectionsCompleted.push('investment');
      }

      await base44.entities.FactFind.update(factFind.id, {
        investment: { investments },
        current_section: 'assets_liabilities',
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindAssetsLiabilities') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindSuperannuation') + `?id=${factFind?.id || ''}`);
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="investment" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const filteredInvestments = investments.filter(inv => inv.type === activeTab && inv.owner === activeOwner);

  return (
    <FactFindLayout currentSection="investment" factFind={factFind}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-1">Investments</h3>
            <p className="text-sm text-slate-600">
              Capture Wrap/Mastertrusts and Investment bonds.
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

        {/* Tabs */}
        <div className="flex gap-2">
          {investmentTypes.map(type => (
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
          {/* Owner Bar */}
          <div className="flex items-center justify-between bg-slate-100 border border-slate-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-800 text-sm">Owner:</span>
              <div className="flex gap-2">
                {['client', 'partner', 'joint'].map(owner => (
                  <button
                    key={owner}
                    onClick={() => {
                      setActiveOwner(owner);
                      if (editingIndex === null) {
                        setFormData({ ...formData, owner });
                      }
                    }}
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

          {/* Add/Edit Form */}
          <Card className="border-slate-200 shadow-sm">
            <div className={cn(
              "px-6 py-3 rounded-t-lg",
              activeTab === 'wrap' && "bg-gradient-to-r from-indigo-600 to-blue-600",
              activeTab === 'bond' && "bg-gradient-to-r from-pink-600 to-rose-600"
            )}>
              <h4 className="font-bold text-white">
                {editingIndex !== null ? `Edit ${activeTab === 'wrap' ? 'Wrap/Mastertrust' : 'Investment Bond'}` : `Add a ${activeTab === 'wrap' ? 'Wrap/Mastertrust' : 'Investment Bond'}`}
              </h4>
            </div>
            <CardContent className="p-6 space-y-4">
              {activeTab === 'wrap' && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Platform name</Label>
                      <Input
                        value={formData.platform_name}
                        onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
                        placeholder="Enter platform name"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Account number</Label>
                      <Input
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        placeholder="Enter account number"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Platform type</Label>
                      <Select value={formData.platform_type} onValueChange={(value) => setFormData({ ...formData, platform_type: value })}>
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wrap">Wrap account</SelectItem>
                          <SelectItem value="mastertrust">Mastertrust</SelectItem>
                          <SelectItem value="idps">IDPS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Current value ($)</Label>
                      <Input
                        type="number"
                        value={formData.current_value}
                        onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Investment strategy</Label>
                      <Input
                        value={formData.investment_strategy}
                        onChange={(e) => setFormData({ ...formData, investment_strategy: e.target.value })}
                        placeholder="e.g., Balanced, Growth"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Asset allocation</Label>
                      <Input
                        value={formData.asset_allocation}
                        onChange={(e) => setFormData({ ...formData, asset_allocation: e.target.value })}
                        placeholder="e.g., 60% shares, 40% fixed"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Adviser name</Label>
                      <Input
                        value={formData.adviser_name}
                        onChange={(e) => setFormData({ ...formData, adviser_name: e.target.value })}
                        placeholder="Enter adviser name"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Annual fees ($)</Label>
                      <Input
                        type="number"
                        value={formData.annual_fees}
                        onChange={(e) => setFormData({ ...formData, annual_fees: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'bond' && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Bond provider</Label>
                      <Input
                        value={formData.bond_provider}
                        onChange={(e) => setFormData({ ...formData, bond_provider: e.target.value })}
                        placeholder="Enter provider name"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Bond type</Label>
                      <Select value={formData.bond_type} onValueChange={(value) => setFormData({ ...formData, bond_type: value })}>
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="investment">Investment bond</SelectItem>
                          <SelectItem value="insurance">Insurance bond</SelectItem>
                          <SelectItem value="education">Education bond</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Investment amount ($)</Label>
                      <Input
                        type="number"
                        value={formData.investment_amount}
                        onChange={(e) => setFormData({ ...formData, investment_amount: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Current value ($)</Label>
                      <Input
                        type="number"
                        value={formData.current_value}
                        onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Term (years)</Label>
                      <Input
                        type="number"
                        value={formData.term_years}
                        onChange={(e) => setFormData({ ...formData, term_years: e.target.value })}
                        placeholder="e.g., 10"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Annual contribution ($)</Label>
                      <Input
                        type="number"
                        value={formData.annual_contribution}
                        onChange={(e) => setFormData({ ...formData, annual_contribution: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                  </div>
                </>
              )}

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
                  onClick={handleAddInvestment}
                  className={cn(
                    "text-white",
                    activeTab === 'wrap' && "bg-indigo-600 hover:bg-indigo-700",
                    activeTab === 'bond' && "bg-pink-600 hover:bg-pink-700"
                  )}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingIndex !== null ? 'Update' : 'Add'} {activeTab === 'wrap' ? 'Wrap/Mastertrust' : 'Investment Bond'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Empty State or List */}
          {filteredInvestments.length === 0 ? (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                  activeTab === 'wrap' && "bg-indigo-100",
                  activeTab === 'bond' && "bg-pink-100"
                )}>
                  {activeTab === 'wrap' ? (
                    <TrendingUp className={cn("w-8 h-8", "text-indigo-600")} />
                  ) : (
                    <PieChart className={cn("w-8 h-8", "text-pink-600")} />
                  )}
                </div>
                <h4 className="font-bold text-slate-800 mb-2">
                  No {activeTab === 'wrap' ? 'Wrap/Mastertrust accounts' : 'investment bonds'} added yet
                </h4>
                <p className="text-sm text-slate-600 mb-4">
                  Add your first {activeTab === 'wrap' ? 'wrap account' : 'investment bond'} using the form above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 shadow-sm">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-3">
                <h4 className="font-bold text-white capitalize">
                  {activeOwner}'s {activeTab === 'wrap' ? 'Wrap/Mastertrust' : 'Investment Bonds'} ({filteredInvestments.length})
                </h4>
              </div>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {filteredInvestments.map((investment, index) => {
                    const globalIndex = investments.findIndex(inv => inv === investment);
                    return (
                      <div
                        key={index}
                        className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-slate-800">
                              {investment.platform_name || investment.bond_provider}
                            </span>
                            {investment.current_value && (
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-semibold",
                                activeTab === 'wrap' && "bg-indigo-100 text-indigo-700",
                                activeTab === 'bond' && "bg-pink-100 text-pink-700"
                              )}>
                                ${parseFloat(investment.current_value).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
                            {investment.account_number && <span><strong>Account:</strong> {investment.account_number}</span>}
                            {investment.platform_type && <span><strong>Type:</strong> {investment.platform_type}</span>}
                            {investment.investment_strategy && <span><strong>Strategy:</strong> {investment.investment_strategy}</span>}
                            {investment.annual_fees && <span><strong>Fees:</strong> ${parseFloat(investment.annual_fees).toLocaleString()}</span>}
                            {investment.bond_type && <span><strong>Type:</strong> {investment.bond_type}</span>}
                            {investment.term_years && <span><strong>Term:</strong> {investment.term_years} years</span>}
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