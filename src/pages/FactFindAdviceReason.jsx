import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { useFactFind } from '../components/factfind/useFactFind';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Target, Plus, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'reasons', label: 'Reasons', icon: '📋' },
  { id: 'objectives', label: 'Objectives', icon: '🎯' }
];

const OBJECTIVE_SUB_TABS = [
  { id: 'retirement', label: 'Retirement', icon: '🎯' },
  { id: 'estate', label: 'Estate', icon: '🏛️' },
  { id: 'protection', label: 'Wealth Protection', icon: '🛡️' },
  { id: 'products', label: 'Financial Products', icon: '💼' },
  { id: 'detailed', label: 'Detailed Objectives', icon: '📊' }
];

const REASONS_GROUPS = [
  {
    title: 'Wealth creation',
    items: [
      { label: 'Portfolio advice', value: '6' },
      { label: 'Investment property', value: '4' },
      { label: 'Wealth creation strategies', value: '3' }
    ]
  },
  {
    title: 'Wealth protection',
    items: [
      { label: 'Review insurance needs', value: '7' },
      { label: 'Review insurance policies', value: '8' }
    ]
  },
  {
    title: 'Tax/Cashflow',
    items: [
      { label: 'How to minimise personal income tax', value: '1' },
      { label: 'Advice on tax structures', value: '2' },
      { label: 'Budgeting advice', value: '3' }
    ]
  },
  {
    title: 'Debt management',
    items: [
      { label: 'Debt restructuring', value: '12' },
      { label: 'Review debt levels', value: '13' },
      { label: 'Borrowing to invest', value: '14' },
      { label: 'Borrowing to invest within superannuation', value: '15' }
    ]
  },
  {
    title: 'Retirement products',
    items: [
      { label: 'Review superannuation products', value: '16' },
      { label: 'Self Managed Superannuation Funds (SMSF)', value: '17' },
      { label: 'Defined benefit superannuation schemes', value: '18' },
      { label: 'Retirement income stream strategies', value: '19' }
    ]
  },
  {
    title: 'Lifestyle',
    items: [
      { label: 'Minimise child care/nanny costs', value: '20' },
      { label: 'Establish retirement timeframe', value: '21' },
      { label: 'Review impact of reducing work', value: '22' },
      { label: 'Principal residence property purchase', value: '23' }
    ]
  },
  {
    title: 'Social security / Aged care',
    items: [
      { label: 'Review aged care options', value: '24' },
      { label: 'Maximise social security entitlement', value: '25' }
    ]
  }
];

const PROTECTION_CHECKBOXES = [
  { label: 'Provide for your family in the event of your death', field: 'ins_death', value: '52' },
  { label: 'Protect yourself and your family in the event of Total & Permanent Disablement', field: 'ins_tpd', value: '53' },
  { label: 'Protect yourself and your family in the event of temporary illness', field: 'ins_income', value: '54' },
  { label: 'Protect your family against unforseen medical costs arising from a specific illness', field: 'ins_trauma', value: '57' },
  { label: 'Protect your assets against creditors', field: 'ins_creditors', value: '58' },
  { label: "Guarantee that a portion of your assets can't lose money", field: 'ins_guarantee', value: '59' }
];

