import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { useProject } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
import { projectService } from "../../services/projectService";
import toast from "react-hot-toast";
import {
  CheckSquare,
  Users,
  PlusCircle,
  CalendarDays,
  Clock,
  AlertTriangle,
  Search,
  MoreVertical,
  User as UserIcon,
  Flag,
  RotateCcw
} from "lucide-react";

/* ─── types ──────────────────────────────────────────────────── */
interface Task {
  id: number;
  title: string;
  description?: string;
  project_id: number;
  project_name?: string;
  assigned_user_id: number;
  assignee_name?: string;
  priority: "High" | "Medium" | "Low";
  status: "Completed" | "In Progress" | "Pending" | "Overdue" | "Planned" | "Ongoing" | "Cancelled";
  due: string;
  start_date?: string;
  end_date?: string;
}

const priorityColor: Record<string, string> = {
  High: "bg-rose-100 text-rose-600",
  Medium: "bg-amber-100 text-amber-600",
  Low: "bg-slate-100 text-slate-500",
};

const statusColor: Record<string, string> = {
  Completed: "bg-emerald-100 text-emerald-600",
  "In Progress": "bg-blue-100 text-blue-600",
  Ongoing: "bg-blue-100 text-blue-600",
  Pending: "bg-slate-100 text-slate-500",
  Planned: "bg-slate-100 text-slate-500",
  Overdue: "bg-rose-100 text-rose-600",
  Cancelled: "bg-rose-50 text-rose-400 border border-rose-100",
};

