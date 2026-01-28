import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SOARequestTransactions() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [buyTransactions, setBuyTransactions] = useState([]);
  const [sellTransactions, setSellTransactions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (id) {
          const requests = await base44.entities.SOARequest.filter({ id });
          if (requests[0]) {
            setSOARequest(requests[0]);
            const transactions = requests[0].transactions || {};
            setBuyTransactions(transactions.buy || []);
            setSellTransactions(transactions.sell || []);
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

  const addBuyTransaction = () => {
    setBuyTransactions([...buyTransactions, { asset_type: '', asset_name: '', amount: '', entity: '' }]);
  };

  const addSellTransaction = () => {
    setSellTransactions([...sellTransactions, { asset_type: '', asset_name: '', amount: '', entity: '' }]);
  };

  const removeBuyTransaction = (index) => {
    setBuyTransactions(buyTransactions.filter((_, i) => i !== index));
  };

  const removeSellTransaction = (index) => {
    setSellTransactions(sellTransactions.filter((_, i) => i !== index));
  };

  const updateBuyTransaction = (index, field, value) => {
    const updated = [...buyTransactions];
    updated[index][field] = value;
    setBuyTransactions(updated);
  };

  const updateSellTransaction = (index, field, value) => {
    const updated = [...sellTransactions];
    updated[index][field] = value;
    setSellTransactions(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        transactions: {
          buy: buyTransactions,
          sell: sellTransactions
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <SOARequestLayout currentSection="transactions" soaRequest={soaRequest}>
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="w-full space-y-6">
          {/* Info Banner */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-bold text-slate-800 mb-2">Transactions</h3>
              <p className="text-sm text-slate-700">
                Specify assets you want to buy or sell, or any new debts required to support
              </p>
            </CardContent>
          </Card>
          
          {/* Buy Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Buy Transactions</CardTitle>
                <Button onClick={addBuyTransaction} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Buy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {buyTransactions.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No buy transactions added yet</p>
              ) : (
                buyTransactions.map((transaction, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-700">Buy Transaction #{index + 1}</h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeBuyTransaction(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Asset Type</label>
                        <Select value={transaction.asset_type} onValueChange={(v) => updateBuyTransaction(index, 'asset_type', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="property">Property</SelectItem>
                            <SelectItem value="shares">Shares</SelectItem>
                            <SelectItem value="managed_fund">Managed Fund</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Amount ($)</label>
                        <Input 
                          type="number"
                          value={transaction.amount}
                          onChange={(e) => updateBuyTransaction(index, 'amount', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Asset Name</label>
                        <Input 
                          value={transaction.asset_name}
                          onChange={(e) => updateBuyTransaction(index, 'asset_name', e.target.value)}
                          placeholder="Enter asset name"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Entity</label>
                        <Input 
                          value={transaction.entity}
                          onChange={(e) => updateBuyTransaction(index, 'entity', e.target.value)}
                          placeholder="Client, Trust, etc."
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Sell Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sell Transactions</CardTitle>
                <Button onClick={addSellTransaction} size="sm" className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sell
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {sellTransactions.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No sell transactions added yet</p>
              ) : (
                sellTransactions.map((transaction, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-700">Sell Transaction #{index + 1}</h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeSellTransaction(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Asset Type</label>
                        <Select value={transaction.asset_type} onValueChange={(v) => updateSellTransaction(index, 'asset_type', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="property">Property</SelectItem>
                            <SelectItem value="shares">Shares</SelectItem>
                            <SelectItem value="managed_fund">Managed Fund</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Amount ($)</label>
                        <Input 
                          type="number"
                          value={transaction.amount}
                          onChange={(e) => updateSellTransaction(index, 'amount', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Asset Name</label>
                        <Input 
                          value={transaction.asset_name}
                          onChange={(e) => updateSellTransaction(index, 'asset_name', e.target.value)}
                          placeholder="Enter asset name"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Entity</label>
                        <Input 
                          value={transaction.entity}
                          onChange={(e) => updateSellTransaction(index, 'entity', e.target.value)}
                          placeholder="Client, Trust, etc."
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 py-6">
            <Button 
              variant="outline"
              onClick={() => navigate(createPageUrl('SOARequestInsurance') + `?id=${soaRequest.id}`)}
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
    </SOARequestLayout>
  );
}