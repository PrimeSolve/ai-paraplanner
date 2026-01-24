import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import SOARequestHeader from '../components/soa/SOARequestHeader';
import { toast } from 'sonner';

export default function SOARequestStrategy() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [strategyNotes, setStrategyNotes] = useState('');
  const [cashflowModels, setCashflowModels] = useState('');
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
            const strategy = requests[0].strategy || {};
            setStrategyNotes(strategy.strategy_notes || '');
            setCashflowModels(strategy.cashflow_models || '');
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
        strategy: {
          strategy_notes: strategyNotes,
          cashflow_models: cashflowModels
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <SOARequestLayout currentSection="strategy" soaRequest={soaRequest}>
      <SOARequestHeader 
        title="Strategy"
        description="Optional section models to compare cashflow scenarios, as well as add strategy recommendations to your product strategy"
      />
      
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-bold text-slate-800 mb-2">Strategy Recommendations</h3>
              <p className="text-sm text-slate-700">
                This is an optional section to provide additional strategic guidance, cashflow modelling scenarios, or product strategy recommendations for the paraplanner to incorporate.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strategy Notes</CardTitle>
              <p className="text-sm text-slate-600">
                Provide strategic recommendations or considerations for the advice
              </p>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={strategyNotes}
                onChange={(e) => setStrategyNotes(e.target.value)}
                placeholder="Enter strategy recommendations, key considerations, or alternative scenarios to explore..."
                rows={8}
                className="text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cashflow Models</CardTitle>
              <p className="text-sm text-slate-600">
                Describe cashflow scenarios or modelling requirements
              </p>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={cashflowModels}
                onChange={(e) => setCashflowModels(e.target.value)}
                placeholder="Describe any cashflow scenarios you want modelled (e.g., retirement at 60 vs 65, pension vs lump sum strategies)..."
                rows={8}
                className="text-sm"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 py-6">
            <Button 
              variant="outline"
              onClick={() => navigate(createPageUrl('SOARequestPortfolio') + `?id=${soaRequest.id}`)}
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