import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AdviserLayout from '../components/adviser/AdviserLayout';
import axiosInstance from '@/api/axiosInstance';
import {
  Search,
  Inbox,
  Loader2,
  ArrowUpDown,
  Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

/* ─── constants ─── */

const TASK_TYPES = [
  'Send PDS',
  'Authority to Proceed',
  'Read PDS',
  'Document Request',
  'Follow-up',
  'Compliance Deadline',
  'Internal To-Do',
  'Client Action',
];

const STATUSES = ['To Do', 'In Progress', 'Done'];

const STATUS_COLOURS = {
  'To Do': '#94A3B8',
  'In Progress': '#4F46E5',
  'Done': '#16A34A',
};

const TYPE_COLOURS = {
  'Send PDS': '#4F46E5',
  'Authority to Proceed': '#9333EA',
  'Read PDS': '#2563EB',
  'Document Request': '#EA580C',
  'Follow-up': '#16A34A',
  'Compliance Deadline': '#DC2626',
  'Internal To-Do': '#64748B',
  'Client Action': '#D97706',
};

const ASSIGNEES = ['Adviser', 'Client'];

function daysBetween(a, b) {
  const msPerDay = 86400000;
  return Math.round((b - a) / msPerDay);
}

function formatRelativeDue(due, status) {
  if (!due) return { text: '—', colour: '#64748B' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(due);
  dueDate.setHours(0, 0, 0, 0);
  const diff = daysBetween(today, dueDate);

  if (status !== 'Done' && diff < 0) {
    return { text: `${Math.abs(diff)}d overdue`, colour: '#DC2626' };
  }
  if (diff === 0) return { text: 'Today', colour: '#D97706' };
  if (diff === 1) return { text: 'Tomorrow', colour: '#D97706' };
  if (diff > 1 && diff <= 3) return { text: `${diff} days`, colour: '#D97706' };
  if (diff > 3 && diff <= 7) return { text: `${diff} days`, colour: '#D97706' };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return { text: `${dueDate.getDate()} ${months[dueDate.getMonth()]}`, colour: '#64748B' };
}

function isOverdue(task) {
  if (task.status === 'Done') return false;
  if (!task.due) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(task.due);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

/* ─── component ─── */

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [activeType, setActiveType] = useState('All');
  const [sortField, setSortField] = useState('due');
  const [sortDir, setSortDir] = useState('asc');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const menuRef = useRef(null);

  const emptyForm = { title: '', type: 'Send PDS', assignedTo: 'Adviser', status: 'To Do', due: '', notes: '' };
  const [formData, setFormData] = useState(emptyForm);

  /* ─── data fetching (unchanged API calls) ─── */

  const loadTasks = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/tasks');
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.items || response.data?.data || [];
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      try {
        const { tasksApi } = await import('@/api/primeSolveClient');
        const t = await tasksApi.getAll();
        setTasks(t);
      } catch {
        setTasks([]);
      }
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await loadTasks();
      } catch (error) {
        console.error('Failed to initialize:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadTasks]);

  /* close menu on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ─── derived data ─── */

  const filteredTasks = useMemo(() => {
    let list = tasks.filter((task) => {
      const title = (task.title || '').toLowerCase();
      const notes = (task.notes || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || title.includes(query) || notes.includes(query);

      const matchesStatus = activeStatus === 'All' || task.status === activeStatus;
      const matchesType = activeType === 'All' || task.type === activeType;

      return matchesSearch && matchesStatus && matchesType;
    });

    list.sort((a, b) => {
      let valA, valB;
      if (sortField === 'title') {
        valA = (a.title || '').toLowerCase();
        valB = (b.title || '').toLowerCase();
      } else if (sortField === 'type') {
        valA = (a.type || '').toLowerCase();
        valB = (b.type || '').toLowerCase();
      } else if (sortField === 'assignedTo') {
        valA = (a.assignedTo || '').toLowerCase();
        valB = (b.assignedTo || '').toLowerCase();
      } else {
        valA = a.due ? new Date(a.due).getTime() : Infinity;
        valB = b.due ? new Date(b.due).getTime() : Infinity;
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [tasks, searchQuery, activeStatus, activeType, sortField, sortDir]);

  const openCount = tasks.filter((t) => t.status !== 'Done').length;
  const totalCount = tasks.length;

  const overdueCount = tasks.filter((t) => isOverdue(t)).length;

  const completedThisWeek = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    return tasks.filter((t) => {
      if (t.status !== 'Done') return false;
      if (!t.due) return false;
      const d = new Date(t.due);
      d.setHours(0, 0, 0, 0);
      return d >= sevenDaysAgo;
    }).length;
  }, [tasks]);

  /* ─── handlers (unchanged API calls) ─── */

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    try {
      if (editingTask) {
        const taskId = editingTask.id || editingTask.taskId;
        await axiosInstance.patch(`/tasks/${taskId}`, formData);
      } else {
        await axiosInstance.post('/tasks', formData);
      }
      await loadTasks();
      setModalOpen(false);
      setEditingTask(null);
      setFormData(emptyForm);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleDelete = async (task) => {
    const taskId = task.id || task.taskId;
    try {
      await axiosInstance.delete(`/tasks/${taskId}`);
      await loadTasks();
    } catch (error) {
      console.error('Delete failed:', error);
    }
    setOpenMenuId(null);
  };

  const handleStatusCycle = async (task) => {
    const idx = STATUSES.indexOf(task.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    const taskId = task.id || task.taskId;
    try {
      await axiosInstance.patch(`/tasks/${taskId}`, { status: next });
      await loadTasks();
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  const handleMarkDone = async (task) => {
    const taskId = task.id || task.taskId;
    try {
      await axiosInstance.patch(`/tasks/${taskId}`, { status: 'Done' });
      await loadTasks();
    } catch (error) {
      console.error('Mark done failed:', error);
    }
    setOpenMenuId(null);
  };

  const handleStatusDrop = async (task, newStatus) => {
    if (task.status === newStatus) return;
    const taskId = task.id || task.taskId;
    try {
      await axiosInstance.patch(`/tasks/${taskId}`, { status: newStatus });
      await loadTasks();
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  const openAddModal = (presetStatus) => {
    setEditingTask(null);
    setFormData({ ...emptyForm, status: presetStatus || 'To Do' });
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      type: task.type || 'Send PDS',
      assignedTo: task.assignedTo || 'Adviser',
      status: task.status || 'To Do',
      due: task.due ? task.due.slice(0, 10) : '',
      notes: task.notes || '',
    });
    setModalOpen(true);
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  /* ─── inline styles ─── */

  const s = {
    page: {
      fontFamily: "'DM Sans', sans-serif",
      background: '#F8FAFC',
      minHeight: '100vh',
      padding: '28px 32px',
    },
    card: {
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 14,
    },
    pill: (active) => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '7px 16px',
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      border: active ? '1px solid #C7D2FE' : '1px solid transparent',
      background: active ? '#EEF2FF' : 'transparent',
      color: active ? '#4F46E5' : '#64748B',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
      fontFamily: "'DM Sans', sans-serif",
    }),
    statTile: {
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 14,
      padding: '20px 24px',
      flex: 1,
      minWidth: 180,
    },
    statValue: (colour) => ({
      fontSize: 28,
      fontWeight: 700,
      color: colour,
      marginBottom: 2,
      fontFamily: "'DM Sans', sans-serif",
    }),
    statLabel: {
      fontSize: 13,
      color: '#64748B',
      fontWeight: 500,
    },
    thBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#64748B',
      fontFamily: "'DM Sans', sans-serif",
    },
    actionBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '5px 12px',
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 500,
      background: '#F1F5F9',
      color: '#334155',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.15s',
      fontFamily: "'DM Sans', sans-serif",
    },
    moreBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F1F5F9',
      border: 'none',
      cursor: 'pointer',
      color: '#64748B',
      transition: 'all 0.15s',
    },
    menu: {
      position: 'absolute',
      right: 0,
      top: '100%',
      marginTop: 4,
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      zIndex: 50,
      minWidth: 180,
      overflow: 'hidden',
    },
    menuItem: (danger) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      padding: '9px 14px',
      fontSize: 13,
      fontWeight: 500,
      color: danger ? '#DC2626' : '#334155',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background 0.15s',
      fontFamily: "'DM Sans', sans-serif",
    }),
    addBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 20px',
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      background: '#4F46E5',
      color: '#fff',
      border: 'none',
      cursor: 'pointer',
      transition: 'background 0.15s',
      fontFamily: "'DM Sans', sans-serif",
    },
    typeChip: (type) => {
      const c = TYPE_COLOURS[type] || '#64748B';
      return {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: c + '26',
        color: c,
        whiteSpace: 'nowrap',
      };
    },
    avatar: (name) => ({
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: name === 'Adviser' ? '#EEF2FF' : '#ECFDF5',
      color: name === 'Adviser' ? '#4F46E5' : '#059669',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 700,
      flexShrink: 0,
    }),
    viewToggle: {
      display: 'inline-flex',
      alignItems: 'center',
      background: '#F1F5F9',
      borderRadius: 10,
      padding: 3,
      gap: 2,
    },
    viewBtn: (active) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '6px 14px',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 500,
      border: 'none',
      cursor: 'pointer',
      background: active ? '#fff' : 'transparent',
      color: active ? '#0F172A' : '#64748B',
      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
      transition: 'all 0.15s',
      fontFamily: "'DM Sans', sans-serif",
    }),
  };

  /* ─── render ─── */

  if (loading) {
    return (
      <AdviserLayout currentPage="TasksPage">
        <div style={s.page} className="flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#4F46E5' }} />
        </div>
      </AdviserLayout>
    );
  }

  return (
    <AdviserLayout currentPage="TasksPage">
      <div style={s.page}>
        {/* ─── Header Row ─── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
              Tasks
            </h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
              Track and manage client tasks
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* View Toggle */}
            <div style={s.viewToggle}>
              <button
                style={s.viewBtn(viewMode === 'list')}
                onClick={() => setViewMode('list')}
              >
                ☰ List
              </button>
              <button
                style={s.viewBtn(viewMode === 'board')}
                onClick={() => setViewMode('board')}
              >
                ⊞ Board
              </button>
            </div>
            <button
              style={s.addBtn}
              onClick={() => openAddModal()}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#4338CA')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#4F46E5')}
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>

        {/* ─── Stat Tiles ─── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={s.statTile}>
            <div style={s.statValue('#4F46E5')}>{openCount}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>Open Tasks</div>
            <div style={s.statLabel}>{totalCount} total</div>
          </div>

          <div style={s.statTile}>
            <div style={s.statValue('#DC2626')}>{overdueCount}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>Overdue</div>
            <div style={s.statLabel}>{overdueCount > 0 ? 'Needs attention' : 'All on track'}</div>
          </div>

          <div style={s.statTile}>
            <div style={s.statValue('#059669')}>{completedThisWeek}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>Completed This Week</div>
            <div style={s.statLabel}>Last 7 days</div>
          </div>
        </div>

        {/* ─── Filter Bar ─── */}
        <div style={{ ...s.card, padding: '16px 20px', marginBottom: 20 }}>
          {/* Row 1: Search + Status pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: 240, flex: '0 0 auto' }}>
              <Search
                className="w-4 h-4"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
              />
              <input
                type="text"
                placeholder="Search tasks…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px 9px 36px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  fontSize: 13,
                  outline: 'none',
                  background: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#4F46E5')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
              />
            </div>
            <div style={{ width: 1, height: 28, background: '#E2E8F0', flexShrink: 0 }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['All', ...STATUSES].map((st) => (
                <button
                  key={st}
                  style={s.pill(activeStatus === st)}
                  onClick={() => setActiveStatus(st)}
                  onMouseEnter={(e) => {
                    if (activeStatus !== st) e.currentTarget.style.background = '#F1F5F9';
                  }}
                  onMouseLeave={(e) => {
                    if (activeStatus !== st) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Type pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              style={s.pill(activeType === 'All')}
              onClick={() => setActiveType('All')}
              onMouseEnter={(e) => {
                if (activeType !== 'All') e.currentTarget.style.background = '#F1F5F9';
              }}
              onMouseLeave={(e) => {
                if (activeType !== 'All') e.currentTarget.style.background = 'transparent';
              }}
            >
              All
            </button>
            {TASK_TYPES.map((t) => (
              <button
                key={t}
                style={s.pill(activeType === t)}
                onClick={() => setActiveType(t)}
                onMouseEnter={(e) => {
                  if (activeType !== t) e.currentTarget.style.background = '#F1F5F9';
                }}
                onMouseLeave={(e) => {
                  if (activeType !== t) e.currentTarget.style.background = 'transparent';
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ─── List View ─── */}
        {viewMode === 'list' && (
          <div style={s.card}>
            {tasks.length === 0 && !searchQuery && activeStatus === 'All' && activeType === 'All' ? (
              <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                <Inbox className="w-16 h-16 mx-auto" style={{ color: '#CBD5E1', marginBottom: 16 }} />
                <h3 style={{ fontSize: 17, fontWeight: 600, color: '#334155', marginBottom: 6 }}>No tasks yet</h3>
                <p style={{ fontSize: 14, color: '#64748B', maxWidth: 380, margin: '0 auto 20px' }}>
                  Create your first task to start tracking client actions and deadlines.
                </p>
                <button
                  style={s.addBtn}
                  onClick={() => openAddModal()}
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 0', width: 4 }} />
                      <th style={{ padding: '12px 12px', textAlign: 'left' }}>
                        <button style={s.thBtn} onClick={() => toggleSort('title')}>
                          Task <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th style={{ padding: '12px 12px', textAlign: 'left' }}>
                        <button style={s.thBtn} onClick={() => toggleSort('type')}>
                          Type <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th style={{ padding: '12px 12px', textAlign: 'left' }}>
                        <button style={s.thBtn} onClick={() => toggleSort('assignedTo')}>
                          Assigned To <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th style={{ padding: '12px 12px', textAlign: 'left' }}>
                        <button style={s.thBtn} onClick={() => toggleSort('due')}>
                          Due <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th style={{ padding: '12px 20px', textAlign: 'right', width: 130 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map((task) => {
                        const taskId = task.id || task.taskId;
                        const isHovered = hoveredRow === taskId;
                        const isDone = task.status === 'Done';
                        const overdue = isOverdue(task);
                        const { text: dueText, colour: dueColour } = formatRelativeDue(task.due, task.status);
                        const borderColour = overdue ? '#DC2626' : STATUS_COLOURS[task.status] || '#94A3B8';

                        return (
                          <tr
                            key={taskId}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              background: isHovered ? '#F8FAFC' : '#fff',
                              transition: 'background 0.15s',
                              opacity: isDone ? 0.55 : 1,
                            }}
                            onMouseEnter={() => setHoveredRow(taskId)}
                            onMouseLeave={() => setHoveredRow(null)}
                          >
                            {/* Left border */}
                            <td style={{ padding: 0, width: 4 }}>
                              <div style={{ width: 4, height: '100%', minHeight: 56, background: borderColour, borderRadius: '4px 0 0 4px' }} />
                            </td>

                            {/* Title + notes */}
                            <td style={{ padding: '14px 12px' }}>
                              <div>
                                <div style={{
                                  fontSize: 14,
                                  fontWeight: 500,
                                  color: '#0F172A',
                                  marginBottom: task.notes ? 2 : 0,
                                  textDecoration: isDone ? 'line-through' : 'none',
                                }}>
                                  {task.title}
                                </div>
                                {task.notes && (
                                  <div style={{ fontSize: 12, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                                    {task.notes}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Type chip */}
                            <td style={{ padding: '14px 12px' }}>
                              <span style={s.typeChip(task.type)}>{task.type}</span>
                            </td>

                            {/* Assigned To */}
                            <td style={{ padding: '14px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <div style={s.avatar(task.assignedTo)}>
                                  {(task.assignedTo || 'A')[0]}
                                </div>
                                <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{task.assignedTo}</span>
                              </div>
                            </td>

                            {/* Due */}
                            <td style={{ padding: '14px 12px' }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: dueColour }}>{dueText}</span>
                            </td>

                            {/* Actions (hover-reveal) */}
                            <td style={{ padding: '14px 20px' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: 6,
                                  opacity: isHovered || openMenuId === taskId ? 1 : 0,
                                  transition: 'opacity 0.15s',
                                }}
                              >
                                <button
                                  style={s.actionBtn}
                                  title="Cycle status"
                                  onClick={() => handleStatusCycle(task)}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                                >
                                  ●
                                </button>
                                <button
                                  style={s.actionBtn}
                                  title="Edit"
                                  onClick={() => openEditModal(task)}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                                >
                                  ✎
                                </button>
                                <div style={{ position: 'relative' }} ref={openMenuId === taskId ? menuRef : undefined}>
                                  <button
                                    style={s.moreBtn}
                                    onClick={() => setOpenMenuId(openMenuId === taskId ? null : taskId)}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                                  >
                                    ⋯
                                  </button>
                                  {openMenuId === taskId && (
                                    <div style={s.menu}>
                                      <button
                                        style={s.menuItem(false)}
                                        onClick={() => handleMarkDone(task)}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                      >
                                        Mark as Done
                                      </button>
                                      <button
                                        style={s.menuItem(false)}
                                        onClick={() => { openEditModal(task); setOpenMenuId(null); }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                      >
                                        Edit
                                      </button>
                                      <div style={{ height: 1, background: '#F1F5F9', margin: '2px 0' }} />
                                      <button
                                        style={s.menuItem(true)}
                                        onClick={() => handleDelete(task)}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center' }}>
                          <Search className="w-10 h-10 mx-auto" style={{ color: '#CBD5E1', marginBottom: 12 }} />
                          <p style={{ fontSize: 14, fontWeight: 500, color: '#475569', marginBottom: 4 }}>No tasks found</p>
                          <p style={{ fontSize: 13, color: '#94A3B8' }}>Try adjusting your search or filters</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── Board View ─── */}
        {viewMode === 'board' && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {STATUSES.map((status) => {
              const colTasks = filteredTasks.filter((t) => t.status === status);
              const colColour = STATUS_COLOURS[status];
              const isDropTarget = dragOverCol === status;

              return (
                <div
                  key={status}
                  style={{
                    flex: 1,
                    minWidth: 260,
                    background: isDropTarget ? '#EEF2FF' : '#F1F5F9',
                    borderRadius: 14,
                    padding: 12,
                    transition: 'background 0.15s',
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverCol(status);
                  }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverCol(null);
                    if (draggingId) {
                      const task = tasks.find((t) => (t.id || t.taskId) === draggingId);
                      if (task) handleStatusDrop(task, status);
                    }
                    setDraggingId(null);
                  }}
                >
                  {/* Column header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 4px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: colColour, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{status}</span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 22,
                      height: 22,
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      background: '#E2E8F0',
                      color: '#475569',
                      padding: '0 6px',
                    }}>
                      {colTasks.length}
                    </span>
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={() => openAddModal(status)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'none',
                        border: '1px solid #CBD5E1',
                        cursor: 'pointer',
                        color: '#94A3B8',
                        fontSize: 14,
                        lineHeight: 1,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.color = '#4F46E5'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#94A3B8'; }}
                    >
                      +
                    </button>
                  </div>

                  {/* Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 60 }}>
                    {colTasks.length === 0 ? (
                      <div style={{
                        border: '2px dashed #CBD5E1',
                        borderRadius: 10,
                        padding: '24px 12px',
                        textAlign: 'center',
                        color: '#94A3B8',
                        fontSize: 13,
                      }}>
                        Drop here
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const taskId = task.id || task.taskId;
                        const overdue = isOverdue(task);
                        const { text: dueText, colour: dueColour } = formatRelativeDue(task.due, task.status);
                        const typeColour = TYPE_COLOURS[task.type] || '#64748B';
                        const leftBorder = overdue ? '#DC2626' : typeColour;

                        return (
                          <div
                            key={taskId}
                            draggable
                            onDragStart={() => setDraggingId(taskId)}
                            onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                            onClick={() => openEditModal(task)}
                            style={{
                              background: '#fff',
                              border: '1px solid #E2E8F0',
                              borderLeft: `3px solid ${leftBorder}`,
                              borderRadius: 10,
                              padding: '12px 14px',
                              cursor: 'grab',
                              opacity: draggingId === taskId ? 0.5 : 1,
                              boxShadow: draggingId === taskId ? '0 4px 16px rgba(0,0,0,0.12)' : 'none',
                              transition: 'opacity 0.15s, box-shadow 0.15s',
                            }}
                          >
                            {/* Type label */}
                            <div style={{ fontSize: 11, fontWeight: 700, color: typeColour, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                              {task.type}
                            </div>
                            {/* Title */}
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: task.notes ? 4 : 8 }}>
                              {task.title}
                            </div>
                            {/* Notes */}
                            {task.notes && (
                              <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {task.notes}
                              </div>
                            )}
                            {/* Footer */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={s.avatar(task.assignedTo)}>
                                  {(task.assignedTo || 'A')[0]}
                                </div>
                                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{task.assignedTo}</span>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 500, color: dueColour }}>{dueText}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Add / Edit Modal ─── */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) { setModalOpen(false); setEditingTask(null); setFormData(emptyForm); } }}>
        <DialogContent className="sm:max-w-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
              {editingTask ? 'Edit Task' : 'Add Task'}
            </DialogTitle>
            <DialogDescription style={{ fontSize: 14, color: '#64748B' }}>
              {editingTask ? 'Update the task details below.' : 'Fill in the details to create a new task.'}
            </DialogDescription>
          </DialogHeader>

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Task title"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                fontSize: 14,
                outline: 'none',
                background: '#fff',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#4F46E5')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
              autoFocus
            />
          </div>

          {/* Two-column: Type + Assigned To */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  fontSize: 13,
                  outline: 'none',
                  background: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Assigned To</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  fontSize: 13,
                  outline: 'none',
                  background: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {ASSIGNEES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Two-column: Status + Due Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  fontSize: 13,
                  outline: 'none',
                  background: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Due Date</label>
              <input
                type="date"
                value={formData.due}
                onChange={(e) => setFormData({ ...formData, due: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  fontSize: 13,
                  outline: 'none',
                  background: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#4F46E5')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes…"
              rows={3}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                fontSize: 13,
                outline: 'none',
                background: '#fff',
                fontFamily: "'DM Sans', sans-serif",
                resize: 'vertical',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#4F46E5')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
            />
          </div>

          {/* Footer buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
            <button
              onClick={() => { setModalOpen(false); setEditingTask(null); setFormData(emptyForm); }}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                color: '#475569',
                background: '#fff',
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.title.trim()}
              style={{
                ...s.addBtn,
                opacity: !formData.title.trim() ? 0.5 : 1,
                cursor: !formData.title.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {editingTask ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdviserLayout>
  );
}
