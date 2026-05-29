import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { projectService } from "../../../services/projectService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

interface FinancialSummary {
  revenue: number;
  expense: number;
  profit: number;
}

const ClientProjectReportPage = () => {
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const navigate = useNavigate();
  const { projectId } = useClientProjectId();

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [projectRes, financialRes] = await Promise.allSettled([
        projectService.getProjectById(projectId),
        reportService.getProjectReportDetails(projectId)
      ]);

      if (projectRes.status === 'fulfilled') setProjectData(projectRes.value);
      if (financialRes.status === 'fulfilled') setFinancialSummary(financialRes.value);
    } catch (err) {
      console.error("Error fetching project report:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData, projectId]);

  const handleExportExcel = async () => {
    if (!projectId) return;
    try {
      setExportingExcel(true);
      // Using user requested date range as default/placeholder
      const startDate = "2026-04-01";
      const endDate = "2026-04-26";

      const blob = await reportService.downloadClientReport(projectId, startDate, endDate);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Project_Status_Report_${projectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting Project Excel:", err);
      alert("Failed to export Project report.");
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <>
      <Navbar title="Project Status & Milestone Audit" breadcrumb={["InfraPilot", "Client", "Reports", "Project Report"]} />
      <div className="p-6 bg-white min-h-screen font-inter pb-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/client/reports/summary')} className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Report</h1>
              <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">{projectData?.project_name || "Active Project"} • Milestone Status</p>
            </div>
          </div>
          <button onClick={handleExportExcel} disabled={exportingExcel} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400">
            {exportingExcel ? 'Exporting...' : 'Export Project Excel'}
          </button>
        </div>
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregating Milestone Data...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Revenue</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-800 tracking-tighter">₹{financialSummary?.revenue?.toLocaleString() || 0}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Project Expenses</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-800 tracking-tighter">₹{financialSummary?.expense?.toLocaleString() || 0}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 border-l-4 border-l-emerald-500">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Operating Margin</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-600 tracking-tighter">₹{financialSummary?.profit?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-16 text-center border border-slate-100">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-sm">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Comprehensive Project Audit</h3>
              <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">Get a full bird's eye view of project progress, resource allocation, and pending milestones. Detailed report available in Excel.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ClientProjectReportPage;
