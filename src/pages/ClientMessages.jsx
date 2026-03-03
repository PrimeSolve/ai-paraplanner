import React, { useState, useEffect } from 'react';
import ClientLayout from '../components/client/ClientLayout';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { formatRelativeDate } from '../utils/dateUtils';
import {
  Bell,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Inbox,
  ArrowRight,
  Filter,
} from 'lucide-react';

const typeConfig = {
  action_required: {
    icon: AlertCircle,
    color: '#f97316',
    bg: '#fff7ed',
    border: '#fed7aa',
    badge: 'Action Required',
    badgeBg: '#fff7ed',
    badgeColor: '#c2410c',
  },
  document_ready: {
    icon: FileText,
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    badge: 'Document Ready',
    badgeBg: '#ecfdf5',
    badgeColor: '#047857',
  },
  info: {
    icon: Clock,
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
    badge: 'Information',
    badgeBg: '#eff6ff',
    badgeColor: '#1d4ed8',
  },
  completed: {
    icon: CheckCircle2,
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    badge: 'Completed',
    badgeBg: '#ecfdf5',
    badgeColor: '#047857',
  },
};

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Action Required', value: 'action_required' },
  { label: 'Documents Ready', value: 'document_ready' },
  { label: 'Information', value: 'info' },
];

export default function ClientMessages() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await base44.auth.me();

        const [factFinds, soaRequests] = await Promise.all([
          base44.entities.FactFind.filter({ created_by: user.email }, '-created_date'),
          base44.entities.SOARequest.filter({ client_email: user.email }, '-created_date'),
        ]);

        const items = [];

        factFinds.forEach(ff => {
          if (ff.status === 'in_progress' || ff.status === 'not_started' || !ff.status) {
            items.push({
              id: `ff-action-${ff.id}`,
              type: 'action_required',
              title: 'Complete your Fact Find',
              description: ff.completion_percentage
                ? `You're ${ff.completion_percentage}% complete. Continue where you left off to help your adviser prepare your plan.`
                : 'Start your Fact Find to help your adviser understand your financial situation and goals.',
              date: ff.updated_date || ff.created_date,
              unread: true,
              link: createPageUrl('FactFindWelcome') + `?id=${ff.id}`,
              linkText: 'Continue Fact Find',
            });
          }
          if (ff.status === 'submitted' || ff.status === 'completed') {
            items.push({
              id: `ff-done-${ff.id}`,
              type: 'completed',
              title: 'Fact Find submitted successfully',
              description: 'Your Fact Find has been submitted to your adviser. They will use this to prepare your personalised financial plan.',
              date: ff.updated_date || ff.created_date,
              unread: false,
            });
          }
        });

        soaRequests.forEach(soa => {
          if (soa.status === 'in_progress' || soa.status === 'submitted') {
            items.push({
              id: `soa-progress-${soa.id}`,
              type: 'info',
              title: 'Your Statement of Advice is being prepared',
              description: 'Your adviser is working on your personalised financial plan. We\'ll notify you as soon as it\'s ready for review.',
              date: soa.updated_date || soa.created_date,
              unread: true,
            });
          }
          if (soa.status === 'completed') {
            items.push({
              id: `soa-ready-${soa.id}`,
              type: 'document_ready',
              title: 'Your Statement of Advice is ready',
              description: 'Your personalised financial plan is ready for review. Download and review it at your convenience.',
              date: soa.completed_date || soa.updated_date || soa.created_date,
              unread: true,
              link: createPageUrl('ClientDocuments'),
              linkText: 'View Documents',
            });
          }
        });

        items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        setNotifications(items);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredNotifications = notifications.filter(n =>
    activeFilter === 'all' || n.type === activeFilter
  );

  const unreadCount = notifications.filter(n => n.unread).length;

  if (loading) {
    return (
      <ClientLayout currentPage="ClientMessages">
        <div style={{ padding: '24px 32px' }} className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout currentPage="ClientMessages">
      <div style={{ padding: '24px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Notifications</h1>
          {unreadCount > 0 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '24px',
              height: '24px',
              borderRadius: '12px',
              background: '#3b82f6',
              color: 'white',
              fontSize: '12px',
              fontWeight: '700',
              padding: '0 8px',
            }}>
              {unreadCount}
            </span>
          )}
        </div>

        {/* Filter Bar */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}>
          {filterOptions.map(filter => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: activeFilter === filter.value ? '#3b82f6' : '#e2e8f0',
                background: activeFilter === filter.value ? '#eff6ff' : 'white',
                color: activeFilter === filter.value ? '#1d4ed8' : '#64748b',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => {
              const config = typeConfig[notification.type] || typeConfig.info;
              const IconComponent = config.icon;

              return (
                <div
                  key={notification.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    borderLeft: notification.unread ? '4px solid #3b82f6' : '4px solid transparent',
                    padding: '20px',
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    {/* Icon */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: config.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <IconComponent style={{ width: '22px', height: '22px', color: config.color }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                          {notification.title}
                        </h3>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: config.badgeBg,
                          color: config.badgeColor,
                        }}>
                          {config.badge}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', margin: '0 0 8px 0' }}>
                        {notification.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {formatRelativeDate(notification.date)}
                        </span>
                        {notification.link && (
                          <Link
                            to={notification.link}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#3b82f6',
                              textDecoration: 'none',
                            }}
                          >
                            {notification.linkText}
                            <ArrowRight style={{ width: '14px', height: '14px' }} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '48px',
              textAlign: 'center',
            }}>
              <Inbox style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                All caught up!
              </h3>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                {activeFilter !== 'all'
                  ? 'No notifications match this filter.'
                  : 'You have no notifications at the moment. New updates will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
