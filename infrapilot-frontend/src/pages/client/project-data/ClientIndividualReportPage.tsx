import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { projectService } from "../../../services/projectService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

const ClientIndividualReportPage = () => {
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
      console.error("Error fetching client report:", err);
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
      const blob = await reportService.downloadClientReport(projectId, startDate, endDate);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Client_Report_${projectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting Client Excel:", err);
      alert("Failed to export Client report.");
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <>
      <Navbar title="Client Executive Statement" breadcrumb={["InfraPilot", "Client", "Reports", "Client Report"]} />
      <div className="p-6 bg-white min-h-screen font-inter pb-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/client/reports/summary')} className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Client Report</h1>
              <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">{projectData?.project_name || "Active Project"} • Executive View</p>
            </div>
          </div>
          <button onClick={handleExportExcel} disabled={exportingExcel} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400">
            {exportingExcel ? 'Exporting...' : 'Export Client Excel'}
          </button>
        </div>
        
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Executive Summary...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="bg-slate-50 rounded-3xl p-16 text-center border border-slate-100">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-800 shadow-sm">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Executive Stakeholder Report</h3>
                <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">Access a consolidated summary of project health, financial exposure, and milestone achievements designed specifically for client stakeholders.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ClientIndividualReportPage;
