import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { useFactFind } from '../components/factfind/useFactFind';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Plus } from 'lucide-react';
import { dependantsApi } from '../api/dependantsApi';

/**
 * Persist dependants via the dedicated /dependants endpoint.
 * Mirrors the pattern used by principalsApi.save() for PersonalDetails.
 */
async function saveDependantsToApi(clientId, depState) {
  const localChildren = (depState.children || []).map(c => ({ ...c, dep_type: 'child' }));
  const localDeps = (depState.dependants_list || []).map(d => ({ ...d, dep_type: 'dependant' }));
  const localAll = [...localChildren, ...localDeps];

  // Fetch current server state to diff against
  const serverAll = await dependantsApi.getAll(clientId);
  const serverById = new Map((serverAll || []).filter(r => r.id).map(r => [r.id, r]));
  const localById = new Map(localAll.filter(r => r.id).map(r => [r.id, r]));

  // Delete server records not present locally
  for (const serverId of serverById.keys()) {
    if (!localById.has(serverId)) {
      await dependantsApi.remove(serverId);
    }
  }

  // Create or update local records
  for (const rec of localAll) {
    if (rec.id && serverById.has(rec.id)) {
      await dependantsApi.update(rec.id, { ...rec, client_id: clientId });
    } else {
      await dependantsApi.create({ ...rec, client_id: clientId });
    }
  }
}

