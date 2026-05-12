import React, { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";
import {
    Package,
    CheckCircle2,
    Clock,
    TrendingUp,
    Search,
    Plus,
    Eye,
    Loader2,
    Check,
    X,
    RotateCcw,
    FileText,
    User,
    ArrowRight,
    Box
} from "lucide-react";
import { siteRequestService } from "../../../services/siteRequestService";
import type { CreateSiteRequest } from "../../../services/siteRequestService";

// ─── Types ───────────────────────────────────────────────────────────────────
interface MaterialRequestRecord {
    id: string | number;
    request_type: string;
    description: string;
    quantity: number | string;
    requested_by: string | number;
    approved_by: string | number | null;
    status: "Pending" | "Approved" | "Rejected" | string;
}

const MaterialRequestPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [requestData, setRequestData] = useState<MaterialRequestRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [projectId, setProjectId] = useState<number>(36);

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Approved" | "Pending">("All");

    const [formData, setFormData] = useState({
        id: "" as string | number,
        request_type: "Material",
        description: "",
        quantity: "" as string | number,
        requestedBy: "Eng. Site User" as string | number,
        approvedBy: "Pending" as string | number,
        status: "Pending" as "Pending" | "Approved" | "Rejected" | string,
    });

    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id || user?.id;
                if (pId) setProjectId(Number(pId));
            } catch (e) {
                console.error("Failed to resolve project ID", e);
            }
        }
    }, []);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            const serverData = await siteRequestService.getRequests(projectId);
            setRequestData(prev => {
                const mocks = prev.filter(r => String(r.id).startsWith("MOCK-"));
                const serverIds = new Set(serverData.map((r: any) => r.id));
                const filteredMocks = mocks.filter(m => !serverIds.has(m.id));
                return [...filteredMocks, ...serverData];
            });
        } catch (error) {
            toast.error("Failed to sync requisition logs");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.request_type) newErrors.request_type = "Required";
        if (!formData.quantity) newErrors.quantity = "Required";
        if (!formData.description.trim()) newErrors.description = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        const toastId = toast.loading("Submitting requisition...");
        try {
            const payload: CreateSiteRequest = {
                project_id: projectId,
                request_type: formData.request_type,
                description: formData.description,
                quantity: Number(formData.quantity)
            };

            let newRecord: MaterialRequestRecord | null = null;
            try {
                newRecord = await siteRequestService.createRequest(payload);
                toast.success("Requisition Submitted Successfully!", { id: toastId });
            } catch (error: any) {
                if (error.response?.status === 403) {
                    newRecord = {
                        id: `MOCK-${Date.now()}`,
                        ...payload,
                        requested_by: 1,
                        approved_by: null,
                        status: "Pending"
                    };
                    toast.success("Requisition Logged (Demo Mode)", { id: toastId });
                } else {
                    throw error;
                }
            }

            if (newRecord) {
                setRequestData(prev => [newRecord as MaterialRequestRecord, ...prev]);
            }
            setIsFormModalOpen(false);
        } catch (error) {
            toast.error("Failed to process requisition", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async (id: string | number) => {
        const toastId = toast.loading("Approving requisition...");
        try {
            await siteRequestService.approveRequest(id);
            toast.success("Requisition Approved!", { id: toastId });
            fetchRequests();
        } catch (error) {
            toast.error("Failed to approve requisition", { id: toastId });
        }
    };

    const handleReject = async (id: string | number) => {
        const toastId = toast.loading("Rejecting requisition...");
        try {
            await siteRequestService.rejectRequest(id);
            toast.success("Requisition Rejected", { id: toastId });
            fetchRequests();
        } catch (error) {
            toast.error("Failed to reject requisition", { id: toastId });
        }
    };

    const [selectedRequest, setSelectedRequest] = useState<MaterialRequestRecord | null>(null);

    const filteredRequests = useMemo(() => {
        let data = requestData;

        // Apply StatCard Filter
        if (activeStatFilter === "Approved") {
          data = data.filter(r => r.status === "Approved");
        } else if (activeStatFilter === "Pending") {
          data = data.filter(r => r.status === "Pending");
        }

        return data.filter(r =>
            r.request_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(r.id).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [requestData, searchTerm, activeStatFilter]);

    const stats = {
        total: requestData.length,
        approved: requestData.filter(r => r.status === "Approved").length,
        pending: requestData.filter(r => r.status === "Pending").length,
        fulfillment: Math.round((requestData.filter(r => r.status === "Approved").length / (requestData.length || 1)) * 100)
    };

    const labelClasses = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
    const inputClasses = (error?: string) => `
        w-full px-4 py-2.5 bg-slate-50 border 
        ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
        rounded-xl text-sm font-bold outline-none transition-all placeholder:text-slate-400 font-inter
    `;

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50';
            case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50';
            default: return 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50';
        }
    };

    return (
        <>
            <Navbar title="Material Requests" breadcrumb={["Engineer", "Approvals", "Material Requisition"]} />

            <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
                    <div className="font-inter">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none font-inter">Procurement Requisition Ledger</h1>
                        <p className="text-slate-500 text-sm italic-none font-inter">Formal procurement requests for structural and consumable site resources.</p>
                    </div>
                    <button
                        onClick={() => {
                            setFormData({
                                id: "",
                                request_type: "Material",
                                description: "",
                                quantity: "",
                                requestedBy: "Eng. Site User",
                                approvedBy: "Pending",
                                status: "Pending"
                            });
                            setErrors({});
                            setIsFormModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                    >
                        <Plus className="w-4 h-4" />
                        Log Requisition
                    </button>
                </div>

                {/* ── Interactive Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-slate-800 bg-slate-100 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Total Logs"
                          value={stats.total.toString()}
                          sub="All Requests"
                          accent="text-slate-800"
                          icon={<Package className={`w-5 h-5 ${activeStatFilter === "All" ? "text-slate-800 scale-110" : "text-slate-400 group-hover:text-slate-800"} transition-all`} />}
                      />
                    </div>
                    <div onClick={() => setActiveStatFilter("Approved")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Approved" ? "ring-2 ring-emerald-500 bg-emerald-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Approved"
                          value={stats.approved.toString()}
                          sub="Released for Site"
                          accent="text-emerald-500"
                          icon={<CheckCircle2 className={`w-5 h-5 ${activeStatFilter === "Approved" ? "text-emerald-500 scale-110" : "text-slate-400 group-hover:text-emerald-500"} transition-all`} />}
                      />
                    </div>
                    <div onClick={() => setActiveStatFilter("Pending")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Pending" ? "ring-2 ring-amber-500 bg-amber-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Pending Review"
                          value={stats.pending.toString()}
                          sub="PM Validation"
                          accent="text-amber-500"
                          icon={<Clock className={`w-5 h-5 ${activeStatFilter === "Pending" ? "text-amber-500 scale-110" : "text-slate-400 group-hover:text-amber-500"} transition-all`} />}
                      />
                    </div>
                    <div className="cursor-default group transition-all rounded-xl hover:scale-[1.01]">
                      <StatCard
                          title="Fulfillment"
                          value={`${stats.fulfillment}%`}
                          sub="Procurement Yield"
                          accent="text-blue-500"
                          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
                      />
                    </div>
                </div>

                {/* ── Registry Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by material type or requisition ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>
                        {activeStatFilter !== "All" && (
                          <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        <table className="w-full text-left font-inter min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4 font-inter">Resource Requisition</th>
                                    <th className="px-6 py-4 font-inter">Operational Status</th>
                                    <th className="px-6 py-4 font-inter">Volume / Quantity</th>
                                    <th className="px-6 py-4 font-inter">Originating Engineer</th>
                                    <th className="px-6 py-4 text-right font-inter">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center font-inter">
                                            <div className="flex flex-col items-center gap-3 font-inter">
                                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-inter">Syncing requisition intelligence...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredRequests.length > 0 ? (
                                    filteredRequests.map((request) => (
                                        <tr key={request.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4 font-inter">
                                                <div className="flex flex-col font-inter">
                                                    <span className="text-sm font-bold text-slate-800 font-inter italic-none">{request.request_type}</span>
                                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest font-inter">REQ-#{request.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-inter">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border font-inter ${getStatusStyle(request.status)}`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-inter">
                                                <div className="flex items-center gap-2 font-inter">
                                                  <Box className="w-3.5 h-3.5 text-blue-500" />
                                                  <span className="text-sm font-black text-blue-600 font-inter italic-none">{request.quantity} Units</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-inter">
                                                <div className="flex items-center gap-2 font-inter">
                                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest font-inter italic-none">User #{request.requested_by || "SYST"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                                <div className="flex items-center justify-end gap-2 font-inter">
                                                    <button
                                                        onClick={() => setSelectedRequest(request)}
                                                        className={`p-2 text-white rounded-xl shadow-lg transition-all active:scale-95 font-inter ${request.status === 'Approved' ? 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700' :
                                                                request.status === 'Pending' ? 'bg-amber-600 shadow-amber-600/20 hover:bg-amber-700' :
                                                                    'bg-rose-600 shadow-rose-600/20 hover:bg-rose-700'
                                                            }`}
                                                        title="Analyze Requisition"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    
                                                    {request.status === "Pending" && (
                                                        <div className="flex items-center gap-1 border-l border-slate-100 pl-2 font-inter">
                                                            <button
                                                                onClick={() => handleApprove(request.id)}
                                                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all font-inter"
                                                                title="Authorize"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(request.id)}
                                                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-inter"
                                                                title="Invalidate"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter italic-none">
                                            No procurement requisitions discovered in the project vault.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>

            {/* ── Detail Modal ────────────────────────────────── */}
            <Modal
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                title="Requisition Intelligence Analysis"
                maxWidth="max-w-xl"
            >
                {selectedRequest && (
                    <div className="p-6 font-inter italic-none">
                        <div className={`rounded-[2.5rem] p-10 mb-8 text-white shadow-2xl relative overflow-hidden font-inter ${selectedRequest.status === 'Approved' ? 'bg-emerald-600' : selectedRequest.status === 'Pending' ? 'bg-amber-600' : 'bg-rose-600'}`}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="relative z-10 font-inter">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-3 font-inter">Procurement Artifact Record</p>
                                <h3 className="text-2xl font-black tracking-tight leading-tight mb-8 font-inter italic-none">{selectedRequest.request_type}</h3>
                                <div className="grid grid-cols-2 gap-6 font-inter">
                                    <div className="bg-white/15 backdrop-blur-xl rounded-[1.5rem] p-5 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5 font-inter">Operational Status</p>
                                        <p className="text-xl font-black font-inter italic-none tracking-widest">{selectedRequest.status.toUpperCase()}</p>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-xl rounded-[1.5rem] p-5 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5 font-inter">Quantum Required</p>
                                        <p className="text-xl font-black font-inter italic-none">{selectedRequest.quantity} UNITS</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            <div className="font-inter">
                                <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-3')}>Requirement Narrative</p>
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-[13px] font-black text-slate-600 leading-relaxed font-inter italic-none uppercase tracking-tight shadow-inner">
                                    "{selectedRequest.description}"
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8 font-inter">
                                <div className="font-inter">
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1.5')}>Originating Engineer</p>
                                    <p className="text-sm font-black text-slate-800 font-inter italic-none uppercase tracking-widest">User #{selectedRequest.requested_by || "SYST"}</p>
                                </div>
                                <div className="font-inter">
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1.5')}>Approving Authority</p>
                                    <p className="text-sm font-black text-blue-600 font-inter italic-none uppercase tracking-widest">{selectedRequest.approved_by ? `User ${selectedRequest.approved_by}` : "Pending Review"}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedRequest(null)}
                            className={`w-full py-5 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all shadow-2xl active:scale-95 font-inter italic-none mb-2 ${selectedRequest.status === 'Approved' ? 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-700' :
                                    selectedRequest.status === 'Pending' ? 'bg-amber-600 shadow-amber-600/30 hover:bg-amber-700' :
                                        'bg-rose-600 shadow-rose-600/30 hover:bg-rose-700'
                                }`}
                        >
                            Dismiss Artifact Analysis
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Form Modal ────────────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title="Initiate Resource Requisition"
                maxWidth="max-w-4xl"
                footer={
                  <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                      <button onClick={() => setIsFormModalOpen(false)} className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter">Cancel</button>
                      <button 
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="flex-[2] py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
                      >
                          {isSubmitting ? "Syncing..." : "Commit Requisition"}
                      </button>
                  </div>
                }
            >
                <form id="request-form" onSubmit={handleSubmit} className="p-6 space-y-8 font-inter">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                          <Box className="w-4 h-4 text-primary" />
                          Requisition Core Identity
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                            <div className="font-inter">
                                <label className={labelClasses}>Resource Classification <span className="text-rose-500">*</span></label>
                                <select
                                    name="request_type"
                                    value={formData.request_type}
                                    onChange={handleInputChange}
                                    className={inputClasses(errors.request_type)}
                                >
                                    <option value="Material">Raw Material</option>
                                    <option value="Labour">Labour Resource</option>
                                    <option value="Equipment">Heavy Machinery</option>
                                </select>
                                {errors.request_type && <p className="mt-1.5 text-[9px] text-rose-500 font-black uppercase tracking-widest ml-1 font-inter">{errors.request_type}</p>}
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Required Quantum (Units) <span className="text-rose-500">*</span></label>
                                <input
                                    name="quantity"
                                    type="number"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 500"
                                    className={inputClasses(errors.quantity)}
                                />
                                {errors.quantity && <p className="mt-1.5 text-[9px] text-rose-500 font-black uppercase tracking-widest ml-1 font-inter">{errors.quantity}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                          <FileText className="w-4 h-4 text-primary" />
                          Technical Specifications Narrative
                        </h3>
                        <div className="font-inter">
                            <label className={labelClasses}>Descriptive Narrative <span className="text-rose-500">*</span></label>
                            <textarea
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Detail exact technical specifications or site requirement justification..."
                                className={`${inputClasses(errors.description)} resize-none font-bold shadow-inner`}
                            />
                            {errors.description && <p className="mt-1.5 text-[9px] text-rose-500 font-black uppercase tracking-widest ml-1 font-inter">{errors.description}</p>}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          Supply Chain Authorization
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-inter">
                            <div className="font-inter">
                                <label className={labelClasses}>Requesting Engineer</label>
                                <input name="requestedBy" value={formData.requestedBy} readOnly className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-400 uppercase tracking-widest font-inter" />
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Authority Designation <span className="text-rose-500">*</span></label>
                                <input name="approvedBy" value={formData.approvedBy} onChange={handleInputChange} placeholder="Approver Name" className={inputClasses(errors.approvedBy)} />
                                {errors.approvedBy && <p className="mt-1.5 text-[9px] text-rose-500 font-black uppercase tracking-widest ml-1 font-inter">{errors.approvedBy}</p>}
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Commitment Status <span className="text-rose-500">*</span></label>
                                <select name="status" value={formData.status} onChange={handleInputChange} className={inputClasses(errors.status)}>
                                    <option value="Pending">Pending Validation</option>
                                    <option value="Approved">Release Authorized</option>
                                    <option value="Rejected">Rejected / Invalidate</option>
                                </select>
                                {errors.status && <p className="mt-1.5 text-[9px] text-rose-500 font-black uppercase tracking-widest ml-1 font-inter">{errors.status}</p>}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default MaterialRequestPage;
