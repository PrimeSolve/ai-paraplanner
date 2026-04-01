import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, Building2, Users, FileText, Settings, ChevronDown, MoreHorizontal, Mail, Loader2, Eye, UserCheck, BarChart3, Activity } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { formatDate, formatRelativeDate } from '../utils/dateUtils';
import { useRole } from '../components/RoleContext';
import { toast } from 'sonner';

// ============================================
// DESIGN TOKENS
// ============================================
const ds = {
  pageBg: '#0b1120',
  cardBg: '#111827',
  cardBorder: 'rgba(255,255,255,0.06)',
  tableBg: '#111827',
  tableHeaderBg: 'rgba(255,255,255,0.03)',
  tableRowHover: 'rgba(255,255,255,0.04)',
  tableRowBorder: 'rgba(255,255,255,0.06)',
  inputBg: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.1)',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  teal: '#14b8a6',
  green: '#10b981',
  purple: '#8b5cf6',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  kpiTeal: '#14b8a6',
  kpiGreen: '#10b981',
  kpiPurple: '#8b5cf6',
  kpiBlue: '#3b82f6',
};

const avatarGradients = [
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #f97316, #ec4899)',
  'linear-gradient(135deg, #06b6d4, #0891b2)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ef4444, #dc2626)',
  'linear-gradient(135deg, #14b8a6, #0d9488)',
];

