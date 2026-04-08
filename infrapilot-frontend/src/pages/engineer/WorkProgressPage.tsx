import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

// ── Types ──────────────────────────────────────────────────────────────────
interface Activity {
  id: number;
  name: string;
  boqCode: string;
  unit: string;
  planned: number;
  completed: number;
  todayProgress: number;
  start: string;
  end: string;
  status: "On Track" | "Delay";
}

interface ProgressEntry {
  activityId: number;
  date: string;
  progress: string;
}

interface EntryErrors {
  activityId?: string;
  date?: string;
  progress?: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const initActivities: Activity[] = [
  { id: 1, name: "Excavation – Block A",  boqCode: "EXC-001", unit: "m³", planned: 500, completed: 340, todayProgress: 0, start: "2025-03-01", end: "2025-04-15", status: "On Track" },
  { id: 2, name: "RCC Column – Floor 1",  boqCode: "RCC-102", unit: "m³", planned: 120, completed: 120, todayProgress: 0, start: "2025-03-10", end: "2025-03-30", status: "On Track" },
  { id: 3, name: "Brickwork – Section 3", boqCode: "BRK-203", unit: "m²", planned: 800, completed: 550, todayProgress: 0, start: "2025-03-20", end: "2025-05-01", status: "Delay" },
  { id: 4, name: "Plastering – Block B",  boqCode: "PLS-301", unit: "m²", planned: 1200, completed: 200, todayProgress: 0, start: "2025-04-01", end: "2025-05-20", status: "On Track" },
  { id: 5, name: "RCC Slab – Floor 2",    boqCode: "RCC-205", unit: "m³", planned: 90,  completed: 20,  todayProgress: 0, start: "2025-04-05", end: "2025-04-25", status: "On Track" },
];

const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
const errMsg = "text-danger text-xs mt-1 font-medium";

// ── Component ──────────────────────────────────────────────────────────────
const WorkProgressPage = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const isEntry   = location.pathname.includes("/entry");
  const activeTab = isEntry ? "entry" : "activities";

  const [activities, setActivities] = useState<Activity[]>(initActivities);
  const [filterStatus, setFilterStatus] = useState<"All" | "On Track" | "Delay">("All");
  const [showAddModal, setShowAddModal] = useState(false);

  // Entry form state
  const [entry, setEntry] = useState<ProgressEntry>({
    activityId: 0,
    date: new Date().toISOString().split("T")[0],
    progress: "",
  });
  const [entryErrors, setEntryErrors] = useState<EntryErrors>({});
  const [entrySuccess, setEntrySuccess] = useState(false);

  // Add activity form
  const [newAct, setNewAct] = useState({
    name: "", boqCode: "", unit: "m³", planned: "", start: "", end: "", status: "On Track",
  });
  const [actErrors, setActErrors] = useState<Record<string, string>>({});

  const filtered = activities.filter(a => filterStatus === "All" || a.status === filterStatus);

  // ── Validate entry ────────────────────────────────────────────────────
  const validateEntry = () => {
    const errs: EntryErrors = {};
    if (!entry.activityId) errs.activityId = "Activity select karo";
    if (!entry.date)       errs.date       = "Date required hai";
    const p = parseFloat(entry.progress);
    if (!entry.progress)   errs.progress   = "Progress required hai";
    else if (isNaN(p) || p <= 0) errs.progress = "Valid positive number dalo";
    else {
      const act = activities.find(a => a.id === entry.activityId);
      if (act && p > (act.planned - act.completed))
        errs.progress = `Max ${act.planned - act.completed} ${act.unit} remaining hai`;
    }
    return errs;
  };

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateEntry();
    if (Object.keys(errs).length) { setEntryErrors(errs); return; }

