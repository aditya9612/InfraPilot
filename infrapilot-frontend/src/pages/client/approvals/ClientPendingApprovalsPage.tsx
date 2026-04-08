import DashboardLayout from "../../../components/common/DashboardLayout";
import Navbar from "../../../components/common/Navbar";

const pendingApprovals = [
   {
      id: "APR-042",
      requestType: "Billing",
      description: "Phase 2 structural completion milestone payment request for slab and column work.",
      amountQuantity: "₹45,50,000",
      requestedBy: "Projects Dept (Rajesh M.)",
      status: "Pending",
      remarks: "Work verified by site engineer on 30th Mar. Quality certificates attached."
   },
   {
      id: "APR-043",
      requestType: "Material",
      description: "Procurement of high-tensile reinforcement steel (Fe500D) for Phase 3 foundation.",
      amountQuantity: "45 Tons",
      requestedBy: "Procurement Team",
      status: "Pending",
      remarks: "Current market rate applied. Bulk discount included."
   },
   {
      id: "APR-044",
      requestType: "Design",
      description: "Modification of balcony railing design from steel to toughened glass for improved aesthetics.",
      amountQuantity: "All External Balconies",
      requestedBy: "Lead Architect (Anjali D.)",
      status: "Pending",
      remarks: "No structural impact. Slight increase in material cost offset by maintenance savings."
   }
];

const ClientPendingApprovalsPage = () => (
   <DashboardLayout>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Approvals", "Pending"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
         <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pending Approvals</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Review and authorize project variations, material choices, and billing requests</p>
         </div>

         <div className="space-y-8">
            {pendingApprovals.map((apr, i) => (
               <div key={i} className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 transition-all hover:shadow-2xl hover:shadow-blue-500/5 group relative overflow-hidden">
                  {/* Type Indicator Bar */}
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${apr.requestType === 'Billing' ? 'bg-blue-500' :
                     apr.requestType === 'Material' ? 'bg-emerald-500' : 'bg-purple-500'
                     }`} />

                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-10 pb-8 border-b border-slate-50">
                     <div>
                        <div className="flex items-center gap-3 mb-2">
                           <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${apr.requestType === 'Billing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              apr.requestType === 'Material' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                              }`}>
                              {apr.requestType} Request
                           </span>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{apr.id}</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight max-w-2xl">{apr.description}</h2>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Value / Qty</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">{apr.amountQuantity}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                     <div className="space-y-6">
                        <div>
                           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Requested By</h3>
                           <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">👤</span>
                              {apr.requestedBy}
                           </p>
                        </div>
                        <div>
                           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Internal Remarks</h3>
                           <p className="text-sm text-slate-500 font-medium leading-relaxed border-l-2 border-slate-200 pl-4 py-1 italic">
                              "{apr.remarks}"
                           </p>
                        </div>
                     </div>
                     <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex items-center justify-center text-center">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Status</p>
                           <p className="text-sm font-black text-amber-500 uppercase tracking-widest animate-pulse">Awaiting Client Sign-off</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 pt-6">
                     <button className="flex-1 px-8 py-4 bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-center">
                        Approve Request
                     </button>
                     <button className="flex-1 px-8 py-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors text-center">
                        Reject Request
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>
   </DashboardLayout>
);

export default ClientPendingApprovalsPage;
