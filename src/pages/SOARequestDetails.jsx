import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import SOARequestHeader from '../components/soa/SOARequestHeader';
import { toast } from 'sonner';

const sections = [
  { id: 'cover_page', label: 'Cover page' },
  { id: 'contents', label: 'Contents' },
  { id: 'executive_summary', label: 'Executive summary' },
  { id: 'about_you', label: 'About you' },
  { id: 'your_objectives', label: 'Your objectives' },
  { id: 'your_current_situation', label: 'Your current situation' },
  { id: 'basis_of_advice', label: 'Basis of advice' },
  { id: 'our_advice', label: 'Our advice' },
  { id: 'implementation', label: 'Implementation' },
  { id: 'ongoing_service', label: 'Ongoing service' },
  { id: 'fees_commissions', label: 'Fees and commissions' },
  { id: 'appendices', label: 'Appendices' }
];

export default function SOARequestDetails() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  const [selectedSections, setSelectedSections] = useState({});
  const [sectionTips, setSectionTips] = useState({});
  const [sectionOrder, setSectionOrder] = useState(sections.map(s => s.id));
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (id) {
          const requests = await base44.entities.SOARequest.filter({ id });
          if (requests[0]) {
            setSOARequest(requests[0]);
            const details = requests[0].soa_details || {};
            setSelectedSections(details.selected_sections || {});
            setSectionTips(details.section_tips || {});
            setSectionOrder(details.section_order || sections.map(s => s.id));
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleToggleSection = (sectionId) => {
    setSelectedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        soa_details: {
          selected_sections: selectedSections,
          section_tips: sectionTips,
          section_order: sectionOrder
        }
      });
      toast.success('SOA details saved');
      navigate(createPageUrl('SOARequestReview') + `?id=${soaRequest.id}`);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  const selectedCount = Object.values(selectedSections).filter(Boolean).length;

  return (
    <SOARequestLayout currentSection="details" soaRequest={soaRequest}>
      <SOARequestHeader 
        title="SOA Details"
        description="Configure which sections to include and provide guidance for each"
      />
      
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="w-full space-y-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-bold text-slate-800 mb-2">SOA Section Configuration</h3>
              <p className="text-sm text-slate-700">
                Select the sections you want included in your Statement of Advice and provide specific tips or instructions for the paraplanner.
              </p>
              <p className="text-sm font-semibold text-slate-800 mt-3">
                {selectedCount} of {sections.length} sections selected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SOA Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sections.map((section) => (
                <div key={section.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={section.id}
                      checked={selectedSections[section.id] || false}
                      onCheckedChange={() => handleToggleSection(section.id)}
                    />
                    <label htmlFor={section.id} className="text-sm font-semibold text-slate-700 cursor-pointer flex-1">
                      {section.label}
                    </label>
                  </div>
                  {selectedSections[section.id] && (
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">
                        Tips or special instructions for this section
                      </label>
                      <Textarea
                        value={sectionTips[section.id] || ''}
                        onChange={(e) => setSectionTips(prev => ({ ...prev, [section.id]: e.target.value }))}
                        placeholder="Add any specific guidance or requirements..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 py-6">
            <Button 
              variant="outline"
              onClick={() => navigate(createPageUrl('SOARequestAssumptions') + `?id=${soaRequest.id}`)}
            >
              Back
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </Button>
          </div>
        </div>
      </div>
    </SOARequestLayout>
  );
}