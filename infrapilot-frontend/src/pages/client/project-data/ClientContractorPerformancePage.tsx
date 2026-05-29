import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { projectService } from "../../../services/projectService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

interface ContractorPerformance {
  project_id: number;
  total_tasks: number;
  avg_progress: number;
  total_paid: number;
  performance: string;
}

const ClientContractorPerformancePage = () => {
  const [performanceData, setPerformanceData] = useState<ContractorPerformance | null>(null);
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
      const [projectRes, performanceRes] = await Promise.allSettled([
        projectService.getProjectById(projectId),
        reportService.getContractorPerformance(projectId)
      ]);

      if (projectRes.status === 'fulfilled') setProjectData(projectRes.value);
      if (performanceRes.status === 'fulfilled') setPerformanceData(performanceRes.value);
    } catch (err) {
      console.error("Error fetching contractor performance:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData, projectId]);

  const handleExportExcel = async () => {
    if (!projectId) return;
    try {
      setExportingExcel(true);
      const blob = await reportService.exportContractorExcel(projectId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Contractor_Performance_Project_${projectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting Contractor Excel:", err);
      alert("Failed to export Contractor Excel report.");
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <>
      <Navbar title="Contractor KRA & Performance Audit" breadcrumb={["InfraPilot", "Client", "Reports", "Contractor Performance"]} />
      <div className="p-6 bg-white min-h-screen font-inter pb-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/client/reports/summary')} className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Contractor Performance</h1>
              <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">{projectData?.project_name || "Active Project"} • Vendor Audit</p>
            </div>
          </div>
          <button onClick={handleExportExcel} disabled={exportingExcel} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400">
            {exportingExcel ? 'Exporting...' : 'Export Performance Excel'}
          </button>
        </div>
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditing Vendor Metrics...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Milestone Progress</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-800 tracking-tighter">{performanceData?.avg_progress || 0}%</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Average</span>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Tasks</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-800 tracking-tighter">{performanceData?.total_tasks || 0}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned</span>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Financial Exposure</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-800 tracking-tighter">₹{performanceData?.total_paid?.toLocaleString() || 0}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Paid</span>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Performance Score</p>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-black tracking-tighter ${performanceData?.performance === 'Low' ? 'text-red-500' : 'text-emerald-500'}`}>
                            {performanceData?.performance || "N/A"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">Audit Rating</span>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-12 text-center border border-slate-100">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500 shadow-sm">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">SLA Compliance Monitoring</h3>
                <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">Evaluate vendor performance against predefined milestones and quality standards. Detailed analytics regarding task speed and resource utilization are available in the export.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ClientContractorPerformancePage;
