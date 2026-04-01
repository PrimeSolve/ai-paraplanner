import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Ticket, UserCheck, AlertCircle, CheckCircle2, MoreHorizontal, Inbox } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const config = {
    'Open':        { bg: 'bg-amber-100', text: 'text-amber-700' },
    'In Progress': { bg: 'bg-blue-100',  text: 'text-blue-700' },
    'Resolved':    { bg: 'bg-green-100', text: 'text-green-700' },
    'Awaiting Response': { bg: 'bg-amber-100', text: 'text-amber-700' },
    'Closed':      { bg: 'bg-slate-100', text: 'text-slate-600' },
  }[status] || { bg: 'bg-slate-100', text: 'text-slate-600' };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {status}
    </span>
  );
};

const PriorityDot = ({ priority }) => {
  const color = {
    'High': 'bg-red-500',
    'Medium': 'bg-amber-500',
    'Low': 'bg-slate-400',
    'Urgent': 'bg-red-700',
  }[priority] || 'bg-slate-400';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <span className={`w-2 h-2 rounded-full ${color}`} />
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
        <span className="text-xs italic text-slate-400">Unassigned</span>
        <button
          onClick={() => onAssign(ticketId, 'me')}
          className="px-2 py-0.5 rounded border border-slate-200 text-[11px] font-semibold text-teal-600 hover:bg-teal-50 transition-colors"
        >
          Assign to me
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-2 hover:bg-slate-50 rounded-md px-1 py-0.5 transition-colors">
          <span className="w-[22px] h-[22px] rounded-full bg-purple-600 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
            {assignedToName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'}
          </span>
          <span className="text-xs font-medium text-slate-800 truncate">{assignedToName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {admins.map(admin => (
          <DropdownMenuItem
            key={admin.id}
            onClick={() => onAssign(ticketId, admin.email, admin.first_name + ' ' + admin.last_name)}
          >
            <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-[10px] font-semibold flex items-center justify-center mr-2">
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
    return <div className="p-8 text-center text-slate-400">Loading...</div>;
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

  // Search + filter
  const filteredTickets = tabFiltered.filter(t => {
    const matchesSearch = !searchTerm ||
      t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticket_number?.toString().includes(searchTerm) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const tabs = [
    { id: 'all', label: 'All Tickets', count: counts.all },
    { id: 'mine', label: 'My Tickets', count: counts.mine },
    { id: 'unassigned', label: 'Unassigned', count: counts.unassigned },
  ];

  return (
    <div className="py-6 px-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <span>🏠</span>
        <span>›</span>
        <span className="text-slate-800 font-medium">All Tickets</span>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {/* Open Tickets — teal bar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-teal-500" />
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mb-3">
            <Ticket className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{openTickets.length}</div>
          <div className="text-sm text-slate-500">Open Tickets</div>
        </div>

        {/* My Active — blue bar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <UserCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{counts.mine}</div>
          <div className="text-sm text-slate-500">My Active Tickets</div>
        </div>

        {/* Unassigned — amber bar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{counts.unassigned}</div>
          <div className="text-sm text-slate-500">Unassigned</div>
        </div>

        {/* Resolved — green bar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{resolvedThisMonth.length}</div>
          <div className="text-sm text-slate-500">Resolved This Month</div>
        </div>
      </div>

      {/* Tab Row */}
      <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-slate-800'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            style={activeTab === tab.id ? { fontWeight: 500 } : {}}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {tab.count}
            </span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00C9B1] rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 mb-6">
        <div className="p-5 flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 border-slate-200"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Priority</span>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[160px] h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-slate-400 self-end pb-2.5">
            {filteredTickets.length} result{filteredTickets.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '0.6fr' }}>Ticket #</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '2fr' }}>Subject</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '1fr' }}>Group</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '1fr' }}>Adviser</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '1fr' }}>Assigned To</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '1fr' }}>Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '1fr' }}>Priority</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ width: '1fr' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                      <Inbox className="w-12 h-12 mb-3 text-slate-300" />
                      <div className="text-base font-medium text-slate-500">No tickets found</div>
                      <div className="text-sm mt-1">Try adjusting your filters or search term</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-slate-400">#{ticket.ticket_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-slate-800 truncate max-w-[320px]" style={{ fontWeight: 500 }}>
                        {ticket.subject}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{ticket.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500">{ticket.advice_group_name || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500">{ticket.adviser_name || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <AssignedCell
                        assignedTo={ticket.assigned_to}
                        assignedToName={ticket.assigned_to_name}
                        ticketId={ticket.id}
                        onAssign={handleAssign}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4">
                      <PriorityDot priority={ticket.priority} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button className="px-3 py-1.5 bg-[#14B8A6] text-white rounded-lg text-xs font-semibold hover:bg-teal-600 transition-colors">
                          View
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50 transition-colors">
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Ticket</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
