import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Ticket, UserCheck, AlertCircle, CheckCircle2, MoreHorizontal, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

const ROWS_PER_PAGE = 10;

const StatusBadge = ({ status }) => {
  const config = {
    'Open':        { bg: '#FAEEDA', text: '#633806' },
    'In Progress': { bg: '#E6F1FB', text: '#0C447C' },
    'Resolved':    { bg: '#E8F7F0', text: '#0F6E56' },
    'Awaiting Response': { bg: '#FAEEDA', text: '#633806' },
    'Closed':      { bg: '#F0F3F8', text: '#8A9BBE' },
  }[status] || { bg: '#F0F3F8', text: '#8A9BBE' };
  return (
    <span
      className="inline-flex items-center rounded-full text-[10px] font-semibold whitespace-nowrap"
      style={{ padding: '3px 9px', backgroundColor: config.bg, color: config.text }}
    >
      {status}
    </span>
  );
};

const PriorityDot = ({ priority }) => {
  const config = {
    'High':   { dot: '#E24B4A', text: '#A32D2D' },
    'Medium': { dot: '#F5A623', text: '#854F0B' },
    'Low':    { dot: '#B0BCCF', text: '#8A9BBE' },
    'Urgent': { dot: '#991B1B', text: '#991B1B' },
  }[priority] || { dot: '#B0BCCF', text: '#8A9BBE' };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: config.text }}>
      <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: config.dot }} />
      {priority}
    </span>
  );
};

