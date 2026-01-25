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
import { ArrowRight, ArrowLeft, MessageSquare, RefreshCw, Info, Plus, Trash2, Edit2, Baby, Users } from 'lucide-react';

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
  const [editingChildIndex, setEditingChildIndex] = useState(null);
  const [editingDependantIndex, setEditingDependantIndex] = useState(null);
  const [childFormData, setChildFormData] = useState({
    name: '',
    date_of_birth: '',
    financially_dependent: '',
    education_status: '',
    dependent_age: '',
    health_issues: ''
  });
  const [dependantFormData, setDependantFormData] = useState({
    name: '',
    date_of_birth: '',
    dependent_until_age: '',
    relationship: '',
    interdependency: ''
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

  const handleAddChild = () => {
    if (!childFormData.name) {
      toast.error('Please enter child name');
      return;
    }

    if (editingChildIndex !== null) {
      const updated = [...children];
      updated[editingChildIndex] = childFormData;
      setChildren(updated);
      setEditingChildIndex(null);
    } else {
      setChildren([...children, childFormData]);
    }

    setChildFormData({
      name: '',
      date_of_birth: '',
      financially_dependent: '',
      education_status: '',
      dependent_age: '',
      health_issues: ''
    });
    setShowChildForm(false);
  };

  const handleEditChild = (index) => {
    setChildFormData(children[index]);
    setEditingChildIndex(index);
    setShowChildForm(true);
  };

  const handleDeleteChild = (index) => {
    const updated = children.filter((_, i) => i !== index);
    setChildren(updated);
  };

  const handleAddDependant = () => {
    if (!dependantFormData.name) {
      toast.error('Please enter dependant name');
      return;
    }

    if (editingDependantIndex !== null) {
      const updated = [...dependants];
      updated[editingDependantIndex] = dependantFormData;
      setDependants(updated);
      setEditingDependantIndex(null);
    } else {
      setDependants([...dependants, dependantFormData]);
    }

    setDependantFormData({
      name: '',
      date_of_birth: '',
      dependent_until_age: '',
      relationship: '',
      interdependency: ''
    });
    setShowDependantForm(false);
  };

  const handleEditDependant = (index) => {
    setDependantFormData(dependants[index]);
    setEditingDependantIndex(index);
    setShowDependantForm(true);
  };

  const handleDeleteDependant = (index) => {
    const updated = dependants.filter((_, i) => i !== index);
    setDependants(updated);
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      const sectionsCompleted = factFind.sections_completed || [];
      if (!sectionsCompleted.includes('dependants')) {
        sectionsCompleted.push('dependants');
      }

      await base44.entities.FactFind.update(factFind.id, {
        dependants: { 
          children: children,
          dependants_list: dependants 
        },
        current_section: 'trusts',
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindTrusts') + `?id=${factFind.id}`);
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
              {!showChildForm && children.length === 0 && (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-8 text-center">
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

              {showChildForm && (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-slate-800">
                        {editingChildIndex !== null ? 'Edit Child' : 'Child Information'}
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowChildForm(false);
                          setEditingChildIndex(null);
                          setChildFormData({
                            name: '',
                            date_of_birth: '',
                            financially_dependent: '',
                            education_status: '',
                            dependent_age: '',
                            health_issues: ''
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
                          value={childFormData.name}
                          onChange={(e) => setChildFormData({ ...childFormData, name: e.target.value })}
                          placeholder="Enter child name"
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Child date of birth</Label>
                        <Input
                          type="date"
                          value={childFormData.date_of_birth}
                          onChange={(e) => setChildFormData({ ...childFormData, date_of_birth: e.target.value })}
                          className="border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Is child financially dependent?</Label>
                      <div className="flex gap-3">
                        {[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }].map(option => (
                          <button
                            key={option.value}
                            onClick={() => setChildFormData({ ...childFormData, financially_dependent: option.value })}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                              childFormData.financially_dependent === option.value
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
                        <Select value={childFormData.education_status} onValueChange={(value) => setChildFormData({ ...childFormData, education_status: value })}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                            <SelectItem value="tertiary">Tertiary</SelectItem>
                            <SelectItem value="tafe_trade">TAFE/Trade</SelectItem>
                            <SelectItem value="not_in_education">Not in education</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Financial Dependant Age</Label>
                        <Input
                          type="number"
                          value={childFormData.dependent_age}
                          onChange={(e) => setChildFormData({ ...childFormData, dependent_age: e.target.value })}
                          placeholder="Enter age"
                          className="border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Child health issues</Label>
                      <Input
                        value={childFormData.health_issues}
                        onChange={(e) => setChildFormData({ ...childFormData, health_issues: e.target.value })}
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
                        {editingChildIndex !== null ? 'Update Child' : 'Add Child'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {children.length > 0 && !showChildForm && (
                <>
                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={() => setShowChildForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Child
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {children.map((child, index) => (
                      <Card key={index} className="border-slate-200 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Baby className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-bold text-slate-800">Child {index + 1}</span>
                                </div>
                              <div className="space-y-1 text-sm text-slate-600">
                                <p><strong>Name:</strong> {child.name}</p>
                                {child.date_of_birth && <p><strong>DOB:</strong> {child.date_of_birth}</p>}
                                {child.financially_dependent && <p><strong>Financially Dependent:</strong> {child.financially_dependent}</p>}
                                {child.education_status && <p><strong>Education:</strong> {child.education_status}</p>}
                                {child.dependent_age && <p><strong>Dependent Age:</strong> {child.dependent_age}</p>}
                                {child.health_issues && <p><strong>Health Issues:</strong> {child.health_issues}</p>}
                              </div>
                            </div>
                            </div>
                            <div className="flex gap-2 ml-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditChild(index)}
                                className="border-slate-300"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteChild(index)}
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

          {/* Dependants Tab */}
          {activeTab === 'dependants' && (
            <>
              {!showDependantForm && dependants.length === 0 && (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-8 text-center">
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

              {showDependantForm && (
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-slate-800">
                        {editingDependantIndex !== null ? 'Edit Dependant' : 'Dependant Information'}
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowDependantForm(false);
                          setEditingDependantIndex(null);
                          setDependantFormData({
                            name: '',
                            date_of_birth: '',
                            dependent_until_age: '',
                            relationship: '',
                            interdependency: ''
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
                          value={dependantFormData.name}
                          onChange={(e) => setDependantFormData({ ...dependantFormData, name: e.target.value })}
                          placeholder="Enter dependant name"
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Dependant date of birth</Label>
                        <Input
                          type="date"
                          value={dependantFormData.date_of_birth}
                          onChange={(e) => setDependantFormData({ ...dependantFormData, date_of_birth: e.target.value })}
                          className="border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Age they are expected to be dependant until</Label>
                        <Input
                          type="number"
                          value={dependantFormData.dependent_until_age}
                          onChange={(e) => setDependantFormData({ ...dependantFormData, dependent_until_age: e.target.value })}
                          placeholder="Enter age"
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Dependant relationship</Label>
                        <Select value={dependantFormData.relationship} onValueChange={(value) => setDependantFormData({ ...dependantFormData, relationship: value })}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="relative">Relative</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Is there interdependency</Label>
                      <div className="flex gap-3">
                        {[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }].map(option => (
                          <button
                            key={option.value}
                            onClick={() => setDependantFormData({ ...dependantFormData, interdependency: option.value })}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                              dependantFormData.interdependency === option.value
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
                                <p><strong>Name:</strong> {dep.name}</p>
                                {dep.date_of_birth && <p><strong>DOB:</strong> {dep.date_of_birth}</p>}
                                {dep.dependent_until_age && <p><strong>Dependent Until Age:</strong> {dep.dependent_until_age}</p>}
                                {dep.relationship && <p><strong>Relationship:</strong> {dep.relationship}</p>}
                                {dep.interdependency && <p><strong>Interdependency:</strong> {dep.interdependency}</p>}
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
                      Continue
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