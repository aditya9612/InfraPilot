import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { workProgressService } from "../../services/workProgressService";
import type { ActivityProgress } from "../../services/workProgressService";
import { Loader2 } from "lucide-react";

const phases = [
  { name: "Civil & Structural", progress: 85, color: "bg-blue-500", sub: "Roof slab casting underway" },
  { name: "Plumbing", progress: 60, color: "bg-emerald-500", sub: "3rd floor rough-in complete" },
  { name: "Electrical", progress: 40, color: "bg-amber-500", sub: "Conduit laying in progress" },
  { name: "Finishing Works", progress: 10, color: "bg-purple-500", sub: "Yet to commence" },
  { name: "MEP Integration", progress: 20, color: "bg-rose-500", sub: "Design finalised" },
];

const weeklyLog = [
  { date: "31 Mar 2026", task: "3rd floor column casting completed", crew: 24, status: "done" },
  { date: "30 Mar 2026", task: "Roof slab reinforcement laid", crew: 18, status: "done" },
  { date: "29 Mar 2026", task: "Plumbing rough-in — F3", crew: 12, status: "done" },
  { date: "28 Mar 2026", task: "Electrical conduit laying — F2", crew: 9, status: "done" },
  { date: "27 Mar 2026", task: "Safety audit & compliance check", crew: 6, status: "done" },
];

const ClientProgressPage = () => {
  const [activities, setActivities] = useState<ActivityProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const data = await workProgressService.getWorkProgress(1);
        setActivities(data);
      } catch (error) {
        console.error("Failed to load work progress");
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Work Progress"]} />
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-50">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4 opacity-50" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compiling field execution data...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Work Progress"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Work Progress</h1>
          <p className="text-slate-400 font-semibold mt-1 uppercase tracking-widest text-[10px]">Real-time construction progress tracking</p>
        </div>

        {/* Overall */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8 flex items-center gap-10">
          <div className="relative w-36 h-36 shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle cx="72" cy="72" r="60" stroke="#f1f5f9" strokeWidth="10" fill="none" />
              <circle cx="72" cy="72" r="60" stroke="#2563eb" strokeWidth="10" fill="none"
                strokeDasharray={376.99} strokeDashoffset={376.99 * (1 - 0.68)} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-800">68%</span>
              <span className="text-[9px] font-bold text-slate-400 tracking-widest">OVERALL</span>
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">Phase 3 — Superstructure</p>
            <p className="text-sm text-slate-500 mt-1">Roof slab casting and waterproofing in progress. On schedule.</p>
            <div className="flex gap-3 mt-4">
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-widest">On Track</span>
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-widest">3 Days Ahead</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Progress Bars */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-8">Work Category Progress</h2>
            <div className="space-y-6">
              {phases.map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-bold text-slate-700">{p.name}</p>
                    <p className="text-sm font-bold text-slate-800">{p.progress}%</p>
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
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-8">Recent Daily Log</h2>
            <div className="space-y-4">
              {weeklyLog.map((log, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                  <span className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs shrink-0">✓</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 leading-snug">{log.task}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{log.date} · {log.crew} workers</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Activity Progress */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <h2 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Detailed Activity Progress</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 pl-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activity Name</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planned vs Completed</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">% Completion</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timeline (S/E)</th>
                  <th className="p-4 pr-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 pl-8">
                      <p className="text-sm font-bold text-slate-700">{act.activity_name}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-bold text-slate-600">{act.total_completed} {act.unit} <span className="text-slate-300">/</span> {act.planned_quantity} {act.unit}</p>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-500">{act.remaining_quantity} {act.unit}</td>
                    <td className="p-4 w-48">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full bg-blue-600 rounded-full`} style={{ width: `${act.completion_percentage}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 w-8">{act.completion_percentage}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{act.start_date} – {act.end_date}</p>
                    </td>
                    <td className="p-4 pr-8">
                      <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${act.status === 'DELAYED' ? 'bg-red-500' : act.status === 'NOT_STARTED' ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                         <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{act.status.replace('_', ' ')}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {activities.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No active field activities logged for this period.</p>
                    </td>
                  </tr>
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
