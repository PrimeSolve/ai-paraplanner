import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useRole } from '../components/RoleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ChevronRight, Download, X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import AdviceGroupSidebar from '../components/advicegroup/AdviceGroupSidebar';
import AdviceGroupHeader from '../components/advicegroup/AdviceGroupHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function AdviceGroupAdvisers() {
    const { switchedToId } = useRole();
    const [advisers, setAdvisers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: ''
    });
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [sortBy, setSortBy] = useState('Most Active');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
      loadData();
    }, [switchedToId]);

    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const groupId = switchedToId || currentUser.advice_group_id;
        if (groupId) {
          const [advisersData, groups] = await Promise.all([
            base44.entities.Adviser.filter({
              advice_group_id: groupId
            }),
            base44.entities.AdviceGroup.list()
          ]);
          setAdvisers(advisersData);
          const currentGroup = groups.find(g => g.id === groupId);
          if (currentGroup) {
            setGroupName(currentGroup.name);
          }
        }
      } catch (error) {
        console.error('Failed to load advisers:', error);
      } finally {
        setLoading(false);
      }
    };

  const handleCreateAdviser = async (e) => {
    e.preventDefault();
    try {
      const groupId = switchedToId || user.advice_group_id;
      await base44.entities.Adviser.create({
        advice_group_id: groupId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        status: 'active'
      });
      toast.success('Adviser added successfully');
      setShowInvite(false);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', company: '' });
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to add adviser');
    }
  };

  const handleSendWelcomeEmail = async (adviser) => {
    try {
      await base44.users.inviteUser(adviser.email, 'user');
      toast.success('Welcome email sent');
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      toast.error('Failed to send welcome email');
    }
  };

  const filteredAdvisers = advisers.filter(a => {
    const fullName = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           a.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const avatarGradients = [
    'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f97316, #ec4899)',
    'linear-gradient(135deg, #06b6d4, #0891b2)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ef4444, #dc2626)',
  ];

  const getAvatarGradient = (index) => avatarGradients[index % avatarGradients.length];

  const stats = [
    { label: 'Total Advisers', value: advisers.length },
    { label: 'Active', value: advisers.length },
    { label: 'SOAs This Month', value: 47 }
  ];

  const totalPages = Math.ceil(filteredAdvisers.length / itemsPerPage);
  const paginatedAdvisers = filteredAdvisers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  return (
    <div className="flex">
      <AdviceGroupSidebar currentPage="advisers" groupName={groupName} />

      <div style={{
        marginLeft: '260px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <AdviceGroupHeader user={user} />

        <div style={{
          flex: 1,
          padding: '32px',
        }}>
        
        {/* Stats Pills */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}>
          {stats.map((stat, idx) => (
            <div key={idx} style={{
              background: colors.core.white,
              border: `1px solid ${colors.core.greyLight}`,
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '13px',
              color: colors.core.navy,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>{stat.value}</span>
              {stat.label}
            </div>
          ))}
        </div>

        {/* Search and Filters - Above Table */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: '200px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: colors.core.slateLight }} />
              <Input
                placeholder="Search advisers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px', height: '36px' }}
              />
            </div>
            
            <select style={{
              height: '36px',
              padding: '8px 12px',
              border: `1px solid ${colors.core.greyLight}`,
              borderRadius: '6px',
              fontSize: '14px',
              color: colors.core.navy,
              background: colors.core.white,
              cursor: 'pointer',
            }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All Statuses</option>
              <option>Active</option>
              <option>Pending</option>
            </select>

            <select style={{
              height: '36px',
              padding: '8px 12px',
              border: `1px solid ${colors.core.greyLight}`,
              borderRadius: '6px',
              fontSize: '14px',
              color: colors.core.navy,
              background: colors.core.white,
              cursor: 'pointer',
            }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option>Most Active</option>
              <option>Least Active</option>
              <option>Name A-Z</option>
            </select>
          </div>

          <Button onClick={() => setShowInvite(true)} style={{
            background: colors.accent.blue,
            color: colors.core.white,
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}>
            <Plus size={16} />
            Add Adviser
          </Button>
        </div>

        {/* Advisers Table Card */}
        <div style={{
          background: colors.core.white,
          borderRadius: '16px',
          border: `1px solid ${colors.core.greyLight}`,
          overflow: 'hidden',
        }}>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}>
            <thead>
              <tr style={{
                borderBottom: `1px solid ${colors.core.greyLight}`,
                background: colors.core.offWhite,
              }}>
                {['ADVISER', 'STATUS', 'ACTIVE SOAs', 'ACTIONS'].map(header => (
                  <th key={header} style={{
                    padding: '12px 16px',
                    textAlign: header !== 'ADVISER' && header !== 'STATUS' && header !== 'ACTIONS' ? 'center' : 'left',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: colors.core.slateLight,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedAdvisers.map((adviser, idx) => {
                return (
                  <tr key={adviser.id} style={{
                    borderBottom: `1px solid ${colors.core.greyLight}`,
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.core.offWhite)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: getAvatarGradient(idx),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colors.core.white,
                          fontWeight: 600,
                          fontSize: '14px',
                        }}>
                          {`${adviser.first_name?.[0]}${adviser.last_name?.[0]}`.toUpperCase()}
                        </div>
                        <div>
                           <div style={{ fontWeight: 600, color: colors.core.navy }}>{`${adviser.first_name} ${adviser.last_name}` || adviser.email}</div>
                           <div style={{ fontSize: '12px', color: colors.core.slateLight }}>{adviser.email}</div>
                         </div>
                      </div>
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: colors.accent.success,
                        fontSize: '12px',
                        fontWeight: 600,
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.accent.success }}></span>
                        Active
                      </span>
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      color: colors.core.navy,
                      fontWeight: 500,
                      textAlign: 'center',
                    }}>
                      5
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                    }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link to={createPageUrl('AdviserDashboard')}>
                          <Button size="sm" style={{
                            background: colors.accent.blue,
                            color: colors.core.white,
                            height: '32px',
                            padding: '4px 12px',
                            fontSize: '13px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}>View</Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleSendWelcomeEmail(adviser)}
                          style={{
                            height: '32px',
                            padding: '4px 12px',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Mail size={14} />
                          Send Welcome
                        </Button>
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
          padding: '16px 24px',
          borderTop: `1px solid ${colors.core.greyLight}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: colors.core.slateLight,
        }}>
          <div>
            Showing {filteredAdvisers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAdvisers.length)} of {filteredAdvisers.length} advisers
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '6px 10px',
                border: `1px solid ${colors.core.greyLight}`,
                borderRadius: '4px',
                background: colors.core.white,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
                fontSize: '12px',
              }}
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              if (totalPages <= 5) return i + 1;
              if (currentPage <= 3) return i + 1;
              if (currentPage >= totalPages - 2) return totalPages - 4 + i;
              return currentPage - 2 + i;
            }).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  padding: '6px 10px',
                  minWidth: '32px',
                  border: page === currentPage ? 'none' : `1px solid ${colors.core.greyLight}`,
                  borderRadius: '4px',
                  background: page === currentPage ? colors.accent.blue : colors.core.white,
                  color: page === currentPage ? colors.core.white : colors.core.navy,
                  fontWeight: page === currentPage ? 600 : 500,
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 10px',
                border: `1px solid ${colors.core.greyLight}`,
                borderRadius: '4px',
                background: colors.core.white,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
                fontSize: '12px',
              }}
            >
              Next →
            </button>
            </div>
            </div>
            </div>
            </div>
            </div>

            {/* Add Adviser Modal */}
            <Dialog open={showInvite} onOpenChange={setShowInvite}>
            <DialogContent className="max-w-md">
            <DialogHeader>
            <DialogTitle>Add New Adviser</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAdviser} style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <Label>First Name *</Label>
                <Input
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  placeholder="John"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <Label>Last Name *</Label>
                <Input
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  placeholder="Smith"
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Label>Email *</Label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Label>Company</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                placeholder="Company Name"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <Button type="button" variant="outline" onClick={() => { setShowInvite(false); setFormData({ email: '', company: '' }); }}>
                Cancel
              </Button>
              <Button type="submit" style={{
                background: colors.accent.blue,
                color: colors.core.white,
                border: 'none',
              }}>
                Create Adviser
              </Button>
            </div>
            </form>
            </DialogContent>
            </Dialog>
            </div>
            );
            }