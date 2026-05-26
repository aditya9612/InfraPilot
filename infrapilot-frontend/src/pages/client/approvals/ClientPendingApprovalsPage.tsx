import { useState, useEffect } from "react";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import { approvalService } from "../../../services/approvalService";
import { useClientProjectId } from "../../../hooks/useClientProjectId";
import toast from "react-hot-toast";

const ClientPendingApprovalsPage = () => {
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [approvalsList, setApprovalsList] = useState<any[]>([]);
   const [requestType, setRequestType] = useState("Billing");
   const [entityId, setEntityId] = useState("");
   const [remarks, setRemarks] = useState("");
   const [formErrors, setFormErrors] = useState<{ entityId?: string }>({});
   const [loading, setLoading] = useState(true);
   const [selectedApproval, setSelectedApproval] = useState<any>(null);
   const [isViewModalOpen, setIsViewModalOpen] = useState(false);

   const { projectId } = useClientProjectId();

   useEffect(() => {
     if (!projectId) return;

     const fetchApprovals = async () => {
       try {
         setLoading(true);
         const data = await approvalService.getApprovals();
         const mapped = data
           .map((apr: any) => ({
             id: String(apr.id),
             requestType: apr.entity_type === 'bill' ? 'Billing' : 
                          apr.entity_type === 'material' ? 'Material' :
                          apr.entity_type === 'design' ? 'Design' : 'Variation',
             description: `${(apr.entity_type || 'Unknown').charAt(0).toUpperCase() + (apr.entity_type || 'unknown').slice(1)} Approval Request for related ID #${apr.entity_id}`,
             amountQuantity: "—", // Not provided by the API
             requestedBy: `User ID: ${apr.requested_by}`,
             status: apr.status,
             remarks: apr.remarks || "No external remarks provided."
           }));
         setApprovalsList(mapped);
       } catch (err) {
         console.error('Failed to fetch approvals', err);
         toast.error('Failed to load approvals');
       } finally {
         setLoading(false);
       }
     };
     fetchApprovals();
   }, [projectId]);

   const handleCreateApproval = async () => {
      const errors: { entityId?: string } = {};
      if (!entityId.trim() || isNaN(Number(entityId))) errors.entityId = "Valid numeric Entity ID is required";

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
            entity_id: Number(entityId),
            remarks: remarks || "Approval request drafted via portal"
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
            description: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Approval Request for related ID #${payload.entity_id}`,
            amountQuantity: "—",
            requestedBy: "Self",
            status: "Pending",
            remarks: payload.remarks
         };
         setApprovalsList([newApproval, ...approvalsList]);

         // Reset form
         setRequestType("Billing");
         setEntityId("");
         setRemarks("");
      } catch (err: any) {
         console.error("Create approval error:", err);
         toast.error(err?.message || "Failed to create approval request", { id: loadingToast });
      }
   };

   const handleViewDetails = (approval: any) => {
      setSelectedApproval(approval);
      setIsViewModalOpen(true);
   };

   const handleApprove = async (id: string) => {
      const remarkInput = window.prompt("Enter approval remarks (optional):", "we approved it");
      if (remarkInput === null) return; // User cancelled

      const loadingToast = toast.loading("Approving request...");
      try {
         const response = await approvalService.approve(id, remarkInput || "we approved it");
         if (response && response.error) {
            throw new Error(response.error);
         }
         toast.success("Request Approved", { id: loadingToast });
         setApprovalsList(prev => prev.map(a => a.id === id ? { ...a, status: 'Approved', remarks: remarkInput || "we approved it" } : a));
      } catch (err: any) {
         console.error("Approve error:", err);
         toast.error(err?.message || "Failed to approve request", { id: loadingToast });
      }
   };

   const handleReject = async (id: string) => {
      const remarkInput = window.prompt("Enter rejection remarks (required):", "we rejectedit");
      if (remarkInput === null) return; // User cancelled
      if (!remarkInput.trim()) {
         toast.error("Rejection remarks are required");
         return;
      }

      const loadingToast = toast.loading("Rejecting request...");
      try {
         const response = await approvalService.reject(id, remarkInput || "we rejectedit");
         if (response && response.error) {
            throw new Error(response.error);
         }
         toast.success("Request Rejected", { id: loadingToast });
         setApprovalsList(prev => prev.map(a => a.id === id ? { ...a, status: 'Rejected', remarks: remarkInput || "we rejectedit" } : a));
      } catch (err: any) {
         console.error("Reject error:", err);
         toast.error(err?.message || "Failed to reject request", { id: loadingToast });
      }
   };

   return (
   <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Approvals"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
               <h1 className="text-3xl font-black text-slate-800 tracking-tight">Approvals Dashboard</h1>
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

         <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Fetching Approvals...</p>
                </div>
             ) : approvalsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-xs font-black uppercase tracking-widest">No pending approvals</p>
                </div>
             ) : (
                <div className="divide-y divide-slate-50">
                   {/* List Header */}
                   <div className="hidden sm:flex items-center gap-6 px-10 py-4 bg-slate-50/50 border-b border-slate-50">
                      <div className="flex-1 min-w-0">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Request Details</p>
                      </div>
                      <div className="shrink-0 w-[100px] text-center">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</p>
                      </div>
                      <div className="shrink-0 w-[60px] text-center">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ref</p>
                      </div>
                      <div className="shrink-0 w-[100px] text-center">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                      </div>
                      <div className="shrink-0 w-[90px] text-center">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Action</p>
                      </div>
                   </div>

                   {approvalsList.map((apr, i) => (
                      <div key={i} className="flex flex-col sm:flex-row items-center gap-6 p-6 px-10 hover:bg-slate-50/50 transition-all group">
                         {/* Icon Box */}
                         <div className="w-12 h-12 bg-blue-50/50 rounded-xl flex items-center justify-center shrink-0 border border-blue-100/30">
                            <svg className="w-5 h-5 text-blue-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                         </div>

                         {/* Info */}
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                               <h3 className="text-sm font-black text-slate-800 tracking-tight truncate">{apr.description}</h3>
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">ARCHIVED RECORD • APR-{apr.id}</p>
                         </div>

                         {/* Category Pill */}
                         <div className="shrink-0 w-[100px] flex justify-center">
                            <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full border shadow-sm ${
                               apr.requestType === 'Billing' ? 'bg-blue-50 text-blue-600 border-blue-100/50' :
                               apr.requestType === 'Material' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-purple-50 text-purple-600 border-purple-100/50'
                            }`}>
                               {apr.requestType}
                            </span>
                         </div>

                         {/* Version Badge */}
                         <div className="shrink-0 w-[60px] flex justify-center">
                            <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-md border border-slate-100">
                               V1
                            </span>
                         </div>

                         {/* Date */}
                         <div className="shrink-0 w-[100px] text-center">
                            <p className="text-[11px] font-black text-slate-500">25 May 2026</p>
                         </div>

                         {/* Actions */}
                         <div className="flex items-center justify-center gap-3 shrink-0 w-[90px]">
                            <button 
                               onClick={() => handleViewDetails(apr)}
                               title="View Details"
                               className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                            >
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                               </svg>
                            </button>

                            {apr.status === 'Pending' ? (
                               <>
                                  <button 
                                     onClick={() => handleApprove(apr.id)}
                                     title="Approve"
                                     className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                  >
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                     </svg>
                                  </button>
                                  <button 
                                     onClick={() => handleReject(apr.id)}
                                     title="Reject"
                                     className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  >
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                     </svg>
                                  </button>
                               </>
                            ) : apr.status === 'Approved' ? (
                               <>
                                  <div className="w-9 h-9 flex items-center justify-center text-emerald-500 bg-emerald-50 rounded-xl shadow-sm border border-emerald-100/50">
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                     </svg>
                                  </div>
                                  <div className="w-9 h-9 flex items-center justify-center text-slate-200">
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                     </svg>
                                  </div>
                               </>
                            ) : (
                               <>
                                  <div className="w-9 h-9 flex items-center justify-center text-slate-200">
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                     </svg>
                                  </div>
                                  <div className="w-9 h-9 flex items-center justify-center text-red-500 bg-red-50 rounded-xl shadow-sm border border-red-100/50">
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                     </svg>
                                  </div>
                               </>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>       </div>

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
             <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Related Entity ID</label>
                <input 
                   type="text" 
                   placeholder="E.g., 2" 
                   value={entityId}
                   onChange={(e) => setEntityId(e.target.value)}
                   className={`w-full bg-slate-50 border ${formErrors.entityId ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-primary'} rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-colors`} 
                />
                {formErrors.entityId && <p className="text-[10px] font-black text-red-500 mt-1 uppercase tracking-widest">{formErrors.entityId}</p>}
             </div>
             <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Internal Remarks</label>
                <textarea 
                   placeholder="Provide approval reasoning or reference context..." 
                   rows={3} 
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

       {/* View Details Modal */}
       <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Approval Request Details"
          maxWidth="max-w-xl"
       >
          {selectedApproval && (
             <div className="space-y-8">
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <p className={`text-sm font-black uppercase tracking-widest ${
                         selectedApproval.status === 'Approved' ? 'text-emerald-500' : 
                         selectedApproval.status === 'Rejected' ? 'text-red-500' : 'text-amber-500'
                      }`}>
                         {selectedApproval.status === 'Pending' ? 'Awaiting Client Sign-off' : selectedApproval.status}
                      </p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reference</p>
                      <p className="text-sm font-black text-slate-800 uppercase tracking-widest">APR-{selectedApproval.id}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detailed Description</h4>
                   <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <p className="text-lg font-black text-slate-800 leading-tight mb-2">{selectedApproval.description}</p>
                      <div className="flex items-center gap-2">
                         <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100/50">
                            {selectedApproval.requestType} Entity
                         </span>
                         <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-100">
                            V1 Verified
                         </span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-6 border border-slate-100 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Requested By</p>
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">👤</div>
                         <p className="text-xs font-black text-slate-800">{selectedApproval.requestedBy}</p>
                      </div>
                   </div>
                   <div className="p-6 border border-slate-100 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Request Date</p>
                      <p className="text-xs font-black text-slate-800">25 May 2026</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Audit Trail & Remarks</h4>
                   <div className="p-6 bg-slate-50/50 border border-slate-100 border-dashed rounded-2xl">
                      <p className="text-xs text-slate-500 font-medium leading-relaxed italic italic">
                         "{selectedApproval.remarks}"
                      </p>
                   </div>
                </div>

                <div className="pt-4 flex justify-end border-t border-slate-100">
                   <button 
                      onClick={() => setIsViewModalOpen(false)}
                      className="px-8 py-3 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 transition-all shadow-xl shadow-slate-900/10"
                   >
                      Close Summary
                   </button>
                </div>
             </div>
          )}
       </Modal>
   </>
   );
};

export default ClientPendingApprovalsPage;
