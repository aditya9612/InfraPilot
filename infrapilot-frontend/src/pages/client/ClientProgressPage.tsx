import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { projectService } from "../../services/projectService";
import { workProgressService } from "../../services/workProgressService";

const getCategoryProgress = (activities: any[]) => {
  if (activities.length === 0) {
    return [
      { name: "Civil & Structural", progress: 85, color: "bg-blue-500", sub: "Roof slab casting underway" },
      { name: "Plumbing", progress: 60, color: "bg-emerald-500", sub: "3rd floor rough-in complete" },
      { name: "Electrical", progress: 40, color: "bg-amber-500", sub: "Conduit laying in progress" },
      { name: "Finishing Works", progress: 10, color: "bg-purple-500", sub: "Yet to commence" },
      { name: "MEP Integration", progress: 20, color: "bg-rose-500", sub: "Design finalised" },
    ];
  }

  const categories = Array.from(new Set(activities.map(a => a.discipline || "General"))).filter(Boolean);
  const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500", "bg-indigo-500"];

  return categories.map((cat, i) => {
    const catActs = activities.filter(a => (a.discipline || "General") === cat);
    const avgProgress = Math.round(catActs.reduce((sum, a) => sum + (a.completion_percentage || 0), 0) / catActs.length);
    const inProgressCount = catActs.filter(a => a.status === "IN_PROGRESS").length;

    return {
      name: cat,
      progress: avgProgress,
      color: colors[i % colors.length],
      sub: inProgressCount > 0 ? `${inProgressCount} activities in progress` : "Phase oversight active"
    };
  });
};

// Type for Daily Log
interface DailyLogItem {
  id: number;
  date: string;
  task: string;
  crew?: number;
  status: string;
}

