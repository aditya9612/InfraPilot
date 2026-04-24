import { useState, useEffect } from "react";
import { ownerService } from "../../../services/ownerService";
import type { Owner, OwnerLedgerResponse } from "../../../types/owner";
import toast from "react-hot-toast";

export default function OwnerLedger() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [ledgerData, setLedgerData] = useState<OwnerLedgerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTxns, setSelectedTxns] = useState<Set<number>>(new Set());

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
        setSelectedTxns(new Set());
      } catch (error) {
        console.error("Failed to fetch ledger", error);
        toast.error("Failed to load ledger data");
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, [selectedOwnerId]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && ledgerData) {
      setSelectedTxns(new Set(ledgerData.transactions.map((t) => t.id)));
    } else {
      setSelectedTxns(new Set());
    }
  };

  const handleSelectOne = (id: number) => {
    const newSet = new Set(selectedTxns);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTxns(newSet);
  };

  const handleExport = async (type: "PDF" | "Excel") => {
    if (!selectedOwnerId) return;
    
    setLoading(true);
    try {
      if (type === "PDF") {
        await ownerService.exportLedgerPdf(selectedOwnerId);
      } else {
        await ownerService.exportLedgerExcel(selectedOwnerId);
      }
      toast.success(`${type} report exported successfully`);
    } catch (error) {
      console.error(`Export ${type} failed`, error);
      toast.error(`Failed to export ${type} report`);
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
          <p className="text-xl font-black text-emerald-600">₹{(ledgerData?.total_credit || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Debit</p>
          <p className="text-xl font-black text-rose-600">₹{(ledgerData?.total_debit || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Closing Balance</p>
          <p className={`text-xl font-black ${(ledgerData?.balance || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            ₹{(ledgerData?.balance || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 backdrop-blur-md z-10">
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  className="rounded-md text-primary focus:ring-primary border-slate-300 w-4 h-4"
                  checked={!!(
                    ledgerData?.transactions &&
                    selectedTxns.size === ledgerData.transactions.length &&
                    ledgerData.transactions.length > 0
                  )}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="p-4">Particulars</th>
              <th className="p-4">Reference</th>
              <th className="p-4">Type</th>
              <th className="p-4 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Loading Records...</p>
                  </div>
                </td>
              </tr>
            ) : !ledgerData || ledgerData.transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-16 text-center text-slate-400 italic text-sm font-medium">
                  Zero transactions found for the specified account.
                </td>
              </tr>
            ) : (
              ledgerData.transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50/50 transition-all group cursor-default">
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      className="rounded-md text-primary focus:ring-primary border-slate-300 w-4 h-4 cursor-pointer"
                      checked={selectedTxns.has(txn.id)}
                      onChange={() => handleSelectOne(txn.id)}
                    />
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-700">
                    {txn.description}
                  </td>
                  <td className="p-4 text-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      {txn.reference_type}: {txn.reference_id}
                    </p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        txn.type.toLowerCase() === "credit"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}
                    >
                      {txn.type}
                    </span>
                  </td>
                  <td
                    className={`p-4 text-sm font-black text-right ${txn.type.toLowerCase() === "credit" ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {txn.type.toLowerCase() === "credit" ? "▲" : "▼"} ₹{txn.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
