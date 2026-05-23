import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { projectService } from "../../services/projectService";

const ClientOverviewPage = () => {
  const [projectData, setProjectData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [team, setTeam] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        setLoadingMilestones(true);
        setLoadingTeam(true);

        // Fetch projects without strict filters to avoid 422 validation errors
        const projectsResult: any = await projectService.getProjects(20, 0);

        let fetchedProj = null;
        if (Array.isArray(projectsResult)) {
          fetchedProj = projectsResult[0];
        } else if (projectsResult && projectsResult.items && projectsResult.items.length > 0) {
          fetchedProj = projectsResult.items[0];
        } else if (projectsResult && projectsResult.data && projectsResult.data.length > 0) {
          fetchedProj = projectsResult.data[0];
        }

        setProjectData(fetchedProj);

        const projectId = fetchedProj?.id || 96;

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
            project_name: "SARA CITY",
            start_date: "2026-04-02",
            end_date: "2026-04-02",
            status: "Planned",
            description: "Wing A Construction"
          });
        }
      } finally {
        setLoading(false);
        setLoadingMilestones(false);
        setLoadingTeam(false);
      }
    };
    fetchProjectData();
  }, []);

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
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Project Overview"]} />
      <div className="p-8 bg-[#F8FAFC] min-h-screen font-inter pb-16">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{projectData?.project_name || "Project Overview"}</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">{projectData?.description || "Detailed Specification"}</p>
        </div>

        {/* Main Grid: Core Specs (2 cols) + Project Team (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Core Project Specifications */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-full">
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

          {/* Project Team */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-full">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-8">Project Team</h2>
            {loadingTeam ? (
              <div className="text-slate-400 text-sm font-bold animate-pulse">Loading team...</div>
            ) : team.length === 0 ? (
              <div className="text-slate-400 text-sm font-bold">No members assigned.</div>
            ) : (
              <div className="space-y-5">
                {team.map((member, i) => (
                  <div key={member.user_id || i} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full ${getRoleColor(member.role)} text-white flex items-center justify-center text-xs font-black shadow-sm`}>
                      {getInitials(member.full_name)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{member.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Full Width Milestones */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-8">Project Milestones</h2>
          {loadingMilestones ? (
            <div className="text-slate-400 text-sm font-bold animate-pulse">Loading milestones...</div>
          ) : milestones.length === 0 ? (
            <div className="text-slate-400 text-sm font-bold">No milestones recorded for this project.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {milestones.map((milestone, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full ${getStatusColor(milestone.status)} flex items-center justify-center text-white text-xs font-bold`}>
                      {milestone.status?.toLowerCase() === "completed" ? "✓" : milestone.status?.toLowerCase() === "in progress" ? "●" : "○"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{milestone.title}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                        {milestone.start_date} – {milestone.end_date}
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
              ) : milestones.length > 0 ? milestones.map((milestone, i) => {
                const status = (milestone.status || "UPCOMING").toUpperCase();
              const color = status === "COMPLETED" ? "bg-emerald-500" : status === "IN_PROGRESS" || status === "IN PROGRESS" ? "bg-blue-500" : "bg-slate-300";

              // Date formatting
              let dateStr = "TBD";
              if (milestone.date) {
                dateStr = milestone.date;
                } else if (milestone.start_date || milestone.end_date) {
                  const start = milestone.start_date ? new Date(milestone.start_date).toLocaleDateString('en-US', {month: 'short', year: 'numeric' }) : "";
              const end = milestone.end_date ? new Date(milestone.end_date).toLocaleDateString('en-US', {month: 'short', year: 'numeric' }) : "";
              dateStr = start && end ? `${start} - ${end}` : (start || end);
              dateStr = dateStr.toUpperCase();
                }

              return (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}>
                    {status === "COMPLETED" ? "✓" : (status === "IN_PROGRESS" || status === "IN PROGRESS") ? "●" : "○"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{milestone.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{dateStr}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${status === "COMPLETED" ? "text-emerald-500" :
                  (status === "IN_PROGRESS" || status === "IN PROGRESS") ? "text-blue-500" :
                    "text-slate-400"
                  }`}>
                  {status.replace(/_/g, ' ')}
                </span>
              </div>
              );
              }) : (
              <p className="text-center py-8 text-slate-400 text-sm italic">No milestones defined for this project.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientOverviewPage;
