import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import { approvalService } from "../../../services/approvalService";
import toast from "react-hot-toast";

const initialPendingApprovals: any[] = [
  {
    id: "1",
    requestType: "Billing",
    description: "Phase 2 structural completion milestone payment request for slab and column work.",
    amountQuantity: "₹45,50,000",
    requestedBy: "Projects Dept (Rajesh M.)",
    status: "Pending",
    remarks: "Work verified by site engineer on 30th Mar. Quality certificates attached."
  },
  {
    id: "2",
    requestType: "Material",
    description: "Procurement of high-tensile reinforcement steel (Fe500D) for Phase 3 foundation.",
    amountQuantity: "45 Tons",
    requestedBy: "Procurement Team",
    status: "Pending",
    remarks: "Current market rate applied. Bulk discount included."
  },
  {
    id: "3",
    requestType: "Design",
    description: "Modification of balcony railing design from steel to toughened glass for improved aesthetics.",
    amountQuantity: "All External Balconies",
    requestedBy: "Lead Architect (Anjali D.)",
    status: "Pending",
    remarks: "No structural impact. Slight increase in material cost offset by maintenance savings."
  }
];


const ClientPendingApprovalsPage = () => {
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [approvalsList, setApprovalsList] = useState(initialPendingApprovals);
   const [requestType, setRequestType] = useState("Billing");
   const [valueQty, setValueQty] = useState("");
   const [requestedBy, setRequestedBy] = useState("");
   const [description, setDescription] = useState("");
   const [remarks, setRemarks] = useState("");
   const [formErrors, setFormErrors] = useState<{ valueQty?: string; requestedBy?: string; description?: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        const data = await approvalService.getApprovals();
        const pending = data.filter((a: any) => a.status === 'Pending');
        if (pending && pending.length > 0) {
          setApprovalsList(pending);
        }
      } catch (err) {
        console.error('Failed to fetch approvals', err);
        toast.error('Failed to load approvals');
      } finally {
        setLoading(false);
      }
    };
    fetchApprovals();
  }, []);

   const handleCreateApproval = async () => {
      const errors: { valueQty?: string; requestedBy?: string; description?: string } = {};
      if (!valueQty.trim()) errors.valueQty = "Value / Quantity is required";
      if (!requestedBy.trim()) errors.requestedBy = "Requestor name is required";
      if (!description.trim()) errors.description = "Description is required";

      if (Object.keys(errors).length > 0) {
         setFormErrors(errors);
         return;
      }

      setFormErrors({});
      const loadingToast = toast.loading("Creating approval request...");

      try {
         // Map the UI requestType to the expected backend 'entity_type' enum (e.g. "bill", "material")
         let entityType = "bill";
         if (requestType === "Material") entityType = "material";
         if (requestType === "Design") entityType = "design";
         if (requestType === "Variation") entityType = "variation";

         const payload = {
            entity_type: entityType,
            entity_id: 2, // Hardcoded for demo as numeric entity ID is required
            remarks: remarks || "Approved after financial review" // Fallback to provided API example
         };

         const response = await approvalService.createApproval(payload);

         if (response && response.error) {
            throw new Error(response.error);
         }

         toast.success("Approval Request Created successfully!", { id: loadingToast });
         setIsCreateModalOpen(false);

         // Add to local state to reflect UI changes instantly
         const newApproval = {
            id: response?.id?.toString() || `${Math.floor(Math.random() * 1000)}`,
            requestType,
            description,
            amountQuantity: valueQty,
            requestedBy,
            status: "Pending",
            remarks: payload.remarks
         };
         setApprovalsList([newApproval, ...approvalsList]);

         // Reset form
         setRequestType("Billing");
         setValueQty("");
         setRequestedBy("");
         setDescription("");
         setRemarks("");
      } catch (err: any) {
         console.error("Create approval error:", err);
         toast.error(err?.message || "Failed to create approval request", { id: loadingToast });
      }
   };

   const handleApprove = async (id: string) => {
      const loadingToast = toast.loading("Approving request...");
      try {
         const response = await approvalService.approve(id, "we approved it");
         // Explicitly check for error string if backend returns 200 with error property
         if (response && response.error) {
            throw new Error(response.error);
         }
         toast.success("Request Approved", { id: loadingToast });
         setApprovalsList(prev => prev.filter(a => a.id !== id));
      } catch (err: any) {
         console.error("Approve error:", err);
         toast.error(err?.message || "Failed to approve request", { id: loadingToast });
      }
   };

   const handleReject = async (id: string) => {
      const loadingToast = toast.loading("Rejecting request...");
      try {
         const response = await approvalService.reject(id, "we rejectedit");
         // Explicitly check for error string if backend returns 200 with error property
         if (response && response.error) {
            throw new Error(response.error);
         }
         toast.success("Request Rejected", { id: loadingToast });
         setApprovalsList(prev => prev.filter(a => a.id !== id));
      } catch (err: any) {
         console.error("Reject error:", err);
         toast.error(err?.message || "Failed to reject request", { id: loadingToast });
      }
   };

   return (
   <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Approvals", "Pending"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
               <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pending Approvals</h1>
               <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Review and authorize project variations, material choices, and billing requests</p>
            </div>
            <button 
               onClick={() => setIsCreateModalOpen(true)}
               className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all w-full md:w-auto text-center shrink-0"
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
               </svg>
               Create Approval
            </button>
         </div>

         <div className="space-y-8">
            {approvalsList.map((apr, i) => (
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
                     <button onClick={() => handleApprove(apr.id)} className="flex-1 px-8 py-4 bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-center flex justify-center items-center gap-2">
                        <span>Approve Request</span>
                     </button>
                     <button onClick={() => handleReject(apr.id)} className="flex-1 px-8 py-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors text-center flex justify-center items-center gap-2">
                        <span>Reject Request</span>
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Create Approval Modal */}
      <Modal
         isOpen={isCreateModalOpen}
         onClose={() => setIsCreateModalOpen(false)}
         title="Draft New Approval Request"
         maxWidth="max-w-xl"
      >
         <div className="space-y-6">
            <div>
               <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Request Type</label>
               <select 
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-colors"
               >
                  <option>Billing</option>
                  <option>Material</option>
                  <option>Design</option>
                  <option>Variation</option>
               </select>
            </div>
            <div className="grid grid-cols-2 gap-6">
               <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Value / Quantity</label>
                  <input 
                     type="text" 
                     placeholder="E.g., ₹50,00,000 or 100 Tons" 
                     value={valueQty}
                     onChange={(e) => setValueQty(e.target.value)}
                     className={`w-full bg-slate-50 border ${formErrors.valueQty ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-primary'} rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-colors`} 
                  />
                  {formErrors.valueQty && <p className="text-[10px] font-black text-red-500 mt-1 uppercase tracking-widest">{formErrors.valueQty}</p>}
               </div>
               <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Requested By</label>
                  <input 
                     type="text" 
                     placeholder="E.g., Procurement Team" 
                     value={requestedBy}
                     onChange={(e) => setRequestedBy(e.target.value)}
                     className={`w-full bg-slate-50 border ${formErrors.requestedBy ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-primary'} rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-colors`} 
                  />
                  {formErrors.requestedBy && <p className="text-[10px] font-black text-red-500 mt-1 uppercase tracking-widest">{formErrors.requestedBy}</p>}
               </div>
            </div>
            <div>
               <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</label>
               <textarea 
                  placeholder="Briefly describe the request..." 
                  rows={3} 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full bg-slate-50 border ${formErrors.description ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-primary'} rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors resize-none custom-scrollbar`} 
               />
               {formErrors.description && <p className="text-[10px] font-black text-red-500 mt-1 uppercase tracking-widest">{formErrors.description}</p>}
            </div>
             <div>
               <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Internal Remarks (Optional)</label>
               <textarea 
                  placeholder="Add any private notes..." 
                  rows={2} 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-primary transition-colors resize-none custom-scrollbar" 
               />
            </div>
            <div className="pt-4 flex items-center justify-end gap-4 border-t border-slate-100">
               <button onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
               <button onClick={handleCreateApproval} className="px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">Submit Request</button>
            </div>
         </div>
      </Modal>
   </>
   );
};

export default ClientPendingApprovalsPage;
