import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { projectService } from "../../services/projectService";



const ClientProgressPage = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await projectService.getWorkProgressActivities(96);
        const fetchedActivities = Array.isArray(response) ? response : (response.data || response.items || []);
        setActivities(fetchedActivities);
      } catch (err) {
        console.error("Failed to fetch work progress activities:", err);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchActivities();
  }, []);

  // Compute overall progress from activities
  const overallProgress = activities.length > 0
    ? Math.round(activities.reduce((sum, a) => sum + (a.completion_percentage || 0), 0) / activities.length)
    : 0;

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
            <p className="text-xl font-black text-slate-800">Phase 3 — Superstructure</p>
            <p className="text-sm text-slate-500 mt-1">Roof slab casting and waterproofing in progress. On schedule.</p>
            <div className="flex gap-3 mt-4">
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest">On Track</span>
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-widest">3 Days Ahead</span>
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
