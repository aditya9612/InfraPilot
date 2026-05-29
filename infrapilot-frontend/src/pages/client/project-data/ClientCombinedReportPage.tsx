import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { projectService } from "../../../services/projectService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

const ClientCombinedReportPage = () => {
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const navigate = useNavigate();
  const { projectId } = useClientProjectId();

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const projectRes = await projectService.getProjectById(projectId);
      setProjectData(projectRes);
    } catch (err) {
      console.error("Error fetching combined report:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportExcel = async () => {
    if (!projectId) return;
    try {
      setExportingExcel(true);
      const startDate = "2026-04-01";
      const endDate = "2026-04-26";
      
      const blob = await reportService.downloadCombinedReport(projectId, startDate, endDate);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Combined_Executive_Report_${projectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting Combined Excel:", err);
      alert("Failed to export Combined report.");
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <>
      <Navbar title="Executive Multi-Module Data Integration" breadcrumb={["InfraPilot", "Client", "Reports", "Combined Report"]} />
      <div className="p-6 bg-white min-h-screen font-inter pb-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/client/reports/summary')} className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Combined Report</h1>
              <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">{projectData?.project_name || "Active Project"} • Executive Analytics</p>
            </div>
          </div>
          <button onClick={handleExportExcel} disabled={exportingExcel} className="px-8 py-4 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95 disabled:bg-slate-100 disabled:text-slate-400">
            {exportingExcel ? 'Compiling Dataset...' : 'Generate Combined Excel'}
          </button>
        </div>
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="bg-slate-50 rounded-3xl p-16 text-center border border-slate-100">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-800 shadow-sm">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Consolidated Intelligence Dashboard</h3>
                <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">This report integrates data from Labour, Material, Issues, and Financial modules into a single unified analysis.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ClientCombinedReportPage;
