import { useState, useEffect, useCallback } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";
import { 
  FileDown, 
  Table as TableIcon, 
  Filter,
  History,
  TrendingUp,
  TrendingDown,
  Box,
  Layers
} from "lucide-react";
import { materialService, type InventoryItem, type MaterialLog, type MaterialReport } from "../../../services/materialService";

const MaterialStockPage = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [report, setReport] = useState<MaterialReport[]>([]);
  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [logFilter, setLogFilter] = useState("All");
  const projectId = 1;

  const fetchData = useCallback(async () => {
    try {
      const [invList, repList, logList] = await Promise.all([
        materialService.getInventory(),
        materialService.getMaterialReport(projectId),
        materialService.getLogs({ project_id: projectId, type: logFilter === "All" ? undefined : logFilter })
      ]);
      setInventory(invList || []);
      setReport(repList || []);
      setLogs(logList || []);
    } catch (error) {
      toast.error("Failed to load inventory data");
    }
  }, [projectId, logFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPdf = async () => {
    setIsExporting(true);
    const loadToast = toast.loading("Generating PDF report...");
    try {
      await materialService.exportPdf();
      toast.success("PDF downloaded!", { id: loadToast });
    } catch (error) {
      toast.error("Failed to generate PDF", { id: loadToast });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    const loadToast = toast.loading("Generating Excel report...");
    try {
      await materialService.exportExcel();
      toast.success("Excel downloaded!", { id: loadToast });
    } catch (error) {
      toast.error("Failed to generate Excel", { id: loadToast });
    } finally {
      setIsExporting(false);
    }
  };

  const logBadge = (type: string) => {
    switch (type) {
      case "PURCHASE": return "bg-blue-100 text-blue-600";
      case "USAGE": return "bg-orange-100 text-orange-600";
      case "ISSUE": return "bg-amber-100 text-amber-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <>
      <Navbar title="Material Stock" breadcrumb={["Engineer", "Logistics", "Stock Overview"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
          <div className="font-inter">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Stock Overview</h1>
            <p className="text-slate-500 text-sm font-inter">Current inventory and stock reports</p>
          </div>
          <div className="flex items-center gap-3 font-inter">
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-600 bg-white rounded-xl text-xs font-bold hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50 font-inter"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 border border-emerald-200 text-emerald-600 bg-white rounded-xl text-xs font-bold hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50 font-inter"
            >
              <TableIcon className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Inventory Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 font-inter">
          {inventory.length > 0 ? inventory.map((inv) => (
            <div key={inv.material_id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group font-inter">
              <div className="flex items-center justify-between mb-4 font-inter">
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-all font-inter">
                  <Box className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest font-inter">PID: {inv.project_id}</span>
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1 font-inter">{inv.material_name}</h3>
              <div className="flex items-baseline gap-1 mb-6 font-inter">
                <span className="text-3xl font-black text-emerald-500 tracking-tighter font-inter">{inv.remaining_stock.toLocaleString()}</span>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest font-inter">{inv.unit}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4 font-inter">
                <div className="font-inter">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 font-inter">Avg Rate</p>
                    <p className="text-sm font-bold text-slate-700 font-inter">₹{inv.avg_rate?.toLocaleString()}</p>
                </div>
                <div className="text-right font-inter">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 font-inter">Total Value</p>
                    <p className="text-sm font-black text-slate-800 font-inter">₹{inv.total_value?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )) : (
              <div className="col-span-3 py-12 bg-white rounded-[2rem] border border-slate-100 text-center text-slate-400 font-medium italic font-inter">No inventory summary available.</div>
          )}
        </div>

        {/* Material Report Table */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 font-inter">
            <div className="flex items-center gap-3 font-inter">
                <Layers className="w-5 h-5 text-slate-400 font-inter" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-inter">Financial Material Report</h3>
            </div>
          </div>
          <div className="overflow-x-auto font-inter">
            <table className="w-full text-left font-inter">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">Material</th>
                  <th className="px-6 py-4 font-inter text-center">Total Purchased</th>
                  <th className="px-6 py-4 font-inter text-center">Total Used</th>
                  <th className="px-6 py-4 font-inter text-center">Remaining</th>
                  <th className="px-6 py-4 font-inter text-right">Total Cost</th>
                  <th className="px-6 py-4 font-inter text-right text-rose-500">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {report.length > 0 ? (
                  report.map((rep) => (
                    <tr key={rep.material_id} className="hover:bg-slate-50/50 transition-colors font-inter">
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm font-inter">{rep.material_name}</td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-slate-600 font-inter">{rep.total_purchased}</td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-slate-600 font-inter">{rep.total_used}</td>
                      <td className="px-6 py-4 text-center font-black text-emerald-600 text-sm font-inter">{rep.remaining_stock}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-800 text-sm font-inter">₹{rep.total_cost?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-rose-500 text-sm font-inter">₹{rep.payment_pending?.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium font-inter">No report data found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden font-inter">
          <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30 font-inter">
            <div className="flex items-center gap-3 font-inter">
                <History className="w-5 h-5 text-slate-400 font-inter" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-inter">Transaction History</h3>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl font-inter">
                <Filter className="w-3.5 h-3.5 text-slate-400 font-inter" />
                <select 
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="text-xs font-black text-slate-600 focus:outline-none uppercase tracking-widest cursor-pointer font-inter"
                >
                    <option value="All">All Transactions</option>
                    <option value="PURCHASE">Purchases Only</option>
                    <option value="USAGE">Usage Only</option>
                </select>
            </div>
          </div>
          <div className="overflow-x-auto font-inter">
            <table className="w-full text-left font-inter">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">Date</th>
                  <th className="px-6 py-4 font-inter">Type</th>
                  <th className="px-6 py-4 font-inter text-center">Qty</th>
                  <th className="px-6 py-4 font-inter text-right">Rate</th>
                  <th className="px-6 py-4 font-inter text-right">Amount</th>
                  <th className="px-6 py-4 font-inter text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-inter">{new Date(log.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-inter">
                        <div className="flex items-center gap-2 font-inter">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest font-inter ${logBadge(log.type)}`}>
                                {log.type}
                            </span>
                            {log.type === "PURCHASE" ? <TrendingUp className="w-3 h-3 text-emerald-500 font-inter" /> : <TrendingDown className="w-3 h-3 text-orange-500 font-inter" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-800 text-sm font-inter">{log.quantity}</td>
                      <td className="px-6 py-4 text-right text-xs font-bold text-slate-500 font-inter">₹{log.rate}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-800 text-sm font-inter">₹{log.total_amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600 text-sm font-inter">₹{log.amount_paid?.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium font-inter">No transactions found for the selected filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default MaterialStockPage;
