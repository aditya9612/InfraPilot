import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { projectService } from "../../services/projectService";
import { useClientProjectId } from "../../hooks/useClientProjectId";
import toast from "react-hot-toast";

const milestones: any[] = [
  { name: "Site Preparation & Excavation", status: "done", date: "Jan 2025", description: "Initial site clearing and earthwork completed." },
  { name: "Foundation & Basement", status: "done", date: "Apr 2025", description: "Main building foundation and sub-structure casting." },
  { name: "Structural Framework (G+4)", status: "done", date: "Sep 2025", description: "Reinforced concrete framework for all levels." },
  { name: "Roof Slab Casting & Waterproofing", status: "active", date: "Mar 2026", description: "Casting of the final roof slab and applying protective layers." },
  { name: "Finishing & MEP Works", status: "upcoming", date: "Jun 2026", description: "Internal plastering, electrical, and plumbing install." },
  { name: "Final Inspection & Handover", status: "upcoming", date: "Oct 2026", description: "Quality checks and official project completion." },
];

const team = [
  { name: "Rahul Verma", role: "Project Manager", avatar: "RV", color: "bg-blue-600" },
  { name: "Priya Singh", role: "Lead Architect", avatar: "PS", color: "bg-emerald-600" },
  { name: "Amit Kumar", role: "Site Engineer", avatar: "AK", color: "bg-amber-600" }
];

const ClientProjectOverviewPage = () => {
  const [projectData, setProjectData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const { projectId } = useClientProjectId();

  const formatDate = (d: string | undefined) => {
    if (!d) return "—";
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setLoadingProjects(true);

        // Fetch projects to populate the list at the top
        const listResult: any = await projectService.getProjects(20, 0);
        const list = Array.isArray(listResult) ? listResult : (listResult?.items || listResult?.data || []);
        setProjects(list);

        if (projectId) {
          try {
            const selected = await projectService.getProjectById(projectId);
            setProjectData(selected);
          } catch (e) {
            if (list.length > 0) setProjectData(list[0]);
          }
        } else if (list.length > 0) {
          setProjectData(list[0]);
        }

      } catch (err) {
        console.error("Failed to fetch projects for overview:", err);
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [projectId]);

  if (loading) {
    return (
      <>
        <Navbar title="Project Overview" breadcrumb={["InfraPilot", "Client", "Project Overview"]} />
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Project Overview" breadcrumb={["InfraPilot", "Client", "Project Overview"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Overview</h1>

        </div>

        {/* Projects Grid */}
        <div className="mb-12">
          <h2 className="text-base font-black text-slate-800 uppercase tracking-widest text-[11px] mb-6">Your Projects</h2>
          {loadingProjects ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
              <p className="text-slate-500 font-bold mb-2">No projects found</p>
              <p className="text-sm text-slate-400">You don't have any matching projects assigned yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((p, i) => (
                <div
                  key={i}
                  onClick={() => setProjectData(p)}
                  className={`bg-white rounded-2xl p-6 border ${projectData?.id === p.id ? 'border-primary ring-2 ring-primary ring-opacity-20' : 'border-slate-100'} shadow-sm hover:shadow-md transition-all cursor-pointer group`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-lg shadow-sm">🏢</div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${['planned', 'active'].includes(p.status?.toLowerCase()) ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"
                      }`}>
                      {p.status || "Unknown"}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 group-hover:text-primary transition-colors text-lg mb-1 truncate">{p.project_name}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-4 line-clamp-2">{p.description || "No description provided"}</p>

                  <div className="flex flex-col gap-2 pt-4 border-t border-slate-50">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Start Date</span>
                      <span className="text-xs font-bold text-slate-700">{formatDate(p.start_date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Details */}
        {projectData && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-base font-black text-slate-800 uppercase tracking-widest text-[11px] mb-8">Core Project Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                  {[
                    { label: "Project Name", value: (projectData?.project_name || "NEW SARA CITY").toUpperCase(), icon: "🏢" },
                    { label: "Location", value: "Sector 45, Pune, MH", icon: "📍" },
                    { label: "Project Type", value: "High-Rise Residential", icon: "🏗️" },
                    { label: "Description", value: (projectData?.description === "Project start" ? "NEW SARA CITY" : projectData?.description) || "NEW SARA CITY", icon: "📝" },
                    { label: "Start Date", value: formatDate(projectData?.start_date), icon: "📅" },
                    { label: "End Date (EST)", value: formatDate(projectData?.end_date), icon: "🏁" },
                    { label: "Project Status", value: projectData?.status || "—", icon: "🟢", status: projectData?.status },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-lg shadow-sm shrink-0">{item.icon}</div>
                      <div>
                        <p className={`text-sm font-bold ${['planned', 'active'].includes(item.status?.toLowerCase() || '') ? "text-emerald-600" : "text-slate-800"}`}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Milestones */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-base font-black text-slate-800 uppercase tracking-widest text-[11px] mb-8">Project Milestones</h2>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
                  <div className="space-y-6">
                    {milestones.map((m, i) => (
                      <div key={i} className="relative pl-12 flex items-start gap-4">
                        <div className={`absolute left-0 w-9 h-9 rounded-full flex items-center justify-center border-2 z-10 ${m.status === "done" ? "bg-emerald-500 border-emerald-500 text-white" :
                          m.status === "active" ? "bg-blue-600 border-blue-600 text-white animate-pulse" :
                            "bg-white border-slate-200 text-slate-300"
                          }`}>
                          {m.status === "done" ? "✓" : m.status === "active" ? "●" : "○"}
                        </div>
                        <div className="flex-1 pb-2">
                          <p className={`text-sm font-bold ${m.status === "upcoming" ? "text-slate-400" : "text-slate-700"}`}>{m.name || m.title}</p>
                          {m.description && (
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5 max-w-md">{m.description}</p>
                          )}
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{m.date || `${m.start_date} - ${m.end_date}`}</p>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${m.status === "done" ? "bg-emerald-50 text-emerald-600" :
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
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                  <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6">Project Team</h2>
                  <div className="space-y-4">
                    {team.map((t: any, i: number) => (
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

                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
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
          </>
        )}
      </div>
    </>
  );
};

export default ClientProjectOverviewPage;
