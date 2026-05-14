import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import { Plus } from "lucide-react";
import CreateApprovalModal from "../../../components/forms/CreateApprovalModal";
const INITIAL_APPROVALS_DATA = [
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

import toast from "react-hot-toast";

const ClientPendingApprovalsPage = () => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [approvals, setApprovals] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   const fetchApprovals = async () => {
      setLoading(true);
      setTimeout(() => {
         setApprovals(INITIAL_APPROVALS_DATA);
         setLoading(false);
      }, 800);
   };

   useEffect(() => {
      fetchApprovals();
   }, []);

   const handleCreateApproval = async (data: any) => {
      setLoading(true);
      setTimeout(() => {
         const newApr = {
            id: `APR-${Math.floor(Math.random() * 900 + 100)}`,
            requestType: data.type,
            description: data.description,
            amountQuantity: data.amountQuantity,
            requestedBy: "Client (Self)",
            status: "Pending",
            remarks: "New request from portal"
         };
         setApprovals(prev => [newApr, ...prev]);
         toast.success("Approval request submitted!");
         setIsModalOpen(false);
         setLoading(false);
      }, 800);
   };

   const handleApprove = async (apr: any) => {
      setLoading(true);
      setTimeout(() => {
         setApprovals(prev => prev.filter(a => a.id !== apr.id));
         toast.success("Request approved!", {
            style: { borderRadius: "12px", background: "#059669", color: "#fff" },
            icon: "✅",
         });
         setLoading(false);
      }, 500);
   };

   const handleReject = async (apr: any) => {
      setLoading(true);
      setTimeout(() => {
         setApprovals(prev => prev.filter(a => a.id !== apr.id));
         toast.success("Request rejected", {
            style: { borderRadius: "12px", background: "#dc2626", color: "#fff" },
            icon: "❌",
         });
         setLoading(false);
      }, 500);
   };

   return (
      <>
         <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Approvals", "Pending"]} />
         <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
               <div>
                  <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pending Approvals</h1>
                  <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Review and authorize project variations, material choices, and billing requests</p>
               </div>
               <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
               >
                  <Plus size={18} strokeWidth={3} />
                  Create Approval
               </button>
            </div>

            <div className="space-y-8">
               {loading ? (
                  <div className="flex flex-col items-center justify-center py-40 text-slate-400">
                     <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                     <p className="text-[10px] font-bold uppercase tracking-widest">Scanning project ledger for pending authorizations...</p>
                  </div>
               ) : approvals.length === 0 ? (
                  <div className="bg-white rounded-3xl p-20 text-center border border-slate-100 shadow-sm">
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No pending approvals found</p>
                  </div>
               ) : (
                  approvals.map((apr, i) => (
                  <div key={i} className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 transition-all hover:shadow-2xl hover:shadow-blue-500/5 group relative overflow-hidden">
                     {/* Type Indicator Bar */}
                     <div className={`absolute top-0 left-0 w-full h-1.5 ${apr.requestType === 'Billing' ? 'bg-blue-500' :
                        apr.requestType === 'Material' ? 'bg-emerald-500' : 'bg-purple-500'
                        }`} />

                     <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-10 pb-8 border-b border-slate-50">
                        <div>
                           <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full border ${apr.requestType === 'Billing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                 apr.requestType === 'Material' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                                 }`}>
                                 {apr.requestType} Request
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{apr.id}</span>
                           </div>
                           <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-tight max-w-2xl">{apr.description}</h2>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Value / Qty</p>
                           <p className="text-2xl font-bold text-slate-800 tracking-tighter">{apr.amountQuantity}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                        <div className="space-y-6">
                           <div>
                              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Requested By</h3>
                              <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                 <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">👤</span>
                                 {apr.requestedBy}
                              </p>
                           </div>
                           <div>
                              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Internal Remarks</h3>
                              <p className="text-sm text-slate-500 font-medium leading-relaxed border-l-2 border-slate-200 pl-4 py-1 italic">
                                 "{apr.remarks}"
                              </p>
                           </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-center text-center">
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Current Status</p>
                              <p className="text-sm font-bold text-amber-500 uppercase tracking-widest animate-pulse">Awaiting Client Sign-off</p>
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col md:flex-row gap-4 pt-6">
                        <button 
                           onClick={() => handleApprove(apr)}
                           className="flex-1 px-8 py-4 bg-emerald-500 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-center"
                        >
                           Approve Request
                        </button>
                        <button 
                           onClick={() => handleReject(apr)}
                           className="flex-1 px-8 py-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-red-100 transition-colors text-center"
                        >
                           Reject Request
                        </button>
                     </div>
                  </div>
               )))}
            </div>
         </div>

         <CreateApprovalModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleCreateApproval}
         />
      </>
   );
};

export default ClientPendingApprovalsPage;
