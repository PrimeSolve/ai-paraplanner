import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import { Plus, Trash2, Pencil, X, Settings, Building2, TrendingUp, Zap, Receipt } from 'lucide-react';
import { toast } from 'sonner';

// ==========================================================================
// CONSTANTS
// ==========================================================================
const HORIZON_TYPES = [
 { value: 'le+buffer', label: 'Life expectancy + buffer' },
 { value: 'age', label: 'Specify age' },
 { value: 'years', label: 'Specify timeframe (years)' }
];

const GROWTH_ASSUMPTION_TYPES = [
 { value: 'Use risk profile', label: 'Use risk profile' },
 { value: 'Use portfolio asset allocation', label: 'Use portfolio asset allocation' },
 { value: 'Specify growth rate', label: 'Specify growth rate' }
];

const RATE_ADJUSTMENT_TYPES = [
 { value: 'Set to rate', label: 'Set to rate' },
 { value: 'Increase by Δ', label: 'Increase by Δ' },
 { value: 'Decrease by Δ', label: 'Decrease by Δ' },
 { value: 'Ramp to rate', label: 'Ramp to rate' }
];

const FEE_TYPES = [
 { value: 'Upfront', label: 'Upfront' },
 { value: 'Ongoing', label: 'Ongoing' },
 { value: 'SOA fee', label: 'SOA fee' }
];

const FEE_BASIS_OPTIONS = [
 { value: 'Flat $', label: 'Flat $' },
 { value: '% of balance', label: '% of balance' }
];

const FEE_FREQUENCIES = [
 { value: 'One-off', label: 'One-off' },
 { value: 'Monthly', label: 'Monthly' },
 { value: 'Quarterly', label: 'Quarterly' },
 { value: 'Annually', label: 'Annually' }
];

const DEFAULT_BASIC = {
 strategy_start_date: '',
 inflation_rate: 2.5,
 horizon_type: 'le+buffer',
 run_until_age: 100,
 life_expectancy_buffer: 5,
 years_to_run: '',
 apply_desired_income: false,
 stop_expenses_at_retirement: false,
 centrelink_off: false
};

const generateId = () => 'id_' + Math.random().toString(36).slice(2) + Date.now().toString(36);

