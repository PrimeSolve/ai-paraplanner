import { useState } from "react";


const TASK_TYPES = ["All", "Send PDS", "Authority to Proceed", "Read PDS", "Document Request", "Follow-up", "Compliance Deadline", "Internal To-Do", "Client Action"];

const STATUS = ["To Do", "In Progress", "Done"];

const STATUS_COLOR = {
  "To Do":       "#94A3B8",
  "In Progress": "#4F46E5",
  "Done":        "#16A34A",
};

const STATUS_BG = {
  "To Do":       { bg: "#F1F5F9", fg: "#475569" },
  "In Progress": { bg: "#EEF2FF", fg: "#4F46E5" },
  "Done":        { bg: "#F0FDF4", fg: "#16A34A" },
};

const TYPE_COLOR = {
  "Send PDS":             "#4F46E5",
  "Authority to Proceed": "#9333EA",
  "Read PDS":             "#2563EB",
  "Document Request":     "#EA580C",
  "Follow-up":            "#16A34A",
  "Compliance Deadline":  "#DC2626",
  "Internal To-Do":       "#64748B",
  "Client Action":        "#D97706",
};

const ASSIGNED_COLOR = {
  Adviser: "#4F46E5",
  Client:  "#16A34A",
};

const SAMPLE_TASKS = [
  { id: 1,  title: "Send PDS — AustralianSuper Accumulation",     type: "Send PDS",             assignedTo: "Adviser", status: "To Do",       due: "2026-03-12", notes: "Send before advice meeting." },
  { id: 2,  title: "Client to sign Authority to Proceed",          type: "Authority to Proceed", assignedTo: "Client",  status: "To Do",       due: "2026-03-14", notes: "" },
  { id: 3,  title: "Read PDS — MLC MasterKey Super",               type: "Read PDS",             assignedTo: "Client",  status: "In Progress", due: "2026-03-13", notes: "Sent via email 8 Mar." },
  { id: 4,  title: "Request ATO Tax Return 2024-25",               type: "Document Request",     assignedTo: "Client",  status: "To Do",       due: "2026-03-15", notes: "" },
  { id: 5,  title: "Follow up on super consolidation",             type: "Follow-up",            assignedTo: "Adviser", status: "In Progress", due: "2026-03-11", notes: "Called once, no answer." },
  { id: 6,  title: "FDS due — annual renewal",                     type: "Compliance Deadline",  assignedTo: "Adviser", status: "To Do",       due: "2026-03-20", notes: "Must be sent before 20 March." },
  { id: 7,  title: "Prepare cashflow model for review meeting",    type: "Internal To-Do",       assignedTo: "Adviser", status: "To Do",       due: "2026-03-18", notes: "" },
  { id: 8,  title: "Client to upload Hostplus statement",          type: "Document Request",     assignedTo: "Client",  status: "To Do",       due: "2026-03-16", notes: "" },
  { id: 9,  title: "Send PDS — Hostplus Indexed Balanced",         type: "Send PDS",             assignedTo: "Adviser", status: "Done",        due: "2026-03-07", notes: "" },
  { id: 10, title: "Authority to Proceed — insurance replacement", type: "Authority to Proceed", assignedTo: "Client",  status: "Done",        due: "2026-03-06", notes: "Signed and returned." },
  { id: 11, title: "Book annual review meeting",                   type: "Client Action",        assignedTo: "Client",  status: "To Do",       due: "2026-03-25", notes: "" },
  { id: 12, title: "Opt-in notice — due this month",               type: "Compliance Deadline",  assignedTo: "Adviser", status: "In Progress", due: "2026-03-22", notes: "" },
];

const today = new Date().toISOString().split("T")[0];

function relativeDate(due) {
  if (!due) return null;
  const diff = Math.round((new Date(due) - new Date(today)) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: "Today", today: true };
  if (diff === 1) return { label: "Tomorrow", soon: true };
  if (diff <= 7) return { label: `${diff} days`, soon: diff <= 3 };
  return { label: new Date(due).toLocaleDateString("en-AU", { day: "numeric", month: "short" }), overdue: false };
}

function Avatar({ name, color }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: color + "20", color: color, fontSize: 9, fontWeight: 800, flexShrink: 0 }}>
      {name[0]}
    </span>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 36, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>{value}</div>
        <div style={{ fontSize: 14, color: "#475569", fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "#475569", marginTop: 2, fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  );
}

