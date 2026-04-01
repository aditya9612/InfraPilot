import { useState, useEffect } from "react";
import DashboardLayout from "../components/common/DashboardLayout";
import Navbar from "../components/common/Navbar";
import PageTransition from "../components/common/PageTransition";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
type ProjectType = "Residential" | "Commercial";
type ProjectStatus = "Planned" | "Ongoing" | "Completed" | "Hold";

interface Project {
  id: string;
  project_name: string;
  owner_id: number;
  description: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progress: number;
  // UI-only/Legacy fields kept for compatibility with existing components
  siteAddress: string;
  type: ProjectType;
  budget: number;
  siteEngineer: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED: Project[] = [
  {
    id: "PRJ-2025-001", project_name: "Skyline Tower A", owner_id: 101,
    description: "Residential project in Baner Road",
    siteAddress: "Plot 14, Baner Road, Pune, Maharashtra 411045",
    type: "Residential",
    startDate: "2025-01-10", endDate: "2026-06-30",
    budget: 12400000, siteEngineer: "Ravi Kumar",
    status: "Ongoing", progress: 75,
  },
  {
    id: "PRJ-2025-002", project_name: "Metro Extension", owner_id: 102,
    description: "Commercial project in Wakad",
    siteAddress: "Survey No. 88, Wakad, Pune, Maharashtra 411057",
    type: "Commercial",
    startDate: "2024-08-01", endDate: "2027-03-31",
    budget: 45000000, siteEngineer: "Ankit Desai",
    status: "Ongoing", progress: 45,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(2)}Cr`
  : n >= 100000  ? `₹${(n / 100000).toFixed(1)}L`
  : `₹${n.toLocaleString("en-IN")}`;

// Exact same status badge classes used in AdminDashboard health column
const statusBadge: Record<ProjectStatus, string> = {
  Planned:   "bg-slate-100 text-slate-500",
  Ongoing:   "bg-green-100 text-success",
  Completed: "bg-blue-100 text-primary",
  Hold:      "bg-amber-100 text-warning",
};
// Exact same progress bar color classes used in AdminDashboard
const progressFill: Record<ProjectStatus, string> = {
  Planned:   "bg-slate-300",
  Ongoing:   "bg-success",
  Completed: "bg-primary",
  Hold:      "bg-warning",
};
// Status dot colors matching AdminDashboard project progress section
const statusDot: Record<ProjectStatus, string> = {
  Planned:   "bg-slate-400",
  Ongoing:   "bg-success",
  Completed: "bg-primary",
  Hold:      "bg-warning",
};
const typeBadge: Record<ProjectType, string> = {
  Residential: "bg-violet-50 text-violet-600",
  Commercial:  "bg-sky-50 text-sky-600",
};

// ─── Validation ───────────────────────────────────────────────────────────────
const EMPTY = {
  project_name: "", owner_id: 1, description: "",
  startDate: "", endDate: "", status: "Planned",
};
type FormErrors = Partial<Record<keyof typeof EMPTY, string>>;

function validate(f: typeof EMPTY): FormErrors {
  const e: FormErrors = {};
  if (!f.project_name.trim()) e.project_name = "Project name is required.";
  if (!f.description.trim())  e.description = "Required.";
  if (!f.startDate)           e.startDate = "Required.";
  if (!f.endDate)             e.endDate = "Required.";
  else if (f.startDate && f.endDate < f.startDate) e.endDate = "Must be ≥ Start Date.";
  return e;
}

// ─── Shared input class helpers (same border/rounded/focus as project theme) ──
const inp = (err?: string) =>
  `w-full px-3 py-2.5 rounded-xl border text-sm text-slate-700 bg-slate-50 outline-none transition focus:bg-white focus:ring-2 ${
    err ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:ring-primary/20 focus:border-primary"
  }`;

// ─── Field wrapper ────────────────────────────────────────────────────────────
const Field = ({ label, error, hint, children }: {
  label: string; error?: string; hint?: string; children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
    {children}
    {hint && !error && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
  </div>
);

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const DetailModal = ({ p, onClose }: { p: Project; onClose: () => void }) => {
  const rows: [string, string][] = [
    ["Project ID",        p.id],
    ["Project Name",      p.project_name],
    ["Owner ID",          p.owner_id.toString()],
    ["Description",       p.description],
    ["Start Date",        new Date(p.startDate).toLocaleDateString("en-IN")],
    ["End Date",          new Date(p.endDate).toLocaleDateString("en-IN")],
    ["Status",            p.status],
    ["Work Progress",     `${p.progress}%`],
    ["Site Address",      p.siteAddress],
    ["Type",              p.type],
    ["Budget",            fmt(p.budget)],
    ["Site Engineer",     p.siteEngineer],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* bg-primary — exact same as Navbar */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <p className="text-blue-100 text-xs font-mono">{p.id}</p>
            <h2 className="text-white font-bold text-lg">Project Details</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white hover:bg-blue-600 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Progress bar — same AdminDashboard pattern */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-slate-700">{p.siteAddress.split(",")[0]}</p>
              <span className="text-[10px] font-bold text-slate-400">{p.progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
              <div
                className={`h-full ${progressFill[p.status]} transition-all duration-700`}
                style={{ width: `${p.progress}%` }}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot[p.status]}`} />
              <span className="text-[9px] font-bold text-slate-400 uppercase translate-y-px">{p.status}</span>
            </div>
          </div>

