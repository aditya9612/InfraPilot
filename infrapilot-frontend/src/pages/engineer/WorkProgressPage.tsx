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
  { id: 1, name: "Excavation – Block A", boqCode: "EXC-001", unit: "m³", planned: 500, completed: 340, todayProgress: 0, start: "2025-03-01", end: "2025-04-15", status: "On Track" },
  { id: 2, name: "RCC Column – Floor 1", boqCode: "RCC-102", unit: "m³", planned: 120, completed: 120, todayProgress: 0, start: "2025-03-10", end: "2025-03-30", status: "On Track" },
  { id: 3, name: "Brickwork – Section 3", boqCode: "BRK-203", unit: "m²", planned: 800, completed: 550, todayProgress: 0, start: "2025-03-20", end: "2025-05-01", status: "Delay" },
  { id: 4, name: "Plastering – Block B", boqCode: "PLS-301", unit: "m²", planned: 1200, completed: 200, todayProgress: 0, start: "2025-04-01", end: "2025-05-20", status: "On Track" },
  { id: 5, name: "RCC Slab – Floor 2", boqCode: "RCC-205", unit: "m³", planned: 90, completed: 20, todayProgress: 0, start: "2025-04-05", end: "2025-04-25", status: "On Track" },
];

const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
const errMsg = "text-danger text-xs mt-1 font-medium";

// ── Sub-components ────────────────────────────────────────────────────────

