import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { useFactFind } from '../components/factfind/useFactFind';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Edit2, Trash2, Plus } from 'lucide-react';

export default function FactFindIncomeExpenses() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading } = useFactFind();
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('inc');
  const [activePerson, setActivePerson] = useState('c1');
  const [hasPartner, setHasPartner] = useState(false);

  const [clientFields, setClientFields] = useState({});
  const [partnerFields, setPartnerFields] = useState({});
  const [expenseFields, setExpenseFields] = useState({});

  const [clientAdjustments, setClientAdjustments] = useState([]);
  const [partnerAdjustments, setPartnerAdjustments] = useState([]);
  const [expenseAdjustments, setExpenseAdjustments] = useState([]);

  const [editingIncomeAdj, setEditingIncomeAdj] = useState(null);
  const [editingExpenseAdj, setEditingExpenseAdj] = useState(null);

  const getClientName = useCallback(() => {
    if (factFind?.personal?.client?.first_name) {
      return `${factFind.personal.client.first_name} ${factFind.personal.client.last_name || ''}`.trim();
    }
    return 'Client';
  }, [factFind]);

  const getPartnerName = useCallback(() => {
    if (factFind?.personal?.partner?.first_name) {
      return `${factFind.personal.partner.first_name} ${factFind.personal.partner.last_name || ''}`.trim();
    }
    return 'Partner';
  }, [factFind]);

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
    if (factFind?.income) {
      const incomeData = factFind.income;
      setCurrentTab(incomeData.currentTab || 'inc');
      setActivePerson(incomeData.activePerson || 'c1');
      setHasPartner(incomeData.hasPartner || false);

      setClientFields(incomeData.client?.fields || {});
      setPartnerFields(incomeData.partner?.fields || {});
      setExpenseFields(incomeData.expenses?.fields || {});

      setClientAdjustments(incomeData.client?.adjustments || []);
      setPartnerAdjustments(incomeData.partner?.adjustments || []);
      setExpenseAdjustments(incomeData.expenses?.adjustments || []);
    }
  }, [factFind]);



  const handleAddPartner = () => {
    setHasPartner(true);
    setActivePerson('c2');
  };

  const updateClientField = useCallback((field, value) => {
    setClientFields(prev => ({ ...prev, [field]: value }));
  }, []);

  const updatePartnerField = useCallback((field, value) => {
    setPartnerFields(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateExpenseField = useCallback((field, value) => {
    setExpenseFields(prev => ({ ...prev, [field]: value }));
  }, []);

  // Income adjustments
  const addIncomeAdjustment = () => {
    setEditingIncomeAdj({ adj_type: '', adj_amount: '', adj_start: '', adj_end: '', adj_notes: '' });
  };

  const saveIncomeAdjustment = () => {
    if (!editingIncomeAdj) return;

    if (activePerson === 'c1') {
      if (editingIncomeAdj.index !== undefined) {
        setClientAdjustments(prev => prev.map((adj, i) => i === editingIncomeAdj.index ? { ...editingIncomeAdj } : adj));
      } else {
        setClientAdjustments(prev => [...prev, editingIncomeAdj]);
      }
    } else {
      if (editingIncomeAdj.index !== undefined) {
        setPartnerAdjustments(prev => prev.map((adj, i) => i === editingIncomeAdj.index ? { ...editingIncomeAdj } : adj));
      } else {
        setPartnerAdjustments(prev => [...prev, editingIncomeAdj]);
      }
    }
    setEditingIncomeAdj(null);
  };

  const editIncomeAdjustmentAt = (index) => {
    const adj = activePerson === 'c1' ? clientAdjustments[index] : partnerAdjustments[index];
    setEditingIncomeAdj({ ...adj, index });
  };

  const deleteIncomeAdjustmentAt = (index) => {
    if (activePerson === 'c1') {
      setClientAdjustments(prev => prev.filter((_, i) => i !== index));
    } else {
      setPartnerAdjustments(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Expense adjustments
  const addExpenseAdjustment = () => {
    setEditingExpenseAdj({ e_adj_type: '', e_adj_amount: '', e_adj_start: '', e_adj_end: '', e_adj_notes: '' });
  };

  const saveExpenseAdjustment = () => {
    if (!editingExpenseAdj) return;

    if (editingExpenseAdj.index !== undefined) {
      setExpenseAdjustments(prev => prev.map((adj, i) => i === editingExpenseAdj.index ? { ...editingExpenseAdj } : adj));
    } else {
      setExpenseAdjustments(prev => [...prev, editingExpenseAdj]);
    }
    setEditingExpenseAdj(null);
  };

  const editExpenseAdjustmentAt = (index) => {
    setEditingExpenseAdj({ ...expenseAdjustments[index], index });
  };

  const deleteExpenseAdjustmentAt = (index) => {
    setExpenseAdjustments(prev => prev.filter((_, i) => i !== index));
  };

  const getAdjustmentTypeLabel = (value) => {
    const types = { '1': 'Salary', '2': 'Fringe benefits', '3': 'Non taxable income', '4': 'Bonus income', '1000': 'Business turnover' };
    return types[value] || '-';
  };

  const getExpenseAdjTypeLabel = (value) => {
    const types = { '1': 'Home & Contents', '2': 'Personal & Medical', '3': 'Transport & Auto', '4': 'Entertainment', '5': 'Insurance', '6': 'Debt servicing' };
    return types[value] || '-';
  };

  const handleNext = async () => {
    if (!factFind?.id) {
      toast.error('Unable to save data');
      return;
    }

    setSaving(true);
    try {
      const sectionsCompleted = [...(factFind.sections_completed || [])];
      if (!sectionsCompleted.includes('income_expenses')) {
        sectionsCompleted.push('income_expenses');
      }

      await base44.entities.FactFind.update(factFind.id, {
        income: {
          currentTab,
          activePerson,
          hasPartner,
          client: { fields: clientFields, adjustments: clientAdjustments },
          partner: { fields: partnerFields, adjustments: partnerAdjustments },
          expenses: { fields: expenseFields, adjustments: expenseAdjustments }
        },
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindInsurance') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindAssetsLiabilities') + `?id=${factFind?.id || ''}`);
  };

  if (ffLoading) {
    return (
      <FactFindLayout currentSection="income_expenses" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const currentAdjustments = activePerson === 'c1' ? clientAdjustments : partnerAdjustments;
  const currentPersonFields = activePerson === 'c1' ? clientFields : partnerFields;
  const updatePersonField = activePerson === 'c1' ? updateClientField : updatePartnerField;

  return (
    <FactFindLayout currentSection="income_expenses" factFind={factFind}>
      <FactFindHeader
        title="Income & Expenses"
        description="Record current details and add any future adjustments."
        factFind={factFind}
        user={user}
      />

      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
           {/* Tabs - Part of form content */}
           <div className="flex gap-2">
             <button
               onClick={() => setCurrentTab('inc')}
               className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                 currentTab === 'inc'
                   ? 'bg-blue-600 text-white'
                   : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
               }`}
             >
               Income
             </button>
             <button
               onClick={() => setCurrentTab('exp')}
               className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                 currentTab === 'exp'
                   ? 'bg-blue-600 text-white'
                   : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
               }`}
             >
               Expenses
             </button>
           </div>

           {/* CLIENT/PARTNER BAR (INCOME ONLY) */}
          {currentTab === 'inc' && (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="font-bold text-slate-800">Income information</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActivePerson('c1')}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                          activePerson === 'c1'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {getClientName()}
                      </button>
                      <button
                        onClick={() => setActivePerson('c2')}
                        disabled={!hasPartner}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                          activePerson === 'c2'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {getPartnerName()}
                      </button>
                    </div>
                  </div>
                  {!hasPartner && (
                    <Button onClick={handleAddPartner} variant="outline" size="sm" className="border-slate-300">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      Add Partner
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* INCOME TAB */}
          {currentTab === 'inc' && (
            <>
              {/* INCOME FIELDS */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">What is your gross salary?</label>
                    <input
                      type="text"
                      value={currentPersonFields.i_gross || ''}
                      onChange={(e) => updatePersonField('i_gross', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Superannuation included?</label>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`i_super_inc_${activePerson}`}
                            value="1"
                            checked={currentPersonFields.i_super_inc === '1'}
                            onChange={(e) => updatePersonField('i_super_inc', e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-slate-700">Include super</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`i_super_inc_${activePerson}`}
                            value="2"
                            checked={currentPersonFields.i_super_inc === '2'}
                            onChange={(e) => updatePersonField('i_super_inc', e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-slate-700">Exclude super</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Value of fringe benefits</label>
                      <div className="flex items-center">
                        <span className="text-slate-500 mr-2">$</span>
                        <input
                          type="number"
                          value={currentPersonFields.i_fbt_value || ''}
                          onChange={(e) => updatePersonField('i_fbt_value', e.target.value)}
                          step="0.01"
                          min="0"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Expected bonus income</label>
                      <div className="flex items-center">
                        <span className="text-slate-500 mr-2">$</span>
                        <input
                          type="number"
                          value={currentPersonFields.i_bonus || ''}
                          onChange={(e) => updatePersonField('i_bonus', e.target.value)}
                          step="0.01"
                          min="0"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Do you receive any fringe benefits</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`i_fbt_${activePerson}`}
                            value="1"
                            checked={currentPersonFields.i_fbt === '1'}
                            onChange={(e) => updatePersonField('i_fbt', e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-slate-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`i_fbt_${activePerson}`}
                            value="2"
                            checked={currentPersonFields.i_fbt === '2'}
                            onChange={(e) => updatePersonField('i_fbt', e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-slate-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">How much do you expect your salary to increase each year</label>
                    <input
                      type="text"
                      value={currentPersonFields.i_increase || ''}
                      onChange={(e) => updatePersonField('i_increase', e.target.value)}
                      placeholder="e.g. 3%"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Is any of your salary non-taxable?</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`i_nontax_${activePerson}`}
                            value="1"
                            checked={currentPersonFields.i_nontax === '1'}
                            onChange={(e) => updatePersonField('i_nontax', e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-slate-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`i_nontax_${activePerson}`}
                            value="2"
                            checked={currentPersonFields.i_nontax === '2'}
                            onChange={(e) => updatePersonField('i_nontax', e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-slate-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* INCOME ADJUSTMENTS */}
              {currentAdjustments.length === 0 && !editingIncomeAdj ? (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <div className="text-6xl mb-6">📊</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No income adjustments yet</h3>
                    <p className="text-slate-600 mb-8">Add future changes to income like salary increases, bonuses, career breaks, or parental leave.</p>
                    <Button onClick={addIncomeAdjustment} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Adjustment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {currentAdjustments.length > 0 && (
                    <Card className="border-slate-200 shadow-sm">
                      <div className="bg-slate-100 border-b border-slate-200 px-6 py-3">
                        <h4 className="font-bold text-slate-800">📊 Income Adjustments ({currentAdjustments.length})</h4>
                      </div>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Adjustment type</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Start year</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">End year</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {currentAdjustments.map((adj, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 font-medium text-slate-800">{getAdjustmentTypeLabel(adj.adj_type)}</td>
                                  <td className="px-4 py-3 text-slate-600">{adj.adj_start || '-'}</td>
                                  <td className="px-4 py-3 text-slate-600">{adj.adj_end || '-'}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" onClick={() => editIncomeAdjustmentAt(idx)} className="border-slate-300"><Edit2 className="w-3 h-3" /></Button>
                                      <Button variant="outline" size="sm" onClick={() => deleteIncomeAdjustmentAt(idx)} className="border-red-300 text-red-600 hover:bg-red-50"><Trash2 className="w-3 h-3" /></Button>
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

                  {editingIncomeAdj && (
                    <Card className="border-slate-200 shadow-sm border-blue-300 bg-blue-50/50">
                      <div className="bg-blue-600 px-6 py-3 rounded-t-lg">
                        <h4 className="font-bold text-white">✏️ Income adjustment details</h4>
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Adjustment type</label>
                          <select
                            value={editingIncomeAdj.adj_type}
                            onChange={(e) => setEditingIncomeAdj({ ...editingIncomeAdj, adj_type: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select adjustment type…</option>
                            <option value="1">Salary</option>
                            <option value="2">Fringe benefits</option>
                            <option value="3">Non taxable income</option>
                            <option value="4">Bonus income</option>
                            <option value="1000">Business turnover</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Amount (if applicable)</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={editingIncomeAdj.adj_amount}
                              onChange={(e) => setEditingIncomeAdj({ ...editingIncomeAdj, adj_amount: e.target.value })}
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Start year</label>
                            <input
                              type="number"
                              value={editingIncomeAdj.adj_start}
                              onChange={(e) => setEditingIncomeAdj({ ...editingIncomeAdj, adj_start: e.target.value })}
                              min="2024"
                              max="2100"
                              placeholder="YYYY"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">End year</label>
                            <input
                              type="number"
                              value={editingIncomeAdj.adj_end}
                              onChange={(e) => setEditingIncomeAdj({ ...editingIncomeAdj, adj_end: e.target.value })}
                              min="2024"
                              max="2100"
                              placeholder="YYYY"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                          <input
                            type="text"
                            value={editingIncomeAdj.adj_notes}
                            onChange={(e) => setEditingIncomeAdj({ ...editingIncomeAdj, adj_notes: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex justify-end gap-3">
                          <Button onClick={() => setEditingIncomeAdj(null)} variant="outline" className="border-slate-300">
                            Cancel
                          </Button>
                          <Button onClick={saveIncomeAdjustment} className="bg-blue-600 hover:bg-blue-700 text-white">
                            Save Adjustment
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!editingIncomeAdj && (
                    <Button onClick={addIncomeAdjustment} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Adjustment
                    </Button>
                  )}
                </>
              )}
            </>
          )}

          {/* EXPENSES TAB */}
          {currentTab === 'exp' && (
            <>
              {/* EXPENSE FIELDS */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">How much do you currently save per annum?</label>
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-2">$</span>
                      <input
                        type="number"
                        value={expenseFields.e_save || ''}
                        onChange={(e) => updateExpenseField('e_save', e.target.value)}
                        step="0.01"
                        min="0"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Estimated discretionary spending</label>
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-2">$</span>
                      <input
                        type="number"
                        value={expenseFields.e_disc || ''}
                        onChange={(e) => updateExpenseField('e_disc', e.target.value)}
                        step="0.01"
                        min="0"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Spending frequency</label>
                    <select
                      value={expenseFields.e_freq || ''}
                      onChange={(e) => updateExpenseField('e_freq', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select…</option>
                      <option value="1">Weekly</option>
                      <option value="2">Fortnightly</option>
                      <option value="3">Monthly</option>
                      <option value="4">Quarterly</option>
                      <option value="5">Annual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Upload budget</label>
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          updateExpenseField('e_budget', e.target.files[0].name);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* EXPENSE ADJUSTMENTS */}
              {expenseAdjustments.length === 0 && !editingExpenseAdj ? (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <div className="text-6xl mb-6">💰</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No expense adjustments yet</h3>
                    <p className="text-slate-600 mb-8">Add future changes to expenses like major purchases, lifestyle changes, or planned reductions.</p>
                    <Button onClick={addExpenseAdjustment} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Adjustment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {expenseAdjustments.length > 0 && (
                    <Card className="border-slate-200 shadow-sm">
                      <div className="bg-slate-100 border-b border-slate-200 px-6 py-3">
                        <h4 className="font-bold text-slate-800">💰 Expense Adjustments ({expenseAdjustments.length})</h4>
                      </div>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Adjustment amount</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Start year</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">End year</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {expenseAdjustments.map((adj, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 font-semibold text-slate-800">
                                    {adj.e_adj_amount ? `$${parseFloat(adj.e_adj_amount).toLocaleString()}` : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">{adj.e_adj_start || '-'}</td>
                                  <td className="px-4 py-3 text-slate-600">{adj.e_adj_end || '-'}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" onClick={() => editExpenseAdjustmentAt(idx)} className="border-slate-300"><Edit2 className="w-3 h-3" /></Button>
                                      <Button variant="outline" size="sm" onClick={() => deleteExpenseAdjustmentAt(idx)} className="border-red-300 text-red-600 hover:bg-red-50"><Trash2 className="w-3 h-3" /></Button>
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

                  {editingExpenseAdj && (
                    <Card className="border-slate-200 shadow-sm border-blue-300 bg-blue-50/50">
                      <div className="bg-blue-600 px-6 py-3 rounded-t-lg">
                        <h4 className="font-bold text-white">✏️ Expense adjustment details</h4>
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Adjustment type</label>
                          <select
                            value={editingExpenseAdj.e_adj_type}
                            onChange={(e) => setEditingExpenseAdj({ ...editingExpenseAdj, e_adj_type: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select adjustment type…</option>
                            <option value="1">Home & Contents</option>
                            <option value="2">Personal & Medical</option>
                            <option value="3">Transport & Auto</option>
                            <option value="4">Entertainment</option>
                            <option value="5">Insurance</option>
                            <option value="6">Debt servicing</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Adjustment amount</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={editingExpenseAdj.e_adj_amount}
                              onChange={(e) => setEditingExpenseAdj({ ...editingExpenseAdj, e_adj_amount: e.target.value })}
                              step="0.01"
                              min="0"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Start year</label>
                            <input
                              type="number"
                              value={editingExpenseAdj.e_adj_start}
                              onChange={(e) => setEditingExpenseAdj({ ...editingExpenseAdj, e_adj_start: e.target.value })}
                              min="2024"
                              max="2100"
                              placeholder="YYYY"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">End year</label>
                            <input
                              type="number"
                              value={editingExpenseAdj.e_adj_end}
                              onChange={(e) => setEditingExpenseAdj({ ...editingExpenseAdj, e_adj_end: e.target.value })}
                              min="2024"
                              max="2100"
                              placeholder="YYYY"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                          <input
                            type="text"
                            value={editingExpenseAdj.e_adj_notes}
                            onChange={(e) => setEditingExpenseAdj({ ...editingExpenseAdj, e_adj_notes: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex justify-end gap-3">
                          <Button onClick={() => setEditingExpenseAdj(null)} variant="outline" className="border-slate-300">
                            Cancel
                          </Button>
                          <Button onClick={saveExpenseAdjustment} className="bg-blue-600 hover:bg-blue-700 text-white">
                            Save Adjustment
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!editingExpenseAdj && (
                    <Button onClick={addExpenseAdjustment} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Adjustment
                    </Button>
                  )}
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