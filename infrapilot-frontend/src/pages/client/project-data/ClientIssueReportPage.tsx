import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { projectService } from "../../../services/projectService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

interface IssueData {
  open: number;
  closed: number;
}

const ClientIssueReportPage = () => {
  const [issueData, setIssueData] = useState<IssueData | null>(null);
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
      const [projectRes, issueRes] = await Promise.allSettled([
        projectService.getProjectById(projectId),
        reportService.getIssueReport(projectId)
      ]);

      if (projectRes.status === 'fulfilled') setProjectData(projectRes.value);
      if (issueRes.status === 'fulfilled') setIssueData(issueRes.value);
    } catch (err) {
      console.error("Error fetching issue report:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData, projectId]);

  const handleExportExcel = async () => {
    if (!projectId) return;
    try {
      setExportingExcel(true);
      const blob = await reportService.exportIssueExcel(projectId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `executive_site_issue_report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting Issue Excel:", err);
      alert("Failed to export Issue Excel report.");
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <>
      <Navbar title="Issue Tracker & Operational Risks" breadcrumb={["InfraPilot", "Client", "Reports", "Issues"]} />
      <div className="p-6 bg-white min-h-screen font-inter pb-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/client/reports/summary')} className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Issue Report</h1>
              <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">{projectData?.project_name || "Active Project"} • Risk Analytics</p>
            </div>
          </div>
          <button onClick={handleExportExcel} disabled={exportingExcel} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400">
            {exportingExcel ? 'Exporting...' : 'Export Issue Excel'}
          </button>
        </div>
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Operational Risks...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/50 rounded-full -mr-16 -mt-16"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 relative">Active Bottlenecks</p>
                    <div className="flex items-baseline gap-2 relative">
                        <span className="text-6xl font-black text-red-500 tracking-tighter">{issueData?.open || 0}</span>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Open Issues</span>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full -mr-16 -mt-16"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 relative">Resolved Conflicts</p>
                    <div className="flex items-baseline gap-2 relative">
                        <span className="text-6xl font-black text-emerald-500 tracking-tighter">{issueData?.closed || 0}</span>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Closed Issues</span>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-12 text-center border border-slate-100">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 shadow-sm">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Risk Mitigation Summary</h3>
                <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">Track current project bottlenecks and resolution progress. A detailed categorical log with resolution timelines is available in the Excel export.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ClientIssueReportPage;
