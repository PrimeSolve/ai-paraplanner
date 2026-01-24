import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import SOARequestHeader from '../components/soa/SOARequestHeader';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { toast } from 'sonner';

export default function SOARequestInsurance() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [needsAnalysis, setNeedsAnalysis] = useState({});
  const [recommendations, setRecommendations] = useState([]);
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
            const insurance = requests[0].insurance || {};
            setNeedsAnalysis(insurance.needs_analysis || {});
            setRecommendations(insurance.recommendations || []);
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

  const addRecommendation = () => {
    setRecommendations([...recommendations, {
      policy_type: '',
      provider: '',
      sum_insured: '',
      premium: '',
      beneficiary: '',
      notes: ''
    }]);
  };

  const removeRecommendation = (index) => {
    setRecommendations(recommendations.filter((_, i) => i !== index));
  };

  const updateRecommendation = (index, field, value) => {
    const updated = [...recommendations];
    updated[index][field] = value;
    setRecommendations(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        insurance: {
          needs_analysis: needsAnalysis,
          recommendations
        }
      });
      toast.success('Insurance details saved');
      navigate(createPageUrl('SOARequestTransactions') + `?id=${soaRequest.id}`);
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
    <SOARequestLayout currentSection="insurance" soaRequest={soaRequest}>
      <SOARequestHeader 
        title="Insurance"
        description="Use the calculators to build insurance needs and define recommendations"
      />
      
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="w-full space-y-6">
          <Tabs defaultValue="needs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="needs">Needs Analysis</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="needs" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Insurance Needs Calculator
                  </CardTitle>
                  <p className="text-sm text-slate-600">Calculate insurance requirements based on client circumstances</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">Life Insurance Need</label>
                      <Input 
                        type="number"
                        value={needsAnalysis.life_insurance || ''}
                        onChange={(e) => setNeedsAnalysis({...needsAnalysis, life_insurance: e.target.value})}
                        placeholder="$0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">TPD Insurance Need</label>
                      <Input 
                        type="number"
                        value={needsAnalysis.tpd_insurance || ''}
                        onChange={(e) => setNeedsAnalysis({...needsAnalysis, tpd_insurance: e.target.value})}
                        placeholder="$0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">Income Protection (Monthly)</label>
                      <Input 
                        type="number"
                        value={needsAnalysis.income_protection || ''}
                        onChange={(e) => setNeedsAnalysis({...needsAnalysis, income_protection: e.target.value})}
                        placeholder="$0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">Trauma Insurance Need</label>
                      <Input 
                        type="number"
                        value={needsAnalysis.trauma_insurance || ''}
                        onChange={(e) => setNeedsAnalysis({...needsAnalysis, trauma_insurance: e.target.value})}
                        placeholder="$0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Calculation Notes</label>
                    <Textarea 
                      value={needsAnalysis.calculation_notes || ''}
                      onChange={(e) => setNeedsAnalysis({...needsAnalysis, calculation_notes: e.target.value})}
                      placeholder="Explain calculation methodology and assumptions..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Insurance Recommendations</CardTitle>
                    <Button onClick={addRecommendation} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Policy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendations.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No recommendations added yet</p>
                  ) : (
                    recommendations.map((policy, index) => (
                      <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-slate-700">Policy #{index + 1}</h4>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeRecommendation(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Policy Type</label>
                            <Select value={policy.policy_type} onValueChange={(v) => updateRecommendation(index, 'policy_type', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="life">Life Insurance</SelectItem>
                                <SelectItem value="tpd">TPD</SelectItem>
                                <SelectItem value="income_protection">Income Protection</SelectItem>
                                <SelectItem value="trauma">Trauma</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Provider</label>
                            <Input 
                              value={policy.provider}
                              onChange={(e) => updateRecommendation(index, 'provider', e.target.value)}
                              placeholder="Insurance provider"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Sum Insured ($)</label>
                            <Input 
                              type="number"
                              value={policy.sum_insured}
                              onChange={(e) => updateRecommendation(index, 'sum_insured', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Annual Premium ($)</label>
                            <Input 
                              type="number"
                              value={policy.premium}
                              onChange={(e) => updateRecommendation(index, 'premium', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Beneficiary</label>
                            <Input 
                              value={policy.beneficiary}
                              onChange={(e) => updateRecommendation(index, 'beneficiary', e.target.value)}
                              placeholder="Beneficiary name"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Policy Notes</label>
                            <Textarea 
                              value={policy.notes}
                              onChange={(e) => updateRecommendation(index, 'notes', e.target.value)}
                              placeholder="Additional policy details..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 py-6">
            <Button 
              variant="outline"
              onClick={() => navigate(createPageUrl('SOARequestProducts') + `?id=${soaRequest.id}`)}
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