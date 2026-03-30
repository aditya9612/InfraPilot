interface Invoice {
  id: string;
  project: string;
  entity: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
  date: string;
}

const invoices: Invoice[] = [
  { id: "INV-1024", project: "Skyline Residency", entity: "Ultratech Cement", amount: 450000, status: "Paid", date: "Mar 25, 2026" },
  { id: "INV-1025", project: "Metropolis Hub", entity: "L&T Construction", amount: 1250000, status: "Pending", date: "Mar 28, 2026" },
  { id: "INV-1026", project: "Green Valley", entity: "Jindal Steel", amount: 890000, status: "Overdue", date: "Mar 15, 2026" },
  { id: "INV-1027", project: "Coastal Bridge", entity: "Local Contractor", amount: 150000, status: "Paid", date: "Mar 20, 2026" },
];

const InvoiceTable = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
        <h3 className="font-bold text-slate-800">Invoice Management</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search invoices..." 
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary w-40"
          />
          <button className="px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
            Filter
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice ID</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Project / Entity</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-4 text-sm font-bold text-slate-700">{inv.id}</td>
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-700">{inv.project}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-tight">{inv.entity}</p>
                </td>
                <td className="px-5 py-4 text-sm font-bold text-slate-700">₹{(inv.amount / 100000).toFixed(2)}L</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    inv.status === "Paid" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                    inv.status === "Pending" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                    "bg-rose-50 text-rose-600 border border-rose-100"
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">{inv.date}</td>
                <td className="px-5 py-4 text-right">
                  <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all" title="Download PDF">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-slate-50/30 border-t border-slate-100 text-center">
        <button className="text-sm font-semibold text-primary hover:underline">View All Invoices</button>
      </div>
    </div>
  );
};

export default InvoiceTable;
