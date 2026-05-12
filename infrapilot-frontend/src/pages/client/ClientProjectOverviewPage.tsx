import Navbar from "../../components/common/Navbar";

const milestones = [
  { name: "Site Preparation & Excavation", status: "done", date: "Jan 2025" },
  { name: "Foundation & Basement", status: "done", date: "Apr 2025" },
  { name: "Structural Framework (G+4)", status: "done", date: "Sep 2025" },
  { name: "Roof Slab Casting & Waterproofing", status: "active", date: "Mar 2026" },
  { name: "Finishing & MEP Works", status: "upcoming", date: "Jun 2026" },
  { name: "Final Inspection & Handover", status: "upcoming", date: "Oct 2026" },
];

const team = [
  { name: "Rajesh Mehta", role: "Project Manager", avatar: "R", color: "bg-blue-500" },
  { name: "Anjali Desai", role: "Site Engineer", avatar: "A", color: "bg-emerald-500" },
  { name: "Vikram Build Co.", role: "Main Contractor", avatar: "V", color: "bg-purple-500" },
  { name: "Priya Sharma", role: "Architect", avatar: "P", color: "bg-amber-500" },
];

const ClientProjectOverviewPage = () => (
  <>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Project Overview"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Overview</h1>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Skyline Tower Project — Detailed Specification</p>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-base font-black text-slate-800 uppercase tracking-widest text-[11px] mb-8">Core Project Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            {[
              { label: "Project Name", value: "Skyline Tower - Phase 3 Extension", icon: "🏢" },
              { label: "Location", value: "Worli, Mumbai South Central", icon: "📍" },
              { label: "Project Type", value: "Residential High-Rise (A+ Category)", icon: "🏗️" },
              { label: "Total Budget", value: "₹22,20,00,000.00 (Incl. GST)", icon: "💰" },
              { label: "Start Date", value: "15 Oct 2025", icon: "📅" },
              { label: "End Date (EST)", value: "30 Sept 2026", icon: "🏁" },
              { label: "Project Status", value: "On Track", icon: "🟢", status: "On Track" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-lg shadow-sm shrink-0">{item.icon}</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className={`text-sm font-bold ${item.status === "On Track" ? "text-emerald-600" : "text-slate-800"}`}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Stakeholders */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-base font-black text-slate-800 uppercase tracking-widest text-[11px] mb-8">Management & Execution</h2>
          <div className="space-y-6">
            {[
              { label: "Project Manager", value: "Rajesh Kumar", role: "PMP Certified", avatar: "RK", color: "bg-blue-600" },
              { label: "Site Engineer", value: "Amit Sharma", role: "M.Tech Structural", avatar: "AS", color: "bg-emerald-600" },
              { label: "Contractor Name", value: "Precision Buildcon Pvt Ltd", role: "Lead Contractor", avatar: "PB", color: "bg-purple-600" },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl ${p.color} flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg shadow-blue-500/10`}>{p.avatar}</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{p.label}</p>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{p.value}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{p.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Milestones */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-base font-black text-slate-800 uppercase tracking-widest text-[11px] mb-8">Project Milestones</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
            <div className="space-y-6">
              {milestones.map((m, i) => (
                <div key={i} className="relative pl-12 flex items-start gap-4">
                  <div className={`absolute left-0 w-9 h-9 rounded-full flex items-center justify-center border-2 z-10 ${
                    m.status === "done" ? "bg-emerald-500 border-emerald-500 text-white" :
                    m.status === "active" ? "bg-blue-600 border-blue-600 text-white animate-pulse" :
                    "bg-white border-slate-200 text-slate-300"
                  }`}>
                    {m.status === "done" ? "✓" : m.status === "active" ? "●" : "○"}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className={`text-sm font-bold ${m.status === "upcoming" ? "text-slate-400" : "text-slate-700"}`}>{m.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{m.date}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                    m.status === "done" ? "bg-emerald-50 text-emerald-600" :
                    m.status === "active" ? "bg-blue-50 text-blue-600" :
                    "bg-slate-50 text-slate-400"
                  }`}>
                    {m.status === "done" ? "Completed" : m.status === "active" ? "In Progress" : "Upcoming"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6">Project Team</h2>
            <div className="space-y-4">
              {team.map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl ${t.color} flex items-center justify-center text-white font-black text-sm shrink-0`}>{t.avatar}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{t.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6">Key Dates</h2>
            <div className="space-y-4">
              {[
                { label: "Project Start", value: "12 Jan 2025" },
                { label: "Expected Handover", value: "12 Oct 2026" },
                { label: "Contract Value", value: "₹8.2 Crore" },
                { label: "Paid to Date", value: "₹5.3 Crore" },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <p className="text-xs text-slate-500 font-bold">{item.label}</p>
                  <p className="text-xs font-black text-slate-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);

export default ClientProjectOverviewPage;
