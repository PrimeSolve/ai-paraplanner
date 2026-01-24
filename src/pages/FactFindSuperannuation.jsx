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
import { ArrowRight, ArrowLeft, MessageSquare, RefreshCw, Info, Plus, Trash2, Edit2, Wallet, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const accountTypes = [
  { id: 'superannuation', label: 'Superannuation', icon: '💰' },
  { id: 'pension', label: 'Pension', icon: '🏦' },
  { id: 'annuity', label: 'Annuities', icon: '📊' }
];

export default function FactFindSuperannuation() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('superannuation');
  const [activeOwner, setActiveOwner] = useState('client');
  const [accounts, setAccounts] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    type: 'superannuation',
    owner: 'client',
    fund_name: '',
    member_number: '',
    abn: '',
    usi: '',
    account_type: '',
    balance: '',
    contributions: '',
    investment_option: '',
    insurance_cover: '',
    beneficiary: '',
    pension_type: '',
    payment_amount: '',
    payment_frequency: '',
    commencement_date: '',
    annuity_provider: '',
    annuity_type: '',
    purchase_price: '',
    income_amount: '',
    term_years: '',
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
            if (finds[0].superannuation?.super_accounts) {
              setAccounts(finds[0].superannuation.super_accounts);
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

  const handleAddAccount = () => {
    if (!formData.fund_name && !formData.pension_type && !formData.annuity_provider) {
      toast.error('Please enter required information');
      return;
    }

    const accountData = { ...formData, type: activeTab, owner: activeOwner };

    if (editingIndex !== null) {
      const updated = [...accounts];
      updated[editingIndex] = accountData;
      setAccounts(updated);
      setEditingIndex(null);
    } else {
      setAccounts([...accounts, accountData]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: activeTab,
      owner: activeOwner,
      fund_name: '',
      member_number: '',
      abn: '',
      usi: '',
      account_type: '',
      balance: '',
      contributions: '',
      investment_option: '',
      insurance_cover: '',
      beneficiary: '',
      pension_type: '',
      payment_amount: '',
      payment_frequency: '',
      commencement_date: '',
      annuity_provider: '',
      annuity_type: '',
      purchase_price: '',
      income_amount: '',
      term_years: '',
      notes: ''
    });
  };

  const handleEdit = (index) => {
    setFormData(accounts[index]);
    setEditingIndex(index);
    setActiveTab(accounts[index].type);
    setActiveOwner(accounts[index].owner);
  };

  const handleDelete = (index) => {
    const updated = accounts.filter((_, i) => i !== index);
    setAccounts(updated);
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      const sectionsCompleted = factFind.sections_completed || [];
      if (!sectionsCompleted.includes('superannuation')) {
        sectionsCompleted.push('superannuation');
      }

      await base44.entities.FactFind.update(factFind.id, {
        superannuation: { super_accounts: accounts },
        current_section: 'investment',
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

  if (loading) {
    return (
      <FactFindLayout currentSection="superannuation" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const filteredAccounts = accounts.filter(a => a.type === activeTab && a.owner === activeOwner);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (editingIndex === null) {
      setFormData({ ...formData, type: newTab });
    }
  };

  return (
    <FactFindLayout currentSection="superannuation" factFind={factFind}>
      <FactFindHeader
        title="Superannuation + Pension + Annuities"
        description="Record super funds, pensions, and annuities."
        tabs={accountTypes}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        factFind={factFind}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="w-full space-y-4">
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
              activeTab === 'superannuation' && "bg-gradient-to-r from-green-600 to-emerald-600",
              activeTab === 'pension' && "bg-gradient-to-r from-blue-600 to-cyan-600",
              activeTab === 'annuity' && "bg-gradient-to-r from-purple-600 to-pink-600"
            )}>
              <h4 className="font-bold text-white">
                {editingIndex !== null ? `Edit ${activeTab}` : `Add a ${activeTab}`}
              </h4>
            </div>
            <CardContent className="p-6 space-y-4">
              {activeTab === 'superannuation' && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Fund name</Label>
                      <Input
                        value={formData.fund_name}
                        onChange={(e) => setFormData({ ...formData, fund_name: e.target.value })}
                        placeholder="Enter fund name"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Member number</Label>
                      <Input
                        value={formData.member_number}
                        onChange={(e) => setFormData({ ...formData, member_number: e.target.value })}
                        placeholder="Enter member number"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">ABN</Label>
                      <Input
                        value={formData.abn}
                        onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                        placeholder="Enter ABN"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">USI (Unique Superannuation Identifier)</Label>
                      <Input
                        value={formData.usi}
                        onChange={(e) => setFormData({ ...formData, usi: e.target.value })}
                        placeholder="Enter USI"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Account type</Label>
                      <Select value={formData.account_type} onValueChange={(value) => setFormData({ ...formData, account_type: value })}>
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accumulation">Accumulation</SelectItem>
                          <SelectItem value="defined_benefit">Defined benefit</SelectItem>
                          <SelectItem value="transition_to_retirement">Transition to retirement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Current balance ($)</Label>
                      <Input
                        type="number"
                        value={formData.balance}
                        onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Annual contributions ($)</Label>
                      <Input
                        type="number"
                        value={formData.contributions}
                        onChange={(e) => setFormData({ ...formData, contributions: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Investment option</Label>
                      <Input
                        value={formData.investment_option}
                        onChange={(e) => setFormData({ ...formData, investment_option: e.target.value })}
                        placeholder="e.g., Balanced, Growth"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Insurance cover</Label>
                      <Input
                        value={formData.insurance_cover}
                        onChange={(e) => setFormData({ ...formData, insurance_cover: e.target.value })}
                        placeholder="e.g., Life, TPD, Income protection"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Beneficiary</Label>
                      <Input
                        value={formData.beneficiary}
                        onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
                        placeholder="Enter beneficiary name(s)"
                        className="border-slate-300"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'pension' && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Pension type</Label>
                      <Select value={formData.pension_type} onValueChange={(value) => setFormData({ ...formData, pension_type: value })}>
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="account_based">Account-based pension</SelectItem>
                          <SelectItem value="allocated">Allocated pension</SelectItem>
                          <SelectItem value="transition_to_retirement">Transition to retirement</SelectItem>
                          <SelectItem value="defined_benefit">Defined benefit pension</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Fund name</Label>
                      <Input
                        value={formData.fund_name}
                        onChange={(e) => setFormData({ ...formData, fund_name: e.target.value })}
                        placeholder="Enter fund name"
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Payment amount ($)</Label>
                      <Input
                        type="number"
                        value={formData.payment_amount}
                        onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Payment frequency</Label>
                      <Select value={formData.payment_frequency} onValueChange={(value) => setFormData({ ...formData, payment_frequency: value })}>
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Current balance ($)</Label>
                      <Input
                        type="number"
                        value={formData.balance}
                        onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Commencement date</Label>
                      <Input
                        type="date"
                        value={formData.commencement_date}
                        onChange={(e) => setFormData({ ...formData, commencement_date: e.target.value })}
                        className="border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">Beneficiary</Label>
                    <Input
                      value={formData.beneficiary}
                      onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
                      placeholder="Enter beneficiary name(s)"
                      className="border-slate-300"
                    />
                  </div>
                </>
              )}

              {activeTab === 'annuity' && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Annuity provider</Label>
                      <Input
                        value={formData.annuity_provider}
                        onChange={(e) => setFormData({ ...formData, annuity_provider: e.target.value })}
                        placeholder="Enter provider name"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Annuity type</Label>
                      <Select value={formData.annuity_type} onValueChange={(value) => setFormData({ ...formData, annuity_type: value })}>
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed_term">Fixed term</SelectItem>
                          <SelectItem value="lifetime">Lifetime</SelectItem>
                          <SelectItem value="indexed">Indexed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Purchase price ($)</Label>
                      <Input
                        type="number"
                        value={formData.purchase_price}
                        onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                        placeholder="0"
                        className="border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Annual income amount ($)</Label>
                      <Input
                        type="number"
                        value={formData.income_amount}
                        onChange={(e) => setFormData({ ...formData, income_amount: e.target.value })}
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
                      <Label className="text-slate-700 font-semibold text-sm">Commencement date</Label>
                      <Input
                        type="date"
                        value={formData.commencement_date}
                        onChange={(e) => setFormData({ ...formData, commencement_date: e.target.value })}
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
                  onClick={handleAddAccount}
                  className={cn(
                    "text-white",
                    activeTab === 'superannuation' && "bg-green-600 hover:bg-green-700",
                    activeTab === 'pension' && "bg-blue-600 hover:bg-blue-700",
                    activeTab === 'annuity' && "bg-purple-600 hover:bg-purple-700"
                  )}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingIndex !== null ? 'Update' : 'Add'} {activeTab}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Empty State or List */}
          {filteredAccounts.length === 0 ? (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                  activeTab === 'superannuation' && "bg-green-100",
                  activeTab === 'pension' && "bg-blue-100",
                  activeTab === 'annuity' && "bg-purple-100"
                )}>
                  {activeTab === 'superannuation' && <Wallet className="w-8 h-8 text-green-600" />}
                  {activeTab === 'pension' && <DollarSign className="w-8 h-8 text-blue-600" />}
                  {activeTab === 'annuity' && <DollarSign className="w-8 h-8 text-purple-600" />}
                </div>
                <h4 className="font-bold text-slate-800 mb-2">
                  No {activeTab} accounts added yet
                </h4>
                <p className="text-sm text-slate-600 mb-4">
                  Add your first {activeTab} account using the form above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 shadow-sm">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-3">
                <h4 className="font-bold text-white capitalize">
                  {activeOwner}'s {activeTab} ({filteredAccounts.length})
                </h4>
              </div>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {filteredAccounts.map((account, index) => {
                    const globalIndex = accounts.findIndex(a => a === account);
                    return (
                      <div
                        key={index}
                        className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-slate-800">
                              {account.fund_name || account.pension_type || account.annuity_provider}
                            </span>
                            {account.balance && (
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-semibold",
                                activeTab === 'superannuation' && "bg-green-100 text-green-700",
                                activeTab === 'pension' && "bg-blue-100 text-blue-700",
                                activeTab === 'annuity' && "bg-purple-100 text-purple-700"
                              )}>
                                ${parseFloat(account.balance).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
                            {account.member_number && <span><strong>Member:</strong> {account.member_number}</span>}
                            {account.account_type && <span><strong>Type:</strong> {account.account_type}</span>}
                            {account.payment_amount && <span><strong>Payment:</strong> ${parseFloat(account.payment_amount).toLocaleString()}</span>}
                            {account.payment_frequency && <span><strong>Frequency:</strong> {account.payment_frequency}</span>}
                            {account.purchase_price && <span><strong>Purchase:</strong> ${parseFloat(account.purchase_price).toLocaleString()}</span>}
                            {account.income_amount && <span><strong>Income:</strong> ${parseFloat(account.income_amount).toLocaleString()}</span>}
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