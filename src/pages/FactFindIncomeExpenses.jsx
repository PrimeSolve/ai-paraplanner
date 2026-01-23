import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, MessageSquare, RefreshCw, Info, Plus, Trash2, Edit2, DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'income', label: 'Income', icon: '💰' },
  { id: 'expenses', label: 'Expenses', icon: '📋' }
];

export default function FactFindIncomeExpenses() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('income');
  const [activeOwner, setActiveOwner] = useState('client');
  
  // Income state
  const [incomeData, setIncomeData] = useState({
    client: {
      gross_salary: '',
      super_included: 'exclude',
      fringe_benefits_value: '',
      expected_bonus: '',
      has_fringe_benefits: 'no',
      annual_salary_increase: '',
      has_non_taxable: 'no',
      adjustments: []
    },
    partner: {
      gross_salary: '',
      super_included: 'exclude',
      fringe_benefits_value: '',
      expected_bonus: '',
      has_fringe_benefits: 'no',
      annual_salary_increase: '',
      has_non_taxable: 'no',
      adjustments: []
    }
  });

  // Expenses state
  const [expensesData, setExpensesData] = useState({
    annual_savings: '',
    discretionary_spending: '',
    spending_frequency: '',
    adjustments: []
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    type: '',
    adjustment_type: '',
    start_year: '',
    end_year: '',
    amount: '',
    description: ''
  });
  const [editingAdjustmentIndex, setEditingAdjustmentIndex] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (id) {
          const finds = await base44.entities.FactFind.filter({ id });
          if (finds[0]) {
            setFactFind(finds[0]);
            if (finds[0].income_expenses?.income_sources) {
              setIncomeData(finds[0].income_expenses.income_sources);
            }
            if (finds[0].income_expenses?.expenses) {
              setExpensesData(finds[0].income_expenses.expenses);
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

  const handleAddAdjustment = () => {
    if (activeTab === 'income') {
      if (!adjustmentForm.adjustment_type || !adjustmentForm.start_year) {
        toast.error('Please fill in required fields');
        return;
      }

      const updated = { ...incomeData };
      if (editingAdjustmentIndex !== null) {
        updated[activeOwner].adjustments[editingAdjustmentIndex] = adjustmentForm;
      } else {
        updated[activeOwner].adjustments.push(adjustmentForm);
      }
      setIncomeData(updated);
    } else {
      if (!adjustmentForm.amount || !adjustmentForm.start_year) {
        toast.error('Please fill in required fields');
        return;
      }

      const updated = { ...expensesData };
      if (editingAdjustmentIndex !== null) {
        updated.adjustments[editingAdjustmentIndex] = adjustmentForm;
      } else {
        updated.adjustments.push(adjustmentForm);
      }
      setExpensesData(updated);
    }

    resetAdjustmentForm();
  };

  const resetAdjustmentForm = () => {
    setAdjustmentForm({
      type: '',
      adjustment_type: '',
      start_year: '',
      end_year: '',
      amount: '',
      description: ''
    });
    setEditingAdjustmentIndex(null);
  };

  const handleEditAdjustment = (index) => {
    if (activeTab === 'income') {
      setAdjustmentForm(incomeData[activeOwner].adjustments[index]);
    } else {
      setAdjustmentForm(expensesData.adjustments[index]);
    }
    setEditingAdjustmentIndex(index);
  };

  const handleDeleteAdjustment = (index) => {
    if (activeTab === 'income') {
      const updated = { ...incomeData };
      updated[activeOwner].adjustments = updated[activeOwner].adjustments.filter((_, i) => i !== index);
      setIncomeData(updated);
    } else {
      const updated = { ...expensesData };
      updated.adjustments = updated.adjustments.filter((_, i) => i !== index);
      setExpensesData(updated);
    }
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      const sectionsCompleted = factFind.sections_completed || [];
      if (!sectionsCompleted.includes('income_expenses')) {
        sectionsCompleted.push('income_expenses');
      }

      await base44.entities.FactFind.update(factFind.id, {
        income_expenses: {
          income_sources: incomeData,
          expenses: expensesData
        },
        current_section: 'insurance',
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

  if (loading) {
    return (
      <FactFindLayout currentSection="income_expenses" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const currentAdjustments = activeTab === 'income' 
    ? incomeData[activeOwner].adjustments 
    : expensesData.adjustments;

  return (
    <FactFindLayout currentSection="income_expenses" factFind={factFind}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-1">Income & Expenses</h3>
            <p className="text-sm text-slate-600">
              Record current details and add any future adjustments.
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
            <Link to={createPageUrl('FactFindAssistant') + (factFind?.id ? `?id=${factFind.id}` : '')}>
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/30"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Talk to Assistant
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setEditingAdjustmentIndex(null);
                resetAdjustmentForm();
              }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-4">
          {activeTab === 'income' ? (
            <>
              {/* Owner Selection */}
              <div className="flex items-center justify-between bg-slate-100 border border-slate-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800 text-sm">Owner:</span>
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
              </div>

              {/* Income Form */}
              <Card className="border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 rounded-t-lg">
                  <h4 className="font-bold text-white capitalize">
                    {activeOwner} Income Information
                  </h4>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">What is your gross salary?</Label>
                      <Input
                        type="number"
                        value={incomeData[activeOwner].gross_salary}
                        onChange={(e) => setIncomeData({
                          ...incomeData,
                          [activeOwner]: { ...incomeData[activeOwner], gross_salary: e.target.value }
                        })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Superannuation included?</Label>
                      <Select 
                        value={incomeData[activeOwner].super_included}
                        onValueChange={(value) => setIncomeData({
                          ...incomeData,
                          [activeOwner]: { ...incomeData[activeOwner], super_included: value }
                        })}
                      >
                        <SelectTrigger className="border-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="include">Include super</SelectItem>
                          <SelectItem value="exclude">Exclude super</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Value of fringe benefits ($)</Label>
                      <Input
                        type="number"
                        value={incomeData[activeOwner].fringe_benefits_value}
                        onChange={(e) => setIncomeData({
                          ...incomeData,
                          [activeOwner]: { ...incomeData[activeOwner], fringe_benefits_value: e.target.value }
                        })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Expected bonus income ($)</Label>
                      <Input
                        type="number"
                        value={incomeData[activeOwner].expected_bonus}
                        onChange={(e) => setIncomeData({
                          ...incomeData,
                          [activeOwner]: { ...incomeData[activeOwner], expected_bonus: e.target.value }
                        })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Do you receive any fringe benefits?</Label>
                      <Select 
                        value={incomeData[activeOwner].has_fringe_benefits}
                        onValueChange={(value) => setIncomeData({
                          ...incomeData,
                          [activeOwner]: { ...incomeData[activeOwner], has_fringe_benefits: value }
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
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Expected salary increase each year (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={incomeData[activeOwner].annual_salary_increase}
                        onChange={(e) => setIncomeData({
                          ...incomeData,
                          [activeOwner]: { ...incomeData[activeOwner], annual_salary_increase: e.target.value }
                        })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Is any of your salary non-taxable?</Label>
                    <Select 
                      value={incomeData[activeOwner].has_non_taxable}
                      onValueChange={(value) => setIncomeData({
                        ...incomeData,
                        [activeOwner]: { ...incomeData[activeOwner], has_non_taxable: value }
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
                </CardContent>
              </Card>

              {/* Future Income Adjustments */}
              <Card className="border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 rounded-t-lg">
                  <h4 className="font-bold text-white">Future Income Adjustments</h4>
                </div>
                <CardContent className="p-6 space-y-4">
                  {editingAdjustmentIndex === null && (
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-xs">Adjustment type</Label>
                          <Select 
                            value={adjustmentForm.adjustment_type}
                            onValueChange={(value) => setAdjustmentForm({ ...adjustmentForm, adjustment_type: value })}
                          >
                            <SelectTrigger className="border-slate-300 h-9 text-sm">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="salary_increase">Salary increase</SelectItem>
                              <SelectItem value="bonus">Bonus</SelectItem>
                              <SelectItem value="career_break">Career break</SelectItem>
                              <SelectItem value="parental_leave">Parental leave</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-xs">Amount ($)</Label>
                          <Input
                            type="number"
                            value={adjustmentForm.amount}
                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                            placeholder="0"
                            className="border-slate-300 h-9 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-xs">Start year</Label>
                          <Input
                            type="number"
                            value={adjustmentForm.start_year}
                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, start_year: e.target.value })}
                            placeholder="2026"
                            className="border-slate-300 h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-xs">End year (optional)</Label>
                          <Input
                            type="number"
                            value={adjustmentForm.end_year}
                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, end_year: e.target.value })}
                            placeholder="2030"
                            className="border-slate-300 h-9 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddAdjustment}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="w-3 h-3 mr-2" />
                          Add Adjustment
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentAdjustments.length === 0 && editingAdjustmentIndex === null ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                      <h5 className="font-bold text-slate-800 text-sm mb-1">No income adjustments yet</h5>
                      <p className="text-xs text-slate-600">
                        Add future changes to income like salary increases, bonuses, career breaks, or parental leave.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Adjustment type</th>
                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Start year</th>
                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">End year</th>
                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {currentAdjustments.map((adj, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-xs text-slate-800 capitalize">{adj.adjustment_type?.replace('_', ' ')}</td>
                              <td className="px-3 py-2 text-xs text-slate-600">{adj.start_year}</td>
                              <td className="px-3 py-2 text-xs text-slate-600">{adj.end_year || '-'}</td>
                              <td className="px-3 py-2">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditAdjustment(index)}
                                    className="border-slate-300 h-7 px-2"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteAdjustment(index)}
                                    className="border-red-300 text-red-600 hover:bg-red-50 h-7 px-2"
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
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Expenses Form */}
              <Card className="border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 rounded-t-lg">
                  <h4 className="font-bold text-white">Expense Information</h4>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">How much do you currently save per annum? ($)</Label>
                      <Input
                        type="number"
                        value={expensesData.annual_savings}
                        onChange={(e) => setExpensesData({ ...expensesData, annual_savings: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Estimated discretionary spending ($)</Label>
                      <Input
                        type="number"
                        value={expensesData.discretionary_spending}
                        onChange={(e) => setExpensesData({ ...expensesData, discretionary_spending: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Spending frequency</Label>
                    <Select 
                      value={expensesData.spending_frequency}
                      onValueChange={(value) => setExpensesData({ ...expensesData, spending_frequency: value })}
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="fortnightly">Fortnightly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Future Expense Adjustments */}
              <Card className="border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-t-lg">
                  <h4 className="font-bold text-white">Future Expense Adjustments</h4>
                </div>
                <CardContent className="p-6 space-y-4">
                  {editingAdjustmentIndex === null && (
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-xs">Adjustment description</Label>
                          <Input
                            value={adjustmentForm.description}
                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, description: e.target.value })}
                            placeholder="e.g., Major purchase, lifestyle change"
                            className="border-slate-300 h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-xs">Adjustment amount ($)</Label>
                          <Input
                            type="number"
                            value={adjustmentForm.amount}
                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                            placeholder="0"
                            className="border-slate-300 h-9 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-xs">Start year</Label>
                          <Input
                            type="number"
                            value={adjustmentForm.start_year}
                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, start_year: e.target.value })}
                            placeholder="2026"
                            className="border-slate-300 h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-xs">End year (optional)</Label>
                          <Input
                            type="number"
                            value={adjustmentForm.end_year}
                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, end_year: e.target.value })}
                            placeholder="2030"
                            className="border-slate-300 h-9 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddAdjustment}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Plus className="w-3 h-3 mr-2" />
                          Add Adjustment
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentAdjustments.length === 0 && editingAdjustmentIndex === null ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                        <DollarSign className="w-6 h-6 text-purple-600" />
                      </div>
                      <h5 className="font-bold text-slate-800 text-sm mb-1">No expense adjustments yet</h5>
                      <p className="text-xs text-slate-600">
                        Add future changes to expenses like major purchases, lifestyle changes, or planned reductions.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Adjustment amount</th>
                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Start year</th>
                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">End year</th>
                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {currentAdjustments.map((adj, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-xs text-slate-800 font-semibold">
                                ${parseFloat(adj.amount || 0).toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-600">{adj.start_year}</td>
                              <td className="px-3 py-2 text-xs text-slate-600">{adj.end_year || '-'}</td>
                              <td className="px-3 py-2">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditAdjustment(index)}
                                    className="border-slate-300 h-7 px-2"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteAdjustment(index)}
                                    className="border-red-300 text-red-600 hover:bg-red-50 h-7 px-2"
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
                  )}
                </CardContent>
              </Card>
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