const EMPTY_TASK = { title: "", type: "Follow-up", assignedTo: "Adviser", status: "To Do", due: "", notes: "" };

export default function ClientMessages() {
  const [tasks, setTasks] = useState(SAMPLE_TASKS);
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("due");
  const [sortDir, setSortDir] = useState("asc");
  const [view, setView] = useState("list");
  const [menuOpen, setMenuOpen] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState(EMPTY_TASK);
  const [dragging, setDragging] = useState(null);

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

  const SortIcon = ({ col }) => (
    <span style={{ fontSize: 10, opacity: sortCol === col ? 1 : 0.3, marginLeft: 3 }}>
      {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  const cycleStatus = id => {
    setTasks(prev => prev.map(t => t.id !== id ? t : { ...t, status: STATUS[(STATUS.indexOf(t.status) + 1) % STATUS.length] }));
  };

  const deleteTask = id => { setTasks(prev => prev.filter(t => t.id !== id)); setMenuOpen(null); };

  const openNew = () => { setEditTask(null); setForm(EMPTY_TASK); setShowModal(true); };
  const openEdit = task => { setEditTask(task.id); setForm({ title: task.title, type: task.type, assignedTo: task.assignedTo, status: task.status, due: task.due, notes: task.notes }); setShowModal(true); setMenuOpen(null); };

  const saveTask = () => {
    if (!form.title.trim()) return;
    if (editTask) setTasks(prev => prev.map(t => t.id === editTask ? { ...t, ...form } : t));
    else setTasks(prev => [...prev, { ...form, id: Date.now() }]);
    setShowModal(false);
  };

  const moveToStatus = (taskId, status) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", color: "#0F172A", background: "#fff" };

  const isOverdue = t => t.status !== "Done" && t.due && t.due < today;

  // ── LIST ROW ──────────────────────────────────────────────────────────────
  const ListRow = ({ task, i, last }) => {
    const rd = relativeDate(task.due);
    const overdue = isOverdue(task);
    const done = task.status === "Done";
    return (
      <div className="task-row" style={{
        display: "grid", gridTemplateColumns: "4px 1fr 160px 90px 90px 80px",
        borderBottom: last ? "none" : "1px solid #F1F5F9",
        alignItems: "stretch", background: "#fff", transition: "background 0.1s",
        opacity: done ? 0.55 : 1,
      }}>
        {/* Status bar */}
        <div style={{ background: overdue ? "#DC2626" : STATUS_COLOR[task.status], borderRadius: i === 0 ? "0" : "0", flexShrink: 0 }} />

        {/* Title + notes */}
        <div className="task-row-inner" style={{ padding: "11px 14px 11px 12px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", lineHeight: 1.3, textDecoration: done ? "line-through" : "none" }}>{task.title}</div>
          {task.notes && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{task.notes}</div>}
        </div>

        {/* Type */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 8px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[task.type] || "#64748B", background: (TYPE_COLOR[task.type] || "#64748B") + "15", padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
            {task.type}
          </span>
        </div>

        {/* Assigned */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 8px" }}>
          <Avatar name={task.assignedTo} color={ASSIGNED_COLOR[task.assignedTo]} />
          <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>{task.assignedTo}</span>
        </div>

        {/* Due */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 8px" }}>
          {rd ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: rd.overdue ? "#DC2626" : rd.today ? "#D97706" : rd.soon ? "#D97706" : "#64748B" }}>
              {rd.label}
            </span>
          ) : <span style={{ color: "#CBD5E1", fontSize: 12 }}>—</span>}
        </div>

        {/* Actions */}
        <div className="row-actions" style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 10px", opacity: 0, transition: "opacity 0.15s" }}>
          <button className="action-btn" onClick={() => cycleStatus(task.id)} title="Cycle status" style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: STATUS_COLOR[task.status] }}>●</button>
          <button className="action-btn" onClick={() => openEdit(task)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>✎</button>
          <div style={{ position: "relative" }}>
            <button className="action-btn" onClick={() => setMenuOpen(menuOpen === task.id ? null : task.id)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>⋯</button>
            {menuOpen === task.id && (
              <div style={{ position: "absolute", right: 0, top: 30, zIndex: 50, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", minWidth: 160 }}>
                {["Mark as Done", "Edit", "Delete"].map((action, ai) => (
                  <button key={ai} className={`menu-item${action === "Delete" ? " danger" : ""}`}
                    onClick={() => {
                      if (action === "Delete") deleteTask(task.id);
                      else if (action === "Edit") openEdit(task);
                      else { setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "Done" } : t)); setMenuOpen(null); }
                    }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 500, color: action === "Delete" ? "#DC2626" : "#374151" }}>
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── BOARD CARD ────────────────────────────────────────────────────────────
  const BoardCard = ({ task }) => {
    const rd = relativeDate(task.due);
    const overdue = isOverdue(task);
    return (
      <div
        draggable
        onDragStart={() => setDragging(task.id)}
        onDragEnd={() => setDragging(null)}
        onClick={() => openEdit(task)}
        style={{
          background: "#fff", borderRadius: 10,
          border: `1px solid ${overdue ? "#FECACA" : "#E2E8F0"}`,
          borderLeft: `3px solid ${overdue ? "#DC2626" : TYPE_COLOR[task.type] || "#E2E8F0"}`,
          padding: "10px 12px", cursor: "pointer",
          boxShadow: dragging === task.id ? "0 8px 24px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
          opacity: dragging === task.id ? 0.5 : 1,
          transition: "box-shadow 0.15s, opacity 0.15s",
          userSelect: "none",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: TYPE_COLOR[task.type] || "#64748B", marginBottom: 6 }}>{task.type}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", lineHeight: 1.4, marginBottom: 8 }}>{task.title}</div>
        {task.notes && <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8, lineHeight: 1.4 }}>{task.notes}</div>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Avatar name={task.assignedTo} color={ASSIGNED_COLOR[task.assignedTo]} />
            <span style={{ fontSize: 11, color: "#64748B" }}>{task.assignedTo}</span>
          </div>
          {rd && (
            <span style={{ fontSize: 11, fontWeight: 700, color: rd.overdue ? "#DC2626" : rd.today || rd.soon ? "#D97706" : "#94A3B8" }}>
              {rd.label}
            </span>
          )}
        </div>
      </div>
    );
  };

  // ── BOARD COLUMN ──────────────────────────────────────────────────────────
  const BoardColumn = ({ status }) => {
    const colTasks = tasks.filter(t =>
      t.status === status &&
      (filterType === "All" || t.type === filterType) &&
      (!search || t.title.toLowerCase().includes(search.toLowerCase()))
    );
    return (
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={() => { if (dragging) moveToStatus(dragging, status); }}
        style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0 }}
      >
        {/* Column header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLOR[status] }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{status}</span>
            <span style={{ fontSize: 11, fontWeight: 700, background: "#F1F5F9", color: "#64748B", padding: "1px 7px", borderRadius: 10 }}>{colTasks.length}</span>
          </div>
          <button onClick={() => { setForm({ ...EMPTY_TASK, status }); setEditTask(null); setShowModal(true); }} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", color: "#94A3B8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 300 }}>+</button>
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 80 }}>
          {colTasks.length === 0 && (
            <div style={{ border: "2px dashed #E2E8F0", borderRadius: 10, padding: "20px 12px", textAlign: "center", color: "#CBD5E1", fontSize: 12 }}>Drop here</div>
          )}
          {colTasks.map(t => <BoardCard key={t.id} task={t} />)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#F8FAFC", minHeight: "100vh", padding: "24px 32px", color: "#0F172A" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          .pill:hover { background: #EEF2FF !important; color: #4F46E5 !important; border-color: #C7D2FE !important; }
          .task-row:hover { background: #F8FAFC !important; }
          .task-row:hover .row-actions { opacity: 1 !important; }
          .action-btn:hover { background: #EEF2FF !important; color: #4F46E5 !important; }
          .menu-item:hover { background: #F8FAFC !important; }
          .menu-item.danger:hover { background: #FEF2F2 !important; color: #DC2626 !important; }
          .board-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important; }
          .view-btn { transition: all 0.15s; }
          .view-btn:hover { background: #F1F5F9 !important; }
        `}</style>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.03em" }}>Tasks</h1>
            <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>Actions, requests and compliance items</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* View toggle */}
            <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 10, padding: 3, gap: 2 }}>
              {[{ id: "list", icon: "☰", label: "List" }, { id: "board", icon: "⊞", label: "Board" }].map(v => (
                <button key={v.id} className="view-btn" onClick={() => setView(v.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", background: view === v.id ? "#fff" : "transparent", color: view === v.id ? "#0F172A" : "#94A3B8", fontWeight: view === v.id ? 700 : 500, fontSize: 12, cursor: "pointer", boxShadow: view === v.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none", fontFamily: "inherit" }}>
                  <span style={{ fontSize: 14 }}>{v.icon}</span> {v.label}
                </button>
              ))}
            </div>
            <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: "#4F46E5", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, boxShadow: "0 2px 12px rgba(79,70,229,0.3)" }}>
              + Add Task
            </button>
          </div>
        </div>

        {/* Stat tiles */}
        <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
          <StatCard icon="✅" label="Open Tasks"          value={openCount}     sub={`${tasks.length} total`}                                    color="#4F46E5" />
          <StatCard icon="⚠️" label="Overdue"             value={overdueCount}  sub={overdueCount > 0 ? "Needs attention" : "All on track"}       color="#DC2626" />
          <StatCard icon="🏁" label="Completed This Week"  value={doneThisWeek} sub="Last 7 days"                                                 color="#059669" />
        </div>

        {/* Filters */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "24px", marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94A3B8" }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…" style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7, border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, outline: "none", width: 220, background: "#F8FAFC", color: "#0F172A", fontFamily: "inherit" }} />
            </div>
            <div style={{ width: 1, height: 28, background: "#E2E8F0" }} />
            {["All", ...STATUS].map(s => (
              <button key={s} className="pill" onClick={() => setFilterStatus(s)} style={{ padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${filterStatus === s ? "#4F46E5" : "#E2E8F0"}`, background: filterStatus === s ? "#EEF2FF" : "#fff", color: filterStatus === s ? "#4F46E5" : "#64748B", fontSize: 12, fontWeight: filterStatus === s ? 700 : 500, cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" }}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TASK_TYPES.map(type => (
              <button key={type} className="pill" onClick={() => setFilterType(type)} style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${filterType === type ? "#4F46E5" : "#E2E8F0"}`, background: filterType === type ? "#EEF2FF" : "#fff", color: filterType === type ? "#4F46E5" : "#64748B", fontSize: 12, fontWeight: filterType === type ? 700 : 500, cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" }}>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* ── LIST VIEW ── */}
        {view === "list" && (
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden" }}>
            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "4px 1fr 160px 90px 90px 80px", background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>
              <div />
              {[
                { key: "title",      label: "Task"        },
                { key: "type",       label: "Type"        },
                { key: "assignedTo", label: "Assigned To" },
                { key: "due",        label: "Due"         },
                { key: null,         label: ""            },
              ].map(({ key, label }, i) => (
                <div key={i} onClick={() => key && handleSort(key)} style={{ padding: "9px 8px 9px 12px", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", cursor: key ? "pointer" : "default", userSelect: "none" }}>
                  {label}{key && <SortIcon col={key} />}
                </div>
              ))}
            </div>

            {filtered.length === 0 && <div style={{ padding: "48px 24px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No tasks found</div>}
            {filtered.map((task, i) => <ListRow key={task.id} task={task} i={i} last={i === filtered.length - 1} />)}

            <div style={{ padding: "9px 16px", borderTop: "1px solid #F1F5F9", background: "#F8FAFC", fontSize: 12, color: "#94A3B8", display: "flex", justifyContent: "space-between" }}>
              <span>{filtered.length} task{filtered.length !== 1 ? "s" : ""}</span>
              {(filterType !== "All" || filterStatus !== "All") && <span>Filtered</span>}
            </div>
          </div>
        )}

        {/* ── BOARD VIEW ── */}
        {view === "board" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {STATUS.map(s => <BoardColumn key={s} status={s} />)}
          </div>
        )}

        {/* ── MODAL ── */}
        {showModal && (
          <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: 500, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>{editTask ? "Edit Task" : "Add Task"}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Fill in the details below</div>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94A3B8" }}>✕</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Send PDS to client" style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                      {TASK_TYPES.filter(t => t !== "All").map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Assigned To</label>
                    <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} style={inputStyle}>
                      <option>Adviser</option>
                      <option>Client</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                      {STATUS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Due Date</label>
                    <input type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Notes <span style={{ fontWeight: 400, color: "#94A3B8" }}>(optional)</span></label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional context…" rows={3} style={{ ...inputStyle, resize: "none" }} />
                </div>
              </div>
              <button onClick={saveTask} style={{ width: "100%", padding: 11, background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 20 }}>
                {editTask ? "Save Changes" : "Add Task"}
              </button>
            </div>
          </div>
        )}
      </div>
  );
}