          {/* Details — same slate-50 card style */}
          <div className="grid grid-cols-2 gap-3">
            {rows.map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded-xl p-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k}</p>
                <p className="text-sm font-semibold text-slate-700 break-words">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ProjectsPage = () => {
  const [projects, setProjects]         = useState<Project[]>(SEED);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState({ ...EMPTY });
  const [errors, setErrors]             = useState<FormErrors>({});
  const [saving, setSaving]             = useState(false);
  const [viewP, setViewP]               = useState<Project | null>(null);
  const [filterStatus, setFilterStatus] = useState<"All" | ProjectStatus>("All");
  const [filterType, setFilterType]     = useState<"All" | ProjectType>("All");
  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [successMsg, setSuccessMsg]     = useState("");
  const [actTab, setActTab]             = useState("All");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const set = (k: keyof typeof EMPTY, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const handleSubmit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    const np: Project = {
      id: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
      project_name: form.project_name.trim(),
      owner_id: Number(form.owner_id) || 1,
      description: form.description.trim(),
      startDate: form.startDate, endDate: form.endDate,
      status: form.status as ProjectStatus,
      progress: 0,
      
      // Fallbacks for UI compatibility
      siteAddress: form.description.trim() || 'No address',
      type: "Residential",
      budget: 0,
      siteEngineer: "Unassigned",
    };
    setProjects(prev => [np, ...prev]);
    setForm({ ...EMPTY }); setErrors({});
    setSaving(false); setShowForm(false);
    setSuccessMsg(`Project "${np.project_name}" created successfully!`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };


  const filtered = projects.filter(p => {
    const ms = filterStatus === "All" || p.status === filterStatus;
    const mt = filterType === "All"   || p.type   === filterType;
    const mq = !debouncedSearch ||
      p.id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.siteAddress.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.siteEngineer.toLowerCase().includes(debouncedSearch.toLowerCase());
    return ms && mt && mq;
  });

  const stats = {
    total:     projects.length,
    ongoing:   projects.filter(p => p.status === "Ongoing").length,
    completed: projects.filter(p => p.status === "Completed").length,
    hold:      projects.filter(p => p.status === "Hold").length,
    budget:    projects.reduce((s, p) => s + p.budget, 0),
  };

  return (
    <DashboardLayout>
      <Navbar title="Projects" breadcrumb={["InfraPilot", "Admin", "Projects"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">

        {/* Success toast — same bg-success color */}
        {successMsg && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-success text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold">
            ✓ {successMsg}
          </div>
        )}

        {/* ── Page Header — identical to AdminDashboard ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Site / Project Management
            </h1>
            <p className="text-slate-500 text-sm">
              Real-time infrastructure projects and budget monitoring.
            </p>
          </div>
          {/* Exact same button classes from AdminDashboard header */}
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">
              Download CSV
            </button>
            <button
              onClick={() => { setShowForm(true); setForm({ ...EMPTY }); setErrors({}); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
            >
              + New Project
            </button>
          </div>
        </div>

        {/* ── Stat Cards — exact StatCard component style ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: "Total Projects",  value: String(stats.total),     sub: `+${stats.ongoing} active this month`,  accent: "text-primary"   },
            { title: "Ongoing Sites",   value: String(stats.ongoing),   sub: "Currently in progress",               accent: "text-blue-500"  },
            { title: "Completed",       value: String(stats.completed), sub: "Successfully delivered",              accent: "text-success"   },
            { title: "Total Budget",    value: fmt(stats.budget),       sub: "All projects combined",               accent: "text-violet-500"},
          ].map(s => (
            <div key={s.title} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{s.title}</p>
              <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
              {s.sub && <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── Main content: Cards + Activity — same 3-col grid as AdminDashboard ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          {/* Project Cards — lg:col-span-2 */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters bar inside a white card — same border/rounded style */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex flex-wrap gap-3 items-center">
                {/* Search — same style as Sidebar search */}
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 flex-1">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search here..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-transparent text-xs text-slate-500 outline-none w-full placeholder:text-slate-400"
                  />
                </div>
                {/* Status tabs — exact same activity pulse tab style */}
                <div className="flex gap-2">
                  {(["All", "Ongoing", "Completed", "Hold"] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        filterStatus === s
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
                {/* Type tabs */}
                <div className="flex gap-2">
                  {(["All", "Residential", "Commercial"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        filterType === t
                          ? "bg-violet-500 text-white shadow-md shadow-violet-200"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Project progress cards — exact AdminDashboard "Project Progress" section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-slate-800">Project Progress</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {filtered.length} of {projects.length} Projects
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🏗️</p>
                  <p className="font-bold text-slate-500 text-sm">No projects found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filtered.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setViewP(p)}
                      className="group cursor-pointer bg-slate-50/50 rounded-xl p-4 hover:bg-slate-50 transition-colors border border-slate-50"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="min-w-0">
                          <p className="text-[9px] font-mono font-bold text-slate-400">{p.id}</p>
                          {/* group-hover:text-primary — same as AdminDashboard */}
                          <p className="text-xs font-bold text-slate-700 group-hover:text-primary transition-colors truncate max-w-[150px]">
                            {p.siteAddress.split(",")[0]}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{p.progress}%</span>
                      </div>

                      {/* Type badge */}
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${typeBadge[p.type]}`}>
                        {p.type}
                      </span>

                      {/* Progress bar — exact AdminDashboard style */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3 mb-2">
                        <div
                          className={`h-full ${progressFill[p.status]} transition-all duration-1000`}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>

                      {/* Status dot + label — exact same AdminDashboard pattern */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[p.status]}`} />
                          <span className="text-[9px] font-bold text-slate-400 uppercase translate-y-px">
                            {p.status}
                          </span>
                        </div>
                        {/* Budget pill */}
                        <span className="text-[9px] font-bold text-slate-500">{fmt(p.budget)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity Panel — exact AdminDashboard Activity Pulse */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-50">
              <h2 className="font-bold text-slate-800 mb-4">Project Activity</h2>
              <div className="flex gap-2">
                {["All", "Finance", "Site"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      actTab === tab
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[420px]">
              {[
                { user: "Ravi K.",   action: "completed Foundation Paving — PRJ-2025-001", time: "12m ago",  type: "task"  },
                { user: "Priya N.",  action: "submitted Invoice #882 for Wakad Site",      time: "45m ago",  type: "money" },
                { user: "Site Bot",  action: "uploaded 12 site photos",                    time: "2h ago",   type: "photo" },
                { user: "Amit K.",   action: "reported Material Shortage at Hadapsar",     time: "4h ago",   type: "alert" },
                { user: "Ankit D.",  action: "updated progress to 45% — PRJ-2025-002",     time: "6h ago",   type: "task"  },
                { user: "Sunita R.", action: "marked PRJ-2025-003 as Completed",           time: "1d ago",   type: "task"  },
              ].map((act, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    act.type === "alert" ? "bg-red-50 text-red-500"
                    : act.type === "money" ? "bg-green-50 text-green-500"
                    : "bg-blue-50 text-blue-500"
                  }`}>
                    {act.type === "task"  && "✔"}
                    {act.type === "money" && "₹"}
                    {act.type === "photo" && "📷"}
                    {act.type === "alert" && "⚠️"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-800 leading-snug">
                      <span className="font-bold">{act.user}</span> {act.action}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Master Projects Table — exact AdminDashboard table style ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Master Projects Overview</h2>
            <button className="text-xs text-primary font-bold hover:underline">Download CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="px-6 py-4">Project ID</th>
                  <th className="px-6 py-4">Site / Address</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Allocated Budget</th>
                  <th className="px-6 py-4">Total Progress</th>
                  <th className="px-6 py-4">Engineer</th>
                  <th className="px-6 py-4">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => setViewP(p)}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{p.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-primary transition-colors">
                      {p.siteAddress.split(",")[0]}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${typeBadge[p.type]}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium text-sm">{fmt(p.budget)}</td>
                    {/* Progress — exact AdminDashboard table column style */}
                    <td className="px-6 py-4 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${progressFill[p.status]}`} style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-400">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                          {p.siteEngineer.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-500">{p.siteEngineer}</span>
                      </div>
                    </td>
                    {/* Health badge — EXACT same as AdminDashboard health column */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${statusBadge[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Create Project Drawer ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
              >
              {/* bg-primary — same as Navbar */}
              <div className="bg-primary px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div>
                  <h2 className="text-white font-bold text-lg">New Project</h2>
                  <p className="text-blue-100 text-xs">Site / Project Management Module</p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-blue-600 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 p-6 space-y-5">

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Basic Information
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="Project Name *" error={errors.project_name} hint="e.g. SARA CITY">
                      <input className={inp(errors.project_name)} placeholder="SARA CITY" value={form.project_name} onChange={e => set("project_name", e.target.value)} />
                    </Field>
                    <Field label="Owner ID *" error={errors.owner_id} hint="Numeric ID">
                      <input type="number" className={inp(errors.owner_id)} placeholder="1" value={form.owner_id} onChange={e => set("owner_id", e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Description *" error={errors.description} hint="Project details">
                    <textarea rows={2} className={`${inp(errors.description)} resize-none`} placeholder="Wing A Construction" value={form.description} onChange={e => set("description", e.target.value)} />
                  </Field>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Timeline & Status</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="Start Date *" error={errors.startDate} hint="Expected start date">
                      <input type="date" className={inp(errors.startDate)} value={form.startDate} onChange={e => set("startDate", e.target.value)} />
                    </Field>
                    <Field label="End Date *" error={errors.endDate} hint="Expected completion">
                      <input type="date" className={inp(errors.endDate)} value={form.endDate} onChange={e => set("endDate", e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Project Status *" error={errors.status}>
                    <select className={inp(errors.status)} value={form.status} onChange={e => set("status", e.target.value)}>
                      <option value="Planned">Planned</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="Hold">Hold</option>
                    </select>
                  </Field>
                </div>
              </div>

              {/* Drawer footer — exact same button classes as AdminDashboard */}
              <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 flex items-center justify-center py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : "Create Project"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {viewP && <DetailModal p={viewP} onClose={() => setViewP(null)} />}
      </PageTransition>
    </DashboardLayout>
  );
};

export default ProjectsPage;
