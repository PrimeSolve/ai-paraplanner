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
import { ArrowRight, ArrowLeft, MessageSquare, RefreshCw, Info, Plus, Trash2, Edit2 } from 'lucide-react';

export default function FactFindDependants() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dependants, setDependants] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    date_of_birth: '',
    age: '',
    gender: '',
    financially_dependent: '',
    living_with_you: '',
    special_needs: '',
    notes: ''
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

  const handleAddDependant = () => {
    if (!formData.name || !formData.relationship) {
      toast.error('Please fill in name and relationship');
      return;
    }

    if (editingIndex !== null) {
      const updated = [...dependants];
      updated[editingIndex] = formData;
      setDependants(updated);
      setEditingIndex(null);
    } else {
      setDependants([...dependants, formData]);
    }

    setFormData({
      name: '',
      relationship: '',
      date_of_birth: '',
      age: '',
      gender: '',
      financially_dependent: '',
      living_with_you: '',
      special_needs: '',
      notes: ''
    });
  };

  const handleEdit = (index) => {
    setFormData(dependants[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
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
        dependants: { dependants_list: dependants },
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
    navigate(createPageUrl('FactFindPersonal') + `?id=${factFind?.id || ''}`);
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
        description="Tell us about anyone who is financially dependent on you."
        factFind={factFind}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="w-full space-y-4">
          {/* Add/Edit Form */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-bold text-slate-800 mb-4">
                {editingIndex !== null ? 'Edit Dependant' : 'Add a Dependant'}
              </h4>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Full name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Relationship</Label>
                  <Select value={formData.relationship} onValueChange={(value) => setFormData({ ...formData, relationship: value })}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="stepchild">Stepchild</SelectItem>
                      <SelectItem value="grandchild">Grandchild</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Date of birth</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Enter age"
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Financially dependent?</Label>
                  <Select value={formData.financially_dependent} onValueChange={(value) => setFormData({ ...formData, financially_dependent: value })}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="partially">Partially</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Living with you?</Label>
                  <Select value={formData.living_with_you} onValueChange={(value) => setFormData({ ...formData, living_with_you: value })}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes - full time</SelectItem>
                      <SelectItem value="part_time">Yes - part time</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">Special needs or circumstances</Label>
                <Input
                  value={formData.special_needs}
                  onChange={(e) => setFormData({ ...formData, special_needs: e.target.value })}
                  placeholder="e.g., Disability, medical condition, education needs"
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">Additional notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any other relevant information"
                  className="border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {editingIndex !== null && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingIndex(null);
                      setFormData({
                        name: '',
                        relationship: '',
                        date_of_birth: '',
                        age: '',
                        gender: '',
                        financially_dependent: '',
                        living_with_you: '',
                        special_needs: '',
                        notes: ''
                      });
                    }}
                    className="border-slate-300"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleAddDependant}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingIndex !== null ? 'Update Dependant' : 'Add Dependant'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* List of Dependants */}
          {dependants.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h4 className="font-bold text-slate-800 mb-4">
                  Your Dependants ({dependants.length})
                </h4>
                <div className="space-y-3">
                  {dependants.map((dep, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-slate-800">{dep.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                            {dep.relationship}
                          </span>
                          {dep.age && (
                            <span className="text-sm text-slate-600">Age {dep.age}</span>
                          )}
                        </div>
                        <div className="flex gap-4 text-xs text-slate-600">
                          {dep.financially_dependent && (
                            <span>Financial: {dep.financially_dependent}</span>
                          )}
                          {dep.living_with_you && (
                            <span>Living: {dep.living_with_you}</span>
                          )}
                        </div>
                        {dep.special_needs && (
                          <p className="text-xs text-slate-600 mt-1">
                            Special needs: {dep.special_needs}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(index)}
                          className="border-slate-300"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(index)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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