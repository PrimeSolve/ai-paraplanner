import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

const AssignedBadge = ({ assignedTo, assignedToName, ticketId, onAssign }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    const loadAdmins = async () => {
      const adminList = await base44.entities.Admin.list();
      setAdmins(adminList);
    };
    loadAdmins();
  }, []);

  if (!assignedTo) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', backgroundColor: '#FEF3C7', color: '#D97706' }}>
          Unassigned
        </span>
        <button onClick={() => onAssign(ticketId, 'me')} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#7C3AED', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
          Assign to me
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setShowDropdown(!showDropdown)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#EDE9FE', cursor: 'pointer' }}>
        <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#7C3AED', color: 'white', fontSize: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {assignedToName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'}
        </span>
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#0f172a' }}>{assignedToName}</span>
        <span style={{ fontSize: '10px', color: '#64748b' }}>▼</span>
      </div>

      {showDropdown && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', zIndex: 100, minWidth: '180px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
          {admins.map(admin => (
            <div key={admin.id} onClick={() => { onAssign(ticketId, admin.email, admin.first_name + ' ' + admin.last_name); setShowDropdown(false); }} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', backgroundColor: admin.email === assignedTo ? '#EDE9FE' : 'transparent' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = admin.email === assignedTo ? '#EDE9FE' : 'transparent'}>
              <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#7C3AED', color: 'white', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(admin.first_name?.[0] || '') + (admin.last_name?.[0] || '')}
              </span>
              <span style={{ fontSize: '14px', color: '#0f172a' }}>{admin.first_name} {admin.last_name}</span>
            </div>
          ))}
          <div onClick={() => { onAssign(ticketId, null, null); setShowDropdown(false); }} style={{ padding: '10px 14px', borderTop: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            Unassign
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminTickets() {
  const [user, setUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.Ticket.list('-created_date'),
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Ticket.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const handleAssign = (ticketId, email, name) => {
    if (email === 'me') {
      updateTicketMutation.mutate({
        id: ticketId,
        data: { assigned_to: user.email, assigned_to_name: user.full_name, status: 'In Progress' }
      });
    } else if (email === null) {
      updateTicketMutation.mutate({
        id: ticketId,
        data: { assigned_to: null, assigned_to_name: null, status: 'Open' }
      });
    } else {
      updateTicketMutation.mutate({
        id: ticketId,
        data: { assigned_to: email, assigned_to_name: name, status: 'In Progress' }
      });
    }
  };

  if (isLoading || !user) {
    return <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading...</div>;
  }

  const counts = {
    all: tickets.length,
    mine: tickets.filter(t => t.assigned_to === user.email).length,
    unassigned: tickets.filter(t => !t.assigned_to).length,
  };

  const filteredTickets = activeFilter === 'all' ? tickets : activeFilter === 'mine' ? tickets.filter(t => t.assigned_to === user.email) : tickets.filter(t => !t.assigned_to);
  const openTickets = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed');

  return (
    <div style={{ padding: '32px' }}>
        {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: '#7C3AED', borderRadius: '16px', padding: '24px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '20px' }}>📬</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{openTickets.length}</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Open Tickets</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '20px' }}>👤</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{counts.mine}</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>My Active Tickets</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '20px' }}>⚠️</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{counts.unassigned}</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Unassigned</div>
          {counts.unassigned > 0 && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Needs attention</div>}
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '20px' }}>✓</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{tickets.filter(t => t.status === 'Resolved').length}</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Resolved</div>
        </div>
      </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '4px', backgroundColor: '#f8fafc', borderRadius: '10px', marginBottom: '20px' }}>
        {[
          { id: 'all', label: 'All Tickets', count: counts.all },
          { id: 'mine', label: 'My Tickets', count: counts.mine },
          { id: 'unassigned', label: 'Unassigned', count: counts.unassigned, highlight: counts.unassigned > 0 },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveFilter(tab.id)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: activeFilter === tab.id ? 'white' : 'transparent', boxShadow: activeFilter === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: activeFilter === tab.id ? '#0f172a' : '#64748b', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {tab.label}
            <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: tab.highlight ? '#FEF3C7' : (activeFilter === tab.id ? '#EDE9FE' : '#e2e8f0'), color: tab.highlight ? '#D97706' : (activeFilter === tab.id ? '#7C3AED' : '#64748b'), fontSize: '12px', fontWeight: '600' }}>
              {tab.count}
            </span>
          </button>
        ))}
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
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 120px 120px 160px 110px 90px 70px', padding: '12px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
          <div>TICKET</div>
          <div>SUBJECT</div>
          <div>GROUP</div>
          <div>ADVISER</div>
          <div>ASSIGNED TO</div>
          <div>STATUS</div>
          <div>PRIORITY</div>
          <div>ACTIONS</div>
        </div>

        {/* Table Rows */}
        {filteredTickets.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>No tickets found</div>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div key={ticket.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 120px 120px 160px 110px 90px 70px', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', alignItems: 'center', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#7C3AED', fontWeight: '600' }}>{ticket.ticket_number}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '2px' }}>{ticket.subject}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{ticket.category}</div>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>{ticket.advice_group_name || '—'}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>{ticket.adviser_name || '—'}</div>
              <AssignedBadge assignedTo={ticket.assigned_to} assignedToName={ticket.assigned_to_name} ticketId={ticket.id} onAssign={handleAssign} />
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