import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import { useSOAEntities } from '../components/soa/useSOAEntities';
import EntitySelect from '../components/factfind/EntitySelect';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SOARequestProducts() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [mainTab, setMainTab] = useState('entities');
  const [entityTab, setEntityTab] = useState('trust');
  const navigate = useNavigate();

  // Data state
  const [newTrusts, setNewTrusts] = useState([]);
  const [newCompanies, setNewCompanies] = useState([]);
  const [newSMSFs, setNewSMSFs] = useState([]);
  const [superProducts, setSuperProducts] = useState([]);
  const [pensionProducts, setPensionProducts] = useState([]);
  const [annuityProducts, setAnnuityProducts] = useState([]);
  const [wrapProducts, setWrapProducts] = useState([]);
  const [bondProducts, setBondProducts] = useState([]);

  // Active indices
  const [activeTrustIdx, setActiveTrustIdx] = useState(0);
  const [activeCompanyIdx, setActiveCompanyIdx] = useState(0);
  const [activeSMSFIdx, setActiveSMSFIdx] = useState(0);
  const [activeSuperIdx, setActiveSuperIdx] = useState(0);
  const [activePensionIdx, setActivePensionIdx] = useState(0);
  const [activeAnnuityIdx, setActiveAnnuityIdx] = useState(0);
  const [activeWrapIdx, setActiveWrapIdx] = useState(0);
  const [activeBondIdx, setActiveBondIdx] = useState(0);

  // Product sub-tab
  const [productTab, setProductTab] = useState('superannuation');

  // Entity dropdown
  const { entities, getByTypes } = useSOAEntities(soaRequest?.id);

  // Helper to build full entity list including new entities from this page
  const getFullEntityList = (excludeId = null) => {
    // Start with all FactFind entities
    let allEntities = [...entities];
    
    // Add new trusts from this page
    newTrusts.forEach((t, i) => {
      if (t.trust_name) {
        allEntities.push({
          id: `new_trust_${i}`,
          label: t.trust_name,
          type: 'trust',
          color: '#ef4444'
        });
      }
    });
    
    // Add new companies from this page
    newCompanies.forEach((c, i) => {
      if (c.company_name) {
        allEntities.push({
          id: `new_company_${i}`,
          label: c.company_name,
          type: 'company',
          color: '#f97316'
        });
      }
    });
    
    // Exclude current entity if specified
    if (excludeId) {
      allEntities = allEntities.filter(e => e.id !== excludeId);
    }
    
    console.log('getFullEntityList result:', allEntities);
    console.log('getFullEntityList count:', allEntities.length);
    console.log('getFullEntityList types:', allEntities.map(e => e.type));
    
    return allEntities;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (id) {
          const requests = await base44.entities.SOARequest.filter({ id });
          if (requests[0]) {
            setSOARequest(requests[0]);
            const pe = requests[0].products_entities || {};
            
            setNewTrusts(pe.new_trusts || []);
            setNewCompanies(pe.new_companies || []);
            setNewSMSFs(pe.new_smsf || []);
            
            // Load products per-type
            const prods = pe.products || {};
            setSuperProducts(prods.superannuation || []);
            setPensionProducts(prods.pension || []);
            setAnnuityProducts(prods.annuity || []);
            setWrapProducts(prods.wrap || []);
            setBondProducts(prods.investment_bond || []);
            
            // Restore UI state
            setMainTab(pe.currentMainTab || 'entities');
            setEntityTab(pe.currentEntityTab || 'trust');
            setProductTab(pe.currentProductTab || 'superannuation');
            const activeIdx = pe.activeIndex || {};
            setActiveTrustIdx(activeIdx.trust || 0);
            setActiveCompanyIdx(activeIdx.company || 0);
            setActiveSMSFIdx(activeIdx.smsf || 0);
            setActiveSuperIdx(activeIdx.super || 0);
            setActivePensionIdx(activeIdx.pension || 0);
            setActiveAnnuityIdx(activeIdx.annuity || 0);
            setActiveWrapIdx(activeIdx.wrap || 0);
            setActiveBondIdx(activeIdx.bond || 0);
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

  // Save before navigation event listener
  useEffect(() => {
    const handleSaveBeforeNav = async () => {
      if (!soaRequest?.id) {
        window.dispatchEvent(new Event('soa-save-complete'));
        return;
      }

      try {
        await base44.entities.SOARequest.update(soaRequest.id, {
          products_entities: {
            new_trusts: newTrusts,
            new_companies: newCompanies,
            new_smsf: newSMSFs,
            products: {
              superannuation: superProducts,
              pension: pensionProducts,
              annuity: annuityProducts,
              wrap: wrapProducts,
              investment_bond: bondProducts
            },
            currentMainTab: mainTab,
            currentEntityTab: entityTab,
            currentProductTab: productTab,
            activeIndex: {
              trust: activeTrustIdx,
              company: activeCompanyIdx,
              smsf: activeSMSFIdx,
              super: activeSuperIdx,
              pension: activePensionIdx,
              annuity: activeAnnuityIdx,
              wrap: activeWrapIdx,
              bond: activeBondIdx
            }
          }
        });
      } catch (error) {
        console.error('Save before nav failed:', error);
      }
      window.dispatchEvent(new Event('soa-save-complete'));
    };

    window.addEventListener('soa-save-before-nav', handleSaveBeforeNav);
    return () => window.removeEventListener('soa-save-before-nav', handleSaveBeforeNav);
  }, [soaRequest?.id, newTrusts, newCompanies, newSMSFs, superProducts, pensionProducts, annuityProducts, wrapProducts, bondProducts, mainTab, entityTab, productTab, activeTrustIdx, activeCompanyIdx, activeSMSFIdx, activeSuperIdx, activePensionIdx, activeAnnuityIdx, activeWrapIdx, activeBondIdx]);

  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        products_entities: {
          new_trusts: newTrusts,
          new_companies: newCompanies,
          new_smsf: newSMSFs,
          products: {
            superannuation: superProducts,
            pension: pensionProducts,
            annuity: annuityProducts,
            wrap: wrapProducts,
            investment_bond: bondProducts
          },
          currentMainTab: mainTab,
          currentEntityTab: entityTab,
          currentProductTab: productTab,
          activeIndex: {
            trust: activeTrustIdx,
            company: activeCompanyIdx,
            smsf: activeSMSFIdx,
            super: activeSuperIdx,
            pension: activePensionIdx,
            annuity: activeAnnuityIdx,
            wrap: activeWrapIdx,
            bond: activeBondIdx
          }
        }
      });
      
      // DEBUG: Read back immediately to verify save worked
      const check = await base44.entities.SOARequest.get(soaRequest.id);
      alert('SAVE CHECK: products_entities = ' + JSON.stringify(check.products_entities?.new_trusts || 'EMPTY'));
      
      navigate(createPageUrl('SOARequestInsurance') + `?id=${soaRequest.id}`);
    } catch (error) {
      console.error('Save failed:', error);
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

  const trustBeneficiaryOptions = getFullEntityList(`new_trust_${activeTrustIdx}`);
  const companyShareholderOptions = getFullEntityList(`new_company_${activeCompanyIdx}`);
  const smsfAccountOwnerOptions = getFullEntityList();
  const smsfBeneficiaryOptions = getFullEntityList();

  // Product owner options by type
  const superOwnerOptions = getByTypes(['principal']);
  const pensionOwnerOptions = getByTypes(['principal']);
  const annuityOwnerOptions = getByTypes(['principal']);
  const wrapOwnerOptions = getByTypes(['principal', 'trust', 'company', 'smsf']);
  const bondOwnerOptions = getByTypes(['principal', 'trust']);

  // SMSF specific options
  const smsfAccountOwnerOptions = getByTypes(['principal']);
  const smsfBeneficiaryOptions = [
    ...getByTypes(['principal', 'child', 'dependant']),
    { id: 'estate', label: 'Estate', type: 'estate', color: '#6b7280' }
  ];

  // ============ RENDER HELPERS ============

  const renderNewTrustCard = (trust, idx) => (
    <div key={idx} className="border border-slate-200 rounded-lg p-6 space-y-4">
      {/* Trust Details */}
      <div className="border-l-4 border-blue-500 bg-blue-50 px-4 py-3 rounded">
        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
          🏛 New Trust Details
        </h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Trust name</label>
            <Input
              value={trust.trust_name || ''}
              onChange={(e) => {
                const updated = [...newTrusts];
                updated[idx].trust_name = e.target.value;
                setNewTrusts(updated);
              }}
              placeholder="e.g., The Smith Family Trust"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Trust type</label>
            <select
              value={trust.trust_type || ''}
              onChange={(e) => {
                const updated = [...newTrusts];
                updated[idx].trust_type = e.target.value;
                setNewTrusts(updated);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '14px'
              }}
            >
              <option value="">Select…</option>
              <option value="1">Discretionary Family Trust</option>
              <option value="2">Unit Trust</option>
              <option value="3">Hybrid Trust</option>
              <option value="4">Testamentary Trust</option>
              <option value="5">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Beneficiaries */}
      <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 rounded">
        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
          👤 Trustee Beneficiaries
        </h4>
        <table style={{ width: '100%', marginBottom: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Beneficiary</th>
              <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Entitlement</th>
              <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {(trust.beneficiaries || []).map((benef, bidx) => (
              <tr key={bidx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 0' }}>
                  <EntitySelect
                    value={benef.benef_entity}
                    onChange={(val) => {
                      const updated = [...newTrusts];
                      updated[idx].beneficiaries[bidx].benef_entity = val;
                      setNewTrusts(updated);
                    }}
                    entities={trustBeneficiaryOptions}
                  />
                </td>
                <td style={{ padding: '8px 0' }}>
                  <Input
                    value={benef.benef_entitlement || ''}
                    onChange={(e) => {
                      const updated = [...newTrusts];
                      updated[idx].beneficiaries[bidx].benef_entitlement = e.target.value;
                      setNewTrusts(updated);
                    }}
                    placeholder="e.g., 25%"
                    style={{ maxWidth: '100px' }}
                  />
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0' }}>
                  <button
                    onClick={() => {
                      const updated = [...newTrusts];
                      updated[idx].beneficiaries = updated[idx].beneficiaries.filter((_, i) => i !== bidx);
                      setNewTrusts(updated);
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button
          onClick={() => {
            const updated = [...newTrusts];
            if (!updated[idx].beneficiaries) updated[idx].beneficiaries = [];
            updated[idx].beneficiaries.push({ benef_entity: '', benef_entitlement: '' });
            setNewTrusts(updated);
          }}
          size="sm"
          variant="outline"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Beneficiary
        </Button>
      </div>

      {/* Remove */}
      <div className="flex justify-end">
        <button
          onClick={() => setNewTrusts(newTrusts.filter((_, i) => i !== idx))}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderNewCompanyCard = (company, idx) => (
    <div key={idx} className="border border-slate-200 rounded-lg p-6 space-y-4">
      {/* Company Details */}
      <div className="border-l-4 border-blue-500 bg-blue-50 px-4 py-3 rounded">
        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
          🏢 New Company Details
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Company name</label>
            <Input
              value={company.company_name || ''}
              onChange={(e) => {
                const updated = [...newCompanies];
                updated[idx].company_name = e.target.value;
                setNewCompanies(updated);
              }}
              placeholder="e.g., Smith Investments Pty Ltd"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Purpose of company</label>
            <select
              value={company.co_purpose || ''}
              onChange={(e) => {
                const updated = [...newCompanies];
                updated[idx].co_purpose = e.target.value;
                setNewCompanies(updated);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '14px'
              }}
            >
              <option value="">Select…</option>
              <option value="1">Operating business</option>
              <option value="2">Investment</option>
              <option value="3">Beneficiary of trust</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Company type</label>
            <select
              value={company.co_type || ''}
              onChange={(e) => {
                const updated = [...newCompanies];
                updated[idx].co_type = e.target.value;
                setNewCompanies(updated);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '14px'
              }}
            >
              <option value="">Select…</option>
              <option value="1">Pty Ltd</option>
              <option value="2">Partnership</option>
              <option value="3">Sole trader</option>
              <option value="4">Charity</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Pre-existing losses ($)</label>
            <Input
              type="number"
              value={company.co_losses || ''}
              onChange={(e) => {
                const updated = [...newCompanies];
                updated[idx].co_losses = e.target.value;
                setNewCompanies(updated);
              }}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Annual profit ($)</label>
            <Input
              type="number"
              value={company.co_profit || ''}
              onChange={(e) => {
                const updated = [...newCompanies];
                updated[idx].co_profit = e.target.value;
                setNewCompanies(updated);
              }}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Shareholders */}
      <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 rounded">
        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
          👤 Shareholders
        </h4>
        <table style={{ width: '100%', marginBottom: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Shareholder</th>
              <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Percentage</th>
              <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {(company.shareholders || []).map((sh, sidx) => (
              <tr key={sidx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 0' }}>
                  <EntitySelect
                    value={sh.sh_entity}
                    onChange={(val) => {
                      const updated = [...newCompanies];
                      updated[idx].shareholders[sidx].sh_entity = val;
                      setNewCompanies(updated);
                    }}
                    entities={companyShareholderOptions}
                  />
                </td>
                <td style={{ padding: '8px 0' }}>
                  <Input
                    value={sh.sh_pct || ''}
                    onChange={(e) => {
                      const updated = [...newCompanies];
                      updated[idx].shareholders[sidx].sh_pct = e.target.value;
                      setNewCompanies(updated);
                    }}
                    placeholder="e.g., 25%"
                    style={{ maxWidth: '100px' }}
                  />
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0' }}>
                  <button
                    onClick={() => {
                      const updated = [...newCompanies];
                      updated[idx].shareholders = updated[idx].shareholders.filter((_, i) => i !== sidx);
                      setNewCompanies(updated);
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button
          onClick={() => {
            const updated = [...newCompanies];
            if (!updated[idx].shareholders) updated[idx].shareholders = [];
            updated[idx].shareholders.push({ sh_entity: '', sh_pct: '' });
            setNewCompanies(updated);
          }}
          size="sm"
          variant="outline"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Shareholder
        </Button>
      </div>

      {/* Remove */}
      <div className="flex justify-end">
        <button
          onClick={() => setNewCompanies(newCompanies.filter((_, i) => i !== idx))}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderSuperProduct = (product, idx) => (
    <div key={idx} className="border border-slate-200 rounded-lg p-6 space-y-4">
      <div className="border-l-4 border-blue-500 bg-blue-50 px-4 py-3 rounded">
        <h4 className="text-sm font-bold text-slate-700 mb-3">🏦 Superannuation Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Product name</label>
            <Input
              value={product.product_name || ''}
              onChange={(e) => {
                const updated = [...superProducts];
                updated[idx].product_name = e.target.value;
                setSuperProducts(updated);
              }}
              placeholder="e.g., AustralianSuper - Balanced"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Product provider</label>
            <Input
              value={product.provider || ''}
              onChange={(e) => {
                const updated = [...superProducts];
                updated[idx].provider = e.target.value;
                setSuperProducts(updated);
              }}
              placeholder="e.g., AustralianSuper"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Owner</label>
            <EntitySelect
              value={product.owner || ''}
              onChange={(val) => {
                const updated = [...superProducts];
                updated[idx].owner = val;
                setSuperProducts(updated);
              }}
              entities={superOwnerOptions}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => setSuperProducts(superProducts.filter((_, i) => i !== idx))}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderPensionProduct = (product, idx) => (
    <div key={idx} className="border border-slate-200 rounded-lg p-6 space-y-4">
      <div className="border-l-4 border-blue-500 bg-blue-50 px-4 py-3 rounded">
        <h4 className="text-sm font-bold text-slate-700 mb-3">💳 Pension Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Product name</label>
            <Input
              value={product.product_name || ''}
              onChange={(e) => {
                const updated = [...pensionProducts];
                updated[idx].product_name = e.target.value;
                setPensionProducts(updated);
              }}
              placeholder="e.g., AustralianSuper - Pension"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Product provider</label>
            <Input
              value={product.provider || ''}
              onChange={(e) => {
                const updated = [...pensionProducts];
                updated[idx].provider = e.target.value;
                setPensionProducts(updated);
              }}
              placeholder="e.g., AustralianSuper"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Owner</label>
            <EntitySelect
              value={product.owner || ''}
              onChange={(val) => {
                const updated = [...pensionProducts];
                updated[idx].owner = val;
                setPensionProducts(updated);
              }}
              entities={pensionOwnerOptions}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Type of pension</label>
            <select
              value={product.pension_type || ''}
              onChange={(e) => {
                const updated = [...pensionProducts];
                updated[idx].pension_type = e.target.value;
                setPensionProducts(updated);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '14px'
              }}
            >
              <option value="">Select…</option>
              <option value="account_based">Account based</option>
              <option value="term_allocated">Term allocated</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => setPensionProducts(pensionProducts.filter((_, i) => i !== idx))}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderAnnuityProduct = (product, idx) => (
    <div key={idx} className="border border-slate-200 rounded-lg p-6 space-y-4">
      <div className="border-l-4 border-blue-500 bg-blue-50 px-4 py-3 rounded">
        <h4 className="text-sm font-bold text-slate-700 mb-3">📋 Annuity Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Product name</label>
            <Input
              value={product.product_name || ''}
              onChange={(e) => {
                const updated = [...annuityProducts];
                updated[idx].product_name = e.target.value;
                setAnnuityProducts(updated);
              }}
              placeholder="e.g., Challenger Lifetime Annuity"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Product provider</label>
            <Input
              value={product.provider || ''}
              onChange={(e) => {
                const updated = [...annuityProducts];
                updated[idx].provider = e.target.value;
                setAnnuityProducts(updated);
              }}
              placeholder="e.g., Challenger"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Owner</label>
            <EntitySelect
              value={product.owner || ''}
              onChange={(val) => {
                const updated = [...annuityProducts];
                updated[idx].owner = val;
                setAnnuityProducts(updated);
              }}
              entities={annuityOwnerOptions}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Tax environment</label>
            <select
              value={product.annuity_tax_env || ''}
              onChange={(e) => {
                const updated = [...annuityProducts];
                updated[idx].annuity_tax_env = e.target.value;
                setAnnuityProducts(updated);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '14px'
              }}
            >
              <option value="">Select…</option>
              <option value="superannuation">Superannuation</option>
              <option value="non_superannuation">Non-superannuation</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Joint holder</label>
            <Input
              value={product.annuity_joint || ''}
              onChange={(e) => {
                const updated = [...annuityProducts];
                updated[idx].annuity_joint = e.target.value;
                setAnnuityProducts(updated);
              }}
              placeholder="e.g., Joint with spouse"
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={product.annuity_lifetime || false}
                onChange={(e) => {
                  const updated = [...annuityProducts];
                  updated[idx].annuity_lifetime = e.target.checked;
                  setAnnuityProducts(updated);
                }}
                className="w-4 h-4"
              />
              <span className="text-xs font-semibold text-slate-600">Lifetime annuity</span>
            </label>
          </div>
          {!product.annuity_lifetime && (
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Term of annuity (years)</label>
              <Input
                type="number"
                value={product.annuity_term || ''}
                onChange={(e) => {
                  const updated = [...annuityProducts];
                  updated[idx].annuity_term = e.target.value;
                  setAnnuityProducts(updated);
                }}
                placeholder="e.g., 10"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Purchase price ($)</label>
            <Input
              type="number"
              value={product.annuity_purchase_price || ''}
              onChange={(e) => {
                const updated = [...annuityProducts];
                updated[idx].annuity_purchase_price = e.target.value;
                setAnnuityProducts(updated);
              }}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Purchase date</label>
            <Input
              type="date"
              value={product.annuity_purchase_date || ''}
              onChange={(e) => {
                const updated = [...annuityProducts];
                updated[idx].annuity_purchase_date = e.target.value;
                setAnnuityProducts(updated);
              }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Annuity income (per period) ($)</label>
            <Input
              type="number"
              value={product.annuity_income || ''}
              onChange={(e) => {
                const updated = [...annuityProducts];
                updated[idx].annuity_income = e.target.value;
                setAnnuityProducts(updated);
              }}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Index rate (%)</label>
            <Input
              type="number"
              step="0.01"
              value={product.annuity_index_rate || ''}
              onChange={(e) => {
                const updated = [...annuityProducts];
                updated[idx].annuity_index_rate = e.target.value;
                setAnnuityProducts(updated);
              }}
              placeholder="e.g., 2.5"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Residual value ($)</label>
            <Input
              type="number"
              value={product.annuity_residual_value || ''}
              onChange={(e) => {
                const updated = [...annuityProducts];
                updated[idx].annuity_residual_value = e.target.value;
                setAnnuityProducts(updated);
              }}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Deductible income ($)</label>
            <Input
              type="number"
              value={product.annuity_deductible_income || ''}
              onChange={(e) => {
                const updated = [...annuityProducts];
                updated[idx].annuity_deductible_income = e.target.value;
                setAnnuityProducts(updated);
              }}
              placeholder="0"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => setAnnuityProducts(annuityProducts.filter((_, i) => i !== idx))}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderWrapProduct = (product, idx) => (
    <div key={idx} className="border border-slate-200 rounded-lg p-6 space-y-4">
      <div className="border-l-4 border-blue-500 bg-blue-50 px-4 py-3 rounded">
        <h4 className="text-sm font-bold text-slate-700 mb-3">📊 Wrap Platform Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Product name</label>
            <Input
              value={product.product_name || ''}
              onChange={(e) => {
                const updated = [...wrapProducts];
                updated[idx].product_name = e.target.value;
                setWrapProducts(updated);
              }}
              placeholder="e.g., Hub24 Invest"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Product provider</label>
            <Input
              value={product.provider || ''}
              onChange={(e) => {
                const updated = [...wrapProducts];
                updated[idx].provider = e.target.value;
                setWrapProducts(updated);
              }}
              placeholder="e.g., Hub24"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Owner</label>
            <EntitySelect
              value={product.owner || ''}
              onChange={(val) => {
                const updated = [...wrapProducts];
                updated[idx].owner = val;
                setWrapProducts(updated);
              }}
              entities={wrapOwnerOptions}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => setWrapProducts(wrapProducts.filter((_, i) => i !== idx))}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderNewSMSFCard = (smsf, idx) => (
    <div key={idx} className="border border-slate-200 rounded-lg p-6 space-y-4">
      {/* SMSF Details */}
      <div className="border-l-4 border-blue-500 bg-blue-50 px-4 py-3 rounded">
        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
          🏦 New SMSF Details
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">SMSF name</label>
            <Input
              value={smsf.smsf_name || ''}
              onChange={(e) => {
                const updated = [...newSMSFs];
                updated[idx].smsf_name = e.target.value;
                setNewSMSFs(updated);
              }}
              placeholder="e.g., Smith Family SMSF"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Type of fund</label>
            <select
              value={smsf.fund_type || ''}
              onChange={(e) => {
                const updated = [...newSMSFs];
                updated[idx].fund_type = e.target.value;
                setNewSMSFs(updated);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '14px'
              }}
            >
              <option value="">Select…</option>
              <option value="SMSF">SMSF</option>
              <option value="SAFT">SAFT</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Trustee type</label>
            <select
              value={smsf.trustee_type || ''}
              onChange={(e) => {
                const updated = [...newSMSFs];
                updated[idx].trustee_type = e.target.value;
                setNewSMSFs(updated);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '14px'
              }}
            >
              <option value="">Select…</option>
              <option value="corporate">Corporate trustee</option>
              <option value="individual">Individual trustee</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Account type</label>
            <select
              value={smsf.acct_type || ''}
              onChange={(e) => {
                const updated = [...newSMSFs];
                updated[idx].acct_type = e.target.value;
                setNewSMSFs(updated);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '14px'
              }}
            >
              <option value="">Select…</option>
              <option value="pooled">Pooled</option>
              <option value="segregate">Segregate</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">SMSF balance ($)</label>
            <Input
              type="number"
              value={smsf.smsf_balance || ''}
              onChange={(e) => {
                const updated = [...newSMSFs];
                updated[idx].smsf_balance = e.target.value;
                setNewSMSFs(updated);
              }}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Individual trustee</label>
            <Input
              value={smsf.individual_trustee || ''}
              onChange={(e) => {
                const updated = [...newSMSFs];
                updated[idx].individual_trustee = e.target.value;
                setNewSMSFs(updated);
              }}
              placeholder="e.g., John Smith"
            />
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 rounded">
        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
          💰 Account Information
        </h4>
        {(smsf.accounts || []).length > 0 && (
          <div className="mb-4">
            <table style={{ width: '100%', marginBottom: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Owner</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Tax Env</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>% of Fund</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Balance</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {smsf.accounts.map((acct, aidx) => (
                  <tr key={aidx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 0', fontSize: '12px' }}>{smsfAccountOwnerOptions.find(o => o.id === acct.owner)?.label || acct.owner}</td>
                    <td style={{ padding: '8px 0', fontSize: '12px' }}>{acct.tax_environment}</td>
                    <td style={{ padding: '8px 0', fontSize: '12px' }}>{acct.fund_percentage}%</td>
                    <td style={{ padding: '8px 0', fontSize: '12px' }}>${acct.balance?.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', padding: '8px 0' }}>
                      <button
                        onClick={() => {
                          const updated = [...newSMSFs];
                          updated[idx].accounts = updated[idx].accounts.filter((_, i) => i !== aidx);
                          setNewSMSFs(updated);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Button
          onClick={() => {
            const updated = [...newSMSFs];
            if (!updated[idx].accounts) updated[idx].accounts = [];
            updated[idx].accounts.push({
              owner: '',
              tax_environment: '',
              fund_percentage: '',
              balance: '',
              tax_free_amt: '',
              tax_free_pct: '',
              unp_amt: '',
              super_guarantee: '',
              salary_sacrifice: '',
              after_tax: ''
            });
            setNewSMSFs(updated);
          }}
          size="sm"
          variant="outline"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Account
        </Button>
      </div>

      {/* Beneficiaries */}
      {(smsf.accounts || []).length > 0 && (
        <div className="border-l-4 border-yellow-500 bg-yellow-50 px-4 py-3 rounded">
          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
            👤 Beneficiaries
          </h4>
          <table style={{ width: '100%', marginBottom: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Account</th>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Beneficiary</th>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Entitlement</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {(smsf.beneficiaries || []).map((benef, bidx) => (
                <tr key={bidx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 0', fontSize: '12px' }}>
                    <select
                      value={benef.benef_account || ''}
                      onChange={(e) => {
                        const updated = [...newSMSFs];
                        updated[idx].beneficiaries[bidx].benef_account = e.target.value;
                        setNewSMSFs(updated);
                      }}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        width: '100%'
                      }}
                    >
                      <option value="">Select…</option>
                      {(smsf.accounts || []).map((acct, aidx) => (
                        <option key={aidx} value={`account_${aidx}`}>
                          Account {aidx + 1}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '8px 0' }}>
                    <EntitySelect
                      value={benef.benef_who}
                      onChange={(val) => {
                        const updated = [...newSMSFs];
                        updated[idx].beneficiaries[bidx].benef_who = val;
                        setNewSMSFs(updated);
                      }}
                      entities={smsfBeneficiaryOptions}
                    />
                  </td>
                  <td style={{ padding: '8px 0', fontSize: '12px' }}>
                    <select
                      value={benef.benef_type || ''}
                      onChange={(e) => {
                        const updated = [...newSMSFs];
                        updated[idx].beneficiaries[bidx].benef_type = e.target.value;
                        setNewSMSFs(updated);
                      }}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        width: '100%'
                      }}
                    >
                      <option value="">Select…</option>
                      <option value="binding">Binding</option>
                      <option value="non_binding">Non-binding</option>
                      <option value="lapsing_binding">Lapsing binding</option>
                      <option value="non_lapsing_binding">Non-lapsing binding</option>
                    </select>
                  </td>
                  <td style={{ padding: '8px 0' }}>
                    <Input
                      value={benef.benef_entitlement || ''}
                      onChange={(e) => {
                        const updated = [...newSMSFs];
                        updated[idx].beneficiaries[bidx].benef_entitlement = e.target.value;
                        setNewSMSFs(updated);
                      }}
                      placeholder="e.g., 25%"
                      style={{ maxWidth: '80px', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ textAlign: 'right', padding: '8px 0' }}>
                    <button
                      onClick={() => {
                        const updated = [...newSMSFs];
                        updated[idx].beneficiaries = updated[idx].beneficiaries.filter((_, i) => i !== bidx);
                        setNewSMSFs(updated);
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button
            onClick={() => {
              const updated = [...newSMSFs];
              if (!updated[idx].beneficiaries) updated[idx].beneficiaries = [];
              updated[idx].beneficiaries.push({
                benef_account: '',
                benef_who: '',
                benef_type: '',
                benef_entitlement: ''
              });
              setNewSMSFs(updated);
            }}
            size="sm"
            variant="outline"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Beneficiary
          </Button>
        </div>
      )}

      {/* Remove SMSF */}
      <div className="flex justify-end">
        <button
          onClick={() => setNewSMSFs(newSMSFs.filter((_, i) => i !== idx))}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderBondProduct = (product, idx) => (
    <div key={idx} className="border border-slate-200 rounded-lg p-6 space-y-4">
      <div className="border-l-4 border-blue-500 bg-blue-50 px-4 py-3 rounded">
        <h4 className="text-sm font-bold text-slate-700 mb-3">🔒 Investment Bond Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Product name</label>
            <Input
              value={product.product_name || ''}
              onChange={(e) => {
                const updated = [...bondProducts];
                updated[idx].product_name = e.target.value;
                setBondProducts(updated);
              }}
              placeholder="e.g., Generation Life Bond"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Product provider</label>
            <Input
              value={product.provider || ''}
              onChange={(e) => {
                const updated = [...bondProducts];
                updated[idx].provider = e.target.value;
                setBondProducts(updated);
              }}
              placeholder="e.g., Generation Life"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Owner</label>
            <EntitySelect
              value={product.owner || ''}
              onChange={(val) => {
                const updated = [...bondProducts];
                updated[idx].owner = val;
                setBondProducts(updated);
              }}
              entities={bondOwnerOptions}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => setBondProducts(bondProducts.filter((_, i) => i !== idx))}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ============ MAIN RENDER ============

  return (
    <SOARequestLayout currentSection="products" soaRequest={soaRequest}>
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="w-full">
          {/* Header */}
          <div style={{ backgroundColor: '#1E293B', padding: '24px 32px', borderRadius: '16px 16px 0 0' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 4px 0' }}>
              Products & Entities
            </h1>
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
              Add the new products or entities you are recommending
            </p>
          </div>

          {/* Content */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0 0 16px 16px', border: '1px solid #E2E8F0', borderTop: 'none' }}>
            {/* Main Tabs */}
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'inline-flex', gap: '8px' }}>
                <button
                  onClick={() => setMainTab('entities')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: mainTab === 'entities' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: mainTab === 'entities' ? '#eff6ff' : '#f8fafc',
                    color: mainTab === 'entities' ? '#1e40af' : '#64748b',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  📦 Entities
                </button>
                <button
                  onClick={() => setMainTab('products')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: mainTab === 'products' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: mainTab === 'products' ? '#eff6ff' : '#f8fafc',
                    color: mainTab === 'products' ? '#1e40af' : '#64748b',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  💰 Products
                </button>
              </div>
            </div>

            {/* Entity Sub-tabs */}
            {mainTab === 'entities' && (
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'inline-flex', gap: '8px' }}>
                  <button
                    onClick={() => setEntityTab('trust')}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '6px',
                      border: entityTab === 'trust' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: entityTab === 'trust' ? '#eff6ff' : '#f8fafc',
                      color: entityTab === 'trust' ? '#1e40af' : '#64748b',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    🏛 New Trusts
                  </button>
                  <button
                    onClick={() => setEntityTab('company')}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '6px',
                      border: entityTab === 'company' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: entityTab === 'company' ? '#eff6ff' : '#f8fafc',
                      color: entityTab === 'company' ? '#1e40af' : '#64748b',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    🏢 New Companies
                  </button>
                  <button
                    onClick={() => setEntityTab('smsf')}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '6px',
                      border: entityTab === 'smsf' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: entityTab === 'smsf' ? '#eff6ff' : '#f8fafc',
                      color: entityTab === 'smsf' ? '#1e40af' : '#64748b',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    🏦 New SMSF
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            <div style={{ padding: '24px 32px' }}>
              {mainTab === 'entities' && entityTab === 'trust' && (
                <div className="space-y-6">
                  {newTrusts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
                      <div className="text-5xl mb-4">🏛</div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Are you recommending a new trust?</h3>
                      <p className="text-slate-600 text-center mb-6">Add details about new family trusts, unit trusts, or other trust structures being recommended.</p>
                      <Button onClick={() => setNewTrusts([...newTrusts, { trust_name: '', trust_type: '', beneficiaries: [] }])} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Trust
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {newTrusts.length > 1 && (
                        <div className="flex gap-2">
                          {newTrusts.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveTrustIdx(idx)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                backgroundColor: activeTrustIdx === idx ? '#2563eb' : '#e2e8f0',
                                color: activeTrustIdx === idx ? '#fff' : '#64748b',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer'
                              }}
                            >
                              Trust {idx + 1}
                            </button>
                          ))}
                        </div>
                      )}
                      {renderNewTrustCard(newTrusts[activeTrustIdx], activeTrustIdx)}
                      <Button onClick={() => setNewTrusts([...newTrusts, { trust_name: '', trust_type: '', beneficiaries: [] }])} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Trust
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {mainTab === 'entities' && entityTab === 'company' && (
                <div className="space-y-6">
                  {newCompanies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
                      <div className="text-5xl mb-4">🏢</div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Are you recommending a new company?</h3>
                      <p className="text-slate-600 text-center mb-6">Add details about new private companies or corporate entities being recommended.</p>
                      <Button onClick={() => setNewCompanies([...newCompanies, { company_name: '', co_purpose: '', co_type: '', co_losses: '', co_profit: '', shareholders: [] }])} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Company
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {newCompanies.length > 1 && (
                        <div className="flex gap-2">
                          {newCompanies.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveCompanyIdx(idx)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                backgroundColor: activeCompanyIdx === idx ? '#2563eb' : '#e2e8f0',
                                color: activeCompanyIdx === idx ? '#fff' : '#64748b',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer'
                              }}
                            >
                              Company {idx + 1}
                            </button>
                          ))}
                        </div>
                      )}
                      {renderNewCompanyCard(newCompanies[activeCompanyIdx], activeCompanyIdx)}
                      <Button onClick={() => setNewCompanies([...newCompanies, { company_name: '', co_purpose: '', co_type: '', co_losses: '', co_profit: '', shareholders: [] }])} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Company
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {mainTab === 'entities' && entityTab === 'smsf' && (
                <div className="space-y-6">
                  {newSMSFs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
                      <div className="text-5xl mb-4">🏦</div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Are you recommending a new SMSF?</h3>
                      <p className="text-slate-600 text-center mb-6">Add details about new Self-Managed Super Funds being set up or recommended.</p>
                      <Button onClick={() => setNewSMSFs([...newSMSFs, { smsf_name: '', fund_type: '', trustee_type: '', acct_type: '', smsf_balance: '', individual_trustee: '', accounts: [], beneficiaries: [] }])} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New SMSF
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {newSMSFs.length > 1 && (
                        <div className="flex gap-2">
                          {newSMSFs.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveSMSFIdx(idx)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                backgroundColor: activeSMSFIdx === idx ? '#2563eb' : '#e2e8f0',
                                color: activeSMSFIdx === idx ? '#fff' : '#64748b',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer'
                              }}
                            >
                              SMSF {idx + 1}
                            </button>
                          ))}
                        </div>
                      )}
                      {renderNewSMSFCard(newSMSFs[activeSMSFIdx], activeSMSFIdx)}
                      {newSMSFs.length < 2 && (
                        <Button onClick={() => setNewSMSFs([...newSMSFs, { smsf_name: '', fund_type: '', trustee_type: '', acct_type: '', smsf_balance: '', individual_trustee: '', accounts: [], beneficiaries: [] }])} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Another SMSF
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {mainTab === 'products' && (
                <>
                  {/* Product sub-tabs */}
                  <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                    <button
                      onClick={() => setProductTab('superannuation')}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: productTab === 'superannuation' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: productTab === 'superannuation' ? '#eff6ff' : '#f8fafc',
                        color: productTab === 'superannuation' ? '#1e40af' : '#64748b',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      🏦 Superannuation
                    </button>
                    <button
                      onClick={() => setProductTab('pension')}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: productTab === 'pension' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: productTab === 'pension' ? '#eff6ff' : '#f8fafc',
                        color: productTab === 'pension' ? '#1e40af' : '#64748b',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      💳 Pension
                    </button>
                    <button
                      onClick={() => setProductTab('annuity')}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: productTab === 'annuity' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: productTab === 'annuity' ? '#eff6ff' : '#f8fafc',
                        color: productTab === 'annuity' ? '#1e40af' : '#64748b',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      📋 Annuity
                    </button>
                    <button
                      onClick={() => setProductTab('wrap')}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: productTab === 'wrap' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: productTab === 'wrap' ? '#eff6ff' : '#f8fafc',
                        color: productTab === 'wrap' ? '#1e40af' : '#64748b',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      📊 Wrap
                    </button>
                    <button
                      onClick={() => setProductTab('investment_bond')}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: productTab === 'investment_bond' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: productTab === 'investment_bond' ? '#eff6ff' : '#f8fafc',
                        color: productTab === 'investment_bond' ? '#1e40af' : '#64748b',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      🔒 Investment Bond
                    </button>
                  </div>

                  {/* Superannuation Tab */}
                  {productTab === 'superannuation' && (
                    <div className="space-y-6">
                      {superProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
                          <div className="text-5xl mb-4">🏦</div>
                          <h3 className="text-lg font-semibold text-slate-800 mb-2">Are you recommending a new superannuation fund?</h3>
                          <p className="text-slate-600 text-center mb-6">Add details about new super funds being recommended for your client.</p>
                          <Button onClick={() => setSuperProducts([...superProducts, { product_name: '', provider: '', owner: '' }])} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Superannuation Product
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {superProducts.length > 1 && (
                            <div className="flex gap-2">
                              {superProducts.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setActiveSuperIdx(idx)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    backgroundColor: activeSuperIdx === idx ? '#2563eb' : '#e2e8f0',
                                    color: activeSuperIdx === idx ? '#fff' : '#64748b',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Super {idx + 1}
                                </button>
                              ))}
                            </div>
                          )}
                          {renderSuperProduct(superProducts[activeSuperIdx], activeSuperIdx)}
                          <Button onClick={() => setSuperProducts([...superProducts, { product_name: '', provider: '', owner: '' }])} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Another Superannuation
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pension Tab */}
                  {productTab === 'pension' && (
                    <div className="space-y-6">
                      {pensionProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
                          <div className="text-5xl mb-4">💳</div>
                          <h3 className="text-lg font-semibold text-slate-800 mb-2">Are you recommending a new pension?</h3>
                          <p className="text-slate-600 text-center mb-6">Add details about new account-based or allocated pensions being recommended.</p>
                          <Button onClick={() => setPensionProducts([...pensionProducts, { product_name: '', provider: '', owner: '', pension_type: '' }])} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Pension Product
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {pensionProducts.length > 1 && (
                            <div className="flex gap-2">
                              {pensionProducts.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setActivePensionIdx(idx)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    backgroundColor: activePensionIdx === idx ? '#2563eb' : '#e2e8f0',
                                    color: activePensionIdx === idx ? '#fff' : '#64748b',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Pension {idx + 1}
                                </button>
                              ))}
                            </div>
                          )}
                          {renderPensionProduct(pensionProducts[activePensionIdx], activePensionIdx)}
                          <Button onClick={() => setPensionProducts([...pensionProducts, { product_name: '', provider: '', owner: '', pension_type: '' }])} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Another Pension
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Annuity Tab */}
                  {productTab === 'annuity' && (
                    <div className="space-y-6">
                      {annuityProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
                          <div className="text-5xl mb-4">📋</div>
                          <h3 className="text-lg font-semibold text-slate-800 mb-2">Are you recommending a new annuity?</h3>
                          <p className="text-slate-600 text-center mb-6">Add details about new annuity products being recommended.</p>
                          <Button onClick={() => setAnnuityProducts([...annuityProducts, { product_name: '', provider: '', owner: '', annuity_tax_env: '', annuity_joint: '', annuity_lifetime: false, annuity_term: '', annuity_purchase_price: '', annuity_purchase_date: '', annuity_income: '', annuity_index_rate: '', annuity_residual_value: '', annuity_deductible_income: '' }])} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Annuity Product
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {annuityProducts.length > 1 && (
                            <div className="flex gap-2">
                              {annuityProducts.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setActiveAnnuityIdx(idx)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    backgroundColor: activeAnnuityIdx === idx ? '#2563eb' : '#e2e8f0',
                                    color: activeAnnuityIdx === idx ? '#fff' : '#64748b',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Annuity {idx + 1}
                                </button>
                              ))}
                            </div>
                          )}
                          {renderAnnuityProduct(annuityProducts[activeAnnuityIdx], activeAnnuityIdx)}
                          <Button onClick={() => setAnnuityProducts([...annuityProducts, { product_name: '', provider: '', owner: '', annuity_tax_env: '', annuity_joint: '', annuity_lifetime: false, annuity_term: '', annuity_purchase_price: '', annuity_purchase_date: '', annuity_income: '', annuity_index_rate: '', annuity_residual_value: '', annuity_deductible_income: '' }])} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Another Annuity
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Wrap Tab */}
                  {productTab === 'wrap' && (
                    <div className="space-y-6">
                      {wrapProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
                          <div className="text-5xl mb-4">📊</div>
                          <h3 className="text-lg font-semibold text-slate-800 mb-2">Are you recommending a new wrap platform?</h3>
                          <p className="text-slate-600 text-center mb-6">Add details about new wrap or platform accounts being recommended.</p>
                          <Button onClick={() => setWrapProducts([...wrapProducts, { product_name: '', provider: '', owner: '' }])} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Wrap Product
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {wrapProducts.length > 1 && (
                            <div className="flex gap-2">
                              {wrapProducts.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setActiveWrapIdx(idx)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    backgroundColor: activeWrapIdx === idx ? '#2563eb' : '#e2e8f0',
                                    color: activeWrapIdx === idx ? '#fff' : '#64748b',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Wrap {idx + 1}
                                </button>
                              ))}
                            </div>
                          )}
                          {renderWrapProduct(wrapProducts[activeWrapIdx], activeWrapIdx)}
                          <Button onClick={() => setWrapProducts([...wrapProducts, { product_name: '', provider: '', owner: '' }])} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Another Wrap
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Investment Bond Tab */}
                  {productTab === 'investment_bond' && (
                    <div className="space-y-6">
                      {bondProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
                          <div className="text-5xl mb-4">🔒</div>
                          <h3 className="text-lg font-semibold text-slate-800 mb-2">Are you recommending a new investment bond?</h3>
                          <p className="text-slate-600 text-center mb-6">Add details about new investment bond products being recommended.</p>
                          <Button onClick={() => setBondProducts([...bondProducts, { product_name: '', provider: '', owner: '' }])} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Investment Bond
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {bondProducts.length > 1 && (
                            <div className="flex gap-2">
                              {bondProducts.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setActiveBondIdx(idx)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    backgroundColor: activeBondIdx === idx ? '#2563eb' : '#e2e8f0',
                                    color: activeBondIdx === idx ? '#fff' : '#64748b',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Bond {idx + 1}
                                </button>
                              ))}
                            </div>
                          )}
                          {renderBondProduct(bondProducts[activeBondIdx], activeBondIdx)}
                          <Button onClick={() => setBondProducts([...bondProducts, { product_name: '', provider: '', owner: '' }])} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Another Bond
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-end gap-3" style={{ padding: '24px 32px', borderTop: '1px solid #E2E8F0' }}>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl('SOARequestScope') + `?id=${soaRequest.id}`)}
              >
                Back
              </Button>
              <Button
                onClick={handleSaveAndContinue}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {saving ? 'Saving...' : 'Save & Continue'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SOARequestLayout>
  );
}