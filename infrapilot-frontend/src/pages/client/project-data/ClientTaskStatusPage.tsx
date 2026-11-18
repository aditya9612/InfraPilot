import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
                <tr className="bg-slate-100 text-slate-800 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200 font-inter">
                  {["Work Category", "Plan %", "Actual %", "Efficiency", "Status"].map((h, i) => (
                    <th
                      key={h}
                      className={`py-4 px-6 text-[11px] font-extrabold text-slate-800 uppercase tracking-wider font-inter ${i === 0 ? "text-left" : i === 4 ? "text-right pr-6" : "text-center"}`}
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
                        <td className="py-5 px-6">
                          <p className="text-sm font-bold text-slate-800">{work.category}</p>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <p className="text-sm font-semibold text-slate-600">{planVal}%</p>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <p className="text-sm font-bold text-slate-800">{actualVal}%</p>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(actualVal, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${efficiencyStyle(work.efficiency)}`}>
                            {work.efficiency}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-right pr-6">
                          <span className={`text-xs font-bold ${statusStyle(work.status)}`}>
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
          {!loading && totalItems > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 font-inter rounded-b-2xl">
              {/* Left: Items per page */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm cursor-pointer"
                >
                  {[5, 10, 20, 50].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Center: Showing info */}
              <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} records
              </div>

              {/* Right: Pagination buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {(() => {
                  const pages = [];
                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    if (currentPage <= 3) {
                      pages.push(1, 2, 3, 4, '...', totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                    }
                  }

                  return pages.map((page, index) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">
                          ...
                        </span>
                      );
                    }
                    const pageNum = page as number;
                    const isActive = currentPage === pageNum;
                    return (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${
                          isActive
                            ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary'
                            : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  });
                })()}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalItems === 0}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
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
