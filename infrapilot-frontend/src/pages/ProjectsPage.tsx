import { useState } from "react";
import DashboardLayout from "../components/common/DashboardLayout";
import Navbar from "../components/common/Navbar";
// import DashboardLayout from "../../components/common/DashboardLayout";
// import Navbar from "../../components/common/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────
type ProjectType = "Residential" | "Commercial";
type ProjectStatus = "Ongoing" | "Completed" | "Hold";

interface Project {
  id: string;
  ownerId: string;
  siteAddress: string;
  siteArea: number;
  type: ProjectType;
  startDate: string;
  endDate: string;
  duration: string;
  budget: number;
  paymentTerms: string;
  advancePaid: number;
  siteEngineer: string;
  status: ProjectStatus;
  progress: number;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED: Project[] = [
  {
    id: "PRJ-2025-001", ownerId: "OWN-101",
    siteAddress: "Plot 14, Baner Road, Pune, Maharashtra 411045",
    siteArea: 4200, type: "Residential",
    startDate: "2025-01-10", endDate: "2026-06-30",
    duration: "1 Year 5 Months 20 Days",
    budget: 12400000, paymentTerms: "30% advance, 40% mid-stage, 30% on completion",
    advancePaid: 3720000, siteEngineer: "Ravi Kumar",
    status: "Ongoing", progress: 75,
  },
  {
    id: "PRJ-2025-002", ownerId: "OWN-102",
    siteAddress: "Survey No. 88, Wakad, Pune, Maharashtra 411057",
    siteArea: 18500, type: "Commercial",
    startDate: "2024-08-01", endDate: "2027-03-31",
    duration: "2 Years 7 Months",
    budget: 45000000, paymentTerms: "25% advance, milestone-based 75%",
    advancePaid: 11250000, siteEngineer: "Ankit Desai",
    status: "Ongoing", progress: 45,
  },
  {
    id: "PRJ-2025-003", ownerId: "OWN-103",
    siteAddress: "Hadapsar Industrial Estate, Pune 411028",
    siteArea: 9800, type: "Commercial",
    startDate: "2023-06-15", endDate: "2025-02-28",
    duration: "1 Year 8 Months 13 Days",
    budget: 8200000, paymentTerms: "50% advance, balance on delivery",
    advancePaid: 4100000, siteEngineer: "Sunita Rao",
    status: "Completed", progress: 100,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(2)}Cr`
  : n >= 100000  ? `₹${(n / 100000).toFixed(1)}L`
  : `₹${n.toLocaleString("en-IN")}`;

// Exact same status badge classes used in AdminDashboard health column
const statusBadge: Record<ProjectStatus, string> = {
  Ongoing:   "bg-green-100 text-success",
  Completed: "bg-blue-100 text-primary",
  Hold:      "bg-amber-100 text-warning",
};
// Exact same progress bar color classes used in AdminDashboard
const progressFill: Record<ProjectStatus, string> = {
  Ongoing:   "bg-success",
  Completed: "bg-primary",
  Hold:      "bg-warning",
};
// Status dot colors matching AdminDashboard project progress section
const statusDot: Record<ProjectStatus, string> = {
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
  id: "", ownerId: "", siteAddress: "", siteArea: "",
  type: "" as "" | ProjectType,
  startDate: "", endDate: "", duration: "",
  budget: "", paymentTerms: "", advancePaid: "",
  siteEngineer: "", status: "" as "" | ProjectStatus,
};
type FormErrors = Partial<Record<keyof typeof EMPTY, string>>;

function validate(f: typeof EMPTY, existing: Project[]): FormErrors {
  const e: FormErrors = {};
  if (!f.id.trim())                                  e.id = "Project ID is required.";
  else if (existing.find(p => p.id === f.id.trim())) e.id = "Project ID already exists.";
  if (!f.ownerId.trim())                             e.ownerId = "Owner ID is required.";
  if (!f.siteAddress.trim())                         e.siteAddress = "Required.";
  else if (f.siteAddress.length < 10)                e.siteAddress = "Minimum 10 characters.";
  if (!f.siteArea || Number(f.siteArea) <= 0)        e.siteArea = "Positive number required.";
  if (!f.type)                                       e.type = "Select project type.";
  if (!f.startDate)                                  e.startDate = "Required.";
  if (!f.endDate)                                    e.endDate = "Required.";
  else if (f.startDate && f.endDate < f.startDate)   e.endDate = "Must be ≥ Start Date.";
  if (!f.duration.trim())                            e.duration = "Required.";
  if (!f.budget || Number(f.budget) <= 0)            e.budget = "Must be positive.";
  if (!f.paymentTerms.trim())                        e.paymentTerms = "Required.";
  if (f.advancePaid && Number(f.advancePaid) > Number(f.budget))
                                                     e.advancePaid = "Advance ≤ Budget.";
  if (!f.siteEngineer.trim())                        e.siteEngineer = "Required.";
  else if (f.siteEngineer.trim().length < 5)         e.siteEngineer = "Minimum 5 characters.";
  if (!f.status)                                     e.status = "Mandatory field.";
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
  const remaining = p.budget - p.advancePaid;
  const rows: [string, string][] = [
    ["Project ID",        p.id],
    ["Owner ID",          p.ownerId],
    ["Site Address",      p.siteAddress],
    ["Site Area",         `${p.siteArea.toLocaleString("en-IN")} Sq. Ft.`],
    ["Type",              p.type],
    ["Start Date",        new Date(p.startDate).toLocaleDateString("en-IN")],
    ["End Date",          new Date(p.endDate).toLocaleDateString("en-IN")],
    ["Duration",          p.duration],
    ["Budget",            fmt(p.budget)],
    ["Payment Terms",     p.paymentTerms],
    ["Advance Paid",      fmt(p.advancePaid)],
    ["Remaining Balance", fmt(remaining)],
    ["Site Engineer",     p.siteEngineer],
    ["Status",            p.status],
    ["Work Progress",     `${p.progress}%`],
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
  const [successMsg, setSuccessMsg]     = useState("");
  const [actTab, setActTab]             = useState("All");

  const set = (k: keyof typeof EMPTY, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const remaining =
    form.budget && form.advancePaid
      ? Number(form.budget) - Number(form.advancePaid)
      : null;

  const handleSubmit = async () => {
    const errs = validate(form, projects);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    const np: Project = {
      id: form.id.trim(), ownerId: form.ownerId.trim(),
      siteAddress: form.siteAddress.trim(), siteArea: Number(form.siteArea),
      type: form.type as ProjectType,
      startDate: form.startDate, endDate: form.endDate,
      duration: form.duration.trim(), budget: Number(form.budget),
      paymentTerms: form.paymentTerms.trim(),
      advancePaid: Number(form.advancePaid) || 0,
      siteEngineer: form.siteEngineer.trim(),
      status: form.status as ProjectStatus, progress: 0,
    };
    setProjects(prev => [np, ...prev]);
    setForm({ ...EMPTY }); setErrors({});
    setSaving(false); setShowForm(false);
    setSuccessMsg(`Project "${np.id}" created successfully!`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const filtered = projects.filter(p => {
    const ms = filterStatus === "All" || p.status === filterStatus;
    const mt = filterType === "All"   || p.type   === filterType;
    const mq = !search ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.siteAddress.toLowerCase().includes(search.toLowerCase()) ||
      p.siteEngineer.toLowerCase().includes(search.toLowerCase());
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

      <div className="p-6 bg-slate-50 min-h-screen font-inter">

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
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
            <div
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
                    <Field label="Project ID *" error={errors.id} hint="e.g. PRJ-2025-004">
                      <input className={inp(errors.id)} placeholder="PRJ-2025-004" value={form.id} onChange={e => set("id", e.target.value)} />
                    </Field>
                    <Field label="Owner ID *" error={errors.ownerId} hint="From Owner Module">
                      <input className={inp(errors.ownerId)} placeholder="OWN-104" value={form.ownerId} onChange={e => set("ownerId", e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Site Address *" error={errors.siteAddress} hint="Min 10, max 255 characters">
                    <textarea rows={2} className={`${inp(errors.siteAddress)} resize-none`} placeholder="Plot No., Street, City, State PIN" value={form.siteAddress} onChange={e => set("siteAddress", e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Field label="Site Area (Sq. Ft.) Approx *" error={errors.siteArea} hint="Positive numbers only">
                      <input type="number" min={1} className={inp(errors.siteArea)} placeholder="4500" value={form.siteArea} onChange={e => set("siteArea", e.target.value)} />
                    </Field>
                    <Field label="Type *" error={errors.type}>
                      <select className={inp(errors.type)} value={form.type} onChange={e => set("type", e.target.value)}>
                        <option value="">Select One Option</option>
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </Field>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Timeline</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="Expected Start Date *" error={errors.startDate} hint="Cannot be past date">
                      <input type="date" className={inp(errors.startDate)} value={form.startDate} onChange={e => set("startDate", e.target.value)} />
                    </Field>
                    <Field label="Project End Date *" error={errors.endDate} hint="Must be ≥ Start Date">
                      <input type="date" className={inp(errors.endDate)} value={form.endDate} onChange={e => set("endDate", e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Project Estimated Duration *" error={errors.duration} hint="e.g. 2 Years 5 Months 25 Days">
                    <input className={inp(errors.duration)} placeholder="1 Year 6 Months" value={form.duration} onChange={e => set("duration", e.target.value)} />
                  </Field>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Financials</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="Project Estimated Budget (₹) *" error={errors.budget} hint="e.g. 2500000">
                      <input type="number" min={1} className={inp(errors.budget)} placeholder="2500000" value={form.budget} onChange={e => set("budget", e.target.value)} />
                    </Field>
                    <Field label="Advance Paid (₹)" error={errors.advancePaid} hint="Must be ≤ Budget">
                      <input type="number" min={0} className={inp(errors.advancePaid)} placeholder="500000" value={form.advancePaid} onChange={e => set("advancePaid", e.target.value)} />
                    </Field>
                  </div>
                  {/* Auto-calc — same info alert style as Critical Alerts section */}
                  {remaining !== null && (
                    <div className="p-3 bg-blue-50 rounded-xl flex items-center justify-between mb-4 border border-blue-100">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <p className="text-xs font-bold text-primary">Remaining Balance (Auto Calculated)</p>
                      </div>
                      <span className={`text-sm font-bold ${remaining < 0 ? "text-danger" : "text-success"}`}>
                        {remaining < 0 ? `- ${fmt(Math.abs(remaining))}` : fmt(remaining)}
                      </span>
                    </div>
                  )}
                  <Field label="Payment Terms *" error={errors.paymentTerms} hint="Payment schedule details">
                    <input className={inp(errors.paymentTerms)} placeholder="30% advance, 40% mid-stage, 30% on completion" value={form.paymentTerms} onChange={e => set("paymentTerms", e.target.value)} />
                  </Field>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Team & Status</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Site Engineer Name *" error={errors.siteEngineer} hint="5–50 characters">
                      <input className={inp(errors.siteEngineer)} placeholder="Ravi Kumar" value={form.siteEngineer} onChange={e => set("siteEngineer", e.target.value)} />
                    </Field>
                    <Field label="Project Status *" error={errors.status}>
                      <select className={inp(errors.status)} value={form.status} onChange={e => set("status", e.target.value)}>
                        <option value="">Select Status</option>
                        <option value="Ongoing">1) Ongoing</option>
                        <option value="Completed">2) Completed</option>
                        <option value="Hold">3) Hold</option>
                      </select>
                    </Field>
                  </div>
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
            </div>
          </div>
        )}

        {viewP && <DetailModal p={viewP} onClose={() => setViewP(null)} />}
      </div>
    </DashboardLayout>
  );
};

export default ProjectsPage;
