import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import {
  CheckSquare,
  Users,
  PlusCircle,
  CalendarDays,
  Clock,
  AlertTriangle,
  Search,
  MoreVertical,
  User,
  Flag,
} from "lucide-react";

/* ─── types ──────────────────────────────────────────────────── */
interface Task {
  id: number;
  title: string;
  project: string;
  assignee: string;
  priority: "High" | "Medium" | "Low";
  status: "Completed" | "In Progress" | "Pending" | "Overdue";
  due: string;
}

/* ─── shared mock data ───────────────────────────────────────── */
const allTasks: Task[] = [
  { id: 1, title: "Foundation inspection – Block C", project: "Skyline Residency", assignee: "Arjun Mehta", priority: "High", status: "In Progress", due: "2026-06-12" },
  { id: 2, title: "Rebar tying verification", project: "Metro Ph-II", assignee: "Sana Khan", priority: "Medium", status: "Completed", due: "2026-06-08" },
  { id: 3, title: "Safety audit sign-off", project: "Coastal Bridge", assignee: "Rahul Deshpande", priority: "High", status: "Overdue", due: "2026-06-05" },
  { id: 4, title: "Concrete grade test sample", project: "Green Valley", assignee: "Priya Mehta", priority: "Low", status: "Pending", due: "2026-06-15" },
  { id: 5, title: "Electrical conduit layout review", project: "Skyline Residency", assignee: "Amit Kumar", priority: "Medium", status: "In Progress", due: "2026-06-13" },
  { id: 6, title: "Waterproofing membrane QC", project: "Metro Ph-II", assignee: "Arjun Mehta", priority: "High", status: "Pending", due: "2026-06-14" },
  { id: 7, title: "Column alignment survey", project: "Coastal Bridge", assignee: "Sana Khan", priority: "Medium", status: "Completed", due: "2026-06-09" },
  { id: 8, title: "Plumbing pressure test", project: "Green Valley", assignee: "Rahul Deshpande", priority: "Low", status: "In Progress", due: "2026-06-16" },
];

const priorityColor: Record<string, string> = {
  High: "bg-rose-100 text-rose-600",
  Medium: "bg-amber-100 text-amber-600",
  Low: "bg-slate-100 text-slate-500",
};

const statusColor: Record<string, string> = {
  Completed: "bg-emerald-100 text-emerald-600",
  "In Progress": "bg-blue-100 text-blue-600",
  Pending: "bg-slate-100 text-slate-500",
  Overdue: "bg-rose-100 text-rose-600",
};

