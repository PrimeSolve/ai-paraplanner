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
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      background: colors.core.offWhite,
    }}>
      <AdviceGroupSidebar currentPage="risk-profiles" />

      <div style={{
        marginLeft: '260px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header with User Profile */}
        <div style={{
          background: colors.core.white,
          padding: '4px 32px',
          borderBottom: `1px solid ${colors.core.greyLight}`,
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  background: colors.core.white,
                  border: `1px solid ${colors.core.greyLight}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}>
                  {user.profile_image_url ? (
                    <img src={user.profile_image_url} alt="Profile" style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                    }} />
                  ) : (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: `linear-gradient(135deg, ${colors.accent.purple}, ${colors.accent.blueDeep})`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.core.white,
                      fontSize: '12px',
                      fontWeight: 700,
                    }}>
                      {(user.display_name || user.full_name)?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span style={{ color: colors.core.navy }}>{user.display_name || user.full_name || user.email}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={{ width: '224px' }}>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('AdviceGroupMyProfile')} style={{ cursor: 'pointer' }}>
                    <User size={16} style={{ marginRight: '12px' }} />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle size={16} style={{ marginRight: '12px' }} />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => base44.auth.logout()}>
                  <LogOut size={16} style={{ marginRight: '12px' }} />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          padding: '32px',
        }}>
          {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {profiles.map((profile) => (
              <Card key={profile.id} className="hover:border-cyan-400 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-cyan-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{profile.name}</h3>
                        <p className="text-sm text-slate-600">{profile.description}</p>
                      </div>
                    </div>
                    <Badge>Risk {profile.risk_level}/7</Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Score Range</span>
                      <span className="font-medium">{profile.min_score} - {profile.max_score}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Expected Return</span>
                      <span className="font-medium">{profile.expected_return}% p.a.</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Timeframe</span>
                      <span className="font-medium">{profile.timeframe || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(profile)} className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(profile.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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