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
import { toast } from 'sonner';

const adviceCategories = [
  {
    id: 'insurance',
    title: 'Insurance Requirements',
    description: 'Personal risk and business insurance scope',
    options: [
      { id: 'insurance_needs', label: 'Insurance needs analysis' },
      { id: 'insurance_product', label: 'Product advice' },
      { id: 'business_insurance', label: 'Business insurance' }
    ]
  },
  {
    id: 'products',
    title: 'Product Recommendations',
    description: 'Financial products to include in advice',
    options: [
      { id: 'superannuation', label: 'Superannuation' },
      { id: 'pension', label: 'Pension' },
      { id: 'wrap', label: 'Wrap / Mastrust' },
      { id: 'investment_bond', label: 'Investment bond' },
      { id: 'annuity', label: 'Annuity' },
      { id: 'sma', label: 'SMA' },
      { id: 'other_product', label: 'Other' }
    ]
  },
  {
    id: 'cashflow',
    title: 'Cashflow / Estate Planning',
    description: 'Budgeting, tax structures, and estate review',
    options: [
      { id: 'budgeting', label: 'Budgeting advice' },
      { id: 'tax_structures', label: 'Tax structures' },
      { id: 'estate_planning', label: 'Review estate planning' }
    ]
  },
  {
    id: 'retirement',
    title: 'Retirement Planning',
    description: 'Super contributions, SMSF, and pension options',
    options: [
      { id: 'super_contributions', label: 'Contributions' },
      { id: 'smsf', label: 'SMSF' },
      { id: 'lump_sum', label: 'Lump sum/access' },
      { id: 'pensions', label: 'Pensions' },
      { id: 'other_retirement', label: 'Other' }
    ],
    subCategories: [
      {
        id: 'pensions_sub',
        parentId: 'pensions',
        options: [
          { id: 'account_based', label: 'Account based pension' },
          { id: 'defined_benefit', label: 'Defined benefit' }
        ]
      }
    ]
  },
  {
    id: 'assets',
    title: 'Assets & Liabilities',
    description: 'Portfolio review and debt management',
    options: [
      { id: 'portfolio_review', label: 'Review existing portfolio/assets' },
      { id: 'new_products', label: 'New product recommendations' },
      { id: 'debt_review', label: 'Review existing debt levels' },
      { id: 'debt_products', label: 'Review debt products' },
      { id: 'repayment_strategy', label: 'Review repayment strategy' }
    ]
  }
];

export default function SOARequestScope() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [soaType, setSOAType] = useState('');
  const [description, setDescription] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({});
  const [reasons, setReasons] = useState({});
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
            setDescription(scope.description || '');
            setSelectedOptions(scope.selected_options || {});
            setReasons(scope.reasons || {});
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

  const handleToggleOption = (optionId) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        scope_of_advice: {
          soa_type: soaType,
          description,
          selected_options: selectedOptions,
          reasons
        }
      });
      toast.success('Scope of advice saved');
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

  const selectedCount = Object.values(selectedOptions).filter(Boolean).length;

  return (
    <SOARequestLayout currentSection="scope" soaRequest={soaRequest}>
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Info Banner */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-bold text-slate-800 mb-2">Scope of Advice</h3>
              <p className="text-sm text-slate-700">
                Define the scope and objectives of your advice requirements
              </p>
            </CardContent>
          </Card>
          {/* Advice Type */}
          <Card>
            <CardHeader>
              <CardTitle>Advice Type</CardTitle>
              <p className="text-sm text-slate-600">Select the type of advice document</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">SOA Type</label>
                <Select value={soaType} onValueChange={setSOAType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="record_of_advice">Record of advice</SelectItem>
                    <SelectItem value="limited_advice">Limited advice</SelectItem>
                    <SelectItem value="review_advice">Review advice</SelectItem>
                    <SelectItem value="statement_of_advice">Statement of advice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Brief description of scope and objectives</label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the scope and objectives..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Advice Categories */}
          {adviceCategories.map((category) => {
            const categorySelectedCount = category.options.filter(opt => selectedOptions[opt.id]).length;
            
            return (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{category.title}</CardTitle>
                      <p className="text-sm text-slate-600">{category.description}</p>
                    </div>
                    <div className="text-sm font-semibold text-blue-600">
                      {categorySelectedCount} selected
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.options.map((option) => (
                    <div key={option.id} className="flex items-center gap-3">
                      <Checkbox
                        id={option.id}
                        checked={selectedOptions[option.id] || false}
                        onCheckedChange={() => handleToggleOption(option.id)}
                      />
                      <label htmlFor={option.id} className="text-sm font-medium text-slate-700 cursor-pointer flex-1">
                        {option.label}
                      </label>
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Reason in/out of scope</label>
                    <Textarea
                      value={reasons[category.id] || ''}
                      onChange={(e) => setReasons(prev => ({ ...prev, [category.id]: e.target.value }))}
                      placeholder="Explain why these items are in or out of scope..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Save Button */}
          <div className="flex justify-end gap-3 py-6">
            <Button 
              variant="outline"
              onClick={() => navigate(createPageUrl('SOARequestPrefill') + `?id=${soaRequest.id}`)}
            >
              Back
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving || !soaType}
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