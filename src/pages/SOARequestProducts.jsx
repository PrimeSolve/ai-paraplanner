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
import { Checkbox } from '@/components/ui/checkbox';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SOARequestProducts() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [factFind, setFactFind] = useState(null);
  const [products, setProducts] = useState([]);
  const [entities, setEntities] = useState([]);
  const [principals, setPrincipals] = useState([]);
  const [dependants, setDependants] = useState([]);
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
            const productsEntities = requests[0].products_entities || {};
            setProducts(productsEntities.products || []);
            setEntities(productsEntities.entities || []);

            // Load fact find data for principals and dependants
            if (requests[0].fact_find_id) {
              const factFinds = await base44.entities.FactFind.filter({ id: requests[0].fact_find_id });
              if (factFinds[0]) {
                setFactFind(factFinds[0]);
                const personal = factFinds[0].personal || {};
                setPrincipals([
                  { id: 'principal_1', name: `${personal.first_name || ''} ${personal.last_name || ''}`.trim() || 'Principal 1' }
                ]);
                setDependants((factFinds[0].dependants?.dependants_list || []).map((d, i) => ({
                  id: `dependant_${i}`,
                  name: d.name || `Dependant ${i + 1}`
                })));
              }
            }
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

  const addProduct = () => {
    setProducts([...products, { 
      product_type: '', 
      provider: '', 
      description: '',
      owner_id: '',
      // Pension fields
      pension_type: '',
      // Annuity fields
      annuity_tax_env: '',
      annuity_joint: '',
      annuity_lifetime: false,
      annuity_term: '',
      annuity_purchase_price: '',
      annuity_purchase_date: '',
      annuity_income: '',
      annuity_index_rate: '',
      annuity_residual_value: '',
      annuity_deductible_income: ''
    }]);
  };

  const addEntity = () => {
    setEntities([...entities, { 
      entity_type: '', 
      entity_name: '', 
      holders: [],
      abn_acn: '',
      notes: ''
    }]);
  };

  const removeProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const removeEntity = (index) => {
    setEntities(entities.filter((_, i) => i !== index));
  };

  const updateProduct = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const updateEntity = (index, field, value) => {
    const updated = [...entities];
    updated[index][field] = value;
    setEntities(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        products_entities: {
          products,
          entities
        }
      });
      toast.success('Products & entities saved');
      navigate(createPageUrl('SOARequestInsurance') + `?id=${soaRequest.id}`);
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

  const availableHolders = [
    ...principals,
    ...dependants,
    ...entities.map((e, i) => ({ id: `entity_${i}`, name: e.entity_name || '(Unnamed entity)' }))
  ];

  const availableOwners = [
    ...principals,
    ...entities.map((e, i) => ({ id: `entity_${i}`, name: e.entity_name || '(Unnamed entity)' }))
  ];

  return (
    <SOARequestLayout currentSection="products" soaRequest={soaRequest}>
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="w-full space-y-6">
          {/* Info Banner */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-bold text-slate-800 mb-2">Products & Entities</h3>
              <p className="text-sm text-slate-700">
                Add the new products or entities you are recommending
              </p>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="entities" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="entities">Entities</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            <TabsContent value="entities">
              {/* Entities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Products</CardTitle>
                <Button onClick={addProduct} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
              <p className="text-sm text-slate-600">Superannuation accounts, investment platforms, insurance policies</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {products.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No products added yet</p>
              ) : (
                products.map((product, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-700">Product #{index + 1}</h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeProduct(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Product Type</label>
                        <Select value={product.product_type} onValueChange={(v) => updateProduct(index, 'product_type', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="superannuation">Superannuation</SelectItem>
                            <SelectItem value="pension">Pension</SelectItem>
                            <SelectItem value="investment">Investment Platform</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Provider</label>
                        <Input 
                          value={product.provider}
                          onChange={(e) => updateProduct(index, 'provider', e.target.value)}
                          placeholder="e.g., AMP, Colonial First State"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Product Name</label>
                        <Input 
                          value={product.product_name}
                          onChange={(e) => updateProduct(index, 'product_name', e.target.value)}
                          placeholder="Enter product name"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Owner</label>
                        <Input 
                          value={product.owner}
                          onChange={(e) => updateProduct(index, 'owner', e.target.value)}
                          placeholder="Client name or entity"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Initial Investment ($)</label>
                        <Input 
                          type="number"
                          value={product.initial_investment}
                          onChange={(e) => updateProduct(index, 'initial_investment', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Notes</label>
                        <Textarea 
                          value={product.notes}
                          onChange={(e) => updateProduct(index, 'notes', e.target.value)}
                          placeholder="Additional notes or requirements..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Entities</CardTitle>
                    <Button onClick={addEntity} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Entity
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600">Trusts, companies, SMSFs</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {entities.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No entities added yet</p>
                  ) : (
                    entities.map((entity, index) => (
                      <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-slate-700">Entity #{index + 1}</h4>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeEntity(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Entity Type</label>
                            <Select value={entity.entity_type} onValueChange={(v) => updateEntity(index, 'entity_type', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="discretionary_trust">Discretionary trust</SelectItem>
                                <SelectItem value="unit_trust">Unit trust</SelectItem>
                                <SelectItem value="company">Company</SelectItem>
                                <SelectItem value="smsf">SMSF</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Entity Name</label>
                            <Input 
                              value={entity.entity_name}
                              onChange={(e) => updateEntity(index, 'entity_name', e.target.value)}
                              placeholder="Enter entity name"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Shareholders / Beneficiaries</label>
                            <Select 
                              value={entity.holders?.[0] || ''} 
                              onValueChange={(v) => {
                                const current = entity.holders || [];
                                if (v && !current.includes(v)) {
                                  updateEntity(index, 'holders', [...current, v]);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select shareholders/beneficiaries..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableHolders.map(h => (
                                  <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {entity.holders && entity.holders.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {entity.holders.map(holderId => {
                                  const holder = availableHolders.find(h => h.id === holderId);
                                  return holder ? (
                                    <span key={holderId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                      {holder.name}
                                      <button
                                        onClick={() => updateEntity(index, 'holders', entity.holders.filter(id => id !== holderId))}
                                        className="hover:text-blue-900"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">ABN/ACN</label>
                            <Input 
                              value={entity.abn_acn}
                              onChange={(e) => updateEntity(index, 'abn_acn', e.target.value)}
                              placeholder="Enter ABN or ACN"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Notes</label>
                            <Textarea 
                              value={entity.notes}
                              onChange={(e) => updateEntity(index, 'notes', e.target.value)}
                              placeholder="Additional notes..."
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

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Products</CardTitle>
                    <Button onClick={addProduct} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600">Retirement products and investment platforms</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {products.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No products added yet</p>
                  ) : (
                    products.map((product, index) => (
                      <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-slate-700">Product #{index + 1}</h4>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeProduct(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Retirement product type</label>
                            <Select value={product.product_type} onValueChange={(v) => updateProduct(index, 'product_type', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="superannuation">Superannuation</SelectItem>
                                <SelectItem value="pension">Pension</SelectItem>
                                <SelectItem value="investment_bond">Investment bond</SelectItem>
                                <SelectItem value="wrap">Wrap</SelectItem>
                                <SelectItem value="annuity">Annuity</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Product provider</label>
                            <Input 
                              value={product.provider}
                              onChange={(e) => updateProduct(index, 'provider', e.target.value)}
                              placeholder="e.g., AMP, Colonial First State"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Description</label>
                            <Input 
                              value={product.description}
                              onChange={(e) => updateProduct(index, 'description', e.target.value)}
                              placeholder="Enter description"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Owner</label>
                            <Select value={product.owner_id} onValueChange={(v) => updateProduct(index, 'owner_id', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableOwners.map(o => (
                                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {product.product_type === 'pension' && (
                            <div>
                              <label className="text-xs font-semibold text-slate-600 mb-1 block">Type of pension</label>
                              <Select value={product.pension_type} onValueChange={(v) => updateProduct(index, 'pension_type', v)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="account_based">Account based</SelectItem>
                                  <SelectItem value="term_allocated">Term allocated</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {product.product_type === 'annuity' && (
                            <>
                              <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Annuity tax environment</label>
                                <Select value={product.annuity_tax_env} onValueChange={(v) => updateProduct(index, 'annuity_tax_env', v)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="superannuation">Superannuation</SelectItem>
                                    <SelectItem value="non_superannuation">Non-superannuation</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Joint</label>
                                <Input 
                                  value={product.annuity_joint}
                                  onChange={(e) => updateProduct(index, 'annuity_joint', e.target.value)}
                                  placeholder="e.g., Joint with spouse"
                                />
                              </div>
                              <div className="flex items-center gap-2 col-span-2">
                                <Checkbox
                                  id={`lifetime_${index}`}
                                  checked={product.annuity_lifetime || false}
                                  onCheckedChange={(checked) => updateProduct(index, 'annuity_lifetime', checked)}
                                />
                                <label htmlFor={`lifetime_${index}`} className="text-sm text-slate-600">
                                  Lifetime annuity
                                </label>
                              </div>
                              {!product.annuity_lifetime && (
                                <div>
                                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Term of annuity (years)</label>
                                  <Input 
                                    value={product.annuity_term}
                                    onChange={(e) => updateProduct(index, 'annuity_term', e.target.value)}
                                    placeholder="e.g., 10"
                                  />
                                </div>
                              )}
                              <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Purchase price</label>
                                <Input 
                                  type="number"
                                  value={product.annuity_purchase_price}
                                  onChange={(e) => updateProduct(index, 'annuity_purchase_price', e.target.value)}
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Purchase date</label>
                                <Input 
                                  value={product.annuity_purchase_date}
                                  onChange={(e) => updateProduct(index, 'annuity_purchase_date', e.target.value)}
                                  placeholder="dd-mm-yyyy"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Annuity income (per period)</label>
                                <Input 
                                  type="number"
                                  value={product.annuity_income}
                                  onChange={(e) => updateProduct(index, 'annuity_income', e.target.value)}
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Annuity index rate (%)</label>
                                <Input 
                                  value={product.annuity_index_rate}
                                  onChange={(e) => updateProduct(index, 'annuity_index_rate', e.target.value)}
                                  placeholder="e.g., 2.5"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Residual value</label>
                                <Input 
                                  type="number"
                                  value={product.annuity_residual_value}
                                  onChange={(e) => updateProduct(index, 'annuity_residual_value', e.target.value)}
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Deductible income</label>
                                <Input 
                                  type="number"
                                  value={product.annuity_deductible_income}
                                  onChange={(e) => updateProduct(index, 'annuity_deductible_income', e.target.value)}
                                  placeholder="0.00"
                                />
                              </div>
                            </>
                          )}
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
              onClick={() => navigate(createPageUrl('SOARequestScope') + `?id=${soaRequest.id}`)}
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