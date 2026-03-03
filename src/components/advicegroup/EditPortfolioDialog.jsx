import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const assetClasses = [
  'Cash',
  'Australian Fixed Interest',
  'International Fixed Interest',
  'Property',
  'Alternatives',
  'Australian Equity',
  'International Equity'
];

const assetClassColors = {
  Cash: '#3B82F6',
  'Australian Fixed Interest': '#06B6D4',
  'International Fixed Interest': '#10B981',
  Property: '#8B5CF6',
  Alternatives: '#EC4899',
  'Australian Equity': '#F59E0B',
  'International Equity': '#EF4444'
};

export default function EditPortfolioDialog({
  open,
  onOpenChange,
  portfolio,
  riskProfiles,
  assetClassColors: colorMap,
  onSave,
  onDelete
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    risk_profile_id: '',
    holdings: []
  });

  useEffect(() => {
    if (portfolio) {
      setFormData({
        name: portfolio.name || '',
        description: portfolio.description || '',
        risk_profile_id: portfolio.risk_profile_id || '',
        holdings: portfolio.holdings || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        risk_profile_id: '',
        holdings: []
      });
    }
  }, [portfolio, open]);

  const handleAddFund = () => {
    setFormData(prev => ({
      ...prev,
      holdings: [
        ...prev.holdings,
        { asset_name: '', asset_class: '', allocation_percentage: 0, platform: '' }
      ]
    }));
  };

  const handleUpdateHolding = (idx, field, value) => {
    const newHoldings = [...formData.holdings];
    newHoldings[idx] = {
      ...newHoldings[idx],
      [field]: field === 'allocation_percentage' ? Number(value) : value
    };
    setFormData(prev => ({
      ...prev,
      holdings: newHoldings
    }));
  };

  const handleRemoveHolding = (idx) => {
    setFormData(prev => ({
      ...prev,
      holdings: prev.holdings.filter((_, i) => i !== idx)
    }));
  };

  const getTotalAllocation = () => {
    return formData.holdings.reduce((sum, h) => sum + (h.allocation_percentage || 0), 0);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Portfolio name is required');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle>{portfolio ? 'Edit' : 'Add'} Model Portfolio</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-bold">Portfolio Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., PrimeSolve Balanced"
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-sm font-bold">Risk Profile</Label>
              <Select value={formData.risk_profile_id} onValueChange={(value) => setFormData({ ...formData, risk_profile_id: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select risk profile" />
                </SelectTrigger>
                <SelectContent>
                  {riskProfiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-bold">Description</Label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Equal blend of stability and growth"
              className="w-full mt-2 p-3 border border-slate-200 rounded-lg min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fund Holdings */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-bold mb-2">Fund Holdings</h3>
            <p className="text-xs text-slate-600 mb-4">Add funds and their target allocations. Total must equal 100%.</p>

            <div className="space-y-3 mb-4">
              {formData.holdings.map((holding, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg">
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '3px',
                      backgroundColor: assetClassColors[holding.asset_class] || '#94a3b8',
                      marginTop: '10px',
                      flexShrink: 0
                    }}
                  />
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <Input
                      value={holding.asset_name}
                      onChange={(e) => handleUpdateHolding(idx, 'asset_name', e.target.value)}
                      placeholder="Fund name"
                      size="sm"
                      className="text-sm"
                    />
                    <Select value={holding.asset_class} onValueChange={(value) => handleUpdateHolding(idx, 'asset_class', value)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Asset class" />
                      </SelectTrigger>
                      <SelectContent>
                        {assetClasses.map(ac => (
                          <SelectItem key={ac} value={ac}>
                            {ac}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={holding.allocation_percentage || 0}
                        onChange={(e) => handleUpdateHolding(idx, 'allocation_percentage', e.target.value)}
                        placeholder="%"
                        className="text-sm text-center"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveHolding(idx)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleAddFund}
              variant="outline"
              className="w-full mb-4 text-slate-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Fund
            </Button>

            {/* Total Allocation */}
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <span className="text-sm text-slate-600">
                Total: <span style={{ fontWeight: '700', color: getTotalAllocation() === 100 ? '#10b981' : '#ef4444' }}>
                  {getTotalAllocation()}%
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t">
          {portfolio && (
            <Button
              onClick={() => {
                onDelete(portfolio.id);
                onOpenChange(false);
              }}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              🗑️ Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Save Portfolio
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}