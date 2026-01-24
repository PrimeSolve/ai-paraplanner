import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import SOARequestHeader from '../components/soa/SOARequestHeader';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SOARequestProducts() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [products, setProducts] = useState([]);
  const [entities, setEntities] = useState([]);
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
      product_name: '', 
      owner: '', 
      initial_investment: '',
      notes: ''
    }]);
  };

  const addEntity = () => {
    setEntities([...entities, { 
      entity_type: '', 
      entity_name: '', 
      abn_acn: '',
      trustees: '',
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

  return (
    <SOARequestLayout currentSection="products" soaRequest={soaRequest}>
      <SOARequestHeader 
        title="Products & Entities"
        description="Add the new products or entities you are recommending"
      />
      
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="w-full space-y-6">
          {/* Products */}
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

          {/* Entities */}
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
                            <SelectItem value="trust">Trust</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                            <SelectItem value="smsf">SMSF</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
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
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">ABN/ACN</label>
                        <Input 
                          value={entity.abn_acn}
                          onChange={(e) => updateEntity(index, 'abn_acn', e.target.value)}
                          placeholder="Enter ABN or ACN"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Trustees/Directors</label>
                        <Input 
                          value={entity.trustees}
                          onChange={(e) => updateEntity(index, 'trustees', e.target.value)}
                          placeholder="Names of trustees or directors"
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