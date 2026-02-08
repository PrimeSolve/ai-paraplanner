import React, { useState, useEffect, useCallback } from 'react';
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

export default function FactFindSuperannuation() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading, updateSection } = useFactFind();
  const principalsOnly = useFactFindEntities(factFind, { types: ['Principal'] });
  const beneficiaryEntities = useFactFindEntities(factFind, { types: ['Principal', 'Dependant'] });
  
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [mainTab, setMainTab] = useState('super');
  const [view, setView] = useState('summary');
  const [editingIndex, setEditingIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('fund_details');
  const [superFunds, setSuperFunds] = useState([]);
  const [pensions, setPensions] = useState([]);
  const [annuities, setAnnuities] = useState([]);
  
  const [currentItem, setCurrentItem] = useState(null);

  // Debug principals
  console.log('Principals loaded:', principalsOnly);

  // Initialize empty items for each type
  const getEmptySuper = () => ({
    id: `super_${Date.now()}`,
    owner: '',
    fund_name: '',
    product: '',
    balance: '',
    contributions: {
      super_guarantee: '',
      salary_sacrifice: '',
      after_tax: '',
      spouse_received: '',
      split_received: '',
      concessional: ''
    },
    tax_components: {
      unp_amount: '',
      taxable_portion: '',
      tax_free_portion: ''
    },
    beneficiaries: [],
    portfolio: []
  });

  const getEmptyPension = () => ({
    id: `pension_${Date.now()}`,
    joint_holding: false,
    owner: '',
    fund_name: '',
    product: '',
    balance: '',
    pension_type: '',
    commencement_date: '',
    purchase_price: '',
    reversionary_nominee: '',
    income: {
      annual_income: '',
      frequency: '',
      minimum: '',
      maximum: '',
      tax_free_pct: '',
      taxable_pct: ''
    },
    tax_components: {
      unp_amount: '',
      taxable_portion: '',
      tax_free_portion: ''
    },
    beneficiaries: [],
    portfolio: []
  });

  const getEmptyAnnuity = () => ({
    id: `annuity_${Date.now()}`,
    joint_holding: false,
    owner: '',
    product: '',
    annuity_type: '',
    purchase_price: '',
    commencement_date: '',
    maturity_date: '',
    guaranteed_period: '',
    residual_capital_value: '',
    income: {
      annual_income: '',
      frequency: '',
      tax_free_pct: '',
      taxable_pct: '',
      deductible_amount: ''
    },
    tax_components: {
      unp_amount: '',
      taxable_portion: '',
      tax_free_portion: ''
    },
    beneficiaries: []
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
    if (factFind?.superannuation) {
      setSuperFunds(factFind.superannuation.funds || []);
      setPensions(factFind.superannuation.pensions || []);
      setAnnuities(factFind.superannuation.annuities || []);
    }
  }, [factFind?.superannuation]);

  // CRITICAL: Save before navigating away
  useEffect(() => {
    console.log('=== SUPER LISTENER REGISTERED ===');

    const handleSaveBeforeNav = async () => {
      console.log('=== SUPER SAVE-BEFORE-NAV FIRED ===');
      
      try {
        await updateSection('superannuation', {
          funds: superFunds || [],
          pensions: pensions || [],
          annuities: annuities || []
        });
        console.log('=== SUPER SAVE DONE ===');
      } catch (err) {
        console.error('=== SUPER SAVE FAILED ===', err);
      }
      
      // Signal that save is complete
      window.dispatchEvent(new Event('factfind-save-complete'));
    };

    window.addEventListener('factfind-save-before-nav', handleSaveBeforeNav);
    return () => window.removeEventListener('factfind-save-before-nav', handleSaveBeforeNav);
  }, [superFunds, pensions, annuities, updateSection]);

  const getCurrentList = () => {
    if (mainTab === 'super') return superFunds;
    if (mainTab === 'pension') return pensions;
    return annuities;
  };

  const setCurrentList = (items) => {
    if (mainTab === 'super') setSuperFunds(items);
    else if (mainTab === 'pension') setPensions(items);
    else setAnnuities(items);
  };

  const saveFunds = useCallback(async (sf, p, a) => {
    if (!factFind?.id) return;
    try {
      await base44.entities.FactFind.update(factFind.id, {
        superannuation: {
          funds: sf,
          pensions: p,
          annuities: a
        }
      });
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [factFind?.id]);

  const handleAddNew = () => {
    if (mainTab === 'super') setCurrentItem(getEmptySuper());
    else if (mainTab === 'pension') setCurrentItem(getEmptyPension());
    else setCurrentItem(getEmptyAnnuity());
    setEditingIndex(null);
    // Set correct default tab based on product type
    if (mainTab === 'annuity') setActiveTab('annuity_details');
    else setActiveTab('fund_details');
    setView('detail');
  };

  const handleEdit = (index) => {
    const list = getCurrentList();
    setCurrentItem(JSON.parse(JSON.stringify(list[index])));
    setEditingIndex(index);
    // Set correct default tab based on product type
    if (mainTab === 'annuity') setActiveTab('annuity_details');
    else setActiveTab('fund_details');
    setView('detail');
  };

  const handleRemove = async (index) => {
    const list = getCurrentList();
    const updated = list.filter((_, i) => i !== index);
    setCurrentList(updated);
    
    if (mainTab === 'super') await saveFunds(updated, pensions, annuities);
    else if (mainTab === 'pension') await saveFunds(superFunds, updated, annuities);
    else await saveFunds(superFunds, pensions, updated);
    
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
    
    if (mainTab === 'super') await saveFunds(updated, pensions, annuities);
    else if (mainTab === 'pension') await saveFunds(superFunds, updated, annuities);
    else await saveFunds(superFunds, pensions, updated);
    
    setView('summary');
    toast.success(editingIndex !== null ? 'Updated successfully' : 'Added successfully');
  };

  const handleBackToSummary = () => {
    setView('summary');
    setCurrentItem(null);
  };

  const handleMainTabChange = async (tab) => {
    // Auto-save current fund if in detail view
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
      if (!sectionsCompleted.includes('superannuation')) {
        sectionsCompleted.push('superannuation');
      }

      await base44.entities.FactFind.update(factFind.id, {
        superannuation: { funds: superFunds, pensions, annuities },
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindInvestment') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindSMSF') + `?id=${factFind?.id || ''}`);
  };

  if (ffLoading) {
    return (
      <FactFindLayout currentSection="superannuation" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const getOwnerName = (ownerId) => {
    if (ownerId === 'joint' && principalsOnly.length >= 2) {
      return `${principalsOnly[0].label} & ${principalsOnly[1].label}`;
    }
    const entity = principalsOnly.find(e => e.id === ownerId);
    return entity ? entity.label : 'Unknown';
  };

  const getJointOwnerDisplay = () => {
    if (principalsOnly.length >= 2) {
      return `${principalsOnly[0].label} & ${principalsOnly[1].label}`;
    }
    return 'Both principals';
  };

  const getAvailableBeneficiaries = () => {
    return beneficiaryEntities.filter(e => e.id !== currentItem?.owner);
  };

  const getAvailableReversionary = () => {
    return principalsOnly.filter(e => e.id !== currentItem?.owner);
  };

  const currentList = getCurrentList();
  const fundTypeLabel = mainTab === 'super' ? 'Superannuation' : mainTab === 'pension' ? 'Pension' : 'Annuity';

  return (
    <FactFindLayout currentSection="superannuation" factFind={factFind}>
      <FactFindHeader
        title="Superannuation"
        description="Record super funds, pensions, annuities, and beneficiaries."
        factFind={factFind}
        user={user}
      />

      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
          {/* ALWAYS VISIBLE: Top-level product tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => handleMainTabChange('super')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                mainTab === 'super' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Super
            </button>
            <button
              onClick={() => handleMainTabChange('pension')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                mainTab === 'pension' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Pension
            </button>
            <button
              onClick={() => handleMainTabChange('annuity')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                mainTab === 'annuity' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Annuity
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
                          {mainTab === 'super' && (
                            <>
                              <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Fund Name</th>
                              <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Product</th>
                            </>
                          )}
                          {mainTab === 'pension' && (
                            <>
                              <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Fund Name</th>
                              <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Product</th>
                              <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Pension Type</th>
                            </>
                          )}
                          {mainTab === 'annuity' && (
                            <>
                              <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Product</th>
                              <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Annuity Type</th>
                            </>
                          )}
                          <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Balance</th>
                          <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentList.map((item, index) => (
                          <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-medium text-slate-800">{getOwnerName(item.owner)}</td>
                            {mainTab === 'super' && (
                              <>
                                <td className="py-3 px-3 text-slate-600">{item.fund_name || 'N/A'}</td>
                                <td className="py-3 px-3 text-slate-600">{item.product || 'N/A'}</td>
                              </>
                            )}
                            {mainTab === 'pension' && (
                              <>
                                <td className="py-3 px-3 text-slate-600">{item.fund_name || 'N/A'}</td>
                                <td className="py-3 px-3 text-slate-600">{item.product || 'N/A'}</td>
                                <td className="py-3 px-3 text-slate-600">{item.pension_type || 'N/A'}</td>
                              </>
                            )}
                            {mainTab === 'annuity' && (
                              <>
                                <td className="py-3 px-3 text-slate-600">{item.product || 'N/A'}</td>
                                <td className="py-3 px-3 text-slate-600">{item.annuity_type || 'N/A'}</td>
                              </>
                            )}
                            <td className="py-3 px-3 text-right font-medium text-slate-800">
                              {item.balance || item.purchase_price ? 
                                `$${parseFloat(item.balance || item.purchase_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                                'N/A'}
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
                        Add {fundTypeLabel}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <div className="text-5xl mb-4">🏦</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Do you have any {mainTab === 'annuity' ? 'annuities' : `${fundTypeLabel.toLowerCase()}s`}?
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Add details about your {mainTab === 'annuity' ? 'annuities' : `${fundTypeLabel.toLowerCase()}s`}, balances, and beneficiaries.
                    </p>
                    <button
                      onClick={handleAddNew}
                      className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add First {fundTypeLabel}
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
                    {currentItem?.owner && (mainTab === 'super' ? currentItem.fund_name : currentItem.product) ? 
                      `${getOwnerName(currentItem.owner)} — ${mainTab === 'super' ? currentItem.fund_name : currentItem.product}` : 
                      `New ${fundTypeLabel}`}
                  </h3>
                </div>

                <div className="flex gap-2 mb-6">
                  {mainTab === 'super' && [
                    { id: 'fund_details', label: 'Fund Details' },
                    { id: 'contributions', label: 'Contributions' },
                    { id: 'tax_components', label: 'Tax Components' },
                    { id: 'beneficiaries', label: 'Beneficiaries' },
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

                  {mainTab === 'pension' && [
                    { id: 'fund_details', label: 'Fund Details' },
                    { id: 'income', label: 'Income' },
                    { id: 'tax_components', label: 'Tax Components' },
                    { id: 'beneficiaries', label: 'Beneficiaries' },
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

                  {mainTab === 'annuity' && [
                    { id: 'annuity_details', label: 'Annuity Details' },
                    { id: 'income', label: 'Income' },
                    { id: 'tax_components', label: 'Tax Components' },
                    { id: 'beneficiaries', label: 'Beneficiaries' }
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

                {/* SUPER TAB CONTENT */}
                {mainTab === 'super' && (
                  <>
                    {activeTab === 'fund_details' && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Fund name</label>
                          <input
                            type="text"
                            value={currentItem.fund_name}
                            onChange={(e) => setCurrentItem({ ...currentItem, fund_name: e.target.value })}
                            placeholder="e.g. Australian Super"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Product</label>
                          <input
                            type="text"
                            value={currentItem.product}
                            onChange={(e) => setCurrentItem({ ...currentItem, product: e.target.value })}
                            placeholder="e.g. MySuper"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Owner</label>
                          <select
                            value={currentItem.owner}
                            onChange={(e) => setCurrentItem({ ...currentItem, owner: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select owner…</option>
                            {principalsOnly.map(entity => (
                              <option key={entity.id} value={entity.id}>{entity.label}</option>
                            ))}
                          </select>
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

                    {activeTab === 'contributions' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Super guarantee?</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={currentItem.contributions.super_guarantee === 'yes'}
                                onChange={() => setCurrentItem({
                                  ...currentItem,
                                  contributions: { ...currentItem.contributions, super_guarantee: 'yes' }
                                })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Yes</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={currentItem.contributions.super_guarantee === 'no'}
                                onChange={() => setCurrentItem({
                                  ...currentItem,
                                  contributions: { ...currentItem.contributions, super_guarantee: 'no' }
                                })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">No</span>
                            </label>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Salary sacrifice</label>
                            <div className="flex items-center">
                              <span className="text-slate-500 mr-2">$</span>
                              <input
                                type="number"
                                value={currentItem.contributions.salary_sacrifice}
                                onChange={(e) => setCurrentItem({
                                  ...currentItem,
                                  contributions: { ...currentItem.contributions, salary_sacrifice: e.target.value }
                                })}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">After tax</label>
                            <div className="flex items-center">
                              <span className="text-slate-500 mr-2">$</span>
                              <input
                                type="number"
                                value={currentItem.contributions.after_tax}
                                onChange={(e) => setCurrentItem({
                                  ...currentItem,
                                  contributions: { ...currentItem.contributions, after_tax: e.target.value }
                                })}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Spouse received</label>
                            <div className="flex items-center">
                              <span className="text-slate-500 mr-2">$</span>
                              <input
                                type="number"
                                value={currentItem.contributions.spouse_received}
                                onChange={(e) => setCurrentItem({
                                  ...currentItem,
                                  contributions: { ...currentItem.contributions, spouse_received: e.target.value }
                                })}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Split received</label>
                            <div className="flex items-center">
                              <span className="text-slate-500 mr-2">$</span>
                              <input
                                type="number"
                                value={currentItem.contributions.split_received}
                                onChange={(e) => setCurrentItem({
                                  ...currentItem,
                                  contributions: { ...currentItem.contributions, split_received: e.target.value }
                                })}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Concessional contribution</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={currentItem.contributions.concessional}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                contributions: { ...currentItem.contributions, concessional: e.target.value }
                              })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'tax_components' && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">UNP amount</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={currentItem.tax_components.unp_amount}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                tax_components: { ...currentItem.tax_components, unp_amount: e.target.value }
                              })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Taxable portion</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={currentItem.tax_components.taxable_portion}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                tax_components: { ...currentItem.tax_components, taxable_portion: e.target.value }
                              })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Tax free portion</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={currentItem.tax_components.tax_free_portion}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                tax_components: { ...currentItem.tax_components, tax_free_portion: e.target.value }
                              })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'beneficiaries' && (
                      <div>
                        {currentItem.beneficiaries.length > 0 ? (
                          <div className="space-y-3">
                            {currentItem.beneficiaries.map((benef, index) => (
                              <div key={index} className="grid grid-cols-4 gap-3 items-end">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Beneficiary</label>
                                  <select
                                    value={benef.entity_id}
                                    onChange={(e) => {
                                      const updated = [...currentItem.beneficiaries];
                                      updated[index].entity_id = e.target.value;
                                      setCurrentItem({ ...currentItem, beneficiaries: updated });
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">Select…</option>
                                    {getAvailableBeneficiaries().map(entity => (
                                      <option key={entity.id} value={entity.id}>{entity.label} ({entity.type})</option>
                                    ))}
                                    <option value="estate">Estate</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                                  <select
                                    value={benef.type}
                                    onChange={(e) => {
                                      const updated = [...currentItem.beneficiaries];
                                      updated[index].type = e.target.value;
                                      setCurrentItem({ ...currentItem, beneficiaries: updated });
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">Select…</option>
                                    <option value="binding">Binding</option>
                                    <option value="non-binding">Non-binding</option>
                                    <option value="lapsing">Lapsing binding</option>
                                    <option value="non-lapsing">Non-lapsing binding</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Entitlement %</label>
                                  <input
                                    type="number"
                                    value={benef.entitlement}
                                    onChange={(e) => {
                                      const updated = [...currentItem.beneficiaries];
                                      updated[index].entitlement = e.target.value;
                                      setCurrentItem({ ...currentItem, beneficiaries: updated });
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
                                      const updated = currentItem.beneficiaries.filter((_, i) => i !== index);
                                      setCurrentItem({ ...currentItem, beneficiaries: updated });
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
                          <p className="text-sm text-slate-600 text-center py-6">No beneficiaries added yet</p>
                        )}
                        <div className="mt-4">
                          <button
                            onClick={() => setCurrentItem({
                              ...currentItem,
                              beneficiaries: [...currentItem.beneficiaries, { entity_id: '', type: '', entitlement: '' }]
                            })}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Beneficiary
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'portfolio' && (
                      <div>
                        {currentItem.portfolio.length > 0 ? (
                          <div className="space-y-3">
                            {currentItem.portfolio.map((item, index) => (
                              <div key={index} className="grid grid-cols-4 gap-3 items-end">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Asset name</label>
                                  <input
                                    type="text"
                                    value={item.asset_name}
                                    onChange={(e) => {
                                      const updated = [...currentItem.portfolio];
                                      updated[index].asset_name = e.target.value;
                                      setCurrentItem({ ...currentItem, portfolio: updated });
                                    }}
                                    placeholder="e.g. Balanced"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Allocation %</label>
                                  <input
                                    type="number"
                                    value={item.allocation_pct}
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
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Amount</label>
                                  <div className="flex items-center">
                                    <span className="text-slate-500 mr-2">$</span>
                                    <input
                                      type="number"
                                      value={item.amount}
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
                          <p className="text-sm text-slate-600 text-center py-6">No portfolio items added yet</p>
                        )}
                        <div className="mt-4">
                          <button
                            onClick={() => setCurrentItem({
                              ...currentItem,
                              portfolio: [...currentItem.portfolio, { asset_name: '', allocation_pct: '', amount: '' }]
                            })}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Asset
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* PENSION TAB CONTENT */}
                {mainTab === 'pension' && (
                  <>
                    {activeTab === 'fund_details' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Joint holding?</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={currentItem.joint_holding === true}
                                onChange={() => setCurrentItem({
                                  ...currentItem,
                                  joint_holding: true,
                                  owner: 'joint'
                                })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Yes</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={currentItem.joint_holding === false}
                                onChange={() => setCurrentItem({
                                  ...currentItem,
                                  joint_holding: false,
                                  owner: ''
                                })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">No</span>
                            </label>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Fund name</label>
                            <input
                              type="text"
                              value={currentItem.fund_name}
                              onChange={(e) => setCurrentItem({ ...currentItem, fund_name: e.target.value })}
                              placeholder="e.g. Australian Super"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Product</label>
                            <input
                              type="text"
                              value={currentItem.product}
                              onChange={(e) => setCurrentItem({ ...currentItem, product: e.target.value })}
                              placeholder="e.g. MySuper Pension"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Owner</label>
                            {currentItem.joint_holding ? (
                              <input
                                type="text"
                                value={getJointOwnerDisplay()}
                                disabled
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-100 text-slate-500"
                              />
                            ) : (
                              <select
                                value={currentItem.owner}
                                onChange={(e) => setCurrentItem({ ...currentItem, owner: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select owner…</option>
                                {principalsOnly.map(entity => (
                                  <option key={entity.id} value={entity.id}>{entity.label}</option>
                                ))}
                              </select>
                            )}
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
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Pension type</label>
                            <select
                              value={currentItem.pension_type}
                              onChange={(e) => setCurrentItem({ ...currentItem, pension_type: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select…</option>
                              <option value="account-based">Account-based pension</option>
                              <option value="ttr">Transition to retirement</option>
                              <option value="term-allocated">Term allocated pension</option>
                              <option value="lifetime">Lifetime pension</option>
                            </select>
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
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Purchase price</label>
                            <div className="flex items-center">
                              <span className="text-slate-500 mr-2">$</span>
                              <input
                                type="number"
                                value={currentItem.purchase_price}
                                onChange={(e) => setCurrentItem({ ...currentItem, purchase_price: e.target.value })}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Reversionary nominee</label>
                            <select
                              value={currentItem.reversionary_nominee}
                              onChange={(e) => setCurrentItem({ ...currentItem, reversionary_nominee: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select…</option>
                              {getAvailableReversionary().map(entity => (
                                <option key={entity.id} value={entity.id}>{entity.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'income' && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Annual pension income</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={currentItem.income.annual_income}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                income: { ...currentItem.income, annual_income: e.target.value }
                              })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Pension frequency</label>
                          <select
                            value={currentItem.income.frequency}
                            onChange={(e) => setCurrentItem({
                              ...currentItem,
                              income: { ...currentItem.income, frequency: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select…</option>
                            <option value="annual">Annual</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="monthly">Monthly</option>
                            <option value="fortnightly">Fortnightly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Minimum pension amount</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={currentItem.income.minimum}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                income: { ...currentItem.income, minimum: e.target.value }
                              })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Maximum pension amount</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={currentItem.income.maximum}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                income: { ...currentItem.income, maximum: e.target.value }
                              })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Tax-free percentage</label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={currentItem.income.tax_free_pct}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                income: { ...currentItem.income, tax_free_pct: e.target.value }
                              })}
                              placeholder="0"
                              min="0"
                              max="100"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-slate-500 ml-2">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Taxable percentage</label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={currentItem.income.taxable_pct}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                income: { ...currentItem.income, taxable_pct: e.target.value }
                              })}
                              placeholder="0"
                              min="0"
                              max="100"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-slate-500 ml-2">%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {(activeTab === 'tax_components' || activeTab === 'beneficiaries' || activeTab === 'portfolio') && (
                      <>
                        {activeTab === 'tax_components' && (
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">UNP amount</label>
                              <div className="flex items-center">
                                <span className="text-slate-500 mr-2">$</span>
                                <input
                                  type="number"
                                  value={currentItem.tax_components.unp_amount}
                                  onChange={(e) => setCurrentItem({
                                    ...currentItem,
                                    tax_components: { ...currentItem.tax_components, unp_amount: e.target.value }
                                  })}
                                  placeholder="0.00"
                                  step="0.01"
                                  min="0"
                                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Taxable portion</label>
                              <div className="flex items-center">
                                <span className="text-slate-500 mr-2">$</span>
                                <input
                                  type="number"
                                  value={currentItem.tax_components.taxable_portion}
                                  onChange={(e) => setCurrentItem({
                                    ...currentItem,
                                    tax_components: { ...currentItem.tax_components, taxable_portion: e.target.value }
                                  })}
                                  placeholder="0.00"
                                  step="0.01"
                                  min="0"
                                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Tax free portion</label>
                              <div className="flex items-center">
                                <span className="text-slate-500 mr-2">$</span>
                                <input
                                  type="number"
                                  value={currentItem.tax_components.tax_free_portion}
                                  onChange={(e) => setCurrentItem({
                                    ...currentItem,
                                    tax_components: { ...currentItem.tax_components, tax_free_portion: e.target.value }
                                  })}
                                  placeholder="0.00"
                                  step="0.01"
                                  min="0"
                                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'beneficiaries' && (
                          <div>
                            {currentItem.beneficiaries.length > 0 ? (
                              <div className="space-y-3">
                                {currentItem.beneficiaries.map((benef, index) => (
                                  <div key={index} className="grid grid-cols-4 gap-3 items-end">
                                    <div>
                                      <label className="block text-sm font-semibold text-slate-700 mb-2">Beneficiary</label>
                                      <select
                                        value={benef.entity_id}
                                        onChange={(e) => {
                                          const updated = [...currentItem.beneficiaries];
                                          updated[index].entity_id = e.target.value;
                                          setCurrentItem({ ...currentItem, beneficiaries: updated });
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      >
                                        <option value="">Select…</option>
                                        {getAvailableBeneficiaries().map(entity => (
                                          <option key={entity.id} value={entity.id}>{entity.label} ({entity.type})</option>
                                        ))}
                                        <option value="estate">Estate</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                                      <select
                                        value={benef.type}
                                        onChange={(e) => {
                                          const updated = [...currentItem.beneficiaries];
                                          updated[index].type = e.target.value;
                                          setCurrentItem({ ...currentItem, beneficiaries: updated });
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      >
                                        <option value="">Select…</option>
                                        <option value="binding">Binding</option>
                                        <option value="non-binding">Non-binding</option>
                                        <option value="lapsing">Lapsing binding</option>
                                        <option value="non-lapsing">Non-lapsing binding</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-semibold text-slate-700 mb-2">Entitlement %</label>
                                      <input
                                        type="number"
                                        value={benef.entitlement}
                                        onChange={(e) => {
                                          const updated = [...currentItem.beneficiaries];
                                          updated[index].entitlement = e.target.value;
                                          setCurrentItem({ ...currentItem, beneficiaries: updated });
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
                                          const updated = currentItem.beneficiaries.filter((_, i) => i !== index);
                                          setCurrentItem({ ...currentItem, beneficiaries: updated });
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
                              <p className="text-sm text-slate-600 text-center py-6">No beneficiaries added yet</p>
                            )}
                            <div className="mt-4">
                              <button
                                onClick={() => setCurrentItem({
                                  ...currentItem,
                                  beneficiaries: [...currentItem.beneficiaries, { entity_id: '', type: '', entitlement: '' }]
                                })}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                Add Beneficiary
                              </button>
                            </div>
                          </div>
                        )}

                        {activeTab === 'portfolio' && (
                          <div>
                            {currentItem.portfolio.length > 0 ? (
                              <div className="space-y-3">
                                {currentItem.portfolio.map((item, index) => (
                                  <div key={index} className="grid grid-cols-4 gap-3 items-end">
                                    <div>
                                      <label className="block text-sm font-semibold text-slate-700 mb-2">Asset name</label>
                                      <input
                                        type="text"
                                        value={item.asset_name}
                                        onChange={(e) => {
                                          const updated = [...currentItem.portfolio];
                                          updated[index].asset_name = e.target.value;
                                          setCurrentItem({ ...currentItem, portfolio: updated });
                                        }}
                                        placeholder="e.g. Balanced"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-semibold text-slate-700 mb-2">Allocation %</label>
                                      <input
                                        type="number"
                                        value={item.allocation_pct}
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
                                      <label className="block text-sm font-semibold text-slate-700 mb-2">Amount</label>
                                      <div className="flex items-center">
                                        <span className="text-slate-500 mr-2">$</span>
                                        <input
                                          type="number"
                                          value={item.amount}
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
                              <p className="text-sm text-slate-600 text-center py-6">No portfolio items added yet</p>
                            )}
                            <div className="mt-4">
                              <button
                                onClick={() => setCurrentItem({
                                  ...currentItem,
                                  portfolio: [...currentItem.portfolio, { asset_name: '', allocation_pct: '', amount: '' }]
                                })}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                Add Asset
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* ANNUITY TAB CONTENT */}
                {mainTab === 'annuity' && (
                  <>
                    {activeTab === 'annuity_details' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Joint holding?</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={currentItem.joint_holding === true}
                                onChange={() => setCurrentItem({
                                  ...currentItem,
                                  joint_holding: true,
                                  owner: 'joint'
                                })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Yes</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={currentItem.joint_holding === false}
                                onChange={() => setCurrentItem({
                                  ...currentItem,
                                  joint_holding: false,
                                  owner: ''
                                })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">No</span>
                            </label>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Product / Provider name</label>
                            <input
                              type="text"
                              value={currentItem.product}
                              onChange={(e) => setCurrentItem({ ...currentItem, product: e.target.value })}
                              placeholder="e.g. Challenger Guaranteed Income"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Owner</label>
                            {currentItem.joint_holding ? (
                              <input
                                type="text"
                                value={getJointOwnerDisplay()}
                                disabled
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-100 text-slate-500"
                              />
                            ) : (
                              <select
                                value={currentItem.owner}
                                onChange={(e) => setCurrentItem({ ...currentItem, owner: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select owner…</option>
                                {principalsOnly.map(entity => (
                                  <option key={entity.id} value={entity.id}>{entity.label}</option>
                                ))}
                              </select>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Annuity type</label>
                            <select
                              value={currentItem.annuity_type}
                              onChange={(e) => setCurrentItem({ ...currentItem, annuity_type: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select…</option>
                              <option value="fixed-term">Fixed term annuity</option>
                              <option value="lifetime">Lifetime annuity</option>
                              <option value="market-linked">Market-linked annuity</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Purchase price</label>
                            <div className="flex items-center">
                              <span className="text-slate-500 mr-2">$</span>
                              <input
                                type="number"
                                value={currentItem.purchase_price}
                                onChange={(e) => setCurrentItem({ ...currentItem, purchase_price: e.target.value })}
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
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Maturity date</label>
                            <input
                              type="date"
                              value={currentItem.maturity_date}
                              onChange={(e) => setCurrentItem({ ...currentItem, maturity_date: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Guaranteed period (years)</label>
                            <input
                              type="number"
                              value={currentItem.guaranteed_period}
                              onChange={(e) => setCurrentItem({ ...currentItem, guaranteed_period: e.target.value })}
                              placeholder="0"
                              min="0"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Residual capital value</label>
                            <div className="flex items-center">
                              <span className="text-slate-500 mr-2">$</span>
                              <input
                                type="number"
                                value={currentItem.residual_capital_value}
                                onChange={(e) => setCurrentItem({ ...currentItem, residual_capital_value: e.target.value })}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'income' && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Annual income amount</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={currentItem.income.annual_income}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                income: { ...currentItem.income, annual_income: e.target.value }
                              })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Payment frequency</label>
                          <select
                            value={currentItem.income.frequency}
                            onChange={(e) => setCurrentItem({
                              ...currentItem,
                              income: { ...currentItem.income, frequency: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select…</option>
                            <option value="annual">Annual</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="monthly">Monthly</option>
                            <option value="fortnightly">Fortnightly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Tax-free percentage</label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={currentItem.income.tax_free_pct}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                income: { ...currentItem.income, tax_free_pct: e.target.value }
                              })}
                              placeholder="0"
                              min="0"
                              max="100"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-slate-500 ml-2">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Taxable percentage</label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={currentItem.income.taxable_pct}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                income: { ...currentItem.income, taxable_pct: e.target.value }
                              })}
                              placeholder="0"
                              min="0"
                              max="100"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-slate-500 ml-2">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Deductible amount</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={currentItem.income.deductible_amount}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                income: { ...currentItem.income, deductible_amount: e.target.value }
                              })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'tax_components' && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">UNP amount</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={currentItem.tax_components.unp_amount}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                tax_components: { ...currentItem.tax_components, unp_amount: e.target.value }
                              })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Taxable portion</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={currentItem.tax_components.taxable_portion}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                tax_components: { ...currentItem.tax_components, taxable_portion: e.target.value }
                              })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Tax free portion</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={currentItem.tax_components.tax_free_portion}
                              onChange={(e) => setCurrentItem({
                                ...currentItem,
                                tax_components: { ...currentItem.tax_components, tax_free_portion: e.target.value }
                              })}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'beneficiaries' && (
                      <div>
                        {currentItem.beneficiaries.length > 0 ? (
                          <div className="space-y-3">
                            {currentItem.beneficiaries.map((benef, index) => (
                              <div key={index} className="grid grid-cols-4 gap-3 items-end">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Beneficiary</label>
                                  <select
                                    value={benef.entity_id}
                                    onChange={(e) => {
                                      const updated = [...currentItem.beneficiaries];
                                      updated[index].entity_id = e.target.value;
                                      setCurrentItem({ ...currentItem, beneficiaries: updated });
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">Select…</option>
                                    {getAvailableBeneficiaries().map(entity => (
                                      <option key={entity.id} value={entity.id}>{entity.label} ({entity.type})</option>
                                    ))}
                                    <option value="estate">Estate</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                                  <select
                                    value={benef.type}
                                    onChange={(e) => {
                                      const updated = [...currentItem.beneficiaries];
                                      updated[index].type = e.target.value;
                                      setCurrentItem({ ...currentItem, beneficiaries: updated });
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">Select…</option>
                                    <option value="binding">Binding</option>
                                    <option value="non-binding">Non-binding</option>
                                    <option value="lapsing">Lapsing binding</option>
                                    <option value="non-lapsing">Non-lapsing binding</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Entitlement %</label>
                                  <input
                                    type="number"
                                    value={benef.entitlement}
                                    onChange={(e) => {
                                      const updated = [...currentItem.beneficiaries];
                                      updated[index].entitlement = e.target.value;
                                      setCurrentItem({ ...currentItem, beneficiaries: updated });
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
                                      const updated = currentItem.beneficiaries.filter((_, i) => i !== index);
                                      setCurrentItem({ ...currentItem, beneficiaries: updated });
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
                          <p className="text-sm text-slate-600 text-center py-6">No beneficiaries added yet</p>
                        )}
                        <div className="mt-4">
                          <button
                            onClick={() => setCurrentItem({
                              ...currentItem,
                              beneficiaries: [...currentItem.beneficiaries, { entity_id: '', type: '', entitlement: '' }]
                            })}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Beneficiary
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
                    Save {fundTypeLabel}
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