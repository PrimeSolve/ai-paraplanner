import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';

export default function PortfolioCard({
  portfolio,
  riskProfiles,
  portfolioIcons,
  portfolioColors,
  assetClassColors,
  assetClassShortNames,
  onEdit,
  onDelete
}) {
  const getRiskProfileName = (profileId) => {
    const profile = riskProfiles.find(p => p.id === profileId);
    return profile?.name || 'N/A';
  };

  const getHoldingsSummary = () => {
    if (!portfolio.holdings || portfolio.holdings.length === 0) {
      return 'No holdings';
    }
    return `${portfolio.holdings.length} holdings`;
  };

  const getTotalAllocation = () => {
    if (!portfolio.holdings) return 0;
    return portfolio.holdings.reduce((sum, h) => sum + (h.allocation_percentage || 0), 0);
  };

  const getAllocationBar = () => {
    if (!portfolio.holdings || portfolio.holdings.length === 0) return null;

    return (
      <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '12px', gap: '0px' }}>
        {portfolio.holdings.map((holding, idx) => (
          <div
            key={idx}
            style={{
              height: '100%',
              flex: holding.allocation_percentage || 0,
              backgroundColor: assetClassColors[holding.asset_class] || '#94a3b8',
              minWidth: holding.allocation_percentage > 0 ? '2px' : '0px'
            }}
          />
        ))}
      </div>
    );
  };

  const getAllocationLegend = () => {
    if (!portfolio.holdings || portfolio.holdings.length === 0) return null;

    const assetClasses = [...new Set(portfolio.holdings.map(h => h.asset_class))];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        {assetClasses.map(assetClass => {
          const allocation = portfolio.holdings
            .filter(h => h.asset_class === assetClass)
            .reduce((sum, h) => sum + (h.allocation_percentage || 0), 0);

          return (
            <div
              key={assetClass}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '2px',
                  backgroundColor: assetClassColors[assetClass] || '#94a3b8'
                }}
              />
              <span>
                {assetClassShortNames[assetClass] || assetClass} {allocation}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        transition: 'all 0.2s ease'
      }}
      className="hover:shadow-lg"
    >
      {/* Header with Icon and Title */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            flexShrink: 0,
            backgroundColor: portfolioColors[portfolio.name] || '#DBEAFE'
          }}
        >
          {portfolioIcons[portfolio.name] || '💼'}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            {portfolio.name}
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.4' }}>
            {portfolio.description}
          </p>
        </div>
      </div>

      {/* Meta Information */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {portfolio.risk_profile_id && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6'
            }}
          >
            <span>●</span>
            {getRiskProfileName(portfolio.risk_profile_id)}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
          📋 {getHoldingsSummary()}
        </div>
      </div>

      {/* Allocation Bar */}
      {getAllocationBar()}

      {/* Allocation Legend */}
      {getAllocationLegend()}

      {/* Total Allocation Info */}
      {portfolio.holdings && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Total: <span style={{ fontWeight: '700', color: getTotalAllocation() === 100 ? '#10b981' : '#ef4444' }}>
              {getTotalAllocation()}%
            </span>
          </span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-slate-600"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
        <Button
          onClick={() => onEdit(portfolio)}
          size="sm"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button
          onClick={() => onDelete(portfolio.id)}
          variant="outline"
          size="sm"
          className="px-3 border-red-200 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}