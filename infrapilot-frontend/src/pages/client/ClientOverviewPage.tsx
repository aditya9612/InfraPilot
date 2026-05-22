import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { projectService } from "../../services/projectService";

const ClientOverviewPage = () => {
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        // limit = 20, offset = 0, search = "sara", status = "planned"
        const result: any = await projectService.getProjects(20, 0, "sara", "planned");
        
        let fetchedProj = null;
        if (Array.isArray(result)) {
          fetchedProj = result[0];
        } else if (result && result.items && result.items.length > 0) {
          fetchedProj = result.items[0];
        } else if (result && result.data && result.data.length > 0) {
          fetchedProj = result.data[0];
        }
        
        setProjectData(fetchedProj);
      } catch (err) {
        console.error("Failed to fetch project for overview:", err);
        // Fallback for UI if it fails
        setProjectData({
          project_name: "SARA CITY",
          start_date: "2026-04-02",
          end_date: "2026-04-02",
          status: "Planned",
          description: "Wing A Construction"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, []);

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Project Overview"]} />
      <div className="p-8 bg-[#F8FAFC] min-h-screen font-inter pb-16">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{projectData?.project_name || "Project Overview"}</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">{projectData?.description || "Detailed Specification"}</p>
        </div>

        {/* Main Grid: Left (Core Specs) + Right (Management) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          {/* Core Project Specifications */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-8">Core Project Specifications</h2>
            {loading ? (
              <div className="text-slate-400 text-sm font-bold animate-pulse">Loading core details...</div>
            ) : (
              <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                {/* Project Name */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg">🏢</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name</p>
                    <p className="text-sm font-bold text-slate-800">{projectData?.project_name || "—"}</p>
                  </div>
                </div>
                {/* Location */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-lg">📍</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                    <p className="text-sm font-bold text-slate-800">Worli, Mumbai South Central</p>
                  </div>
                </div>
                {/* Project Type */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg">🏗️</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                    <p className="text-sm font-bold text-slate-800">{projectData?.description || "—"}</p>
                  </div>
                </div>
                {/* Total Budget */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg">💰</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Budget</p>
                    <p className="text-sm font-bold text-slate-800">₹22,20,00,000.00 (Incl. GST)</p>
                  </div>
                </div>
                {/* Start Date */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-lg">📅</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</p>
                    <p className="text-sm font-bold text-slate-800">{projectData?.start_date || "—"}</p>
                  </div>
                </div>
                {/* End Date (Est) */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg">📆</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date (Est)</p>
                    <p className="text-sm font-bold text-slate-800">{projectData?.end_date || "—"}</p>
                  </div>
                </div>
                {/* Project Status */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg">🟢</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Status</p>
                    <p className={`text-sm font-bold ${projectData?.status === "Planned" ? "text-emerald-500" : "text-red-500"}`}>{projectData?.status || "—"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Management & Execution */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-8">Management & Execution</h2>
            <div className="space-y-6">
              {/* Project Manager */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black">RK</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Manager</p>
                  <p className="text-sm font-bold text-slate-800">Rajesh Kumar</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">INFRA CERTIFIED</p>
                </div>
              </div>
              {/* Site Engineer */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-black">AS</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Site Engineer</p>
                  <p className="text-sm font-bold text-slate-800">Amit Sharma</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">M.TECH STRUCTURAL</p>
                </div>
              </div>
              {/* Contractor Name */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">PB</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contractor Name</p>
                  <p className="text-sm font-bold text-slate-800">Precision Buildcon Pvt Ltd</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">LEAD CONTRACTOR</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid: Milestones + Team & Key Dates */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Project Milestones */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-8">Project Milestones</h2>
            <div className="space-y-6">
              {[
                { name: "Site Preparation & Excavation", date: "JAN 2025", status: "COMPLETED", color: "bg-emerald-500" },
                { name: "Foundation & Basement", date: "APR 2025", status: "COMPLETED", color: "bg-emerald-500" },
                { name: "Structural Framework (G+4)", date: "SEP 2025", status: "COMPLETED", color: "bg-emerald-500" },
                { name: "Roof Slab Casting & Waterproofing", date: "MAR 2026", status: "IN PROGRESS", color: "bg-blue-500" },
                { name: "Finishing & MEP Works", date: "JUN 2026", status: "UPCOMING", color: "bg-slate-300" },
                { name: "Final Inspection & Handover", date: "OCT 2026", status: "UPCOMING", color: "bg-slate-300" },
              ].map((milestone, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full ${milestone.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {milestone.status === "COMPLETED" ? "✓" : milestone.status === "IN PROGRESS" ? "●" : "○"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{milestone.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{milestone.date}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    milestone.status === "COMPLETED" ? "text-emerald-500" :
                    milestone.status === "IN PROGRESS" ? "text-blue-500" :
                    "text-slate-400"
                  }`}>
                    {milestone.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Team + Key Dates */}
          <div className="space-y-8">

            {/* Project Team */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-8">Project Team</h2>
              <div className="space-y-5">
                {[
                  { initials: "R", name: "Rajesh Mehta", role: "Project Manager", color: "bg-blue-600" },
                  { initials: "A", name: "Anjali Desai", role: "Site Engineer", color: "bg-teal-500" },
                  { initials: "V", name: "Vikram Build Co.", role: "Main Contractor", color: "bg-amber-500" },
                  { initials: "P", name: "Priya Sharma", role: "Architect", color: "bg-purple-500" },
                ].map((member, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full ${member.color} text-white flex items-center justify-center text-xs font-black`}>
                      {member.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{member.name}</p>
                      <p className="text-[10px] text-slate-400">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Dates */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-6">Key Dates</h2>
              <div className="space-y-4">
                {[
                  { label: "Project Start", value: "2026-04-02" },
                  { label: "Expected Handover", value: "2026-04-02" },
                  { label: "Contract Value", value: "₹22.2 Crore" },
                  { label: "Paid to Date", value: "₹15.1 Crore" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm text-slate-500 font-medium">{item.label}</p>
                    <p className="text-sm font-bold text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientOverviewPage;
