import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { dependantsApi } from '@/api/dependantsApi';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { useFactFind } from '../components/factfind/useFactFind';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Plus } from 'lucide-react';

const INPUT_CLASS = 'w-full h-9 px-3 py-1 border border-slate-300 rounded-md bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

function ChildCard({ child, index, onFieldChange, onRemove }) {
  return (
    <div className="entry bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Child {index + 1}</h3>
          <p className="text-xs text-slate-500 mt-1">Fill in the details below</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          <span>✕</span>
          <span>Remove</span>
        </button>
      </div>
      <div className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Child name *</label>
            <input
              type="text"
              value={child.child_name || ''}
              onChange={(e) => onFieldChange('child_name', e.target.value)}
              placeholder="e.g. Emma"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Date of birth</label>
            <input
              type="date"
              value={child.child_dob || ''}
              onChange={(e) => onFieldChange('child_dob', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>
        <div className="pt-2">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Financially dependent?</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`child_fin_dep__${index}`}
                value="1"
                checked={child.child_fin_dep === '1'}
                onChange={(e) => onFieldChange('child_fin_dep', e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm text-slate-700">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`child_fin_dep__${index}`}
                value="2"
                checked={child.child_fin_dep === '2'}
                onChange={(e) => onFieldChange('child_fin_dep', e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm text-slate-700">No</span>
            </label>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Education status</label>
            <select
              value={child.child_edu || ''}
              onChange={(e) => onFieldChange('child_edu', e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Select...</option>
              <option value="1">Primary</option>
              <option value="2">Secondary</option>
              <option value="3">Tertiary</option>
              <option value="4">TAFE/Trade</option>
              <option value="5">Not in education</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Expected age of financial dependence</label>
            <input
              type="number"
              value={child.child_fin_age || ''}
              onChange={(e) => onFieldChange('child_fin_age', e.target.value)}
              placeholder="e.g. 25"
              className={INPUT_CLASS}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Health issues or concerns</label>
          <input
            type="text"
            value={child.child_health || ''}
            onChange={(e) => onFieldChange('child_health', e.target.value)}
            placeholder="e.g. Asthma, food allergy"
            className={INPUT_CLASS}
          />
        </div>
      </div>
    </div>
  );
}

function DependantCard({ dependant, index, onFieldChange, onRemove }) {
  return (
    <div className="entry bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Dependant {index + 1}</h3>
          <p className="text-xs text-slate-500 mt-1">Fill in the details below</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          <span>✕</span>
          <span>Remove</span>
        </button>
      </div>
      <div className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Name *</label>
            <input
              type="text"
              value={dependant.dep_name || ''}
              onChange={(e) => onFieldChange('dep_name', e.target.value)}
              placeholder="e.g. Parent name"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Date of birth</label>
            <input
              type="date"
              value={dependant.dep_dob || ''}
              onChange={(e) => onFieldChange('dep_dob', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Expected age of dependence until</label>
            <input
              type="number"
              value={dependant.dep_until_age || ''}
              onChange={(e) => onFieldChange('dep_until_age', e.target.value)}
              placeholder="e.g. 85"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Relationship</label>
            <select
              value={dependant.dep_relationship || ''}
              onChange={(e) => onFieldChange('dep_relationship', e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Select...</option>
              <option value="1">Child</option>
              <option value="2">Parent</option>
              <option value="3">Relative</option>
              <option value="4">Other</option>
            </select>
          </div>
        </div>
        <div className="pt-2">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Is there interdependency?</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`dep_interdep__${index}`}
                value="1"
                checked={dependant.dep_interdep === '1'}
                onChange={(e) => onFieldChange('dep_interdep', e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm text-slate-700">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`dep_interdep__${index}`}
                value="2"
                checked={dependant.dep_interdep === '2'}
                onChange={(e) => onFieldChange('dep_interdep', e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm text-slate-700">No</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FactFindDependants() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading, clientId: ffClientId } = useFactFind();
  // Fallback: resolve clientId from URL search params (same method as cashflow-model.jsx)
  const clientId = useMemo(() => {
    try {
      return ffClientId || new URLSearchParams(window.location.search).get('clientId');
    } catch { return null; }
  }, [ffClientId]);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('children');
  const [activeIndex, setActiveIndex] = useState(0);
  const [children, setChildren] = useState([]);
  const [dependants, setDependants] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const debounceTimers = useRef({});

  // Load user
  useEffect(() => {
    base44.auth.me().then(setUser).catch(console.error);
  }, []);

  // Load dependants from API
  useEffect(() => {
    if (!factFind?.id || !clientId) return;

    let cancelled = false;
    async function load() {
      try {
        const all = await dependantsApi.getAll(clientId);
        if (cancelled) return;
        setChildren(all.filter(d => d.dep_type === 'child'));
        setDependants(all.filter(d => d.dep_type === 'dependant'));
      } catch (error) {
        console.error('Failed to load dependants:', error);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    setLoaded(false);
    load();
    return () => { cancelled = true; };
  }, [factFind?.id, clientId]);

  // Debounced update to API
  const debouncedUpdate = useCallback((id, data) => {
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
    }
    debounceTimers.current[id] = setTimeout(async () => {
      try {
        await dependantsApi.update(id, data);
      } catch (error) {
        console.error('Failed to update dependant:', error);
      }
    }, 500);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  const activeList = currentTab === 'children' ? children : dependants;
  const setActiveList = currentTab === 'children' ? setChildren : setDependants;

  const handleFieldChange = useCallback((list, setList, index, field, value) => {
    setList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      const record = updated[index];
      if (record.id) {
        const { id, dep_type, client_id, ...fields } = record;
        debouncedUpdate(id, fields);
      }
      return updated;
    });
  }, [debouncedUpdate]);

  const handleAdd = useCallback(async () => {
    if (!clientId) return;
    const depType = currentTab === 'children' ? 'child' : 'dependant';
    try {
      const created = await dependantsApi.create({ dep_type: depType, client_id: clientId });
      if (currentTab === 'children') {
        setChildren(prev => {
          const next = [...prev, created];
          setActiveIndex(next.length - 1);
          return next;
        });
      } else {
        setDependants(prev => {
          const next = [...prev, created];
          setActiveIndex(next.length - 1);
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to create dependant:', error);
      toast.error('Failed to add entry');
    }
  }, [clientId, currentTab]);

  const handleRemove = useCallback(async (id, tab) => {
    try {
      await dependantsApi.remove(id);
      const setter = tab === 'children' ? setChildren : setDependants;
      setter(prev => {
        const next = prev.filter(item => item.id !== id);
        setActiveIndex(idx => Math.min(idx, Math.max(0, next.length - 1)));
        return next;
      });
    } catch (error) {
      console.error('Failed to remove dependant:', error);
      toast.error('Failed to remove entry');
    }
  }, []);

  const handleNext = async () => {
    if (!factFind?.id) {
      toast.error('Unable to save data');
      return;
    }

    setSaving(true);
    try {
      const sectionsCompleted = [...(factFind.sections_completed || [])];
      if (!sectionsCompleted.includes('dependants')) {
        sectionsCompleted.push('dependants');
      }

      await base44.entities.FactFind.update(factFind.id, {
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      if (currentTab === 'children') {
        setCurrentTab('dependants');
        setActiveIndex(0);
      } else {
        navigate(createPageUrl('FactFindTrusts') + `?id=${factFind.id}` + (clientId ? `&clientId=${clientId}` : ''));
      }
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindAboutYou') + `?id=${factFind?.id || ''}` + (clientId ? `&clientId=${clientId}` : ''));
  };

  if (ffLoading || !loaded) {
    return (
      <FactFindLayout currentSection="dependants" factFindId={factFind?.id} clientId={clientId}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const activeItem = activeList[activeIndex];

  return (
    <FactFindLayout currentSection="dependants" factFindId={factFind?.id} clientId={clientId}>
      <FactFindHeader
        title="Dependants"
        description="Add children and other dependants."
        factFind={factFind}
        user={user}
      />

      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => { setCurrentTab('children'); setActiveIndex(0); }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                currentTab === 'children'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>👶</span>
              Children
            </button>
            <button
              onClick={() => { setCurrentTab('dependants'); setActiveIndex(0); }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                currentTab === 'dependants'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>👥</span>
              Dependants
            </button>
          </div>

          {/* Empty state */}
          {activeList.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-12 text-center bg-white">
              <div className="text-5xl mb-4">
                {currentTab === 'children' ? '👨‍👩‍👧‍👦' : '👥'}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {currentTab === 'children' ? 'Do you have any children?' : 'Do you have any dependants?'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {currentTab === 'children'
                  ? 'Add information about your children to help us understand your family situation better.'
                  : 'Add information about your dependants so we can factor them into your financial plan.'}
              </p>
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add {currentTab === 'children' ? 'child' : 'dependant'}
              </button>
            </div>
          ) : (
            <>
              {/* Pills navigation + Add button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {activeList.map((item, i) => {
                    const displayName = currentTab === 'children'
                      ? (item.child_name?.trim() || `Child ${i + 1}`)
                      : (item.dep_name?.trim() || `Dependant ${i + 1}`);
                    const isActive = i === activeIndex;
                    return (
                      <button
                        key={item.id || i}
                        type="button"
                        onClick={() => setActiveIndex(i)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          isActive
                            ? 'bg-white border-blue-500 text-blue-700 shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {displayName}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add {currentTab === 'children' ? 'Child' : 'Dependant'}
                </button>
              </div>

              {/* Active card */}
              {activeItem && currentTab === 'children' && (
                <ChildCard
                  child={activeItem}
                  index={activeIndex}
                  onFieldChange={(field, value) => handleFieldChange(children, setChildren, activeIndex, field, value)}
                  onRemove={() => handleRemove(activeItem.id, 'children')}
                />
              )}
              {activeItem && currentTab === 'dependants' && (
                <DependantCard
                  dependant={activeItem}
                  index={activeIndex}
                  onFieldChange={(field, value) => handleFieldChange(dependants, setDependants, activeIndex, field, value)}
                  onRemove={() => handleRemove(activeItem.id, 'dependants')}
                />
              )}
            </>
          )}

          {/* Navigation */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  disabled={saving}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save & continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FactFindLayout>
  );
}