    setActivities(prev => prev.map(a => {
      if (a.id !== entry.activityId) return a;
      const newCompleted = a.completed + parseFloat(entry.progress);
      const pct = (newCompleted / a.planned) * 100;
      return { ...a, completed: newCompleted, todayProgress: parseFloat(entry.progress), status: pct >= 100 ? "On Track" : a.status };
    }));
    setEntry({ activityId: 0, date: new Date().toISOString().split("T")[0], progress: "" });
    setEntryErrors({});
    setEntrySuccess(true);
    setTimeout(() => setEntrySuccess(false), 3000);
  };

  // ── Validate new activity ─────────────────────────────────────────────
  const validateAct = () => {
    const errs: Record<string, string> = {};
    if (!newAct.name.trim())  errs.name    = "Activity naam required";
    if (!newAct.boqCode.trim()) errs.boqCode = "BOQ Code required";
    if (!newAct.planned || isNaN(Number(newAct.planned)) || Number(newAct.planned) <= 0)
      errs.planned = "Valid planned quantity dalo";
    if (!newAct.start) errs.start = "Start date required";
    if (!newAct.end)   errs.end   = "End date required";
    if (newAct.start && newAct.end && newAct.end <= newAct.start)
      errs.end = "End date, start date ke baad honi chahiye";
    return errs;
  };

  const handleAddActivity = () => {
    const errs = validateAct();
    if (Object.keys(errs).length) { setActErrors(errs); return; }
    const id = Math.max(...activities.map(a => a.id)) + 1;
    setActivities(prev => [...prev, {
      id, name: newAct.name, boqCode: newAct.boqCode, unit: newAct.unit,
      planned: Number(newAct.planned), completed: 0, todayProgress: 0,
      start: newAct.start, end: newAct.end, status: newAct.status as "On Track" | "Delay",
    }]);
    setShowAddModal(false);
    setNewAct({ name: "", boqCode: "", unit: "m³", planned: "", start: "", end: "", status: "On Track" });
    setActErrors({});
  };

  return (
    <DashboardLayout>
      <Navbar title="Work Progress" breadcrumb={["InfraPilot", "Engineer", "Work Progress"]}
        action={{ label: "+ Add Activity", onClick: () => setShowAddModal(true) }} />

      <div className="p-4 md:p-6 bg-slate-50 min-h-screen">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Activities", value: activities.length, icon: "📋", color: "bg-blue-50 text-blue-600" },
            { label: "On Track",  value: activities.filter(a => a.status === "On Track").length, icon: "✅", color: "bg-green-50 text-green-600" },
            { label: "Delayed",   value: activities.filter(a => a.status === "Delay").length, icon: "⚠️", color: "bg-red-50 text-red-600" },
            { label: "Avg Completion", value: `${Math.round(activities.reduce((s, a) => s + (a.completed / a.planned) * 100, 0) / activities.length)}%`, icon: "📊", color: "bg-purple-50 text-purple-600" },
          ].map((c, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-24">
              <span className={`w-8 h-8 ${c.color} rounded-lg flex items-center justify-center text-base`}>{c.icon}</span>
              <div>
                <p className="text-xl font-bold text-slate-800 leading-none">{c.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Submenu Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { label: "📋 Activity List",       path: "/engineer/work-progress/activities" },
            { label: "✏️ Daily Progress Entry", path: "/engineer/work-progress/entry" },
          ].map(tab => (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === (tab.path.includes("entry") ? "entry" : "activities")
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-white text-slate-400 border border-slate-100 hover:border-slate-200"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── ACTIVITY LIST TAB ── */}
        {activeTab === "activities" && (
          <>
            {/* Status filter */}
            <div className="flex gap-2 mb-4">
              {(["All", "On Track", "Delay"] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    filterStatus === s ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-200"
                  }`}>
                  {s}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filtered.map(act => {
                const pct = Math.min(100, Math.round((act.completed / act.planned) * 100));
                const remaining = act.planned - act.completed;
                return (
                  <div key={act.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">{act.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          BOQ: {act.boqCode} &nbsp;·&nbsp; {act.start} → {act.end}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap ${
                        act.status === "On Track" ? "bg-green-50 text-success" : "bg-red-50 text-danger"
                      }`}>
                        {act.status === "On Track" ? "✅ On Track" : "⚠️ Delay"}
                      </span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      {[
                        { label: "Planned",    val: `${act.planned} ${act.unit}` },
                        { label: "Completed",  val: `${act.completed} ${act.unit}`, cls: "text-success" },
                        { label: "Remaining",  val: `${remaining} ${act.unit}`,     cls: remaining > 0 ? "text-warning" : "text-slate-700" },
                        { label: "Today",      val: act.todayProgress ? `+${act.todayProgress} ${act.unit}` : "—", cls: "text-primary" },
                      ].map((s, i) => (
                        <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
                          <p className={`text-xs font-bold ${s.cls || "text-slate-700"}`}>{s.val}</p>
                          <p className="text-[9px] text-slate-400 uppercase mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            pct >= 100 ? "bg-success" : pct >= 60 ? "bg-primary" : pct >= 30 ? "bg-warning" : "bg-danger"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm font-bold">Koi activity nahi mili</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── DAILY PROGRESS ENTRY TAB ── */}
        {activeTab === "entry" && (
          <div className="max-w-xl mx-auto">
            {entrySuccess && (
              <div className="bg-green-50 border border-green-200 text-success text-sm font-semibold px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
                ✅ Progress successfully save ho gaya!
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
                <span className="text-xl">✏️</span>
                <h2 className="text-lg font-bold text-slate-800">Daily Progress Entry</h2>
              </div>

              <form onSubmit={handleEntrySubmit} className="space-y-5" noValidate>

                {/* Activity */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">
                    Activity Name *
                  </label>
                  <select className={`${inp} ${entryErrors.activityId ? "!border-danger" : ""}`}
                    value={entry.activityId}
                    onChange={e => { setEntry(f => ({ ...f, activityId: Number(e.target.value) })); setEntryErrors(f => ({ ...f, activityId: "" })); }}>
                    <option value={0}>Activity select karo</option>
                    {activities.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (BOQ: {a.boqCode})</option>
                    ))}
                  </select>
                  {entryErrors.activityId && <p className={errMsg}>⚠ {entryErrors.activityId}</p>}
                </div>

                {/* Selected activity info */}
                {entry.activityId > 0 && (() => {
                  const act = activities.find(a => a.id === entry.activityId)!;
                  const pct = Math.round((act.completed / act.planned) * 100);
                  return (
                    <div className="bg-blue-50 rounded-xl p-4 grid grid-cols-3 gap-3">
                      {[
                        { label: "Planned", val: `${act.planned} ${act.unit}` },
                        { label: "Completed", val: `${act.completed} ${act.unit}` },
                        { label: "Remaining", val: `${act.planned - act.completed} ${act.unit}` },
                      ].map((s, i) => (
                        <div key={i} className="text-center">
                          <p className="text-xs font-bold text-primary">{s.val}</p>
                          <p className="text-[10px] text-slate-500 uppercase">{s.label}</p>
                        </div>
                      ))}
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-bold text-primary">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Date *</label>
                  <input type="date" className={`${inp} ${entryErrors.date ? "!border-danger" : ""}`}
                    value={entry.date}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={e => { setEntry(f => ({ ...f, date: e.target.value })); setEntryErrors(f => ({ ...f, date: "" })); }} />
                  {entryErrors.date && <p className={errMsg}>⚠ {entryErrors.date}</p>}
                </div>

                {/* Today's Progress */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">
                    Today's Progress ({entry.activityId ? activities.find(a => a.id === entry.activityId)?.unit || "unit" : "unit"}) *
                  </label>
                  <input type="number" min="0" step="0.01"
                    className={`${inp} ${entryErrors.progress ? "!border-danger" : ""}`}
                    placeholder="e.g. 25"
                    value={entry.progress}
                    onChange={e => { setEntry(f => ({ ...f, progress: e.target.value })); setEntryErrors(f => ({ ...f, progress: "" })); }} />
                  {entryErrors.progress && <p className={errMsg}>⚠ {entryErrors.progress}</p>}
                </div>

                <button type="submit"
                  className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all">
                  💾 Save Progress Entry
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">+ New Activity</h3>
              <button onClick={() => { setShowAddModal(false); setActErrors({}); }} className="text-slate-400 text-2xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              {/* Activity Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Activity Name *</label>
                <input className={`${inp} ${actErrors.name ? "!border-danger" : ""}`}
                  placeholder="e.g. Excavation – Block B"
                  value={newAct.name}
                  onChange={e => { setNewAct(f => ({ ...f, name: e.target.value })); setActErrors(f => ({ ...f, name: "" })); }} />
                {actErrors.name && <p className={errMsg}>⚠ {actErrors.name}</p>}
              </div>
              {/* BOQ Code */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">BOQ Code *</label>
                <input className={`${inp} ${actErrors.boqCode ? "!border-danger" : ""}`}
                  placeholder="e.g. EXC-002"
                  value={newAct.boqCode}
                  onChange={e => { setNewAct(f => ({ ...f, boqCode: e.target.value })); setActErrors(f => ({ ...f, boqCode: "" })); }} />
                {actErrors.boqCode && <p className={errMsg}>⚠ {actErrors.boqCode}</p>}
              </div>
              {/* Unit + Planned Qty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Unit</label>
                  <select className={inp} value={newAct.unit}
                    onChange={e => setNewAct(f => ({ ...f, unit: e.target.value }))}>
                    {["m³", "m²", "Rmt", "Nos", "Ton", "Kg"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Planned Qty *</label>
                  <input type="number" min="1" className={`${inp} ${actErrors.planned ? "!border-danger" : ""}`}
                    placeholder="e.g. 500"
                    value={newAct.planned}
                    onChange={e => { setNewAct(f => ({ ...f, planned: e.target.value })); setActErrors(f => ({ ...f, planned: "" })); }} />
                  {actErrors.planned && <p className={errMsg}>⚠ {actErrors.planned}</p>}
                </div>
              </div>
              {/* Start + End Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Start Date *</label>
                  <input type="date" className={`${inp} ${actErrors.start ? "!border-danger" : ""}`}
                    value={newAct.start}
                    onChange={e => { setNewAct(f => ({ ...f, start: e.target.value })); setActErrors(f => ({ ...f, start: "" })); }} />
                  {actErrors.start && <p className={errMsg}>⚠ {actErrors.start}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">End Date *</label>
                  <input type="date" className={`${inp} ${actErrors.end ? "!border-danger" : ""}`}
                    value={newAct.end}
                    onChange={e => { setNewAct(f => ({ ...f, end: e.target.value })); setActErrors(f => ({ ...f, end: "" })); }} />
                  {actErrors.end && <p className={errMsg}>⚠ {actErrors.end}</p>}
                </div>
              </div>
              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Status</label>
                <div className="flex gap-3">
                  {["On Track", "Delay"].map(s => (
                    <button key={s} type="button" onClick={() => setNewAct(f => ({ ...f, status: s }))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        newAct.status === s
                          ? s === "On Track" ? "bg-green-50 text-success border-green-300" : "bg-red-50 text-danger border-red-300"
                          : "bg-slate-50 text-slate-400 border-slate-200"
                      }`}>
                      {s === "On Track" ? "✅ On Track" : "⚠️ Delay"}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleAddActivity}
                className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all">
                Add Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WorkProgressPage;