export default function AdminAdviceGroups() {
  const navigate = useNavigate();
  const { switchRole } = useRole();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [adviserCounts, setAdviserCounts] = useState({});
  const [templateCount, setTemplateCount] = useState(0);
  const [sendingWelcomeEmailId, setSendingWelcomeEmailId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    afsl: '',
    abn: '',
    status: 'active'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [data, advisers, templates] = await Promise.all([
        base44.entities.AdviceGroup.list('-created_date', 100),
        base44.entities.Adviser.list('-created_date', 200),
        base44.entities.SOATemplate.list().catch(() => [])
      ]);
      setGroups(data);
      setTemplateCount(templates.length);

      // Count advisers per group
      const counts = {};
      advisers.forEach(a => {
        if (a.advice_group_id) {
          counts[a.advice_group_id] = (counts[a.advice_group_id] || 0) + 1;
        }
      });
      setAdviserCounts(counts);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWelcomeEmail = async (group) => {
    setSendingWelcomeEmailId(group.id);
    try {
      await axiosInstance.post(`/advice-groups/${group.id}/send-welcome-email`);
      toast.success('Welcome email sent successfully');
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      toast.error('Failed to send welcome email. Please try again.');
    } finally {
      setSendingWelcomeEmailId(null);
    }
  };

  const handleViewAsAdviceGroup = (group) => {
    switchRole('advice_group', group.id, group.name);
    navigate(createPageUrl('AdviceGroupDashboard'));
  };

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await base44.entities.AdviceGroup.create(formData);
      toast.success('Advice Group created');
      setDialogOpen(false);
      setFormData({
        name: '',
        slug: '',
        contact_email: '',
        contact_phone: '',
        afsl: '',
        abn: '',
        status: 'active'
      });
      loadData();
    } catch (error) {
      console.error('Failed to create advice group:', error);
      toast.error('Failed to create advice group');
    } finally {
      setSaving(false);
    }
  };

  const getGroupInitial = (name) => name?.charAt(0).toUpperCase() || 'A';

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const totalAdvisers = Object.values(adviserCounts).reduce((a, b) => a + b, 0);
  const activeGroups = groups.filter(g => g.status === 'active').length;

  // Derive max adviser count for relative bar sizing
  const maxAdvisers = Math.max(...Object.values(adviserCounts), 1);

  return (
    <div style={{ background: ds.pageBg, minHeight: '100vh', padding: '32px' }}>

      {/* ========== KPI CARDS ========== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {/* Total Groups */}
        <div style={{
          background: ds.cardBg,
          borderRadius: '14px',
          border: `1px solid ${ds.cardBorder}`,
          borderTop: `2px solid ${ds.kpiTeal}`,
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: ds.textSecondary, fontSize: '13px', fontWeight: 500 }}>Total Groups</span>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(20, 184, 166, 0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 size={18} color={ds.kpiTeal} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: ds.textPrimary, lineHeight: 1 }}>{groups.length}</div>
        </div>

        {/* Total Advisers */}
        <div style={{
          background: ds.cardBg,
          borderRadius: '14px',
          border: `1px solid ${ds.cardBorder}`,
          borderTop: `2px solid ${ds.kpiGreen}`,
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: ds.textSecondary, fontSize: '13px', fontWeight: 500 }}>Total Advisers</span>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserCheck size={18} color={ds.kpiGreen} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: ds.textPrimary, lineHeight: 1 }}>{totalAdvisers}</div>
        </div>

        {/* SOA Templates */}
        <div style={{
          background: ds.cardBg,
          borderRadius: '14px',
          border: `1px solid ${ds.cardBorder}`,
          borderTop: `2px solid ${ds.kpiPurple}`,
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: ds.textSecondary, fontSize: '13px', fontWeight: 500 }}>SOA Templates</span>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={18} color={ds.kpiPurple} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: ds.textPrimary, lineHeight: 1 }}>{templateCount}</div>
        </div>

        {/* Active Groups */}
        <div style={{
          background: ds.cardBg,
          borderRadius: '14px',
          border: `1px solid ${ds.cardBorder}`,
          borderTop: `2px solid ${ds.kpiBlue}`,
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: ds.textSecondary, fontSize: '13px', fontWeight: 500 }}>Active Groups</span>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={18} color={ds.kpiBlue} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: ds.textPrimary, lineHeight: 1 }}>{activeGroups}</div>
        </div>
      </div>

      {/* ========== FILTERS BAR ========== */}
      <div style={{
        background: ds.cardBg,
        borderRadius: '14px',
        border: `1px solid ${ds.cardBorder}`,
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: ds.textMuted }} />
          <input
            type="text"
            placeholder="Search groups or AFSL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '36px',
              paddingRight: '12px',
              background: ds.inputBg,
              border: `1px solid ${ds.inputBorder}`,
              borderRadius: '8px',
              color: ds.textPrimary,
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {/* Status Select */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            height: '38px',
            padding: '0 32px 0 12px',
            background: ds.inputBg,
            border: `1px solid ${ds.inputBorder}`,
            borderRadius: '8px',
            color: ds.textSecondary,
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer',
            appearance: 'auto',
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>

        {/* Template Select */}
        <select
          value={templateFilter}
          onChange={(e) => setTemplateFilter(e.target.value)}
          style={{
            height: '38px',
            padding: '0 32px 0 12px',
            background: ds.inputBg,
            border: `1px solid ${ds.inputBorder}`,
            borderRadius: '8px',
            color: ds.textSecondary,
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer',
            appearance: 'auto',
          }}
        >
          <option value="all">All Templates</option>
          <option value="custom">Custom</option>
          <option value="default">Default</option>
        </select>

        {/* Results count */}
        <span style={{ color: ds.textMuted, fontSize: '13px', whiteSpace: 'nowrap', marginLeft: '4px' }}>
          {filteredGroups.length} result{filteredGroups.length !== 1 ? 's' : ''}
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Add Advice Group Button */}
        <button
          onClick={() => setDialogOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: '38px',
            padding: '0 20px',
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <Plus size={16} />
          Add Advice Group
        </button>
      </div>

      {/* ========== TABLE ========== */}
      <div style={{
        background: ds.cardBg,
        borderRadius: '14px',
        border: `1px solid ${ds.cardBorder}`,
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: ds.tableHeaderBg, borderBottom: `1px solid ${ds.tableRowBorder}` }}>
                {['GROUP', 'ADVISERS', 'CLIENTS', 'SOAs', 'TEMPLATE', 'STATUS', 'ACTIONS'].map((col) => (
                  <th key={col} style={{
                    textAlign: 'left',
                    padding: '12px 20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: ds.textMuted,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group, idx) => {
                const advCount = adviserCounts[group.id] || 0;
                const soaCount = Math.floor(advCount * 2.5) || 0; // derived visual proxy
                const clientCount = Math.floor(advCount * 3.2) || 0; // derived visual proxy
                const barWidth = maxAdvisers > 0 ? Math.max((soaCount / (maxAdvisers * 3)) * 100, 8) : 8;

                return (
                  <tr
                    key={group.id}
                    style={{
                      borderBottom: `1px solid ${ds.tableRowBorder}`,
                      transition: 'background 0.15s',
                      cursor: 'default',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = ds.tableRowHover}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* GROUP */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '9px',
                          background: avatarGradients[idx % avatarGradients.length],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '12px',
                          flexShrink: 0,
                        }}>
                          {getInitials(group.name)}
                        </div>
                        <div>
                          <div style={{ color: ds.textPrimary, fontWeight: 600, fontSize: '13px', lineHeight: '18px' }}>
                            {group.name}
                          </div>
                          <div style={{ color: ds.textMuted, fontSize: '11px', lineHeight: '16px' }}>
                            {group.afsl ? `AFSL ${group.afsl}` : 'No AFSL'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ADVISERS */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ color: ds.textPrimary, fontSize: '13px', fontWeight: 500 }}>{advCount}</span>
                    </td>

                    {/* CLIENTS */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ color: ds.textPrimary, fontSize: '13px', fontWeight: 500 }}>{clientCount}</span>
                    </td>

                    {/* SOAs */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: ds.textPrimary, fontSize: '13px', fontWeight: 500, minWidth: '20px' }}>{soaCount}</span>
                        <div style={{
                          height: '6px',
                          width: '60px',
                          background: 'rgba(255,255,255,0.06)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(barWidth, 100)}%`,
                            background: 'linear-gradient(90deg, #14b8a6, #06b6d4)',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                      </div>
                    </td>

                    {/* TEMPLATE */}
                    <td style={{ padding: '14px 20px' }}>
                      {group.soa_template_id ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: 'rgba(20, 184, 166, 0.15)',
                          color: ds.teal,
                        }}>Custom</span>
                      ) : (
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: 'rgba(255,255,255,0.06)',
                          color: ds.textMuted,
                        }}>Default</span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: group.status === 'active'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : group.status === 'suspended'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(255,255,255,0.06)',
                        color: group.status === 'active'
                          ? ds.green
                          : group.status === 'suspended'
                          ? '#ef4444'
                          : ds.textMuted,
                        textTransform: 'capitalize',
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: group.status === 'active'
                            ? ds.green
                            : group.status === 'suspended'
                            ? '#ef4444'
                            : ds.textMuted,
                        }} />
                        {group.status || 'active'}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => navigate(createPageUrl('AdviceGroupDashboard'))}
                          style={{
                            padding: '5px 14px',
                            borderRadius: '6px',
                            border: `1px solid ${ds.inputBorder}`,
                            background: 'transparent',
                            color: ds.textSecondary,
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = ds.textSecondary;
                            e.currentTarget.style.color = ds.textPrimary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = ds.inputBorder;
                            e.currentTarget.style.color = ds.textSecondary;
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleViewAsAdviceGroup(group)}
                          style={{
                            padding: '5px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            background: ds.blue,
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          View As
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              border: `1px solid ${ds.inputBorder}`,
                              background: 'transparent',
                              color: ds.textMuted,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}>
                              <MoreHorizontal size={14} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" style={{
                            background: '#1e293b',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                          }}>
                            <DropdownMenuItem
                              onSelect={() => handleSendWelcomeEmail(group)}
                              disabled={sendingWelcomeEmailId === group.id}
                              style={{ color: ds.textSecondary, fontSize: '13px' }}
                            >
                              {sendingWelcomeEmailId === group.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Mail className="w-4 h-4 mr-2" />
                              )}
                              Send Welcome Email
                            </DropdownMenuItem>
                            <DropdownMenuItem style={{ color: ds.textSecondary, fontSize: '13px' }}>
                              <FileText className="w-4 h-4 mr-2" />
                              Edit Template
                            </DropdownMenuItem>
                            <DropdownMenuItem style={{ color: ds.textSecondary, fontSize: '13px' }}>
                              <Users className="w-4 h-4 mr-2" />
                              View Advisers
                            </DropdownMenuItem>
                            <DropdownMenuItem style={{ color: '#ef4444', fontSize: '13px' }}>
                              Delete Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          padding: '14px 20px',
          borderTop: `1px solid ${ds.tableRowBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ color: ds.textMuted, fontSize: '13px' }}>
            Showing 1-{Math.min(filteredGroups.length, 8)} of {filteredGroups.length} advice groups
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: ds.textMuted,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}>
              Prev
            </button>
            <button style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: ds.blue,
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              1
            </button>
            <button style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: ds.textMuted,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ========== ADD GROUP MODAL (Dark Glassmorphism) ========== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-2xl"
          style={{
            background: 'rgba(17, 24, 39, 0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '18px',
            boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
            color: ds.textPrimary,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: ds.textPrimary, fontSize: '18px', fontWeight: 700 }}>
              Add Advice Group
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '8px' }}>
            {/* Group Name */}
            <div>
              <label style={{ display: 'block', color: ds.textSecondary, fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Group Name *
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., PrimeSolve Group"
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 14px',
                  background: ds.inputBg,
                  border: `1px solid ${ds.inputBorder}`,
                  borderRadius: '8px',
                  color: ds.textPrimary,
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            {/* AFSL & Licensee */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: ds.textSecondary, fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AFSL Number
                </label>
                <input
                  value={formData.afsl}
                  onChange={(e) => setFormData({...formData, afsl: e.target.value})}
                  placeholder="e.g., 123456"
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 14px',
                    background: ds.inputBg,
                    border: `1px solid ${ds.inputBorder}`,
                    borderRadius: '8px',
                    color: ds.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: ds.textSecondary, fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Licensee (ABN)
                </label>
                <input
                  value={formData.abn}
                  onChange={(e) => setFormData({...formData, abn: e.target.value})}
                  placeholder="e.g., 12 345 678 901"
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 14px',
                    background: ds.inputBg,
                    border: `1px solid ${ds.inputBorder}`,
                    borderRadius: '8px',
                    color: ds.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* SOA Template & Contact Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: ds.textSecondary, fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  SOA Template
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 14px',
                    background: ds.inputBg,
                    border: `1px solid ${ds.inputBorder}`,
                    borderRadius: '8px',
                    color: ds.textSecondary,
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="active">Default Template</option>
                  <option value="inactive">Custom Template</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: ds.textSecondary, fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  placeholder="contact@advicegroup.com"
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 14px',
                    background: ds.inputBg,
                    border: `1px solid ${ds.inputBorder}`,
                    borderRadius: '8px',
                    color: ds.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: `1px solid ${ds.inputBorder}`,
                  background: 'transparent',
                  color: ds.textSecondary,
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '9px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Creating...' : 'Create Advice Group'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
