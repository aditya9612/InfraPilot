import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { projectService } from "../../../services/projectService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

interface ProfitLossData {
  income: number;
  expense: number;
  profit: number;
}

const ClientProfitLossPage = () => {
  const [plData, setPlData] = useState<ProfitLossData | null>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const navigate = useNavigate();
  const { projectId } = useClientProjectId();

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projectRes, plRes] = await Promise.allSettled([
        projectService.getProjectById(projectId),
        reportService.getProfitLoss()
      ]);

      if (projectRes.status === 'fulfilled') setProjectData(projectRes.value);
      if (plRes.status === 'fulfilled') setPlData(plRes.value);
    } catch (err) {
      console.error("Error fetching profit loss report:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const blob = await reportService.exportProfitLossExcel();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Profit_Loss_Statement.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting Profit Loss Excel:", err);
      alert("Failed to export P&L report.");
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <>
      <Navbar title="Project Yield & Financial Statements" breadcrumb={["InfraPilot", "Client", "Reports", "Profit & Loss"]} />
      <div className="p-6 bg-white min-h-screen font-inter pb-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/client/reports/summary')} className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Profit & Loss</h1>
              <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">{projectData?.project_name || "Active Project"} • Yield Analysis</p>
            </div>
          </div>
          <button onClick={handleExportExcel} disabled={exportingExcel} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400">
            {exportingExcel ? 'Exporting...' : 'Export P&L Excel'}
          </button>
        </div>
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculating Yield Statement...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 group overflow-hidden relative">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 relative">Total Income</p>
                <div className="flex items-baseline gap-2 relative">
                  <span className="text-4xl font-black text-slate-800 tracking-tighter">₹{plData?.income?.toLocaleString() || 0}</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Revenue</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 group overflow-hidden relative">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 relative">Operational Expense</p>
                <div className="flex items-baseline gap-2 relative">
                  <span className="text-4xl font-black text-slate-800 tracking-tighter">₹{plData?.expense?.toLocaleString() || 0}</span>
                  <span className="text-[10px] font-bold text-red-600 uppercase">Cost</span>
                </div>
              </div>

              <div className="bg-slate-800 rounded-3xl p-10 group overflow-hidden relative shadow-2xl">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6 relative">Net Profitability</p>
                <div className="flex items-baseline gap-2 relative">
                  <span className="text-4xl font-black text-white tracking-tighter">₹{plData?.profit?.toLocaleString() || 0}</span>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Yield</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-12 text-center border border-slate-100">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 shadow-sm">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Yield & Cost Summary</h3>
              <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">Analyze project profitability with categorized revenue and expense tracking. Full statement available via Excel.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ClientProfitLossPage;
