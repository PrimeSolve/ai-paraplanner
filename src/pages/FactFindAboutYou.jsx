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
import { ArrowRight, ArrowLeft, MessageSquare, RefreshCw, Info, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const subSections = [
  { id: 'basic', label: 'Basic details' },
  { id: 'contact', label: 'Contact' },
  { id: 'health', label: 'Health' },
  { id: 'employment', label: 'Employment' },
  { id: 'estate', label: 'Estate planning' },
  { id: 'centrelink', label: 'Centrelink' }
];

export default function FactFindPersonal() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('client');
  const [activeSubSection, setActiveSubSection] = useState('basic');
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    // Basic
    first_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    marital_status: '',
    living_status: '',
    resident_status: '',
    // Contact
    address: '',
    suburb: '',
    state: '',
    country: 'Australia',
    postcode: '',
    mobile: '',
    email: '',
    // Health
    health_status: '',
    smoker_status: '',
    health_insurance: '',
    health_issues: '',
    // Employment
    employment_status: '',
    occupation: '',
    hours_per_week: '',
    occupation_type: '',
    annual_leave: '',
    sick_leave: '',
    long_service_leave: '',
    employer_name: '',
    employment_length: '',
    // Estate
    has_will: '',
    will_updated: '',
    testamentary_trust: '',
    power_of_attorney: '',
    // Centrelink
    centrelink_benefits: '',
    benefit_type: '',
    concession_cards: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (id) {
          const finds = await base44.entities.FactFind.filter({ id });
          if (finds[0]) {
            setFactFind(finds[0]);
            if (finds[0].personal) {
              setFormData({ ...formData, ...finds[0].personal });
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

  const handleSave = async () => {
    if (!factFind?.id) return;

    setSaving(true);
    try {
      await base44.entities.FactFind.update(factFind.id, {
        personal: formData,
        current_section: 'personal'
      });
      toast.success('Progress saved successfully');
    } catch (error) {
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    // Validation for basic section
    if (activeSubSection === 'basic') {
      if (!formData.first_name || !formData.last_name) {
        toast.error('Please fill in required fields');
        return;
      }
    }

    // Save current data
    setSaving(true);
    try {
      await base44.entities.FactFind.update(factFind.id, {
        personal: formData,
        current_section: 'personal'
      });

      // Move to next sub-section or complete
      const currentIndex = subSections.findIndex(s => s.id === activeSubSection);
      if (currentIndex < subSections.length - 1) {
        setActiveSubSection(subSections[currentIndex + 1].id);
        toast.success('Progress saved');
      } else {
        // Completed all sub-sections
        const sectionsCompleted = factFind.sections_completed || [];
        if (!sectionsCompleted.includes('personal')) {
          sectionsCompleted.push('personal');
        }

        await base44.entities.FactFind.update(factFind.id, {
          personal: formData,
          current_section: 'dependants',
          sections_completed: sectionsCompleted,
          completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
        });

        navigate(createPageUrl('FactFindDependants') + `?id=${factFind.id}`);
      }
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBackSubSection = () => {
    const currentIndex = subSections.findIndex(s => s.id === activeSubSection);
    if (currentIndex > 0) {
      setActiveSubSection(subSections[currentIndex - 1].id);
    } else {
      navigate(createPageUrl('FactFindWelcome') + `?id=${factFind?.id || ''}`);
    }
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="personal" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const clientName = formData.first_name && formData.last_name 
    ? `${formData.first_name} ${formData.last_name}`
    : user?.full_name || user?.email || 'Client';

  return (
    <FactFindLayout currentSection="personal" factFind={factFind}>
      <FactFindHeader
        title="Personal Details"
        description="Please provide basic information about you and your partner."
        factFind={factFind}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="w-full">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-6">
              {/* Client Information Bar */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <span className="text-blue-700 font-bold text-sm">
                      {getInitials(clientName)}
                    </span>
                  </div>
                  <div className="font-bold text-slate-800">{clientName}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700">
                    Primary
                  </div>
                  <div className="px-3 py-1.5 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700">
                    Individual
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    Live
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('client')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold transition-all",
                    activeTab === 'client'
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  Client
                </button>
                <button
                  onClick={() => setActiveTab('partner')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold transition-all",
                    activeTab === 'partner'
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  Partner
                </button>
                <button
                  onClick={() => setActiveTab('joint')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold transition-all",
                    activeTab === 'joint'
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  Joint
                </button>
              </div>

              {/* Sub-section Tabs */}
              <div className="flex gap-2 flex-wrap">
                {subSections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSubSection(section.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                      activeSubSection === section.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
              {/* Form Content Based on Active Sub-Section */}
              <div className="space-y-4">
                {activeSubSection === 'basic' && (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">First name</Label>
                        <Input
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          placeholder="Enter first name"
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Last name</Label>
                        <Input
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          placeholder="Enter last name"
                          className="border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Gender</Label>
                        <div className="flex gap-3">
                          {['Male', 'Female', 'Other'].map(option => (
                            <button
                              key={option}
                              onClick={() => setFormData({ ...formData, gender: option.toLowerCase() })}
                              className={cn(
                                "px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                                formData.gender === option.toLowerCase()
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
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
                        <Label className="text-slate-700 font-semibold text-sm">Relationship status</Label>
                        <Select value={formData.marital_status} onValueChange={(value) => setFormData({ ...formData, marital_status: value })}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="de_facto">De facto</SelectItem>
                            <SelectItem value="divorced">Divorced</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Living status</Label>
                        <Select value={formData.living_status} onValueChange={(value) => setFormData({ ...formData, living_status: value })}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="own">Own home</SelectItem>
                            <SelectItem value="renting">Renting</SelectItem>
                            <SelectItem value="aged_care">Live in aged care</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Resident status</Label>
                        <div className="flex gap-3">
                          {['Permanent resident', 'Temporary resident', 'Other'].map(option => (
                            <button
                              key={option}
                              onClick={() => setFormData({ ...formData, resident_status: option })}
                              className={cn(
                                "px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                                formData.resident_status === option
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeSubSection === 'contact' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Street address</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Enter street address"
                        className="border-slate-300"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Suburb</Label>
                        <Input
                          value={formData.suburb}
                          onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                          placeholder="Enter suburb"
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">State</Label>
                        <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACT">ACT</SelectItem>
                            <SelectItem value="NSW">NSW</SelectItem>
                            <SelectItem value="NT">NT</SelectItem>
                            <SelectItem value="QLD">QLD</SelectItem>
                            <SelectItem value="SA">SA</SelectItem>
                            <SelectItem value="TAS">TAS</SelectItem>
                            <SelectItem value="VIC">VIC</SelectItem>
                            <SelectItem value="WA">WA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Country</Label>
                        <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Australia">Australia</SelectItem>
                            <SelectItem value="New Zealand">New Zealand</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Postal code</Label>
                        <Input
                          value={formData.postcode}
                          onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                          placeholder="Enter postcode"
                          className="border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Phone *</Label>
                        <Input
                          type="tel"
                          value={formData.mobile}
                          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                          placeholder="0400 000 000"
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Email *</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your.email@example.com"
                          className="border-slate-300"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSubSection === 'health' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Health status</Label>
                      <div className="flex gap-3">
                        {['Excellent', 'Good', 'Fair', 'Poor'].map(option => (
                          <button
                            key={option}
                            onClick={() => setFormData({ ...formData, health_status: option })}
                            className={cn(
                              "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                              formData.health_status === option
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Smoker status</Label>
                      <div className="flex gap-3">
                        {['Smoker', 'Non-smoker'].map(option => (
                          <button
                            key={option}
                            onClick={() => setFormData({ ...formData, smoker_status: option })}
                            className={cn(
                              "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                              formData.smoker_status === option
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Health insurance?</Label>
                      <div className="flex gap-3">
                        {['Yes', 'No'].map(option => (
                          <button
                            key={option}
                            onClick={() => setFormData({ ...formData, health_insurance: option })}
                            className={cn(
                              "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                              formData.health_insurance === option
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Specify health issues</Label>
                      <Input
                        value={formData.health_issues}
                        onChange={(e) => setFormData({ ...formData, health_issues: e.target.value })}
                        placeholder="Enter any health issues or concerns"
                        className="border-slate-300"
                      />
                    </div>
                  </>
                )}

                {activeSubSection === 'employment' && (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Employment status</Label>
                        <Select value={formData.employment_status} onValueChange={(value) => setFormData({ ...formData, employment_status: value })}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full-time">Full-time</SelectItem>
                            <SelectItem value="part-time">Part-time</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="home_duties">Home duties</SelectItem>
                            <SelectItem value="paternity">Paternity leave</SelectItem>
                            <SelectItem value="unemployed">Unemployed</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Occupation</Label>
                        <Input
                          value={formData.occupation}
                          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                          placeholder="Enter occupation"
                          className="border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Hours worked (per week)</Label>
                        <Input
                          type="number"
                          value={formData.hours_per_week}
                          onChange={(e) => setFormData({ ...formData, hours_per_week: e.target.value })}
                          placeholder="Enter hours"
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Occupation type</Label>
                        <Select value={formData.occupation_type} onValueChange={(value) => setFormData({ ...formData, occupation_type: value })}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="sole_trader">Sole trader</SelectItem>
                            <SelectItem value="self_employed">Self-employed</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Annual leave (weeks)</Label>
                        <Input
                          type="number"
                          value={formData.annual_leave}
                          onChange={(e) => setFormData({ ...formData, annual_leave: e.target.value })}
                          placeholder="0"
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Sick leave available (weeks)</Label>
                        <Input
                          type="number"
                          value={formData.sick_leave}
                          onChange={(e) => setFormData({ ...formData, sick_leave: e.target.value })}
                          placeholder="0"
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Long service leave accrued (weeks)</Label>
                        <Input
                          type="number"
                          value={formData.long_service_leave}
                          onChange={(e) => setFormData({ ...formData, long_service_leave: e.target.value })}
                          placeholder="0"
                          className="border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Employer name</Label>
                        <Input
                          value={formData.employer_name}
                          onChange={(e) => setFormData({ ...formData, employer_name: e.target.value })}
                          placeholder="Enter employer name"
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Length of employment</Label>
                        <Input
                          value={formData.employment_length}
                          onChange={(e) => setFormData({ ...formData, employment_length: e.target.value })}
                          placeholder="e.g., 5 years"
                          className="border-slate-300"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSubSection === 'estate' && (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Do you have a will?</Label>
                        <div className="flex gap-3">
                          {['Yes', 'No'].map(option => (
                            <button
                              key={option}
                              onClick={() => setFormData({ ...formData, has_will: option })}
                              className={cn(
                                "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                formData.has_will === option
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Will last updated</Label>
                        <Input
                          type="date"
                          value={formData.will_updated}
                          onChange={(e) => setFormData({ ...formData, will_updated: e.target.value })}
                          className="border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Testamentary trust?</Label>
                        <div className="flex gap-3">
                          {['Yes', 'No'].map(option => (
                            <button
                              key={option}
                              onClick={() => setFormData({ ...formData, testamentary_trust: option })}
                              className={cn(
                                "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                formData.testamentary_trust === option
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Power of attorney type</Label>
                        <Select value={formData.power_of_attorney} onValueChange={(value) => setFormData({ ...formData, power_of_attorney: value })}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="financial">Financial</SelectItem>
                            <SelectItem value="financial_medical">Financial & Medical</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="guardianship">Guardianship</SelectItem>
                            <SelectItem value="medical">Medical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                {activeSubSection === 'centrelink' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Receiving Centrelink benefits?</Label>
                      <div className="flex gap-3">
                        {['Yes', 'No'].map(option => (
                          <button
                            key={option}
                            onClick={() => setFormData({ ...formData, centrelink_benefits: option })}
                            className={cn(
                              "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                              formData.centrelink_benefits === option
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.centrelink_benefits === 'Yes' && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-sm">Type of benefit received</Label>
                          <Select value={formData.benefit_type} onValueChange={(value) => setFormData({ ...formData, benefit_type: value })}>
                            <SelectTrigger className="border-slate-300">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="age_pension">Age Pension</SelectItem>
                              <SelectItem value="dva">DVA Pension</SelectItem>
                              <SelectItem value="disability">Disability support pension</SelectItem>
                              <SelectItem value="allowance">Allowance</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-sm">Concession cards?</Label>
                          <div className="flex gap-3">
                            {['Yes', 'No'].map(option => (
                              <button
                                key={option}
                                onClick={() => setFormData({ ...formData, concession_cards: option })}
                                className={cn(
                                  "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                  formData.concession_cards === option
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                                )}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <Button
                  onClick={handleBackSubSection}
                  variant="outline"
                  disabled={saving}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button
                  onClick={handleSaveAndContinue}
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