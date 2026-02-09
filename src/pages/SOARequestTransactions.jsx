import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import EntitySelect from '../components/factfind/EntitySelect';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// DROPDOWN OPTIONS
// ============================================================================

const BUY_ASSET_TYPES = [
  { value: '12', label: 'Australian - Listed' },
  { value: '13', label: 'International - Listed' },
  { value: '26', label: 'Managed funds' },
  { value: '10', label: 'Government bonds - listed' },
  { value: '9', label: 'Term deposit' },
  { value: '8', label: 'Cash' },
  { value: '40', label: 'Related party loan' },
  { value: '1', label: 'Principal residence' },
  { value: '18', label: 'Investment property' },
  { value: '19', label: 'Commercial property' },
  { value: '27', label: 'Holiday home' }
];

const OWNERSHIP_TYPES = [
  { value: '1', label: 'Sole ownership' },
  { value: '2', label: 'Joint' },
  { value: '7', label: 'Tenants in common' }
];

const DEBT_TYPES = [
  { value: '1', label: 'Home loan' },
  { value: '2', label: 'Investment loan' },
  { value: '3', label: 'Margin loan' },
  { value: '4', label: 'Split loan' },
  { value: '5', label: 'Credit card' },
  { value: '6', label: 'Reverse mortgage' },
  { value: '7', label: 'Car loan' },
  { value: '9', label: 'Home equity release' },
  { value: '10', label: 'Related party loan' },
  { value: '8', label: 'Other' }
];

const RENT_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' }
];

const PROPERTY_ASSET_TYPES = ['1', '18', '19', '27'];

// Helper functions
const getAssetTypeLabel = (value) => BUY_ASSET_TYPES.find(t => t.value === value)?.label || value || '—';
const getOwnershipLabel = (value) => OWNERSHIP_TYPES.find(t => t.value === value)?.label || value || '—';
const getDebtTypeLabel = (value) => DEBT_TYPES.find(t => t.value === value)?.label || value || '—';
const isPropertyType = (assetType) => PROPERTY_ASSET_TYPES.includes(assetType);

const generateId = () => 'txn_' + Math.random().toString(36).slice(2) + Date.now().toString(36);