const SUPER_FEATURES = [
  { label: 'Access to a low cost product', field: 'super_lowcost', value: '1' },
  { label: 'Access to a product that offers low cost investment options', field: 'super_lowcost_inv', value: '2' },
  { label: 'Access to top performing investment managers', field: 'super_top_mgr', value: '3' },
  { label: 'Access to term deposits', field: 'super_term', value: '4' },
  { label: 'Access to direct shares - Australian', field: 'super_shares_au', value: '7' },
  { label: 'Access to direct shares - International', field: 'super_shares_int', value: '8' },
  { label: 'Access to broad investment menu', field: 'super_broad', value: '9' },
  { label: 'Access to socially responsible investments', field: 'super_sri', value: '10' },
  { label: 'Access to model portfolios', field: 'super_model', value: '11' },
  { label: 'Access to lifecycle investment strategy', field: 'super_lifecycle', value: '12' },
  { label: 'Automatic rebalancing back to your preferred risk profile', field: 'super_rebalance', value: '13' },
  { label: 'Able to make tax effective contributions to the product', field: 'super_taxeff', value: '14' },
  { label: 'Ability to make regular investment switches', field: 'super_switches', value: '15' },
  { label: 'Up to date portfolio information is available', field: 'super_uptodate', value: '16' },
  { label: 'Ability to manage tax effectiveness of investment strategy', field: 'super_taxmgmt', value: '17' },
  { label: 'Access to low cost insurance', field: 'super_lowins', value: '18' },
  { label: 'Access to insurance features consistent with my requirements', field: 'super_insfeatures', value: '19' }
];

const OBJECTIVE_TYPES = [
  { value: '1', label: 'Establish An Emergency Fund' },
  { value: '2', label: 'Reduce Annual Expenses' },
  { value: '3', label: 'Increase Cashflow' },
  { value: '4', label: 'Reduce Your Working Hours' },
  { value: '5', label: 'Take A Career Break' },
  { value: '6', label: 'Send Your Children To Private School' },
  { value: '7', label: 'Pay For Childrens University Expenses' },
  { value: '8', label: 'Provide For Dependants' },
  { value: '9', label: 'Go On A Holiday' },
  { value: '10', label: 'Buy A Car' },
  { value: '11', label: 'Gift Money To Children/Dependants' },
  { value: '12', label: 'Pay For Other School Costs' },
  { value: '13', label: 'Allocate Funds For Tutor' },
  { value: '14', label: 'Allocate Funds For Other Extracurricular Activities' },
  { value: '15', label: 'Help A Child Pay For A House' },
  { value: '16', label: 'Return To Work After Children' },
  { value: '17', label: 'Reduce Work Hours To Look After Children' },
  { value: '18', label: 'Take Parental Leave' },
  { value: '19', label: 'Set a wealth target in the future' },
  { value: '20', label: 'Reduce Exposure To Volatile Growth Investments' },
  { value: '21', label: 'Allocate Funds To Low Risk Interest Bearing Assets' },
  { value: '22', label: 'Retain Investment' },
  { value: '23', label: 'Put Aside Funds To Help Children Invest' },
  { value: '24', label: 'Build A Share Portfolio' },
  { value: '25', label: 'Rent Out An Existing Property' },
  { value: '26', label: 'Purchase A New Principal Residence' },
  { value: '27', label: 'Downsize A Principal Residence' },
  { value: '28', label: 'Move Into A New Rental Property' },
  { value: '29', label: 'Purchase A Holiday Home' },
  { value: '30', label: 'Rent Out Your Holiday Home' },
  { value: '31', label: 'Upgrade Your Home' },
  { value: '32', label: 'Renovate Home' },
  { value: '33', label: 'Purchase An Investment Property' },
  { value: '34', label: 'Eliminate Your Credit Card Debts' },
  { value: '35', label: 'Eliminate Your Mortgage' },
  { value: '36', label: 'Eliminate All Debts' },
  { value: '37', label: 'Reduce Investment Debt' },
  { value: '38', label: 'Reduce Non Deductible Debt' },
  { value: '39', label: 'Establish A Reverse Mortgage' },
  { value: '40', label: 'Increase Investment Debt' },
  { value: '41', label: 'Consolidate Debt' },
  { value: '42', label: 'Increase Contributions To Super' },
  { value: '43', label: 'Build Wealth For Your Retirement' },
  { value: '46', label: 'Move Into Aged Care' },
  { value: '47', label: 'Be Assessed For A Home Care Package' },
  { value: '48', label: 'Establish A Granny Flat Interest Property Transfer' },
  { value: '49', label: 'Establish A Granny Flat Interest Dollar Value' },
  { value: '50', label: 'Bequeath An Amount To Your Estate' },
  { value: '55', label: 'Sell An Existing Investment' },
  { value: '56', label: 'Sell A Portion Of An Existing Investment' },
  { value: '59', label: 'Capital Not At Risk Due To Market Fluctations' },
  { value: '60', label: 'Find A Superannuation Product That Is Suitable For Your Requirements' },
  { value: '61', label: 'Maximise Centrelink Entitlements' },
  { value: '62', label: 'Consolidate Superannuation Funds' },
  { value: '63', label: 'Update Your Will' }
];

