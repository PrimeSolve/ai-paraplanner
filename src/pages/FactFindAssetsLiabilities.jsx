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
import { ArrowRight, ArrowLeft, MessageSquare, RefreshCw, Info, Plus, Trash2, Edit2, Home, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'assets', label: 'Assets', icon: '💰' },
  { id: 'liabilities', label: 'Liabilities', icon: '📋' }
];

export default function FactFindAssetsLiabilities() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('assets');
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [assetFormData, setAssetFormData] = useState({
    asset_name: '',
    asset_type: '',
    ownership_type: '',
    owner: '',
    current_value: '',
    purchase_price: '',
    purchase_date: '',
    address: '',
    notes: ''
  });
  const [liabilityFormData, setLiabilityFormData] = useState({
    debt_name: '',
    debt_type: '',
    ownership_type: '',
    owner: '',
    lender: '',
    current_balance: '',
    original_amount: '',
    interest_rate: '',
    repayment_amount: '',
    repayment_frequency: '',
    loan_term: '',
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
            if (finds[0].assets_liabilities?.assets) {
              setAssets(finds[0].assets_liabilities.assets);
            }
            if (finds[0].assets_liabilities?.liabilities) {
              setLiabilities(finds[0].assets_liabilities.liabilities);
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

  const handleAddAsset = () => {
    if (!assetFormData.asset_name) {
      toast.error('Please enter asset name');
      return;
    }

    if (editingIndex !== null) {
      const updated = [...assets];
      updated[editingIndex] = assetFormData;
      setAssets(updated);
      setEditingIndex(null);
    } else {
      setAssets([...assets, assetFormData]);
    }

    resetAssetForm();
  };

  const handleAddLiability = () => {
    if (!liabilityFormData.debt_name) {
      toast.error('Please enter debt name');
      return;
    }

    if (editingIndex !== null) {
      const updated = [...liabilities];
      updated[editingIndex] = liabilityFormData;
      setLiabilities(updated);
      setEditingIndex(null);
    } else {
      setLiabilities([...liabilities, liabilityFormData]);
    }

    resetLiabilityForm();
  };

  const resetAssetForm = () => {
    setAssetFormData({
      asset_name: '',
      asset_type: '',
      ownership_type: '',
      owner: '',
      current_value: '',
      purchase_price: '',
      purchase_date: '',
      address: '',
      notes: ''
    });
  };

  const resetLiabilityForm = () => {
    setLiabilityFormData({
      debt_name: '',
      debt_type: '',
      ownership_type: '',
      owner: '',
      lender: '',
      current_balance: '',
      original_amount: '',
      interest_rate: '',
      repayment_amount: '',
      repayment_frequency: '',
      loan_term: '',
      notes: ''
    });
  };

  const handleEditAsset = (index) => {
    setAssetFormData(assets[index]);
    setEditingIndex(index);
  };

  const handleDeleteAsset = (index) => {
    setAssets(assets.filter((_, i) => i !== index));
  };

  const handleEditLiability = (index) => {
    setLiabilityFormData(liabilities[index]);
    setEditingIndex(index);
  };

  const handleDeleteLiability = (index) => {
    setLiabilities(liabilities.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      const sectionsCompleted = factFind.sections_completed || [];
      if (!sectionsCompleted.includes('assets_liabilities')) {
        sectionsCompleted.push('assets_liabilities');
      }

      await base44.entities.FactFind.update(factFind.id, {
        assets_liabilities: { assets, liabilities },
        current_section: 'income_expenses',
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindIncomeExpenses') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindInvestment') + `?id=${factFind?.id || ''}`);
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="assets_liabilities" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setEditingIndex(null);
  };

  return (
    <FactFindLayout currentSection="assets_liabilities" factFind={factFind}>
      <FactFindHeader
        title="Assets & Liabilities"
        description="Add your assets and debts. Use the summary to select an item; edit its full details below."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        factFind={factFind}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-4">
          {activeTab === 'assets' ? (
            <>
              {/* Asset Form */}
              <Card className="border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3 rounded-t-lg">
                  <h4 className="font-bold text-white">
                    {editingIndex !== null ? 'Edit Asset' : 'Add an Asset'}
                  </h4>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Asset name</Label>
                      <Input
                        value={assetFormData.asset_name}
                        onChange={(e) => setAssetFormData({ ...assetFormData, asset_name: e.target.value })}
                        placeholder="Enter asset name"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Asset type</Label>
                      <Select value={assetFormData.asset_type} onValueChange={(value) => setAssetFormData({ ...assetFormData, asset_type: value })}>
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="property">Property</SelectItem>
                          <SelectItem value="vehicle">Vehicle</SelectItem>
                          <SelectItem value="cash">Cash/Savings</SelectItem>
                          <SelectItem value="shares">Shares</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Ownership type</Label>
                      <Select value={assetFormData.ownership_type} onValueChange={(value) => setAssetFormData({ ...assetFormData, ownership_type: value })}>
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="joint">Joint</SelectItem>
                          <SelectItem value="trust">Trust</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Owner</Label>
                      <Input
                        value={assetFormData.owner}
                        onChange={(e) => setAssetFormData({ ...assetFormData, owner: e.target.value })}
                        placeholder="Enter owner name"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Current value ($)</Label>
                      <Input
                        type="number"
                        value={assetFormData.current_value}
                        onChange={(e) => setAssetFormData({ ...assetFormData, current_value: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Purchase price ($)</Label>
                      <Input
                        type="number"
                        value={assetFormData.purchase_price}
                        onChange={(e) => setAssetFormData({ ...assetFormData, purchase_price: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Purchase date</Label>
                      <Input
                        type="date"
                        value={assetFormData.purchase_date}
                        onChange={(e) => setAssetFormData({ ...assetFormData, purchase_date: e.target.value })}
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Address (if property)</Label>
                      <Input
                        value={assetFormData.address}
                        onChange={(e) => setAssetFormData({ ...assetFormData, address: e.target.value })}
                        placeholder="Enter address"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Additional notes</Label>
                    <Input
                      value={assetFormData.notes}
                      onChange={(e) => setAssetFormData({ ...assetFormData, notes: e.target.value })}
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
                          resetAssetForm();
                        }}
                        className="border-slate-300"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      onClick={handleAddAsset}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {editingIndex !== null ? 'Update Asset' : 'Add Asset'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Assets Summary */}
              {assets.length === 0 ? (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <Home className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-2">No assets added yet</h4>
                    <p className="text-sm text-slate-600 mb-4">
                      Add your first asset using the form above.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-slate-200 shadow-sm">
                  <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-3">
                    <h4 className="font-bold text-white">📊 Assets Summary ({assets.length})</h4>
                  </div>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Asset name</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Ownership type</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Owner</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Current value</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {assets.map((asset, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm text-slate-800 font-medium">{asset.asset_name}</td>
                              <td className="px-4 py-3 text-sm text-slate-600 capitalize">{asset.ownership_type}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{asset.owner}</td>
                              <td className="px-4 py-3 text-sm text-slate-800 font-semibold">
                                {asset.current_value ? `$${parseFloat(asset.current_value).toLocaleString()}` : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditAsset(index)}
                                    className="border-slate-300"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteAsset(index)}
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
          ) : (
            <>
              {/* Liability Form */}
              <Card className="border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3 rounded-t-lg">
                  <h4 className="font-bold text-white">
                    {editingIndex !== null ? 'Edit Liability' : 'Add a Liability'}
                  </h4>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Debt name</Label>
                      <Input
                        value={liabilityFormData.debt_name}
                        onChange={(e) => setLiabilityFormData({ ...liabilityFormData, debt_name: e.target.value })}
                        placeholder="Enter debt name"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Debt type</Label>
                      <Select value={liabilityFormData.debt_type} onValueChange={(value) => setLiabilityFormData({ ...liabilityFormData, debt_type: value })}>
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home_loan">Home loan</SelectItem>
                          <SelectItem value="investment_loan">Investment loan</SelectItem>
                          <SelectItem value="personal_loan">Personal loan</SelectItem>
                          <SelectItem value="credit_card">Credit card</SelectItem>
                          <SelectItem value="car_loan">Car loan</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Ownership type</Label>
                      <Select value={liabilityFormData.ownership_type} onValueChange={(value) => setLiabilityFormData({ ...liabilityFormData, ownership_type: value })}>
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="joint">Joint</SelectItem>
                          <SelectItem value="trust">Trust</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Owner</Label>
                      <Input
                        value={liabilityFormData.owner}
                        onChange={(e) => setLiabilityFormData({ ...liabilityFormData, owner: e.target.value })}
                        placeholder="Enter owner name"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Lender</Label>
                      <Input
                        value={liabilityFormData.lender}
                        onChange={(e) => setLiabilityFormData({ ...liabilityFormData, lender: e.target.value })}
                        placeholder="Enter lender name"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Current balance ($)</Label>
                      <Input
                        type="number"
                        value={liabilityFormData.current_balance}
                        onChange={(e) => setLiabilityFormData({ ...liabilityFormData, current_balance: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Original amount ($)</Label>
                      <Input
                        type="number"
                        value={liabilityFormData.original_amount}
                        onChange={(e) => setLiabilityFormData({ ...liabilityFormData, original_amount: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Interest rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={liabilityFormData.interest_rate}
                        onChange={(e) => setLiabilityFormData({ ...liabilityFormData, interest_rate: e.target.value })}
                        placeholder="0.00"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Repayment amount ($)</Label>
                      <Input
                        type="number"
                        value={liabilityFormData.repayment_amount}
                        onChange={(e) => setLiabilityFormData({ ...liabilityFormData, repayment_amount: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Repayment frequency</Label>
                      <Select value={liabilityFormData.repayment_frequency} onValueChange={(value) => setLiabilityFormData({ ...liabilityFormData, repayment_frequency: value })}>
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="fortnightly">Fortnightly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Loan term (years)</Label>
                    <Input
                      type="number"
                      value={liabilityFormData.loan_term}
                      onChange={(e) => setLiabilityFormData({ ...liabilityFormData, loan_term: e.target.value })}
                      placeholder="e.g., 30"
                      className="border-slate-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Additional notes</Label>
                    <Input
                      value={liabilityFormData.notes}
                      onChange={(e) => setLiabilityFormData({ ...liabilityFormData, notes: e.target.value })}
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
                          resetLiabilityForm();
                        }}
                        className="border-slate-300"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      onClick={handleAddLiability}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {editingIndex !== null ? 'Update Liability' : 'Add Liability'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Liabilities Summary */}
              {liabilities.length === 0 ? (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-red-600" />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-2">No liabilities added yet</h4>
                    <p className="text-sm text-slate-600 mb-4">
                      Add your first liability using the form above.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-slate-200 shadow-sm">
                  <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-3">
                    <h4 className="font-bold text-white">📊 Liabilities Summary ({liabilities.length})</h4>
                  </div>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Debt name</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Ownership type</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Owner</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Debt type</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Current value</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Repayments</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {liabilities.map((liability, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm text-slate-800 font-medium">{liability.debt_name}</td>
                              <td className="px-4 py-3 text-sm text-slate-600 capitalize">{liability.ownership_type}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{liability.owner}</td>
                              <td className="px-4 py-3 text-sm text-slate-600 capitalize">{liability.debt_type?.replace('_', ' ')}</td>
                              <td className="px-4 py-3 text-sm text-slate-800 font-semibold">
                                {liability.current_balance ? `$${parseFloat(liability.current_balance).toLocaleString()}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {liability.repayment_amount && liability.repayment_frequency 
                                  ? `$${parseFloat(liability.repayment_amount).toLocaleString()} ${liability.repayment_frequency}`
                                  : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditLiability(index)}
                                    className="border-slate-300"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteLiability(index)}
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