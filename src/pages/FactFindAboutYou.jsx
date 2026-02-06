import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { useFactFind } from '../components/factfind/useFactFind';
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
  const { factFind, loading: ffLoading, updateSection } = useFactFind();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('client');
  const [activeSubSection, setActiveSubSection] = useState('basic');
  const [user, setUser] = useState(null);
  const [hasPartner, setHasPartner] = useState(false);
  const [sameAddressAsClient, setSameAddressAsClient] = useState(false);
  
  const initialFormState = {
    first_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    marital_status: '',
    living_status: '',
    resident_status: '',
    address: '',
    suburb: '',
    state: '',
    country: 'Australia',
    postcode: '',
    mobile: '',
    email: '',
    health_status: '',
    smoker_status: '',
    health_insurance: '',
    health_issues: '',
    employment_status: '',
    occupation: '',
    hours_per_week: '',
    occupation_type: '',
    annual_leave: '',
    sick_leave: '',
    long_service_leave: '',
    employer_name: '',
    employment_length: '',
    has_will: '',
    will_updated: '',
    testamentary_trust: '',
    power_of_attorney: '',
    centrelink_benefits: '',
    benefit_type: '',
    concession_cards: ''
  };
  
  const [clientData, setClientData] = useState(initialFormState);
  const [partnerData, setPartnerData] = useState(initialFormState);
  
  const formData = activeTab === 'client' ? clientData : partnerData;
  const setFormData = activeTab === 'client' ? setClientData : setPartnerData;

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

  // Load existing data from FactFind when it's loaded
  useEffect(() => {
    if (factFind?.personal) {
      // Load flat structure directly
      setClientData({ ...initialFormState, ...factFind.personal });
    }
  }, [factFind]);

  // Auto-save on unmount (when navigating away)
  useEffect(() => {
    return () => {
      if (factFind?.id && clientData.first_name) {
        updateSection('personal', { ...clientData });
      }
    };
  }, [factFind?.id, clientData, updateSection]);

  const handleSaveAndContinue = async () => {
    console.log('=== SAVE START ===');
    console.log('factFind:', factFind);
    console.log('factFind?.id:', factFind?.id);
    
    if (!factFind?.id) {
      alert('ERROR: No FactFind ID! factFind is: ' + JSON.stringify(factFind));
      return;
    }

    // Validation for basic section
    if (activeSubSection === 'basic') {
      if (!clientData.first_name || !clientData.last_name) {
        alert('VALIDATION: Missing first or last name');
        toast.error('Please fill in client first and last name');
        return;
      }
    }

    setSaving(true);
    try {
      // Save flat structure - spread client fields directly
      const personalData = {
        ...clientData
        // Note: Partner support to be added later
      };
      
      console.log('personalData to save:', personalData);

      // Move to next sub-section or complete
      const currentIndex = subSections.findIndex(s => s.id === activeSubSection);
      
      if (currentIndex < subSections.length - 1) {
        console.log('Calling updateSection...');
        const result = await updateSection('personal', personalData);
        console.log('Save result:', result);
        alert('Save result: ' + result);
        setActiveSubSection(subSections[currentIndex + 1].id);
        setActiveTab('client');
        toast.success('Progress saved');
      } else {
        console.log('Completed all sub-sections, updating FactFind...');
        const updateResult = await base44.entities.FactFind.update(factFind.id, {
          ...factFind,
          personal: personalData,
          current_section: 'dependants',
          sections_completed: [...(factFind.sections_completed || []), 'personal'].filter((v, i, a) => a.indexOf(v) === i),
          completion_percentage: Math.round(((factFind.sections_completed?.length || 0) + 1) / 14 * 100)
        });
        alert('Final save complete, navigating...');
        navigate(createPageUrl('FactFindDependants') + `?id=${factFind.id}`);
      }
    } catch (error) {
      alert('Save ERROR: ' + error.message);
      console.error('Save error:', error);
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

  if (ffLoading) {
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

  const clientName = clientData.first_name && clientData.last_name 
    ? `${clientData.first_name} ${clientData.last_name}`
    : user?.full_name || user?.email || 'Client';

  const partnerName = partnerData.first_name || 'Partner';

  return (
    <FactFindLayout currentSection="personal" factFind={factFind}>
      <FactFindHeader
        title="Personal Details"
        description="Please provide basic information about you and your partner."
        factFind={factFind}
        user={user}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="w-full">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-6">
              {/* Client Information Bar */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-slate-700 text-sm">Client Information</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('client')}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                        activeTab === 'client'
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {clientData.first_name || 'Client'}
                    </button>
                    {hasPartner ? (
                      <button
                        onClick={() => setActiveTab('partner')}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                          activeTab === 'partner'
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {partnerData.first_name || 'Partner'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setHasPartner(true);
                          setActiveTab('partner');
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                        Add Partner
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-section Tabs */}
              <div className="flex gap-2 flex-wrap">
                {subSections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSubSection(section.id);
                      setActiveTab('client');
                    }}
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
                          {[{label: 'Male', value: '2'}, {label: 'Female', value: '1'}, {label: 'Other', value: '3'}].map(option => (
                            <button
                              key={option.value}
                              onClick={() => setFormData({ ...formData, gender: option.value })}
                              className={cn(
                                "px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                                formData.gender === option.value
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                              )}
                            >
                              {option.label}
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
                            <SelectItem value="6">Single</SelectItem>
                            <SelectItem value="1">Married</SelectItem>
                            <SelectItem value="2">De facto</SelectItem>
                            <SelectItem value="3">Divorced</SelectItem>
                            <SelectItem value="4">Widowed</SelectItem>
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
                            <SelectItem value="1">Own home</SelectItem>
                            <SelectItem value="2">Renting</SelectItem>
                            <SelectItem value="3">Live if aged care</SelectItem>
                            <SelectItem value="4">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Resident status</Label>
                        <div className="flex gap-3">
                          {[{label: 'Permanent resident', value: '1'}, {label: 'Temporary resident', value: '2'}, {label: 'Other', value: '3'}].map(option => (
                            <button
                              key={option.value}
                              onClick={() => setFormData({ ...formData, resident_status: option.value })}
                              className={cn(
                                "px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                                formData.resident_status === option.value
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeSubSection === 'contact' && (
                  <>
                    {activeTab === 'partner' && (
                      <div className="space-y-2 mb-4">
                        <Label className="text-slate-700 font-semibold text-sm">Same address as client?</Label>
                        <div className="flex gap-3">
                          {[{label: 'Yes', value: true}, {label: 'No', value: false}].map(option => (
                            <button
                              key={option.label}
                              onClick={() => {
                                setSameAddressAsClient(option.value);
                                if (option.value) {
                                  setPartnerData({
                                    ...partnerData,
                                    address: clientData.address,
                                    suburb: clientData.suburb,
                                    state: clientData.state,
                                    country: clientData.country,
                                    postcode: clientData.postcode
                                  });
                                }
                              }}
                              className={cn(
                                "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                sameAddressAsClient === option.value
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Street address</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Enter street address"
                        className="border-slate-300"
                        disabled={activeTab === 'partner' && sameAddressAsClient}
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
                        disabled={activeTab === 'partner' && sameAddressAsClient}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">State</Label>
                      <Select 
                        value={formData.state} 
                        onValueChange={(value) => setFormData({ ...formData, state: value })}
                        disabled={activeTab === 'partner' && sameAddressAsClient}
                      >
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">ACT</SelectItem>
                          <SelectItem value="2">NSW</SelectItem>
                          <SelectItem value="3">NT</SelectItem>
                          <SelectItem value="4">QLD</SelectItem>
                          <SelectItem value="5">SA</SelectItem>
                          <SelectItem value="6">TAS</SelectItem>
                          <SelectItem value="7">VIC</SelectItem>
                          <SelectItem value="8">WA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Country</Label>
                      <Select 
                        value={formData.country} 
                        onValueChange={(value) => setFormData({ ...formData, country: value })}
                        disabled={activeTab === 'partner' && sameAddressAsClient}
                      >
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
                        disabled={activeTab === 'partner' && sameAddressAsClient}
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
                        {[{label: 'Excellent', value: '4'}, {label: 'Good', value: '3'}, {label: 'Fair', value: '2'}, {label: 'Poor', value: '1'}].map(option => (
                          <button
                            key={option.value}
                            onClick={() => setFormData({ ...formData, health_status: option.value })}
                            className={cn(
                              "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                              formData.health_status === option.value
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Smoker status</Label>
                      <div className="flex gap-3">
                        {[{label: 'Smoker', value: '1'}, {label: 'Non-smoker', value: '2'}].map(option => (
                          <button
                            key={option.value}
                            onClick={() => setFormData({ ...formData, smoker_status: option.value })}
                            className={cn(
                              "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                              formData.smoker_status === option.value
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Health insurance?</Label>
                      <div className="flex gap-3">
                        {[{label: 'Yes', value: '1'}, {label: 'No', value: '2'}].map(option => (
                          <button
                            key={option.value}
                            onClick={() => setFormData({ ...formData, health_insurance: option.value })}
                            className={cn(
                              "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                              formData.health_insurance === option.value
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            {option.label}
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
                            <SelectItem value="1">Full-time</SelectItem>
                            <SelectItem value="2">Part-time</SelectItem>
                            <SelectItem value="3">Casual</SelectItem>
                            <SelectItem value="4">Home duties</SelectItem>
                            <SelectItem value="5">Paternity leave</SelectItem>
                            <SelectItem value="6">Unemployed</SelectItem>
                            <SelectItem value="7">Retired</SelectItem>
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
                            <SelectItem value="1">Employee</SelectItem>
                            <SelectItem value="2">Sole trader</SelectItem>
                            <SelectItem value="3">Self-employed</SelectItem>
                            <SelectItem value="4">Other</SelectItem>
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
                          {[{label: 'Yes', value: '1'}, {label: 'No', value: '2'}].map(option => (
                            <button
                              key={option.value}
                              onClick={() => setFormData({ ...formData, has_will: option.value })}
                              className={cn(
                                "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                formData.has_will === option.value
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                              )}
                            >
                              {option.label}
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
                          {[{label: 'Yes', value: '1'}, {label: 'No', value: '2'}].map(option => (
                            <button
                              key={option.value}
                              onClick={() => setFormData({ ...formData, testamentary_trust: option.value })}
                              className={cn(
                                "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                formData.testamentary_trust === option.value
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                              )}
                            >
                              {option.label}
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
                            <SelectItem value="1">Financial</SelectItem>
                            <SelectItem value="2">Financial &amp; Medical</SelectItem>
                            <SelectItem value="3">General</SelectItem>
                            <SelectItem value="4">Guardianship</SelectItem>
                            <SelectItem value="5">Medical</SelectItem>
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
                        {[{label: 'Yes', value: '1'}, {label: 'No', value: '2'}].map(option => (
                          <button
                            key={option.value}
                            onClick={() => setFormData({ ...formData, centrelink_benefits: option.value })}
                            className={cn(
                              "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                              formData.centrelink_benefits === option.value
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.centrelink_benefits === '1' && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-sm">Type of benefit received</Label>
                          <Select value={formData.benefit_type} onValueChange={(value) => setFormData({ ...formData, benefit_type: value })}>
                            <SelectTrigger className="border-slate-300">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Age Pension</SelectItem>
                              <SelectItem value="2">DVA Pension</SelectItem>
                              <SelectItem value="3">Disability support pension</SelectItem>
                              <SelectItem value="4">Allowance</SelectItem>
                              <SelectItem value="5">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold text-sm">Concession cards?</Label>
                          <div className="flex gap-3">
                            {[{label: 'Yes', value: '1'}, {label: 'No', value: '2'}].map(option => (
                              <button
                                key={option.value}
                                onClick={() => setFormData({ ...formData, concession_cards: option.value })}
                                className={cn(
                                  "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                  formData.concession_cards === option.value
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                                )}
                              >
                                {option.label}
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
                  onClick={() => {
                    alert('CLICKED!');
                    handleSaveAndContinue();
                  }}
                  disabled={false}
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