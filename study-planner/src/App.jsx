import { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Bell,
  Plus,
  Trash2,
  Edit3,
  X,
  Clock,
  Timer,
  Brain,
  Target,
  ChevronLeft,
  ChevronRight,
  Check,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Zap,
  Flame,
  Award,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────
const PRIORITIES = ["low", "medium", "high"];
const SUBJECTS = [
  "Math",
  "Science",
  "English",
  "History",
  "Programming",
  "Art",
  "Other",
];
const PRIORITY_COLORS = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" };
const SUBJECT_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#f97316",
];
const POMODORO_DURATIONS = { work: 25 * 60, break: 5 * 60 };

const glass = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const today = () => new Date().toISOString().split("T")[0];
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

const DEFAULT_TASKS = [
  {
    id: "1",
    title: "Complete Calculus Assignment",
    priority: "high",
    deadline: daysFromNow(1),
    subject: "Math",
    completed: false,
    createdAt: Date.now() - 50000,
  },
  {
    id: "2",
    title: "Read Chapter 5 – Organic Chemistry",
    priority: "medium",
    deadline: daysFromNow(2),
    subject: "Science",
    completed: false,
    createdAt: Date.now() - 80000,
  },
  {
    id: "3",
    title: "Essay Draft – Shakespeare",
    priority: "high",
    deadline: daysFromNow(3),
    subject: "English",
    completed: false,
    createdAt: Date.now() - 100000,
  },
  {
    id: "4",
    title: "Practice Binary Search Trees",
    priority: "medium",
    deadline: daysFromNow(5),
    subject: "Programming",
    completed: true,
    createdAt: Date.now() - 200000,
  },
  {
    id: "5",
    title: "History Quiz Preparation",
    priority: "low",
    deadline: daysFromNow(7),
    subject: "History",
    completed: false,
    createdAt: Date.now() - 30000,
  },
  {
    id: "6",
    title: "Art Portfolio Sketches",
    priority: "low",
    deadline: daysFromNow(10),
    subject: "Art",
    completed: true,
    createdAt: Date.now() - 400000,
  },
];