const AssignedCell = ({ assignedTo, assignedToName, ticketId, onAssign }) => {
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    base44.entities.Admin.list().then(setAdmins);
  }, []);

  if (!assignedTo) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs italic" style={{ color: '#B0BCCF' }}>Unassigned</span>
        <button
          onClick={() => onAssign(ticketId, 'me')}
          className="px-2 py-0.5 rounded border text-[11px] font-semibold transition-colors"
          style={{ borderColor: '#E0E6F0', color: '#00C9B1' }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(0,201,177,0.05)'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Assign to me
        </button>
      </div>
    );
  }

  const initials = assignedToName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A';
  const avatarColors = ['#1D9E75', '#185FA5', '#7C3AED', '#D97706', '#E24B4A'];
  const colorIndex = assignedToName ? assignedToName.charCodeAt(0) % avatarColors.length : 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-2 hover:bg-slate-50 rounded-md px-1 py-0.5 transition-colors">
          <span
            className="w-[22px] h-[22px] rounded-[6px] text-white text-[9px] font-bold flex items-center justify-center shrink-0"
            style={{ backgroundColor: avatarColors[colorIndex] }}
          >
            {initials}
          </span>
          <span className="text-xs" style={{ color: '#3A4A6B' }}>{assignedToName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {admins.map(admin => (
          <DropdownMenuItem
            key={admin.id}
            onClick={() => onAssign(ticketId, admin.email, admin.first_name + ' ' + admin.last_name)}
          >
            <span className="w-6 h-6 rounded-full text-white text-[10px] font-semibold flex items-center justify-center mr-2" style={{ backgroundColor: '#1D9E75' }}>
              {(admin.first_name?.[0] || '') + (admin.last_name?.[0] || '')}
            </span>
            {admin.first_name} {admin.last_name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => onAssign(ticketId, null, null)} className="text-slate-500">
          Unassign
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function AllTickets() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
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
    return <div className="p-8 text-center" style={{ color: '#8A9BBE' }}>Loading...</div>;
  }

  // Computed counts
  const openTickets = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed');
  const myTickets = tickets.filter(t => t.assigned_to === user.email);
  const unassigned = tickets.filter(t => !t.assigned_to);
  const resolvedThisMonth = tickets.filter(t => {
    if (t.status !== 'Resolved') return false;
    const now = new Date();
    const resolved = new Date(t.updated_date || t.created_date);
    return resolved.getMonth() === now.getMonth() && resolved.getFullYear() === now.getFullYear();
  });

  const counts = {
    all: tickets.length,
    mine: myTickets.length,
    unassigned: unassigned.length,
  };

  // Tab filtering
  let tabFiltered = tickets;
  if (activeTab === 'mine') tabFiltered = myTickets;
  if (activeTab === 'unassigned') tabFiltered = unassigned;

  // Get unique groups for filter
  const groups = [...new Set(tickets.map(t => t.advice_group_name).filter(Boolean))];

  // Search + filter
  const filteredTickets = tabFiltered.filter(t => {
    const matchesSearch = !searchTerm ||
      t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticket_number?.toString().includes(searchTerm) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesGroup = groupFilter === 'all' || t.advice_group_name === groupFilter;
    return matchesSearch && matchesPriority && matchesStatus && matchesGroup;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTickets = filteredTickets.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);
  const showingStart = filteredTickets.length === 0 ? 0 : (safePage - 1) * ROWS_PER_PAGE + 1;
  const showingEnd = Math.min(safePage * ROWS_PER_PAGE, filteredTickets.length);

  // Reset page on filter change
  const handleTabChange = (tab) => { setActiveTab(tab); setCurrentPage(1); };

  const tabs = [
    { id: 'all', label: 'All Tickets', count: counts.all },
    { id: 'mine', label: 'My Tickets', count: counts.mine },
    { id: 'unassigned', label: 'Unassigned', count: counts.unassigned },
  ];

  const kpiCards = [
    {
      accent: '#00C9B1',
      iconBg: '#E1F5EE',
      iconColor: '#0F6E56',
      badgeBg: '#FAEEDA',
      badgeColor: '#633806',
      badgeLabel: 'Open',
      value: openTickets.length,
      label: 'Open tickets',
      sub: 'Across all groups',
      icon: <Ticket className="w-3.5 h-3.5" />,
    },
    {
      accent: '#1E88E5',
      iconBg: '#E6F1FB',
      iconColor: '#185FA5',
      badgeBg: '#E6F1FB',
      badgeColor: '#0C447C',
      badgeLabel: 'Assigned to me',
      value: counts.mine,
      label: 'My active tickets',
      sub: 'Requires your attention',
      icon: <UserCheck className="w-3.5 h-3.5" />,
    },
    {
      accent: '#F5A623',
      iconBg: '#FAEEDA',
      iconColor: '#854F0B',
      badgeBg: '#FCEBEB',
      badgeColor: '#A32D2D',
      badgeLabel: 'Needs assignment',
      value: counts.unassigned,
      label: 'Unassigned',
      sub: 'No owner yet',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
    {
      accent: '#1D9E75',
      iconBg: '#E8F7F0',
      iconColor: '#1D9E75',
      badgeBg: '#E8F7F0',
      badgeColor: '#0F6E56',
      badgeLabel: 'This month',
      value: resolvedThisMonth.length,
      label: 'Resolved',
      sub: 'Average 4hrs resolution',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="flex flex-col gap-4" style={{ padding: '20px 24px' }}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs" style={{ color: '#8A9BBE' }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="#8A9BBE"><path d="M8 1L1 7h2v7h4v-4h2v4h4V7h2L8 1z"/></svg>
        <span style={{ color: '#C5CFDF' }}>›</span>
        <span style={{ color: '#0A1628', fontWeight: 500 }}>All Tickets</span>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-3">
        {kpiCards.map((kpi, i) => (
          <div
            key={i}
            className="rounded-xl relative overflow-hidden flex flex-col gap-2"
            style={{
              background: '#fff',
              border: '0.5px solid #E0E6F0',
              padding: '14px 16px',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: kpi.accent, borderRadius: '12px 12px 0 0' }} />
            <div className="flex items-center justify-between">
              <div
                className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
                style={{ background: kpi.iconBg, color: kpi.iconColor }}
              >
                {kpi.icon}
              </div>
              <span
                className="text-[10px] font-semibold rounded-full"
                style={{ padding: '2px 7px', background: kpi.badgeBg, color: kpi.badgeColor }}
              >
                {kpi.badgeLabel}
              </span>
            </div>
            <div className="text-[22px] font-semibold leading-none" style={{ color: '#0A1628', letterSpacing: '-0.3px', fontVariantNumeric: 'tabular-nums' }}>
              {kpi.value}
            </div>
            <div className="text-[11px]" style={{ color: '#8A9BBE' }}>{kpi.label}</div>
            <div className="text-[10px]" style={{ color: '#B0BCCF', marginTop: '1px' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab Row */}
      <div
        className="flex items-center gap-1 w-fit"
        style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E0E6F0', padding: '6px' }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className="flex items-center gap-1.5 transition-colors"
            style={{
              padding: '6px 14px',
              borderRadius: activeTab === tab.id ? '8px 8px 0 0' : '8px',
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? 500 : 400,
              color: activeTab === tab.id ? '#0A1628' : '#8A9BBE',
              background: activeTab === tab.id ? '#F4F6FA' : 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid #00C9B1' : '2px solid transparent',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            {tab.label}
            <span
              className="text-[10px] font-semibold rounded-full"
              style={{
                padding: '1px 6px',
                background: activeTab === tab.id ? 'rgba(0,201,177,0.1)' : '#F0F3F8',
                color: activeTab === tab.id ? '#00C9B1' : '#8A9BBE',
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div
        className="flex items-center gap-2.5"
        style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E0E6F0', padding: '12px 16px' }}
      >
        <div
          className="flex items-center gap-2 flex-1"
          style={{ background: '#F8FAFB', border: '0.5px solid #E0E6F0', borderRadius: '8px', padding: '8px 12px' }}
        >
          <Search className="w-[13px] h-[13px] shrink-0" style={{ color: '#B0BCCF' }} />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="border-none bg-transparent outline-none flex-1"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#0A1628' }}
          />
        </div>
        <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setCurrentPage(1); }}>
          <SelectTrigger
            className="w-[140px] h-9 text-xs"
            style={{ background: '#F8FAFB', border: '0.5px solid #E0E6F0', borderRadius: '8px', color: '#3A4A6B' }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
          <SelectTrigger
            className="w-[140px] h-9 text-xs"
            style={{ background: '#F8FAFB', border: '0.5px solid #E0E6F0', borderRadius: '8px', color: '#3A4A6B' }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={groupFilter} onValueChange={(v) => { setGroupFilter(v); setCurrentPage(1); }}>
          <SelectTrigger
            className="w-[160px] h-9 text-xs"
            style={{ background: '#F8FAFB', border: '0.5px solid #E0E6F0', borderRadius: '8px', color: '#3A4A6B' }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {groups.map(g => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto whitespace-nowrap text-[11px]" style={{ color: '#8A9BBE' }}>
          Showing {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E0E6F0' }}
      >
        {/* Header */}
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: '0.5fr 2fr 1.2fr 1fr 1fr 1fr 0.8fr 0.8fr',
            padding: '10px 16px',
            borderBottom: '0.5px solid #F0F3F8',
            background: '#FAFBFD',
          }}
        >
          {['#', 'Subject', 'Group', 'Adviser', 'Assigned to', 'Status', 'Priority', 'Actions'].map(h => (
            <div
              key={h}
              className="text-[10px] font-semibold uppercase tracking-wider select-none"
              style={{ color: '#8A9BBE', letterSpacing: '0.6px' }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto">
          {paginatedTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2.5 py-16">
              <Inbox className="w-8 h-8" style={{ color: '#B0BCCF', opacity: 0.4 }} />
              <div className="text-[13px] font-medium" style={{ color: '#8A9BBE' }}>No tickets found</div>
              <div className="text-[11px]" style={{ color: '#B0BCCF' }}>Try adjusting your filters or search term</div>
            </div>
          ) : (
            paginatedTickets.map(ticket => (
              <div
                key={ticket.id}
                className="grid items-center transition-colors cursor-pointer"
                style={{
                  gridTemplateColumns: '0.5fr 2fr 1.2fr 1fr 1fr 1fr 0.8fr 0.8fr',
                  padding: '11px 16px',
                  borderBottom: '0.5px solid #F5F7FB',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#FAFBFD'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="text-[11px] font-mono" style={{ color: '#B0BCCF', fontVariantNumeric: 'tabular-nums' }}>
                  #{ticket.ticket_number}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-medium truncate" style={{ color: '#0A1628' }}>
                    {ticket.subject}
                  </div>
                  <div className="text-[10px] mt-0.5 truncate" style={{ color: '#8A9BBE' }}>
                    {ticket.category}
                  </div>
                </div>
                <div className="text-xs" style={{ color: '#3A4A6B' }}>
                  {ticket.advice_group_name || <span style={{ color: '#B0BCCF', fontStyle: 'italic' }}>—</span>}
                </div>
                <div className="text-xs" style={{ color: '#3A4A6B' }}>
                  {ticket.adviser_name || <span style={{ color: '#B0BCCF', fontStyle: 'italic' }}>—</span>}
                </div>
                <div>
                  <AssignedCell
                    assignedTo={ticket.assigned_to}
                    assignedToName={ticket.assigned_to_name}
                    ticketId={ticket.id}
                    onAssign={handleAssign}
                  />
                </div>
                <div>
                  <StatusBadge status={ticket.status} />
                </div>
                <div>
                  <PriorityDot priority={ticket.priority} />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    className="text-[11px] font-medium transition-colors"
                    style={{
                      padding: '5px 12px',
                      borderRadius: '7px',
                      border: '0.5px solid #E0E6F0',
                      background: 'transparent',
                      color: '#3A4A6B',
                      cursor: 'pointer',
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#00C9B1'; e.currentTarget.style.color = '#00C9B1'; e.currentTarget.style.background = 'rgba(0,201,177,0.05)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = '#E0E6F0'; e.currentTarget.style.color = '#3A4A6B'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    View
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center justify-center transition-colors"
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          border: '0.5px solid #E0E6F0',
                          background: 'transparent',
                          color: '#8A9BBE',
                          cursor: 'pointer',
                        }}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Ticket</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredTickets.length > 0 && (
          <div
            className="flex items-center justify-between"
            style={{ padding: '12px 16px', borderTop: '0.5px solid #F0F3F8', background: '#FAFBFD' }}
          >
            <div className="text-[11px]" style={{ color: '#8A9BBE' }}>
              Showing {showingStart}–{showingEnd} of {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="flex items-center justify-center transition-colors"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  border: '0.5px solid #E0E6F0',
                  background: '#fff',
                  color: '#8A9BBE',
                  cursor: safePage <= 1 ? 'default' : 'pointer',
                  opacity: safePage <= 1 ? 0.4 : 1,
                }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className="flex items-center justify-center transition-colors"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
                    border: page === safePage ? 'none' : '0.5px solid #E0E6F0',
                    background: page === safePage ? '#00C9B1' : '#fff',
                    color: page === safePage ? '#fff' : '#3A4A6B',
                    fontSize: '11px',
                    fontWeight: page === safePage ? 600 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="flex items-center justify-center transition-colors"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  border: '0.5px solid #E0E6F0',
                  background: '#fff',
                  color: '#8A9BBE',
                  cursor: safePage >= totalPages ? 'default' : 'pointer',
                  opacity: safePage >= totalPages ? 0.4 : 1,
                }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
