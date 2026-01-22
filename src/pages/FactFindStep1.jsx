import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import ProgressBar from '../components/factfind/ProgressBar';
import FormWrapper from '../components/factfind/FormWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function FactFindStep1() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [factFindId, setFactFindId] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    email: '',
    phone: '',
    address: '',
    marital_status: '',
    dependents: 0
  });

  useEffect(() => {
    const loadData = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      
      if (id) {
        try {
          const factFind = await base44.entities.FactFind.filter({ id });
          if (factFind[0]) {
            setFactFindId(id);
            if (factFind[0].personal_info) {
              setFormData(factFind[0].personal_info);
            }
          }
        } catch (error) {
          console.error('Error loading fact find:', error);
        }
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    if (!factFindId) return;
    
    setSaving(true);
    try {
      await base44.entities.FactFind.update(factFindId, {
        personal_info: formData,
        current_step: 1
      });
      toast.success('Progress saved successfully');
    } catch (error) {
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (!formData.full_name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await base44.entities.FactFind.update(factFindId, {
        personal_info: formData,
        current_step: 2
      });
      navigate(createPageUrl('FactFindStep2') + `?id=${factFindId}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div>
      <ProgressBar currentStep={1} />
      
      <FormWrapper
        title="Personal Information"
        description="Let's start with some basic information about you"
        onNext={handleNext}
        onSave={handleSave}
        isFirstStep={true}
        isLoading={saving}
      >
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Smith"
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth" className="text-slate-700">
                Date of Birth
              </Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="border-slate-300"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="border-slate-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-slate-700">
              Residential Address
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main Street, City, State, ZIP"
              className="border-slate-300"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="marital_status" className="text-slate-700">
                Marital Status
              </Label>
              <Select
                value={formData.marital_status}
                onValueChange={(value) => setFormData({ ...formData, marital_status: value })}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                  <SelectItem value="partnered">Partnered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependents" className="text-slate-700">
                Number of Dependents
              </Label>
              <Input
                id="dependents"
                type="number"
                min="0"
                value={formData.dependents}
                onChange={(e) => setFormData({ ...formData, dependents: parseInt(e.target.value) || 0 })}
                className="border-slate-300"
              />
            </div>
          </div>
        </div>
      </FormWrapper>
    </div>
  );
}