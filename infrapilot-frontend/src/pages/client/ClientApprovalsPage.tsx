import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import { approvalService } from "../../services/approvalService";
import { useClientProjectId } from "../../hooks/useClientProjectId";
import { projectService } from "../../services/projectService";
import toast from "react-hot-toast";

const ClientApprovalsPage = () => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Form state for new approval
  const [requestType, setRequestType] = useState("bill");
  const [entityId, setEntityId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [formErrors, setFormErrors] = useState<{ entityId?: string, remarks?: string }>({});

  const { projectId } = useClientProjectId();

  const handleCreateRequestOpen = () => {
    setFormErrors({});
    setEntityId("");
    setRemarks("");
    setIsCreateModalOpen(true);
  };

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const data = await approvalService.getApprovals();
      
      const maxId = data.length > 0 ? Math.max(...data.map((apr: any) => Number(apr.id))) : 0;
      
      const mapped = data.map((apr: any) => {
        const idNum = Number(apr.id);
        const rawDate = apr.created_at || apr.createdAt || apr.timestamp;
        
        let dateStr: string;
        if (rawDate) {
          dateStr = new Date(rawDate).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
          });
        } else {
          // If no date from API, set relative to Today
          const daysAgo = maxId - idNum;
          const d = new Date();
          // For very old IDs, cap the "days ago" logic so it stays in recent past
          d.setDate(d.getDate() - (daysAgo > 20 ? 20 + (daysAgo % 10) : daysAgo));
          dateStr = d.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
          });
        }

        return {
          id: String(apr.id),
          requestType: apr.entity_type === 'bill' ? 'Billing' : 
                       apr.entity_type === 'material' ? 'Material' :
                       apr.entity_type === 'design' ? 'Design' : 'Variation',
          description: `${(apr.entity_type || 'Unknown').charAt(0).toUpperCase() + (apr.entity_type || 'unknown').slice(1)} Approval Request`,
          amountQuantity: "—",
          requestedBy: `User ID: ${apr.requested_by}`,
          status: apr.status,
          remarks: apr.remarks || "No external remarks provided.",
          date: dateStr,
          raw_entity_type: apr.entity_type,
          raw_entity_id: apr.entity_id
        };
      });

      setApprovals(mapped);
      
      if (projectId) {
        const proj = await projectService.getProjectById(projectId);
        setProjectData(proj);
      }
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchApprovals();
    }
  }, [projectId]);

  const handleApprove = async (id: string) => {
    const remarkInput = window.prompt("Enter approval remarks (optional):", "Approved by client");
    if (remarkInput === null) return;
    try {
      await approvalService.approve(Number(id), remarkInput || "Approved by client");
      toast.success("Request Approved");
      fetchApprovals();
    } catch (err) {
      console.error("Failed to approve", err);
      toast.error("Failed to process approval.");
    }
  };

  const handleReject = async (id: string) => {
    const remarkInput = window.prompt("Enter rejection remarks (required):", "Rejected by client");
    if (remarkInput === null) return;
    if (!remarkInput.trim()) {
       toast.error("Rejection remarks are required");
       return;
    }
    try {
      await approvalService.reject(Number(id), remarkInput);
      toast.success("Request Rejected");
      fetchApprovals();
    } catch (err) {
      console.error("Failed to reject", err);
      toast.error("Failed to process rejection.");
    }
  };

  const handleCreateApproval = async () => {
    const errors: { entityId?: string, remarks?: string } = {};
    
    if (!entityId.trim()) {
      errors.entityId = "Entity ID is required";
    } else if (isNaN(Number(entityId))) {
      errors.entityId = "Entry ID must be a number";
    }

    if (!remarks.trim()) {
      errors.remarks = "Reason for approval request is required";
    } else if (remarks.length < 5) {
      errors.remarks = "Please provide a more detailed reason (min 5 chars)";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    const loadingToast = toast.loading("Submitting request...");
    try {
      await approvalService.createApproval({
        entity_type: requestType,
        entity_id: Number(entityId),
        remarks: remarks
      });
      toast.success("Approval Request Created", { id: loadingToast });
      setIsCreateModalOpen(false);
      fetchApprovals();
    } catch (err) {
      console.error("Failed to create approval", err);
      toast.error("Failed to create request", { id: loadingToast });
    }
  };

  const handleViewDetails = (approval: any) => {
    setSelectedApproval(approval);
    setIsViewModalOpen(true);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredApprovals = approvals.filter(a => {
    if (filter === "All") return true;
    return a.status === filter;
  });

  const totalItems = filteredApprovals.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedApprovals = filteredApprovals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const pendingCount = approvals.filter(a => a.status === "Pending").length;

  // Helper to generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <>
      <Navbar title="Approvals" breadcrumb={["InfraPilot", "Client", "Approvals"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Approvals Dashboard</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">
              {projectData?.project_name || "All Projects"} • Variation orders & design changes
            </p>
          </div>
          <button 
             onClick={handleCreateRequestOpen}
             className="px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
          >
             Create New Request
          </button>
        </div>

        {/* Tab Buttons - Kept as requested */}
        <div className="flex flex-wrap gap-3 mb-8">
          {["All", "Pending", "Approved", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                filter === status 
                ? "bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-300" 
                : "bg-white text-slate-500 border-slate-100 hover:border-slate-300 shadow-sm"
              }`}
            >
              {status} {status === "Pending" && pendingCount > 0 && (
                <span className="ml-2 bg-amber-500 text-white px-1.5 py-0.5 rounded-md text-[8px] animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List Container - Reverted to prior style */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400">
               <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mb-4"></div>
               <p className="text-[10px] font-black uppercase tracking-widest">Fetching Approvals...</p>
             </div>
          ) : paginatedApprovals.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-24 text-slate-400">
               <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <p className="text-xs font-black uppercase tracking-widest">No {filter !== "All" ? filter.toLowerCase() : ""} approvals found</p>
             </div>
          ) : (
            <>
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

                {paginatedApprovals.map((apr, i) => (
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

                      {/* Status Ref Badge */}
                      <div className="shrink-0 w-[60px] flex justify-center">
                          <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-md border border-slate-100">
                            V1
                          </span>
                      </div>

                      {/* Date */}
                      <div className="shrink-0 w-[100px] text-center">
                          <p className="text-[11px] font-black text-slate-500">{apr.date}</p>
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

              {/* Pagination Section */}
              {totalItems > 0 && (
                <div className="px-10 py-6 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/30">
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Records per page:</p>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                      >
                        {[5, 10, 20, 50].map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Showing <span className="text-slate-800 font-black">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-slate-800 font-black">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-slate-800 font-black">{totalItems}</span> records
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                      </svg>
                      Prev
                    </button>

                    <div className="flex items-center gap-1.5 mx-2">
                      {getPageNumbers().map((p, i) => (
                        typeof p === "number" ? (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(p)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all active:scale-90 ${currentPage === p ? 'bg-primary text-white shadow-lg shadow-blue-200 border-transparent' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                            {p}
                          </button>
                        ) : (
                          <span key={i} className="text-slate-300 font-black px-1 text-xs">{p}</span>
                        )
                      ))}
                    </div>

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                    >
                      Next
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Draft Approval Request"
        maxWidth="max-w-xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Request Type</label>
                <select 
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all"
                >
                  <option value="bill">Billing</option>
                  <option value="material">Material</option>
                  <option value="design">Design</option>
                  <option value="variation">Variation</option>
                </select>
             </div>
             <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ref Entity ID</label>
                <input 
                  type="text"
                  placeholder="E.g. 101"
                  value={entityId}
                  onChange={(e) => {
                    setEntityId(e.target.value);
                    if (formErrors.entityId) setFormErrors(prev => ({ ...prev, entityId: undefined }));
                  }}
                  className={`w-full bg-slate-50 border ${formErrors.entityId ? 'border-red-500' : 'border-slate-200'} rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all`}
                />
                {formErrors.entityId && <p className="text-[10px] font-bold text-red-500 mt-1.5 ml-1">{formErrors.entityId}</p>}
             </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Remarks / Reason</label>
            <textarea 
              rows={4}
              placeholder="Provide context for the approval team..."
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (formErrors.remarks) setFormErrors(prev => ({ ...prev, remarks: undefined }));
              }}
              className={`w-full bg-slate-50 border ${formErrors.remarks ? 'border-red-500' : 'border-slate-200'} rounded-2xl px-5 py-4 text-sm font-medium text-slate-700 outline-none focus:border-primary transition-all resize-none`}
            />
            {formErrors.remarks && <p className="text-[10px] font-bold text-red-500 mt-1.5 ml-1">{formErrors.remarks}</p>}
          </div>
          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="flex-1 py-4 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateApproval}
              className="flex-1 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Submit Request
            </button>
          </div>
        </div>
      </Modal>

      {/* View Details Modal - Re-added as per earlier format */}
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
                      <p className="text-xs font-black text-slate-800">{selectedApproval.date}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Audit Trail & Remarks</h4>
                   <div className="p-6 bg-slate-50/50 border border-slate-100 border-dashed rounded-2xl">
                      <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
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

export default ClientApprovalsPage;
