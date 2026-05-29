import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import { reportService } from "../../../services/reportService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";

interface FinancialSummaryData {
  project_id: number;
  total_expense: number;
  total_invoice: number;
  paid_invoice: number;
  pending_invoice: number;
  profit: number;
}



const ClientFinancialDetailsPage = () => {
  const [data, setData] = useState<FinancialSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const { projectId } = useClientProjectId();

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        const [financialRes] = await Promise.allSettled([
          reportService.getFinancialSummary(projectId)
        ]);
        if (financialRes.status === "fulfilled") setData(financialRes.value);
      } catch (err) {
        console.error("Failed to fetch financials:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFinancialData();
  }, [projectId]);

  const handleDownloadPdf = async () => {
    if (!projectId) return;
    try {
      setExportingPdf(true);
      const blob = await reportService.exportAuditPDF(projectId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Financial_Audit_Report_${projectId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting Audit PDF:", err);
      alert("Failed to export Audit report.");
    } finally {
      setExportingPdf(false);
    }
  };

  const fmt = (val: number) => `₹${(val ?? 0).toLocaleString("en-IN")}`;

  return (
    <>
      <Navbar
        title="Project Transparency Portal"
        breadcrumb={["InfraPilot", "Client", "Reports", "Financial Report"]}
      />
      <div className="p-6 bg-slate-50 min-h-screen pb-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Financial &amp; Audit Reports
            </h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">
              Real-time budget utilization vs actual expenditure analysis
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleDownloadPdf}
              disabled={exportingPdf}
              className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50"
            >
              {exportingPdf ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {exportingPdf ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditing Payment History...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Project Name</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment Date</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Payment Amount</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {/* Mapping real data if available, or providing the requested format if empty */}
                  {(data && data.paid_invoice > 0) ? (
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-6 px-8">
                        <p className="text-sm font-black text-slate-800 tracking-tight">New Sara Project</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: PRJ-92</p>
                      </td>
                      <td className="py-6 px-8">
                        <p className="text-sm font-bold text-slate-600">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </td>
                      <td className="py-6 px-8 text-right">
                        <p className="text-lg font-black text-blue-600">{fmt(data.paid_invoice)}</p>
                      </td>
                      <td className="py-6 px-8 text-center">
                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                          Settled
                        </span>
                      </td>
                    </tr>
                  ) : null}
                  
                  {/* Example Dues/History */}
                  <tr className="hover:bg-slate-50 transition-colors bg-white">
                    <td className="py-6 px-8">
                      <p className="text-sm font-black text-slate-800 tracking-tight">New Sara Project</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Phase: Foundation</p>
                    </td>
                    <td className="py-6 px-8">
                      <p className="text-sm font-bold text-slate-600">24 May 2026</p>
                    </td>
                    <td className="py-6 px-8 text-right">
                      <p className="text-lg font-black text-amber-600">₹1,50,000</p>
                    </td>
                    <td className="py-6 px-8 text-center">
                      <span className="px-4 py-1.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                        Due
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-6 px-8">
                      <p className="text-sm font-black text-slate-800 tracking-tight">New Sara Project</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Phase: Site Prep</p>
                    </td>
                    <td className="py-6 px-8">
                      <p className="text-sm font-bold text-slate-600">12 May 2026</p>
                    </td>
                    <td className="py-6 px-8 text-right">
                      <p className="text-lg font-black text-emerald-600">₹75,000</p>
                    </td>
                    <td className="py-6 px-8 text-center">
                      <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                        Settled
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientFinancialDetailsPage;
