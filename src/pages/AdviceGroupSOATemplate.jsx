import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, GripVertical, AlertCircle, User, HelpCircle, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import AdviceGroupSidebar from '../components/advicegroup/AdviceGroupSidebar';

export default function AdviceGroupSOATemplate() {
  const [template, setTemplate] = useState(null);
  const [adminTemplate, setAdminTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(['getting-started']);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load admin template (base)
      const adminTemplates = await base44.entities.SOATemplate.filter({ owner_type: 'admin' });
      if (adminTemplates[0]) {
        setAdminTemplate(adminTemplates[0]);
      }

      // Load group template if exists
      if (currentUser.advice_group_id) {
        const groupTemplates = await base44.entities.SOATemplate.filter({
          owner_type: 'advice_group',
          advice_group_id: currentUser.advice_group_id
        });
        if (groupTemplates[0]) {
          setTemplate(groupTemplates[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sections = adminTemplate?.sections || [];
      
      if (template?.id) {
        await base44.entities.SOATemplate.update(template.id, { sections });
      } else {
        await base44.entities.SOATemplate.create({
          owner_type: 'advice_group',
          advice_group_id: user.advice_group_id,
          inherits_from_id: adminTemplate?.id,
          sections
        });
      }
      toast.success('Template saved successfully');
      loadTemplates();
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const colors = {
    core: {
      navy: '#1e293b',
      slate: '#475569',
      slateLight: '#64748b',
      grey: '#94a3b8',
      greyLight: '#e2e8f0',
      offWhite: '#f8fafc',
      white: '#ffffff',
    },
    accent: {
      blue: '#3b82f6',
      blueDeep: '#1d4ed8',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      coral: '#f97316',
      purple: '#8b5cf6',
      pink: '#ec4899',
      cyan: '#06b6d4',
    }
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    );
  };

  const sectionGroups = [
    {
      id: 'getting-started',
      label: 'Getting Started',
      icon: '🚀',
      sections: [
        { id: 'executive-summary', label: 'Executive Summary', enabled: true, required: true },
        { id: 'scope-of-advice', label: 'Scope of Advice', enabled: true, required: true }
      ]
    },
    {
      id: 'client-info',
      label: 'Client Information',
      icon: '👤',
      sections: [
        { id: 'personal-details', label: 'Personal Details', enabled: true, required: true },
        { id: 'family-situation', label: 'Family Situation', enabled: true, required: false }
      ]
    }
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      background: colors.core.offWhite,
    }}>
      <AdviceGroupSidebar currentPage="template" />

      <div style={{
        marginLeft: '260px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header with User Profile */}
        <div style={{
          background: colors.core.white,
          padding: '4px 32px',
          borderBottom: `1px solid ${colors.core.greyLight}`,
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  background: colors.core.white,
                  border: `1px solid ${colors.core.greyLight}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}>
                  {user.profile_image_url ? (
                    <img src={user.profile_image_url} alt="Profile" style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                    }} />
                  ) : (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: `linear-gradient(135deg, ${colors.accent.purple}, ${colors.accent.blueDeep})`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.core.white,
                      fontSize: '12px',
                      fontWeight: 700,
                    }}>
                      {(user.display_name || user.full_name)?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span style={{ color: colors.core.navy }}>{user.display_name || user.full_name || user.email}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={{ width: '224px' }}>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('AdviceGroupMyProfile')} style={{ cursor: 'pointer' }}>
                    <User size={16} style={{ marginRight: '12px' }} />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle size={16} style={{ marginRight: '12px' }} />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => base44.auth.logout()}>
                  <LogOut size={16} style={{ marginRight: '12px' }} />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          padding: '32px',
        }}>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Template Inheritance</h4>
            <p className="text-sm text-blue-700">
              This template inherits from the admin default. Your advisers can further customize their own versions. Changes here apply to all advisers who haven't customized their templates.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {sectionGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.id);
            return (
              <Card key={group.id}>
                <div
                  onClick={() => toggleGroup(group.id)}
                  className="flex items-center gap-3 p-5 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <GripVertical className="w-5 h-5 text-slate-400" />
                  <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center text-lg">
                    {group.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{group.label}</div>
                  </div>
                  <Badge variant="secondary">{group.sections.length} sections</Badge>
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-3">
                    {group.sections.map((section) => (
                      <div key={section.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <Checkbox checked={section.enabled} className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{section.label}</span>
                              {section.required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <Textarea
                              placeholder="Add guidance or tips for this section..."
                              className="mt-2 text-sm"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}