// ==========================================================================
// MAIN COMPONENT
// ==========================================================================
export default function SOARequestAssumptions() {
 const navigate = useNavigate();
 
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [soaRequest, setSOARequest] = useState(null);
 const [clientId, setClientId] = useState(null);
 
 // Data
 const [basic, setBasic] = useState(DEFAULT_BASIC);
 const [returnsEntities, setReturnsEntities] = useState([]);
 const [returnsAssets, setReturnsAssets] = useState([]);
 const [rateAdjustments, setRateAdjustments] = useState([]);
 const [fees, setFees] = useState([]);
 
 // Dropdown options
 const [entityOptions, setEntityOptions] = useState([]);
 const [assetOptions, setAssetOptions] = useState([]);
 const [debtOptions, setDebtOptions] = useState([]);
 const [ownerProductOptions, setOwnerProductOptions] = useState([]);
 const [modelOptions, setModelOptions] = useState([]);
 
 // UI state
 const [activeTab, setActiveTab] = useState('basic');
 const [editingReturnId, setEditingReturnId] = useState(null);
 const [editingAssetReturnId, setEditingAssetReturnId] = useState(null);
 const [editingRateId, setEditingRateId] = useState(null);
 const [editingFeeId, setEditingFeeId] = useState(null);

 // =========================================================================
 // DATA LOADING
 // =========================================================================
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
 
 // Load assumptions
 const assumptions = soaReq.assumptions || {};
 setBasic({ ...DEFAULT_BASIC, ...assumptions.basic });
 setReturnsEntities(assumptions.returns_entities || []);
 setReturnsAssets(assumptions.returns_assets || []);
 setRateAdjustments(assumptions.rate_adjustments || []);
 setFees(assumptions.fees || []);
 
 // Load models from strategy
 const models = soaReq.scope_of_advice?.strategy?.models || [];
 setModelOptions(models.map(m => ({ value: m.id, label: m.name || '(Unnamed)' })));
 
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
 const entities = [];
 const assets = [];
 const debts = [];
 const ownerProducts = [];
 
 // Load principals
 try {
 const principals = await base44.entities.Principal?.filter({ client_id: clientId });
 if (principals) {
 principals.forEach(p => {
 const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
 ownerProducts.push({ value: p.id, label: name || 'Client', type: 'Principal' });
 });
 }
 } catch (e) {}
 
 // Load trusts
 try {
 const trusts = await base44.entities.Trust?.filter({ client_id: clientId });
 if (trusts) trusts.forEach(t => {
 entities.push({ value: t.id, label: `${t.name} (Trust)` });
 });
 } catch (e) {}
 
 // Load companies
 try {
 const companies = await base44.entities.Company?.filter({ client_id: clientId });
 if (companies) companies.forEach(c => {
 entities.push({ value: c.id, label: `${c.name} (Company)` });
 });
 } catch (e) {}
 
 // Load SMSFs
 try {
 const smsfs = await base44.entities.SMSF?.filter({ client_id: clientId });
 if (smsfs) smsfs.forEach(s => {
 entities.push({ value: s.id, label: `${s.name} (SMSF)` });
 });
 } catch (e) {}
 
 // Load products
 try {
 const superFunds = await base44.entities.SuperFund?.filter({ client_id: clientId });
 if (superFunds) superFunds.forEach(f => {
 entities.push({ value: f.id, label: `${f.name} (Super)` });
 ownerProducts.push({ value: f.id, label: `${f.name} (Super)`, type: 'Product' });
 });
 } catch (e) {}
 
 try {
 const pensions = await base44.entities.Pension?.filter({ client_id: clientId });
 if (pensions) pensions.forEach(p => {
 entities.push({ value: p.id, label: `${p.name} (Pension)` });
 ownerProducts.push({ value: p.id, label: `${p.name} (Pension)`, type: 'Product' });
 });
 } catch (e) {}
 
 try {
 const wraps = await base44.entities.Wrap?.filter({ client_id: clientId });
 if (wraps) wraps.forEach(w => {
 entities.push({ value: w.id, label: `${w.name} (Wrap)` });
 ownerProducts.push({ value: w.id, label: `${w.name} (Wrap)`, type: 'Product' });
 });
 } catch (e) {}
 
 // Load assets
 try {
 const assetList = await base44.entities.Asset?.filter({ client_id: clientId });
 if (assetList) assetList.forEach(a => {
 assets.push({ value: a.id, label: a.name || 'Unnamed Asset' });
 });
 } catch (e) {}
 
 // Load debts
 try {
 const debtList = await base44.entities.Liability?.filter({ client_id: clientId });
 if (debtList) debtList.forEach(d => {
 debts.push({ value: d.id, label: d.name || 'Unnamed Debt' });
 });
 } catch (e) {}
 
 setEntityOptions(entities);
 setAssetOptions(assets);
 setDebtOptions(debts);
 setOwnerProductOptions(ownerProducts);
 
 } catch (error) {
 console.error('Error loading entity options:', error);
 }
 };

 // =========================================================================
 // CRUD HANDLERS
 // =========================================================================
 const addReturnEntity = () => {
 const newReturn = {
 id: generateId(),
 entity_id: '',
 assumption_type: 'Use risk profile',
 growth_rate: '',
 income_rate: '',
 franking_rate: ''
 };
 setReturnsEntities([...returnsEntities, newReturn]);
 setEditingReturnId(newReturn.id);
 };

 const updateReturnEntity = (id, field, value) => {
 setReturnsEntities(returnsEntities.map(r => r.id === id ? { ...r, [field]: value } : r));
 };

 const deleteReturnEntity = (id) => {
 if (!confirm('Delete this return profile?')) return;
 setReturnsEntities(returnsEntities.filter(r => r.id !== id));
 if (editingReturnId === id) setEditingReturnId(null);
 };

 const addReturnAsset = () => {
 const newReturn = {
 id: generateId(),
 asset_id: '',
 override: true,
 growth_rate: '',
 income_rate: ''
 };
 setReturnsAssets([...returnsAssets, newReturn]);
 setEditingAssetReturnId(newReturn.id);
 };

 const updateReturnAsset = (id, field, value) => {
 setReturnsAssets(returnsAssets.map(r => r.id === id ? { ...r, [field]: value } : r));
 };

 const deleteReturnAsset = (id) => {
 if (!confirm('Delete this asset override?')) return;
 setReturnsAssets(returnsAssets.filter(r => r.id !== id));
 if (editingAssetReturnId === id) setEditingAssetReturnId(null);
 };

 const addRateAdjustment = () => {
 const newRate = {
 id: generateId(),
 debt_id: '',
 adjustment_type: 'Set to rate',
 start_year: '',
 end_year: '',
 rate_value: '',
 rate_change: '',
 advice_model_ids: []
 };
 setRateAdjustments([...rateAdjustments, newRate]);
 setEditingRateId(newRate.id);
 };

 const updateRateAdjustment = (id, field, value) => {
 setRateAdjustments(rateAdjustments.map(r => r.id === id ? { ...r, [field]: value } : r));
 };

 const deleteRateAdjustment = (id) => {
 if (!confirm('Delete this rate adjustment?')) return;
 setRateAdjustments(rateAdjustments.filter(r => r.id !== id));
 if (editingRateId === id) setEditingRateId(null);
 };

 const addFee = () => {
 const newFee = {
 id: generateId(),
 fee_type: 'Ongoing',
 basis: 'Flat $',
 amount: '',
 frequency: 'Annually',
 applies_to_ids: [],
 start_date: '',
 end_date: '',
 advice_model_ids: []
 };
 setFees([...fees, newFee]);
 setEditingFeeId(newFee.id);
 };

 const updateFee = (id, field, value) => {
 setFees(fees.map(f => f.id === id ? { ...f, [field]: value } : f));
 };

 const deleteFee = (id) => {
 if (!confirm('Delete this fee?')) return;
 setFees(fees.filter(f => f.id !== id));
 if (editingFeeId === id) setEditingFeeId(null);
 };

 // =========================================================================
 // SAVE
 // =========================================================================
 const handleSave = async () => {
 setSaving(true);
 try {
 await base44.entities.SOARequest.update(soaRequest.id, {
 assumptions: {
 basic,
 returns_entities: returnsEntities,
 returns_assets: returnsAssets,
 rate_adjustments: rateAdjustments,
 fees
 }
 });
 toast.success('Assumptions saved');
 navigate(createPageUrl('SOARequestDetails') + `?id=${soaRequest.id}`);
 } catch (error) {
 console.error('Error saving:', error);
 toast.error('Failed to save');
 } finally {
 setSaving(false);
 }
 };

 const resetBasic = () => {
 if (confirm('Reset basic assumptions to defaults?')) {
 setBasic(DEFAULT_BASIC);
 }
 };

 // =========================================================================
 // HELPERS
 // =========================================================================
 const getEntityLabel = (id) => entityOptions.find(e => e.value === id)?.label || '—';
 const getAssetLabel = (id) => assetOptions.find(a => a.value === id)?.label || '—';
 const getDebtLabel = (id) => debtOptions.find(d => d.value === id)?.label || '—';

 // =========================================================================
 // LOADING
 // =========================================================================
 if (loading) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
 </div>
 );
 }

 // =========================================================================
 // RENDER
 // =========================================================================
 return (
 <SOARequestLayout currentSection="assumptions" soaRequest={soaRequest}>
 <div className="flex-1 overflow-auto bg-slate-50 px-8 py-6">
 {/* Dark Banner */}
 <div style={{ backgroundColor: '#1E293B', padding: '24px 32px', borderRadius: '16px 16px 0 0' }}>
 <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
 Assumptions
 </h1>
 <p style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8', margin: 0 }}>
 Set global assumptions and targeted overrides used by your models.
 </p>
 </div>

 {/* White Content Card */}
 <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0 0 16px 16px', border: '1px solid #E2E8F0', borderTop: 'none' }}>
 <div className="p-8">
 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <TabsList className="mb-6">
 <TabsTrigger value="basic"><Settings className="w-4 h-4 mr-2" />Basic</TabsTrigger>
 <TabsTrigger value="returns-entity"><Building2 className="w-4 h-4 mr-2" />Returns (Entity)</TabsTrigger>
 <TabsTrigger value="returns-asset"><TrendingUp className="w-4 h-4 mr-2" />Returns (Asset)</TabsTrigger>
 <TabsTrigger value="rates"><Zap className="w-4 h-4 mr-2" />Interest Rates</TabsTrigger>
 <TabsTrigger value="fees"><Receipt className="w-4 h-4 mr-2" />Advice Fees</TabsTrigger>
 </TabsList>

 {/* TAB 1: BASIC */}
 <TabsContent value="basic">
 <Card>
 <CardHeader>
 <CardTitle>Basic Assumptions</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label>Strategy start date</Label>
 <Input
 type="date"
 value={basic.strategy_start_date || ''}
 onChange={(e) => setBasic({ ...basic, strategy_start_date: e.target.value })}
 className="mt-1"
 />
 </div>
 <div>
 <Label>Inflation rate (%)</Label>
 <Input
 type="number"
 step="0.1"
 value={basic.inflation_rate || ''}
 onChange={(e) => setBasic({ ...basic, inflation_rate: parseFloat(e.target.value) || 0 })}
 placeholder="e.g. 2.5"
 className="mt-1"
 />
 </div>
 </div>

 <div>
 <Label className="mb-3 block">How long to run model for?</Label>
 <RadioGroup
 value={basic.horizon_type || 'le+buffer'}
 onValueChange={(v) => setBasic({ ...basic, horizon_type: v })}
 className="space-y-2"
 >
 {HORIZON_TYPES.map(h => (
 <div key={h.value} className="flex items-center space-x-2">
 <RadioGroupItem value={h.value} id={h.value} />
 <Label htmlFor={h.value} className="font-normal">{h.label}</Label>
 </div>
 ))}
 </RadioGroup>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label>Run until age</Label>
 <Input
 type="number"
 value={basic.run_until_age || ''}
 onChange={(e) => setBasic({ ...basic, run_until_age: parseInt(e.target.value) || 0 })}
 placeholder="e.g. 100"
 className="mt-1"
 />
 </div>
 <div>
 <Label>Life expectancy buffer (yrs)</Label>
 <Input
 type="number"
 value={basic.life_expectancy_buffer || ''}
 onChange={(e) => setBasic({ ...basic, life_expectancy_buffer: parseInt(e.target.value) || 0 })}
 placeholder="e.g. 5"
 className="mt-1"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label>Years to run model</Label>
 <Input
 type="number"
 value={basic.years_to_run || ''}
 onChange={(e) => setBasic({ ...basic, years_to_run: parseInt(e.target.value) || null })}
 className="mt-1"
 />
 </div>
 <div className="pt-6"></div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-3">
 <div className="flex items-center space-x-2">
 <Checkbox
 id="applyDesiredIncome"
 checked={basic.apply_desired_income || false}
 onCheckedChange={(c) => setBasic({ ...basic, apply_desired_income: c })}
 />
 <Label htmlFor="applyDesiredIncome" className="font-normal">
 Apply desired income in retirement
 </Label>
 </div>
 <div className="flex items-center space-x-2">
 <Checkbox
 id="stopExpenses"
 checked={basic.stop_expenses_at_retirement || false}
 onCheckedChange={(c) => setBasic({ ...basic, stop_expenses_at_retirement: c })}
 />
 <Label htmlFor="stopExpenses" className="font-normal">
 Stop expenses at retirement
 </Label>
 </div>
 </div>
 <div>
 <div className="flex items-center space-x-2">
 <Checkbox
 id="centrelinkOff"
 checked={basic.centrelink_off || false}
 onCheckedChange={(c) => setBasic({ ...basic, centrelink_off: c })}
 />
 <Label htmlFor="centrelinkOff" className="font-normal">
 Turn Centrelink calculations off
 </Label>
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-4 border-t">
 <Button variant="outline" onClick={resetBasic}>Reset</Button>
 <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Save</Button>
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 {/* TAB 2: RETURNS (ENTITY) */}
 <TabsContent value="returns-entity">
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle>Returns by Entity / Wrapper</CardTitle>
 <Button onClick={addReturnEntity} className="bg-blue-600 hover:bg-blue-700">
 <Plus className="w-4 h-4 mr-2" /> Add Entity
 </Button>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 <Table>
 <TableHeader>
 <TableRow className="bg-slate-50">
 <TableHead>Entity / Wrapper</TableHead>
 <TableHead>Assumption Type</TableHead>
 <TableHead className="text-right">Growth %</TableHead>
 <TableHead className="text-right">Income %</TableHead>
 <TableHead className="text-right">Franking %</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {returnsEntities.length === 0 ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-12 text-slate-400">
 <div className="text-4xl mb-3">📈</div>
 <p>No entity returns configured.</p>
 </TableCell>
 </TableRow>
 ) : (
 returnsEntities.map(ret => (
 <TableRow key={ret.id}>
 <TableCell>{getEntityLabel(ret.entity_id)}</TableCell>
 <TableCell>{ret.assumption_type || '—'}</TableCell>
 <TableCell className="text-right">{ret.growth_rate || '—'}</TableCell>
 <TableCell className="text-right">{ret.income_rate || '—'}</TableCell>
 <TableCell className="text-right">{ret.franking_rate || '—'}</TableCell>
 <TableCell className="text-right space-x-1">
 <Button variant="ghost" size="sm" onClick={() => setEditingReturnId(editingReturnId === ret.id ? null : ret.id)}>
 <Pencil className="w-4 h-4" />
 </Button>
 <Button variant="ghost" size="sm" onClick={() => deleteReturnEntity(ret.id)} className="text-red-600">
 <Trash2 className="w-4 h-4" />
 </Button>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 {editingReturnId && (
 <ReturnEntityPanel
 item={returnsEntities.find(r => r.id === editingReturnId)}
 entityOptions={entityOptions}
 onUpdate={(field, value) => updateReturnEntity(editingReturnId, field, value)}
 onClose={() => setEditingReturnId(null)}
 />
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* TAB 3: RETURNS (ASSET) */}
 <TabsContent value="returns-asset">
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle>Returns per Asset (Overrides)</CardTitle>
 <Button onClick={addReturnAsset} className="bg-blue-600 hover:bg-blue-700">
 <Plus className="w-4 h-4 mr-2" /> Add Asset Override
 </Button>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 <Table>
 <TableHeader>
 <TableRow className="bg-slate-50">
 <TableHead>Asset</TableHead>
 <TableHead>Override?</TableHead>
 <TableHead className="text-right">Growth %</TableHead>
 <TableHead className="text-right">Income %</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {returnsAssets.length === 0 ? (
 <TableRow>
 <TableCell colSpan={5} className="text-center py-12 text-slate-400">
 <div className="text-4xl mb-3">📊</div>
 <p>No asset overrides configured.</p>
 </TableCell>
 </TableRow>
 ) : (
 returnsAssets.map(ret => (
 <TableRow key={ret.id}>
 <TableCell>{getAssetLabel(ret.asset_id)}</TableCell>
 <TableCell>{ret.override ? 'Yes' : 'No'}</TableCell>
 <TableCell className="text-right">{ret.growth_rate || '—'}</TableCell>
 <TableCell className="text-right">{ret.income_rate || '—'}</TableCell>
 <TableCell className="text-right space-x-1">
 <Button variant="ghost" size="sm" onClick={() => setEditingAssetReturnId(editingAssetReturnId === ret.id ? null : ret.id)}>
 <Pencil className="w-4 h-4" />
 </Button>
 <Button variant="ghost" size="sm" onClick={() => deleteReturnAsset(ret.id)} className="text-red-600">
 <Trash2 className="w-4 h-4" />
 </Button>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 {editingAssetReturnId && (
 <ReturnAssetPanel
 item={returnsAssets.find(r => r.id === editingAssetReturnId)}
 assetOptions={assetOptions}
 onUpdate={(field, value) => updateReturnAsset(editingAssetReturnId, field, value)}
 onClose={() => setEditingAssetReturnId(null)}
 />
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* TAB 4: INTEREST RATES */}
 <TabsContent value="rates">
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle>Interest Rate Adjustments</CardTitle>
 <Button onClick={addRateAdjustment} className="bg-blue-600 hover:bg-blue-700">
 <Plus className="w-4 h-4 mr-2" /> Add Adjustment
 </Button>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 <Table>
 <TableHeader>
 <TableRow className="bg-slate-50">
 <TableHead>Debt</TableHead>
 <TableHead>Type</TableHead>
 <TableHead>Start</TableHead>
 <TableHead>End</TableHead>
 <TableHead className="text-right">Rate %</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {rateAdjustments.length === 0 ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-12 text-slate-400">
 <div className="text-4xl mb-3">📉</div>
 <p>No rate adjustments configured.</p>
 </TableCell>
 </TableRow>
 ) : (
 rateAdjustments.map(rate => (
 <TableRow key={rate.id}>
 <TableCell>{getDebtLabel(rate.debt_id)}</TableCell>
 <TableCell>{rate.adjustment_type || '—'}</TableCell>
 <TableCell>{rate.start_year || '—'}</TableCell>
 <TableCell>{rate.end_year || 'Ongoing'}</TableCell>
 <TableCell className="text-right">{rate.rate_value || '—'}</TableCell>
 <TableCell className="text-right space-x-1">
 <Button variant="ghost" size="sm" onClick={() => setEditingRateId(editingRateId === rate.id ? null : rate.id)}>
 <Pencil className="w-4 h-4" />
 </Button>
 <Button variant="ghost" size="sm" onClick={() => deleteRateAdjustment(rate.id)} className="text-red-600">
 <Trash2 className="w-4 h-4" />
 </Button>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 {editingRateId && (
 <RatePanel
 item={rateAdjustments.find(r => r.id === editingRateId)}
 debtOptions={debtOptions}
 modelOptions={modelOptions}
 onUpdate={(field, value) => updateRateAdjustment(editingRateId, field, value)}
 onClose={() => setEditingRateId(null)}
 />
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* TAB 5: ADVICE FEES */}
 <TabsContent value="fees">
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle>Advice Fees</CardTitle>
 <Button onClick={addFee} className="bg-blue-600 hover:bg-blue-700">
 <Plus className="w-4 h-4 mr-2" /> Add Fee
 </Button>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 <Table>
 <TableHeader>
 <TableRow className="bg-slate-50">
 <TableHead>Type</TableHead>
 <TableHead>Basis</TableHead>
 <TableHead className="text-right">Amount</TableHead>
 <TableHead>Frequency</TableHead>
 <TableHead>Start</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {fees.length === 0 ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-12 text-slate-400">
 <div className="text-4xl mb-3">💵</div>
 <p>No fees configured.</p>
 </TableCell>
 </TableRow>
 ) : (
 fees.map(fee => (
 <TableRow key={fee.id}>
 <TableCell>{fee.fee_type || '—'}</TableCell>
 <TableCell>{fee.basis || '—'}</TableCell>
 <TableCell className="text-right">
 {fee.basis === '% of balance' ? `${fee.amount}%` : `$${fee.amount}`}
 </TableCell>
 <TableCell>{fee.frequency || '—'}</TableCell>
 <TableCell>{fee.start_date || '—'}</TableCell>
 <TableCell className="text-right space-x-1">
 <Button variant="ghost" size="sm" onClick={() => setEditingFeeId(editingFeeId === fee.id ? null : fee.id)}>
 <Pencil className="w-4 h-4" />
 </Button>
 <Button variant="ghost" size="sm" onClick={() => deleteFee(fee.id)} className="text-red-600">
 <Trash2 className="w-4 h-4" />
 </Button>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 {editingFeeId && (
 <FeePanel
 item={fees.find(f => f.id === editingFeeId)}
 ownerProductOptions={ownerProductOptions}
 modelOptions={modelOptions}
 onUpdate={(field, value) => updateFee(editingFeeId, field, value)}
 onClose={() => setEditingFeeId(null)}
 />
 )}
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>

 <div className="flex justify-between items-center py-4">
 <Button variant="outline" onClick={() => navigate(createPageUrl('SOARequestStrategy') + `?id=${soaRequest?.id}`)}>
 ◀ Back
 </Button>
 <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
 {saving ? 'Saving...' : 'Save & Next ▶'}
 </Button>
 </div>
 </div>
 </div>
 </SOARequestLayout>
 );
}

// ==========================================================================
// DETAIL PANELS
// ==========================================================================
function ReturnEntityPanel({ item, entityOptions, onUpdate, onClose }) {
 if (!item) return null;
 return (
 <div className="m-4 p-6 bg-green-50 border border-green-200 rounded-lg">
 <div className="flex justify-between items-center mb-4 pb-4 border-b border-green-200">
 <h3 className="font-bold flex items-center gap-2"><span>📈</span> Return Profile Details</h3>
 <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
 </div>
 <div className="grid grid-cols-2 gap-4 mb-4">
 <div>
 <Label>Entity / Wrapper</Label>
 <Select value={item.entity_id || ''} onValueChange={(v) => onUpdate('entity_id', v)}>
 <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
 <SelectContent>
 {entityOptions.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 <div>
 <Label>Growth rate assumption type</Label>
 <Select value={item.assumption_type || ''} onValueChange={(v) => onUpdate('assumption_type', v)}>
 <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
 <SelectContent>
 {GROWTH_ASSUMPTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 </div>
 <div className="grid grid-cols-3 gap-4">
 <div>
 <Label>Growth rate (net %)</Label>
 <Input type="number" step="0.01" value={item.growth_rate || ''} onChange={(e) => onUpdate('growth_rate', e.target.value)} className="mt-1" />
 </div>
 <div>
 <Label>Income return (%)</Label>
 <Input type="number" step="0.01" value={item.income_rate || ''} onChange={(e) => onUpdate('income_rate', e.target.value)} className="mt-1" />
 </div>
 <div>
 <Label>Franking percentage (%)</Label>
 <Input type="number" step="0.01" value={item.franking_rate || ''} onChange={(e) => onUpdate('franking_rate', e.target.value)} className="mt-1" />
 </div>
 </div>
 </div>
 );
}

function ReturnAssetPanel({ item, assetOptions, onUpdate, onClose }) {
 if (!item) return null;
 return (
 <div className="m-4 p-6 bg-green-50 border border-green-200 rounded-lg">
 <div className="flex justify-between items-center mb-4 pb-4 border-b border-green-200">
 <h3 className="font-bold flex items-center gap-2"><span>📊</span> Asset Override Details</h3>
 <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
 </div>
 <div className="grid grid-cols-2 gap-4 mb-4">
 <div>
 <Label>Asset</Label>
 <Select value={item.asset_id || ''} onValueChange={(v) => onUpdate('asset_id', v)}>
 <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
 <SelectContent>
 {assetOptions.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 <div>
 <Label>Override default assumption</Label>
 <Select value={item.override ? 'true' : 'false'} onValueChange={(v) => onUpdate('override', v === 'true')}>
 <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="true">Yes</SelectItem>
 <SelectItem value="false">No</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label>Growth rate %</Label>
 <Input type="number" step="0.01" value={item.growth_rate || ''} onChange={(e) => onUpdate('growth_rate', e.target.value)} className="mt-1" />
 </div>
 <div>
 <Label>Income yield %</Label>
 <Input type="number" step="0.01" value={item.income_rate || ''} onChange={(e) => onUpdate('income_rate', e.target.value)} className="mt-1" />
 </div>
 </div>
 </div>
 );
}

function RatePanel({ item, debtOptions, modelOptions, onUpdate, onClose }) {
 if (!item) return null;
 return (
 <div className="m-4 p-6 bg-green-50 border border-green-200 rounded-lg">
 <div className="flex justify-between items-center mb-4 pb-4 border-b border-green-200">
 <h3 className="font-bold flex items-center gap-2"><span>📉</span> Interest Adjustment Details</h3>
 <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
 </div>
 <div className="grid grid-cols-2 gap-4 mb-4">
 <div>
 <Label>Select debt</Label>
 <Select value={item.debt_id || ''} onValueChange={(v) => onUpdate('debt_id', v)}>
 <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
 <SelectContent>
 {debtOptions.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 <div>
 <Label>Adjustment type</Label>
 <Select value={item.adjustment_type || ''} onValueChange={(v) => onUpdate('adjustment_type', v)}>
 <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
 <SelectContent>
 {RATE_ADJUSTMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4 mb-4">
 <div>
 <Label>Start year</Label>
 <Input value={item.start_year || ''} onChange={(e) => onUpdate('start_year', e.target.value)} placeholder="e.g. 2025/26" className="mt-1" />
 </div>
 <div>
 <Label>End year (optional)</Label>
 <Input value={item.end_year || ''} onChange={(e) => onUpdate('end_year', e.target.value)} placeholder="leave blank for ongoing" className="mt-1" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label>New interest rate / Δ (%)</Label>
 <Input type="number" step="0.01" value={item.rate_value || ''} onChange={(e) => onUpdate('rate_value', e.target.value)} className="mt-1" />
 </div>
 <div>
 <Label>Rate of change (% p.a.)</Label>
 <Input type="number" step="0.01" value={item.rate_change || ''} onChange={(e) => onUpdate('rate_change', e.target.value)} className="mt-1" />
 </div>
 </div>
 </div>
 );
}

function FeePanel({ item, ownerProductOptions, modelOptions, onUpdate, onClose }) {
 if (!item) return null;
 return (
 <div className="m-4 p-6 bg-green-50 border border-green-200 rounded-lg">
 <div className="flex justify-between items-center mb-4 pb-4 border-b border-green-200">
 <h3 className="font-bold flex items-center gap-2"><span>💵</span> Fee Details</h3>
 <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
 </div>
 <div className="grid grid-cols-2 gap-4 mb-4">
 <div>
 <Label>Fee type</Label>
 <Select value={item.fee_type || ''} onValueChange={(v) => onUpdate('fee_type', v)}>
 <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
 <SelectContent>
 {FEE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 <div>
 <Label>Basis</Label>
 <Select value={item.basis || ''} onValueChange={(v) => onUpdate('basis', v)}>
 <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
 <SelectContent>
 {FEE_BASIS_OPTIONS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4 mb-4">
 <div>
 <Label>Amount / Rate</Label>
 <Input type="number" step="0.01" value={item.amount || ''} onChange={(e) => onUpdate('amount', e.target.value)} placeholder="e.g. 3300 or 0.5" className="mt-1" />
 </div>
 <div>
 <Label>Frequency</Label>
 <Select value={item.frequency || ''} onValueChange={(v) => onUpdate('frequency', v)}>
 <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
 <SelectContent>
 {FEE_FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label>Start (date or FY)</Label>
 <Input value={item.start_date || ''} onChange={(e) => onUpdate('start_date', e.target.value)} placeholder="e.g. 2025/26" className="mt-1" />
 </div>
 <div>
 <Label>End (optional)</Label>
 <Input value={item.end_date || ''} onChange={(e) => onUpdate('end_date', e.target.value)} placeholder="leave blank for ongoing" className="mt-1" />
 </div>
 </div>
 </div>
 );
}