// ─── AI Study Plan Logic ─────────────────────────────────────────────────────
function generateStudyPlan(tasks) {
  const score = (t) => {
    const priorityW = { high: 30, medium: 20, low: 10 }[t.priority];
    const daysLeft = Math.ceil((new Date(t.deadline) - new Date()) / 86400000);
    return priorityW - Math.max(daysLeft, 0) * 2;
  };
  return tasks
    .filter((t) => !t.completed)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 3)
    .map((t) => ({
      ...t,
      suggestedHours:
        t.priority === "high" ? 2 : t.priority === "medium" ? 1.5 : 1,
      daysLeft: Math.ceil((new Date(t.deadline) - new Date()) / 86400000),
    }));
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState({
    priority: "all",
    subject: "all",
    status: "all",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:5175/api/tasks");
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();
        if (!data || data.length === 0) {
          // seed server with defaults and use those
          const created = await Promise.all(
            DEFAULT_TASKS.map((t) =>
              fetch("http://localhost:5175/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...t, createdAt: Date.now(), completed: !!t.completed }),
              }).then((r) => r.json())
            )
          );
          setTasks(created);
        } else {
          setTasks(data);
        }
      } catch (e) {
        console.error("Could not load tasks from server, using defaults", e);
        setTasks(DEFAULT_TASKS);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const urgent = tasks.filter((t) => {
      if (t.completed) return false;
      const d = Math.ceil((new Date(t.deadline) - new Date()) / 86400000);
      return d <= 1 && d >= 0;
    });
    setNotifications(
      urgent.map((t) => ({
        id: t.id,
        msg: `"${t.title.slice(0, 28)}…" due ${
          new Date(t.deadline).toDateString() === new Date().toDateString()
            ? "today"
            : "tomorrow"
        }!`,
      }))
    );
  }, [tasks]);

  const addTask = async (t) => {
    try {
      const res = await fetch("http://localhost:5175/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...t, completed: false, createdAt: Date.now() }),
      });
      const created = await res.json();
      setTasks((p) => [created, ...p]);
      return created;
    } catch (e) {
      console.error("Failed to add task to server, adding locally", e);
      const local = { ...t, id: Date.now().toString(), completed: false, createdAt: Date.now() };
      setTasks((p) => [local, ...p]);
      return local;
    }
  };

  const updateTask = async (id, u) => {
    try {
      const res = await fetch(`http://localhost:5175/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(u),
      });
      const updated = await res.json();
      setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...updated } : t)));
      return updated;
    } catch (e) {
      console.error("Failed to update task on server, updating locally", e);
      setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...u } : t)));
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`http://localhost:5175/api/tasks/${id}`, { method: "DELETE" });
      setTasks((p) => p.filter((t) => t.id !== id));
    } catch (e) {
      console.error("Failed to delete task on server, deleting locally", e);
      setTasks((p) => p.filter((t) => t.id !== id));
    }
  };

  const toggleTask = async (id) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    await updateTask(id, { ...t, completed: !t.completed });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07071a",
        color: "#e2e8f0",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient background glows */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-15%",
            left: "-5%",
            width: "55%",
            height: "55%",
            background:
              "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 65%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-15%",
            right: "-5%",
            width: "55%",
            height: "55%",
            background:
              "radial-gradient(ellipse, rgba(6,182,212,0.12) 0%, transparent 65%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "40%",
            width: "40%",
            height: "40%",
            background:
              "radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 60%)",
          }}
        />
      </div>

      <Sidebar
        page={page}
        setPage={setPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tasks={tasks}
        setShowPomodoro={setShowPomodoro}
      />

      <main
        style={{
          flex: 1,
          marginLeft: sidebarOpen ? 248 : 74,
          transition: "margin-left 0.32s cubic-bezier(.4,0,.2,1)",
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
        }}
      >
        <Navbar
          page={page}
          notifications={notifications}
          setNotifications={setNotifications}
          setShowAddModal={setShowAddModal}
        />
        <div style={{ padding: "28px 28px 48px", maxWidth: 1400 }}>
          {page === "dashboard" && (
            <Dashboard tasks={tasks} setPage={setPage} />
          )}
          {page === "tasks" && (
            <Tasks
              tasks={tasks}
              filter={filter}
              setFilter={setFilter}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              setEditTask={setEditTask}
              setShowAddModal={setShowAddModal}
            />
          )}
          {page === "calendar" && <CalendarPage tasks={tasks} />}
        </div>
      </main>

      {(showAddModal || editTask) && (
        <TaskModal
          task={editTask}
          onClose={() => {
            setShowAddModal(false);
            setEditTask(null);
          }}
          onSave={(t) => {
            editTask ? updateTask(editTask.id, t) : addTask(t);
            setShowAddModal(false);
            setEditTask(null);
          }}
        />
      )}

      {showPomodoro && <PomodoroModal onClose={() => setShowPomodoro(false)} />}

      <style>{`
        @keyframes fadeInUp  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn   { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
        @keyframes slideLeft { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        .afu { animation: fadeInUp 0.48s cubic-bezier(.4,0,.2,1) both; }
        .asl { animation: slideLeft 0.38s cubic-bezier(.4,0,.2,1) both; }
        .asi { animation: scaleIn  0.3s  cubic-bezier(.4,0,.2,1) both; }
        .s1{animation-delay:.06s} .s2{animation-delay:.13s} .s3{animation-delay:.2s}
        .s4{animation-delay:.27s} .s5{animation-delay:.34s} .s6{animation-delay:.41s}
        .hl { transition:transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
        .hl:hover { transform:translateY(-3px); box-shadow:0 14px 40px rgba(99,102,241,0.22)!important; }
        .gb { transition:all .2s ease; }
        .gb:hover { box-shadow:0 0 24px rgba(99,102,241,0.45); transform:scale(1.025); }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px; }
        input,select,textarea { color-scheme:dark; outline:none; }
        button { outline:none; }
      `}</style>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({
  page,
  setPage,
  sidebarOpen,
  setSidebarOpen,
  tasks,
  setShowPomodoro,
}) {
  const nav = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "tasks", icon: CheckSquare, label: "Tasks" },
    { id: "calendar", icon: Calendar, label: "Calendar" },
  ];
  const done = tasks.filter((t) => t.completed).length;
  const pending = tasks.filter((t) => !t.completed).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: sidebarOpen ? 248 : 74,
        transition: "width .32s cubic-bezier(.4,0,.2,1)",
        ...glass,
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            flexShrink: 0,
            background: "linear-gradient(135deg,#6366f1,#06b6d4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            boxShadow: "0 4px 18px rgba(99,102,241,0.4)",
          }}
        >
          📚
        </div>
        {sidebarOpen && (
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 17,
                background: "linear-gradient(135deg,#a5b4fc,#67e8f9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                whiteSpace: "nowrap",
              }}
            >
              StudyFlow
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.38)",
                marginTop: 1,
              }}
            >
              AI-Powered Planner
            </div>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setSidebarOpen((p) => !p)}
        style={{
          position: "absolute",
          top: 26,
          right: -12,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          border: "none",
          cursor: "pointer",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          boxShadow: "0 2px 12px rgba(99,102,241,0.5)",
          zIndex: 10,
        }}
      >
        {sidebarOpen ? "‹" : "›"}
      </button>

      {/* Nav items */}
      <nav
        style={{
          flex: 1,
          padding: "18px 10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          overflowY: "auto",
        }}
      >
        {nav.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 12px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                background: active
                  ? "linear-gradient(135deg,rgba(99,102,241,0.28),rgba(139,92,246,0.18))"
                  : "transparent",
                color: active ? "#a5b4fc" : "rgba(255,255,255,0.55)",
                borderLeft: `2px solid ${active ? "#6366f1" : "transparent"}`,
                transition: "all .22s ease",
                position: "relative",
              }}
            >
              <item.icon size={20} style={{ flexShrink: 0 }} />
              {sidebarOpen && (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: active ? 700 : 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              )}
              {sidebarOpen && item.id === "tasks" && pending > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "#ef4444",
                    borderRadius: 10,
                    fontSize: 11,
                    padding: "1px 7px",
                    color: "white",
                    fontWeight: 700,
                  }}
                >
                  {pending}
                </span>
              )}
            </button>
          );
        })}

        <div
          style={{
            margin: "14px 4px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        />

        <button
          onClick={() => setShowPomodoro(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "11px 12px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            width: "100%",
            background: "transparent",
            color: "rgba(255,255,255,0.55)",
            borderLeft: "2px solid transparent",
            transition: "all .22s ease",
          }}
        >
          <Timer size={20} style={{ flexShrink: 0 }} />
          {sidebarOpen && (
            <span style={{ fontSize: 14, whiteSpace: "nowrap" }}>Pomodoro</span>
          )}
        </button>
      </nav>

      {/* Goal widget */}
      {sidebarOpen && (
        <div
          style={{
            padding: 14,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <div style={{ ...glass, borderRadius: 14, padding: "14px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.5)",
                  fontWeight: 600,
                }}
              >
                Daily Progress
              </span>
              <Flame size={15} color="#f59e0b" />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 4,
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 26, fontWeight: 800, color: "#a5b4fc" }}>
                {done}
              </span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>
                / {tasks.length} tasks
              </span>
            </div>
            <div
              style={{
                height: 5,
                borderRadius: 3,
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: "linear-gradient(90deg,#6366f1,#06b6d4)",
                  transition: "width .6s ease",
                  borderRadius: 3,
                }}
              />
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
                textAlign: "right",
              }}
            >
              {pct}% complete
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar({ page, notifications, setNotifications, setShowAddModal }) {
  const [showN, setShowN] = useState(false);
  const titles = {
    dashboard: "Dashboard Overview",
    tasks: "My Tasks",
    calendar: "Calendar",
  };

  return (
    <div
      style={{
        padding: "16px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: "rgba(7,7,26,0.82)",
        backdropFilter: "blur(24px)",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 21,
            fontWeight: 800,
            margin: 0,
            background: "linear-gradient(135deg,#e2e8f0,#94a3b8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {titles[page]}
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "rgba(255,255,255,0.38)",
            marginTop: 2,
          }}
        >
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Notification bell */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowN((p) => !p)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              cursor: "pointer",
              color: "rgba(255,255,255,0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              transition: "all .2s",
            }}
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 7,
                  right: 7,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#ef4444",
                  boxShadow: "0 0 6px #ef4444",
                }}
              />
            )}
          </button>
          {showN && (
            <div
              className="asi"
              style={{
                position: "absolute",
                top: 48,
                right: 0,
                width: 290,
                ...glass,
                borderRadius: 14,
                padding: 12,
                zIndex: 200,
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 8,
                  letterSpacing: 0.5,
                }}
              >
                NOTIFICATIONS
              </div>
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: "14px 0",
                    textAlign: "center",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  No urgent deadlines 🎉
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "9px 11px",
                      borderRadius: 9,
                      background: "rgba(239,68,68,0.1)",
                      marginBottom: 6,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <AlertCircle
                      size={14}
                      color="#ef4444"
                      style={{ marginTop: 1, flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: 12.5,
                        color: "#fca5a5",
                        lineHeight: 1.45,
                      }}
                    >
                      {n.msg}
                    </span>
                  </div>
                ))
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    setNotifications([]);
                    setShowN(false);
                  }}
                  style={{
                    marginTop: 4,
                    width: "100%",
                    padding: "7px",
                    borderRadius: 8,
                    border: "none",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.45)",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add task CTA */}
        <button
          onClick={() => setShowAddModal(true)}
          className="gb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 18px",
            borderRadius: 11,
            border: "none",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "white",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
          }}
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ tasks, setPage }) {
  const completed = tasks.filter((t) => t.completed).length;
  const pending = tasks.filter((t) => !t.completed).length;
  const overdue = tasks.filter(
    (t) => !t.completed && new Date(t.deadline) < new Date()
  ).length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const plan = generateStudyPlan(tasks);

  // Weekly chart data (last 7 days)
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const ds = d.toISOString().split("T")[0];
    // count tasks whose deadline is that day (as proxy for activity)
    const c = tasks.filter((t) => t.deadline === ds && t.completed).length;
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }),
      Completed: c,
      Target: 3,
    };
  });

  // Priority distribution
  const priorityData = PRIORITIES.map((p) => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    value: tasks.filter((t) => t.priority === p).length,
    color: PRIORITY_COLORS[p],
  })).filter((d) => d.value > 0);

  // Subject data
  const subjectData = SUBJECTS.map((s, i) => ({
    subject: s.length > 7 ? s.slice(0, 7) : s,
    Tasks: tasks.filter((t) => t.subject === s).length,
    color: SUBJECT_COLORS[i],
  })).filter((d) => d.Tasks > 0);

  const stats = [
    {
      label: "Total Tasks",
      value: tasks.length,
      icon: "📋",
      color: "#6366f1",
      bg: "rgba(99,102,241,0.12)",
      sub: "All subjects",
    },
    {
      label: "Completed",
      value: completed,
      icon: "✅",
      color: "#10b981",
      bg: "rgba(16,185,129,0.12)",
      sub: `${pct}% rate`,
    },
    {
      label: "Pending",
      value: pending,
      icon: "⏳",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      sub: "To do",
    },
    {
      label: "Overdue",
      value: overdue,
      icon: "🚨",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.12)",
      sub: "Needs attention",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 16,
        }}
      >
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`afu s${i + 1} hl`}
            style={{
              ...glass,
              borderRadius: 18,
              padding: "20px 22px",
              borderTop: `2px solid ${s.color}55`,
              cursor: "default",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: "rgba(255,255,255,0.45)",
                    marginBottom: 8,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                  }}
                >
                  {s.label.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: 34,
                    fontWeight: 900,
                    color: s.color,
                    lineHeight: 1,
                    letterSpacing: -1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.3)",
                    marginTop: 7,
                  }}
                >
                  {s.sub}
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: s.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}
      >
        {/* Weekly area chart */}
        <div
          className="afu s2"
          style={{ ...glass, borderRadius: 18, padding: "20px 20px 14px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                Weekly Progress
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.38)",
                  marginTop: 2,
                }}
              >
                Tasks completed per day
              </div>
            </div>
            <TrendingUp size={18} color="#6366f1" />
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart
              data={weeklyData}
              margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(7,7,26,0.92)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  color: "white",
                  fontSize: 13,
                }}
              />
              <Area
                type="monotone"
                dataKey="Target"
                stroke="#06b6d4"
                strokeWidth={1.5}
                fill="url(#gt)"
                strokeDasharray="5 5"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="Completed"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#gc)"
                dot={{ fill: "#6366f1", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Priority pie */}
        <div
          className="afu s3"
          style={{ ...glass, borderRadius: 18, padding: "20px 20px 14px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                Priority Split
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.38)",
                  marginTop: 2,
                }}
              >
                Task breakdown
              </div>
            </div>
            <Target size={18} color="#f59e0b" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {priorityData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(7,7,26,0.92)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    color: "white",
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {priorityData.map((d) => (
                <div
                  key={d.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 11,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: d.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.6)",
                      flex: 1,
                    }}
                  >
                    {d.name}
                  </span>
                  <span
                    style={{ fontSize: 15, fontWeight: 800, color: d.color }}
                  >
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subject bar chart */}
      {subjectData.length > 0 && (
        <div
          className="afu s4"
          style={{ ...glass, borderRadius: 18, padding: "20px 20px 14px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                Subject Overview
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.38)",
                  marginTop: 2,
                }}
              >
                Tasks per subject
              </div>
            </div>
            <BookOpen size={18} color="#10b981" />
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart
              data={subjectData}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="subject"
                tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(7,7,26,0.92)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  color: "white",
                  fontSize: 13,
                }}
              />
              <Bar dataKey="Tasks" radius={[7, 7, 0, 0]}>
                {subjectData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI Study Plan */}
      <div
        className="afu s5"
        style={{
          ...glass,
          borderRadius: 18,
          padding: 22,
          border: "1px solid rgba(99,102,241,0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
              flexShrink: 0,
            }}
          >
            <Brain size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              AI Study Plan — Today
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.38)",
                marginTop: 2,
              }}
            >
              Ranked by deadline urgency & priority
            </div>
          </div>
          <div
            style={{
              padding: "5px 12px",
              borderRadius: 20,
              background: "rgba(99,102,241,0.18)",
              fontSize: 12,
              color: "#a5b4fc",
              fontWeight: 700,
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          >
            ✨ AI Generated
          </div>
          <button
            onClick={() => setPage("tasks")}
            style={{
              padding: "5px 12px",
              borderRadius: 20,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            View all →
          </button>
        </div>

        {plan.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "30px 0",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              All tasks completed!
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              You're on top of everything. Great work!
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {plan.map((task, i) => {
              const accent =
                i === 0
                  ? ["99,102,241", "#a5b4fc"]
                  : i === 1
                  ? ["6,182,212", "#67e8f9"]
                  : ["139,92,246", "#c4b5fd"];
              return (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "13px 16px",
                    borderRadius: 13,
                    background: `rgba(${accent[0]},0.1)`,
                    border: `1px solid rgba(${accent[0]},0.22)`,
                    transition: "all .2s ease",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: `rgba(${accent[0]},0.28)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: 15,
                      color: accent[1],
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        marginBottom: 3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {task.title}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "rgba(255,255,255,0.42)" }}
                    >
                      {task.subject} &nbsp;·&nbsp;{" "}
                      {task.daysLeft <= 0
                        ? "⚠️ Overdue!"
                        : task.daysLeft === 1
                        ? "Due tomorrow"
                        : `${task.daysLeft} days left`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: accent[1],
                        lineHeight: 1,
                      }}
                    >
                      {task.suggestedHours}h
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.38)",
                        marginTop: 2,
                      }}
                    >
                      suggested
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "4px 10px",
                      borderRadius: 7,
                      fontSize: 11,
                      fontWeight: 700,
                      background: PRIORITY_COLORS[task.priority] + "28",
                      color: PRIORITY_COLORS[task.priority],
                      flexShrink: 0,
                    }}
                  >
                    {task.priority}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tasks Page ───────────────────────────────────────────────────────────────
function Tasks({
  tasks,
  filter,
  setFilter,
  toggleTask,
  deleteTask,
  setEditTask,
  setShowAddModal,
}) {
  const filtered = tasks.filter((t) => {
    if (filter.priority !== "all" && t.priority !== filter.priority)
      return false;
    if (filter.subject !== "all" && t.subject !== filter.subject) return false;
    if (filter.status === "completed" && !t.completed) return false;
    if (filter.status === "pending" && t.completed) return false;
    return true;
  });

  const pending = filtered.filter((t) => !t.completed);
  const completed = filtered.filter((t) => t.completed);

  const selStyle = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 9,
    color: "white",
    padding: "7px 13px",
    fontSize: 13,
    cursor: "pointer",
  };

  return (
    <div>
      {/* Filter bar */}
      <div
        className="afu s1"
        style={{
          ...glass,
          borderRadius: 13,
          padding: "12px 18px",
          marginBottom: 22,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Zap size={15} color="#6366f1" />
        <span
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.45)",
            fontWeight: 600,
          }}
        >
          FILTER
        </span>
        <div
          style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)" }}
        />
        {[
          { key: "status", opts: ["all", "pending", "completed"] },
          { key: "priority", opts: ["all", "low", "medium", "high"] },
          { key: "subject", opts: ["all", ...SUBJECTS] },
        ].map((f) => (
          <select
            key={f.key}
            value={filter[f.key]}
            onChange={(e) =>
              setFilter((p) => ({ ...p, [f.key]: e.target.value }))
            }
            style={selStyle}
          >
            {f.opts.map((o) => (
              <option key={o} value={o}>
                {o === "all"
                  ? `All ${f.key}s`
                  : o.charAt(0).toUpperCase() + o.slice(1)}
              </option>
            ))}
          </select>
        ))}
        <span
          style={{
            marginLeft: "auto",
            fontSize: 13,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "70px 0",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 14 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No tasks found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Try adjusting filters or add a new task
          </div>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: 0.6,
                  marginBottom: 12,
                }}
              >
                PENDING — {pending.length}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
                  gap: 14,
                  marginBottom: 24,
                }}
              >
                {pending.map((t, i) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    index={i}
                    toggleTask={toggleTask}
                    deleteTask={deleteTask}
                    setEditTask={setEditTask}
                    setShowAddModal={setShowAddModal}
                  />
                ))}
              </div>
            </>
          )}
          {completed.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: 0.6,
                  marginBottom: 12,
                }}
              >
                COMPLETED — {completed.length}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
                  gap: 14,
                }}
              >
                {completed.map((t, i) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    index={i}
                    toggleTask={toggleTask}
                    deleteTask={deleteTask}
                    setEditTask={setEditTask}
                    setShowAddModal={setShowAddModal}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function TaskCard({
  task,
  index,
  toggleTask,
  deleteTask,
  setEditTask,
  setShowAddModal,
}) {
  const [hov, setHov] = useState(false);
  const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / 86400000);
  const isOverdue = daysLeft < 0 && !task.completed;
  const pc = PRIORITY_COLORS[task.priority];

  return (
    <div
      className={`afu s${Math.min(index + 1, 6)}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...glass,
        borderRadius: 16,
        padding: "16px 18px",
        border: `1px solid ${
          isOverdue
            ? "rgba(239,68,68,0.35)"
            : hov
            ? "rgba(99,102,241,0.38)"
            : "rgba(255,255,255,0.08)"
        }`,
        transform: hov && !task.completed ? "translateY(-4px)" : "none",
        boxShadow:
          hov && !task.completed ? "0 14px 40px rgba(99,102,241,0.22)" : "none",
        transition: "all .24s ease",
        opacity: task.completed ? 0.6 : 1,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left priority strip */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: pc,
          borderRadius: "16px 0 0 16px",
        }}
      />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Checkbox */}
        <button
          onClick={() => toggleTask(task.id)}
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            flexShrink: 0,
            marginTop: 1,
            border: task.completed ? "none" : `2px solid ${pc}`,
            background: task.completed ? pc : "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all .2s ease",
          }}
        >
          {task.completed && <Check size={13} color="white" strokeWidth={3} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 6,
              textDecoration: task.completed ? "line-through" : "none",
              color: task.completed ? "rgba(255,255,255,0.38)" : "white",
              lineHeight: 1.4,
            }}
          >
            {task.title}
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                padding: "3px 9px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: pc + "28",
                color: pc,
              }}
            >
              {task.priority}
            </span>
            <span
              style={{
                padding: "3px 9px",
                borderRadius: 6,
                fontSize: 11,
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.48)",
                fontWeight: 600,
              }}
            >
              {task.subject}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: isOverdue
                  ? "#fca5a5"
                  : task.completed
                  ? "#a5b4fc"
                  : "rgba(255,255,255,0.38)",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Clock size={12} />
              {task.completed
                ? "✓ Done"
                : isOverdue
                ? `Overdue by ${Math.abs(daysLeft)}d`
                : daysLeft === 0
                ? "⚡ Due today!"
                : `${daysLeft}d left`}
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                opacity: hov ? 1 : 0,
                transition: "opacity .2s ease",
              }}
            >
              <button
                onClick={() => {
                  setEditTask(task);
                  setShowAddModal(true);
                }}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: "none",
                  background: "rgba(99,102,241,0.2)",
                  color: "#a5b4fc",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all .2s",
                }}
              >
                <Edit3 size={13} />
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: "none",
                  background: "rgba(239,68,68,0.2)",
                  color: "#fca5a5",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all .2s",
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
function CalendarPage({ tasks }) {
  const [cur, setCur] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const yr = cur.getFullYear(),
    mo = cur.getMonth();
  const firstDay = new Date(yr, mo, 1).getDay();
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const todayStr = today();

  const getDay = (d) => {
    const ds = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(
      2,
      "0"
    )}`;
    return { ds, dayTasks: tasks.filter((t) => t.deadline === ds) };
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <div
      className="afu s1"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div style={{ ...glass, borderRadius: 18, padding: 26 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <button
            onClick={() => setCur(new Date(yr, mo - 1, 1))}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all .2s",
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <h2
            style={{
              margin: 0,
              fontSize: 19,
              fontWeight: 800,
              background: "linear-gradient(135deg,#a5b4fc,#67e8f9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {cur.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            onClick={() => setCur(new Date(yr, mo + 1, 1))}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all .2s",
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            marginBottom: 6,
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontSize: 12,
                color: "rgba(255,255,255,0.38)",
                fontWeight: 700,
                padding: "8px 0",
                letterSpacing: 0.4,
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gap: 5,
          }}
        >
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const { ds, dayTasks } = getDay(day);
            const isToday = ds === todayStr;
            const isSelected = selectedDay === ds;
            return (
              <div
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : ds)}
                style={{
                  minHeight: 80,
                  borderRadius: 12,
                  padding: "8px 7px",
                  background: isToday
                    ? "rgba(99,102,241,0.22)"
                    : isSelected
                    ? "rgba(99,102,241,0.12)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${
                    isToday
                      ? "rgba(99,102,241,0.55)"
                      : isSelected
                      ? "rgba(99,102,241,0.3)"
                      : "rgba(255,255,255,0.06)"
                  }`,
                  cursor: "pointer",
                  transition: "all .2s ease",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: isToday ? 800 : 500,
                    color: isToday ? "#a5b4fc" : "rgba(255,255,255,0.7)",
                    textAlign: "right",
                    marginBottom: 4,
                  }}
                >
                  {day}
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  {dayTasks.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      style={{
                        fontSize: 10,
                        padding: "2px 5px",
                        borderRadius: 4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        background: PRIORITY_COLORS[t.priority] + "30",
                        color: PRIORITY_COLORS[t.priority],
                        fontWeight: 600,
                      }}
                    >
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.38)",
                        textAlign: "center",
                        marginTop: 1,
                      }}
                    >
                      +{dayTasks.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 16,
            justifyContent: "center",
          }}
        >
          {[
            { c: "#ef4444", l: "High" },
            { c: "#f59e0b", l: "Medium" },
            { c: "#10b981", l: "Low" },
          ].map((x) => (
            <div
              key={x.l}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                color: "rgba(255,255,255,0.42)",
              }}
            >
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 2,
                  background: x.c,
                }}
              />
              {x.l} priority
            </div>
          ))}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay &&
        (() => {
          const dayTasks = tasks.filter((t) => t.deadline === selectedDay);
          return (
            <div
              className="afu s1"
              style={{
                ...glass,
                borderRadius: 16,
                padding: 20,
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
                Tasks for{" "}
                {new Date(selectedDay + "T12:00:00").toLocaleDateString(
                  "en-US",
                  { weekday: "long", month: "long", day: "numeric" }
                )}
              </div>
              {dayTasks.length === 0 ? (
                <div
                  style={{
                    color: "rgba(255,255,255,0.38)",
                    fontSize: 13,
                    padding: "10px 0",
                  }}
                >
                  No tasks scheduled for this day.
                </div>
              ) : (
                dayTasks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.04)",
                      marginBottom: 7,
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: PRIORITY_COLORS[t.priority],
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        flex: 1,
                        textDecoration: t.completed ? "line-through" : "none",
                        color: t.completed ? "rgba(255,255,255,0.4)" : "white",
                      }}
                    >
                      {t.title}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 7px",
                        borderRadius: 5,
                        background: "rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {t.subject}
                    </span>
                    {t.completed && <Check size={13} color="#10b981" />}
                  </div>
                ))
              )}
            </div>
          );
        })()}
    </div>
  );
}

