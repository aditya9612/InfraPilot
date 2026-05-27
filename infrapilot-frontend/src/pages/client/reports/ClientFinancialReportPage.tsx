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

interface QuarterlyAuditData {
  project_id: number;
  quarter: string;
  year: number;
  total_expense: number;
  total_invoice: number;
  completed_tasks: number;
  delayed_tasks: number;
}

const ClientFinancialReportPage = () => {
  const [data, setData] = useState<FinancialSummaryData | null>(null);
  const [audit, setAudit] = useState<QuarterlyAuditData | null>(null);
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
        const [financialRes, auditRes] = await Promise.allSettled([
          reportService.getFinancialSummary(projectId),
          reportService.getQuarterlyAuditSummary(projectId, 2026, 2)
        ]);
        if (financialRes.status === "fulfilled") setData(financialRes.value);
        if (auditRes.status === "fulfilled") setAudit(auditRes.value);
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
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Financial &amp; Audit Reports
          </h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">
            Real-time budget utilization vs actual expenditure analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Financial Overview */}
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-8">
              Financial Overview
            </h2>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Total Billed Amount
                  </p>
                  <p className="text-2xl font-black tracking-tighter text-blue-600">
                    {loading ? "—" : fmt(data?.total_invoice ?? 0)}
                  </p>
                </div>
                <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm">
                  Invoiced
                </span>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Paid Invoice
                  </p>
                  <p className="text-2xl font-black tracking-tighter text-emerald-600">
                    {loading ? "—" : fmt(data?.paid_invoice ?? 0)}
                  </p>
                </div>
                <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm">
                  Collected
                </span>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Pending Invoice
                  </p>
                  <p className="text-2xl font-black tracking-tighter text-amber-600">
                    {loading ? "—" : fmt(data?.pending_invoice ?? 0)}
                  </p>
                </div>
                <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm">
                  Receivables
                </span>
              </div>

              <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">
                    Operating Profit
                  </p>
                  <p className="text-2xl font-black tracking-tighter text-emerald-700">
                    {loading ? "—" : fmt(data?.profit ?? 0)}
                  </p>
                </div>
                <span className="text-[10px] font-black text-emerald-500 bg-white px-3 py-1 rounded-full shadow-sm">
                  Net Margin
                </span>
              </div>
            </div>
          </div>

          {/* Quarterly Audit */}
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                  Quarterly Audit Summary
                </h2>
                {audit && (
                  <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                    {audit.quarter} {audit.year}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Completed Tasks
                  </p>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">
                    {loading ? "—" : audit?.completed_tasks ?? 0}
                  </p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Delayed Tasks
                  </p>
                  <p className="text-3xl font-black text-red-600 tracking-tighter">
                    {loading ? "—" : audit?.delayed_tasks ?? 0}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 mb-4">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">
                  Quarterly Expense
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-blue-600 tracking-tighter">
                    {loading ? "—" : fmt(audit?.total_expense ?? 0)}
                  </span>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                    Operational Outflow
                  </span>
                </div>
              </div>

              <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">
                  Quarterly Invoice
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-indigo-600 tracking-tighter">
                    {loading ? "—" : fmt(audit?.total_invoice ?? 0)}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                    Total Billed
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadPdf}
              disabled={exportingPdf}
              className="w-full mt-8 py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:scale-100"
            >
              {exportingPdf ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              )}
              {exportingPdf ? "Generating Audit..." : "Download Detailed Audit PDF"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientFinancialReportPage;
