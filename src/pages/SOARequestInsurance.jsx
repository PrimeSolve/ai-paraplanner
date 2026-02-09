import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import { useSOAEntities } from '../components/soa/useSOAEntities';
import { useFactFind } from '../components/factfind/useFactFind';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SOARequestInsurance() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [factFind, setFactFind] = useState(null);
  const [currentPerson, setCurrentPerson] = useState('client');
  const [activeTab, setActiveTab] = useState('needs');
  const [soaId, setSOAId] = useState(null);
  const { getByTypes } = useSOAEntities(soaId);
  const principals = getByTypes(['principal']);
  const allEntities = getByTypes(['principal', 'trust', 'company', 'smsf']);
  
  // Modals state
  const [showAssumptionsModal, setShowAssumptionsModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [editingPolicyIndex, setEditingPolicyIndex] = useState(null);
  
  // Data state
  const [insuranceData, setInsuranceData] = useState({
    client: getDefaultPersonData(),
    partner: getDefaultPersonData()
  });
  
  // Policies data (separate from needs)
  const [policiesData, setPoliciesData] = useState([]);

  // Policy form state (new structure)
  const [policyForm, setPolicyForm] = useState({
    person: 'client',
    policy_owner: '',
    insured: '',
    provider: '',
    policy_number: '',
    policy_type: '',
    premium_type: '',
    premium_frequency: '',
    premium_amount: '',
    include_life: false,
    life_sum_insured: '',
    life_recommendation: '',
    include_tpd: false,
    tpd_definition: '',
    tpd_sum_insured: '',
    tpd_recommendation: '',
    include_trauma: false,
    trauma_sum_insured: '',
    trauma_recommendation: '',
    include_ip: false,
    ip_monthly_benefit: '',
    ip_waiting_period: '',
    ip_benefit_period: '',
    ip_recommendation: ''
  });
  
  const navigate = useNavigate();

  function getDefaultPersonData() {
    return {
      assumptions: {
        date_of_birth: '',
        esp_start_date: '',
        service_end_date: '',
        retirement_age: 65,
        tpd_inside_super: true,
        override_tpd_tax: false,
        override_uplift_pct: '',
        mortgage_balance: 0,
        other_debts: 0,
        annual_salary: 0,
        discount_rate: 0
      },
      needs: {
        life: { pct_mortgage: 0, pct_other_debts: 0, emergency_fund: 0, medical_costs: 0, funeral_costs: 0, other_upfront: 0 },
        tpd: { pct_mortgage: 0, pct_other_debts: 0, emergency_fund: 0, medical_costs: 0, home_modifications: 0, other_upfront: 0 },
        trauma: { emergency_fund: 0, medical_costs: 0, home_modifications: 0, other_upfront: 0 },
        ip: { pct_salary: 0, pct_super: 0 }
      },
      income_rows: [],
      asset_rows: [],
      policies: []
    };
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (id) {
          setSOAId(id);
          const requests = await base44.entities.SOARequest.filter({ id });
          if (requests[0]) {
            setSOARequest(requests[0]);
            const insurance = requests[0].insurance_needs || { client: getDefaultPersonData(), partner: getDefaultPersonData() };
            setInsuranceData(insurance);
            const policies = requests[0].insurance_policies?.policies || [];
            setPoliciesData(policies);
            
            // Load linked fact find
            if (requests[0].fact_find_id) {
              const factFinds = await base44.entities.FactFind.filter({ id: requests[0].fact_find_id });
              if (factFinds[0]) setFactFind(factFinds[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const currentPersonData = insuranceData[currentPerson];
  const assumptions = currentPersonData.assumptions;
  const needs = currentPersonData.needs;
  const policies = currentPersonData.policies || [];

  const updateNeeds = (type, field, value) => {
    setInsuranceData(prev => ({
      ...prev,
      [currentPerson]: {
        ...prev[currentPerson],
        needs: {
          ...prev[currentPerson].needs,
          [type]: {
            ...prev[currentPerson].needs[type],
            [field]: parseFloat(value) || 0
          }
        }
      }
    }));
  };

  const updateAssumptions = (field, value) => {
    setInsuranceData(prev => ({
      ...prev,
      [currentPerson]: {
        ...prev[currentPerson],
        assumptions: {
          ...prev[currentPerson].assumptions,
          [field]: value
        }
      }
    }));
  };

  // Pre-populate assumptions modal on open
  useEffect(() => {
    const handleModalOpen = () => {
      const defaults = getPreFillDefaults();
      const personKey = currentPerson;
      
      // Use saved overrides if exist, otherwise use Fact Find defaults
      const mortgage = assumptions.mortgage_override ?? defaults.mortgage;
      const otherDebts = assumptions.other_debts_override ?? defaults.otherDebts;
      const salary = assumptions.salary_override ?? defaults.salary;
      const dob = assumptions.dob_override ?? defaults.dob;
      
      // Calculate service end date (when client turns retirement age)
      let calculatedServiceEnd = '';
      if (dob) {
        const retireAge = assumptions.retirement_age || 65;
        const retireDate = new Date(dob);
        retireDate.setFullYear(retireDate.getFullYear() + retireAge);
        calculatedServiceEnd = retireDate.toISOString().split('T')[0];
      }
      const serviceEnd = assumptions.service_end_override ?? calculatedServiceEnd;
      
      // Only update if they're empty (initial load)
      if (!assumptions.mortgage_balance) updateAssumptions('mortgage_balance', mortgage);
      if (!assumptions.other_debts) updateAssumptions('other_debts', otherDebts);
      if (!assumptions.annual_salary) updateAssumptions('annual_salary', salary);
      if (!assumptions.date_of_birth) updateAssumptions('date_of_birth', dob);
      if (!assumptions.service_end_date && calculatedServiceEnd) updateAssumptions('service_end_date', serviceEnd);
    };

    window.addEventListener('show-assumptions', handleModalOpen);
    return () => window.removeEventListener('show-assumptions', handleModalOpen);
  }, [currentPerson, factFind, assumptions]);

  const formatCurrency = (num) => {
    return `$${(parseFloat(num) || 0).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Calculate totals
  const calculateTotals = () => {
    const lifeCapital = 
      (needs.life.pct_mortgage / 100) * assumptions.mortgage_balance +
      (needs.life.pct_other_debts / 100) * assumptions.other_debts +
      needs.life.emergency_fund +
      needs.life.medical_costs +
      needs.life.funeral_costs +
      needs.life.other_upfront;
    
    const tpdCapital = 
      (needs.tpd.pct_mortgage / 100) * assumptions.mortgage_balance +
      (needs.tpd.pct_other_debts / 100) * assumptions.other_debts +
      needs.tpd.emergency_fund +
      needs.tpd.medical_costs +
      needs.tpd.home_modifications +
      needs.tpd.other_upfront;
    
    const traumaCapital = 
      needs.trauma.emergency_fund +
      needs.trauma.medical_costs +
      needs.trauma.home_modifications +
      needs.trauma.other_upfront;

    // Income PV (simplified for now)
    const lifePV = currentPersonData.income_rows
      .filter(r => r.life)
      .reduce((sum, r) => sum + (parseFloat(r.pv) || 0), 0);
    
    const tpdPV = currentPersonData.income_rows
      .filter(r => r.tpd)
      .reduce((sum, r) => sum + (parseFloat(r.pv) || 0), 0);

    // Assets
    const lifeAssets = currentPersonData.asset_rows
      .filter(r => r.life)
      .reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0);
    
    const tpdAssets = currentPersonData.asset_rows
      .filter(r => r.tpd)
      .reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0);

    // TPD Tax (simplified)
    const tpdTaxUplift = (tpdCapital + tpdPV) * 0.15;

    // IP monthly
    const ipMonthly = (assumptions.annual_salary * ((needs.ip.pct_salary / 100) + (needs.ip.pct_super / 100))) / 12;

    // Initial cover
    const lifeInitial = lifeCapital + lifePV;
    const tpdInitial = tpdCapital + tpdPV + tpdTaxUplift;
    const traumaInitial = traumaCapital;

    // Final cover
    const lifeFinal = lifeInitial - lifeAssets;
    const tpdFinal = tpdInitial - tpdAssets;

    return {
      life_capital: lifeCapital,
      tpd_capital: tpdCapital,
      trauma_capital: traumaCapital,
      life_income_pv: lifePV,
      tpd_income_pv: tpdPV,
      tpd_tax_uplift: tpdTaxUplift,
      life_assets: lifeAssets,
      tpd_assets: tpdAssets,
      life_initial: lifeInitial,
      tpd_initial: tpdInitial,
      trauma_initial: traumaInitial,
      ip_monthly: ipMonthly,
      life_final: Math.max(0, lifeFinal),
      tpd_final: Math.max(0, tpdFinal),
      trauma_final: traumaInitial
    };
  };

  const totals = calculateTotals();

  // Income Modal Functions
  const addIncomeRow = () => {
    setInsuranceData(prev => ({
      ...prev,
      [currentPerson]: {
        ...prev[currentPerson],
        income_rows: [...prev[currentPerson].income_rows, {
          id: Date.now(),
          item: '',
          life: false,
          tpd: false,
          growth: 0,
          annual_income: 0,
          years: 0,
          pv: 0
        }]
      }
    }));
  };

  const removeIncomeRow = (index) => {
    setInsuranceData(prev => ({
      ...prev,
      [currentPerson]: {
        ...prev[currentPerson],
        income_rows: prev[currentPerson].income_rows.filter((_, i) => i !== index)
      }
    }));
  };

  const updateIncomeRow = (index, field, value) => {
    setInsuranceData(prev => {
      const updated = [...prev[currentPerson].income_rows];
      updated[index][field] = value;
      
      // Calculate PV
      const row = updated[index];
      const annualIncome = parseFloat(row.annual_income) || 0;
      const years = parseFloat(row.years) || 0;
      const growth = parseFloat(row.growth) || 0;
      const discount = parseFloat(assumptions.discount_rate) || 0;
      
      const netRate = (growth / 100) - (discount / 100);
      let pv = 0;
      if (years > 0 && annualIncome > 0) {
        if (Math.abs(netRate) < 0.0001) {
          pv = annualIncome * years;
        } else {
          pv = annualIncome * (1 - Math.pow(1 + netRate, -years)) / netRate;
        }
      }
      updated[index].pv = pv;
      
      return {
        ...prev,
        [currentPerson]: {
          ...prev[currentPerson],
          income_rows: updated
        }
      };
    });
  };

  // Asset Modal Functions
  const addAssetRow = () => {
    setInsuranceData(prev => ({
      ...prev,
      [currentPerson]: {
        ...prev[currentPerson],
        asset_rows: [...prev[currentPerson].asset_rows, {
          id: Date.now(),
          description: '',
          life: false,
          tpd: false,
          value: 0
        }]
      }
    }));
  };

  const removeAssetRow = (index) => {
    setInsuranceData(prev => ({
      ...prev,
      [currentPerson]: {
        ...prev[currentPerson],
        asset_rows: prev[currentPerson].asset_rows.filter((_, i) => i !== index)
      }
    }));
  };

  const updateAssetRow = (index, field, value) => {
    setInsuranceData(prev => {
      const updated = [...prev[currentPerson].asset_rows];
      updated[index][field] = value;
      return {
        ...prev,
        [currentPerson]: {
          ...prev[currentPerson],
          asset_rows: updated
        }
      };
    });
  };

  const handleAssetSelect = (rowIdx, assetId) => {
    const assetList = buildAssetList();
    const asset = assetList.find(a => a.id === assetId);
    
    setInsuranceData(prev => {
      const updated = [...prev[currentPerson].asset_rows];
      updated[rowIdx].asset_id = assetId;
      updated[rowIdx].description = asset?.label || '';
      updated[rowIdx].value = asset?.balance || asset?.value || 0;
      return {
        ...prev,
        [currentPerson]: {
          ...prev[currentPerson],
          asset_rows: updated
        }
      };
    });
  };

  // Calculate metrics for assumptions modal
  const calculateMetrics = () => {
    const dob = assumptions.date_of_birth ? new Date(assumptions.date_of_birth) : null;
    const espStart = assumptions.esp_start_date ? new Date(assumptions.esp_start_date) : null;
    const serviceEnd = assumptions.service_end_date ? new Date(assumptions.service_end_date) : new Date();
    const retireAge = assumptions.retirement_age || 65;
    
    if (!dob || !espStart) return {};
    
    const retireDate = new Date(dob);
    retireDate.setFullYear(retireDate.getFullYear() + retireAge);
    
    const serviceDays = Math.floor((serviceEnd - espStart) / (1000 * 60 * 60 * 24));
    const daysToRetire = Math.floor((retireDate - serviceEnd) / (1000 * 60 * 60 * 24));
    const totalDays = serviceDays + daysToRetire;
    const taxableProp = totalDays > 0 ? daysToRetire / totalDays : 0;
    
    const today = new Date();
    const ageAtServiceEnd = Math.floor((serviceEnd - dob) / (1000 * 60 * 60 * 24 * 365.25));
    
    const calculatedUplift = taxableProp * 0.22;
    const appliedUplift = assumptions.override_tpd_tax && assumptions.override_uplift_pct 
      ? parseFloat(assumptions.override_uplift_pct) / 100 
      : calculatedUplift;
    
    return {
      age_at_service_end: ageAtServiceEnd,
      service_days: serviceDays,
      days_to_retirement: daysToRetire,
      taxable_proportion: taxableProp,
      calculated_uplift: calculatedUplift,
      applied_uplift: appliedUplift
    };
  };

  const calculatedMetrics = calculateMetrics();

  // Pre-fill calculations from Fact Find
  const getPreFillDefaults = () => {
    if (!factFind) return { mortgage: 0, otherDebts: 0, salary: 0, dob: '' };

    // Mortgage total (debt_type = '1')
    const allDebts = factFind.assets_liabilities?.liabilities || [];
    const mortgageTotal = allDebts
      .filter(d => d.d_type === '1')
      .reduce((sum, d) => sum + (parseFloat(d.d_balance) || 0), 0);

    // Other debts (debt_type !== '1')
    const otherDebtsTotal = allDebts
      .filter(d => d.d_type !== '1')
      .reduce((sum, d) => sum + (parseFloat(d.d_balance) || 0), 0);

    // Current person's salary
    const incomeSources = factFind.income_expenses?.income_sources || [];
    const personKey = currentPerson === 'client' ? 'client' : 'partner';
    const incomeData = incomeSources.find(s => s.person === personKey);
    const salary = parseFloat(incomeData?.fields?.i_gross || 0);

    // Date of birth
    const dob = currentPerson === 'client' 
      ? factFind.personal?.date_of_birth 
      : factFind.personal?.partner_date_of_birth;

    return { mortgage: mortgageTotal, otherDebts: otherDebtsTotal, salary, dob: dob || '' };
  };

  const incomeTotals = {
    life_pv: currentPersonData.income_rows.filter(r => r.life).reduce((sum, r) => sum + (parseFloat(r.pv) || 0), 0),
    tpd_pv: currentPersonData.income_rows.filter(r => r.tpd).reduce((sum, r) => sum + (parseFloat(r.pv) || 0), 0)
  };

  const assetTotals = {
    life: currentPersonData.asset_rows.filter(r => r.life).reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0),
    tpd: currentPersonData.asset_rows.filter(r => r.tpd).reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0)
  };

  // Build asset list from Fact Find and SOA Request
  const buildAssetList = () => {
    const assetList = [];
    
    if (factFind) {
      // 1. Superannuation accounts
      const superFunds = factFind.superannuation?.funds || [];
      superFunds.forEach((fund, i) => {
        const fundName = fund.fund_name || fund.provider || 'Superannuation';
        const balance = parseFloat(fund.balance || fund.current_balance) || 0;
        assetList.push({
          id: `super_${i}`,
          label: `Super - ${fundName}`,
          type: 'Superannuation',
          balance
        });
      });
      
      // 2. Pension accounts
      const pensions = factFind.superannuation?.pensions || [];
      pensions.forEach((pension, i) => {
        const fundName = pension.fund_name || pension.provider || 'Pension';
        const balance = parseFloat(pension.balance || pension.current_balance) || 0;
        assetList.push({
          id: `pension_${i}`,
          label: `Pension - ${fundName}`,
          type: 'Pension',
          balance
        });
      });
      
      // 3. Investment assets
      const investments = factFind.assets_liabilities?.assets || [];
      investments.forEach((asset, i) => {
        const value = parseFloat(asset.a_value || asset.value) || 0;
        assetList.push({
          id: `asset_${i}`,
          label: asset.a_name || asset.description || 'Investment',
          type: 'Investment',
          value
        });
      });
    }
    
    // 4. NEW products from SOA Request (excluding entities)
    if (soaRequest) {
      const products = soaRequest.products_entities?.products || {};
      Object.entries(products).forEach(([type, items]) => {
        (items || []).forEach((p, i) => {
          assetList.push({
            id: `new_product_${type}_${i}`,
            label: `NEW - ${p.product_name || type}`,
            type: `New ${type}`
          });
        });
      });
    }
    
    return assetList;
  };

  // Policy Management Functions


  const getPremiumTypeLabel = (value) => {
    const labels = { '1': 'Stepped', '2': 'Level', '3': 'Hybrid' };
    return labels[value] || '—';
  };

  const getPremiumFrequencyLabel = (value) => {
    const labels = { '1': 'Monthly', '2': 'Quarterly', '3': 'Annually' };
    return labels[value] || '—';
  };

  const resetPolicyForm = () => {
    setPolicyForm({
      person: currentPerson,
      policy_owner: '',
      insured: '',
      provider: '',
      policy_number: '',
      policy_type: '',
      premium_type: '',
      premium_frequency: '',
      premium_amount: '',
      include_life: false,
      life_sum_insured: '',
      life_recommendation: '',
      include_tpd: false,
      tpd_definition: '',
      tpd_sum_insured: '',
      tpd_recommendation: '',
      include_trauma: false,
      trauma_sum_insured: '',
      trauma_recommendation: '',
      include_ip: false,
      ip_monthly_benefit: '',
      ip_waiting_period: '',
      ip_benefit_period: '',
      ip_recommendation: ''
    });
  };

  const addNewPolicy = () => {
    resetPolicyForm();
    setEditingPolicyIndex(null);
    setShowPolicyForm(true);
  };

  const editPolicy = (index) => {
    const policy = policiesData[index];
    setPolicyForm({ ...policy });
    setEditingPolicyIndex(index);
    setShowPolicyForm(true);
  };

  const cancelPolicyEdit = () => {
    resetPolicyForm();
    setEditingPolicyIndex(null);
    setShowPolicyForm(false);
  };

  const savePolicy = () => {
    setPoliciesData(prev => {
      const updated = [...prev];
      if (editingPolicyIndex !== null) {
        updated[editingPolicyIndex] = { ...policyForm, id: updated[editingPolicyIndex].id };
      } else {
        updated.push({ ...policyForm, id: crypto.randomUUID() });
      }
      return updated;
    });
    cancelPolicyEdit();
  };

  const removePolicy = (index) => {
    if (confirm('Are you sure you want to delete this policy?')) {
      setPoliciesData(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updatePolicyForm = (field, value) => {
    setPolicyForm(prev => ({ ...prev, [field]: value }));
  };

  const saveInsuranceData = async () => {
    if (!soaRequest?.id) return;
    
    await base44.entities.SOARequest.update(soaRequest.id, {
      insurance_needs: insuranceData,
      insurance_policies: { policies: policiesData }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveInsuranceData();
      toast.success('Insurance details saved');
      navigate(createPageUrl('SOARequestTransactions') + `?id=${soaRequest.id}`);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Save before sidebar navigation
  useEffect(() => {
    const handleSaveBeforeNav = async () => {
      try {
        await saveInsuranceData();
      } catch (err) {
        console.error('Save before nav failed:', err);
      }
      window.dispatchEvent(new Event('soa-save-complete'));
    };

    window.addEventListener('soa-save-before-nav', handleSaveBeforeNav);
    return () => window.removeEventListener('soa-save-before-nav', handleSaveBeforeNav);
  }, [insuranceData, soaRequest?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <SOARequestLayout currentSection="insurance" soaRequest={soaRequest}>
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="w-full">
          {/* Dark Banner */}
          <div style={{ backgroundColor: '#1E293B', padding: '24px 32px', borderRadius: '16px 16px 0 0' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
              Insurance
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8', margin: 0 }}>
              Use the calculators to build insurance needs and define recommended products
            </p>
          </div>

          {/* White Content Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0 0 16px 16px', border: '1px solid #E2E8F0', borderTop: 'none' }}>
            <div className="flex-1 overflow-auto">
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ 
                display: 'inline-flex', 
                padding: '4px', 
                backgroundColor: '#F8FAFC', 
                borderRadius: '12px', 
                border: '1px solid #E2E8F0' 
              }}>
                <button 
                  onClick={() => setActiveTab('needs')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'needs' ? '#FFFFFF' : 'transparent',
                    boxShadow: activeTab === 'needs' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    color: activeTab === 'needs' ? '#1E293B' : '#64748B',
                    fontSize: '14px',
                    fontWeight: activeTab === 'needs' ? 600 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  📊 Needs
                </button>
                <button 
                  onClick={() => setActiveTab('policies')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'policies' ? '#FFFFFF' : 'transparent',
                    boxShadow: activeTab === 'policies' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    color: activeTab === 'policies' ? '#1E293B' : '#64748B',
                    fontSize: '14px',
                    fontWeight: activeTab === 'policies' ? 600 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  📋 Policies
                </button>
              </div>
            </div>

            <div style={{ padding: '24px 32px' }}>
              {/* NEEDS TAB */}
              {activeTab === 'needs' && (
                <div className="space-y-4 mt-6">
              {/* Toolbar */}
                <div className="flex items-center justify-between">
                  {/* Person Switcher */}
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                  {principals[0] && (
                    <button
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                        currentPerson === 'client' 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      onClick={() => setCurrentPerson('client')}
                    >
                      {principals[0].label || 'Client'}
                    </button>
                  )}
                  {principals[1] && (
                    <button
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                        currentPerson === 'partner' 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      onClick={() => setCurrentPerson('partner')}
                    >
                      {principals[1].label || 'Partner'}
                    </button>
                  )}
                </div>
                
                {/* Key Assumptions Button */}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    window.dispatchEvent(new Event('show-assumptions'));
                    setShowAssumptionsModal(true);
                  }}
                  className="gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Key assumptions
                </Button>
              </div>

              {/* Matrix Calculator Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white border border-slate-200 rounded-lg overflow-hidden text-sm">
                  <thead>
                    <tr className="bg-[#0f4a8a] text-white">
                      <th className="text-left p-3 w-[280px]"></th>
                      <th className="text-center p-3">Life ($)</th>
                      <th className="text-center p-3">TPD ($)</th>
                      <th className="text-center p-3">Trauma ($)</th>
                      <th className="text-center p-3">Income Protection (per month)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Capital Needs Section */}
                    <tr className="bg-slate-100">
                      <td className="p-3 font-bold text-slate-900">Capital Needs</td>
                      <td></td><td></td><td></td><td></td>
                    </tr>
                    
                    <tr className="bg-white border-t border-slate-200">
                      <td className="p-3 text-slate-700">Repay a % of mortgage</td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="%" className="max-w-[140px] text-center mx-auto" 
                          value={needs.life.pct_mortgage || ''} 
                          onChange={(e) => updateNeeds('life', 'pct_mortgage', e.target.value)} 
                        />
                      </td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="%" className="max-w-[140px] text-center mx-auto"
                          value={needs.tpd.pct_mortgage || ''}
                          onChange={(e) => updateNeeds('tpd', 'pct_mortgage', e.target.value)}
                        />
                      </td>
                      <td className="text-center p-3 text-slate-400">—</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                    </tr>
                    
                    <tr className="bg-white border-t border-slate-200">
                      <td className="p-3 text-slate-700">Repay a % of other debts</td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="%" className="max-w-[140px] text-center mx-auto"
                          value={needs.life.pct_other_debts || ''}
                          onChange={(e) => updateNeeds('life', 'pct_other_debts', e.target.value)}
                        />
                      </td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="%" className="max-w-[140px] text-center mx-auto"
                          value={needs.tpd.pct_other_debts || ''}
                          onChange={(e) => updateNeeds('tpd', 'pct_other_debts', e.target.value)}
                        />
                      </td>
                      <td className="text-center p-3 text-slate-400">—</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                    </tr>
                    
                    <tr className="bg-white border-t border-slate-200">
                      <td className="p-3 text-slate-700">Emergency fund</td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="$" className="max-w-[140px] text-center mx-auto"
                          value={needs.life.emergency_fund || ''}
                          onChange={(e) => updateNeeds('life', 'emergency_fund', e.target.value)}
                        />
                      </td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="$" className="max-w-[140px] text-center mx-auto"
                          value={needs.tpd.emergency_fund || ''}
                          onChange={(e) => updateNeeds('tpd', 'emergency_fund', e.target.value)}
                        />
                      </td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="$" className="max-w-[140px] text-center mx-auto"
                          value={needs.trauma.emergency_fund || ''}
                          onChange={(e) => updateNeeds('trauma', 'emergency_fund', e.target.value)}
                        />
                      </td>
                      <td className="text-center p-3 text-slate-400">—</td>
                    </tr>

                    <tr className="bg-white border-t border-slate-200">
                      <td className="p-3 text-slate-700">Medical costs (specific)</td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="$" className="max-w-[140px] text-center mx-auto"
                          value={needs.life.medical_costs || ''}
                          onChange={(e) => updateNeeds('life', 'medical_costs', e.target.value)}
                        />
                      </td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="$" className="max-w-[140px] text-center mx-auto"
                          value={needs.tpd.medical_costs || ''}
                          onChange={(e) => updateNeeds('tpd', 'medical_costs', e.target.value)}
                        />
                      </td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="$" className="max-w-[140px] text-center mx-auto"
                          value={needs.trauma.medical_costs || ''}
                          onChange={(e) => updateNeeds('trauma', 'medical_costs', e.target.value)}
                        />
                      </td>
                      <td className="text-center p-3 text-slate-400">—</td>
                    </tr>

                    <tr className="bg-white border-t border-slate-200">
                      <td className="p-3 text-slate-700">Funeral costs</td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="$" className="max-w-[140px] text-center mx-auto"
                          value={needs.life.funeral_costs || ''}
                          onChange={(e) => updateNeeds('life', 'funeral_costs', e.target.value)}
                        />
                      </td>
                      <td className="text-center p-3 text-slate-400">—</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                    </tr>

                    <tr className="bg-white border-t border-slate-200">
                      <td className="p-3 text-slate-700">Home modifications / Recovery support</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="$" className="max-w-[140px] text-center mx-auto"
                          value={needs.tpd.home_modifications || ''}
                          onChange={(e) => updateNeeds('tpd', 'home_modifications', e.target.value)}
                        />
                      </td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="$" className="max-w-[140px] text-center mx-auto"
                          value={needs.trauma.home_modifications || ''}
                          onChange={(e) => updateNeeds('trauma', 'home_modifications', e.target.value)}
                        />
                      </td>
                      <td className="text-center p-3 text-slate-400">—</td>
                    </tr>

                    <tr className="bg-white border-t border-slate-200">
                      <td className="p-3 text-slate-700">Other upfront capital / Recovery</td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="$" className="max-w-[140px] text-center mx-auto"
                          value={needs.life.other_upfront || ''}
                          onChange={(e) => updateNeeds('life', 'other_upfront', e.target.value)}
                        />
                      </td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="$" className="max-w-[140px] text-center mx-auto"
                          value={needs.tpd.other_upfront || ''}
                          onChange={(e) => updateNeeds('tpd', 'other_upfront', e.target.value)}
                        />
                      </td>
                      <td className="text-center p-3">
                        <Input type="number" placeholder="$" className="max-w-[140px] text-center mx-auto"
                          value={needs.trauma.other_upfront || ''}
                          onChange={(e) => updateNeeds('trauma', 'other_upfront', e.target.value)}
                        />
                      </td>
                      <td className="text-center p-3 text-slate-400">—</td>
                    </tr>

                    {/* Capital Needs Total */}
                    <tr className="bg-slate-100 border-t border-slate-200">
                      <td className="p-3 font-bold text-slate-900">Capital needs total</td>
                      <td className="text-center p-3 font-bold">{formatCurrency(totals.life_capital)}</td>
                      <td className="text-center p-3 font-bold">{formatCurrency(totals.tpd_capital)}</td>
                      <td className="text-center p-3 font-bold">{formatCurrency(totals.trauma_capital)}</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                    </tr>

                    {/* Income Producing Capital */}
                    <tr className="bg-white border-t-2 border-slate-300">
                      <td className="p-3 font-bold text-slate-900 pt-4">Income Producing Capital Required</td>
                      <td></td><td></td><td></td><td></td>
                    </tr>

                    <tr className="bg-white border-t border-slate-200">
                      <td className="p-3">
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => setShowIncomeModal(true)}
                        >
                          Edit income required
                        </Button>
                      </td>
                      <td className="text-center p-3">{formatCurrency(totals.life_income_pv)}</td>
                      <td className="text-center p-3">{formatCurrency(totals.tpd_income_pv)}</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                    </tr>

                    {/* Capital & Income Total */}
                    <tr className="bg-slate-100 border-t border-slate-200">
                      <td className="p-3 font-bold text-slate-900">Capital & income needs</td>
                      <td className="text-center p-3 font-bold">{formatCurrency(totals.life_capital + totals.life_income_pv)}</td>
                      <td className="text-center p-3 font-bold">{formatCurrency(totals.tpd_capital + totals.tpd_income_pv)}</td>
                      <td className="text-center p-3 font-bold">{formatCurrency(totals.trauma_capital)}</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                    </tr>

                    {/* Income Protection Section */}
                    <tr className="bg-green-50 border-t-2 border-slate-300">
                      <td className="p-3 font-bold text-green-800 pt-4">Income Protection</td>
                      <td></td><td></td><td></td><td></td>
                    </tr>

                    <tr className="bg-white border-t border-slate-200">
                      <td className="p-3 text-slate-700">IP inputs</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                      <td className="text-center p-3">
                        <div className="flex gap-2 justify-center">
                          <Input 
                            type="number" 
                            placeholder="% salary" 
                            className="max-w-[100px] text-center"
                            value={needs.ip.pct_salary || ''}
                            onChange={(e) => updateNeeds('ip', 'pct_salary', e.target.value)}
                          />
                          <Input 
                            type="number" 
                            placeholder="% super" 
                            className="max-w-[100px] text-center"
                            value={needs.ip.pct_super || ''}
                            onChange={(e) => updateNeeds('ip', 'pct_super', e.target.value)}
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Initial Cover Required */}
                    <tr className="bg-green-50 border-t border-slate-200">
                      <td className="p-3 font-bold text-green-800">Initial cover required</td>
                      <td className="text-center p-3 font-bold text-green-800">{formatCurrency(totals.life_initial)}</td>
                      <td className="text-center p-3 font-bold text-green-800">{formatCurrency(totals.tpd_initial)}</td>
                      <td className="text-center p-3 font-bold text-green-800">{formatCurrency(totals.trauma_initial)}</td>
                      <td className="text-center p-3 font-bold text-green-800">{formatCurrency(totals.ip_monthly)} per month</td>
                    </tr>

                    {/* Adjustments Section */}
                    <tr className="bg-amber-50 border-t-2 border-slate-300">
                      <td className="p-3 font-bold text-amber-800 pt-4">Adjustments</td>
                      <td></td><td></td><td></td><td></td>
                    </tr>

                    <tr className="bg-white border-t border-slate-200">
                      <td className="p-3 text-slate-700">TPD tax uplift (estimate)</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                      <td className="text-center p-3">{formatCurrency(totals.tpd_tax_uplift)}</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                    </tr>

                    <tr className="bg-white border-t border-slate-200">
                      <td className="p-3">
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => setShowAssetsModal(true)}
                        >
                          Less realised assets
                        </Button>
                      </td>
                      <td className="text-center p-3 text-red-600">-{formatCurrency(totals.life_assets)}</td>
                      <td className="text-center p-3 text-red-600">-{formatCurrency(totals.tpd_assets)}</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                    </tr>

                    {/* Final Cover Required */}
                    <tr className="bg-[#0f4a8a] text-white border-t border-slate-200">
                      <td className="p-3 font-bold">Final cover required</td>
                      <td className="text-center p-3 font-bold">{formatCurrency(totals.life_final)}</td>
                      <td className="text-center p-3 font-bold">{formatCurrency(totals.tpd_final)}</td>
                      <td className="text-center p-3 font-bold">{formatCurrency(totals.trauma_final)}</td>
                      <td className="text-center p-3 text-slate-400">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
              )}

              {/* POLICIES TAB */}
              {activeTab === 'policies' && (
                <div className="space-y-4 mt-6">
              {/* Person Switcher */}
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                  {principals[0] && (
                    <button
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                        currentPerson === 'client' 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      onClick={() => setCurrentPerson('client')}
                    >
                      {principals[0].label || 'Client'}
                    </button>
                  )}
                  {principals[1] && (
                    <button
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                        currentPerson === 'partner' 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      onClick={() => setCurrentPerson('partner')}
                    >
                      {principals[1].label || 'Partner'}
                    </button>
                  )}
                </div>
                
                <Button 
                  className="bg-blue-600 hover:bg-blue-700" 
                  onClick={addNewPolicy}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add new policy
                </Button>
              </div>
              
              {/* Info Note */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 mb-4">
                Record existing and recommended policies for {currentPerson === 'client' ? (principals[0]?.label || 'Client') : (principals[1]?.label || 'Partner')}.
              </div>
              
              {/* Policies Summary Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm bg-white border border-slate-200 rounded-lg">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left p-3 font-bold text-slate-600 text-xs uppercase">Owner</th>
                      <th className="text-left p-3 font-bold text-slate-600 text-xs uppercase">Insured</th>
                      <th className="text-left p-3 font-bold text-slate-600 text-xs uppercase">Provider</th>
                      <th className="text-left p-3 font-bold text-slate-600 text-xs uppercase">Policy Type</th>
                      <th className="text-right p-3 font-bold text-slate-600 text-xs uppercase">Premium</th>
                      <th className="p-3 w-[100px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {policiesData.filter(p => p.person === currentPerson).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          No policies added yet. Click "Add new policy" to get started.
                        </td>
                      </tr>
                    ) : (
                      policiesData.filter(p => p.person === currentPerson).map((policy, index) => {
                        const actualIndex = policiesData.findIndex(p => p.id === policy.id);
                        return (
                          <tr key={policy.id} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="p-3 text-slate-700">{allEntities.find(e => e.id === policy.policy_owner)?.label || '—'}</td>
                            <td className="p-3 text-slate-700">{principals.find(p => p.id === policy.insured)?.label || '—'}</td>
                            <td className="p-3 text-slate-700">{policy.provider || '—'}</td>
                            <td className="p-3 text-slate-700">{policy.policy_type === '1' ? 'Inside super' : policy.policy_type === '2' ? 'Outside super' : '—'}</td>
                            <td className="p-3 text-right font-mono text-slate-700">
                              {policy.premium_amount ? formatCurrency(policy.premium_amount) : '—'}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => editPolicy(actualIndex)}
                                  className="text-slate-600 hover:text-slate-900"
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => removePolicy(actualIndex)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Policy Detail Form */}
              {showPolicyForm && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  {/* Form Header */}
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingPolicyIndex !== null ? 'Edit policy' : 'New policy'}
                    </h3>
                  </div>
                  
                  {/* Core Fields */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Policy owner</label>
                      <Select 
                        value={policyForm.policy_owner} 
                        onValueChange={(v) => updatePolicyForm('policy_owner', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allEntities.map(e => (
                            <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Insured</label>
                      <Select 
                        value={policyForm.insured} 
                        onValueChange={(v) => updatePolicyForm('insured', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select insured..." />
                        </SelectTrigger>
                        <SelectContent>
                          {principals.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Provider</label>
                      <Input 
                        placeholder="e.g. TAL, AIA, MLC"
                        value={policyForm.provider}
                        onChange={(e) => updatePolicyForm('provider', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Policy number</label>
                      <Input 
                        placeholder="e.g. POL123456"
                        value={policyForm.policy_number}
                        onChange={(e) => updatePolicyForm('policy_number', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Policy type</label>
                      <Select 
                        value={policyForm.policy_type} 
                        onValueChange={(v) => updatePolicyForm('policy_type', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Inside super</SelectItem>
                          <SelectItem value="2">Outside super</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Premium type</label>
                      <Select 
                        value={policyForm.premium_type} 
                        onValueChange={(v) => updatePolicyForm('premium_type', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Stepped</SelectItem>
                          <SelectItem value="2">Level</SelectItem>
                          <SelectItem value="3">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Premium frequency</label>
                      <Select 
                        value={policyForm.premium_frequency} 
                        onValueChange={(v) => updatePolicyForm('premium_frequency', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Monthly</SelectItem>
                          <SelectItem value="2">Quarterly</SelectItem>
                          <SelectItem value="3">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Premium amount</label>
                      <Input 
                        type="number"
                        placeholder="$"
                        value={policyForm.premium_amount}
                        onChange={(e) => updatePolicyForm('premium_amount', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Life Cover Section */}
                  <div className={`border rounded-lg p-4 mt-4 transition-all ${
                    policyForm.include_life 
                      ? 'border-slate-200 bg-white' 
                      : 'border-slate-100 bg-slate-50 opacity-60'
                  }`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold text-slate-700">Life cover</span>
                      <Checkbox 
                        checked={policyForm.include_life}
                        onCheckedChange={(checked) => updatePolicyForm('include_life', checked)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Sum insured (Life)</label>
                        <Input 
                          type="number"
                          placeholder="$"
                          value={policyForm.life_sum_insured}
                          onChange={(e) => updatePolicyForm('life_sum_insured', e.target.value)}
                          disabled={!policyForm.include_life}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Premium (Life)</label>
                        <Input 
                          type="number"
                          placeholder="$"
                          value={policyForm.life_premium}
                          onChange={(e) => updatePolicyForm('life_premium', e.target.value)}
                          disabled={!policyForm.include_life}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* TPD Cover Section */}
                  <div className={`border rounded-lg p-4 mt-4 transition-all ${
                    policyForm.include_tpd 
                      ? 'border-slate-200 bg-white' 
                      : 'border-slate-100 bg-slate-50 opacity-60'
                  }`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold text-slate-700">TPD cover</span>
                      <Checkbox 
                        checked={policyForm.include_tpd}
                        onCheckedChange={(checked) => updatePolicyForm('include_tpd', checked)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Sum insured (TPD)</label>
                        <Input 
                          type="number"
                          placeholder="$"
                          value={policyForm.tpd_sum_insured}
                          onChange={(e) => updatePolicyForm('tpd_sum_insured', e.target.value)}
                          disabled={!policyForm.include_tpd}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Premium (TPD)</label>
                        <Input 
                          type="number"
                          placeholder="$"
                          value={policyForm.tpd_premium}
                          onChange={(e) => updatePolicyForm('tpd_premium', e.target.value)}
                          disabled={!policyForm.include_tpd}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">TPD definition</label>
                        <Select 
                          value={policyForm.tpd_definition} 
                          onValueChange={(v) => updatePolicyForm('tpd_definition', v)}
                          disabled={!policyForm.include_tpd}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Any occupation</SelectItem>
                            <SelectItem value="2">Own occupation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Notes (optional)</label>
                        <Input 
                          placeholder="Additional notes..."
                          value={policyForm.tpd_notes}
                          onChange={(e) => updatePolicyForm('tpd_notes', e.target.value)}
                          disabled={!policyForm.include_tpd}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Trauma Cover Section */}
                  <div className={`border rounded-lg p-4 mt-4 transition-all ${
                    policyForm.include_trauma 
                      ? 'border-slate-200 bg-white' 
                      : 'border-slate-100 bg-slate-50 opacity-60'
                  }`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold text-slate-700">Trauma cover</span>
                      <Checkbox 
                        checked={policyForm.include_trauma}
                        onCheckedChange={(checked) => updatePolicyForm('include_trauma', checked)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Sum insured (Trauma)</label>
                        <Input 
                          type="number"
                          placeholder="$"
                          value={policyForm.trauma_sum_insured}
                          onChange={(e) => updatePolicyForm('trauma_sum_insured', e.target.value)}
                          disabled={!policyForm.include_trauma}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Premium (Trauma)</label>
                        <Input 
                          type="number"
                          placeholder="$"
                          value={policyForm.trauma_premium}
                          onChange={(e) => updatePolicyForm('trauma_premium', e.target.value)}
                          disabled={!policyForm.include_trauma}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Key events / comments</label>
                        <Input 
                          placeholder="e.g. Cancer, Heart attack, Stroke..."
                          value={policyForm.trauma_notes}
                          onChange={(e) => updatePolicyForm('trauma_notes', e.target.value)}
                          disabled={!policyForm.include_trauma}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Income Protection Section */}
                  <div className={`border rounded-lg p-4 mt-4 transition-all ${
                    policyForm.include_ip 
                      ? 'border-slate-200 bg-white' 
                      : 'border-slate-100 bg-slate-50 opacity-60'
                  }`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold text-slate-700">Income Protection</span>
                      <Checkbox 
                        checked={policyForm.include_ip}
                        onCheckedChange={(checked) => updatePolicyForm('include_ip', checked)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Monthly benefit</label>
                        <Input 
                          type="number"
                          placeholder="$ per month"
                          value={policyForm.ip_monthly_benefit}
                          onChange={(e) => updatePolicyForm('ip_monthly_benefit', e.target.value)}
                          disabled={!policyForm.include_ip}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Premium (IP)</label>
                        <Input 
                          type="number"
                          placeholder="$"
                          value={policyForm.ip_premium}
                          onChange={(e) => updatePolicyForm('ip_premium', e.target.value)}
                          disabled={!policyForm.include_ip}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Waiting period</label>
                        <Select 
                          value={policyForm.ip_waiting_period} 
                          onValueChange={(v) => updatePolicyForm('ip_waiting_period', v)}
                          disabled={!policyForm.include_ip}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">30 days</SelectItem>
                            <SelectItem value="2">60 days</SelectItem>
                            <SelectItem value="3">90 days</SelectItem>
                            <SelectItem value="4">120 days</SelectItem>
                            <SelectItem value="5">180 days</SelectItem>
                            <SelectItem value="6">1 year</SelectItem>
                            <SelectItem value="7">2 years</SelectItem>
                            <SelectItem value="8">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Benefit period</label>
                        <Select 
                          value={policyForm.ip_benefit_period} 
                          onValueChange={(v) => updatePolicyForm('ip_benefit_period', v)}
                          disabled={!policyForm.include_ip}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">180 days</SelectItem>
                            <SelectItem value="3">1 year</SelectItem>
                            <SelectItem value="4">2 years</SelectItem>
                            <SelectItem value="5">3 years</SelectItem>
                            <SelectItem value="6">5 years</SelectItem>
                            <SelectItem value="7">To age 60</SelectItem>
                            <SelectItem value="8">To age 65</SelectItem>
                            <SelectItem value="9">To age 67</SelectItem>
                            <SelectItem value="10">To age 70</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
                    <Button variant="outline" onClick={cancelPolicyEdit}>
                      Cancel
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={savePolicy}>
                      Save policy
                    </Button>
                  </div>
                </div>
              )}
              </TabsContent>
              </Tabs>
              </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-end gap-3" style={{ padding: '24px 32px', borderTop: '1px solid #E2E8F0' }}>
              <Button 
              variant="outline"
              onClick={() => navigate(createPageUrl('SOARequestProducts') + `?id=${soaRequest.id}`)}
              >
              Back
              </Button>
              <Button 
              onClick={handleSave}
              disabled={saving}
              style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
              className="hover:opacity-90"
              >
              {saving ? 'Saving...' : 'Save & Continue'}
              </Button>
              </div>
              </div>
              </div>
              </div>

      {/* KEY ASSUMPTIONS MODAL */}
      <Dialog open={showAssumptionsModal} onOpenChange={setShowAssumptionsModal}>
        <DialogContent className="max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Key Assumptions</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Info Note */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
             Configure key assumptions for {currentPerson === 'client' ? (principals[0]?.label || 'Client') : (principals[1]?.label || 'Partner')}
            </div>
            
            {/* Personal Details Section */}
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="text-xs font-bold uppercase text-slate-500 mb-4 pb-2 border-b border-slate-200">
                Personal Details
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Date of birth</label>
                  <Input 
                    type="date" 
                    value={assumptions.date_of_birth}
                    onChange={(e) => updateAssumptions('date_of_birth', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">ESP start date</label>
                  <Input 
                    type="date"
                    value={assumptions.esp_start_date}
                    onChange={(e) => updateAssumptions('esp_start_date', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Service end date</label>
                  <Input 
                    type="date"
                    value={assumptions.service_end_date}
                    onChange={(e) => updateAssumptions('service_end_date', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Retirement age</label>
                  <Input 
                    type="number"
                    placeholder="65"
                    value={assumptions.retirement_age}
                    onChange={(e) => updateAssumptions('retirement_age', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* TPD Tax Settings Section */}
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="text-xs font-bold uppercase text-slate-500 mb-4 pb-2 border-b border-slate-200">
                TPD Tax Settings
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">TPD held inside super?</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="inside_super" 
                        value="yes"
                        checked={assumptions.tpd_inside_super === true}
                        onChange={() => updateAssumptions('tpd_inside_super', true)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="inside_super" 
                        value="no"
                        checked={assumptions.tpd_inside_super === false}
                        onChange={() => updateAssumptions('tpd_inside_super', false)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="override_tax"
                    checked={assumptions.override_tpd_tax}
                    onCheckedChange={(checked) => updateAssumptions('override_tpd_tax', checked)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label htmlFor="override_tax" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Override TPD tax uplift manually
                  </label>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Override uplift % (optional)</label>
                  <Input 
                    type="number"
                    placeholder="e.g. 15"
                    className="max-w-[200px]"
                    value={assumptions.override_uplift_pct}
                    onChange={(e) => updateAssumptions('override_uplift_pct', e.target.value)}
                    disabled={!assumptions.override_tpd_tax}
                  />
                </div>
              </div>
            </div>
            
            {/* Financial References Section */}
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="text-xs font-bold uppercase text-slate-500 mb-4 pb-2 border-b border-slate-200">
                Financial References
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Mortgage balance to consider</label>
                  <Input 
                    type="number"
                    placeholder="$"
                    value={assumptions.mortgage_balance}
                    onChange={(e) => updateAssumptions('mortgage_balance', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Other debts to consider</label>
                  <Input 
                    type="number"
                    placeholder="$"
                    value={assumptions.other_debts}
                    onChange={(e) => updateAssumptions('other_debts', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Current salary (annual)</label>
                  <Input 
                    type="number"
                    placeholder="$"
                    value={assumptions.annual_salary}
                    onChange={(e) => updateAssumptions('annual_salary', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Discount rate (% p.a.)</label>
                  <Input 
                    type="number"
                    placeholder="%"
                    value={assumptions.discount_rate}
                    onChange={(e) => updateAssumptions('discount_rate', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Calculated Metrics Section */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="text-xs font-bold uppercase text-slate-500 mb-4 pb-2 border-b border-slate-200">
                Calculated Metrics (Read-only)
              </div>
              <div className="space-y-2">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-slate-500">Age at service end:</span>
                  <span className="font-bold text-slate-900">{calculatedMetrics.age_at_service_end || '—'}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-slate-500">Service days:</span>
                  <span className="font-bold text-slate-900">{calculatedMetrics.service_days?.toLocaleString() || '—'}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-slate-500">Days to retirement:</span>
                  <span className="font-bold text-slate-900">{calculatedMetrics.days_to_retirement?.toLocaleString() || '—'}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-slate-500">Taxable proportion:</span>
                  <span className="font-bold text-slate-900">{calculatedMetrics.taxable_proportion ? `${(calculatedMetrics.taxable_proportion * 100).toFixed(2)}%` : '—'}</span>
                </div>
                <div className="flex justify-between py-2 text-sm border-t border-slate-200 mt-2 pt-3">
                  <span className="text-slate-500">Calculated uplift % (before override):</span>
                  <span className="font-bold text-slate-900">{calculatedMetrics.calculated_uplift ? `${(calculatedMetrics.calculated_uplift * 100).toFixed(2)}%` : '—'}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-slate-500">Uplift % actually applied:</span>
                  <span className="font-bold text-slate-900">{calculatedMetrics.applied_uplift ? `${(calculatedMetrics.applied_uplift * 100).toFixed(2)}%` : '0%'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssumptionsModal(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAssumptionsModal(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* INCOME MODAL */}
      <Dialog open={showIncomeModal} onOpenChange={setShowIncomeModal}>
        <DialogContent className="max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Income Required</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Info Note */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              Add income streams to calculate the capital required to replace income. PV uses (growth − discount) rate.
            </div>
            
            {/* Header Row */}
            <div className="grid grid-cols-7 gap-2 py-2 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
              <div className="col-span-1">Item to cover</div>
              <div className="col-span-1">Insurance type</div>
              <div className="col-span-1">Growth (%)</div>
              <div className="col-span-1">Annual income ($)</div>
              <div className="col-span-1">Years</div>
              <div className="col-span-1 text-right">PV (today)</div>
              <div className="col-span-1"></div>
            </div>
            
            {/* Income Rows */}
            {currentPersonData.income_rows.map((row, index) => (
              <div key={row.id} className="grid grid-cols-7 gap-2 py-2 items-center border-b border-slate-100">
                <div>
                  <Select value={row.item} onValueChange={(v) => updateIncomeRow(index, 'item', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Living expenses">Living expenses</SelectItem>
                      <SelectItem value="Education costs">Education costs</SelectItem>
                      <SelectItem value="Mortgage repayments">Mortgage repayments</SelectItem>
                      <SelectItem value="Ongoing care costs">Ongoing care costs</SelectItem>
                      <SelectItem value="Partner income replacement">Partner income replacement</SelectItem>
                      <SelectItem value="Other income needs">Other income needs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 p-2 bg-slate-50 border border-slate-200 rounded-md">
                  <label className="flex items-center gap-1 text-sm cursor-pointer text-slate-900">
                    <Checkbox 
                      checked={row.life}
                      onCheckedChange={(checked) => updateIncomeRow(index, 'life', checked)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <span className="text-slate-900">Life</span>
                  </label>
                  <label className="flex items-center gap-1 text-sm cursor-pointer text-slate-900">
                    <Checkbox 
                      checked={row.tpd}
                      onCheckedChange={(checked) => updateIncomeRow(index, 'tpd', checked)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <span className="text-slate-900">TPD</span>
                  </label>
                </div>
                <div>
                  <Input 
                    type="number"
                    placeholder="%"
                    value={row.growth || ''}
                    onChange={(e) => updateIncomeRow(index, 'growth', e.target.value)}
                  />
                </div>
                <div>
                  <Input 
                    type="number"
                    placeholder="$"
                    value={row.annual_income || ''}
                    onChange={(e) => updateIncomeRow(index, 'annual_income', e.target.value)}
                  />
                </div>
                <div>
                  <Input 
                    type="number"
                    placeholder="Years"
                    value={row.years || ''}
                    onChange={(e) => updateIncomeRow(index, 'years', e.target.value)}
                  />
                </div>
                <div className="text-right p-2 bg-slate-100 border border-slate-200 rounded-md font-semibold text-sm">
                  {formatCurrency(row.pv)}
                </div>
                <div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeIncomeRow(index)}
                    className="w-8 h-8 p-0 bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Footer with Add Row and Totals */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={addIncomeRow}>
                + Add row
              </Button>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">Total PV — Life</span>
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md font-semibold text-sm min-w-[120px] text-right">
                    {formatCurrency(incomeTotals.life_pv)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">Total PV — TPD</span>
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md font-semibold text-sm min-w-[120px] text-right">
                    {formatCurrency(incomeTotals.tpd_pv)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIncomeModal(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowIncomeModal(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASSETS MODAL */}
      <Dialog open={showAssetsModal} onOpenChange={setShowAssetsModal}>
        <DialogContent className="max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Less Realised Assets</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Info Note */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              Add assets that would be realised (sold/accessed) in the event of death or TPD to reduce the cover required.
            </div>
            
            {/* Header Row */}
            <div className="grid grid-cols-4 gap-2 py-2 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
              <div>Select asset</div>
              <div>Insurance type</div>
              <div className="text-right">Asset value ($)</div>
              <div></div>
            </div>
            
            {/* Asset Rows */}
            {currentPersonData.asset_rows.map((row, index) => {
              const assetList = buildAssetList();
              return (
                <div key={row.id} className="grid grid-cols-4 gap-2 py-2 items-center border-b border-slate-100">
                  <div>
                    <select
                      value={row.asset_id || ''}
                      onChange={(e) => handleAssetSelect(index, e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Select asset...</option>
                      
                      {assetList.filter(a => a.type === 'Superannuation').length > 0 && (
                        <optgroup label="Superannuation">
                          {assetList.filter(a => a.type === 'Superannuation').map(a => (
                            <option key={a.id} value={a.id}>{a.label}</option>
                          ))}
                        </optgroup>
                      )}
                      
                      {assetList.filter(a => a.type === 'Pension').length > 0 && (
                        <optgroup label="Pension">
                          {assetList.filter(a => a.type === 'Pension').map(a => (
                            <option key={a.id} value={a.id}>{a.label}</option>
                          ))}
                        </optgroup>
                      )}
                      
                      {assetList.filter(a => a.type === 'Investment').length > 0 && (
                        <optgroup label="Investments">
                          {assetList.filter(a => a.type === 'Investment').map(a => (
                            <option key={a.id} value={a.id}>{a.label}</option>
                          ))}
                        </optgroup>
                      )}
                      
                      {assetList.filter(a => a.type?.startsWith('New')).length > 0 && (
                        <optgroup label="New Products (SOA)">
                          {assetList.filter(a => a.type?.startsWith('New')).map(a => (
                            <option key={a.id} value={a.id}>{a.label}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <div className="flex gap-3 p-2 bg-slate-50 border border-slate-200 rounded-md">
                    <label className="flex items-center gap-1 text-sm cursor-pointer text-slate-900">
                      <Checkbox 
                        checked={row.life}
                        onCheckedChange={(checked) => updateAssetRow(index, 'life', checked)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <span className="text-slate-900">Life</span>
                    </label>
                    <label className="flex items-center gap-1 text-sm cursor-pointer text-slate-900">
                      <Checkbox 
                        checked={row.tpd}
                        onCheckedChange={(checked) => updateAssetRow(index, 'tpd', checked)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <span className="text-slate-900">TPD</span>
                    </label>
                  </div>
                  <div>
                    <Input 
                      type="number"
                      placeholder="$"
                      value={row.value || ''}
                      onChange={(e) => updateAssetRow(index, 'value', e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeAssetRow(index)}
                      className="w-8 h-8 p-0 bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {/* Footer with Add Row and Totals */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={addAssetRow}>
                + Add row
              </Button>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">Applied to Life</span>
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md font-semibold text-sm min-w-[120px] text-right">
                    {formatCurrency(assetTotals.life)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">Applied to TPD</span>
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md font-semibold text-sm min-w-[120px] text-right">
                    {formatCurrency(assetTotals.tpd)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssetsModal(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAssetsModal(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SOARequestLayout>
  );
}