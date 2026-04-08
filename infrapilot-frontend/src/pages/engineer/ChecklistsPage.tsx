import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

// ── Types ──────────────────────────────────────────────────────────────────
interface ChecklistItem {
  task: string;
  done: boolean;
  remark?: string;
}

interface Checklist {
  id: number;
  name: string;
  type: "Safety" | "Quality" | "Technical";
  date: string;
  items: ChecklistItem[];
  status: "Pending" | "Done";
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const initChecklists: Checklist[] = [
  {
    id: 1, name: "Daily Safety Walkthrough", type: "Safety", date: "28 Mar 2025", status: "Pending",
    items: [
      { task: "Safety helmets & vests checked", done: true },
      { task: "Scaffolding stability verified", done: false, remark: "Loose joint at Block A" },
      { task: "Electrical cables properly insulated", done: true }
    ]
  },
  {
    id: 2, name: "Slab Casting Pre-Check", type: "Quality", date: "27 Mar 2025", status: "Done",
    items: [
      { task: "Reinforcement as per drawing", done: true },
      { task: "Formwork oiling completed", done: true },
      { task: "Cover blocks provided", done: true }
    ]
  },
  {
    id: 3, name: "Plumbing Pressure Test", type: "Technical", date: "25 Mar 2025", status: "Pending",
    items: [
      { task: "Joint leaks check", done: false },
      { task: "Pressure gauge calibration", done: true }
    ]
  }
];

const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
const errMsg = "text-danger text-xs mt-1 font-medium";

// ── Main Page ──────────────────────────────────────────────────────────────
const ChecklistsPage = () => {
  const [checklists, setChecklists] = useState<Checklist[]>(initChecklists);
  const [filter, setFilter] = useState<"All" | "Safety" | "Quality" | "Technical">("All");
  const [showAdd, setShowAdd] = useState(false);
  const [newCheck, setNewCheck] = useState({ name: "", type: "Safety", items: "", status: "Pending", remark: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);

  const filtered = checklists.filter(c => filter === "All" || c.type === filter);

  const handleCreate = () => {
    const errs: Record<string, string> = {};
    if (!newCheck.name.trim()) errs.name = "Checklist name required";
    if (!newCheck.items.trim()) errs.items = "At least one item required";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const itemList = newCheck.items.split("\n").filter(i => i.trim()).map(i => ({ task: i.trim(), done: newCheck.status === "Done" }));

    setChecklists([...checklists, {
      id: Date.now(),
      name: newCheck.name,
      type: newCheck.type as any,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: itemList,
      status: newCheck.status as any
    }]);
    setShowAdd(false);
    setNewCheck({ name: "", type: "Safety", items: "", status: "Pending", remark: "" });
    setErrors({});
  };

  return (
    <DashboardLayout>
      <Navbar title="Quality Checklists" breadcrumb={["InfraPilot", "Engineer", "Checklists"]}
        action={{ label: "+ New Checklist", onClick: () => setShowAdd(true) }} />

      <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
        <div className="flex gap-2 mb-6">
          {(["All", "Safety", "Quality", "Technical"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${filter === f ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-200"}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(check => {
            const doneCount = check.items.filter(i => i.done).length;
            const pct = Math.round((doneCount / check.items.length) * 100);
            return (
              <div key={check.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:border-primary/20 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${check.type === "Safety" ? "bg-red-50 text-danger" : check.type === "Quality" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                    {check.type}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{check.date}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 group-hover:text-primary transition-colors">{check.name}</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Completion</span>
                    <span className="text-slate-700">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-success" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{doneCount}/{check.items.length} Items Done</span>
                  <button onClick={() => setSelectedChecklist(check)} className="text-xs font-bold text-primary hover:underline transition-all active:scale-95">View Details →</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">+ New Checklist</h3>
              <button onClick={() => { setShowAdd(false); setErrors({}); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Checklist Name *</label>
                <input className={inp} placeholder="Safety Inspection..." value={newCheck.name} onChange={e => setNewCheck({ ...newCheck, name: e.target.value })} />
                {errors.name && <p className={errMsg}>⚠ {errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Type</label>
                  <select className={inp} value={newCheck.type} onChange={e => setNewCheck({ ...newCheck, type: e.target.value as any })}>
                    {["Safety", "Quality", "Technical"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Initial Status</label>
                  <select className={inp} value={newCheck.status} onChange={e => setNewCheck({ ...newCheck, status: e.target.value as any })}>
                    <option value="Pending">Pending</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item List (One per line) *</label>
                <textarea className={`${inp} h-32 resize-none leading-relaxed`} placeholder="Enter items to check..." value={newCheck.items} onChange={e => setNewCheck({ ...newCheck, items: e.target.value })} />
                {errors.items && <p className={errMsg}>⚠ {errors.items}</p>}
              </div>
              <button onClick={handleCreate} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]">Create Checklist</button>
            </div>
          </div>
        </div>
      )}

      {selectedChecklist && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="p-8 border-b border-slate-50 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${selectedChecklist.type === "Safety" ? "bg-red-50 text-danger" : selectedChecklist.type === "Quality" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                    {selectedChecklist.type}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">{selectedChecklist.date}</span>
                </div>
                <h3 className="text-xl font-black text-slate-800 leading-tight">{selectedChecklist.name}</h3>
              </div>
              <button onClick={() => setSelectedChecklist(null)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all text-2xl">×</button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Checklist Items ({selectedChecklist.items.length})</label>
                {selectedChecklist.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:shadow-slate-200/50">
                    <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${item.done ? "bg-green-500 text-white shadow-lg shadow-green-200" : "bg-white border-2 border-slate-200 text-slate-300"}`}>
                      {item.done ? "✓" : ""}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${item.done ? "text-slate-800 line-through decoration-slate-300 decoration-2" : "text-slate-700"}`}>{item.task}</p>
                      {item.remark && (
                        <div className="mt-2 flex gap-2 items-center">
                          <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                          <p className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 italic">Remark: {item.remark}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedChecklist(null)} className="px-8 py-3.5 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-900 transition-all active:scale-95">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ChecklistsPage;
