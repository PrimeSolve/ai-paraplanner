import React, { useState, useEffect } from 'react';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import PortfolioCard from '../components/advicegroup/PortfolioCard';
import EditPortfolioDialog from '../components/advicegroup/EditPortfolioDialog';

export default function AdviceGroupModelPortfolios() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [riskProfiles, setRiskProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  const [filter, setFilter] = useState('all');

  const portfolioIcons = {
    Defensive: '🛡️',
    Conservative: '🌱',
    Balanced: '⚖️',
    Growth: '📈',
    'High Growth': '🚀'
  };

  const portfolioColors = {
    Defensive: '#DBEAFE',
    Conservative: '#D1FAE5',
    Balanced: '#FEF3C7',
    Growth: '#FED7AA',
    'High Growth': '#FECACA'
  };

  const assetClassColors = {
    Cash: '#3B82F6',
    'Australian Fixed Interest': '#06B6D4',
    'International Fixed Interest': '#10B981',
    Property: '#8B5CF6',
    Alternatives: '#EC4899',
    'Australian Equity': '#F59E0B',
    'International Equity': '#EF4444'
  };

  const assetClassShortNames = {
    'Cash': 'Cash',
    'Australian Fixed Interest': 'AU FI',
    'International Fixed Interest': 'INT FI',
    'Property': 'Property',
    'Alternatives': 'Alts',
    'Australian Equity': 'AU Equity',
    'International Equity': 'INT Equity'
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // API already filters by TenantId via RLS — no adviceGroupId param needed
      const [portfolioRes, riskProfileRes] = await Promise.all([
        axiosInstance.get('/model-portfolios'),
        axiosInstance.get('/risk-profiles')
      ]);
      setPortfolios(portfolioRes.data);
      setRiskProfiles(riskProfileRes.data);
    } catch (error) {
      console.error('Failed to load model portfolios:', error);
      toast.error('Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (portfolio) => {
    setEditingPortfolio(portfolio);
    setShowEditDialog(true);
  };

  const handleSavePortfolio = async (formData) => {
    try {
      const groupId = user?.advice_group_id;
      if (!groupId) {
        toast.error('No advice group found. Please contact support.');
        return;
      }

      const dataToSave = {
        ...formData,
        advice_group_id: groupId
      };

      if (editingPortfolio) {
        await axiosInstance.put(`/model-portfolios/${editingPortfolio.id}`, dataToSave);
        toast.success('Portfolio updated');
      } else {
        await axiosInstance.post('/model-portfolios', dataToSave);
        toast.success('Portfolio created');
      }

      setShowEditDialog(false);
      setEditingPortfolio(null);
      await loadData();
    } catch (error) {
      console.error('Save failed:', error.message || error);
      toast.error(error.message || 'Failed to save portfolio');
    }
  };

  const handleDeletePortfolio = async (id) => {
    if (confirm('Delete this portfolio?')) {
      try {
        await axiosInstance.delete(`/model-portfolios/${id}`);
        toast.success('Portfolio deleted');
        await loadData();
      } catch (error) {
        console.error('Delete failed:', error.message || error);
        toast.error(error.message || 'Failed to delete portfolio');
      }
    }
  };

  const filteredPortfolios = portfolios.filter(p => {
    if (filter === 'all') return true;
    return p.name?.toLowerCase().includes(filter.toLowerCase());
  });

  const totalAllocation = portfolios.reduce((sum, p) => sum + (p.holdings?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100">
          {portfolios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8">
              <div className="text-6xl mb-6">📊</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No Model Portfolios Yet</h2>
              <p className="text-center text-slate-600 max-w-md mb-8">
                Model portfolios define specific fund allocations for different investment strategies. Create your first portfolio to get started.
              </p>
              <Button
                onClick={() => {
                  setEditingPortfolio(null);
                  setShowEditDialog(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Portfolio
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Model Portfolios</h1>
                  <p className="text-sm text-slate-600 mt-1">{filteredPortfolios.length} portfolios configured</p>
                </div>
                <Button
                  onClick={() => {
                    setEditingPortfolio(null);
                    setShowEditDialog(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Portfolio
                </Button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 mb-6 flex-wrap">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-600'
                  }`}
                >
                  All Portfolios
                  <span className="ml-2 font-bold">{filteredPortfolios.length}</span>
                </button>
              </div>

              {/* Portfolio Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {filteredPortfolios.map(portfolio => (
                  <PortfolioCard
                    key={portfolio.id}
                    portfolio={portfolio}
                    riskProfiles={riskProfiles}
                    portfolioIcons={portfolioIcons}
                    portfolioColors={portfolioColors}
                    assetClassColors={assetClassColors}
                    assetClassShortNames={assetClassShortNames}
                    onEdit={handleEdit}
                    onDelete={handleDeletePortfolio}
                  />
                ))}
              </div>
            </>
          )}

          {showEditDialog && (
          <EditPortfolioDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          portfolio={editingPortfolio}
          riskProfiles={riskProfiles}
          assetClassColors={assetClassColors}
          onSave={handleSavePortfolio}
          onDelete={handleDeletePortfolio}
          />
          )}
          </div>
          );
          }