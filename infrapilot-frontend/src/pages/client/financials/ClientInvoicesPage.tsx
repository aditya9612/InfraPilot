import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import { financeService } from "../../../services/financeService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ClientInvoicesPage = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<{ total: number; paid: number; pending: number }>({ total: 0, paid: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  const { projectId } = useClientProjectId();

  useEffect(() => {
    if (!projectId) return;

    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const [data, summaryData] = await Promise.all([
          financeService.getInvoicesByType("owner"),
          financeService.getReceivablesSummary()
        ]);
        console.log("Invoices raw data:", data, "projectId:", projectId);
        // Use loose equality (==) to handle string/number mismatch
        const filteredInvoices = data.filter((inv: any) => String(inv.project_id) === String(projectId));
        // If no invoices match this project, show all invoices as fallback
        setInvoices(filteredInvoices.length > 0 ? filteredInvoices : data);
        setSummary(summaryData);
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [projectId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // ── PDF generator ─────────────────────────────────────────────────────────────
  const downloadInvoicesPdf = () => {
    try {
      const doc = new jsPDF("landscape");

      doc.setFontSize(18);
      doc.text("Project Invoices Report", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 14, 30);

      const head = [["Inv ID", "Date", "Description", "Base Amount", "GST", "Total Amount", "Paid", "Pending", "Status"]];
      const body = invoices.map(inv => [
        `INV-${inv.id}`,
        formatDate(inv.created_at),
        inv.description || "—",
        formatCurrency(inv.amount),
        formatCurrency(inv.gst_amount || 0),
        formatCurrency(inv.total_amount),
        formatCurrency(inv.paid_amount),
        formatCurrency(inv.pending_amount),
        inv.status?.toUpperCase()
      ]);

      autoTable(doc, {
        startY: 35,
        head: head,
        body: body,
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 8 }
      });

      doc.save(`Project_Invoices_${new Date().toLocaleDateString("en-IN").replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    }
  };

  const handleDownloadSinglePdf = async (id: number) => {
    try {
      const blob = await financeService.getInvoicePdf(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Financials", "Invoices"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Invoices</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Track all project-related invoices and their detailed breakdown</p>
        </div>

        {/* Financial Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Total Invoiced", value: formatCurrency(summary.total || 0), color: "bg-blue-600", text: "text-white" },
            { label: "Total Paid", value: formatCurrency(summary.paid || 0), color: "bg-white", text: "text-slate-800 border border-slate-100 shadow-sm" },
            { label: "Outstanding", value: formatCurrency(summary.pending || 0), color: "bg-red-50", text: "text-red-700 border border-red-100 shadow-sm" },
          ].map((item, i) => (
            <div key={i} className={`${item.color} ${item.text} rounded-2xl p-8 transition-transform hover:scale-[1.02] duration-300`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${item.label === 'Total Invoiced' ? 'text-blue-100' : 'text-slate-400 font-black'}`}>{item.label}</p>
              <p className="text-2xl font-black">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Invoices History</h2>
            <button
              onClick={downloadInvoicesPdf}
              disabled={loading || invoices.length === 0}
              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline active:scale-95 transition-transform disabled:opacity-50 disabled:no-underline"
            >
              Download All (PDF)
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 pl-8 text-[9px] font-black text-slate-400 uppercase tracking-widest">Inv. Number</th>
                  <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Billing Date</th>
                  <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Base Amount</th>
                  <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Tax / GST</th>
                  <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                  <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Paid</th>
                  <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Outstanding</th>
                  <th className="p-4 pr-8 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="p-4 pr-8 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Fetching invoices data...</td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No invoices found.</td>
                  </tr>
                ) : (
                  invoices.map((inv, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 pl-8 whitespace-nowrap">
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">INV-{inv.id}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{inv.type?.toUpperCase()}</p>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <p className="text-xs font-bold text-slate-700">{formatDate(inv.created_at)}</p>
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="text-xs font-bold text-slate-600 leading-relaxed truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:absolute group-hover:bg-white group-hover:p-2 group-hover:shadow-xl group-hover:rounded-lg group-hover:z-10">{inv.description || "No description provided"}</p>
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-600 text-right">{formatCurrency(inv.amount)}</td>
                      <td className="p-4 text-xs font-bold text-slate-600 text-right">{formatCurrency((inv.gst_amount || 0) + (inv.tax_amount || 0))}</td>
                      <td className="p-4 text-sm font-black text-slate-800 text-right">{formatCurrency(inv.total_amount)}</td>
                      <td className="p-4 text-xs font-bold text-emerald-600 text-right">{formatCurrency(inv.paid_amount || 0)}</td>
                      <td className="p-4 text-xs font-bold text-red-600 text-right">{formatCurrency(inv.pending_amount || 0)}</td>
                      <td className="p-4 pr-8 text-center">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                          inv.status === 'partial' || inv.status === 'partially paid' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                          {inv.status || 'UNPAID'}
                        </span>
                      </td>
                      <td className="p-4 pr-8 text-center">
                        <button
                          onClick={() => handleDownloadSinglePdf(inv.id)}
                          className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors flex items-center justify-center flex-shrink-0"
                          title="Download Invoice PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientInvoicesPage;
