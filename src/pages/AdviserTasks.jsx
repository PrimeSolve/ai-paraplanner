import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AdviserLayout from '../components/adviser/AdviserLayout';
import axiosInstance from '@/api/axiosInstance';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search,
  Inbox,
  Loader2,
  MoreHorizontal,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';

/* ─── Design System Tokens ───
 * Primary purple:    #4F46E5 (active states, buttons, breadcrumb highlight)
 * Success green:     #059669 / #16A34A (Open Tasks card icon, Done status)
 * Warning amber:     #D97706 (upcoming due dates)
 * Danger red:        #DC2626 (overdue text, Overdue card icon)
 * Neutral greys:     #0F172A (darkest), #334155, #475569, #64748B, #94A3B8, #CBD5E1, #E2E8F0, #F1F5F9, #F8FAFC (lightest)
 * Card backgrounds:  #fff with border #E2E8F0
 * Border radius:     cards 14px, pills 999px (full), avatars 50% (full), buttons 10px
 * Typography:        Page title 24px/700, Section label 13px/600, Body 14px/500, Caption 12px/400, Table header 11px/700 uppercase
 * Font family:       'DM Sans', sans-serif
 *
 * Avatar colours:
 *   Client (C):  bg #DBEAFE, text #1D4ED8
 *   Adviser (A): bg #EDE9FE, text #7C3AED
 */

/* ─── constants ─── */

const TASK_TYPES = [
  'All',
  'Fact Find Sent',
  'Fact Find Completed',
  'SOA Completed',
  'SOA Presented',
  'Authority to Proceed Signed',
  'PDS Provided',
  'Other',
];

const STATUSES = ['To Do', 'In Progress', 'Done'];

const STATUS_COLOURS = {
  'To Do': '#94A3B8',
  'In Progress': '#4F46E5',
  'Done': '#16A34A',
};

const TYPE_COLOURS = {
  'Fact Find Sent': '#4F46E5',
  'Fact Find Completed': '#2563EB',
  'SOA Completed': '#9333EA',
  'SOA Presented': '#EA580C',
  'Authority to Proceed Signed': '#16A34A',
  'PDS Provided': '#D97706',
  'Other': '#64748B',
};

/* Avatar colours locked in per assignee type */
const AVATAR_COLOURS = {
  Client:  { bg: '#DBEAFE', text: '#1D4ED8' },
  Adviser: { bg: '#EDE9FE', text: '#7C3AED' },
};

/* Left border stripe colours by status (overdue takes priority) */
const BORDER_COLOURS = {
  'To Do': '#CBD5E1',
  'In Progress': '#F59E0B',
  'Done': '#4ADE80',
};

function getRelativeDate(dueDate, status) {
  if (!dueDate) return { text: '—', colour: '#64748B' };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffMs = due - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0 && status !== 'Done') {
    return { text: `${Math.abs(diffDays)}d overdue`, colour: '#DC2626' };
  }
  if (diffDays === 0) return { text: 'Today', colour: '#D97706' };
  if (diffDays === 1) return { text: 'Tomorrow', colour: '#D97706' };
  if (diffDays > 1 && diffDays <= 3) return { text: `${diffDays} days`, colour: '#D97706' };
  const d = new Date(dueDate);
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return { text: `${day} ${months[d.getMonth()]}`, colour: '#64748B' };
}

function isOverdue(task) {
  if (!task.due || task.status === 'Done') return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(task.due);
  due.setHours(0, 0, 0, 0);
  return due < now;
}

function isCompletedThisWeek(task) {
  if (task.status !== 'Done' || !task.due) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const due = new Date(task.due);
  due.setHours(0, 0, 0, 0);
  return due >= sevenDaysAgo;
}

/* ─── component ─── */

