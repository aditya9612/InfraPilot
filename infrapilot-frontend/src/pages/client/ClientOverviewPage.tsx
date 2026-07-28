import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { projectService } from "../../services/projectService";
import { useClientProjectId } from "../../hooks/useClientProjectId";

const ClientOverviewPage = () => {
  const [projectData, setProjectData] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [team, setTeam] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  const { projectId } = useClientProjectId();

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectData = async () => {
      try {
        setLoading(true);
        setLoadingMilestones(true);
        setLoadingTeam(true);

        const fetchedProj = await projectService.getProjectById(projectId);
        setProjectData(fetchedProj);

        // Fetch milestones
        const milestonesResult: any = await projectService.getMilestones(projectId);
        const milestoneItems = milestonesResult.items || milestonesResult.data || (Array.isArray(milestonesResult) ? milestonesResult : []);
        setMilestones(milestoneItems);

        // Fetch team members
        const teamResult: any = await projectService.getProjectMembers(projectId);
        const teamItems = teamResult.items || teamResult.data || (Array.isArray(teamResult) ? teamResult : []);
        setTeam(teamItems);

      } catch (err) {
        console.error("Failed to fetch project, milestones or team for overview:", err);
        // Fallback for UI if it fails
        if (!projectData) {
          setProjectData({
            project_name: "Project Details Unvailable",
            start_date: "—",
            end_date: "—",
            status: "Unknown",
            description: "Please check your internet connection or project assignment."
          });
        }
      } finally {
        setLoading(false);
        setLoadingMilestones(false);
        setLoadingTeam(false);
      }
    };
    fetchProjectData();
  }, [projectId]);

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getRoleColor = (role: string) => {
    const r = role?.toLowerCase();
    if (r?.includes('admin')) return "bg-indigo-600";
    if (r?.includes('manager')) return "bg-blue-600";
    if (r?.includes('engineer')) return "bg-teal-500";
    if (r?.includes('contractor')) return "bg-amber-500";
    if (r?.includes('architect')) return "bg-purple-500";
    return "bg-slate-500";
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "completed" || s === "done") return "bg-emerald-500";
    if (s === "in progress" || s === "active") return "bg-blue-500";
    if (s === "delayed") return "bg-red-500";
    return "bg-slate-300";
  };

  const getStatusText = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "completed") return "COMPLETED";
    if (s === "in progress") return "IN PROGRESS";
    if (s === "delayed") return "DELAYED";
    if (s === "upcoming" || !s) return "UPCOMING";
    return status.toUpperCase();
  };

  return (
    <>
      <Navbar title="Project Overview" breadcrumb={["InfraPilot", "Client", "Project Overview"]} />
      <div className="p-8 bg-[#F8FAFC] min-h-screen font-inter pb-16">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Project Overview</h1>

        </div>

        {/* Main Grid: Core Specs (2 cols) + Project Team (1 col) */}
        <div className="flex flex-col gap-8 mb-8">
          {/* Core Project Specifications - Expanded Layout */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-10 border-b border-slate-50 pb-4">Core Project Specifications</h2>

            {loading ? (
              <div className="flex items-center justify-center p-20">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                {/* Project Name */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg shrink-0">🏢</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Project Name</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{(projectData?.project_name || "NEW SARA CITY").toUpperCase()}</p>

                  </div>
                </div>

                {/* Project Status */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg shrink-0">🟢</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Project Status</p>
                    <p className="text-sm font-bold text-slate-800">
                      {projectData?.status || "Ongoing"}
                    </p>
                  </div>
                </div>

                {/* Project Type */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg shrink-0">🏗️</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Project Type</p>
                    <p className="text-sm font-bold text-slate-800">
                      {projectData?.type || "RESIDENTIAL"}
                    </p>
                  </div>
                </div>

                {/* Project Duration */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-lg shrink-0">📅</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                    <p className="text-sm font-bold text-slate-800">
                      {projectData?.start_date || "—"}
                      <span className="mx-2 text-slate-300">→</span>
                      <span className="text-blue-600">{projectData?.end_date || "—"}</span>
                    </p>
                  </div>
                </div>



                {/* Site Address */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-lg shrink-0">📍</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Site Address</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight">
                      {projectData?.site_address || "Pune Station"}
                    </p>
                  </div>
                </div>

                {/* Location Details */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg shrink-0">🏘️</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location Details</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight">
                      {[projectData?.city, projectData?.state, projectData?.country, projectData?.pincode].filter(Boolean).join(", ") || "Pune, Maharashtra, India, 444236"}

                    </p>
                  </div>
                </div>

                {/* Project Description */}
                <div className="flex items-start gap-4 lg:col-span-3 border-t border-slate-50 pt-8 mt-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg shrink-0">🏗️</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Project Description</p>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-4xl">
                      {(projectData?.description === "Project start" ? "NEW SARA CITY" : projectData?.description) || "NEW SARA CITY"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Project Team - Shifted Downside */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
              <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Primary Project Team</h2>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-widest">
                {team.length} Active Members
              </span>
            </div>

            {loadingTeam ? (
              <div className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-100" />
                <div className="h-4 w-32 bg-slate-100 rounded" />
              </div>
            ) : team.length === 0 ? (
              <div className="text-slate-400 text-xs font-bold py-4 tracking-widest uppercase">No specialized members assigned yet.</div>
            ) : (
              <div className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {team.map((member, i) => (
                    <div key={member.user_id || i} className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                      <div className={`w-12 h-12 rounded-2xl ${getRoleColor(member.role)} text-white flex items-center justify-center text-sm font-black shadow-lg shadow-slate-100 group-hover:scale-110 transition-transform`}>
                        {getInitials(member.full_name)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 tracking-tight">{member.full_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full Width Milestones */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-8">Project Milestones</h2>
          {loadingMilestones ? (
            <div className="text-slate-400 text-sm font-bold animate-pulse">Loading milestones...</div>
          ) : milestones.length === 0 ? (
            <div className="text-slate-400 text-sm font-bold">No milestones recorded for this project.</div>
          ) : (
            <div className="max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {milestones.map((milestone, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full ${getStatusColor(milestone.status)} flex items-center justify-center text-white text-xs font-bold`}>
                        {milestone.status?.toLowerCase() === "completed" ? "✓" : milestone.status?.toLowerCase() === "in progress" ? "●" : "○"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{milestone.title || milestone.name}</p>
                        {milestone.description && (
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5 max-w-sm">{milestone.description}</p>
                        )}
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                          {milestone.start_date} to {milestone.end_date}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${milestone.status?.toLowerCase() === "completed" ? "text-emerald-500" :
                      milestone.status?.toLowerCase() === "in progress" ? "text-blue-500" :
                        milestone.status?.toLowerCase() === "delayed" ? "text-red-500" :
                          "text-slate-400"
                      }`}>
                      {getStatusText(milestone.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientOverviewPage;
