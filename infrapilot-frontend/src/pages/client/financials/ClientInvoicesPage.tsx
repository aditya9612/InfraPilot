import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import { financeService } from "../../../services/financeService";
import type { Invoice } from "../../../types/invoice";

const ClientInvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("ClientInvoicesPage: Component mounted");
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      console.log("ClientInvoicesPage: Fetching invoices...");
      setLoading(true);
      const data = await financeService.getInvoices();
      console.log("ClientInvoicesPage: Data received:", data);
      setInvoices(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      console.error("ClientInvoicesPage: Error fetching invoices:", err);
      setError("Failed to load invoices: " + (err.message || "Unknown error"));
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (id: number) => {
    try {
      await financeService.getInvoicePdf(id);
    } catch (err: any) {
      console.error("ClientInvoicesPage: Download PDF error:", err);
      const msg = err.response?.data?.detail || err.message || "Unknown error";
      alert(`Failed to download PDF: ${msg}`);
    }
  };

  const handleDownloadAllPdf = async () => {
    try {
      await financeService.exportInvoicesPdf(safeInvoices);
    } catch (err: any) {
      console.error("ClientInvoicesPage: Download PDF error:", err);
      const msg = err.response?.data?.detail || err.message || "Unknown error";
      alert(`Failed to download PDF: ${msg}`);
    }
  };



  const formatCurrency = (amount: any) => {
    try {
      const val = Number(amount);
      if (isNaN(val)) return "₹0";
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(val);
    } catch (e) {
      return "₹" + amount;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return "N/A";
    }
  };

  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  const totalSpent = safeInvoices.reduce((acc, inv) => {
    const amt = Number(inv?.total_amount || 0);
    return acc + (inv?.status === 'paid' ? amt : 0);
  }, 0);

  const pendingAmount = safeInvoices.reduce((acc, inv) => {
    const amt = Number(inv?.total_amount || 0);
    return acc + (inv?.status !== 'paid' ? amt : 0);
  }, 0);

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
          <div className="bg-blue-600 text-white rounded-3xl p-6 transition-transform hover:scale-[1.01] duration-300 shadow-md">
             <p className="text-[9px] font-bold uppercase tracking-widest mb-1 text-blue-100">Total Budget</p>
             <p className="text-xl font-bold">₹8,20,00,000</p>
          </div>
          <div className="bg-white text-slate-800 border border-slate-100 shadow-sm rounded-3xl p-6 transition-transform hover:scale-[1.01] duration-300">
             <p className="text-[9px] font-bold uppercase tracking-widest mb-1 text-slate-400">Total Spent</p>
             <p className="text-xl font-bold">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm rounded-3xl p-6 transition-transform hover:scale-[1.01] duration-300">
             <p className="text-[9px] font-bold uppercase tracking-widest mb-1 text-slate-400">Pending Invoices</p>
             <p className="text-xl font-bold">{formatCurrency(pendingAmount)}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
             <h2 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Awaiting & Recent Invoices</h2>
             <button 
               onClick={handleDownloadAllPdf}
               disabled={safeInvoices.length === 0}
               className="text-[9px] font-bold text-primary uppercase tracking-widest hover:underline active:scale-95 transition-transform disabled:opacity-50"
             >
               Download All (PDF)
             </button>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm font-medium flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Loading invoices...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-400 text-sm font-medium">
              <p className="mb-2">⚠️ {error}</p>
              <button onClick={fetchInvoices} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">Retry</button>
            </div>
          ) : safeInvoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm font-medium">No invoices found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-4 pl-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Inv. Number / Type</th>
                    <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date / Due Date</th>
                    <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Work Description</th>
                    <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Base Amount</th>
                    <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">GST</th>
                    <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Total</th>
                    <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {safeInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 pl-8 whitespace-nowrap">
                        <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">{inv.invoice_number || `INV-${inv.id}`}</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5 uppercase tracking-widest">{inv.type}</p>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <p className="text-[11px] font-medium text-slate-700">{formatDate(inv.invoice_date || inv.created_at)}</p>
                        <p className="text-[8px] text-red-400 font-bold mt-0.5 uppercase tracking-widest">Due: {formatDate(inv.due_date)}</p>
                      </td>
                      <td className="p-4 max-w-xs">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-[11px] font-bold text-slate-800 leading-tight">{inv.description || "N/A"}</p>
                          <button 
                            onClick={() => handleDownloadPdf(inv.id)}
                            className="p-1.5 rounded-lg bg-slate-50 text-primary hover:bg-primary hover:text-white transition-all shrink-0"
                            title="Download Invoice"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-[11px] font-medium text-slate-600 text-right">{formatCurrency(inv.amount)}</td>
                      <td className="p-4 text-[11px] font-medium text-slate-600 text-right">{formatCurrency(inv.gst_amount)}</td>
                      <td className="p-4 text-xs font-bold text-slate-800 text-right">{formatCurrency(inv.total_amount)}</td>
                      <td className="p-4 text-center">
                        <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                          inv.status === "paid" ? "bg-emerald-50 text-emerald-600" : 
                          inv.status === "pending" ? "bg-amber-50 text-amber-600 border border-amber-100" : 
                          inv.status === "overdue" ? "bg-red-50 text-red-600 border border-red-100" :
                          "bg-slate-50 text-slate-600 border border-slate-100"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientInvoicesPage;
