import Navbar from "../../components/common/Navbar";

const approvals = [
  { id: "APR-018", title: "Variation Order — Steel Price Surge", amount: "₹20,00,000", submitted: "20 Feb 2026", deadline: "05 Mar 2026", status: "Pending Client" },
  { id: "APR-017", title: "Design Change — Staircase Width Increase", amount: "₹3,50,000", submitted: "10 Feb 2026", deadline: "20 Feb 2026", status: "Approved" },
  { id: "APR-016", title: "Additional Floor Finishing Upgrade", amount: "₹8,00,000", submitted: "20 Jan 2026", deadline: "30 Jan 2026", status: "Approved" },
  { id: "APR-015", title: "Subcontractor Change — MEP Works", amount: "—", submitted: "05 Jan 2026", deadline: "10 Jan 2026", status: "Approved" },
  { id: "APR-014", title: "Schedule Extension — Monsoon Delay", amount: "—", submitted: "15 Aug 2025", deadline: "22 Aug 2025", status: "Approved" },
];

const statusStyle: Record<string, string> = {
  "Pending Client": "bg-amber-50 text-amber-700 border border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

const ClientApprovalsPage = () => (
  <>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Approvals"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Approvals</h1>
        <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Variation orders, design changes & approvals requiring your action</p>
      </div>

      {/* Action Required Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-start gap-4 mb-8">
        <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white text-lg shrink-0">!</div>
        <div>
          <p className="text-sm font-black text-amber-800">1 Approval Pending Your Action</p>
          <p className="text-xs text-amber-600 font-bold mt-1">APR-018 — Variation Order for Steel Price Surge requires your review and approval.</p>
          <button className="mt-3 px-5 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-colors shadow-sm">Review Now</button>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {approvals.map((apr, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{apr.id}</p>
                <h3 className="text-sm font-black text-slate-800 mt-0.5">{apr.title}</h3>
                <div className="flex gap-4 mt-2">
                  <p className="text-[10px] font-bold text-slate-500">Submitted: {apr.submitted}</p>
                  <p className="text-[10px] font-bold text-slate-500">Deadline: {apr.deadline}</p>
                  {apr.amount !== "—" && <p className="text-[10px] font-black text-slate-700">Amount: {apr.amount}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${statusStyle[apr.status]}`}>{apr.status}</span>
                {apr.status === "Pending Client" && (
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black rounded-xl hover:bg-emerald-600 transition-colors">Approve</button>
                    <button className="px-4 py-2 bg-red-50 text-red-600 text-[10px] font-black rounded-xl hover:bg-red-100 transition-colors">Reject</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export default ClientApprovalsPage;
