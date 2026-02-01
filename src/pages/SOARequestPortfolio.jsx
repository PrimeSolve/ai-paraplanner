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

export default function SOARequestPortfolio() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
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
            const portfolio = requests[0].portfolio || {};
            setPortfolios(portfolio.portfolios || []);
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

  const addPortfolio = () => {
    setPortfolios([...portfolios, {
      product_name: '',
      asset_allocation: [
        { asset_class: 'Cash', allocation: 0 },
        { asset_class: 'Australian Fixed Interest', allocation: 0 },
        { asset_class: 'International Fixed Interest', allocation: 0 },
        { asset_class: 'Australian Shares', allocation: 0 },
        { asset_class: 'International Shares', allocation: 0 },
        { asset_class: 'Property', allocation: 0 },
        { asset_class: 'Alternative Assets', allocation: 0 }
      ]
    }]);
  };

  const removePortfolio = (index) => {
    setPortfolios(portfolios.filter((_, i) => i !== index));
  };

  const updatePortfolioName = (index, name) => {
    const updated = [...portfolios];
    updated[index].product_name = name;
    setPortfolios(updated);
  };

  const updateAllocation = (portfolioIndex, assetIndex, value) => {
    const updated = [...portfolios];
    updated[portfolioIndex].asset_allocation[assetIndex].allocation = parseFloat(value) || 0;
    setPortfolios(updated);
  };

  const getTotalAllocation = (portfolio) => {
    return portfolio.asset_allocation.reduce((sum, asset) => sum + asset.allocation, 0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        portfolio: { portfolios }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <SOARequestLayout currentSection="portfolio" soaRequest={soaRequest}>
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="w-full">
          {/* Dark Banner */}
          <div style={{ backgroundColor: '#1E293B', padding: '24px 32px', borderRadius: '16px 16px 0 0' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
              Portfolio
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8', margin: 0 }}>
              Build portfolios for each product
            </p>
          </div>

          {/* White Content Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0 0 16px 16px', border: '1px solid #E2E8F0', borderTop: 'none', padding: '24px 32px' }}>
            {/* Info Card */}
            <Card style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', marginBottom: '24px' }}>
              <CardContent style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}>Portfolio Asset Allocation</h3>
                <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                  Define the asset allocation for each recommended product. Ensure total allocation equals 100%.
                </p>
              </CardContent>
            </Card>

            {portfolios.length === 0 ? (
              <Card style={{ border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                <CardContent style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '32px' }}>
                    📊
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', margin: '0 0 8px 0' }}>
                    Do you have any portfolios?
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748B', margin: '0 auto 20px', maxWidth: '320px' }}>
                    Build portfolios for each product
                  </p>
                  <button 
                    onClick={addPortfolio}
                    style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#14B8A6', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Add Portfolio
                  </button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', margin: 0 }}>Portfolios</h3>
                  <Button 
                    onClick={addPortfolio} 
                    size="sm" 
                    style={{ backgroundColor: '#14B8A6', color: '#FFFFFF' }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Portfolio
                  </Button>
                </div>
            portfolios.map((portfolio, portfolioIndex) => {
              const totalAllocation = getTotalAllocation(portfolio);
              const isValid = Math.abs(totalAllocation - 100) < 0.01;
              
              return (
                <Card key={portfolioIndex}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Input 
                          value={portfolio.product_name}
                          onChange={(e) => updatePortfolioName(portfolioIndex, e.target.value)}
                          placeholder="Enter product/portfolio name..."
                          className="font-semibold text-base"
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removePortfolio(portfolioIndex)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-3"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className={`text-sm font-semibold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                      Total: {totalAllocation.toFixed(1)}% {isValid ? '✓' : '(must equal 100%)'}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {portfolio.asset_allocation.map((asset, assetIndex) => (
                      <div key={assetIndex} className="flex items-center gap-3">
                        <label className="text-sm font-medium text-slate-700 w-64">
                          {asset.asset_class}
                        </label>
                        <div className="flex items-center gap-2 flex-1">
                          <Input 
                            type="number"
                            value={asset.allocation}
                            onChange={(e) => updateAllocation(portfolioIndex, assetIndex, e.target.value)}
                            placeholder="0"
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-24"
                          />
                          <span className="text-sm text-slate-600">%</span>
                          <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full transition-all"
                              style={{ width: `${Math.min(asset.allocation, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })
          )}

          <div className="flex justify-end gap-3 py-6">
            <Button 
              variant="outline"
              onClick={() => navigate(createPageUrl('SOARequestTransactions') + `?id=${soaRequest.id}`)}
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