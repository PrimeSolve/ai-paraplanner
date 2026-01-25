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

  const updatePills = () => {
    const pillsContainer = document.getElementById(currentTab === 'children' ? 'childPills' : 'dependantPills');
    if (!pillsContainer) return;

    pillsContainer.innerHTML = '';
    const wrap = wrapForTab(currentTab);
    if (!wrap) return;

    const cards = [...wrap.querySelectorAll('.entry')];
    cards.forEach((card, i) => {
      const pill = document.createElement('button');
      pill.className = 'pill' + (i === activeIndex ? ' active' : '');
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

      pill.textContent = displayName;
      pill.onclick = (e) => {
        e.preventDefault();
        setActiveIndex(i);
        updatePills();
        showOnlyActiveEntry();
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
    setActiveIndex(wrap.querySelectorAll('.entry').length - 1);
    updatePills();
    showOnlyActiveEntry();
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
        <div className="entry border rounded-lg p-4 mb-4">
          <div className="entry-head flex justify-between items-center mb-4">
            <div className="entry-title font-bold text-slate-800">Child <span className="idx">1</span></div>
            <button type="button" className="entry-remove px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm">Remove</button>
          </div>
          <div className="form-grid space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Child name</label>
                <input type="text" name="child_name" placeholder="Enter child name" className="w-full border border-slate-300 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date of birth</label>
                <input type="date" name="child_dob" className="w-full border border-slate-300 rounded px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Financially dependent?</label>
              <div className="flex gap-3">
                <label><input type="radio" name="child_fin_dep__1" value="1" /> Yes</label>
                <label><input type="radio" name="child_fin_dep__1" value="2" /> No</label>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Education status</label>
                <select name="child_edu" className="w-full border border-slate-300 rounded px-3 py-2">
                  <option value="">Select...</option>
                  <option value="1">Primary</option>
                  <option value="2">Secondary</option>
                  <option value="3">Tertiary</option>
                  <option value="4">TAFE/Trade</option>
                  <option value="5">Not in education</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Financial Dependant Age</label>
                <input type="number" name="child_fin_age" placeholder="Enter age" className="w-full border border-slate-300 rounded px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Health issues</label>
              <input type="text" name="child_health" placeholder="Enter any health issues" className="w-full border border-slate-300 rounded px-3 py-2" />
            </div>
          </div>
        </div>
      </div>

      <div id="depTemplate" style={{ display: 'none' }}>
        <div className="entry border rounded-lg p-4 mb-4">
          <div className="entry-head flex justify-between items-center mb-4">
            <div className="entry-title font-bold text-slate-800">Dependant <span className="idx">1</span></div>
            <button type="button" className="entry-remove px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm">Remove</button>
          </div>
          <div className="form-grid space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                <input type="text" name="dep_name" placeholder="Enter name" className="w-full border border-slate-300 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date of birth</label>
                <input type="date" name="dep_dob" className="w-full border border-slate-300 rounded px-3 py-2" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Age expected dependant until</label>
                <input type="number" name="dep_until_age" placeholder="Enter age" className="w-full border border-slate-300 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Relationship</label>
                <select name="dep_relationship" className="w-full border border-slate-300 rounded px-3 py-2">
                  <option value="">Select...</option>
                  <option value="1">Child</option>
                  <option value="2">Parent</option>
                  <option value="3">Relative</option>
                  <option value="4">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Is there interdependency</label>
              <div className="flex gap-3">
                <label><input type="radio" name="dep_interdep" value="1" /> Yes</label>
                <label><input type="radio" name="dep_interdep" value="2" /> No</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="w-full space-y-4">
          {/* Pills Navigation */}
          <div id={currentTab === 'children' ? 'childPills' : 'dependantPills'} className="flex gap-2 flex-wrap">
          </div>

          {/* Add button */}
          <button
            onClick={() => addEntry(currentTab)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Add {currentTab === 'children' ? 'Child' : 'Dependant'}
          </button>

          {/* Entries Container */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div id={currentTab === 'children' ? 'childrenWrap' : 'dependantsWrap'}>
                {/* Entries will be added here */}
              </div>
            </CardContent>
          </Card>

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