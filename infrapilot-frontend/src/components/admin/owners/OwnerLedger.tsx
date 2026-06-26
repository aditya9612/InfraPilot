import { useState, useEffect } from "react";
import { ownerService } from "../../../services/ownerService";
import type { Owner, OwnerLedgerResponse } from "../../../types/owner";
import toast from "react-hot-toast";
import { formatCurrency } from "../../../utils/currencyUtils";

export default function OwnerLedger() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [ledgerData, setLedgerData] = useState<OwnerLedgerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch owners to populate dropdown
  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const data = await ownerService.getOwners();
        setOwners(data);

        // Support direct navigation via query param
        const urlParams = new URLSearchParams(window.location.search);
        const ownerIdParam = urlParams.get("owner_id");

        if (ownerIdParam && data.find(o => o.id === ownerIdParam)) {
          setSelectedOwnerId(ownerIdParam);
        } else if (data.length > 0) {
          setSelectedOwnerId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch owners", error);
        toast.error("Failed to load owners list");
      }
    };
    fetchOwners();
  }, []);

  // Fetch ledger data when selected owner changes
  useEffect(() => {
    if (!selectedOwnerId) return;

    const fetchLedger = async () => {
      setLoading(true);
      try {
        const data = await ownerService.getOwnerLedger(selectedOwnerId);
        setLedgerData(data);
        setCurrentPage(1);
      } catch (error) {
        console.error("Failed to fetch ledger", error);
        toast.error("Failed to load ledger data");
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, [selectedOwnerId]);

  const handleExport = async (format: "PDF" | "Excel") => {
    if (!selectedOwnerId) return;

    const toastId = toast.loading(`Generating ${format} report...`);
    setLoading(true);
    try {
      let blob: Blob;
      if (format === "PDF") {
        blob = await ownerService.exportLedgerPdf(selectedOwnerId);
      } else {
        blob = await ownerService.exportLedgerExcel(selectedOwnerId);
      }

      // Robust check for binary (xlsx/pdf) or text data (csv)
      const isSpreadsheet = blob.type.includes("spreadsheet") || blob.type.includes("excel") || blob.type.includes("officedocument.spreadsheetml");
      const isPdf = blob.type.includes("pdf");
      const isCsv = blob.type.includes("csv") || (blob.type.includes("text") && (await blob.text()).startsWith("Date,"));
      const isValidFormat = isSpreadsheet || isPdf || isCsv;

      console.log(`[OwnerLedger] Export ${format}: type="${blob.type}", size=${blob.size}, isValidFormat=${isValidFormat}`);

      if (!isValidFormat || blob.size < 50) {
        // Almost certainly a server error if it's too small or unknown format
        const text = await blob.text();
        console.error(`[OwnerLedger] Export failed. Response snippet: ${text.substring(0, 200)}`);

        let errorMsg = `Server error: Could not generate ${format} report.`;
        if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
          errorMsg = "Server returned an error page (HTML). Financial service might be down.";
        } else {
          try {
            const parsed = JSON.parse(text);
            errorMsg = parsed.detail || parsed.message || errorMsg;
          } catch {
            if (text.length > 0 && text.length < 300) errorMsg = text;
          }
        }
        toast.error(errorMsg, { id: toastId });
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Determine extension based on actual content
      let extension = "xlsx";
      if (isPdf) extension = "pdf";
      else if (isCsv) extension = "csv";
      else if (isSpreadsheet) extension = "xlsx";

      link.setAttribute("download", `Owner_Ledger_${selectedOwnerId}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${format} report exported successfully`, { id: toastId });
    } catch (error) {
      console.error(`Export ${format} failed`, error);
      toast.error(`Error generating ${format} report. Please try again later.`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden font-inter">
      {/* Header & Controls */}
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Owner Ledger</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Live Financial Records
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <label htmlFor="ownerSelect" className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-2">Select Account:</label>
            <select
              id="ownerSelect"
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none pr-4 min-w-[160px] cursor-pointer"
            >
              {owners.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport("PDF")}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50 rounded-2xl text-xs font-black transition-all border border-rose-100 shadow-sm"
          >
            PDF Report
          </button>
          <button
            onClick={() => handleExport("Excel")}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 rounded-2xl text-xs font-black transition-all border border-emerald-100 shadow-sm"
          >
            Excel Sheet
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50/30 border-b border-slate-100">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Credit</p>
          <p className="text-xl font-black text-emerald-600">{formatCurrency(ledgerData?.total_credit || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Debit</p>
          <p className="text-xl font-black text-rose-600">{formatCurrency(ledgerData?.total_debit || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Closing Balance</p>
          <p className={`text-xl font-black ${(ledgerData?.balance || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(ledgerData?.balance || 0)}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 backdrop-blur-md z-10">
              <th className="p-4 pl-6">Particulars</th>
              <th className="p-4">Reference</th>
              <th className="p-4">Type</th>
              <th className="p-4 pr-6 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Loading Records...</p>
                  </div>
                </td>
              </tr>
            ) : !ledgerData || ledgerData.transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-16 text-center text-slate-400 italic text-sm font-medium">
                  Zero transactions found for the specified account.
                </td>
              </tr>
            ) : (
              ledgerData.transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50/50 transition-all group cursor-default">
                  <td className="p-4 pl-6 text-sm font-bold text-slate-700">
                    {txn.description}
                  </td>
                  <td className="p-4 text-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      {txn.reference_type}: {txn.reference_id}
                    </p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${txn.type.toLowerCase() === "credit"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}
                    >
                      {txn.type}
                    </span>
                  </td>
                  <td
                    className={`p-4 pr-6 text-sm font-black text-right ${txn.type.toLowerCase() === "credit" ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {txn.type.toLowerCase() === "credit" ? "▲" : "▼"} {formatCurrency(txn.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {ledgerData && ledgerData.transactions.length > itemsPerPage && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between mt-auto">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, ledgerData.transactions.length)} of {ledgerData.transactions.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter">
              {currentPage}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(ledgerData.transactions.length / itemsPerPage), p + 1))}
              disabled={currentPage === Math.ceil(ledgerData.transactions.length / itemsPerPage)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
