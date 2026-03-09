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
import { ArrowRight, ArrowLeft, Plus, ArrowLeftCircle } from 'lucide-react';
import EntityDot from '../components/factfind/EntityDot';
import EntitySelect from '../components/factfind/EntitySelect';

export default function FactFindInvestment() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading, updateSection } = useFactFind();
  const wrapOwnerEntities = useFactFindEntities(factFind, { types: ['principal', 'trust', 'company', 'smsf'] });
  const bondOwnerEntities = useFactFindEntities(factFind, { types: ['principal', 'trust'] });

  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [mainTab, setMainTab] = useState('wrap');
  const [view, setView] = useState('summary');
  const [editingIndex, setEditingIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('platform_details');
  const [wraps, setWraps] = useState([]);
  const [bonds, setBonds] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);

  const getEmptyWrap = () => ({
    id: `wrap_${Date.now()}`,
    platform_name: '',
    owner: '',
    account_number: '',
    balance: '',
    portfolio: [],
    fees: {
      admin_fee_type: '',
      admin_fee_value: '',
      adviser_fee_type: '',
      adviser_fee_value: '',
      other_fees: ''
    }
  });

  const getEmptyBond = () => ({
    id: `bond_${Date.now()}`,
    product_name: '',
    owner: '',
    policy_number: '',
    balance: '',
    commencement_date: '',
    tax_treatment: '',
    portfolio: []
  });

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
    if (factFind?.investment) {
      setWraps(factFind.investment.wraps || []);
      setBonds(factFind.investment.bonds || []);
    }
  }, [factFind?.investment]);

  // Auto-save committed list data (debounced 1.5s)
  const [dataLoaded, setDataLoaded] = useState(false);
  useEffect(() => {
    if (!factFind?.id) return;
    const t = setTimeout(() => setDataLoaded(true), 200);
    return () => clearTimeout(t);
  }, [factFind?.id]);

  const buildInvestmentPayloadRef = useRef(null);
  buildInvestmentPayloadRef.current = () => ({ wraps, bonds });

  useEffect(() => {
    if (!factFind?.id || !dataLoaded) return;
    const timeoutId = setTimeout(async () => {
      try {
        await updateSection('investment', buildInvestmentPayloadRef.current());
      } catch (err) {
        console.error('Auto-save investment failed:', err);
      }
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [factFind?.id, dataLoaded, wraps, bonds, updateSection]);

  const getCurrentList = () => {
    if (mainTab === 'wrap') return wraps;
    return bonds;
  };

  const setCurrentList = (items) => {
    if (mainTab === 'wrap') setWraps(items);
    else setBonds(items);
  };

  const saveInvestments = useCallback(async (w, b) => {
    if (!factFind?.id) return;
    try {
      await updateSection('investment', {
        wraps: w,
        bonds: b
      });
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [factFind?.id, updateSection]);

  const handleAddNew = () => {
    if (mainTab === 'wrap') setCurrentItem(getEmptyWrap());
    else setCurrentItem(getEmptyBond());
    setEditingIndex(null);
    setActiveTab(mainTab === 'wrap' ? 'platform_details' : 'bond_details');
    setView('detail');
  };

  const handleEdit = (index) => {
    const list = getCurrentList();
    setCurrentItem(JSON.parse(JSON.stringify(list[index])));
    setEditingIndex(index);
    setActiveTab(mainTab === 'wrap' ? 'platform_details' : 'bond_details');
    setView('detail');
  };

  const handleRemove = async (index) => {
    const list = getCurrentList();
    const updated = list.filter((_, i) => i !== index);
    setCurrentList(updated);

    if (mainTab === 'wrap') await saveInvestments(updated, bonds);
    else await saveInvestments(wraps, updated);

    toast.success('Removed successfully');
  };

  const handleSaveCurrent = async () => {
    const list = getCurrentList();
    let updated;
    if (editingIndex !== null) {
      updated = [...list];
      updated[editingIndex] = currentItem;
    } else {
      updated = [...list, currentItem];
    }

    setCurrentList(updated);

    if (mainTab === 'wrap') await saveInvestments(updated, bonds);
    else await saveInvestments(wraps, updated);

    setView('summary');
    toast.success(editingIndex !== null ? 'Updated successfully' : 'Added successfully');
  };

  const handleBackToSummary = () => {
    setView('summary');
    setCurrentItem(null);
  };

  const handleMainTabChange = async (tab) => {
    if (view === 'detail' && currentItem) {
      await handleSaveCurrent();
    }
    setMainTab(tab);
    setView('summary');
    setCurrentItem(null);
  };

  const handleNext = async () => {
    if (!factFind?.id) {
      toast.error('Unable to save data');
      return;
    }

    setSaving(true);
    try {
      const sectionsCompleted = [...(factFind.sections_completed || [])];
      if (!sectionsCompleted.includes('investment')) {
        sectionsCompleted.push('investment');
      }

      await updateSection('investment', { wraps, bonds });

      await base44.entities.FactFind.update(factFind.id, {
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

  if (ffLoading) {
    return (
      <FactFindLayout currentSection="investment" factFindId={factFind?.id}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const getOwnerName = (ownerId) => {
    const entities = mainTab === 'wrap' ? wrapOwnerEntities : bondOwnerEntities;
    const entity = entities.find(e => e.id === ownerId);
    return entity ? entity.label : 'Unknown';
  };

  const currentList = getCurrentList();
  const itemTypeLabel = mainTab === 'wrap' ? 'Wrap' : 'Bond';

  return (
    <FactFindLayout currentSection="investment" factFindId={factFind?.id}>
      <FactFindHeader
        title="Investments"
        description="Record wrap accounts and investment bonds."
        factFind={factFind}
        user={user}
      />

      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
          <div className="flex gap-2">
            <button
              onClick={() => handleMainTabChange('wrap')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                mainTab === 'wrap' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>📊</span>
              Wrap / Mastertrust
            </button>
            <button
              onClick={() => handleMainTabChange('bond')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                mainTab === 'bond' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>📑</span>
              Investment Bonds
            </button>
          </div>

          {view === 'summary' ? (
            <>
              {currentList.length > 0 ? (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Owner</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                            {mainTab === 'wrap' ? 'Platform Name' : 'Product Name'}
                          </th>
                          {mainTab === 'wrap' && (
                            <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Account Number</th>
                          )}
                          {mainTab === 'bond' && (
                            <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Policy Number</th>
                          )}
                          <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Balance</th>
                          <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentList.map((item, index) => (
                          <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-medium text-slate-800">{getOwnerName(item.owner)}</td>
                            <td className="py-3 px-3 text-slate-600">
                              {mainTab === 'wrap' ? (item.platform_name || 'N/A') : (item.product_name || 'N/A')}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {mainTab === 'wrap' ? (item.account_number || 'N/A') : (item.policy_number || 'N/A')}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-slate-800">
                              {item.balance ? `$${parseFloat(item.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleEdit(index)}
                                className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors mr-2"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => handleRemove(index)}
                                className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleAddNew}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add {itemTypeLabel}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <div className="text-5xl mb-4">{mainTab === 'wrap' ? '📊' : '📄'}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {mainTab === 'wrap' ? 'No wrap accounts added yet' : 'No investment bonds added yet'}
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      {mainTab === 'wrap'
                        ? 'Add investment platform accounts like wraps and master trust products'
                        : 'Add insurance or investment bond products'}
                    </p>
                    <button
                      onClick={handleAddNew}
                      className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add First {itemTypeLabel}
                    </button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                  <button
                    onClick={handleBackToSummary}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <ArrowLeftCircle className="w-4 h-4" />
                    Back to Summary
                  </button>
                  <h3 className="text-lg font-bold text-slate-900">
                    {currentItem?.platform_name || currentItem?.product_name || `New ${itemTypeLabel}`}
                  </h3>
                </div>

                <div className="flex gap-2 mb-6">
                  {mainTab === 'wrap' && [
                    { id: 'platform_details', label: 'Platform Details' },
                    { id: 'portfolio', label: 'Portfolio' },
                    { id: 'fees', label: 'Fees' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}

                  {mainTab === 'bond' && [
                    { id: 'bond_details', label: 'Bond Details' },
                    { id: 'portfolio', label: 'Portfolio' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {mainTab === 'wrap' && (
                  <>
                    {activeTab === 'platform_details' && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Platform / Product name</label>
                          <input
                            type="text"
                            value={currentItem.platform_name}
                            onChange={(e) => setCurrentItem({ ...currentItem, platform_name: e.target.value })}
                            placeholder="e.g. BT Panorama, Macquarie Wrap"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Owner</label>
                          <EntitySelect
                            value={currentItem.owner}
                            onChange={(id) => setCurrentItem({ ...currentItem, owner: id })}
                            entities={wrapOwnerEntities}
                            placeholder="Select owner…"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Account number</label>
                          <input
                            type="text"
                            value={currentItem.account_number}
                            onChange={(e) => setCurrentItem({ ...currentItem, account_number: e.target.value })}
                            placeholder="Account number"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Balance</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={currentItem.balance}
                              onChange={(e) => setCurrentItem({ ...currentItem, balance: e.target.value })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'portfolio' && (
                      <div>
                        {currentItem.portfolio?.length > 0 ? (
                          <div className="space-y-3">
                            {currentItem.portfolio.map((holding, index) => (
                              <div key={index} className="grid grid-cols-5 gap-3 items-end">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Asset name</label>
                                  <input
                                    type="text"
                                    value={holding.asset_name}
                                    onChange={(e) => {
                                      const updated = [...currentItem.portfolio];
                                      updated[index].asset_name = e.target.value;
                                      setCurrentItem({ ...currentItem, portfolio: updated });
                                    }}
                                    placeholder="e.g. Vanguard Growth"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Asset code / Ticker</label>
                                  <input
                                    type="text"
                                    value={holding.asset_code}
                                    onChange={(e) => {
                                      const updated = [...currentItem.portfolio];
                                      updated[index].asset_code = e.target.value;
                                      setCurrentItem({ ...currentItem, portfolio: updated });
                                    }}
                                    placeholder="e.g. VDHG"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Amount</label>
                                  <div className="flex items-center">
                                    <span className="text-slate-500 mr-2">$</span>
                                    <input
                                      type="number"
                                      value={holding.amount}
                                      onChange={(e) => {
                                        const updated = [...currentItem.portfolio];
                                        updated[index].amount = e.target.value;
                                        setCurrentItem({ ...currentItem, portfolio: updated });
                                      }}
                                      placeholder="0.00"
                                      step="0.01"
                                      min="0"
                                      className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Allocation %</label>
                                  <input
                                    type="number"
                                    value={holding.allocation_pct}
                                    onChange={(e) => {
                                      const updated = [...currentItem.portfolio];
                                      updated[index].allocation_pct = e.target.value;
                                      setCurrentItem({ ...currentItem, portfolio: updated });
                                    }}
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <button
                                    onClick={() => {
                                      const updated = currentItem.portfolio.filter((_, i) => i !== index);
                                      setCurrentItem({ ...currentItem, portfolio: updated });
                                    }}
                                    className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600 text-center py-6">No holdings added yet</p>
                        )}
                        <div className="mt-4">
                          <button
                            onClick={() => setCurrentItem({
                              ...currentItem,
                              portfolio: [...(currentItem.portfolio || []), { asset_name: '', asset_code: '', amount: '', allocation_pct: '' }]
                            })}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Holding
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'fees' && (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Administration fee type</label>
                            <select
                              value={currentItem.fees?.admin_fee_type || ''}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                fees: { ...currentItem.fees, admin_fee_type: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select type…</option>
                              <option value="percentage">Percentage (%)</option>
                              <option value="dollar">Dollar amount ($)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Administration fee value</label>
                            <input
                              type="number"
                              value={currentItem.fees?.admin_fee_value || ''}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                fees: { ...currentItem.fees, admin_fee_value: e.target.value }
                              })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Adviser fee type</label>
                            <select
                              value={currentItem.fees?.adviser_fee_type || ''}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                fees: { ...currentItem.fees, adviser_fee_type: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select type…</option>
                              <option value="percentage">Percentage (%)</option>
                              <option value="dollar">Dollar amount ($)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Adviser fee value</label>
                            <input
                              type="number"
                              value={currentItem.fees?.adviser_fee_value || ''}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                fees: { ...currentItem.fees, adviser_fee_value: e.target.value }
                              })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Other fees (details)</label>
                          <textarea
                            value={currentItem.fees?.other_fees || ''}
                            onChange={(e) => setCurrentItem({
                              ...currentItem,
                              fees: { ...currentItem.fees, other_fees: e.target.value }
                            })}
                            placeholder="Additional fee details..."
                            rows="3"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {mainTab === 'bond' && (
                  <>
                    {activeTab === 'bond_details' && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Product / Provider name</label>
                          <input
                            type="text"
                            value={currentItem.product_name}
                            onChange={(e) => setCurrentItem({ ...currentItem, product_name: e.target.value })}
                            placeholder="e.g. Australian Unity, Centuria"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Owner</label>
                          <EntitySelect
                            value={currentItem.owner}
                            onChange={(id) => setCurrentItem({ ...currentItem, owner: id })}
                            entities={bondOwnerEntities}
                            placeholder="Select owner…"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Policy number</label>
                          <input
                            type="text"
                            value={currentItem.policy_number}
                            onChange={(e) => setCurrentItem({ ...currentItem, policy_number: e.target.value })}
                            placeholder="Policy number"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Balance / Current value</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={currentItem.balance}
                              onChange={(e) => setCurrentItem({ ...currentItem, balance: e.target.value })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Commencement date</label>
                          <input
                            type="date"
                            value={currentItem.commencement_date}
                            onChange={(e) => setCurrentItem({ ...currentItem, commencement_date: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Tax treatment</label>
                          <select
                            value={currentItem.tax_treatment}
                            onChange={(e) => setCurrentItem({ ...currentItem, tax_treatment: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select…</option>
                            <option value="tax_paid">Tax paid</option>
                            <option value="tax_deferred">Tax deferred</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {activeTab === 'portfolio' && (
                      <div>
                        {currentItem.portfolio?.length > 0 ? (
                          <div className="space-y-3">
                            {currentItem.portfolio.map((holding, index) => (
                              <div key={index} className="grid grid-cols-5 gap-3 items-end">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Asset name</label>
                                  <input
                                    type="text"
                                    value={holding.asset_name}
                                    onChange={(e) => {
                                      const updated = [...currentItem.portfolio];
                                      updated[index].asset_name = e.target.value;
                                      setCurrentItem({ ...currentItem, portfolio: updated });
                                    }}
                                    placeholder="e.g. Balanced Fund"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Asset code / Ticker</label>
                                  <input
                                    type="text"
                                    value={holding.asset_code}
                                    onChange={(e) => {
                                      const updated = [...currentItem.portfolio];
                                      updated[index].asset_code = e.target.value;
                                      setCurrentItem({ ...currentItem, portfolio: updated });
                                    }}
                                    placeholder="e.g. BAL"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Amount</label>
                                  <div className="flex items-center">
                                    <span className="text-slate-500 mr-2">$</span>
                                    <input
                                      type="number"
                                      value={holding.amount}
                                      onChange={(e) => {
                                        const updated = [...currentItem.portfolio];
                                        updated[index].amount = e.target.value;
                                        setCurrentItem({ ...currentItem, portfolio: updated });
                                      }}
                                      placeholder="0.00"
                                      step="0.01"
                                      min="0"
                                      className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Allocation %</label>
                                  <input
                                    type="number"
                                    value={holding.allocation_pct}
                                    onChange={(e) => {
                                      const updated = [...currentItem.portfolio];
                                      updated[index].allocation_pct = e.target.value;
                                      setCurrentItem({ ...currentItem, portfolio: updated });
                                    }}
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <button
                                    onClick={() => {
                                      const updated = currentItem.portfolio.filter((_, i) => i !== index);
                                      setCurrentItem({ ...currentItem, portfolio: updated });
                                    }}
                                    className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600 text-center py-6">No holdings added yet</p>
                        )}
                        <div className="mt-4">
                          <button
                            onClick={() => setCurrentItem({
                              ...currentItem,
                              portfolio: [...(currentItem.portfolio || []), { asset_name: '', asset_code: '', amount: '', allocation_pct: '' }]
                            })}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Holding
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                  <Button
                    onClick={handleSaveCurrent}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save {itemTypeLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {view === 'summary' && (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Button onClick={handleBack} variant="outline" disabled={saving} className="border-slate-300">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
                    Save & continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </FactFindLayout>
  );
}