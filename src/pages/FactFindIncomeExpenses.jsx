import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { useFactFind } from '@/components/factfind/useFactFind';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Edit2, Trash2, Plus } from 'lucide-react';
import EntityDot from '../components/factfind/EntityDot';

/**
 * Map API IncomeDto field names → frontend i_* field names.
 * API returns: { gross_salary, income_type, salary_sacrifice, fbt_exempt, employer }
 * Frontend uses: { i_gross, i_type, i_super_inc, i_fbt, employer }
 * Handles both API format and legacy frontend format (backward compat).
 */
function mapApiIncomeToFrontend(apiIncome) {
  if (!apiIncome || Object.keys(apiIncome).length === 0) return apiIncome;
  return {
    ...apiIncome,
    // Map API → frontend (use API value if present, fall back to existing i_* value)
    i_type:      apiIncome.income_type != null ? String(apiIncome.income_type) : (apiIncome.i_type || ''),
    i_gross:     apiIncome.gross_salary != null ? String(apiIncome.gross_salary) : (apiIncome.i_gross || ''),
    i_super_inc: apiIncome.salary_sacrifice != null ? String(apiIncome.salary_sacrifice) : (apiIncome.i_super_inc || '2'),
    i_fbt:       apiIncome.fbt_exempt != null ? (apiIncome.fbt_exempt ? '1' : '2') : (apiIncome.i_fbt || '2'),
    i_fbt_value: apiIncome.i_fbt_value || '',
    i_bonus:     apiIncome.i_bonus || '',
    i_increase:  apiIncome.i_increase || '',
    i_nontax:    apiIncome.i_nontax || '2',
    i_pay_freq:  apiIncome.i_pay_freq || '',
    employer:    apiIncome.employer || '',
  };
}

/**
 * Map API ExpenseDto field names → frontend e_* field names.
 * API returns: { amount, frequency, category, is_joint }
 * Frontend uses: { e_disc, e_freq, e_save, e_budget }
 */
function mapApiExpenseToFrontend(apiExpense) {
  if (!apiExpense || Object.keys(apiExpense).length === 0) return apiExpense;
  return {
    ...apiExpense,
    e_disc:   apiExpense.amount != null ? String(apiExpense.amount) : (apiExpense.e_disc || ''),
    e_freq:   apiExpense.frequency || apiExpense.e_freq || '',
    e_save:   apiExpense.e_save || '',
    e_budget: apiExpense.e_budget || '',
  };
}

