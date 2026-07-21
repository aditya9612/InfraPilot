import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";
import {
  History,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  ChevronDown
} from "lucide-react";
import { materialService, type MaterialLog } from "../../../services/materialService";
import { projectService } from "../../../services/projectService";
import { useProject } from "../../../context/ProjectContext";

const MaterialHistoryPage = () => {
  const formatINR = (amount: number | string | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return "₹0";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"logs" | "transactions">("logs");
  const [logFilter, setLogFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { selectedProject, selectedProjectId } = useProject();
  const projectId = selectedProjectId || 0;
  const [materialsMap, setMaterialsMap] = useState<Record<number, string>>({});
  const [projectsMap, setProjectsMap] = useState<Record<number, string>>({});
  const fallbackProjectName = selectedProject?.project_name || "Current Project";

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const pId = projectId || undefined;
      const [data, materials, projectData, allProjects] = await Promise.all([
        viewMode === "transactions" ? materialService.getProjectTransactions(projectId || 0) : materialService.getLogs({ project_id: pId } as any),
        materialService.listMaterials(projectId || 0),
        projectId ? projectService.getProjectById(projectId).catch(() => null) : Promise.resolve(null),
        projectService.getProjects(100).catch(() => [])
      ]);
      setLogs(data || []);
      const map: Record<number, string> = {};
      materials.forEach(m => {
        map[m.id] = m.material_name;
      });
      setMaterialsMap(map);

      setProjectsMap(prev => {
        const newMap = { ...prev };

        // Populate from allProjects
        const projectsList = Array.isArray(allProjects) ? allProjects : (allProjects?.items || allProjects?.data || []);
        projectsList.forEach((p: any) => {
          const id = p.id || p.project_id;
          const name = p.name || p.project_name;
          if (id && name) newMap[id] = name;
        });

        // Specific project overrides
        if (projectData) {
          const id = projectData.id || projectData.project_id;
          const name = projectData.name || projectData.project_name;
          if (id && name) newMap[id] = name;
        }
        return newMap;
      });
    } catch (error) {
      console.error("Failed to load logs", error);
      toast.error("Failed to sync audit history");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, viewMode]);

  useEffect(() => {
    const userStr = localStorage.getItem("infrapilot_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // projectId is now handled by useProject
        const assignedProjects = user?.assigned_projects || user?.user?.assigned_projects || [];
        const map: Record<number, string> = {};
        assignedProjects.forEach((p: any) => {
          const id = p.id || p.project_id;
          const name = p.name || p.project_name;
          if (id) {
            map[id] = name;
          }
        });

        // Ensure the current project is in the map if we have its name
        if (projectId && fallbackProjectName && !map[Number(projectId)]) {
          map[Number(projectId)] = fallbackProjectName;
        }

        setProjectsMap(map);
      } catch (e) {
        console.error("Failed to parse user projects", e);
      }
    }
  }, [projectId, fallbackProjectName]);

  useEffect(() => {
    if (projectId) fetchData();
  }, [projectId, viewMode, fetchData]);

  const filteredLogs = useMemo(() => {
    let data = [...logs];

    data = data.filter(l => {
      // Operation type filter
      let typeMatch = true;
      if (logFilter !== "All") {
        if (logFilter === "USAGE") {
          typeMatch = l.type === "USAGE" || l.type === "CONSUMPTION";
        } else {
          typeMatch = l.type === logFilter;
        }
      }

      // Date filters
      let dateMatch = true;
      if (startDate || endDate) {
        const logDate = new Date(l.created_at);
        logDate.setHours(0, 0, 0, 0);

        if (startDate) {
          const sDate = new Date(startDate);
          sDate.setHours(0, 0, 0, 0);
          if (logDate < sDate) dateMatch = false;
        }
        if (endDate) {
          const eDate = new Date(endDate);
          eDate.setHours(0, 0, 0, 0);
          if (logDate > eDate) dateMatch = false;
        }
      }

      return typeMatch && dateMatch;
    });

    data.sort((a, b) => {
      if (sortOrder === "latest") {
        return Number(b.id) - Number(a.id);
      } else {
        return Number(a.id) - Number(b.id);
      }
    });

    return data;
  }, [logs, logFilter, startDate, endDate, sortOrder]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [logFilter, startDate, endDate, sortOrder]);

  const logBadge = (type: string) => {
    switch (type) {
      case "PURCHASE": return "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-50";
      case "USAGE":
      case "CONSUMPTION": return "bg-orange-50 text-orange-600 border-orange-100 shadow-orange-50";
      case "TRANSFER_IN": return "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50";
      case "TRANSFER_OUT": return "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50";
      case "ADJUSTMENT":
      case "ISSUE": return "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50";
      default: return "bg-slate-50 text-slate-400 border-slate-100 shadow-slate-50";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      // Ensure it parses correctly, appending Z if backend returns naive UTC string
      const d = new Date(dateString.includes('T') && !dateString.includes('Z') ? `${dateString}Z` : dateString);
      return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Navbar title="Material History" breadcrumb={["Engineer", "Logistics", "Material History"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter flex flex-col pb-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
          <div className="font-inter">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">MATERIAL HUB</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Material History</h1>
            <p className="text-slate-500 text-sm">Comprehensive audit ledger for all material transactions.</p>
          </div>
          <div className="flex items-center gap-3 font-inter">
            <button
              onClick={fetchData}
              className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all border border-slate-100 bg-white/50 shadow-sm active:scale-95"
              title="Sync Ledger"
            >
              <RotateCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Transaction History</h2>
            <div className="flex bg-slate-200/50 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("logs")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "logs" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                All Logs
              </button>
              <button
                onClick={() => setViewMode("transactions")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "transactions" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Project Transactions
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden font-inter flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white font-inter">
            <div className="flex items-center gap-3 font-inter">
              <History className="w-5 h-5 text-slate-400 font-inter" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest font-inter">Historical Audit Ledger</h3>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-inter">
              {/* Date Filters */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-inter shadow-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs font-bold text-slate-600 focus:outline-none bg-transparent uppercase tracking-widest"
                  />
                </div>
                <span className="text-slate-300 font-bold">-</span>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-inter shadow-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs font-bold text-slate-600 focus:outline-none bg-transparent uppercase tracking-widest"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-inter shadow-sm">
                <Filter className="w-4 h-4 text-slate-400 font-inter" />
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="text-[10px] font-bold text-slate-600 focus:outline-none uppercase tracking-[0.2em] cursor-pointer font-inter bg-transparent"
                >
                  <option value="All">ALL OPERATIONS</option>
                  <option value="PURCHASE">PURCHASE</option>
                  <option value="USAGE">USAGE</option>
                  <option value="TRANSFER_IN">TRANSFER_IN</option>
                  <option value="TRANSFER_OUT">TRANSFER_OUT</option>
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                </select>
              </div>

              <div className="relative flex items-center font-inter">
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <Clock className="w-4 h-4" />
                </div>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                  className="appearance-none bg-white border border-primary rounded-full text-sm font-bold text-primary shadow-sm pl-9 pr-8 py-1.5 outline-none cursor-pointer"
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <div className="absolute right-3 text-slate-400 pointer-events-none">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto font-inter scrollbar-thin scrollbar-thumb-slate-200 min-h-[300px]">
            <table className="w-full text-left font-inter min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">type</th>
                  <th className="px-6 py-4 font-inter">project</th>
                  <th className="px-6 py-4 font-inter">material</th>
                  <th className="px-6 py-4 font-inter text-center">quantity</th>
                  <th className="px-6 py-4 font-inter text-right">rate</th>
                  <th className="px-6 py-4 font-inter text-right">avg_rate</th>
                  <th className="px-6 py-4 font-inter text-right">total_amount</th>
                  <th className="px-6 py-4 font-inter text-right">amount_paid</th>
                  <th className="px-6 py-4 font-inter text-right">payment_pending</th>
                  <th className="px-6 py-4 font-inter">project</th>
                  <th className="px-6 py-4 font-inter">issue_type</th>
                  <th className="px-6 py-4 font-inter">created_at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-20 text-center font-inter">
                      <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin font-inter mb-4" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing ledger...</p>
                    </td>
                  </tr>
                ) : paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4 font-inter">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest font-inter border shadow-sm ${logBadge(log.type)}`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800 font-inter">
                        {log.project_id ? (projectsMap[log.project_id] || `Project #${log.project_id}`) : "-"}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800 font-inter">
                        {materialsMap[log.material_id] || `Material #${log.material_id}`}
                      </td>
                      <td className="px-6 py-4 text-center font-inter">
                        <span className={`text-sm font-bold font-inter tabular-nums`}>
                          {log.quantity?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-bold text-slate-500 font-inter tabular-nums">{formatINR(log.rate)}</td>
                      <td className="px-6 py-4 text-right text-xs font-bold text-slate-500 font-inter tabular-nums">{formatINR(log.avg_rate)}</td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-bold text-slate-800 font-inter tabular-nums">{formatINR(log.total_amount)}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-bold text-emerald-600 font-inter tabular-nums">{formatINR(log.amount_paid)}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-bold text-rose-500 font-inter tabular-nums">{formatINR(log.payment_pending)}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-inter whitespace-nowrap">
                        <span className="px-2 py-1 bg-slate-100 rounded-md">
                          {projectsMap[log.project_id] ||
                            (log as any).project_name ||
                            (log.project_id === 1 ? "Aditya Infra" :
                              log.project_id === 92 ? "Aditya Infra" :
                                fallbackProjectName !== "Current Project" ? fallbackProjectName :
                                  `Project #${log.project_id}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-inter">{log.issue_type}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-inter">{formatDate(log.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">No transactions found for the selected criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Logs Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
            {/* Left: Items per page */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Center: Showing info */}
            <div className="text-[11px] font-medium text-slate-500 hidden md:block">
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} records
            </div>

            {/* Right: Pagination */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {(() => {
                const totalItems = filteredLogs.length;
                const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
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
                    return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                  }
                  const pageNum = page as number;
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
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
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredLogs.length / itemsPerPage), prev + 1))}
                disabled={currentPage === Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage)) || filteredLogs.length === 0}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        </div>
      </PageTransition>
    </>
  );
};

export default MaterialHistoryPage;
