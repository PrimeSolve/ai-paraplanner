import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// DROPDOWN OPTIONS
// ============================================================================

const DRAWDOWN_PRIORITIES = [
  { value: 'Superannuation', label: 'Superannuation' },
  { value: 'Pension', label: 'Pension' },
  { value: 'Portfolio', label: 'Portfolio' },
  { value: 'Debt drawdown', label: 'Debt drawdown' },
  { value: 'Investment property', label: 'Investment property' },
  { value: 'Principal residence', label: 'Principal residence' }
];

const PORTFOLIO_PRIORITIES = [
  { value: 'Minimise tax', label: 'Minimise tax' },
  { value: 'Defensive first', label: 'Defensive first' },
  { value: 'Aggressive first', label: 'Aggressive first' }
];

const SURPLUS_PRIORITIES = [
  { value: 'Build cash', label: 'Build cash' },
  { value: 'Non-deductible debt', label: 'Non-deductible debt' },
  { value: 'Deductible debt', label: 'Deductible debt' },
  { value: 'Concessional', label: 'Concessional' },
  { value: 'Non-concessional (Super)', label: 'Non-concessional (Super)' },
  { value: 'Model portfolio (no gearing)', label: 'Model portfolio (no gearing)' },
  { value: 'Model portfolio (gearing)', label: 'Model portfolio (gearing)' },
  { value: 'Investment property (no gearing)', label: 'Investment property (no gearing)' },
  { value: 'Investment property (gearing)', label: 'Investment property (gearing)' },
  { value: 'Investment bond', label: 'Investment bond' },
  { value: 'Annuity (Lifetime)', label: 'Annuity (Lifetime)' },
  { value: 'Principal residence', label: 'Principal residence' },
  { value: 'Utilise offset account', label: 'Utilise offset account' },
  { value: 'Optimise redraw facility', label: 'Optimise redraw facility' },
  { value: 'Meet emergency funding/savings goals', label: 'Meet emergency funding/savings goals' },
  { value: 'Debt recycling', label: 'Debt recycling' }
];