const PROPERTY_OBJECTIVES = ['25', '29', '30', '33'];
const DEBT_OBJECTIVES = ['34', '35', '36', '37', '38', '39', '40', '41'];
const ASSET_OBJECTIVES = ['22', '55', '56'];

const FREQUENCY_OPTIONS = [
  { value: '1', label: 'Weekly' },
  { value: '2', label: 'Fortnightly' },
  { value: '3', label: 'Monthly' },
  { value: '4', label: 'Quarterly' },
  { value: '5', label: 'Annual' },
  { value: '6', label: 'Every 2 years' },
  { value: '7', label: 'Every 3 years' },
  { value: '8', label: 'Every 4 years' },
  { value: '9', label: 'Every 5 years' },
  { value: '10', label: 'Every 7 years' },
  { value: '11', label: 'Every 10 years' }
];

const EMPTY_QUICK_PERSON = {
  c_ret_age: '',
  c_ret_importance: '',
  c_desired_income: '',
  c_income_rank: '',
  c_estate_amount: '',
  c_estate_importance: '',
  c_funeral_bond: '',
  c_funeral_amount: '',
  c_funeral_importance: '',
  c_ins_death: '',
  c_ins_tpd: '',
  c_ins_income: '',
  c_ins_trauma: '',
  c_ins_creditors: '',
  c_ins_guarantee: '',
  c_protection_importance: '',
  c_super_lowcost: '',
  c_super_lowcost_inv: '',
  c_super_top_mgr: '',
  c_super_term: '',
  c_super_shares_au: '',
  c_super_shares_int: '',
  c_super_broad: '',
  c_super_sri: '',
  c_super_model: '',
  c_super_lifecycle: '',
  c_super_rebalance: '',
  c_super_taxeff: '',
  c_super_switches: '',
  c_super_uptodate: '',
  c_super_taxmgmt: '',
  c_super_lowins: '',
  c_super_insfeatures: '',
  c_super_importance: ''
};

