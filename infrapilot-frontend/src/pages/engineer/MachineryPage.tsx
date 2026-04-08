import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";


const equipment = [
  { id: 1, name: "JCB Excavator", eqId: "EQ-001", operator: "Ramesh Singh", hours: 8, fuel: 45, condition: "Good", rental: 4500, maintenance: "2025-04-20" },
  { id: 2, name: "Concrete Mixer", eqId: "EQ-002", operator: "Suresh Kumar", hours: 10, fuel: 20, condition: "Good", rental: 1200, maintenance: "2025-05-01" },
  { id: 3, name: "Tower Crane", eqId: "EQ-003", operator: "Anil Verma", hours: 6, fuel: 60, condition: "Repair", rental: 8000, maintenance: "2025-03-28" },
  { id: 4, name: "Compactor", eqId: "EQ-004", operator: "Deepak Rao", hours: 5, fuel: 30, condition: "Good", rental: 2000, maintenance: "2025-05-15" },
  { id: 5, name: "Transit Mixer", eqId: "EQ-005", operator: "Vikas Tiwari", hours: 9, fuel: 55, condition: "Good", rental: 3500, maintenance: "2025-04-10" },
];

const MachineryPage = () => {
  const [showLog, setShowLog] = useState(false);

  const totalHours = equipment.reduce((s, e) => s + e.hours, 0);
  const totalFuel = equipment.reduce((s, e) => s + e.fuel, 0);
  const totalRental = equipment.reduce((s, e) => s + e.rental, 0);
  const repairCount = equipment.filter(e => e.condition === "Repair").length;

  return (
    <DashboardLayout>
      <Navbar title="Machinery & Equipment" breadcrumb={["InfraPilot", "Engineer", "Machinery"]}
        action={{ label: "+ Log Usage", onClick: () => setShowLog(true) }} />

      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Equipment", value: equipment.length, icon: "🏗️", color: "bg-blue-50 text-blue-600" },
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

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Rental Cost</p>
            <p className="text-2xl font-black text-primary">₹{totalRental.toLocaleString("en-IN")}</p>
          </div>
          <div className="text-4xl">💰</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equipment Log</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {equipment.map(eq => (
              <div key={eq.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{eq.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">ID: {eq.eqId} · Operator: {eq.operator}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${eq.condition === "Good" ? "bg-green-50 text-success" : "bg-red-50 text-danger"}`}>
                    {eq.condition === "Good" ? "✅ Good" : "🔧 Repair"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Hours", val: `${eq.hours}h` },
                    { label: "Fuel (L)", val: eq.fuel },
                    { label: "Rental", val: `₹${eq.rental.toLocaleString()}` },
                    { label: "Maint.", val: eq.maintenance },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
                      <p className="text-xs font-bold text-slate-700">{s.val}</p>
                      <p className="text-[9px] text-slate-400 uppercase">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Log Equipment Usage</h3>
              <button onClick={() => setShowLog(false)} className="text-slate-400 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Equipment Name", placeholder: "e.g. JCB Excavator" },
                { label: "Equipment ID", placeholder: "e.g. EQ-001" },
                { label: "Operator Name", placeholder: "Operator full name" },
                { label: "Working Hours", placeholder: "e.g. 8" },
                { label: "Fuel Used (Litres)", placeholder: "e.g. 45" },
                { label: "Rental Cost (₹)", placeholder: "e.g. 4500" },
              ].map((f, i) => (
                <div key={i}>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">{f.label}</label>
                  <input type="text" placeholder={f.placeholder} className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm text-slate-700" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Condition</label>
                <div className="flex gap-3">
                  {["Good", "Repair"].map(opt => (
                    <button key={opt} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${opt === "Good" ? "bg-green-50 text-success border-green-200" : "bg-red-50 text-danger border-red-200"}`}>
                      {opt === "Good" ? "✅ Good" : "🔧 Needs Repair"}
                    </button>
                  ))}
                </div>
              </div>
              <button className="w-full py-4 bg-primary text-white rounded-2xl text-base font-bold shadow-xl shadow-primary/30"
                onClick={() => setShowLog(false)}>Save Log</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default MachineryPage;