const STRATEGY_OPTIONS = [
  { value: '1', label: 'Apply for government pay' },
  { value: '3', label: 'Borrow within an insurance bond product' },
  { value: '13', label: 'Change repayment frequency' },
  { value: '14', label: 'Commence a new pension' },
  { value: '15', label: 'Commence a Transition to Retirement pension' },
  { value: '17', label: 'Contribute to existing insurance bond' },
  { value: '18', label: 'Convert loan to interest only' },
  { value: '20', label: 'Distribute dividend' },
  { value: '23', label: 'Drawdown pension payment' },
  { value: '28', label: 'Establish a testamentary trust in your will' },
  { value: '33', label: 'Gift money to beneficiaries' },
  { value: '35', label: 'Hedge against market risk' },
  { value: '36', label: 'Hedge against overweight asset position' },
  { value: '42', label: 'Increase debt amount' },
  { value: '44', label: 'Invest in agribusiness project' },
  { value: '47', label: 'Maintain savings buffer' },
  { value: '48', label: 'Make a binding nomination on your superannuation account' },
  { value: '51', label: 'Make a personal contribution to your trust' },
  { value: '52', label: 'Make a self employed tax deductible contribution' },
  { value: '54', label: 'Make annual debt repayments' },
  { value: '55', label: 'Make non-concessional contribution to superannuation' },
  { value: '56', label: 'Move back into your principal residence' },
  { value: '57', label: 'Move into Aged Care' },
  { value: '58', label: 'Nominate 54/11 and return to work post 55' },
  { value: '62', label: 'Nominate reversionary beneficiary for pension account' },
  { value: '63', label: 'Nominate to have superannuation contributions split to partner' },
  { value: '65', label: 'Pay a Refundable Approved Deposit (RAD)' },
  { value: '66', label: 'Pay down debt' },
  { value: '67', label: 'Pay salary into offset account' },
  { value: '69', label: 'Pledge asset as security for loan' },
  { value: '82', label: 'Redeem annuity' },
  { value: '83', label: 'Reduce discretionary spending' },
  { value: '86', label: 'Re-invest dividends' },
  { value: '87', label: 'Rent out holiday home' },
  { value: '88', label: 'Rent out your principal residence' },
  { value: '91', label: 'Retain asset' },
  { value: '94', label: 'Roll cash into a Seperately Managed Account (SMA)' },
  { value: '95', label: 'Roll cash into an Individually Managed Account (IMA)' },
  { value: '96', label: 'Roll existing pension to new Account Based Pension' },
  { value: '97', label: 'Roll money from pension to super' },
  { value: '98', label: 'Roll money from super to pension' },
  { value: '101', label: 'Salary sacrifice to superannuation' },
  { value: '107', label: 'Take lump sum and re-contribute back to partners superannuation' },
  { value: '108', label: 'Take lump sum and re-contribute back to superannuation' },
  { value: '109', label: 'Take out credit card (bad debt) to fund lifestyle requirements' },
  { value: '118', label: 'Take superannuation as a lump sum' },
  { value: '119', label: 'Take superannuation as a pension' },
  { value: '120', label: 'Take superannuation as a combination of lump sum and pension' },
  { value: '121', label: 'Transfer asset into IMA' },
  { value: '122', label: 'Transfer asset into SMA' },
  { value: '123', label: 'Transfer asset into SMSF in-specie' },
  { value: '127', label: 'Wind up company' },
  { value: '128', label: 'Wind up trust' },
  { value: '129', label: 'Wind up your SMSF' },
  { value: '130', label: 'Withdraw a lump sum from superannuation' },
  { value: '137', label: 'Establish a granny flat interest - Property transfer' },
  { value: '138', label: 'Establish a granny flat interest - Funds transfer' },
  { value: '145', label: 'Establish a home care package' },
  { value: '152', label: 'Contribute to education bond' },
  { value: '156', label: 'Set aside savings to meet goals' },
  { value: '157', label: 'Maintain existing budget' },
  { value: '158', label: 'Salary package debt' },
  { value: '169', label: 'Small business (not eligible for 15 year exemption)' },
  { value: '173', label: 'Small business CGT concessions (eligible for 15-year exemption)' },
  { value: '177', label: 'Withdraw investment - Wrap' },
  { value: '180', label: 'Pension - withdraw lump sum' },
  { value: '184', label: 'Commute existing pension, consolidate super, commence new pension' },
  { value: '185', label: 'Decrease pension payment' },
  { value: '186', label: 'Lifetime annuity (super)' },
  { value: '190', label: 'Purchase business real property from business' },
  { value: '206', label: 'Apply for funeral bond' },
  { value: '210', label: 'Apply for Newstart allowance' },
  { value: '218', label: 'Apply for Commonwealth Seniors Health Card' },
  { value: '219', label: 'Apply for disability support pension' },
  { value: '220', label: 'Rent and purchase later' },
  { value: '222', label: 'Utilise redraw facility' },
  { value: '234', label: 'Downsizer contribution' },
  { value: '254', label: 'Establish a managed discretionary account' },
  { value: '263', label: 'Transfer assets to related party' },
  { value: '268', label: 'Contribute / gift money to principal entity' }
];

// Generate year options
const YEAR_OPTIONS = [];
for (let year = 2025; year <= 2050; year++) {
  YEAR_OPTIONS.push({ value: String(year), label: String(year) });
}

const END_YEAR_OPTIONS = [
  { value: 'Ongoing', label: 'Ongoing' },
  ...YEAR_OPTIONS
];