export default function AdviserTasks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [activeType, setActiveType] = useState('All');
  const [viewMode, setViewMode] = useState('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const menuRef = useRef(null);

  // Modal form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('Fact Find Sent');
  const [formAssignedTo, setFormAssignedTo] = useState('Adviser');
  const [formStatus, setFormStatus] = useState('To Do');
  const [formDue, setFormDue] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  // Adviser/client name context
  // TODO: replace with real names from auth/client context
  const [adviserName, setAdviserName] = useState('Adviser');
  const [clientName, setClientName] = useState('Client');

  /* ─── data fetching ─── */

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
      }
      try {
        const userData = await base44.auth.me();
        const clients = await base44.entities.Client.filter({ user_email: userData.email });
        const clientData = clients[0];
        if (clientData) {
          setClientName((clientData.first_name || '') + ' ' + (clientData.last_name || ''));
          if (clientData.adviser_email) {
            const advisers = await base44.entities.Adviser.filter({ email: clientData.adviser_email });
            if (advisers.length > 0) {
              setAdviserName((advisers[0].first_name || '') + ' ' + (advisers[0].last_name || ''));
            }
          }
        }
      } catch (error) {
        console.error('Failed to load names:', error);
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
    return tasks.filter((task) => {
      const title = (task.title || '').toLowerCase();
      const notes = (task.notes || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || title.includes(query) || notes.includes(query);
      const matchesStatus = activeStatus === 'All' || task.status === activeStatus;
      const matchesType = activeType === 'All' || task.type === activeType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [tasks, searchQuery, activeStatus, activeType]);

  const openCount = useMemo(() => tasks.filter((t) => t.status !== 'Done').length, [tasks]);
  const overdueCount = useMemo(() => tasks.filter((t) => isOverdue(t)).length, [tasks]);
  const completedThisWeekCount = useMemo(() => tasks.filter((t) => isCompletedThisWeek(t)).length, [tasks]);
  const totalCount = tasks.length;

  /* ─── handlers ─── */

  const openAddModal = (presetStatus) => {
    setEditingTask(null);
    setFormTitle('');
    setFormType('Fact Find Sent');
    setFormAssignedTo('Adviser');
    setFormStatus(presetStatus || 'To Do');
    setFormDue('');
    setFormNotes('');
    setFormErrors({});
    setSaveError('');
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormTitle(task.title || '');
    setFormType(task.type || 'Fact Find Sent');
    setFormAssignedTo(task.assignedTo || task.assigned_to || 'Adviser');
    setFormStatus(task.status || 'To Do');
    setFormDue(task.due ? new Date(task.due).toISOString().split('T')[0] : '');
    setFormNotes(task.notes || '');
    setFormErrors({});
    setSaveError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    // Validation
    const errors = {};
    if (!formTitle.trim()) errors.title = 'Title is required';
    if (!formDue) errors.due = 'Due date is required';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSaveError('');
    setSaving(true);

    const payload = {
      title: formTitle.trim(),
      type: formType,
      assignedTo: formAssignedTo,
      status: formStatus,
      dueDate: formDue ? new Date(formDue).toISOString() : null,
      notes: formNotes.trim() || null,
    };
    try {
      if (editingTask) {
        const taskId = editingTask.id || editingTask.taskId;
        await axiosInstance.put(`/tasks/${taskId}`, payload);
      } else {
        // TODO: confirm endpoint URL with backend
        await axiosInstance.post('/tasks', payload);
      }
      await loadTasks();
      setModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveError('Failed to add task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (task) => {
    const taskId = task.id || task.taskId;
    try {
      await axiosInstance.delete(`/tasks/${taskId}`);
      await loadTasks();
    } catch (error) {
      console.error('Delete failed:', error);
      setTasks((prev) => prev.filter((t) => (t.id || t.taskId) !== taskId));
    }
    setOpenMenuId(null);
  };

  const cycleStatus = async (task) => {
    const current = task.status || 'To Do';
    const idx = STATUSES.indexOf(current);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    const taskId = task.id || task.taskId;
    try {
      await axiosInstance.patch(`/tasks/${taskId}`, { status: next });
      await loadTasks();
    } catch (error) {
      console.error('Status update failed:', error);
      setTasks((prev) =>
        prev.map((t) => ((t.id || t.taskId) === taskId ? { ...t, status: next } : t))
      );
    }
  };

  const markAsDone = async (task) => {
    const taskId = task.id || task.taskId;
    try {
      await axiosInstance.patch(`/tasks/${taskId}`, { status: 'Done' });
      await loadTasks();
    } catch (error) {
      console.error('Mark done failed:', error);
      setTasks((prev) =>
        prev.map((t) => ((t.id || t.taskId) === taskId ? { ...t, status: 'Done' } : t))
      );
    }
    setOpenMenuId(null);
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axiosInstance.patch(`/tasks/${taskId}`, { status: newStatus });
      await loadTasks();
    } catch (error) {
      console.error('Status update failed:', error);
      setTasks((prev) =>
        prev.map((t) => ((t.id || t.taskId) === taskId ? { ...t, status: newStatus } : t))
      );
    }
  };

  /* ─── drag and drop ─── */

  const onDragStart = (e, taskId) => {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, status) => {
    e.preventDefault();
    setDragOverCol(status);
  };

  const onDrop = (e, status) => {
    e.preventDefault();
    setDragOverCol(null);
    if (draggingId) {
      updateTaskStatus(draggingId, status);
    }
    setDraggingId(null);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
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
      border: active ? '1px solid #C7D2FE' : '1px solid #CBD5E1',
      background: active ? '#EEF2FF' : 'transparent',
      color: active ? '#4F46E5' : '#64748B',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
      fontFamily: "'DM Sans', sans-serif",
    }),
    statTile: () => ({
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 14,
      padding: '20px 24px',
      flex: 1,
      minWidth: 180,
      transition: 'box-shadow 0.15s, transform 0.15s',
      cursor: 'default',
    }),
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
    actionBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 30,
      height: 30,
      borderRadius: 8,
      fontSize: 14,
      background: '#F1F5F9',
      color: '#334155',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.15s',
      fontFamily: "'DM Sans', sans-serif",
    },
    moreBtn: {
      width: 30,
      height: 30,
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
    viewToggle: (active) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '7px 14px',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      border: 'none',
      background: active ? '#fff' : 'transparent',
      color: active ? '#0F172A' : '#64748B',
      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
      transition: 'all 0.15s',
      fontFamily: "'DM Sans', sans-serif",
    }),
  };

  /* ─── render helpers ─── */

  const renderAvatar = (name) => {
    const letter = (name || 'A')[0].toUpperCase();
    const colours = AVATAR_COLOURS[name] || AVATAR_COLOURS['Adviser'];
    return (
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: colours.bg,
          color: colours.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {letter}
      </div>
    );
  };

  const renderTypeChip = (type) => {
    const colour = TYPE_COLOURS[type] || '#64748B';
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '3px 10px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          background: `${colour}26`,
          color: colour,
          whiteSpace: 'nowrap',
        }}
      >
        {type}
      </span>
    );
  };

  /* ─── render ─── */

  if (loading) {
    return (
      <AdviserLayout currentPage="AdviserTasks">
        <div style={s.page} className="flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#4F46E5' }} />
        </div>
      </AdviserLayout>
    );
  }

  return (
    <AdviserLayout currentPage="AdviserTasks">
      <div style={s.page}>
        {/* ─── Header Row ─── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
              Tasks
            </h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
              Track and manage client and adviser tasks
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* TODO: re-enable when Board view is built */}
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
          <div
            style={s.statTile()}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ListChecks className="w-[18px] h-[18px]" style={{ color: '#4F46E5' }} />
              </div>
            </div>
            <div style={s.statValue('#4F46E5')}>{openCount}</div>
            <div style={s.statLabel}>Open Tasks</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{totalCount} total</div>
          </div>

          <div
            style={s.statTile()}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle className="w-[18px] h-[18px]" style={{ color: '#DC2626' }} />
              </div>
            </div>
            <div style={s.statValue('#DC2626')}>{overdueCount}</div>
            <div style={s.statLabel}>Overdue</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
              {overdueCount > 0 ? 'Needs attention' : 'All on track'}
            </div>
          </div>

          <div
            style={s.statTile()}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 className="w-[18px] h-[18px]" style={{ color: '#2563EB' }} />
              </div>
            </div>
            <div style={s.statValue('#2563EB')}>{completedThisWeekCount}</div>
            <div style={s.statLabel}>Completed This Week</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Last 7 days</div>
          </div>
        </div>

        {/* ─── Filter Bar ─── */}
        <div style={{ ...s.card, padding: '16px 20px', marginBottom: 20 }}>
          {/* Row 1: Search + Status Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ position: 'relative', minWidth: 260 }}>
              <Search
                className="w-4 h-4"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
              />
              <input
                type="text"
                placeholder="Search tasks..."
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
              />
            </div>
            <div style={{ width: 1, height: 28, background: '#E2E8F0' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Status</span>
            <div style={{ display: 'flex', gap: 6 }}>
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

          {/* Row 2: Type Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0, marginRight: 4 }}>Type</span>
            {TASK_TYPES.map((type) => (
              <button
                key={type}
                style={s.pill(activeType === type)}
                onClick={() => setActiveType(type)}
                onMouseEnter={(e) => {
                  if (activeType !== type) e.currentTarget.style.background = '#F1F5F9';
                }}
                onMouseLeave={(e) => {
                  if (activeType !== type) e.currentTarget.style.background = 'transparent';
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* ─── List View ─── */}
        {viewMode === 'list' && (
          <div style={s.card}>
            {filteredTasks.length === 0 && !searchQuery && activeStatus === 'All' && activeType === 'All' ? (
              /* FIX 12 — Empty state */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <ClipboardList className="w-6 h-6" style={{ color: '#94A3B8' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#334155', margin: 0 }}>No tasks yet</p>
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, marginBottom: 0 }}>Tasks, requests and compliance items will appear here</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <Search className="w-10 h-10 mx-auto" style={{ color: '#CBD5E1', marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: '#475569', marginBottom: 4 }}>No tasks found</p>
                <p style={{ fontSize: 13, color: '#94A3B8' }}>Try adjusting your search or filters</p>
              </div>
            ) : (
              <div>
                {/* FIX 4 — Table header row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '10px 20px',
                    borderBottom: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    borderLeft: '3px solid transparent',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Task</div>
                  <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', minWidth: 120 }}>Type</div>
                  <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', minWidth: 100 }}>Assignee</div>
                  <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', minWidth: 90, textAlign: 'right' }}>Due</div>
                  <div style={{ width: 98, flexShrink: 0 }} />
                </div>
                {filteredTasks.map((task) => {
                  const taskId = task.id || task.taskId;
                  const isDone = task.status === 'Done';
                  const overdue = isOverdue(task);
                  /* FIX 5 — Systematic left border stripe: overdue (red) > status colour */
                  const borderColour = overdue ? '#EF4444' : (BORDER_COLOURS[task.status] || '#CBD5E1');
                  const assignee = task.assignedTo || task.assigned_to || 'Adviser';
                  const rel = getRelativeDate(task.due, task.status);
                  const isHovered = hoveredRow === taskId;

                  return (
                    <div
                      key={taskId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '14px 20px',
                        borderBottom: '1px solid #F1F5F9',
                        borderLeft: `3px solid ${borderColour}`,
                        /* FIX 7 — Row hover state */
                        background: isHovered ? '#F8FAFC' : '#fff',
                        /* FIX 6 — Completed row: keep readable, not invisible */
                        opacity: 1,
                        transition: 'background 0.1s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() => setHoveredRow(taskId)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      {/* Title + Notes */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            /* FIX 6 — Completed rows: strikethrough + gray-400, not near-invisible */
                            color: isDone ? '#9CA3AF' : '#0F172A',
                            textDecoration: isDone ? 'line-through' : 'none',
                            marginBottom: task.notes ? 2 : 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {task.title}
                        </div>
                        {task.notes && (
                          <div style={{ fontSize: 12, color: isDone ? '#9CA3AF' : '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.notes}
                          </div>
                        )}
                      </div>

                      {/* Type chip */}
                      <div style={{ flexShrink: 0, minWidth: 120 }}>{renderTypeChip(task.type)}</div>

                      {/* Assignee */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, minWidth: 100 }}>
                        {renderAvatar(assignee)}
                        <span style={{ fontSize: 13, color: isDone ? '#9CA3AF' : '#475569', fontWeight: 500 }}>{assignee}</span>
                      </div>

                      {/* Due date — FIX 8: overdue indicator icon */}
                      <div style={{ flexShrink: 0, minWidth: 90, textAlign: 'right' }}>
                        {overdue ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500, color: '#DC2626' }}>
                            <AlertCircle className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                            {rel.text}
                          </span>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 500, color: rel.colour }}>{rel.text}</span>
                        )}
                      </div>

                      {/* Actions (hover-reveal) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          opacity: isHovered || openMenuId === taskId ? 1 : 0,
                          transition: 'opacity 0.15s',
                          flexShrink: 0,
                        }}
                      >
                        <button
                          style={s.actionBtn}
                          title="Cycle status"
                          onClick={() => cycleStatus(task)}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                        >
                          &#9679;
                        </button>
                        <button
                          style={s.actionBtn}
                          title="Edit"
                          onClick={() => openEditModal(task)}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                        >
                          &#9998;
                        </button>
                        <div style={{ position: 'relative' }} ref={openMenuId === taskId ? menuRef : undefined}>
                          <button
                            style={s.moreBtn}
                            onClick={() => setOpenMenuId(openMenuId === taskId ? null : taskId)}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenuId === taskId && (
                            <div style={s.menu}>
                              <button
                                style={s.menuItem(false)}
                                onClick={() => markAsDone(task)}
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Board View ─── */}
        {viewMode === 'board' && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {STATUSES.map((status) => {
              const columnTasks = filteredTasks.filter((t) => t.status === status);
              const colour = STATUS_COLOURS[status];
              const isDragTarget = dragOverCol === status;

              return (
                <div
                  key={status}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: isDragTarget ? '#EEF2FF' : '#F1F5F9',
                    borderRadius: 14,
                    padding: 12,
                    transition: 'background 0.15s',
                  }}
                  onDragOver={(e) => onDragOver(e, status)}
                  onDrop={(e) => onDrop(e, status)}
                  onDragLeave={() => setDragOverCol(null)}
                >
                  {/* Column header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 4px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: colour, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{status}</span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 22,
                        height: 22,
                        borderRadius: 999,
                        background: '#E2E8F0',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#475569',
                        padding: '0 6px',
                      }}
                    >
                      {columnTasks.length}
                    </span>
                    <div style={{ flex: 1 }} />
                    <button
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        border: '1px solid #CBD5E1',
                        cursor: 'pointer',
                        color: '#94A3B8',
                        fontSize: 16,
                        lineHeight: 1,
                        transition: 'all 0.15s',
                      }}
                      onClick={() => openAddModal(status)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#4F46E5'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
                      title={`Add task to ${status}`}
                    >
                      +
                    </button>
                  </div>

                  {/* Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 60 }}>
                    {columnTasks.length === 0 && (
                      <div
                        style={{
                          border: '2px dashed #CBD5E1',
                          borderRadius: 10,
                          padding: '24px 12px',
                          textAlign: 'center',
                          color: '#94A3B8',
                          fontSize: 13,
                        }}
                      >
                        Drop here
                      </div>
                    )}
                    {columnTasks.map((task) => {
                      const taskId = task.id || task.taskId;
                      const overdue = isOverdue(task);
                      const typeColour = overdue ? '#DC2626' : TYPE_COLOURS[task.type] || '#64748B';
                      const assignee = task.assignedTo || task.assigned_to || 'Adviser';
                      const rel = getRelativeDate(task.due, task.status);
                      const isDragging = draggingId === taskId;

                      return (
                        <div
                          key={taskId}
                          draggable
                          onDragStart={(e) => onDragStart(e, taskId)}
                          onDragEnd={onDragEnd}
                          onClick={() => openEditModal(task)}
                          style={{
                            background: '#fff',
                            border: '1px solid #E2E8F0',
                            borderLeft: `3px solid ${typeColour}`,
                            borderRadius: 10,
                            padding: '12px 14px',
                            cursor: 'grab',
                            opacity: isDragging ? 0.5 : 1,
                            boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
                            transition: 'opacity 0.15s, box-shadow 0.15s',
                          }}
                        >
                          {/* Type label */}
                          <div style={{ fontSize: 11, fontWeight: 700, color: typeColour, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
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

                          {/* Footer: assignee + due */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {renderAvatar(assignee)}
                              <span style={{ fontSize: 12, color: '#64748B' }}>{assignee}</span>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 500, color: rel.colour }}>{rel.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Add / Edit Modal ─── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
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
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Title
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => { setFormTitle(e.target.value); setFormErrors((prev) => ({ ...prev, title: '' })); }}
              placeholder="Task title"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: `1px solid ${formErrors.title ? '#DC2626' : '#E2E8F0'}`,
                fontSize: 13,
                outline: 'none',
                background: '#fff',
                fontFamily: "'DM Sans', sans-serif",
              }}
              autoFocus
            />
            {formErrors.title && (
              <p style={{ color: '#DC2626', fontSize: 12, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{formErrors.title}</p>
            )}
          </div>

          {/* Two-column: Type + Assigned To */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Type
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
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
                {TASK_TYPES.filter((t) => t !== 'All').map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Assigned To
              </label>
              <select
                value={formAssignedTo}
                onChange={(e) => setFormAssignedTo(e.target.value)}
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
                <option value="Adviser">{adviserName}</option>
                <option value="Client">{clientName}</option>
              </select>
            </div>
          </div>

          {/* Two-column: Status + Due Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Due Date
              </label>
              <input
                type="date"
                value={formDue}
                onChange={(e) => { setFormDue(e.target.value); setFormErrors((prev) => ({ ...prev, due: '' })); }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: `1px solid ${formErrors.due ? '#DC2626' : '#E2E8F0'}`,
                  fontSize: 13,
                  outline: 'none',
                  background: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              {formErrors.due && (
                <p style={{ color: '#DC2626', fontSize: 12, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{formErrors.due}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Notes <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span>
            </label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Additional notes..."
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
            />
          </div>

          {/* Footer */}
          <div style={{ paddingTop: 4 }}>
            {saveError && (
              <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>{saveError}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => { setModalOpen(false); setEditingTask(null); }}
                disabled={saving}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#475569',
                  background: '#fff',
                  border: '1px solid #E2E8F0',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  ...s.addBtn,
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Adding...' : editingTask ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdviserLayout>
  );
}
