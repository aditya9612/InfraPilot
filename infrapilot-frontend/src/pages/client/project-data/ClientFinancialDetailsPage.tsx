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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Total Invoiced", value: data?.total_invoice, color: "text-slate-800" },
            { label: "Amount Paid", value: data?.paid_invoice, color: "text-emerald-600" },
            { label: "Pending Dues", value: data?.pending_invoice, color: "text-amber-600" },
            { label: "Project Expense", value: data?.total_expense, color: "text-red-500" },
          ].map((stat, i) => (
            <div key={i} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color} tracking-tight`}>{fmt(stat.value ?? 0)}</p>
            </div>
          ))}
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
                    <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction Detail</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment Status</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Settlement Amount</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(!data || (data.paid_invoice === 0 && data.pending_invoice === 0)) ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No financial logs identified for this project archive.</p>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {data.paid_invoice > 0 && (
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="py-8 px-8">
                            <p className="text-sm font-black text-slate-800 tracking-tight">Consolidated Payments</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verified Site Receipts</p>
                          </td>
                          <td className="py-8 px-8">
                            <span className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-xl uppercase tracking-widest border border-emerald-100">
                              Settled
                            </span>
                          </td>
                          <td className="py-8 px-8 text-right">
                            <p className="text-lg font-black text-emerald-600">{fmt(data.paid_invoice)}</p>
                          </td>
                          <td className="py-8 px-8 text-center text-[10px] font-bold text-slate-400">
                            TRX-{projectId}-S
                          </td>
                        </tr>
                      )}
                      {data.pending_invoice > 0 && (
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="py-8 px-8">
                            <p className="text-sm font-black text-slate-800 tracking-tight">Outstanding Balance</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Invoiced amount</p>
                          </td>
                          <td className="py-8 px-8">
                            <span className="px-4 py-2 bg-amber-50 text-amber-600 text-[9px] font-black rounded-xl uppercase tracking-widest border border-amber-100">
                              Pending
                            </span>
                          </td>
                          <td className="py-8 px-8 text-right">
                            <p className="text-lg font-black text-amber-600">{fmt(data.pending_invoice)}</p>
                          </td>
                          <td className="py-8 px-8 text-center text-[10px] font-bold text-slate-400">
                            TRX-{projectId}-P
                          </td>
                        </tr>
                      )}
                    </>
                  )}
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
