import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Plus } from 'lucide-react';

export default function FactFindDependants() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('children');
  const [children, setChildren] = useState([]);
  const [dependants, setDependants] = useState([]);

  const [selectedChildIndex, setSelectedChildIndex] = useState(null);
  const [selectedDependantIndex, setSelectedDependantIndex] = useState(null);
  const [childFormData, setChildFormData] = useState({
    child_name: '',
    child_dob: '',
    child_fin_dep: '',
    child_edu: '',
    child_fin_age: '',
    child_health: ''
  });
  const [dependantFormData, setDependantFormData] = useState({
    dep_name: '',
    dep_dob: '',
    dep_until_age: '',
    dep_relationship: '',
    dep_interdep: ''
  });
  const [isAddingDependant, setIsAddingDependant] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (id) {
          const finds = await base44.entities.FactFind.filter({ id });
          if (finds[0]) {
            setFactFind(finds[0]);
            if (finds[0].dependants?.children) {
              setChildren(finds[0].dependants.children);
              setSelectedChildIndex(0);
              setChildFormData(finds[0].dependants.children[0] || {
                child_name: '',
                child_dob: '',
                child_fin_dep: '',
                child_edu: '',
                child_fin_age: '',
                child_health: ''
              });
            }
            if (finds[0].dependants?.dependants_list) {
              setDependants(finds[0].dependants.dependants_list);
            }
          }
        }
      } catch (error) {
        console.error('Error loading fact find:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddChild = async () => {
    if (!childFormData.child_name) {
      toast.error('Please enter child name');
      return;
    }

    if (!factFind || !factFind.id) {
      toast.error('Unable to save data');
      return;
    }

    try {
      const isNewChild = selectedChildIndex >= children.length;
      let updated = [...children];
      
      if (isNewChild) {
        updated.push(childFormData);
      } else {
        updated[selectedChildIndex] = childFormData;
      }

      // Auto-save to database
      const sectionsCompleted = (factFind.sections_completed || []);
      if (!sectionsCompleted.includes('dependants')) {
        sectionsCompleted.push('dependants');
      }
      await base44.entities.FactFind.update(factFind.id, {
        dependants: { 
          children: updated,
          dependants_list: dependants 
        },
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      setChildren(updated);
      if (isNewChild) {
        setSelectedChildIndex(updated.length - 1);
      }
      toast.success(isNewChild ? 'Child added' : 'Child updated');
    } catch (error) {
      toast.error('Failed to save child');
      console.error(error);
    }
  };

  const handleDeleteChild = async (index) => {
    if (!factFind?.id) {
      toast.error('Unable to save data');
      return;
    }

    try {
      const updated = children.filter((_, i) => i !== index);
      setChildren(updated);

      // Auto-save to database
      const sectionsCompleted = factFind.sections_completed || [];
      if (!sectionsCompleted.includes('dependants')) {
        sectionsCompleted.push('dependants');
      }
      await base44.entities.FactFind.update(factFind.id, {
        dependants: { 
          children: updated,
          dependants_list: dependants 
        },
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      if (selectedChildIndex === index) {
        setSelectedChildIndex(Math.max(0, updated.length - 1));
        if (updated.length > 0) {
          setChildFormData(updated[Math.max(0, updated.length - 1)]);
        }
      }
      toast.success('Child removed');
    } catch (error) {
      toast.error('Failed to delete child');
      console.error(error);
    }
  };

  const handleAddDependant = async () => {
    if (!dependantFormData.dep_name) {
      toast.error('Please enter dependant name');
      return;
    }

    if (!factFind?.id) {
      toast.error('Unable to save data');
      return;
    }

    try {
      let updated;
      if (selectedDependantIndex !== null) {
        updated = [...dependants];
        updated[selectedDependantIndex] = dependantFormData;
        setDependants(updated);
      } else {
        updated = [...dependants, dependantFormData];
        setDependants(updated);
      }

      // Auto-save to database
      const sectionsCompleted = factFind.sections_completed || [];
      if (!sectionsCompleted.includes('dependants')) {
        sectionsCompleted.push('dependants');
      }
      await base44.entities.FactFind.update(factFind.id, {
        dependants: { 
          children: children,
          dependants_list: updated 
        },
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      toast.success(selectedDependantIndex !== null ? 'Dependant updated' : 'Dependant added');
    } catch (error) {
      toast.error('Failed to save dependant');
      console.error(error);
    }

    setDependantFormData({
      dep_name: '',
      dep_dob: '',
      dep_until_age: '',
      dep_relationship: '',
      dep_interdep: ''
    });
    setIsAddingDependant(false);
  };

  const handleSelectDependant = (index) => {
    setSelectedDependantIndex(index);
    setDependantFormData(dependants[index]);
  };

  const handleDeleteDependant = async (index) => {
    if (!factFind?.id) {
      toast.error('Unable to save data');
      return;
    }

    try {
      const updated = dependants.filter((_, i) => i !== index);
      setDependants(updated);

      // Auto-save to database
      const sectionsCompleted = factFind.sections_completed || [];
      if (!sectionsCompleted.includes('dependants')) {
        sectionsCompleted.push('dependants');
      }
      await base44.entities.FactFind.update(factFind.id, {
        dependants: { 
          children: children,
          dependants_list: updated 
        },
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      setSelectedDependantIndex(null);
      setIsAddingDependant(false);
      toast.success('Dependant removed');
    } catch (error) {
      toast.error('Failed to delete dependant');
      console.error(error);
    }
  };

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

      const updateData = {
        dependants: { 
          children: children,
          dependants_list: dependants 
        },
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      };

      await base44.entities.FactFind.update(factFind.id, updateData);
      
      if (activeTab === 'children') {
        setActiveTab('dependants');
      } else {
        const url = createPageUrl('FactFindTrusts') + `?id=${factFind.id}`;
        navigate(url);
      }
    } catch (error) {
      toast.error('Failed to save data: ' + error.message);
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

  const isAddingChild = selectedChildIndex >= children.length;

  return (
    <FactFindLayout currentSection="dependants" factFind={factFind}>
      <FactFindHeader
        title="Dependants"
        description="Add children and other dependants. You can add multiple entries under each tab."
        factFind={factFind}
        tabs={[
          { id: 'children', label: 'Children' },
          { id: 'dependants', label: 'Dependants' }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="w-full space-y-4">
          {/* Children Tab */}
          {activeTab === 'children' && (
            <>
              {children.length === 0 && !isAddingChild ? (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6972a3fd8e7c6c1f67cdacab/a5dbbe56a_image.png" 
                        alt="Child" 
                        className="w-40"
                      />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-2 text-lg">Do you have any children?</h4>
                    <p className="text-slate-600 mb-6">Add details about your children to help us understand your family situation.</p>
                    <Button
                      onClick={() => {
                        setSelectedChildIndex(0);
                        setChildFormData({
                          child_name: '',
                          child_dob: '',
                          child_fin_dep: '',
                          child_edu: '',
                          child_fin_age: '',
                          child_health: ''
                        });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Child
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6 space-y-6">
                    {/* Child tabs header */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-800">Children Information</h4>
                      <div className="flex gap-2 items-center flex-wrap">
                        {children.map((child, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedChildIndex(index);
                              setChildFormData(children[index]);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              selectedChildIndex === index
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {child.child_name || `Child ${index + 1}`}
                          </button>
                        ))}
                        {isAddingChild && (
                          <button
                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600 text-white"
                          >
                            Child {children.length + 1}
                          </button>
                        )}
                        <Button
                          onClick={() => {
                            const newIndex = children.length;
                            setSelectedChildIndex(newIndex);
                            setChildFormData({
                              child_name: '',
                              child_dob: '',
                              child_fin_dep: '',
                              child_edu: '',
                              child_fin_age: '',
                              child_health: ''
                            });
                          }}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Child
                        </Button>
                      </div>
                    </div>

                    {/* Form section */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-slate-700">
                          {isAddingChild ? 'New Child' : `Child ${selectedChildIndex + 1}`}
                        </h5>
                        {!isAddingChild && (
                          <Button
                            onClick={() => handleDeleteChild(selectedChildIndex)}
                            variant="destructive"
                            size="sm"
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-sm">Child name</Label>
                          <Input
                            value={childFormData.child_name}
                            onChange={(e) => setChildFormData({ ...childFormData, child_name: e.target.value })}
                            placeholder="Enter child name"
                            className="border-slate-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-sm">Child date of birth</Label>
                          <Input
                            type="date"
                            value={childFormData.child_dob}
                            onChange={(e) => setChildFormData({ ...childFormData, child_dob: e.target.value })}
                            className="border-slate-300"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Is child financially dependent?</Label>
                        <div className="flex gap-3">
                          {[{ label: 'Yes', value: '1' }, { label: 'No', value: '2' }].map(option => (
                            <button
                              key={option.value}
                              onClick={() => setChildFormData({ ...childFormData, child_fin_dep: option.value })}
                              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                                childFormData.child_fin_dep === option.value
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-sm">Education status</Label>
                          <Select value={childFormData.child_edu} onValueChange={(value) => setChildFormData({ ...childFormData, child_edu: value })}>
                            <SelectTrigger className="border-slate-300">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Primary</SelectItem>
                              <SelectItem value="2">Secondary</SelectItem>
                              <SelectItem value="3">Tertiary</SelectItem>
                              <SelectItem value="4">TAFE/Trade</SelectItem>
                              <SelectItem value="5">Not in education</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-sm">Financial Dependant Age</Label>
                          <Input
                            type="number"
                            value={childFormData.child_fin_age}
                            onChange={(e) => setChildFormData({ ...childFormData, child_fin_age: e.target.value })}
                            placeholder="Enter age"
                            className="border-slate-300"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Child health issues</Label>
                        <Input
                          value={childFormData.child_health}
                          onChange={(e) => setChildFormData({ ...childFormData, child_health: e.target.value })}
                          placeholder="Enter any health issues"
                          className="border-slate-300"
                        />
                      </div>

                      {isAddingChild && (
                        <div className="flex justify-end pt-4 border-t">
                          <Button
                            onClick={handleAddChild}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Add Child
                          </Button>
                        </div>
                      )}
                      </div>
                      </CardContent>
                      </Card>
              )}
            </>
          )}

          {/* Dependants Tab */}
          {activeTab === 'dependants' && (
            <>
              {dependants.length > 0 && !isAddingDependant && selectedDependantIndex === null && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {dependants.map((dep, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectDependant(index)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedDependantIndex === index
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {dep.dep_name || `Dependant ${index + 1}`}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedDependantIndex(null);
                      setIsAddingDependant(true);
                      setDependantFormData({
                        dep_name: '',
                        dep_dob: '',
                        dep_until_age: '',
                        dep_relationship: '',
                        dep_interdep: ''
                      });
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add Dependant
                  </button>
                </div>
              )}

              {dependants.length === 0 && !isAddingDependant && (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6972a3fd8e7c6c1f67cdacab/7b9c67890_image.png" 
                        alt="Dependant" 
                        className="w-40"
                      />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-2 text-lg">Do you have any dependants?</h4>
                    <p className="text-slate-600 mb-6">Add details about other financial dependants, such as parents or relatives.</p>
                    <Button
                      onClick={() => {
                        setSelectedDependantIndex(null);
                        setIsAddingDependant(true);
                        setDependantFormData({
                          dep_name: '',
                          dep_dob: '',
                          dep_until_age: '',
                          dep_relationship: '',
                          dep_interdep: ''
                        });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Dependant
                    </Button>
                  </CardContent>
                </Card>
              )}

              {isAddingDependant && (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <h4 className="font-bold text-slate-800">Dependant Information</h4>
                      {dependants.length > 0 && (
                        <span className="text-slate-600">— {dependants.map(d => d.dep_name).join(', ')}</span>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label className="text-slate-700 font-semibold text-sm">Dependant name</Label>
                         <Input
                           value={dependantFormData.dep_name}
                           onChange={(e) => setDependantFormData({ ...dependantFormData, dep_name: e.target.value })}
                           placeholder="Enter dependant name"
                           className="border-slate-300"
                         />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-slate-700 font-semibold text-sm">Dependant date of birth</Label>
                         <Input
                           type="date"
                           value={dependantFormData.dep_dob}
                           onChange={(e) => setDependantFormData({ ...dependantFormData, dep_dob: e.target.value })}
                           className="border-slate-300"
                         />
                       </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label className="text-slate-700 font-semibold text-sm">Age expected dependant until</Label>
                         <Input
                           type="number"
                           value={dependantFormData.dep_until_age}
                           onChange={(e) => setDependantFormData({ ...dependantFormData, dep_until_age: e.target.value })}
                           placeholder="Enter age"
                           className="border-slate-300"
                         />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-slate-700 font-semibold text-sm">Dependant relationship</Label>
                         <Select value={dependantFormData.dep_relationship} onValueChange={(value) => setDependantFormData({ ...dependantFormData, dep_relationship: value })}>
                           <SelectTrigger className="border-slate-300">
                             <SelectValue placeholder="Select..." />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="1">Child</SelectItem>
                             <SelectItem value="2">Parent</SelectItem>
                             <SelectItem value="3">Relative</SelectItem>
                             <SelectItem value="4">Other</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-slate-700 font-semibold text-sm">Is there interdependency</Label>
                       <div className="flex gap-3">
                         {[{ label: 'Yes', value: '1' }, { label: 'No', value: '2' }].map(option => (
                           <button
                             key={option.value}
                             onClick={() => setDependantFormData({ ...dependantFormData, dep_interdep: option.value })}
                             className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                               dependantFormData.dep_interdep === option.value
                                 ? 'bg-blue-600 text-white border-blue-600'
                                 : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                             }`}
                           >
                             {option.label}
                           </button>
                         ))}
                       </div>
                     </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddingDependant(false);
                          setDependantFormData({
                            dep_name: '',
                            dep_dob: '',
                            dep_until_age: '',
                            dep_relationship: '',
                            dep_interdep: ''
                          });
                        }}
                        className="border-slate-300 text-slate-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddDependant}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Add Dependant
                      </Button>
                    </div>
                    </CardContent>
                  </Card>
                  )}
            </>
          )}

          {/* Navigation - always visible */}
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
                      Save and Continue
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