// ─── Task Modal ───────────────────────────────────────────────────────────────
function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    priority: task?.priority || "medium",
    deadline: task?.deadline || today(),
    subject: task?.subject || "Other",
  });
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }
    onSave(form);
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    fontSize: 14,
    boxSizing: "border-box",
    transition: "border-color .2s",
  };
  const labelStyle = {
    fontSize: 13,
    color: "rgba(255,255,255,0.48)",
    display: "block",
    marginBottom: 6,
    fontWeight: 600,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(10px)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        className="asi"
        style={{
          ...glass,
          borderRadius: 22,
          padding: "28px 30px",
          width: "100%",
          maxWidth: 450,
          border: "1px solid rgba(255,255,255,0.13)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>
              {task ? "Edit Task" : "New Task"}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.38)",
                marginTop: 2,
              }}
            >
              {task ? "Update task details" : "Add a new study task"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              border: "none",
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.55)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Task Title</label>
            <input
              value={form.title}
              onChange={(e) => {
                setForm((p) => ({ ...p, title: e.target.value }));
                setError("");
              }}
              placeholder="e.g. Complete calculus assignment"
              style={inputStyle}
            />
            {error && (
              <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 5 }}>
                ⚠ {error}
              </div>
            )}
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label style={labelStyle}>Priority</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((p) => ({ ...p, priority: e.target.value }))
                }
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} style={{ background: "#1a1a35" }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Subject</label>
              <select
                value={form.subject}
                onChange={(e) =>
                  setForm((p) => ({ ...p, subject: e.target.value }))
                }
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s} style={{ background: "#1a1a35" }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Deadline</label>
            <input
              type="date"
              value={form.deadline}
              min={today()}
              onChange={(e) =>
                setForm((p) => ({ ...p, deadline: e.target.value }))
              }
              style={inputStyle}
            />
          </div>

          {/* Priority preview */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: `${PRIORITY_COLORS[form.priority]}15`,
              border: `1px solid ${PRIORITY_COLORS[form.priority]}35`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: PRIORITY_COLORS[form.priority],
              }}
            />
            <span
              style={{
                fontSize: 12.5,
                color: PRIORITY_COLORS[form.priority],
                fontWeight: 600,
              }}
            >
              {form.priority.charAt(0).toUpperCase() + form.priority.slice(1)}{" "}
              priority &nbsp;·&nbsp; {form.subject}
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 11,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent",
                color: "rgba(255,255,255,0.55)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="gb"
              style={{
                flex: 2,
                padding: "12px",
                borderRadius: 11,
                border: "none",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "white",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 800,
                boxShadow: "0 4px 18px rgba(99,102,241,0.4)",
              }}
            >
              {task ? "Update Task" : "Add Task ✨"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pomodoro Timer ───────────────────────────────────────────────────────────
function PomodoroModal({ onClose }) {
  const [mode, setMode] = useState("work");
  const [timeLeft, setTimeLeft] = useState(POMODORO_DURATIONS.work);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setRunning(false);
          const next = modeRef.current === "work" ? "break" : "work";
          if (modeRef.current === "work") setSessions((s) => s + 1);
          setMode(next);
          return POMODORO_DURATIONS[next];
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const switchMode = (m) => {
    setMode(m);
    setRunning(false);
    setTimeLeft(POMODORO_DURATIONS[m]);
  };
  const reset = () => {
    setRunning(false);
    setTimeLeft(POMODORO_DURATIONS[mode]);
  };

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const progress = 1 - timeLeft / POMODORO_DURATIONS[mode];
  const R = 72,
    C = 2 * Math.PI * R;
  const accent = mode === "work" ? "#6366f1" : "#10b981";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(14px)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        className="asi"
        style={{
          ...glass,
          borderRadius: 24,
          padding: "30px 36px",
          width: 340,
          border: "1px solid rgba(255,255,255,0.13)",
          textAlign: "center",
          boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: 17,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Timer size={18} color={accent} /> Pomodoro
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.55)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Mode tabs */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 26,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 11,
            padding: 4,
          }}
        >
          {[
            { id: "work", label: "🎯 Focus", dur: "25 min" },
            { id: "break", label: "☕ Break", dur: "5 min" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              style={{
                flex: 1,
                padding: "9px",
                borderRadius: 9,
                border: "none",
                background:
                  mode === m.id
                    ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                    : "transparent",
                color: "white",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                transition: "all .22s ease",
              }}
            >
              {m.label}
              <br />
              <span style={{ fontSize: 10, opacity: 0.7 }}>{m.dur}</span>
            </button>
          ))}
        </div>

        {/* Ring */}
        <div
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 22,
          }}
        >
          <svg width={180} height={180} style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx={90}
              cy={90}
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={9}
            />
            <circle
              cx={90}
              cy={90}
              r={R}
              fill="none"
              stroke={accent}
              strokeWidth={9}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
              style={{
                transition: "stroke-dashoffset 1s linear, stroke .4s ease",
              }}
            />
          </svg>
          <div style={{ position: "absolute", textAlign: "center" }}>
            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                letterSpacing: -2,
                color: "white",
              }}
            >
              {mins}:{secs}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.38)",
                marginTop: 2,
              }}
            >
              {mode === "work" ? "Stay focused!" : "Take a rest"}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button
            onClick={reset}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: 11,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "rgba(255,255,255,0.55)",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Reset
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            className="gb"
            style={{
              flex: 2,
              padding: "11px",
              borderRadius: 11,
              border: "none",
              background: running
                ? "linear-gradient(135deg,#dc2626,#ef4444)"
                : `linear-gradient(135deg,${accent},${
                    mode === "work" ? "#8b5cf6" : "#059669"
                  })`,
              color: "white",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 800,
              boxShadow: `0 4px 18px ${accent}55`,
            }}
          >
            {running ? "⏸ Pause" : "▶ Start"}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 18,
            fontSize: 13,
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.38)" }}>
            Sessions:{" "}
            <span style={{ color: "#a5b4fc", fontWeight: 800 }}>
              {sessions}
            </span>
          </div>
          <div style={{ color: "rgba(255,255,255,0.38)" }}>
            Focus:{" "}
            <span style={{ color: "#67e8f9", fontWeight: 800 }}>
              {sessions * 25}m
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