/* ─── page ───────────────────────────────────────────────────── */
const ManagerTasksPage = () => {
  const { selectedProjectId, assignedProjects } = useProject();
  const { user } = useAuth();
  const { tab } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Map URL param to tab ID
  const tabMap: Record<string, string> = useMemo(() => ({
    mine: "my-tasks",
    team: "team-tasks",
    assign: "assign-task",
    calendar: "task-calendar"
  }), []);

  const activeTab = tabMap[tab || ""] || "my-tasks";

  const handleTabChange = (tabId: string) => {
    const urlParam = Object.keys(tabMap).find(key => tabMap[key] === tabId);
    if (urlParam) {
      navigate(`/manager/tasks/${urlParam}`);
    } else {
      navigate(`/manager/tasks`);
    }
  };

  const projectId = selectedProjectId || (user as any)?.project_id || 0;

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const data = await projectService.getTasks(projectId);
      const taskList = Array.isArray(data) ? data : (data.items || data.data || []);

      // Map backend data to frontend task type
      const mappedTasks = taskList.map((t: any) => {
        const project = assignedProjects.find(p => p.id === t.project_id);
        return {
          ...t,
          id: t.task_id || t.id,
          project_name: project?.project_name || `PRJ-${t.project_id}`,
          assignee_name: t.assigned_users?.[0]?.name || "Unassigned",
          priority: t.priority || "Medium",
          status: t.status || "Planned",
          due: t.end_date || t.due_date || t.due || "N/A"
        };
      });
      setTasks(mappedTasks);

      const mData = await projectService.getProjectMembers(projectId);
      setMembers(Array.isArray(mData) ? mData : (mData.items || mData.data || []));
    } catch (e) {
      toast.error("Failed to sync tasks");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, assignedProjects]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const tabs = [
    { id: "my-tasks", label: "My Tasks", icon: <CheckSquare className="w-4 h-4" /> },
    { id: "team-tasks", label: "Team Tasks", icon: <Users className="w-4 h-4" /> },
    { id: "assign-task", label: "Assign Task", icon: <PlusCircle className="w-4 h-4" /> },
    { id: "task-calendar", label: "Task Calendar", icon: <CalendarDays className="w-4 h-4" /> },
  ];

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "Completed").length,
    overdue: tasks.filter(t => t.status === "Overdue").length,
    inProgress: tasks.filter(t => t.status === "In Progress" || t.status === "Ongoing").length
  };

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
              <span className="text-xs font-bold text-emerald-600">{stats.completed} / {stats.total} Done</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-rose-600">{stats.overdue} Overdue</span>
            </div>
            <button
              onClick={fetchTasks}
              className="p-2 text-slate-400 hover:text-primary transition-all bg-white border border-slate-200 rounded-xl shadow-sm"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* tabs bar */}
        <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-sm rounded-2xl mb-8 w-fit border border-white/50 shadow-inner overflow-x-auto max-w-full">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`
                relative flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all
                ${activeTab === t.id
                  ? "text-primary"
                  : "text-slate-500 hover:text-slate-700"
                }
              `}
            >
              {activeTab === t.id && (
                <motion.div
                  layoutId="taskActiveTab"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{t.icon}</span>
              <span className="relative z-10 font-bold">{t.label}</span>
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
            {activeTab === "my-tasks" && <MyTasksView tasks={tasks} user={user} isLoading={isLoading} />}
            {activeTab === "team-tasks" && <TeamTasksView tasks={tasks} isLoading={isLoading} />}
            {activeTab === "assign-task" && <AssignTaskView projectId={projectId} members={members} onCreated={fetchTasks} />}
            {activeTab === "task-calendar" && <TaskCalendarView tasks={tasks} />}
          </motion.div>
        </AnimatePresence>
      </PageTransition>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   1. MY TASKS
   ════════════════════════════════════════════════════════════ */
const MyTasksView = ({ tasks, user, isLoading }: { tasks: Task[]; user: any; isLoading: boolean }) => {
  const [search, setSearch] = useState("");

  // Filter tasks assigned to the current user
  const userId = user?.id || user?.user?.id;
  const myTasks = tasks.filter((t) => Number(t.assigned_user_id) === Number(userId));
  const filtered = myTasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Assigned", value: myTasks.length, accent: "text-primary", bg: "bg-primary/5" },
          { label: "In Progress", value: myTasks.filter((t) => t.status === "In Progress" || t.status === "Ongoing").length, accent: "text-blue-500", bg: "bg-blue-50" },
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
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold placeholder:text-slate-400"
            />
          </div>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse font-bold">Synchronizing tasks...</div>
        ) : (
          <TaskTable tasks={filtered} />
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   2. TEAM TASKS
   ════════════════════════════════════════════════════════════ */
const TeamTasksView = ({ tasks, isLoading }: { tasks: Task[]; isLoading: boolean }) => {
  const [search, setSearch] = useState("");
  const filtered = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.assignee_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.project_name?.toLowerCase().includes(search.toLowerCase())
  );

  const engineers = [...new Set(tasks.map((t) => t.assignee_name))].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* engineer summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {engineers.map((eng: any, i) => {
          const engTasks = tasks.filter((t) => t.assignee_name === eng);
          const done = engTasks.filter((t) => t.status === "Completed").length;
          return (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {String(eng).split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{eng}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{engTasks.length} tasks</p>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${engTasks.length ? (done / engTasks.length) * 100 : 0}%` }} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1.5">{done}/{engTasks.length} completed</p>
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
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold placeholder:text-slate-400"
            />
          </div>
          <span className="text-xs font-bold text-slate-400">{filtered.length} tasks matching</span>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse font-bold">Synchronizing team tasks...</div>
        ) : (
          <TaskTable tasks={filtered} showAssignee />
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   3. ASSIGN TASK
   ════════════════════════════════════════════════════════════ */
const AssignTaskView = ({ projectId, members, onCreated }: { projectId: number; members: any[]; onCreated: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    assigned_user_id: "",
    priority: "Medium",
    start_date: "",
    end_date: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      toast.error("Please select a project first");
      return;
    }

    setIsSubmitting(true);
    try {
      const taskPayload = {
        ...form,
        priority: form.priority.toUpperCase(),
        assigned_user_ids: [Number(form.assigned_user_id)],
        project_id: projectId
      };

      await projectService.createTask(projectId, taskPayload);
      toast.success("Task assigned successfully");
      setForm({ title: "", assigned_user_id: "", priority: "Medium", start_date: "", end_date: "", description: "" });
      onCreated();
    } catch (error) {
      toast.error("Failed to assign task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Create & Assign New Task</h3>
          <p className="text-sm text-slate-500 font-medium">Fill in the details below to assign a new task to your project team.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* title */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Task Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. Inspect slab shuttering – Floor 5"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* assignee */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Assign To</label>
              <select
                value={form.assigned_user_id}
                onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-600"
              >
                <option value="">Select team member</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
            {/* priority */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-600"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* start date */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-600"
              />
            </div>
            {/* due date */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-600"
              />
            </div>
          </div>

          {/* description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Detailed instructions for the task…"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder:text-slate-400"
            />
          </div>

          {/* submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="reset"
              onClick={() => setForm({ title: "", assigned_user_id: "", priority: "Medium", start_date: "", end_date: "", description: "" })}
              className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
            >
              {isSubmitting ? 'Assigning...' : 'Assign Task'}
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
const TaskCalendarView = ({ tasks }: { tasks: Task[] }) => {
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
    return tasks.filter((t) => (t.due && t.due.startsWith(dateStr)));
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l.label}</span>
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
                className={`min-h-[100px] p-2 rounded-xl border transition-all ${isToday ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                  }`}
              >
                <span className={`text-xs font-bold ${isToday ? "text-primary" : "text-slate-600"}`}>{day}</span>
                <div className="mt-1 space-y-1">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold truncate ${t.status === "Completed" ? "bg-emerald-100 text-emerald-600" :
                        t.status === "Overdue" ? "bg-rose-100 text-rose-600" :
                          (t.status === "In Progress" || t.status === "Ongoing") ? "bg-blue-100 text-blue-600" :
                            "bg-slate-100 text-slate-500"
                        }`}
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-[9px] font-bold text-slate-400 pl-1">+{dayTasks.length - 3} more</span>
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
  <div className="overflow-x-auto font-inter">
    <table className="w-full text-left">
      <thead>
        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
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
          <tr><td colSpan={showAssignee ? 7 : 6} className="px-6 py-12 text-center text-sm font-bold text-slate-400">No active tasks found for this scope.</td></tr>
        ) : (
          tasks.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-6 py-4">
                <span className="text-xs font-bold text-slate-800">{t.title}</span>
              </td>
              <td className="px-6 py-4 text-[10px] font-black text-primary/80 tracking-widest uppercase">{t.project_name}</td>
              {showAssignee && (
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">{t.assignee_name}</span>
                  </div>
                </td>
              )}
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight ${priorityColor[t.priority]}`}>
                  <Flag className="w-3 h-3" /> {t.priority}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${statusColor[t.status]}`}>{t.status}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <Clock className="w-3 h-3" /> {t.due}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="p-1.5 text-slate-300 hover:text-primary hover:bg-slate-100 rounded-lg transition-all">
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