export default function FactFindIncomeExpenses() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading, updateSection } = useFactFind();
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('inc');
  const [activePerson, setActivePerson] = useState('c1');


  const hasUserEdited = useRef(false);

  const [clientFields, setClientFields] = useState({});
  const [partnerFields, setPartnerFields] = useState({});
  const [expenseFields, setExpenseFields] = useState({});

  const [clientAdjustments, setClientAdjustments] = useState([]);
  const [partnerAdjustments, setPartnerAdjustments] = useState([]);
  const [expenseAdjustments, setExpenseAdjustments] = useState([]);

  const [editingIncomeAdj, setEditingIncomeAdj] = useState(null);
  const [editingExpenseAdj, setEditingExpenseAdj] = useState(null);

  // Determine if partner exists from Personal section (read-only)
  const hasPartner = factFind?.client1_profile?.partner?.first_name ? true : false;

  const principalNames = useMemo(() => {
    const clientName = factFind?.client1_profile?.first_name
      ? `${factFind.client1_profile.first_name} ${factFind.client1_profile.last_name || ''}`.trim()
      : 'Client';
    const partnerName = factFind?.client1_profile?.partner?.first_name
      ? `${factFind.client1_profile.partner.first_name} ${factFind.client1_profile.partner.last_name || ''}`.trim()
      : 'Partner';
    return { client: clientName, partner: partnerName };
  }, [factFind?.id]);

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
    // Read income/expense data from the API's client1Profile structure.
    // API returns IncomeDto fields (gross_salary, income_type, salary_sacrifice, fbt_exempt)
    // but the frontend forms use i_* prefixed names (i_gross, i_type, i_super_inc, i_fbt).
    // Map API field names → frontend field names on load.
    const incomes = factFind?.client1_profile?.incomes || [];
    const expenses = factFind?.client1_profile?.expenses || [];

    if (incomes.length || expenses.length) {
      // First income record is client, second (if present) is partner
      const clientIncome = mapApiIncomeToFrontend(incomes[0] || {});
      const partnerIncome = mapApiIncomeToFrontend(incomes[1] || {});
      const expenseData = mapApiExpenseToFrontend(expenses[0] || {});

      // Separate adjustments from the flat field objects
      const { adjustments: clientAdj, ...cFields } = clientIncome;
      const { adjustments: partnerAdj, ...pFields } = partnerIncome;
      const { adjustments: expAdj, ...eFields } = expenseData;

      setClientFields(cFields);
      setPartnerFields(pFields);
      setExpenseFields(eFields);

      setClientAdjustments(clientAdj || []);
      setPartnerAdjustments(partnerAdj || []);
      setExpenseAdjustments(expAdj || []);

      setCurrentTab('inc');
      setActivePerson('c1');
    }
  }, [factFind?.id]);

  // Build the save payload (shared by auto-save and save-before-nav)
  // Uses snake_case keys so the proxy's snakeToCamelKeys converts to API's camelCase
  const buildIncomeExpensesPayload = useCallback(() => {
    console.log('[IncomeExpenses] buildIncomeExpensesPayload called');
    console.log('[IncomeExpenses] clientFields:', JSON.stringify(clientFields));
    console.log('[IncomeExpenses] partnerFields:', JSON.stringify(partnerFields));
    console.log('[IncomeExpenses] expenseFields:', JSON.stringify(expenseFields));
    const incomes = [
      { ...clientFields, adjustments: clientAdjustments }
    ];
    if (hasPartner) {
      incomes.push({ ...partnerFields, adjustments: partnerAdjustments });
    }
    const expenses = [
      { ...expenseFields, adjustments: expenseAdjustments }
    ];
    const payload = { incomes, expenses };
    console.log('[IncomeExpenses] PAYLOAD returned:', JSON.stringify(payload, null, 2));
    return payload;
  }, [clientFields, partnerFields, expenseFields, clientAdjustments, partnerAdjustments, expenseAdjustments, hasPartner]);

  const buildIncomeExpensesPayloadRef = useRef(null);
  buildIncomeExpensesPayloadRef.current = buildIncomeExpensesPayload;

  // Auto-save on field changes (debounced 1.5s)
  const [dataLoaded, setDataLoaded] = useState(false);
  useEffect(() => {
    if (!factFind?.id) return;
    const t = setTimeout(() => setDataLoaded(true), 200);
    return () => clearTimeout(t);
  }, [factFind?.id]);

  useEffect(() => {
    if (!factFind?.id || !dataLoaded || !hasUserEdited.current) {
      console.log(`[IncomeExpenses] auto-save SKIP: id=${!!factFind?.id}, dataLoaded=${dataLoaded}, hasUserEdited=${hasUserEdited.current}`);
      return;
    }
    console.log('[IncomeExpenses] auto-save effect triggered, will fire in 1.5s');
    const timeoutId = setTimeout(async () => {
      const payload = buildIncomeExpensesPayloadRef.current();
      console.log('[IncomeExpenses] AUTO-SAVE firing with payload:', JSON.stringify(payload, null, 2));
      try {
        await updateSection('Client1FactFind', payload);
        console.log('[IncomeExpenses] AUTO-SAVE completed');
      } catch (error) {
        console.error('Auto-save income/expenses failed:', error);
      }
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [factFind?.id, dataLoaded, clientFields, partnerFields, expenseFields, clientAdjustments, partnerAdjustments, expenseAdjustments, updateSection]);

  const updateClientField = useCallback((field, value) => {
    console.log(`[IncomeExpenses] updateClientField("${field}", "${value}")`);
    hasUserEdited.current = true;
    setClientFields(prev => {
      const next = { ...prev, [field]: value };
      console.log('[IncomeExpenses] clientFields after update:', JSON.stringify(next));
      return next;
    });
  }, []);

  const updatePartnerField = useCallback((field, value) => {
    hasUserEdited.current = true;
    setPartnerFields(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateExpenseField = useCallback((field, value) => {
    hasUserEdited.current = true;
    setExpenseFields(prev => ({ ...prev, [field]: value }));
  }, []);

  // Income adjustments
  const addIncomeAdjustment = () => {
    setEditingIncomeAdj({ adj_type: '', adj_amount: '', adj_start: '', adj_end: '', adj_notes: '' });
  };

  const saveIncomeAdjustment = () => {
    if (!editingIncomeAdj) return;
    hasUserEdited.current = true;

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
    hasUserEdited.current = true;
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
    hasUserEdited.current = true;

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
    hasUserEdited.current = true;
    setExpenseAdjustments(prev => prev.filter((_, i) => i !== index));
  };

  const getAdjustmentTypeLabel = (value) => {
    const types = { '1': 'Salary', '2': 'Fringe benefits', '3': 'Non taxable income', '4': 'Bonus income', '5': 'Inheritance/windfall', '1000': 'Business turnover' };
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

      await updateSection('Client1FactFind', buildIncomeExpensesPayloadRef.current());

      await base44.entities.FactFind.update(factFind.id, {
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
      <FactFindLayout currentSection="income_expenses" factFindId={factFind?.id}>
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
    <FactFindLayout currentSection="income_expenses" factFindId={factFind?.id}>
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
               className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                 currentTab === 'inc'
                   ? 'bg-blue-50 text-blue-700 border border-blue-200'
                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
               }`}
             >
               <span>💵</span>
               Income
             </button>
             <button
               onClick={() => setCurrentTab('exp')}
               className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                 currentTab === 'exp'
                   ? 'bg-blue-50 text-blue-700 border border-blue-200'
                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
               }`}
             >
               <span>🧾</span>
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
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                          activePerson === 'c1'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <EntityDot color="#3B82F6" />
                        {principalNames.client}
                      </button>
                      {hasPartner && (
                        <button
                          onClick={() => setActivePerson('c2')}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                            activePerson === 'c2'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <EntityDot color="#8B5CF6" />
                          {principalNames.partner}
                        </button>
                      )}
                    </div>
                  </div>
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
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Income type</label>
                      <select
                        value={currentPersonFields.i_type || ''}
                        onChange={(e) => updatePersonField('i_type', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        <option value="employment">Employment</option>
                        <option value="business">Business / Self-employed</option>
                        <option value="investment">Investment</option>
                        <option value="rental">Rental</option>
                        <option value="pension">Pension</option>
                        <option value="government">Government benefit</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Gross salary / income</label>
                      <input
                        type="text"
                        value={currentPersonFields.i_gross || ''}
                        onChange={(e) => updatePersonField('i_gross', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
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
                    <button onClick={addIncomeAdjustment} className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors">
                      <Plus className="w-4 h-4" />
                      Add First Adjustment
                    </button>
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
                    <Card className="border-slate-200 shadow-sm">
                      <div className="px-6 py-3 border-b border-slate-200">
                        <h4 className="font-bold text-slate-800">Income adjustment details</h4>
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
                            <option value="5">Inheritance/windfall</option>
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
                    <button onClick={addIncomeAdjustment} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors w-full">
                      <Plus className="w-4 h-4" />
                      Add Another Adjustment
                    </button>
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
                    <button onClick={addExpenseAdjustment} className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors">
                      <Plus className="w-4 h-4" />
                      Add First Adjustment
                    </button>
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
                    <Card className="border-slate-200 shadow-sm">
                      <div className="px-6 py-3 border-b border-slate-200">
                        <h4 className="font-bold text-slate-800">Expense adjustment details</h4>
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
                    <button onClick={addExpenseAdjustment} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors w-full">
                      <Plus className="w-4 h-4" />
                      Add Another Adjustment
                    </button>
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