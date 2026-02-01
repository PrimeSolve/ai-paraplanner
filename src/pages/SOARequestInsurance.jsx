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
import { Settings, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SOARequestInsurance() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [factFind, setFactFind] = useState(null);
  const [currentPerson, setCurrentPerson] = useState('client');
  const [clientName, setClientName] = useState('Client');
  const [partnerName, setPartnerName] = useState('Partner');
  
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
          const requests = await base44.entities.SOARequest.filter({ id });
          if (requests[0]) {
            setSOARequest(requests[0]);
            const insurance = requests[0].insurance || { client: getDefaultPersonData(), partner: getDefaultPersonData() };
            setInsuranceData(insurance);

            // Load fact find for names
            if (requests[0].fact_find_id) {
              const factFinds = await base44.entities.FactFind.filter({ id: requests[0].fact_find_id });
              if (factFinds[0]) {
                setFactFind(factFinds[0]);
                const personal = factFinds[0].personal || {};
                setClientName(`${personal.first_name || ''} ${personal.last_name || ''}`.trim() || 'Client');
                setPartnerName(personal.partner_first_name ? `${personal.partner_first_name} ${personal.partner_last_name || ''}`.trim() : 'Partner');
              }
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        insurance: insuranceData
      });
      toast.success('Insurance details saved');
      navigate(createPageUrl('SOARequestTransactions') + `?id=${soaRequest.id}`);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

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
        <div className="w-full space-y-6">
          {/* Info Banner */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-bold text-slate-800 mb-2">Insurance</h3>
              <p className="text-sm text-slate-700">
                Use the calculators to build insurance needs and define recommended products
              </p>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="needs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="needs">Needs</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
            </TabsList>

            {/* NEEDS TAB */}
            <TabsContent value="needs" className="space-y-4 mt-6">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                {/* Person Switcher */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      currentPerson === 'client' 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    onClick={() => setCurrentPerson('client')}
                  >
                    {clientName}
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      currentPerson === 'partner' 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    onClick={() => setCurrentPerson('partner')}
                  >
                    {partnerName}
                  </button>
                </div>
                
                {/* Key Assumptions Button */}
                <Button 
                  variant="outline" 
                  onClick={() => setShowAssumptionsModal(true)}
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
            </TabsContent>

            {/* POLICIES TAB */}
            <TabsContent value="policies" className="space-y-4 mt-6">
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-5xl mb-6">🛡️</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Policies section coming soon</h3>
                <p className="text-slate-600 text-center mb-8 max-w-md">
                  This section will allow you to record existing and recommended insurance policies
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Navigation */}
          <div className="flex justify-end gap-3 py-6">
            <Button 
              variant="outline"
              onClick={() => navigate(createPageUrl('SOARequestProducts') + `?id=${soaRequest.id}`)}
            >
              Back
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </Button>
          </div>
        </div>
      </div>

      {/* KEY ASSUMPTIONS MODAL - Placeholder */}
      <Dialog open={showAssumptionsModal} onOpenChange={setShowAssumptionsModal}>
        <DialogContent className="max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Key Assumptions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Assumptions modal to be implemented</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssumptionsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* INCOME MODAL - Placeholder */}
      <Dialog open={showIncomeModal} onOpenChange={setShowIncomeModal}>
        <DialogContent className="max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Income Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Income modal to be implemented</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIncomeModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASSETS MODAL - Placeholder */}
      <Dialog open={showAssetsModal} onOpenChange={setShowAssetsModal}>
        <DialogContent className="max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Less Realised Assets</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Assets modal to be implemented</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssetsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SOARequestLayout>
  );
}