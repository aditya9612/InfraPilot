import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

interface WorkSummaryItem {
  task_id: number;
  category: string;
  plan_percentage: number;
  actual_percentage: number;
  efficiency: string;
  status: string;
}

interface WorkSummaryData {
  project_id: number;
  total_tasks: number;
  work_summary: WorkSummaryItem[];
}

const efficiencyStyle = (efficiency: string) => {
  switch (efficiency?.toUpperCase()) {
    case "HIGH":   return "bg-emerald-50 text-emerald-600";
    case "MEDIUM": return "bg-amber-50 text-amber-600";
    default:       return "bg-red-50 text-red-600";
  }
};

const statusStyle = (status: string) => {
  switch (status) {
    case "Completed": return "text-emerald-500";
    case "In Progress": return "text-blue-500";
    default: return "text-slate-400";
  }
};

const ClientTaskStatusPage = () => {
  const [data, setData] = useState<WorkSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { projectId } = useClientProjectId();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const result = await reportService.getWorkSummary(projectId);
      setData(result);
    } catch (err) {
      console.error("Failed to fetch work summary:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, projectId]);

  const items: WorkSummaryItem[] = data?.work_summary ?? [];
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper to generate page numbers
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

  return (
    <>
      <Navbar
        title="Work Summary"
        breadcrumb={["InfraPilot", "Client", "Reports", "Work Summary"]}
      />
      <div className="p-6 bg-slate-50 min-h-screen pb-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between mx-auto max-w-[1440px]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/client/reports/summary")}
              className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Work Summary &amp; Efficiency
              </h1>
              <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">
                Real-time plan vs actual activity completion tracking
              </p>
            </div>
          </div>

          {!loading && data && (
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tasks</p>
              <p className="text-3xl font-black text-slate-800 tracking-tighter">{data.total_tasks}</p>
            </div>
          )}
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 mx-auto max-w-[1440px]">
          <div className="px-10 py-6 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Work Category", "Plan %", "Actual %", "Efficiency", "Status"].map((h, i) => (
                    <th
                      key={h}
                      className={`py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest ${i === 0 ? "" : i === 4 ? "text-right pr-4" : "text-center"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <span className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">
                        Loading Work Data...
                      </span>
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
                        No work categories found for this project.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((work) => {
                    const actualVal = Number(work.actual_percentage) || 0;
                    const planVal = Number(work.plan_percentage) || 0;

                    return (
                      <tr key={work.task_id} className="hover:bg-slate-50/50 transition-colors duration-200">
                        <td className="py-7">
                          <p className="text-sm font-black text-slate-800">{work.category}</p>
                        </td>
                        <td className="py-7 text-center">
                          <p className="text-sm font-bold text-slate-500">{planVal}%</p>
                        </td>
                        <td className="py-7 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-sm font-black text-slate-800">{actualVal}%</p>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(actualVal, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-7 text-center">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${efficiencyStyle(work.efficiency)}`}>
                            {work.efficiency}
                          </span>
                        </td>
                        <td className="py-7 text-right pr-4">
                          <span className={`text-xs font-black ${statusStyle(work.status)}`}>
                            {work.status}
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
          {!loading && items.length > 0 && (
            <div className="px-10 py-6 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/10">
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
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all active:scale-90 ${currentPage === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 border-transparent' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
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

export default ClientTaskStatusPage;