// Helpers
const generateId = () => 'id_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
const getStrategyLabel = (id) => STRATEGY_OPTIONS.find(s => s.value === id)?.label || id || '—';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SOARequestStrategy() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [clientId, setClientId] = useState(null);
  
  // Data
  const [models, setModels] = useState([]);
  const [strategies, setStrategies] = useState([]);
  
  // Entity options for dropdowns
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [assetOptions, setAssetOptions] = useState([]);
  const [debtOptions, setDebtOptions] = useState([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState('models');
  const [editingModelId, setEditingModelId] = useState(null);
  const [editingStrategyId, setEditingStrategyId] = useState(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      
      if (!id) {
        toast.error('No SOA Request ID provided');
        setLoading(false);
        return;
      }

      const requests = await base44.entities.SOARequest.filter({ id });
      if (!requests[0]) {
        toast.error('SOA Request not found');
        setLoading(false);
        return;
      }
      
      const soaReq = requests[0];
      setSOARequest(soaReq);
      setClientId(soaReq.client_id);
      
      // Load strategy data
      const strategyData = soaReq.strategy || {};
      setModels(strategyData.models || []);
      setStrategies(strategyData.strategies || []);
      
      // Load entity options
      await loadEntityOptions(soaReq.client_id, soaReq);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadEntityOptions = async (clientId, soaReq) => {
    try {
      const owners = [];
      const products = [];
      const assets = [];
      const debts = [];
      
      // Load principals
      try {
        const principals = await base44.entities.Principal?.filter({ client_id: clientId });
        if (principals) {
          principals.forEach(p => {
            const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
            owners.push({ value: p.id, label: name || (p.role === 'client' ? 'Client' : 'Partner') });
          });
        }
      } catch (e) {}
      
      // Load trusts, companies, SMSFs for owners
      try {
        const trusts = await base44.entities.Trust?.filter({ client_id: clientId });
        if (trusts) trusts.forEach(t => owners.push({ value: t.id, label: `${t.name} (Trust)` }));
      } catch (e) {}
      
      try {
        const companies = await base44.entities.Company?.filter({ client_id: clientId });
        if (companies) companies.forEach(c => owners.push({ value: c.id, label: `${c.name} (Company)` }));
      } catch (e) {}
      
      try {
        const smsfs = await base44.entities.SMSF?.filter({ client_id: clientId });
        if (smsfs) smsfs.forEach(s => owners.push({ value: s.id, label: `${s.name} (SMSF)` }));
      } catch (e) {}
      
      // Load products
      try {
        const superFunds = await base44.entities.SuperFund?.filter({ client_id: clientId });
        if (superFunds) superFunds.forEach(f => products.push({ value: f.id, label: `${f.name} (Super)` }));
      } catch (e) {}
      
      try {
        const pensions = await base44.entities.Pension?.filter({ client_id: clientId });
        if (pensions) pensions.forEach(p => products.push({ value: p.id, label: `${p.name} (Pension)` }));
      } catch (e) {}
      
      // Load assets
      try {
        const assetList = await base44.entities.Asset?.filter({ client_id: clientId });
        if (assetList) assetList.forEach(a => assets.push({ value: a.id, label: a.name }));
      } catch (e) {}
      
      // Load debts
      try {
        const debtList = await base44.entities.Liability?.filter({ client_id: clientId });
        if (debtList) debtList.forEach(d => debts.push({ value: d.id, label: d.name }));
      } catch (e) {}
      
      setOwnerOptions(owners);
      setProductOptions(products);
      setAssetOptions(assets);
      setDebtOptions(debts);
      
    } catch (error) {
      console.error('Error loading entity options:', error);
    }
  };

  // ============================================================================
  // MODEL CRUD
  // ============================================================================

  const addModel = () => {
    const newModel = {
      id: generateId(),
      name: '',
      description: '',
      drawdown_priority_1: '',
      drawdown_priority_2: '',
      drawdown_priority_3: '',
      portfolio_priority: '',
      surplus_priority_1: '',
      surplus_priority_2: '',
      surplus_priority_3: '',
      preferred_entity_ids: [],
      preferred_entity_geared_ids: [],
      entity_property_ids: [],
      entity_property_geared_ids: []
    };
    setModels([...models, newModel]);
    setEditingModelId(newModel.id);
  };

  const updateModel = (id, field, value) => {
    setModels(models.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const deleteModel = (id) => {
    if (!confirm('Delete this model?')) return;
    setModels(models.filter(m => m.id !== id));
    if (editingModelId === id) setEditingModelId(null);
  };

  // ============================================================================
  // STRATEGY CRUD
  // ============================================================================

  const addStrategy = () => {
    const newStrategy = {
      id: generateId(),
      strategy_id: '',
      owner_id: '',
      start_year: '',
      end_year: '',
      amount: '',
      product_id: '',
      asset_id: '',
      debt_id: '',
      advice_model_ids: [],
      notes: ''
    };
    setStrategies([...strategies, newStrategy]);
    setEditingStrategyId(newStrategy.id);
  };

  const updateStrategy = (id, field, value) => {
    setStrategies(strategies.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteStrategy = (id) => {
    if (!confirm('Delete this strategy?')) return;
    setStrategies(strategies.filter(s => s.id !== id));
    if (editingStrategyId === id) setEditingStrategyId(null);
  };

  // ============================================================================
  // SAVE
  // ============================================================================

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        strategy: {
          models: models,
          strategies: strategies
        }
      });
      toast.success('Strategy saved');
      navigate(createPageUrl('SOARequestAssumptions') + `?id=${soaRequest.id}`);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getOwnerLabel = (id) => ownerOptions.find(o => o.value === id)?.label || '—';

  // ============================================================================
  // LOADING
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SOARequestLayout currentSection="strategy" soaRequest={soaRequest}>
      <div className="flex-1 overflow-auto bg-slate-50">
        {/* Dark Banner */}
        <div style={{ backgroundColor: '#1E293B', padding: '24px 32px', borderRadius: '16px 16px 0 0' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
            Strategy
          </h1>
          <p style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8', margin: 0 }}>
            Specify advice models to compare cashflow scenarios, as well as add strategy recommendations to your advice
          </p>
        </div>

        {/* White Content Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0 0 16px 16px', border: '1px solid #E2E8F0', borderTop: 'none' }}>
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="models">Models</TabsTrigger>
                <TabsTrigger value="strategies">Strategies</TabsTrigger>
              </TabsList>

              {/* ============================================================ */}
              {/* MODELS TAB */}
              {/* ============================================================ */}
              <TabsContent value="models" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Advice Models</h2>
                  <Button onClick={addModel} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> Add Model
                  </Button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-bold">Model Name</TableHead>
                        <TableHead className="font-bold">Drawdown P1</TableHead>
                        <TableHead className="font-bold">Surplus P1</TableHead>
                        <TableHead className="font-bold">Portfolio Priority</TableHead>
                        <TableHead className="text-right font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {models.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                            <div className="text-4xl mb-3">📊</div>
                            <p>No models added yet. Click "Add Model" to get started.</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        models.map(model => (
                          <TableRow key={model.id}>
                            <TableCell className="font-medium">{model.name || '(Unnamed)'}</TableCell>
                            <TableCell>{model.drawdown_priority_1 || '—'}</TableCell>
                            <TableCell>{model.surplus_priority_1 || '—'}</TableCell>
                            <TableCell>{model.portfolio_priority || '—'}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => setEditingModelId(editingModelId === model.id ? null : model.id)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteModel(model.id)} className="text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Model Detail Panel */}
                {editingModelId && (
                  <ModelDetailPanel
                    model={models.find(m => m.id === editingModelId)}
                    onUpdate={(field, value) => updateModel(editingModelId, field, value)}
                    onClose={() => setEditingModelId(null)}
                  />
                )}
              </TabsContent>

              {/* ============================================================ */}
              {/* STRATEGIES TAB */}
              {/* ============================================================ */}
              <TabsContent value="strategies" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Strategies</h2>
                  <Button onClick={addStrategy} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> Add Strategy
                  </Button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-bold">Strategy</TableHead>
                        <TableHead className="font-bold">Start</TableHead>
                        <TableHead className="font-bold">End</TableHead>
                        <TableHead className="font-bold">Owner</TableHead>
                        <TableHead className="text-right font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {strategies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                            <div className="text-4xl mb-3">🧩</div>
                            <p>No strategies added yet. Click "Add Strategy" to get started.</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        strategies.map(strategy => (
                          <TableRow key={strategy.id}>
                            <TableCell className="font-medium">{getStrategyLabel(strategy.strategy_id)}</TableCell>
                            <TableCell>{strategy.start_year || '—'}</TableCell>
                            <TableCell>{strategy.end_year || '—'}</TableCell>
                            <TableCell>{getOwnerLabel(strategy.owner_id)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => setEditingStrategyId(editingStrategyId === strategy.id ? null : strategy.id)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteStrategy(strategy.id)} className="text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Strategy Detail Panel */}
                {editingStrategyId && (
                  <StrategyDetailPanel
                    strategy={strategies.find(s => s.id === editingStrategyId)}
                    ownerOptions={ownerOptions}
                    productOptions={productOptions}
                    assetOptions={assetOptions}
                    debtOptions={debtOptions}
                    modelOptions={models.map(m => ({ value: m.id, label: m.name || '(Unnamed)' }))}
                    onUpdate={(field, value) => updateStrategy(editingStrategyId, field, value)}
                    onClose={() => setEditingStrategyId(null)}
                  />
                )}
              </TabsContent>
            </Tabs>

            {/* Footer Navigation */}
            <div className="flex justify-between items-center py-6 border-t border-slate-200 mt-6">
              <Button variant="outline" onClick={() => navigate(createPageUrl('SOARequestPortfolio') + `?id=${soaRequest?.id}`)}>
                ◀ Back
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
                {saving ? 'Saving...' : 'Save & Next ▶'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SOARequestLayout>
  );
}

// ============================================================================
// MODEL DETAIL PANEL
// ============================================================================

function ModelDetailPanel({ model, onUpdate, onClose }) {
  if (!model) return null;

  return (
    <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-green-200">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span>📊</span> Model Details
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="space-y-6">
        {/* Name & Description */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>Model name</Label>
            <Input value={model.name || ''} onChange={(e) => onUpdate('name', e.target.value)} placeholder="e.g. Base plan, Model 2 – Debt recycle" className="mt-1" />
          </div>
          <div>
            <Label>Model description</Label>
            <Textarea value={model.description || ''} onChange={(e) => onUpdate('description', e.target.value)} placeholder="High level description of this model..." rows={3} className="mt-1" />
          </div>
        </div>

        {/* Drawdown Priorities - Blue Section */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-1">Drawdown Priorities</h4>
          <p className="text-xs text-blue-600 mb-4">Rank where to access funds from first when covering a shortfall.</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Priority 1</Label>
              <Select value={model.drawdown_priority_1 || ''} onValueChange={(v) => onUpdate('drawdown_priority_1', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {DRAWDOWN_PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Priority 2</Label>
              <Select value={model.drawdown_priority_2 || ''} onValueChange={(v) => onUpdate('drawdown_priority_2', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {DRAWDOWN_PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Priority 3</Label>
              <Select value={model.drawdown_priority_3 || ''} onValueChange={(v) => onUpdate('drawdown_priority_3', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {DRAWDOWN_PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Label className="text-xs">Portfolio Priority</Label>
            <Select value={model.portfolio_priority || ''} onValueChange={(v) => onUpdate('portfolio_priority', v)}>
              <SelectTrigger className="mt-1 max-w-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {PORTFOLIO_PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-blue-600 mt-1">Controls the sell-down order within a portfolio.</p>
          </div>
        </div>

        {/* Surplus Priorities - Purple Section */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-1">Surplus Cashflow Priorities</h4>
          <p className="text-xs text-purple-600 mb-4">When income exceeds expenses, surplus funds are allocated in this order.</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Priority 1</Label>
              <Select value={model.surplus_priority_1 || ''} onValueChange={(v) => onUpdate('surplus_priority_1', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {SURPLUS_PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Priority 2</Label>
              <Select value={model.surplus_priority_2 || ''} onValueChange={(v) => onUpdate('surplus_priority_2', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {SURPLUS_PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Priority 3</Label>
              <Select value={model.surplus_priority_3 || ''} onValueChange={(v) => onUpdate('surplus_priority_3', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {SURPLUS_PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STRATEGY DETAIL PANEL
// ============================================================================

function StrategyDetailPanel({ strategy, ownerOptions, productOptions, assetOptions, debtOptions, modelOptions, onUpdate, onClose }) {
  if (!strategy) return null;

  return (
    <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-green-200">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span>🧩</span> Strategy Details
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="space-y-4">
        {/* Row 1: Strategy & Owner */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Select strategy</Label>
            <Select value={strategy.strategy_id || ''} onValueChange={(v) => onUpdate('strategy_id', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select a strategy..." /></SelectTrigger>
              <SelectContent>
                {STRATEGY_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Owner</Label>
            <Select value={strategy.owner_id || ''} onValueChange={(v) => onUpdate('owner_id', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select owner..." /></SelectTrigger>
              <SelectContent>
                {ownerOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Start & End Year */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start year</Label>
            <Select value={strategy.start_year || ''} onValueChange={(v) => onUpdate('start_year', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select year..." /></SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>End year</Label>
            <Select value={strategy.end_year || ''} onValueChange={(v) => onUpdate('end_year', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select year..." /></SelectTrigger>
              <SelectContent>
                {END_YEAR_OPTIONS.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Amount & Product */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Amount</Label>
            <Input value={strategy.amount || ''} onChange={(e) => onUpdate('amount', e.target.value)} placeholder="e.g. $20,000 p.a." className="mt-1" />
          </div>
          <div>
            <Label>Product</Label>
            <Select value={strategy.product_id || ''} onValueChange={(v) => onUpdate('product_id', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
              <SelectContent>
                {productOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 4: Asset & Debt */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Asset</Label>
            <Select value={strategy.asset_id || ''} onValueChange={(v) => onUpdate('asset_id', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select asset..." /></SelectTrigger>
              <SelectContent>
                {assetOptions.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Debt</Label>
            <Select value={strategy.debt_id || ''} onValueChange={(v) => onUpdate('debt_id', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select debt..." /></SelectTrigger>
              <SelectContent>
                {debtOptions.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label>Notes</Label>
          <Textarea value={strategy.notes || ''} onChange={(e) => onUpdate('notes', e.target.value)} placeholder="Additional notes..." rows={3} className="mt-1" />
        </div>
      </div>
    </div>
  );
}