import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";
import {
  Search,
  Package,
  RotateCcw
} from "lucide-react";
import { materialService, type MaterialReport } from "../../../services/materialService";




const MaterialStockPage = () => {
  const formatINR = (amount: number | string | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return "₹0";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const [report, setReport] = useState<MaterialReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Interactive StatCard Filter
  const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Critical" | "HighValue" | "InStock">("All");
  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      let data = await materialService.getMaterialReport(projectId);
      
      setReport(data);

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
          setProjectId(92);
        }
      } catch (e) {
        console.error("Failed to resolve project ID", e);
        setProjectId(92);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const projectReport = report.filter(i => i.project_id === undefined || i.project_id === projectId);
    return {
      totalItems: projectReport.length,
      totalValue: projectReport.reduce((acc, curr) => acc + (curr.total_cost || 0), 0),
      criticalCount: projectReport.filter(i => i.remaining_stock < 10).length, // Mock logic for critical
      highValueCount: projectReport.filter(i => (i.total_cost || 0) > 10000).length
    };
  }, [report, projectId]);

  const filteredReport = useMemo(() => {
    // Only include items that belong to the currently selected project (or if the API doesn't return project_id, include them as fallback)
    let data = report.filter(i => i.project_id === undefined || i.project_id === projectId);
    
    if (activeStatFilter === "Critical") {
      data = data.filter(i => i.remaining_stock < 10);
    } else if (activeStatFilter === "HighValue") {
      data = data.filter(i => (i.total_cost || 0) > 10000);
    } else if (activeStatFilter === "InStock") {
      data = data.filter(i => i.remaining_stock > 0);
    }

    return data.filter(i =>
      searchTerm === "" ||
      i.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(i.material_id).includes(searchTerm)
    );
  }, [report, searchTerm, activeStatFilter]);



  const handleExportPdf = async () => {
    setIsExporting(true);
    const loadToast = toast.loading("Generating Strategic PDF report...");

    // Trigger background API call to show in browser's Network Tab
    try {
      await materialService.exportPdf(projectId ?? undefined);
      toast.success("Successful (Status 200) - PDF Exported!", { id: loadToast });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Generation Failed", { id: loadToast });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    const loadToast = toast.loading("Processing Strategic Excel ledger...");

    try {
      await materialService.exportExcel(projectId ?? undefined);
      toast.success("Successful (Status 200) - Excel Exported!", { id: loadToast });
    } catch (error) {
      console.error("Export Failed:", error);
      toast.error("Export Failed", { id: loadToast });
    } finally {
      setIsExporting(false);
    }
  };



  return (
    <>
      <Navbar title="Inventory Intelligence" breadcrumb={["Engineer", "Logistics", "Strategic Stock"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter flex flex-col pb-8">
        {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
          <div className="font-inter">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Strategic Stock</h1>
            <p className="text-slate-500 text-sm font-inter">Real-time inventory valuation and procurement momentum audit.</p>
          </div>
          <div className="flex items-center gap-3 font-inter">
            <button
              onClick={fetchData}
              className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all border border-slate-100 bg-white/50 shadow-sm active:scale-95"
              title="Sync Intelligence"
            >
              <RotateCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-rose-600 hover:bg-rose-50 disabled:opacity-50 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-slate-200 shadow-sm"
            >
              PDF Report
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center justify-center px-8 py-3 bg-emerald-50 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border border-emerald-100 shadow-sm hover:bg-emerald-100 active:scale-95 disabled:opacity-50"
            >
              {isExporting ? 'Generating...' : 'EXCEL SHEET'}
            </button>
          </div>
        </div>

        {/* â”€â”€ Interactive Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
          <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Inventory Scope"
              value={stats.totalItems.toString()}
              sub="Resource Types"
              accent="text-slate-800" />
          </div>
          <div className="cursor-default group transition-all rounded-xl hover:scale-[1.01]">
            <StatCard
              title="Valuation"
              value={formatINR(stats.totalValue)}
              sub="Gross Stock Value"
              accent="text-emerald-500" />
          </div>
          <div onClick={() => setActiveStatFilter("Critical")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Critical" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Critical Stock"
              value={stats.criticalCount.toString()}
              sub="Refill Required"
              accent="text-rose-500" />
          </div>
          <div onClick={() => setActiveStatFilter("HighValue")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "HighValue" ? "ring-2 ring-amber-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Strategic Asset"
              value={stats.highValueCount.toString()}
              sub="High-Value Items"
              accent="text-amber-500" />
          </div>
        </div>

        {/* â”€â”€ Filter Bar & Card Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter">
          <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
            <div className="relative flex-1 max-w-md font-inter">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-inter">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by material name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter shadow-sm"
              />
            </div>
            {(activeStatFilter !== "All" || searchTerm !== "") && (
              <button
                onClick={() => { setSearchTerm(""); setActiveStatFilter("All"); }}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-rose-500 transition-all flex items-center justify-center shadow-sm active:scale-95"
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="overflow-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200 font-inter">
            <table className="w-full text-left font-inter min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">Material Name</th>
                  <th className="px-6 py-4 font-inter text-right">Total Purchased</th>
                  <th className="px-6 py-4 font-inter text-right">Total Used</th>
                  <th className="px-6 py-4 font-inter text-right text-emerald-600">Remaining Stock</th>
                  <th className="px-6 py-4 font-inter text-right">Total Cost</th>
                  <th className="px-6 py-4 font-inter text-right">Payment Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center font-inter">
                      <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin font-inter mb-4" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing inventory...</p>
                    </td>
                  </tr>
                ) : filteredReport.length > 0 ? (
                  filteredReport.map((rep) => (
                    <tr key={rep.material_id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4 font-inter">
                        <span className="text-sm font-bold text-slate-800 font-inter">{rep.material_name}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-xs font-bold text-slate-500 font-inter">{rep.total_purchased?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-xs font-bold text-slate-500 font-inter">{rep.total_used?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className={`text-sm font-bold font-inter ${rep.remaining_stock > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {rep.remaining_stock?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-bold text-slate-800 font-inter">{formatINR(rep.total_cost)}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-bold text-rose-500 font-inter">{formatINR(rep.payment_pending)}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-32 text-center bg-slate-50/50 font-inter">
                      <div className="py-12 border-2 border-dashed border-slate-200 rounded-[3rem] max-w-lg mx-auto font-inter">
                        <Package className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-slate-400 tracking-tight uppercase font-inter">Registry Exhausted</h3>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2 font-inter">No matching resources found in the current intelligence scope.</p>
                      </div>
                    </td>
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
