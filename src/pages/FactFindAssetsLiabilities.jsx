import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Edit2, Trash2 } from 'lucide-react';

export default function FactFindAssetsLiabilities() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState('assets');
  const [assetsList, setAssetsList] = useState([]);
  const [debtsList, setDebtsList] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  // Form states
  const [assetForm, setAssetForm] = useState({
    a_name: '', a_ownType: '', a_owner: '', a_type: '',
    a_value: '', a_purchase_price: '', a_purchase_date: '',
    a_rental_income: '', a_rental_freq: ''
  });

  const [debtForm, setDebtForm] = useState({
    d_name: '', d_ownType: '', d_owner: '', d_type: '', d_rate: '',
    d_freq: '', d_repayments: '', d_term: '', d_balance: '',
    d_io: '', d_fixed: '', d_redraw: '', d_security: []
  });

  const getOwnerOptions = useCallback(() => {
    if (!factFind) return [];
    const opts = [];

    // Principals
    const clientName = factFind?.personal?.client?.first_name
      ? `${factFind.personal.client.first_name} ${factFind.personal.client.last_name}`.trim()
      : null;
    const partnerName = factFind?.personal?.partner?.first_name
      ? `${factFind.personal.partner.first_name} ${factFind.personal.partner.last_name}`.trim()
      : null;

    if (clientName) opts.push({ label: clientName, value: 'client' });
    if (partnerName) opts.push({ label: partnerName, value: 'partner' });

    // Children
    (factFind?.dependants?.children || []).forEach((child, i) => {
      opts.push({ label: child.child_name || `Child ${i + 1}`, value: `child-${i}` });
    });

    // Other dependants
    (factFind?.dependants?.dependants_list || []).forEach((dep, i) => {
      opts.push({ label: dep.dep_name || `Dependant ${i + 1}`, value: `dependent-${i}` });
    });

    // Trusts
    (factFind?.trusts_companies?.entities || [])
      .filter(e => e.entity_type === 'trust')
      .forEach((trust, i) => {
        opts.push({ label: trust.entity_name || `Trust ${i + 1}`, value: `trust-${i}` });
      });

    // Companies
    (factFind?.trusts_companies?.entities || [])
      .filter(e => e.entity_type === 'company')
      .forEach((company, i) => {
        opts.push({ label: company.entity_name || `Company ${i + 1}`, value: `company-${i}` });
      });

    // SMSFs
    (factFind?.smsf?.funds || []).forEach((smsf, i) => {
      opts.push({ label: smsf.smsf_name || `SMSF ${i + 1}`, value: `smsf-${i}` });
    });

    return opts;
  }, [factFind]);

  const getOwnerLabel = useCallback((ownerValue) => {
    const opts = getOwnerOptions();
    return opts.find(o => o.value === ownerValue)?.label || ownerValue;
  }, [getOwnerOptions]);

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');

      if (id) {
        const finds = await base44.entities.FactFind.filter({ id });
        if (finds[0]) {
          setFactFind(finds[0]);
          if (finds[0].assets?.assetsList) {
            setAssetsList(finds[0].assets.assetsList);
          }
          if (finds[0].assets?.debtsList) {
            setDebtsList(finds[0].assets.debtsList);
          }
        }
      }
    } catch (error) {
      console.error('Error loading fact find:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const resetAssetForm = useCallback(() => {
    setAssetForm({
      a_name: '', a_ownType: '', a_owner: '', a_type: '',
      a_value: '', a_purchase_price: '', a_purchase_date: '',
      a_rental_income: '', a_rental_freq: ''
    });
    setEditingIndex(null);
  }, []);

  const resetDebtForm = useCallback(() => {
    setDebtForm({
      d_name: '', d_ownType: '', d_owner: '', d_type: '', d_rate: '',
      d_freq: '', d_repayments: '', d_term: '', d_balance: '',
      d_io: '', d_fixed: '', d_redraw: '', d_security: []
    });
    setEditingIndex(null);
  }, []);

  const handleSaveAsset = useCallback(() => {
    if (!assetForm.a_name.trim()) {
      toast.error('Please enter asset name');
      return;
    }

    if (editingIndex !== null) {
      const updated = [...assetsList];
      updated[editingIndex] = assetForm;
      setAssetsList(updated);
    } else {
      setAssetsList([...assetsList, assetForm]);
    }

    resetAssetForm();
  }, [assetForm, assetsList, editingIndex, resetAssetForm]);

  const handleSaveDebt = useCallback(() => {
    if (!debtForm.d_name.trim()) {
      toast.error('Please enter debt name');
      return;
    }

    if (editingIndex !== null) {
      const updated = [...debtsList];
      updated[editingIndex] = debtForm;
      setDebtsList(updated);
    } else {
      setDebtsList([...debtsList, debtForm]);
    }

    resetDebtForm();
  }, [debtForm, debtsList, editingIndex]);

  const handleEditAsset = useCallback((idx) => {
    setAssetForm(assetsList[idx]);
    setEditingIndex(idx);
  }, [assetsList]);

  const handleDeleteAsset = useCallback((idx) => {
    setAssetsList(assetsList.filter((_, i) => i !== idx));
  }, [assetsList]);

  const handleEditDebt = useCallback((idx) => {
    setDebtForm(debtsList[idx]);
    setEditingIndex(idx);
  }, [debtsList]);

  const handleDeleteDebt = useCallback((idx) => {
    setDebtsList(debtsList.filter((_, i) => i !== idx));
  }, [debtsList]);

  const handleNext = async () => {
    if (!factFind?.id) {
      toast.error('Unable to save data');
      return;
    }

    setSaving(true);
    try {
      const sectionsCompleted = [...(factFind.sections_completed || [])];
      if (!sectionsCompleted.includes('assets_liabilities')) {
        sectionsCompleted.push('assets_liabilities');
      }

      await base44.entities.FactFind.update(factFind.id, {
        assets: {
          currentTab,
          activeIdx: { assets: 0, debts: 0 },
          assetsList,
          debtsList
        },
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

  const ownerOptions = getOwnerOptions();

  return (
    <FactFindLayout currentSection="assets_liabilities" factFind={factFind}>
      <FactFindHeader
        title="Assets & Liabilities"
        description="Add your assets and debts. Use the summary to select an item; edit its full details below."
        tabs={[
          { id: 'assets', label: 'Assets' },
          { id: 'debts', label: 'Liabilities' }
        ]}
        activeTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          resetAssetForm();
          resetDebtForm();
        }}
        factFind={factFind}
      />

      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
          {currentTab === 'assets' ? (
            <>
              {/* Summary Table */}
              {assetsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="text-5xl mb-6">🏠</div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Do you have any assets?</h3>
                  <p className="text-slate-600 text-center mb-8 max-w-md">Add details about your property, vehicles, investments, cash, and other assets.</p>
                </div>
              ) : (
                <Card className="border-slate-200 shadow-sm">
                  <div className="bg-slate-100 border-b border-slate-200 px-6 py-3">
                    <h4 className="font-bold text-slate-800">📊 Assets Summary ({assetsList.length})</h4>
                  </div>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Asset name</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Ownership type</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Owner</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Current value</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {assetsList.map((asset, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-800">{asset.a_name}</td>
                              <td className="px-4 py-3 text-slate-600">{asset.a_ownType === '2' ? 'Joint' : 'Sole'}</td>
                              <td className="px-4 py-3 text-slate-600">{getOwnerLabel(asset.a_owner)}</td>
                              <td className="px-4 py-3 font-semibold text-slate-800">
                                {asset.a_value ? `$${parseFloat(asset.a_value).toLocaleString()}` : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditAsset(idx)}
                                    className="border-slate-300"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteAsset(idx)}
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

              {/* Asset Editor */}
              <Card className="border-slate-200 shadow-sm">
                <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
                  <h4 className="font-bold text-blue-700">
                    {editingIndex !== null ? 'Edit Asset' : 'Add Asset'}
                  </h4>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Asset name</label>
                    <input
                      type="text"
                      value={assetForm.a_name}
                      onChange={(e) => setAssetForm({ ...assetForm, a_name: e.target.value })}
                      placeholder="e.g. Family Home Melbourne"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Asset ownership type</label>
                      <select
                        value={assetForm.a_ownType}
                        onChange={(e) => setAssetForm({ ...assetForm, a_ownType: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select…</option>
                        <option value="2">Joint</option>
                        <option value="1">Sole ownership</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Owner</label>
                      <select
                        value={assetForm.a_owner}
                        onChange={(e) => setAssetForm({ ...assetForm, a_owner: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select…</option>
                        {ownerOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Asset type</label>
                      <select
                        value={assetForm.a_type}
                        onChange={(e) => setAssetForm({ ...assetForm, a_type: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select…</option>
                        <option value="1">Home</option>
                        <option value="18">Investment property</option>
                        <option value="2">Vehicle</option>
                        <option value="8">Cash</option>
                        <option value="9">Term deposits</option>
                        <option value="12">Australian shares</option>
                        <option value="13">International shares</option>
                        <option value="26">Managed funds</option>
                        <option value="10">Bonds - Australian</option>
                        <option value="11">Bonds - International</option>
                        <option value="7">Lifestyle - Other</option>
                        <option value="42">Investment - Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Current value</label>
                      <div className="flex items-center">
                        <span className="text-slate-500 mr-2">$</span>
                        <input
                          type="number"
                          value={assetForm.a_value}
                          onChange={(e) => setAssetForm({ ...assetForm, a_value: e.target.value })}
                          step="0.01"
                          min="0"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Purchase price</label>
                      <div className="flex items-center">
                        <span className="text-slate-500 mr-2">$</span>
                        <input
                          type="number"
                          value={assetForm.a_purchase_price}
                          onChange={(e) => setAssetForm({ ...assetForm, a_purchase_price: e.target.value })}
                          step="0.01"
                          min="0"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Purchase date</label>
                      <input
                        type="date"
                        value={assetForm.a_purchase_date}
                        onChange={(e) => setAssetForm({ ...assetForm, a_purchase_date: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Rental income</label>
                      <div className="flex items-center">
                        <span className="text-slate-500 mr-2">$</span>
                        <input
                          type="number"
                          value={assetForm.a_rental_income}
                          onChange={(e) => setAssetForm({ ...assetForm, a_rental_income: e.target.value })}
                          step="0.01"
                          min="0"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Rental frequency</label>
                      <select
                        value={assetForm.a_rental_freq}
                        onChange={(e) => setAssetForm({ ...assetForm, a_rental_freq: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select…</option>
                        <option value="52">Weekly</option>
                        <option value="26">Fortnightly</option>
                        <option value="12">Monthly</option>
                        <option value="4">Quarterly</option>
                        <option value="1">Annually</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    {editingIndex !== null && (
                      <Button
                        variant="outline"
                        onClick={resetAssetForm}
                        className="border-slate-300"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      onClick={handleSaveAsset}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {editingIndex !== null ? 'Update Asset' : 'Add Asset'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {assetsList.length > 0 && (
                <Button
                  onClick={() => {
                    resetAssetForm();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                >
                  + Add Another Asset
                </Button>
              )}
            </>
          ) : (
            <>
              {/* Debts Summary Table */}
              {debtsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="text-5xl mb-6">💳</div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Do you have any debts or liabilities?</h3>
                  <p className="text-slate-600 text-center mb-8 max-w-md">Add details about your loans, mortgages, credit cards, and other debts.</p>
                </div>
              ) : (
                <Card className="border-slate-200 shadow-sm">
                  <div className="bg-slate-100 border-b border-slate-200 px-6 py-3">
                    <h4 className="font-bold text-slate-800">📊 Liabilities Summary ({debtsList.length})</h4>
                  </div>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Debt name</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Ownership type</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Owner</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Debt type</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Balance</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Repayments</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {debtsList.map((debt, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-800">{debt.d_name}</td>
                              <td className="px-4 py-3 text-slate-600">{debt.d_ownType === '2' ? 'Joint' : 'Sole'}</td>
                              <td className="px-4 py-3 text-slate-600">{getOwnerLabel(debt.d_owner)}</td>
                              <td className="px-4 py-3 text-slate-600">
                                {debt.d_type ? ['', 'Home loan', 'Investment loan', 'Margin loan', '', 'Credit card', 'Reverse mortgage', 'Car loan', 'Other'][debt.d_type] : '-'}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-800">
                                {debt.d_balance ? `$${parseFloat(debt.d_balance).toLocaleString()}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-slate-600 text-sm">
                                {debt.d_repayments && debt.d_freq ? `$${parseFloat(debt.d_repayments).toLocaleString()} ${['', '', '', '', 'Quarterly', '', '', '', ''].includes(debt.d_freq) ? 'Quarterly' : debt.d_freq === '52' ? 'Weekly' : debt.d_freq === '26' ? 'Fortnightly' : debt.d_freq === '12' ? 'Monthly' : '-'}` : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditDebt(idx)}
                                    className="border-slate-300"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteDebt(idx)}
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

              {/* Debt Editor */}
              <Card className="border-slate-200 shadow-sm">
                <div className="bg-red-50 border-b border-red-200 px-6 py-3">
                  <h4 className="font-bold text-red-700">
                    {editingIndex !== null ? 'Edit Liability' : 'Add Liability'}
                  </h4>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Debt name</label>
                    <input
                      type="text"
                      value={debtForm.d_name}
                      onChange={(e) => setDebtForm({ ...debtForm, d_name: e.target.value })}
                      placeholder="e.g. Home Loan - XYZ Bank"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Ownership type</label>
                      <select
                        value={debtForm.d_ownType}
                        onChange={(e) => setDebtForm({ ...debtForm, d_ownType: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select…</option>
                        <option value="2">Joint</option>
                        <option value="1">Sole ownership</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Owner</label>
                      <select
                        value={debtForm.d_owner}
                        onChange={(e) => setDebtForm({ ...debtForm, d_owner: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select…</option>
                        {ownerOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Debt type</label>
                      <select
                        value={debtForm.d_type}
                        onChange={(e) => setDebtForm({ ...debtForm, d_type: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select…</option>
                        <option value="1">Home loan</option>
                        <option value="2">Investment loan</option>
                        <option value="3">Margin loan</option>
                        <option value="5">Credit card</option>
                        <option value="6">Reverse mortgage</option>
                        <option value="7">Car loan</option>
                        <option value="8">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Interest rate</label>
                      <input
                        type="text"
                        value={debtForm.d_rate}
                        onChange={(e) => setDebtForm({ ...debtForm, d_rate: e.target.value })}
                        placeholder="e.g. 6.49%"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Repayment frequency</label>
                      <select
                        value={debtForm.d_freq}
                        onChange={(e) => setDebtForm({ ...debtForm, d_freq: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select…</option>
                        <option value="52">Weekly</option>
                        <option value="26">Fortnightly</option>
                        <option value="12">Monthly</option>
                        <option value="4">Quarterly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Repayment amount</label>
                      <div className="flex items-center">
                        <span className="text-slate-500 mr-2">$</span>
                        <input
                          type="number"
                          value={debtForm.d_repayments}
                          onChange={(e) => setDebtForm({ ...debtForm, d_repayments: e.target.value })}
                          step="0.01"
                          min="0"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Term remaining</label>
                      <input
                        type="text"
                        value={debtForm.d_term}
                        onChange={(e) => setDebtForm({ ...debtForm, d_term: e.target.value })}
                        placeholder="e.g. 18 years"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Current balance</label>
                      <div className="flex items-center">
                        <span className="text-slate-500 mr-2">$</span>
                        <input
                          type="number"
                          value={debtForm.d_balance}
                          onChange={(e) => setDebtForm({ ...debtForm, d_balance: e.target.value })}
                          step="0.01"
                          min="0"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Interest only available</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="d_io"
                            value="1"
                            checked={debtForm.d_io === '1'}
                            onChange={(e) => setDebtForm({ ...debtForm, d_io: e.target.value })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-slate-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="d_io"
                            value="2"
                            checked={debtForm.d_io === '2'}
                            onChange={(e) => setDebtForm({ ...debtForm, d_io: e.target.value })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-slate-700">No</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Fixed interest rate</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="d_fixed"
                            value="1"
                            checked={debtForm.d_fixed === '1'}
                            onChange={(e) => setDebtForm({ ...debtForm, d_fixed: e.target.value })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-slate-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="d_fixed"
                            value="2"
                            checked={debtForm.d_fixed === '2'}
                            onChange={(e) => setDebtForm({ ...debtForm, d_fixed: e.target.value })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-slate-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Redraw amount available</label>
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-2">$</span>
                      <input
                        type="number"
                        value={debtForm.d_redraw}
                        onChange={(e) => setDebtForm({ ...debtForm, d_redraw: e.target.value })}
                        step="0.01"
                        min="0"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select asset held as security</label>
                    <select
                      multiple
                      value={debtForm.d_security}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setDebtForm({ ...debtForm, d_security: selected });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      size={Math.min(5, Math.max(3, assetsList.length))}
                    >
                      {assetsList.length === 0 ? (
                        <option disabled>No assets added yet</option>
                      ) : (
                        assetsList.map((asset, idx) => (
                          <option key={idx} value={idx}>
                            {asset.a_name}
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    {editingIndex !== null && (
                      <Button
                        variant="outline"
                        onClick={resetDebtForm}
                        className="border-slate-300"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      onClick={handleSaveDebt}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {editingIndex !== null ? 'Update Liability' : 'Add Liability'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {debtsList.length > 0 && (
                <Button
                  onClick={() => {
                    resetDebtForm();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                >
                  + Add Another Liability
                </Button>
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
                      Save & continue
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