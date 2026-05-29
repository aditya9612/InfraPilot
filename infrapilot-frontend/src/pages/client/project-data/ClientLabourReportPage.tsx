import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { projectService } from "../../../services/projectService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

interface LabourSummary {
  skill_type: string;
  count: number;
}

interface LabourReportData {
  labour_summary: LabourSummary[];
  daily_logs?: {
    report_date: string;
    skilled_labour: number;
    unskilled_labour: number;
    total: number;
  }[];
}

const ClientLabourReportPage = () => {
  const [labourData, setLabourData] = useState<LabourReportData | null>(null);
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
      const [projectRes, labourRes] = await Promise.allSettled([
        projectService.getProjectById(projectId),
        reportService.getLabourReport(projectId)
      ]);

      if (projectRes.status === 'fulfilled') setProjectData(projectRes.value);
      if (labourRes.status === 'fulfilled') setLabourData(labourRes.value);
    } catch (err) {
      console.error("Error fetching labour report:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, projectId]);

  const handleExportExcel = async () => {
    if (!projectId) return;
    try {
      setExportingExcel(true);
      const blob = await reportService.exportLabourExcel(projectId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Labour_Report_Project_${projectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting Labour Excel:", err);
      alert("Failed to export Labour Excel report.");
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <>
      <Navbar title="Labour Analytics & Deployment" breadcrumb={["InfraPilot", "Client", "Reports", "Labour"]} />
      <div className="p-6 bg-white min-h-screen font-inter pb-12">

        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/client/reports/summary')}
              className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-95"
              title="Back to Summary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Labour Report</h1>
              <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">
                {projectData?.project_name || "Active Project"} • Workforce Analytics
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
            >
              {exportingExcel ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {exportingExcel ? 'Exporting...' : 'Export Workforce Excel'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Manpower Metrics...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-8">

            {/* Workforce Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-50 rounded-2xl p-10 border border-slate-100 relative group">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Total Active Workforce</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-slate-800 tracking-tighter">
                    {labourData?.labour_summary?.reduce((acc: any, curr: any) => acc + curr.count, 0) || 0}
                  </span>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Deployment Total</span>
                </div>
              </div>

              {labourData?.labour_summary?.map((item: any, idx: number) => (
                <div key={idx} className="bg-slate-50 rounded-2xl p-10 border border-slate-100 relative group">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{item.skill_type} Workforce</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-black tracking-tighter ${item.skill_type === 'Skilled' ? 'text-emerald-500' : 'text-indigo-600'}`}>
                      {item.count}
                    </span>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Personnel</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Manpower Distribution Chart / Table */}
            <div className="bg-white rounded-3xl p-10 border border-slate-100">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Deployment Statistics</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Daily skill-wise breakdown</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill Category</th>
                      <th className="text-center py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Count</th>
                      <th className="text-center py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="text-right py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Intensity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labourData?.labour_summary?.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-50/50 group hover:bg-slate-50/50 transition-all">
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${item.skill_type === 'Skilled' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                              {item.skill_type.charAt(0)}
                            </div>
                            <span className="text-sm font-black text-slate-700">{item.skill_type} Labour</span>
                          </div>
                        </td>
                        <td className="py-6 px-4 text-center">
                          <span className="text-lg font-black text-slate-800">{item.count}</span>
                        </td>
                        <td className="py-6 px-4 text-center">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-tighter">Active</span>
                        </td>
                        <td className="py-6 px-4">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${item.skill_type === 'Skilled' ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                style={{ width: `${(item.count / 20) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-400">{Math.round((item.count / 20) * 100)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
};

export default ClientLabourReportPage;
