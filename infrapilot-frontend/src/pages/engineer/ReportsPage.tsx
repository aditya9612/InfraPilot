import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";


const reports = [
  { id: 1, name: "Daily Site Report", date: "2025-04-04", type: "Daily", status: "Submitted", size: "1.2 MB" },
  { id: 2, name: "Weekly Progress Report – W14", date: "2025-04-01", type: "Weekly", status: "Submitted", size: "2.4 MB" },
  { id: 3, name: "Labor Report – April", date: "2025-04-01", type: "Labor", status: "Draft", size: "—" },
  { id: 4, name: "Material Consumption – March", date: "2025-03-31", type: "Material", status: "Submitted", size: "800 KB" },
  { id: 5, name: "Issue Report – March", date: "2025-03-31", type: "Issue", status: "Submitted", size: "540 KB" },
  { id: 6, name: "Daily Site Report – 03 Apr", date: "2025-04-03", type: "Daily", status: "Submitted", size: "1.0 MB" },
];

const typeIcon: Record<string, string> = {
  Daily: "📝", Weekly: "📊", Labor: "👷", Material: "📦", Issue: "⚠️"
};

const typeColor: Record<string, string> = {
  Daily: "bg-blue-50 text-blue-600",
  Weekly: "bg-purple-50 text-purple-600",
  Labor: "bg-orange-50 text-orange-600",
  Material: "bg-green-50 text-green-600",
  Issue: "bg-red-50 text-red-600",
};

const ReportsPage = () => {
  const [filter, setFilter] = useState("All");
  const reportTypes = ["All", "Daily", "Weekly", "Labor", "Material", "Issue"];

  const filtered = reports.filter(r => filter === "All" || r.type === filter);

  return (
    <DashboardLayout>
      <Navbar title="Reports" breadcrumb={["InfraPilot", "Engineer", "Reports"]} />

      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        {/* Quick Generate Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Generate Daily Report", icon: "📝", color: "bg-primary", action: "Generate" },
            { label: "Weekly Progress", icon: "📊", color: "bg-purple-600", action: "Generate" },
            { label: "Labor Report", icon: "👷", color: "bg-orange-500", action: "Generate" },
            { label: "Material Report", icon: "📦", color: "bg-success", action: "Generate" },
            { label: "Issue Report", icon: "⚠️", color: "bg-danger", action: "Generate" },
            { label: "Custom Report", icon: "⚙️", color: "bg-slate-600", action: "Configure" },
          ].map((r, i) => (
            <button key={i} className={`${r.color} text-white rounded-2xl p-4 text-left active:scale-95 transition-all shadow-sm`}>
              <span className="text-2xl block mb-3">{r.icon}</span>
              <p className="text-xs font-bold leading-snug">{r.label}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-1">{r.action} →</p>
            </button>
          ))}
        </div>

        {/* Recent Reports */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Reports</h2>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {reportTypes.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${filter === t ? "bg-primary text-white border-primary" : "bg-white text-slate-400 border-slate-100"}`}>
              {t !== "All" ? typeIcon[t] + " " : ""}{t}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filtered.map(r => (
              <div key={r.id} className="p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${typeColor[r.type] || "bg-slate-50 text-slate-500"}`}>
                  {typeIcon[r.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{r.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${typeColor[r.type]}`}>{r.type}</span>
                    <span className="text-[10px] text-slate-400">{r.date}</span>
                    {r.size !== "—" && <span className="text-[10px] text-slate-400">{r.size}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === "Submitted" ? "bg-green-50 text-success" : "bg-orange-50 text-warning"}`}>
                    {r.status}
                  </span>
                  {r.status === "Submitted" ? (
                    <button className="text-[10px] font-bold text-primary hover:underline">↓ Download</button>
                  ) : (
                    <button className="text-[10px] font-bold text-warning hover:underline">✏️ Edit</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default ReportsPage;
