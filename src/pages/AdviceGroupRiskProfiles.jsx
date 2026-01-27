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
    cash: 0,
    au_fixed_interest: 0,
    int_fixed_interest: 0,
    property: 0,
    alternatives: 0,
    au_equities: 0,
    int_equities: 0
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
                  className={`bg-white border-2 rounded-lg overflow-hidden transition-all ${
                    isExpanded ? 'border-blue-400 shadow-lg' : 'border-slate-200'
                  }`}
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                    className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 text-left"
                  >
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ background: profileColors[profile.risk_level] || '#DBEAFE' }}
                    >
                      {profileIcons[profile.risk_level] || '💼'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">{profile.name}</h3>
                      <p className="text-sm text-slate-600">{profile.description}</p>
                    </div>
                    <div className="flex items-center gap-6 mr-2">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-800">{defensiveAlloc}%</div>
                        <div className="text-xs text-slate-500 uppercase">Defensive</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-800">{growthAlloc}%</div>
                        <div className="text-xs text-slate-500 uppercase">Growth</div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 p-6 bg-slate-50">
                      {/* Asset Allocation Table */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                            📊 Asset Allocation
                          </h4>
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            Target Total: {(Object.values(profile.allocation || {}).reduce((sum, val) => sum + (val || 0), 0))}%
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Asset Class</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">Target %</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">Min %</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">Max %</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-slate-100 hover:bg-white">
                                <td className="py-3 px-4"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#3B82F6'}}></span> Cash</span></td>
                                <td className="text-center py-3 px-4">{profile.allocation?.cash || 0}</td>
                                <td className="text-center py-3 px-4">0</td>
                                <td className="text-center py-3 px-4">50</td>
                              </tr>
                              <tr className="border-b border-slate-100 hover:bg-white">
                                <td className="py-3 px-4"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#10B981'}}></span> Australian Fixed Interest</span></td>
                                <td className="text-center py-3 px-4">{profile.allocation?.au_fixed_interest || 0}</td>
                                <td className="text-center py-3 px-4">0</td>
                                <td className="text-center py-3 px-4">50</td>
                              </tr>
                              <tr className="border-b border-slate-100 hover:bg-white">
                                <td className="py-3 px-4"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#06B6D4'}}></span> International Fixed Interest</span></td>
                                <td className="text-center py-3 px-4">{profile.allocation?.int_fixed_interest || 0}</td>
                                <td className="text-center py-3 px-4">0</td>
                                <td className="text-center py-3 px-4">30</td>
                              </tr>
                              <tr className="border-b border-slate-100 hover:bg-white">
                                <td className="py-3 px-4"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#8B5CF6'}}></span> Property</span></td>
                                <td className="text-center py-3 px-4">{profile.allocation?.property || 0}</td>
                                <td className="text-center py-3 px-4">0</td>
                                <td className="text-center py-3 px-4">20</td>
                              </tr>
                              <tr className="border-b border-slate-100 hover:bg-white">
                                <td className="py-3 px-4"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#EC4899'}}></span> Alternatives</span></td>
                                <td className="text-center py-3 px-4">{profile.allocation?.alternatives || 0}</td>
                                <td className="text-center py-3 px-4">0</td>
                                <td className="text-center py-3 px-4">15</td>
                              </tr>
                              <tr className="border-b border-slate-100 hover:bg-white">
                                <td className="py-3 px-4"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#F59E0B'}}></span> Australian Equity</span></td>
                                <td className="text-center py-3 px-4">{profile.allocation?.au_equities || 0}</td>
                                <td className="text-center py-3 px-4">0</td>
                                <td className="text-center py-3 px-4">40</td>
                              </tr>
                              <tr className="hover:bg-white">
                                <td className="py-3 px-4"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#EF4444'}}></span> International Equity</span></td>
                                <td className="text-center py-3 px-4">{profile.allocation?.int_equities || 0}</td>
                                <td className="text-center py-3 px-4">0</td>
                                <td className="text-center py-3 px-4">30</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-slate-200">
                        <Button size="sm" onClick={() => handleEdit(profile)} className="bg-blue-600 hover:bg-blue-700">
                          <Edit className="w-3.5 h-3.5 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(profile.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash className="w-3.5 h-3.5 mr-1.5" />
                          Delete
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProfile ? 'Edit' : 'Add'} Risk Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Profile Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Defensive, Conservative, Balanced"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Risk Level (1-7)</Label>
                <Input
                  type="number"
                  min="1"
                  max="7"
                  value={formData.risk_level}
                  onChange={(e) => setFormData({...formData, risk_level: Number(e.target.value)})}
                />
              </div>
              <div>
                <Label>Min Score</Label>
                <Input
                  type="number"
                  value={formData.min_score}
                  onChange={(e) => setFormData({...formData, min_score: Number(e.target.value)})}
                />
              </div>
              <div>
                <Label>Max Score</Label>
                <Input
                  type="number"
                  value={formData.max_score}
                  onChange={(e) => setFormData({...formData, max_score: Number(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <Label>Expected Return (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.expected_return}
                onChange={(e) => setFormData({...formData, expected_return: Number(e.target.value)})}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700">
                {editingProfile ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}