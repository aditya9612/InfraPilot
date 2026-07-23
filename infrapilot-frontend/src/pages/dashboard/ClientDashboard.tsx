import Navbar from "../../components/common/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/common/Modal";
import { type ClientDashboardData, dashboardService } from "../../services/dashboardService";
import { projectService } from "../../services/projectService";
import { workProgressService } from "../../services/workProgressService";
import toast from "react-hot-toast";
import { useClientProjectId } from "../../hooks/useClientProjectId";


const ClientDashboard = () => {
  const navigate = useNavigate();
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [liveFeed, setLiveFeed] = useState<any[]>([]);
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [calculatedOverallProgress, setCalculatedOverallProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const { projectId } = useClientProjectId();

  useEffect(() => {
    if (!projectId) return;

    let active = true;

    const fetchDashboardContent = async () => {
      let activeProject: any = null;
      try {
        setLoading(true);

        // 1. Fetch project data (wrap in try/catch to prevent blocking dashboard on failure)
        try {
          activeProject = await projectService.getProjectById(projectId);
          if (active) {
            setProjectData(activeProject);
          }
        } catch (projError) {
          console.warn("Project details fetch failed, continuing with dashboard stats:", projError);
        }

        // 2. Fetch dashboard stats for that project (Simplified API)
        const statsData = await dashboardService.getClientDashboard(projectId);
        if (!active) return;

        setDashboardData(statsData);

        // 3. Populate Live Execution Feed from work-progress/activities API
        try {
          const activities = await workProgressService.listActivities(projectId, undefined, 50);
          if (active && activities.length > 0) {
            const onTrackActivities = activities.filter((act: any) =>
              act.status?.toUpperCase() === 'ON_TRACK' || act.status?.toUpperCase() === 'ON TRACK'
            );

            setActivitiesCount(onTrackActivities.length);

            if (onTrackActivities.length > 0) {
              const avgProgress = Math.round(onTrackActivities.reduce((sum: number, a: any) => sum + (Number(a.completion_percentage) || 0), 0) / onTrackActivities.length);
              setCalculatedOverallProgress(avgProgress);
            } else {
              setCalculatedOverallProgress(0);
            }

            const mappedFeed = onTrackActivities.slice(0, 10).map((act: any) => {
              const timeVal = act.updated_at || act.created_at || new Date().toISOString();
              const dateObj = new Date(timeVal);
              return {
                id: act.id,
                text: `${act.activity_name} - ${act.completion_percentage}%`,
                time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                icon: act.status?.toUpperCase() === 'COMPLETED' ? "✔" : "🏗️"
              };
            });
            setLiveFeed(mappedFeed);
          }
        } catch (e) {
          console.warn("Activities fetch failed for dashboard feed:", e);
        }

      } catch (error: any) {
        if (!active) return;
        console.error("Dashboard Fetch Error:", error);
        toast.error(error.message || "Failed to load dashboard data");
        // Fallback matching the new dashboard schema
        setDashboardData({
          project_id: Number(projectId),
          status: "PLANNED",
          progress_percent: 0,
          budget_total: 12000,
          total_expense: 0,
          budget_used_percent: 0,
          remaining_budget: 12000,
          milestones_total: 0,
          milestones_completed: 0,
          tasks_total: 0,
          tasks_completed: 0,
          start_date: "2026-06-01",
          end_date: "2027-12-31",
          days_remaining: 561
        });
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDashboardContent();
    return () => { active = false; };
  }, [projectId]);

  const botMessages = [
    { role: "assistant", text: "Hello! I am your InfraPilot AI assistant. How can I help you today?", time: "Just now" },
    { role: "user", text: "What is the current status of Phase 3?", time: "Just now" },
    { role: "assistant", text: "Phase 3 (Roof Slab & MEP Hookups) is currently 42% complete. Rebar arrangement is the current focus today.", time: "Just now" },
  ];

  const formatDate = (d: string | undefined) => {
    if (!d) return "N/A";
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <>
        <Navbar title="Dashboard" breadcrumb={["InfraPilot", "Client", "Dashboard"]} />
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!dashboardData) {
    return (
      <>
        <Navbar title="Dashboard" breadcrumb={["InfraPilot", "Client", "Dashboard"]} />
        <div className="p-6 bg-slate-50 min-h-screen font-inter">
          <p className="text-slate-500">Failed to load dashboard data.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Dashboard" breadcrumb={["InfraPilot", "Client", "Dashboard"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">{(projectData?.project_name || projectData?.name || "PROPOSAL STAGE").toUpperCase()}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl px-6 py-3 shadow-sm flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm font-black text-slate-700">Project Status: {dashboardData ? (dashboardData.status || "PLANNED").charAt(0) + (dashboardData.status || "PLANNED").slice(1).toLowerCase() : "Loading..."}</p>
            </div>
          </div>
        </div>
        {/* Vital Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Overall Progress", value: dashboardData ? `${Number(dashboardData.progress_percent ?? 0).toFixed(2)}%` : "—", sub: "Progress Percent" },
            { label: "Total Budget", value: dashboardData ? `₹${(dashboardData.budget_total ?? 0).toLocaleString("en-IN")}` : "—", sub: "Project Budget" },
            { label: "Remaining Budget", value: dashboardData ? `₹${(dashboardData.remaining_budget ?? 0).toLocaleString("en-IN")}` : "—", sub: "Remaining" },
            { label: "Milestones", value: dashboardData ? `${dashboardData.milestones_completed ?? 0} / ${dashboardData.milestones_total ?? 0}` : "—", sub: "Completed / Total" },
            { label: "Tasks", value: dashboardData ? `${dashboardData.tasks_completed ?? 0} / ${dashboardData.tasks_total ?? 0}` : "—", sub: "Completed / Total" },
            { label: "Start Date", value: dashboardData ? formatDate(dashboardData.start_date) : "—", sub: "Project Start" },
            { label: "End Date", value: dashboardData ? formatDate(dashboardData.end_date) : "—", sub: "Project End" },
            { label: "Days Remaining", value: dashboardData ? `${dashboardData.days_remaining ?? 0}` : "—", sub: "Days Remaining" },
          ].map((card: any, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md group flex flex-col justify-between min-h-[140px]">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{card.label}</p>
              <div className="flex-1 flex flex-col justify-center py-2">
                {typeof card.value === "string" ? (
                  <p className="text-lg font-black text-blue-600 tracking-tight leading-snug whitespace-pre-line break-words">{card.value}</p>
                ) : (
                  card.value
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Live Execution Feed - Now on the left side */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-slate-50 pb-4 shrink-0">
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Live Execution Feed</h2>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-wider">{activitiesCount} Updates</span>
              </div>
              <div className="overflow-y-auto p-6 pt-4 custom-scrollbar h-[280px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {liveFeed.length > 0 ? liveFeed.map(update => (
                    <div key={update.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <span className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-lg shadow-sm shrink-0">{update.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-700 leading-tight tracking-tight truncate">{update.text}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-10 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No active feed records found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Project Activities Overview - Now on the right side - Clickable to Progress Page */}
          <div className="lg:col-span-1">
            <div
              onClick={() => navigate('/client/progress')}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full flex flex-col justify-center relative overflow-hidden cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group/card"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/40 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative w-52 h-52 mb-6">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 224 224">
                    <circle cx="112" cy="112" r="100" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                    <circle cx="112" cy="112" r="100" stroke="#2563eb" strokeWidth="12" fill="none"
                      strokeDasharray={628.3}
                      strokeDashoffset={628.3 * (1 - (calculatedOverallProgress || (dashboardData?.progress_percent ?? 0)) / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-blue-600 tracking-tighter">
                      {Math.round(calculatedOverallProgress || (dashboardData?.progress_percent ?? 0))}%
                    </span>
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-2">Overall</span>
                  </div>
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">Project Activities Overview</h2>
                <p className="text-xs text-slate-500 font-medium mb-4">
                  {activitiesCount || 7} tracked activities in phase.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    On Track
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      <Modal
        isOpen={isBotOpen}
        onClose={() => setIsBotOpen(false)}
        title="InfraPilot AI Assistant"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
            {botMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-slate-800 rounded-bl-none border border-slate-100 shadow-sm"}`}>
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  <p className={`text-[9px] mt-1 font-black uppercase tracking-widest ${msg.role === "user" ? "text-blue-200" : "text-slate-400"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200 focus-within:border-primary transition-all">
              <input
                placeholder="Ask anything about your project..."
                className="flex-1 text-sm outline-none bg-transparent placeholder:text-slate-400 font-bold"
                onKeyPress={(e) => e.key === "Enter" && setIsBotOpen(false)}
              />
              <button
                onClick={() => setIsBotOpen(false)}
                className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
            <p className="text-[9px] text-slate-400 text-center mt-4 font-black uppercase tracking-[0.2em]">Powered by InfraPilot AI Core</p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ClientDashboard;
