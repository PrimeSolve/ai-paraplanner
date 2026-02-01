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
            {portfolios.map((portfolio, portfolioIndex) => {
              const totalAllocation = getTotalAllocation(portfolio);
              const isValid = Math.abs(totalAllocation - 100) < 0.01;

              return (
                <Card key={portfolioIndex} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', marginBottom: '24px' }}>
                  <CardHeader style={{ padding: '24px', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <Input 
                          value={portfolio.product_name}
                          onChange={(e) => updatePortfolioName(portfolioIndex, e.target.value)}
                          placeholder="e.g. HUB24 Growth Portfolio"
                          style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: '14px', color: '#1E293B', fontWeight: 500 }}
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removePortfolio(portfolioIndex)}
                        style={{ color: '#EF4444', marginLeft: '12px' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: isValid ? '#10B981' : '#EF4444' }}>
                      Total: {totalAllocation.toFixed(1)}% {isValid ? '✓' : '(must equal 100%)'}
                    </div>
                  </CardHeader>
                  <CardContent style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {portfolio.asset_allocation.map((asset, assetIndex) => (
                      <div key={assetIndex} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', width: '200px', flexShrink: 0 }}>
                          {asset.asset_class}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          <Input 
                            type="number"
                            value={asset.allocation}
                            onChange={(e) => updateAllocation(portfolioIndex, assetIndex, e.target.value)}
                            placeholder="0"
                            min="0"
                            max="100"
                            step="0.1"
                            style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: '14px', color: '#1E293B', width: '100px', textAlign: 'right' }}
                          />
                          <span style={{ fontSize: '14px', color: '#64748B', minWidth: '20px' }}>%</span>
                          <div style={{ flex: 1, backgroundColor: '#E2E8F0', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                            <div style={{ backgroundColor: '#7C3AED', height: '100%', width: `${Math.min(asset.allocation, 100)}%`, transition: 'width 0.2s ease' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '24px', borderTop: '1px solid #E2E8F0', marginTop: '24px' }}>
              <Button 
                variant="outline"
                onClick={() => navigate(createPageUrl('SOARequestTransactions') + `?id=${soaRequest.id}`)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#1E293B', fontSize: '14px', fontWeight: '500' }}
              >
                ◀ Back
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#7C3AED', color: '#FFFFFF', fontSize: '14px', fontWeight: '600' }}
              >
                {saving ? 'Saving...' : 'Save & Next ▶'}
              </Button>
            </div>
            </>
            )}
            </div>
            </div>
            </div>
    </SOARequestLayout>
  );
}