export default function FactFindDependants() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading, clientId } = useFactFind();
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('children');
  const [activeIndex, setActiveIndex] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);
  const [dependantsCount, setDependantsCount] = useState(0);

  // Global state for form data
  const globalStateRef = React.useRef({
    dependants: {
      children: [],
      dependants_list: [],
      currentTab: 'children',
      activeIndex: 0
    }
  });

  // ============================================
  // CORE DOM MANIPULATION FUNCTIONS
  // ============================================

  const wrapForTab = useCallback((tab) => {
    const id = tab === 'children' ? 'childrenWrap' : 'dependantsWrap';
    return document.getElementById(id);
  }, []);

  const cloneTemplateDiv = useCallback((id) => {
    const src = document.getElementById(id);
    if (!src) {
      console.error(`Template not found: ${id}`);
      return null;
    }
    const tmp = document.createElement('div');
    tmp.innerHTML = (src.innerHTML || '').trim();
    return tmp.firstElementChild;
  }, []);

  // ============================================
  // READ DATA FROM DOM
  // ============================================

  const readTabToArray = useCallback((tab) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return [];

    const cards = [...wrap.querySelectorAll('.entry')];
    return cards.map((card) => {
      const data = {};
      const inputs = card.querySelectorAll('input, select, textarea');
      
      inputs.forEach(input => {
        // Handle radio buttons - normalize the name by removing suffix
        if (input.type === 'radio') {
          const baseName = input.name.replace(/__\d+$/, '');
          if (input.checked) {
            data[baseName] = input.value;
          }
        } else if (input.type === 'checkbox') {
          if (input.checked) {
            data[input.name] = input.value;
          }
        } else {
          data[input.name] = input.value;
        }
      });
      
      return data;
    });
  }, [wrapForTab]);

  // ============================================
  // RENUMBER ENTRIES
  // ============================================

  const renumber = useCallback((tab) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return;

    [...wrap.querySelectorAll('.entry')].forEach((card, i) => {
      const idxSpan = card.querySelector('.idx');
      if (idxSpan) idxSpan.textContent = i + 1;

      if (tab === 'children') {
        card.querySelectorAll('input[type="radio"][name^="child_fin_dep"]')
          .forEach(r => { r.name = 'child_fin_dep__' + (i + 1); });
      } else {
        card.querySelectorAll('input[type="radio"][name^="dep_interdep"]')
          .forEach(r => { r.name = 'dep_interdep__' + (i + 1); });
      }
    });
  }, [wrapForTab]);

  // ============================================
  // FILL CARD WITH DATA
  // ============================================

  const fillCardFromData = useCallback((card, tab, data) => {
    if (!data || !card) return;

    if (tab === 'children') {
      const nameInput = card.querySelector('input[name="child_name"]');
      if (nameInput && data.child_name) nameInput.value = data.child_name;

      const dobInput = card.querySelector('input[name="child_dob"]');
      if (dobInput && data.child_dob) dobInput.value = data.child_dob;

      const eduSelect = card.querySelector('select[name="child_edu"]');
      if (eduSelect && data.child_edu) eduSelect.value = data.child_edu;

      const finAgeInput = card.querySelector('input[name="child_fin_age"]');
      if (finAgeInput && data.child_fin_age) finAgeInput.value = data.child_fin_age;

      const healthInput = card.querySelector('input[name="child_health"]');
      if (healthInput && data.child_health) healthInput.value = data.child_health;

      // Radio: Financially dependent
      if (data.child_fin_dep) {
        const radios = card.querySelectorAll('input[type="radio"][name^="child_fin_dep"]');
        radios.forEach(r => {
          r.checked = r.value === data.child_fin_dep;
        });
      }
    } else {
      const nameInput = card.querySelector('input[name="dep_name"]');
      if (nameInput && data.dep_name) nameInput.value = data.dep_name;

      const dobInput = card.querySelector('input[name="dep_dob"]');
      if (dobInput && data.dep_dob) dobInput.value = data.dep_dob;

      const ageInput = card.querySelector('input[name="dep_until_age"]');
      if (ageInput && data.dep_until_age) ageInput.value = data.dep_until_age;

      const relSelect = card.querySelector('select[name="dep_relationship"]');
      if (relSelect && data.dep_relationship) relSelect.value = data.dep_relationship;

      // Radio: Interdependency
      if (data.dep_interdep) {
        const radios = card.querySelectorAll('input[type="radio"][name^="dep_interdep"]');
        radios.forEach(r => {
          r.checked = r.value === data.dep_interdep;
        });
      }
    }
  }, []);

  // ============================================
  // UPDATE PILL NAVIGATION
  // ============================================

  const updatePills = useCallback((tab, index) => {
    const pillsId = tab === 'children' ? 'childPills' : 'dependantPills';
    const pillsContainer = document.getElementById(pillsId);
    if (!pillsContainer) return;

    pillsContainer.innerHTML = '';
    const wrap = wrapForTab(tab);
    if (!wrap) return;

    const cards = [...wrap.querySelectorAll('.entry')];
    
    cards.forEach((card, i) => {
      const pill = document.createElement('button');
      const isActive = i === index;
      pill.type = 'button';

      let displayName = '';
      if (tab === 'children') {
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

      pill.className = `px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
        isActive
          ? 'bg-white border-blue-500 text-blue-700 shadow-sm'
          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
      }`;
      pill.textContent = displayName;

      pill.onclick = (e) => {
        e.preventDefault();
        setActiveIndex(i);
        showOnlyActiveEntry(tab, i);
      };

      pillsContainer.appendChild(pill);
    });
  }, [wrapForTab]);

  // ============================================
  // SHOW ONLY ACTIVE ENTRY
  // ============================================

  const showOnlyActiveEntry = useCallback((tab, index) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return;

    const cards = [...wrap.querySelectorAll('.entry')];
    cards.forEach((card, i) => {
      card.style.display = i === index ? '' : 'none';
    });
  }, [wrapForTab]);

  // ============================================
  // ADD ENTRY
  // ============================================

  const addEntry = useCallback((tab, existingData = null) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return;

    const templateId = tab === 'children' ? 'childTemplate' : 'depTemplate';
    const node = cloneTemplateDiv(templateId);
    if (!node) return;

    wrap.appendChild(node);

    // Fill with existing data if provided
    if (existingData) {
      fillCardFromData(node, tab, existingData);
    }

    // Setup remove button
    const removeBtn = node.querySelector('.entry-remove');
    if (removeBtn) {
      removeBtn.onclick = (e) => {
        e.preventDefault();
        removeEntry(node, tab);
      };
    }

    renumber(tab);
    const newCount = wrap.querySelectorAll('.entry').length;
    if (tab === 'children') {
      setChildrenCount(newCount);
    } else {
      setDependantsCount(newCount);
    }

    const newIndex = newCount - 1;
    setActiveIndex(newIndex);
    
    // Use setTimeout to ensure state updates before showing entry
    setTimeout(() => {
      updatePills(tab, newIndex);
      showOnlyActiveEntry(tab, newIndex);
    }, 0);
  }, [wrapForTab, cloneTemplateDiv, fillCardFromData, renumber, updatePills, showOnlyActiveEntry]);

  // ============================================
  // REMOVE ENTRY
  // ============================================

  const removeEntry = useCallback(async (node, tab) => {
    node.remove();
    const wrap = wrapForTab(tab);
    if (!wrap) return;
    const remaining = wrap.querySelectorAll('.entry').length;
    renumber(tab);
    
    if (tab === 'children') {
      setChildrenCount(remaining);
    } else {
      setDependantsCount(remaining);
    }

    if (remaining > 0) {
      const newIndex = Math.max(0, remaining - 1);
      setActiveIndex(newIndex);
      showOnlyActiveEntry(tab, newIndex);
      updatePills(tab, newIndex);
    } else {
      setActiveIndex(0);
    }

    // Save to database immediately via dedicated dependants endpoint
    if (clientId) {
      globalStateRef.current.dependants.children = readTabToArray('children');
      globalStateRef.current.dependants.dependants_list = readTabToArray('dependants');
      globalStateRef.current.dependants.currentTab = currentTab;
      globalStateRef.current.dependants.activeIndex = activeIndex;

      await saveDependantsToApi(clientId, globalStateRef.current.dependants);
    }
  }, [wrapForTab, renumber, showOnlyActiveEntry, updatePills, factFind?.id, readTabToArray, currentTab, activeIndex, clientId]);

  // ============================================
  // LOAD USER AND SYNC FACTFIND
  // ============================================

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  // When FactFind loads, fetch dependants from the dedicated /dependants endpoint
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    (async () => {
      try {
        const records = await dependantsApi.getAll(clientId);
        if (cancelled) return;
        const arr = Array.isArray(records) ? records : [];
        const children = arr.filter(d => d.dep_type === 'child').map(({ dep_type, ...rest }) => rest);
        const deps = arr.filter(d => d.dep_type === 'dependant').map(({ dep_type, ...rest }) => rest);
        globalStateRef.current.dependants = { children, dependants_list: deps, currentTab: 'children', activeIndex: 0 };
      } catch (err) {
        console.error('[FactFindDependants] Failed to load dependants from API:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  // ============================================
  // SETUP INPUT LISTENERS
  // ============================================

  const setupInputListeners = useCallback(() => {
    document.addEventListener('input', (e) => {
      if (e.target.matches('input[name="child_name"], input[name="dep_name"]')) {
        updatePills(currentTab, activeIndex);
      }

      clearTimeout(window._depSaveTimeout);
      window._depSaveTimeout = setTimeout(() => {
        saveDependantsState();
      }, 500);
    });
  }, [currentTab, activeIndex]);

  // ============================================
  // SAVE STATE
  // ============================================

  const saveDependantsState = useCallback(async () => {
    if (!clientId) return;

    try {
      globalStateRef.current.dependants.children = readTabToArray('children');
      globalStateRef.current.dependants.dependants_list = readTabToArray('dependants');
      globalStateRef.current.dependants.currentTab = currentTab;
      globalStateRef.current.dependants.activeIndex = activeIndex;

      await saveDependantsToApi(clientId, globalStateRef.current.dependants);
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [clientId, readTabToArray, currentTab, activeIndex]);

  // ============================================
  // INITIALIZE DOM
  // ============================================

  useEffect(() => {
    setupInputListeners();
  }, [currentTab, activeIndex]);

  useEffect(() => {
    if (!ffLoading && factFind?.id) {
      setTimeout(() => {
        const childrenWrap = document.getElementById('childrenWrap');
        const dependantsWrap = document.getElementById('dependantsWrap');

        if (childrenWrap) childrenWrap.innerHTML = '';
        if (dependantsWrap) dependantsWrap.innerHTML = '';

        // Add children with existing data
        if (globalStateRef.current.dependants.children?.length > 0) {
          globalStateRef.current.dependants.children.forEach((childData) => {
            addEntry('children', childData);
          });
        }

        // Add dependants with existing data
        if (globalStateRef.current.dependants.dependants_list?.length > 0) {
          globalStateRef.current.dependants.dependants_list.forEach((depData) => {
            addEntry('dependants', depData);
          });
        }

        setActiveIndex(globalStateRef.current.dependants.activeIndex || 0);
        updatePills(currentTab, globalStateRef.current.dependants.activeIndex || 0);
        showOnlyActiveEntry(currentTab, globalStateRef.current.dependants.activeIndex || 0);
      }, 50);
    }
  }, [ffLoading, factFind?.id, addEntry, updatePills, showOnlyActiveEntry, currentTab]);

  // ============================================
  // NAVIGATION
  // ============================================

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

      await saveDependantsToApi(clientId, globalStateRef.current.dependants);

      // Update sections completed separately
      await base44.entities.FactFind.update(factFind.id, {
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

  if (ffLoading) {
    return (
      <FactFindLayout currentSection="dependants" factFindId={factFind?.id}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  return (
    <FactFindLayout currentSection="dependants" factFindId={factFind?.id}>
      <FactFindHeader
        title="Dependants"
        description="Add children and other dependants."
        factFind={factFind}
        user={user}
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
                  <input type="radio" name="dep_interdep__1" value="1" className="w-4 h-4" />
                  <span className="text-sm text-slate-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="dep_interdep__1" value="2" className="w-4 h-4" />
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
         {/* Tabs - Part of form content */}
         <div className="flex gap-2">
           <button
             onClick={() => {
               setCurrentTab('children');
               setActiveIndex(0);
               setTimeout(() => updatePills('children', 0), 0);
             }}
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
             onClick={() => {
               setCurrentTab('dependants');
               setActiveIndex(0);
               setTimeout(() => updatePills('dependants', 0), 0);
             }}
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

         {/* Containers - Always exist, visibility based on active tab */}
         <div id="childrenWrap" className="space-y-4" style={{ display: currentTab === 'children' ? 'block' : 'none' }} />
         <div id="dependantsWrap" className="space-y-4" style={{ display: currentTab === 'dependants' ? 'block' : 'none' }} />

          {/* Welcome Screen */}
          {(currentTab === 'children' ? childrenCount : dependantsCount) === 0 ? (
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
                onClick={() => addEntry(currentTab)}
                className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add {currentTab === 'children' ? 'child' : 'dependant'}
              </button>
            </div>
          ) : (
            <>
              {/* Pills Navigation - SEPARATED: Items left, Add right */}
              <div className="flex items-center justify-between mb-4">
                <div id={currentTab === 'children' ? 'childPills' : 'dependantPills'} className="flex items-center gap-2" />
                <button
                  onClick={() => addEntry(currentTab)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add {currentTab === 'children' ? 'Child' : 'Dependant'}
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