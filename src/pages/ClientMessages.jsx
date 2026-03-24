import { useState, useCallback, useEffect } from "react";
import axiosInstance from '@/api/axiosInstance';
import { CheckCircle2, AlertTriangle, CheckCheck, AlertCircle, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const TASK_TYPES = ["All", "Fact Find Sent", "Fact Find Completed", "SOA Completed", "SOA Presented", "Authority to Proceed Signed", "PDS Provided", "Follow-up", "Document Request", "Compliance Deadline", "Internal To-Do", "Other"];

const MODAL_TASK_TYPES = ["Fact Find Sent", "Fact Find Completed", "SOA Completed", "SOA Presented", "Authority to Proceed Signed", "PDS Provided", "Other"];

const STATUS = ["To Do", "In Progress", "Done"];

const TYPE_BADGE_STYLE = {
  "Fact Find Sent":              "bg-indigo-100 text-indigo-700",
  "Fact Find Completed":         "bg-green-100 text-green-700",
  "SOA Completed":               "bg-green-100 text-green-700",
  "SOA Presented":               "bg-blue-100 text-blue-700",
  "Authority to Proceed Signed": "bg-purple-100 text-purple-700",
  "PDS Provided":                "bg-cyan-100 text-cyan-700",
  "Follow-up":                   "bg-orange-100 text-orange-700",
  "Document Request":            "bg-yellow-100 text-yellow-700",
  "Compliance Deadline":         "bg-red-100 text-red-700",
  "Internal To-Do":              "bg-gray-100 text-gray-600",
  "Other":                       "bg-gray-100 text-gray-600",
};

const STATUS_BADGE_STYLE = {
  "To Do":       "bg-gray-100 text-gray-600",
  "In Progress": "bg-amber-100 text-amber-700",
  "Done":        "bg-green-100 text-green-700",
};

const ROW_BORDER_CLASS = (task, overdue) => {
  if (overdue) return "border-l-4 border-l-red-500";
  if (task.status === "In Progress") return "border-l-4 border-l-amber-400";
  if (task.status === "Done") return "border-l-4 border-l-green-400";
  return "border-l-4 border-l-gray-200";
};

// TODO: wire to API — sample data for demo
const SAMPLE_TASKS = [
  { id: 1,  title: "Send PDS — AustralianSuper Accumulation",     type: "PDS Provided",             assignedTo: "Adviser", status: "To Do",       due: "2026-03-12", notes: "Send before advice meeting.", createdAt: "2026-03-01" },
  { id: 2,  title: "Client to sign Authority to Proceed",          type: "Authority to Proceed Signed", assignedTo: "Client",  status: "To Do",       due: "2026-03-14", notes: "", createdAt: "2026-03-02" },
  { id: 3,  title: "Read PDS — MLC MasterKey Super",               type: "PDS Provided",             assignedTo: "Client",  status: "In Progress", due: "2026-03-13", notes: "Sent via email 8 Mar.", createdAt: "2026-03-03" },
  { id: 4,  title: "Request ATO Tax Return 2024-25",               type: "Document Request",     assignedTo: "Client",  status: "To Do",       due: "2026-03-15", notes: "", createdAt: "2026-03-04" },
  { id: 5,  title: "Follow up on super consolidation",             type: "Follow-up",            assignedTo: "Adviser", status: "In Progress", due: "2026-03-11", notes: "Called once, no answer.", createdAt: "2026-03-05" },
  { id: 6,  title: "FDS due — annual renewal",                     type: "Compliance Deadline",  assignedTo: "Adviser", status: "To Do",       due: "2026-03-20", notes: "Must be sent before 20 March.", createdAt: "2026-03-06" },
  { id: 7,  title: "Prepare cashflow model for review meeting",    type: "Internal To-Do",       assignedTo: "Adviser", status: "To Do",       due: "2026-03-18", notes: "", createdAt: "2026-03-07" },
  { id: 8,  title: "Client to upload Hostplus statement",          type: "Document Request",     assignedTo: "Client",  status: "To Do",       due: "2026-03-16", notes: "", createdAt: "2026-03-08" },
  { id: 9,  title: "Send PDS — Hostplus Indexed Balanced",         type: "PDS Provided",         assignedTo: "Adviser", status: "Done",        due: "2026-03-07", notes: "", createdAt: "2026-03-01" },
  { id: 10, title: "Authority to Proceed — insurance replacement", type: "Authority to Proceed Signed", assignedTo: "Client",  status: "Done",        due: "2026-03-06", notes: "Signed and returned.", createdAt: "2026-03-01" },
  { id: 11, title: "Book annual review meeting",                   type: "Other",                assignedTo: "Client",  status: "To Do",       due: "2026-03-25", notes: "", createdAt: "2026-03-10" },
  { id: 12, title: "Opt-in notice — due this month",               type: "Compliance Deadline",  assignedTo: "Adviser", status: "In Progress", due: "2026-03-22", notes: "", createdAt: "2026-03-11" },
];

const today = new Date().toISOString().split("T")[0];

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function daysOverdue(due) {
  if (!due) return 0;
  const diff = Math.round((new Date(today) - new Date(due)) / 86400000);
  return diff > 0 ? diff : 0;
}

function isOverdue(task) {
  return task.status !== "Done" && task.due && task.due < today;
}

const EMPTY_TASK = { title: "", type: "Fact Find Sent", assignedTo: "Adviser", status: "To Do", due: "", notes: "" };

export default function ClientMessages() {
  const [tasks, setTasks] = useState(SAMPLE_TASKS);
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("due");
  const [sortDir, setSortDir] = useState("asc");
  const [menuOpen, setMenuOpen] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState(EMPTY_TASK);
  const [formErrors, setFormErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = tasks
    .filter(t =>
      (filterType === "All" || t.type === filterType) &&
      (filterStatus === "All" || t.status === filterStatus) &&
      (!search || t.title.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      let av = a[sortCol] || "", bv = b[sortCol] || "";
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const openCount = tasks.filter(t => t.status !== "Done").length;
  const overdueCount = tasks.filter(t => t.status !== "Done" && t.due && t.due < today).length;
  const doneThisWeek = tasks.filter(t => {
    if (t.status !== "Done") return false;
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    return t.due >= weekAgo;
  }).length;

  const handleSort = col => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const cycleStatus = id => {
    setTasks(prev => prev.map(t => t.id !== id ? t : { ...t, status: STATUS[(STATUS.indexOf(t.status) + 1) % STATUS.length] }));
  };

  const deleteTask = id => { setTasks(prev => prev.filter(t => t.id !== id)); setMenuOpen(null); };

  const loadTasks = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/tasks');
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.items || response.data?.data || [];
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const openNew = () => { setEditTask(null); setForm(EMPTY_TASK); setFormErrors({}); setSaveError(''); setShowModal(true); };
  const openEdit = task => { setEditTask(task.id); setForm({ title: task.title, type: task.type, assignedTo: task.assignedTo, status: task.status, due: task.due, notes: task.notes }); setFormErrors({}); setSaveError(''); setShowModal(true); setMenuOpen(null); };

  const saveTask = async () => {
    const errors = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.due) errors.due = 'Due date is required';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setSaveError('');
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      type: form.type,
      assignedTo: form.assignedTo,
      status: form.status,
      dueDate: form.due ? new Date(form.due).toISOString() : null,
      notes: form.notes?.trim() || null,
    };
    try {
      if (editTask) {
        await axiosInstance.put(`/tasks/${editTask}`, payload);
      } else {
        // TODO: confirm endpoint URL with backend
        await axiosInstance.post('/tasks', payload);
      }
      await loadTasks();
      setShowModal(false);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveError('Failed to add task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-900 bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200";

  return (
    <div className="font-sans bg-gray-50 min-h-screen p-6 text-gray-900">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Actions, requests and compliance items</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          + Add Task
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Card 1 — Open Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer">
          <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-4xl font-bold text-gray-900 tracking-tight leading-none mb-1">{openCount}</div>
          <div className="text-sm font-medium text-gray-600">Open Tasks</div>
          <div className="text-xs font-semibold text-gray-500 mt-0.5">{tasks.length} total</div>
        </div>

        {/* Card 2 — Overdue */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer">
          <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-4xl font-bold text-gray-900 tracking-tight leading-none mb-1">{overdueCount}</div>
          <div className="text-sm font-medium text-gray-600">Overdue</div>
          <div className="text-xs font-semibold text-gray-500 mt-0.5">Needs attention</div>
        </div>

        {/* Card 3 — Completed This Week */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer">
          <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-3">
            <CheckCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-4xl font-bold text-gray-900 tracking-tight leading-none mb-1">{doneThisWeek}</div>
          <div className="text-sm font-medium text-gray-600">Completed This Week</div>
          <div className="text-xs font-semibold text-gray-500 mt-0.5">Last 7 days</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 flex flex-col gap-y-3">
        {/* Status row */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-12 shrink-0">Status</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none w-52 bg-gray-50 text-gray-900 focus:border-indigo-400"
          />
          <div className="w-px h-7 bg-gray-200" />
          {["All", ...STATUS].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all whitespace-nowrap border ${
                filterStatus === s
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600 font-bold"
                  : "border-gray-300 bg-white text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Type row */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-12 shrink-0">Type</span>
          <div className="flex gap-1.5 flex-wrap">
            {TASK_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all whitespace-nowrap border ${
                  filterType === type
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600 font-bold"
                    : "border-gray-300 bg-white text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_12rem_9rem_9rem_8rem_8rem_5rem] bg-gray-50 border-b border-gray-200">
          {[
            { key: "title",      label: "TASK" },
            { key: "type",       label: "TYPE" },
            { key: "status",     label: "STATUS" },
            { key: "assignedTo", label: "ASSIGNEE" },
            { key: "createdAt",  label: "CREATED" },
            { key: "due",        label: "DUE" },
            { key: null,         label: "ACTIONS" },
          ].map(({ key, label }, i) => (
            <div
              key={i}
              onClick={() => key && handleSort(key)}
              className={`px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap flex items-center ${key ? "cursor-pointer select-none" : ""}`}
            >
              {label}
              {key && sortCol === key && (
                <span className="ml-1 text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>
              )}
            </div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No tasks</p>
            <p className="text-xs text-gray-400 mt-1">Tasks, requests and compliance items will appear here</p>
          </div>
        ) : (
          filtered.map((task) => {
            const overdue = isOverdue(task);
            const done = task.status === "Done";
            const days = daysOverdue(task.due);

            return (
              <div
                key={task.id}
                className={`grid grid-cols-[1fr_12rem_9rem_9rem_8rem_8rem_5rem] border-b border-gray-50 bg-white hover:bg-gray-50 cursor-pointer transition-colors duration-100 ${ROW_BORDER_CLASS(task, overdue)} ${done ? "opacity-60" : ""}`}
              >
                {/* TASK */}
                <div className="px-3 py-3 flex flex-col justify-center min-w-0">
                  <div className={`text-sm font-semibold truncate ${done ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {task.title}
                  </div>
                  {task.notes && (
                    <div className="text-xs text-gray-400 mt-0.5 truncate">{task.notes}</div>
                  )}
                </div>

                {/* TYPE */}
                <div className="flex items-center px-3">
                  <Badge className={`${TYPE_BADGE_STYLE[task.type] || "bg-gray-100 text-gray-600"} border-0 whitespace-nowrap text-xs`}>
                    {task.type}
                  </Badge>
                </div>

                {/* STATUS */}
                <div className="flex items-center px-3">
                  <Badge className={`${STATUS_BADGE_STYLE[task.status] || "bg-gray-100 text-gray-600"} border-0 whitespace-nowrap text-xs`}>
                    {task.status}
                  </Badge>
                </div>

                {/* ASSIGNEE */}
                <div className="flex items-center px-3">
                  <div className="flex items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                      task.assignedTo === "Client" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {(task.assignedTo || "?")[0]}
                    </div>
                    <span className="text-sm text-gray-700 ml-2">{task.assignedTo}</span>
                  </div>
                </div>

                {/* CREATED */}
                <div className="flex items-center px-3">
                  <span className="text-xs text-gray-500">
                    {task.createdAt ? formatDate(task.createdAt) : "—"}
                  </span>
                </div>

                {/* DUE */}
                <div className="flex items-center px-3">
                  {task.due ? (
                    overdue ? (
                      <span className="text-red-500 font-medium text-xs flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {days}d overdue
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">{formatDate(task.due)}</span>
                    )
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="flex items-center justify-center px-2 relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === task.id ? null : task.id); }}
                    className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center cursor-pointer text-gray-500"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {menuOpen === task.id && (
                    <div className="absolute right-2 top-10 z-50 bg-white border border-gray-200 rounded-xl p-1 shadow-lg min-w-40">
                      <button
                        onClick={() => { setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "Done" } : t)); setMenuOpen(null); }}
                        className="block w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-0 bg-transparent"
                      >
                        Mark as Done
                      </button>
                      <button
                        onClick={() => openEdit(task)}
                        className="block w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-0 bg-transparent"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="block w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 cursor-pointer border-0 bg-transparent"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 flex justify-between">
            <span>{filtered.length} task{filtered.length !== 1 ? "s" : ""}</span>
            {(filterType !== "All" || filterStatus !== "All") && <span>Filtered</span>}
          </div>
        )}
      </div>

      {/* Add/Edit Task Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTask ? "Edit Task" : "Add Task"}</DialogTitle>
            <DialogDescription>Fill in the details below</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Title</label>
              <input
                value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormErrors(prev => ({ ...prev, title: '' })); }}
                placeholder="e.g. Send PDS to client"
                className={`${inputStyle} ${formErrors.title ? 'border-red-500' : ''}`}
              />
              {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputStyle}>
                  {MODAL_TASK_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Assigned To</label>
                {/* TODO: replace with real names from auth/client context */}
                <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} className={inputStyle}>
                  <option value="Adviser">Adviser</option>
                  <option value="Client">Client</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputStyle}>
                  {STATUS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={form.due}
                  onChange={e => { setForm(f => ({ ...f, due: e.target.value })); setFormErrors(prev => ({ ...prev, due: '' })); }}
                  className={`${inputStyle} ${formErrors.due ? 'border-red-500' : ''}`}
                />
                {formErrors.due && <p className="text-red-500 text-xs mt-1">{formErrors.due}</p>}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Notes <span className="font-normal text-gray-400">(optional)</span></label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional context…"
                rows={3}
                className={`${inputStyle} resize-none`}
              />
            </div>
          </div>
          {saveError && <p className="text-red-500 text-xs mt-3">{saveError}</p>}
          <Button onClick={saveTask} disabled={saving} className="w-full mt-4">
            {saving ? "Adding..." : editTask ? "Save Changes" : "Add Task"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
