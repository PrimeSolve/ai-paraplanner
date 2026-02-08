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
  const { factFind, loading: ffLoading } = useFactFind();
  const principalsOnly = useFactFindEntities(factFind, { types: ['Principal'] });
  const beneficiaryEntities = useFactFindEntities(factFind, { types: ['Principal', 'Dependant'] });
  
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('summary'); // 'summary' | 'detail'
  const [editingIndex, setEditingIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('fund_details');
  const [funds, setFunds] = useState([]);
  
  // Current fund being edited
  const [currentFund, setCurrentFund] = useState({
    id: '',
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

  // Load user
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

  // Load funds from factFind
  useEffect(() => {
    if (factFind?.superannuation?.funds) {
      setFunds(factFind.superannuation.funds);
    }
  }, [factFind?.superannuation?.funds]);

  // Save to database
  const saveFunds = useCallback(async (updatedFunds) => {
    if (!factFind?.id) return;
    try {
      await base44.entities.FactFind.update(factFind.id, {
        superannuation: {
          funds: updatedFunds
        }
      });
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [factFind?.id]);

  // Add new fund
  const handleAddNew = () => {
    setCurrentFund({
      id: `fund_${Date.now()}`,
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
    setEditingIndex(null);
    setActiveTab('fund_details');
    setView('detail');
  };

  // Edit existing fund
  const handleEdit = (index) => {
    setCurrentFund(JSON.parse(JSON.stringify(funds[index])));
    setEditingIndex(index);
    setActiveTab('fund_details');
    setView('detail');
  };

  // Remove fund
  const handleRemove = async (index) => {
    const updated = funds.filter((_, i) => i !== index);
    setFunds(updated);
    await saveFunds(updated);
    toast.success('Fund removed');
  };

  // Save current fund
  const handleSaveCurrentFund = async () => {
    let updated;
    if (editingIndex !== null) {
      // Update existing
      updated = [...funds];
      updated[editingIndex] = currentFund;
    } else {
      // Add new
      updated = [...funds, currentFund];
    }
    
    setFunds(updated);
    await saveFunds(updated);
    setView('summary');
    toast.success(editingIndex !== null ? 'Fund updated' : 'Fund added');
  };

  // Back to summary
  const handleBackToSummary = () => {
    setView('summary');
    setCurrentFund({
      id: '',
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
  };

  // Add beneficiary
  const handleAddBeneficiary = () => {
    setCurrentFund({
      ...currentFund,
      beneficiaries: [
        ...currentFund.beneficiaries,
        { entity_id: '', type: '', entitlement: '' }
      ]
    });
  };

  // Remove beneficiary
  const handleRemoveBeneficiary = (index) => {
    setCurrentFund({
      ...currentFund,
      beneficiaries: currentFund.beneficiaries.filter((_, i) => i !== index)
    });
  };

  // Add portfolio item
  const handleAddPortfolio = () => {
    setCurrentFund({
      ...currentFund,
      portfolio: [
        ...currentFund.portfolio,
        { asset_name: '', allocation_pct: '', amount: '' }
      ]
    });
  };

  // Remove portfolio item
  const handleRemovePortfolio = (index) => {
    setCurrentFund({
      ...currentFund,
      portfolio: currentFund.portfolio.filter((_, i) => i !== index)
    });
  };

  // Navigation
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
        superannuation: { funds },
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

  // Get owner name for display
  const getOwnerName = (ownerId) => {
    const entity = principalsOnly.find(e => e.id === ownerId);
    return entity ? entity.label : 'Unknown';
  };

  // Filter beneficiaries excluding owner
  const getAvailableBeneficiaries = () => {
    return beneficiaryEntities.filter(e => e.id !== currentFund.owner);
  };

  return (
    <FactFindLayout currentSection="superannuation" factFind={factFind}>
      <FactFindHeader
        title="Superannuation"
        description="Record super funds, contributions, and beneficiaries."
        factFind={factFind}
        user={user}
      />

      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
          {view === 'summary' ? (
            <>
              {/* Summary Table */}
              {funds.length > 0 ? (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Owner</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Fund Name</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Product</th>
                          <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Balance</th>
                          <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {funds.map((fund, index) => (
                          <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-medium text-slate-800">{getOwnerName(fund.owner)}</td>
                            <td className="py-3 px-3 text-slate-600">{fund.fund_name || 'N/A'}</td>
                            <td className="py-3 px-3 text-slate-600">{fund.product || 'N/A'}</td>
                            <td className="py-3 px-3 text-right font-medium text-slate-800">
                              {fund.balance ? `$${parseFloat(fund.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
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
                        Add Superannuation
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <div className="text-5xl mb-4">🏦</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Do you have any superannuation funds?
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Add details about your superannuation funds, balances, and contributions.
                    </p>
                    <button
                      onClick={handleAddNew}
                      className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Fund
                    </button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <>
              {/* Detail View */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  {/* Header with back button */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                    <button
                      onClick={handleBackToSummary}
                      className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <ArrowLeftCircle className="w-4 h-4" />
                      Back to Summary
                    </button>
                    <h3 className="text-lg font-bold text-slate-900">
                      {currentFund.owner && currentFund.fund_name ? 
                        `${getOwnerName(currentFund.owner)} — ${currentFund.fund_name}` : 
                        'New Fund'}
                    </h3>
                  </div>

                  {/* Sub-tabs */}
                  <div className="flex gap-2 mb-6">
                    {[
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
                          activeTab === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="space-y-4">
                    {activeTab === 'fund_details' && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Fund name</label>
                          <input
                            type="text"
                            value={currentFund.fund_name}
                            onChange={(e) => setCurrentFund({ ...currentFund, fund_name: e.target.value })}
                            placeholder="e.g. Australian Super"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Product</label>
                          <input
                            type="text"
                            value={currentFund.product}
                            onChange={(e) => setCurrentFund({ ...currentFund, product: e.target.value })}
                            placeholder="e.g. MySuper"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Owner</label>
                          <select
                            value={currentFund.owner}
                            onChange={(e) => setCurrentFund({ ...currentFund, owner: e.target.value })}
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
                              value={currentFund.balance}
                              onChange={(e) => setCurrentFund({ ...currentFund, balance: e.target.value })}
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
                                checked={currentFund.contributions.super_guarantee === 'yes'}
                                onChange={() => setCurrentFund({
                                  ...currentFund,
                                  contributions: { ...currentFund.contributions, super_guarantee: 'yes' }
                                })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Yes</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={currentFund.contributions.super_guarantee === 'no'}
                                onChange={() => setCurrentFund({
                                  ...currentFund,
                                  contributions: { ...currentFund.contributions, super_guarantee: 'no' }
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
                                value={currentFund.contributions.salary_sacrifice}
                                onChange={(e) => setCurrentFund({
                                  ...currentFund,
                                  contributions: { ...currentFund.contributions, salary_sacrifice: e.target.value }
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
                                value={currentFund.contributions.after_tax}
                                onChange={(e) => setCurrentFund({
                                  ...currentFund,
                                  contributions: { ...currentFund.contributions, after_tax: e.target.value }
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
                                value={currentFund.contributions.spouse_received}
                                onChange={(e) => setCurrentFund({
                                  ...currentFund,
                                  contributions: { ...currentFund.contributions, spouse_received: e.target.value }
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
                                value={currentFund.contributions.split_received}
                                onChange={(e) => setCurrentFund({
                                  ...currentFund,
                                  contributions: { ...currentFund.contributions, split_received: e.target.value }
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
                              value={currentFund.contributions.concessional}
                              onChange={(e) => setCurrentFund({
                                ...currentFund,
                                contributions: { ...currentFund.contributions, concessional: e.target.value }
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
                              value={currentFund.tax_components.unp_amount}
                              onChange={(e) => setCurrentFund({
                                ...currentFund,
                                tax_components: { ...currentFund.tax_components, unp_amount: e.target.value }
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
                              value={currentFund.tax_components.taxable_portion}
                              onChange={(e) => setCurrentFund({
                                ...currentFund,
                                tax_components: { ...currentFund.tax_components, taxable_portion: e.target.value }
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
                              value={currentFund.tax_components.tax_free_portion}
                              onChange={(e) => setCurrentFund({
                                ...currentFund,
                                tax_components: { ...currentFund.tax_components, tax_free_portion: e.target.value }
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
                        {currentFund.beneficiaries.length > 0 ? (
                          <div className="space-y-3">
                            {currentFund.beneficiaries.map((benef, index) => (
                              <div key={index} className="grid grid-cols-4 gap-3 items-end">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Beneficiary</label>
                                  <select
                                    value={benef.entity_id}
                                    onChange={(e) => {
                                      const updated = [...currentFund.beneficiaries];
                                      updated[index].entity_id = e.target.value;
                                      setCurrentFund({ ...currentFund, beneficiaries: updated });
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
                                      const updated = [...currentFund.beneficiaries];
                                      updated[index].type = e.target.value;
                                      setCurrentFund({ ...currentFund, beneficiaries: updated });
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
                                      const updated = [...currentFund.beneficiaries];
                                      updated[index].entitlement = e.target.value;
                                      setCurrentFund({ ...currentFund, beneficiaries: updated });
                                    }}
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <button
                                    onClick={() => handleRemoveBeneficiary(index)}
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
                            onClick={handleAddBeneficiary}
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
                        {currentFund.portfolio.length > 0 ? (
                          <div className="space-y-3">
                            {currentFund.portfolio.map((item, index) => (
                              <div key={index} className="grid grid-cols-4 gap-3 items-end">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Asset name</label>
                                  <input
                                    type="text"
                                    value={item.asset_name}
                                    onChange={(e) => {
                                      const updated = [...currentFund.portfolio];
                                      updated[index].asset_name = e.target.value;
                                      setCurrentFund({ ...currentFund, portfolio: updated });
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
                                      const updated = [...currentFund.portfolio];
                                      updated[index].allocation_pct = e.target.value;
                                      setCurrentFund({ ...currentFund, portfolio: updated });
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
                                        const updated = [...currentFund.portfolio];
                                        updated[index].amount = e.target.value;
                                        setCurrentFund({ ...currentFund, portfolio: updated });
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
                                    onClick={() => handleRemovePortfolio(index)}
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
                            onClick={handleAddPortfolio}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Asset
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Save button for detail view */}
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <Button
                      onClick={handleSaveCurrentFund}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                    >
                      Save Fund
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Navigation */}
          {view === 'summary' && (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Button onClick={handleBack} variant="outline" disabled={saving} className="border-slate-300">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : null}
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