import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import { Plus, Trash2, Pencil, AlertTriangle, Check, X } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// RISK PROFILE TARGET ALLOCATIONS
// ============================================================================

const RISK_PROFILE_ALLOCATIONS = {
  cash: {
    'Australian Equities': 0,
    'International Equities': 0,
    'Property & Infrastructure': 0,
    'Alternatives': 0,
    'Growth Exposure': 0,
    'Australian Fixed Interest': 0,
    'International Fixed Interest': 0,
    'Cash': 100,
    'Defensive Exposure': 100
  },
  conservative: {
    'Australian Equities': 13,
    'International Equities': 13,
    'Property & Infrastructure': 4,
    'Alternatives': 0,
    'Growth Exposure': 30,
    'Australian Fixed Interest': 35,
    'International Fixed Interest': 15,
    'Cash': 20,
    'Defensive Exposure': 70
  },
  moderately_conservative: {
    'Australian Equities': 22.5,
    'International Equities': 22.5,
    'Property & Infrastructure': 5,
    'Alternatives': 0,
    'Growth Exposure': 50,
    'Australian Fixed Interest': 25,
    'International Fixed Interest': 10,
    'Cash': 15,
    'Defensive Exposure': 50
  },
  balanced: {
    'Australian Equities': 31.5,
    'International Equities': 31.5,
    'Property & Infrastructure': 7,
    'Alternatives': 0,
    'Growth Exposure': 70,
    'Australian Fixed Interest': 14,
    'International Fixed Interest': 7,
    'Cash': 9,
    'Defensive Exposure': 30
  },
  growth: {
    'Australian Equities': 39,
    'International Equities': 39,
    'Property & Infrastructure': 7,
    'Alternatives': 0,
    'Growth Exposure': 85,
    'Australian Fixed Interest': 7.5,
    'International Fixed Interest': 4.5,
    'Cash': 3,
    'Defensive Exposure': 15
  },
  high_growth: {
    'Australian Equities': 45,
    'International Equities': 45,
    'Property & Infrastructure': 8,
    'Alternatives': 0,
    'Growth Exposure': 98,
    'Australian Fixed Interest': 0,
    'International Fixed Interest': 0,
    'Cash': 2,
    'Defensive Exposure': 2
  }
};

const RISK_PROFILE_LABELS = {
  cash: 'Cash',
  conservative: 'Conservative',
  moderately_conservative: 'Moderately Conservative',
  balanced: 'Balanced',
  growth: 'Growth',
  high_growth: 'High Growth'
};

const GROWTH_ASSETS = [
  'Australian Equities',
  'International Equities',
  'Property & Infrastructure',
  'Alternatives'
];

const DEFENSIVE_ASSETS = [
  'Australian Fixed Interest',
  'International Fixed Interest',
  'Cash'
];

const TRANSACTION_TYPES = [
  { value: 'Buy', label: 'Buy' },
  { value: 'Sell', label: 'Sell' },
  { value: 'Switch', label: 'Switch' }
];

// ============================================================================
// HELPERS
// ============================================================================

const generateId = () => 'ptxn_' + Math.random().toString(36).slice(2) + Date.now().toString(36);

