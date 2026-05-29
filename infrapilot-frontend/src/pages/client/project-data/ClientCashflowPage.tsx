import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { projectService } from "../../../services/projectService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

interface CashflowData {
  inflow: number;
  outflow: number;
  balance: number;
}

const ClientCashflowPage = () => {
  const [cashflowData, setCashflowData] = useState<CashflowData | null>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const navigate = useNavigate();
  const { projectId } = useClientProjectId();

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projectRes, cashflowRes] = await Promise.allSettled([
        projectService.getProjectById(projectId),
        reportService.getCashflow()
      ]);

      if (projectRes.status === 'fulfilled') setProjectData(projectRes.value);
      if (cashflowRes.status === 'fulfilled') setCashflowData(cashflowRes.value);
    } catch (err) {
      console.error("Error fetching cashflow report:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const blob = await reportService.exportCashflowExcel();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Cashflow_Forecast.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting Cashflow Excel:", err);
      alert("Failed to export Cashflow report.");
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <>
      <Navbar title="Liquidity & Cashflow Analytics" breadcrumb={["InfraPilot", "Client", "Reports", "Cashflow"]} />
      <div className="p-6 bg-white min-h-screen font-inter pb-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/client/reports/summary')} className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Cashflow Report</h1>
              <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">{projectData?.project_name || "Active Project"} • Liquidity Overview</p>
            </div>
          </div>
          <button onClick={handleExportExcel} disabled={exportingExcel} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400">
            {exportingExcel ? 'Exporting...' : 'Export Cashflow Excel'}
          </button>
        </div>
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking Liquidity Movements...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Inflow</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-emerald-600 tracking-tighter">₹{cashflowData?.inflow?.toLocaleString() || 0}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Outflow</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-red-500 tracking-tighter">₹{cashflowData?.outflow?.toLocaleString() || 0}</span>
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-10 shadow-xl border border-slate-800">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 font-inter">Net Available Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tracking-tighter">₹{cashflowData?.balance?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-12 text-center border border-slate-100">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500 shadow-sm">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v16m-6 0a2 2 0 002 2h2a2 2 0 002-2" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Liquidity & Inflow Analysis</h3>
              <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">Monitor cash inflows and outflows to ensure operational stability. Detailed cash movement ledger available via Excel.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ClientCashflowPage;
