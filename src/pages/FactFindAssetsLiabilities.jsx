import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { useFactFind } from '@/components/factfind/useFactFind';
import { useFactFindEntities } from '@/components/factfind/useFactFindEntities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Edit2, Trash2, Plus } from 'lucide-react';
import EntityDot from '../components/factfind/EntityDot';
import EntitySelect from '../components/factfind/EntitySelect';

export default function FactFindAssetsLiabilities() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading, updateSection } = useFactFind();
  const assetEntities = useFactFindEntities(factFind, { types: ['principal', 'trust', 'company', 'wrap', 'bond'] });
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('assets');
  
  const [assetsList, setAssetsList] = useState([]);
  const [debtsList, setDebtsList] = useState([]);
  const [activeAssetIndex, setActiveAssetIndex] = useState(null);
  const [activeDebtIndex, setActiveDebtIndex] = useState(null);

  const getOwnerLabel = useCallback((value) => {
    if (!value) return '-';
    const entity = assetEntities.find(e => e.id === value);
    return entity ? entity.label : value;
  }, [assetEntities]);

  const getDebtTypeLabel = useCallback((value) => {
    const types = { '1': 'Home loan', '2': 'Investment loan', '3': 'Margin loan', '5': 'Credit card', '6': 'Reverse mortgage', '7': 'Car loan', '8': 'Other' };
    return types[value] || '-';
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (factFind?.assets_liabilities?.assets) {
      setAssetsList(factFind.assets_liabilities.assets);
    }
    if (factFind?.assets_liabilities?.liabilities) {
      setDebtsList(factFind.assets_liabilities.liabilities);
    }
  }, [factFind?.id]);

  // Auto-save on data changes (debounced 1.5s)
  const [dataLoaded, setDataLoaded] = useState(false);
  useEffect(() => {
    if (!factFind?.id) return;
    const t = setTimeout(() => setDataLoaded(true), 200);
    return () => clearTimeout(t);
  }, [factFind?.id]);

  const buildAssetsLiabilitiesPayloadRef = useRef(null);
  buildAssetsLiabilitiesPayloadRef.current = () => ({ assets: assetsList, liabilities: debtsList });

  useEffect(() => {
    if (!factFind?.id || !dataLoaded) return;
    const timeoutId = setTimeout(async () => {
      try {
        await updateSection('assets_liabilities', buildAssetsLiabilitiesPayloadRef.current());
      } catch (err) {
        console.error('Auto-save assets/liabilities failed:', err);
      }
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [factFind?.id, dataLoaded, assetsList, debtsList, updateSection]);

  useEffect(() => {
    const handleSaveBeforeNav = async () => {
      try {
        await updateSection('assets_liabilities', buildAssetsLiabilitiesPayloadRef.current());
      } catch (err) {
        console.error('Save failed:', err);
      }
      window.dispatchEvent(new Event('factfind-save-complete'));
    };

    window.addEventListener('factfind-save-before-nav', handleSaveBeforeNav);
    return () => window.removeEventListener('factfind-save-before-nav', handleSaveBeforeNav);
  }, [updateSection]);



  // ASSETS
  const addAsset = useCallback(() => {
    const newAsset = { a_name: '', a_description: '', a_ownType: '', a_owner: '', a_type: '', a_value: '', a_growth: '', a_purchase_price: '', a_purchase_date: '', a_rental_income: '', a_rental_freq: '' };
    setAssetsList(prev => [...prev, newAsset]);
    setActiveAssetIndex(assetsList.length);
  }, [assetsList.length]);

  const updateAsset = useCallback((index, field, value) => {
    setAssetsList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const deleteAsset = useCallback(async (index) => {
    const updatedAssets = assetsList.filter((_, i) => i !== index);
    setAssetsList(updatedAssets);
    if (activeAssetIndex >= index && activeAssetIndex > 0) {
      setActiveAssetIndex(prev => prev - 1);
    }

    // Save to database immediately
    if (factFind?.id) {
      await updateSection('assets_liabilities', {
        assets: updatedAssets,
        liabilities: debtsList
      });
    }
  }, [activeAssetIndex, assetsList, factFind, debtsList, updateSection]);

  // DEBTS
  const addDebt = useCallback(() => {
    const newDebt = { d_name: '', d_ownType: '', d_owner: '', d_type: '', d_rate: '', d_freq: '', d_repayments: '', d_term: '', d_balance: '', d_io: '', d_fixed: '', d_redraw: '', d_security: [] };
    setDebtsList(prev => [...prev, newDebt]);
    setActiveDebtIndex(debtsList.length);
  }, [debtsList.length]);

  const updateDebt = useCallback((index, field, value) => {
    setDebtsList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const deleteDebt = useCallback(async (index) => {
    const updatedDebts = debtsList.filter((_, i) => i !== index);
    setDebtsList(updatedDebts);
    if (activeDebtIndex >= index && activeDebtIndex > 0) {
      setActiveDebtIndex(prev => prev - 1);
    }

    // Save to database immediately
    if (factFind?.id) {
      await updateSection('assets_liabilities', {
        assets: assetsList,
        liabilities: updatedDebts
      });
    }
  }, [activeDebtIndex, debtsList, factFind, assetsList, updateSection]);

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

      await updateSection('assets_liabilities', { assets: assetsList, liabilities: debtsList });

      await base44.entities.FactFind.update(factFind.id, {
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

  if (ffLoading) {
    return (
      <FactFindLayout currentSection="assets_liabilities" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const activeAsset = activeAssetIndex !== null ? assetsList[activeAssetIndex] : null;
  const activeDebt = activeDebtIndex !== null ? debtsList[activeDebtIndex] : null;

  return (
    <FactFindLayout currentSection="assets_liabilities" factFind={factFind}>
      <FactFindHeader
        title="Assets & Liabilities"
        description="Add your assets and debts. Use the summary to select an item; edit its full details below."
        factFind={factFind}
        user={user}
      />

      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
           {/* Tabs - Part of form content */}
           <div className="flex gap-2">
             <button
               onClick={() => setCurrentTab('assets')}
               className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                 currentTab === 'assets'
                   ? 'bg-blue-50 text-blue-700 border border-blue-200'
                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
               }`}
             >
               <span>🏠</span>
               Assets
             </button>
             <button
               onClick={() => setCurrentTab('debts')}
               className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                 currentTab === 'debts'
                   ? 'bg-blue-50 text-blue-700 border border-blue-200'
                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
               }`}
             >
               <span>💳</span>
               Liabilities
             </button>
           </div>

           {currentTab === 'assets' ? (
            <>
              {/* EMPTY STATE */}
              {assetsList.length === 0 ? (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <div className="text-6xl mb-6">🏠</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Do you have any assets?</h3>
                    <p className="text-slate-600 mb-8">Add details about your property, vehicles, investments, cash, and other assets.</p>
                    <button onClick={addAsset} className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors">
                      <Plus className="w-4 h-4" />
                      Add First Asset
                    </button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* SUMMARY TABLE */}
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
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Ownership</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Owner</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Current value</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {assetsList.map((asset, idx) => (
                              <tr key={idx} className={activeAssetIndex === idx ? 'bg-blue-50' : 'hover:bg-slate-50'}>
                                <td className="px-4 py-3 font-medium text-slate-800 cursor-pointer" onClick={() => setActiveAssetIndex(idx)}>{asset.a_name || '-'}</td>
                                <td className="px-4 py-3 text-slate-600 cursor-pointer" onClick={() => setActiveAssetIndex(idx)}>{asset.a_ownType === '2' ? 'Joint' : 'Sole'}</td>
                                <td className="px-4 py-3 text-slate-600 cursor-pointer" onClick={() => setActiveAssetIndex(idx)}>{getOwnerLabel(asset.a_owner)}</td>
                                <td className="px-4 py-3 font-semibold text-slate-800 cursor-pointer" onClick={() => setActiveAssetIndex(idx)}>{asset.a_value ? `$${parseFloat(asset.a_value).toLocaleString()}` : '-'}</td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setActiveAssetIndex(idx)} className="border-slate-300"><Edit2 className="w-3 h-3" /></Button>
                                    <Button variant="outline" size="sm" onClick={() => deleteAsset(idx)} className="border-red-300 text-red-600 hover:bg-red-50"><Trash2 className="w-3 h-3" /></Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* EDITOR */}
                  {activeAsset && (
                    <Card className="border-slate-200 shadow-sm">
                      <div className="bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-blue-500 px-6 py-3">
                        <h4 className="font-bold text-slate-800">🏠 Asset Details</h4>
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Asset name</label>
                            <input type="text" value={activeAsset.a_name} onChange={(e) => updateAsset(activeAssetIndex, 'a_name', e.target.value)} placeholder="e.g. Family Home Melbourne" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                            <input type="text" value={activeAsset.a_description || ''} onChange={(e) => updateAsset(activeAssetIndex, 'a_description', e.target.value)} placeholder="e.g. 4BR house in Toorak" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Ownership type</label>
                            <select value={activeAsset.a_ownType} onChange={(e) => updateAsset(activeAssetIndex, 'a_ownType', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="">Select…</option>
                              <option value="1">Sole ownership</option>
                              <option value="2">Joint</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Owner</label>
                            <EntitySelect
                              value={activeAsset.a_owner}
                              onChange={(id) => updateAsset(activeAssetIndex, 'a_owner', id)}
                              entities={assetEntities}
                              placeholder="Select owner…"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Asset type</label>
                            <select value={activeAsset.a_type} onChange={(e) => updateAsset(activeAssetIndex, 'a_type', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                              <input type="number" value={activeAsset.a_value} onChange={(e) => updateAsset(activeAssetIndex, 'a_value', e.target.value)} step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Growth rate (% p.a.)</label>
                            <input type="number" value={activeAsset.a_growth || ''} onChange={(e) => updateAsset(activeAssetIndex, 'a_growth', e.target.value)} placeholder="e.g. 3.5" step="0.1" min="0" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Purchase price</label>
                            <div className="flex items-center">
                              <span className="text-slate-500 mr-2">$</span>
                              <input type="number" value={activeAsset.a_purchase_price} onChange={(e) => updateAsset(activeAssetIndex, 'a_purchase_price', e.target.value)} step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Purchase date</label>
                            <input type="date" value={activeAsset.a_purchase_date} onChange={(e) => updateAsset(activeAssetIndex, 'a_purchase_date', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Rental income</label>
                            <div className="flex items-center">
                              <span className="text-slate-500 mr-2">$</span>
                              <input type="number" value={activeAsset.a_rental_income} onChange={(e) => updateAsset(activeAssetIndex, 'a_rental_income', e.target.value)} step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Rental frequency</label>
                            <select value={activeAsset.a_rental_freq} onChange={(e) => updateAsset(activeAssetIndex, 'a_rental_freq', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="">Select…</option>
                              <option value="52">Weekly</option>
                              <option value="26">Fortnightly</option>
                              <option value="12">Monthly</option>
                              <option value="4">Quarterly</option>
                              <option value="1">Annually</option>
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* ADD BUTTON */}
                  <button onClick={addAsset} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors w-full">
                    <Plus className="w-4 h-4" />
                    Add Another Asset
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {/* EMPTY STATE */}
              {debtsList.length === 0 ? (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <div className="text-6xl mb-6">💳</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Do you have any debts or liabilities?</h3>
                    <p className="text-slate-600 mb-8">Add details about your loans, mortgages, credit cards, and other debts.</p>
                    <button onClick={addDebt} className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors">
                      <Plus className="w-4 h-4" />
                      Add First Liability
                    </button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* SUMMARY TABLE */}
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
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Ownership</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Owner</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Debt type</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Balance</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Repayments</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {debtsList.map((debt, idx) => (
                              <tr key={idx} className={activeDebtIndex === idx ? 'bg-blue-50' : 'hover:bg-slate-50'}>
                                <td className="px-4 py-3 font-medium text-slate-800 cursor-pointer" onClick={() => setActiveDebtIndex(idx)}>{debt.d_name || '-'}</td>
                                <td className="px-4 py-3 text-slate-600 cursor-pointer" onClick={() => setActiveDebtIndex(idx)}>{debt.d_ownType === '2' ? 'Joint' : 'Sole'}</td>
                                <td className="px-4 py-3 text-slate-600 cursor-pointer" onClick={() => setActiveDebtIndex(idx)}>{getOwnerLabel(debt.d_owner)}</td>
                                <td className="px-4 py-3 text-slate-600 cursor-pointer" onClick={() => setActiveDebtIndex(idx)}>{getDebtTypeLabel(debt.d_type)}</td>
                                <td className="px-4 py-3 font-semibold text-slate-800 cursor-pointer" onClick={() => setActiveDebtIndex(idx)}>{debt.d_balance ? `$${parseFloat(debt.d_balance).toLocaleString()}` : '-'}</td>
                                <td className="px-4 py-3 text-slate-600 text-xs cursor-pointer" onClick={() => setActiveDebtIndex(idx)}>
                                  {debt.d_repayments ? `$${parseFloat(debt.d_repayments).toLocaleString()} ` : '-'}
                                  {debt.d_freq === '52' ? 'Weekly' : debt.d_freq === '26' ? 'Fortnightly' : debt.d_freq === '12' ? 'Monthly' : debt.d_freq === '4' ? 'Quarterly' : ''}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setActiveDebtIndex(idx)} className="border-slate-300"><Edit2 className="w-3 h-3" /></Button>
                                    <Button variant="outline" size="sm" onClick={() => deleteDebt(idx)} className="border-red-300 text-red-600 hover:bg-red-50"><Trash2 className="w-3 h-3" /></Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* EDITOR */}
                  {activeDebt && (
                    <Card className="border-slate-200 shadow-sm">
                      <div className="bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-blue-500 px-6 py-3">
                        <h4 className="font-bold text-slate-800">💳 Liability Details</h4>
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Debt name</label>
                          <input type="text" value={activeDebt.d_name} onChange={(e) => updateDebt(activeDebtIndex, 'd_name', e.target.value)} placeholder="e.g. Home Loan - XYZ Bank" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Ownership type</label>
                            <select value={activeDebt.d_ownType} onChange={(e) => updateDebt(activeDebtIndex, 'd_ownType', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="">Select…</option>
                              <option value="1">Sole ownership</option>
                              <option value="2">Joint</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Owner</label>
                            <EntitySelect
                              value={activeDebt.d_owner}
                              onChange={(id) => updateDebt(activeDebtIndex, 'd_owner', id)}
                              entities={assetEntities}
                              placeholder="Select owner…"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Debt type</label>
                            <select value={activeDebt.d_type} onChange={(e) => updateDebt(activeDebtIndex, 'd_type', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                            <input type="text" value={activeDebt.d_rate} onChange={(e) => updateDebt(activeDebtIndex, 'd_rate', e.target.value)} placeholder="e.g. 6.49%" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Repayment frequency</label>
                            <select value={activeDebt.d_freq} onChange={(e) => updateDebt(activeDebtIndex, 'd_freq', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                              <input type="number" value={activeDebt.d_repayments} onChange={(e) => updateDebt(activeDebtIndex, 'd_repayments', e.target.value)} step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Term remaining</label>
                            <input type="text" value={activeDebt.d_term} onChange={(e) => updateDebt(activeDebtIndex, 'd_term', e.target.value)} placeholder="e.g. 18 years" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Current balance</label>
                            <div className="flex items-center">
                              <span className="text-slate-500 mr-2">$</span>
                              <input type="number" value={activeDebt.d_balance} onChange={(e) => updateDebt(activeDebtIndex, 'd_balance', e.target.value)} step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">Interest only available</label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="d_io" value="1" checked={activeDebt.d_io === '1'} onChange={(e) => updateDebt(activeDebtIndex, 'd_io', e.target.value)} className="w-4 h-4" />
                                <span className="text-sm text-slate-700">Yes</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="d_io" value="2" checked={activeDebt.d_io === '2'} onChange={(e) => updateDebt(activeDebtIndex, 'd_io', e.target.value)} className="w-4 h-4" />
                                <span className="text-sm text-slate-700">No</span>
                              </label>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">Fixed interest rate</label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="d_fixed" value="1" checked={activeDebt.d_fixed === '1'} onChange={(e) => updateDebt(activeDebtIndex, 'd_fixed', e.target.value)} className="w-4 h-4" />
                                <span className="text-sm text-slate-700">Yes</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="d_fixed" value="2" checked={activeDebt.d_fixed === '2'} onChange={(e) => updateDebt(activeDebtIndex, 'd_fixed', e.target.value)} className="w-4 h-4" />
                                <span className="text-sm text-slate-700">No</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Redraw amount available</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input type="number" value={activeDebt.d_redraw} onChange={(e) => updateDebt(activeDebtIndex, 'd_redraw', e.target.value)} step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Select asset held as security</label>
                          <select multiple value={activeDebt.d_security} onChange={(e) => { const selected = Array.from(e.target.selectedOptions, option => option.value); updateDebt(activeDebtIndex, 'd_security', selected); }} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" size={Math.min(5, Math.max(3, assetsList.length))}>
                            {assetsList.length === 0 ? (
                              <option disabled>No assets added yet</option>
                            ) : (
                              assetsList.map((asset, idx) => (
                                <option key={idx} value={idx}>{asset.a_name}</option>
                              ))
                            )}
                          </select>
                          <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* ADD BUTTON */}
                  <button onClick={addDebt} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors w-full">
                    <Plus className="w-4 h-4" />
                    Add Another Liability
                  </button>
                </>
              )}
            </>
          )}

          {/* NAVIGATION */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Button onClick={handleBack} variant="outline" disabled={saving} className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button onClick={handleNext} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30">
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