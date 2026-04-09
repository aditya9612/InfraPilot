import Navbar from "../../../components/common/Navbar";

const payments = [
  { id: "PAY-1004", invoice: "INV-2026-42", amount: "₹38,40,000", date: "30 Mar 2026", method: "Bank Transfer", status: "Completed" },
  { id: "PAY-1003", invoice: "INV-2026-41", amount: "₹12,00,000", date: "07 Mar 2026", method: "RTGS", status: "Completed" },
  { id: "PAY-1002", invoice: "INV-2026-39", amount: "₹45,00,000", date: "17 Feb 2026", method: "Bank Transfer", status: "Completed" },
  { id: "PAY-1001", invoice: "INV-2026-38", amount: "₹8,50,000", date: "04 Feb 2026", method: "NEFT", status: "Completed" },
  { id: "PAY-1000", invoice: "INV-2026-37", amount: "₹1,20,000", date: "26 Jan 2026", method: "Bank Transfer", status: "Completed" },
];

const ClientPaymentsPage = () => (
  <>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Financials", "Payments"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Payment History</h1>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Log of all successful transactions and payment receipts</p>
      </div>

      <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <p className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment ID</p>
          <p className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Invoice</p>
          <p className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</p>
          <p className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Date</p>
          <p className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</p>
          <p className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</p>
        </div>
        <div className="divide-y divide-slate-50">
          {payments.map((pay, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-slate-50 transition-colors items-center group">
              <p className="col-span-2 text-xs font-black text-slate-800 uppercase tracking-widest">{pay.id}</p>
              <div className="col-span-3">
                 <p className="text-sm font-bold text-slate-700">{pay.invoice}</p>
              </div>
              <p className="col-span-2 text-sm font-black text-emerald-600">{pay.amount}</p>
              <p className="col-span-2 text-xs font-bold text-slate-500">{pay.date}</p>
              <p className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{pay.method}</p>
              <div className="col-span-1 flex justify-end">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">{pay.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Information Alert */}
      <div className="mt-8 p-6 bg-blue-50/50 border border-blue-100 rounded-[24px] flex items-start gap-4">
         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary text-xl shadow-sm shrink-0">ℹ️</div>
         <div>
            <p className="text-sm font-black text-blue-800">Processing Time</p>
            <p className="text-xs text-blue-600 font-bold mt-1 max-w-2xl leading-relaxed">Payments made via NEFT/RTGS may take up to 24 hours to reflect in the project ledger. If your payment is not listed after 48 hours, please contact the project accountant.</p>
         </div>
      </div>
    </div>
  </>
);

export default ClientPaymentsPage;
