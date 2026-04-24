import { useState, useMemo } from "react";
import { mockPayments, type PaymentTransaction } from "./mockData";

export default function PaymentTracker() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTxn, setSelectedTxn] = useState<PaymentTransaction | null>(
    null,
  );

  const filteredPayments = useMemo(() => {
    return mockPayments.filter((txn) => {
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
  }, [fromDate, toDate, searchQuery]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-slate-800">
          Track Owner Payments
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Owner ID, Name..."
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
            {filteredPayments.map((txn) => (
              <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    {txn.ownerName}
                  </p>
                  <p className="text-xs text-slate-500">{txn.ownerId}</p>
                </td>
                <td className="p-4 text-sm text-slate-600">
                  {new Date(txn.date).toLocaleDateString()}
                </td>
                <td className="p-4 text-sm text-slate-600">
                  {txn.description}
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ref: {txn.reference}
                  </p>
                </td>
                <td className="p-4 text-sm font-semibold text-slate-800 text-right">
                  {txn.amount.toLocaleString()}
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                      txn.status === "Paid"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : txn.status === "Unpaid"
                          ? "bg-red-50 text-red-700 border-red-100"
                          : "bg-yellow-50 text-yellow-700 border-yellow-100"
                    }`}
                  >
                    {txn.status}
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
            ))}
            {filteredPayments.length === 0 && (
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
                <span className="text-slate-500 text-sm">Status</span>
                <span className="text-sm font-medium">
                  {selectedTxn.status}
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
