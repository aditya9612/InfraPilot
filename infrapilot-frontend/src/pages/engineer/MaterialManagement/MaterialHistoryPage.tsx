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
  Calendar
} from "lucide-react";
import { materialService, type MaterialLog } from "../../../services/materialService";

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
  const [logFilter, setLogFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projectId, setProjectId] = useState<number | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const data = await materialService.getLogs({ project_id: projectId });
      setLogs(data || []);
    } catch (error) {
      console.error("Failed to load logs", error);
      toast.error("Failed to sync audit history");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const userStr = localStorage.getItem("infrapilot_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const pId = user?.project_id || user?.user?.project_id;
        if (pId) {
          setProjectId(Number(pId));
        } else {
          setProjectId(92);
        }
      } catch (e) {
        console.error("Failed to resolve project ID", e);
        setProjectId(92);
      }
    }
  }, []);

  useEffect(() => {
    if (projectId) fetchData();
  }, [projectId, fetchData]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
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
  }, [logs, logFilter, startDate, endDate]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [logFilter, startDate, endDate]);

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

  return (
    <>
      <Navbar title="Material History" breadcrumb={["Engineer", "Logistics", "Material History"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter flex flex-col pb-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
          <div className="font-inter">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Material History</h1>
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden font-inter">
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
            </div>
          </div>
          
          <div className="overflow-x-auto font-inter scrollbar-thin scrollbar-thumb-slate-200 min-h-[300px]">
            <table className="w-full text-left font-inter min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">type</th>
                  <th className="px-6 py-4 font-inter text-center">quantity</th>
                  <th className="px-6 py-4 font-inter text-right">rate</th>
                  <th className="px-6 py-4 font-inter text-right">avg_rate</th>
                  <th className="px-6 py-4 font-inter text-right">total_amount</th>
                  <th className="px-6 py-4 font-inter text-right">amount_paid</th>
                  <th className="px-6 py-4 font-inter text-right">payment_pending</th>
                  <th className="px-6 py-4 font-inter">issue_type</th>
                  <th className="px-6 py-4 font-inter">created_at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-20 text-center font-inter">
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
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-inter">{log.issue_type}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-inter">{new Date(log.created_at).toLocaleString('en-GB')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">No transactions found for the selected criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Logs Pagination */}
          <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-white sticky left-0 font-inter">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              PAGE {currentPage} OF {Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-primary/20">
                {currentPage}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage)), prev + 1))}
                disabled={currentPage === Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage))}
                className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default MaterialHistoryPage;
