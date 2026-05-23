import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { projectService } from "../../services/projectService";
import toast from "react-hot-toast";

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

const ClientProjectOverviewPage = () => {
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const formatDate = (d: string | undefined) => {
    if (!d) return "—";
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        // Fetch projects without strict filters to avoid 422 validation errors if enum mismatch
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
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Project Overview"]} />
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Project Overview"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">{projectData?.project_name || (loading ? "Loading Project..." : "Unknown Project")}</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">{projectData?.description || "Project Specification"}</p>
        </div>

        {/* Project Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-base font-black text-slate-800 uppercase tracking-widest text-[11px] mb-8">Core Project Details</h2>
            {loading ? (
              <div className="text-slate-400 text-sm font-bold animate-pulse">Loading core details...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                {[
                  { label: "Project Name", value: projectData?.project_name || "—", icon: "🏢" },
                  { label: "Location", value: "Sector 45, Pune, MH", icon: "📍" },
                  { label: "Project Type", value: "High-Rise Residential", icon: "🏗️" },
                  { label: "Description", value: projectData?.description || "—", icon: "📝" },
                  { label: "Start Date", value: formatDate(projectData?.start_date), icon: "📅" },
                  { label: "End Date (EST)", value: formatDate(projectData?.end_date), icon: "🏁" },
                  { label: "Project Status", value: projectData?.status || "—", icon: "🟢", status: projectData?.status },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-lg shadow-sm shrink-0">{item.icon}</div>
                    <div>
                      <p className={`text-sm font-bold ${['planned', 'active'].includes(item.status?.toLowerCase()) ? "text-emerald-600" : "text-slate-800"}`}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  { label: "Project Start", value: formatDate(projectData?.start_date) },
                  { label: "Expected Handover", value: formatDate(projectData?.end_date) },
                  { label: "Contract Value", value: "—" },
                  { label: "Paid to Date", value: "—" },
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
};

export default ClientProjectOverviewPage;
