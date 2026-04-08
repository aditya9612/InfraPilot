import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

const issues = [
  { id: 1, title: "Cement delivery delayed", category: "Material", description: "Cement supplier not delivering on schedule. 150 bags pending.", reported: "2025-04-01", priority: "High", assignedTo: "Priya Nair (PM)", status: "Open", resolution: "" },
  { id: 2, title: "Design mismatch in Column C3", category: "Design", description: "Structural drawing and architectural drawing dimensions don't match.", reported: "2025-03-30", priority: "High", assignedTo: "Structural Consultant", status: "Open", resolution: "" },
  { id: 3, title: "Unskilled labour shortage", category: "Labor", description: "Only 12 helpers available against planned 25.", reported: "2025-03-28", priority: "Medium", assignedTo: "Sharma Contractors", status: "Closed", resolution: "Additional 10 workers arranged from alternate source." },
  { id: 4, title: "JCB breakdown at site", category: "Machinery", description: "JCB EQ-001 hydraulic failure. Repair estimated 2 days.", reported: "2025-04-03", priority: "Medium", assignedTo: "Equipment Manager", status: "Open", resolution: "" },
  { id: 5, title: "Rain delay – Foundation casting", category: "Weather", description: "Continuous rain for 2 days halted outdoor work at Block A.", reported: "2025-03-25", priority: "Low", assignedTo: "—", status: "Closed", resolution: "Work resumed after weather cleared." },
];

const CATEGORIES = ["All", "Material", "Labor", "Design", "Machinery", "Weather"];
const PRIORITIES = { High: "bg-red-50 text-danger border-red-100", Medium: "bg-orange-50 text-warning border-orange-100", Low: "bg-slate-50 text-slate-500 border-slate-100" };

const IssueTrackerPage = () => {
  const [filter, setFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Open" | "Closed">("All");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = issues.filter(i =>
    (filter === "All" || i.category === filter) &&
    (statusFilter === "All" || i.status === statusFilter)
  );

  return (
    <DashboardLayout>
      <Navbar title="Issue / Delay Tracker" breadcrumb={["InfraPilot", "Engineer", "Issues"]}
        action={{ label: "+ Report Issue", onClick: () => setShowAdd(true) }} />

      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Issues", value: issues.length, icon: "📋", color: "bg-blue-50 text-blue-600" },
            { label: "Open", value: issues.filter(i => i.status === "Open").length, icon: "🔥", color: "bg-red-50 text-red-600" },
            { label: "Closed", value: issues.filter(i => i.status === "Closed").length, icon: "✅", color: "bg-green-50 text-green-600" },
            { label: "High Priority", value: issues.filter(i => i.priority === "High").length, icon: "⚠️", color: "bg-orange-50 text-orange-600" },
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

        {/* Status Filter */}
        <div className="flex gap-2 mb-4">
          {(["All", "Open", "Closed"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${statusFilter === s ? "bg-primary text-white shadow-primary/30 shadow-lg" : "bg-white text-slate-400 border border-slate-100"}`}>
              {s === "Open" ? "🔥" : s === "Closed" ? "✅" : "📋"} {s}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${filter === cat ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-100"}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map(issue => (
            <div key={issue.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{issue.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">{issue.category}</span>
                    <span className="text-[10px] text-slate-400">Reported: {issue.reported}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${PRIORITIES[issue.priority as keyof typeof PRIORITIES]}`}>{issue.priority}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${issue.status === "Open" ? "bg-red-50 text-danger" : "bg-green-50 text-success"}`}>{issue.status}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 mb-3 leading-relaxed">{issue.description}</p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <p className="text-[10px] text-slate-400">Assigned: <span className="font-bold text-slate-600">{issue.assignedTo}</span></p>
                {issue.resolution && (
                  <div className="bg-green-50 text-success text-[10px] font-semibold px-3 py-1 rounded-lg max-w-[60%] text-right">
                    ✅ {issue.resolution}
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center text-slate-400">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-sm font-bold">No issues found for this filter</p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Report Issue / Delay</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Issue Title", placeholder: "Brief title" },
                { label: "Description", placeholder: "Detailed description..." },
                { label: "Assigned To", placeholder: "Person / team responsible" },
                { label: "Resolution Notes", placeholder: "If resolved, describe..." },
              ].map((f, i) => (
                <div key={i}>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">{f.label}</label>
                  <input type="text" placeholder={f.placeholder} className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm text-slate-700" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Category</label>
                <select className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm text-slate-700">
                  {["Material", "Labor", "Design", "Machinery", "Weather", "Other"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Priority</label>
                <div className="flex gap-3">
                  {["Low", "Medium", "High"].map(p => (
                    <button key={p} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${p === "High" ? "bg-red-50 text-danger border-red-200" : p === "Medium" ? "bg-orange-50 text-warning border-orange-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <button className="w-full py-4 bg-primary text-white rounded-2xl text-base font-bold shadow-xl shadow-primary/30"
                onClick={() => setShowAdd(false)}>Submit Issue</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default IssueTrackerPage;
