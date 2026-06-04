import Navbar from "../../components/common/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/common/Modal";
import { dashboardService, type ClientDashboardData } from "../../services/dashboardService";
import { projectService } from "../../services/projectService";
import toast from "react-hot-toast";
import { useClientProjectId } from "../../hooks/useClientProjectId";


const updates = [
  { id: 1, text: "Slab reinforcement for Phase 3 completed", time: "Today's Work", icon: "🏗️" },
  { id: 2, text: "Main gate structure framing completed", time: "Yesterday", icon: "✔" },
  { id: 3, text: "Electrical wirings for 1st floor delivered", time: "2 days ago", icon: "🚚" },
];

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { projectId } = useClientProjectId();

  useEffect(() => {
    if (!projectId) return;

    let active = true;

    const fetchDashboardContent = async () => {
      try {
        setLoading(true);

        // 1. Fetch project data (The only reliable source)
        const activeProject = await projectService.getProjectById(projectId);
        if (!active) return;
        setProjectData(activeProject);

        // 2. Fetch dashboard stats for that project
        const statsData = await dashboardService.getClientDashboard(projectId);
        if (!active) return;

        // Sync and Sanitize: Use stats but prioritize project details if they disagree
        const getProgress = () => {
          if (activeProject.completion_percentage !== undefined) return activeProject.completion_percentage;
          if (activeProject.progress_percent !== undefined) return activeProject.progress_percent;
          if (activeProject.progress !== undefined) return activeProject.progress;
          return statsData.progress_percent || 0;
        };

        const syncedDashboardData: ClientDashboardData = {
          ...statsData,
          project_id: projectId,
          status: activeProject.status || statsData.status,
          progress_percent: getProgress(),
          start_date: activeProject.start_date || statsData.start_date,
          end_date: activeProject.end_date || statsData.end_date,
          // Calculate remaining budget locally for precision
          remaining_budget: (activeProject.budget_total || statsData.budget_total || 0) - (statsData.total_expense || 0),
        };

        setDashboardData(syncedDashboardData);
      } catch (error: any) {
        if (!active) return;
        console.error("Dashboard Fetch Error:", error);
        toast.error(error.message || "Failed to load dashboard data");
        // Fallback
        setDashboardData({
          project_id: projectId,
          status: "PLANNED",
          progress_percent: 0,
          budget_total: 25000000,
          total_expense: 0,
          budget_used_percent: 0,
          remaining_budget: 25000000,
          milestones_total: 5,
          milestones_completed: 0,
          tasks_total: 10,
          tasks_completed: 0,
          start_date: "2026-04-01",
          end_date: "2026-07-01",
          days_remaining: 0,
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
        <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Dashboard"]} />
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!dashboardData) {
    return (
      <>
        <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Dashboard"]} />
        <div className="p-6 bg-slate-50 min-h-screen font-inter">
          <p className="text-slate-500">Failed to load dashboard data.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Dashboard"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-1">Project Command Center</p>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">{projectData?.project_name || "PROPOSAL STAGE"}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl px-6 py-3 shadow-sm flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm font-black text-slate-700">Project Status: {dashboardData ? dashboardData.status.charAt(0) + dashboardData.status.slice(1).toLowerCase() : "Loading..."}</p>
            </div>
          </div>
        </div>
        {/* Vital Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Overall Progress", value: dashboardData ? `${Number(dashboardData.progress_percent).toFixed(2)}%` : "—", sub: "Progress Percent" },
            { label: "Total Expense", value: dashboardData ? `₹${dashboardData.total_expense.toLocaleString("en-IN")}` : "—", sub: "Total Spent" },
            { label: "Total Budget", value: dashboardData ? `₹${dashboardData.budget_total.toLocaleString("en-IN")}` : "—", sub: "Project Budget", smallText: true },
            { label: "Remaining Budget", value: dashboardData ? `₹${dashboardData.remaining_budget.toLocaleString("en-IN")}` : "—", sub: "Remaining", smallText: true },
            { label: "Milestones", value: dashboardData ? `${dashboardData.milestones_completed} / ${dashboardData.milestones_total}` : "—", sub: "Completed / Total" },
            { label: "Tasks", value: dashboardData ? `${dashboardData.tasks_completed} / ${dashboardData.tasks_total}` : "—", sub: "Completed / Total" },
            { 
              label: "Project Dates", 
              value: dashboardData ? (
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Start</span>
                    <span className="text-[13px] font-black text-blue-600 uppercase tracking-tighter leading-none">{formatDate(dashboardData.start_date)}</span>
                  </div>
                  <div className="text-slate-300 font-bold text-sm">→</div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">End</span>
                    <span className="text-[13px] font-black text-blue-600 uppercase tracking-tighter leading-none">{formatDate(dashboardData.end_date)}</span>
                  </div>
                </div>
              ) : "—", 
              sub: "Project Duration" 
            },
            { label: "Days Remaining", value: dashboardData ? `${dashboardData.days_remaining}` : "—", sub: "Days Remaining" },
          ].map((card: any, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md group flex flex-col justify-between min-h-[140px]">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{card.label}</p>
              <div className="flex-1 flex flex-col justify-center py-2">
                 {typeof card.value === "string" ? (
                   <p className={`${card.smallText ? "text-lg" : "text-2xl"} font-black text-blue-600 tracking-tight leading-snug whitespace-pre-line break-words`}>{card.value}</p>
                 ) : (
                   card.value
                 )}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{card.sub}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-stretch">
          <div className="lg:col-span-2">
            {/* Project Progress Viz */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
                <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 224 224">
                    <circle cx="112" cy="112" r="100" stroke="#e2e8f0" strokeWidth="14" fill="transparent" />
                    <circle cx="112" cy="112" r="100" stroke="#2563EB" strokeWidth="14" fill="transparent"
                      strokeDasharray={628.3}
                      strokeDashoffset={628.3 - (628.3 * (dashboardData?.progress_percent ?? 0)) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black text-blue-600 tracking-tighter leading-none">{dashboardData ? `${Number(dashboardData.progress_percent).toFixed(2)}%` : "0%"}</span>
                    <span className="text-[7px] font-black text-slate-400 tracking-[0.15em] uppercase mt-1">Project Progress</span>
                  </div>
                </div>
                <div className="flex-1 space-y-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Structural Phase III: <br />Roof Slab & MEP Hookups</h2>
                    <p className="text-slate-400 text-sm font-medium mt-2 leading-relaxed">Today's Work focus: Finalizing rebar arrangement for the primary roof slab and ensuring plumbing sleeves are accurately placed.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100" onClick={() => navigate('/last-completed')} style={{ cursor: 'pointer' }}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Last Completed</p>
                      <p className="text-xs font-black text-slate-700 uppercase tracking-tight">4th Floor Column Pour</p>
                    </div>
                    <div className="p-6 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20" onClick={() => navigate('/upcoming-today')} style={{ cursor: 'pointer' }}>
                      <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1 italic">Upcoming Today</p>
                      <p className="text-xs font-black text-white uppercase tracking-tight">Casting Prep Meeting</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          {/* Side Module: Alerts, Updates, and Actions */}
          <div className="lg:col-span-1">
            {/* Timeline Stream */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 h-full">
              <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-50 pb-4">Live Execution Feed</h2>
              <div className="space-y-10 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                {updates.map(update => (
                  <div key={update.id} className="relative pl-12">
                    <span className="absolute left-0 top-0 w-8 h-8 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-sm shadow-md shadow-slate-100 group-hover:scale-110 transition-transform">{update.icon}</span>
                    <p className="text-[13px] font-bold text-slate-800 leading-relaxed tracking-tight">{update.text}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">{update.time}</p>
                  </div>
                ))}
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
