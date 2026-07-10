import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { projectService } from "../../../services/projectService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

interface MaterialDetail {
  material_id: number;
  material_name: string;
  total_purchased: number;
  total_used: number;
  remaining_stock: number;
  total_cost: number;
  payment_pending: number;
}

const ClientMaterialReportPage = () => {
  const [materialData, setMaterialData] = useState<MaterialDetail[]>([]);
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
      const [projectRes, materialRes] = await Promise.allSettled([
        projectService.getProjectById(projectId),
        reportService.getMaterialReport(projectId)
      ]);

      if (projectRes.status === 'fulfilled') {
        const pData = projectRes.value;
        setProjectData(pData?.data || pData);
      }
      
      if (materialRes.status === 'fulfilled') {
        const mData = materialRes.value;
        const rawItems = Array.isArray(mData) ? mData : (mData?.materials || mData?.data || mData?.items || []);
        const normalizedItems = rawItems.map((item: any) => ({
          ...item,
          material_name: item.material_name || item.material_code || "Unknown Material",
          total_purchased: item.total_purchased ?? item.quantity_purchased ?? 0,
          total_used: item.total_used ?? item.quantity_used ?? 0,
          remaining_stock: item.remaining_stock ?? item.remaining_quantity ?? item.current_stock ?? 0,
          total_cost: (item.total_cost ?? item.total_amount ?? item.total_value ?? item.total_valuation ?? 0) || ((item.purchase_rate || item.avg_rate || 0) * (item.remaining_stock ?? item.remaining_quantity ?? 0))
        }));
        setMaterialData(normalizedItems);
      }
    } catch (err) {
      console.error("Error fetching material report:", err);
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
      const blob = await reportService.exportMaterialExcel(projectId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Material_Report_Project_${projectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting Material Excel:", err);
      alert("Failed to export Material Excel report.");
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <>
      <Navbar title="Material Logistics & Consumption" breadcrumb={["InfraPilot", "Client", "Reports", "Material"]} />
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
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Material Report</h1>
              <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">
                {projectData?.project_name || "Active Project"} • Inventory Analytics
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {exportingExcel ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {exportingExcel ? 'Exporting...' : 'Export Material Excel'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Inventory Metrics...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-8">
            
            {/* Inventory Distribution Table */}
            <div className="bg-white rounded-3xl p-10 border border-slate-100 overflow-hidden shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Stock Analysis</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resource flow and financial impact</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource Name</th>
                      <th className="text-center py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchased</th>
                      <th className="text-center py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Consumed</th>
                      <th className="text-center py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Level</th>
                      <th className="text-right py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Valuation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialData?.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-50 group hover:bg-slate-50/30 transition-all">
                        <td className="py-6 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <span className="text-sm font-black text-slate-700">{item.material_name}</span>
                          </div>
                        </td>
                        <td className="py-6 px-6 text-center">
                            <span className="text-sm font-bold text-slate-600">{item.total_purchased} Units</span>
                        </td>
                        <td className="py-6 px-6 text-center">
                            <span className="text-sm font-bold text-emerald-600">{item.total_used} Units</span>
                        </td>
                        <td className="py-6 px-6 text-center">
                            <div className="flex flex-col items-center">
                                <span className={`text-sm font-black ${item.remaining_stock > 10 ? 'text-slate-800' : 'text-orange-600'}`}>{item.remaining_stock}</span>
                                <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (item.remaining_stock / item.total_purchased) * 100)}%` }}></div>
                                </div>
                            </div>
                        </td>
                        <td className="py-6 px-6 text-right">
                          <span className="text-sm font-black text-slate-800">₹{(item.total_cost ?? 0).toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                    {materialData.length === 0 && (
                        <tr>
                            <td colSpan={5} className="py-20 text-center">
                                <p className="text-slate-400 font-bold text-sm">No material logs identified for this project selection.</p>
                            </td>
                        </tr>
                    )}
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

export default ClientMaterialReportPage;
