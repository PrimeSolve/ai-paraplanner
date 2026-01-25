import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function FactFindDependants() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState('children');
  const [activeIndex, setActiveIndex] = useState(0);

  // Global state for form data
  const globalStateRef = React.useRef({
    dependants: {
      children: [],
      dependants_list: [],
      currentTab: 'children',
      activeIndex: 0
    }
  });

  const wrapForTab = (tab) => {
    const id = tab === 'children' ? 'childrenWrap' : 'dependantsWrap';
    return document.getElementById(id);
  };

  const cloneTemplateDiv = (id) => {
    const src = document.getElementById(id);
    const tmp = document.createElement('div');
    tmp.innerHTML = (src?.innerHTML || '').trim();
    return tmp.firstElementChild;
  };

  const readTabToArray = (tab) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return [];
    
    const cards = [...wrap.querySelectorAll('.entry')];
    return cards.map(card => {
      const data = {};
      const inputs = card.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        if (input.type === 'radio' || input.type === 'checkbox') {
          if (input.checked) data[input.name] = input.value;
        } else {
          data[input.name] = input.value;
        }
      });
      return data;
    });
  };

  const renumber = (tab) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return;

    [...wrap.querySelectorAll('.entry')].forEach((card, i) => {
      const idxSpan = card.querySelector('.idx');
      if (idxSpan) idxSpan.textContent = i + 1;
      
      // Update radio button names for uniqueness
      if (tab === 'children') {
        card.querySelectorAll('input[type="radio"][name^="child_fin_dep__"]')
          .forEach(r => { r.name = 'child_fin_dep__' + (i + 1); });
      }
    });
  };

  const updatePills = (index = activeIndex) => {
    const pillsContainer = document.getElementById(currentTab === 'children' ? 'childPills' : 'dependantPills');
    if (!pillsContainer) return;

    pillsContainer.innerHTML = '';
    const wrap = wrapForTab(currentTab);
    if (!wrap) return;

    const cards = [...wrap.querySelectorAll('.entry')];
    cards.forEach((card, i) => {
      const pill = document.createElement('button');
      const isActive = i === index;
      pill.type = 'button';

      let displayName = '';
      if (currentTab === 'children') {
        const nameInput = card.querySelector('input[name="child_name"]');
        displayName = nameInput && nameInput.value.trim()
          ? nameInput.value.trim()
          : `Child ${i + 1}`;
      } else {
        const nameInput = card.querySelector('input[name="dep_name"]');
        displayName = nameInput && nameInput.value.trim()
          ? nameInput.value.trim()
          : `Dependant ${i + 1}`;
      }

      pill.className = `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
        isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
      }`;
      pill.textContent = displayName;
      pill.onclick = (e) => {
        e.preventDefault();
        setActiveIndex(i);
        showOnlyActiveEntry(i);
      };

      pillsContainer.appendChild(pill);
    });
  };

  const showOnlyActiveEntry = () => {
    const wrap = wrapForTab(currentTab);
    if (!wrap) return;

    const cards = [...wrap.querySelectorAll('.entry')];
    cards.forEach((card, i) => {
      card.style.display = i === activeIndex ? '' : 'none';
    });
  };

  const addEntry = (tab = currentTab) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return;

    // Add empty entry to global state first
    if (tab === 'children') {
      globalStateRef.current.dependants.children.push({});
    } else {
      globalStateRef.current.dependants.dependants_list.push({});
    }

    const templateId = tab === 'children' ? 'childTemplate' : 'depTemplate';
    const node = cloneTemplateDiv(templateId);
    wrap.appendChild(node);

    // Setup remove button
    const removeBtn = node.querySelector('.entry-remove');
    if (removeBtn) {
      removeBtn.onclick = (e) => {
        e.preventDefault();
        removeEntry(node, tab);
      };
    }

    renumber(tab);
    const newIndex = wrap.querySelectorAll('.entry').length - 1;
    setActiveIndex(newIndex);
    setTimeout(() => {
      updatePills();
      showOnlyActiveEntry();
    }, 0);
  };

  const removeEntry = (node, tab = currentTab) => {
    node.remove();
    const wrap = wrapForTab(tab);
    const remaining = wrap.querySelectorAll('.entry').length;
    renumber(tab);
    updatePills();

    if (remaining > 0) {
      setActiveIndex(Math.max(0, remaining - 1));
      showOnlyActiveEntry();
    } else {
      setActiveIndex(0);
    }
  };

  const setupInputListeners = () => {
    document.addEventListener('input', (e) => {
      if (e.target.matches('input[name="child_name"], input[name="dep_name"]')) {
        updatePills();
      }

      // Debounced save
      clearTimeout(window._depSaveTimeout);
      window._depSaveTimeout = setTimeout(() => {
        saveDependantsState();
      }, 500);
    });
  };

  const saveDependantsState = async () => {
    if (!factFind?.id) return;

    try {
      globalStateRef.current.dependants.children = readTabToArray('children');
      globalStateRef.current.dependants.dependants_list = readTabToArray('dependants');
      globalStateRef.current.dependants.currentTab = currentTab;
      globalStateRef.current.dependants.activeIndex = activeIndex;

      await base44.entities.FactFind.update(factFind.id, {
        dependants: globalStateRef.current.dependants
      });
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const loadData = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');

      if (id) {
        const finds = await base44.entities.FactFind.filter({ id });
        if (finds[0]) {
          setFactFind(finds[0]);
          if (finds[0].dependants) {
            globalStateRef.current.dependants = {
              ...finds[0].dependants,
              currentTab: finds[0].dependants.currentTab || 'children',
              activeIndex: finds[0].dependants.activeIndex || 0
            };
          }
        }
      }
    } catch (error) {
      console.error('Error loading fact find:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setupInputListeners();
  }, []);

  useEffect(() => {
    if (!loading && factFind?.id) {
      // Initialize DOM with data
      setTimeout(() => {
        const childrenWrap = document.getElementById('childrenWrap');
        const dependantsWrap = document.getElementById('dependantsWrap');

        if (childrenWrap) childrenWrap.innerHTML = '';
        if (dependantsWrap) dependantsWrap.innerHTML = '';

        // Add children
        if (globalStateRef.current.dependants.children?.length > 0) {
          globalStateRef.current.dependants.children.forEach(() => {
            addEntry('children');
          });
        }

        // Add dependants
        if (globalStateRef.current.dependants.dependants_list?.length > 0) {
          globalStateRef.current.dependants.dependants_list.forEach(() => {
            addEntry('dependants');
          });
        }

        // Fill in data
        const allInputs = document.querySelectorAll('input, select, textarea');
        allInputs.forEach(input => {
          const tabData = currentTab === 'children'
            ? globalStateRef.current.dependants.children
            : globalStateRef.current.dependants.dependants_list;

          const entryIndex = [...input.closest('.entry')?.parentNode.querySelectorAll('.entry')].indexOf(input.closest('.entry'));
          if (tabData[entryIndex] && tabData[entryIndex][input.name]) {
            if (input.type === 'radio' || input.type === 'checkbox') {
              input.checked = input.value === tabData[entryIndex][input.name];
            } else {
              input.value = tabData[entryIndex][input.name];
            }
          }
        });

        setActiveIndex(globalStateRef.current.dependants.activeIndex || 0);
        updatePills();
        showOnlyActiveEntry();
      }, 50);
    }
  }, [loading, factFind?.id]);

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
        dependants: globalStateRef.current.dependants,
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      if (currentTab === 'children') {
        setCurrentTab('dependants');
      } else {
        navigate(createPageUrl('FactFindTrusts') + `?id=${factFind.id}`);
      }
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindAboutYou') + `?id=${factFind?.id || ''}`);
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="dependants" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  return (
    <FactFindLayout currentSection="dependants" factFind={factFind}>
      <FactFindHeader
        title="Dependants"
        description="Add children and other dependants."
        factFind={factFind}
        tabs={[
          { id: 'children', label: 'Children' },
          { id: 'dependants', label: 'Dependants' }
        ]}
        activeTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setActiveIndex(0);
          setTimeout(() => updatePills(), 0);
        }}
      />

      {/* Hidden Templates */}
      <div id="childTemplate" style={{ display: 'none' }}>
        <div className="entry bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="entry-head flex justify-between items-start mb-6">
            <div className="entry-title">
              <h3 className="text-lg font-bold text-slate-900">Child <span className="idx">1</span></h3>
              <p className="text-xs text-slate-500 mt-1">Fill in the details below</p>
            </div>
            <button type="button" className="entry-remove inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
              <span>✕</span>
              <span>Remove</span>
            </button>
          </div>
          <div className="form-grid space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Child name *</label>
                <input type="text" name="child_name" placeholder="e.g. Emma" className="w-full h-9 px-3 py-1 border border-slate-300 rounded-md bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date of birth</label>
                <input type="date" name="child_dob" className="w-full h-9 px-3 py-1 border border-slate-300 rounded-md bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
            <div className="pt-2">
              <label className="block text-sm font-semibold text-slate-700 mb-3">Financially dependent?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="child_fin_dep__1" value="1" className="w-4 h-4" />
                  <span className="text-sm text-slate-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="child_fin_dep__1" value="2" className="w-4 h-4" />
                  <span className="text-sm text-slate-700">No</span>
                </label>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Education status</label>
                <select name="child_edu" className="w-full h-9 px-3 py-1 border border-slate-300 rounded-md bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                <input type="number" name="child_fin_age" placeholder="e.g. 25" className="w-full h-9 px-3 py-1 border border-slate-300 rounded-md bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Health issues or concerns</label>
              <input type="text" name="child_health" placeholder="e.g. Asthma, food allergy" className="w-full h-9 px-3 py-1 border border-slate-300 rounded-md bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
        </div>
      </div>

      <div id="depTemplate" style={{ display: 'none' }}>
        <div className="entry bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="entry-head flex justify-between items-start mb-6">
            <div className="entry-title">
              <h3 className="text-lg font-bold text-slate-900">Dependant <span className="idx">1</span></h3>
              <p className="text-xs text-slate-500 mt-1">Fill in the details below</p>
            </div>
            <button type="button" className="entry-remove inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
              <span>✕</span>
              <span>Remove</span>
            </button>
          </div>
          <div className="form-grid space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Name *</label>
                <input type="text" name="dep_name" placeholder="e.g. Parent name" className="w-full h-9 px-3 py-1 border border-slate-300 rounded-md bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date of birth</label>
                <input type="date" name="dep_dob" className="w-full h-9 px-3 py-1 border border-slate-300 rounded-md bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Expected age of dependence until</label>
                <input type="number" name="dep_until_age" placeholder="e.g. 85" className="w-full h-9 px-3 py-1 border border-slate-300 rounded-md bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Relationship</label>
                <select name="dep_relationship" className="w-full h-9 px-3 py-1 border border-slate-300 rounded-md bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                  <input type="radio" name="dep_interdep" value="1" className="w-4 h-4" />
                  <span className="text-sm text-slate-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="dep_interdep" value="2" className="w-4 h-4" />
                  <span className="text-sm text-slate-700">No</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
          {/* Hidden containers - always rendered so addEntry can find them */}
          <div id="childrenWrap" className="space-y-4" style={{ display: globalStateRef.current.dependants.children?.length === 0 && currentTab === 'children' ? 'none' : '' }}>
          </div>
          <div id="dependantsWrap" className="space-y-4" style={{ display: globalStateRef.current.dependants.dependants_list?.length === 0 && currentTab === 'dependants' ? 'none' : '' }}>
          </div>

          {/* Welcome Screen - Show if no entries exist */}
          {globalStateRef.current.dependants[currentTab === 'children' ? 'children' : 'dependants_list']?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-5xl mb-6">
                {currentTab === 'children' ? '👨‍👩‍👧‍👦' : '👥'}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {currentTab === 'children' ? 'Do you have any children?' : 'Do you have any dependants?'}
              </h3>
              <p className="text-slate-600 text-center mb-8 max-w-md">
                {currentTab === 'children' 
                  ? 'Add information about your children to help us understand your family situation better.'
                  : 'Add information about your dependants so we can factor them into your financial plan.'}
              </p>
              <Button
                onClick={() => addEntry(currentTab)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
              >
                Add {currentTab === 'children' ? 'child' : 'dependant'}
              </Button>
            </div>
          ) : (
            <>
              {/* Pills Navigation - Horizontal Scrollable */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <div id={currentTab === 'children' ? 'childPills' : 'dependantPills'} className="flex gap-2">
                </div>
                <button
                  onClick={() => addEntry(currentTab)}
                  className="ml-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0 shadow-sm"
                >
                  + Add {currentTab === 'children' ? 'Child' : 'Dependant'}
                </button>
              </div>
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