export default function FactFindAdviceReason() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading } = useFactFind();
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  
  const [currentTab, setCurrentTab] = useState('reasons');
  const [objectiveSubTab, setObjectiveSubTab] = useState('retirement');
  const [activePerson, setActivePerson] = useState({
    retirement: 'c1',
    estate: 'c1',
    protection: 'c1',
    products: 'c1'
  });
  const [hasPartner, setHasPartner] = useState(false);

  const [reasons, setReasons] = useState([]);
  const [quick, setQuick] = useState({
    client: { ...EMPTY_QUICK_PERSON },
    partner: { ...EMPTY_QUICK_PERSON }
  });
  const [objectives, setObjectives] = useState([]);
  const [activeObjectiveIndex, setActiveObjectiveIndex] = useState(null);

  // Get principal names
  const principalNames = useMemo(() => {
    const clientName = factFind?.personal?.client?.first_name
      ? `${factFind.personal.client.first_name} ${factFind.personal.client.last_name || ''}`.trim()
      : 'Client';
    const partnerName = factFind?.personal?.partner?.first_name
      ? `${factFind.personal.partner.first_name} ${factFind.personal.partner.last_name || ''}`.trim()
      : 'Partner';

    return { client: clientName, partner: partnerName };
  }, [factFind]);

  // Check if partner exists
  useEffect(() => {
    if (factFind?.personal?.partner?.first_name) {
      setHasPartner(true);
    }
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
    if (factFind?.advice_reason) {
      const r = factFind.advice_reason;
      if (r.reasons) setReasons(r.reasons);
      if (r.quick) setQuick(r.quick);
      if (r.objectives) setObjectives(r.objectives);
    }
  }, [factFind]);

  const toggleReason = useCallback((value) => {
    setReasons(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  }, []);

  const updateQuick = useCallback((person, field, value) => {
    setQuick(prev => ({
      ...prev,
      [person]: { ...prev[person], [field]: value }
    }));
  }, []);

  const addObjective = () => {
    const newObjective = {
      o_who: [],
      o_type: '',
      o_property: '',
      o_debt: '',
      o_asset: '',
      o_start: '',
      o_end: '',
      o_freq: '',
      o_amount: '',
      o_importance: '',
      o_why: ''
    };
    setObjectives(prev => [...prev, newObjective]);
    setActiveObjectiveIndex(objectives.length);
  };

  const updateObjective = (index, field, value) => {
    setObjectives(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const deleteObjective = (index) => {
    setObjectives(prev => prev.filter((_, i) => i !== index));
    if (activeObjectiveIndex >= index && activeObjectiveIndex > 0) {
      setActiveObjectiveIndex(prev => prev - 1);
    }
  };

  const handleNext = async () => {
    if (!factFind?.id) {
      toast.error('Unable to save data');
      return;
    }

    setSaving(true);
    try {
      const sectionsCompleted = [...(factFind.sections_completed || [])];
      if (!sectionsCompleted.includes('advice_reason')) {
        sectionsCompleted.push('advice_reason');
      }

      await base44.entities.FactFind.update(factFind.id, {
        advice_reason: {
          reasons,
          quick,
          objectives
        },
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindRiskProfile') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindSuperTax') + `?id=${factFind?.id || ''}`);
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="advice_reason" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const personKey = activePerson[objectiveSubTab] === 'c1' ? 'client' : 'partner';
  const prefix = personKey === 'client' ? 'c_' : 'p_';

  return (
    <FactFindLayout currentSection="advice_reason" factFind={factFind}>
      <FactFindHeader
        title="Reason for seeking advice"
        description="Select the areas you want help with, and record your objectives."
        factFind={factFind}
        user={user}
      />

      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
           {/* Tabs - Part of form content */}
           <div className="flex gap-2">
             {TABS.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setCurrentTab(tab.id)}
                 className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                   currentTab === tab.id
                     ? 'bg-blue-600 text-white'
                     : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                 }`}
               >
                 <span>{tab.icon}</span>
                 {tab.label}
               </button>
             ))}
           </div>

           {currentTab === 'reasons' ? (
            <Card className="border-slate-200 shadow-sm">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-lg">
                <h4 className="font-bold text-white text-lg">📋 Specify your reasons for seeking advice</h4>
              </div>
              <CardContent className="p-6">
                {/* 3-COLUMN GRID OF GROUP CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {REASONS_GROUPS.map((group, idx) => (
                    <div 
                      key={idx} 
                      className="border border-slate-200 rounded-lg bg-white overflow-hidden hover:border-slate-300 hover:shadow-md transition-all"
                    >
                      {/* Group header */}
                      <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
                        <h5 className="font-bold text-slate-800 text-sm">{group.title}</h5>
                      </div>
                      {/* Group items - checkboxes */}
                      <div className="p-4 space-y-3">
                        {group.items.map((item) => (
                          <label 
                            key={item.value} 
                            className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors"
                          >
                            <Checkbox
                              checked={reasons.includes(item.value)}
                              onCheckedChange={() => toggleReason(item.value)}
                              className="h-[18px] w-[18px]"
                            />
                            <span className="text-sm text-slate-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Objective Sub-tabs */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {OBJECTIVE_SUB_TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setObjectiveSubTab(tab.id)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                          objectiveSubTab === tab.id
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        <span>{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Retirement Sub-tab */}
              {objectiveSubTab === 'retirement' && (
                <>
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActivePerson({ ...activePerson, retirement: 'c1' })}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold transition-all",
                            activePerson.retirement === 'c1'
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {principalNames.client}
                        </button>
                        {hasPartner && (
                          <button
                            onClick={() => setActivePerson({ ...activePerson, retirement: 'c2' })}
                            className={cn(
                              "px-4 py-2 rounded-full text-sm font-bold transition-all",
                              activePerson.retirement === 'c2'
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                          >
                            {principalNames.partner}
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-sm">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 rounded-t-lg">
                      <h4 className="font-bold text-white">🎯 Retirement - {activePerson.retirement === 'c1' ? principalNames.client : principalNames.partner}</h4>
                    </div>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Desired retirement age</label>
                          <input
                            type="number"
                            value={quick[personKey][`${prefix}ret_age`]}
                            onChange={(e) => updateQuick(personKey, `${prefix}ret_age`, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">How important is achieving this goal</label>
                          <select
                            value={quick[personKey][`${prefix}ret_importance`]}
                            onChange={(e) => updateQuick(personKey, `${prefix}ret_importance`, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                          >
                            <option value="">Select...</option>
                            <option value="1">Not important</option>
                            <option value="2">Important</option>
                            <option value="3">Very important</option>
                            <option value="4">Critical</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Desired income in retirement</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={quick[personKey][`${prefix}desired_income`]}
                              onChange={(e) => updateQuick(personKey, `${prefix}desired_income`, e.target.value)}
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Desired income in retirement (Rank)</label>
                          <select
                            value={quick[personKey][`${prefix}income_rank`]}
                            onChange={(e) => updateQuick(personKey, `${prefix}income_rank`, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                          >
                            <option value="">Select...</option>
                            <option value="1">Not important</option>
                            <option value="2">Important</option>
                            <option value="3">Very important</option>
                            <option value="4">Critical</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Estate Sub-tab */}
              {objectiveSubTab === 'estate' && (
                <>
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActivePerson({ ...activePerson, estate: 'c1' })}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold transition-all",
                            activePerson.estate === 'c1'
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {principalNames.client}
                        </button>
                        {hasPartner && (
                          <button
                            onClick={() => setActivePerson({ ...activePerson, estate: 'c2' })}
                            className={cn(
                              "px-4 py-2 rounded-full text-sm font-bold transition-all",
                              activePerson.estate === 'c2'
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                          >
                            {principalNames.partner}
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-sm">
                    <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 rounded-t-lg">
                      <h4 className="font-bold text-white">🏛️ Estate - {activePerson.estate === 'c1' ? principalNames.client : principalNames.partner}</h4>
                    </div>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">How much would you like to bequeath</label>
                          <div className="flex items-center">
                            <span className="text-slate-500 mr-2">$</span>
                            <input
                              type="number"
                              value={quick[personKey][`${prefix}estate_amount`]}
                              onChange={(e) => updateQuick(personKey, `${prefix}estate_amount`, e.target.value)}
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">How important is it to meet this</label>
                          <select
                            value={quick[personKey][`${prefix}estate_importance`]}
                            onChange={(e) => updateQuick(personKey, `${prefix}estate_importance`, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                          >
                            <option value="">Select...</option>
                            <option value="1">Not important</option>
                            <option value="2">Important</option>
                            <option value="3">Very important</option>
                            <option value="4">Critical</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <label className="text-sm font-semibold text-slate-700">Do you wish to purchase a funeral bond?</label>
                        <Switch
                          checked={quick[personKey][`${prefix}funeral_bond`] === '1'}
                          onCheckedChange={(checked) => updateQuick(personKey, `${prefix}funeral_bond`, checked ? '1' : '')}
                        />
                      </div>
                      {quick[personKey][`${prefix}funeral_bond`] === '1' && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Funeral bond amount</label>
                            <div className="flex items-center">
                              <span className="text-slate-500 mr-2">$</span>
                              <input
                                type="number"
                                value={quick[personKey][`${prefix}funeral_amount`]}
                                onChange={(e) => updateQuick(personKey, `${prefix}funeral_amount`, e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">How important is achieving this</label>
                            <select
                              value={quick[personKey][`${prefix}funeral_importance`]}
                              onChange={(e) => updateQuick(personKey, `${prefix}funeral_importance`, e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                            >
                              <option value="">Select...</option>
                              <option value="1">Not important</option>
                              <option value="2">Important</option>
                              <option value="3">Very important</option>
                              <option value="4">Critical</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Wealth Protection Sub-tab */}
              {objectiveSubTab === 'protection' && (
                <>
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActivePerson({ ...activePerson, protection: 'c1' })}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold transition-all",
                            activePerson.protection === 'c1'
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {principalNames.client}
                        </button>
                        {hasPartner && (
                          <button
                            onClick={() => setActivePerson({ ...activePerson, protection: 'c2' })}
                            className={cn(
                              "px-4 py-2 rounded-full text-sm font-bold transition-all",
                              activePerson.protection === 'c2'
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                          >
                            {principalNames.partner}
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-sm">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 rounded-t-lg">
                      <h4 className="font-bold text-white">🛡️ Wealth Protection - {activePerson.protection === 'c1' ? principalNames.client : principalNames.partner}</h4>
                    </div>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">Specify what insurance you want to protect your family against:</label>
                        {PROTECTION_CHECKBOXES.map((item) => (
                          <label key={item.field} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <Checkbox
                              checked={quick[personKey][`${prefix}${item.field.replace('ins_', 'ins_')}`] === item.value}
                              onCheckedChange={(checked) => updateQuick(personKey, `${prefix}${item.field.replace('ins_', 'ins_')}`, checked ? item.value : '')}
                            />
                            <span className="text-sm text-slate-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Specify how important providing protection is</label>
                        <select
                          value={quick[personKey][`${prefix}protection_importance`]}
                          onChange={(e) => updateQuick(personKey, `${prefix}protection_importance`, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                        >
                          <option value="">Select...</option>
                          <option value="1">Not important</option>
                          <option value="2">Important</option>
                          <option value="3">Very important</option>
                          <option value="4">Critical</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Financial Products Sub-tab */}
              {objectiveSubTab === 'products' && (
                <>
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActivePerson({ ...activePerson, products: 'c1' })}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold transition-all",
                            activePerson.products === 'c1'
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {principalNames.client}
                        </button>
                        {hasPartner && (
                          <button
                            onClick={() => setActivePerson({ ...activePerson, products: 'c2' })}
                            className={cn(
                              "px-4 py-2 rounded-full text-sm font-bold transition-all",
                              activePerson.products === 'c2'
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                          >
                            {principalNames.partner}
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-sm">
                    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 rounded-t-lg">
                      <h4 className="font-bold text-white">💼 Financial Products - {activePerson.products === 'c1' ? principalNames.client : principalNames.partner}</h4>
                    </div>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">Select superannuation features that are important:</label>
                        <div className="grid md:grid-cols-2 gap-3">
                          {SUPER_FEATURES.map((item) => (
                            <label key={item.field} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                              <Checkbox
                                checked={quick[personKey][`${prefix}${item.field.replace('super_', 'super_')}`] === item.value}
                                onCheckedChange={(checked) => updateQuick(personKey, `${prefix}${item.field.replace('super_', 'super_')}`, checked ? item.value : '')}
                              />
                              <span className="text-sm text-slate-700">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">How important is it for you to find a superannuation account that is consistent with your objectives?</label>
                        <select
                          value={quick[personKey][`${prefix}super_importance`]}
                          onChange={(e) => updateQuick(personKey, `${prefix}super_importance`, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                        >
                          <option value="">Select...</option>
                          <option value="1">Not important</option>
                          <option value="2">Important</option>
                          <option value="3">Very important</option>
                          <option value="4">Critical</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Detailed Objectives Sub-tab */}
              {objectiveSubTab === 'detailed' && (
                <>
                  {/* Empty State */}
                  {objectives.length === 0 ? (
                    <Card className="border-slate-200 shadow-sm">
                      <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                          <Target className="w-8 h-8 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-slate-800 mb-2 text-lg">🎯 No objectives added yet</h4>
                        <p className="text-sm text-slate-600 mb-6">
                          Start by adding your first financial objective to track your goals
                        </p>
                        <Button
                          onClick={addObjective}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Objective
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Summary Table */}
                      <Card className="border-slate-200 shadow-sm">
                        <div className="bg-slate-100 border-b border-slate-200 px-6 py-3">
                          <h4 className="font-bold text-slate-800">📊 Objectives Summary ({objectives.length})</h4>
                        </div>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Objective type</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Start year</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700">End year</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Amount</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Importance</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {objectives.map((obj, idx) => (
                                  <tr key={idx} className={activeObjectiveIndex === idx ? 'bg-blue-50' : 'hover:bg-slate-50'}>
                                    <td className="px-4 py-3 font-medium text-slate-800 cursor-pointer" onClick={() => setActiveObjectiveIndex(idx)}>
                                      {OBJECTIVE_TYPES.find(t => t.value === obj.o_type)?.label || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 cursor-pointer" onClick={() => setActiveObjectiveIndex(idx)}>{obj.o_start || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600 cursor-pointer" onClick={() => setActiveObjectiveIndex(idx)}>{obj.o_end || '-'}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-800 cursor-pointer" onClick={() => setActiveObjectiveIndex(idx)}>
                                      {obj.o_amount ? `$${parseFloat(obj.o_amount).toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 cursor-pointer" onClick={() => setActiveObjectiveIndex(idx)}>
                                      {obj.o_importance === '1' ? 'Not important' : 
                                       obj.o_importance === '2' ? 'Important' :
                                       obj.o_importance === '3' ? 'Very important' :
                                       obj.o_importance === '4' ? 'Critical' : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setActiveObjectiveIndex(idx)} className="border-slate-300"><Edit2 className="w-3 h-3" /></Button>
                                        <Button variant="outline" size="sm" onClick={() => deleteObjective(idx)} className="border-red-300 text-red-600 hover:bg-red-50"><Trash2 className="w-3 h-3" /></Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Editor */}
                      {activeObjectiveIndex !== null && objectives[activeObjectiveIndex] && (
                        <Card className="border-slate-200 shadow-sm border-blue-300 bg-blue-50/50">
                          <div className="bg-blue-600 px-6 py-3 rounded-t-lg">
                            <h4 className="font-bold text-white">✏️ Edit Objective</h4>
                          </div>
                          <CardContent className="p-6 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Who does this objective belong to?</label>
                                <div className="space-y-2">
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={(objectives[activeObjectiveIndex].o_who || []).includes('c1')}
                                      onChange={(e) => {
                                        const who = e.target.checked
                                          ? [...(objectives[activeObjectiveIndex].o_who || []), 'c1']
                                          : (objectives[activeObjectiveIndex].o_who || []).filter(w => w !== 'c1');
                                        updateObjective(activeObjectiveIndex, 'o_who', who);
                                      }}
                                    />
                                    <span className="text-sm">{principalNames.client}</span>
                                  </label>
                                  {hasPartner && (
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={(objectives[activeObjectiveIndex].o_who || []).includes('c2')}
                                        onChange={(e) => {
                                          const who = e.target.checked
                                            ? [...(objectives[activeObjectiveIndex].o_who || []), 'c2']
                                            : (objectives[activeObjectiveIndex].o_who || []).filter(w => w !== 'c2');
                                          updateObjective(activeObjectiveIndex, 'o_who', who);
                                        }}
                                      />
                                      <span className="text-sm">{principalNames.partner}</span>
                                    </label>
                                  )}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Objective type</label>
                                <select
                                  value={objectives[activeObjectiveIndex].o_type}
                                  onChange={(e) => updateObjective(activeObjectiveIndex, 'o_type', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select...</option>
                                  {OBJECTIVE_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Start year</label>
                                <select
                                  value={objectives[activeObjectiveIndex].o_start}
                                  onChange={(e) => updateObjective(activeObjectiveIndex, 'o_start', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select year...</option>
                                  {Array.from({ length: 51 }, (_, i) => {
                                    const year = new Date().getFullYear() + i;
                                    return <option key={year} value={String(year)}>{year}</option>;
                                  })}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">End year</label>
                                <select
                                  value={objectives[activeObjectiveIndex].o_end}
                                  onChange={(e) => updateObjective(activeObjectiveIndex, 'o_end', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select year...</option>
                                  {Array.from({ length: 51 }, (_, i) => {
                                    const year = new Date().getFullYear() + i;
                                    return <option key={year} value={String(year)}>{year}</option>;
                                  })}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Frequency</label>
                                <select
                                  value={objectives[activeObjectiveIndex].o_freq}
                                  onChange={(e) => updateObjective(activeObjectiveIndex, 'o_freq', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select...</option>
                                  {FREQUENCY_OPTIONS.map(freq => (
                                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {PROPERTY_OBJECTIVES.includes(objectives[activeObjectiveIndex].o_type) && (
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Which property is this objective for?</label>
                                <select
                                  value={objectives[activeObjectiveIndex].o_property}
                                  onChange={(e) => updateObjective(activeObjectiveIndex, 'o_property', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select...</option>
                                  {(factFind?.assets?.assetsList || [])
                                    .filter(a => a.a_type === '1' || a.a_type === '18')
                                    .map((asset, idx) => (
                                      <option key={idx} value={idx}>{asset.a_name || `Property ${idx + 1}`}</option>
                                    ))}
                                </select>
                              </div>
                            )}

                            {DEBT_OBJECTIVES.includes(objectives[activeObjectiveIndex].o_type) && (
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Which debt is this objective for?</label>
                                <select
                                  value={objectives[activeObjectiveIndex].o_debt}
                                  onChange={(e) => updateObjective(activeObjectiveIndex, 'o_debt', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select...</option>
                                  {(factFind?.assets?.debtsList || []).map((debt, idx) => (
                                    <option key={idx} value={idx}>{debt.d_name || `Debt ${idx + 1}`}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {ASSET_OBJECTIVES.includes(objectives[activeObjectiveIndex].o_type) && (
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Which asset is this objective for?</label>
                                <select
                                  value={objectives[activeObjectiveIndex].o_asset}
                                  onChange={(e) => updateObjective(activeObjectiveIndex, 'o_asset', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select...</option>
                                  {(factFind?.assets?.assetsList || []).map((asset, idx) => (
                                    <option key={idx} value={idx}>{asset.a_name || `Asset ${idx + 1}`}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Amount</label>
                                <div className="flex items-center">
                                  <span className="text-slate-500 mr-2">$</span>
                                  <input
                                    type="number"
                                    value={objectives[activeObjectiveIndex].o_amount}
                                    onChange={(e) => updateObjective(activeObjectiveIndex, 'o_amount', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Importance</label>
                                <select
                                  value={objectives[activeObjectiveIndex].o_importance}
                                  onChange={(e) => updateObjective(activeObjectiveIndex, 'o_importance', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select...</option>
                                  <option value="1">Not important</option>
                                  <option value="2">Important</option>
                                  <option value="3">Very important</option>
                                  <option value="4">Critical</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Why is this objective important to you?</label>
                              <textarea
                                value={objectives[activeObjectiveIndex].o_why}
                                onChange={(e) => updateObjective(activeObjectiveIndex, 'o_why', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Add Button */}
                      <Button onClick={addObjective} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Objective
                      </Button>
                    </>
                  )}
                </>
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