const ActivityTracking = ({ activities, filterStatus, setFilterStatus }: { activities: Activity[], filterStatus: string, setFilterStatus: (s: any) => void }) => {
  const filtered = activities.filter(a => filterStatus === "All" || a.status === filterStatus);
  return (
    <>
      <div className="flex gap-2 mb-4">
        {(["All", "On Track", "Delay"] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${filterStatus === s ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-200"
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
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap ${act.status === "On Track" ? "bg-green-50 text-success" : "bg-red-50 text-danger"
                  }`}>
                  {act.status === "On Track" ? "✅ On Track" : "⚠️ Delay"}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {[
                  { label: "Planned", val: `${act.planned} ${act.unit}` },
                  { label: "Completed", val: `${act.completed} ${act.unit}`, cls: "text-success" },
                  { label: "Remaining", val: `${remaining} ${act.unit}`, cls: remaining > 0 ? "text-warning" : "text-slate-700" },
                  { label: "Today", val: act.todayProgress ? `+${act.todayProgress} ${act.unit}` : "—", cls: "text-primary" },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
                    <p className={`text-xs font-bold ${s.cls || "text-slate-700"}`}>{s.val}</p>
                    <p className="text-[9px] text-slate-400 uppercase mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? "bg-success" : pct >= 60 ? "bg-primary" : pct >= 30 ? "bg-warning" : "bg-danger"}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-600 w-10 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const DailyProgressEntry = ({ activities, setActivities }: { activities: Activity[], setActivities: any }) => {
  const [entry, setEntry] = useState<ProgressEntry>({ activityId: 0, date: new Date().toISOString().split("T")[0], progress: "" });
  const [errors, setErrors] = useState<EntryErrors>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs: EntryErrors = {};
    if (!entry.activityId) errs.activityId = "Activity select karo";
    if (!entry.date) errs.date = "Date required hai";
    const p = parseFloat(entry.progress);
    if (!entry.progress) errs.progress = "Progress required hai";
    else if (isNaN(p) || p <= 0) errs.progress = "Valid number dalo";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setActivities((prev: Activity[]) => prev.map(a => a.id === entry.activityId ? { ...a, completed: a.completed + parseFloat(entry.progress), todayProgress: parseFloat(entry.progress) } : a));
    setEntry({ ...entry, progress: "" });
    setErrors({});
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-xl mx-auto">
      {success && <div className="bg-green-50 text-success p-4 rounded-xl mb-4 text-sm font-bold">✅ Progress saved!</div>}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm font-inter">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Daily Progress Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Activity Name *</label>
            <select className={inp} value={entry.activityId} onChange={e => setEntry({ ...entry, activityId: Number(e.target.value) })}>
              <option value={0}>Select Activity</option>
              {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {errors.activityId && <p className={errMsg}>{errors.activityId}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Date *</label>
            <input type="date" className={inp} value={entry.date} onChange={e => setEntry({ ...entry, date: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Today's Progress *</label>
            <input type="number" className={inp} placeholder="0" value={entry.progress} onChange={e => setEntry({ ...entry, progress: e.target.value })} />
            {errors.progress && <p className={errMsg}>{errors.progress}</p>}
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-bold">Save Entry</button>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────
const WorkProgressPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.includes("/entry") ? "entry" : "activities";

  const [activities, setActivities] = useState<Activity[]>(initActivities);
  const [filterStatus, setFilterStatus] = useState<"All" | "On Track" | "Delay">("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAct, setNewAct] = useState({
    name: "", boqCode: "", unit: "m³", planned: "", start: "", end: "", status: "On Track",
    todayProgress: "", totalComplete: "", remainingQty: "", percentComplete: ""
  });
  const [actErrors, setActErrors] = useState<Record<string, string>>({});

  const validateAct = () => {
    const errs: Record<string, string> = {};
    if (!newAct.name.trim()) errs.name = "Name required";
    if (!newAct.boqCode.trim()) errs.boqCode = "BOQ required";
    if (!newAct.planned || isNaN(Number(newAct.planned))) errs.planned = "Invalid qty";
    if (!newAct.todayProgress) errs.todayProgress = "Progress required";
    if (!newAct.totalComplete) errs.totalComplete = "Total required";
    if (!newAct.remainingQty) errs.remainingQty = "Remaining required";
    if (!newAct.percentComplete) errs.percentComplete = "% Required";
    return errs;
  };

  const handleAddActivity = () => {
    const errs = validateAct();
    if (Object.keys(errs).length) { setActErrors(errs); return; }
    setActivities([...activities, {
      id: Date.now(),
      name: newAct.name,
      boqCode: newAct.boqCode,
      unit: newAct.unit,
      planned: Number(newAct.planned),
      completed: Number(newAct.totalComplete),
      todayProgress: Number(newAct.todayProgress),
      start: newAct.start,
      end: newAct.end,
      status: newAct.status as any
    }]);
    setShowAddModal(false);
    setNewAct({ name: "", boqCode: "", unit: "m³", planned: "", start: "", end: "", status: "On Track", todayProgress: "", totalComplete: "", remainingQty: "", percentComplete: "" });
  };

  return (
    <DashboardLayout>
      <Navbar title="Work Progress" breadcrumb={["InfraPilot", "Engineer", "Work Progress"]}
        action={{ label: "+ New Activity", onClick: () => setShowAddModal(true) }} />

      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        <div className="flex gap-2 mb-6">
          <button onClick={() => navigate("/engineer/work-progress/activities")} className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${activeTab === "activities" ? "bg-primary text-white" : "bg-white text-slate-400"}`}>Activity List</button>
          <button onClick={() => navigate("/engineer/work-progress/entry")} className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${activeTab === "entry" ? "bg-primary text-white" : "bg-white text-slate-400"}`}>Progress Entry</button>
        </div>

        {activeTab === "activities"
          ? <ActivityTracking activities={activities} filterStatus={filterStatus} setFilterStatus={setFilterStatus} />
          : <DailyProgressEntry activities={activities} setActivities={setActivities} />
        }
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-5">New Activity</h3>
            <div className="space-y-4">
              <input className={inp} placeholder="Activity Name" value={newAct.name} onChange={e => setNewAct({ ...newAct, name: e.target.value })} />
              {actErrors.name && <p className={errMsg}>⚠ {actErrors.name}</p>}
              <input className={inp} placeholder="BOQ Code" value={newAct.boqCode} onChange={e => setNewAct({ ...newAct, boqCode: e.target.value })} />
              {actErrors.boqCode && <p className={errMsg}>⚠ {actErrors.boqCode}</p>}
              <div className="grid grid-cols-2 gap-3">
                <select className={inp} value={newAct.unit} onChange={e => setNewAct({ ...newAct, unit: e.target.value })}>
                  {["m³", "m²", "Rmt", "Nos", "Ton", "Kg"].map(u => <option key={u}>{u}</option>)}
                </select>
                <input type="number" className={inp} placeholder="Planned Qty" value={newAct.planned} onChange={e => setNewAct({ ...newAct, planned: e.target.value })} />
              </div>
              {actErrors.planned && <p className={errMsg}>⚠ {actErrors.planned}</p>}

              <div className="grid grid-cols-2 gap-3">
                <input type="number" className={inp} placeholder="Today Progress" value={newAct.todayProgress} onChange={e => setNewAct({ ...newAct, todayProgress: e.target.value })} />
                <input type="number" className={inp} placeholder="Total Complete" value={newAct.totalComplete} onChange={e => setNewAct({ ...newAct, totalComplete: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className={inp} placeholder="Remaining Qty" value={newAct.remainingQty} onChange={e => setNewAct({ ...newAct, remainingQty: e.target.value })} />
                <input type="number" className={inp} placeholder="% Complete" value={newAct.percentComplete} onChange={e => setNewAct({ ...newAct, percentComplete: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input type="date" className={inp} value={newAct.start} onChange={e => setNewAct({ ...newAct, start: e.target.value })} />
                <input type="date" className={inp} value={newAct.end} onChange={e => setNewAct({ ...newAct, end: e.target.value })} />
              </div>

              <button onClick={handleAddActivity} className="w-full py-4 bg-primary text-white rounded-2xl font-bold">Add Activity</button>
              <button onClick={() => setShowAddModal(false)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WorkProgressPage;
