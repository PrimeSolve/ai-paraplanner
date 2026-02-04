import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    'Open': { color: '#2563EB', bg: '#DBEAFE' },
    'In Progress': { color: '#7C3AED', bg: '#EDE9FE' },
    'Awaiting Response': { color: '#D97706', bg: '#FEF3C7' },
    'Resolved': { color: '#059669', bg: '#D1FAE5' },
    'Closed': { color: '#6B7280', bg: '#F3F4F6' },
  };
  const config = statusConfig[status] || statusConfig['Open'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', backgroundColor: config.bg, color: config.color }}>
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const priorityConfig = {
    'Low': { color: '#6B7280' },
    'Medium': { color: '#D97706' },
    'High': { color: '#DC2626' },
    'Urgent': { color: '#991B1B' },
  };
  const config = priorityConfig[priority] || priorityConfig['Medium'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: config.color }} />
      {priority}
    </span>
  );
};

export default function AdviceGroupTickets() {
  const [user, setUser] = useState(null);
  const [adviceGroup, setAdviceGroup] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const groups = await base44.entities.AdviceGroup.filter({ user_id: currentUser.id });
      if (groups.length > 0) {
        setAdviceGroup(groups[0]);
      }
    };
    loadData();
  }, []);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', adviceGroup?.id],
    queryFn: async () => {
      if (!adviceGroup?.id) return [];
      return base44.entities.Ticket.filter({ advice_group_id: adviceGroup.id });
    },
    enabled: !!adviceGroup?.id,
  });

  if (isLoading || !user || !adviceGroup) {
    return <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading...</div>;
  }

  const openTickets = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed');

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>
          {adviceGroup.name} — Support Overview
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
          Monitor all tickets across your advice group
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: '#7C3AED', borderRadius: '16px', padding: '24px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '20px' }}>📬</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{openTickets.length}</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Total Open</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '20px' }}>⏱</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>2.4h</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Avg Response Time</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '20px' }}>📊</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>18h</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Avg Resolution Time</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '20px' }}>✓</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>94%</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>SLA Compliance</div>
        </div>
      </div>

      {/* Tickets Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', flex: 1, maxWidth: '400px' }}>
            <span style={{ color: '#94a3b8' }}>🔍</span>
            <input type="text" placeholder="Search tickets..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: '#0f172a', width: '100%' }} />
          </div>
        </div>

        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 130px 110px 100px 70px', padding: '12px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
          <div>TICKET</div>
          <div>SUBJECT</div>
          <div>ADVISER</div>
          <div>STATUS</div>
          <div>PRIORITY</div>
          <div>ACTIONS</div>
        </div>

        {/* Table Rows */}
        {tickets.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>No tickets found</div>
          </div>
        ) : (
          tickets.map(ticket => (
            <div key={ticket.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 130px 110px 100px 70px', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', alignItems: 'center', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#7C3AED', fontWeight: '600' }}>{ticket.ticket_number}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '2px' }}>{ticket.subject}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{ticket.category}</div>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>{ticket.adviser_name}</div>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <button style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#14B8A6', color: 'white', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>View</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}