/* ─── page ───────────────────────────────────────────────────── */
const ManagerTasksPage = () => {
  const [activeTab, setActiveTab] = useState("my-tasks");

  const tabs = [
    { id: "my-tasks", label: "My Tasks", icon: <CheckSquare className="w-4 h-4" /> },
    { id: "team-tasks", label: "Team Tasks", icon: <Users className="w-4 h-4" /> },
    { id: "assign-task", label: "Assign Task", icon: <PlusCircle className="w-4 h-4" /> },
    { id: "task-calendar", label: "Task Calendar", icon: <CalendarDays className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar
        title="Task Management"
        breadcrumb={["Manager", "Tasks", tabs.find((t) => t.id === activeTab)?.label || "My Tasks"]}
      />

      <PageTransition className="p-6 lg:p-8">
        {/* header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Task Command Center</h1>
            <p className="text-slate-500 mt-1">Assign, track & monitor every on-site task across your projects.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600">{allTasks.filter((t) => t.status === "Completed").length} / {allTasks.length} Done</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-rose-600">{allTasks.filter((t) => t.status === "Overdue").length} Overdue</span>
            </div>
          </div>
        </div>

        {/* tabs bar */}
        <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-sm rounded-2xl mb-8 w-fit border border-white/50 shadow-inner">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === t.id
                  ? "text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
              }`}
            >
              {activeTab === t.id && (
                <motion.div
                  layoutId="taskActiveTab"
                  className="absolute inset-0 bg-white rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{t.icon}</span>
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>

        {/* tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "my-tasks" && <MyTasksView />}
            {activeTab === "team-tasks" && <TeamTasksView />}
            {activeTab === "assign-task" && <AssignTaskView />}
            {activeTab === "task-calendar" && <TaskCalendarView />}
          </motion.div>
        </AnimatePresence>
      </PageTransition>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   1. MY TASKS
   ════════════════════════════════════════════════════════════ */
const MyTasksView = () => {
  const [search, setSearch] = useState("");
  const myTasks = allTasks.filter((t) => t.assignee === "Arjun Mehta" || t.assignee === "Priya Mehta");
  const filtered = myTasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Assigned", value: myTasks.length, accent: "text-primary", bg: "bg-primary/5" },
          { label: "In Progress", value: myTasks.filter((t) => t.status === "In Progress").length, accent: "text-blue-500", bg: "bg-blue-50" },
          { label: "Completed", value: myTasks.filter((t) => t.status === "Completed").length, accent: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Overdue", value: myTasks.filter((t) => t.status === "Overdue").length, accent: "text-rose-500", bg: "bg-rose-50" },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} p-5 rounded-2xl border border-white/60`}>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.accent}`}>{String(s.value).padStart(2, "0")}</p>
          </div>
        ))}
      </div>

      {/* search + table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search my tasks…"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
        <TaskTable tasks={filtered} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   2. TEAM TASKS
   ════════════════════════════════════════════════════════════ */
const TeamTasksView = () => {
  const [search, setSearch] = useState("");
  const filtered = allTasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.assignee.toLowerCase().includes(search.toLowerCase()) ||
      t.project.toLowerCase().includes(search.toLowerCase())
  );

  const engineers = [...new Set(allTasks.map((t) => t.assignee))];

  return (
    <div className="space-y-6">
      {/* engineer summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {engineers.map((eng, i) => {
          const tasks = allTasks.filter((t) => t.assignee === eng);
          const done = tasks.filter((t) => t.status === "Completed").length;
          return (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {eng.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{eng}</p>
                  <p className="text-[10px] text-slate-400">{tasks.length} tasks</p>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1.5">{done}/{tasks.length} completed</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team tasks…"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <span className="text-xs font-bold text-slate-400">{filtered.length} tasks</span>
        </div>
        <TaskTable tasks={filtered} showAssignee />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   3. ASSIGN TASK
   ════════════════════════════════════════════════════════════ */
const AssignTaskView = () => {
  const [form, setForm] = useState({
    title: "",
    project: "",
    assignee: "",
    priority: "Medium",
    due: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrate with backend
    alert("Task assigned successfully (mock)");
    setForm({ title: "", project: "", assignee: "", priority: "Medium", due: "", description: "" });
  };

  const projects = ["Skyline Residency", "Metro Ph-II", "Coastal Bridge", "Green Valley"];
  const engineers = ["Arjun Mehta", "Sana Khan", "Rahul Deshpande", "Priya Mehta", "Amit Kumar"];

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Create & Assign New Task</h3>
          <p className="text-sm text-slate-500">Fill in the details below to create a new task and assign it to a team member.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* title */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Task Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. Inspect slab shuttering – Floor 5"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* project */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Project</label>
              <select
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            {/* assignee */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Assign To</label>
              <select
                value={form.assignee}
                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">Select engineer</option>
                {engineers.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* priority */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            {/* due date */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Due Date</label>
              <input
                type="date"
                value={form.due}
                onChange={(e) => setForm({ ...form, due: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Detailed instructions for the engineer…"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="reset"
              onClick={() => setForm({ title: "", project: "", assignee: "", priority: "Medium", due: "", description: "" })}
              className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all"
            >
              Assign Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   4. TASK CALENDAR
   ════════════════════════════════════════════════════════════ */
const TaskCalendarView = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay(); // 0=Sun
  const monthName = today.toLocaleString("default", { month: "long", year: "numeric" });

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return allTasks.filter((t) => t.due === dateStr);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">{monthName}</h3>
        <div className="flex items-center gap-4">
          {[
            { color: "bg-emerald-400", label: "Completed" },
            { color: "bg-blue-400", label: "In Progress" },
            { color: "bg-rose-400", label: "Overdue" },
            { color: "bg-slate-300", label: "Pending" },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${l.color}`} />
              <span className="text-[10px] font-bold text-slate-400">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* weekday header */}
        <div className="grid grid-cols-7 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 py-2">{d}</div>
          ))}
        </div>

        {/* days grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((day, i) => {
            if (day === null) return <div key={i} className="min-h-[80px]" />;
            const isToday = day === today.getDate();
            const dayTasks = getTasksForDay(day);
            return (
              <div
                key={i}
                className={`min-h-[80px] p-2 rounded-xl border transition-all ${
                  isToday ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                }`}
              >
                <span className={`text-xs font-bold ${isToday ? "text-primary" : "text-slate-600"}`}>{day}</span>
                <div className="mt-1 space-y-0.5">
                  {dayTasks.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold truncate ${
                        t.status === "Completed" ? "bg-emerald-100 text-emerald-600" :
                        t.status === "Overdue" ? "bg-rose-100 text-rose-600" :
                        t.status === "In Progress" ? "bg-blue-100 text-blue-600" :
                        "bg-slate-100 text-slate-500"
                      }`}
                      title={t.title}
                    >
                      {t.title.length > 16 ? t.title.slice(0, 16) + "…" : t.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <span className="text-[9px] font-bold text-slate-400">+{dayTasks.length - 2} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SHARED – Task table
   ════════════════════════════════════════════════════════════ */
const TaskTable = ({ tasks, showAssignee = false }: { tasks: Task[]; showAssignee?: boolean }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
          <th className="px-6 py-4">Task</th>
          <th className="px-6 py-4">Project</th>
          {showAssignee && <th className="px-6 py-4">Assignee</th>}
          <th className="px-6 py-4">Priority</th>
          <th className="px-6 py-4">Status</th>
          <th className="px-6 py-4">Due</th>
          <th className="px-6 py-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {tasks.length === 0 ? (
          <tr><td colSpan={showAssignee ? 7 : 6} className="px-6 py-12 text-center text-sm text-slate-400">No tasks found.</td></tr>
        ) : (
          tasks.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-6 py-4">
                <span className="text-xs font-bold text-slate-800">{t.title}</span>
              </td>
              <td className="px-6 py-4 text-xs font-bold text-primary/80">{t.project}</td>
              {showAssignee && (
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{t.assignee}</span>
                  </div>
                </td>
              )}
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight ${priorityColor[t.priority]}`}>
                  <Flag className="w-3 h-3" /> {t.priority}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${statusColor[t.status]}`}>{t.status}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3 h-3" /> {t.due}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="p-1.5 text-slate-400 hover:text-primary rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default ManagerTasksPage;
