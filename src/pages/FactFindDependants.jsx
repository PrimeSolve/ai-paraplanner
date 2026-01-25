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
import { ArrowRight, ArrowLeft, MessageSquare, RefreshCw, Info, Plus, Trash2, Edit2, Baby, Users, UserCircle } from 'lucide-react';

export default function FactFindDependants() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('children');
  const [children, setChildren] = useState([]);
  const [dependants, setDependants] = useState([]);
  const [showChildForm, setShowChildForm] = useState(false);
  const [showDependantForm, setShowDependantForm] = useState(false);
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

    try {
      let updated;
      if (selectedChildIndex !== null) {
        updated = [...children];
        updated[selectedChildIndex] = childFormData;
        setChildren(updated);
      } else {
        updated = [...children, childFormData];
        setChildren(updated);
        setSelectedChildIndex(updated.length - 1);
      }

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

      toast.success(selectedChildIndex !== null ? 'Child updated' : 'Child added');
    } catch (error) {
      toast.error('Failed to save child');
      console.error(error);
    }

    setChildFormData({
      child_name: '',
      child_dob: '',
      child_fin_dep: '',
      child_edu: '',
      child_fin_age: '',
      child_health: ''
    });
    setShowChildForm(false);
  };

  const handleSelectChild = (index) => {
    setSelectedChildIndex(index);
    setChildFormData(children[index]);
  };

  const handleDeleteChild = async (index) => {
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

      setSelectedChildIndex(null);
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

    try {
      let updated;
      if (selectedDependantIndex !== null) {
        updated = [...dependants];
        updated[selectedDependantIndex] = dependantFormData;
        setDependants(updated);
      } else {
        updated = [...dependants, dependantFormData];
        setDependants(updated);
        setSelectedDependantIndex(updated.length - 1);
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
    setShowDependantForm(false);
  };

  const handleSelectDependant = (index) => {
    setSelectedDependantIndex(index);
    setDependantFormData(dependants[index]);
  };

  const handleDeleteDependant = async (index) => {
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
      
      // If on children tab, switch to dependants tab; otherwise go to trusts
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
              {children.length > 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {children.map((child, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectChild(index)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedChildIndex === index
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {child.child_name || `Child ${index + 1}`}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedChildIndex(null);
                      setChildFormData({
                        child_name: '',
                        child_dob: '',
                        child_fin_dep: '',
                        child_edu: '',
                        child_fin_age: '',
                        child_health: ''
                      });
                      setShowChildForm(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add Child
                  </button>
                </div>
              )}

              {children.length === 0 && !showChildForm && (
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
                      onClick={() => setShowChildForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Child
                    </Button>
                  </CardContent>
                </Card>
              )}

              {(showChildForm || selectedChildIndex !== null) && (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-slate-800">
                        {selectedChildIndex !== null ? 'Edit Child' : 'Child Information'}
                      </h4>
                      {selectedChildIndex !== null && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteChild(selectedChildIndex)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowChildForm(false);
                          setSelectedChildIndex(null);
                          setChildFormData({
                            child_name: '',
                            child_dob: '',
                            child_fin_dep: '',
                            child_edu: '',
                            child_fin_age: '',
                            child_health: ''
                          });
                        }}
                        className="border-slate-300"
                      >
                        Cancel
                      </Button>
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

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleAddChild}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {selectedChildIndex !== null ? 'Update Child' : 'Add Child'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}


            </>
          )}

          {/* Dependants Tab */}
          {activeTab === 'dependants' && (
            <>
              {dependants.length > 0 && (
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
                      setDependantFormData({
                        dep_name: '',
                        dep_dob: '',
                        dep_until_age: '',
                        dep_relationship: '',
                        dep_interdep: ''
                      });
                      setShowDependantForm(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add Dependant
                  </button>
                </div>
              )}

              {dependants.length === 0 && !showDependantForm && (
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
                      onClick={() => setShowDependantForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Dependant
                    </Button>
                  </CardContent>
                </Card>
              )}

              {(showDependantForm || selectedDependantIndex !== null) && (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-slate-800">
                        {selectedDependantIndex !== null ? 'Edit Dependant' : 'Dependant Information'}
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowDependantForm(false);
                          setEditingDependantIndex(null);
                          setDependantFormData({
                            dep_name: '',
                            dep_dob: '',
                            dep_until_age: '',
                            dep_relationship: '',
                            dep_interdep: ''
                          });
                        }}
                        className="border-slate-300"
                      >
                        Cancel
                      </Button>
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

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleAddDependant}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {editingDependantIndex !== null ? 'Update Dependant' : 'Add Dependant'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {dependants.length > 0 && !showDependantForm && (
                <>
                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={() => setShowDependantForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Dependant
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {dependants.map((dep, index) => (
                      <Card key={index} className="border-slate-200 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-bold text-slate-800">Dependant {index + 1}</span>
                                </div>
                              <div className="space-y-1 text-sm text-slate-600">
                                <p><strong>Name:</strong> {dep.dep_name}</p>
                                {dep.dep_dob && <p><strong>DOB:</strong> {dep.dep_dob}</p>}
                                {dep.dep_until_age && <p><strong>Dependent Until Age:</strong> {dep.dep_until_age}</p>}
                                {dep.dep_relationship && <p><strong>Relationship:</strong> {['Child', 'Parent', 'Relative', 'Other'][parseInt(dep.dep_relationship) - 1]}</p>}
                                {dep.dep_interdep && <p><strong>Interdependency:</strong> {dep.dep_interdep === '1' ? 'Yes' : 'No'}</p>}
                              </div>
                            </div>
                            </div>
                            <div className="flex gap-2 ml-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditDependant(index)}
                                className="border-slate-300"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteDependant(index)}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
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