const ClientProgressPage = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [logs, setLogs] = useState<DailyLogItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoadingActivities(true);

        // 1. Fetch project to get the correct project_id
        const result: any = await projectService.getProjects(10, 0);
        let activeProject = null;

        if (Array.isArray(result)) {
          activeProject = result[0];
        } else if (result?.items?.length > 0) {
          activeProject = result.items[0];
        } else if (result?.data?.length > 0) {
          activeProject = result.data[0];
        }

        if (!activeProject) {
          throw new Error("No active projects found for this client");
        }

        const projectId = activeProject.project_id || activeProject.id;

        // 2. Fetch activities for that project
        const data = await projectService.getWorkProgressActivities(projectId, undefined as any);
        setActivities(Array.isArray(data) ? data : []);

        // Fetch Logs
        try {
          setLoadingLogs(true);
          const logData = await workProgressService.listProjectDailyEntries(projectId);
          // Map to UI format
          const mappedLogs = logData.map((l: any) => ({
            id: l.id,
            date: new Date(l.entry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            task: l.remarks || "Work updated",
            crew: l.crew_count || 0,
            status: "done"
          }));
          setLogs(mappedLogs);
        } catch (err) {
          console.error("Failed to fetch logs:", err);
        } finally {
          setLoadingLogs(false);
        }
      } catch (err) {
        console.error("Failed to fetch work progress activities:", err);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchProgressData();
  }, []);

  // Compute overall progress from activities
  const overallProgress = activities.length > 0
    ? Math.round(activities.reduce((sum, a) => sum + (a.completion_percentage || 0), 0) / activities.length)
    : 68;

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Work Progress"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Work Progress</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Real-time construction progress tracking</p>
        </div>

        {/* Overall */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8 flex items-center gap-10">
          <div className="relative w-36 h-36 shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle cx="72" cy="72" r="60" stroke="#f1f5f9" strokeWidth="10" fill="none" />
              <circle cx="72" cy="72" r="60" stroke="#2563eb" strokeWidth="10" fill="none"
                strokeDasharray={376.99} strokeDashoffset={376.99 * (1 - overallProgress / 100)} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-800">{overallProgress}%</span>
              <span className="text-[9px] font-bold text-slate-400 tracking-widest">OVERALL</span>
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-slate-800">
              {activities.length > 0 ? "Project Status Overview" : "Phase 3 — Superstructure"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {activities.length > 0
                ? `${activities.filter(a => a.status === 'COMPLETED').length} of ${activities.length} activities completed.`
                : "Roof slab casting and waterproofing in progress. On schedule."}
            </p>
            <div className="flex gap-3 mt-4">
              <span className={`px-3 py-1.5 ${overallProgress >= 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} text-[10px] font-black rounded-full uppercase tracking-widest`}>
                {overallProgress >= 50 ? 'On Track' : 'In Progress'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Progress Bars */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-8">Work Category Progress</h2>
            <div className="space-y-6">
              {getCategoryProgress(activities).map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-bold text-slate-700">{p.name}</p>
                    <p className="text-sm font-black text-slate-800">{p.progress}%</p>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${p.color} rounded-full transition-all duration-700`} style={{ width: `${p.progress}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">{p.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Log */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-8">Recent Daily Log</h2>
            <div className="space-y-4">
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : logs.length > 0 ? logs.map((log, i) => (
                <div
                  key={log.id || i}
                  className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl group cursor-pointer"
                  onClick={() => {
                    import("jspdf").then(({ default: jsPDF }) => {
                      const doc = new jsPDF();
                      doc.setFontSize(16);
                      doc.text("Daily Log Report", 14, 22);
                      doc.setFontSize(11);
                      doc.setTextColor(100);
                      doc.text(`Date: ${log.date}`, 14, 30);
                      doc.setTextColor(0);

                      // Add content
                      doc.text(`Task: ${log.task}`, 14, 42);
                      doc.text(`Crew Size: ${log.crew} workers`, 14, 50);
                      doc.text(`Status: ${log.status.toUpperCase()}`, 14, 58);

                      doc.save(`Daily_Log_${log.date.replace(/ /g, '_')}.pdf`);
                    });
                  }}
                >
                  <span className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs shrink-0 self-start">✓</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 leading-snug">{log.task}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{log.date} · {log.crew} workers</p>
                  </div>
                  <button
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shrink-0 shadow-sm"
                    title="Download Log Report PDF"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              )) : (
                <p className="text-center py-8 text-slate-400 text-sm italic">No recent updates logged.</p>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Activity Progress — now from API */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Detailed Activity Progress</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 pl-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity Name</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Planned / Completed</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">% Completion</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                  <th className="p-4 pr-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loadingActivities ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-sm">
                      <div className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Loading activities...
                      </div>
                    </td>
                  </tr>
                ) : activities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-sm">No activities found.</td>
                  </tr>
                ) : (
                  activities.map((act, i) => {
                    const statusColor =
                      act.status === "COMPLETED" || act.status === "Completed" ? "bg-emerald-500" :
                        act.status === "IN_PROGRESS" || act.status === "In Progress" ? "bg-blue-500" :
                          act.status === "DELAYED" || act.status === "Delayed" ? "bg-red-500" :
                            "bg-slate-300";
                    const statusBg =
                      act.status === "DELAYED" || act.status === "Delayed" ? "bg-red-50 text-red-600" :
                        act.status === "IN_PROGRESS" || act.status === "In Progress" ? "bg-blue-50 text-blue-600" :
                          act.status === "COMPLETED" || act.status === "Completed" ? "bg-emerald-50 text-emerald-600" :
                            "bg-slate-50 text-slate-500";
                    const barColor =
                      act.status === "COMPLETED" || act.status === "Completed" ? "bg-emerald-500" :
                        act.status === "IN_PROGRESS" || act.status === "In Progress" ? "bg-blue-500" :
                          act.status === "DELAYED" || act.status === "Delayed" ? "bg-amber-500" :
                            "bg-slate-300";

                    return (
                      <tr key={act.id || i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 pl-8">
                          <p className="text-sm font-bold text-slate-700">{act.activity_name}</p>
                          {act.discipline && <p className="text-[10px] text-slate-400 mt-0.5">{act.discipline}</p>}
                        </td>
                        <td className="p-4">
                          <p className="text-xs font-bold text-slate-600">
                            {act.total_completed} <span className="text-slate-300">/</span> {act.planned_quantity}
                          </p>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-500">{act.remaining_quantity}</td>
                        <td className="p-4 w-48">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${act.completion_percentage}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-slate-700 w-8">{act.completion_percentage}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-500">{act.unit || "—"}</td>
                        <td className="p-4">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{act.start_date} – {act.end_date}</p>
                        </td>
                        <td className="p-4 pr-8">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${statusBg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`}></span>
                            {act.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientProgressPage;
