import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import { toast } from 'sonner';

export default function SOARequestAssumptions() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [assumptions, setAssumptions] = useState({
    inflation_rate: 2.5,
    investment_return_conservative: 4.5,
    investment_return_balanced: 6.0,
    investment_return_growth: 7.5,
    salary_growth: 3.0,
    longevity_age: 90,
    superannuation_preservation_age: 60,
    tax_rate: 30
  });
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
            setAssumptions(requests[0].assumptions || assumptions);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        assumptions
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <SOARequestLayout currentSection="assumptions" soaRequest={soaRequest}>
      {/* Dark Banner */}
      <div style={{ backgroundColor: '#1E293B', padding: '24px 32px', borderBottom: '1px solid #334155' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Assumptions</h1>
        <p style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: '1.5' }}>
          Define values, choices, longevity
        </p>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="w-full space-y-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-bold text-slate-800 mb-2">Financial Assumptions</h3>
              <p className="text-sm text-slate-700">
                Set the key financial assumptions used in calculations and projections throughout the SOA.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Economic Assumptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Inflation Rate (%)</label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={assumptions.inflation_rate}
                    onChange={(e) => setAssumptions({...assumptions, inflation_rate: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Salary Growth (%)</label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={assumptions.salary_growth}
                    onChange={(e) => setAssumptions({...assumptions, salary_growth: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Investment Returns (%)</CardTitle>
              <p className="text-sm text-slate-600">Expected annual returns by risk profile</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Conservative</label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={assumptions.investment_return_conservative}
                    onChange={(e) => setAssumptions({...assumptions, investment_return_conservative: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Balanced</label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={assumptions.investment_return_balanced}
                    onChange={(e) => setAssumptions({...assumptions, investment_return_balanced: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Growth</label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={assumptions.investment_return_growth}
                    onChange={(e) => setAssumptions({...assumptions, investment_return_growth: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Other Assumptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Longevity Age</label>
                  <Input 
                    type="number"
                    value={assumptions.longevity_age}
                    onChange={(e) => setAssumptions({...assumptions, longevity_age: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Preservation Age</label>
                  <Input 
                    type="number"
                    value={assumptions.superannuation_preservation_age}
                    onChange={(e) => setAssumptions({...assumptions, superannuation_preservation_age: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Tax Rate (%)</label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={assumptions.tax_rate}
                    onChange={(e) => setAssumptions({...assumptions, tax_rate: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 py-6">
            <Button 
              variant="outline"
              onClick={() => navigate(createPageUrl('SOARequestStrategy') + `?id=${soaRequest.id}`)}
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