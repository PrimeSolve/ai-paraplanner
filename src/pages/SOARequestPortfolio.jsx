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
import { Plus, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// ==========================================================================
// CONSTANTS
// ==========================================================================
const RISK_PROFILE_ALLOCATIONS = {
  cash: {
    'Australian Equities': 0, 'International Equities': 0, 'Property & Infrastructure': 0,
    'Alternatives': 0, 'Growth Exposure': 0, 'Australian Fixed Interest': 0,
    'International Fixed Interest': 0, 'Cash': 100, 'Defensive Exposure': 100
  },
  conservative: {
    'Australian Equities': 13, 'International Equities': 13, 'Property & Infrastructure': 4,
    'Alternatives': 0, 'Growth Exposure': 30, 'Australian Fixed Interest': 35,
    'International Fixed Interest': 15, 'Cash': 20, 'Defensive Exposure': 70
  },
  moderately_conservative: {
    'Australian Equities': 22.5, 'International Equities': 22.5, 'Property & Infrastructure': 5,
    'Alternatives': 0, 'Growth Exposure': 50, 'Australian Fixed Interest': 25,
    'International Fixed Interest': 10, 'Cash': 15, 'Defensive Exposure': 50
  },
  balanced: {
    'Australian Equities': 31.5, 'International Equities': 31.5, 'Property & Infrastructure': 7,
    'Alternatives': 0, 'Growth Exposure': 70, 'Australian Fixed Interest': 14,
    'International Fixed Interest': 7, 'Cash': 9, 'Defensive Exposure': 30
  },
  growth: {
    'Australian Equities': 39, 'International Equities': 39, 'Property & Infrastructure': 7,
    'Alternatives': 0, 'Growth Exposure': 85, 'Australian Fixed Interest': 7.5,
    'International Fixed Interest': 4.5, 'Cash': 3, 'Defensive Exposure': 15
  },
  high_growth: {
    'Australian Equities': 45, 'International Equities': 45, 'Property & Infrastructure': 8,
    'Alternatives': 0, 'Growth Exposure': 98, 'Australian Fixed Interest': 0,
    'International Fixed Interest': 0, 'Cash': 2, 'Defensive Exposure': 2
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

const GROWTH_ASSETS = ['Australian Equities', 'International Equities', 'Property & Infrastructure', 'Alternatives'];
const DEFENSIVE_ASSETS = ['Australian Fixed Interest', 'International Fixed Interest', 'Cash'];

const TRANSACTION_TYPES = [
  { value: 'Buy', label: 'Buy' },
  { value: 'Sell', label: 'Sell' },
  { value: 'Switch', label: 'Switch' }
];

const generateId = () => 'ptxn_' + Math.random().toString(36).slice(2) + Date.now().toString(36);

const formatCurrency = (value) => {
  if (!value && value !== 0) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 }).format(num);
};

// ==========================================================================
// MAIN COMPONENT
// ==========================================================================
export default function SOARequestPortfolio() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [clientRiskProfile, setClientRiskProfile] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [editingId, setEditingId] = useState(null);

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
      
      const portfolioData = soaReq.portfolio || {};
      setTransactions(portfolioData.transactions || []);
      
      await loadProducts(soaReq.client_id, soaReq);
      await loadRiskProfile(soaReq.client_id);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (clientId, soaReq) => {
    try {
      const productList = [];
      
      try {
        const superFunds = await base44.entities.SuperFund?.filter({ client_id: clientId }) || [];
        superFunds.forEach(f => productList.push({ id: f.id, name: f.name, owner_id: f.owner_id, type: 'Super Fund' }));
      } catch (e) { /* Entity may not exist */ }
      
      try {
        const pensions = await base44.entities.Pension?.filter({ client_id: clientId }) || [];
        pensions.forEach(p => productList.push({ id: p.id, name: p.name, owner_id: p.owner_id, type: 'Pension' }));
      } catch (e) { /* Entity may not exist */ }
      
      try {
        const wraps = await base44.entities.Wrap?.filter({ client_id: clientId }) || [];
        wraps.forEach(w => productList.push({ id: w.id, name: w.name, owner_id: w.owner_id, type: 'Wrap' }));
      } catch (e) { /* Entity may not exist */ }
      
      const newProducts = soaReq.products_entities?.products || [];
      newProducts.forEach(p => {
        productList.push({ id: p.id, name: p.name, owner_id: p.owner_id, type: p.type || 'New Product' });
      });
      
      setProducts(productList);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadRiskProfile = async (clientId) => {
    try {
      const clients = await base44.entities.Client.filter({ id: clientId });
      if (clients[0]?.risk_profile) {
        setClientRiskProfile(clients[0].risk_profile);
      }
    } catch (error) {
      console.error('Error loading risk profile:', error);
    }
  };

  // =========================================================================
  // TRANSACTION HANDLERS
  // =========================================================================
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

  // =========================================================================
  // ALLOCATION CALCULATIONS
  // =========================================================================
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

  // =========================================================================
  // SAVE HANDLER
  // =========================================================================
  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        portfolio: {
          transactions: transactions
        }
      });
      toast.success('Portfolio saved');
      navigate(createPageUrl('SOARequestStrategy') + `?id=${soaRequest.id}`);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // =========================================================================
  // HELPERS
  // =========================================================================
  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? `${product.name} (${product.type})` : '—';
  };

  // =========================================================================
  // LOADING STATE
  // =========================================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  const selectedHoldings = getProductHoldings(selectedProductId);
  const totalValue = selectedHoldings.reduce((sum, h) => sum + h.amount, 0);

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <SOARequestLayout currentSection="portfolio" soaRequest={soaRequest}>
      <div className="flex-1 overflow-auto bg-slate-50">
        {/* Header */}
        <div className="bg-slate-800 px-8 py-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white">Portfolio</h1>
          <p className="text-slate-300 mt-1">
            Manage investment strategies and transactions for superannuation, pensions, and wraps.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Allocation Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Current Allocation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>📊</span> Current Allocation
                  </CardTitle>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select a product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <p>No holdings found for this product</p>
                    <p className="text-sm mt-1">Add transactions below to build the portfolio</p>
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
                          <div className="w-20 text-right text-sm">
                            {pct.toFixed(1)}%
                          </div>
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
                  {clientRiskProfile && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-800">
                      🎯 {RISK_PROFILE_LABELS[clientRiskProfile]}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!clientRiskProfile ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span className="text-sm text-amber-800">
                      Set a risk profile in the Fact Find to see target allocation comparison
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Table Header */}
                    <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-slate-500 uppercase pb-2 border-b">
                      <div>Asset Class</div>
                      <div className="text-center">Target %</div>
                      <div className="text-center">Current %</div>
                      <div className="text-center">Divergence</div>
                    </div>
                    
                    {/* Growth Assets */}
                    {GROWTH_ASSETS.map(asset => {
                      const target = RISK_PROFILE_ALLOCATIONS[clientRiskProfile]?.[asset] || 0;
                      const current = 0;
                      const div = current - target;
                      return (
                        <div key={asset} className="grid grid-cols-4 gap-2 py-2 text-sm border-b border-slate-100">
                          <div>{asset}</div>
                          <div className="text-center">{target.toFixed(1)}%</div>
                          <div className="text-center text-slate-400">—</div>
                          <div className={`text-center font-semibold ${div > 0 ? 'text-green-600' : div < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                            {div > 0 ? '+' : ''}{div.toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Growth Exposure Row */}
                    <div className="grid grid-cols-4 gap-2 py-2 text-sm bg-sky-50 font-semibold text-sky-800">
                      <div>Growth Exposure</div>
                      <div className="text-center">{RISK_PROFILE_ALLOCATIONS[clientRiskProfile]?.['Growth Exposure']?.toFixed(1)}%</div>
                      <div className="text-center">—</div>
                      <div className="text-center">—</div>
                    </div>
                    
                    {/* Defensive Assets */}
                    {DEFENSIVE_ASSETS.map(asset => {
                      const target = RISK_PROFILE_ALLOCATIONS[clientRiskProfile]?.[asset] || 0;
                      const current = 0;
                      const div = current - target;
                      return (
                        <div key={asset} className="grid grid-cols-4 gap-2 py-2 text-sm border-b border-slate-100">
                          <div>{asset}</div>
                          <div className="text-center">{target.toFixed(1)}%</div>
                          <div className="text-center text-slate-400">—</div>
                          <div className={`text-center font-semibold ${div > 0 ? 'text-green-600' : div < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                            {div > 0 ? '+' : ''}{div.toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Defensive Exposure Row */}
                    <div className="grid grid-cols-4 gap-2 py-2 text-sm bg-sky-50 font-semibold text-sky-800">
                      <div>Defensive Exposure</div>
                      <div className="text-center">{RISK_PROFILE_ALLOCATIONS[clientRiskProfile]?.['Defensive Exposure']?.toFixed(1)}%</div>
                      <div className="text-center">—</div>
                      <div className="text-center">—</div>
                    </div>
                    
                    <p className="text-xs text-slate-400 text-center pt-3">
                      Note: Map investment options to asset classes to see current allocation
                    </p>
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
                        <p>No transactions yet.</p>
                        <p className="text-sm">Click "Add transaction" to get started.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map(txn => (
                      <TableRow key={txn.id}>
                        <TableCell>
                          {editingId === txn.id ? (
                            <Select
                              value={txn.product_id}
                              onValueChange={(v) => updateTransaction(txn.id, 'product_id', v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select product..." />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map(p => (
                                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            getProductName(txn.product_id)
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === txn.id ? (
                            <Select
                              value={txn.type}
                              onValueChange={(v) => updateTransaction(txn.id, 'type', v)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TRANSACTION_TYPES.map(t => (
                                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            txn.type
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === txn.id ? (
                            <Input
                              value={txn.investment_option || ''}
                              onChange={(e) => updateTransaction(txn.id, 'investment_option', e.target.value)}
                              placeholder="e.g. Vanguard Growth Index"
                            />
                          ) : (
                            txn.investment_option || '—'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === txn.id ? (
                            <Input
                              type="number"
                              value={txn.amount || ''}
                              onChange={(e) => updateTransaction(txn.id, 'amount', e.target.value)}
                              placeholder="0"
                              className="text-right"
                            />
                          ) : (
                            formatCurrency(txn.amount)
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === txn.id ? (
                            <Input
                              value={txn.units || ''}
                              onChange={(e) => updateTransaction(txn.id, 'units', e.target.value)}
                              placeholder="—"
                              className="text-right"
                            />
                          ) : (
                            txn.units || '—'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(editingId === txn.id ? null : txn.id)}
                            className="mr-1"
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
    </SOARequestLayout>
  );
}