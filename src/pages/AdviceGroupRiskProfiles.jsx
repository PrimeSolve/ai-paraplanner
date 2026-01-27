import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, User, HelpCircle, LogOut, ChevronDown, AlertCircle, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import AdviceGroupSidebar from '../components/advicegroup/AdviceGroupSidebar';
import AdviceGroupHeader from '../components/advicegroup/AdviceGroupHeader';

export default function AdviceGroupRiskProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const defaultAllocation = {
    cash: { target: 0, min: 20, max: 50 },
    au_fixed_interest: { target: 0, min: 25, max: 45 },
    int_fixed_interest: { target: 0, min: 10, max: 30 },
    property: { target: 0, min: 0, max: 10 },
    alternatives: { target: 0, min: 0, max: 5 },
    au_equities: { target: 0, min: 0, max: 20 },
    int_equities: { target: 0, min: 0, max: 15 }
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    risk_level: 1,
    min_score: 0,
    max_score: 10,
    allocation: defaultAllocation,
    expected_return: 0,
    timeframe: '',
    volatility_tolerance: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.advice_group_id) {
        const data = await base44.entities.RiskProfile.filter({
          advice_group_id: currentUser.advice_group_id
        }, 'risk_level');
        setProfiles(data);
      }
    } catch (error) {
      console.error('Failed to load risk profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingProfile) {
        await base44.entities.RiskProfile.update(editingProfile.id, {
          ...formData,
          advice_group_id: user.advice_group_id
        });
        toast.success('Risk profile updated');
      } else {
        await base44.entities.RiskProfile.create({
          ...formData,
          advice_group_id: user.advice_group_id
        });
        toast.success('Risk profile created');
      }
      setShowDialog(false);
      setEditingProfile(null);
      setFormData({
        name: '',
        description: '',
        risk_level: 1,
        min_score: 0,
        max_score: 10,
        allocation: defaultAllocation,
        expected_return: 0,
        timeframe: '',
        volatility_tolerance: ''
      });
      loadData();
    } catch (error) {
      toast.error('Failed to save risk profile');
    }
  };

  const handleEdit = (profile) => {
    setEditingProfile(profile);
    setFormData(profile);
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this risk profile?')) {
      try {
        await base44.entities.RiskProfile.delete(id);
        toast.success('Risk profile deleted');
        loadData();
      } catch (error) {
        toast.error('Failed to delete risk profile');
      }
    }
  };

  const assetClasses = [
    { name: 'Cash', color: '#3B82F6' },
    { name: 'Australian Fixed Interest', color: '#10B981' },
    { name: 'International Fixed Interest', color: '#06B6D4' },
    { name: 'Property', color: '#8B5CF6' },
    { name: 'Alternatives', color: '#EC4899' },
    { name: 'Australian Equity', color: '#F59E0B' },
    { name: 'International Equity', color: '#EF4444' }
  ];

  const profileIcons = {
    1: '🛡️',
    2: '🌱',
    3: '⚖️',
    4: '📈',
    5: '🚀'
  };

  const profileColors = {
    1: '#DBEAFE',
    2: '#D1FAE5',
    3: '#FEF3C7',
    4: '#FED7AA',
    5: '#FECACA'
  };

  return (
    <div className="flex">
      <AdviceGroupSidebar currentPage="risk-profiles" />

      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AdviceGroupHeader user={user} />

        <div className="p-8 flex-1">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-0.5">Asset Allocation Guidelines</h4>
              <p className="text-sm text-blue-700">
                Define target, minimum, and maximum allocations for each asset class. Target allocations must total 100%. Min/max ranges enable flexibility while maintaining investment policy compliance.
              </p>
            </div>
          </div>

          {/* Header with Add Button */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Risk Profiles</h1>
              <p className="text-sm text-slate-600 mt-1">{profiles.length} profiles configured</p>
            </div>
            <Button onClick={() => { setEditingProfile(null); setFormData({ name: '', description: '', risk_level: 1, min_score: 0, max_score: 10, allocation: defaultAllocation, expected_return: 0, timeframe: '', volatility_tolerance: '' }); setShowDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Profile
            </Button>
          </div>

          {/* Risk Profiles List */}
          <div className="space-y-3">
            {profiles.map((profile) => {
              const isExpanded = expandedId === profile.id;
              const defensiveAlloc = (profile.allocation?.cash || 0) + (profile.allocation?.au_fixed_interest || 0) + (profile.allocation?.int_fixed_interest || 0);
              const growthAlloc = (profile.allocation?.au_equities || 0) + (profile.allocation?.int_equities || 0) + (profile.allocation?.alternatives || 0);
              
              return (
                <div
                  key={profile.id}
                  className={`bg-white border-2 rounded-2xl overflow-hidden transition-all ${
                    isExpanded ? 'border-blue-500 shadow-lg' : 'border-blue-200'
                  }`}
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                    className="w-full p-6 flex items-center gap-4 hover:bg-blue-50 text-left"
                  >
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ background: profileColors[profile.risk_level] || '#DBEAFE' }}
                    >
                      {profileIcons[profile.risk_level] || '💼'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-slate-900">{profile.name}</h3>
                      <p className="text-sm text-slate-600">{profile.description}</p>
                    </div>
                    <div className="flex items-center gap-8 flex-shrink-0 mr-3">
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-800">{defensiveAlloc}%</div>
                        <div className="text-xs font-semibold text-blue-600 uppercase">Defensive</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-800">{growthAlloc}%</div>
                        <div className="text-xs font-semibold text-orange-600 uppercase">Growth</div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-6 h-6 text-slate-400 transition-transform flex-shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-blue-200 p-6 bg-white">
                      {/* Asset Allocation Section */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            📊 Asset Allocation
                          </h4>
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                            Target Total: 100%
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-300">
                                <th className="text-left py-3 px-4 font-bold text-slate-700 uppercase text-xs tracking-wide">Asset Class</th>
                                <th className="text-center py-3 px-4 font-bold text-slate-700 uppercase text-xs tracking-wide">Target %</th>
                                <th className="text-center py-3 px-4 font-bold text-slate-700 uppercase text-xs tracking-wide">Min %</th>
                                <th className="text-center py-3 px-4 font-bold text-slate-700 uppercase text-xs tracking-wide">Max %</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-slate-200">
                                <td className="py-3 px-4"><span className="inline-flex items-center gap-3"><span className="w-3 h-3 rounded-full" style={{background: '#3B82F6'}}></span> <span className="text-slate-900 font-medium">Cash</span></span></td>
                                <td className="text-center py-3 px-4 text-slate-800 font-semibold">{profile.allocation?.cash || 0}</td>
                                <td className="text-center py-3 px-4 text-slate-600">20</td>
                                <td className="text-center py-3 px-4 text-slate-600">50</td>
                              </tr>
                              <tr className="border-b border-slate-200">
                                <td className="py-3 px-4"><span className="inline-flex items-center gap-3"><span className="w-3 h-3 rounded-full" style={{background: '#10B981'}}></span> <span className="text-slate-900 font-medium">Australian Fixed Interest</span></span></td>
                                <td className="text-center py-3 px-4 text-slate-800 font-semibold">{profile.allocation?.au_fixed_interest || 0}</td>
                                <td className="text-center py-3 px-4 text-slate-600">25</td>
                                <td className="text-center py-3 px-4 text-slate-600">45</td>
                              </tr>
                              <tr className="border-b border-slate-200">
                                <td className="py-3 px-4"><span className="inline-flex items-center gap-3"><span className="w-3 h-3 rounded-full" style={{background: '#06B6D4'}}></span> <span className="text-slate-900 font-medium">International Fixed Interest</span></span></td>
                                <td className="text-center py-3 px-4 text-slate-800 font-semibold">{profile.allocation?.int_fixed_interest || 0}</td>
                                <td className="text-center py-3 px-4 text-slate-600">10</td>
                                <td className="text-center py-3 px-4 text-slate-600">30</td>
                              </tr>
                              <tr className="border-b border-slate-200">
                                <td className="py-3 px-4"><span className="inline-flex items-center gap-3"><span className="w-3 h-3 rounded-full" style={{background: '#8B5CF6'}}></span> <span className="text-slate-900 font-medium">Property</span></span></td>
                                <td className="text-center py-3 px-4 text-slate-800 font-semibold">{profile.allocation?.property || 0}</td>
                                <td className="text-center py-3 px-4 text-slate-600">0</td>
                                <td className="text-center py-3 px-4 text-slate-600">10</td>
                              </tr>
                              <tr className="border-b border-slate-200">
                                <td className="py-3 px-4"><span className="inline-flex items-center gap-3"><span className="w-3 h-3 rounded-full" style={{background: '#EC4899'}}></span> <span className="text-slate-900 font-medium">Alternatives</span></span></td>
                                <td className="text-center py-3 px-4 text-slate-800 font-semibold">{profile.allocation?.alternatives || 0}</td>
                                <td className="text-center py-3 px-4 text-slate-600">0</td>
                                <td className="text-center py-3 px-4 text-slate-600">5</td>
                              </tr>
                              <tr className="border-b border-slate-200">
                                <td className="py-3 px-4"><span className="inline-flex items-center gap-3"><span className="w-3 h-3 rounded-full" style={{background: '#F59E0B'}}></span> <span className="text-slate-900 font-medium">Australian Equity</span></span></td>
                                <td className="text-center py-3 px-4 text-slate-800 font-semibold">{profile.allocation?.au_equities || 0}</td>
                                <td className="text-center py-3 px-4 text-slate-600">0</td>
                                <td className="text-center py-3 px-4 text-slate-600">20</td>
                              </tr>
                              <tr>
                                <td className="py-3 px-4"><span className="inline-flex items-center gap-3"><span className="w-3 h-3 rounded-full" style={{background: '#EF4444'}}></span> <span className="text-slate-900 font-medium">International Equity</span></span></td>
                                <td className="text-center py-3 px-4 text-slate-800 font-semibold">{profile.allocation?.int_equities || 0}</td>
                                <td className="text-center py-3 px-4 text-slate-600">0</td>
                                <td className="text-center py-3 px-4 text-slate-600">15</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t border-slate-200 justify-between">
                        <Button
                          size="sm"
                          onClick={() => handleDelete(profile.id)}
                          className="text-red-600 hover:bg-red-50 border border-red-200"
                          variant="outline"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Delete Profile
                        </Button>
                        <Button size="sm" onClick={() => handleEdit(profile)} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Edit className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="border-b pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-900">{editingProfile ? 'Edit' : 'Add'} Risk Profile</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-bold text-slate-900">Profile Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Defensive, Conservative, Balanced"
                className="mt-2 h-10"
              />
            </div>

            <div>
              <Label className="text-sm font-bold text-slate-900">Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-2 h-10"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-bold text-slate-900">Risk Level (1-7)</Label>
                <Input
                  type="number"
                  min="1"
                  max="7"
                  value={formData.risk_level}
                  onChange={(e) => setFormData({...formData, risk_level: Number(e.target.value)})}
                  className="mt-2 h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-bold text-slate-900">Min Score</Label>
                <Input
                  type="number"
                  value={formData.min_score}
                  onChange={(e) => setFormData({...formData, min_score: Number(e.target.value)})}
                  className="mt-2 h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-bold text-slate-900">Max Score</Label>
                <Input
                  type="number"
                  value={formData.max_score}
                  onChange={(e) => setFormData({...formData, max_score: Number(e.target.value)})}
                  className="mt-2 h-10"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-bold text-slate-900">Expected Return (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.expected_return}
                onChange={(e) => setFormData({...formData, expected_return: Number(e.target.value)})}
                className="mt-2 h-10"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Asset Allocation</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="text-left py-2 px-3 font-bold text-slate-700">ASSET CLASS</th>
                      <th className="text-center py-2 px-3 font-bold text-slate-700">TARGET %</th>
                      <th className="text-center py-2 px-3 font-bold text-slate-700">MIN %</th>
                      <th className="text-center py-2 px-3 font-bold text-slate-700">MAX %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                       <td className="py-3 px-3"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#3B82F6'}}></span>Cash</span></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.allocation?.cash || 0} onChange={(e) => setFormData({...formData, allocation: {...formData.allocation, cash: Number(e.target.value)}})} className="h-8 text-center" /></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.min_max?.cash?.min || 0} onChange={(e) => setFormData({...formData, min_max: {...formData.min_max, cash: {...formData.min_max.cash, min: Number(e.target.value)}}})} className="h-8 text-center" /></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.min_max?.cash?.max || 0} onChange={(e) => setFormData({...formData, min_max: {...formData.min_max, cash: {...formData.min_max.cash, max: Number(e.target.value)}}})} className="h-8 text-center" /></td>
                     </tr>
                     <tr className="border-b border-slate-200">
                       <td className="py-3 px-3"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#10B981'}}></span>Australian Fixed Interest</span></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.allocation?.au_fixed_interest || 0} onChange={(e) => setFormData({...formData, allocation: {...formData.allocation, au_fixed_interest: Number(e.target.value)}})} className="h-8 text-center" /></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.min_max?.au_fixed_interest?.min || 0} onChange={(e) => setFormData({...formData, min_max: {...formData.min_max, au_fixed_interest: {...formData.min_max.au_fixed_interest, min: Number(e.target.value)}}})} className="h-8 text-center" /></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.min_max?.au_fixed_interest?.max || 0} onChange={(e) => setFormData({...formData, min_max: {...formData.min_max, au_fixed_interest: {...formData.min_max.au_fixed_interest, max: Number(e.target.value)}}})} className="h-8 text-center" /></td>
                     </tr>
                     <tr className="border-b border-slate-200">
                       <td className="py-3 px-3"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#06B6D4'}}></span>International Fixed Interest</span></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.allocation?.int_fixed_interest || 0} onChange={(e) => setFormData({...formData, allocation: {...formData.allocation, int_fixed_interest: Number(e.target.value)}})} className="h-8 text-center" /></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.min_max?.int_fixed_interest?.min || 0} onChange={(e) => setFormData({...formData, min_max: {...formData.min_max, int_fixed_interest: {...formData.min_max.int_fixed_interest, min: Number(e.target.value)}}})} className="h-8 text-center" /></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.min_max?.int_fixed_interest?.max || 0} onChange={(e) => setFormData({...formData, min_max: {...formData.min_max, int_fixed_interest: {...formData.min_max.int_fixed_interest, max: Number(e.target.value)}}})} className="h-8 text-center" /></td>
                     </tr>
                     <tr className="border-b border-slate-200">
                       <td className="py-3 px-3"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#8B5CF6'}}></span>Property</span></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.allocation?.property || 0} onChange={(e) => setFormData({...formData, allocation: {...formData.allocation, property: Number(e.target.value)}})} className="h-8 text-center" /></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.min_max?.property?.min || 0} onChange={(e) => setFormData({...formData, min_max: {...formData.min_max, property: {...formData.min_max.property, min: Number(e.target.value)}}})} className="h-8 text-center" /></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.min_max?.property?.max || 0} onChange={(e) => setFormData({...formData, min_max: {...formData.min_max, property: {...formData.min_max.property, max: Number(e.target.value)}}})} className="h-8 text-center" /></td>
                     </tr>
                     <tr className="border-b border-slate-200">
                       <td className="py-3 px-3"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#EC4899'}}></span>Alternatives</span></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.allocation?.alternatives || 0} onChange={(e) => setFormData({...formData, allocation: {...formData.allocation, alternatives: Number(e.target.value)}})} className="h-8 text-center" /></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.min_max?.alternatives?.min || 0} onChange={(e) => setFormData({...formData, min_max: {...formData.min_max, alternatives: {...formData.min_max.alternatives, min: Number(e.target.value)}}})} className="h-8 text-center" /></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.min_max?.alternatives?.max || 0} onChange={(e) => setFormData({...formData, min_max: {...formData.min_max, alternatives: {...formData.min_max.alternatives, max: Number(e.target.value)}}})} className="h-8 text-center" /></td>
                     </tr>
                     <tr className="border-b border-slate-200">
                       <td className="py-3 px-3"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#F59E0B'}}></span>Australian Equity</span></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.allocation?.au_equities || 0} onChange={(e) => setFormData({...formData, allocation: {...formData.allocation, au_equities: Number(e.target.value)}})} className="h-8 text-center" /></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.min_max?.au_equities?.min || 0} onChange={(e) => setFormData({...formData, min_max: {...formData.min_max, au_equities: {...formData.min_max.au_equities, min: Number(e.target.value)}}})} className="h-8 text-center" /></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.min_max?.au_equities?.max || 0} onChange={(e) => setFormData({...formData, min_max: {...formData.min_max, au_equities: {...formData.min_max.au_equities, max: Number(e.target.value)}}})} className="h-8 text-center" /></td>
                     </tr>
                     <tr>
                       <td className="py-3 px-3"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#EF4444'}}></span>International Equity</span></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.allocation?.int_equities || 0} onChange={(e) => setFormData({...formData, allocation: {...formData.allocation, int_equities: Number(e.target.value)}})} className="h-8 text-center" /></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.min_max?.int_equities?.min || 0} onChange={(e) => setFormData({...formData, min_max: {...formData.min_max, int_equities: {...formData.min_max.int_equities, min: Number(e.target.value)}}})} className="h-8 text-center" /></td>
                       <td className="text-center py-3 px-3"><Input type="number" min="0" max="100" value={formData.min_max?.int_equities?.max || 0} onChange={(e) => setFormData({...formData, min_max: {...formData.min_max, int_equities: {...formData.min_max.int_equities, max: Number(e.target.value)}}})} className="h-8 text-center" /></td>
                     </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 justify-between pt-2 border-t">
              <Button variant="outline" onClick={() => handleDelete(editingProfile?.id)} className="text-red-600 hover:bg-red-50 border border-red-200">
                🗑️ Delete Profile
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                  💾 Save Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}