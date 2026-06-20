import { useState, useMemo, useEffect } from "react";
import { ownerService } from "../../../services/ownerService";
import { projectService } from "../../../services/projectService";
import type { Owner } from "../../../types/owner";
import toast from "react-hot-toast";

// Re-defining PaymentTransaction interface to match our mapped data
export interface PaymentTransaction {
  id: string;
  ownerId: string;
  ownerName: string;
  date: string;
  amount: number;
  status: "Paid" | "Unpaid" | "Pending";
  reference: string;
  type: "Credit" | "Debit";
  description: string;
  isFallbackDate: boolean;
  milestone_name?: string;
  paid_amount?: number;
  reference_code?: string;
  project_id?: string;
}

export default function PaymentTracker() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTxn, setSelectedTxn] = useState<PaymentTransaction | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 10;


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
        }
        // else: leave as "" (All Owners) by default
      } catch (error) {
        console.error("Failed to fetch owners", error);
        toast.error("Failed to load owners list");
      }
    };
    fetchOwners();
  }, []);

  // Fetch projects to populate dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getProjects();
        setProjects(Array.isArray(data) ? data : (data as any).items || []);
      } catch (error) {
        console.error("Failed to fetch projects", error);
      }
    };
    fetchProjects();
  }, []);

  // Fetch payments when selected owner/project/status filters change
  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        // Use the new payment-tracker API
        const data = await ownerService.getPaymentTracker({
          owner_id: selectedOwnerId,
          project_id: selectedProjectId,
          status: selectedStatus
        });

        // Log raw API response to identify actual field names
        if (data && data.length > 0) {
          console.log("[PaymentTracker] Raw API response sample:", data[0]);
        }

        // Map API response to Component format
        const mappedData: PaymentTransaction[] = (data || []).map((txn: any) => {
          // Find matching owner from the owners list
          const txnOwnerId = txn.owner_id || txn.ownerId;
          const resolvedOwner = owners.find(o => String(o.id) === String(txnOwnerId));


          // Try every plausible milestone field name
          const resolvedMilestone = txn.milestone_name || txn.milestone || txn.milestoneName || txn.project_milestone || null;

          // Try every plausible date field name the API might return
          const rawDate =
            txn.due_date ||
            txn.payment_date ||
            txn.transaction_date ||
            txn.date ||
            txn.created_at ||
            txn.date_of_payment ||
            txn.paid_date ||
            txn.txn_date ||
            null;

          return {
            id: String(txn.id),
            ownerId: String(txnOwnerId || selectedOwnerId),
            ownerName: resolvedOwner ? resolvedOwner.name : (txn.owner_name || "Unknown"),
            date: rawDate || new Date().toISOString().split("T")[0],
            amount: parseFloat(txn.amount) || 0,
            status: txn.status || "Paid",
            reference: txn.reference_id ? `${txn.reference_type}-${txn.reference_id}` : (txn.reference || "-"),
            type: String(txn.type || "").toLowerCase() === "credit" ? "Credit" : "Debit",
            description: txn.description || txn.remarks || "N/A",
            isFallbackDate: !rawDate,
            milestone_name: resolvedMilestone,
            paid_amount: parseFloat(txn.paid_amount) || 0,
            reference_code: txn.reference_code,
            project_id: String(txn.project_id)
          };
        });

        // Sort by date (descending) then by ID (descending)
        const sortedData = [...mappedData].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateB !== dateA) return dateB - dateA;
          return parseInt(b.id) - parseInt(a.id);
        });

        setPayments(sortedData);
      } catch (error) {
        console.error("Failed to fetch payments", error);
        toast.error("Failed to load payment data");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOwnerId, selectedProjectId, selectedStatus, owners]);

  const filteredPayments = useMemo(() => {
    return payments.filter((txn) => {
      // Date filter
      if (fromDate && new Date(txn.date) < new Date(fromDate)) return false;
      if (toDate && new Date(txn.date) > new Date(toDate)) return false;

      // Search Box filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !txn.ownerName.toLowerCase().includes(query) &&
          !txn.ownerId.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [payments, fromDate, toDate, searchQuery]);

  // Reset to page 0 on search/filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, fromDate, toDate, selectedOwnerId, selectedProjectId, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const pagedData = filteredPayments.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return (
    <div className="bg-white rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Track Owner Payments
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Live transaction records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <label htmlFor="ownerSelect" className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-2">Owner:</label>
              <select
                id="ownerSelect"
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none pr-4 min-w-[140px] cursor-pointer"
              >
                <option value="">All Owners</option>
                {owners.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <label htmlFor="projectSelect" className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-2">Project:</label>
              <select
                id="projectSelect"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none pr-4 min-w-[140px] cursor-pointer"
              >
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <label htmlFor="statusSelect" className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-2">Status:</label>
              <select
                id="statusSelect"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none pr-4 min-w-[100px] cursor-pointer"
              >
                <option value="">All</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-end">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-sm w-full sm:w-64"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-sm"
              title="From Date"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-sm"
              title="To Date"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="p-4">Owner Ref</th>
              <th className="p-4">Date</th>
              <th className="p-4">Description</th>
              <th className="p-4 text-right">Amount (₹)</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Fetching Payments...</p>
                  </div>
                </td>
              </tr>
            ) : pagedData.length > 0 ? (
              pagedData.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      {txn.ownerName}
                    </p>
                    <p className="text-xs text-slate-500">{txn.ownerId}</p>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {!txn.isFallbackDate ? (
                      new Date(txn.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    ) : (
                      <span className="text-slate-400 italic">No Date Provided</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {txn.description}
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ref: {txn.reference}
                    </p>
                  </td>
                  <td className="p-4 text-sm font-semibold text-slate-800 text-right">
                    {txn.type === "Credit" ? "▲" : "▼"} {txn.amount.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${String(txn.status).toLowerCase() === "paid"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : String(txn.status).toLowerCase() === "unpaid"
                          ? "bg-red-50 text-red-700 border-red-100"
                          : "bg-yellow-50 text-yellow-700 border-yellow-100"
                        }`}
                    >
                      {txn.status || "Paid"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedTxn(txn)}
                      className="text-primary text-sm font-semibold hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-slate-500 py-12"
                >
                  No payments matched your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between flex-wrap gap-3">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Showing {filteredPayments.length > 0 ? currentPage * PAGE_SIZE + 1 : 0}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredPayments.length)} of {filteredPayments.length} records
        </p>
        <div className="flex items-center gap-1.5">
          {/* First page */}
          <button
            onClick={() => setCurrentPage(0)}
            disabled={currentPage === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold"
            title="First page"
          >
            «
          </button>
          {/* Prev page */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>

          {/* Page number buttons */}
          {Array.from({ length: totalPages }, (_, i) => i)
            .filter(i => Math.abs(i - currentPage) <= 2)
            .map(i => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-bold transition-all ${i === currentPage
                  ? "border-slate-200 text-slate-700 bg-white font-inter"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
              >
                {i + 1}
              </button>
            ))
          }

          {/* Next page */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
          {/* Last page */}
          <button
            onClick={() => setCurrentPage(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold"
            title="Last page"
          >
            »
          </button>
        </div>
      </div>

      {/* Detail View Modal Mock (Inline for simplicity) */}
      {selectedTxn && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h4 className="text-xl font-bold text-slate-800 mb-2">
              Payment Details
            </h4>
            <p className="text-sm text-slate-500 mb-6">
              Transaction ID: {selectedTxn.id}
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Owner</span>
                <span className="text-slate-800 font-medium text-sm">
                  {selectedTxn.ownerName}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Amount</span>
                <span className="text-slate-800 font-bold text-sm">
                  ₹{selectedTxn.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Type</span>
                <span className={`text-sm font-bold ${selectedTxn.type === "Credit" ? "text-emerald-600" : "text-rose-600"}`}>
                  {selectedTxn.type}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Status</span>
                <span className="text-sm font-medium">
                  {selectedTxn.status}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Milestone</span>
                <span className="text-slate-800 font-medium text-sm">
                  {selectedTxn.milestone_name || "-"}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Paid Amount</span>
                <span className="text-emerald-600 font-medium text-sm">
                  ₹{selectedTxn.paid_amount ?? 0}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Pending Amount</span>
                <span className="text-rose-600 font-medium text-sm">
                  ₹{(selectedTxn.amount - (selectedTxn.paid_amount || 0)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Reference Code</span>
                <span className="text-slate-800 font-mono text-xs">
                  {selectedTxn.reference_code || "-"}
                </span>
              </div>
              <div className="pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm block mb-1">Description</span>
                <span className="text-slate-600 text-sm break-words">
                  {selectedTxn.description}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTxn(null)}
              className="w-full py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

