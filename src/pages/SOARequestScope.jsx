import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import SOARequestHeader from '../components/soa/SOARequestHeader';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const adviceAreas = [
  { id: 'superannuation', label: 'Superannuation' },
  { id: 'investments', label: 'Investments' },
  { id: 'insurance_needs', label: 'Insurance - Needs Analysis' },
  { id: 'insurance_product_advice', label: 'Insurance - Product Advice' },
  { id: 'retirement_planning', label: 'Retirement Planning' },
  { id: 'estate_planning', label: 'Estate Planning' },
  { id: 'debt_management', label: 'Debt Management' },
  { id: 'portfolio_review', label: 'Portfolio Review' }
];

export default function SOARequestScope() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [soaType, setSOAType] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedAreas, setSelectedAreas] = useState({});
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
            const scope = requests[0].scope_of_advice || {};
            setSOAType(scope.soa_type || '');
            setNotes(scope.additional_notes || '');
            
            // Load selected areas
            const areas = {};
            adviceAreas.forEach(area => {
              areas[area.id] = scope[area.id] || false;
            });
            setSelectedAreas(areas);
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

  const handleToggleArea = (areaId) => {
    setSelectedAreas(prev => ({
      ...prev,
      [areaId]: !prev[areaId]
    }));
  };

  const handleSaveBeforeNav = async () => {
    if (!soaRequest?.id) return;
    
    try {
      const scopeData = {
        soa_type: soaType,
        additional_notes: notes,
        ...selectedAreas
      };
      
      await base44.entities.SOARequest.update(soaRequest.id, {
        scope_of_advice: scopeData
      });
    } catch (error) {
      console.error('Save failed:', error);
    }
    
    window.dispatchEvent(new Event('soa-save-complete'));
  };

  useEffect(() => {
    window.addEventListener('soa-save-before-nav', handleSaveBeforeNav);
    return () => window.removeEventListener('soa-save-before-nav', handleSaveBeforeNav);
  }, [soaRequest?.id, soaType, notes, selectedAreas]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const scopeData = {
        soa_type: soaType,
        additional_notes: notes,
        ...selectedAreas
      };
      
      await base44.entities.SOARequest.update(soaRequest.id, {
        scope_of_advice: scopeData
      });
      toast.success('Scope of advice saved');
      navigate(createPageUrl('SOARequestProducts') + `?id=${soaRequest.id}`);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SOARequestLayout currentSection="scope" soaRequest={soaRequest}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </SOARequestLayout>
    );
  }

  const selectedCount = Object.values(selectedAreas).filter(Boolean).length;

  return (
    <SOARequestLayout currentSection="scope" soaRequest={soaRequest}>
      <SOARequestHeader
        title="Scope of Advice"
        description="Define what areas the advice covers"
      />

      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* SOA Type */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Advice Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">SOA Type</label>
                <Select value={soaType} onValueChange={setSOAType}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                    <SelectItem value="scaled">Scaled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Advice Areas */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">Areas of Advice</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">Select which areas of advice are in scope</p>
                </div>
                <span className="text-sm font-medium text-blue-600">{selectedCount} selected</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {adviceAreas.map((area) => (
                  <label
                    key={area.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${selectedAreas[area.id]
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                      }
                    `}
                  >
                    <Checkbox
                      checked={selectedAreas[area.id] || false}
                      onCheckedChange={() => handleToggleArea(area.id)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <span className={`text-sm font-medium ${selectedAreas[area.id] ? 'text-blue-900' : 'text-slate-700'}`}>
                      {area.label}
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about the scope..."
                rows={4}
                className="border-slate-300"
              />
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl('SOARequestWelcome') + `?id=${soaRequest.id}`)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={saving || !soaType}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save & Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SOARequestLayout>
  );
}