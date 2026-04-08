import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

// ── Types ──────────────────────────────────────────────────────────────────
interface Equipment {
  id: number;
  name: string;
  eqId: string;
  operator: string;
  hours: number;
  fuel: number;
  condition: "Good" | "Repair";
  rental: number;
  maintenance: string;
  icon: string;
}

interface UsageLog {
  id: number;
  eqId: number;
  date: string;
  operator: string;
  hours: number;
  fuel: number;
  condition: string;
  remarks: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const initEquipment: Equipment[] = [
  { id: 1, name: "JCB Excavator", eqId: "EQ-001", operator: "Ramesh Singh", hours: 8, fuel: 45, condition: "Good", rental: 4500, maintenance: "2025-04-20", icon: "🏗️" },
  { id: 2, name: "Concrete Mixer", eqId: "EQ-002", operator: "Suresh Kumar", hours: 10, fuel: 20, condition: "Good", rental: 1200, maintenance: "2025-05-01", icon: "🌀" },
  { id: 3, name: "Tower Crane", eqId: "EQ-003", operator: "Anil Verma", hours: 6, fuel: 60, condition: "Repair", rental: 8000, maintenance: "2025-03-28", icon: "🏗️" },
  { id: 4, name: "Compactor", eqId: "EQ-004", operator: "Deepak Rao", hours: 5, fuel: 30, condition: "Good", rental: 2000, maintenance: "2025-05-15", icon: "🚜" },
];

const initLogs: UsageLog[] = [
  { id: 1, eqId: 1, date: "2025-03-25", operator: "Ramesh Singh", hours: 8, fuel: 40, condition: "Good", remarks: "Excavation at Block A" },
  { id: 2, eqId: 2, date: "2025-03-26", operator: "Suresh Kumar", hours: 10, fuel: 15, condition: "Good", remarks: "Foundations" },
];

const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
const errMsg = "text-danger text-xs mt-1 font-medium";

// ── Main Page ──────────────────────────────────────────────────────────────
const MachineryPage = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(initEquipment);
  const [logs, setLogs] = useState<UsageLog[]>(initLogs);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedEqId, setSelectedEqId] = useState<number | null>(null);
  const [historyEqId, setHistoryEqId] = useState<number | null>(null);

  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    operator: "",
    hours: "",
    fuel: "0",
    condition: "Good" as "Good" | "Repair",
    remarks: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalHours = equipmentList.reduce((s, e) => s + e.hours, 0);
  const totalFuel = equipmentList.reduce((s, e) => s + e.fuel, 0);
  const repairCount = equipmentList.filter(e => e.condition === "Repair").length;


  const handleLogSubmit = () => {
    const errs: Record<string, string> = {};
    if (!newLog.hours || isNaN(Number(newLog.hours)) || Number(newLog.hours) <= 0)
      errs.hours = "Valid hours required";
    if (!newLog.operator.trim()) errs.operator = "Operator name required";

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    if (selectedEqId) {
      setEquipmentList(prev => prev.map(e => e.id === selectedEqId ? {
        ...e,
        hours: e.hours + Number(newLog.hours),
        fuel: e.fuel + Number(newLog.fuel),
        operator: newLog.operator,
        condition: newLog.condition
      } : e));

      const logEntry: UsageLog = {
        id: Date.now(),
        eqId: selectedEqId,
        date: newLog.date,
        operator: newLog.operator,
        hours: Number(newLog.hours),
        fuel: Number(newLog.fuel),
        condition: newLog.condition,
        remarks: newLog.remarks
      };
      setLogs(prev => [logEntry, ...prev]);
    }

    setShowLogModal(false);
    setSelectedEqId(null);
    setNewLog({ date: new Date().toISOString().split('T')[0], operator: "", hours: "", fuel: "0", condition: "Good", remarks: "" });
    setErrors({});
  };

  return (
    <DashboardLayout>
      <Navbar title="Machinery & Equipment" breadcrumb={["InfraPilot", "Engineer", "Machinery"]}
        action={{ label: "+ Log Usage", onClick: () => { setSelectedEqId(equipmentList[0].id); setShowLogModal(true); } }} />

      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Equipment", value: equipmentList.length, icon: "🏗️", color: "bg-blue-50 text-blue-600" },
            { label: "Total Hours", value: `${totalHours}h`, icon: "⏱️", color: "bg-purple-50 text-purple-600" },
            { label: "Fuel Used (L)", value: totalFuel, icon: "⛽", color: "bg-orange-50 text-orange-600" },
            { label: "Needs Repair", value: repairCount, icon: "🔧", color: "bg-red-50 text-red-600" },
          ].map((c, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28">
              <span className={`w-8 h-8 ${c.color} rounded-lg flex items-center justify-center text-lg`}>{c.icon}</span>
              <div>
                <p className="text-xl font-bold text-slate-800 leading-none">{c.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {equipmentList.map(eq => (
            <div key={eq.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl border border-slate-100">{eq.icon}</div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{eq.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{eq.eqId} · Operator: {eq.operator}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${eq.condition === "Good" ? "bg-green-50 text-success" : "bg-red-50 text-danger"}`}>
                  {eq.condition === "Good" ? "✅ Good" : "🔧 Repair"}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: "Total Hours", val: `${eq.hours}h` },
                  { label: "Fuel Consumed", val: `${eq.fuel} L` },
                  { label: "Rental Rate", val: `₹${eq.rental}/day` },
                  { label: "Next Maint.", val: eq.maintenance },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-2.5 text-center">
                    <p className="text-xs font-bold text-slate-700">{s.val}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-5 pt-5 border-t border-slate-50">
                <button onClick={() => { setSelectedEqId(eq.id); setShowLogModal(true); }} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/30 active:scale-95 transition-all">
                  📝 Log Daily Usage
                </button>
                <button onClick={() => setHistoryEqId(eq.id)} className="px-4 text-primary text-xs font-bold hover:underline transition-all active:scale-95">View History →</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showLogModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => { setShowLogModal(false); setErrors({}); }}
        >
          <div
            className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">+ Log Usage</h3>
              <button onClick={() => { setShowLogModal(false); setErrors({}); }} className="text-slate-400 text-2xl">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Machine</label>
                <select className={inp} value={selectedEqId || ""} onChange={e => setSelectedEqId(Number(e.target.value))}>
                  {equipmentList.map(e => <option key={e.id} value={e.id}>{e.name} ({e.eqId})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Usage Date</label>
                  <input type="date" className={inp} value={newLog.date} onChange={e => setNewLog({ ...newLog, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Operator Name *</label>
                  <input className={`${inp} ${errors.operator ? "!border-danger" : ""}`} placeholder="Full Name" value={newLog.operator} onChange={e => setNewLog({ ...newLog, operator: e.target.value })} />
                  {errors.operator && <p className={errMsg}>{errors.operator}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Hours Worked *</label>
                  <input type="number" className={`${inp} ${errors.hours ? "!border-danger" : ""}`} placeholder="e.g. 8" value={newLog.hours} onChange={e => setNewLog({ ...newLog, hours: e.target.value })} />
                  {errors.hours && <p className={errMsg}>{errors.hours}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fuel Added (L)</label>
                  <input type="number" className={inp} value={newLog.fuel} onChange={e => setNewLog({ ...newLog, fuel: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Current Condition</label>
                <div className="flex gap-2">
                  {["Good", "Repair"].map(c => (
                    <button key={c} onClick={() => setNewLog({ ...newLog, condition: c as any })}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-bold border transition-all ${newLog.condition === c ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-200"}`}>
                      {c === "Good" ? "✅ Good" : "🔧 Needs Repair"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Remarks</label>
                <textarea className={`${inp} h-20 resize-none`} placeholder="Any work details or issues..." value={newLog.remarks} onChange={e => setNewLog({ ...newLog, remarks: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowLogModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold transition-all active:scale-95">Cancel</button>
                <button onClick={handleLogSubmit} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Submit Log</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {historyEqId && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setHistoryEqId(null)}
        >
          <div
            className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-100 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8 border-b border-slate-50 flex justify-between items-start bg-white">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl border border-slate-100 shadow-sm">
                  {equipmentList.find(e => e.id === historyEqId)?.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 leading-tight">
                    {equipmentList.find(e => e.id === historyEqId)?.name}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    Usage History Log · {equipmentList.find(e => e.id === historyEqId)?.eqId}
                  </p>
                </div>
              </div>
              <button onClick={() => setHistoryEqId(null)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all text-2xl">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Operator</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Hours</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Fuel</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.filter(l => l.eqId === historyEqId).length > 0 ? (
                    logs.filter(l => l.eqId === historyEqId).map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <p className="text-xs font-black text-slate-700">{new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-bold text-slate-600">{log.operator}</p>
                          {log.remarks && <p className="text-[10px] text-slate-400 mt-0.5 italic">"{log.remarks}"</p>}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black">{log.hours}h</span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-black">{log.fuel}L</span>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-2 py-0.5 text-[9px] font-black rounded-full ${log.condition === "Good" ? "bg-green-50 text-success" : "bg-red-50 text-danger"}`}>
                            {log.condition === "Good" ? "✅ GOOD" : "🔧 REPAIR"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No usage logs found for this equipment</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setHistoryEqId(null)} className="px-8 py-3.5 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-900 transition-all active:scale-95">Close History</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MachineryPage;