const formatCurrency = (value) => {
  if (!value && value !== 0) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 }).format(num);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SOARequestTransactions() {
  const navigate = useNavigate();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data
  const [soaRequest, setSOARequest] = useState(null);
  const [factFind, setFactFind] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [principals, setPrincipals] = useState([]);
  
  // Entity options for dropdowns
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [assetOptions, setAssetOptions] = useState([]);
  const [smsfOptions, setSmsfOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [debtOptions, setDebtOptions] = useState([]);
  
  // Transaction data
  const [buyTransactions, setBuyTransactions] = useState([]);
  const [sellTransactions, setSellTransactions] = useState([]);
  const [debtTransactions, setDebtTransactions] = useState([]);
  
  // Active tab and editing state
  const [activeTab, setActiveTab] = useState('buy');
  const [editingBuyId, setEditingBuyId] = useState(null);
  const [editingSellId, setEditingSellId] = useState(null);
  const [editingDebtId, setEditingDebtId] = useState(null);

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

      // Load SOA Request
      const requests = await base44.entities.SOARequest.filter({ id });
      if (!requests[0]) {
        toast.error('SOA Request not found');
        setLoading(false);
        return;
      }
      
      const soaReq = requests[0];
      setSOARequest(soaReq);
      setClientId(soaReq.client_id);
      
      // Load transactions from SOA Request
      const txns = soaReq.transactions || {};
      setBuyTransactions(txns.buy || []);
      setSellTransactions(txns.sell || []);
      setDebtTransactions(txns.debts || []);
      
      // Load related entities for dropdowns
      await loadEntityOptions(soaReq.client_id, soaReq, txns.buy || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadEntityOptions = async (clientId, soaReq, buyTxns) => {
    try {
      // Load Principals
      const principalsData = await base44.entities.Principal.filter({ client_id: clientId });
      setPrincipals(principalsData);
      
      // Load Fact Find for asset data
      let factFindData = null;
      if (soaReq.fact_find_id) {
        const factFinds = await base44.entities.FactFind.filter({ id: soaReq.fact_find_id });
        factFindData = factFinds[0];
        setFactFind(factFindData);
      }
      
      // Build asset options (for sell dropdown) - grouped by type
      const assetOpts = [];
      
      // Investment assets only from Fact Find
      if (factFindData) {
        const investments = factFindData.assets_liabilities?.assets || [];
        investments.forEach((asset, i) => {
          const value = parseFloat(asset.a_value || asset.value) || 0;
          assetOpts.push({
            value: `asset_${i}`,
            label: asset.a_name || asset.description || 'Investment',
            type: 'Investment',
            value
          });
        });
      }
      
      // Buy transactions from current SOA
      buyTxns.forEach(b => {
        if (b.asset_type) {
          assetOpts.push({
            value: b.id,
            label: `${getAssetTypeLabel(b.asset_type)} (New Purchase)`,
            type: 'New Purchase'
          });
        }
      });
      
      setAssetOptions(assetOpts);
      
      // Build debt options (existing debts for offset account, etc.)
      setDebtOptions([]);
      
      // Build model options
      const models = soaReq.cashflow_models?.models || [];
      setModelOptions(models.map(m => ({ value: m.id, label: m.name || '(Unnamed)' })));
      
    } catch (error) {
      console.error('Error loading entity options:', error);
    }
  };

  // ============================================================================
  // SAVE HANDLER
  // ============================================================================

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        transactions: {
          buy: buyTransactions,
          sell: sellTransactions,
          debts: debtTransactions
        }
      });
      toast.success('Transactions saved');
      navigate(createPageUrl('SOARequestPortfolio') + `?id=${soaRequest.id}`);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // BUY TRANSACTION HANDLERS
  // ============================================================================

  const addBuyTransaction = () => {
    const newBuy = {
      id: generateId(),
      description: '',
      asset_type: '',
      ownership_type: '',
      owner_id: '',
      asx_code: '',
      international_code: '',
      apir_code: '',
      amount: '',
      purchase_date: '',
      is_today_dollars: false,
      model_ids: [],
      rental_income: '',
      rent_frequency: '',
      debt_security_id: ''
    };
    setBuyTransactions([...buyTransactions, newBuy]);
    setEditingBuyId(newBuy.id);
  };

  const updateBuyTransaction = (id, field, value) => {
    setBuyTransactions(buyTransactions.map(b => 
      b.id === id ? { ...b, [field]: value } : b
    ));
  };

  const deleteBuyTransaction = (id) => {
    if (!confirm('Delete this purchase?')) return;
    setBuyTransactions(buyTransactions.filter(b => b.id !== id));
    if (editingBuyId === id) setEditingBuyId(null);
    setAssetOptions(assetOptions.filter(a => a.value !== id));
  };

  // ============================================================================
  // SELL TRANSACTION HANDLERS
  // ============================================================================

  const addSellTransaction = () => {
    const newSell = {
      id: generateId(),
      description: '',
      asset_id: '',
      sell_entire_amount: false,
      amount: '',
      transaction_costs_pct: '',
      sell_date: '',
      model_ids: []
    };
    setSellTransactions([...sellTransactions, newSell]);
    setEditingSellId(newSell.id);
  };

  const updateSellTransaction = (id, field, value) => {
    setSellTransactions(sellTransactions.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const deleteSellTransaction = (id) => {
    if (!confirm('Delete this sale?')) return;
    setSellTransactions(sellTransactions.filter(s => s.id !== id));
    if (editingSellId === id) setEditingSellId(null);
  };

  // ============================================================================
  // DEBT TRANSACTION HANDLERS
  // ============================================================================

  const addDebtTransaction = () => {
    const newDebt = {
      id: generateId(),
      description: '',
      start_date: '',
      ownership_type: '',
      owner_id: '',
      other_entity_id: '',
      smsf_account_id: '',
      debt_type: '',
      interest_rate: '',
      is_interest_only: false,
      interest_only_end_date: '',
      loan_amount: '',
      term_years: '',
      is_redraw_available: false,
      redraw_limit: '',
      establishment_cost: '',
      is_offset_available: false,
      offset_account_id: '',
      property_security_ids: [],
      related_asset_id: '',
      is_purchase_security: false,
      model_ids: []
    };
    setDebtTransactions([...debtTransactions, newDebt]);
    setEditingDebtId(newDebt.id);
  };

  const updateDebtTransaction = (id, field, value) => {
    setDebtTransactions(debtTransactions.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const deleteDebtTransaction = (id) => {
    if (!confirm('Delete this debt?')) return;
    setDebtTransactions(debtTransactions.filter(d => d.id !== id));
    if (editingDebtId === id) setEditingDebtId(null);
  };

  // ============================================================================
  // SHARED OWNER OPTIONS (with SMSF pooled/segregated logic)
  // ============================================================================

  const getTransactionOwnerOptions = () => {
    let owners = [];
    
    // Principals
    principals.forEach(p => {
      const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
      owners.push({
        id: p.id,
        label: name || (p.role === 'client' ? 'Client' : 'Partner'),
        type: 'Principal',
        color: '#3B82F6'
      });
    });
    
    // Joint (synthetic)
    if (principals.length === 2) {
      const name1 = `${principals[0].first_name || ''} ${principals[0].last_name || ''}`.trim();
      const name2 = `${principals[1].first_name || ''} ${principals[1].last_name || ''}`.trim();
      owners.push({
        id: 'joint',
        label: `${name1 || 'Client'} & ${name2 || 'Partner'} (Joint)`,
        type: 'Joint',
        color: '#3B82F6'
      });
    }
    
    // Trusts & Companies from Fact Find
    const entities = factFind?.trusts_companies?.entities || [];
    entities.filter(e => e.type === 'trust').forEach((t, i) => {
      owners.push({ id: `trust_${i}`, label: t.trust_name, type: 'Trust', color: '#EF4444' });
    });
    entities.filter(e => e.type === 'company').forEach((c, i) => {
      owners.push({ id: `company_${i}`, label: c.company_name, type: 'Company', color: '#F97316' });
    });
    
    // SMSFs from Fact Find — pooled = fund, segregated = accounts
    const smsfs = factFind?.smsf?.smsf_details || [];
    smsfs.forEach((fund, fi) => {
      if (fund.acct_type === '1') {
        // Pooled - add the fund itself
        owners.push({ id: `smsf_${fi}`, label: fund.smsf_name || 'SMSF', type: 'SMSF', color: '#92400E' });
      } else if (fund.acct_type === '2') {
        // Segregated - add each account
        (fund.accounts || []).forEach((acc, ai) => {
          const ownerName = principals.find(p => p.id === acc.owner)?.first_name || acc.owner;
          owners.push({
            id: `smsf_${fi}_acc_${ai}`,
            label: `${fund.smsf_name || 'SMSF'} - ${ownerName}`,
            type: 'SMSF Account',
            color: '#92400E'
          });
        });
      }
    });
    
    // New trusts from SOA Request
    const newTrusts = soaRequest?.products_entities?.new_trusts || [];
    newTrusts.forEach((t, i) => {
      if (t.trust_name) owners.push({ id: `new_trust_${i}`, label: `NEW - ${t.trust_name}`, type: 'Trust', color: '#EF4444' });
    });
    
    // New companies from SOA Request
    const newCompanies = soaRequest?.products_entities?.new_companies || [];
    newCompanies.forEach((c, i) => {
      if (c.company_name) owners.push({ id: `new_company_${i}`, label: `NEW - ${c.company_name}`, type: 'Company', color: '#F97316' });
    });
    
    // New SMSFs from SOA Request — same pooled/segregated logic
    const newSmsfs = soaRequest?.products_entities?.new_smsf || [];
    newSmsfs.forEach((fund, fi) => {
      if (fund.acct_type === '1') {
        owners.push({ id: `new_smsf_${fi}`, label: `NEW - ${fund.smsf_name || 'SMSF'}`, type: 'SMSF', color: '#92400E' });
      } else if (fund.acct_type === '2') {
        (fund.accounts || []).forEach((acc, ai) => {
          const ownerName = principals.find(p => p.id === acc.owner)?.first_name || acc.owner;
          owners.push({ id: `new_smsf_${fi}_acc_${ai}`, label: `NEW - ${fund.smsf_name || 'SMSF'} - ${ownerName}`, type: 'SMSF Account', color: '#92400E' });
        });
      }
    });
    
    return owners;
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getOwnerLabel = (ownerId) => {
    const owners = getTransactionOwnerOptions();
    const owner = owners.find(o => o.id === ownerId);
    return owner ? owner.label : '—';
  };

  const getAssetLabel = (assetId) => {
    const asset = assetOptions.find(a => a.value === assetId);
    return asset ? asset.label : '—';
  };

  // ============================================================================
  // LOADING STATE
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
    <SOARequestLayout currentSection="transactions" soaRequest={soaRequest}>
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="w-full">
          {/* Dark Banner */}
          <div style={{ backgroundColor: '#1E293B', padding: '24px 32px', borderRadius: '16px 16px 0 0' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
              Transactions
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8', margin: 0 }}>
              Record recommended asset purchases, sales, and new debts within this SOA.
            </p>
          </div>

          {/* White Content Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0 0 16px 16px', border: '1px solid #E2E8F0', borderTop: 'none' }}>
            {/* Contained Tabs */}
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ 
                display: 'inline-flex', 
                padding: '4px', 
                backgroundColor: '#F8FAFC', 
                borderRadius: '12px', 
                border: '1px solid #E2E8F0' 
              }}>
                <button 
                  onClick={() => setActiveTab('buy')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'buy' ? '#FFFFFF' : 'transparent',
                    boxShadow: activeTab === 'buy' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    color: activeTab === 'buy' ? '#1E293B' : '#64748B',
                    fontSize: '14px',
                    fontWeight: activeTab === 'buy' ? 600 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  🛒 Buy
                </button>
                <button 
                  onClick={() => setActiveTab('sell')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'sell' ? '#FFFFFF' : 'transparent',
                    boxShadow: activeTab === 'sell' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    color: activeTab === 'sell' ? '#1E293B' : '#64748B',
                    fontSize: '14px',
                    fontWeight: activeTab === 'sell' ? 600 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  📤 Sell
                </button>
                <button 
                  onClick={() => setActiveTab('debts')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'debts' ? '#FFFFFF' : 'transparent',
                    boxShadow: activeTab === 'debts' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    color: activeTab === 'debts' ? '#1E293B' : '#64748B',
                    fontSize: '14px',
                    fontWeight: activeTab === 'debts' ? 600 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  🏦 Debts
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div style={{ padding: '24px 32px' }}>
              {/* ================================================================ */}
              {/* BUY TAB */}
              {/* ================================================================ */}
              {activeTab === 'buy' && (
                <div>
                  {buyTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="text-5xl mb-6">🛒</div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Do you have any purchases?</h3>
                      <p className="text-slate-600 text-center mb-8 max-w-md">
                        Add assets you want to buy as part of this advice
                      </p>
                      <Button onClick={addBuyTransaction} style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }} className="hover:opacity-90 shadow-lg">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Purchase
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Asset Purchases</h3>
                        <Button onClick={addBuyTransaction} style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }} className="hover:opacity-90">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Purchase
                        </Button>
                      </div>

                      {/* Summary Table */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Asset Type</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {buyTransactions.map(buy => (
                            <TableRow key={buy.id} className="cursor-pointer hover:bg-slate-50">
                              <TableCell>{buy.description || '(No description)'}</TableCell>
                              <TableCell>{getAssetTypeLabel(buy.asset_type)}</TableCell>
                              <TableCell>{getOwnerLabel(buy.owner_id)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(buy.amount)}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setEditingBuyId(editingBuyId === buy.id ? null : buy.id)}
                                  className="mr-1"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => deleteBuyTransaction(buy.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Detail Panel */}
                      {editingBuyId && (
                        <BuyDetailPanel
                          buy={buyTransactions.find(b => b.id === editingBuyId)}
                          ownerOptions={getTransactionOwnerOptions()}
                          modelOptions={modelOptions}
                          debtOptions={debtOptions}
                          onUpdate={(field, value) => updateBuyTransaction(editingBuyId, field, value)}
                          onClose={() => setEditingBuyId(null)}
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ================================================================ */}
              {/* SELL TAB */}
              {/* ================================================================ */}
              {activeTab === 'sell' && (
                <div>
                  {sellTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="text-5xl mb-6">📤</div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Do you have any sales?</h3>
                      <p className="text-slate-600 text-center mb-8 max-w-md">
                        Add assets you want to sell as part of this advice
                      </p>
                      <Button onClick={addSellTransaction} style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }} className="hover:opacity-90 shadow-lg">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Sale
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Asset Sales</h3>
                        <Button onClick={addSellTransaction} style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }} className="hover:opacity-90">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Sale
                        </Button>
                      </div>

                      {/* Summary Table */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset</TableHead>
                            <TableHead>Sell Entire?</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sellTransactions.map(sell => (
                            <TableRow key={sell.id} className="cursor-pointer hover:bg-slate-50">
                              <TableCell>{getAssetLabel(sell.asset_id)}</TableCell>
                              <TableCell>{sell.sell_entire_amount ? 'Yes' : 'No'}</TableCell>
                              <TableCell className="text-right">
                                {sell.sell_entire_amount ? 'Full amount' : formatCurrency(sell.amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setEditingSellId(editingSellId === sell.id ? null : sell.id)}
                                  className="mr-1"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => deleteSellTransaction(sell.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Detail Panel */}
                      {editingSellId && (
                        <SellDetailPanel
                          sell={sellTransactions.find(s => s.id === editingSellId)}
                          assetOptions={[...assetOptions, ...buyTransactions.filter(b => b.asset_type).map(b => ({
                            value: b.id,
                            label: `${getAssetTypeLabel(b.asset_type)} (New Purchase)`
                          }))]}
                          modelOptions={modelOptions}
                          onUpdate={(field, value) => updateSellTransaction(editingSellId, field, value)}
                          onClose={() => setEditingSellId(null)}
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ================================================================ */}
              {/* DEBTS TAB */}
              {/* ================================================================ */}
              {activeTab === 'debts' && (
                <div>
                  {debtTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="text-5xl mb-6">🏦</div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Do you have any new debts?</h3>
                      <p className="text-slate-600 text-center mb-8 max-w-md">
                        Add new debts required to support your recommendations
                      </p>
                      <Button onClick={addDebtTransaction} style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }} className="hover:opacity-90 shadow-lg">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Debt
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">New Debts</h3>
                        <Button onClick={addDebtTransaction} style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }} className="hover:opacity-90">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Debt
                        </Button>
                      </div>

                      {/* Summary Table */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Debt Type</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead className="text-right">Loan Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {debtTransactions.map(debt => (
                            <TableRow key={debt.id} className="cursor-pointer hover:bg-slate-50">
                              <TableCell>{debt.description || '(No description)'}</TableCell>
                              <TableCell>{getDebtTypeLabel(debt.debt_type)}</TableCell>
                              <TableCell>{getOwnerLabel(debt.owner_id)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(debt.loan_amount)}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setEditingDebtId(editingDebtId === debt.id ? null : debt.id)}
                                  className="mr-1"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => deleteDebtTransaction(debt.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Detail Panel */}
                      {editingDebtId && (
                        <DebtDetailPanel
                          debt={debtTransactions.find(d => d.id === editingDebtId)}
                          ownerOptions={getTransactionOwnerOptions()}
                          smsfOptions={smsfOptions}
                          modelOptions={modelOptions}
                          buyTransactions={buyTransactions}
                          onUpdate={(field, value) => updateDebtTransaction(editingDebtId, field, value)}
                          onClose={() => setEditingDebtId(null)}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-end gap-3" style={{ padding: '24px 32px', borderTop: '1px solid #E2E8F0' }}>
              <Button 
                variant="outline"
                onClick={() => navigate(createPageUrl('SOARequestInsurance') + `?id=${soaRequest?.id}`)}
              >
                ◀ Back
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
                className="hover:opacity-90"
              >
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
// BUY DETAIL PANEL COMPONENT
// ============================================================================

function BuyDetailPanel({ buy, ownerOptions, modelOptions, debtOptions, onUpdate, onClose }) {
  if (!buy) return null;

  const showPropertyFields = isPropertyType(buy.asset_type);

  return (
    <div className="mt-6 p-6 bg-white border border-slate-200 rounded-xl">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <h3 className="text-lg font-bold flex items-center gap-2">
          🛒 <span>Purchase Details</span>
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Description */}
        <div>
          <Label>Description</Label>
          <Input
            value={buy.description || ''}
            onChange={(e) => onUpdate('description', e.target.value)}
            placeholder="e.g. Purchase BHP shares for growth portfolio"
            className="mt-1"
          />
        </div>

        {/* Row 1: Asset Type, Ownership, Owner, ASX */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label>New asset type</Label>
            <Select value={buy.asset_type || ''} onValueChange={(v) => onUpdate('asset_type', v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {BUY_ASSET_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ownership type</Label>
            <Select value={buy.ownership_type || ''} onValueChange={(v) => onUpdate('ownership_type', v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {OWNERSHIP_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Owner</Label>
            <div className="mt-1">
              <EntitySelect
                value={buy.owner_id}
                onChange={(val) => onUpdate('owner_id', val)}
                entities={ownerOptions}
              />
            </div>
          </div>
          <div>
            <Label>ASX holding</Label>
            <Input
              value={buy.asx_code || ''}
              onChange={(e) => onUpdate('asx_code', e.target.value)}
              placeholder="e.g. BHP"
              className="mt-1"
            />
          </div>
        </div>

        {/* Row 2: International, APIR, Amount, Date */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label>International stock</Label>
            <Input
              value={buy.international_code || ''}
              onChange={(e) => onUpdate('international_code', e.target.value)}
              placeholder="e.g. AAPL"
              className="mt-1"
            />
          </div>
          <div>
            <Label>APIR code</Label>
            <Input
              value={buy.apir_code || ''}
              onChange={(e) => onUpdate('apir_code', e.target.value)}
              placeholder="Enter APIR code"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Purchase amount</Label>
            <Input
              type="number"
              value={buy.amount || ''}
              onChange={(e) => onUpdate('amount', e.target.value)}
              placeholder="$0.00"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Purchase date</Label>
            <Input
              type="date"
              value={buy.purchase_date || ''}
              onChange={(e) => onUpdate('purchase_date', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Property Fields (Conditional) */}
        {showPropertyFields && (
          <div className="pt-4 border-t border-slate-200">
            <h4 className="font-semibold text-slate-700 mb-4">Property Details</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Net rental income</Label>
                <Input
                  type="number"
                  value={buy.rental_income || ''}
                  onChange={(e) => onUpdate('rental_income', e.target.value)}
                  placeholder="$0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Rent frequency</Label>
                <Select value={buy.rent_frequency || ''} onValueChange={(v) => onUpdate('rent_frequency', v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RENT_FREQUENCIES.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Debt used as security</Label>
                <Select value={buy.debt_security_id || ''} onValueChange={(v) => onUpdate('debt_security_id', v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {debtOptions.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Today's Dollars - Pill Tabs */}
        <div className="pt-4 border-t border-slate-200">
          <Label>Is the purchase price in today's dollars?</Label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={() => onUpdate('is_today_dollars', true)}
              style={{
                padding: '8px 20px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: buy.is_today_dollars ? '#7C3AED' : 'transparent',
                color: buy.is_today_dollars ? '#FFFFFF' : '#7C3AED',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Yes
            </button>
            <button
              onClick={() => onUpdate('is_today_dollars', false)}
              style={{
                padding: '8px 20px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: !buy.is_today_dollars ? '#7C3AED' : 'transparent',
                color: !buy.is_today_dollars ? '#FFFFFF' : '#7C3AED',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              No
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SELL DETAIL PANEL COMPONENT
// ============================================================================

function SellDetailPanel({ sell, assetOptions, modelOptions, onUpdate, onClose }) {
  if (!sell) return null;

  return (
    <div className="mt-6 p-6 bg-white border border-slate-200 rounded-xl">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <h3 className="text-lg font-bold flex items-center gap-2">
          📤 <span>Sale Details</span>
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Select asset</Label>
            <select
              value={sell.asset_id || ''}
              onChange={(e) => onUpdate('asset_id', e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select asset...</option>
              
              {assetOptions.filter(a => a.type === 'Investment').length > 0 && (
                <optgroup label="Investments">
                  {assetOptions.filter(a => a.type === 'Investment').map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </optgroup>
              )}
              
              {assetOptions.filter(a => a.type === 'New Purchase').length > 0 && (
                <optgroup label="New Purchases (This SOA)">
                  {assetOptions.filter(a => a.type === 'New Purchase').map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <div>
            <Label>Sell entire amount</Label>
            <div className="flex items-center space-x-2 mt-3">
              <Switch
                checked={sell.sell_entire_amount || false}
                onCheckedChange={(checked) => onUpdate('sell_entire_amount', checked)}
              />
              <span className="text-sm">{sell.sell_entire_amount ? 'Yes' : 'No'}</span>
            </div>
          </div>
          <div>
            <Label>Sell amount</Label>
            <Input
              type="number"
              value={sell.amount || ''}
              onChange={(e) => onUpdate('amount', e.target.value)}
              placeholder={sell.sell_entire_amount ? 'Full amount will be sold' : '$0.00'}
              disabled={sell.sell_entire_amount}
              className="mt-1"
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Transaction costs %</Label>
            <Input
              type="number"
              step="0.1"
              value={sell.transaction_costs_pct || ''}
              onChange={(e) => onUpdate('transaction_costs_pct', e.target.value)}
              placeholder="0.5"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Sell date</Label>
            <Input
              type="date"
              value={sell.sell_date || ''}
              onChange={(e) => onUpdate('sell_date', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Apply to models</Label>
            <p className="text-xs text-slate-500 mt-3">
              {modelOptions.length === 0 
                ? 'No models defined yet' 
                : `${sell.model_ids?.length || 0} models selected`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DEBT DETAIL PANEL COMPONENT
// ============================================================================

function DebtDetailPanel({ debt, ownerOptions, smsfOptions, modelOptions, buyTransactions, onUpdate, onClose }) {
  if (!debt) return null;

  return (
    <div className="mt-6 p-6 bg-white border border-slate-200 rounded-xl">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <h3 className="text-lg font-bold flex items-center gap-2">
          🏦 <span>New Debt Details</span>
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Description */}
        <div>
          <Label>Description</Label>
          <Input
            value={debt.description || ''}
            onChange={(e) => onUpdate('description', e.target.value)}
            placeholder="e.g. New investment loan for property purchase"
            className="mt-1"
          />
        </div>

        {/* Row 1: Start Date, Ownership, Owner, SMSF */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label>Debt start date</Label>
            <Input
              type="date"
              value={debt.start_date || ''}
              onChange={(e) => onUpdate('start_date', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Ownership type</Label>
            <Select value={debt.ownership_type || ''} onValueChange={(v) => onUpdate('ownership_type', v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {OWNERSHIP_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Owner</Label>
            <div className="mt-1">
              <EntitySelect
                value={debt.owner_id}
                onChange={(val) => onUpdate('owner_id', val)}
                entities={ownerOptions}
              />
            </div>
          </div>
          <div>
            <Label>SMSF account</Label>
            <Select value={debt.smsf_account_id || ''} onValueChange={(v) => onUpdate('smsf_account_id', v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {smsfOptions.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Debt Type, Interest Rate, Interest Only Toggle */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label>Debt type</Label>
            <Select value={debt.debt_type || ''} onValueChange={(v) => onUpdate('debt_type', v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {DEBT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Interest rate %</Label>
            <Input
              type="number"
              step="0.01"
              value={debt.interest_rate || ''}
              onChange={(e) => onUpdate('interest_rate', e.target.value)}
              placeholder="%"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Interest only debt?</Label>
            <div className="flex items-center space-x-2 mt-3">
              <Switch
                checked={debt.is_interest_only || false}
                onCheckedChange={(checked) => onUpdate('is_interest_only', checked)}
              />
              <span className="text-sm">{debt.is_interest_only ? 'Yes' : 'No'}</span>
            </div>
          </div>
          <div>
            <Label>Interest only end date</Label>
            <Input
              type="date"
              value={debt.interest_only_end_date || ''}
              onChange={(e) => onUpdate('interest_only_end_date', e.target.value)}
              disabled={!debt.is_interest_only}
              className="mt-1"
            />
          </div>
        </div>

        {/* Row 3: Loan Amount, Term, Redraw Toggle, Redraw Limit */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label>Loan amount</Label>
            <Input
              type="number"
              value={debt.loan_amount || ''}
              onChange={(e) => onUpdate('loan_amount', e.target.value)}
              placeholder="$0.00"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Term of loan (years)</Label>
            <Input
              type="number"
              value={debt.term_years || ''}
              onChange={(e) => onUpdate('term_years', e.target.value)}
              placeholder="Years"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Redraw available?</Label>
            <div className="flex items-center space-x-2 mt-3">
              <Switch
                checked={debt.is_redraw_available || false}
                onCheckedChange={(checked) => onUpdate('is_redraw_available', checked)}
              />
              <span className="text-sm">{debt.is_redraw_available ? 'Yes' : 'No'}</span>
            </div>
          </div>
          <div>
            <Label>Redraw limit</Label>
            <Input
              type="number"
              value={debt.redraw_limit || ''}
              onChange={(e) => onUpdate('redraw_limit', e.target.value)}
              placeholder="$0.00"
              disabled={!debt.is_redraw_available}
              className="mt-1"
            />
          </div>
        </div>

        {/* Row 4: Establishment Cost, Offset Toggle, Offset Account */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label>Establishment cost</Label>
            <Input
              type="number"
              value={debt.establishment_cost || ''}
              onChange={(e) => onUpdate('establishment_cost', e.target.value)}
              placeholder="$0.00"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Offset available?</Label>
            <div className="flex items-center space-x-2 mt-3">
              <Switch
                checked={debt.is_offset_available || false}
                onCheckedChange={(checked) => onUpdate('is_offset_available', checked)}
              />
              <span className="text-sm">{debt.is_offset_available ? 'Yes' : 'No'}</span>
            </div>
          </div>
          <div className="col-span-2">
            <Label>Select offset account</Label>
            <Select 
              value={debt.offset_account_id || ''} 
              onValueChange={(v) => onUpdate('offset_account_id', v)}
              disabled={!debt.is_offset_available}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder">No accounts available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 5: Purchase Security */}
        <div className="pt-4 border-t border-slate-200">
          <Label>Use purchase as security for this loan?</Label>
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              checked={debt.is_purchase_security || false}
              onCheckedChange={(checked) => onUpdate('is_purchase_security', checked)}
            />
            <span className="text-sm">Link to a buy transaction in this SOA</span>
          </div>
        </div>
      </div>
    </div>
  );
}