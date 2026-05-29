import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { projectService } from "../../../services/projectService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

interface Asset {
  id: number;
  name: string;
  purchase_date: string;
  purchase_value: number;
  current_value: number;
  depreciation_rate: number;
}

const ClientAssetReportPage = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const navigate = useNavigate();
  const { projectId } = useClientProjectId();

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projectRes, assetRes] = await Promise.allSettled([
        projectService.getProjectById(projectId),
        reportService.getAssetReport()
      ]);

      if (projectRes.status === 'fulfilled') setProjectData(projectRes.value);
      if (assetRes.status === 'fulfilled') setAssets(assetRes.value);
    } catch (err) {
      console.error("Error fetching asset report:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const blob = await reportService.exportAssetExcel();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Asset_Audit_Log.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting Asset Excel:", err);
      alert("Failed to export Asset report.");
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <>
      <Navbar title="Fixed Assets & Machinery Audit" breadcrumb={["InfraPilot", "Client", "Reports", "Asset Report"]} />
      <div className="p-6 bg-white min-h-screen font-inter pb-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/client/reports/summary')} className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Asset Report</h1>
              <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">{projectData?.project_name || "Active Project"} • Inventory Audit</p>
            </div>
          </div>
          <button onClick={handleExportExcel} disabled={exportingExcel} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400">
            {exportingExcel ? 'Exporting...' : 'Export Asset Excel'}
          </button>
        </div>
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Capital Assets...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Name</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Date</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Purchase Value</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Current Value</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Dep. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.length > 0 ? assets.map((asset) => (
                      <tr key={asset.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                            <span className="text-sm font-bold text-slate-700 tracking-tight">{asset.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-500">{asset.purchase_date}</td>
                        <td className="px-8 py-5 text-sm font-black text-slate-700 text-right tracking-tight">₹{asset.purchase_value.toLocaleString()}</td>
                        <td className="px-8 py-5 text-sm font-black text-blue-600 text-right tracking-tight">₹{asset.current_value.toLocaleString()}</td>
                        <td className="px-8 py-5 text-center">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">{asset.depreciation_rate}%</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No assets registered for this project scope.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-12 text-center border border-slate-100">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500 shadow-sm">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Fixed Asset Inventory</h3>
              <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">Maintain a detailed log of machinery, equipment, and fixed assets deployed on-site. Audit trails available in the export.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ClientAssetReportPage;