const formatCurrency = (value) => {
  if (!value && value !== 0) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SOARequestPortfolio() {
  const navigate = useNavigate();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Core data
  const [soaRequest, setSOARequest] = useState(null);
  const [factFind, setFactFind] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [principals, setPrincipals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [clientRiskProfile, setClientRiskProfile] = useState(null);

  // UI state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [targetAllocation, setTargetAllocation] = useState(null);
  const [ownerName, setOwnerName] = useState('');
  const [profileName, setProfileName] = useState('');
  const [editingId, setEditingId] = useState(null);

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

      // Load transactions from portfolio data
      const portfolioData = soaReq.portfolio || {};
      setTransactions(portfolioData.transactions || []);

      // Load Fact Find
      let factFindData = null;
      if (soaReq.fact_find_id) {
        const factFinds = await base44.entities.FactFind.filter({ id: soaReq.fact_find_id });
        factFindData = factFinds[0];
        setFactFind(factFindData);
      }

      // Load Principals
      const principalsData = await base44.entities.Principal.filter({ client_id: soaReq.client_id });
      setPrincipals(principalsData);

      // Load products and risk profile
      await loadProducts(soaReq, factFindData, principalsData);
      await loadRiskProfile(soaReq.client_id);

      // Restore selected product
      const savedProductId = soaReq?.portfolio?.selectedProductId;
      if (savedProductId) {
        setSelectedProductId(savedProductId);
        // Trigger the product selection logic after products are loaded
        setTimeout(() => handleProductSelection(savedProductId), 100);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (soaReq, factFindData, principalsData) => {
    try {
      const productList = [];

      // 1. Existing superannuation funds from Fact Find
      const superAccounts = factFindData?.superannuation?.funds || [];
      superAccounts.forEach((acc, i) => {
        productList.push({
          id: `super_${i}`,
          name: `Super - ${acc.fund_name || acc.provider || 'Superannuation'}`,
          type: 'Superannuation',
          owner: acc.s_owner || acc.person
        });
      });

      // 2. Existing pension accounts from Fact Find
      const pensionAccounts = factFindData?.superannuation?.pensions || [];
      pensionAccounts.forEach((acc, i) => {
        productList.push({
          id: `pension_${i}`,
          name: `Pension - ${acc.fund_name || acc.provider || 'Pension'}`,
          type: 'Pension',
          owner: acc.p_owner || acc.person
        });
      });

      // 3. Existing investments (wraps, platforms, managed funds) from Fact Find
      const investments = factFindData?.investment?.wraps || [];
      investments.forEach((asset, i) => {
        productList.push({
          id: `investment_${i}`,
          name: asset.platform_name || asset.name || 'Investment',
          type: 'Investment',
          owner: asset.w_owner || asset.person
        });
      });

      // Also check bonds
      const bonds = factFindData?.investment?.bonds || [];
      bonds.forEach((bond, i) => {
        productList.push({
          id: `bond_${i}`,
          name: bond.bond_name || bond.name || 'Investment Bond',
          type: 'Investment',
          owner: bond.b_owner || bond.person
        });
      });

      // 4. SMSF from Fact Find (pooled = fund, segregated = accounts)
      const smsfs = factFindData?.smsf?.smsf_details || [];
      smsfs.forEach((fund, fi) => {
        if (fund.acct_type === '1') {
          // Pooled - no specific owner
          productList.push({ 
            id: `smsf_${fi}`, 
            name: fund.smsf_name || 'SMSF', 
            type: 'SMSF',
            owner: null
          });
        } else if (fund.acct_type === '2') {
          // Segregated - add each account
          (fund.accounts || []).forEach((acc, ai) => {
            const ownerName = principalsData.find(p => p.id === acc.owner)?.first_name || acc.owner;
            const ownerRole = principalsData.find(p => p.id === acc.owner)?.role;
            productList.push({
              id: `smsf_${fi}_acc_${ai}`,
              name: `${fund.smsf_name || 'SMSF'} - ${ownerName}`,
              type: 'SMSF Account',
              owner: ownerRole
            });
          });
        }
      });

      // 5. New products from SOA Request (super, pension, wrap, bonds)
      const newProducts = soaReq.products_entities?.products || {};
      Object.entries(newProducts).forEach(([type, items]) => {
        (items || []).forEach((p, i) => {
          productList.push({
            id: `new_${type}_${i}`,
            name: `NEW - ${p.product_name || type}`,
            type: `New ${type}`,
            owner: p.person || p.owner
          });
        });
      });

      setProducts(productList);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadRiskProfile = async (clientId) => {
    try {
      // Try to load from Client entity
      const clients = await base44.entities.Client.filter({ id: clientId });
      if (clients[0]?.risk_profile) {
        setClientRiskProfile(clients[0].risk_profile);
        return;
      }

      // Future: Load from linked Fact Find
      // For now, leave as null to show warning
    } catch (error) {
      console.error('Error loading risk profile:', error);
    }
  };

  // ============================================================================
  // TRANSACTION CRUD
  // ============================================================================

  const addTransaction = () => {
    const newTxn = {
      id: generateId(),
      product_id: '',
      type: 'Buy',
      investment_option: '',
      amount: '',
      units: ''
    };
    setTransactions([...transactions, newTxn]);
    setEditingId(newTxn.id);
  };

  const updateTransaction = (id, field, value) => {
    setTransactions(transactions.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const deleteTransaction = (id) => {
    if (!confirm('Delete this transaction?')) return;
    setTransactions(transactions.filter(t => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const saveEditing = () => {
    setEditingId(null);
  };

  const cancelEditing = (id) => {
    // If it's a new empty transaction, delete it
    const txn = transactions.find(t => t.id === id);
    if (txn && !txn.product_id && !txn.investment_option && !txn.amount) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
    setEditingId(null);
  };

  // ============================================================================
  // ALLOCATION CALCULATIONS
  // ============================================================================

  const getProductHoldings = (productId) => {
    if (!productId) return [];

    const productTxns = transactions.filter(t => t.product_id === productId);
    const holdings = {};

    productTxns.forEach(txn => {
      if (!txn.investment_option) return;

      const key = txn.investment_option;
      if (!holdings[key]) {
        holdings[key] = { name: key, amount: 0 };
      }

      const amount = parseFloat(txn.amount) || 0;
      if (txn.type === 'Buy') {
        holdings[key].amount += amount;
      } else if (txn.type === 'Sell') {
        holdings[key].amount -= amount;
      }
    });

    return Object.values(holdings).filter(h => h.amount > 0);
  };

  // ============================================================================
  // SAVE HANDLER
  // ============================================================================

  const savePortfolioData = async () => {
    if (!soaRequest?.id) return;
    
    await base44.entities.SOARequest.update(soaRequest.id, {
      portfolio: {
        transactions: transactions
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePortfolioData();
      toast.success('Portfolio saved');
      navigate(createPageUrl('SOARequestStrategy') + `?id=${soaRequest.id}`);
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
        await savePortfolioData();
      } catch (err) {
        console.error('Save before nav failed:', err);
      }
      window.dispatchEvent(new Event('soa-save-complete'));
    };

    window.addEventListener('soa-save-before-nav', handleSaveBeforeNav);
    return () => window.removeEventListener('soa-save-before-nav', handleSaveBeforeNav);
  }, [transactions, soaRequest?.id]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : '—';
  };

  // Resolve owner value to 'client' or 'partner' role
  const resolveOwnerRole = (ownerValue) => {
    if (!ownerValue) return null;
    
    // Direct role strings
    if (ownerValue === 'client' || ownerValue === 'partner') {
      return ownerValue;
    }
    
    // Pattern-based IDs from Fact Find
    if (ownerValue === 'principal_client') return 'client';
    if (ownerValue === 'principal_partner') return 'partner';
    
    // UUID - match against loaded principals
    const matched = principals.find(p => p.id === ownerValue);
    if (matched) return matched.role; // 'client' or 'partner' (lowercase)
    
    // Not a principal - Trust, Company, SMSF etc.
    return null;
  };

  // Get risk profile for selected product's owner
  const handleProductSelection = async (productId) => {
    setSelectedProductId(productId);
    
    // Save selected product to database
    if (soaRequest?.id) {
      try {
        await base44.entities.SOARequest.update(soaRequest.id, {
          portfolio: {
            ...soaRequest.portfolio,
            selectedProductId: productId,
            transactions: transactions
          }
        });
      } catch (err) {
        console.error('Failed to save selected product:', err);
      }
    }
    
    if (!productId || !factFind) {
      setTargetAllocation(null);
      setOwnerName('');
      setProfileName('');
      return;
    }
    
    const selectedProduct = products.find(p => p.id === productId);
    console.log('OWNER CHECK:', selectedProduct?.owner, typeof selectedProduct?.owner);
    
    const ownerRole = resolveOwnerRole(selectedProduct?.owner);
    
    if (!ownerRole) {
      // Entity-owned product - no personal risk profile
      setTargetAllocation(null);
      setOwnerName('Entity-owned');
      setProfileName('');
      return;
    }
    
    // Get the owner's name for display
    const ownerPrincipal = principals.find(p => p.role === ownerRole);
    let displayName = ownerRole;
    
    if (ownerPrincipal) {
      displayName = `${ownerPrincipal.first_name || ''} ${ownerPrincipal.last_name || ''}`.trim();
    } else if (factFind?.personal && ownerRole === 'client') {
      displayName = `${factFind.personal.first_name || ''} ${factFind.personal.last_name || ''}`.trim();
    } else if (factFind?.personal?.partner && ownerRole === 'partner') {
      displayName = `${factFind.personal.partner.first_name || ''} ${factFind.personal.partner.last_name || ''}`.trim();
    }
    
    if (!displayName || displayName === 'client' || displayName === 'partner') {
      displayName = ownerRole === 'client' ? 'Client' : 'Partner';
    }
    
    // Get risk profile
    const riskProfileData = factFind?.risk_profile;
    const personProfile = riskProfileData?.[ownerRole];
    
    // Use adjustedProfile first, fall back to profile
    const profile = personProfile?.adjustedProfile || personProfile?.profile;
    
    console.log('PROFILE NAME:', profile);
    console.log('AVAILABLE KEYS:', Object.keys(RISK_PROFILE_ALLOCATIONS));
    
    // Normalize to lowercase for matching
    const profileKey = profile?.toLowerCase();
    const allocation = RISK_PROFILE_ALLOCATIONS[profileKey];
    
    console.log('MATCH:', allocation ? 'YES' : 'NO');
    
    if (!allocation) {
      setTargetAllocation(null);
      setOwnerName(displayName);
      setProfileName('No risk profile set');
      return;
    }
    
    setTargetAllocation(allocation);
    setOwnerName(displayName);
    setProfileName(RISK_PROFILE_LABELS[profileKey] || profile);
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

  const selectedHoldings = getProductHoldings(selectedProductId);
  const totalValue = selectedHoldings.reduce((sum, h) => sum + h.amount, 0);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SOARequestLayout currentSection="portfolio" soaRequest={soaRequest}>
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        {/* Dark Banner */}
        <div style={{ backgroundColor: '#1E293B', padding: '24px 32px', borderRadius: '16px 16px 0 0', marginBottom: '0' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
            Portfolio
          </h1>
          <p style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8', margin: 0 }}>
            Manage investment strategies and transactions for superannuation, pensions, and wraps.
          </p>
        </div>

        {/* White Content Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0 0 16px 16px', border: '1px solid #E2E8F0', borderTop: 'none', padding: '24px 32px' }}>
        <div className="space-y-6">
          {/* Allocation Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Current Allocation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>📊</span> Current Allocation
                  </CardTitle>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductSelection(e.target.value)}
                    className="w-[250px] flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select a product...</option>
                    
                    {products.filter(p => p.type === 'Superannuation').length > 0 && (
                      <optgroup label="Superannuation">
                        {products.filter(p => p.type === 'Superannuation').map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    )}
                    
                    {products.filter(p => p.type === 'Pension').length > 0 && (
                      <optgroup label="Pension">
                        {products.filter(p => p.type === 'Pension').map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    )}
                    
                    {products.filter(p => p.type === 'Investment').length > 0 && (
                      <optgroup label="Investments">
                        {products.filter(p => p.type === 'Investment').map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    )}
                    
                    {products.filter(p => p.type === 'SMSF' || p.type === 'SMSF Account').length > 0 && (
                      <optgroup label="SMSF">
                        {products.filter(p => p.type === 'SMSF' || p.type === 'SMSF Account').map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    )}
                    
                    {products.filter(p => p.type?.startsWith('New')).length > 0 && (
                      <optgroup label="New Products (SOA)">
                        {products.filter(p => p.type?.startsWith('New')).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedProductId ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="text-4xl mb-3">📈</div>
                    <p>Select a product to view allocation</p>
                  </div>
                ) : selectedHoldings.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="text-4xl mb-3">📊</div>
                    <p>No holdings for this product</p>
                    <p className="text-sm mt-1">Add transactions below</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedHoldings.map((holding, idx) => {
                      const pct = totalValue > 0 ? (holding.amount / totalValue * 100) : 0;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-40 text-sm font-medium truncate">{holding.name}</div>
                          <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="w-20 text-right text-sm">{pct.toFixed(1)}%</div>
                          <div className="w-28 text-right text-sm text-slate-600">
                            {formatCurrency(holding.amount)}
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-3 border-t flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(totalValue)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: Target vs Current */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>⚖️</span> Target vs Current
                  </CardTitle>
                  {profileName && ownerName !== 'Entity-owned' && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-800">
                      🎯 {ownerName} — {profileName}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedProductId ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="text-4xl mb-3">🎯</div>
                    <p>Select a product to view target allocation</p>
                  </div>
                ) : ownerName === 'Entity-owned' ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-slate-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700">
                      Risk profile is not available as product owner is not set
                    </span>
                  </div>
                ) : !targetAllocation ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span className="text-sm text-amber-800">
                      Set a risk profile in the Fact Find to see target allocation
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1 text-sm">
                    <div className="mb-3 pb-2 border-b">
                      <div className="text-xs text-slate-500">Growth / Defensive Split</div>
                      <div className="text-lg font-semibold text-slate-700">
                        {targetAllocation['Growth Exposure']}% Growth / {targetAllocation['Defensive Exposure']}% Defensive
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 font-semibold text-slate-600 pb-2 border-b uppercase text-xs">
                      <div>Asset Class</div>
                      <div className="text-center">Target %</div>
                      <div className="text-center">Current %</div>
                      <div className="text-center">Div</div>
                    </div>
                    {GROWTH_ASSETS.map(asset => {
                      const target = targetAllocation[asset] || 0;
                      const current = 0;
                      const div = current - target;
                      return (
                        <div key={asset} className="grid grid-cols-4 gap-2 py-1.5 border-b border-slate-100 text-xs">
                          <div>{asset}</div>
                          <div className="text-center">{target.toFixed(1)}%</div>
                          <div className="text-center text-slate-400">—</div>
                          <div className={`text-center font-semibold ${div < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                            {div > 0 ? '+' : ''}{div.toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                    <div className="grid grid-cols-4 gap-2 py-1.5 bg-sky-50 font-semibold text-sky-800 text-xs">
                      <div>Growth Exp</div>
                      <div className="text-center">{targetAllocation['Growth Exposure']?.toFixed(1)}%</div>
                      <div className="text-center">—</div>
                      <div className="text-center">—</div>
                    </div>
                    {DEFENSIVE_ASSETS.map(asset => {
                      const target = targetAllocation[asset] || 0;
                      const current = 0;
                      const div = current - target;
                      return (
                        <div key={asset} className="grid grid-cols-4 gap-2 py-1.5 border-b border-slate-100 text-xs">
                          <div>{asset}</div>
                          <div className="text-center">{target.toFixed(1)}%</div>
                          <div className="text-center text-slate-400">—</div>
                          <div className={`text-center font-semibold ${div < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                            {div > 0 ? '+' : ''}{div.toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                    <div className="grid grid-cols-4 gap-2 py-1.5 bg-sky-50 font-semibold text-sky-800 text-xs">
                      <div>Def Exp</div>
                      <div className="text-center">{targetAllocation['Defensive Exposure']?.toFixed(1)}%</div>
                      <div className="text-center">—</div>
                      <div className="text-center">—</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Portfolio Transactions</CardTitle>
                <Button onClick={addTransaction} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add transaction
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: '22%' }}>Product</TableHead>
                    <TableHead style={{ width: '12%' }}>Type</TableHead>
                    <TableHead style={{ width: '28%' }}>Investment Option</TableHead>
                    <TableHead style={{ width: '15%' }} className="text-right">Amount</TableHead>
                    <TableHead style={{ width: '13%' }} className="text-right">Units</TableHead>
                    <TableHead style={{ width: '10%' }} className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                        <div className="text-4xl mb-3">📊</div>
                        <p>No transactions yet</p>
                        <p className="text-sm">Click "Add transaction" to get started</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map(txn => (
                      <TableRow key={txn.id}>
                        <TableCell>
                          {editingId === txn.id ? (
                            <select
                              value={txn.product_id}
                              onChange={(e) => updateTransaction(txn.id, 'product_id', e.target.value)}
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="">Select...</option>
                              
                              {products.filter(p => p.type === 'Superannuation').length > 0 && (
                                <optgroup label="Superannuation">
                                  {products.filter(p => p.type === 'Superannuation').map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </optgroup>
                              )}
                              
                              {products.filter(p => p.type === 'Pension').length > 0 && (
                                <optgroup label="Pension">
                                  {products.filter(p => p.type === 'Pension').map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </optgroup>
                              )}
                              
                              {products.filter(p => p.type === 'Investment').length > 0 && (
                                <optgroup label="Investments">
                                  {products.filter(p => p.type === 'Investment').map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </optgroup>
                              )}
                              
                              {products.filter(p => p.type === 'SMSF' || p.type === 'SMSF Account').length > 0 && (
                                <optgroup label="SMSF">
                                  {products.filter(p => p.type === 'SMSF' || p.type === 'SMSF Account').map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </optgroup>
                              )}
                              
                              {products.filter(p => p.type?.startsWith('New')).length > 0 && (
                                <optgroup label="New Products (SOA)">
                                  {products.filter(p => p.type?.startsWith('New')).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          ) : (
                            <span className="text-sm">{getProductName(txn.product_id)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === txn.id ? (
                            <Select
                              value={txn.type}
                              onValueChange={(v) => updateTransaction(txn.id, 'type', v)}
                            >
                              <SelectTrigger className="text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TRANSACTION_TYPES.map(t => (
                                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm">{txn.type}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === txn.id ? (
                            <Input
                              size="sm"
                              value={txn.investment_option || ''}
                              onChange={(e) => updateTransaction(txn.id, 'investment_option', e.target.value)}
                              placeholder="e.g. Vanguard Growth"
                              className="text-xs"
                            />
                          ) : (
                            <span className="text-sm">{txn.investment_option || '—'}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === txn.id ? (
                            <Input
                              type="number"
                              value={txn.amount || ''}
                              onChange={(e) => updateTransaction(txn.id, 'amount', e.target.value)}
                              placeholder="0"
                              className="text-xs text-right"
                            />
                          ) : (
                            <span className="text-sm">{formatCurrency(txn.amount)}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === txn.id ? (
                            <Input
                              value={txn.units || ''}
                              onChange={(e) => updateTransaction(txn.id, 'units', e.target.value)}
                              placeholder="—"
                              className="text-xs text-right"
                            />
                          ) : (
                            <span className="text-sm">{txn.units || '—'}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {editingId === txn.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={saveEditing}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelEditing(txn.id)}
                                className="text-gray-600 hover:text-gray-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingId(txn.id)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTransaction(txn.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="flex justify-between items-center py-6 border-t">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('SOARequestTransactions') + `?id=${soaRequest?.id}`)}
            >
              ◀ Back
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
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