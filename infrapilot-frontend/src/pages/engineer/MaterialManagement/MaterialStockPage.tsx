import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";
import { 
  FileDown, 
  Table as TableIcon, 
  Filter,
  History,
  TrendingUp,
  TrendingDown,
  Box,
  Layers,
  Search,
  RotateCcw,
  Package,
  IndianRupee,
  Activity
} from "lucide-react";
import { materialService, type InventoryItem, type MaterialLog, type MaterialReport } from "../../../services/materialService";

const MaterialStockPage = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [report, setReport] = useState<MaterialReport[]>([]);
  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [logFilter, setLogFilter] = useState("All");
  const [projectId, setProjectId] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Interactive StatCard Filter
  const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Critical" | "HighValue" | "InStock">("All");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [invList, repList] = await Promise.all([
        materialService.getInventory(),
        materialService.getMaterialReport(projectId)
      ]);
      setInventory(invList || []);
      setReport(repList || []);
      
      const targetId = invList && invList.length > 0 ? invList[0].material_id : 1;
      const transList = await materialService.getTransactions(targetId);
      setLogs(transList || []);
      
    } catch (error) {
      console.error("Failed to load stock data", error);
      toast.error("Failed to sync inventory intelligence");
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
          setProjectId(36);
        }
      } catch (e) {
        console.error("Failed to resolve project ID", e);
        setProjectId(36);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    return {
      totalItems: inventory.length,
      totalValue: inventory.reduce((acc, curr) => acc + (curr.total_value || 0), 0),
      criticalCount: inventory.filter(i => i.remaining_stock < 10).length, // Mock logic for critical
      highValueCount: inventory.filter(i => (i.total_value || 0) > 10000).length
    };
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    let data = inventory;
    if (activeStatFilter === "Critical") {
      data = data.filter(i => i.remaining_stock < 10);
    } else if (activeStatFilter === "HighValue") {
      data = data.filter(i => (i.total_value || 0) > 10000);
    } else if (activeStatFilter === "InStock") {
      data = data.filter(i => i.remaining_stock > 0);
    }

    return data.filter(i => 
      searchTerm === "" || 
      i.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(i.material_id).includes(searchTerm)
    );
  }, [inventory, searchTerm, activeStatFilter]);

  const handleExportPdf = async () => {
    setIsExporting(true);
    const loadToast = toast.loading("Generating Strategic PDF report...");
    try {
      await materialService.exportPdf(projectId);
      toast.success("PDF Intelligence Dispatched!", { id: loadToast });
    } catch (error) {
      toast.error("Generation Failed", { id: loadToast });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    const loadToast = toast.loading("Processing Strategic Excel ledger...");
    try {
      await materialService.exportExcel(projectId);
      toast.success("Excel Ledger Exported!", { id: loadToast });
    } catch (error) {
      toast.error("Export Failed", { id: loadToast });
    } finally {
      setIsExporting(false);
    }
  };

  const logBadge = (type: string) => {
    switch (type) {
      case "PURCHASE": return "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-50";
      case "USAGE": return "bg-orange-50 text-orange-600 border-orange-100 shadow-orange-50";
      case "ISSUE": return "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50";
      default: return "bg-slate-50 text-slate-400 border-slate-100 shadow-slate-50";
    }
  };

  return (
    <>
      <Navbar title="Inventory Intelligence" breadcrumb={["Engineer", "Logistics", "Strategic Stock"]} />
      <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
          <div className="font-inter">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter uppercase italic-none">Strategic Stock Registry</h1>
            <p className="text-slate-500 text-sm font-inter italic-none">Real-time inventory valuation and procurement momentum audit.</p>
          </div>
          <div className="flex items-center gap-3 font-inter">
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50 font-inter shadow-sm"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50 font-inter shadow-sm"
            >
              <TableIcon className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>

        {/* ── Interactive Stats ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
          <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary bg-primary/5 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Inventory Scope"
              value={stats.totalItems.toString()}
              sub="Resource Types"
              accent="text-slate-800"
              icon={<Package className={`w-5 h-5 ${activeStatFilter === "All" ? "text-primary scale-110" : "text-slate-400 group-hover:text-primary"} transition-all`} />}
            />
          </div>
          <div className="cursor-default group transition-all rounded-xl hover:scale-[1.01]">
            <StatCard
              title="Valuation"
              value={`₹${(stats.totalValue / 100000).toFixed(1)}L`}
              sub="Gross Stock Value"
              accent="text-emerald-500"
              icon={<IndianRupee className="w-5 h-5 text-emerald-500" />}
            />
          </div>
          <div onClick={() => setActiveStatFilter("Critical")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Critical" ? "ring-2 ring-rose-500 bg-rose-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Critical Stock"
              value={stats.criticalCount.toString()}
              sub="Refill Required"
              accent="text-rose-500"
              icon={<TrendingDown className={`w-5 h-5 ${activeStatFilter === "Critical" ? "text-rose-500 scale-110" : "text-slate-400 group-hover:text-rose-500"} transition-all`} />}
            />
          </div>
          <div onClick={() => setActiveStatFilter("HighValue")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "HighValue" ? "ring-2 ring-amber-500 bg-amber-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Strategic Asset"
              value={stats.highValueCount.toString()}
              sub="High-Value Items"
              accent="text-amber-500"
              icon={<Activity className={`w-5 h-5 ${activeStatFilter === "HighValue" ? "text-amber-500 scale-110" : "text-slate-400 group-hover:text-amber-500"} transition-all`} />}
            />
          </div>
        </div>

        {/* ── Filter Bar & Card Grid ───────────────────────────────────────────── */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
            <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                <div className="relative flex-1 max-w-md font-inter">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-inter">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search resource name or identity..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter shadow-inner"
                    />
                </div>
                {activeStatFilter !== "All" && (
                    <button onClick={() => { setSearchTerm(""); setActiveStatFilter("All"); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter">
                        <RotateCcw className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-auto p-8 font-inter scrollbar-thin scrollbar-thumb-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 font-inter">
                  {isLoading ? (
                      <div className="col-span-full py-20 text-center font-inter">
                          <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4 font-inter" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-inter">Syncing Inventory Vault...</p>
                      </div>
                  ) : filteredInventory.length > 0 ? filteredInventory.map((inv) => (
                    <div key={inv.material_id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group font-inter relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-50 rounded-full group-hover:scale-[2] transition-transform duration-1000 opacity-30" />
                      
                      <div className="relative z-10 font-inter">
                          <div className="flex items-center justify-between mb-6 font-inter">
                            <div className="p-3.5 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-all font-inter border border-slate-100 shadow-inner">
                              <Box className="w-6 h-6 font-inter" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3.5 py-1.5 rounded-full uppercase tracking-[0.1em] font-inter border border-slate-100 shadow-sm">ID-#{inv.material_id}</span>
                          </div>
                          
                          <h3 className="text-xl font-black text-slate-800 mb-2 font-inter tracking-tight italic-none uppercase leading-tight">{inv.material_name}</h3>
                          
                          <div className="flex items-baseline gap-2 mb-8 font-inter">
                            <span className={`text-4xl font-black tracking-tighter font-inter ${inv.remaining_stock < 10 ? 'text-rose-500' : 'text-emerald-500'}`}>{inv.remaining_stock.toLocaleString()}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">{inv.unit}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6 border-t border-slate-50 pt-6 font-inter">
                            <div className="font-inter">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">Strategic Rate</p>
                                <p className="text-base font-black text-slate-700 font-inter italic-none">₹{inv.avg_rate?.toLocaleString()}</p>
                            </div>
                            <div className="text-right font-inter">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">Total Valuation</p>
                                <p className="text-base font-black text-slate-900 font-inter italic-none uppercase tracking-tight">₹{inv.total_value?.toLocaleString()}</p>
                            </div>
                          </div>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 font-inter">
                        <Package className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                        <h3 className="text-xl font-black text-slate-400 tracking-tight italic-none uppercase font-inter">Registry Exhausted</h3>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest italic-none mt-2 font-inter">No matching resources found in the current intelligence scope.</p>
                    </div>
                  )}
                </div>
            </div>
        </div>

        {/* ── Financial Material Report ───────────────────────────────────────────── */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 font-inter">
            <div className="flex items-center gap-3 font-inter">
                <Layers className="w-5 h-5 text-slate-400 font-inter" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-inter italic-none">Strategic Financial Matrix</h3>
            </div>
          </div>
          <div className="overflow-x-auto font-inter scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left font-inter min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">Strategic Resource</th>
                  <th className="px-6 py-4 font-inter text-center">Procured (Qty)</th>
                  <th className="px-6 py-4 font-inter text-center">Utilized (Qty)</th>
                  <th className="px-6 py-4 font-inter text-center">Residual (Stock)</th>
                  <th className="px-6 py-4 font-inter text-right">Commitment Value</th>
                  <th className="px-6 py-4 font-inter text-right text-rose-500">Unsettled Dues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {report.length > 0 ? (
                  report.map((rep) => (
                    <tr key={rep.material_id} className="hover:bg-slate-50/50 transition-colors font-inter group">
                      <td className="px-6 py-4 font-inter">
                        <span className="text-sm font-black text-slate-800 font-inter italic-none uppercase tracking-tight">{rep.material_name}</span>
                      </td>
                      <td className="px-6 py-4 text-center font-inter">
                        <span className="text-xs font-bold text-slate-600 font-inter tabular-nums">{rep.total_purchased.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center font-inter">
                        <span className="text-xs font-bold text-slate-600 font-inter tabular-nums">{rep.total_used.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center font-inter">
                        <span className={`text-sm font-black font-inter tabular-nums ${rep.remaining_stock < 10 ? 'text-rose-500' : 'text-emerald-600'}`}>
                          {rep.remaining_stock.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-black text-slate-900 font-inter tabular-nums italic-none">₹{rep.total_cost?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-black text-rose-500 font-inter tabular-nums italic-none">₹{rep.payment_pending?.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px] font-inter italic-none">Strategic ledger is currently empty.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Transaction History ───────────────────────────────────────────── */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden font-inter">
          <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30 font-inter">
            <div className="flex items-center gap-3 font-inter">
                <History className="w-5 h-5 text-slate-400 font-inter" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-inter italic-none">Historical Audit Ledger</h3>
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl font-inter shadow-sm">
                <Filter className="w-4 h-4 text-slate-400 font-inter" />
                <select 
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="text-[10px] font-black text-slate-600 focus:outline-none uppercase tracking-[0.2em] cursor-pointer font-inter"
                >
                    <option value="All">All Operations</option>
                    <option value="PURCHASE">Procurement</option>
                    <option value="USAGE">Consumption</option>
                </select>
            </div>
          </div>
          <div className="overflow-x-auto font-inter scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left font-inter min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">Audit Date</th>
                  <th className="px-6 py-4 font-inter">Protocol Type</th>
                  <th className="px-6 py-4 font-inter text-center">Intensity (Qty)</th>
                  <th className="px-6 py-4 font-inter text-right">Applied Rate</th>
                  <th className="px-6 py-4 font-inter text-right">Strategic Amount</th>
                  <th className="px-6 py-4 font-inter text-right">Disbursed (Amt)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-inter italic-none">{new Date(log.created_at).toLocaleDateString('en-GB')}</td>
                      <td className="px-6 py-4 font-inter">
                        <div className="flex items-center gap-3 font-inter">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest font-inter border shadow-sm ${logBadge(log.type)}`}>
                                {log.type}
                            </span>
                            {log.type === "PURCHASE" ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500 font-inter" /> : <TrendingDown className="w-3.5 h-3.5 text-orange-500 font-inter" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-inter">
                        <span className={`text-sm font-black font-inter tabular-nums ${log.type === 'PURCHASE' ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {log.type === 'PURCHASE' ? '+' : '-'}{log.quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-bold text-slate-500 font-inter tabular-nums">₹{log.rate.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-black text-slate-800 font-inter tabular-nums italic-none">₹{log.total_amount?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-black text-emerald-600 font-inter tabular-nums italic-none">₹{log.amount_paid?.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px] font-inter italic-none">Audit history exhausted for the selected scope.</td>
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
