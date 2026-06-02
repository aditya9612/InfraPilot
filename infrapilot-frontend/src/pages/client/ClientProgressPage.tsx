import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { projectService } from "../../services/projectService";
import { useClientProjectId } from "../../hooks/useClientProjectId";

const ClientProgressPage = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { projectId } = useClientProjectId();

  useEffect(() => {
    if (!projectId) return;

    const fetchProgressData = async () => {
      try {
        setLoadingActivities(true);
        const response = await projectService.getWorkProgressActivities(projectId);
        const fetchedActivities = Array.isArray(response) ? response : (response.data || response.items || []);
        setActivities(fetchedActivities);
      } catch (err) {
        console.error("Failed to fetch work progress activities:", err);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchProgressData();
  }, [projectId]);

  // Pagination Logic
  const totalItems = activities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedActivities = activities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

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
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8 flex items-center gap-10">
          <div className="relative w-36 h-36 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
              <circle cx="72" cy="72" r="60" stroke="#f1f5f9" strokeWidth="10" fill="none" />
              <circle cx="72" cy="72" r="60" stroke="#2563eb" strokeWidth="10" fill="none"
                strokeDasharray={376.99} strokeDashoffset={376.99 * (1 - overallProgress / 100)} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-blue-600 tracking-tighter">{overallProgress}%</span>
              <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Overall</span>
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-slate-800">
              {activities.length > 0 ? "Project Status Overview" : "Phase 3 — Superstructure"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {activities.length > 0
                ? `${overallProgress}% completed across ${activities.length} tracked activities.`
                : "Roof slab casting and waterproofing in progress. On schedule."}
            </p>
            <div className="flex gap-3 mt-4">
              <span className={`px-3 py-1.5 ${overallProgress >= 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} text-[10px] font-black rounded-full uppercase tracking-widest`}>
                {overallProgress >= 50 ? 'On Track' : 'In Progress'}
              </span>
            </div>
          </div>
        </div>


        {/* Detailed Activity Progress — now from API */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Detailed Activity Progress</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 pl-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity Name</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed / Planned</th>
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
                  paginatedActivities.map((act, i) => {
                    const statusColor =
                      ["COMPLETED", "Completed", "ON TRACK", "ON_TRACK", "On Track"].includes(act.status) ? "bg-green-500" :
                        ["IN_PROGRESS", "In Progress", "IN PROGRESS"].includes(act.status) ? "bg-blue-500" :
                          ["DELAY", "DELAYED", "Delayed", "DELAY_ONGOING"].includes(act.status) ? "bg-red-500" :
                            ["NOT_STARTED", "NOT STARTED", "Not Started"].includes(act.status) ? "bg-amber-500" :
                              "bg-slate-300";
                    const statusBg = "bg-slate-50 text-slate-500";
                    const barColor =
                      ["DELAY", "DELAYED", "Delayed", "DELAY_ONGOING"].includes(act.status) ? "bg-red-500" : "bg-blue-600";

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
                        <td className="p-4 whitespace-nowrap">
                          <p className="text-[10px] font-bold text-slate-500">{act.start_date} to {act.end_date}</p>
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

          {/* Pagination Section */}
          {!loadingActivities && totalItems > 0 && (
            <div className="px-8 py-6 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/30">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Records per page:</p>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                  >
                    {[5, 10, 20, 50].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Showing <span className="text-slate-800 font-black">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-slate-800 font-black">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-slate-800 font-black">{totalItems}</span> records
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                  Prev
                </button>

                <div className="flex items-center gap-1.5 mx-2">
                  {getPageNumbers().map((p, i) => (
                    typeof p === "number" ? (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(p)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all active:scale-90 ${currentPage === p ? 'bg-primary text-white shadow-lg shadow-blue-200 border-transparent' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        {p}
                      </button>
                    ) : (
                      <span key={i} className="text-slate-300 font-black px-1 text-xs">{p}</span>
                    )
                  ))}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                >
                  Next
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientProgressPage;
